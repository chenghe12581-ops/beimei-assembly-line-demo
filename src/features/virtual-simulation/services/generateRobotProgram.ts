import type {
  SimulationInstruction,
  SimulationPlaybackScope,
  SimulationCartesianTargetPose,
  SimulationJointTargetPose,
  SimulationPosePoint,
  SimulationProgramNode,
  SimulationRobotId,
  SimulationRobotProgram,
  SimulationSourceTask,
  SimulationWeldSegment,
  SimulationWeldTask,
} from '../types';

const emptyPose: SimulationPosePoint = {
  x: '0.0',
  y: '0.0',
  z: '0.0',
  rx: '0.0',
  ry: '0.0',
  rz: '0.0',
};

function normalizeCartesianPose(point?: SimulationPosePoint): SimulationCartesianTargetPose {
  return {
    X: point?.x || emptyPose.x,
    Y: point?.y || emptyPose.y,
    Z: point?.z || emptyPose.z,
    RX: point?.rx || emptyPose.rx,
    RY: point?.ry || emptyPose.ry,
    RZ: point?.rz || emptyPose.rz,
    E1: '0',
  };
}

const DEMO_EXTERNAL_AXIS_LIMIT = 1200;
const DEMO_DEPARTURE_Z_OFFSET = 50;

function formatProgramNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function createExternalAxisState(robotIndex: number, pathProgress: number) {
  const direction = robotIndex === 0 ? -1 : 1;
  const value = direction * (1200 - Math.min(Math.max(pathProgress, 0), 1) * 200);
  return {
    value: formatProgramNumber(value),
    externalAxisLimit: `-${DEMO_EXTERNAL_AXIS_LIMIT.toFixed(1)} ~ ${DEMO_EXTERNAL_AXIS_LIMIT.toFixed(1)} mm`,
    externalAxisExceeded: Math.abs(value) > DEMO_EXTERNAL_AXIS_LIMIT,
  };
}

function createApproachPose(externalAxis: string): SimulationJointTargetPose {
  return {
    J1: '15',
    J2: '-60',
    J3: '10',
    J4: '180',
    J5: '30',
    J6: '0',
    E1: externalAxis,
  };
}

function createCartesianPose(point: SimulationPosePoint, externalAxis: string): SimulationCartesianTargetPose {
  return {
    ...normalizeCartesianPose(point),
    E1: externalAxis,
  };
}

function createDeparturePose(point: SimulationPosePoint, externalAxis: string): SimulationCartesianTargetPose {
  const pose = createCartesianPose(point, externalAxis);
  const z = Number(pose.Z);
  return {
    ...pose,
    Z: Number.isFinite(z) ? formatProgramNumber(z + DEMO_DEPARTURE_Z_OFFSET) : pose.Z,
  };
}

function interpolatePoseValue(startValue: string, endValue: string, progress: number) {
  const start = Number(startValue);
  const end = Number(endValue);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return progress < 0.5 ? startValue : endValue;
  }
  return formatProgramNumber(start + (end - start) * progress);
}

function createIntermediatePose(
  startPoint: SimulationPosePoint,
  endPoint: SimulationPosePoint,
  progress: number,
): SimulationPosePoint {
  return {
    x: interpolatePoseValue(startPoint.x, endPoint.x, progress),
    y: interpolatePoseValue(startPoint.y, endPoint.y, progress),
    z: interpolatePoseValue(startPoint.z, endPoint.z, progress),
    rx: interpolatePoseValue(startPoint.rx, endPoint.rx, progress),
    ry: interpolatePoseValue(startPoint.ry, endPoint.ry, progress),
    rz: interpolatePoseValue(startPoint.rz, endPoint.rz, progress),
  };
}

