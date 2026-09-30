import type {
  SimulationPlaybackScope,
  SimulationProgramNode,
  SimulationRobotId,
} from '../types';
import {
  getUrdfJointDisplayRange,
  type SimulationUrdfModel,
} from './urdf';

const robotJointNames: Record<SimulationRobotId, string[]> = {
  robot1: Array.from({ length: 6 }, (_, index) => `left_manipulator_joint_${index + 1}`),
  robot2: Array.from({ length: 6 }, (_, index) => `right_manipulator_joint_${index + 1}`),
};

const robotRailNames: Record<SimulationRobotId, string> = {
  robot1: 'uuid_left_joint',
  robot2: 'uuid_right_joint',
};

const robotLabels: Record<SimulationRobotId, string> = {
  robot1: 'Robot1',
  robot2: 'Robot2',
};

type MotionProfile = {
  amplitudes: number[];
  phases: number[];
  cycles: number;
  railAmplitude: number;
};

const motionProfiles: Record<'scan' | 'weld', MotionProfile> = {
  scan: {
    amplitudes: [6, 10, 8, 11, 9, 8],
    phases: [0, 0.55, 1.15, 0.2, 0.85, 1.45],
    cycles: 1.35,
    railAmplitude: 180,
  },
  weld: {
    amplitudes: [9, 15, 12, 16, 13, 11],
    phases: [0.2, 0.7, 1.05, 0.35, 0.95, 1.55],
    cycles: 0.9,
    railAmplitude: 260,
  },
};

type ActiveMotion = {
  robotId: SimulationRobotId;
  node: SimulationProgramNode;
  progress: number;
};

function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
}

function getRobotId(robotName?: string): SimulationRobotId | null {
  if (robotName === robotLabels.robot1) return 'robot1';
  if (robotName === robotLabels.robot2) return 'robot2';
  return null;
}

function getSubprograms(node: SimulationProgramNode) {
  return (node.children ?? []).filter((child) => child.type === 'subprogram');
}

function getSequenceMotion(
  nodes: SimulationProgramNode[],
  progress: number,
  robotId: SimulationRobotId,
): ActiveMotion | null {
  if (nodes.length === 0) return null;
  const scaledProgress = clampProgress(progress) * nodes.length;
  const nodeIndex = Math.min(nodes.length - 1, Math.floor(scaledProgress));
  const localProgress = scaledProgress >= nodes.length
    ? 1
    : scaledProgress - nodeIndex;
  return { robotId, node: nodes[nodeIndex], progress: localProgress };
}

function getRobotMotion(
  node: SimulationProgramNode | null,
  robotId: SimulationRobotId,
  progress: number,
): ActiveMotion | null {
  if (!node) return null;
  if (node.type === 'subprogram') {
    return getRobotId(node.robotName) === robotId
      ? { robotId, node, progress: clampProgress(progress) }
      : null;
  }
  if (node.type === 'robot') {
    return getRobotId(node.robotName) === robotId
      ? getSequenceMotion(getSubprograms(node), progress, robotId)
      : null;
  }
  const robotNode = (node.children ?? []).find(
    (child) => child.type === 'robot' && getRobotId(child.robotName) === robotId,
  );
  return robotNode ? getSequenceMotion(getSubprograms(robotNode), progress, robotId) : null;
}

function clampJointDisplayValue(model: SimulationUrdfModel, jointName: string, value: number) {
  const joint = model.joints[jointName];
  if (!joint || !Number.isFinite(value)) return value;
  const range = getUrdfJointDisplayRange(joint);
  return Math.min(range.max, Math.max(range.min, value));
}

function formatJointDisplayValue(value: number) {
  return (Math.abs(value) < 0.05 ? 0 : value).toFixed(1);
}

function getMotionValue(baseValue: string | undefined, amplitude: number, phase: number, cycles: number, progress: number) {
  const baseline = Number(baseValue);
  const safeBaseline = Number.isFinite(baseline) ? baseline : 0;
  const envelope = Math.sin(Math.PI * clampProgress(progress));
  const wave = Math.sin(Math.PI * (cycles * clampProgress(progress) + phase));
  return safeBaseline + envelope * amplitude * wave;
}

function applyMotion(
  output: Record<string, string>,
  model: SimulationUrdfModel,
  motion: ActiveMotion,
) {
  if (!motion.node.kind) return;
  const profile = motionProfiles[motion.node.kind];
  robotJointNames[motion.robotId].forEach((jointName, index) => {
    const value = getMotionValue(
      output[jointName],
      profile.amplitudes[index],
      profile.phases[index],
      profile.cycles,
      motion.progress,
    );
    output[jointName] = formatJointDisplayValue(clampJointDisplayValue(model, jointName, value));
  });

  const railName = robotRailNames[motion.robotId];
  const railBaseline = Number(output[railName]);
  const safeRailBaseline = Number.isFinite(railBaseline) ? railBaseline : 0;
  const railDirection = motion.robotId === 'robot1' ? 1 : -1;
  const railValue = safeRailBaseline
    + railDirection * profile.railAmplitude * Math.sin(Math.PI * clampProgress(motion.progress));
  output[railName] = formatJointDisplayValue(clampJointDisplayValue(model, railName, railValue));
}

/**
 * Produces a deterministic, display-only URDF pose for playback. The supplied
 * values remain the manual baseline; this function never mutates them.
 */
export function getMockPlaybackUrdfJointValues({
  model,
  baseJointValues,
  selectedNode,
  playbackScope,
  progress,
}: {
  model: SimulationUrdfModel | null;
  baseJointValues: Record<string, string>;
  selectedNode: SimulationProgramNode | null;
  playbackScope: SimulationPlaybackScope | null;
  progress: number;
}) {
  const output = { ...baseJointValues };
  if (!model || !selectedNode || !playbackScope || playbackScope.instructionCount === 0) return output;

  const normalizedProgress = clampProgress(progress / 100);
  (['robot1', 'robot2'] as const).forEach((robotId) => {
    const motion = getRobotMotion(selectedNode, robotId, normalizedProgress);
    if (motion) applyMotion(output, model, motion);
  });
  return output;
}
