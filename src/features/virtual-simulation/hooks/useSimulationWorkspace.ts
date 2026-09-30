import { useEffect, useMemo, useState } from 'react';
import {
  findProgramNode,
  generateRobotProgram,
  getDefaultRobotAssignments,
  getSimulationPlaybackScope,
} from '../services/generateRobotProgram';
import { createDefaultUrdfJointValues } from '../services/urdf';
import { getMockPlaybackUrdfJointValues } from '../services/mockPlaybackMotion';
import { useSimulationUrdfModel } from './useSimulationUrdfModel';
import type {
  SimulationAssemblyTransform,
  SimulationCoordinateFrame,
  SimulationDetailTab,
  SimulationPlaybackStatus,
  SimulationRobotId,
  SimulationRobotProgram,
  SimulationSelectedPoint,
  SimulationSceneId,
  SimulationSourceTask,
  SimulationWeldTask,
} from '../types';

const MOCK_PLAYBACK_PROGRESS_PER_SECOND = 6;

type SimulationTaskRobotAssignments = Record<string, Record<string, SimulationRobotId>>;

function createDefaultAssemblyTransform(): SimulationAssemblyTransform {
  return { x: '0.0', y: '0.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '0.0' };
}

function retainTaskState<T>(current: Record<string, T>, taskIds: Set<string>) {
  return Object.fromEntries(Object.entries(current).filter(([taskId]) => taskIds.has(taskId))) as Record<string, T>;
}

function getTaskDefaultAssignments(task: SimulationSourceTask): SimulationTaskRobotAssignments {
  return Object.fromEntries(task.weldTasks.map((weldTask) => [
    weldTask.id,
    getDefaultRobotAssignments(weldTask),
  ]));
}

function getExpandedProgramNodeIds(programs: SimulationRobotProgram[]) {
  return new Set(programs.flatMap((program) => [
    program.root.id,
    ...(program.root.children ?? []).map((node) => node.id),
  ]));
}

function normalizeProcessingProgramName(program: SimulationRobotProgram): SimulationRobotProgram {
  const processingProgramName = `加工程序${program.weldTaskIndex}`;
  if (program.name === processingProgramName && program.root.name === processingProgramName) return program;
  return {
    ...program,
    name: processingProgramName,
    root: { ...program.root, name: processingProgramName },
  };
}

export function useSimulationWorkspace(tasks: SimulationSourceTask[], entryTaskId?: string | null) {
  const { model: urdfModel, error: urdfError } = useSimulationUrdfModel();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(entryTaskId ?? tasks[0]?.id ?? null);
  const [activeScene, setActiveScene] = useState<SimulationSceneId>(tasks[0]?.side ?? 'front');
  const [selectedWeldNodeId, setSelectedWeldNodeId] = useState<string | null>(null);
  const [programsByTaskId, setProgramsByTaskId] = useState<Record<string, SimulationRobotProgram[]>>({});
  const [robotAssignmentsByTaskId, setRobotAssignmentsByTaskId] = useState<Record<string, SimulationTaskRobotAssignments>>({});
  const [selectedProgramNodeId, setSelectedProgramNodeId] = useState<string | null>(null);
  const [selectedInstructionId, setSelectedInstructionId] = useState<string | null>(null);
  const [programViewRequestKey, setProgramViewRequestKey] = useState(0);
  const [expandedProgramNodeIds, setExpandedProgramNodeIds] = useState<Set<string>>(new Set());
  const [detailTab, setDetailTab] = useState<SimulationDetailTab>('params');
  const [playbackStatus, setPlaybackStatus] = useState<SimulationPlaybackStatus>('ready');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<'0.5x' | '1.0x' | '2.0x'>('1.0x');
  const [assemblyTransformsByTaskId, setAssemblyTransformsByTaskId] = useState<Record<string, SimulationAssemblyTransform>>({});
  const [assemblyCoordinateFramesByTaskId, setAssemblyCoordinateFramesByTaskId] = useState<Record<string, SimulationCoordinateFrame>>({});
  const [urdfJointValuesByTaskId, setUrdfJointValuesByTaskId] = useState<Record<string, Record<string, string>>>({});

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null,
    [selectedTaskId, tasks],
  );
  const selectedPrograms = selectedTask
    ? (programsByTaskId[selectedTask.id] ?? []).map(normalizeProcessingProgramName)
    : [];
  const selectedProgram = selectedPrograms.find((program) => (
    Boolean(findProgramNode(program.root, selectedProgramNodeId))
  )) ?? selectedPrograms[0] ?? null;
  const selectedProgramNode = selectedProgram
    ? findProgramNode(selectedProgram.root, selectedProgramNodeId) ?? selectedProgram.root
    : null;
  const selectedPoint = useMemo<SimulationSelectedPoint | null>(() => {
    if (!selectedProgramNode || selectedProgramNode.type !== 'subprogram' || !selectedInstructionId) return null;
    const instruction = selectedProgramNode.instructions?.find((candidate) => candidate.id === selectedInstructionId);
    if (!instruction || !selectedProgramNode.kind) return null;
    const robotName = selectedProgramNode.robotName ?? 'Robot1';
    return {
      instruction,
      robotId: robotName === 'Robot2' ? 'robot2' : 'robot1',
      robotName,
      kind: selectedProgramNode.kind,
    };
  }, [selectedInstructionId, selectedProgramNode]);
  const selectedAssemblyTransform = selectedTask
    ? assemblyTransformsByTaskId[selectedTask.id] ?? createDefaultAssemblyTransform()
    : createDefaultAssemblyTransform();
  const selectedAssemblyCoordinateFrame = selectedTask
    ? assemblyCoordinateFramesByTaskId[selectedTask.id] ?? 'world'
    : 'world';
  const defaultUrdfJointValues = useMemo(
    () => urdfModel ? createDefaultUrdfJointValues(urdfModel) : {},
    [urdfModel],
  );
  const selectedUrdfJointValues = selectedTask
    ? urdfJointValuesByTaskId[selectedTask.id] ?? defaultUrdfJointValues
    : defaultUrdfJointValues;
  const selectedRobotAssignments = useMemo(() => {
    if (!selectedTask) return {};
    const storedAssignments = robotAssignmentsByTaskId[selectedTask.id];
    if (storedAssignments) return storedAssignments;
    const programAssignments = Object.fromEntries(selectedPrograms.map((program) => [
      program.weldTaskId,
      program.robotAssignments,
    ]));
    return {
      ...getTaskDefaultAssignments(selectedTask),
      ...programAssignments,
    };
  }, [robotAssignmentsByTaskId, selectedPrograms, selectedTask]);
  const associatedWeldSegmentIds = useMemo(() => {
    if (!selectedProgramNode) return [];
    const segmentIds = new Set<string>();
    const collectSegmentIds = (node: typeof selectedProgramNode) => {
      if (node.weldSegmentId) segmentIds.add(node.weldSegmentId);
      node.children?.forEach(collectSegmentIds);
    };
    collectSegmentIds(selectedProgramNode);
    return Array.from(segmentIds);
  }, [selectedProgramNode]);
  const playbackScope = useMemo(
    () => getSimulationPlaybackScope(selectedProgram, selectedProgramNode),
    [selectedProgram, selectedProgramNode],
  );
  const playbackUrdfJointValues = useMemo(
    () => getMockPlaybackUrdfJointValues({
      model: urdfModel,
      baseJointValues: selectedUrdfJointValues,
      selectedNode: selectedProgramNode,
      playbackScope,
      progress,
    }),
    [playbackScope, progress, selectedProgramNode, selectedUrdfJointValues, urdfModel],
  );

  useEffect(() => {
    if (entryTaskId && tasks.some((task) => task.id === entryTaskId)) {
      setSelectedTaskId(entryTaskId);
    }
  }, [entryTaskId]);

  useEffect(() => {
    if (!selectedTaskId || !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null);
    }
  }, [selectedTaskId, tasks]);

  useEffect(() => {
    const taskIds = new Set(tasks.map((task) => task.id));
    setProgramsByTaskId((current) => retainTaskState(current, taskIds));
    setRobotAssignmentsByTaskId((current) => retainTaskState(current, taskIds));
    setAssemblyTransformsByTaskId((current) => retainTaskState(current, taskIds));
    setAssemblyCoordinateFramesByTaskId((current) => retainTaskState(current, taskIds));
    setUrdfJointValuesByTaskId((current) => retainTaskState(current, taskIds));
  }, [tasks]);

  useEffect(() => {
    if (!selectedTask) {
      setActiveScene('front');
      setSelectedProgramNodeId(null);
      setExpandedProgramNodeIds(new Set());
      return;
    }
    setActiveScene(selectedTask.side);
    setSelectedWeldNodeId(null);
    setSelectedInstructionId(null);
    setPlaybackStatus('ready');
    setProgress(0);
    const programs = programsByTaskId[selectedTask.id] ?? [];
    setSelectedProgramNodeId(programs[0]?.root.id ?? null);
    setDetailTab('params');
    setExpandedProgramNodeIds(getExpandedProgramNodeIds(programs));
  }, [selectedTask?.id]);

  useEffect(() => {
    if (!selectedTask || !urdfModel || urdfJointValuesByTaskId[selectedTask.id]) return;
    setUrdfJointValuesByTaskId((current) => ({
      ...current,
      [selectedTask.id]: createDefaultUrdfJointValues(urdfModel),
    }));
  }, [selectedTask, urdfJointValuesByTaskId, urdfModel]);

  useEffect(() => {
    if (playbackStatus !== 'playing') return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const increment = speed === '2.0x' ? 1.2 : speed === '0.5x' ? 0.3 : 0.6;
        const next = Math.min(100, current + increment);
        if (next >= 100) setPlaybackStatus('completed');
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [playbackStatus, speed]);

  const selectTask = (taskId: string) => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    setSelectedTaskId(taskId);
    setActiveScene(task.side);
  };

  const generatePrograms = (robotAssignments?: SimulationTaskRobotAssignments) => {
    if (!selectedTask) return [];
    const currentPrograms = programsByTaskId[selectedTask.id] ?? [];
    const currentProgramsByWeldTaskId = new Map(currentPrograms.map((program) => [program.weldTaskId, program]));
    const nextAssignments = robotAssignments
      ?? robotAssignmentsByTaskId[selectedTask.id]
      ?? selectedRobotAssignments;
    const nextPrograms = selectedTask.weldTasks.map((weldTask) => {
      const currentProgram = currentProgramsByWeldTaskId.get(weldTask.id);
      const sourceWeldTask: SimulationWeldTask = currentProgram
        ? {
            ...weldTask,
            supportAxisValues: currentProgram.supportAxisValues,
            clampAxisValues: currentProgram.clampAxisValues,
          }
        : weldTask;
      return generateRobotProgram(
        selectedTask,
        sourceWeldTask,
        nextAssignments[weldTask.id],
        currentProgram?.version ?? 0,
      );
    });
    setRobotAssignmentsByTaskId((current) => ({ ...current, [selectedTask.id]: nextAssignments }));
    setProgramsByTaskId((current) => ({ ...current, [selectedTask.id]: nextPrograms }));
    setSelectedProgramNodeId(nextPrograms[0]?.root.id ?? null);
    setSelectedInstructionId(null);
    setExpandedProgramNodeIds(getExpandedProgramNodeIds(nextPrograms));
    setDetailTab('params');
    setPlaybackStatus('ready');
    setProgress(0);
    return nextPrograms;
  };

  const selectWeldTask = (weldTaskId: string) => {
    if (!selectedTask?.weldTasks.some((weldTask) => weldTask.id === weldTaskId)) return;
    setSelectedWeldNodeId(weldTaskId);
    setSelectedInstructionId(null);
    setPlaybackStatus('ready');
    setProgress(0);
  };

  const selectWeldSegment = (segmentId: string) => {
    if (!selectedTask?.weldTasks.some((weldTask) => weldTask.weldSegments.some((segment) => segment.id === segmentId))) return;
    setSelectedWeldNodeId(segmentId);
    setSelectedInstructionId(null);
    setPlaybackStatus('ready');
    setProgress(0);
  };

  const changeScene = (scene: SimulationSceneId) => {
    setActiveScene(scene);
    setSelectedWeldNodeId(null);
  };

  const toggleProgramNode = (nodeId: string) => {
    setExpandedProgramNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const selectProgramNode = (nodeId: string) => {
    const program = selectedPrograms.find((candidate) => Boolean(findProgramNode(candidate.root, nodeId)));
    if (!program) return;
    setSelectedProgramNodeId(nodeId);
    setSelectedInstructionId(null);
    setProgramViewRequestKey((current) => current + 1);
    if (selectedTask) {
      setActiveScene(selectedTask.side);
      setSelectedWeldNodeId(null);
    }
    setDetailTab('params');
    setPlaybackStatus('ready');
    setProgress(0);
  };

  const selectInstruction = (instructionId: string) => {
    if (!selectedProgramNode || selectedProgramNode.type !== 'subprogram') return;
    if (!selectedProgramNode.instructions?.some((instruction) => instruction.id === instructionId)) return;
    setSelectedInstructionId(instructionId);
    setPlaybackStatus('ready');
    setProgress(0);
  };

  const updateProgramAxisValue = (
    axisGroup: 'support' | 'clamp',
    axisName: string,
    value: string,
  ) => {
    if (!selectedTask || !selectedProgram) return;
    const sourceWeldTask = selectedTask.weldTasks.find((weldTask) => weldTask.id === selectedProgram.weldTaskId);
    if (!sourceWeldTask) return;
    const updateAxisValues = (axisValues: typeof selectedProgram.supportAxisValues) => axisValues.map((axis) => (
      axis.axis === axisName ? { ...axis, value } : axis
    ));
    const supportAxisValues = axisGroup === 'support'
      ? updateAxisValues(selectedProgram.supportAxisValues)
      : selectedProgram.supportAxisValues;
    const clampAxisValues = axisGroup === 'clamp'
      ? updateAxisValues(selectedProgram.clampAxisValues)
      : selectedProgram.clampAxisValues;
    const nextProgram = generateRobotProgram(
      selectedTask,
      { ...sourceWeldTask, supportAxisValues, clampAxisValues },
      selectedProgram.robotAssignments,
      Math.max(0, selectedProgram.version - 1),
    );
    setProgramsByTaskId((current) => ({
      ...current,
      [selectedTask.id]: (current[selectedTask.id] ?? []).map((program) => (
        program.weldTaskId === nextProgram.weldTaskId ? nextProgram : program
      )),
    }));
  };

  const resetProgramParams = () => {
    if (!selectedTask || !selectedProgram) return;
    const sourceWeldTask = selectedTask.weldTasks.find((weldTask) => weldTask.id === selectedProgram.weldTaskId);
    if (!sourceWeldTask) return;
    const nextProgram = generateRobotProgram(
      selectedTask,
      sourceWeldTask,
      selectedProgram.robotAssignments,
      selectedProgram.version,
    );
    setProgramsByTaskId((current) => ({
      ...current,
      [selectedTask.id]: (current[selectedTask.id] ?? []).map((program) => (
        program.weldTaskId === nextProgram.weldTaskId ? nextProgram : program
      )),
    }));
    setUrdfJointValuesByTaskId((current) => ({
      ...current,
      [selectedTask.id]: defaultUrdfJointValues,
    }));
    setPlaybackStatus('ready');
    setProgress(0);
  };

  const updateAssemblyTransform = (axis: keyof SimulationAssemblyTransform, value: string) => {
    if (!selectedTask) return;
    setAssemblyTransformsByTaskId((current) => ({
      ...current,
      [selectedTask.id]: {
        ...(current[selectedTask.id] ?? createDefaultAssemblyTransform()),
        [axis]: value,
      },
    }));
  };

  const setAssemblyCoordinateFrame = (coordinateFrame: SimulationCoordinateFrame) => {
    if (!selectedTask) return;
    setAssemblyCoordinateFramesByTaskId((current) => ({ ...current, [selectedTask.id]: coordinateFrame }));
  };

  const updateUrdfJointValue = (jointName: string, value: string) => {
    if (!selectedTask || !urdfModel?.joints[jointName]) return;
    setUrdfJointValuesByTaskId((current) => ({
      ...current,
      [selectedTask.id]: {
        ...(current[selectedTask.id] ?? defaultUrdfJointValues),
        [jointName]: value,
      },
    }));
  };

  const startPlayback = () => {
    if (!selectedTask || !selectedProgram || !playbackScope || playbackScope.instructionCount === 0) return false;
    if (selectedWeldNodeId) return false;
    if (activeScene !== selectedTask.side) return false;
    if (progress >= 100) setProgress(0);
    setPlaybackStatus('playing');
    return true;
  };

  const pausePlayback = () => {
    if (playbackStatus === 'playing') setPlaybackStatus('paused');
  };

  const skipPlayback = (seconds: number) => {
    if (!selectedTask || !selectedProgram || !playbackScope || playbackScope.instructionCount === 0) return;
    const progressDelta = seconds * MOCK_PLAYBACK_PROGRESS_PER_SECOND;
    setProgress((current) => {
      const next = Math.min(100, Math.max(0, current + progressDelta));
      if (next >= 100) setPlaybackStatus('completed');
      if (playbackStatus === 'completed' && next < 100) setPlaybackStatus('paused');
      return next;
    });
  };

  const resetPlayback = () => {
    if (playbackStatus !== 'paused') return;
    setPlaybackStatus('ready');
    setProgress(0);
  };

  return {
    selectedTask,
    selectedTaskId,
    selectTask,
    activeScene,
    changeScene,
    selectedWeldNodeId,
    associatedWeldSegmentIds,
    selectWeldTask,
    selectWeldSegment,
    selectedPrograms,
    selectedProgram,
    selectedRobotAssignments,
    selectedProgramNode,
    selectedProgramNodeId,
    selectedPoint,
    selectedInstructionId,
    programViewRequestKey,
    selectProgramNode,
    selectInstruction,
    playbackScope,
    expandedProgramNodeIds,
    toggleProgramNode,
    detailTab,
    setDetailTab,
    updateProgramAxisValue,
    resetProgramParams,
    selectedAssemblyTransform,
    selectedAssemblyCoordinateFrame,
    updateAssemblyTransform,
    setAssemblyCoordinateFrame,
    urdfModel,
    urdfError,
    selectedUrdfJointValues,
    playbackUrdfJointValues,
    updateUrdfJointValue,
    generatePrograms,
    playbackStatus,
    progress,
    speed,
    setSpeed,
    startPlayback,
    pausePlayback,
    skipPlayback,
    resetPlayback,
  };
}