function createPathInstructions({
  segment,
  weldTaskIndex,
  robotIndex,
  kind,
  points,
}: {
  segment: SimulationWeldSegment;
  weldTaskIndex: number;
  robotIndex: number;
  kind: 'scan' | 'weld';
  points: SimulationPosePoint[];
}): SimulationInstruction[] {
  if (points.length === 0) return [];

  const programPrefix = kind === 'scan' ? 'SCAN' : 'WELD';
  const commandStart = `${programPrefix}_START` as const;
  const commandEnd = `${programPrefix}_END` as const;
  const instructionIdPrefix = `weld-task-${weldTaskIndex}-robot-${robotIndex + 1}-segment-${segment.index}-${kind}`;
  const approachAxis = createExternalAxisState(robotIndex, 0);
  const startPoint = points[0];
  const finalPoint = points[points.length - 1];
  const firstPathAxis = createExternalAxisState(robotIndex, 0.25);
  const secondPathAxis = createExternalAxisState(robotIndex, 0.5);
  const finalAxis = createExternalAxisState(robotIndex, 1);

  return [
    {
      id: `${instructionIdPrefix}-approach`,
      name: 'P_APPROACH_1',
      sequence: 1,
      moveType: 'PTP',
      speed: '100',
      targetPose: createApproachPose(approachAxis.value),
      externalAxisLimit: approachAxis.externalAxisLimit,
      externalAxisExceeded: approachAxis.externalAxisExceeded,
    },
    {
      id: `${instructionIdPrefix}-start`,
      name: `P_${programPrefix}_START`,
      sequence: 2,
      moveType: 'LIN',
      speed: '10',
      processCommand: commandStart,
      targetPose: createCartesianPose(startPoint, approachAxis.value),
      externalAxisLimit: approachAxis.externalAxisLimit,
      externalAxisExceeded: approachAxis.externalAxisExceeded,
    },
    {
      id: `${instructionIdPrefix}-path-1`,
      name: 'P_1',
      sequence: 3,
      moveType: 'LIN',
      speed: '15',
      targetPose: createCartesianPose(createIntermediatePose(startPoint, finalPoint, 0.25), firstPathAxis.value),
      externalAxisLimit: firstPathAxis.externalAxisLimit,
      externalAxisExceeded: firstPathAxis.externalAxisExceeded,
    },
    {
      id: `${instructionIdPrefix}-path-2`,
      name: 'P_2',
      sequence: 4,
      moveType: 'LIN',
      speed: '15',
      targetPose: createCartesianPose(createIntermediatePose(startPoint, finalPoint, 0.5), secondPathAxis.value),
      externalAxisLimit: secondPathAxis.externalAxisLimit,
      externalAxisExceeded: secondPathAxis.externalAxisExceeded,
    },
    {
      id: `${instructionIdPrefix}-end`,
      name: `P_${programPrefix}_END`,
      sequence: 5,
      moveType: 'LIN',
      speed: '10',
      processCommand: commandEnd,
      targetPose: createCartesianPose(finalPoint, finalAxis.value),
      externalAxisLimit: finalAxis.externalAxisLimit,
      externalAxisExceeded: finalAxis.externalAxisExceeded,
    },
    {
      id: `${instructionIdPrefix}-depart`,
      name: 'P_DEPART_1',
      sequence: 6,
      moveType: 'LIN',
      speed: '100',
      targetPose: createDeparturePose(finalPoint, finalAxis.value),
      externalAxisLimit: finalAxis.externalAxisLimit,
      externalAxisExceeded: finalAxis.externalAxisExceeded,
    },
  ];
}

function createScanInstructions(segment: SimulationWeldSegment, weldTaskIndex: number, robotIndex: number): SimulationInstruction[] {
  return createPathInstructions({
    segment,
    weldTaskIndex,
    robotIndex,
    kind: 'scan',
    points: segment.scanPosePoints,
  });
}

function createWeldInstructions(segment: SimulationWeldSegment, weldTaskIndex: number, robotIndex: number): SimulationInstruction[] {
  return createPathInstructions({
    segment,
    weldTaskIndex,
    robotIndex,
    kind: 'weld',
    points: segment.weldPosePoints,
  });
}

export function getDefaultRobotAssignments(weldTask: SimulationWeldTask): Record<string, SimulationRobotId> {
  return Object.fromEntries(weldTask.weldSegments.map((segment) => [segment.id, segment.defaultRobot]));
}

function normalizeRobotAssignments(
  weldTask: SimulationWeldTask,
  assignments?: Record<string, SimulationRobotId>,
) {
  const defaults = getDefaultRobotAssignments(weldTask);
  return Object.fromEntries(weldTask.weldSegments.map((segment) => [
    segment.id,
    assignments?.[segment.id] ?? defaults[segment.id],
  ])) as Record<string, SimulationRobotId>;
}

function createRobotNode(
  weldTask: SimulationWeldTask,
  robotIndex: number,
  assignments: Record<string, SimulationRobotId>,
): SimulationProgramNode {
  const robotName = `Robot${robotIndex + 1}`;
  const robotId = `robot${robotIndex + 1}` as SimulationRobotId;
  const children: SimulationProgramNode[] = [];

  weldTask.weldSegments
    .filter((segment) => assignments[segment.id] === robotId)
    .forEach((segment) => {
      const scanInstructions = createScanInstructions(segment, weldTask.index, robotIndex);
      const weldInstructions = createWeldInstructions(segment, weldTask.index, robotIndex);

      if (scanInstructions.length > 0) {
        children.push({
          id: `weld-task-${weldTask.index}-robot-${robotIndex + 1}-segment-${segment.index}-scan-program`,
          name: `扫描程序${segment.index}`,
          type: 'subprogram',
          kind: 'scan',
          weldSegmentId: segment.id,
          robotName,
          weldFeatureName: segment.featureName,
          userFrame: '工件坐标系',
          toolFrame: '扫描工具',
          instructions: scanInstructions,
        });
      }

      if (weldInstructions.length > 0) {
        children.push({
          id: `weld-task-${weldTask.index}-robot-${robotIndex + 1}-segment-${segment.index}-weld-program`,
          name: `焊接程序${segment.index}`,
          type: 'subprogram',
          kind: 'weld',
          weldSegmentId: segment.id,
          robotName,
          weldFeatureName: segment.featureName,
          userFrame: '工件坐标系',
          toolFrame: '焊枪工具',
          instructions: weldInstructions,
        });
      }
    });

  return {
    id: `weld-task-${weldTask.index}-robot-${robotIndex + 1}-program`,
    name: `${robotName}程序`,
    type: 'robot',
    robotName,
    children,
  };
}

