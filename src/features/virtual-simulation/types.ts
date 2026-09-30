export type SimulationSide = 'front' | 'back';

export type SimulationSceneId = SimulationSide;

export type SimulationPosePoint = {
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
};

export type SimulationCoordinateFrame = 'world' | 'parent';

export type SimulationRobotCoordinateFrame = 'world' | 'parent' | 'object';

/** Visual-only pose adjustment owned by one simulation task. */
export type SimulationAssemblyTransform = SimulationPosePoint;

export type SimulationRobotId = 'robot1' | 'robot2';

export type SimulationWeldSegment = {
  id: string;
  index: number;
  name: string;
  featureName: string;
  scanPosePoints: SimulationPosePoint[];
  weldPosePoints: SimulationPosePoint[];
  defaultRobot: SimulationRobotId;
};

export type SimulationWeldTask = {
  id: string;
  index: number;
  name: string;
  sourceStepKey: string;
  weldFeatureNames: string[];
  weldFeatureUrls: string[];
  supportAxisValues: SimulationAxisValue[];
  clampAxisValues: SimulationAxisValue[];
  weldSegments: SimulationWeldSegment[];
};

export type SimulationModelPart = {
  id: string;
  name: string;
  url: string;
};

export type SimulationTaskSourceKind = 'process-planning' | 'local-file';

export type SimulationAxisValue = {
  axis: `J${number}`;
  value: string;
  unit: 'mm' | '°';
};

export type SimulationSourceTask = {
  id: string;
  displayName: string;
  name: '装配';
  sourceKind: SimulationTaskSourceKind;
  sourceLabel: string;
  sourceIdentity: string;
  sourceFileName?: string;
  createdAt: string;
  copyIndex: number;
  sourceStepId: string;
  sourceStepKey: string;
  clampStepId: string;
  scanStepId?: string;
  processId: string;
  processSequence: number;
  processName: string;
  assemblyId: string;
  station: string;
  side: SimulationSide;
  targetLabel: string;
  weldFeatureNames: string[];
  weldFeatureUrls: string[];
  modelParts: SimulationModelPart[];
  supportAxisValues: SimulationAxisValue[];
  clampAxisValues: SimulationAxisValue[];
  weldSegments: SimulationWeldSegment[];
  weldTasks: SimulationWeldTask[];
};

export type SimulationWorkspace = {
  id: string;
  displayName: string;
  sourceKind: SimulationTaskSourceKind;
  sourceLabel: string;
  sourceIdentity: string;
  sourceFileName?: string;
  createdAt: string;
  copyIndex: number;
  tasks: SimulationSourceTask[];
};

export type SimulationMoveType = 'PTP' | 'LIN';

export type SimulationProcessCommand = 'SCAN_START' | 'SCAN_END' | 'WELD_START' | 'WELD_END';

export type SimulationCartesianTargetPose = {
  X: string;
  Y: string;
  Z: string;
  RX: string;
  RY: string;
  RZ: string;
  E1: string;
};

export type SimulationJointTargetPose = {
  J1: string;
  J2: string;
  J3: string;
  J4: string;
  J5: string;
  J6: string;
  E1: string;
};

export type SimulationTargetPose = SimulationCartesianTargetPose | SimulationJointTargetPose;

export type SimulationInstruction = {
  id: string;
  name: string;
  sequence: number;
  moveType: SimulationMoveType;
  speed: string;
  processCommand?: SimulationProcessCommand;
  targetPose: SimulationTargetPose;
  externalAxisLimit: string;
  externalAxisExceeded: boolean;
};

/** The point currently selected in a generated scan/weld program. */
export type SimulationSelectedPoint = {
  instruction: SimulationInstruction;
  robotId: SimulationRobotId;
  robotName: string;
  kind: 'scan' | 'weld';
};

export type SimulationProgramNode = {
  id: string;
  name: string;
  type: 'program' | 'robot' | 'subprogram' | 'instruction';
  kind?: 'scan' | 'weld';
  /** The weld segment represented by a scan or weld subprogram. */
  weldSegmentId?: string;
  robotName?: string;
  weldFeatureName?: string;
  userFrame?: string;
  toolFrame?: string;
  children?: SimulationProgramNode[];
  instructions?: SimulationInstruction[];
};

export type SimulationRobotProgram = {
  id: string;
  taskId: string;
  weldTaskId: string;
  weldTaskIndex: number;
  name: string;
  version: number;
  generatedAt: string;
  supportAxisValues: SimulationAxisValue[];
  clampAxisValues: SimulationAxisValue[];
  root: SimulationProgramNode;
  instructionCount: number;
  limitExceededCount: number;
  robotAssignments: Record<string, SimulationRobotId>;
};

export type SimulationPlaybackStatus = 'ready' | 'playing' | 'paused' | 'completed';

export type SimulationPlaybackScopeKind = 'dual-robot' | 'single-robot' | 'subprogram';

export type SimulationPlaybackLane = {
  robotName: string;
  programNames: string[];
};

export type SimulationPlaybackScope = {
  nodeId: string;
  kind: SimulationPlaybackScopeKind;
  title: string;
  label: string;
  actionLabel: string;
  modeLabel: string;
  description: string;
  instructionCount: number;
  lanes: SimulationPlaybackLane[];
};

export type SimulationDetailTab = 'params' | 'points';