export function generateRobotProgram(
  task: SimulationSourceTask,
  weldTask: SimulationWeldTask,
  robotAssignments?: Record<string, SimulationRobotId>,
  previousVersion = 0,
): SimulationRobotProgram {
  const normalizedAssignments = normalizeRobotAssignments(weldTask, robotAssignments);
  const robots = [
    createRobotNode(weldTask, 0, normalizedAssignments),
    createRobotNode(weldTask, 1, normalizedAssignments),
  ].filter((robot) => robot.children?.length);
  const instructionCount = robots.reduce(
    (robotTotal, robot) => robotTotal + (robot.children ?? []).reduce(
      (programTotal, program) => programTotal + (program.instructions?.length ?? 0),
      0,
    ),
    0,
  );
  const limitExceededCount = robots.reduce(
    (robotTotal, robot) => robotTotal + (robot.children ?? []).reduce(
      (programTotal, program) => programTotal + (program.instructions ?? []).filter((instruction) => instruction.externalAxisExceeded).length,
      0,
    ),
    0,
  );

  return {
    id: `${task.id}-${weldTask.id}-robot-program`,
    taskId: task.id,
    weldTaskId: weldTask.id,
    weldTaskIndex: weldTask.index,
    name: `加工程序${weldTask.index}`,
    version: previousVersion + 1,
    generatedAt: new Date().toISOString(),
    supportAxisValues: weldTask.supportAxisValues.map((axis) => ({ ...axis })),
    clampAxisValues: weldTask.clampAxisValues.map((axis) => ({ ...axis })),
    instructionCount,
    limitExceededCount,
    robotAssignments: normalizedAssignments,
    root: {
      id: `${task.id}-${weldTask.id}-program-root`,
      name: `加工程序${weldTask.index}`,
      type: 'program',
      children: robots,
    },
  };
}

export function findProgramNode(root: SimulationProgramNode, nodeId: string | null): SimulationProgramNode | null {
  if (!nodeId) return null;
  if (root.id === nodeId) return root;
  for (const child of root.children ?? []) {
    const match = findProgramNode(child, nodeId);
    if (match) return match;
  }
  return null;
}

function countNodeInstructions(node: SimulationProgramNode): number {
  return (node.instructions?.length ?? 0) + (node.children ?? []).reduce(
    (total, child) => total + countNodeInstructions(child),
    0,
  );
}

function getRobotLanes(node: SimulationProgramNode) {
  if (node.type === 'program') {
    return (node.children ?? [])
      .filter((child) => child.type === 'robot')
      .map((robot) => ({
        robotName: robot.robotName ?? robot.name.replace('程序', ''),
        programNames: (robot.children ?? []).map((child) => child.name),
      }));
  }
  if (node.type === 'robot') {
    return [{
      robotName: node.robotName ?? node.name.replace('程序', ''),
      programNames: (node.children ?? []).map((child) => child.name),
    }];
  }
  return [{
    robotName: node.robotName ?? '机器人',
    programNames: [node.name],
  }];
}

export function getSimulationPlaybackScope(
  program: SimulationRobotProgram | null,
  selectedNode: SimulationProgramNode | null,
): SimulationPlaybackScope | null {
  if (!program) return null;
  const node = selectedNode ?? program.root;
  const instructionCount = countNodeInstructions(node);
  const lanes = getRobotLanes(node);

  if (node.type === 'program') {
    return {
      nodeId: node.id,
      kind: 'dual-robot',
      title: '双机协同仿真',
      label: node.name,
      actionLabel: '播放双机仿真',
      modeLabel: 'Robot1 + Robot2 同步启动、并行执行',
      description: '播放范围包含 Robot1 与 Robot2 的完整程序，两台机器人按同一时间基准同时执行。',
      instructionCount,
      lanes,
    };
  }

  if (node.type === 'robot') {
    const robotName = node.robotName ?? node.name.replace('程序', '');
    return {
      nodeId: node.id,
      kind: 'single-robot',
      title: `${robotName} 单机仿真`,
      label: node.name,
      actionLabel: `播放 ${robotName}`,
      modeLabel: `仅执行 ${robotName} 完整程序`,
      description: `播放范围只包含 ${robotName} 下的全部扫描与焊接程序，不启动另一台机器人。`,
      instructionCount,
      lanes,
    };
  }

  return {
    nodeId: node.id,
    kind: 'subprogram',
    title: `${node.name} 单段仿真`,
    label: node.name,
    actionLabel: `播放${node.name}`,
    modeLabel: `仅执行 ${node.robotName ?? '当前机器人'} 的一段程序`,
    description: `播放范围只包含 ${node.name} 的点位与工艺指令，不执行同机器人下的其他程序。`,
    instructionCount,
    lanes,
  };
}
