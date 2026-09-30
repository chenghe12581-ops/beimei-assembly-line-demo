import { useState, Suspense, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { ASSET_BASE } from '../asset-base';
import {
  AlertTriangle,
  ArrowLeft,
  Axis3d,
  Ban,
  Box,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  CircleAlert,
  CircleCheck,
  Cog,
  Download,
  Eye,
  EyeOff,
  Filter,
  FileCog,
  FileMinus,
  FileQuestion,
  FileSpreadsheet,
  FileWarning,
  Flame,
  FolderOpen,
  FolderPlus,
  GripVertical,
  Hammer,
  Layers3,
  ListTree,
  Minus,
  MonitorPlay,
  Move3D,
  PanelLeft,
  Pickaxe,
  ScanFace,
  Pin,
  Plus,
  ArrowRight,
  ChevronUp,
  Rotate3D,
  Save,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  SquareArrowRight,
  Target,
  Trash2,
  Import,
  X,
} from 'lucide-react';
import { WeldFeatureIcon, GrindFeatureIcon, AssemblyFeatureIcon } from './components/icons/FeatureToolIcons';
import weldAngleImg0 from '../pics/Frame 427322783-0.svg';
import weldAngleImg1 from '../pics/Frame 427322783-1.svg';
import weldAngleImg2 from '../pics/Frame 427322783-2.svg';
import weldAngleImg3 from '../pics/Frame 427322783-3.svg';
import weldAngleImg4 from '../pics/Frame 427322783-4.svg';
import magnetShowcaseImg from '../pics/magnet showcase.png';
import robimLogoImg from '../pics/RoBIM云平台LOGO 1.png';
import offsetImg1 from '../pics/偏移/偏移1.svg';
import offsetImg2 from '../pics/偏移/偏移2.svg';
import offsetImg3 from '../pics/偏移/偏移3.svg';
import offsetImg4 from '../pics/偏移/偏移4.svg';
import offsetImg5 from '../pics/偏移/偏移5.svg';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Bounds, Html, useBounds } from '@react-three/drei';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { Badge } from './components/ui/badge';
import { ProcessDetailTabBar } from './components/process/ProcessDetailTabBar';
import { ProcessFieldGroup } from './components/process/ProcessFieldGroup';
import { ProcessJointAngleRow } from './components/process/ProcessJointAngleRow';
import { ProcessNumberField } from './components/process/ProcessNumberField';
import { ProcessPathPointGroupHeader } from './components/process/ProcessPathPointGroupHeader';
import { ProcessPathPointModeToolbar } from './components/process/ProcessPathPointModeToolbar';
import { ClampPointConfigPanel, createDefaultClampPointSegments, type ClampPointSegmentConfig } from './components/process/ClampPointConfigPanel';
import { PoseAxisFieldGroup } from './components/process/PoseAxisFieldGroup';
import { ProcessResultPointPanel } from './components/process/ProcessResultPointPanel';
import { ProcessSelectionPanel } from './components/process/ProcessSelectionPanel';
import { ObjectMultiSelect } from './components/process/ObjectMultiSelect';
import { ProcessSingleSelect } from './components/process/ProcessSingleSelect';
import { GrindToolHeadPoseModel, type GrindToolHeadPoseItem } from './components/process/GrindToolHeadPoseModel';
import {
  createGeneratedGrindPath,
  createWeldFeatureSegmentPosePoints,
  loadGrindFeaturePath,
  loadWeldFeaturePath,
  type GrindFeaturePath,
} from './components/process/grind-feature-path';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { ScrollArea } from './components/ui/scroll-area';
import { ScrollPanelEdge } from './components/ui/scroll-panel-edge';
import { ParameterSwitch } from './components/ui/parameter-switch';
import { PanelEmptyState } from './components/ui/panel-empty-state';
import { ProductionExecutionPage } from './ProductionExecutionPage';
import { CapacityStatisticsPage } from './CapacityStatisticsPage';
import { VirtualSimulationPage } from './VirtualSimulationPage';
import type {
  SimulationPosePoint,
  SimulationSourceTask,
  SimulationWorkspace,
  SimulationWeldSegment,
} from '../features/virtual-simulation/types';
import { Checkbox, ConfigProvider, Tooltip } from 'antd';
import { CoordinateTransformPanel } from './components/process-planning/CoordinateTransformPanel';
import { AssemblyDatumExtractionPanel } from './components/process-planning/AssemblyDatumExtractionPanel';
import { ManualFeatureExtractionPanel } from './components/process-planning/ManualFeatureExtractionPanel';
import { MagnetParameterPanel as MagnetParameterPanelView } from './components/process-planning/MagnetParameterPanel';
import { ProcessParameterModal as ProcessParameterModalView } from './components/process-planning/ProcessParameterModal';
import { AddProcessTaskDialog as AddProcessTaskDialogView } from './components/process-planning/AddProcessTaskDialog';
import {
  createFixedPlanningProcesses,
  getPlanningProcessIdForTask,
  type PlanningTaskType,
} from './process-planning-model';

const PROCESS_ISOLATION_DIMMED_OPACITY = 0.25;
const PROCESS_ISOLATION_DIMMED_CLASS_NAME = 'opacity-25';
const PROCESS_TASK_CONTEXT_OPACITY = 0.5;
const PROCESS_TASK_CONTEXT_CLASS_NAME = 'opacity-50';
const PROCESS_SELECTION_OVERLAY_OPACITY = 0.58;
const PROCESS_SELECTION_EDGE_COLOR = '#F59E0B';
const PROCESS_SELECTION_EDGE_OPACITY = 0.9;
const PROCESS_SELECTION_EDGE_WIDTH = 1.2;
const PROCESS_SELECTION_DIMMED_OVERLAY_OPACITY = 0.58;
const PROCESS_ISOLATION_DIMMED_OVERLAY_COLOR = '#475569';
const PROCESS_ISOLATION_DIMMED_OVERLAY_OPACITY = 0.28;

type TreeNode = {
  id: string;
  name: string;
  modelPath?: string;
  nodeType?: 'feature';
  featureType?: 'weld' | 'grind' | 'grip' | 'clamp' | 'datum';
  featureUrl?: string;
  relatedPartIds?: string[];
  sourceWeldFeatureIds?: string[];
  children?: TreeNode[];
  datumMeta?: {
    partAId: string;
    partBId: string;
    edgeModelUrl?: string;
    edgeModelUrls?: string[];
  };
};

type DeleteConfirmKind = 'model' | 'feature' | 'process';

type FeatureView = {
  id: string;
  sourceId: string;
  url: string;
  selected: boolean;
  highlighted?: boolean;
  opacityScale?: number;
};

type SelectableFacePart = {
  id: string;
  name: string;
  url: string;
};

type PivotSnapPoint = {
  id: string;
  label: string;
  partId: string;
  sourcePartIds?: string[];
  position: [number, number, number];
  kind: 'corner' | 'volume-center' | 'face-center' | 'surface';
};

type SelectableFaceTriangle = {
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  normal: THREE.Vector3;
  planeConstant: number;
  box: THREE.Box3;
};

type SelectableFaceGeometry = {
  id: string;
  partId: string;
  geometry: THREE.BufferGeometry;
  triangleCount: number;
  triangles: SelectableFaceTriangle[];
  box: THREE.Box3;
};

type ManualWeldCandidate = {
  id: string;
  segments: IntersectionSegment[];
  length: number;
};

type DetachedFeatureItem = {
  id: string;
  name: string;
  featureType: NonNullable<TreeNode['featureType']>;
  featureUrl?: string;
  relatedPartIds: string[];
  sourceWeldFeatureIds?: string[];
};

type PickPathPoint = { x: string; y: string; z: string; rx: string; ry: string; rz: string; enabled?: boolean };
type PickPathPosePointIndex = number | 'all';
type ProcessPosePoint = { x: string; y: string; z: string; rx: string; ry: string; rz: string };
type ProcessPointCoordinates = { x: string; y: string; z: string };
const toProcessPosePoint = (point: ProcessPointCoordinates | Partial<ProcessPosePoint>): ProcessPosePoint => ({
  x: point.x ?? '',
  y: point.y ?? '',
  z: point.z ?? '',
  rx: point.rx ?? '0.0',
  ry: point.ry ?? '0.0',
  rz: point.rz ?? '0.0',
});
const WORKBENCH_TYPES = ['主筋板打磨翻面平台', '主筋板正面装配平台', '主筋板翻面平台', '主筋板背面装配平台'] as const;
type WorkbenchType = typeof WORKBENCH_TYPES[number];
type WorkbenchSupportAxis = 'X' | 'Y' | 'Z';
type WorkbenchSupportSetting = {
  width: string;
  partPosition: string;
  softLimits: Record<WorkbenchSupportAxis, { min: string; max: string }>;
};
type WorkbenchClampSetting = {
  type: string;
  size: {
    length: string;
    width: string;
  };
  zeroPosition: string;
  softLimits: Record<WorkbenchSupportAxis, { min: string; max: string }>;
};
const pickGripperTypeOptions = ['桁架抓具', '机器人抓具'] as const;
const pickMagnetDefinitions = [
  { name: '左', load: '100 kg', travel: '200 mm' },
  { name: '中', load: '200 kg', travel: '200 mm' },
  { name: '右', load: '100 kg', travel: '200 mm' },
] as const;
type PickGripperType = typeof pickGripperTypeOptions[number];
type PickMagnetName = typeof pickMagnetDefinitions[number]['name'];
type PickMagnetForceLevel = '大' | '中' | '小';
const pickMagnetForceLevelOptions: PickMagnetForceLevel[] = ['大', '中', '小'];
const processParameterGripperPresets: Record<PickGripperType, Record<PickMagnetName, { length: string; width: string; load: string; travel: string }>> = {
  桁架抓具: {
    左: { length: '220', width: '150', load: '120', travel: '240' },
    中: { length: '260', width: '170', load: '260', travel: '' },
    右: { length: '220', width: '150', load: '120', travel: '240' },
  },
  机器人抓具: {
    左: { length: '160', width: '100', load: '80', travel: '140' },
    中: { length: '190', width: '110', load: '150', travel: '' },
    右: { length: '160', width: '100', load: '80', travel: '140' },
  },
};
type PickMagnetSetting = {
  enabled: boolean;
  z: string;
  length: string;
  width: string;
  forceLevel: string;
  load: string;
  travel: string;
};
type PickMagnetSettings = Record<PickMagnetName, PickMagnetSetting>;

function createDefaultWorkbenchSupportSetting(id: string): WorkbenchSupportSetting {
  const numericId = Number(id);
  const offset = Number.isFinite(numericId) ? (numericId - 1) * 80 : 0;
  return {
    width: '450',
    partPosition: numericId === 2 ? '右端' : '左端',
    softLimits: {
      X: { min: String(0 + offset), max: String(450 + offset) },
      Y: { min: '0', max: '240' },
      Z: { min: '0', max: '260' },
    },
  };
}

function createWorkbenchSupportSettings(ids: string[]) {
  return ids.reduce<Record<string, WorkbenchSupportSetting>>((settings, id) => {
    settings[id] = createDefaultWorkbenchSupportSetting(id);
    return settings;
  }, {});
}

function createDefaultWorkbenchClampSetting(id: string): WorkbenchClampSetting {
  const numericId = Number(id);
  const offset = Number.isFinite(numericId) ? (numericId - 1) * 90 : 0;
  return {
    type: numericId === 2 ? '定位焊' : '翻转',
    size: {
      length: '280',
      width: '180',
    },
    zeroPosition: numericId === 2 ? '右端' : '左端',
    softLimits: {
      X: { min: String(0 + offset), max: String(420 + offset) },
      Y: { min: '0', max: '260' },
      Z: { min: '0', max: '280' },
    },
  };
}

function createWorkbenchClampSettings(ids: string[]) {
  return ids.reduce<Record<string, WorkbenchClampSetting>>((settings, id) => {
    settings[id] = createDefaultWorkbenchClampSetting(id);
    return settings;
  }, {});
}

function createDefaultPickMagnetSettings(gripperType: PickGripperType = '桁架抓具'): PickMagnetSettings {
  const forceLevel: PickMagnetForceLevel = '中';
  return {
    左: { enabled: true, z: '96.0', length: '180', width: '120', forceLevel, load: '100', travel: '200' },
    中: { enabled: true, z: '88.0', length: '180', width: '120', forceLevel, load: '200', travel: '' },
    右: { enabled: false, z: '96.0', length: '180', width: '120', forceLevel, load: '100', travel: '200' },
  };
}

function normalizePickMagnetForceLevel(value?: string): PickMagnetForceLevel {
  if (value === '大' || value === '中' || value === '小') return value;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    if (numericValue >= 85) return '大';
    if (numericValue <= 55) return '小';
  }
  return '中';
}

function calculatePickActualMetrics(gripperType: PickGripperType, magnetSettings: PickMagnetSettings, magnetPosition?: ProcessPosePoint) {
  const enabledMagnets = pickMagnetDefinitions.filter((magnet) => magnetSettings[magnet.name]?.enabled);
  const enabledCount = enabledMagnets.length;
  const zValues = enabledMagnets.map((magnet) => Number(magnetSettings[magnet.name]?.z)).filter(Number.isFinite);
  const averageZ = zValues.length > 0 ? zValues.reduce((total, value) => total + value, 0) / zValues.length : 88;
  const zOffset = Math.max(-6, Math.min(6, (averageZ - 88) / 4));
  const positionY = Number(magnetPosition?.y);
  const positionZ = Number(magnetPosition?.z);
  const positionOffset = Math.max(-4, Math.min(4, ((Number.isFinite(positionZ) ? positionZ : 96) - 96) / 8));
  const eccentricOffset = Math.max(-8, Math.min(8, ((Number.isFinite(positionY) ? positionY : 240) - 240) / 3));
  const forceScoreMap: Record<PickMagnetForceLevel, number> = { 小: -1, 中: 0, 大: 1 };
  const forceScore = enabledMagnets.reduce((total, magnet) => {
    const level = normalizePickMagnetForceLevel(magnetSettings[magnet.name]?.forceLevel);
    return total + forceScoreMap[level];
  }, 0);
  const normalizedForceOffset = enabledCount > 0 ? forceScore / enabledCount : 0;

  if (gripperType === '机器人抓具') {
    return {
      actualCoverage: (60 + enabledCount * 5 + zOffset + normalizedForceOffset * 2 + positionOffset).toFixed(2),
      actualLoadCoefficient: (0.60 + enabledCount * 0.05 + normalizedForceOffset * 0.03 + positionOffset * 0.01).toFixed(2),
      actualEccentricDistance: String(Math.round(212 - enabledCount * 12 - zOffset * 2 - normalizedForceOffset * 5 + eccentricOffset)),
    };
  }

  return {
    actualCoverage: (66 + enabledCount * 4 + zOffset + normalizedForceOffset * 1.5 + positionOffset).toFixed(2),
    actualLoadCoefficient: (0.64 + enabledCount * 0.04 + normalizedForceOffset * 0.025 + positionOffset * 0.01).toFixed(2),
    actualEccentricDistance: String(Math.round(196 - enabledCount * 9 - zOffset * 2 - normalizedForceOffset * 4 + eccentricOffset)),
  };
}

function calculatePickMagnetPosition(gripperType: PickGripperType, magnetSettings: PickMagnetSettings, currentPosition: ProcessPosePoint): ProcessPosePoint {
  const enabledMagnets = pickMagnetDefinitions.filter((magnet) => magnetSettings[magnet.name]?.enabled);
  const zValues = enabledMagnets.map((magnet) => Number(magnetSettings[magnet.name]?.z)).filter(Number.isFinite);
  const averageZ = zValues.length > 0 ? zValues.reduce((total, value) => total + value, 0) / zValues.length : 88;
  const forceScoreMap: Record<PickMagnetForceLevel, number> = { 小: -1, 中: 0, 大: 1 };
  const forceScore = enabledMagnets.reduce((total, magnet) => {
    const level = normalizePickMagnetForceLevel(magnetSettings[magnet.name]?.forceLevel);
    return total + forceScoreMap[level];
  }, 0);
  const baseY = gripperType === '机器人抓具' ? 226 : 240;
  const nextY = baseY + enabledMagnets.length * 3 + forceScore * 2;
  const nextZ = averageZ + (gripperType === '机器人抓具' ? 4 : 8);

  return {
    ...currentPosition,
    y: Number.isFinite(nextY) ? nextY.toFixed(1) : currentPosition.y,
    z: Number.isFinite(nextZ) ? nextZ.toFixed(1) : currentPosition.z,
  };
}

type PickProcessConfig = {
  namingMode: 'process-part' | 'part-index';
  workpieceIds: string[];
  gripperType: PickGripperType;
  magnetSettings: PickMagnetSettings;
  coverageOverride: string;
  safetyCoefficientOverride: string;
  eccentricThresholdOverride: string;
  actualCoverage: string;
  actualLoadCoefficient: string;
  actualEccentricDistance: string;
  magnetPosition: ProcessPosePoint;
  pathPoints: PickPathPoint[];
};

type PlaceProcessConfig = {
  workpieceIds: string[];
  workbenchType: WorkbenchType;
  supportIds: string[];
  clampIds?: string[];
  points: { x: string; y: string; z: string }[];
  pathPoints: PickPathPoint[];
  joints?: string[];
};

type WeldProcessParams = {
  weldLegHeight: string;
  scanDistance: string;
  scanOffsetX: string;
  scanOffsetY: string;
  scanOffsetZ: string;
  scanPoseRx: string;
  scanPoseRy: string;
  scanPoseRz: string;
};

type FeatureProcessConfig = {
  featureIds: string[];
  points: { x: string; y: string; z: string }[];
  posePoints?: ProcessPosePoint[];
  pathPoints: PickPathPoint[];
  pathPointGroups?: PickPathPoint[][];
  grindParams?: GrindProcessParams;
  assembleParams?: AssembleProcessParams;
  weldParams?: WeldProcessParams;
};

type GrindProcessParams = {
  toolMode: 'inhand' | 'tohand';
  width: string;
  speed: string;
  force: string;
  rpm: string;
  axisAngle: string;
  swingAmplitude: string;
  prePressureHeight: string;
  progressivePrePressureHeight: string;
  safePointHeight: string;
  samplingDensity: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  pathMergeEnabled: boolean;
  mergeLinearLinearAngle: string;
  mergeLinearLinearAngleMin: string;
  mergeLinearLinearAngleMax: string;
  mergeLinearArcAngle: string;
  mergeLinearArcAngleMin: string;
  mergeLinearArcAngleMax: string;
  mergeArcArcAngle: string;
  mergeArcArcAngleMin: string;
  mergeArcArcAngleMax: string;
  dualMachineSafetyDistance: string;
};

type AssembleProcessParams = {
  scanDistance: string;
  scanDirection: '逆时针' | '顺时针';
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  poseRx: string;
  poseRy: string;
  poseRz: string;
  sampleShape: '直线' | '圆弧';
  lineSampleMode: '距离' | '数量';
  arcSampleMode: '弦长' | '数量';
  sampleValue: string;
  roughOffsetX: string;
  roughOffsetY: string;
  roughOffsetProtectThreshold: string;
};

type ProcessStep = {
  id?: string;
  processId?: string;
  name?: string;
  confirmed?: boolean;
  board: string;
  action: string;
  type: string;
  pickConfig?: PickProcessConfig;
  placeConfig?: PlaceProcessConfig;
  turnoverClampConfig?: PlaceProcessConfig;
  grindConfig?: FeatureProcessConfig;
  assembleConfig?: FeatureProcessConfig;
  weldConfig?: FeatureProcessConfig;
  weldScanConfig?: FeatureProcessConfig;
};

type ProcessStepType = PlanningTaskType;
type AddProcessTaskDialogState = {
  open: boolean;
  type: ProcessStepType;
  selectedIds: string[];
};

type ProcessPointLayoutKind = 'xyz' | 'pose' | 'joint' | 'weld-segment-pose';
type CompactProcessDetailTab = 'parameter-results' | 'path-points';
type CompactPathCoordinateFrame = '世界' | '父系坐标系' | '物体';
type CombinedWeldPathMode = 'scan' | 'weld';
type CompactProcessFilterKind = 'part' | 'type' | 'weld-feature' | 'grind-feature' | 'datum-feature';
const compactPathCoordinateFrameOptions = ['世界', '父系坐标系', '物体'] as const;
const compactProcessParameterNameClassName = 'text-xs font-normal text-ds-text-parameter-label';
const compactProcessSubParameterNameClassName = 'text-[11px] font-normal text-ds-text-parameter-label';
const processParameterInputSmClassName = '!h-8 !px-2 !py-1 !pr-8 text-left !text-xs';
const processParameterInputSmUnitClassName = '!h-8 !px-2 !py-1 !pr-8 text-left !text-xs';
const processParameterInputSmWideUnitClassName = '!h-8 !px-2 !py-1 !pr-11 text-left !text-xs';
const compactPathCoordinateFrameOffsets: Record<CompactPathCoordinateFrame, Record<'x' | 'y' | 'z', number>> = {
  世界: { x: 0, y: 0, z: 0 },
  父系坐标系: { x: -120, y: -40, z: -5 },
  物体: { x: -240, y: -80, z: -12 },
};
function formatCompactCoordinateFrameValue(value: string, offset: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return (numericValue + offset).toFixed(1);
}

function parseCompactCoordinateFrameValue(value: string, offset: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return (numericValue - offset).toFixed(1);
}

function getCompactCoordinateFramePoint<T extends ProcessPointCoordinates>(point: T, frame: CompactPathCoordinateFrame): T {
  const offsets = compactPathCoordinateFrameOffsets[frame];
  return {
    ...point,
    x: formatCompactCoordinateFrameValue(point.x, offsets.x),
    y: formatCompactCoordinateFrameValue(point.y, offsets.y),
    z: formatCompactCoordinateFrameValue(point.z, offsets.z),
  };
}

function getPathPointStoredAxisValue(axis: typeof pickPathAxes[number], value: string, frame: CompactPathCoordinateFrame) {
  if (axis === 'x' || axis === 'y' || axis === 'z') {
    return parseCompactCoordinateFrameValue(value, compactPathCoordinateFrameOffsets[frame][axis]);
  }
  return value;
}

function getEnabledPathPointEntries(pathPoints: PickPathPoint[]) {
  return pathPoints
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.enabled !== false);
}

function mergeSafeAndResultPathPoints<T extends ProcessPointCoordinates>(
  safePoints: PickPathPoint[],
  resultPoints: T[]
) {
  return [
    ...getEnabledPathPointEntries(safePoints.slice(0, 3)).map(({ point, index }) => ({
      kind: 'safe' as const,
      point,
      sourceIndex: index,
    })),
    ...resultPoints.map((point, index) => ({
      kind: 'result' as const,
      point,
      sourceIndex: index,
    })),
    ...getEnabledPathPointEntries(safePoints.slice(3, 6)).map(({ point, index }) => ({
      kind: 'safe' as const,
      point,
      sourceIndex: index + 3,
    })),
  ];
}
const compactProcessFilterKindOptions: { id: CompactProcessFilterKind; name: string }[] = [
  { id: 'part', name: '零件名称' },
  { id: 'type', name: '工序类型' },
  { id: 'weld-feature', name: '焊缝特征' },
  { id: 'grind-feature', name: '打磨特征' },
  { id: 'datum-feature', name: '装配特征' },
];
const compactPathPointPreviews: ProcessPointCoordinates[] = [
  { x: '120.0', y: '80.0', z: '15.0' },
  { x: '240.0', y: '95.0', z: '15.0' },
  { x: '360.0', y: '110.0', z: '18.0' },
  { x: '480.0', y: '125.0', z: '18.0' },
  { x: '600.0', y: '140.0', z: '20.0' },
  { x: '720.0', y: '155.0', z: '20.0' },
];
const compactPathPointDeltaPreviews: ProcessPointCoordinates[] = [
  { x: '12.5', y: '-3.0', z: '8.0' },
  { x: '24.0', y: '2.0', z: '8.0' },
  { x: '36.0', y: '6.0', z: '10.0' },
  { x: '48.0', y: '9.0', z: '10.0' },
  { x: '60.0', y: '12.0', z: '12.0' },
  { x: '72.0', y: '15.0', z: '12.0' },
];
const compactResultPointPreview: ProcessPosePoint = { x: '240.0', y: '96.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '0.0' };
// 打磨路径点位 mock 数据（6 安全点 + 6 结果点 + 6 安全点）
const compactGrindSafePointPreviews: ProcessPointCoordinates[] = [
  { x: '100.0', y: '45.0', z: '22.0' },
  { x: '230.0', y: '45.0', z: '22.0' },
  { x: '360.0', y: '45.0', z: '22.0' },
  { x: '490.0', y: '155.0', z: '22.0' },
  { x: '620.0', y: '155.0', z: '22.0' },
  { x: '750.0', y: '155.0', z: '22.0' },
];
const compactGrindResultPointPreviews: ProcessPosePoint[] = [
  { x: '110.0', y: '52.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '260.0', y: '52.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '410.0', y: '52.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '110.0', y: '168.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '260.0', y: '168.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '410.0', y: '168.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
];
const compactGrindSafePointDeltaPreviews: ProcessPointCoordinates[] = [
  { x: '10.0', y: '-5.0', z: '12.0' },
  { x: '23.0', y: '-5.0', z: '12.0' },
  { x: '36.0', y: '-5.0', z: '12.0' },
  { x: '49.0', y: '5.0', z: '12.0' },
  { x: '62.0', y: '5.0', z: '12.0' },
  { x: '75.0', y: '5.0', z: '12.0' },
];
// 装配路径点位 mock 数据（4 组，每组 6 安全点 + 1 结果点）
const compactAssemblePathPointPreviews: ProcessPointCoordinates[][] = [
  [
    { x: '90.0', y: '60.0', z: '12.0' }, { x: '210.0', y: '88.0', z: '12.0' }, { x: '330.0', y: '116.0', z: '12.0' },
    { x: '450.0', y: '144.0', z: '12.0' }, { x: '570.0', y: '172.0', z: '12.0' }, { x: '690.0', y: '200.0', z: '12.0' },
  ],
  [
    { x: '95.0', y: '65.0', z: '14.0' }, { x: '215.0', y: '93.0', z: '14.0' }, { x: '335.0', y: '121.0', z: '14.0' },
    { x: '455.0', y: '149.0', z: '14.0' }, { x: '575.0', y: '177.0', z: '14.0' }, { x: '695.0', y: '205.0', z: '14.0' },
  ],
  [
    { x: '100.0', y: '70.0', z: '16.0' }, { x: '220.0', y: '98.0', z: '16.0' }, { x: '340.0', y: '126.0', z: '16.0' },
    { x: '460.0', y: '154.0', z: '16.0' }, { x: '580.0', y: '182.0', z: '16.0' }, { x: '700.0', y: '210.0', z: '16.0' },
  ],
  [
    { x: '105.0', y: '75.0', z: '18.0' }, { x: '225.0', y: '103.0', z: '18.0' }, { x: '345.0', y: '131.0', z: '18.0' },
    { x: '465.0', y: '159.0', z: '18.0' }, { x: '585.0', y: '187.0', z: '18.0' }, { x: '705.0', y: '215.0', z: '18.0' },
  ],
];
const compactAssemblePathPointDeltaPreviews: ProcessPointCoordinates[][] = [
  [
    { x: '9.0', y: '-2.0', z: '6.0' }, { x: '21.0', y: '3.0', z: '6.0' }, { x: '33.0', y: '8.0', z: '8.0' },
    { x: '45.0', y: '12.0', z: '8.0' }, { x: '57.0', y: '16.0', z: '10.0' }, { x: '69.0', y: '20.0', z: '10.0' },
  ],
  [
    { x: '10.0', y: '-1.0', z: '7.0' }, { x: '22.0', y: '4.0', z: '7.0' }, { x: '34.0', y: '9.0', z: '9.0' },
    { x: '46.0', y: '13.0', z: '9.0' }, { x: '58.0', y: '17.0', z: '11.0' }, { x: '70.0', y: '21.0', z: '11.0' },
  ],
  [
    { x: '11.0', y: '0.0', z: '8.0' }, { x: '23.0', y: '5.0', z: '8.0' }, { x: '35.0', y: '10.0', z: '10.0' },
    { x: '47.0', y: '14.0', z: '10.0' }, { x: '59.0', y: '18.0', z: '12.0' }, { x: '71.0', y: '22.0', z: '12.0' },
  ],
  [
    { x: '12.0', y: '1.0', z: '9.0' }, { x: '24.0', y: '6.0', z: '9.0' }, { x: '36.0', y: '11.0', z: '11.0' },
    { x: '48.0', y: '15.0', z: '11.0' }, { x: '60.0', y: '19.0', z: '13.0' }, { x: '72.0', y: '23.0', z: '13.0' },
  ],
];
const compactAssembleResultPointPreviews: ProcessPosePoint[] = [
  { x: '150.0', y: '74.0', z: '0.0', rx: '0.0', ry: '85.0', rz: '0.0' },
  { x: '155.0', y: '79.0', z: '0.0', rx: '0.0', ry: '88.0', rz: '0.0' },
  { x: '160.0', y: '84.0', z: '0.0', rx: '0.0', ry: '85.0', rz: '0.0' },
  { x: '165.0', y: '89.0', z: '0.0', rx: '0.0', ry: '88.0', rz: '0.0' },
];
// 放置路径点位 mock 数据（6 安全点）
const compactPlaceSafePointPreviews: ProcessPointCoordinates[] = [
  { x: '80.0', y: '40.0', z: '0.0' },
  { x: '220.0', y: '40.0', z: '0.0' },
  { x: '360.0', y: '40.0', z: '0.0' },
  { x: '80.0', y: '180.0', z: '0.0' },
  { x: '220.0', y: '180.0', z: '0.0' },
  { x: '360.0', y: '180.0', z: '0.0' },
];
const compactPlaceSafePointDeltaPreviews: ProcessPointCoordinates[] = [
  { x: '8.0', y: '-4.0', z: '0.0' },
  { x: '22.0', y: '-4.0', z: '0.0' },
  { x: '36.0', y: '-4.0', z: '0.0' },
  { x: '8.0', y: '18.0', z: '0.0' },
  { x: '22.0', y: '18.0', z: '0.0' },
  { x: '36.0', y: '18.0', z: '0.0' },
];
// 翻面压紧位置 mock 数据
const compactClampSafePointPreviews: ProcessPointCoordinates[] = [
  { x: '50.0', y: '30.0', z: '15.0' },
  { x: '190.0', y: '30.0', z: '15.0' },
  { x: '330.0', y: '30.0', z: '15.0' },
  { x: '50.0', y: '170.0', z: '15.0' },
  { x: '190.0', y: '170.0', z: '15.0' },
  { x: '330.0', y: '170.0', z: '15.0' },
];
const compactClampSafePointDeltaPreviews: ProcessPointCoordinates[] = [
  { x: '5.0', y: '-3.0', z: '8.0' },
  { x: '19.0', y: '-3.0', z: '8.0' },
  { x: '33.0', y: '-3.0', z: '8.0' },
  { x: '5.0', y: '17.0', z: '8.0' },
  { x: '19.0', y: '17.0', z: '8.0' },
  { x: '33.0', y: '17.0', z: '8.0' },
];
// 定位焊接路径点位 mock 数据（4 组，每组 6 安全点 + 2 结果点）
const compactWeldPathPointPreviews: ProcessPointCoordinates[][] = [
  [
    { x: '100.0', y: '60.0', z: '8.0' }, { x: '220.0', y: '85.0', z: '8.0' }, { x: '340.0', y: '110.0', z: '8.0' },
    { x: '460.0', y: '135.0', z: '8.0' }, { x: '580.0', y: '160.0', z: '8.0' }, { x: '700.0', y: '185.0', z: '8.0' },
  ],
  [
    { x: '105.0', y: '65.0', z: '9.0' }, { x: '225.0', y: '90.0', z: '9.0' }, { x: '345.0', y: '115.0', z: '9.0' },
    { x: '465.0', y: '140.0', z: '9.0' }, { x: '585.0', y: '165.0', z: '9.0' }, { x: '705.0', y: '190.0', z: '9.0' },
  ],
  [
    { x: '110.0', y: '70.0', z: '10.0' }, { x: '230.0', y: '95.0', z: '10.0' }, { x: '350.0', y: '120.0', z: '10.0' },
    { x: '470.0', y: '145.0', z: '10.0' }, { x: '590.0', y: '170.0', z: '10.0' }, { x: '710.0', y: '195.0', z: '10.0' },
  ],
  [
    { x: '115.0', y: '75.0', z: '11.0' }, { x: '235.0', y: '100.0', z: '11.0' }, { x: '355.0', y: '125.0', z: '11.0' },
    { x: '475.0', y: '150.0', z: '11.0' }, { x: '595.0', y: '175.0', z: '11.0' }, { x: '715.0', y: '200.0', z: '11.0' },
  ],
];
const compactWeldPathPointDeltaPreviews: ProcessPointCoordinates[][] = [
  [
    { x: '10.0', y: '-1.0', z: '4.0' }, { x: '22.0', y: '3.0', z: '4.0' }, { x: '34.0', y: '7.0', z: '6.0' },
    { x: '46.0', y: '11.0', z: '6.0' }, { x: '58.0', y: '15.0', z: '8.0' }, { x: '70.0', y: '19.0', z: '8.0' },
  ],
  [
    { x: '11.0', y: '0.0', z: '5.0' }, { x: '23.0', y: '4.0', z: '5.0' }, { x: '35.0', y: '8.0', z: '7.0' },
    { x: '47.0', y: '12.0', z: '7.0' }, { x: '59.0', y: '16.0', z: '9.0' }, { x: '71.0', y: '20.0', z: '9.0' },
  ],
  [
    { x: '12.0', y: '1.0', z: '6.0' }, { x: '24.0', y: '5.0', z: '6.0' }, { x: '36.0', y: '9.0', z: '8.0' },
    { x: '48.0', y: '13.0', z: '8.0' }, { x: '60.0', y: '17.0', z: '10.0' }, { x: '72.0', y: '21.0', z: '10.0' },
  ],
  [
    { x: '13.0', y: '2.0', z: '7.0' }, { x: '25.0', y: '6.0', z: '7.0' }, { x: '37.0', y: '10.0', z: '9.0' },
    { x: '49.0', y: '14.0', z: '9.0' }, { x: '61.0', y: '18.0', z: '11.0' }, { x: '73.0', y: '22.0', z: '11.0' },
  ],
];
const compactWeldResultPointPreviews: ProcessPosePoint[][] = [
  [
    { x: '160.0', y: '72.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '162.0', y: '74.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '165.0', y: '77.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '167.0', y: '79.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '170.0', y: '82.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '172.0', y: '84.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '175.0', y: '87.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '177.0', y: '89.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
];
// 定位焊扫描路径点位 mock 数据（6 组，每组 6 安全点 + 2 结果点）
const compactWeldScanPathPointPreviews: ProcessPointCoordinates[][] = [
  [
    { x: '80.0', y: '55.0', z: '10.0' }, { x: '200.0', y: '80.0', z: '10.0' }, { x: '320.0', y: '105.0', z: '10.0' },
    { x: '440.0', y: '130.0', z: '10.0' }, { x: '560.0', y: '155.0', z: '10.0' }, { x: '680.0', y: '180.0', z: '10.0' },
  ],
  [
    { x: '85.0', y: '60.0', z: '12.0' }, { x: '205.0', y: '85.0', z: '12.0' }, { x: '325.0', y: '110.0', z: '12.0' },
    { x: '445.0', y: '135.0', z: '12.0' }, { x: '565.0', y: '160.0', z: '12.0' }, { x: '685.0', y: '185.0', z: '12.0' },
  ],
  [
    { x: '90.0', y: '65.0', z: '14.0' }, { x: '210.0', y: '90.0', z: '14.0' }, { x: '330.0', y: '115.0', z: '14.0' },
    { x: '450.0', y: '140.0', z: '14.0' }, { x: '570.0', y: '165.0', z: '14.0' }, { x: '690.0', y: '190.0', z: '14.0' },
  ],
  [
    { x: '95.0', y: '70.0', z: '16.0' }, { x: '215.0', y: '95.0', z: '16.0' }, { x: '335.0', y: '120.0', z: '16.0' },
    { x: '455.0', y: '145.0', z: '16.0' }, { x: '575.0', y: '170.0', z: '16.0' }, { x: '695.0', y: '195.0', z: '16.0' },
  ],
  [
    { x: '100.0', y: '75.0', z: '18.0' }, { x: '220.0', y: '100.0', z: '18.0' }, { x: '340.0', y: '125.0', z: '18.0' },
    { x: '460.0', y: '150.0', z: '18.0' }, { x: '580.0', y: '175.0', z: '18.0' }, { x: '700.0', y: '200.0', z: '18.0' },
  ],
  [
    { x: '105.0', y: '80.0', z: '20.0' }, { x: '225.0', y: '105.0', z: '20.0' }, { x: '345.0', y: '130.0', z: '20.0' },
    { x: '465.0', y: '155.0', z: '20.0' }, { x: '585.0', y: '180.0', z: '20.0' }, { x: '705.0', y: '205.0', z: '20.0' },
  ],
];
const compactWeldScanPathPointDeltaPreviews: ProcessPointCoordinates[][] = [
  [
    { x: '8.0', y: '-1.5', z: '5.0' }, { x: '20.0', y: '2.5', z: '5.0' }, { x: '32.0', y: '7.0', z: '7.0' },
    { x: '44.0', y: '11.0', z: '7.0' }, { x: '56.0', y: '15.0', z: '9.0' }, { x: '68.0', y: '18.0', z: '9.0' },
  ],
  [
    { x: '9.0', y: '-0.5', z: '6.0' }, { x: '21.0', y: '3.5', z: '6.0' }, { x: '33.0', y: '8.0', z: '8.0' },
    { x: '45.0', y: '12.0', z: '8.0' }, { x: '57.0', y: '16.0', z: '10.0' }, { x: '69.0', y: '19.0', z: '10.0' },
  ],
  [
    { x: '10.0', y: '0.5', z: '7.0' }, { x: '22.0', y: '4.5', z: '7.0' }, { x: '34.0', y: '9.0', z: '9.0' },
    { x: '46.0', y: '13.0', z: '9.0' }, { x: '58.0', y: '17.0', z: '11.0' }, { x: '70.0', y: '20.0', z: '11.0' },
  ],
  [
    { x: '11.0', y: '1.5', z: '8.0' }, { x: '23.0', y: '5.5', z: '8.0' }, { x: '35.0', y: '10.0', z: '10.0' },
    { x: '47.0', y: '14.0', z: '10.0' }, { x: '59.0', y: '18.0', z: '12.0' }, { x: '71.0', y: '21.0', z: '12.0' },
  ],
  [
    { x: '12.0', y: '2.5', z: '9.0' }, { x: '24.0', y: '6.5', z: '9.0' }, { x: '36.0', y: '11.0', z: '11.0' },
    { x: '48.0', y: '15.0', z: '11.0' }, { x: '60.0', y: '19.0', z: '13.0' }, { x: '72.0', y: '22.0', z: '13.0' },
  ],
  [
    { x: '13.0', y: '3.5', z: '10.0' }, { x: '25.0', y: '7.5', z: '10.0' }, { x: '37.0', y: '12.0', z: '12.0' },
    { x: '49.0', y: '16.0', z: '12.0' }, { x: '61.0', y: '20.0', z: '14.0' }, { x: '73.0', y: '23.0', z: '14.0' },
  ],
];
const compactWeldScanResultPointPreviews: ProcessPosePoint[][] = [
  [
    { x: '140.0', y: '70.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '142.0', y: '72.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '145.0', y: '75.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '147.0', y: '77.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '150.0', y: '80.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '152.0', y: '82.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '155.0', y: '85.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '157.0', y: '87.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '160.0', y: '90.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '162.0', y: '92.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '165.0', y: '95.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '167.0', y: '97.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
];
const compactCombinedWeldPathPointPreviews: ProcessPointCoordinates[][] = [
  ...compactWeldPathPointPreviews,
  ...compactWeldScanPathPointPreviews.slice(4).map((group) =>
    group.map((point) => ({ ...point, z: (Number(point.z) - 6).toFixed(1) }))
  ),
];
const compactCombinedWeldResultPointPreviews: ProcessPosePoint[][] = [
  ...compactWeldResultPointPreviews,
  [
    { x: '180.0', y: '92.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '182.0', y: '94.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
  [
    { x: '185.0', y: '97.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '187.0', y: '99.5', z: '0.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ],
];
type ProcessCardUiSpec = {
  resultTitle: string;
  resultSubtitle?: string;
  resultKind: ProcessPointLayoutKind;
  pathSubtitle?: string;
  showPathPanel: boolean;
};

type Project = {
  id: string;
  name: string;
  tree: TreeNode;
  processSteps: ProcessStep[];
  hasAssemblyDrawing?: boolean;
  datums?: {
    id: string;
    name: string;
    partAId: string;
    partBId: string;
    edgeModelUrl: string;
  }[];
};

type CreateModelFlow = {
  draftKey: string;
  target: 'project' | 'group0162';
  projectId?: string;
  assemblyId: string;
  assemblyName: string;
  stage: 'missing-assembly' | 'assembly-imported' | 'complete';
  failedPartIds: string[];
};

const COMPLETE_DRAWING_PROJECT_IDS = new Set(['0162-01-010101']);

const hasAlternatingDemoPartDrawing = (partId: string) => {
  const lastChar = partId.slice(-1);
  return lastChar >= '0' && lastChar <= '9' ? parseInt(lastChar, 10) % 2 === 0 : true;
};

const createDemoPointRows = () => Array.from({ length: 6 }, () => ({ x: '', y: '', z: '' }));
const createPosePointRows = (count: number) => Array.from({ length: count }, () => ({ x: '', y: '', z: '', rx: '', ry: '', rz: '' }));
const createPickPathPointRows = () => Array.from({ length: 6 }, () => ({ x: '', y: '', z: '', rx: '', ry: '', rz: '', enabled: true }));
const createPickPathPointsFromCoordinates = (points: ProcessPointCoordinates[]): PickPathPoint[] =>
  points.slice(0, 6).map((point) => ({ ...point, rx: '0.0', ry: '0.0', rz: '0.0', enabled: true }));
const createDefaultGeneratedPathPoints = (
  step?: ProcessStep,
  segmentIndex = 0,
  combinedWeldMode: CombinedWeldPathMode = 'weld'
): PickPathPoint[] => {
  if (step?.type === 'polish') return createPickPathPointsFromCoordinates(compactGrindSafePointPreviews);
  if (step?.type === 'assemble') {
    return createPickPathPointsFromCoordinates(compactAssemblePathPointPreviews[segmentIndex] ?? compactAssemblePathPointPreviews[0] ?? compactPathPointPreviews);
  }
  if (step?.type === 'weld') {
    return createPickPathPointsFromCoordinates(compactWeldPathPointPreviews[segmentIndex] ?? compactWeldPathPointPreviews[0] ?? compactPathPointPreviews);
  }
  if (step?.type === 'weld-scan') {
    return createPickPathPointsFromCoordinates(compactWeldScanPathPointPreviews[segmentIndex] ?? compactWeldScanPathPointPreviews[0] ?? compactPathPointPreviews);
  }
  if (step?.type === 'weld-combined') {
    const previews = combinedWeldMode === 'scan' ? compactWeldScanPathPointPreviews : compactCombinedWeldPathPointPreviews;
    return createPickPathPointsFromCoordinates(previews[segmentIndex] ?? previews[0] ?? compactPathPointPreviews);
  }
  return createPickPathPointsFromCoordinates(compactPathPointPreviews);
};
const createWeldPosePointRows = () => createPosePointRows(8);
const createPathPointGroups = (groupCount: number, step?: ProcessStep) =>
  Array.from({ length: groupCount }, (_, segmentIndex) => (step ? createDefaultGeneratedPathPoints(step, segmentIndex) : createPickPathPointRows()));
const createWeldPathPointGroups = (step?: ProcessStep) => createPathPointGroups(4, step);
const createDemoJointRows = () => ['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30', '6.80', '91.20'];
const createGeneratedPlacePoints = () => [
  { x: '80.0', y: '40.0', z: '0.0' },
  { x: '220.0', y: '40.0', z: '0.0' },
  { x: '360.0', y: '40.0', z: '0.0' },
  { x: '80.0', y: '180.0', z: '0.0' },
  { x: '220.0', y: '180.0', z: '0.0' },
  { x: '360.0', y: '180.0', z: '0.0' },
];
const createGeneratedPlaceJointRows = () => ['120.00', '0.00', '18.20', '36.80', '72.40', '-44.60', '28.30', '91.20'];
const createGeneratedGrindPosePoints = (): ProcessPosePoint[] => [
  { x: '110.0', y: '52.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '260.0', y: '52.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '410.0', y: '52.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '110.0', y: '168.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '260.0', y: '168.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
  { x: '410.0', y: '168.0', z: '10.0', rx: '0.0', ry: '90.0', rz: '0.0' },
];
const createGeneratedAssemblePosePoints = (): ProcessPosePoint[] => [
  { x: '90.0', y: '60.0', z: '12.0', rx: '0.0', ry: '85.0', rz: '0.0' },
  { x: '210.0', y: '88.0', z: '12.0', rx: '0.0', ry: '88.0', rz: '0.0' },
  { x: '330.0', y: '116.0', z: '12.0', rx: '0.0', ry: '85.0', rz: '0.0' },
  { x: '450.0', y: '144.0', z: '12.0', rx: '0.0', ry: '88.0', rz: '0.0' },
  { x: '570.0', y: '172.0', z: '12.0', rx: '0.0', ry: '85.0', rz: '0.0' },
  { x: '690.0', y: '200.0', z: '12.0', rx: '0.0', ry: '88.0', rz: '0.0' },
];
const createGeneratedWeldPosePoints = (type: 'weld' | 'weld-scan'): ProcessPosePoint[] => {
  const weldPathPoints = [
    { x: '100.0', y: '70.0', z: '8.0' },
    { x: '220.0', y: '90.0', z: '8.0' },
    { x: '340.0', y: '110.0', z: '8.0' },
    { x: '460.0', y: '130.0', z: '8.0' },
    { x: '580.0', y: '150.0', z: '8.0' },
    { x: '700.0', y: '170.0', z: '8.0' },
    { x: '820.0', y: '190.0', z: '8.0' },
    { x: '940.0', y: '210.0', z: '8.0' },
  ];
  const nextPoints = type === 'weld-scan' ? weldPathPoints.slice(0, 6) : weldPathPoints;
  return nextPoints.map((point, pointIndex) => ({
    ...point,
    rx: '0.0',
    ry: '0.0',
    rz: pointIndex % 2 === 0 ? '45.0' : '48.0',
  }));
};

const createDemoPickConfig = (workpieceIds: string[]): PickProcessConfig => ({
  namingMode: 'process-part',
  workpieceIds,
  gripperType: '桁架抓具',
  magnetSettings: createDefaultPickMagnetSettings(),
  coverageOverride: '',
  safetyCoefficientOverride: '',
  eccentricThresholdOverride: '',
  actualCoverage: '',
  actualLoadCoefficient: '',
  actualEccentricDistance: '',
  magnetPosition: { x: '', y: '', z: '', rx: '', ry: '', rz: '' },
  pathPoints: createPickPathPointRows(),
});

const createGeneratedPickConfig = (workpieceIds: string[]): PickProcessConfig =>
  (() => {
    const config = {
      ...createDemoPickConfig(workpieceIds),
      magnetPosition: { x: '', y: '240.0', z: '96.0', rx: '0.0', ry: '0.0', rz: '0.0' },
      pathPoints: createPickPathPointsFromCoordinates(compactPathPointPreviews),
    };
    return {
      ...config,
      ...calculatePickActualMetrics(config.gripperType, config.magnetSettings, config.magnetPosition),
    };
  })();

const createDemoPlaceConfig = (workpieceIds: string[]): PlaceProcessConfig => ({
  workpieceIds,
  workbenchType: '主筋板正面装配平台',
  supportIds: ['1', '2'],
  points: createDemoPointRows(),
  pathPoints: createPickPathPointRows(),
  joints: createDemoJointRows(),
});

const createGeneratedPlaceConfig = (workpieceIds: string[]): PlaceProcessConfig => ({
  ...createDemoPlaceConfig(workpieceIds),
  points: [
    { x: '80.0', y: '40.0', z: '0.0' },
    { x: '220.0', y: '40.0', z: '0.0' },
    { x: '360.0', y: '40.0', z: '0.0' },
    { x: '80.0', y: '180.0', z: '0.0' },
    { x: '220.0', y: '180.0', z: '0.0' },
    { x: '360.0', y: '180.0', z: '0.0' },
  ],
});

const createDemoClampConfig = (workpieceIds: string[]): PlaceProcessConfig => ({
  workpieceIds,
  workbenchType: '主筋板正面装配平台',
  supportIds: ['1', '2'],
  clampIds: ['1', '2'],
  points: createDemoPointRows(),
  pathPoints: createPickPathPointRows(),
  joints: createDemoJointRows(),
});

const createGeneratedClampConfig = (workpieceIds: string[]): PlaceProcessConfig => ({
  ...createDemoClampConfig(workpieceIds),
  points: compactClampSafePointPreviews,
});

const createDemoFeatureConfig = (featureIds: string[] = []): FeatureProcessConfig => ({
  featureIds,
  points: createDemoPointRows(),
  posePoints: createPosePointRows(6),
  pathPoints: createPickPathPointRows(),
  pathPointGroups: createWeldPathPointGroups(),
  grindParams: createDefaultGrindProcessParams(),
  assembleParams: createDefaultAssembleProcessParams(),
});

const createGeneratedGrindConfig = (featureIds: string[] = [], path?: GrindFeaturePath): FeatureProcessConfig => {
  const generatedPath = path ? createGeneratedGrindPath(path) : null;
  const posePoints = generatedPath?.resultPoints ?? compactGrindResultPointPreviews;
  const pathPoints = generatedPath?.safePoints ?? createPickPathPointsFromCoordinates(compactGrindSafePointPreviews);
  return {
    ...createDemoFeatureConfig(featureIds),
    posePoints,
    points: posePoints.map(({ x, y, z }) => ({ x, y, z })),
    pathPoints,
    pathPointGroups: [pathPoints],
  };
};

const isDefaultGrindFallbackConfig = (config?: FeatureProcessConfig) => {
  if (!config) return false;
  const posePoints = normalizeFeaturePosePoints(config.points, config.posePoints).slice(0, compactGrindResultPointPreviews.length);
  return posePoints.length === compactGrindResultPointPreviews.length && posePoints.every((point, index) => {
    const fallbackPoint = compactGrindResultPointPreviews[index];
    return fallbackPoint && pickPathAxes.every((axis) => point[axis] === fallbackPoint[axis]);
  });
};

const createGeneratedAssembleConfig = (featureIds: string[] = []): FeatureProcessConfig => ({
  ...createDemoFeatureConfig(featureIds),
  posePoints: compactAssembleResultPointPreviews,
  points: compactAssembleResultPointPreviews.map(({ x, y, z }) => ({ x, y, z })),
  pathPoints: createPickPathPointsFromCoordinates(compactAssemblePathPointPreviews[0]),
  pathPointGroups: createPathPointGroups(compactAssembleResultPointPreviews.length),
});

const createGeneratedWeldConfig = (featureIds: string[] = [], params?: WeldProcessParams): FeatureProcessConfig => ({
  ...createDemoFeatureConfig(featureIds),
  posePoints: compactWeldResultPointPreviews.flat(),
  points: compactWeldResultPointPreviews.flat().map(({ x, y, z }) => ({ x, y, z })),
  pathPointGroups: createWeldPathPointGroups(),
  weldParams: { ...createDefaultWeldProcessParams(), ...(params ?? {}) },
});

const createGeneratedWeldScanConfig = (featureIds: string[] = [], params?: WeldProcessParams): FeatureProcessConfig => ({
  ...createDemoFeatureConfig(featureIds),
  posePoints: compactWeldScanResultPointPreviews.flat(),
  points: compactWeldScanResultPointPreviews.flat().map(({ x, y, z }) => ({ x, y, z })),
  pathPointGroups: createPathPointGroups(compactWeldScanPathPointPreviews.length),
  weldParams: { ...createDefaultWeldProcessParams(), ...(params ?? {}) },
});

const createGeneratedCombinedWeldConfig = (
  featureIds: string[] = [],
  scanParams?: WeldProcessParams,
  weldingParams?: WeldProcessParams
): Pick<ProcessStep, 'weldConfig' | 'weldScanConfig'> => ({
  weldScanConfig: {
    ...createGeneratedWeldScanConfig(featureIds, scanParams),
    pathPointGroups: createPathPointGroups(compactWeldScanPathPointPreviews.length),
  },
  weldConfig: {
    ...createDemoFeatureConfig(featureIds),
    posePoints: compactCombinedWeldResultPointPreviews.flat(),
    points: compactCombinedWeldResultPointPreviews.flat().map(({ x, y, z }) => ({ x, y, z })),
    pathPoints: createPickPathPointsFromCoordinates(compactCombinedWeldPathPointPreviews[0]),
    pathPointGroups: compactCombinedWeldPathPointPreviews.map(createPickPathPointsFromCoordinates),
    weldParams: { ...createDefaultWeldProcessParams(), ...(weldingParams ?? {}) },
  },
});

function createFlatAssemblyTree(assemblyId: string, assemblyName = assemblyId): TreeNode {
  return {
    id: assemblyId,
    name: assemblyName,
    children: [
      {
        id: `${assemblyId}-01`,
        name: `${assemblyName}-01`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-01.stl`,
      },
      {
        id: `${assemblyId}-02`,
        name: `${assemblyName}-02`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl`,
      },
      {
        id: `${assemblyId}-03`,
        name: `${assemblyName}-03`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl`,
      },
      {
        id: `${assemblyId}-04`,
        name: `${assemblyName}-04`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl`,
      },
      {
        id: `${assemblyId}-01-front`,
        name: '工作面正面',
      },
      {
        id: `${assemblyId}-01-back`,
        name: '工作面反面',
      },
    ],
  };
}

function createArrangedAssemblyTree(assemblyId: string, assemblyName = assemblyId): TreeNode {
  return {
    id: assemblyId,
    name: assemblyName,
    children: [
      {
        id: `${assemblyId}-01`,
        name: `${assemblyName}-01`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-01.stl`,
        children: [
          {
            id: `${assemblyId}-01-front`,
            name: '工作面正面',
            children: [
              {
                id: `${assemblyId}-02`,
                name: `${assemblyName}-02`,
                modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl`,
              },
            ],
          },
          {
            id: `${assemblyId}-01-back`,
            name: '工作面反面',
            children: [
              {
                id: `${assemblyId}-03`,
                name: `${assemblyName}-03`,
                modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl`,
                children: [
                  {
                    id: `${assemblyId}-04`,
                    name: `${assemblyName}-04`,
                    modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl`,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function createLinkedRodAssemblyTree(assemblyId = '0162-04-040404', assemblyName = assemblyId): TreeNode {
  return {
    id: assemblyId,
    name: assemblyName,
    children: Array.from({ length: 10 }, (_, index) => {
      const partNumber = String(index + 1).padStart(2, '0');
      return {
        id: `${assemblyId}-${partNumber}`,
        name: `${assemblyName}-${partNumber}`,
        modelPath: `${ASSET_BASE}models/0162-04-040404/0162-04-040404-${partNumber}.stl`,
      };
    }),
  };
}

const initialProjects: Project[] = [
  {
    id: '0162-01-010101',
    name: '0162-01-010101',
    tree: {
      id: '0162-01-010101',
      name: '0162-01-010101',
      children: [
        {
          id: '0162-01-010101-01',
          name: '0162-01-010101-01',
          modelPath: `${ASSET_BASE}models/0162-01-010101-01.stl`,
          children: [
            {
              id: '0162-01-010101-01-front',
              name: '工作面正面',
              children: [
                {
                  id: '0162-01-010101-02',
                  name: '0162-01-010101-02',
                  modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl`,
                },
              ],
            },
            {
              id: '0162-01-010101-01-back',
              name: '工作面反面',
              children: [
                {
                  id: '0162-01-010101-03',
                  name: '0162-01-010101-03',
                  modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl`,
                  children: [
                    {
                      id: '0162-01-010101-04',
                      name: '0162-01-010101-04',
                      modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    processSteps: [],
    hasAssemblyDrawing: true,
  },
  {
    id: '0162-02-020202',
    name: '0162-02-020202',
    tree: {
      id: '0162-02-020202',
      name: '0162-02-020202',
      children: [
        {
          id: '0162-02-020202-01',
          name: '0162-02-020202-01',
          modelPath: `${ASSET_BASE}models/0162-01-010101-01.stl`,
          children: [
            {
              id: '0162-02-020202-01-front',
              name: '工作面正面',
              children: [
                {
                  id: '0162-02-020202-02',
                  name: '0162-02-020202-02',
                  modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl`,
                },
              ],
            },
            {
              id: '0162-02-020202-01-back',
              name: '工作面反面',
              children: [
                {
                  id: '0162-02-020202-03',
                  name: '0162-02-020202-03',
                  modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl`,
                  children: [
                    {
                      id: '0162-02-020202-04',
                      name: '0162-02-020202-04',
                      modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    processSteps: [
      { board: '0162-02-020202-01', action: '抓取', type: 'pick' },
      { board: '0162-02-020202-01', action: '打磨', type: 'polish' },
      { board: '0162-02-020202-01', action: '焊接', type: 'weld' },
      { board: '0162-02-020202-02', action: '抓取', type: 'pick' },
      { board: '0162-02-020202-02', action: '打磨', type: 'polish' },
      { board: '0162-02-020202-03', action: '抓取', type: 'pick' },
      { board: '0162-02-020202-03', action: '打磨', type: 'polish' },
      { board: '0162-02-020202-04', action: '抓取', type: 'pick' },
      { board: '0162-02-020202-04', action: '打磨', type: 'polish' },
      { board: '0162-02-020202-03 / 0162-02-020202-04', action: '焊接', type: 'weld' },
      { board: '0162-02-020202-02 / 0162-02-020202-03', action: '抓取', type: 'pick' },
      { board: '0162-02-020202-02 / 0162-02-020202-03', action: '打磨', type: 'polish' },
      { board: '0162-02-020202-02 / 0162-02-020202-03', action: '焊接', type: 'weld' },
    ],
    hasAssemblyDrawing: false,
  },
  {
    id: '0162-03-030303',
    name: '0162-03-030303',
    tree: createFlatAssemblyTree('0162-03-030303'),
    processSteps: [
      { board: '0162-03-030303-01', action: '抓取', type: 'pick' },
      { board: '0162-03-030303-01', action: '打磨', type: 'polish' },
      { board: '0162-03-030303-01', action: '焊接', type: 'weld' },
      { board: '0162-03-030303-02', action: '抓取', type: 'pick' },
      { board: '0162-03-030303-02', action: '打磨', type: 'polish' },
      { board: '0162-03-030303-03', action: '抓取', type: 'pick' },
      { board: '0162-03-030303-03', action: '打磨', type: 'polish' },
      { board: '0162-03-030303-04', action: '抓取', type: 'pick' },
      { board: '0162-03-030303-04', action: '打磨', type: 'polish' },
      { board: '0162-03-030303-03 / 0162-03-030303-04', action: '焊接', type: 'weld' },
      { board: '0162-03-030303-02 / 0162-03-030303-03', action: '抓取', type: 'pick' },
      { board: '0162-03-030303-02 / 0162-03-030303-03', action: '打磨', type: 'polish' },
      { board: '0162-03-030303-02 / 0162-03-030303-03', action: '焊接', type: 'weld' },
    ],
    hasAssemblyDrawing: true,
  },
  {
    id: '0162-04-040404',
    name: '0162-04-040404',
    tree: createLinkedRodAssemblyTree(),
    processSteps: [],
    hasAssemblyDrawing: true,
  },
];

const defaultProject = initialProjects[0];
const demoAssemblyTemplate = initialProjects[0].tree;
const createDemoAssemblyTree = (assemblyId: string, assemblyName = '0162-01-010101'): TreeNode => ({
  id: assemblyId,
  name: assemblyName,
  children: [
    {
      id: `${assemblyId}-01`,
      name: `${assemblyName}-01`,
      modelPath: demoAssemblyTemplate.children?.[0]?.modelPath ?? `${ASSET_BASE}models/0162-01-010101-01.stl`,
      children: [
        {
          id: `${assemblyId}-01-front`,
          name: '工作面正面',
          children: [
            {
              id: `${assemblyId}-02`,
              name: `${assemblyName}-02`,
              modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl`,
            },
          ],
        },
        {
          id: `${assemblyId}-01-back`,
          name: '工作面反面',
          children: [
            {
              id: `${assemblyId}-03`,
              name: `${assemblyName}-03`,
              modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl`,
              children: [
                {
                  id: `${assemblyId}-04`,
                  name: `${assemblyName}-04`,
                  modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl`,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
const initialProcessStepCounts = Object.fromEntries(
  initialProjects.map((project) => [project.id, project.processSteps.length])
) as Record<string, number>;
const generatedProcessStepDefaultOrder = [
  'generated-pick-01',
  'generated-place-01',
  'generated-grind-01',
  'generated-pick-02',
  'generated-place-02',
  'generated-grind-02',
  'generated-assemble-02',
  'generated-clamp-02-01',
  'generated-weld-scan-02-01',
  'generated-weld-02-01',
  'generated-weld-combined-02-01',
  'generated-pick-03',
  'generated-place-03',
  'generated-grind-03',
  'generated-assemble-03',
  'generated-clamp-03-02-01',
  'generated-weld-scan-03-02-01',
  'generated-weld-03-02-01',
  'generated-weld-combined-03-02-01',
  'generated-pick-04',
  'generated-place-04',
  'generated-grind-04',
  'generated-assemble-04',
  'generated-clamp-04-03-02-01',
  'generated-weld-scan-04-03-02-01',
  'generated-weld-04-03-02-01',
  'generated-weld-combined-04-03-02-01',
] as const;
const generatedProcessStepDefaultRank = new Map<string, number>(
  generatedProcessStepDefaultOrder.map((stepId, index) => [stepId, index])
);
const processParameterTabs = [
  { key: 'pick', label: '抓取工艺参数设置' },
  { key: 'workbench', label: '工作台参数设置' },
  { key: 'grind', label: '打磨工艺参数设置' },
  { key: 'assemble', label: '装配定位工艺参数设置' },
  { key: 'weld', label: '定位焊工艺参数设置' },
] as const;

function getProcessSteps(project: Project) {
  return project.processSteps.map((step) => {
    if (step.type === 'pick') return { ...step, action: '抓取', type: 'pick' };
    if (step.type === 'place') return { ...step, action: '放置', type: 'place' };
    if (step.type === 'polish') return { ...step, action: '打磨', type: 'polish' };
    if (step.type === 'assemble') return { ...step, action: '装配', type: 'assemble' };
    if (step.type === 'clamp' || step.type === 'turnover-clamp') return { ...step, action: '翻面压紧', type: 'turnover-clamp' };
    if (step.type === 'weld-combined') return { ...step, action: '焊接', type: 'weld-combined' };
    if (step.type === 'weld-scan') return { ...step, action: '定位焊扫描', type: 'weld-scan' };
    if (step.type === 'weld') return { ...step, action: '焊接', type: 'weld' };
    return step;
  });
}

function getProcessStepKey(step: ProcessStep, index: number) {
  return step.id ?? `${step.board}-${step.action}-${index}`;
}

function toSimulationPosePoints(points: Array<Partial<ProcessPosePoint>> | undefined): SimulationPosePoint[] {
  return (points ?? []).map((point) => ({
    x: point.x ?? '0.0',
    y: point.y ?? '0.0',
    z: point.z ?? '0.0',
    rx: point.rx ?? '0.0',
    ry: point.ry ?? '0.0',
    rz: point.rz ?? '0.0',
  }));
}

async function createSimulationWeldPosePoints(
  sourcePoints: Array<Partial<ProcessPosePoint>> | undefined,
  weldFeatureUrls: string[],
): Promise<SimulationPosePoint[]> {
  const fallbackPoints = toSimulationPosePoints(sourcePoints);
  const weldFeatureUrl = weldFeatureUrls[0];
  if (!weldFeatureUrl) return fallbackPoints;

  try {
    const weldFeaturePath = await loadWeldFeaturePath(weldFeatureUrl);
    return toSimulationPosePoints(createWeldFeatureSegmentPosePoints(
      weldFeaturePath,
      SIMULATION_WELD_SEGMENT_COUNT,
    ));
  } catch {
    return fallbackPoints;
  }
}

const SIMULATION_WELD_SEGMENT_COUNT = 6;
const DEFAULT_SIMULATION_SCAN_Z_OFFSET = 80;

function createSimulationScanPosePoints(
  weldPosePoints: SimulationPosePoint[],
  scanPosePointTemplates: SimulationPosePoint[],
  offsetZ: string | undefined,
): SimulationPosePoint[] {
  const configuredOffset = Number(offsetZ);
  const scanZOffset = Number.isFinite(configuredOffset) && configuredOffset > 0
    ? configuredOffset
    : DEFAULT_SIMULATION_SCAN_Z_OFFSET;

  return weldPosePoints.map((weldPoint, pointIndex) => {
    const scanTemplate = scanPosePointTemplates[pointIndex];
    const weldZ = Number(weldPoint.z);
    return {
      ...weldPoint,
      rx: scanTemplate?.rx ?? weldPoint.rx,
      ry: scanTemplate?.ry ?? weldPoint.ry,
      rz: scanTemplate?.rz ?? weldPoint.rz,
      z: (Number.isFinite(weldZ) ? weldZ + scanZOffset : scanZOffset).toFixed(3),
    };
  });
}

function createSimulationWeldSegments(
  sourceStepKey: string,
  scanPosePoints: SimulationPosePoint[],
  weldPosePoints: SimulationPosePoint[],
  weldFeatureNames: string[],
): SimulationWeldSegment[] {
  return Array.from({ length: SIMULATION_WELD_SEGMENT_COUNT }, (_, segmentIndex) => {
    const index = segmentIndex + 1;
    const featureName = weldFeatureNames[segmentIndex] ?? weldFeatureNames[0] ?? '焊缝';
    return {
      id: `${sourceStepKey}-weld-segment-${index}`,
      index,
      name: `焊缝段${index}`,
      featureName: `${featureName} · 焊缝段${index}`,
      scanPosePoints: scanPosePoints.slice(segmentIndex * 2, segmentIndex * 2 + 2),
      weldPosePoints: weldPosePoints.slice(segmentIndex * 2, segmentIndex * 2 + 2),
      defaultRobot: segmentIndex < SIMULATION_WELD_SEGMENT_COUNT / 2 ? 'robot1' : 'robot2',
    };
  });
}

function offsetSimulationAxisValues(
  axisValues: SimulationSourceTask['supportAxisValues'],
  offsets: number[],
) {
  return axisValues.map((axis, index) => {
    const value = Number(axis.value);
    const offset = offsets[index] ?? 0;
    return {
      ...axis,
      value: Number.isFinite(value) ? (value + offset).toFixed(2) : axis.value,
    };
  });
}

function getSimulationNavigationTaskSubtitle(workspace: SimulationWorkspace) {
  const sourceName = workspace.sourceKind === 'process-planning'
    ? workspace.tasks[0]?.assemblyId ?? workspace.displayName
    : workspace.sourceFileName ?? workspace.displayName;
  return `${workspace.sourceKind === 'process-planning' ? '工艺规划' : '本地导入'} · ${sourceName}`;
}

function createEmptyPickProcessConfig(): PickProcessConfig {
  return {
    namingMode: 'process-part',
    workpieceIds: [],
    gripperType: '桁架抓具',
    magnetSettings: createDefaultPickMagnetSettings(),
    coverageOverride: '',
    safetyCoefficientOverride: '',
    eccentricThresholdOverride: '',
    actualCoverage: '',
    actualLoadCoefficient: '',
    actualEccentricDistance: '',
    magnetPosition: { x: '', y: '', z: '', rx: '', ry: '', rz: '' },
    pathPoints: createPickPathPointRows(),
  };
}

function createEmptyPlaceProcessConfig(): PlaceProcessConfig {
  return {
    workpieceIds: [],
    workbenchType: '主筋板正面装配平台',
    supportIds: ['1', '2'],
    points: Array.from({ length: 6 }, () => ({ x: '', y: '', z: '' })),
    pathPoints: createPickPathPointRows(),
    joints: Array.from({ length: 8 }, () => ''),
  };
}

function createEmptyTurnoverClampProcessConfig(): PlaceProcessConfig {
  return {
    workpieceIds: [],
    workbenchType: '主筋板正面装配平台',
    supportIds: ['1', '2'],
    clampIds: ['1', '2'],
    points: Array.from({ length: 6 }, () => ({ x: '', y: '', z: '' })),
    pathPoints: createPickPathPointRows(),
    joints: Array.from({ length: 8 }, () => ''),
  };
}

function createEmptyFeatureProcessConfig(): FeatureProcessConfig {
  return {
    featureIds: [],
    points: Array.from({ length: 6 }, () => ({ x: '', y: '', z: '' })),
    posePoints: createPosePointRows(6),
    pathPoints: createPickPathPointRows(),
    pathPointGroups: createWeldPathPointGroups(),
    grindParams: createDefaultGrindProcessParams(),
    assembleParams: createDefaultAssembleProcessParams(),
  };
}

function createDefaultGrindProcessParams(): GrindProcessParams {
  return {
    toolMode: 'inhand',
    width: '12',
    speed: '80',
    force: '80',
    rpm: '3000',
    axisAngle: '15',
    swingAmplitude: '60',
    prePressureHeight: '30',
    progressivePrePressureHeight: '20',
    safePointHeight: '100',
    samplingDensity: '10',
    offsetX: '0',
    offsetY: '0',
    offsetZ: '120',
    pathMergeEnabled: true,
    mergeLinearLinearAngle: '15',
    mergeLinearLinearAngleMin: '0',
    mergeLinearLinearAngleMax: '15',
    mergeLinearArcAngle: '10',
    mergeLinearArcAngleMin: '0',
    mergeLinearArcAngleMax: '10',
    mergeArcArcAngle: '10',
    mergeArcArcAngleMin: '0',
    mergeArcArcAngleMax: '10',
    dualMachineSafetyDistance: '500',
  };
}

function cloneGrindProcessParams(params?: GrindProcessParams) {
  return { ...createDefaultGrindProcessParams(), ...(params ?? {}) };
}

function createDefaultAssembleProcessParams(): AssembleProcessParams {
  return {
    scanDistance: '250',
    scanDirection: '逆时针',
    offsetX: '0',
    offsetY: '0',
    offsetZ: '120',
    poseRx: '0',
    poseRy: '0',
    poseRz: '90',
    sampleShape: '直线',
    lineSampleMode: '距离',
    arcSampleMode: '弦长',
    sampleValue: '50',
    roughOffsetX: '15',
    roughOffsetY: '15',
    roughOffsetProtectThreshold: '80',
  };
}

function cloneAssembleProcessParams(params?: AssembleProcessParams) {
  return { ...createDefaultAssembleProcessParams(), ...(params ?? {}) };
}

function createDefaultWeldProcessParams(): WeldProcessParams {
  return {
    weldLegHeight: '6',
    scanDistance: '180',
    scanOffsetX: '0',
    scanOffsetY: '0',
    scanOffsetZ: '80',
    scanPoseRx: '0',
    scanPoseRy: '0',
    scanPoseRz: '90',
  };
}

function cloneWeldProcessParams(params?: WeldProcessParams) {
  return { ...createDefaultWeldProcessParams(), ...(params ?? {}) };
}

function createFeatureProcessConfigWithParams(params: {
  grindParams?: GrindProcessParams;
  assembleParams?: AssembleProcessParams;
  weldParams?: WeldProcessParams;
} = {}): FeatureProcessConfig {
  return {
    ...createEmptyFeatureProcessConfig(),
    ...(params.grindParams ? { grindParams: cloneGrindProcessParams(params.grindParams) } : {}),
    ...(params.assembleParams ? { assembleParams: cloneAssembleProcessParams(params.assembleParams) } : {}),
    ...(params.weldParams ? { weldParams: cloneWeldProcessParams(params.weldParams) } : {}),
  };
}

function normalizeWeldPosePoints(points?: ProcessPosePoint[]) {
  const fallback = createWeldPosePointRows();
  return fallback.map((point, index) => ({ ...point, ...(points?.[index] ?? {}) }));
}

function normalizeFeaturePosePoints(points: { x: string; y: string; z: string }[], posePoints?: ProcessPosePoint[]) {
  const fallback = createPosePointRows(Math.max(1, points.length));
  return fallback.map((point, index) => ({
    ...point,
    ...(points[index] ?? {}),
    ...(posePoints?.[index] ?? {}),
  }));
}

function normalizeProcessPathPoints(
  pathPoints?: PickPathPoint[],
  step?: ProcessStep,
  segmentIndex = 0,
  combinedWeldMode: CombinedWeldPathMode = 'weld'
) {
  const fallback = createDefaultGeneratedPathPoints(step, segmentIndex, combinedWeldMode);
  return fallback.map((point, index) => {
    const sourcePoint = pathPoints?.[index];
    const hasSourceValue = sourcePoint ? [sourcePoint.x, sourcePoint.y, sourcePoint.z, sourcePoint.rx, sourcePoint.ry, sourcePoint.rz].some(Boolean) : false;
    if (!hasSourceValue) return { ...point, enabled: sourcePoint?.enabled ?? true };
    return { ...point, ...(sourcePoint ?? {}), enabled: sourcePoint?.enabled ?? true };
  });
}

function normalizePathPointGroups(
  pathPointGroups: PickPathPoint[][] | undefined,
  groupCount: number,
  step?: ProcessStep,
  combinedWeldMode: CombinedWeldPathMode = 'weld'
) {
  const fallback = Array.from({ length: groupCount }, (_, segmentIndex) =>
    createDefaultGeneratedPathPoints(step, segmentIndex, combinedWeldMode)
  );
  return fallback.map((group, groupIndex) =>
    normalizeProcessPathPoints(pathPointGroups?.[groupIndex] ?? group, step, groupIndex, combinedWeldMode)
  );
}

function getProcessPathPointSegmentCount(step?: ProcessStep, combinedWeldMode: CombinedWeldPathMode = 'weld') {
  if (step?.type === 'assemble') return compactAssemblePathPointPreviews.length;
  if (step?.type === 'weld') return 4;
  if (step?.type === 'weld-scan') return compactWeldScanPathPointPreviews.length;
  if (step?.type === 'weld-combined') {
    return combinedWeldMode === 'scan' ? compactWeldScanPathPointPreviews.length : compactCombinedWeldPathPointPreviews.length;
  }
  return 1;
}

function getProcessPathPoints(
  step?: ProcessStep,
  segmentIndex = 0,
  combinedWeldMode: CombinedWeldPathMode = 'weld'
) {
  if (!step) return createDefaultGeneratedPathPoints();
  if (step.type === 'pick') return normalizeProcessPathPoints(step.pickConfig?.pathPoints, step);
  if (step.type === 'place') return normalizeProcessPathPoints(step.placeConfig?.pathPoints, step);
  if (step.type === 'polish') {
    return normalizeProcessPathPoints(step.grindConfig?.pathPoints, step);
  }
  if (step.type === 'assemble') {
    return normalizePathPointGroups(step.assembleConfig?.pathPointGroups, getProcessPathPointSegmentCount(step), step)[segmentIndex] ?? createDefaultGeneratedPathPoints(step, segmentIndex);
  }
  if (step.type === 'weld' || step.type === 'weld-scan') {
    return normalizePathPointGroups(step.weldConfig?.pathPointGroups, getProcessPathPointSegmentCount(step), step)[segmentIndex] ?? createDefaultGeneratedPathPoints(step, segmentIndex);
  }
  if (step.type === 'weld-combined') {
    const config = combinedWeldMode === 'scan' ? step.weldScanConfig : step.weldConfig;
    return normalizePathPointGroups(
      config?.pathPointGroups,
      getProcessPathPointSegmentCount(step, combinedWeldMode),
      step,
      combinedWeldMode
    )[segmentIndex] ?? createDefaultGeneratedPathPoints(step, segmentIndex, combinedWeldMode);
  }
  return createDefaultGeneratedPathPoints(step, segmentIndex);
}

function getProcessResultPosePreviewPoint(
  step: ProcessStep | undefined,
  pointIndex: number,
  combinedWeldMode: CombinedWeldPathMode = 'weld'
): ProcessPosePoint | undefined {
  if (!step) return undefined;
  if (step.type === 'pick') return step.pickConfig?.magnetPosition;
  if (step.type === 'polish') {
    const config = step.grindConfig;
    return config ? normalizeFeaturePosePoints(config.points, config.posePoints)[pointIndex] : undefined;
  }
  if (step.type === 'assemble') {
    const config = step.assembleConfig;
    return config ? normalizeFeaturePosePoints(config.points, config.posePoints)[pointIndex] : undefined;
  }
  if (step.type === 'weld') {
    return normalizeWeldPosePoints(step.weldConfig?.posePoints)[pointIndex];
  }
  if (step.type === 'weld-scan') {
    const config = step.weldConfig;
    return config ? normalizeFeaturePosePoints(config.points, config.posePoints)[pointIndex] : undefined;
  }
  if (step.type === 'weld-combined') {
    const config = combinedWeldMode === 'scan' ? step.weldScanConfig : step.weldConfig;
    return config ? normalizeFeaturePosePoints(config.points, config.posePoints)[pointIndex] : undefined;
  }
  if (step.type === 'place') {
    const jointValue = step.placeConfig?.joints?.[pointIndex];
    return jointValue === undefined ? undefined : { x: String(Number(jointValue) || 0), y: String(pointIndex * 16), z: '0', rx: '0', ry: '0', rz: String(Number(jointValue) || 0) };
  }
  if (step.type === 'turnover-clamp') {
    const jointValue = step.turnoverClampConfig?.joints?.[pointIndex];
    return jointValue === undefined ? undefined : { x: String(Number(jointValue) || 0), y: String(pointIndex * 16), z: '0', rx: '0', ry: '0', rz: String(Number(jointValue) || 0) };
  }
  return undefined;
}

function updateProcessPathPoints(
  step: ProcessStep,
  pathPoints: PickPathPoint[],
  segmentIndex = 0,
  combinedWeldMode: CombinedWeldPathMode = 'weld'
): ProcessStep {
  if (step.type === 'pick') {
    return {
      ...step,
      pickConfig: {
        ...(step.pickConfig ?? createEmptyPickProcessConfig()),
        pathPoints,
      },
    };
  }
  if (step.type === 'place') {
    return {
      ...step,
      placeConfig: {
        ...(step.placeConfig ?? createEmptyPlaceProcessConfig()),
        pathPoints,
      },
    };
  }
  if (step.type === 'polish') {
    return {
      ...step,
      grindConfig: {
        ...(step.grindConfig ?? createEmptyFeatureProcessConfig()),
        pathPoints,
        pathPointGroups: [pathPoints],
      },
    };
  }
  if (step.type === 'assemble') {
    const nextGroups = normalizePathPointGroups(step.assembleConfig?.pathPointGroups, getProcessPathPointSegmentCount(step), step).map((group, index) =>
      index === segmentIndex ? pathPoints : group
    );
    return {
      ...step,
      assembleConfig: {
        ...(step.assembleConfig ?? createEmptyFeatureProcessConfig()),
        pathPoints: nextGroups[0] ?? pathPoints,
        pathPointGroups: nextGroups,
      },
    };
  }
  if (step.type === 'weld' || step.type === 'weld-scan') {
    const nextGroups = normalizePathPointGroups(step.weldConfig?.pathPointGroups, getProcessPathPointSegmentCount(step)).map((group, index) =>
      index === segmentIndex ? pathPoints : group
    );
    return {
      ...step,
      weldConfig: {
        ...(step.weldConfig ?? createEmptyFeatureProcessConfig()),
        pathPoints: nextGroups[0] ?? pathPoints,
        pathPointGroups: nextGroups,
      },
    };
  }
  if (step.type === 'weld-combined') {
    const configKey = combinedWeldMode === 'scan' ? 'weldScanConfig' : 'weldConfig';
    const currentConfig = step[configKey] ?? createEmptyFeatureProcessConfig();
    const nextGroups = normalizePathPointGroups(
      currentConfig.pathPointGroups,
      getProcessPathPointSegmentCount(step, combinedWeldMode),
      step,
      combinedWeldMode
    ).map((group, index) => (index === segmentIndex ? pathPoints : group));
    return {
      ...step,
      [configKey]: {
        ...currentConfig,
        pathPoints: nextGroups[0] ?? pathPoints,
        pathPointGroups: nextGroups,
      },
    };
  }
  return step;
}

function isProcessStepExpandableType(type: string) {
  return ['pick', 'place', 'turnover-clamp', 'polish', 'assemble', 'weld-combined', 'weld', 'weld-scan'].includes(type);
}

function getCompactProcessDetailTabs(type?: string): { key: CompactProcessDetailTab; label: string }[] {
  if (type === 'assemble') {
    return [{ key: 'path-points', label: '路径点位' }];
  }
  if (type === 'place' || type === 'turnover-clamp') {
    return [{ key: 'parameter-results', label: '工艺参数' }];
  }
  return [
    { key: 'parameter-results', label: '工艺参数' },
    { key: 'path-points', label: '路径点位' },
  ];
}

function getCompactProcessDefaultDetailTab(type?: string): CompactProcessDetailTab {
  return getCompactProcessDetailTabs(type)[0]?.key ?? 'parameter-results';
}

function getCompactProcessEffectiveDetailTab(type: string | undefined, activeTab: CompactProcessDetailTab): CompactProcessDetailTab {
  const tabs = getCompactProcessDetailTabs(type);
  return tabs.some((tab) => tab.key === activeTab) ? activeTab : getCompactProcessDefaultDetailTab(type);
}

function getProcessCardUiSpec(step: ProcessStep): ProcessCardUiSpec {
  if (step.type === 'pick') {
    return {
      resultTitle: '电磁铁位置',
      resultKind: 'pose',
      pathSubtitle: '6个安全点',
      showPathPanel: true,
    };
  }
  if (step.type === 'place' || step.type === 'turnover-clamp') {
    return {
      resultTitle: '结果点位',
      resultSubtitle: 'J1-J8',
      resultKind: 'joint',
      showPathPanel: false,
    };
  }
  if (step.type === 'polish') {
    return {
      resultTitle: '结果点位',
      resultSubtitle: 'P1-6(n) · XYZ/RPY',
      resultKind: 'pose',
      pathSubtitle: '6个安全点',
      showPathPanel: true,
    };
  }
  if (step.type === 'assemble') {
    return {
      resultTitle: '结果点位',
      resultSubtitle: 'P1-3/4(n) · XYZ/RPY',
      resultKind: 'pose',
      pathSubtitle: 'n×6个安全点',
      showPathPanel: true,
    };
  }
  if (step.type === 'weld-scan') {
    return {
      resultTitle: '结果点位',
      resultSubtitle: 'P1-6(n) · XYZ/RPY',
      resultKind: 'pose',
      pathSubtitle: `${getProcessPathPointSegmentCount(step)}组安全点`,
      showPathPanel: true,
    };
  }
  if (step.type === 'weld-combined') {
    return {
      resultTitle: '扫描 / 焊接结果点位',
      resultSubtitle: '各 6 组 · XYZ/RPY',
      resultKind: 'weld-segment-pose',
      pathSubtitle: '扫描与焊接各 6 组安全点',
      showPathPanel: true,
    };
  }
  if (step.type === 'weld') {
    return {
      resultTitle: '结果点位',
      resultSubtitle: 'P1-8 · 4组焊缝段',
      resultKind: 'weld-segment-pose',
      pathSubtitle: '4组安全点',
      showPathPanel: true,
    };
  }
  return {
    resultTitle: '点位信息',
    resultKind: 'xyz',
    showPathPanel: false,
  };
}

function compactProcessName(action: string, names: string[], fallback: string) {
  if (names.length === 0) return fallback;
  const compactName = (name: string) => (name.length > 16 ? `${name.slice(0, 8)}…${name.slice(-5)}` : name);
  const suffix = names.length > 1 ? ` +${names.length - 1}` : '';
  return `${action}${compactName(names[0])}${suffix}`;
}

function getPickProcessDisplayName(step: ProcessStep, index: number) {
  const pickConfig = step.pickConfig;
  const selected = pickConfig?.workpieceIds ?? [];
  const first = selected[0] ?? '';
  if (!selected.length) {
    return step.name || '抓取';
  }
  if (pickConfig?.namingMode === 'part-index') {
    return `${first}-${index + 1}`;
  }
  return `抓取-${first}`;
}

function getRootProcessStepId(stepId?: string) {
  if (!stepId) return '';
  return stepId.replace(/-(place|assemble|turnover-clamp)$/, '');
}

function getStructureTreeDropIndicatorClassName() {
  return 'h-full flex-1 bg-ds-brand-primary';
}

function getProcessSequenceDropIndicatorClassName() {
  return 'h-1 rounded-full bg-ds-brand-primary shadow-[0_0_0_1px_rgba(255,105,0,0.15)]';
}

const modelColors = ['#2f57dd', '#34d399', '#63cbea', '#f87171'];

const detachedFeatureTheme = {
  grind: {
    label: '打磨特征',
    icon: Sparkles,
    container: 'border-teal-200 bg-white',
    item: 'border-teal-200 bg-white text-teal-700 hover:bg-teal-100',
    activeItem: 'border-teal-300 bg-teal-100 text-teal-800 shadow-sm',
    countBadge: 'bg-teal-50 text-teal-600',
  },
  weld: {
    label: '焊接特征',
    icon: Flame,
    container: 'border-orange-200 bg-white',
    item: 'border-orange-200 bg-white text-ds-brand-primary-text hover:bg-orange-100',
    activeItem: 'border-orange-300 bg-orange-100 text-orange-800 shadow-sm',
    countBadge: 'bg-orange-50 text-ds-brand-primary-text',
  },
  datum: {
    label: '装配特征',
    icon: Target,
    container: 'border-blue-200 bg-white',
    item: 'border-blue-200 bg-white text-blue-700 hover:bg-blue-100',
    activeItem: 'border-blue-300 bg-blue-100 text-blue-800 shadow-sm',
    countBadge: 'bg-blue-50 text-blue-600',
  },
} as const;

function getWeldFeatureDefinitions(projectId: string): { parentId: string; node: TreeNode }[] {
  return [
    {
      parentId: `${projectId}-02`,
      node: {
        id: `${projectId}-02-weld-front`,
        name: '正面焊缝',
        nodeType: 'feature',
        featureType: 'weld',
        featureUrl: `${ASSET_BASE}models/intersections/front-intersection.obj`,
        relatedPartIds: [`${projectId}-01`, `${projectId}-02`],
      },
    },
    {
      parentId: `${projectId}-03`,
      node: {
        id: `${projectId}-03-weld-back-1`,
        name: '反面焊缝 1',
        nodeType: 'feature',
        featureType: 'weld',
        featureUrl: `${ASSET_BASE}models/intersections/back-intersection-1.obj`,
        relatedPartIds: [`${projectId}-01`, `${projectId}-03`],
      },
    },
    {
      parentId: `${projectId}-04`,
      node: {
        id: `${projectId}-04-weld-back-2`,
        name: '反面焊缝 2',
        nodeType: 'feature',
        featureType: 'weld',
        featureUrl: `${ASSET_BASE}models/intersections/back-intersection-2.obj`,
        relatedPartIds: [`${projectId}-03`, `${projectId}-04`],
      },
    },
  ];
}

function getGrindFeatureDefinitions(projectId: string): { parentId: string; node: TreeNode }[] {
  return [
    {
      parentId: `${projectId}-01`,
      node: {
        id: `${projectId}-01-grind-1`,
        name: '01 打磨线 1',
        nodeType: 'feature',
        featureType: 'grind',
        featureUrl: `${ASSET_BASE}models/features/01-grind-face-1.obj`,
        relatedPartIds: [`${projectId}-01`, `${projectId}-02`],
        sourceWeldFeatureIds: [`${projectId}-02-weld-front`],
      },
    },
    {
      parentId: `${projectId}-01`,
      node: {
        id: `${projectId}-01-grind-2`,
        name: '01 打磨线 2',
        nodeType: 'feature',
        featureType: 'grind',
        featureUrl: `${ASSET_BASE}models/features/01-grind-face-2.obj`,
        relatedPartIds: [`${projectId}-01`, `${projectId}-03`],
        sourceWeldFeatureIds: [`${projectId}-03-weld-back-1`],
      },
    },
    {
      parentId: `${projectId}-02`,
      node: {
        id: `${projectId}-02-grind`,
        name: '02 打磨线',
        nodeType: 'feature',
        featureType: 'grind',
        featureUrl: `${ASSET_BASE}models/features/02-grind-face.obj`,
        relatedPartIds: [`${projectId}-01`, `${projectId}-02`],
        sourceWeldFeatureIds: [`${projectId}-02-weld-front`],
      },
    },
    {
      parentId: `${projectId}-03`,
      node: {
        id: `${projectId}-03-grind-1`,
        name: '03 打磨线 1',
        nodeType: 'feature',
        featureType: 'grind',
        featureUrl: `${ASSET_BASE}models/features/03-grind-face-1.obj`,
        relatedPartIds: [`${projectId}-01`, `${projectId}-03`],
        sourceWeldFeatureIds: [`${projectId}-03-weld-back-1`],
      },
    },
    {
      parentId: `${projectId}-03`,
      node: {
        id: `${projectId}-03-grind-2`,
        name: '03 打磨线 2',
        nodeType: 'feature',
        featureType: 'grind',
        featureUrl: `${ASSET_BASE}models/features/03-grind-face-2.obj`,
        relatedPartIds: [`${projectId}-03`, `${projectId}-04`],
        sourceWeldFeatureIds: [`${projectId}-04-weld-back-2`],
      },
    },
    {
      parentId: `${projectId}-04`,
      node: {
        id: `${projectId}-04-grind`,
        name: '04 打磨线',
        nodeType: 'feature',
        featureType: 'grind',
        featureUrl: `${ASSET_BASE}models/features/04-grind-face.obj`,
        relatedPartIds: [`${projectId}-03`, `${projectId}-04`],
        sourceWeldFeatureIds: [`${projectId}-04-weld-back-2`],
      },
    },
  ];
}

const structureTreeFeatureOrder: Record<NonNullable<TreeNode['featureType']>, number> = {
  weld: 0,
  grind: 1,
  datum: 2,
};

function compareStructureTreeFeatures(a: TreeNode, b: TreeNode) {
  const aOrder = a.featureType ? structureTreeFeatureOrder[a.featureType] : Number.MAX_SAFE_INTEGER;
  const bOrder = b.featureType ? structureTreeFeatureOrder[b.featureType] : Number.MAX_SAFE_INTEGER;
  return aOrder - bOrder;
}

function appendFeatureNodes(tree: TreeNode, definitions: { parentId: string; node: TreeNode }[]): TreeNode {
  const matchedDefinitions = definitions.filter((definition) => definition.parentId === tree.id);
  const childDefinitions = definitions.filter((definition) => definition.parentId !== tree.id);
  const existingChildren = tree.children || [];
  const existingFeatureChildren = existingChildren.filter((child) => child.nodeType === 'feature');
  const existingObjectChildren = existingChildren.filter((child) => child.nodeType !== 'feature');
  const nextChildren = [
    ...[
      ...matchedDefinitions
        .map((definition) => definition.node)
        .filter((featureNode) => !existingChildren.some((child) => child.id === featureNode.id)),
      ...existingFeatureChildren,
    ].sort(compareStructureTreeFeatures),
    ...existingObjectChildren.map((child) => appendFeatureNodes(child, childDefinitions)),
  ];

  if (nextChildren.length === 0) return tree;
  return { ...tree, children: nextChildren };
}

function collectFeatureNodeDefinitionsByParent(tree: TreeNode): { parentId: string; node: TreeNode }[] {
  const definitions: { parentId: string; node: TreeNode }[] = [];
  for (const child of tree.children || []) {
    if (child.nodeType === 'feature') {
      definitions.push({ parentId: tree.id, node: child });
    } else {
      definitions.push(...collectFeatureNodeDefinitionsByParent(child));
    }
  }
  return definitions;
}

function collectSceneFeatureViews(
  node: TreeNode,
  featureType: TreeNode['featureType'],
  selectedFeatureId?: string | null,
  highlightedFeatureIds: Set<string> = new Set()
): FeatureView[] {
  const features: FeatureView[] = [];
  if (node.nodeType === 'feature' && node.featureType === featureType) {
    const urls = node.featureType === 'datum'
      ? node.datumMeta?.edgeModelUrls ?? (node.featureUrl ? [node.featureUrl] : [])
      : (node.featureUrl ? [node.featureUrl] : []);
    urls.forEach((url, index) => {
      features.push({
        id: `${node.id}-${index}`,
        sourceId: node.id,
        url,
        selected: selectedFeatureId === node.id,
        highlighted: highlightedFeatureIds.has(node.id),
      });
    });
  }
  for (const child of node.children || []) {
    features.push(...collectSceneFeatureViews(child, featureType, selectedFeatureId, highlightedFeatureIds));
  }
  return features;
}

function collectDetachedFeatureItems(node: TreeNode): DetachedFeatureItem[] {
  const features: DetachedFeatureItem[] = [];
  if (node.nodeType === 'feature' && node.featureType) {
    features.push({
      id: node.id,
      name: node.name,
      featureType: node.featureType,
      featureUrl: node.featureUrl,
      relatedPartIds: node.relatedPartIds ?? [],
      sourceWeldFeatureIds: node.sourceWeldFeatureIds,
    });
  }
  for (const child of node.children || []) {
    features.push(...collectDetachedFeatureItems(child));
  }
  return features;
}

function formatRelatedPartSuffixes(partIds: string[]): string {
  return partIds.join(' & ');
}

function collectAllFeatureNodes(node: TreeNode): TreeNode[] {
  const features: TreeNode[] = [];
  if (node.nodeType === 'feature') {
    features.push(node);
  }
  for (const child of node.children || []) {
    features.push(...collectAllFeatureNodes(child));
  }
  return features;
}

// 模拟数据库与模型文件属性数据
interface PartProperties {
  modelName: string;
  material: string;
  weight: string;
  thickness: string;
}

const partPropertiesDB: Record<string, PartProperties> = {
  '0162-01-010101': { modelName: '北煤机拼装产线总成', material: 'Q235B', weight: '856.0 kg', thickness: '-' },
  '0162-01-010101-01': { modelName: '主板', material: 'Q345B', weight: '320.5 kg', thickness: '12.0 mm' },
  '0162-01-010101-02': { modelName: '正面加强板', material: 'Q235B', weight: '45.2 kg', thickness: '8.0 mm' },
  '0162-01-010101-03': { modelName: '反面底板', material: 'Q345B', weight: '38.6 kg', thickness: '10.0 mm' },
  '0162-01-010101-04': { modelName: '底板加强筋', material: 'Q235B', weight: '12.8 kg', thickness: '6.0 mm' },
  '0162-02-020202': { modelName: '侧板焊接产线总成', material: 'Q235B', weight: '620.0 kg', thickness: '-' },
  '0162-02-020202-01': { modelName: '侧板', material: 'Q345B', weight: '280.3 kg', thickness: '12.0 mm' },
  '0162-02-020202-02': { modelName: '正面面板', material: 'Q235B', weight: '52.1 kg', thickness: '8.0 mm' },
  '0162-02-020202-03': { modelName: '反面面板', material: 'Q345B', weight: '48.9 kg', thickness: '10.0 mm' },
  '0162-02-020202-04': { modelName: '面板加强筋', material: 'Q235B', weight: '15.6 kg', thickness: '6.0 mm' },
  '0162-03-030303': { modelName: '顶板装配产线总成', material: 'Q235B', weight: '410.0 kg', thickness: '-' },
  '0162-03-030303-01': { modelName: '顶板', material: 'Q345B', weight: '185.2 kg', thickness: '10.0 mm' },
  '0162-03-030303-02': { modelName: '正面盖板', material: 'Q235B', weight: '35.4 kg', thickness: '6.0 mm' },
  '0162-03-030303-03': { modelName: '反面盖板', material: 'Q345B', weight: '32.7 kg', thickness: '8.0 mm' },
  '0162-03-030303-04': { modelName: '盖板加强筋', material: 'Q235B', weight: '9.3 kg', thickness: '5.0 mm' },
  '0162-04-040404': { modelName: '连杆组件总成', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-01': { modelName: '连杆组件 01', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-02': { modelName: '连杆组件 02', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-03': { modelName: '连杆组件 03', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-04': { modelName: '连杆组件 04', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-05': { modelName: '连杆组件 05', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-06': { modelName: '连杆组件 06', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-07': { modelName: '连杆组件 07', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-08': { modelName: '连杆组件 08', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-09': { modelName: '连杆组件 09', material: 'Q345B', weight: '—', thickness: '-' },
  '0162-04-040404-10': { modelName: '连杆组件 10', material: 'Q345B', weight: '—', thickness: '-' },
};

function findNodeById(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function renameTreeNode(node: TreeNode, id: string, name: string): TreeNode {
  if (node.id === id) return { ...node, name };
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.map((child) => renameTreeNode(child, id, name)),
  };
}

function isDescendant(node: TreeNode, descendantId: string): boolean {
  for (const child of node.children || []) {
    if (child.id === descendantId || isDescendant(child, descendantId)) {
      return true;
    }
  }
  return false;
}

function removeNode(tree: TreeNode, id: string): { newTree: TreeNode; removed: TreeNode | null } {
  if (tree.id === id) {
    return { newTree: tree, removed: null };
  }
  const newTree = { ...tree, children: tree.children ? [...tree.children] : undefined };
  if (!newTree.children) return { newTree, removed: null };

  for (let i = 0; i < newTree.children.length; i++) {
    if (newTree.children[i].id === id) {
      const removed = newTree.children[i];
      newTree.children = [...newTree.children];
      newTree.children.splice(i, 1);
      return { newTree, removed };
    }
    const result = removeNode(newTree.children[i], id);
    if (result.removed) {
      newTree.children = [...newTree.children];
      newTree.children[i] = result.newTree;
      return { newTree, removed: result.removed };
    }
  }
  return { newTree, removed: null };
}

function insertNode(
  tree: TreeNode,
  targetId: string,
  nodeToInsert: TreeNode,
  position: 'before' | 'after',
  nest: boolean
): TreeNode {
  if (tree.id === targetId && nest) {
    return {
      ...tree,
      children: [...(tree.children || []), nodeToInsert],
    };
  }

  if (!tree.children) return tree;

  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i];
    if (child.id === targetId) {
      const newChildren = [...tree.children];
      if (nest) {
        const newChild = { ...child, children: [...(child.children || []), nodeToInsert] };
        newChildren[i] = newChild;
      } else {
        const insertIndex = position === 'before' ? i : i + 1;
        newChildren.splice(insertIndex, 0, nodeToInsert);
      }
      return { ...tree, children: newChildren };
    }
    const inserted = insertNode(child, targetId, nodeToInsert, position, nest);
    if (inserted !== child) {
      const newChildren = [...tree.children];
      newChildren[i] = inserted;
      return { ...tree, children: newChildren };
    }
  }

  return tree;
}

function collectDescendantIds(node: TreeNode, shouldInclude: (node: TreeNode) => boolean = () => true): string[] {
  const ids: string[] = [];
  for (const child of node.children || []) {
    if (!shouldInclude(child)) continue;
    ids.push(child.id);
    ids.push(...collectDescendantIds(child, shouldInclude));
  }
  return ids;
}

function isNodeChecked(node: TreeNode, checkedIds: Set<string>, shouldInclude?: (node: TreeNode) => boolean): boolean {
  if (!node.children?.length) return checkedIds.has(node.id);
  const descendantIds = collectDescendantIds(node, shouldInclude);
  if (descendantIds.length === 0) return checkedIds.has(node.id);
  return descendantIds.every((id) => checkedIds.has(id));
}

function isNodeIndeterminate(node: TreeNode, checkedIds: Set<string>, shouldInclude?: (node: TreeNode) => boolean): boolean {
  if (!node.children?.length) return false;
  const descendantIds = collectDescendantIds(node, shouldInclude);
  const checkedCount = descendantIds.filter((id) => checkedIds.has(id)).length;
  return checkedCount > 0 && checkedCount < descendantIds.length;
}

const ThemedCheckbox = (props: CheckboxProps) => (
  <ConfigProvider theme={{ token: { colorPrimary: '#FF6900' } }}>
    <Checkbox {...props} />
  </ConfigProvider>
);

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`inline-flex rounded-lg bg-ds-bg-segmented p-0.5 ${disabled ? 'opacity-60' : ''}`}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={`h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
              selected ? 'bg-white text-ds-brand-primary-text shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function CompactSwitch({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
        checked ? 'bg-ds-brand-primary' : 'bg-slate-300'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-1'}`} />
    </button>
  );
}

function SolidGearIcon({ className = 'size-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.28 7.28 0 0 0-1.69-.98L14.5 2.42A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42L9.12 5.07c-.6.24-1.16.56-1.69.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.23.4.32.6.22l2.49-1c.53.41 1.09.74 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.6-.24 1.16-.57 1.69-.98l2.49 1c.2.1.47.01.6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
    </svg>
  );
}

const getProjectListCheckboxClassName = (visible: boolean) =>
  `shrink-0 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;

function ObjectSingleSelect({
  items,
  selectedId,
  invalid,
  placeholder = '请选择对象',
  size = 'md',
  onChange,
}: {
  items: { id: string; name: string }[];
  selectedId: string | null;
  invalid?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  onChange: (nextId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) : null;
  const triggerSizeClass =
    size === 'sm'
      ? 'min-h-7 rounded-md px-2 py-1 text-[11px]'
      : 'min-h-9 rounded-lg px-2.5 py-1.5 text-xs';
  const optionSizeClass = size === 'sm' ? 'px-2 py-1.5 text-[11px]' : 'px-2.5 py-2 text-xs';

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const selectItem = (itemId: string | null) => {
    onChange(itemId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-2 border bg-white text-left shadow-none transition-colors hover:border-slate-300 ${triggerSizeClass} ${invalid ? 'border-red-300 bg-red-50/60' : 'border-slate-200'}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedItem ? invalid ? 'text-red-600' : 'text-slate-600' : 'font-normal text-slate-400'}`} title={selectedItem?.name}>
          {selectedItem?.name ?? placeholder}
        </span>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="ds-dropdown-surface absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl p-1.5">
          {items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg text-left transition-colors ${optionSizeClass} ${
                  selected
                    ? invalid
                      ? 'bg-red-50 text-red-600'
                      : 'bg-slate-50 text-slate-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => selectItem(item.id)}
              >
                <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function collectModels(node: TreeNode): { url: string; name: string; id: string }[] {
  const results: { url: string; name: string; id: string }[] = [];
  if (node.modelPath) {
    results.push({ url: node.modelPath, name: node.name, id: node.id });
  }
  for (const child of node.children || []) {
    results.push(...collectModels(child));
  }
  return results;
}

function collectLeafParts(node: TreeNode): TreeNode[] {
  const results: TreeNode[] = [];
  if (node.modelPath) {
    results.push(node);
  }
  for (const child of node.children || []) {
    results.push(...collectLeafParts(child));
  }
  return results;
}

function collectProjectManagementPartRows(node: TreeNode): TreeNode[] {
  return collectLeafParts(node).map((part) => ({ ...part, children: undefined }));
}

function getParentId(tree: TreeNode, id: string): string | null {
  for (const child of tree.children || []) {
    if (child.id === id) return tree.id;
    const found = getParentId(child, id);
    if (found) return found;
  }
  return null;
}

function arePartsAdjacent(aId: string, bId: string, tree: TreeNode): boolean {
  if (aId === bId) return false;
  const a = findNodeById(tree, aId);
  const b = findNodeById(tree, bId);
  if (!a || !b) return false;

  const getPartSuffix = (id: string) => id.match(/-(\d{2})$/)?.[1] ?? '';
  const pairKey = [getPartSuffix(aId), getPartSuffix(bId)].sort().join('-');
  return new Set(['01-02', '01-03', '03-04']).has(pairKey);
}

function getPartSuffix(id: string): string {
  return id.match(/-(\d{2})$/)?.[1] ?? '';
}

function getDatumFeatureDisplayName(partAId: string, partBId: string): string {
  const pairKey = [getPartSuffix(partAId), getPartSuffix(partBId)].sort().join('-');
  const datumNames: Record<string, string> = {
    '01-02': '02 01装配基准',
    '01-03': '03 01装配基准',
    '03-04': '04 03装配基准',
  };
  return datumNames[pairKey] ?? '装配基准';
}

function getDatumEdgeOwnerSuffix(edgeId: string): string {
  return edgeId.match(/^(\d{2})-datum-edge-/)?.[1] ?? '';
}

type AssemblyDatumStepKey = 'A1' | 'B1' | 'A2' | 'B2';

const assemblyDatumStepOrder: AssemblyDatumStepKey[] = ['A1', 'B1', 'A2', 'B2'];

const assemblyDatumStepMeta: Record<AssemblyDatumStepKey, { partKey: 'A' | 'B'; slot: 1 | 2; partLabel: string; shortLabel: string; actionLabel: string }> = {
  A1: { partKey: 'A', slot: 1, partLabel: '子板', shortLabel: '子板基准1', actionLabel: '设为子板基准1' },
  B1: { partKey: 'B', slot: 1, partLabel: '父板', shortLabel: '父板基准1', actionLabel: '设为父板基准1' },
  A2: { partKey: 'A', slot: 2, partLabel: '子板', shortLabel: '子板基准2', actionLabel: '设为子板基准2' },
  B2: { partKey: 'B', slot: 2, partLabel: '父板', shortLabel: '父板基准2', actionLabel: '设为父板基准2' },
};

function getAssemblyDatumStepValue(
  modal: {
    partAFeatureId1: string | null;
    partAFeatureId2: string | null;
    partBFeatureId1: string | null;
    partBFeatureId2: string | null;
  },
  stepKey: AssemblyDatumStepKey
) {
  if (stepKey === 'A1') return modal.partAFeatureId1;
  if (stepKey === 'B1') return modal.partBFeatureId1;
  if (stepKey === 'A2') return modal.partAFeatureId2;
  return modal.partBFeatureId2;
}

function getNextAssemblyDatumStep(
  modal: {
    partAFeatureId1: string | null;
    partAFeatureId2: string | null;
    partBFeatureId1: string | null;
    partBFeatureId2: string | null;
  }
) {
  return assemblyDatumStepOrder.find((stepKey) => !getAssemblyDatumStepValue(modal, stepKey)) ?? null;
}

function getProcessIcon(type: string) {
  if (type === 'pick') {
    return <Move3D className="size-4 text-current" />;
  }
  if (type === 'place') {
    return <Box className="size-4 text-current" />;
  }
  if (type === 'polish') {
    return <Sparkles className="size-4 text-current" />;
  }
  if (type === 'assemble') {
    return <Layers3 className="size-4 text-current" />;
  }
  if (type === 'clamp' || type === 'turnover-clamp') {
    return <Pin className="size-4 text-current" />;
  }
  return <Hammer className="size-4 text-current" />;
}

function getShortProcessStepTitle(type: string) {
  if (type === 'pick') return '抓取';
  if (type === 'place') return '放置';
  if (type === 'polish') return '打磨';
  if (type === 'assemble') return '装配';
  if (type === 'turnover-clamp' || type === 'clamp') return '翻面压紧';
  if (type === 'weld-combined') return '焊接';
  if (type === 'weld-scan') return '定位焊扫描';
  if (type === 'weld') return '定位焊';
  return '任务';
}

function getCompactProcessTargetLabel(
  step: ProcessStep,
  objectTree: TreeNode | null,
  leafParts: TreeNode[],
  grindFeatureItems: TreeNode[],
  datumFeatureItems: TreeNode[],
  weldFeatureItems: TreeNode[],
) {
  const resolveParts = (partIds: string[]) =>
    partIds
      .map((partId) => (objectTree ? findNodeById(objectTree, partId) : null) ?? leafParts.find((part) => part.id === partId))
      .filter(Boolean)
      .map((part) => part.name);
  const resolveFeatures = (featureIds: string[], items: TreeNode[]) =>
    featureIds
      .map((featureId) => items.find((item) => item.id === featureId))
      .filter(Boolean)
      .map((feature) => feature.name);
  const targetNames =
    step.type === 'pick'
      ? resolveParts(step.pickConfig?.workpieceIds ?? [])
      : step.type === 'place'
        ? resolveParts(step.placeConfig?.workpieceIds ?? [])
        : step.type === 'turnover-clamp' || step.type === 'clamp'
          ? resolveParts(step.turnoverClampConfig?.workpieceIds ?? [])
          : step.type === 'polish'
            ? resolveFeatures(step.grindConfig?.featureIds ?? [], grindFeatureItems)
            : step.type === 'assemble'
              ? resolveFeatures(step.assembleConfig?.featureIds ?? [], datumFeatureItems)
              : step.type === 'weld' || step.type === 'weld-scan' || step.type === 'weld-combined'
                ? resolveFeatures(step.weldConfig?.featureIds ?? [], weldFeatureItems)
                : [];
  return targetNames.length > 0 ? targetNames.join('+') : step.board || step.name || getShortProcessStepTitle(step.type);
}

function getProcessStepPartIds(step: ProcessStep) {
  if (step.type === 'pick') return step.pickConfig?.workpieceIds ?? [];
  if (step.type === 'place') return step.placeConfig?.workpieceIds ?? [];
  if (step.type === 'turnover-clamp' || step.type === 'clamp') return step.turnoverClampConfig?.workpieceIds ?? [];
  return [];
}

function getProcessStepFeatureIds(step: ProcessStep) {
  if (step.type === 'polish') return step.grindConfig?.featureIds ?? [];
  if (step.type === 'assemble') return step.assembleConfig?.featureIds ?? [];
  if (step.type === 'weld' || step.type === 'weld-scan') return step.weldConfig?.featureIds ?? [];
  if (step.type === 'weld-combined') {
    return Array.from(new Set([
      ...(step.weldConfig?.featureIds ?? []),
      ...(step.weldScanConfig?.featureIds ?? []),
    ]));
  }
  return [];
}

function getProcessStepTargetIds(step: ProcessStep, fallbackWorkpieceIds: string[] = []) {
  const taskPartIds = getProcessStepPartIds(step);
  const featureIds = getProcessStepFeatureIds(step);
  return {
    // Feature-driven tasks have no workpiece config of their own.  Before their
    // referenced features are available, retain the owning fixed process's
    // workpiece scope so isolation never dims every model in the viewport.
    partIds: taskPartIds.length > 0 ? taskPartIds : featureIds.length > 0 ? [] : fallbackWorkpieceIds,
    featureIds,
  };
}

function getFeatureRelatedPartIds(featureNode: TreeNode | null) {
  if (!featureNode) return [];
  if (featureNode.relatedPartIds?.length) return featureNode.relatedPartIds;
  return [featureNode.datumMeta?.partAId, featureNode.datumMeta?.partBId].filter(Boolean) as string[];
}

function getProcessIsolationOpacityClassName(opacity: number) {
  if (opacity <= PROCESS_ISOLATION_DIMMED_OPACITY) return PROCESS_ISOLATION_DIMMED_CLASS_NAME;
  if (opacity < 1) return PROCESS_TASK_CONTEXT_CLASS_NAME;
  return '';
}

function getProcessStepFeatureIdsByFilterKind(step: ProcessStep, kind: CompactProcessFilterKind) {
  if (kind === 'weld-feature') return step.weldConfig?.featureIds ?? [];
  if (kind === 'grind-feature') return step.grindConfig?.featureIds ?? [];
  if (kind === 'datum-feature') return step.assembleConfig?.featureIds ?? [];
  return [];
}

function isInvalidProcessNumberText(value: string) {
  const text = value.trim();
  if (!text) return true;
  const numericValue = Number(text);
  return !Number.isFinite(numericValue) || Number.isNaN(numericValue) || numericValue < 0;
}

function getProcessNumberRangeWarning(minValue: string, maxValue: string) {
  const minText = minValue.trim();
  const maxText = maxValue.trim();
  if (!minText && !maxText) return '最小值和最大值不能为空';
  if (!minText) return '最小值不能为空';
  if (!maxText) return '最大值不能为空';

  const minNumber = Number(minText);
  const maxNumber = Number(maxText);
  if (!Number.isFinite(minNumber) || Number.isNaN(minNumber) || minNumber < 0 || !Number.isFinite(maxNumber) || Number.isNaN(maxNumber) || maxNumber < 0) {
    return '请输入合法非负数值';
  }
  if (minNumber > maxNumber) return '最小值不能大于最大值';
  return '';
}

function isInvalidProcessNumberRange(minValue: string, maxValue: string) {
  return Boolean(getProcessNumberRangeWarning(minValue, maxValue));
}

function clampProcessPercent(value: string | number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

function ProcessRangeWarning({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 text-red-500">
      <CircleAlert className="size-3.5" />
      <span>{children}</span>
    </div>
  );
}

function SafetyPointNumberField({
  value,
  onChange,
  disabled = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const textValue = String(value ?? '');
  const isInvalid = isInvalidProcessNumberText(textValue);

  return (
    <input
      value={textValue}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`h-7 w-full rounded-lg border bg-white px-1.5 py-1 text-right text-[11px] text-slate-700 outline-none transition-colors focus:border-orange-300 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-ds-bg-control-disabled disabled:text-slate-400 ${
        isInvalid && !disabled ? 'border-red-300 bg-red-50/60' : 'border-slate-200'
      }`}
    />
  );
}

function ProcessPointInfoRow({
  index,
  point,
  onAxisChange,
  selected,
  onSelect,
}: {
  index: number;
  point: { x: string; y: string; z: string };
  onAxisChange: (axis: 'x' | 'y' | 'z', value: string) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[52px_repeat(3,minmax(72px,1fr))] items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all ${
        selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent hover:bg-white/70'
      }`}
      onClick={onSelect}
    >
      <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
      {(['x', 'y', 'z'] as const).map((axis) => (
        <div key={axis} className="grid grid-cols-[12px_minmax(0,1fr)] items-center gap-1">
          <span className="text-[11px] uppercase text-slate-400">{axis}</span>
          <ProcessNumberField
            value={point[axis]}
            invalid={false}
            unit="mm"
            inputClassName="h-8 px-2 pr-8 text-right text-xs"
            onChange={(nextValue) => onAxisChange(axis, nextValue)}
          />
        </div>
      ))}
    </div>
  );
}

function ProcessDeltaPointInfoRow({
  index,
  point,
  onAxisChange,
  selected,
  onSelect,
}: {
  index: number;
  point: ProcessPointCoordinates;
  onAxisChange: (axis: 'x' | 'y' | 'z', value: string) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[52px_repeat(3,minmax(72px,1fr))] items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all ${
        selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent hover:bg-white/70'
      }`}
      onClick={onSelect}
    >
      <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
      {(['x', 'y', 'z'] as const).map((axis) => (
        <div key={axis} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
          <span className="text-[11px] uppercase text-slate-400">Δ{axis}</span>
          <ProcessNumberField
            value={point[axis]}
            invalid={false}
            unit="mm"
            inputClassName="h-8 px-2 pr-8 text-right text-xs"
            onChange={(nextValue) => onAxisChange(axis, nextValue)}
          />
        </div>
      ))}
    </div>
  );
}

function ProcessPointInfoRowWithRPY({
  index,
  point,
  onAxisChange,
  selected,
  onSelect,
}: {
  index: number;
  point: { x: string; y: string; z: string; rx: string; ry: string; rz: string };
  onAxisChange: (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', value: string) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 transition-all ${
        selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent hover:bg-white/70'
      }`}
      onClick={onSelect}
    >
      <div className="grid grid-cols-[52px_repeat(3,minmax(72px,1fr))] items-center gap-2">
        <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
            <span className="text-[11px] uppercase text-slate-400">{axis}</span>
            <ProcessNumberField
              value={point[axis]}
              invalid={false}
              unit="mm"
              inputClassName="h-8 px-2 pr-[3.25rem] text-right text-xs"
              stepper
              onChange={(nextValue) => onAxisChange(axis, nextValue)}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-[52px_repeat(3,minmax(72px,1fr))] items-center gap-2 pt-1">
        <div />
        {(['rx', 'ry', 'rz'] as const).map((axis) => (
          <div key={axis} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
            <span className="text-[11px] uppercase text-slate-400">{axis}</span>
            <ProcessNumberField
              value={point[axis]}
              invalid={false}
              unit="deg"
              inputClassName="h-8 px-2 pr-[3.25rem] text-right text-xs"
              stepper
              onChange={(nextValue) => onAxisChange(axis, nextValue)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessDeltaPointInfoRowWithRPY({
  index,
  point,
  onAxisChange,
  selected,
  onSelect,
}: {
  index: number;
  point: { x: string; y: string; z: string; rx: string; ry: string; rz: string };
  onAxisChange: (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', value: string) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 transition-all ${
        selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent hover:bg-white/70'
      }`}
      onClick={onSelect}
    >
      <div className="grid grid-cols-[52px_repeat(3,minmax(72px,1fr))] items-center gap-2">
        <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
            <span className="text-[11px] uppercase text-slate-400">Δ{axis}</span>
            <ProcessNumberField
              value={point[axis]}
              invalid={false}
              unit="mm"
              inputClassName="h-8 px-2 pr-[3.25rem] text-right text-xs"
              stepper
              onChange={(nextValue) => onAxisChange(axis, nextValue)}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-[52px_repeat(3,minmax(72px,1fr))] items-center gap-2 pt-1">
        <div />
        {(['rx', 'ry', 'rz'] as const).map((axis) => (
          <div key={axis} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
            <span className="text-[11px] uppercase text-slate-400">{axis}</span>
            <ProcessNumberField
              value={point[axis]}
              invalid={false}
              unit="deg"
              inputClassName="h-8 px-2 pr-[3.25rem] text-right text-xs"
              stepper
              onChange={(nextValue) => onAxisChange(axis, nextValue)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactRadioGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {options.map((option) => {
        const selected = value === option;
        return (
          <label
            key={option}
            className={`group flex cursor-pointer items-center gap-1.5 text-[11px] font-medium transition-colors ${
              selected ? 'text-ds-brand-primary-text' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(option)}
            />
            <span
              aria-hidden="true"
              className={`grid size-3.5 place-items-center rounded-full border transition-colors ${
                selected
                  ? 'border-ds-brand-primary bg-white shadow-ds-sm'
                  : 'border-zinc-300 bg-white group-hover:border-orange-300'
              }`}
            >
              <span className={`size-1.5 rounded-full bg-ds-brand-primary transition-transform ${selected ? 'scale-100' : 'scale-0'}`} />
            </span>
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

const pickPathAxes = ['x', 'y', 'z', 'rx', 'ry', 'rz'] as const;

function ProcessPosePointSummaryText({
  point,
  delta = false,
}: {
  point: ProcessPosePoint;
  delta?: boolean;
}) {
  const items = [
    [`${delta ? 'Δ' : ''}X`, point.x],
    [`${delta ? 'Δ' : ''}Y`, point.y],
    [`${delta ? 'Δ' : ''}Z`, point.z],
    ['RX', point.rx],
    ['RY', point.ry],
    ['RZ', point.rz],
  ];

  return (
    <div className="min-w-0 truncate text-[11px] leading-5 text-slate-500" title={items.map(([label, value]) => `${label} ${value}`).join(' / ')}>
      {items.map(([label, value], itemIndex) => (
        <span key={label} className="whitespace-nowrap">
          {itemIndex > 0 && <span className="mx-1 text-slate-300">/</span>}
          <span className="font-medium text-ds-text-parameter-label">{label}</span>
          <span className="ml-0.5 font-mono tabular-nums text-slate-600">{value}</span>
        </span>
      ))}
    </div>
  );
}

function ProcessPosePointInfoRow({
  label,
  point,
  onAxisChange,
  disabledAxes = [],
  selected,
  onSelect,
  className = '',
  surfaceClassName = 'bg-white/70 hover:bg-white',
  selectedVariant = 'emphasis',
  defaultCollapsed = false,
  delta = false,
  collapseSignal = 0,
  hidePoseDivider = false,
  expandedFirstRowExtraGap = false,
}: {
  label: string;
  point: ProcessPosePoint;
  onAxisChange: (axis: typeof pickPathAxes[number], value: string) => void;
  disabledAxes?: string[];
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  surfaceClassName?: string;
  selectedVariant?: 'emphasis' | 'subtle';
  defaultCollapsed?: boolean;
  delta?: boolean;
  collapseSignal?: number;
  hidePoseDivider?: boolean;
  expandedFirstRowExtraGap?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  useEffect(() => {
    if (collapseSignal > 0) setCollapsed(collapseSignal % 2 === 1);
  }, [collapseSignal]);
  const paddingClassName = className || 'px-2.5 py-2';
  const selectedClassName =
    selectedVariant === 'subtle'
      ? 'border-slate-200 bg-white'
      : 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200';
  const firstExpandedRowClassName = expandedFirstRowExtraGap
    ? 'border-t border-slate-100/80 pt-[6px]'
    : 'border-t border-slate-100/80 pt-1';
  const poseDividerClassName = hidePoseDivider ? '' : 'border-t border-slate-100/80';
  return (
    <div
      className={`space-y-1 rounded-lg border ${paddingClassName} transition-all ${
        selected ? selectedClassName : `border-transparent ${surfaceClassName}`
      }`}
      onClick={onSelect}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_20px] items-center gap-1.5">
        {label && <div className="text-[11px] font-medium text-ds-text-parameter-label">{label}</div>}
        {collapsed ? <ProcessPosePointSummaryText point={point} delta={delta} /> : <div />}
        <button
          type="button"
          aria-label={collapsed ? '展开点位' : '折叠点位'}
          aria-expanded={!collapsed}
          className="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          onClick={(event) => {
            event.stopPropagation();
            setCollapsed((current) => !current);
          }}
        >
          <ChevronRight className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>
      {!collapsed && (
        <PoseAxisFieldGroup
          point={point}
          valueMode={delta ? 'delta' : 'absolute'}
          disabledAxes={disabledAxes}
          stepper
          inputVariant="elevated"
          inputClassName="h-7 px-1.5 pr-[3.1rem] text-right text-[11px]"
          axisGridClassName="grid-cols-[16px_minmax(0,1fr)]"
          firstRowClassName={firstExpandedRowClassName}
          rowGapClassName="pt-1"
          secondRowClassName={poseDividerClassName}
          onAxisChange={onAxisChange}
        />
      )}
    </div>
  );
}

function WeldSegmentPosePointGroups({
  points,
  onAxisChange,
  selectedSegmentIndex,
  onSegmentSelect,
  selectedPointIndex,
  onPointSelect,
  selectedVariant = 'emphasis',
}: {
  points: ProcessPosePoint[];
  onAxisChange: (pointIndex: number, axis: typeof pickPathAxes[number], value: string) => void;
  selectedSegmentIndex?: number | null;
  onSegmentSelect?: (segmentIndex: number) => void;
  selectedPointIndex?: number | null;
  onPointSelect?: (pointIndex: number) => void;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, segmentIndex) => {
        const startIndex = segmentIndex * 2;
        const endIndex = startIndex + 1;
        const selected = selectedSegmentIndex === segmentIndex;
        return (
          <div key={segmentIndex} className={`rounded-lg border px-2.5 py-2 transition-all ${selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent bg-slate-50/80'}`}>
            <button
              type="button"
              className={`mb-2 rounded px-1 text-[11px] font-medium transition-colors ${
                selected ? 'text-slate-700' : 'text-slate-500 hover:bg-white/70 hover:text-ds-brand-primary-text'
              }`}
              onClick={() => onSegmentSelect?.(segmentIndex)}
            >
              焊缝段{segmentIndex + 1}
            </button>
            <div className="space-y-1.5">
              <ProcessPosePointInfoRow
                label={`起点 P${startIndex + 1}`}
                point={points[startIndex] ?? createWeldPosePointRows()[startIndex]}
                selected={selectedPointIndex === startIndex}
                selectedVariant={selectedVariant}
                onSelect={() => onPointSelect?.(startIndex)}
                onAxisChange={(axis, value) => onAxisChange(startIndex, axis, value)}
              />
              <ProcessPosePointInfoRow
                label={`终点 P${endIndex + 1}`}
                point={points[endIndex] ?? createWeldPosePointRows()[endIndex]}
                selected={selectedPointIndex === endIndex}
                selectedVariant={selectedVariant}
                onSelect={() => onPointSelect?.(endIndex)}
                onAxisChange={(axis, value) => onAxisChange(endIndex, axis, value)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const pickPathPoseAnchors = [
  { label: 'P1', top: '27%', left: '36%', rotate: -24 },
  { label: 'P2', top: '39%', left: '33%', rotate: -12 },
  { label: 'P3', top: '52%', left: '37%', rotate: 0 },
  { label: 'P4', top: '52%', left: '58%', rotate: 0 },
  { label: 'P5', top: '39%', left: '62%', rotate: 12 },
  { label: 'P6', top: '27%', left: '59%', rotate: 24 },
];
const pickPathDiagramPoints = [
  { label: 'P1', top: '14px', left: '34px' },
  { label: 'P2', top: '58px', left: '34px' },
  { label: 'P3', top: '102px', left: '34px' },
  { label: 'P4', top: '102px', left: '70px' },
  { label: 'P5', top: '58px', left: '70px' },
  { label: 'P6', top: '14px', left: '70px' },
];

function getMockPoseNumber(value?: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function clampMockPoseOffset(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMockToolHeadOffset(point?: Partial<ProcessPosePoint>) {
  if (!point) return { x: 0, y: 0 };
  const x = getMockPoseNumber(point.x);
  const y = getMockPoseNumber(point.y);
  const z = getMockPoseNumber(point.z);
  return {
    x: clampMockPoseOffset(((x % 140) - 70) * 0.34, -28, 28),
    y: clampMockPoseOffset(((y % 120) - 60) * 0.26 - ((z % 90) - 45) * 0.16, -26, 26),
  };
}

function getMockToolHeadTranslate(point?: Partial<ProcessPosePoint>, extraX = 0) {
  const offset = getMockToolHeadOffset(point);
  return `translate(calc(-50% + ${extraX + offset.x}px), calc(-50% + ${offset.y}px))`;
}

function getMockToolHeadRotation(baseRotate: number, point?: Partial<ProcessPosePoint>) {
  const rz = getMockPoseNumber(point?.rz);
  const rx = getMockPoseNumber(point?.rx);
  return baseRotate + clampMockPoseOffset(rz * 0.18 + rx * 0.06, -42, 42);
}

function getPickPathPosePreviewItems(pointIndex: PickPathPosePointIndex, points: PickPathPoint[] = []) {
  const enabledIndices = points
    .map((point, index) => (point.enabled === false ? null : index))
    .filter((index): index is number => index !== null);
  if (pointIndex === 'all') {
    return pickPathPoseAnchors
      .map((anchor, index) => ({ anchor, pointIndex: index }))
      .filter(({ pointIndex }) => enabledIndices.includes(pointIndex));
  }
  const anchor = pickPathPoseAnchors[pointIndex];
  return anchor && enabledIndices.includes(pointIndex) ? [{ anchor, pointIndex }] : [];
}

function getPickPathPosePreviewTitle(pointIndex: PickPathPosePointIndex) {
  if (pointIndex === 'all') return '3D 视图回显全部工具头位姿';
  return `3D 视图回显 ${pickPathPoseAnchors[pointIndex]?.label ?? '安全点'} 工具头位姿`;
}

function PickPathPointCard({
  index,
  point,
  onAxisChange,
  onToggleEnabled,
  selected,
  onSelect,
  variant = 'default',
}: {
  index: number;
  point: PickPathPoint;
  onAxisChange: (axis: typeof pickPathAxes[number], value: string) => void;
  onToggleEnabled: (enabled: boolean) => void;
  selected?: boolean;
  onSelect?: () => void;
  variant?: 'default' | 'compactSubtle';
}) {
  const enabled = point.enabled !== false;
  const cardStateClassName =
    variant === 'compactSubtle'
      ? selected && enabled
        ? 'border-slate-300 bg-white'
        : 'border-transparent bg-white/70 hover:bg-white'
      : selected && enabled
        ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200'
        : 'border-transparent bg-white';
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 transition-all ${cardStateClassName} ${enabled ? 'cursor-pointer' : 'opacity-55'}`}
      onClick={enabled ? onSelect : undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-slate-600">安全点 {index + 1}</div>
        <div
          className="flex items-center gap-1.5 text-[11px] text-slate-500"
          onClick={(event) => event.stopPropagation()}
        >
          <span>启用</span>
          <ThemedCheckbox
            checked={enabled}
            aria-label={`启用安全点 ${index + 1}`}
            onChange={(event) => onToggleEnabled(event.target.checked)}
          />
        </div>
      </div>
      <div className={`space-y-1.5 ${enabled ? '' : 'pointer-events-none'}`}>
        {[
          { label: '坐标', axes: ['x', 'y', 'z'] as const, prefix: 'Δ' },
          { label: '姿态', axes: ['rx', 'ry', 'rz'] as const, prefix: '' },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-3 items-center gap-1.5">
            {row.axes.map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[10px] uppercase text-ds-text-parameter-label">{row.prefix}{axis}</span>
                <SafetyPointNumberField
                  value={point[axis]}
                  disabled={!enabled}
                  onChange={(nextValue) => onAxisChange(axis, nextValue)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GrindPathResultCard({
  index,
  point,
  selected,
  onSelect,
  onAxisChange,
  collapseSignal = 0,
  selectedVariant = 'emphasis',
}: {
  index: number;
  point: ProcessPosePoint;
  selected?: boolean;
  onSelect?: () => void;
  onAxisChange: (axis: typeof pickPathAxes[number], value: string) => void;
  collapseSignal?: number;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (collapseSignal > 0) setCollapsed(true);
  }, [collapseSignal]);
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 transition-all ${
        selected
          ? selectedVariant === 'subtle'
            ? 'border-slate-200 bg-white'
            : 'border-orange-200 bg-slate-100 shadow-selected ring-1 ring-inset ring-orange-200'
          : 'border-transparent bg-slate-100'
      }`}
      onClick={onSelect}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_20px] items-center gap-1.5">
        <div className="text-[11px] font-medium text-ds-text-parameter-label">结果点 {index + 1}</div>
        {collapsed ? <ProcessPosePointSummaryText point={point} /> : <div />}
        <button
          type="button"
          aria-label={collapsed ? '展开结果点' : '折叠结果点'}
          aria-expanded={!collapsed}
          className="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600"
          onClick={(event) => {
            event.stopPropagation();
            setCollapsed((current) => !current);
          }}
        >
          <ChevronRight className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-1.5">
          <div className="mt-1 grid grid-cols-3 items-center gap-1.5 border-t border-slate-200/70 pt-1">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[10px] uppercase text-ds-text-parameter-label">{axis}</span>
                <ProcessNumberField
                  value={point[axis]}
                  invalid={false}
                  unit="mm"
                  inputClassName="h-7 px-1.5 pr-[3.1rem] text-right text-[11px]"
                  stepper
                  onChange={(nextValue) => onAxisChange(axis, nextValue)}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 items-center gap-1.5 border-t border-slate-200/70 pt-1">
            {(['rx', 'ry', 'rz'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[10px] uppercase text-ds-text-parameter-label">{axis}</span>
                <ProcessNumberField
                  value={point[axis]}
                  invalid={false}
                  unit="°"
                  inputClassName="h-7 px-1.5 pr-[3.1rem] text-right text-[11px]"
                  stepper
                  onChange={(nextValue) => onAxisChange(axis, nextValue)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type GrindPathSequenceItem =
  | { kind: 'safe'; point: PickPathPoint; sourceIndex: number; displayIndex: number }
  | { kind: 'result'; point: ProcessPosePoint; sourceIndex: number };

function GrindPathPointPanel({
  step,
  config,
  selectedSafePointIndex,
  selectedResultPointIndex,
  onResultPointSelect,
  onResultPointAxisChange,
  onSafePointSelect,
  onSafePointAxisChange,
  onSafePointToggleEnabled,
  onShowAllPose,
  onApplyUpdate,
  dirty,
  coordinateFrame,
  onCoordinateFrameChange,
}: {
  step: ProcessStep;
  config: FeatureProcessConfig;
  selectedSafePointIndex: number | 'all' | null;
  selectedResultPointIndex: number | null;
  onResultPointSelect: (pointIndex: number) => void;
  onResultPointAxisChange: (pointIndex: number, axis: typeof pickPathAxes[number], value: string) => void;
  onSafePointSelect: (pointIndex: number) => void;
  onSafePointAxisChange: (pointIndex: number, axis: typeof pickPathAxes[number], value: string) => void;
  onSafePointToggleEnabled: (pointIndex: number, enabled: boolean) => void;
  onShowAllPose: () => void;
  onApplyUpdate: () => void;
  dirty: boolean;
  coordinateFrame: CompactPathCoordinateFrame;
  onCoordinateFrameChange: (frame: CompactPathCoordinateFrame) => void;
}) {
  const pathPoints = getProcessPathPoints(step);
  const resultPoints = normalizeFeaturePosePoints(config.points, config.posePoints).slice(0, 6);
  const safePointIndices = pathPoints.map((point, index) => (point.enabled === false ? null : index)).filter((index): index is number => index !== null);
  const showPoseEnabled = safePointIndices.length > 0;
  const sequenceItems: GrindPathSequenceItem[] = [
    ...getEnabledPathPointEntries(pathPoints.slice(0, 3)).map(({ point, index }) => ({
      kind: 'safe' as const,
      point,
      sourceIndex: index,
      displayIndex: index,
    })),
    ...resultPoints.map((point, index) => ({
      kind: 'result' as const,
      point,
      sourceIndex: index,
    })),
    ...getEnabledPathPointEntries(pathPoints.slice(3, 6)).map(({ point, index }) => ({
      kind: 'safe' as const,
      point,
      sourceIndex: index + 3,
      displayIndex: index + 3,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-ds-xl bg-slate-50/80 p-ds-150">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-ds-label text-ds-text-muted">
            <span>路径点位</span>
            <span className="text-[11px] text-slate-400">3 安全点 / 6 结果点 / 3 安全点</span>
          </div>
          <div className="flex items-center gap-2">
            <CompactRadioGroup value={coordinateFrame} options={compactPathCoordinateFrameOptions} onChange={onCoordinateFrameChange} />
            <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" onClick={onApplyUpdate} disabled={!dirty}>
              更新
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" onClick={onShowAllPose} disabled={!showPoseEnabled}>
              显示全部位姿
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
          <div className="relative flex h-[270px] flex-col items-center rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-3">
            <div className="relative h-[168px] w-[104px]">
              <div className="absolute left-[34px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
              <div className="absolute left-[34px] bottom-[24px] h-[3px] w-[36px] rounded-full bg-red-500" />
              <ArrowRight className="absolute left-[46px] bottom-[15px] size-5 text-red-500" strokeWidth={2.75} />
              <div className="absolute left-[70px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
              {pickPathDiagramPoints.map((point, pointIndex) => {
                const enabled = pathPoints[pointIndex]?.enabled !== false;
                return (
                  <button
                    key={point.label}
                    type="button"
                    className="absolute -translate-x-1/2 text-left"
                    style={{ top: point.top, left: point.left }}
                    onClick={() => onSafePointSelect(pointIndex)}
                  >
                    <div
                      className={`size-3 rounded-full border-2 bg-white shadow-sm ${
                        enabled && (selectedSafePointIndex === 'all' || selectedSafePointIndex === pointIndex)
                          ? 'border-ds-brand-primary ring-4 ring-orange-100'
                          : enabled
                            ? 'border-orange-300'
                            : 'border-slate-300 bg-slate-100'
                      }`}
                    />
                    <div className={`mt-0.5 -translate-x-[6px] text-[9px] font-medium ${enabled ? 'text-slate-500' : 'text-slate-300'}`}>
                      {point.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="absolute bottom-9 left-0 right-0 flex justify-center">
              <Button size="sm" variant="outline" className="h-6 px-3 text-[10px]" disabled={!showPoseEnabled} onClick={onShowAllPose}>
                显示全部位姿
              </Button>
            </div>
          </div>
          <div className="grid max-h-[270px] grid-cols-1 gap-2 overflow-y-auto pr-1">
            {sequenceItems.map((item) =>
              item.kind === 'safe' ? (
                <PickPathPointCard
                  key={`safe-${item.sourceIndex}`}
                  index={item.displayIndex}
                  point={item.point}
                  selected={selectedSafePointIndex === 'all' || selectedSafePointIndex === item.sourceIndex}
                  onSelect={() => onSafePointSelect(item.sourceIndex)}
                  onToggleEnabled={(enabled) => onSafePointToggleEnabled(item.sourceIndex, enabled)}
                  onAxisChange={(axis, nextValue) => onSafePointAxisChange(item.sourceIndex, axis, nextValue)}
                />
              ) : (
                <GrindPathResultCard
                  key={`result-${item.sourceIndex}`}
                  index={item.sourceIndex}
                  point={item.point}
                  selected={selectedResultPointIndex === item.sourceIndex}
                  onSelect={() => onResultPointSelect(item.sourceIndex)}
                  onAxisChange={(axis, nextValue) => onResultPointAxisChange(item.sourceIndex, axis, nextValue)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessPointInfoSection({
  collapsed,
  dirty,
  onToggleCollapse,
  onApplyUpdate,
  children,
}: {
  collapsed: boolean;
  dirty: boolean;
  onToggleCollapse: () => void;
  onApplyUpdate: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-slate-400"
          onClick={onToggleCollapse}
        >
          <span>点位信息</span>
          <ChevronRight className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        </button>
        <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" disabled={!dirty} onClick={onApplyUpdate}>更新</Button>
      </div>
      {!collapsed && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

function ProcessAxisUnitInputRow({
  label,
  values,
  axes,
  unit = 'mm',
  onAxisChange,
  frameless = false,
  disabledAxes = [],
  selected,
  onSelect,
}: {
  label: string;
  values: Record<string, string>;
  axes: string[];
  unit?: string;
  onAxisChange: (axis: string, value: string) => void;
  frameless?: boolean;
  disabledAxes?: string[];
  selected?: boolean;
  onSelect?: () => void;
}) {
  const hasLabel = label.trim().length > 0;
  const axisColumns = axes.length === 2 ? 'repeat(2,minmax(84px,1fr))' : 'repeat(3,minmax(72px,1fr))';
  return (
    <div
      className={`grid items-center gap-ds-100 border transition-all ${
        selected
          ? 'rounded-ds-lg border-orange-200 bg-white p-ds-100 shadow-selected ring-1 ring-inset ring-orange-200'
          : frameless
            ? 'rounded-ds-lg border-transparent hover:bg-white/70'
            : 'rounded-ds-lg border-transparent bg-ds-bg-surface p-ds-100 ring-1 ring-ds-border-default'
      }`}
      style={{ gridTemplateColumns: hasLabel ? `72px ${axisColumns}` : axisColumns }}
      onClick={onSelect}
    >
      {hasLabel && <div className="text-ds-label font-medium text-ds-text-secondary">{label}</div>}
      {axes.map((axis) => (
        <div key={axis} className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] items-center gap-ds-050">
          <span className={`text-ds-helper uppercase ${disabledAxes.includes(axis) ? 'text-ds-text-disabled' : 'text-ds-text-muted'}`}>{axis}</span>
          <ProcessNumberField
            value={values[axis] ?? ''}
            invalid={false}
            disabled={disabledAxes.includes(axis)}
            unit={unit}
            inputClassName="h-8 px-2 pr-10 text-right text-xs"
            onChange={(nextValue) => onAxisChange(axis, nextValue)}
          />
        </div>
      ))}
    </div>
  );
}

function ProcessPercentSlider({
  value,
  onChange,
  sliderClassName = '',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  sliderClassName?: string;
  disabled?: boolean;
}) {
  const percent = clampProcessPercent(value);

  return (
    <div className={`flex items-center gap-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div className={`relative ml-2 h-8 flex-1 ${sliderClassName}`}>
        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-x-0 top-0 z-10 h-5 w-full cursor-pointer opacity-0"
        />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center">
          <div className="relative h-1.5 flex-1 rounded-full bg-ds-bg-slider-track">
            <div className="absolute inset-y-0 left-0 rounded-full bg-ds-brand-primary" style={{ width: `${percent}%` }} />
            <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ds-brand-primary bg-white shadow-sm" style={{ left: `${percent}%` }} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-[14px] flex justify-between">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="h-1 w-px bg-ds-border-slider-tick" />
              <span className="mt-0.5 text-[10px] text-ds-text-slider-tick">{tick}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-20 shrink-0">
        <ProcessNumberField
          value={value}
          onChange={onChange}
          unit="%"
          inputClassName="px-2 py-1.5 pr-8 text-right"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function PickMagnetForceLevelSelect({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: {
  value: string;
  onChange: (value: PickMagnetForceLevel) => void;
  disabled?: boolean;
  size?: 'sm' | 'task' | 'md';
}) {
  return (
    <ProcessSingleSelect
      items={pickMagnetForceLevelOptions.map((level) => ({ id: level, name: level }))}
      selectedId={normalizePickMagnetForceLevel(value)}
      disabled={disabled}
      size={size}
      elevation="none"
      onChange={(nextId) => nextId && onChange(nextId as PickMagnetForceLevel)}
    />
  );
}

function ProcessNumberRangeField({
  minValue,
  maxValue,
  defaultMinValue,
  defaultMaxValue,
  onMinChange,
  onMaxChange,
  minLabel,
  maxLabel,
  unit,
  warningPlacement = 'absolute',
}: {
  minValue?: string | number;
  maxValue?: string | number;
  defaultMinValue?: string | number;
  defaultMaxValue?: string | number;
  onMinChange?: (value: string) => void;
  onMaxChange?: (value: string) => void;
  minLabel: string;
  maxLabel: string;
  unit: string;
  warningPlacement?: 'absolute' | 'inline' | 'none';
}) {
  const [internalMinValue, setInternalMinValue] = useState(String(minValue ?? defaultMinValue ?? ''));
  const [internalMaxValue, setInternalMaxValue] = useState(String(maxValue ?? defaultMaxValue ?? ''));
  const minText = minValue === undefined ? internalMinValue : String(minValue);
  const maxText = maxValue === undefined ? internalMaxValue : String(maxValue);
  const warningText = getProcessNumberRangeWarning(minText, maxText);
  const invalid = Boolean(warningText);
  const fieldClass = invalid ? 'border-red-300 bg-red-50/60' : 'border-slate-200';

  return (
    <div className="relative">
      {invalid && warningPlacement === 'absolute' && (
        <div className="absolute -top-7 right-0 flex items-center gap-1 text-xs text-red-500">
          <CircleAlert className="size-3.5" />
          <span>{warningText}</span>
        </div>
      )}
      {invalid && warningPlacement === 'inline' && (
        <div className="mb-1 flex items-center gap-1 text-xs text-red-500">
          <CircleAlert className="size-3.5" />
          <span>{warningText}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-ds-150">
        <div className="ds-parameter-field">
          <div className="ds-parameter-label">{minLabel}</div>
          <div className="relative">
            <input
              value={minText}
              onChange={(event) => {
                if (minValue === undefined) {
                  setInternalMinValue(event.target.value);
                }
                onMinChange?.(event.target.value);
              }}
              className={`w-full rounded-lg border bg-white px-3 py-2 pr-12 text-sm text-slate-700 outline-none focus:border-orange-300 ${fieldClass}`}
            />
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${invalid ? 'text-red-300' : 'text-slate-300'}`}>{unit}</span>
          </div>
        </div>
        <div className="ds-parameter-field">
          <div className="ds-parameter-label">{maxLabel}</div>
          <div className="relative">
            <input
              value={maxText}
              onChange={(event) => {
                if (maxValue === undefined) {
                  setInternalMaxValue(event.target.value);
                }
                onMaxChange?.(event.target.value);
              }}
              className={`w-full rounded-lg border bg-white px-3 py-2 pr-12 text-sm text-slate-700 outline-none focus:border-orange-300 ${fieldClass}`}
            />
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${invalid ? 'text-red-300' : 'text-slate-300'}`}>{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessMultiSelectBlock({
  label,
  values,
  selectedValues,
  onToggle,
  className = '',
  variant = 'pill',
  compact = false,
}: {
  label: string;
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  className?: string;
  variant?: 'pill' | 'button';
  compact?: boolean;
}) {
  const empty = selectedValues.length === 0;
  const fieldClassName = compact ? 'ds-label-input-compact' : 'ds-parameter-field';
  const labelClassName = compact ? 'ds-label-input-compact-label' : 'ds-parameter-label';

  return (
    <div className={`${fieldClassName} ${className}`}>
      <div className={`${labelClassName} flex items-center justify-between gap-2`}>
        <span>{label}</span>
        {empty && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-red-500">
            <CircleAlert className="size-3.5" />
            至少选择一项
          </span>
        )}
      </div>
      <div className={variant === 'button' ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-1.5'}>
        {values.map((item) => {
          const selected = selectedValues.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              className={`border px-2 text-xs transition-colors ${
                compact
                  ? 'inline-flex min-h-8 items-center justify-center'
                  : ''
              } ${
                variant === 'button' ? 'rounded-lg py-1.5' : 'rounded-full py-1'
              } ${
                selected
                  ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text'
                  : empty
                    ? 'border-red-300 bg-white text-slate-500 hover:bg-red-50/40'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => onToggle(item)}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function STLModel({
  url,
  color,
  visible,
  showEdges = false,
  edgeColor = '#3b82f6',
  edgeOpacity,
  edgeWidth = 1.2,
  highlightOverlay = false,
  highlightOverlayColor = '#FACC15',
  highlightOverlayOpacity = PROCESS_SELECTION_OVERLAY_OPACITY,
  dimOverlay = false,
  dimOverlayColor = PROCESS_ISOLATION_DIMMED_OVERLAY_COLOR,
  dimOverlayOpacity = PROCESS_ISOLATION_DIMMED_OVERLAY_OPACITY,
  opacity = 1,
}: {
  url: string;
  color: string;
  visible: boolean;
  showEdges?: boolean;
  edgeColor?: string;
  edgeOpacity?: number;
  edgeWidth?: number;
  highlightOverlay?: boolean;
  highlightOverlayColor?: string;
  highlightOverlayOpacity?: number;
  dimOverlay?: boolean;
  dimOverlayColor?: string;
  dimOverlayOpacity?: number;
  opacity?: number;
}) {
  const loadedGeometry = useLoader(STLLoader, url);
  const geometry = useMemo(() => loadedGeometry.clone(), [loadedGeometry]);

  return (
    <group visible={visible}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
      </mesh>
      {dimOverlay && (
        <mesh geometry={geometry} renderOrder={14}>
          <meshBasicMaterial
            color={dimOverlayColor}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
            side={THREE.DoubleSide}
            transparent
            opacity={dimOverlayOpacity}
          />
        </mesh>
      )}
      {highlightOverlay && (
        <mesh geometry={geometry} renderOrder={15}>
          <meshBasicMaterial
            color={highlightOverlayColor}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
            side={THREE.DoubleSide}
            transparent
            opacity={highlightOverlayOpacity}
          />
        </mesh>
      )}
      {showEdges && <STLModelEdges geometry={geometry} color={edgeColor} opacity={edgeOpacity ?? 0.95 * opacity} width={edgeWidth} />}
    </group>
  );
}

function createWideEdgeGeometry(edgeGeometry: THREE.BufferGeometry) {
  const positionAttribute = edgeGeometry.getAttribute('position');
  const positions: number[] = [];

  for (let index = 0; index < positionAttribute.count - 1; index += 2) {
    const start = new THREE.Vector3().fromBufferAttribute(positionAttribute, index);
    const end = new THREE.Vector3().fromBufferAttribute(positionAttribute, index + 1);
    if (start.distanceToSquared(end) <= 0.000001) continue;
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  }

  const wideEdgeGeometry = new LineSegmentsGeometry();
  wideEdgeGeometry.setPositions(positions);
  return wideEdgeGeometry;
}

function STLModelEdges({
  geometry,
  color,
  opacity,
  width,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  opacity: number;
  width: number;
}) {
  const { size } = useThree();
  const edgeGeometry = useMemo(() => {
    const sourceEdges = new THREE.EdgesGeometry(geometry, 28);
    const wideEdges = createWideEdgeGeometry(sourceEdges);
    sourceEdges.dispose();
    return wideEdges;
  }, [geometry]);
  const line = useMemo(() => {
    const material = new LineMaterial({
      color: new THREE.Color(color).getHex(),
      transparent: true,
      opacity,
      linewidth: width,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      resolution: new THREE.Vector2(size.width, size.height),
    });
    const object = new LineSegments2(edgeGeometry, material);
    object.computeLineDistances();
    object.renderOrder = 16;
    return object;
  }, [color, edgeGeometry, opacity, size.height, size.width, width]);

  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);
  useEffect(() => () => line.material.dispose(), [line]);

  return <primitive object={line} />;
}

function GumballAxis({
  origin,
  direction,
  length,
  color,
  rotation,
}: {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  color: string;
  rotation: THREE.Euler;
}) {
  const axisDirection = useMemo(() => direction.clone().normalize().applyEuler(rotation), [direction, rotation]);
  const shaftLength = length * 0.72;
  const arrowLength = Math.max(length * 0.16, 1.2);
  const shaftRadius = Math.max(length * 0.006, 0.08);
  const arrowRadius = Math.max(length * 0.018, 0.24);
  const shaftCenter = useMemo(() => origin.clone().addScaledVector(axisDirection, shaftLength * 0.5), [axisDirection, origin, shaftLength]);
  const arrowCenter = useMemo(() => origin.clone().addScaledVector(axisDirection, shaftLength + arrowLength * 0.5), [axisDirection, arrowLength, origin, shaftLength]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisDirection), [axisDirection]);

  return (
    <group renderOrder={34}>
      <mesh position={shaftCenter} quaternion={quaternion} renderOrder={34}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 16]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
      </mesh>
      <mesh position={arrowCenter} quaternion={quaternion} renderOrder={35}>
        <coneGeometry args={[arrowRadius, arrowLength, 24]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.98} />
      </mesh>
      <mesh position={origin.clone().addScaledVector(axisDirection, length * 0.33)} renderOrder={33}>
        <sphereGeometry args={[shaftRadius * 1.55, 16, 16]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function GumballRotationRing({
  origin,
  normal,
  radius,
  color,
  rotation,
}: {
  origin: THREE.Vector3;
  normal: THREE.Vector3;
  radius: number;
  color: string;
  rotation: THREE.Euler;
}) {
  const ringNormal = useMemo(() => normal.clone().normalize().applyEuler(rotation), [normal, rotation]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), ringNormal), [ringNormal]);
  const tubeRadius = Math.max(radius * 0.012, 0.16);

  return (
    <group renderOrder={32}>
      <mesh position={origin} quaternion={quaternion} renderOrder={32}>
        <torusGeometry args={[radius, tubeRadius, 10, 96]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.58} />
      </mesh>
      <mesh position={origin} quaternion={quaternion} renderOrder={33} rotation={[0, 0, THREE.MathUtils.degToRad(42)]}>
        <torusGeometry args={[radius, tubeRadius * 1.45, 10, 18, THREE.MathUtils.degToRad(58)]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

function getGeometryVolumeCenter(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position;
  if (!(position instanceof THREE.BufferAttribute) || position.count < 3) return null;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const tetraCenter = new THREE.Vector3();
  const weightedCenter = new THREE.Vector3();
  let signedVolume = 0;

  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    const volume = a.dot(b.clone().cross(c)) / 6;
    if (!Number.isFinite(volume) || Math.abs(volume) < 1e-8) continue;
    tetraCenter.copy(a).add(b).add(c).multiplyScalar(0.25);
    weightedCenter.addScaledVector(tetraCenter, volume);
    signedVolume += volume;
  }

  if (Math.abs(signedVolume) < 1e-6) return null;
  return weightedCenter.divideScalar(signedVolume);
}

function createPivotSnapPoints(partId: string, box: THREE.Box3, volumeCenter: THREE.Vector3): PivotSnapPoint[] {
  const min = box.min;
  const max = box.max;
  const center = box.getCenter(new THREE.Vector3());
  const toTuple = (point: THREE.Vector3): [number, number, number] => [point.x, point.y, point.z];
  const cornerPoints = [
    ['角点 1', new THREE.Vector3(min.x, min.y, min.z)],
    ['角点 2', new THREE.Vector3(min.x, min.y, max.z)],
    ['角点 3', new THREE.Vector3(min.x, max.y, min.z)],
    ['角点 4', new THREE.Vector3(min.x, max.y, max.z)],
    ['角点 5', new THREE.Vector3(max.x, min.y, min.z)],
    ['角点 6', new THREE.Vector3(max.x, min.y, max.z)],
    ['角点 7', new THREE.Vector3(max.x, max.y, min.z)],
    ['角点 8', new THREE.Vector3(max.x, max.y, max.z)],
  ] as const;
  const faceCenterPoints = [
    ['-X 面中心', new THREE.Vector3(min.x, center.y, center.z)],
    ['+X 面中心', new THREE.Vector3(max.x, center.y, center.z)],
    ['-Y 面中心', new THREE.Vector3(center.x, min.y, center.z)],
    ['+Y 面中心', new THREE.Vector3(center.x, max.y, center.z)],
    ['-Z 面中心', new THREE.Vector3(center.x, center.y, min.z)],
    ['+Z 面中心', new THREE.Vector3(center.x, center.y, max.z)],
  ] as const;

  return [
    ...cornerPoints.map(([label, point], index) => ({
      id: `${partId}-corner-${index + 1}`,
      label,
      partId,
      position: toTuple(point),
      kind: 'corner' as const,
    })),
    {
      id: `${partId}-volume-center`,
      label: '体积中心',
      partId,
      position: toTuple(volumeCenter),
      kind: 'volume-center' as const,
    },
    ...faceCenterPoints.map(([label, point], index) => ({
      id: `${partId}-face-center-${index + 1}`,
      label,
      partId,
      position: toTuple(point),
      kind: 'face-center' as const,
    })),
  ];
}

const coordinateTransformGumballAxisLength = 1231.1;
const backSidePartPattern = /-(03|04)$/;

function isBackSidePart(partId: string) {
  return backSidePartPattern.test(partId);
}

function getGumballBaseRotation(parts: SelectableFacePart[]) {
  return parts.length > 0 && parts.every((part) => isBackSidePart(part.id))
    ? new THREE.Euler(0, Math.PI, 0, 'XYZ')
    : new THREE.Euler(0, 0, 0, 'XYZ');
}

function parseCoordinateTransformOffsetValue(value?: string) {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function GumballPivotOverlay({
  pivotCenter,
  pivotLabel,
  pivotOffset,
  baseRotation,
}: {
  pivotCenter: THREE.Vector3;
  pivotLabel: string;
  pivotOffset?: ProcessPosePoint;
  baseRotation?: THREE.Euler;
}) {
  const axisLength = coordinateTransformGumballAxisLength;
  const pivotTransform = useMemo(() => {
    const x = parseCoordinateTransformOffsetValue(pivotOffset?.x);
    const y = parseCoordinateTransformOffsetValue(pivotOffset?.y);
    const z = parseCoordinateTransformOffsetValue(pivotOffset?.z);
    const rx = THREE.MathUtils.degToRad(parseCoordinateTransformOffsetValue(pivotOffset?.rx));
    const ry = THREE.MathUtils.degToRad(parseCoordinateTransformOffsetValue(pivotOffset?.ry));
    const rz = THREE.MathUtils.degToRad(parseCoordinateTransformOffsetValue(pivotOffset?.rz));
    const base = baseRotation ?? new THREE.Euler(0, 0, 0, 'XYZ');
    const rotation = base.clone();
    rotation.x += rx;
    rotation.y += ry;
    rotation.z += rz;
    return {
      positionOffset: new THREE.Vector3(x, y, z),
      rotation,
    };
  }, [baseRotation, pivotOffset]);
  const transformedPivotCenter = useMemo(
    () => pivotCenter.clone().add(pivotTransform.positionOffset),
    [pivotCenter, pivotTransform]
  );
  const xEnd = useMemo(
    () => transformedPivotCenter.clone().add(new THREE.Vector3(axisLength, 0, 0).applyEuler(pivotTransform.rotation)),
    [axisLength, transformedPivotCenter, pivotTransform]
  );
  const yEnd = useMemo(
    () => transformedPivotCenter.clone().add(new THREE.Vector3(0, axisLength, 0).applyEuler(pivotTransform.rotation)),
    [axisLength, transformedPivotCenter, pivotTransform]
  );
  const zEnd = useMemo(
    () => transformedPivotCenter.clone().add(new THREE.Vector3(0, 0, axisLength).applyEuler(pivotTransform.rotation)),
    [axisLength, transformedPivotCenter, pivotTransform]
  );
  const pivotSphereRadius = Math.min(Math.max(axisLength * 0.035, 0.8), 2.6);
  const ringRadius = axisLength * 0.54;

  return (
    <group renderOrder={33}>
      <mesh position={transformedPivotCenter} renderOrder={33}>
        <sphereGeometry args={[pivotSphereRadius, 16, 16]} />
        <meshBasicMaterial color="#FF6900" depthTest={false} />
      </mesh>
      <GumballRotationRing origin={transformedPivotCenter} normal={new THREE.Vector3(1, 0, 0)} radius={ringRadius} color="#ef4444" rotation={pivotTransform.rotation} />
      <GumballRotationRing origin={transformedPivotCenter} normal={new THREE.Vector3(0, 1, 0)} radius={ringRadius * 0.94} color="#22c55e" rotation={pivotTransform.rotation} />
      <GumballRotationRing origin={transformedPivotCenter} normal={new THREE.Vector3(0, 0, 1)} radius={ringRadius * 0.88} color="#3b82f6" rotation={pivotTransform.rotation} />
      <GumballAxis origin={transformedPivotCenter} direction={new THREE.Vector3(1, 0, 0)} length={axisLength} color="#ef4444" rotation={pivotTransform.rotation} />
      <GumballAxis origin={transformedPivotCenter} direction={new THREE.Vector3(0, 1, 0)} length={axisLength} color="#22c55e" rotation={pivotTransform.rotation} />
      <GumballAxis origin={transformedPivotCenter} direction={new THREE.Vector3(0, 0, 1)} length={axisLength} color="#3b82f6" rotation={pivotTransform.rotation} />
      {[
        { label: 'X', position: xEnd, color: '#ef4444' },
        { label: 'Y', position: yEnd, color: '#16a34a' },
        { label: 'Z', position: zEnd, color: '#2563eb' },
      ].map((axis) => (
        <Html key={axis.label} position={axis.position} center distanceFactor={8}>
          <span
            className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold shadow-sm ring-1 ring-slate-200"
            style={{ color: axis.color }}
          >
            {axis.label}
          </span>
        </Html>
      ))}
      <Html position={transformedPivotCenter.clone().add(new THREE.Vector3(0, -axisLength * 0.18, 0))} center distanceFactor={8}>
        <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-ds-brand-primary-text shadow-sm ring-1 ring-orange-100">
          {pivotLabel}
        </span>
      </Html>
    </group>
  );
}

function SelectedPartGumballOverlay({ parts }: { parts: SelectableFacePart[] }) {
  const loadedGeometries = useLoader(STLLoader, parts.map((part) => part.url));
  const center = useMemo(() => {
    const geometries = Array.isArray(loadedGeometries) ? loadedGeometries : [loadedGeometries];
    const unionBox = new THREE.Box3();
    geometries.forEach((loadedGeometry) => {
      const geometry = loadedGeometry.clone();
      geometry.computeBoundingBox();
      const box = geometry.boundingBox?.clone();
      if (box) unionBox.union(box);
      geometry.dispose();
    });
    if (unionBox.isEmpty()) unionBox.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    return unionBox.getCenter(new THREE.Vector3());
  }, [loadedGeometries]);
  const label = parts.length === 1 ? `${parts[0].name} 操作轴` : `多选零件(${parts.length}) 操作轴`;
  const baseRotation = useMemo(() => getGumballBaseRotation(parts), [parts]);

  return <GumballPivotOverlay pivotCenter={center} pivotLabel={label} baseRotation={baseRotation} />;
}

function CoordinateTransformOverlayModel({
  parts,
  pivotPoint,
  pivotOffset,
}: {
  parts: SelectableFacePart[];
  pivotPoint?: PivotSnapPoint | null;
  pivotOffset?: ProcessPosePoint;
}) {
  const loadedGeometries = useLoader(STLLoader, parts.map((part) => part.url));
  const { boxes, center } = useMemo(() => {
    const geometries = Array.isArray(loadedGeometries) ? loadedGeometries : [loadedGeometries];
    const partBoxes = geometries.map((loadedGeometry) => {
      const geometry = loadedGeometry.clone();
      geometry.computeBoundingBox();
      const box = geometry.boundingBox?.clone() ?? new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
      geometry.dispose();
      return box;
    });
    const unionBox = new THREE.Box3();
    partBoxes.forEach((box) => unionBox.union(box));
    if (unionBox.isEmpty()) unionBox.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    return {
      boxes: partBoxes,
      center: unionBox.getCenter(new THREE.Vector3()),
    };
  }, [loadedGeometries]);
  const boxHelpers = useMemo(() => boxes.map((box) => new THREE.Box3Helper(box, '#FF6900')), [boxes]);
  const pivotCenter = useMemo(
    () => (pivotPoint ? new THREE.Vector3(...pivotPoint.position) : center),
    [center, pivotPoint]
  );
  const baseRotation = useMemo(() => getGumballBaseRotation(parts), [parts]);

  useEffect(() => () => {
    boxHelpers.forEach((boxHelper) => {
      boxHelper.geometry.dispose();
      if (Array.isArray(boxHelper.material)) {
        boxHelper.material.forEach((material) => material.dispose());
      } else {
        boxHelper.material.dispose();
      }
    });
  }, [boxHelpers]);

  return (
    <group renderOrder={31}>
      {boxHelpers.map((boxHelper, index) => (
        <primitive key={`coordinate-transform-box-${parts[index]?.id ?? index}`} object={boxHelper} />
      ))}
      <GumballPivotOverlay
        pivotCenter={pivotCenter}
        pivotLabel={pivotPoint ? pivotPoint.label : '质心 Pivot'}
        pivotOffset={pivotOffset}
        baseRotation={baseRotation}
      />
    </group>
  );
}

function CoordinateTransformSnapPointOverlay({
  parts,
  selectedPoint,
  onPointClick,
}: {
  parts: SelectableFacePart[];
  selectedPoint?: PivotSnapPoint | null;
  onPointClick: (point: PivotSnapPoint) => void;
}) {
  const loadedGeometries = useLoader(STLLoader, parts.map((part) => part.url));
  const { snapPartItems, points, visualRadius, hitRadius, surfaceSnapDistance } = useMemo(() => {
    const geometries = Array.isArray(loadedGeometries) ? loadedGeometries : [loadedGeometries];
    const partItems = parts.map((part, index) => {
      const loadedGeometry = geometries[index];
      const geometry = loadedGeometry.clone();
      geometry.computeBoundingBox();
      const box = geometry.boundingBox?.clone() ?? new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
      const boxCenter = box.getCenter(new THREE.Vector3());
      const volumeCenter = getGeometryVolumeCenter(geometry) ?? boxCenter;
      return {
        part,
        geometry,
        box,
        points: createPivotSnapPoints(part.id, box, volumeCenter).map((point) => ({
          ...point,
          label: `${part.name} ${point.label}`,
        })),
      };
    });
    const allPoints = partItems.flatMap((item) => item.points);
    const unionBox = new THREE.Box3();
    partItems.forEach((item) => unionBox.union(item.box));
    if (unionBox.isEmpty()) unionBox.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    const size = unionBox.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 1);
    const radius = Math.min(Math.max(maxSize * 0.018, 1.2), 4.2) * 3;
    return {
      snapPartItems: partItems,
      points: allPoints,
      visualRadius: radius,
      hitRadius: Math.max(radius * 2.1, 3),
      surfaceSnapDistance: Math.max(radius * 2.4, 5),
    };
  }, [loadedGeometries, parts]);

  useEffect(() => () => {
    snapPartItems.forEach((item) => item.geometry.dispose());
  }, [snapPartItems]);

  const displayPoints = useMemo(() => {
    if (!selectedPoint || points.some((point) => point.id === selectedPoint.id)) return points;
    return [...points, selectedPoint];
  }, [points, selectedPoint]);

  return (
    <group renderOrder={42}>
      {snapPartItems.map((item) => (
        <mesh
          key={`coordinate-transform-surface-hit-${item.part.id}`}
          geometry={item.geometry}
          renderOrder={41}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            const hitPoint = event.point;
            const nearestSnapPoint = points.reduce<{ point: PivotSnapPoint; distance: number } | null>((nearest, point) => {
              const distance = hitPoint.distanceTo(new THREE.Vector3(...point.position));
              if (distance > surfaceSnapDistance) return nearest;
              if (!nearest || distance < nearest.distance) return { point, distance };
              return nearest;
            }, null);
            if (nearestSnapPoint) {
              onPointClick(nearestSnapPoint.point);
              return;
            }
            onPointClick({
              id: `${item.part.id}-surface-${hitPoint.x.toFixed(2)}-${hitPoint.y.toFixed(2)}-${hitPoint.z.toFixed(2)}`,
              label: `${item.part.name} 面上选点`,
              partId: item.part.id,
              position: [hitPoint.x, hitPoint.y, hitPoint.z],
              kind: 'surface',
            });
          }}
        >
          <meshBasicMaterial color="#ffffff" depthWrite={false} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {displayPoints.map((point) => {
        const selected = selectedPoint?.id === point.id;
        const position = new THREE.Vector3(...point.position);
        return (
          <group key={point.id}>
            <mesh
              position={position}
              renderOrder={45}
              onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                onPointClick(point);
              }}
            >
              <sphereGeometry args={[hitRadius, 12, 12]} />
              <meshBasicMaterial color="#ffffff" depthTest={false} transparent opacity={0} />
            </mesh>
            <mesh position={position} renderOrder={46}>
              <sphereGeometry args={[selected ? visualRadius * 1.35 : visualRadius, 20, 20]} />
              <meshBasicMaterial color={selected ? '#EA580C' : '#FDE68A'} depthTest={false} transparent opacity={selected ? 1 : 0.92} />
            </mesh>
            {selected && (
              <Html position={position.clone().add(new THREE.Vector3(0, visualRadius * 3.2, 0))} center distanceFactor={8}>
                <span className="whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-ds-brand-primary-text shadow-sm ring-1 ring-orange-200">
                  {point.label}
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

const selectableFaceNormalTolerance = Math.cos(THREE.MathUtils.degToRad(4));
const selectableFacePlaneTolerance = 1.5;
const selectableFaceMaxCountPerPart = 80;
const segmentPointTolerance = 0.1;
const selectablePlateSideThinRatioThreshold = 0.7;
const selectablePlateSidePerpendicularTolerance = Math.sin(THREE.MathUtils.degToRad(20));
const selectablePlateSideNormalTolerance = Math.cos(THREE.MathUtils.degToRad(60));
const selectablePlateSideMinRingTriangleCount = 6;
const selectablePlateSideNormalSpanThreshold = THREE.MathUtils.degToRad(90);

function getTrianglePoint(position: THREE.BufferAttribute, triangleIndex: number, vertexIndex: 0 | 1 | 2) {
  return new THREE.Vector3().fromBufferAttribute(position, triangleIndex * 3 + vertexIndex);
}

function computeTriangleNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  return new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
}

function createTriangleData(position: THREE.BufferAttribute, triangleIndex: number): SelectableFaceTriangle {
  const a = getTrianglePoint(position, triangleIndex, 0);
  const b = getTrianglePoint(position, triangleIndex, 1);
  const c = getTrianglePoint(position, triangleIndex, 2);
  const normal = computeTriangleNormal(a, b, c);
  const box = new THREE.Box3().setFromPoints([a, b, c]);
  return {
    a,
    b,
    c,
    normal,
    planeConstant: normal.dot(a),
    box,
  };
}

function createFaceGeometryFromTriangles(position: THREE.BufferAttribute, triangleIndices: number[]) {
  const positions: number[] = [];

  for (const triangleIndex of triangleIndices) {
    for (const vertexIndex of [0, 1, 2] as const) {
      const point = getTrianglePoint(position, triangleIndex, vertexIndex);
      positions.push(point.x, point.y, point.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function getTrianglesForFace(position: THREE.BufferAttribute, triangleIndices: number[]) {
  return triangleIndices.map((triangleIndex) => createTriangleData(position, triangleIndex));
}

function getBoxForTriangles(triangles: SelectableFaceTriangle[]) {
  const box = new THREE.Box3();
  triangles.forEach((triangle) => box.union(triangle.box));
  return box;
}

function isPointInTriangle(point: THREE.Vector3, triangle: SelectableFaceTriangle) {
  const v0 = new THREE.Vector3().subVectors(triangle.c, triangle.a);
  const v1 = new THREE.Vector3().subVectors(triangle.b, triangle.a);
  const v2 = new THREE.Vector3().subVectors(point, triangle.a);
  const dot00 = v0.dot(v0);
  const dot01 = v0.dot(v1);
  const dot02 = v0.dot(v2);
  const dot11 = v1.dot(v1);
  const dot12 = v1.dot(v2);
  const denominator = dot00 * dot11 - dot01 * dot01;
  if (Math.abs(denominator) < 1e-8) return false;
  const u = (dot11 * dot02 - dot01 * dot12) / denominator;
  const v = (dot00 * dot12 - dot01 * dot02) / denominator;
  return u >= -1e-5 && v >= -1e-5 && u + v <= 1 + 1e-5;
}

function uniquePoints(points: THREE.Vector3[]) {
  const result: THREE.Vector3[] = [];
  points.forEach((point) => {
    if (!result.some((existing) => existing.distanceTo(point) <= segmentPointTolerance)) {
      result.push(point);
    }
  });
  return result;
}

function trianglePlaneIntersections(source: SelectableFaceTriangle, target: SelectableFaceTriangle) {
  const points: THREE.Vector3[] = [];
  const vertices = [source.a, source.b, source.c];
  const edges: [THREE.Vector3, THREE.Vector3][] = [
    [vertices[0], vertices[1]],
    [vertices[1], vertices[2]],
    [vertices[2], vertices[0]],
  ];

  edges.forEach(([start, end]) => {
    const startDistance = target.normal.dot(start) - target.planeConstant;
    const endDistance = target.normal.dot(end) - target.planeConstant;
    if (Math.abs(startDistance) <= segmentPointTolerance && isPointInTriangle(start, target)) {
      points.push(start.clone());
    }
    if (Math.abs(endDistance) <= segmentPointTolerance && isPointInTriangle(end, target)) {
      points.push(end.clone());
    }
    if (startDistance * endDistance >= 0) return;
    const t = startDistance / (startDistance - endDistance);
    if (t < -1e-5 || t > 1 + 1e-5) return;
    const point = start.clone().lerp(end, t);
    if (isPointInTriangle(point, target)) points.push(point);
  });

  return points;
}

function intersectTriangles(a: SelectableFaceTriangle, b: SelectableFaceTriangle): IntersectionSegment | null {
  if (!a.box.clone().expandByScalar(segmentPointTolerance).intersectsBox(b.box)) return null;
  if (Math.abs(a.normal.dot(b.normal)) > 0.9995) return null;

  const points = uniquePoints([
    ...trianglePlaneIntersections(a, b),
    ...trianglePlaneIntersections(b, a),
  ]);

  if (points.length < 2) return null;
  let bestStart = points[0];
  let bestEnd = points[1];
  let bestDistance = bestStart.distanceTo(bestEnd);
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const distance = points[i].distanceTo(points[j]);
      if (distance > bestDistance) {
        bestStart = points[i];
        bestEnd = points[j];
        bestDistance = distance;
      }
    }
  }
  if (bestDistance <= segmentPointTolerance) return null;
  return { start: bestStart, end: bestEnd };
}

function getSegmentKey(segment: IntersectionSegment) {
  const pointKey = (point: THREE.Vector3) =>
    `${Math.round(point.x * 10)},${Math.round(point.y * 10)},${Math.round(point.z * 10)}`;
  return [pointKey(segment.start), pointKey(segment.end)].sort().join('|');
}

function mergeIntersectionSegments(segments: IntersectionSegment[]): ManualWeldCandidate[] {
  const uniqueSegments = Array.from(
    new Map(segments.map((segment) => [getSegmentKey(segment), segment])).values()
  );
  const visited = new Set<number>();
  const pointKey = (point: THREE.Vector3) =>
    `${Math.round(point.x / 4)},${Math.round(point.y / 4)},${Math.round(point.z / 4)}`;
  const endpointToSegmentIndexes = new Map<string, number[]>();

  uniqueSegments.forEach((segment, index) => {
    [pointKey(segment.start), pointKey(segment.end)].forEach((key) => {
      const indexes = endpointToSegmentIndexes.get(key);
      if (indexes) {
        indexes.push(index);
      } else {
        endpointToSegmentIndexes.set(key, [index]);
      }
    });
  });

  const candidates: ManualWeldCandidate[] = [];

  uniqueSegments.forEach((_, startIndex) => {
    if (visited.has(startIndex)) return;
    const stack = [startIndex];
    const group: IntersectionSegment[] = [];
    visited.add(startIndex);

    while (stack.length > 0) {
      const currentIndex = stack.pop()!;
      const current = uniqueSegments[currentIndex];
      group.push(current);
      [pointKey(current.start), pointKey(current.end)].forEach((key) => {
        endpointToSegmentIndexes.get(key)?.forEach((nextIndex) => {
          if (visited.has(nextIndex)) return;
          visited.add(nextIndex);
          stack.push(nextIndex);
        });
      });
    }

    const length = group.reduce((sum, segment) => sum + segment.start.distanceTo(segment.end), 0);
    if (length > segmentPointTolerance * 3) {
      candidates.push({
        id: `manual-weld-segment-${String(candidates.length + 1).padStart(2, '0')}`,
        segments: group,
        length,
      });
    }
  });

  return candidates.sort((a, b) => b.length - a.length);
}

function computeManualWeldCandidatesFromFaces(selectedFaces: SelectableFaceGeometry[]): ManualWeldCandidate[] {
  const segments: IntersectionSegment[] = [];

  for (let i = 0; i < selectedFaces.length; i += 1) {
    for (let j = i + 1; j < selectedFaces.length; j += 1) {
      const faceA = selectedFaces[i];
      const faceB = selectedFaces[j];
      if (faceA.partId === faceB.partId) continue;
      if (!faceA.box.clone().expandByScalar(segmentPointTolerance).intersectsBox(faceB.box)) continue;

      faceA.triangles.forEach((triangleA) => {
        faceB.triangles.forEach((triangleB) => {
          const segment = intersectTriangles(triangleA, triangleB);
          if (segment) segments.push(segment);
        });
      });
    }
  }

  return mergeIntersectionSegments(segments).slice(0, 8);
}

function extractPlateSideRings(
  sourceGeometry: THREE.BufferGeometry,
  partId: string,
): { faces: SelectableFaceGeometry[]; usedTriangles: Set<number> } {
  const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!position) {
    if (geometry !== sourceGeometry) geometry.dispose();
    return { faces: [], usedTriangles: new Set() };
  }

  const triangleCount = position.count / 3;

  // Compute bounding box and determine axis candidates sorted by size (smallest first).
  const box = new THREE.Box3();
  for (let i = 0; i < position.count; i += 1) {
    box.expandByPoint(new THREE.Vector3().fromBufferAttribute(position, i));
  }
  const size = new THREE.Vector3();
  box.getSize(size);

  const axisCandidates = [
    { axis: new THREE.Vector3(1, 0, 0), size: size.x, name: 'X' },
    { axis: new THREE.Vector3(0, 1, 0), size: size.y, name: 'Y' },
    { axis: new THREE.Vector3(0, 0, 1), size: size.z, name: 'Z' },
  ];
  axisCandidates.sort((a, b) => a.size - b.size);

  // Compute triangle normals (axis-independent, computed once).
  const triangleNormals: THREE.Vector3[] = [];
  for (let i = 0; i < triangleCount; i += 1) {
    const a = getTrianglePoint(position, i, 0);
    const b = getTrianglePoint(position, i, 1);
    const c = getTrianglePoint(position, i, 2);
    triangleNormals.push(computeTriangleNormal(a, b, c));
  }

  // Build edge adjacency (axis-independent, computed once).
  const vertexKey = (point: THREE.Vector3) =>
    `${Math.round(point.x * 1000)},${Math.round(point.y * 1000)},${Math.round(point.z * 1000)}`;
  const edgeKey = (a: THREE.Vector3, b: THREE.Vector3) => {
    const keys = [vertexKey(a), vertexKey(b)].sort();
    return `${keys[0]}|${keys[1]}`;
  };

  const edgeToTriangles = new Map<string, number[]>();
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const a = getTrianglePoint(position, triangleIndex, 0);
    const b = getTrianglePoint(position, triangleIndex, 1);
    const c = getTrianglePoint(position, triangleIndex, 2);
    [edgeKey(a, b), edgeKey(b, c), edgeKey(c, a)].forEach((key) => {
      const triangles = edgeToTriangles.get(key);
      if (triangles) {
        triangles.push(triangleIndex);
      } else {
        edgeToTriangles.set(key, [triangleIndex]);
      }
    });
  }

  // Helper: given a candidate axis, try to extract side rings.
  // Returns the number of valid rings found for this axis (0 = no valid rings).
  const tryExtractRingsForAxis = (
    thinAxis: THREE.Vector3,
  ): { faces: SelectableFaceGeometry[]; usedTriangles: Set<number> } | null => {
    // Identify side triangles whose normals are roughly perpendicular to the thin axis.
    const sideTriangleSet = new Set<number>();
    for (let i = 0; i < triangleCount; i += 1) {
      if (Math.abs(triangleNormals[i].dot(thinAxis)) <= selectablePlateSidePerpendicularTolerance) {
        sideTriangleSet.add(i);
      }
    }
    if (sideTriangleSet.size === 0) return null;

    // Build adjacency restricted to side triangles with a relaxed normal tolerance,
    // so that flat side faces and their connecting chamfers/fillets merge into one ring.
    const sideAdjacency: number[][] = Array.from({ length: triangleCount }, () => []);
    edgeToTriangles.forEach((triangles) => {
      if (triangles.length < 2) return;
      for (let i = 0; i < triangles.length; i += 1) {
        for (let j = i + 1; j < triangles.length; j += 1) {
          const a = triangles[i];
          const b = triangles[j];
          if (!sideTriangleSet.has(a) || !sideTriangleSet.has(b)) continue;
          if (triangleNormals[a].dot(triangleNormals[b]) < selectablePlateSideNormalTolerance) continue;
          sideAdjacency[a].push(b);
          sideAdjacency[b].push(a);
        }
      }
    });

    // Group connected side triangles.
    const visited = new Set<number>();
    const ringGroups: number[][] = [];
    for (let start = 0; start < triangleCount; start += 1) {
      if (!sideTriangleSet.has(start) || visited.has(start)) continue;
      const stack = [start];
      const group: number[] = [];
      visited.add(start);

      while (stack.length > 0) {
        const current = stack.pop()!;
        group.push(current);
        for (const next of sideAdjacency[current]) {
          if (visited.has(next)) continue;
          visited.add(next);
          stack.push(next);
        }
      }

      ringGroups.push(group);
    }

    // Create a selectable face for each group whose normals span a significant angle
    // around the thin axis. This confirms it is a closed side ring rather than a single flat face.
    const faces: SelectableFaceGeometry[] = [];
    const usedTriangles = new Set<number>();
    let ringIndex = 0;

    for (const group of ringGroups) {
      if (group.length < selectablePlateSideMinRingTriangleCount) continue;

      let maxAngle = 0;
      for (let i = 0; i < group.length; i += 1) {
        const n1 = triangleNormals[group[i]].clone().projectOnPlane(thinAxis).normalize();
        for (let j = i + 1; j < group.length; j += 1) {
          const n2 = triangleNormals[group[j]].clone().projectOnPlane(thinAxis).normalize();
          const dotVal = Math.max(-1, Math.min(1, n1.dot(n2)));
          const angle = Math.acos(dotVal);
          if (angle > maxAngle) maxAngle = angle;
        }
      }

      if (maxAngle < selectablePlateSideNormalSpanThreshold) continue;

      ringIndex += 1;
      const triSet = getTrianglesForFace(position, group);
      faces.push({
        id: `${partId}-side-ring-${String(ringIndex).padStart(2, '0')}`,
        partId,
        geometry: createFaceGeometryFromTriangles(position, group),
        triangleCount: group.length,
        triangles: triSet,
        box: getBoxForTriangles(triSet),
      });
      group.forEach((idx) => usedTriangles.add(idx));
    }

    if (faces.length === 0) return null;
    return { faces, usedTriangles };
  };

  // Determine which axes to try:
  // - Thinnest axis always gets first chance, with thin-plate ratio check.
  // - If the thinnest axis passes the ratio check, only it is tried (current behavior).
  // - If the ratio check fails, fall back and try the 2nd and 3rd axes as well.
  const thinCandidate = axisCandidates[0];
  const isThinPlate =
    thinCandidate.size > 0 &&
    thinCandidate.size / axisCandidates[1].size < selectablePlateSideThinRatioThreshold;

  const axesToTry: THREE.Vector3[] = [];
  if (isThinPlate) {
    // Thinnest axis qualifies as thin plate — only try this one.
    axesToTry.push(thinCandidate.axis);
  } else {
    // Not a thin plate — try all three axes as fallback, thinnest first.
    for (const candidate of axisCandidates) {
      if (candidate.size === 0) continue;
      axesToTry.push(candidate.axis);
    }
  }

  // Try each candidate axis; return the first one that yields valid rings.
  for (const axis of axesToTry) {
    const result = tryExtractRingsForAxis(axis);
    if (result) {
      if (geometry !== sourceGeometry) geometry.dispose();
      return result;
    }
  }

  // No axis yielded valid side rings.
  if (geometry !== sourceGeometry) geometry.dispose();
  return { faces: [], usedTriangles: new Set() };
}

function extractSelectableFacesFromGeometry(
  sourceGeometry: THREE.BufferGeometry,
  partId: string,
): SelectableFaceGeometry[] {
  const plateSideRings = extractPlateSideRings(sourceGeometry, partId);

  const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!position) {
    if (geometry !== sourceGeometry) geometry.dispose();
    return plateSideRings.faces;
  }

  const triangleCount = position.count / 3;
  const triangleNormals: THREE.Vector3[] = [];
  const trianglePlaneConstants: number[] = [];
  const edgeToTriangles = new Map<string, number[]>();

  const vertexKey = (point: THREE.Vector3) =>
    `${Math.round(point.x * 1000)},${Math.round(point.y * 1000)},${Math.round(point.z * 1000)}`;
  const edgeKey = (a: THREE.Vector3, b: THREE.Vector3) => {
    const keys = [vertexKey(a), vertexKey(b)].sort();
    return `${keys[0]}|${keys[1]}`;
  };

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const a = getTrianglePoint(position, triangleIndex, 0);
    const b = getTrianglePoint(position, triangleIndex, 1);
    const c = getTrianglePoint(position, triangleIndex, 2);
    const normal = computeTriangleNormal(a, b, c);
    triangleNormals.push(normal);
    trianglePlaneConstants.push(normal.dot(a));

    [
      edgeKey(a, b),
      edgeKey(b, c),
      edgeKey(c, a),
    ].forEach((key) => {
      const triangles = edgeToTriangles.get(key);
      if (triangles) {
        triangles.push(triangleIndex);
      } else {
        edgeToTriangles.set(key, [triangleIndex]);
      }
    });
  }

  const adjacency = Array.from({ length: triangleCount }, () => [] as number[]);
  edgeToTriangles.forEach((triangles) => {
    if (triangles.length < 2) return;
    for (let i = 0; i < triangles.length; i += 1) {
      for (let j = i + 1; j < triangles.length; j += 1) {
        adjacency[triangles[i]].push(triangles[j]);
        adjacency[triangles[j]].push(triangles[i]);
      }
    }
  });

  const visited = new Set<number>(plateSideRings.usedTriangles);
  const faceTriangleGroups: number[][] = [];

  for (let start = 0; start < triangleCount; start += 1) {
    if (visited.has(start)) continue;
    const stack = [start];
    const group: number[] = [];
    visited.add(start);

    while (stack.length > 0) {
      const current = stack.pop()!;
      group.push(current);
      const currentNormal = triangleNormals[current];
      const currentPlane = trianglePlaneConstants[current];

      for (const next of adjacency[current]) {
        if (visited.has(next)) continue;
        const normalMatches = currentNormal.dot(triangleNormals[next]) >= selectableFaceNormalTolerance;
        const planeMatches = Math.abs(currentPlane - trianglePlaneConstants[next]) <= selectableFacePlaneTolerance;
        if (!normalMatches || !planeMatches) continue;
        visited.add(next);
        stack.push(next);
      }
    }

    faceTriangleGroups.push(group);
  }

  if (geometry !== sourceGeometry) geometry.dispose();

  const planarFaces = faceTriangleGroups
    .sort((a, b) => b.length - a.length)
    .map((triangleIndices, index) => {
      const triangles = getTrianglesForFace(position, triangleIndices);
      return {
        id: `${partId}-face-${String(index + 1).padStart(2, '0')}`,
        partId,
        geometry: createFaceGeometryFromTriangles(position, triangleIndices),
        triangleCount: triangleIndices.length,
        triangles,
        box: getBoxForTriangles(triangles),
      };
    });

  return [...plateSideRings.faces, ...planarFaces]
    .sort((a, b) => b.triangleCount - a.triangleCount)
    .slice(0, selectableFaceMaxCountPerPart);
}

function SelectableFaceOverlayModel({
  part,
  selectedFaceIds,
  onFaceClick,
  onFacesReady,
}: {
  part: SelectableFacePart;
  selectedFaceIds: string[];
  onFaceClick: (faceId: string, additive: boolean) => void;
  onFacesReady?: (partId: string, faces: SelectableFaceGeometry[]) => void;
}) {
  const loadedGeometry = useLoader(STLLoader, part.url);
  const faces = useMemo(
    () => extractSelectableFacesFromGeometry(loadedGeometry, part.id),
    [loadedGeometry, part.id]
  );

  useEffect(() => () => {
    faces.forEach((face) => face.geometry.dispose());
  }, [faces]);

  useEffect(() => {
    onFacesReady?.(part.id, faces);
  }, [faces, onFacesReady, part.id]);

  return (
    <group>
      {faces.map((face) => {
        const selected = selectedFaceIds.includes(face.id);
        return (
          <mesh
            key={face.id}
            geometry={face.geometry}
            renderOrder={selected ? 28 : 24}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              onFaceClick(face.id, event.ctrlKey || event.metaKey);
            }}
          >
            <meshBasicMaterial
              color={selected ? '#f97316' : '#38bdf8'}
              depthTest={false}
              transparent
              opacity={selected ? 0.62 : 0.28}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function ManualWeldCandidateModel({
  candidate,
  selected,
  onClick,
}: {
  candidate: ManualWeldCandidate;
  selected?: boolean;
  onClick: () => void;
}) {
  const style = selected
    ? { radius: 5, color: '#fb923c', opacity: 1, depthTest: false }
    : { radius: 3.5, color: '#f97316', opacity: 0.88, depthTest: false };

  return (
    <group onClick={(event) => { event.stopPropagation(); onClick(); }}>
      {candidate.segments.map((segment, index) => (
        <ThickIntersectionSegment
          key={`${candidate.id}-${index}`}
          segment={segment}
          radius={style.radius}
          color={style.color}
          opacity={style.opacity}
          depthTest={style.depthTest}
        />
      ))}
    </group>
  );
}

type IntersectionSegment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
};

function parseRhinoObjCurves(text: string): IntersectionSegment[] {
  const vertices: THREE.Vector3[] = [];
  const segments: IntersectionSegment[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts[0] === 'v') {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        // Rhino OBJ curve export is Y-up here, while the STL assembly is Z-up with mirrored Y.
        vertices.push(new THREE.Vector3(x, -z, y));
      }
      continue;
    }

    if (parts[0] === 'curv') {
      const curvePointIndices = parts.slice(3)
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value));

      for (let i = 0; i < curvePointIndices.length - 1; i += 1) {
        const a = vertices[curvePointIndices[i] - 1];
        const b = vertices[curvePointIndices[i + 1] - 1];
        if (!a || !b) continue;
        segments.push({ start: a.clone(), end: b.clone() });
      }
    }
  }

  return segments;
}

function parseRhinoObjFaces(text: string): THREE.BufferGeometry {
  const vertices: THREE.Vector3[] = [];
  const positions: number[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts[0] === 'v') {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        vertices.push(new THREE.Vector3(x, -z, y));
      }
      continue;
    }

    if (parts[0] === 'f') {
      const indices = parts.slice(1)
        .map((value) => Number.parseInt(value.split('/')[0], 10))
        .filter((value) => Number.isFinite(value));

      for (let i = 1; i < indices.length - 1; i += 1) {
        const triangle = [indices[0], indices[i], indices[i + 1]];
        for (const index of triangle) {
          const point = vertices[index - 1];
          if (point) positions.push(point.x, point.y, point.z);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const weldFeatureStyle = {
  normal: {
    radius: 2.5,
    color: '#f59e0b',
    opacity: 0.7,
    depthTest: true,
  },
  highlighted: {
    radius: 3.5,
    color: '#fdba74',
    opacity: 0.92,
    depthTest: false,
  },
  selected: {
    radius: 5,
    color: '#fb923c',
    opacity: 1,
    depthTest: false,
  },
};

const grindFeatureStyle = {
  normal: {
    color: '#14b8a6',
    opacity: 0.34,
    depthTest: true,
  },
  highlighted: {
    color: '#2dd4bf',
    opacity: 0.58,
    depthTest: false,
  },
  selected: {
    color: '#22d3ee',
    opacity: 0.82,
    depthTest: false,
  },
};

function ThickIntersectionSegment({
  segment,
  radius,
  color,
  opacity,
  depthTest,
}: {
  segment: IntersectionSegment;
  radius: number;
  color: string;
  opacity: number;
  depthTest: boolean;
}) {
  const transform = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(segment.end, segment.start);
    const length = direction.length();
    const position = new THREE.Vector3().addVectors(segment.start, segment.end).multiplyScalar(0.5);
    if (length <= 0) {
      return { length, position, quaternion: new THREE.Quaternion() };
    }
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    return { length, position, quaternion };
  }, [segment]);

  if (transform.length <= 0) return null;

  return (
    <mesh position={transform.position} quaternion={transform.quaternion} renderOrder={20}>
      <cylinderGeometry args={[radius, radius, transform.length, 12]} />
      <meshBasicMaterial color={color} depthTest={depthTest} transparent opacity={opacity} />
    </mesh>
  );
}

function IntersectionCurveModel({ url, selected, highlighted, opacityScale = 1 }: { url?: string; selected?: boolean; highlighted?: boolean; opacityScale?: number }) {
  const [segments, setSegments] = useState<IntersectionSegment[]>([]);
  const style = selected ? weldFeatureStyle.selected : highlighted ? weldFeatureStyle.highlighted : weldFeatureStyle.normal;

  useEffect(() => {
    if (!url) {
      setSegments([]);
      return undefined;
    }

    let cancelled = false;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setSegments(parseRhinoObjCurves(text));
        }
      })
      .catch(() => {
        if (!cancelled) setSegments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (segments.length === 0) return null;

  return (
    <group>
      {segments.map((segment, index) => (
        <ThickIntersectionSegment
          key={`${url}-${index}`}
          segment={segment}
          radius={style.radius}
          color={style.color}
          opacity={style.opacity * opacityScale}
          depthTest={style.depthTest}
        />
      ))}
    </group>
  );
}

const datumEdgeStyle = {
  normal: { radius: 3, color: '#2563eb', opacity: 0.85, depthTest: true },
  highlighted: { radius: 4, color: '#60a5fa', opacity: 0.95, depthTest: false },
  selected: { radius: 5, color: '#FF6900', opacity: 1, depthTest: false },
};

function DatumEdgeModel({
  url,
  selected,
  highlighted,
  opacityScale = 1,
  onClick,
}: {
  url?: string;
  selected?: boolean;
  highlighted?: boolean;
  opacityScale?: number;
  onClick?: () => void;
}) {
  const [segments, setSegments] = useState<IntersectionSegment[]>([]);
  const style = selected ? datumEdgeStyle.selected : highlighted ? datumEdgeStyle.highlighted : datumEdgeStyle.normal;

  useEffect(() => {
    if (!url) {
      setSegments([]);
      return undefined;
    }

    let cancelled = false;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setSegments(parseRhinoObjCurves(text));
        }
      })
      .catch(() => {
        if (!cancelled) setSegments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (segments.length === 0) return null;

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {segments.map((segment, index) => (
        <ThickIntersectionSegment
          key={`${url}-${index}`}
          segment={segment}
          radius={style.radius}
          color={style.color}
          opacity={style.opacity * opacityScale}
          depthTest={style.depthTest}
        />
      ))}
    </group>
  );
}

function GrindSurfaceModel({ url, selected, highlighted, opacityScale = 1 }: { url?: string; selected?: boolean; highlighted?: boolean; opacityScale?: number }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const style = selected ? grindFeatureStyle.selected : highlighted ? grindFeatureStyle.highlighted : grindFeatureStyle.normal;

  useEffect(() => {
    if (!url) {
      setGeometry(null);
      return undefined;
    }

    let cancelled = false;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setGeometry(parseRhinoObjFaces(text));
        }
      })
      .catch(() => {
        if (!cancelled) setGeometry(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} renderOrder={selected ? 19 : highlighted ? 16 : 12}>
      <meshBasicMaterial
        color={style.color}
        depthTest={style.depthTest}
        transparent
        opacity={style.opacity * opacityScale}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

function ModelPropertiesPanel({ project, selectedNodeId }: { project: Project | null; selectedNodeId: string | null }) {
  if (!project) {
    return (
      <div className="flex h-full -translate-y-6 flex-col items-center justify-center gap-6 p-6 text-center text-sm font-light text-slate-400">
        <FileCog className="size-10" />
        <div>请选择左侧项目查看模型属性</div>
      </div>
    );
  }

  if (!selectedNodeId) {
    return (
      <div className="flex h-full -translate-y-6 flex-col items-center justify-center gap-6 p-6 text-center text-sm font-light text-slate-400">
        <FileCog className="size-10" />
        <div>请选择左侧结构树中的装配体或零件查看属性参数</div>
      </div>
    );
  }

  const selectedNode = findNodeById(project.tree, selectedNodeId);
  const displayParts = selectedNode
    ? selectedNode.modelPath
      ? [{ url: selectedNode.modelPath, name: selectedNode.name, id: selectedNode.id }]
      : collectModels(selectedNode)
    : [];

  if (displayParts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
        未找到该零件属性数据
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="space-y-3">
        {displayParts.map((part) => {
          const props = partPropertiesDB[part.id];
          const propertyItems = [
            ['名称', props?.modelName ?? part.name],
            ['材质', props?.material ?? '未知'],
            ['重量', props?.weight ?? '未知'],
            ['厚度', props?.thickness ?? '未知'],
          ];
          return (
            <div key={part.id} className="ds-parameter-card ds-parameter-card-sm overflow-hidden bg-zinc-100/55 shadow-ds-sm">
              <div className="mb-2 flex items-center gap-2 px-1">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{part.name}</div>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg bg-white">
                {propertyItems.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2 border-b border-slate-100/80 px-3 py-2 last:border-b-0">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="truncate text-sm font-medium text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const processPlanningDefaultCameraDirection = new THREE.Vector3(
  Math.sin(THREE.MathUtils.degToRad(-25)) * Math.cos(THREE.MathUtils.degToRad(45)),
  Math.sin(THREE.MathUtils.degToRad(45)),
  Math.cos(THREE.MathUtils.degToRad(-25)) * Math.cos(THREE.MathUtils.degToRad(45)),
).normalize();
function DefaultViewportCamera({ horizontalOffset, viewKey }: { horizontalOffset: number; viewKey: string }) {
  const bounds = useBounds();
  const { camera, invalidate, size } = useThree();
  const shouldApplyRef = useRef(true);

  useEffect(() => {
    shouldApplyRef.current = true;
  }, [viewKey]);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    if (horizontalOffset !== 0) {
      camera.setViewOffset(size.width, size.height, horizontalOffset, 0, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
    invalidate();

    return () => {
      camera.clearViewOffset();
      invalidate();
    };
  }, [camera, horizontalOffset, invalidate, size.height, size.width]);

  useFrame(() => {
    if (!shouldApplyRef.current) return;

    bounds.refresh();
    const { box, center, distance } = bounds.getSize();
    if (box.isEmpty()) return;

    bounds
      .moveTo(center.clone().addScaledVector(processPlanningDefaultCameraDirection, distance))
      .lookAt({ target: center, up: [0, 1, 0] })
      .clip();
    shouldApplyRef.current = false;
  });

  return null;
}

function Scene({
  models,
  hiddenIds,
  highlightId,
  highlightMode = 'color',
  modelOpacityById,
  isolationActive = false,
  isolationTargetIds,
  secondaryHighlightIds,
  coordinateTransformIds,
  coordinateTransformPivotTargetParts,
  coordinateTransformSelectedPivotPoint,
  coordinateTransformPivotOverride,
  coordinateTransformOffset,
  onCoordinateTransformPivotPointClick,
  selectedPartGumballParts,
  uniformColor,
  intersectionFeatures,
  surfaceFeatures,
  datumEdges,
  grindToolHeadItems,
  selectableFaceParts,
  selectedFaceIds,
  manualWeldCandidates,
  selectedManualWeldCandidateId,
  onSelectableFaceClick,
  onSelectableFacesReady,
  onManualWeldCandidateClick,
  onDatumEdgeClick,
  selectionMode,
  useProcessPlanningDefaultView = false,
  defaultViewHorizontalOffset = 0,
}: {
  models: { url: string; name: string; id: string }[];
  hiddenIds: Set<string>;
  highlightId?: string | null;
  highlightMode?: 'color' | 'overlay';
  modelOpacityById?: Map<string, number>;
  isolationActive?: boolean;
  isolationTargetIds?: ReadonlySet<string>;
  secondaryHighlightIds?: string[];
  coordinateTransformIds?: string[];
  coordinateTransformPivotTargetParts?: SelectableFacePart[];
  coordinateTransformSelectedPivotPoint?: PivotSnapPoint | null;
  coordinateTransformPivotOverride?: PivotSnapPoint | null;
  coordinateTransformOffset?: ProcessPosePoint;
  onCoordinateTransformPivotPointClick?: (point: PivotSnapPoint) => void;
  selectedPartGumballParts?: SelectableFacePart[];
  uniformColor?: boolean;
  intersectionFeatures?: FeatureView[];
  surfaceFeatures?: FeatureView[];
  datumEdges?: FeatureView[];
  grindToolHeadItems?: GrindToolHeadPoseItem[];
  selectableFaceParts?: SelectableFacePart[];
  selectedFaceIds?: string[];
  manualWeldCandidates?: ManualWeldCandidate[];
  selectedManualWeldCandidateId?: string | null;
  onSelectableFaceClick?: (faceId: string, additive: boolean) => void;
  onSelectableFacesReady?: (partId: string, faces: SelectableFaceGeometry[]) => void;
  onManualWeldCandidateClick?: (candidateId: string) => void;
  onDatumEdgeClick?: (id: string) => void;
  selectionMode?: 'normal' | 'datum-edge';
  useProcessPlanningDefaultView?: boolean;
  defaultViewHorizontalOffset?: number;
}) {
  const inDatumMode = selectionMode === 'datum-edge';
  const hasPrimarySelection = highlightId != null && !isolationActive;
  const viewportViewKey = models.map((model) => `${model.id}:${model.url}`).join('|');
  return (
    <>
      <color attach="background" args={['#e4e4e4']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Bounds fit clip observe margin={useProcessPlanningDefaultView ? 0.97 : 1.2}>
        {useProcessPlanningDefaultView && (
          <DefaultViewportCamera horizontalOffset={defaultViewHorizontalOffset} viewKey={viewportViewKey} />
        )}
        <group>
          {models.map((m, i) => {
            const isHighlighted = highlightId != null && m.id === highlightId;
            const isSecondaryHighlighted = secondaryHighlightIds?.includes(m.id) ?? false;
            const isCoordinateTransformSelected = coordinateTransformIds?.includes(m.id) ?? false;
            const isIsolationTarget = isolationActive && (isolationTargetIds?.has(m.id) ?? false);
            const isIsolationBackground = isolationActive && !isIsolationTarget;
            const useSelectionContour = isHighlighted || isIsolationTarget;
            const isPrimarySelectionBackground = hasPrimarySelection && !isHighlighted;
            const useHighlightOverlay = isHighlighted && highlightMode === 'overlay';
            const opacity = modelOpacityById?.get(m.id) ?? 1;
            const color = isIsolationBackground
              ? '#64748b'
              : uniformColor
                ? isHighlighted
                  ? '#fde68a' // 淡黄色高亮
                : isSecondaryHighlighted
                  ? '#bfdbfe'
                  : '#9ca3af' // 统一灰色
              : isCoordinateTransformSelected
                ? '#fbbf24'
                : isHighlighted && highlightMode === 'color'
                ? '#f59e0b'
                : isSecondaryHighlighted
                  ? '#93c5fd'
                  : modelColors[i % modelColors.length];
            return (
              <STLModel
                key={m.url}
                url={m.url}
                color={color}
                visible={!hiddenIds.has(m.id)}
                showEdges={isHighlighted || isIsolationTarget || isSecondaryHighlighted || isCoordinateTransformSelected}
                edgeColor={useSelectionContour || isCoordinateTransformSelected ? PROCESS_SELECTION_EDGE_COLOR : '#64748b'}
                edgeOpacity={useSelectionContour ? PROCESS_SELECTION_EDGE_OPACITY : isIsolationBackground ? 0.2 : undefined}
                edgeWidth={useSelectionContour ? PROCESS_SELECTION_EDGE_WIDTH : 1.05}
                highlightOverlay={useHighlightOverlay}
                dimOverlay={isIsolationBackground || isPrimarySelectionBackground}
                dimOverlayOpacity={
                  isPrimarySelectionBackground
                    ? PROCESS_SELECTION_DIMMED_OVERLAY_OPACITY
                    : isIsolationBackground
                      ? PROCESS_ISOLATION_DIMMED_OVERLAY_OPACITY
                      : undefined
                }
                opacity={opacity}
              />
            );
          })}
          {coordinateTransformPivotTargetParts && coordinateTransformPivotTargetParts.some((part) => !hiddenIds.has(part.id)) && (
            <CoordinateTransformOverlayModel
              parts={coordinateTransformPivotTargetParts.filter((part) => !hiddenIds.has(part.id))}
              pivotPoint={coordinateTransformPivotOverride}
              pivotOffset={coordinateTransformOffset}
            />
          )}
          {(!coordinateTransformPivotTargetParts || coordinateTransformPivotTargetParts.length === 0) && selectedPartGumballParts?.map((part) => (
            hiddenIds.has(part.id) ? null : (
              <SelectedPartGumballOverlay key={`selected-part-gumball-${part.id}`} parts={[part]} />
            )
          ))}
          {coordinateTransformPivotTargetParts && coordinateTransformPivotTargetParts.some((part) => !hiddenIds.has(part.id)) && (
            <CoordinateTransformSnapPointOverlay
              parts={coordinateTransformPivotTargetParts.filter((part) => !hiddenIds.has(part.id))}
              selectedPoint={coordinateTransformSelectedPivotPoint}
              onPointClick={(point) => onCoordinateTransformPivotPointClick?.(point)}
            />
          )}
          {!inDatumMode && selectableFaceParts?.map((part) =>
            hiddenIds.has(part.id) ? null : (
              <SelectableFaceOverlayModel
                key={`selectable-face-${part.id}`}
                part={part}
                selectedFaceIds={selectedFaceIds ?? []}
                onFaceClick={(faceId, additive) => onSelectableFaceClick?.(faceId, additive)}
                onFacesReady={onSelectableFacesReady}
              />
            )
          )}
          {!inDatumMode && manualWeldCandidates?.map((candidate) => (
            <ManualWeldCandidateModel
              key={candidate.id}
              candidate={candidate}
              selected={selectedManualWeldCandidateId === candidate.id}
              onClick={() => onManualWeldCandidateClick?.(candidate.id)}
            />
          ))}
          {!inDatumMode && intersectionFeatures?.map((feature) => (
            hiddenIds.has(feature.sourceId) ? null : (
              <IntersectionCurveModel key={feature.id} url={feature.url} selected={feature.selected} highlighted={feature.highlighted} opacityScale={feature.opacityScale} />
            )
          ))}
          {!inDatumMode && surfaceFeatures?.map((feature) => (
            hiddenIds.has(feature.sourceId) ? null : (
              <GrindSurfaceModel key={feature.id} url={feature.url} selected={feature.selected} highlighted={feature.highlighted} opacityScale={feature.opacityScale} />
            )
          ))}
          {datumEdges?.map((feature) => (
            hiddenIds.has(feature.sourceId) ? null : (
              <DatumEdgeModel
                key={feature.id}
                url={feature.url}
                selected={feature.selected}
                highlighted={feature.highlighted}
                opacityScale={feature.opacityScale}
                onClick={() => onDatumEdgeClick?.(feature.sourceId)}
              />
            )
          ))}
          {grindToolHeadItems && grindToolHeadItems.length > 0 && (
            <GrindToolHeadPoseModel items={grindToolHeadItems} />
          )}
        </group>
      </Bounds>
      <OrbitControls makeDefault />
    </>
  );
}

type ManualFeatureExtractionTab = 'weld' | 'grind';

function FeatureExtractionToolbar({
  onOpenManualWeld,
  onOpenManualGrind,
  onOpenDatum,
  onAutoExtractWeld,
  onAutoExtractGrind,
  activeManualType,
  hasWeldFeatures,
  onBlocked,
}: {
  onOpenManualWeld: () => void;
  onOpenManualGrind: () => void;
  onOpenDatum: () => void;
  onAutoExtractWeld: () => void;
  onAutoExtractGrind: () => void;
  activeManualType: ManualFeatureExtractionTab | 'datum' | null;
  hasWeldFeatures: boolean;
  onBlocked: () => void;
}) {
  const [openFeatureMenu, setOpenFeatureMenu] = useState<ManualFeatureExtractionTab | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openFeatureMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setOpenFeatureMenu(null);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openFeatureMenu]);

  const featureActions = [
    { type: 'weld' as const, label: '焊缝特征提取', icon: WeldFeatureIcon, onManualExtract: onOpenManualWeld, onAutoExtract: onAutoExtractWeld, active: activeManualType === 'weld' },
    { type: 'grind' as const, label: '打磨特征提取', icon: GrindFeatureIcon, onManualExtract: onOpenManualGrind, onAutoExtract: onAutoExtractGrind, active: activeManualType === 'grind' },
  ];
  const datumAction = { label: '装配特征提取', icon: AssemblyFeatureIcon, onClick: onOpenDatum, active: activeManualType === 'datum' };
  const DatumIcon = datumAction.icon;

  return (
    <div ref={toolbarRef} className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-white/60 bg-white/62 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md">
      {featureActions.map((action) => {
        const Icon = action.icon;
        const menuOpen = openFeatureMenu === action.type;
        const actionDisabled = action.type === 'grind' && !hasWeldFeatures;
        return (
          <div key={action.label} className="relative">
            <button
              type="button"
              aria-disabled={actionDisabled}
              onClick={() => {
                if (actionDisabled) {
                  onBlocked();
                  return;
                }
                setOpenFeatureMenu((open) => open === action.type ? null : action.type);
              }}
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                actionDisabled
                  ? 'cursor-not-allowed border-transparent text-ds-text-control-disabled focus:outline-none focus-visible:outline-none'
                  : action.active || menuOpen
                  ? 'border-orange-200 bg-orange-50/90 text-ds-brand-primary-text shadow-sm'
                  : 'border-transparent text-slate-600 hover:bg-white/78 hover:text-slate-950'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{action.label}</span>
              <ChevronDown className={`size-3 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute left-1/2 top-[calc(100%+6px)] z-30 w-28 -translate-x-1/2 rounded-lg border border-white/80 bg-white/95 py-1 shadow-lg shadow-black/5 backdrop-blur-md">
                {[
                  { label: '自动提取', onClick: action.onAutoExtract },
                  { label: '手动提取', onClick: action.onManualExtract },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="w-full px-2.5 py-1.5 text-center text-xs text-slate-600 hover:bg-orange-50 hover:text-ds-brand-primary-text"
                    onClick={() => {
                      item.onClick();
                      setOpenFeatureMenu(null);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        aria-disabled={!hasWeldFeatures}
        onClick={() => {
          if (!hasWeldFeatures) {
            onBlocked();
            return;
          }
          datumAction.onClick();
        }}
        className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
          !hasWeldFeatures
            ? 'cursor-not-allowed border-transparent text-ds-text-control-disabled focus:outline-none focus-visible:outline-none'
            : datumAction.active
            ? 'border-orange-200 bg-orange-50/90 text-ds-brand-primary-text shadow-sm'
            : 'border-transparent text-slate-600 hover:bg-white/78 hover:text-slate-950'
        }`}
      >
        <DatumIcon className="size-4 shrink-0" />
        <span className="whitespace-nowrap">{datumAction.label}</span>
      </button>
    </div>
  );
}
function FeatureCandidateStatusRow({
  title,
  status,
  value,
  surface = true,
}: {
  title?: string;
  status: 'empty' | 'pending' | 'selected';
  value: string;
  surface?: boolean;
}) {
  const selected = status === 'selected';
  const pending = status === 'pending';
  const content = (
    <>
      {title && <div className="font-medium text-slate-600">{title}</div>}
      <div className={`${title ? 'mt-1' : ''} flex items-center gap-1.5 ${selected ? 'text-emerald-600' : pending ? 'text-slate-500' : 'text-slate-400'}`}>
        {selected ? (
          <CircleCheck className="size-3.5 shrink-0" />
        ) : (
          <CircleAlert className="size-3.5 shrink-0" />
        )}
        <span className="min-w-0 truncate">{value}</span>
      </div>
    </>
  );

  if (!surface) {
    return <div className="text-[11px] text-slate-500">{content}</div>;
  }

  return (
    <div className="rounded-md bg-slate-50/90 px-2.5 py-2 text-[11px] text-slate-500">
      {content}
    </div>
  );
}

export function BeimeiAssemblyLinePage() {
  const [routePath, setRoutePath] = useState(() => decodeURI(window.location.pathname));
  const getInitialMainNav = () => {
    if (routePath.startsWith('/生产执行')) return 'production-execution';
    if (routePath.startsWith('/虚拟仿真')) return 'virtual-simulation';
    if (routePath.startsWith('/产能统计')) return 'capacity-statistics';
    return 'process-planning';
  };

  const updateMainNavRoute = (nav: 'process-planning' | 'virtual-simulation' | 'production-execution' | 'capacity-statistics') => {
    const nextPath = nav === 'production-execution'
      ? '/生产执行'
      : nav === 'virtual-simulation'
        ? '/虚拟仿真'
        : nav === 'capacity-statistics'
          ? '/产能统计'
        : '/工艺规划';
    if (decodeURI(window.location.pathname) !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
    setRoutePath(nextPath);
  };

  useEffect(() => {
    document.title = '北煤机拼装产线';
  }, []);

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [layoutVariant, setLayoutVariant] = useState<'classic' | 'flat' | 'immersive' | 'project-immersive'>('immersive');
  const [activeMainNav, setActiveMainNav] = useState<'process-planning' | 'virtual-simulation' | 'production-execution' | 'capacity-statistics'>(getInitialMainNav);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [featureExtractMenuOpen, setFeatureExtractMenuOpen] = useState<ManualFeatureExtractionTab | null>(null);
  const [workspaceTransitionPhase, setWorkspaceTransitionPhase] = useState<'idle' | 'project-exit' | 'planning-enter'>('idle');
  const workspaceTransitionTimersRef = useRef<number[]>([]);
  const [processPlanningMenuOpen, setProcessPlanningMenuOpen] = useState(false);
  const [virtualSimulationMenuOpen, setVirtualSimulationMenuOpen] = useState(false);
  const [openProcessPlanningProjectIds, setOpenProcessPlanningProjectIds] = useState<string[]>([defaultProject.id]);
  const [closeProcessPlanningConfirm, setCloseProcessPlanningConfirm] = useState<{ projectId: string; name: string } | null>(null);
  const [simulationWorkspaces, setSimulationWorkspaces] = useState<SimulationWorkspace[]>([]);
  const [activeSimulationWorkspaceId, setActiveSimulationWorkspaceId] = useState<string | null>(null);
  const simulationTaskCounterRef = useRef(0);
  const [simulationFilePickerOpen, setSimulationFilePickerOpen] = useState(false);
  const simulationFilePickerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = decodeURI(window.location.pathname);
      setRoutePath(nextPath);
      setActiveMainNav(
        nextPath.startsWith('/生产执行')
          ? 'production-execution'
          : nextPath.startsWith('/虚拟仿真')
            ? 'virtual-simulation'
            : nextPath.startsWith('/产能统计')
              ? 'capacity-statistics'
            : 'process-planning'
      );
      setProcessPlanningMenuOpen(false);
      setVirtualSimulationMenuOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 新建项目相关状态
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [editingAssemblyNode, setEditingAssemblyNode] = useState<{ projectId: string; nodeId: string } | null>(null);
  const [editingAssemblyName, setEditingAssemblyName] = useState('');
  const assemblyInputRef = useRef<HTMLInputElement>(null);

  // currentProjectId: null 表示显示"项目管理"列表
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(defaultProject.id);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState(defaultProject.tree.id);
  // 全部项目页面中的折叠状态（项目级和子节点级）
  const [projectListCollapsed, setProjectListCollapsed] = useState<Set<string>>(new Set());
  const [projectListNodeCollapsed, setProjectListNodeCollapsed] = useState<Set<string>>(new Set());
  // 全部项目页中预览的项目 ID（点击项目时在视窗中显示模型）
  const [previewProjectId, setPreviewProjectId] = useState<string | null>(null);
  // 全部项目页中选中的零件节点 ID（用于高亮）
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null);
  // 图纸管理弹窗
  const [drawingManagerOpen, setDrawingManagerOpen] = useState(false);
  const [createModelFlow, setCreateModelFlow] = useState<CreateModelFlow | null>(null);
  const [createModelDrafts, setCreateModelDrafts] = useState<Record<string, CreateModelFlow>>({});
  const [createModelFolderPickerHint, setCreateModelFolderPickerHint] = useState<CreateModelFlow | null>(null);
  const createModelFolderPickerTimerRef = useRef<number | null>(null);
  const [addAssemblyDialog, setAddAssemblyDialog] = useState<{ target: 'project' | 'group0162'; projectId?: string } | null>(null);
  const [newAssemblyName, setNewAssemblyName] = useState('新建装配体');
  const [drawingRequiredDialog, setDrawingRequiredDialog] = useState<{ projectId: string; name: string } | null>(null);
  // 图纸管理：当前选中的图纸项（用于右侧预览）
  const [selectedDrawingItem, setSelectedDrawingItem] = useState<{
    type: 'assembly' | 'part';
    id: string;
    name: string;
  } | null>(null);
  // 替换确认弹窗
  const [replaceConfirm, setReplaceConfirm] = useState<{
    type: 'assembly' | 'part';
    id: string;
    name: string;
  } | null>(null);
  // Toast 提示
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  // 已更新图纸的模型 ID 集合（用于点选后清除更新状态）
  const [updatedDrawingIds, setUpdatedDrawingIds] = useState<Set<string>>(new Set());
  // 各项目的导入尝试次数（用于模拟第一次失败、第二次成功）
  const [importAttempts, setImportAttempts] = useState<Record<string, number>>({});
  // 各项目的导出尝试次数（用于模拟第一次失败、第二次成功）
  const exportAttemptsRef = useRef<Record<string, number>>({});

  const clearWorkspaceTransitionTimers = () => {
    workspaceTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    workspaceTransitionTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearWorkspaceTransitionTimers();
      if (createModelFolderPickerTimerRef.current) {
        window.clearTimeout(createModelFolderPickerTimerRef.current);
      }
      if (simulationFilePickerTimerRef.current) {
        window.clearTimeout(simulationFilePickerTimerRef.current);
      }
    };
  }, []);
  // 结构树拖拽状态
  const dragIdRef = useRef<string | null>(null);
  const [dragState, setDragState] = useState<{
    draggingId: string;
    targetId: string | null;
    position: 'before' | 'after';
    nest: boolean;
  } | null>(null);
  const [assemblyContextMenu, setAssemblyContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeType: 'assembly' | 'part';
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    ids: string[];
    label: string;
    kind: DeleteConfirmKind;
  } | null>(null);
  const [processContextMenu, setProcessContextMenu] = useState<{
    x: number;
    y: number;
    stepId: string;
  } | null>(null);
  const [processSequenceDragState, setProcessSequenceDragState] = useState<{
    draggingKey: string;
    targetKey: string | null;
    position: 'before' | 'after';
  } | null>(null);
  const processSequenceDragKeyRef = useRef<string | null>(null);
  const [processDeletePopoverKey, setProcessDeletePopoverKey] = useState<string | null>(null);
  const [selectedPlanningProcessId, setSelectedPlanningProcessId] = useState<string | null>(null);
  // 一级工序卡片的勾选仅用于批量导出，独立于进入工序和任务条批量操作。
  const [checkedPlanningProcessIds, setCheckedPlanningProcessIds] = useState<Set<string>>(new Set());
  const [processIsolationDismissed, setProcessIsolationDismissed] = useState(false);
  const [selectedCompactProcessStepKey, setSelectedCompactProcessStepKey] = useState<string | null>(null);
  const [isolatedCompactProcessStepKey, setIsolatedCompactProcessStepKey] = useState<string | null>(null);
  const [hoveredCompactProcessStepKey, setHoveredCompactProcessStepKey] = useState<string | null>(null);
  const [disabledCompactProcessStepKeys, setDisabledCompactProcessStepKeys] = useState<Set<string>>(new Set());
  const [compactProcessBatchMode, setCompactProcessBatchMode] = useState(false);
  const [checkedCompactProcessStepKeys, setCheckedCompactProcessStepKeys] = useState<Set<string>>(new Set());
  const [compactProcessFilterOpen, setCompactProcessFilterOpen] = useState(false);
  const [compactProcessFilterKinds, setCompactProcessFilterKinds] = useState<CompactProcessFilterKind[]>([]);
  const [compactProcessFilterValues, setCompactProcessFilterValues] = useState<Partial<Record<CompactProcessFilterKind, string[]>>>({});
  const [compactProcessTaskPaneHeight, setCompactProcessTaskPaneHeight] = useState<number | null>(null);
  const [compactProcessSplitDragging, setCompactProcessSplitDragging] = useState(false);
  const [activeCompactProcessDetailTab, setActiveCompactProcessDetailTab] = useState<CompactProcessDetailTab>('parameter-results');
  const [compactPathCoordinateFrame, setCompactPathCoordinateFrame] = useState<CompactPathCoordinateFrame>('世界');
  const [compactCombinedWeldPathMode, setCompactCombinedWeldPathMode] = useState<CombinedWeldPathMode>('scan');
  const [compactPathPointCollapseSignal, setCompactPathPointCollapseSignal] = useState(0);
  const [collapsedCompactAssembleGroupIndexes, setCollapsedCompactAssembleGroupIndexes] = useState<Set<number>>(new Set());
  // 复选框批量选中集合（项目 id 与零件/节点 id 共用，当前数据不会冲突）
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [manualFeatureExtractionOpen, setManualFeatureExtractionOpen] = useState(false);
  const [openManualFeaturePanels, setOpenManualFeaturePanels] = useState<ManualFeatureExtractionTab[]>([]);
  const [minimizedManualFeaturePanels, setMinimizedManualFeaturePanels] = useState<ManualFeatureExtractionTab[]>([]);
  const [activeManualFeatureTab, setActiveManualFeatureTab] = useState<ManualFeatureExtractionTab>('weld');
  const [manualFeaturePartAId, setManualFeaturePartAId] = useState<string | null>(null);
  const [manualFeaturePartBId, setManualFeaturePartBId] = useState<string | null>(null);
  const [manualFeatureCandidateId, setManualFeatureCandidateId] = useState<string | null>(null);
  const [manualGrindWeldFeatureId, setManualGrindWeldFeatureId] = useState<string | null>(null);
  const [manualWeldSelectedFaceIds, setManualWeldSelectedFaceIds] = useState<string[]>([]);
  const [manualWeldFaceMap, setManualWeldFaceMap] = useState<Record<string, SelectableFaceGeometry>>({});
  const [manualWeldCandidates, setManualWeldCandidates] = useState<ManualWeldCandidate[]>([]);
  const [manualWeldFaceSelectionActive, setManualWeldFaceSelectionActive] = useState(false);
  const [manualWeldGenerated, setManualWeldGenerated] = useState(false);
  const [manualFeatureError, setManualFeatureError] = useState<string | null>(null);
  const [processMenuOpen, setProcessMenuOpen] = useState(false);
  const [addProcessTaskDialog, setAddProcessTaskDialog] = useState<AddProcessTaskDialogState | null>(null);
  const [processSequenceScrolled, setProcessSequenceScrolled] = useState(false);
  const [projectStructureScrolled, setProjectStructureScrolled] = useState(false);
  const [projectPropertiesScrolled, setProjectPropertiesScrolled] = useState(false);
  const processGenerationMissingFeatureAttemptsRef = useRef<Record<string, number>>({});
  const processMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const [processParameterModalOpen, setProcessParameterModalOpen] = useState(false);
  const [processParameterScrolled, setProcessParameterScrolled] = useState(false);
  const [processParameterDirty, setProcessParameterDirty] = useState(false);
  const [processParameterDiscardConfirmOpen, setProcessParameterDiscardConfirmOpen] = useState(false);
  const [activeProcessParameterTab, setActiveProcessParameterTab] = useState<(typeof processParameterTabs)[number]['key']>('pick');
  const gripperTypes = pickGripperTypeOptions;
  const workbenchTypes = WORKBENCH_TYPES;
  const workbenchSupportIdOptions: Record<WorkbenchType, string[]> = {
    主筋板打磨翻面平台: ['1', '2'],
    主筋板正面装配平台: ['1', '2'],
    主筋板翻面平台: ['1', '2'],
    主筋板背面装配平台: ['1', '2', '3', '4', '5'],
  };
  const workbenchClampIdOptions: Record<WorkbenchType, string[]> = {
    主筋板打磨翻面平台: ['1', '2'],
    主筋板正面装配平台: ['1', '2'],
    主筋板翻面平台: ['1', '2'],
    主筋板背面装配平台: ['1', '2'],
  };
  const workbenchSupportAxisOptions: Record<WorkbenchType, Record<string, WorkbenchSupportAxis[]>> = {
    主筋板打磨翻面平台: {
      '1': ['Y', 'Z'],
      '2': ['Y'],
    },
    主筋板正面装配平台: {
      '1': ['Y', 'Z'],
      '2': ['Y', 'Z'],
    },
    主筋板翻面平台: {
      '1': ['Y', 'Z'],
      '2': ['Y'],
    },
    主筋板背面装配平台: {
      '1': ['Y', 'Z'],
      '2': ['Y', 'Z'],
      '3': ['Y', 'Z'],
      '4': ['Y', 'Z'],
      '5': ['Y', 'Z'],
    },
  };
  const workbenchClampAxisOptions: Record<WorkbenchType, Record<string, WorkbenchSupportAxis[]>> = {
    主筋板打磨翻面平台: {
      '1': ['Y', 'Z'],
      '2': ['Y', 'Z'],
    },
    主筋板正面装配平台: {
      '1': ['X', 'Y', 'Z'],
      '2': ['X', 'Y', 'Z'],
    },
    主筋板翻面平台: {
      '1': ['Y', 'Z'],
      '2': ['Y', 'Z'],
    },
    主筋板背面装配平台: {
      '1': ['X', 'Y', 'Z'],
      '2': ['X', 'Y', 'Z'],
    },
  };
  const grindToolModes = ['inhand', 'tohand'] as const;
  const [gripperType, setGripperType] = useState<(typeof gripperTypes)[number]>('桁架抓具');
  const [gripperConfigs, setGripperConfigs] = useState<Record<(typeof gripperTypes)[number], {
    magnetEnabled: Record<string, boolean>;
    magnetForceLevels: Record<string, string>;
    magnetSpacing: Record<string, string>;
    coverageThreshold: string;
    safetyCoefficient: string;
    eccentricThreshold: string;
  }>>({
    桁架抓具: {
      magnetEnabled: { 左: true, 中: true, 右: true },
      magnetForceLevels: { 左: '大', 中: '中', 右: '大' },
      magnetSpacing: { '左--中': '420', '中--右': '420' },
      coverageThreshold: '50',
      safetyCoefficient: '0.8',
      eccentricThreshold: '200',
    },
    机器人抓具: {
      magnetEnabled: { 左: true, 中: true, 右: false },
      magnetForceLevels: { 左: '中', 中: '小', 右: '中' },
      magnetSpacing: { '左--中': '260', '中--右': '240' },
      coverageThreshold: '68',
      safetyCoefficient: '0.9',
      eccentricThreshold: '120',
    },
  });
  const [workbenchType, setWorkbenchType] = useState<WorkbenchType>('主筋板正面装配平台');
  const [activeWorkbenchParameterTab, setActiveWorkbenchParameterTab] = useState<'support' | 'clamp'>('support');
  const [workbenchConfigs, setWorkbenchConfigs] = useState<Record<WorkbenchType, {
    supportIds: string[];
    supportSettings: Record<string, WorkbenchSupportSetting>;
    supportCoverage: string;
    clampIds: string[];
    clampSettings: Record<string, WorkbenchClampSetting>;
    clampCoverage: string;
  }>>({
    主筋板打磨翻面平台: {
      supportIds: ['1', '2'],
      supportSettings: createWorkbenchSupportSettings(['1', '2']),
      supportCoverage: '70',
      clampIds: ['1', '2'],
      clampSettings: createWorkbenchClampSettings(['1', '2']),
      clampCoverage: '68',
    },
    主筋板正面装配平台: {
      supportIds: ['1', '2'],
      supportSettings: createWorkbenchSupportSettings(['1', '2']),
      supportCoverage: '70',
      clampIds: ['1', '2'],
      clampSettings: createWorkbenchClampSettings(['1', '2']),
      clampCoverage: '70',
    },
    主筋板翻面平台: {
      supportIds: ['1', '2'],
      supportSettings: createWorkbenchSupportSettings(['1', '2']),
      supportCoverage: '72',
      clampIds: ['1', '2'],
      clampSettings: createWorkbenchClampSettings(['1', '2']),
      clampCoverage: '70',
    },
    主筋板背面装配平台: {
      supportIds: ['1', '2', '3', '4', '5'],
      supportSettings: createWorkbenchSupportSettings(['1', '2', '3', '4', '5']),
      supportCoverage: '75',
      clampIds: ['1', '2'],
      clampSettings: createWorkbenchClampSettings(['1', '2']),
      clampCoverage: '72',
    },
  });
  const [grindToolMode, setGrindToolMode] = useState<(typeof grindToolModes)[number]>('inhand');
  const [grindToolConfigs, setGrindToolConfigs] = useState<Record<(typeof grindToolModes)[number], { pathMergeEnabled: boolean }>>({
    inhand: { pathMergeEnabled: true },
    tohand: { pathMergeEnabled: false },
  });
  const [assemblyScanDirection, setAssemblyScanDirection] = useState('逆时针');
  const [assemblySampleShape, setAssemblySampleShape] = useState<'直线' | '圆弧'>('直线');
  const [assemblyLineSampleMode, setAssemblyLineSampleMode] = useState<'距离' | '数量'>('距离');
  const [assemblyArcSampleMode, setAssemblyArcSampleMode] = useState<'弦长' | '数量'>('弦长');
  const [weldParams, setWeldParams] = useState<WeldProcessParams>(() => createDefaultWeldProcessParams());
  const [weldScanParams, setWeldScanParams] = useState<WeldProcessParams>(() => createDefaultWeldProcessParams());
  const [expandedProcessStepIds, setExpandedProcessStepIds] = useState<Set<string>>(new Set());
  const [processPointDirtyStepIds, setProcessPointDirtyStepIds] = useState<Set<string>>(new Set());
  const [magnetDirtyStepIds, setMagnetDirtyStepIds] = useState<Set<string>>(new Set());
  const [grindParameterDirtyStepIds, setGrindParameterDirtyStepIds] = useState<Set<string>>(new Set());
  const [assembleParameterDirtyStepIds, setAssembleParameterDirtyStepIds] = useState<Set<string>>(new Set());
  const [weldParameterDirtyStepIds, setWeldParameterDirtyStepIds] = useState<Set<string>>(new Set());
  const [processPlanningDirtyProjectIds, setProcessPlanningDirtyProjectIds] = useState<Set<string>>(new Set());
  const [featureDirtyProjectIds, setFeatureDirtyProjectIds] = useState<Set<string>>(new Set());
  const [generatedStyleCProjectIds, setGeneratedStyleCProjectIds] = useState<Set<string>>(
    () => new Set(initialProjects.filter((project) => project.processSteps.some((step) => Boolean(step.processId))).map((project) => project.id))
  );
  const [styleCRegenerationNeededProjectIds, setStyleCRegenerationNeededProjectIds] = useState<Set<string>>(new Set());
  const [processRegenerationConfirmOpen, setProcessRegenerationConfirmOpen] = useState(false);
  const [backUnsavedNoticeOpen, setBackUnsavedNoticeOpen] = useState(false);
  const [collapsedPickPointInfoIds, setCollapsedPickPointInfoIds] = useState<Set<string>>(
    () =>
      new Set(
        projects.flatMap((project) =>
          project.processSteps.filter((step) => step.type === 'pick' && !!step.id).map((step) => step.id as string)
        )
      )
  );
  const [collapsedPlacePointInfoIds, setCollapsedPlacePointInfoIds] = useState<Set<string>>(
    () =>
      new Set(
        projects.flatMap((project) =>
          project.processSteps.filter((step) => step.type === 'place' && !!step.id).map((step) => step.id as string)
        )
      )
  );
  const [collapsedClampPointInfoIds, setCollapsedClampPointInfoIds] = useState<Set<string>>(
    () =>
      new Set(
        projects.flatMap((project) =>
          project.processSteps.filter((step) => step.type === 'turnover-clamp' && !!step.id).map((step) => step.id as string)
        )
      )
  );
  const [pickPreviewOverlayStepId, setPickPreviewOverlayStepId] = useState<string | null>(null);
  const [placePreviewOverlayStepId, setPlacePreviewOverlayStepId] = useState<string | null>(null);
  const [clampPreviewOverlayStepId, setClampPreviewOverlayStepId] = useState<string | null>(null);
  const [grindPreviewOverlayStepId, setGrindPreviewOverlayStepId] = useState<string | null>(null);
  const [grindFeaturePaths, setGrindFeaturePaths] = useState<Record<string, GrindFeaturePath>>({});
  const [assemblePreviewOverlayStepId, setAssemblePreviewOverlayStepId] = useState<string | null>(null);
  const [weldPreviewOverlayStepId, setWeldPreviewOverlayStepId] = useState<string | null>(null);
  const [coordinateTransformOpen, setCoordinateTransformOpen] = useState(false);
  const [coordinateTransformPartIds, setCoordinateTransformPartIds] = useState<string[]>([]);
  const [coordinateTransformSelectedPivotPoint, setCoordinateTransformSelectedPivotPoint] = useState<PivotSnapPoint | null>(null);
  const [coordinateTransformPivotOverride, setCoordinateTransformPivotOverride] = useState<PivotSnapPoint | null>(null);
  const [gumballHackAssemblyIds, setGumballHackAssemblyIds] = useState<Set<string>>(new Set());
  const coordinateTransformClickTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [coordinateTransformOffset, setCoordinateTransformOffset] = useState<ProcessPosePoint>({
    x: '0.0',
    y: '0.0',
    z: '0.0',
    rx: '0.0',
    ry: '0.0',
    rz: '0.0',
  });
  const resetCoordinateTransformPanelState = useCallback(() => {
    setCoordinateTransformOpen(false);
    setCoordinateTransformPartIds([]);
    setCoordinateTransformSelectedPivotPoint(null);
    setCoordinateTransformPivotOverride(null);
    setCoordinateTransformOffset({
      x: '0.0',
      y: '0.0',
      z: '0.0',
      rx: '0.0',
      ry: '0.0',
      rz: '0.0',
    });
  }, []);
  useEffect(() => () => {
    if (coordinateTransformClickTimerRef.current) {
      window.clearTimeout(coordinateTransformClickTimerRef.current);
    }
  }, []);
  const [magnetParameterPanel, setMagnetParameterPanel] = useState<{
    stepId: string;
    magnetName: PickMagnetName;
    minimized: boolean;
  } | null>(null);
  const [viewportLogMinimized, setViewportLogMinimized] = useState(true);
  const [featureDetachedView, setFeatureDetachedView] = useState(true);
  const activeGripperConfig = gripperConfigs[gripperType];
  const activeWorkbenchConfig = workbenchConfigs[workbenchType];
  const activeGrindToolConfig = grindToolConfigs[grindToolMode];
  const processParameterSnapshotRef = useRef<null | {
    gripperType: typeof gripperType;
    gripperConfigs: typeof gripperConfigs;
    workbenchType: typeof workbenchType;
    workbenchConfigs: typeof workbenchConfigs;
    grindToolMode: typeof grindToolMode;
    grindToolConfigs: typeof grindToolConfigs;
    assemblyScanDirection: typeof assemblyScanDirection;
    assemblySampleShape: typeof assemblySampleShape;
    assemblyLineSampleMode: typeof assemblyLineSampleMode;
    assemblyArcSampleMode: typeof assemblyArcSampleMode;
    weldParams: typeof weldParams;
    weldScanParams: typeof weldScanParams;
  }>(null);
  useEffect(() => {
    setProcessParameterScrolled(false);
  }, [processParameterModalOpen, activeProcessParameterTab]);

  const markProcessParameterDirty = () => {
    setProcessParameterDirty(true);
    if (currentProjectId) {
      setProcessPlanningDirtyProjectIds((prev) => {
        const next = new Set(prev);
        next.add(currentProjectId);
        return next;
      });
    }
  };

  const openProcessParameterModal = () => {
    processParameterSnapshotRef.current = {
      gripperType,
      gripperConfigs,
      workbenchType,
      workbenchConfigs,
      grindToolMode,
      grindToolConfigs,
      assemblyScanDirection,
      assemblySampleShape,
      assemblyLineSampleMode,
      assemblyArcSampleMode,
      weldParams,
      weldScanParams,
    };
    setProcessParameterDirty(false);
    setProcessParameterDiscardConfirmOpen(false);
    setProcessParameterModalOpen(true);
  };

  const requestCloseProcessParameterModal = () => {
    if (processParameterDirty) {
      setProcessParameterDiscardConfirmOpen(true);
      return;
    }
    setProcessParameterModalOpen(false);
  };

  const discardProcessParameterChanges = () => {
    const snapshot = processParameterSnapshotRef.current;
    if (snapshot) {
      setGripperType(snapshot.gripperType);
      setGripperConfigs(snapshot.gripperConfigs);
      setWorkbenchType(snapshot.workbenchType);
      setWorkbenchConfigs(snapshot.workbenchConfigs);
      setGrindToolMode(snapshot.grindToolMode);
      setGrindToolConfigs(snapshot.grindToolConfigs);
      setAssemblyScanDirection(snapshot.assemblyScanDirection);
      setAssemblySampleShape(snapshot.assemblySampleShape);
      setAssemblyLineSampleMode(snapshot.assemblyLineSampleMode);
      setAssemblyArcSampleMode(snapshot.assemblyArcSampleMode);
      setWeldParams(snapshot.weldParams);
      setWeldScanParams(snapshot.weldScanParams);
    }
    setProcessParameterDirty(false);
    setProcessParameterDiscardConfirmOpen(false);
    setProcessParameterModalOpen(false);
  };

  const saveProcessParameters = () => {
    const shouldRequestRegeneration = Boolean(
      processParameterDirty &&
      currentProjectId &&
      generatedStyleCProjectIds.has(currentProjectId)
    );
    processParameterSnapshotRef.current = null;
    setProcessParameterDirty(false);
    setProcessParameterDiscardConfirmOpen(false);
    if (shouldRequestRegeneration && currentProjectId) {
      setStyleCRegenerationNeededProjectIds((previous) => {
        const next = new Set(previous);
        next.add(currentProjectId);
        return next;
      });
    }
    showToast(shouldRequestRegeneration ? '工艺参数已保存，请重新生成任务' : '工艺参数已保存', 'success');
    setProcessParameterModalOpen(false);
  };

  const updateGripperConfig = (updater: (config: typeof activeGripperConfig) => typeof activeGripperConfig) => {
    markProcessParameterDirty();
    setGripperConfigs((prev) => ({ ...prev, [gripperType]: updater(prev[gripperType]) }));
  };
  const getGripperConfigForType = (type: PickGripperType) => gripperConfigs[type] ?? gripperConfigs['桁架抓具'];
  const recalculatePickConfig = (config: PickProcessConfig, options: { updateMagnetPosition?: boolean } = {}): PickProcessConfig => {
    const magnetPosition = options.updateMagnetPosition
      ? calculatePickMagnetPosition(config.gripperType, config.magnetSettings, config.magnetPosition)
      : config.magnetPosition;
    return {
      ...config,
      magnetPosition,
      ...calculatePickActualMetrics(config.gripperType, config.magnetSettings, magnetPosition),
    };
  };
  const updatePickConfigWithRecalculation = (
    stepId: string,
    updater: (config: PickProcessConfig) => PickProcessConfig,
    options: { markMagnet?: boolean; markPoint?: boolean; preview?: boolean; updateMagnetPosition?: boolean } = {}
  ) => {
    if (options.markMagnet) markMagnetDirty(stepId);
    if (options.markPoint) markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) => ({
      ...currentStep,
      pickConfig: recalculatePickConfig(updater(currentStep.pickConfig ?? createEmptyPickProcessConfig()), {
        updateMagnetPosition: options.updateMagnetPosition ?? options.markMagnet,
      }),
    }));
    if (options.preview) setPickPreviewOverlayStepId(stepId);
  };
  const updateWorkbenchConfig = (updater: (config: typeof activeWorkbenchConfig) => typeof activeWorkbenchConfig) => {
    markProcessParameterDirty();
    setWorkbenchConfigs((prev) => ({ ...prev, [workbenchType]: updater(prev[workbenchType]) }));
  };
  const updateWorkbenchSupportSetting = (supportId: string, updater: (setting: WorkbenchSupportSetting) => WorkbenchSupportSetting) => {
    updateWorkbenchConfig((config) => {
      const currentSetting = config.supportSettings[supportId] ?? createDefaultWorkbenchSupportSetting(supportId);
      return {
        ...config,
        supportSettings: {
          ...config.supportSettings,
          [supportId]: updater(currentSetting),
        },
      };
    });
  };
  const updateWorkbenchClampSetting = (clampId: string, updater: (setting: WorkbenchClampSetting) => WorkbenchClampSetting) => {
    updateWorkbenchConfig((config) => {
      const currentSetting = config.clampSettings[clampId] ?? createDefaultWorkbenchClampSetting(clampId);
      return {
        ...config,
        clampSettings: {
          ...config.clampSettings,
          [clampId]: updater(currentSetting),
        },
      };
    });
  };
  const calculatePlaceSupportCoverage = (config: PlaceProcessConfig, supportId?: string) => {
    const supportOptions = workbenchSupportIdOptions[config.workbenchType] ?? [];
    const selectedSupportIds = (supportId ? [supportId] : config.supportIds).filter((id) => supportOptions.includes(id));
    const supportCount = selectedSupportIds.length;
    const workbenchConfig = workbenchConfigs[config.workbenchType] ?? workbenchConfigs['主筋板正面装配平台'];
    const baseCoverage = normalizePercent(workbenchConfig.supportCoverage);
    const supportSettings = selectedSupportIds.map((id) => workbenchConfig.supportSettings[id] ?? createDefaultWorkbenchSupportSetting(id));
    const averageWidth = supportSettings.length > 0
      ? supportSettings.reduce((total, setting) => total + (Number(setting.width) || 450), 0) / supportSettings.length
      : 0;
    const widthOffset = supportSettings.length > 0 ? Math.max(-4, Math.min(5, (averageWidth - 450) / 60)) : -8;
    const softLimitSpanOffset = supportSettings.reduce((total, setting) => {
      const ySpan = Number(setting.softLimits.Y.max) - Number(setting.softLimits.Y.min);
      const zSpan = Number(setting.softLimits.Z.max) - Number(setting.softLimits.Z.min);
      const spanScore = (Number.isFinite(ySpan) ? ySpan : 240) + (Number.isFinite(zSpan) ? zSpan : 260);
      return total + Math.max(-1.5, Math.min(1.5, (spanScore - 500) / 400));
    }, 0);
    const idOffset = supportId ? ((Number(supportId) || 0) - 1) * 0.85 : 0;
    const selectionPenalty = supportId ? (config.supportIds.includes(supportId) ? 0 : -10) : 0;
    const coverage = baseCoverage + supportCount * 3 - Math.max(0, supportOptions.length - supportCount) * 2 + widthOffset + softLimitSpanOffset + idOffset + selectionPenalty;
    return Math.min(99, Math.max(0, coverage));
  };
  const calculatePlaceJointRows = (config: PlaceProcessConfig) => {
    const supportOptions = workbenchSupportIdOptions[config.workbenchType] ?? [];
    const selectedSupportIds = config.supportIds.filter((id) => supportOptions.includes(id));
    const supportCount = selectedSupportIds.length;
    const supportAverage = supportCount > 0
      ? selectedSupportIds.reduce((total, id) => total + (Number(id) || 0), 0) / supportCount
      : 0;
    const workbenchIndex = Math.max(0, workbenchTypes.indexOf(config.workbenchType));
    const coverage = calculatePlaceSupportCoverage(config);

    return createDemoJointRows().map((baseValue, jointIndex) => {
      const base = Number(baseValue) || 0;
      const direction = jointIndex % 2 === 0 ? 1 : -1;
      const workbenchOffset = workbenchIndex * (jointIndex === 0 ? 7.5 : 2.15);
      const supportOffset = supportCount * (jointIndex === 0 ? 4.25 : 1.05) + supportAverage * (jointIndex === 0 ? 1.6 : 0.42);
      const coverageOffset = (coverage - 75) * (jointIndex === 0 ? 0.2 : 0.055);
      const axisOffset = jointIndex === 0 ? 0 : (jointIndex - 3) * 0.18 * (workbenchIndex + 1);
      return (base + direction * (workbenchOffset + supportOffset + coverageOffset) + axisOffset).toFixed(2);
    });
  };
  const updatePlaceSupportIds = (stepId: string, nextSupportIds: string[]) => {
    markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) => {
      const currentConfig = currentStep.placeConfig ?? createEmptyPlaceProcessConfig();
      const nextConfig = {
        ...currentConfig,
        supportIds: nextSupportIds,
      };
      return {
        ...currentStep,
        placeConfig: {
          ...nextConfig,
          joints: calculatePlaceJointRows(nextConfig),
        },
      };
    });
  };
  const renderPlaceSupportParameterControls = (stepId: string, config: PlaceProcessConfig, compact = false) => {
    const supportOptions = workbenchSupportIdOptions[config.workbenchType] ?? [];
    const selectedSupportIds = config.supportIds.filter((id) => supportOptions.includes(id));
    const supportIdsEmpty = selectedSupportIds.length === 0;
    const coverageRows = selectedSupportIds.map((supportId) => ({
      supportId,
      coverage: calculatePlaceSupportCoverage({ ...config, supportIds: selectedSupportIds }, supportId),
    }));
    return (
      <div className={`ds-parameter-group-stack ${compact ? 'ds-task-parameter-detail-top px-ds-150' : 'px-ds-200'}`}>
        <div className="grid gap-ds-150 md:grid-cols-2">
          <div className="ds-label-input-compact">
            <div className="ds-label-input-compact-label">工作台</div>
            <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
              <span className="truncate">{config.workbenchType}</span>
            </div>
          </div>
          <ProcessMultiSelectBlock
            label="支撑编号"
            values={supportOptions}
            selectedValues={config.supportIds}
            compact={compact}
            onToggle={(supportId) =>
              updatePlaceSupportIds(
                stepId,
                config.supportIds.includes(supportId)
                  ? config.supportIds.filter((id) => id !== supportId)
                  : [...config.supportIds, supportId]
              )
            }
          />
        </div>
        {supportIdsEmpty ? (
          <div className="ds-label-input-compact">
            <div className="ds-label-input-compact-label">支撑覆盖率</div>
            <div className="flex h-8 items-center justify-between rounded-lg bg-red-50 px-2.5 text-xs text-red-600 ring-1 ring-red-100">
              <span className="font-semibold">--</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-600">待选择</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-ds-150 sm:grid-cols-2">
            {coverageRows.map(({ supportId, coverage }) => (
              <div key={supportId} className="ds-label-input-compact">
                <div className="ds-label-input-compact-label">编号{supportId}覆盖率</div>
                <div className="flex h-8 items-center justify-between rounded-lg bg-white px-2.5 text-xs text-slate-700 ring-1 ring-slate-100">
                  <span className="font-semibold">{coverage.toFixed(1)}%</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">已计算</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  const calculateClampCoverage = (config: PlaceProcessConfig, clampId: string) => {
    const selectedClampIds = config.clampIds ?? ['1', '2'];
    const workbenchConfig = workbenchConfigs[config.workbenchType] ?? workbenchConfigs['主筋板正面装配平台'];
    const baseCoverage = normalizePercent(workbenchConfig.clampCoverage);
    const clampSetting = workbenchConfig.clampSettings[clampId] ?? createDefaultWorkbenchClampSetting(clampId);
    const length = Number(clampSetting.size.length);
    const width = Number(clampSetting.size.width);
    const areaScore = ((Number.isFinite(length) ? length : 280) * (Number.isFinite(width) ? width : 180) - 50400) / 14000;
    const axes = workbenchClampAxisOptions[config.workbenchType]?.[clampId] ?? ['Y', 'Z'];
    const softLimitScore = axes.reduce((total, axis) => {
      const span = Number(clampSetting.softLimits[axis].max) - Number(clampSetting.softLimits[axis].min);
      return total + Math.max(-1.25, Math.min(1.5, ((Number.isFinite(span) ? span : 260) - 260) / 220));
    }, 0);
    const selectedOffset = selectedClampIds.includes(clampId) ? 4 : -10;
    const typeOffset = clampSetting.type === '定位焊' ? 1.5 : 0;
    const sideOffset = clampId === '2' ? 1 : 0;
    const coverage = baseCoverage + selectedOffset + areaScore + softLimitScore + typeOffset + sideOffset;
    return Math.min(99, Math.max(0, coverage));
  };
  const calculateClampJointRows = (config: PlaceProcessConfig) => {
    const selectedClampIds = config.clampIds ?? ['1', '2'];
    const workbenchIndex = Math.max(0, workbenchTypes.indexOf(config.workbenchType));
    const clampScore = selectedClampIds.reduce((total, id) => total + (Number(id) || 0), 0);
    const coverageAverage = (calculateClampCoverage(config, '1') + calculateClampCoverage(config, '2')) / 2;

    return createDemoJointRows().map((baseValue, jointIndex) => {
      const base = Number(baseValue) || 0;
      const direction = jointIndex % 2 === 0 ? 1 : -1;
      const workbenchOffset = workbenchIndex * (jointIndex === 0 ? 6.2 : 1.85);
      const clampOffset = selectedClampIds.length * (jointIndex === 0 ? 3.8 : 0.9) + clampScore * (jointIndex === 0 ? 1.25 : 0.36);
      const coverageOffset = (coverageAverage - 72) * (jointIndex === 0 ? 0.18 : 0.05);
      const axisOffset = jointIndex === 0 ? 0 : (jointIndex - 3) * 0.14 * (workbenchIndex + 1);
      return (base + direction * (workbenchOffset + clampOffset + coverageOffset) + axisOffset).toFixed(2);
    });
  };
  const updateClampIds = (stepId: string, nextClampIds: string[]) => {
    markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) => {
      const currentConfig = currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig();
      const nextConfig = {
        ...currentConfig,
        clampIds: nextClampIds,
      };
      return {
        ...currentStep,
        turnoverClampConfig: {
          ...nextConfig,
          joints: calculateClampJointRows(nextConfig),
        },
      };
    });
  };
  const renderClampParameterControls = (stepId: string, config: PlaceProcessConfig, compact = false) => {
    const clampOptions = workbenchClampIdOptions[config.workbenchType] ?? ['1', '2'];
    const selectedClampIds = config.clampIds ?? ['1', '2'];
    const clampIdsEmpty = selectedClampIds.length === 0;
    const coverageRows = clampOptions.map((clampId) => ({
      clampId,
      coverage: calculateClampCoverage({ ...config, clampIds: selectedClampIds }, clampId),
      selected: selectedClampIds.includes(clampId),
    }));

    return (
      <div className={`ds-parameter-group-stack ${compact ? 'ds-task-parameter-detail-top px-ds-150' : 'px-ds-200'}`}>
        <div className="grid gap-ds-150 md:grid-cols-2">
          <div className="ds-label-input-compact">
            <div className="ds-label-input-compact-label">工作台</div>
            <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
              <span className="truncate">{config.workbenchType}</span>
            </div>
          </div>
          <ProcessMultiSelectBlock
            label="压紧编号"
            values={clampOptions}
            selectedValues={selectedClampIds}
            compact={compact}
            onToggle={(clampId) =>
              updateClampIds(
                stepId,
                selectedClampIds.includes(clampId)
                  ? selectedClampIds.filter((id) => id !== clampId)
                  : [...selectedClampIds, clampId]
              )
            }
          />
        </div>
        <div className="grid gap-ds-150 sm:grid-cols-2">
          {coverageRows.map((row) => (
            <div key={row.clampId} className="ds-label-input-compact">
              <div className="ds-label-input-compact-label">编号{row.clampId}覆盖率</div>
              <div className={`flex h-8 items-center justify-between rounded-lg px-2.5 text-xs ring-1 ${
                clampIdsEmpty || !row.selected ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-white text-slate-700 ring-slate-100'
              }`}>
                <span className="font-semibold">{row.coverage.toFixed(1)}%</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                  clampIdsEmpty || !row.selected ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {row.selected ? '已计算' : '未选中'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const updateGrindToolConfig = (updater: (config: typeof activeGrindToolConfig) => typeof activeGrindToolConfig) => {
    markProcessParameterDirty();
    setGrindToolConfigs((prev) => ({ ...prev, [grindToolMode]: updater(prev[grindToolMode]) }));
  };
  const updateWeldParams = (updater: (params: WeldProcessParams) => WeldProcessParams) => {
    markProcessParameterDirty();
    setWeldParams((prev) => cloneWeldProcessParams(updater(prev)));
  };
  const updateWeldScanParams = (updater: (params: WeldProcessParams) => WeldProcessParams) => {
    markProcessParameterDirty();
    setWeldScanParams((prev) => cloneWeldProcessParams(updater(prev)));
  };
  const normalizePercent = (value: string | number) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.min(100, Math.max(0, Math.round(numericValue)));
  };

  const isInvalidNumberText = (value: string) => {
    const text = value.trim();
    if (!text) return true;
    const numericValue = Number(text);
    return !Number.isFinite(numericValue) || Number.isNaN(numericValue) || numericValue < 0;
  };

  const isInvalidNumberRange = (minValue: string, maxValue: string) => {
    if (isInvalidNumberText(minValue) || isInvalidNumberText(maxValue)) return true;
    return Number(minValue) > Number(maxValue);
  };
  const [detachedSectionCollapsed, setDetachedSectionCollapsed] = useState<Record<'grind' | 'weld' | 'datum', boolean>>({
    grind: false,
    weld: false,
    datum: false,
  });
  // 装配基准提取弹窗状态
  const [assemblyDatumModal, setAssemblyDatumModal] = useState<{
    open: boolean;
    minimized: boolean;
    partAId: string | null;
    partBId: string | null;
    partAFeatureId1: string | null;
    partAFeatureId2: string | null;
    partBFeatureId1: string | null;
    partBFeatureId2: string | null;
    selectedEdgeId: string | null;
    activeDatumPart: AssemblyDatumStepKey | null;
    error: string | null;
  } | null>(null);
  const assemblyDatumQuickClickRef = useRef(0);
  const manualWeldQuickClickRef = useRef(0);
  const resetManualFeatureExtractionState = useCallback(() => {
    setManualFeatureExtractionOpen(false);
    setOpenManualFeaturePanels([]);
    setMinimizedManualFeaturePanels([]);
    setManualFeaturePartAId(null);
    setManualFeaturePartBId(null);
    setManualFeatureCandidateId(null);
    setManualGrindWeldFeatureId(null);
    setManualWeldSelectedFaceIds([]);
    setManualWeldFaceMap({});
    setManualWeldCandidates([]);
    setManualWeldFaceSelectionActive(false);
    setManualWeldGenerated(false);
    setManualFeatureError(null);
  }, []);
  const closeExclusiveViewportToolPanels = useCallback((except?: 'coordinate' | 'manual' | 'datum') => {
    if (except !== 'coordinate') {
      resetCoordinateTransformPanelState();
    }
    if (except !== 'manual') {
      resetManualFeatureExtractionState();
    }
    if (except !== 'datum') {
      setAssemblyDatumModal(null);
    }
  }, [resetCoordinateTransformPanelState, resetManualFeatureExtractionState]);
  // 抓取安全路径点位弹窗状态
  const [pickPathModal, setPickPathModal] = useState<{
    stepId: string;
    minimized: boolean;
    segmentIndex?: number;
    combinedWeldMode?: CombinedWeldPathMode;
  } | null>(null);
  const [pickPathLegendCollapsed, setPickPathLegendCollapsed] = useState(false);
  // 焊缝段表格选中态与段内视图（焊接任务路径点位）
  const [compactWeldSegmentIndex, setCompactWeldSegmentIndex] = useState(0);
  const [compactWeldSegmentView, setCompactWeldSegmentView] = useState<'scan' | 'weld' | 'clamp'>('scan');
  // 压紧点配置按任务维护（焊缝段 1-N，每段可单独设置不启用压紧）
  const [clampPointSegmentsByStepId, setClampPointSegmentsByStepId] = useState<Record<string, ClampPointSegmentConfig[]>>({});
  const [pickPathPosePreview, setPickPathPosePreview] = useState<{
    stepId: string;
    pointIndex: PickPathPosePointIndex;
    source: 'safe' | 'result';
    combinedWeldMode?: CombinedWeldPathMode;
  } | null>(null);
  const [selectedResultPointPreview, setSelectedResultPointPreview] = useState<{
    stepId: string;
    pointIndex: number;
    combinedWeldMode?: CombinedWeldPathMode;
  } | null>(null);
  const [weldSegmentPreview, setWeldSegmentPreview] = useState<{
    stepId: string;
    segmentIndex: number;
  } | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!processMenuRef.current?.contains(event.target as Node)) {
        setProcessMenuOpen(false);
      }
      if (!layoutMenuRef.current?.contains(event.target as Node)) {
        setLayoutMenuOpen(false);
      }
      setAssemblyContextMenu(null);
      setProcessContextMenu(null);
      setProcessDeletePopoverKey(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const clearProcessPreviewOverlays = () => {
    setPickPreviewOverlayStepId(null);
    setPlacePreviewOverlayStepId(null);
    setClampPreviewOverlayStepId(null);
    setGrindPreviewOverlayStepId(null);
    setAssemblePreviewOverlayStepId(null);
    setWeldPreviewOverlayStepId(null);
    setWeldSegmentPreview(null);
  };

  const openProcessPathPointModal = (stepId: string, combinedWeldMode?: CombinedWeldPathMode) => {
    clearProcessPreviewOverlays();
    setPickPathModal({ stepId, minimized: false, segmentIndex: 0, combinedWeldMode });
    setPickPathPosePreview(null);
    setSelectedResultPointPreview(null);
  };

  const toggleProcessPathPointModal = (stepId: string, combinedWeldMode?: CombinedWeldPathMode) => {
    if (pickPathModal?.stepId === stepId && pickPathModal.combinedWeldMode === combinedWeldMode) {
      setPickPathModal(null);
      setPickPathPosePreview((prev) => (prev?.stepId === stepId ? null : prev));
      setSelectedResultPointPreview((prev) => (prev?.stepId === stepId ? null : prev));
      return;
    }
    openProcessPathPointModal(stepId, combinedWeldMode);
  };

  const closeProcessPathPointModal = (stepId: string) => {
    setPickPathModal(null);
    setPickPathPosePreview((prev) => (prev?.stepId === stepId ? null : prev));
    setSelectedResultPointPreview((prev) => (prev?.stepId === stepId ? null : prev));
  };

  const getClampPointSegments = (stepId: string, segmentCount: number) =>
    clampPointSegmentsByStepId[stepId] ?? createDefaultClampPointSegments(segmentCount);

  const updateClampPointSegments = (
    stepId: string,
    segmentCount: number,
    updater: (segments: ClampPointSegmentConfig[]) => ClampPointSegmentConfig[]
  ) => {
    setClampPointSegmentsByStepId((prev) => {
      const segments = prev[stepId] ?? createDefaultClampPointSegments(segmentCount);
      return { ...prev, [stepId]: updater(segments) };
    });
  };

  const updateClampPointJoint = (stepId: string, segmentCount: number, segmentIndex: number, jointIndex: number, value: string) => {
    markProcessPointDirty(stepId);
    updateClampPointSegments(stepId, segmentCount, (segments) =>
      segments.map((segment, index) =>
        index === segmentIndex
          ? { ...segment, joints: segment.joints.map((joint, jointIdx) => (jointIdx === jointIndex ? value : joint)) }
          : segment
      )
    );
  };

  const toggleClampPointSegmentEnabled = (stepId: string, segmentCount: number, segmentIndex: number, enabled: boolean) => {
    markProcessPointDirty(stepId);
    updateClampPointSegments(stepId, segmentCount, (segments) =>
      segments.map((segment, index) => (index === segmentIndex ? { ...segment, enabled } : segment))
    );
  };

  const showPickPathPosePreview = (stepId: string, pointIndex: PickPathPosePointIndex, combinedWeldMode?: CombinedWeldPathMode) => {
    const alreadySelected =
      pickPathPosePreview?.stepId === stepId &&
      pickPathPosePreview.pointIndex === pointIndex &&
      pickPathPosePreview.source === 'safe' &&
      pickPathPosePreview.combinedWeldMode === combinedWeldMode;
    clearProcessPreviewOverlays();
    setSelectedResultPointPreview(null);
    if (alreadySelected) {
      setPickPathPosePreview(null);
      return;
    }
    setPickPathPosePreview({ stepId, pointIndex, source: 'safe', combinedWeldMode });
  };

  const showResultPointPosePreview = (stepId: string, pointIndex: number, combinedWeldMode?: CombinedWeldPathMode) => {
    const alreadySelected = selectedResultPointPreview?.stepId === stepId &&
      selectedResultPointPreview.pointIndex === pointIndex &&
      selectedResultPointPreview.combinedWeldMode === combinedWeldMode;
    clearProcessPreviewOverlays();
    if (alreadySelected) {
      setSelectedResultPointPreview(null);
      setPickPathPosePreview(null);
      return;
    }
    setSelectedResultPointPreview({ stepId, pointIndex, combinedWeldMode });
    setPickPathPosePreview({
      stepId,
      pointIndex: (pointIndex % pickPathPoseAnchors.length) as PickPathPosePointIndex,
      source: 'result',
      combinedWeldMode,
    });
  };

  const showWeldSegmentPreview = (stepId: string, segmentIndex: number) => {
    setPickPathPosePreview(null);
    setSelectedResultPointPreview(null);
    clearProcessPreviewOverlays();
    setWeldSegmentPreview({ stepId, segmentIndex });
  };

  const selectProcessPathPointSegment = (segmentIndex: number) => {
    setPickPathModal((prev) => (prev ? { ...prev, segmentIndex } : prev));
    setPickPathPosePreview(null);
    setSelectedResultPointPreview(null);
  };

  const updatePickPathPoint = (
    stepId: string,
    segmentIndex: number,
    pointIndex: number,
    axis: typeof pickPathAxes[number],
    value: string,
    combinedWeldMode?: CombinedWeldPathMode
  ) => {
    markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) =>
      updateProcessPathPoints(
        currentStep,
        getProcessPathPoints(currentStep, segmentIndex, combinedWeldMode).map((currentPoint, currentIndex) =>
          currentIndex === pointIndex ? { ...currentPoint, [axis]: value } : currentPoint
        ),
        segmentIndex,
        combinedWeldMode
      )
    );
  };

  const setPickPathPointEnabled = (
    stepId: string,
    segmentIndex: number,
    pointIndex: number,
    enabled: boolean,
    combinedWeldMode?: CombinedWeldPathMode
  ) => {
    markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) =>
      updateProcessPathPoints(
        currentStep,
        getProcessPathPoints(currentStep, segmentIndex, combinedWeldMode).map((currentPoint, currentIndex) =>
          currentIndex === pointIndex ? { ...currentPoint, enabled } : currentPoint
        ),
        segmentIndex,
        combinedWeldMode
      )
    );
    setPickPathPosePreview((prev) =>
      !enabled && prev?.stepId === stepId && prev.pointIndex === pointIndex && prev.combinedWeldMode === combinedWeldMode ? null : prev
    );
  };

  const updateProcessPosePointByIndex = (
    stepId: string,
    pointIndex: number,
    axis: typeof pickPathAxes[number],
    value: string,
    combinedWeldMode?: CombinedWeldPathMode
  ) => {
    const storedValue = getPathPointStoredAxisValue(axis, value, compactPathCoordinateFrame);
    markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) => {
      if (currentStep.type === 'pick') {
        const currentConfig = currentStep.pickConfig ?? createEmptyPickProcessConfig();
        return {
          ...currentStep,
          pickConfig: {
            ...currentConfig,
            magnetPosition: {
              ...currentConfig.magnetPosition,
              [axis]: storedValue,
            },
          },
        };
      }

      const updateFeatureConfig = (config: FeatureProcessConfig) => {
        const normalizedPosePoints =
          currentStep.type === 'weld'
            ? normalizeWeldPosePoints(config.posePoints)
            : normalizeFeaturePosePoints(config.points, config.posePoints);
        const nextPosePoints = normalizedPosePoints.map((point, index) =>
          index === pointIndex ? { ...point, [axis]: storedValue } : point
        );
        const nextPoints = config.points.map((point, index) =>
          index === pointIndex && (axis === 'x' || axis === 'y' || axis === 'z')
            ? { ...point, [axis]: storedValue }
            : point
        );
        return {
          ...config,
          points: nextPoints,
          posePoints: nextPosePoints,
        };
      };

      if (currentStep.type === 'polish') {
        return {
          ...currentStep,
          grindConfig: updateFeatureConfig(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
        };
      }
      if (currentStep.type === 'assemble') {
        return {
          ...currentStep,
          assembleConfig: updateFeatureConfig(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
        };
      }
      if (currentStep.type === 'weld' || currentStep.type === 'weld-scan') {
        return {
          ...currentStep,
          weldConfig: updateFeatureConfig(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
        };
      }
      if (currentStep.type === 'weld-combined') {
        const configKey = combinedWeldMode === 'scan' ? 'weldScanConfig' : 'weldConfig';
        return {
          ...currentStep,
          [configKey]: updateFeatureConfig(currentStep[configKey] ?? createEmptyFeatureProcessConfig()),
        };
      }
      return currentStep;
    });
  };

  const toggleProcessStepExpanded = (stepKey: string) => {
    const shouldScrollIntoView = !expandedProcessStepIds.has(stepKey);
    setExpandedProcessStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepKey)) {
        next.delete(stepKey);
      } else {
        next.add(stepKey);
      }
      return next;
    });

    if (shouldScrollIntoView) {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(`[data-process-step-key="${CSS.escape(stepKey)}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  };

  const createImported0163Project = (): Project => {
    const sourceProject = initialProjects[0];
    const sourceAssemblyId = sourceProject.tree.id;
    const importedProjectId = '0163';
    const importedAssemblyId = '0163-01-010101';
    const replaceIds = (value: string) => value.replaceAll(sourceAssemblyId, importedAssemblyId);
    const cloneTree = (node: TreeNode): TreeNode => ({
      ...node,
      id: replaceIds(node.id),
      name: replaceIds(node.name),
      relatedPartIds: node.relatedPartIds?.map(replaceIds),
      sourceWeldFeatureIds: node.sourceWeldFeatureIds?.map(replaceIds),
      datumMeta: node.datumMeta
        ? {
            ...node.datumMeta,
            partAId: replaceIds(node.datumMeta.partAId),
            partBId: replaceIds(node.datumMeta.partBId),
          }
        : undefined,
      children: node.children?.map(cloneTree),
    });
    const cloneProcessConfig = <T,>(config: T | undefined): T | undefined => {
      if (!config) return undefined;
      return JSON.parse(JSON.stringify(config).replaceAll(sourceAssemblyId, importedAssemblyId)) as T;
    };

    return {
      id: importedProjectId,
      name: '0163',
      tree: {
        id: importedProjectId,
        name: '0163',
        children: [cloneTree(sourceProject.tree)],
      },
      processSteps: sourceProject.processSteps.map((step) => ({
        ...step,
        id: step.id ? `0163-${step.id}` : undefined,
        name: step.name ? replaceIds(step.name) : undefined,
        board: replaceIds(step.board),
        pickConfig: cloneProcessConfig(step.pickConfig),
        placeConfig: cloneProcessConfig(step.placeConfig),
        turnoverClampConfig: cloneProcessConfig(step.turnoverClampConfig),
        grindConfig: cloneProcessConfig(step.grindConfig),
        assembleConfig: cloneProcessConfig(step.assembleConfig),
        weldConfig: cloneProcessConfig(step.weldConfig),
      })),
      hasAssemblyDrawing: true,
    };
  };

  const handleProjectManagementImport = () => {
    const attempts = (importAttempts['project-management'] || 0) + 1;
    setImportAttempts((prev) => ({ ...prev, 'project-management': attempts }));

    if (attempts === 1) {
      showToast('项目文件解析失败，导入失败', 'error');
      return;
    }

    setProjects((prev) => {
      const imported = createImported0163Project();
      const withoutExisting = prev.filter((project) => project.id !== imported.id);
      return [...withoutExisting, imported];
    });
    setProjectListCollapsed((prev) => {
      const next = new Set(prev);
      next.delete('0163');
      return next;
    });
    setPreviewProjectId(null);
    setPreviewSelectedId(null);
    setCurrentProjectId(null);
    showToast('项目解析成功，已导入 0163 项目', 'success');
  };

  const handleProjectExport = (projectKey: string, projectName: string) => {
    const attempts = exportAttemptsRef.current[projectKey] ?? 0;
    const nextAttempts = attempts + 1;
    exportAttemptsRef.current[projectKey] = nextAttempts;

    if (nextAttempts % 2 === 1) {
      showToast(`${projectName} 项目包导出失败，请检查装配体图纸完整性`, 'error');
      return;
    }

    showToast(`${projectName} 项目包已导出`, 'success');
  };

  const handleBatchImport = (projectId: string) => {
    const attempts = (importAttempts[projectId] || 0) + 1;
    setImportAttempts((prev) => ({ ...prev, [projectId]: attempts }));

    if (attempts === 1) {
      showToast('图纸解析失败，导入失败', 'error');
    } else {
      // 第二次：导入成功，给项目添加同层装配零件
      const baseId = projectId;
      const part04: TreeNode = {
        id: `${baseId}-04`,
        name: `${baseId}-04`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl`,
      };
      const part03: TreeNode = {
        id: `${baseId}-03`,
        name: `${baseId}-03`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl`,
      };
      const part02: TreeNode = {
        id: `${baseId}-02`,
        name: `${baseId}-02`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl`,
      };
      const part01: TreeNode = {
        id: `${baseId}-01`,
        name: `${baseId}-01`,
        modelPath: `${ASSET_BASE}models/0162-01-010101-01.stl`,
      };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, hasAssemblyDrawing: true, tree: { ...p.tree, children: [part01, part02, part03, part04] } }
            : p
        )
      );
      showToast('解析成功，导入成功', 'success');
    }
  };

  const openDrawingManager = (projectId: string, selectedNodeId: string | null = null) => {
    setCreateModelFlow(null);
    setCreateModelFolderPickerHint(null);
    if (createModelFolderPickerTimerRef.current) {
      window.clearTimeout(createModelFolderPickerTimerRef.current);
      createModelFolderPickerTimerRef.current = null;
    }
    setPreviewProjectId(projectId);
    setPreviewSelectedId(selectedNodeId);
    setSelectedDrawingItem(null);
    setDrawingManagerOpen(true);
  };

  const openCreateModelFlow = (target: 'project' | 'group0162', projectId?: string) => {
    const draftKey = target === 'project' ? `project:${projectId ?? 'unknown'}` : 'group0162';
    const existingDraft = createModelDrafts[draftKey];
    const nextGroupIndex = projects.filter((project) => project.id.startsWith('0162-')).length + 1;
    const groupIndexText = String(nextGroupIndex).padStart(2, '0');
    const assemblyName = existingDraft?.assemblyName ?? (target === 'group0162' ? `0162-${groupIndexText}-${groupIndexText}${groupIndexText}${groupIndexText}` : '0162-01-010101');
    const assemblyId = existingDraft?.assemblyId ?? (target === 'group0162' ? assemblyName : `${projectId}-assembly-${Date.now()}`);
    const nextFlow: CreateModelFlow = existingDraft ?? {
      draftKey,
      target,
      projectId,
      assemblyId,
      assemblyName,
      stage: 'missing-assembly',
      failedPartIds: [],
    };
    if (createModelFolderPickerTimerRef.current) {
      window.clearTimeout(createModelFolderPickerTimerRef.current);
    }
    setDrawingManagerOpen(false);
    setCreateModelFlow(null);
    setCreateModelFolderPickerHint(nextFlow);
    setPreviewProjectId(projectId ?? null);
    setPreviewSelectedId(null);
    setSelectedDrawingItem(null);
    createModelFolderPickerTimerRef.current = window.setTimeout(() => {
      setCreateModelFolderPickerHint(null);
      setCreateModelFlow(nextFlow);
      setSelectedDrawingItem({
        type: 'assembly',
        id: assemblyId,
        name: '装配图纸',
      });
      setDrawingManagerOpen(true);
      createModelFolderPickerTimerRef.current = null;
    }, 2000);
  };

  const closeDrawingManager = () => {
    setDrawingManagerOpen(false);
    setCreateModelFlow(null);
    setCreateModelFolderPickerHint(null);
    if (createModelFolderPickerTimerRef.current) {
      window.clearTimeout(createModelFolderPickerTimerRef.current);
      createModelFolderPickerTimerRef.current = null;
    }
  };

  const handleDrawingManagerBatchImport = (projectId: string) => {
    if (createModelFlow) {
      setCreateModelFlow((prev) =>
        {
          if (!prev) return prev;
          const next = {
            ...prev,
            stage: prev.stage === 'missing-assembly' ? 'assembly-imported' : 'complete',
            failedPartIds: [],
          };
          setCreateModelDrafts((drafts) => ({ ...drafts, [next.draftKey]: next }));
          return next;
        }
      );
      showToast('解析成功，导入成功', 'success');
      return;
    }
    handleBatchImport(projectId);
  };

  const handleCreateModelAssemblyImport = () => {
    setCreateModelFlow((prev) =>
      {
        if (!prev) return prev;
        const next = {
          ...prev,
          stage: prev.stage === 'complete' ? 'complete' : 'assembly-imported',
        };
        setCreateModelDrafts((drafts) => ({ ...drafts, [next.draftKey]: next }));
        return next;
      }
    );
    setSelectedDrawingItem((prev) =>
      prev?.type === 'assembly'
        ? prev
        : createModelFlow
          ? { type: 'assembly', id: createModelFlow.assemblyId, name: '装配图纸' }
          : prev
    );
    showToast('解析成功，导入成功', 'success');
  };

  const handleCreateModelPartImport = (partId?: string) => {
    if (!createModelFlow) return;
    const isThirdPart = Boolean(partId?.endsWith('-03'));
    if (isThirdPart) {
      setCreateModelFlow((prev) => {
        if (!prev) return prev;
        const failedPartIds = prev.failedPartIds.includes(partId!)
          ? prev.failedPartIds
          : [...prev.failedPartIds, partId!];
        const next = { ...prev, failedPartIds };
        setCreateModelDrafts((drafts) => ({ ...drafts, [next.draftKey]: next }));
        return next;
      });
      showToast('图纸解析不成功，导入失败', 'error');
      return;
    }
    handleDrawingManagerBatchImport(createModelFlow.assemblyId);
  };

  const confirmCreateModelParsing = () => {
    if (!createModelFlow) return;
    if (createModelFlow.stage !== 'complete' || createModelFlow.failedPartIds.length > 0) {
      showToast('请先导入完整图纸', 'error');
      return;
    }

    const newAssembly = createDemoAssemblyTree(createModelFlow.assemblyId, createModelFlow.assemblyName);
    if (createModelFlow.target === 'project' && createModelFlow.projectId) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === createModelFlow.projectId
            ? { ...project, tree: { ...project.tree, children: [...(project.tree.children ?? []), newAssembly] } }
            : project
        )
      );
      setProjectListCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(createModelFlow.projectId!);
        return next;
      });
      setPreviewProjectId(createModelFlow.projectId);
    } else {
      const newProject: Project = {
        id: createModelFlow.assemblyId,
        name: createModelFlow.assemblyName,
        tree: newAssembly,
        processSteps: [],
        hasAssemblyDrawing: true,
      };
      setProjects((prev) => [...prev, newProject]);
      setProjectListCollapsed((prev) => {
        const next = new Set(prev);
        next.delete('group-0162');
        return next;
      });
      setPreviewProjectId(createModelFlow.assemblyId);
    }
    setPreviewSelectedId(createModelFlow.assemblyId);
    setCreateModelDrafts((prev) => {
      const next = { ...prev };
      delete next[createModelFlow.draftKey];
      return next;
    });
    closeDrawingManager();
    showToast('模型解析成功，已创建装配体', 'success');
  };

  const handleReplaceConfirm = () => {
    if (!replaceConfirm) return;
    const targetId = replaceConfirm.type === 'assembly' ? replaceConfirm.id : replaceConfirm.id;
    setReplaceConfirm(null);
    // 模拟：50% 概率成功/失败
    const isSuccess = Math.random() > 0.5;
    if (isSuccess) {
      setUpdatedDrawingIds((prev) => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
      showToast('解析成功，导入成功', 'success');
    } else {
      showToast('图纸解析失败，导入失败', 'error');
    }
  };

  const toggleProjectListCollapse = (projectId: string) => {
    setProjectListCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleProjectListNodeCollapse = (nodeId: string) => {
    setProjectListNodeCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const currentProject = currentProjectId
    ? projects.find((p) => p.id === currentProjectId) ?? null
    : null;
  const currentProjectStyleCTasksGenerated = Boolean(
    currentProject && generatedStyleCProjectIds.has(currentProject.id)
  );
  const currentProjectStyleCNeedsRegeneration = Boolean(
    currentProject && styleCRegenerationNeededProjectIds.has(currentProject.id)
  );
  const getProjectHasUnsavedChanges = (project: Project) =>
    featureDirtyProjectIds.has(project.id) ||
    processPlanningDirtyProjectIds.has(project.id) ||
    (project.id === currentProjectId && processParameterDirty);
  const currentProjectHasUnsavedChanges = currentProject ? getProjectHasUnsavedChanges(currentProject) : false;
  const openProcessPlanningProjects = openProcessPlanningProjectIds
    .map((projectId) => projects.find((project) => project.id === projectId))
    .filter((project): project is Project => Boolean(project));

  useEffect(() => {
    setProcessSequenceScrolled(false);
    setProjectStructureScrolled(false);
    setProjectPropertiesScrolled(false);
    setSelectedPlanningProcessId(null);
    setCheckedPlanningProcessIds(new Set());
    setProcessIsolationDismissed(false);
    setCompactProcessBatchMode(false);
    setCheckedCompactProcessStepKeys(new Set());
    setCompactProcessFilterOpen(false);
    setCompactProcessFilterKinds([]);
    setCompactProcessFilterValues({});
    setDisabledCompactProcessStepKeys(new Set());
    setSelectedCompactProcessStepKey(null);
    setIsolatedCompactProcessStepKey(null);
    closeExclusiveViewportToolPanels();
  }, [currentProjectId, closeExclusiveViewportToolPanels]);

  const objectTree = currentProject?.tree ?? null;
  const leafParts = objectTree ? collectLeafParts(objectTree) : [];
  const processFeatureItems = objectTree ? collectDetachedFeatureItems(objectTree) : [];
  const coordinateTransformPivotTargetParts = coordinateTransformPartIds
    .map((partId) => leafParts.find((part) => part.id === partId))
    .filter((part): part is TreeNode & { modelPath: string } => Boolean(part?.modelPath));
  const coordinateTransformPivotTargetSceneParts: SelectableFacePart[] = coordinateTransformPivotTargetParts.map((part) => ({
    id: part.id,
    name: part.name,
    url: part.modelPath,
  }));
  const coordinateTransformSelectableTargetSignature = leafParts.map((part) => part.id).join('|');
  const coordinateTransformPartSignature = coordinateTransformPartIds.join('|');
  const grindFeatureItems = processFeatureItems.filter((item) => item.featureType === 'grind');
  const grindFeaturePathSignature = grindFeatureItems.map((item) => `${item.id}:${item.featureUrl ?? ''}`).join('|');
  const weldFeatureItems = processFeatureItems.filter((item) => item.featureType === 'weld');
  const weldFeaturePathSignature = weldFeatureItems.map((item) => `${item.id}:${item.featureUrl ?? ''}`).join('|');
  const datumFeatureItems = processFeatureItems.filter((item) => item.featureType === 'datum');
  const weldFeatureUrlById = new Map(weldFeatureItems.map((item) => [item.id, item.featureUrl]));
  const getSourceWeldFeatureUrl = (feature: DetachedFeatureItem) =>
    feature.sourceWeldFeatureIds?.map((featureId) => weldFeatureUrlById.get(featureId)).find((url): url is string => Boolean(url));

  useEffect(() => {
    let cancelled = false;
    const featureSources = grindFeatureItems.filter((item) => item.featureUrl);
    void Promise.all(
      featureSources.map(async (item) => {
        try {
          return [item.id, await loadGrindFeaturePath(item.featureUrl!, getSourceWeldFeatureUrl(item))] as const;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const loadedPaths = new Map(entries.filter((entry): entry is readonly [string, GrindFeaturePath] => Boolean(entry)));
      setGrindFeaturePaths((previous) => {
        const next = { ...previous };
        loadedPaths.forEach((path, featureId) => {
          next[featureId] = path;
        });
        return next;
      });
      if (currentProject && loadedPaths.size > 0) {
        setProjects((previous) => previous.map((project) => {
          if (project.id !== currentProject.id) return project;
          return {
            ...project,
            processSteps: project.processSteps.map((step) => {
              if (step.type !== 'polish' || !step.grindConfig || !isDefaultGrindFallbackConfig(step.grindConfig)) return step;
              const featureId = step.grindConfig.featureIds[0];
              const path = featureId ? loadedPaths.get(featureId) : undefined;
              if (!path) return step;
              const generatedConfig = createGeneratedGrindConfig(step.grindConfig.featureIds, path);
              return {
                ...step,
                grindConfig: {
                  ...generatedConfig,
                  grindParams: step.grindConfig.grindParams
                    ? cloneGrindProcessParams(step.grindConfig.grindParams)
                    : generatedConfig.grindParams,
                },
              };
            }),
          };
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [grindFeaturePathSignature, weldFeaturePathSignature]);

  const loadGrindPathForFeature = async (
    featureId: string,
    featureItems: DetachedFeatureItem[] = grindFeatureItems,
  ) => {
    const feature = featureItems.find((item) => item.id === featureId);
    if (!feature?.featureUrl) throw new Error('当前打磨特征没有可用几何文件');
    const path = await loadGrindFeaturePath(feature.featureUrl, getSourceWeldFeatureUrl(feature));
    setGrindFeaturePaths((previous) => ({ ...previous, [featureId]: path }));
    return path;
  };

  const hydrateGeneratedGrindSteps = async (
    steps: ProcessStep[],
    featureItems: DetachedFeatureItem[] = grindFeatureItems,
  ) => {
    if (!currentProject) return;
    const projectId = currentProject.id;
    const updatedSteps = new Map<string, ProcessStep>();
    await Promise.all(
      steps
        .filter((step): step is ProcessStep & { id: string; grindConfig: FeatureProcessConfig } =>
          step.type === 'polish' && Boolean(step.id) && Boolean(step.grindConfig?.featureIds.length)
        )
        .map(async (step) => {
          const featureId = step.grindConfig.featureIds[0];
          try {
            const path = await loadGrindPathForFeature(featureId, featureItems);
            const generatedConfig = createGeneratedGrindConfig(step.grindConfig.featureIds, path);
            updatedSteps.set(step.id, {
              ...step,
              grindConfig: {
                ...generatedConfig,
                grindParams: step.grindConfig.grindParams
                  ? cloneGrindProcessParams(step.grindConfig.grindParams)
                  : generatedConfig.grindParams,
              },
            });
          } catch {
            // Keep the existing demo fallback when a feature file cannot be loaded.
          }
        })
    );
    if (updatedSteps.size === 0) return;
    setProjects((previous) => previous.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        processSteps: project.processSteps.map((step) => (step.id && updatedSteps.get(step.id)) || step),
      };
    }));
  };

  const generateGrindPathForStep = async (stepId: string, featureIds: string[]) => {
    const featureId = featureIds[0];
    if (!featureId) return;
    try {
      const path = await loadGrindPathForFeature(featureId);
      updateProcessStepById(stepId, (currentStep) => {
        const generatedConfig = createGeneratedGrindConfig(featureIds, path);
        const currentConfig = currentStep.grindConfig ?? createEmptyFeatureProcessConfig();
        return {
          ...currentStep,
          grindConfig: {
            ...generatedConfig,
            grindParams: currentConfig.grindParams
              ? cloneGrindProcessParams(currentConfig.grindParams)
              : generatedConfig.grindParams,
          },
        };
      });
      setCollapsedPickPointInfoIds((previous) => {
        const next = new Set(previous);
        next.delete(`${stepId}-grind`);
        return next;
      });
      setGrindPreviewOverlayStepId(stepId);
      showToast('已按打磨特征线生成 6 个结果点和安全进出点', 'success');
    } catch {
      showToast('打磨特征几何加载失败，暂时保留默认点位', 'error');
    }
  };

  const fixedPlanningProcesses = useMemo(
    () => currentProject ? createFixedPlanningProcesses(currentProject.tree.id) : [],
    [currentProject?.id, currentProject?.tree.id]
  );
  const selectedPlanningProcess = selectedPlanningProcessId
    ? fixedPlanningProcesses.find((process) => process.id === selectedPlanningProcessId) ?? null
    : null;
  const allProcessSteps = currentProject ? getProcessSteps(currentProject) : [];
  const togglePlanningProcessChecked = (processId: string) => {
    setCheckedPlanningProcessIds((previous) => {
      const next = new Set(previous);
      if (next.has(processId)) {
        next.delete(processId);
      } else {
        next.add(processId);
      }
      return next;
    });
  };
  const checkedPlanningProcesses = fixedPlanningProcesses.filter((process) => checkedPlanningProcessIds.has(process.id));
  const planningProcessExportLabel = checkedPlanningProcesses.length > 0
    ? `导出(${checkedPlanningProcesses.length})`
    : '导出全部';
  const handlePlanningProcessExport = () => {
    const processesToExport = checkedPlanningProcesses.length > 0 ? checkedPlanningProcesses : fixedPlanningProcesses;
    const taskCount = processesToExport.reduce((total, process) => total + process.taskSlots.length, 0);
    const scopeLabel = checkedPlanningProcesses.length > 0
      ? `${checkedPlanningProcesses.length} 道选中工序`
      : `全部 ${fixedPlanningProcesses.length} 道工序`;
    showToast(`已导出${scopeLabel}及 ${taskCount} 项任务`, 'success');
  };
  const createStyleCGeneratedProcessSteps = (): ProcessStep[] =>
    fixedPlanningProcesses.flatMap((process) =>
      process.taskSlots.map((slot) => {
        const baseStep: ProcessStep = {
          id: slot.id,
          processId: process.id,
          name: slot.label,
          confirmed: true,
          board: process.object,
          action: slot.label,
          type: slot.type,
        };
        if (slot.type === 'pick') {
          return { ...baseStep, pickConfig: createGeneratedPickConfig(slot.workpieceIds) };
        }
        if (slot.type === 'place') {
          return { ...baseStep, placeConfig: createGeneratedPlaceConfig(slot.workpieceIds) };
        }
        if (slot.type === 'turnover-clamp') {
          return { ...baseStep, turnoverClampConfig: createGeneratedClampConfig(slot.workpieceIds) };
        }
        if (slot.type === 'polish') {
          return { ...baseStep, grindConfig: createGeneratedGrindConfig(slot.featureIds) };
        }
        if (slot.type === 'assemble') {
          return { ...baseStep, assembleConfig: createGeneratedAssembleConfig(slot.featureIds) };
        }
        if (slot.type === 'weld-combined') {
          return {
            ...baseStep,
            ...createGeneratedCombinedWeldConfig(slot.featureIds, weldScanParams, weldParams),
          };
        }
        if (slot.type === 'weld-scan') {
          return { ...baseStep, weldConfig: createGeneratedWeldScanConfig(slot.featureIds, weldScanParams) };
        }
        return { ...baseStep, weldConfig: createGeneratedWeldConfig(slot.featureIds, weldParams) };
      })
    );

  const buildAssemblySimulationSnapshot = async ({
    sourceKind,
    sourceFileName,
    processSequence,
    sourceIdentity,
    copyIndex,
    createdAt,
  }: {
    sourceKind: 'process-planning' | 'local-file';
    sourceFileName?: string;
    processSequence: number;
    sourceIdentity: string;
    copyIndex: number;
    createdAt: string;
  }): Promise<SimulationSourceTask | null> => {
    const sourceProject = sourceKind === 'local-file'
      ? projects.find((project) => project.id === defaultProject.id) ?? null
      : currentProject ?? projects.find((project) => project.id === defaultProject.id) ?? null;
    if (!sourceProject) return null;
    const sourceProcesses = createFixedPlanningProcesses(sourceProject.tree.id);
    const planningProcess = sourceProcesses.find((process) => process.sequence === processSequence);
    if (!planningProcess) return null;
    const sourceSteps = getProcessSteps(sourceProject);
    const configuredClampStep = sourceSteps.find((step) => (
      step.type === 'turnover-clamp'
      && getPlanningProcessIdForTask(step) === planningProcess.id
    ));
    const configuredWeldStep = sourceSteps.find((step) => (
      step.type === 'weld-combined'
      && getPlanningProcessIdForTask(step) === planningProcess.id
    ));
    if (sourceKind === 'process-planning' && (!configuredClampStep || !configuredWeldStep)) return null;

    const clampSlot = planningProcess.taskSlots.find((slot) => slot.type === 'turnover-clamp');
    const weldSlot = planningProcess.taskSlots.find((slot) => slot.type === 'weld-combined');
    const clampStep: ProcessStep = configuredClampStep ?? {
      id: `local-${clampSlot?.id ?? `${planningProcess.id}-clamp`}`,
      processId: planningProcess.id,
      board: planningProcess.object,
      action: '翻面压紧',
      type: 'turnover-clamp',
      turnoverClampConfig: createGeneratedClampConfig(planningProcess.workpieceIds),
    };
    const weldStep: ProcessStep = configuredWeldStep ?? {
      id: `local-${weldSlot?.id ?? `${planningProcess.id}-weld-combined`}`,
      processId: planningProcess.id,
      board: planningProcess.object,
      action: '焊接',
      type: 'weld-combined',
      ...createGeneratedCombinedWeldConfig(weldSlot?.featureIds),
    };
    const sourceStepIndex = sourceSteps.findIndex((step) => step.id === weldStep.id);
    const sourceStepKey = getProcessStepKey(weldStep, sourceStepIndex >= 0 ? sourceStepIndex : 0);
    const sourceFeatureItems = collectDetachedFeatureItems(sourceProject.tree).filter((item) => item.featureType === 'weld');
    const featureIds = Array.from(new Set([
      ...(weldStep.weldConfig?.featureIds ?? []),
      ...(weldStep.weldScanConfig?.featureIds ?? []),
    ]));
    const taskWeldFeatures = featureIds
      .map((featureId) => sourceFeatureItems.find((feature) => feature.id === featureId))
      .filter((feature): feature is DetachedFeatureItem => Boolean(feature));
    const fallbackWeldFeature = sourceFeatureItems.find((feature) => (
      feature.featureUrl
      && (planningProcess.simulationSide === 'back'
        ? feature.id.includes('weld-back')
        : feature.id.includes('weld-front'))
    )) ?? null;
    const fallbackWeldFeatureUrl = fallbackWeldFeature?.featureUrl
      ?? (planningProcess.simulationSide === 'back'
        ? `${ASSET_BASE}models/intersections/back-intersection-1.obj`
        : `${ASSET_BASE}models/intersections/front-intersection.obj`);
    const fallbackWeldFeatureName = fallbackWeldFeature?.name
      ?? (planningProcess.simulationSide === 'back' ? '反面焊缝 1' : '正面焊缝');
    const weldFeatureUrls = taskWeldFeatures
      .map((feature) => feature.featureUrl)
      .filter((url): url is string => Boolean(url));
    if (weldFeatureUrls.length === 0) {
      weldFeatureUrls.push(fallbackWeldFeatureUrl);
    }
    const relatedPartIds = new Set([
      ...planningProcess.object.split(' + ').filter(Boolean),
      ...taskWeldFeatures.flatMap((feature) => feature.relatedPartIds),
    ]);
    const sourceLeafParts = collectLeafParts(sourceProject.tree);
    const relatedModelParts = sourceLeafParts
      .filter((part) => Boolean(part.modelPath) && relatedPartIds.has(part.id))
      .map((part) => ({ id: part.id, name: part.name, url: part.modelPath! }));
    const modelParts = relatedModelParts.length > 0
      ? relatedModelParts
      : sourceLeafParts
          .filter((part) => Boolean(part.modelPath))
          .map((part) => ({ id: part.id, name: part.name, url: part.modelPath! }));
    const weldPointSource = weldStep.weldConfig?.posePoints?.length
      ? weldStep.weldConfig.posePoints
      : weldStep.weldConfig?.points;
    const scanPointSource = weldStep.weldScanConfig?.posePoints?.length
      ? weldStep.weldScanConfig.posePoints
      : weldStep.weldScanConfig?.points;
    const [weldPosePoints, scanPosePointTemplates] = await Promise.all([
      createSimulationWeldPosePoints(weldPointSource, weldFeatureUrls),
      createSimulationWeldPosePoints(scanPointSource, weldFeatureUrls),
    ]);
    const scanPosePoints = createSimulationScanPosePoints(
      weldPosePoints,
      scanPosePointTemplates,
      weldStep.weldScanConfig?.weldParams?.scanOffsetZ,
    );
    const sequenceId = ++simulationTaskCounterRef.current;
    const displayBaseName = `${sourceProject.tree.id} · ${String(processSequence).padStart(2, '0')}装配`;
    const supportJoints = clampStep.turnoverClampConfig?.joints ?? createDemoJointRows();
    const clampJoints = ['120.00', '-18.00', '36.00', '0.00', '0.00', '0.00'];

    const weldFeatureNames = taskWeldFeatures.length > 0
      ? taskWeldFeatures.map((feature) => feature.name)
      : [fallbackWeldFeatureName];

    const supportAxisValues = supportJoints.map((value, index) => ({
      axis: `J${index + 1}` as const,
      value,
      unit: index === 0 ? 'mm' as const : '°' as const,
    }));
    const clampAxisValues = clampJoints.map((value, index) => ({
      axis: `J${index + 1}` as const,
      value,
      unit: index === 0 ? 'mm' as const : '°' as const,
    }));
    const hasMultipleWeldTasks = sourceKind === 'local-file' && processSequence === 6;
    const weldTaskCount = hasMultipleWeldTasks ? 2 : 1;
    const weldTasks = Array.from({ length: weldTaskCount }, (_, weldTaskOffset) => {
      const weldTaskIndex = weldTaskOffset + 1;
      const weldTaskSourceKey = weldTaskIndex === 1 ? sourceStepKey : `${sourceStepKey}-weld-task-${weldTaskIndex}`;
      const taskSupportAxisValues = weldTaskIndex === 1
        ? supportAxisValues.map((axis) => ({ ...axis }))
        : offsetSimulationAxisValues(supportAxisValues, [18, 4, -6, 8, -5, 7, 3, -4]);
      const taskClampAxisValues = weldTaskIndex === 1
        ? clampAxisValues.map((axis) => ({ ...axis }))
        : offsetSimulationAxisValues(clampAxisValues, [12, 6, -5, 8, -6, 9]);
      return {
        id: `${sourceStepKey}-weld-task-${weldTaskIndex}`,
        index: weldTaskIndex,
        name: hasMultipleWeldTasks ? `焊接任务${weldTaskIndex}` : '焊接任务',
        sourceStepKey: weldTaskSourceKey,
        weldFeatureNames: [...weldFeatureNames],
        weldFeatureUrls: [...weldFeatureUrls],
        supportAxisValues: taskSupportAxisValues,
        clampAxisValues: taskClampAxisValues,
        weldSegments: createSimulationWeldSegments(
          weldTaskSourceKey,
          scanPosePoints.slice(0, SIMULATION_WELD_SEGMENT_COUNT * 2),
          weldPosePoints.slice(0, SIMULATION_WELD_SEGMENT_COUNT * 2),
          weldFeatureNames,
        ),
      };
    });
    const primaryWeldTask = weldTasks[0];

    return {
      id: `simulation-${Date.now()}-${sequenceId}`,
      displayName: displayBaseName,
      name: '装配',
      sourceKind,
      sourceLabel: sourceKind === 'process-planning'
        ? `工艺规划 / ${sourceProject.tree.id} / 第${String(processSequence).padStart(2, '0')}道装配`
        : `本地文件 / ${sourceFileName ?? 'assembly-tasks.rt'} / 第${String(processSequence).padStart(2, '0')}道装配`,
      sourceIdentity,
      sourceFileName,
      createdAt,
      copyIndex,
      sourceStepId: weldStep.id ?? sourceStepKey,
      sourceStepKey,
      clampStepId: clampStep.id ?? `${planningProcess.id}-clamp`,
      scanStepId: weldStep.id,
      processId: planningProcess.id,
      processSequence: planningProcess.sequence,
      processName: planningProcess.name,
      assemblyId: sourceProject.tree.id,
      station: planningProcess.station,
      side: planningProcess.simulationSide ?? 'front',
      targetLabel: planningProcess.object,
      weldFeatureNames,
      weldFeatureUrls,
      modelParts,
      supportAxisValues: primaryWeldTask.supportAxisValues,
      clampAxisValues: primaryWeldTask.clampAxisValues,
      weldSegments: primaryWeldTask.weldSegments,
      weldTasks,
    };
  };

  const activateSimulationWorkspace = (workspaceId: string) => {
    setActiveSimulationWorkspaceId(workspaceId);
    setActiveMainNav('virtual-simulation');
    updateMainNavRoute('virtual-simulation');
    setProcessPlanningMenuOpen(false);
    setVirtualSimulationMenuOpen(false);
  };

  const addSimulationWorkspace = async (
    sourceKind: 'process-planning' | 'local-file',
    sourceFileName?: string,
    processSequence = 6,
  ) => {
    const sourceProject = sourceKind === 'local-file'
      ? projects.find((project) => project.id === defaultProject.id) ?? null
      : currentProject ?? projects.find((project) => project.id === defaultProject.id) ?? null;
    if (!sourceProject) return null;
    const localFileName = sourceFileName ?? `${sourceProject.tree.id}-装配任务.rt`;
    const processId = createFixedPlanningProcesses(sourceProject.tree.id)
      .find((process) => process.sequence === processSequence)?.id;
    const sourceIdentity = sourceKind === 'process-planning'
      ? `planning:${sourceProject.tree.id}:${processId ?? processSequence}`
      : `local:${localFileName}`;
    const copyIndex = Math.max(
      0,
      ...simulationWorkspaces
        .filter((workspace) => workspace.sourceIdentity === sourceIdentity)
        .map((workspace) => workspace.copyIndex),
    ) + 1;
    const createdAt = new Date().toISOString();
    const workspaceSequenceId = ++simulationTaskCounterRef.current;
    const workspaceId = `simulation-workspace-${Date.now()}-${workspaceSequenceId}`;
    const taskSequences = sourceKind === 'local-file' ? [6, 12] : [processSequence];
    const tasks = (await Promise.all(taskSequences.map((sequence) => buildAssemblySimulationSnapshot({
      sourceKind,
      sourceFileName: sourceKind === 'local-file' ? localFileName : undefined,
      processSequence: sequence,
      sourceIdentity,
      copyIndex,
      createdAt,
    })))).filter((task): task is SimulationSourceTask => Boolean(task));
    if (tasks.length !== taskSequences.length) {
      showToast(
        sourceKind === 'local-file'
          ? '本地文件中的第 06 / 12 道装配任务创建失败'
          : `请先在第 ${String(processSequence).padStart(2, '0')} 道装配工序中配置翻面压紧和焊接任务`,
        'error',
      );
      return null;
    }
    const displayBaseName = sourceKind === 'process-planning'
      ? `${sourceProject.tree.id} · ${String(processSequence).padStart(2, '0')}装配`
      : localFileName.replace(/\.rt$/i, '');
    const workspace: SimulationWorkspace = {
      id: workspaceId,
      displayName: `${displayBaseName} · 副本${copyIndex}`,
      sourceKind,
      sourceLabel: sourceKind === 'process-planning'
        ? `工艺规划 / ${sourceProject.tree.id}`
        : `本地文件 / ${localFileName}`,
      sourceIdentity,
      sourceFileName: sourceKind === 'local-file' ? localFileName : undefined,
      createdAt,
      copyIndex,
      tasks,
    };
    setSimulationWorkspaces((current) => [...current, workspace]);
    activateSimulationWorkspace(workspace.id);
    showToast(
      sourceKind === 'process-planning'
        ? `已创建第 ${String(processSequence).padStart(2, '0')} 道装配仿真副本`
        : '已新增本地仿真副本，包含第 06 / 12 道装配任务',
      'success',
    );
    return workspace;
  };

  const openSimulationFilePicker = () => {
    if (simulationFilePickerTimerRef.current) window.clearTimeout(simulationFilePickerTimerRef.current);
    setVirtualSimulationMenuOpen(false);
    setSimulationFilePickerOpen(true);
    simulationFilePickerTimerRef.current = window.setTimeout(() => {
      setSimulationFilePickerOpen(false);
      simulationFilePickerTimerRef.current = null;
      void addSimulationWorkspace('local-file', '0162-01-010101-装配任务.rt');
    }, 2000);
  };

  const closeSimulationWorkspace = (workspaceId: string) => {
    const closingIndex = simulationWorkspaces.findIndex((workspace) => workspace.id === workspaceId);
    const nextWorkspaces = simulationWorkspaces.filter((workspace) => workspace.id !== workspaceId);
    setSimulationWorkspaces(nextWorkspaces);
    if (activeSimulationWorkspaceId === workspaceId) {
      const nextActiveWorkspace = nextWorkspaces[Math.min(Math.max(closingIndex - 1, 0), nextWorkspaces.length - 1)] ?? null;
      setActiveSimulationWorkspaceId(nextActiveWorkspace?.id ?? null);
    }
    if (nextWorkspaces.length === 0) setVirtualSimulationMenuOpen(false);
  };

  const deleteSimulationWorkspaceTask = (workspaceId: string, taskId: string) => {
    const workspaceIndex = simulationWorkspaces.findIndex((workspace) => workspace.id === workspaceId);
    const workspace = simulationWorkspaces[workspaceIndex];
    if (!workspace) return;
    const nextTasks = workspace.tasks.filter((task) => task.id !== taskId);
    if (nextTasks.length > 0) {
      setSimulationWorkspaces((current) => current.map((item) => (
        item.id === workspaceId ? { ...item, tasks: nextTasks } : item
      )));
      return;
    }
    const nextWorkspaces = simulationWorkspaces.filter((item) => item.id !== workspaceId);
    setSimulationWorkspaces(nextWorkspaces);
    if (activeSimulationWorkspaceId === workspaceId) {
      const nextActiveWorkspace = nextWorkspaces[Math.min(Math.max(workspaceIndex - 1, 0), nextWorkspaces.length - 1)] ?? null;
      setActiveSimulationWorkspaceId(nextActiveWorkspace?.id ?? null);
    }
    if (nextWorkspaces.length === 0) setVirtualSimulationMenuOpen(false);
  };

  const activeSimulationWorkspace = simulationWorkspaces.find((workspace) => workspace.id === activeSimulationWorkspaceId) ?? null;
  const returnFromSimulationToPlanning = (task: SimulationSourceTask | null) => {
    setActiveMainNav('process-planning');
    updateMainNavRoute('process-planning');
    setProcessPlanningMenuOpen(false);
    setVirtualSimulationMenuOpen(false);
    if (!task) return;
    setSelectedPlanningProcessId(task.processId);
    setProcessIsolationDismissed(false);
    setSelectedCompactProcessStepKey(null);
    setIsolatedCompactProcessStepKey(null);
    setSelectedId('');
  };
  const processSteps = layoutVariant === 'immersive'
    ? currentProjectStyleCTasksGenerated
      ? selectedPlanningProcessId
        ? allProcessSteps.filter((step) => getPlanningProcessIdForTask(step) === selectedPlanningProcessId)
        : allProcessSteps
      : []
    : allProcessSteps;
  const planningProcessStepsById = new Map(
    allProcessSteps
      .filter((step): step is ProcessStep & { id: string } => Boolean(step.id))
      .map((step) => [step.id, step])
  );
  const isProcessStepTaskDirty = (step: ProcessStep) => {
    const rootStepId = getRootProcessStepId(step.id);
    return Boolean(rootStepId) && (
      processPointDirtyStepIds.has(rootStepId) ||
      magnetDirtyStepIds.has(rootStepId) ||
      grindParameterDirtyStepIds.has(rootStepId) ||
      assembleParameterDirtyStepIds.has(rootStepId) ||
      weldParameterDirtyStepIds.has(rootStepId)
    );
  };
  const getProcessStepValidationMessage = (step: ProcessStep) => {
    if (step.type === 'pick') {
      if (!step.pickConfig?.workpieceIds.length) return '抓取任务缺少工件对象';
      return null;
    }
    if (step.type === 'place') {
      if (!step.placeConfig?.workpieceIds.length) return '放置任务缺少工件对象';
      return null;
    }
    if (step.type === 'turnover-clamp') {
      if (!step.turnoverClampConfig?.workpieceIds.length) return '翻面压紧任务缺少工件对象';
      return null;
    }
    if (step.type === 'polish') {
      if (!step.grindConfig?.featureIds.length) return '打磨任务缺少打磨特征';
      return null;
    }
    if (step.type === 'assemble') {
      if (!step.assembleConfig?.featureIds.length) return '装配任务缺少装配基准特征';
      return null;
    }
    if (step.type === 'weld-combined') {
      if (!step.weldConfig?.featureIds.length || !step.weldScanConfig?.featureIds.length) return '焊接任务缺少焊缝特征';
      return null;
    }
    if (step.type === 'weld' || step.type === 'weld-scan') {
      if (!step.weldConfig?.featureIds.length) return '焊接任务缺少焊缝特征';
    }
    return null;
  };
  const processStepKeySignature = processSteps.map((step, index) => getProcessStepKey(step, index)).join('|');
  const selectedCompactProcessStep = selectedCompactProcessStepKey
    ? processSteps
        .map((step, index) => ({ step, key: getProcessStepKey(step, index) }))
        .find((entry) => entry.key === selectedCompactProcessStepKey)?.step ?? null
    : null;
  const isolatedCompactProcessStep = isolatedCompactProcessStepKey
    ? processSteps
        .map((step, index) => ({ step, key: getProcessStepKey(step, index) }))
        .find((entry) => entry.key === isolatedCompactProcessStepKey)?.step ?? null
    : null;
  const selectedPlanningProcessIsolation = layoutVariant === 'immersive' && !processIsolationDismissed
    ? selectedPlanningProcess
    : null;
  const isolatedFixedPlanningProcess = isolatedCompactProcessStep
    ? fixedPlanningProcesses.find((process) => process.id === getPlanningProcessIdForTask(isolatedCompactProcessStep)) ?? null
    : null;
  const isolatedPlanningProcessFeatureIds = selectedPlanningProcessIsolation
    ? Array.from(new Set([
        ...selectedPlanningProcessIsolation.taskSlots.flatMap((slot) => slot.featureIds),
        ...allProcessSteps
          .filter((step) => getPlanningProcessIdForTask(step) === selectedPlanningProcessIsolation.id)
          .flatMap((step) => getProcessStepFeatureIds(step)),
      ]))
    : [];
  const planningProcessIsolationTargets = selectedPlanningProcessIsolation
    ? { partIds: selectedPlanningProcessIsolation.workpieceIds, featureIds: isolatedPlanningProcessFeatureIds }
    : { partIds: [], featureIds: [] };
  const planningProcessIsolationRelatedPartIds = objectTree
    ? planningProcessIsolationTargets.featureIds.flatMap((featureId) => getFeatureRelatedPartIds(findNodeById(objectTree, featureId)))
    : [];
  const planningProcessIsolationRelatedIds = new Set([
    ...planningProcessIsolationTargets.partIds,
    ...planningProcessIsolationTargets.featureIds,
    ...planningProcessIsolationRelatedPartIds,
  ]);
  const taskFocusTargets = isolatedCompactProcessStep
    ? getProcessStepTargetIds(isolatedCompactProcessStep, isolatedFixedPlanningProcess?.workpieceIds)
    : { partIds: [], featureIds: [] };
  const taskFocusRelatedPartIds = objectTree
    ? taskFocusTargets.featureIds.flatMap((featureId) => getFeatureRelatedPartIds(findNodeById(objectTree, featureId)))
    : [];
  const taskFocusRelatedIds = new Set([
    ...taskFocusTargets.partIds,
    ...taskFocusTargets.featureIds,
    ...taskFocusRelatedPartIds,
  ]);
  const planningProcessIsolationActive = Boolean(
    currentProject && selectedPlanningProcessIsolation && planningProcessIsolationRelatedIds.size > 0,
  );
  const taskFocusActive = Boolean(
    currentProject && isolatedCompactProcessStep && taskFocusRelatedIds.size > 0,
  );
  const processIsolationActive = Boolean(
    planningProcessIsolationActive || taskFocusActive,
  );
  const isolatedProcessRelatedIds = taskFocusActive ? taskFocusRelatedIds : planningProcessIsolationRelatedIds;
  const getProcessIsolationOpacity = (id: string) => {
    if (taskFocusActive) {
      if (taskFocusRelatedIds.has(id)) return 1;
      if (planningProcessIsolationActive && planningProcessIsolationRelatedIds.has(id)) return PROCESS_TASK_CONTEXT_OPACITY;
      return PROCESS_ISOLATION_DIMMED_OPACITY;
    }
    if (planningProcessIsolationActive) {
      return planningProcessIsolationRelatedIds.has(id) ? 1 : PROCESS_ISOLATION_DIMMED_OPACITY;
    }
    return 1;
  };
  const compactProcessFilterActive = compactProcessFilterKinds.length > 0;
  const compactProcessEntries = processSteps.map((step, index) => ({
    step,
    index,
    key: getProcessStepKey(step, index),
  }));
  const compactProcessFilteredEntries = compactProcessEntries.filter(({ step }) => {
    if (!compactProcessFilterActive) return true;
    return compactProcessFilterKinds.every((kind) => {
      const values = compactProcessFilterValues[kind] ?? [];
      if (values.length === 0) return false;
      if (kind === 'part') {
        const partIds = getProcessStepPartIds(step);
        return values.some((value) => partIds.includes(value));
      }
      if (kind === 'type') return values.includes(getShortProcessStepTitle(step.type));
      const featureIds = getProcessStepFeatureIdsByFilterKind(step, kind);
      return values.some((value) => featureIds.includes(value));
    });
  });
  const compactProcessVisibleEntries = compactProcessFilterActive ? compactProcessFilteredEntries : compactProcessEntries;
  const compactProcessVisibleKeySignature = compactProcessVisibleEntries.map((entry) => entry.key).join('|');
  const compactProcessSelectableVisibleKeys = compactProcessVisibleEntries
    .map((entry) => entry.key)
    .filter((key) => !disabledCompactProcessStepKeys.has(key));
  const compactProcessAllVisibleSelected =
    compactProcessSelectableVisibleKeys.length > 0 &&
    compactProcessSelectableVisibleKeys.every((key) => checkedCompactProcessStepKeys.has(key));
  const checkedCompactProcessStepKeyList = Array.from(checkedCompactProcessStepKeys);
  const compactProcessDeleteKeys =
    compactProcessBatchMode && checkedCompactProcessStepKeyList.length > 0
      ? checkedCompactProcessStepKeyList
      : selectedCompactProcessStepKey
        ? [selectedCompactProcessStepKey]
        : [];
  const compactProcessPartFilterOptions = useMemo(
    () =>
      leafParts
        .filter((part) => processSteps.some((step) => getProcessStepPartIds(step).includes(part.id)))
        .map((part) => ({ id: part.id, name: part.name })),
    [leafParts, processStepKeySignature]
  );
  const compactProcessWeldFeatureFilterOptions = useMemo(
    () =>
      weldFeatureItems
        .filter((feature) => processSteps.some((step) => getProcessStepFeatureIdsByFilterKind(step, 'weld-feature').includes(feature.id)))
        .map((feature) => ({ id: feature.id, name: feature.name })),
    [weldFeatureItems, processStepKeySignature]
  );
  const compactProcessGrindFeatureFilterOptions = useMemo(
    () =>
      grindFeatureItems
        .filter((feature) => processSteps.some((step) => getProcessStepFeatureIdsByFilterKind(step, 'grind-feature').includes(feature.id)))
        .map((feature) => ({ id: feature.id, name: feature.name })),
    [grindFeatureItems, processStepKeySignature]
  );
  const compactProcessDatumFeatureFilterOptions = useMemo(
    () =>
      datumFeatureItems
        .filter((feature) => processSteps.some((step) => getProcessStepFeatureIdsByFilterKind(step, 'datum-feature').includes(feature.id)))
        .map((feature) => ({ id: feature.id, name: feature.name })),
    [datumFeatureItems, processStepKeySignature]
  );
  const compactProcessTypeFilterOptions = useMemo(
    () => Array.from(new Set(processSteps.map((step) => getShortProcessStepTitle(step.type))))
      .map((typeName) => ({ id: typeName, name: typeName })),
    [processStepKeySignature]
  );
  const getCompactProcessFilterValueOptions = (kind: CompactProcessFilterKind) => {
    if (kind === 'part') return compactProcessPartFilterOptions;
    if (kind === 'type') return compactProcessTypeFilterOptions;
    if (kind === 'weld-feature') return compactProcessWeldFeatureFilterOptions;
    if (kind === 'grind-feature') return compactProcessGrindFeatureFilterOptions;
    return compactProcessDatumFeatureFilterOptions;
  };
  const autoSortEnabled = currentProject
    ? currentProject.processSteps.length > (initialProcessStepCounts[currentProject.id] ?? 0)
    : false;

  useEffect(() => {
    if (!coordinateTransformOpen) return;
    const validIds = new Set(leafParts.map((part) => part.id));
    const nextPartIds = coordinateTransformPartIds.filter((partId) => validIds.has(partId));
    if (nextPartIds.join('|') !== coordinateTransformPartSignature) {
      setCoordinateTransformPartIds(nextPartIds);
    }
    const selectedTargetIds = new Set(nextPartIds);
    const selectedSourceIds = coordinateTransformSelectedPivotPoint?.sourcePartIds ?? [coordinateTransformSelectedPivotPoint?.partId].filter(Boolean);
    if (coordinateTransformSelectedPivotPoint && !selectedSourceIds.every((partId) => selectedTargetIds.has(partId))) {
      setCoordinateTransformSelectedPivotPoint(null);
    }
    const overrideSourceIds = coordinateTransformPivotOverride?.sourcePartIds ?? [coordinateTransformPivotOverride?.partId].filter(Boolean);
    if (coordinateTransformPivotOverride && !overrideSourceIds.every((partId) => selectedTargetIds.has(partId))) {
      setCoordinateTransformPivotOverride(null);
    }
  }, [
    coordinateTransformOpen,
    coordinateTransformSelectableTargetSignature,
    coordinateTransformPartSignature,
    coordinateTransformPivotOverride,
    coordinateTransformSelectedPivotPoint,
  ]);

  useEffect(() => {
    if (!currentProject || processSteps.length === 0) {
      setSelectedCompactProcessStepKey(null);
      return;
    }
    const currentKeys = compactProcessVisibleEntries.map((entry) => entry.key);
    if (selectedCompactProcessStepKey && !currentKeys.includes(selectedCompactProcessStepKey)) {
      setSelectedCompactProcessStepKey(null);
    }
    if (isolatedCompactProcessStepKey && !currentKeys.includes(isolatedCompactProcessStepKey)) {
      setIsolatedCompactProcessStepKey(null);
    }
  }, [currentProject, processStepKeySignature, compactProcessVisibleKeySignature, selectedCompactProcessStepKey, isolatedCompactProcessStepKey]);

  useEffect(() => {
    if (!compactProcessBatchMode) {
      if (checkedCompactProcessStepKeys.size > 0) setCheckedCompactProcessStepKeys(new Set());
      return;
    }
    const visibleKeys = new Set(compactProcessVisibleEntries.map((entry) => entry.key));
    setCheckedCompactProcessStepKeys((prev) => {
      const next = new Set([...prev].filter((key) => visibleKeys.has(key)));
      return next.size === prev.size ? prev : next;
    });
  }, [compactProcessBatchMode, compactProcessVisibleKeySignature, checkedCompactProcessStepKeys.size]);

  useEffect(() => {
    setCompactProcessFilterValues((currentValues) => {
      const nextValues: Partial<Record<CompactProcessFilterKind, string[]>> = {};
      let changed = false;
      compactProcessFilterKinds.forEach((kind) => {
        const options = getCompactProcessFilterValueOptions(kind);
        const optionIds = new Set(options.map((item) => item.id));
        const currentKindValues = currentValues[kind] ?? [];
        const nextKindValues = currentKindValues.filter((value) => optionIds.has(value));
        if (nextKindValues.length === 0 && options[0]) nextKindValues.push(options[0].id);
        nextValues[kind] = nextKindValues;
        if (currentKindValues.length !== nextKindValues.length || currentKindValues.some((value, index) => value !== nextKindValues[index])) changed = true;
      });
      (Object.keys(currentValues) as CompactProcessFilterKind[]).forEach((kind) => {
        if (!compactProcessFilterKinds.includes(kind)) changed = true;
      });
      return changed ? nextValues : currentValues;
    });
  }, [
    compactProcessFilterKinds,
    compactProcessPartFilterOptions,
    compactProcessWeldFeatureFilterOptions,
    compactProcessGrindFeatureFilterOptions,
    compactProcessDatumFeatureFilterOptions,
    compactProcessTypeFilterOptions,
  ]);

  // 样式 C 中部分工序只展示一个详情面板，切换工序时同步校正当前详情。
  useEffect(() => {
    if (!selectedCompactProcessStepKey || !currentProject) return;
    const selectedEntry = processSteps
      .map((step, index) => ({ step, index, key: getProcessStepKey(step, index) }))
      .find((entry) => entry.key === selectedCompactProcessStepKey);
    const t = selectedEntry?.step.type;
    const nextTab = getCompactProcessEffectiveDetailTab(t, activeCompactProcessDetailTab);
    if (nextTab !== activeCompactProcessDetailTab) {
      setActiveCompactProcessDetailTab(nextTab);
    }
  }, [selectedCompactProcessStepKey, activeCompactProcessDetailTab, currentProject, processSteps, processStepKeySignature]);

  const openCoordinateTransformPanel = () => {
    closeExclusiveViewportToolPanels('coordinate');
    setCoordinateTransformOpen(true);
    const validIds = new Set(leafParts.map((part) => part.id));
    const preservedIds = coordinateTransformPartIds.filter((id) => validIds.has(id));
    const selectedPart = leafParts.find((part) => part.id === selectedId);
    const nextPartIds = preservedIds.length > 0 ? preservedIds : selectedPart ? [selectedPart.id] : [];
    setCoordinateTransformPartIds(nextPartIds);
  };
  const handleCoordinateTransformButtonClick = () => {
    if (coordinateTransformClickTimerRef.current) {
      window.clearTimeout(coordinateTransformClickTimerRef.current);
    }
    coordinateTransformClickTimerRef.current = window.setTimeout(() => {
      coordinateTransformClickTimerRef.current = null;
      openCoordinateTransformPanel();
    }, 220);
  };
  const applyCoordinateTransformGumballHack = () => {
    if (!currentProject || leafParts.length === 0) {
      showToast('请先进入装配体工艺规划', 'error');
      return;
    }
    if (coordinateTransformClickTimerRef.current) {
      window.clearTimeout(coordinateTransformClickTimerRef.current);
      coordinateTransformClickTimerRef.current = null;
    }
    resetCoordinateTransformPanelState();
    setGumballHackAssemblyIds((prev) => {
      const next = new Set(prev);
      next.add(currentProject.id);
      return next;
    });
    showToast('已为全部零件设置操作轴', 'success');
  };
  const updateCoordinateTransformOffset = (axis: keyof ProcessPosePoint, value: string) => {
    setCoordinateTransformOffset((prev) => ({ ...prev, [axis]: value }));
  };
  const applyCoordinateTransform = () => {
    if (!coordinateTransformPartIds.length) {
      showToast('请先选择零件对象', 'error');
      return;
    }
    const selectedPartNames = coordinateTransformPartIds
      .map((id) => leafParts.find((part) => part.id === id)?.name ?? id);
    showToast(`对[${selectedPartNames.join('、')}]应用了坐标转换`, 'success');
    resetCoordinateTransformPanelState();
  };
  const setCoordinateTransformPivotPoint = () => {
    if (!coordinateTransformPartIds.length) {
      showToast('请先选择零件对象', 'error');
      return;
    }
    if (!coordinateTransformSelectedPivotPoint) return;
    setCoordinateTransformPivotOverride(coordinateTransformSelectedPivotPoint);
    setCoordinateTransformSelectedPivotPoint(null);
    showToast(`已设为中心：${coordinateTransformSelectedPivotPoint.label}`, 'success');
  };
  const cancelCoordinateTransform = () => {
    resetCoordinateTransformPanelState();
  };

  const displayActionName = (action: string, board: string) => `${action}${board.replace(/ \/ /g, '+')}`;
  const middleEllipsis = (value: string, maxLength = 32) => {
    if (value.length <= maxLength) return value;
    const keepStart = Math.ceil((maxLength - 3) * 0.48);
    const keepEnd = Math.floor((maxLength - 3) * 0.52);
    return `${value.slice(0, keepStart)}...${value.slice(value.length - keepEnd)}`;
  };
  const markCurrentProcessPlanningDirty = () => {
    if (!currentProjectId) return;
    setProcessPlanningDirtyProjectIds((prev) => {
      const next = new Set(prev);
      next.add(currentProjectId);
      return next;
    });
  };
  const markProcessPointDirty = (stepId: string) => {
    const rootStepId = getRootProcessStepId(stepId);
    markCurrentProcessPlanningDirty();
    setProcessPointDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.add(rootStepId);
      return next;
    });
  };
  const clearProcessPointDirty = (stepId: string, message = '已应用点位位置更新') => {
    if (layoutVariant === 'immersive') {
      showToast(`${message}，请保存任务`, 'success');
      return;
    }
    const rootStepId = getRootProcessStepId(stepId);
    setProcessPointDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    showToast(message, 'success');
  };
  const markMagnetDirty = (stepId: string) => {
    const rootStepId = getRootProcessStepId(stepId);
    markCurrentProcessPlanningDirty();
    setMagnetDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.add(rootStepId);
      return next;
    });
  };
  const markGrindParameterDirty = (stepId: string) => {
    const rootStepId = getRootProcessStepId(stepId);
    markCurrentProcessPlanningDirty();
    setGrindParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.add(rootStepId);
      return next;
    });
  };
  const markAssembleParameterDirty = (stepId: string) => {
    const rootStepId = getRootProcessStepId(stepId);
    markCurrentProcessPlanningDirty();
    setAssembleParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.add(rootStepId);
      return next;
    });
  };
  const markWeldParameterDirty = (stepId: string) => {
    const rootStepId = getRootProcessStepId(stepId);
    markCurrentProcessPlanningDirty();
    setWeldParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.add(rootStepId);
      return next;
    });
  };
  const clearMagnetDirty = (stepId: string) => {
    if (layoutVariant === 'immersive') {
      showToast('已应用电磁铁位置更新，请保存任务', 'success');
      return;
    }
    const rootStepId = getRootProcessStepId(stepId);
    setMagnetDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    setProcessPointDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    showToast('已应用电磁铁位置更新', 'success');
  };
  const clearGrindParameterDirty = (stepId: string) => {
    if (layoutVariant === 'immersive') {
      showToast('已应用打磨参数更新，请保存任务', 'success');
      return;
    }
    const rootStepId = getRootProcessStepId(stepId);
    setGrindParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    showToast('已应用打磨参数更新', 'success');
  };
  const clearAssembleParameterDirty = (stepId: string) => {
    if (layoutVariant === 'immersive') {
      showToast('已应用装配参数更新，请保存任务', 'success');
      return;
    }
    const rootStepId = getRootProcessStepId(stepId);
    setAssembleParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    showToast('已应用装配参数更新', 'success');
  };
  const clearWeldParameterDirty = (stepId: string) => {
    if (layoutVariant === 'immersive') {
      showToast('已应用焊接参数更新，请保存任务', 'success');
      return;
    }
    const rootStepId = getRootProcessStepId(stepId);
    setWeldParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    showToast('已应用定位焊扫描参数更新', 'success');
  };
  const markFeatureDirty = (projectId: string) => {
    setProcessPlanningDirtyProjectIds((prev) => {
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
    setFeatureDirtyProjectIds((prev) => {
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
  };
  const clearFeatureDirty = (projectId: string) => {
    setFeatureDirtyProjectIds((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  };

  const saveCurrentProcessPlanning = () => {
    if (!currentProject) return;
    setProcessPlanningDirtyProjectIds((prev) => {
      const next = new Set(prev);
      next.delete(currentProject.id);
      return next;
    });
    clearFeatureDirty(currentProject.id);
    if (processParameterDirty) {
      processParameterSnapshotRef.current = null;
      setProcessParameterDirty(false);
      setProcessParameterDiscardConfirmOpen(false);
    }
    showToast(`${currentProject.tree.id} 工艺规划已保存`, 'success');
  };

  const updateProcessStepById = (stepId: string, updater: (step: ProcessStep) => ProcessStep) => {
    if (!currentProject) return;
    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? {
              ...project,
              processSteps: project.processSteps.map((step) => (step.id === stepId ? updater(step) : step)),
            }
          : project
      )
    );
  };

  const resetPickPathPoints = (stepId: string, combinedWeldMode?: CombinedWeldPathMode) => {
    markProcessPointDirty(stepId);
    updateProcessStepById(stepId, (currentStep) => {
      const resolvedCombinedWeldMode = combinedWeldMode ?? 'weld';
      const segmentCount = getProcessPathPointSegmentCount(currentStep, resolvedCombinedWeldMode);
      const nextGroups = Array.from({ length: segmentCount }, (_, segmentIndex) =>
        createDefaultGeneratedPathPoints(currentStep, segmentIndex, resolvedCombinedWeldMode)
      );
      if (currentStep.type === 'polish') {
        const nextPathPoints = createDefaultGeneratedPathPoints(currentStep);
        return {
          ...currentStep,
          grindConfig: {
            ...(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
            pathPoints: nextPathPoints,
            pathPointGroups: [nextPathPoints],
          },
        };
      }
      if (currentStep.type === 'weld' || currentStep.type === 'weld-scan') {
        return {
          ...currentStep,
          weldConfig: {
            ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
            pathPoints: nextGroups[0] ?? createDefaultGeneratedPathPoints(currentStep),
            pathPointGroups: nextGroups,
          },
        };
      }
      if (currentStep.type === 'weld-combined') {
        const configKey = resolvedCombinedWeldMode === 'scan' ? 'weldScanConfig' : 'weldConfig';
        return {
          ...currentStep,
          [configKey]: {
            ...(currentStep[configKey] ?? createEmptyFeatureProcessConfig()),
            pathPoints: nextGroups[0] ?? createDefaultGeneratedPathPoints(currentStep, 0, resolvedCombinedWeldMode),
            pathPointGroups: nextGroups,
          },
        };
      }
      if (currentStep.type === 'assemble') {
        return {
          ...currentStep,
          assembleConfig: {
            ...(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
            pathPoints: nextGroups[0] ?? createDefaultGeneratedPathPoints(currentStep),
            pathPointGroups: nextGroups,
          },
        };
      }
      return updateProcessPathPoints(currentStep, createDefaultGeneratedPathPoints(currentStep), 0);
    });
    showToast('已重置路径安全点', 'success');
  };

  const clearProcessDetailDirty = (stepId: string) => {
    const rootStepId = getRootProcessStepId(stepId);
    setProcessPointDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    setMagnetDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    setGrindParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    setAssembleParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
    setWeldParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      next.delete(rootStepId);
      return next;
    });
  };

  const saveProcessTask = (stepId: string) => {
    clearProcessDetailDirty(stepId);
    updateProcessStepById(stepId, (currentStep) => ({ ...currentStep, confirmed: true }));
    markCurrentProcessPlanningDirty();
    showToast('任务已保存，工艺规划项目仍待保存', 'success');
  };

  const resetCompactProcessStepToGeneratedDefaults = (stepId: string) => {
    const resetSourceStep = currentProject?.processSteps.find((step) => step.id === stepId);
    const nextPreviewType = resetSourceStep?.type as ProcessStepType | undefined;
    const resetGrindFeatureIds = resetSourceStep?.grindConfig?.featureIds ?? [];
    const resetGrindParams = cloneGrindProcessParams({
      ...createDefaultGrindProcessParams(),
      toolMode: grindToolMode,
      pathMergeEnabled: grindToolConfigs[grindToolMode]?.pathMergeEnabled ?? true,
    });
    if (resetSourceStep && (resetSourceStep.type === 'weld' || resetSourceStep.type === 'weld-scan' || resetSourceStep.type === 'weld-combined')) {
      const segmentCount = getProcessPathPointSegmentCount(resetSourceStep);
      setClampPointSegmentsByStepId((prev) => ({ ...prev, [stepId]: createDefaultClampPointSegments(segmentCount) }));
    }
    updateProcessStepById(stepId, (currentStep) => {
      if (currentStep.type === 'pick') {
        const currentConfig = currentStep.pickConfig ?? createEmptyPickProcessConfig();
        const nextConfig = recalculatePickConfig(
          {
            ...currentConfig,
            gripperType,
            magnetSettings: createDefaultPickMagnetSettings(gripperType),
            coverageOverride: '',
            safetyCoefficientOverride: '',
            eccentricThresholdOverride: '',
            magnetPosition: { x: '', y: '240.0', z: '96.0', rx: '0.0', ry: '0.0', rz: '0.0' },
            pathPoints: createDefaultGeneratedPathPoints(currentStep),
          },
          { updateMagnetPosition: false }
        );
        return {
          ...currentStep,
          pickConfig: nextConfig,
        };
      }
      if (currentStep.type === 'place') {
        const currentConfig = currentStep.placeConfig ?? createEmptyPlaceProcessConfig();
        const nextConfig = {
          ...currentConfig,
          workbenchType,
          supportIds: workbenchConfigs[workbenchType]?.supportIds ?? ['1', '2'],
          points: createGeneratedPlacePoints(),
          pathPoints: createDefaultGeneratedPathPoints(currentStep),
        };
        return {
          ...currentStep,
          placeConfig: {
            ...nextConfig,
            joints: createGeneratedPlaceJointRows(),
          },
        };
      }
      if (currentStep.type === 'turnover-clamp') {
        const currentConfig = currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig();
        const nextConfig = {
          ...currentConfig,
          workbenchType,
          clampIds: workbenchConfigs[workbenchType]?.clampIds ?? ['1', '2'],
        };
        return {
          ...currentStep,
          turnoverClampConfig: {
            ...nextConfig,
            joints: calculateClampJointRows(nextConfig),
          },
        };
      }
      if (currentStep.type === 'polish') {
        const nextPathPoints = createDefaultGeneratedPathPoints(currentStep);
        const nextPosePoints = createGeneratedGrindPosePoints();
        return {
          ...currentStep,
          grindConfig: {
            ...(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
            points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
            posePoints: nextPosePoints,
            pathPoints: nextPathPoints,
            pathPointGroups: [nextPathPoints],
            grindParams: cloneGrindProcessParams({
              ...createDefaultGrindProcessParams(),
              toolMode: grindToolMode,
              pathMergeEnabled: grindToolConfigs[grindToolMode]?.pathMergeEnabled ?? true,
            }),
          },
        };
      }
      if (currentStep.type === 'assemble') {
        const nextPathPointGroups = createPathPointGroups(compactAssemblePathPointPreviews.length, currentStep);
        const nextPosePoints = createGeneratedAssemblePosePoints();
        return {
          ...currentStep,
          assembleConfig: {
            ...(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
            points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
            posePoints: nextPosePoints,
            pathPoints: nextPathPointGroups[0] ?? createDefaultGeneratedPathPoints(currentStep),
            pathPointGroups: nextPathPointGroups,
            assembleParams: cloneAssembleProcessParams({
              ...createDefaultAssembleProcessParams(),
              scanDirection: assemblyScanDirection as AssembleProcessParams['scanDirection'],
              sampleShape: assemblySampleShape,
              lineSampleMode: assemblyLineSampleMode,
              arcSampleMode: assemblyArcSampleMode,
            }),
          },
        };
      }
      if (currentStep.type === 'weld-combined') {
        return {
          ...currentStep,
          ...createGeneratedCombinedWeldConfig(
            currentStep.weldConfig?.featureIds ?? currentStep.weldScanConfig?.featureIds ?? [],
            weldScanParams,
            weldParams
          ),
        };
      }
      if (currentStep.type === 'weld' || currentStep.type === 'weld-scan') {
        const nextPosePoints = createGeneratedWeldPosePoints(currentStep.type);
        const nextPathPointGroups = createPathPointGroups(
          currentStep.type === 'weld' ? compactWeldPathPointPreviews.length : compactWeldScanPathPointPreviews.length,
          currentStep
        );
        return {
          ...currentStep,
          weldConfig: {
            ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
            points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
            posePoints: nextPosePoints,
            pathPoints: nextPathPointGroups[0] ?? createDefaultGeneratedPathPoints(currentStep),
            pathPointGroups: nextPathPointGroups,
            weldParams: cloneWeldProcessParams(currentStep.type === 'weld-scan' ? weldScanParams : weldParams),
          },
        };
      }
      return currentStep;
    });
    if (nextPreviewType === 'polish' && resetSourceStep?.id && resetGrindFeatureIds.length > 0) {
      void hydrateGeneratedGrindSteps([{
        ...resetSourceStep,
        grindConfig: {
          ...(resetSourceStep.grindConfig ?? createEmptyFeatureProcessConfig()),
          featureIds: resetGrindFeatureIds,
          grindParams: resetGrindParams,
        },
      }]);
    }
    markProcessPointDirty(stepId);
    if (nextPreviewType === 'pick') setPickPreviewOverlayStepId(stepId);
    if (nextPreviewType === 'place') setPlacePreviewOverlayStepId(stepId);
    if (nextPreviewType === 'turnover-clamp') setClampPreviewOverlayStepId(stepId);
    if (nextPreviewType === 'polish') setGrindPreviewOverlayStepId(stepId);
    if (nextPreviewType === 'assemble') setAssemblePreviewOverlayStepId(stepId);
    if (nextPreviewType === 'weld' || nextPreviewType === 'weld-scan' || nextPreviewType === 'weld-combined') setWeldPreviewOverlayStepId(stepId);
    showToast('已重置，请保存任务', 'success');
  };

  const processStepMatchesKey = (step: ProcessStep, index: number, keys: Set<string>) => {
    const stepKey = getProcessStepKey(step, index);
    const rootStepId = getRootProcessStepId(step.id);
    return keys.has(stepKey) || (!!rootStepId && keys.has(rootStepId));
  };

  const deleteProcessSteps = (stepKeys: string[]) => {
    if (!currentProject || stepKeys.length === 0) return;
    markCurrentProcessPlanningDirty();
    const keySet = new Set<string>();
    stepKeys.forEach((key) => {
      keySet.add(key);
      const rootKey = getRootProcessStepId(key);
      if (rootKey) keySet.add(rootKey);
    });

    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? {
              ...project,
              processSteps: project.processSteps.filter((step, index) => !processStepMatchesKey(step, index, keySet)),
            }
          : project
      )
    );
    setExpandedProcessStepIds((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setProcessPointDirtyStepIds((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setMagnetDirtyStepIds((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setGrindParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setAssembleParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setWeldParameterDirtyStepIds((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setDisabledCompactProcessStepKeys((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next;
    });
    setCheckedCompactProcessStepKeys((prev) => {
      const next = new Set(prev);
      keySet.forEach((key) => next.delete(key));
      return next.size === prev.size ? prev : next;
    });
    setPickPathModal((prev) => (prev && keySet.has(getRootProcessStepId(prev.stepId) || prev.stepId) ? null : prev));
    setPickPathPosePreview((prev) => (prev && keySet.has(getRootProcessStepId(prev.stepId) || prev.stepId) ? null : prev));
    setSelectedResultPointPreview((prev) => (prev && keySet.has(getRootProcessStepId(prev.stepId) || prev.stepId) ? null : prev));
    setWeldSegmentPreview((prev) => (prev && keySet.has(getRootProcessStepId(prev.stepId) || prev.stepId) ? null : prev));
    setSelectedCompactProcessStepKey((currentKey) => (currentKey && keySet.has(currentKey) ? null : currentKey));
    setIsolatedCompactProcessStepKey((currentKey) => (currentKey && keySet.has(currentKey) ? null : currentKey));
    setProcessDeletePopoverKey(null);
    setProcessContextMenu(null);
    setDeleteConfirm(null);
    showToast('任务条目已删除', 'success');
  };

  const reorderProcessStep = (draggingKey: string, targetKey: string, position: 'before' | 'after') => {
    if (!currentProject || draggingKey === targetKey) return;
    const entries = currentProject.processSteps.map((step, index) => ({ step, key: getProcessStepKey(step, index), rootKey: getRootProcessStepId(step.id) }));
    if (layoutVariant === 'immersive' && selectedPlanningProcessId) {
      const scopedIndexes = entries
        .map((entry, index) => getPlanningProcessIdForTask(entry.step) === selectedPlanningProcessId ? index : -1)
        .filter((index) => index >= 0);
      const scopedEntries = scopedIndexes.map((index) => entries[index]);
      const fromScopedIndex = scopedEntries.findIndex((entry) => entry.key === draggingKey || (!!entry.rootKey && entry.rootKey === draggingKey));
      if (fromScopedIndex < 0) return;
      const [draggedEntry] = scopedEntries.splice(fromScopedIndex, 1);
      let targetScopedIndex = scopedEntries.findIndex((entry) => entry.key === targetKey || (!!entry.rootKey && entry.rootKey === targetKey));
      if (targetScopedIndex < 0) return;
      if (position === 'after') targetScopedIndex += 1;
      scopedEntries.splice(targetScopedIndex, 0, draggedEntry);
      const nextSteps = [...currentProject.processSteps];
      scopedIndexes.forEach((sourceIndex, scopedIndex) => {
        nextSteps[sourceIndex] = scopedEntries[scopedIndex].step;
      });
      setProjects((prev) => prev.map((project) => (
        project.id === currentProject.id ? { ...project, processSteps: nextSteps } : project
      )));
      markCurrentProcessPlanningDirty();
      showToast('已完成当前工序内的任务排序', 'success');
      return;
    }
    const fromIndex = entries.findIndex((entry) => entry.key === draggingKey || (!!entry.rootKey && entry.rootKey === draggingKey));
    if (fromIndex < 0) return;

    const nextEntries = [...entries];
    const [draggedEntry] = nextEntries.splice(fromIndex, 1);
    let targetIndex = nextEntries.findIndex((entry) => entry.key === targetKey || (!!entry.rootKey && entry.rootKey === targetKey));
    if (targetIndex < 0) return;
    if (position === 'after') targetIndex += 1;
    nextEntries.splice(targetIndex, 0, draggedEntry);
    const nextSteps = nextEntries.map((entry) => entry.step);
    const changed = nextSteps.some((step, index) => step !== currentProject.processSteps[index]);
    if (!changed) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id ? { ...project, processSteps: nextSteps } : project
      )
    );
    markCurrentProcessPlanningDirty();

    showToast('已完成对任务重新排序', 'success');
  };

  const restoreDefaultProcessStepOrder = () => {
    if (!currentProject || currentProject.processSteps.length === 0) return;
    const entries = currentProject.processSteps.map((step, index) => ({
      step,
      index,
      rank: step.id ? generatedProcessStepDefaultRank.get(step.id) : undefined,
    }));
    const nextSteps = [...entries]
      .sort((a, b) => {
        const rankA = a.rank ?? Number.POSITIVE_INFINITY;
        const rankB = b.rank ?? Number.POSITIVE_INFINITY;
        if (rankA !== rankB) return rankA - rankB;
        return a.index - b.index;
      })
      .map((entry) => entry.step);
    const changed = nextSteps.some((step, index) => step !== currentProject.processSteps[index]);

    setProcessSequenceDragState(null);
    processSequenceDragKeyRef.current = null;
    setProcessDeletePopoverKey(null);

    if (!changed) {
      showToast('任务列表已是默认排序', 'success');
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id ? { ...project, processSteps: nextSteps } : project
      )
    );
    markCurrentProcessPlanningDirty();
    showToast('已恢复任务列表默认排序', 'success');
  };

  const handleCompactProcessSplitDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setCompactProcessSplitDragging(true);
    const startY = event.clientY;
    const taskPane = event.currentTarget.previousElementSibling as HTMLElement | null;
    const startHeight = taskPane?.getBoundingClientRect().height ?? compactProcessTaskPaneHeight ?? 128;
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextHeight = Math.min(260, Math.max(72, startHeight + moveEvent.clientY - startY));
      setCompactProcessTaskPaneHeight(nextHeight);
    };

    const finishDragging = () => {
      setCompactProcessSplitDragging(false);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDragging);
      window.removeEventListener('pointercancel', finishDragging);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDragging);
    window.addEventListener('pointercancel', finishDragging);
  };

  const renderCompactProcessSetupPanel = () => {
    if (!currentProject || processSteps.length === 0) return null;
    if (compactProcessVisibleEntries.length === 0) {
      return (
        <div className="flex h-12 items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/45 px-3 text-center text-[11px] leading-5 text-slate-400">
          调整筛选条件后配置任务
        </div>
      );
    }
    if (!selectedCompactProcessStepKey) return null;
    const selectedEntry = compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey);
    if (!selectedEntry) return null;
    const { step } = selectedEntry;
    if (!step.id) return null;

    const hasInvalidPartSelection = (partIds: string[]) =>
      !!objectTree &&
      partIds.length > 1 &&
      partIds.some((partId, partIndex, ids) =>
        ids.slice(partIndex + 1).some((otherId) => !arePartsAdjacent(partId, otherId, objectTree))
      );
    const getPartNames = (ids: string[]) => ids.map((id) => leafParts.find((leafPart) => leafPart.id === id)?.name ?? id);

    let label = '工件模型选择';
    let items: { id: string; name: string }[] = leafParts;
    let selectedIds: string[] = [];
    let placeholder = '请选择工件模型';
    let actionLabel = '生成工序位置';
    let invalid = false;
    let emptyText = '';
    let onChange: (nextIds: string[]) => void = () => undefined;
    let onGenerate: () => void = () => undefined;

    if (step.type === 'pick') {
      const config = step.pickConfig ?? createEmptyPickProcessConfig();
      selectedIds = config.workpieceIds;
      invalid = hasInvalidPartSelection(config.workpieceIds);
      actionLabel = '生成抓取位置';
      onChange = (nextIds) =>
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          board: nextIds.length ? getPartNames(nextIds).join('+') : currentStep.board,
          pickConfig: {
            ...(currentStep.pickConfig ?? createEmptyPickProcessConfig()),
            workpieceIds: nextIds,
          },
        }));
      onGenerate = () => {
        if (!config.workpieceIds.length) {
          showToast('请先选择工件模型', 'error');
          return;
        }
        if (invalid) {
          showToast('所选工件不相接，请重新选择', 'error');
          return;
        }
        const nextPathPoints = [
          { x: '120.0', y: '80.0', z: '15.0', rx: '0.0', ry: '0.0', rz: '0.0' },
          { x: '240.0', y: '95.0', z: '15.0', rx: '0.0', ry: '0.0', rz: '0.0' },
          { x: '360.0', y: '110.0', z: '18.0', rx: '0.0', ry: '0.0', rz: '0.0' },
          { x: '480.0', y: '125.0', z: '18.0', rx: '0.0', ry: '0.0', rz: '0.0' },
          { x: '600.0', y: '140.0', z: '20.0', rx: '0.0', ry: '0.0', rz: '0.0' },
          { x: '720.0', y: '155.0', z: '20.0', rx: '0.0', ry: '0.0', rz: '0.0' },
        ];
        updateProcessStepById(step.id!, (currentStep) => {
          const nextPickConfig = {
            ...(currentStep.pickConfig ?? createEmptyPickProcessConfig()),
            magnetPosition: { x: '', y: '240.0', z: '96.0', rx: '0.0', ry: '0.0', rz: '0.0' },
            pathPoints: nextPathPoints,
          };
          return { ...currentStep, pickConfig: recalculatePickConfig(nextPickConfig) };
        });
        setPickPreviewOverlayStepId(step.id!);
        showToast('已生成抓取位置', 'success');
      };
    } else if (step.type === 'place') {
      const config = step.placeConfig ?? createEmptyPlaceProcessConfig();
      selectedIds = config.workpieceIds;
      invalid = hasInvalidPartSelection(config.workpieceIds);
      actionLabel = '生成支撑位置';
      onChange = (nextIds) =>
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          board: nextIds.length ? getPartNames(nextIds).join('+') : currentStep.board,
          placeConfig: {
            ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
            workpieceIds: nextIds,
          },
        }));
      onGenerate = () => {
        if (!config.workpieceIds.length) {
          showToast('请先选择工件模型', 'error');
          return;
        }
        if (invalid) {
          showToast('所选工件不相接，请重新选择', 'error');
          return;
        }
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          placeConfig: {
            ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
            points: [
              { x: '80.0', y: '40.0', z: '0.0' },
              { x: '220.0', y: '40.0', z: '0.0' },
              { x: '360.0', y: '40.0', z: '0.0' },
              { x: '80.0', y: '180.0', z: '0.0' },
              { x: '220.0', y: '180.0', z: '0.0' },
              { x: '360.0', y: '180.0', z: '0.0' },
            ],
            joints: ['120.00', '0.00', '18.20', '36.80', '72.40', '-44.60', '28.30', '91.20'],
          },
        }));
        setCollapsedPlacePointInfoIds((prev) => {
          const next = new Set(prev);
          next.delete(step.id!);
          return next;
        });
        setPlacePreviewOverlayStepId(step.id!);
        showToast('已生成支撑位置', 'success');
      };
    } else if (step.type === 'polish') {
      const config = step.grindConfig ?? createEmptyFeatureProcessConfig();
      label = '打磨特征选择';
      items = grindFeatureItems;
      selectedIds = config.featureIds;
      placeholder = '请选择打磨特征';
      actionLabel = '生成打磨路径';
      emptyText = '尚未提取打磨特征';
      onChange = (nextIds) =>
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          grindConfig: {
            ...(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
            featureIds: nextIds,
          },
        }));
      onGenerate = () => {
        if (grindFeatureItems.length === 0) {
          showToast('请先提取打磨特征', 'error');
          return;
        }
        if (!config.featureIds.length) {
          showToast('请先选择打磨特征', 'error');
          return;
        }
        const nextPoints = [
          { x: '110.0', y: '52.0', z: '10.0' },
          { x: '260.0', y: '52.0', z: '10.0' },
          { x: '410.0', y: '52.0', z: '10.0' },
          { x: '110.0', y: '168.0', z: '10.0' },
          { x: '260.0', y: '168.0', z: '10.0' },
          { x: '410.0', y: '168.0', z: '10.0' },
        ];
        const nextPosePoints = nextPoints.map((point) => ({ ...point, rx: '0.0', ry: '90.0', rz: '0.0' }));
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          grindConfig: {
            ...(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
            points: nextPoints,
            posePoints: nextPosePoints,
            pathPoints: createDefaultGeneratedPathPoints(currentStep),
            pathPointGroups: [createDefaultGeneratedPathPoints(currentStep)],
          },
        }));
        setCollapsedPickPointInfoIds((prev) => {
          const next = new Set(prev);
          next.delete(`${step.id!}-grind`);
          return next;
        });
        setGrindPreviewOverlayStepId(step.id!);
        showToast('已生成打磨路径', 'success');
      };
    } else if (step.type === 'assemble') {
      const config = step.assembleConfig ?? createEmptyFeatureProcessConfig();
      label = '装配基准特征';
      items = datumFeatureItems;
      selectedIds = config.featureIds;
      placeholder = '请选择装配基准特征';
      actionLabel = '生成定位路径';
      emptyText = '请先生成装配基准特征';
      onChange = (nextIds) =>
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          assembleConfig: {
            ...(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
            featureIds: nextIds,
          },
        }));
      onGenerate = () => {
        if (datumFeatureItems.length === 0) {
          showToast('请先生成装配基准特征', 'error');
          return;
        }
        if (!config.featureIds.length) {
          showToast('请先选择装配基准特征', 'error');
          return;
        }
        const nextPoints = [
          { x: '90.0', y: '60.0', z: '12.0' },
          { x: '210.0', y: '88.0', z: '12.0' },
          { x: '330.0', y: '116.0', z: '12.0' },
          { x: '450.0', y: '144.0', z: '12.0' },
          { x: '570.0', y: '172.0', z: '12.0' },
          { x: '690.0', y: '200.0', z: '12.0' },
        ];
        const nextPosePoints = nextPoints.map((point, pointIndex) => ({
          ...point,
          rx: '0.0',
          ry: pointIndex % 2 === 0 ? '85.0' : '88.0',
          rz: '0.0',
        }));
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          assembleConfig: {
            ...(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
            featureIds: config.featureIds,
            points: nextPoints,
            posePoints: nextPosePoints,
            assembleParams: cloneAssembleProcessParams((currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()).assembleParams),
          },
        }));
        setCollapsedPlacePointInfoIds((prev) => {
          const next = new Set(prev);
          next.delete(`${step.id!}-assemble-visual`);
          return next;
        });
        setAssemblePreviewOverlayStepId(step.id!);
        showToast('已生成定位路径', 'success');
      };
    } else if (step.type === 'turnover-clamp') {
      const config = step.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig();
      selectedIds = config.workpieceIds;
      invalid = hasInvalidPartSelection(config.workpieceIds);
      actionLabel = '生成压紧位置';
      onChange = (nextIds) =>
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          board: nextIds.length ? getPartNames(nextIds).join('+') : currentStep.board,
          turnoverClampConfig: {
            ...(currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig()),
            workpieceIds: nextIds,
          },
        }));
      onGenerate = () => {
        if (!config.workpieceIds.length) {
          showToast('请先选择工件模型', 'error');
          return;
        }
        if (invalid) {
          showToast('所选工件不相接，请重新选择', 'error');
          return;
        }
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          turnoverClampConfig: {
            ...(currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig()),
            joints: ['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30', '6.80', '91.20'],
          },
        }));
        setCollapsedClampPointInfoIds((prev) => {
          const next = new Set(prev);
          next.delete(step.id!);
          return next;
        });
        setClampPreviewOverlayStepId(step.id!);
        showToast('已生成压紧位置', 'success');
      };
    } else if (step.type === 'weld' || step.type === 'weld-scan') {
      const config = step.weldConfig ?? createEmptyFeatureProcessConfig();
      label = '焊缝特征选择';
      items = weldFeatureItems;
      selectedIds = config.featureIds;
      placeholder = '请选择焊缝特征';
      actionLabel = step.type === 'weld-scan' ? '生成定位焊扫描路径' : '生成定点焊接路径';
      emptyText = '尚未提取焊缝特征';
      onChange = (nextIds) =>
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          weldConfig: {
            ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
            featureIds: nextIds,
          },
        }));
      onGenerate = () => {
        if (weldFeatureItems.length === 0) {
          showToast('请先提取焊缝特征', 'error');
          return;
        }
        if (!config.featureIds.length) {
          showToast('请先选择焊缝特征', 'error');
          return;
        }
        const weldPathPoints = [
          { x: '100.0', y: '70.0', z: '8.0' },
          { x: '220.0', y: '90.0', z: '8.0' },
          { x: '340.0', y: '110.0', z: '8.0' },
          { x: '460.0', y: '130.0', z: '8.0' },
          { x: '580.0', y: '150.0', z: '8.0' },
          { x: '700.0', y: '170.0', z: '8.0' },
          { x: '820.0', y: '190.0', z: '8.0' },
          { x: '940.0', y: '210.0', z: '8.0' },
        ];
        const nextPoints = step.type === 'weld-scan' ? weldPathPoints.slice(0, 6) : weldPathPoints;
        const nextPosePoints = nextPoints.map((point, pointIndex) => ({
          ...point,
          rx: '0.0',
          ry: '0.0',
          rz: pointIndex % 2 === 0 ? '45.0' : '48.0',
        }));
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          weldConfig: {
            ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
            points: nextPoints,
            posePoints: nextPosePoints,
            pathPointGroups: step.type === 'weld-scan' ? createPathPointGroups(nextPoints.length) : createWeldPathPointGroups(),
          },
        }));
        setCollapsedPickPointInfoIds((prev) => {
          const next = new Set(prev);
          next.delete(`${step.id!}-weld`);
          return next;
        });
        setWeldPreviewOverlayStepId(step.id!);
        showToast(step.type === 'weld-scan' ? '已生成定位焊扫描路径' : '已生成定点焊接路径', 'success');
      };
    }

    return (
      <ProcessSelectionPanel
        className="p-2"
        variant={immersiveProjectLayout ? 'flush' : 'default'}
        label={label}
        items={items}
        selectedIds={selectedIds}
        placeholder={placeholder}
        actionLabel={actionLabel}
        invalid={invalid}
        emptyText={emptyText}
        onChange={onChange}
        onAction={onGenerate}
      />
    );
  };

  const renderCompactProcessPathPointToolbar = () => {
    if (!currentProject || processSteps.length === 0 || compactProcessVisibleEntries.length === 0 || !selectedCompactProcessStepKey) return null;
    const selectedEntry = compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey);
    if (!selectedEntry) return null;
    const selectedStep = selectedEntry.step;
    const activeDetailTab = getCompactProcessEffectiveDetailTab(selectedStep.type, activeCompactProcessDetailTab);
    if (activeDetailTab !== 'path-points') return null;
    // 焊接任务路径点位的展开/收起入口已并入焊缝段块标题，不再渲染工具栏
    if (selectedStep.type === 'weld' || selectedStep.type === 'weld-scan' || selectedStep.type === 'weld-combined') return null;
    const showPathPointConfig = getProcessCardUiSpec(selectedStep).showPathPanel;
    const allPathPointsCollapsed = compactPathPointCollapseSignal % 2 === 1;

    return (
      <ProcessPathPointModeToolbar
        value={compactPathCoordinateFrame}
        options={compactPathCoordinateFrameOptions}
        onChange={setCompactPathCoordinateFrame}
        showRadioGroup={false}
        action={showPathPointConfig ? (
          <div className="flex w-full shrink-0 items-center justify-end gap-1.5">
            <Tooltip title={allPathPointsCollapsed ? '全部展开' : '全部收起'}>
              <button
                type="button"
                aria-label={`${allPathPointsCollapsed ? '全部展开' : '全部收起'}路径点位`}
                className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-ds-brand-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-100"
                onClick={() => setCompactPathPointCollapseSignal((signal) => signal + 1)}
              >
                {allPathPointsCollapsed ? <ChevronsDown className="size-3.5" /> : <ChevronsUp className="size-3.5" />}
              </button>
            </Tooltip>
          </div>
        ) : null}
      />
    );
  };

  const handleCompactProcessDetailTabChange = (nextTab: CompactProcessDetailTab) => {
    setActiveCompactProcessDetailTab(nextTab);
    if (nextTab !== 'path-points') return;

    const selectedEntry = selectedCompactProcessStepKey
      ? compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey)
      : undefined;
    const selectedStep = selectedEntry?.step;
    if (selectedStep?.type !== 'polish' || !selectedStep.id) return;

    clearProcessPreviewOverlays();
    setPickPathPosePreview(null);
    setSelectedResultPointPreview(null);
    setGrindPreviewOverlayStepId(selectedStep.id);
  };

  // 焊接任务路径点位：焊缝段表格 + 选中段的 扫描路径 / 焊接路径 / 压紧配置
  const renderCompactWeldSegmentPathPoints = (step: ProcessStep) => {
    if (!step.id) return null;
    const isCombined = step.type === 'weld-combined';
    const segmentCount = getProcessPathPointSegmentCount(step);
    const activeSegmentIndex = Math.min(compactWeldSegmentIndex, segmentCount - 1);
    const weldResultsReady = step.weldConfig?.posePoints?.some((point) => point.x !== '') ?? false;
    const scanResultsReady = isCombined
      ? (step.weldScanConfig?.posePoints?.some((point) => point.x !== '') ?? false)
      : step.type === 'weld-scan'
        ? weldResultsReady
        : false;
    const weldPathReady = isCombined ? weldResultsReady : step.type === 'weld' ? weldResultsReady : false;
    const stepDirty = processPointDirtyStepIds.has(getRootProcessStepId(step.id));
    const clampSegments = getClampPointSegments(step.id, segmentCount);
    const allPathPointsCollapsed = compactPathPointCollapseSignal % 2 === 1;

    const getSegmentResultPoints = (view: 'scan' | 'weld') => {
      if (isCombined) {
        const config = view === 'scan' ? step.weldScanConfig : step.weldConfig;
        const previews = view === 'scan' ? compactWeldScanResultPointPreviews : compactCombinedWeldResultPointPreviews;
        const normalized = normalizeFeaturePosePoints(config?.points ?? [], config?.posePoints ?? []);
        const stored = normalized.slice(activeSegmentIndex * 2, activeSegmentIndex * 2 + 2);
        return stored.some((point) => point.x !== '') ? stored : previews[activeSegmentIndex] ?? previews[0];
      }
      if (step.type === 'weld-scan') {
        const normalized = normalizeFeaturePosePoints(step.weldConfig?.points ?? [], step.weldConfig?.posePoints ?? []);
        const stored = normalized.slice(activeSegmentIndex * 2, activeSegmentIndex * 2 + 2);
        return stored.some((point) => point.x !== '') ? stored : compactWeldScanResultPointPreviews[activeSegmentIndex] ?? compactWeldScanResultPointPreviews[0];
      }
      const normalized = normalizeWeldPosePoints(step.weldConfig?.posePoints ?? []);
      const stored = normalized.slice(activeSegmentIndex * 2, activeSegmentIndex * 2 + 2);
      return stored.some((point) => point.x !== '') ? stored : compactWeldResultPointPreviews[activeSegmentIndex] ?? compactWeldResultPointPreviews[0];
    };

    const renderSegmentPathView = (view: 'scan' | 'weld') => {
      const ready = view === 'scan' ? scanResultsReady : weldPathReady;
      if (!ready) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            该任务未生成{view === 'scan' ? '扫描' : '焊接'}路径。
          </div>
        );
      }
      const combinedMode = isCombined ? view : undefined;
      const groupItems = mergeSafeAndResultPathPoints(
        getProcessPathPoints(step, activeSegmentIndex, combinedMode ?? 'weld'),
        getSegmentResultPoints(view)
      );

      return (
        <div className="space-y-1.5">
          {groupItems.map((item, itemIndex) =>
            item.kind === 'safe' ? (
              <ProcessPosePointInfoRow
                key={`compact-weld-seg-${view}-safe-${activeSegmentIndex}-${item.sourceIndex}`}
                label={`${view === 'scan' ? '扫描点' : '焊接点'} ${item.sourceIndex + 1}`}
                point={getCompactCoordinateFramePoint(item.point, compactPathCoordinateFrame)}
                selected={
                  pickPathPosePreview?.stepId === step.id &&
                  pickPathPosePreview.source === 'safe' &&
                  pickPathPosePreview.combinedWeldMode === combinedMode &&
                  pickPathPosePreview.pointIndex === item.sourceIndex
                }
                selectedVariant="subtle"
                collapseSignal={compactPathPointCollapseSignal}
                hidePoseDivider
                expandedFirstRowExtraGap
                onSelect={() => showPickPathPosePreview(step.id!, item.sourceIndex as PickPathPosePointIndex, combinedMode)}
                onAxisChange={(axis, nextValue) =>
                  updatePickPathPoint(
                    step.id!,
                    activeSegmentIndex,
                    item.sourceIndex,
                    axis,
                    getPathPointStoredAxisValue(axis, nextValue, compactPathCoordinateFrame),
                    combinedMode
                  )
                }
              />
            ) : itemIndex === 0 || groupItems[itemIndex - 1]?.kind !== 'result' ? (
              <div key={`compact-weld-seg-${view}-results-${activeSegmentIndex}`} className="rounded-lg bg-zinc-200/45 p-1 ring-1 ring-inset ring-zinc-200/80">
                <div className="space-y-1">
                  {groupItems.filter((pathItem) => pathItem.kind === 'result').map((resultItem) => (
                    <ProcessPosePointInfoRow
                      key={`compact-weld-seg-${view}-result-${activeSegmentIndex}-${resultItem.sourceIndex}`}
                      label={`结果点 ${resultItem.sourceIndex + 1}`}
                      point={getCompactCoordinateFramePoint(toProcessPosePoint(resultItem.point), compactPathCoordinateFrame)}
                      selected={
                        selectedResultPointPreview?.stepId === step.id &&
                        selectedResultPointPreview.combinedWeldMode === combinedMode &&
                        selectedResultPointPreview.pointIndex === activeSegmentIndex * 2 + resultItem.sourceIndex
                      }
                      selectedVariant="subtle"
                      collapseSignal={compactPathPointCollapseSignal}
                      hidePoseDivider
                      expandedFirstRowExtraGap
                      onSelect={() => showResultPointPosePreview(step.id!, activeSegmentIndex * 2 + resultItem.sourceIndex, combinedMode)}
                      onAxisChange={(axis, nextValue) =>
                        updateProcessPosePointByIndex(
                          step.id!,
                          activeSegmentIndex * 2 + resultItem.sourceIndex,
                          axis,
                          nextValue,
                          combinedMode
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      );
    };

    const viewTabs = [
      { key: 'scan' as const, label: '扫描路径', ready: scanResultsReady },
      { key: 'weld' as const, label: '焊接路径', ready: weldPathReady },
      { key: 'clamp' as const, label: '压紧配置', ready: true },
    ];

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        <div className="rounded-lg bg-white p-1.5 ring-1 ring-slate-100">
          <div className="mb-1 flex items-center gap-1.5 px-1.5 pt-1 text-[11px] text-zinc-400">
            焊缝段（{segmentCount}）
            {stepDirty && <span className="size-1.5 rounded-full bg-ds-brand-primary" title="有未保存修改" />}
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-ds-bg-segmented p-1">
            {Array.from({ length: segmentCount }, (_, segmentIndex) => {
              const selected = segmentIndex === activeSegmentIndex;
              return (
                <button
                  key={`weld-segment-row-${segmentIndex}`}
                  type="button"
                  onClick={() => setCompactWeldSegmentIndex(segmentIndex)}
                  className={`h-7 truncate rounded-md px-2 text-[11px] font-medium transition-colors ${
                    selected
                      ? 'bg-white text-ds-brand-primary-text shadow-sm'
                      : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-700'
                  }`}
                >
                  焊缝段 {segmentIndex + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-800">焊缝段 {activeSegmentIndex + 1}</span>
            <div className="flex gap-0.5 rounded-lg bg-ds-bg-segmented p-0.5">
              {viewTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`h-7 rounded-md px-2.5 text-[11px] transition-colors ${
                    compactWeldSegmentView === tab.key
                      ? 'bg-white text-ds-brand-primary-text shadow-sm'
                      : 'text-zinc-500 hover:bg-white/70'
                  }`}
                  onClick={() => {
                    setCompactWeldSegmentView(tab.key);
                    if (tab.key === 'scan' || tab.key === 'weld') {
                      if (isCombined) setCompactCombinedWeldPathMode(tab.key);
                      setPickPathPosePreview(null);
                      setSelectedResultPointPreview(null);
                      setWeldSegmentPreview(null);
                    }
                  }}
                >
                  {tab.label}
                  {!tab.ready && tab.key !== 'clamp' ? ' ·未生成' : ''}
                </button>
              ))}
            </div>
            <Tooltip title={allPathPointsCollapsed ? '全部展开' : '全部收起'}>
              <button
                type="button"
                aria-label={`${allPathPointsCollapsed ? '全部展开' : '全部收起'}路径点位`}
                className="ml-auto flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-ds-brand-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-100"
                onClick={() => setCompactPathPointCollapseSignal((signal) => signal + 1)}
              >
                {allPathPointsCollapsed ? <ChevronsDown className="size-3.5" /> : <ChevronsUp className="size-3.5" />}
              </button>
            </Tooltip>
          </div>
          {compactWeldSegmentView === 'clamp' ? (
            <ClampPointConfigPanel
              segment={clampSegments[activeSegmentIndex]}
              onToggleEnabled={(enabled) => toggleClampPointSegmentEnabled(step.id!, segmentCount, activeSegmentIndex, enabled)}
              onJointChange={(jointIndex, value) => updateClampPointJoint(step.id!, segmentCount, activeSegmentIndex, jointIndex, value)}
            />
          ) : (
            renderSegmentPathView(compactWeldSegmentView)
          )}
        </div>
      </div>
    );
  };

  const renderCompactProcessDetailPanel = () => {
    if (!currentProject || processSteps.length === 0) return null;
    if (compactProcessVisibleEntries.length === 0) {
      return (
        <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
          当前筛选条件下没有任务详情
        </div>
      );
    }
    if (!selectedCompactProcessStepKey) {
      return (
        <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
          请选择任务查看和配置参数
        </div>
      );
    }
    const selectedEntry = compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey);
    if (!selectedEntry) {
      return (
        <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
          请选择任务查看和配置参数
        </div>
      );
    }
    const { step } = selectedEntry;
    if (!step.id) return null;
    const activeDetailTab = getCompactProcessEffectiveDetailTab(step.type, activeCompactProcessDetailTab);

    if (step.type === 'place' && step.placeConfig) {
      const placeConfig = step.placeConfig;
      const placeRootStepId = getRootProcessStepId(step.id) || step.id;
      const placeDirty = processPointDirtyStepIds.has(placeRootStepId);
      const placeHasResults = placeConfig.joints?.some((j) => j !== '') ?? false;

      if (activeDetailTab === 'path-points') {
        if (!placeHasResults) {
          return (
            <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
              点击"生成支撑位置"后，这里显示路径点位。
            </div>
          );
        }

        return (
          <div className="min-h-0 space-y-1.5 overflow-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400">3 安全点 / 8 结果点 / 3 安全点</span>
            </div>
            {((placeConfig.points ?? []).length > 0 ? placeConfig.points : compactPlaceSafePointPreviews).map((point, pointIndex) => (
              <div key={`compact-place-path-point-${pointIndex}`} className="space-y-1.5">
                <ProcessPointInfoRow
                  index={pointIndex}
                  point={getCompactCoordinateFramePoint(point, compactPathCoordinateFrame)}
                  onAxisChange={(axis, nextValue) =>
                    updatePickPathPoint(
                      step.id!,
                      0,
                      pointIndex,
                      axis,
                      getPathPointStoredAxisValue(axis, nextValue, compactPathCoordinateFrame)
                    )
                  }
                />
                {pointIndex === 2 && (
                  <div className="rounded-lg bg-zinc-200/45 p-1 ring-1 ring-inset ring-zinc-200/80">
                    <div className="text-[10px] font-medium text-slate-400 mb-1">结果点 J1-J8</div>
                    <div className="grid gap-1">
                      {(placeConfig.joints ?? []).map((jointValue, jointIndex) => (
                        <ProcessJointAngleRow
                          key={`compact-place-result-joint-${jointIndex}`}
                          index={jointIndex}
                          value={jointValue}
                          selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === jointIndex}
                          selectedVariant="subtle"
                          onSelect={() => step.id && showResultPointPosePreview(step.id, jointIndex)}
                          onChange={(nextValue) => {
                            markProcessPointDirty(step.id!);
                            updateProcessStepById(step.id!, (currentStep) => ({
                              ...currentStep,
                              placeConfig: {
                                ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
                                joints: (currentStep.placeConfig?.joints ?? []).map((v, i) =>
                                  i === jointIndex ? nextValue : v
                                ),
                              },
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }

      if (!placeHasResults) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            选择工件模型并点击"生成支撑位置"后，这里显示工艺参数。
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-ds-300">
          {renderPlaceSupportParameterControls(step.id, placeConfig, true)}
          <ProcessResultPointPanel
            title="结果点位"
            //subtitle="J1-J8"
            dirty={placeDirty}
            onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
            variant="flush"
            headerClassName="px-ds-150"
            showUpdateButton={false}
          >
            <div className="grid gap-2">
              {(placeConfig.joints ?? []).map((jointValue, jointIndex) => (
                <ProcessJointAngleRow
                  key={`compact-place-joint-${jointIndex}`}
                  index={jointIndex}
                  value={jointValue}
                  selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === jointIndex}
                  selectedVariant="subtle"
                  onSelect={() => step.id && showResultPointPosePreview(step.id, jointIndex)}
                  onChange={(nextValue) => {
                    markProcessPointDirty(step.id!);
                    updateProcessStepById(step.id!, (currentStep) => ({
                      ...currentStep,
                      placeConfig: {
                        ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
                        joints: (currentStep.placeConfig?.joints ?? []).map((v, i) =>
                          i === jointIndex ? nextValue : v
                        ),
                      },
                    }));
                  }}
                />
              ))}
            </div>
          </ProcessResultPointPanel>
        </div>
      );
    }

    if (step.type === 'turnover-clamp' && step.turnoverClampConfig) {
      const clampConfig = step.turnoverClampConfig;
      const clampRootStepId = getRootProcessStepId(step.id) || step.id;
      const clampDirty = processPointDirtyStepIds.has(clampRootStepId);
      const clampHasResults = clampConfig.joints?.some((j) => j !== '') ?? false;

      if (!clampHasResults) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            选择工件模型并点击"生成压紧位置"后，这里显示工艺参数。
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-ds-300">
          {renderClampParameterControls(step.id, clampConfig, true)}
          <ProcessResultPointPanel
            title="结果点位"
            //subtitle="J1-J8"
            dirty={clampDirty}
            onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
            variant="flush"
            headerClassName="px-ds-150"
            showUpdateButton={false}
          >
            <div className="grid gap-2">
              {(clampConfig.joints ?? []).map((jointValue, jointIndex) => (
                <ProcessJointAngleRow
                  key={`compact-clamp-joint-${jointIndex}`}
                  index={jointIndex}
                  value={jointValue}
                  selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === jointIndex}
                  selectedVariant="subtle"
                  onSelect={() => step.id && showResultPointPosePreview(step.id, jointIndex)}
                  onChange={(nextValue) => {
                    markProcessPointDirty(step.id!);
                    updateProcessStepById(step.id!, (currentStep) => ({
                      ...currentStep,
                      turnoverClampConfig: {
                        ...(currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig()),
                        joints: (currentStep.turnoverClampConfig?.joints ?? []).map((v, i) =>
                          i === jointIndex ? nextValue : v
                        ),
                      },
                    }));
                    setClampPreviewOverlayStepId(step.id!);
                  }}
                />
              ))}
            </div>
          </ProcessResultPointPanel>
        </div>
      );
    }

    if (step.type === 'polish' && step.grindConfig) {
      const grindConfig = step.grindConfig;
      const grindRootStepId = getRootProcessStepId(step.id) || step.id;
      const grindDirty = processPointDirtyStepIds.has(grindRootStepId) || grindParameterDirtyStepIds.has(grindRootStepId);
      const grindParams = cloneGrindProcessParams(grindConfig.grindParams);
      const selectedGrindPathPointIndex =
        pickPathPosePreview?.stepId === step.id && pickPathPosePreview.source === 'safe' ? pickPathPosePreview.pointIndex : null;
      const selectedGrindResultPointIndex =
        selectedResultPointPreview?.stepId === step.id ? selectedResultPointPreview.pointIndex : null;
      const updateCompactGrindConfig = (
        updater: (config: FeatureProcessConfig) => FeatureProcessConfig,
        options: { markPoint?: boolean; markParameter?: boolean; preview?: boolean } = {}
      ) => {
        if (options.markPoint) markProcessPointDirty(step.id!);
        if (options.markParameter) markGrindParameterDirty(step.id!);
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          grindConfig: updater(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
        }));
        if (options.preview) setGrindPreviewOverlayStepId(step.id!);
      };

      if (activeDetailTab === 'path-points') {
        const grindHasResults = grindConfig.points.length > 0 && grindConfig.points.some((p) => p.x !== '');
        const grindPathItems = mergeSafeAndResultPathPoints(
          getProcessPathPoints(step),
          normalizeFeaturePosePoints(grindConfig.points, grindConfig.posePoints).slice(0, 6)
        );

        if (!grindHasResults) {
          return (
            <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
              点击"生成打磨路径"后，这里显示路径点位。
            </div>
          );
        }

        return (
          <div className="space-y-1.5">
            {grindPathItems.map((item, itemIndex) =>
              item.kind === 'safe' ? (
                <ProcessPosePointInfoRow
                  key={`compact-grind-safe-${item.sourceIndex}`}
                  label={`点位 ${item.sourceIndex + 1}`}
                  point={getCompactCoordinateFramePoint(item.point, compactPathCoordinateFrame)}
                  selected={selectedGrindPathPointIndex === item.sourceIndex}
                  selectedVariant="subtle"
                  collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                  onSelect={() => step.id && showPickPathPosePreview(step.id, item.sourceIndex as PickPathPosePointIndex)}
                  onAxisChange={(axis, nextValue) =>
                    updatePickPathPoint(
                      step.id!,
                      0,
                      item.sourceIndex,
                      axis,
                      getPathPointStoredAxisValue(axis, nextValue, compactPathCoordinateFrame)
                    )
                  }
                />
              ) : itemIndex === 0 || grindPathItems[itemIndex - 1]?.kind !== 'result' ? (
                <div key="compact-grind-results" className="rounded-lg bg-zinc-200/45 p-1.5 ring-1 ring-inset ring-zinc-200/80 space-y-1">
                  {grindPathItems.filter((pathItem) => pathItem.kind === 'result').map((resultItem) => (
                    <ProcessPosePointInfoRow
                      key={`compact-grind-result-${resultItem.sourceIndex}`}
                      label={`点位 ${resultItem.sourceIndex + 1}`}
                      point={getCompactCoordinateFramePoint(toProcessPosePoint(resultItem.point), compactPathCoordinateFrame)}
                      selected={selectedGrindResultPointIndex === resultItem.sourceIndex}
                      selectedVariant="subtle"
                      collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                      onSelect={() => step.id && showResultPointPosePreview(step.id, resultItem.sourceIndex)}
                      onAxisChange={(axis, nextValue) => updateProcessPosePointByIndex(step.id!, resultItem.sourceIndex, axis, nextValue)}
                    />
                  ))}
                </div>
              ) : null
            )}
            {!grindPathItems.some((item) => item.kind === 'result') && (
              <div className="rounded-lg bg-zinc-200/45 p-1.5 ring-1 ring-inset ring-zinc-200/80 space-y-1">
                {compactGrindResultPointPreviews.map((point, pointIndex) => (
                  <ProcessPosePointInfoRow
                    key={`compact-grind-result-${pointIndex}`}
                    label={`点位 ${pointIndex + 1}`}
                    point={getCompactCoordinateFramePoint(point, compactPathCoordinateFrame)}
                    selected={selectedGrindResultPointIndex === pointIndex}
                    selectedVariant="subtle"
                    collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                    onSelect={() => step.id && showResultPointPosePreview(step.id, pointIndex)}
                    onAxisChange={(axis, nextValue) => updateProcessPosePointByIndex(step.id!, pointIndex, axis, nextValue)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }

      const paramCards = [
        {
          title: '打磨工具配置',
          body: (
            <div className="grid h-8 grid-cols-2 gap-1 rounded-lg bg-ds-bg-segmented p-0.5">
              {(['inhand', 'tohand'] as const).map((item) => {
                const selected = grindParams.toolMode === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${
                      selected ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                    }`}
                    onClick={() =>
                      updateCompactGrindConfig(
                        (currentConfig) => ({
                          ...currentConfig,
                          grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), toolMode: item },
                        }),
                        { markParameter: true }
                      )
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          ),
        },
        { title: '打磨宽度', body: <ProcessNumberField value={grindParams.width} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), width: nextValue } }), { markParameter: true })} /> },
        { title: '打磨速度', body: <ProcessNumberField value={grindParams.speed} unit="mm/s" inputClassName={processParameterInputSmWideUnitClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), speed: nextValue } }), { markParameter: true })} /> },
        { title: '打磨力', body: <ProcessNumberField value={grindParams.force} unit="N" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), force: nextValue } }), { markParameter: true })} /> },
        { title: '打磨转速', body: <ProcessNumberField value={grindParams.rpm} unit="/rpm" inputClassName={processParameterInputSmWideUnitClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), rpm: nextValue } }), { markParameter: true })} /> },
        { title: '轴角', body: <ProcessNumberField value={grindParams.axisAngle} unit="°" inputClassName={processParameterInputSmUnitClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), axisAngle: nextValue } }), { markParameter: true })} /> },
        { title: '摆动幅度', body: <ProcessNumberField value={grindParams.swingAmplitude} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), swingAmplitude: nextValue } }), { markParameter: true })} /> },
        { title: '预压高度', body: <ProcessNumberField value={grindParams.prePressureHeight} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), prePressureHeight: nextValue } }), { markParameter: true })} /> },
        { title: '递进预压高度', body: <ProcessNumberField value={grindParams.progressivePrePressureHeight} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), progressivePrePressureHeight: nextValue } }), { markParameter: true })} /> },
        { title: '安全点高度', body: <ProcessNumberField value={grindParams.safePointHeight} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), safePointHeight: nextValue } }), { markParameter: true })} /> },
        { title: '采样密度', body: <ProcessNumberField value={grindParams.samplingDensity} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactGrindConfig((currentConfig) => ({ ...currentConfig, grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), samplingDensity: nextValue } }), { markParameter: true })} /> },
      ];

      return (
        <div className="ds-task-parameter-detail-top px-ds-150 pb-2">
          <div className="grid gap-ds-150 sm:grid-cols-2">
            {paramCards.map((card) => (
              <div key={card.title} className="ds-label-input-compact">
                <div className="flex items-center justify-between gap-2">
                  <div className={compactProcessParameterNameClassName}>{card.title}</div>
                </div>
                {card.body}
              </div>
            ))}
          </div>

          <div className="py-ds-300">
            <div className="border-t border-slate-300/80" />
          </div>

          <div>
            <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
              <div className={`flex items-center gap-1.5 ${compactProcessParameterNameClassName}`}>
                <span>路径自动合并使能</span>
                <Tooltip title="当打磨路径可以合并时，开启后自动合并，合并条件：直线与直线夹角范围、直线与圆弧切线夹角范围、圆弧与圆弧切线夹角范围。">
                  <CircleAlert className="size-3.5 text-slate-300" />
                </Tooltip>
              </div>
              <ParameterSwitch
                checked={grindParams.pathMergeEnabled}
                ariaLabel="打磨路径自动合并使能"
                enabledLabel="启用"
                disabledLabel="关闭"
                size="sm"
                onChange={(checked) =>
                  updateCompactGrindConfig(
                    (currentConfig) => ({
                      ...currentConfig,
                      grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), pathMergeEnabled: checked },
                    }),
                    { markParameter: true }
                  )
                }
              />
            </div>
            <div className={`grid gap-ds-150 ${grindParams.pathMergeEnabled ? '' : 'opacity-60'}`}>
              {[
                ['直线与直线夹角范围', 'mergeLinearLinearAngleMin', 'mergeLinearLinearAngleMax'],
                ['直线与圆弧切线夹角范围', 'mergeLinearArcAngleMin', 'mergeLinearArcAngleMax'],
                ['圆弧与圆弧切线夹角范围', 'mergeArcArcAngleMin', 'mergeArcArcAngleMax'],
              ].map(([label, minKey, maxKey]) => {
                const minValue = grindParams[minKey as keyof GrindProcessParams] as string;
                const maxValue = grindParams[maxKey as keyof GrindProcessParams] as string;
                const warningText = grindParams.pathMergeEnabled ? getProcessNumberRangeWarning(minValue, maxValue) : '';
                const rangeInvalid = Boolean(warningText);
                return (
                  <div key={label} className="ds-label-input-compact">
                    <div className="flex min-h-6 items-center justify-between gap-2">
                      <div className={`min-w-0 truncate ${compactProcessParameterNameClassName}`}>{label}</div>
                      {warningText && (
                        <div className="shrink-0 whitespace-nowrap text-xs leading-4">
                          <ProcessRangeWarning>{warningText}</ProcessRangeWarning>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['最小值', minKey, minValue],
                        ['最大值', maxKey, maxValue],
                      ].map(([placeholder, key, currentValue]) => (
                        <ProcessNumberField
                          key={key}
                          value={currentValue}
                          unit="°"
                          inputClassName={processParameterInputSmUnitClassName}
                          placeholder={placeholder}
                          invalid={rangeInvalid}
                          disabled={!grindParams.pathMergeEnabled}
                          onChange={(nextValue) =>
                            updateCompactGrindConfig(
                              (currentConfig) => ({
                                ...currentConfig,
                                grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), [key]: nextValue } as GrindProcessParams,
                              }),
                              { markParameter: true }
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="py-ds-300">
            <div className="border-t border-slate-300/80" />
          </div>

          <div className="ds-label-input-compact">
            <div className={compactProcessParameterNameClassName}>双机协作安全距离</div>
            <div className="max-w-[240px]">
              <ProcessNumberField
                value={grindParams.dualMachineSafetyDistance}
                unit="mm"
                inputClassName={processParameterInputSmClassName}
                onChange={(nextValue) =>
                  updateCompactGrindConfig(
                    (currentConfig) => ({
                      ...currentConfig,
                      grindParams: { ...cloneGrindProcessParams(currentConfig.grindParams), dualMachineSafetyDistance: nextValue },
                    }),
                    { markParameter: true }
                  )
                }
              />
            </div>
          </div>

        </div>
      );
    }

    if (step.type === 'assemble' && step.assembleConfig) {
      const assembleConfig = step.assembleConfig;
      const assembleRootStepId = getRootProcessStepId(step.id) || step.id;
      const assembleDirty = processPointDirtyStepIds.has(assembleRootStepId);
      const assembleHasResults = assembleConfig.points?.some((p) => p.x !== '') ?? false;

      if (activeDetailTab === 'path-points') {
        if (!assembleHasResults) {
          return (
            <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
              点击"生成定位路径"后，这里显示路径点位。
            </div>
          );
        }

        return (
          <div className="min-h-0 space-y-2 overflow-auto">
            {compactAssemblePathPointPreviews.map((groupPoints, groupIndex) => {
              const collapsed = collapsedCompactAssembleGroupIndexes.has(groupIndex);
              const groupItems = mergeSafeAndResultPathPoints(
                groupIndex === 0 ? getProcessPathPoints(step) : groupPoints.map((point) => ({ ...point, rx: '0.0', ry: '0.0', rz: '0.0', enabled: true })),
                [toProcessPosePoint(assembleConfig.posePoints?.[groupIndex] ?? compactAssembleResultPointPreviews[groupIndex] ?? compactAssembleResultPointPreviews[0])]
              );
              const toggleGroupCollapsed = () => {
                setCollapsedCompactAssembleGroupIndexes((currentIndexes) => {
                  const nextIndexes = new Set(currentIndexes);
                  if (nextIndexes.has(groupIndex)) {
                    nextIndexes.delete(groupIndex);
                  } else {
                    nextIndexes.add(groupIndex);
                  }
                  return nextIndexes;
                });
              };

              return (
                <div key={`compact-assemble-group-${groupIndex}`} className="space-y-1.5">
                  <ProcessPathPointGroupHeader
                    title={`组 ${groupIndex + 1}`}
                    collapsed={collapsed}
                    onToggle={toggleGroupCollapsed}
                  />
                  {!collapsed && groupItems.map((item, itemIndex) =>
                    item.kind === 'safe' ? (
                      <ProcessPosePointInfoRow
                        key={`compact-assemble-safe-${groupIndex}-${item.sourceIndex}`}
                        label={`点位 ${item.sourceIndex + 1}`}
                        point={getCompactCoordinateFramePoint(item.point, compactPathCoordinateFrame)}
                        selected={pickPathPosePreview?.stepId === step.id && pickPathPosePreview.source === 'safe' && pickPathPosePreview.pointIndex === item.sourceIndex}
                        selectedVariant="subtle"
                        collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                        onSelect={() => step.id && showPickPathPosePreview(step.id, item.sourceIndex as PickPathPosePointIndex)}
                        onAxisChange={(axis, nextValue) =>
                          updatePickPathPoint(
                            step.id!,
                            groupIndex,
                            item.sourceIndex,
                            axis,
                            getPathPointStoredAxisValue(axis, nextValue, compactPathCoordinateFrame)
                          )
                        }
                      />
                    ) : itemIndex === 0 || groupItems[itemIndex - 1]?.kind !== 'result' ? (
                      <div key={`compact-assemble-results-${groupIndex}`} className="rounded-lg bg-zinc-200/45 p-1 ring-1 ring-inset ring-zinc-200/80">
                        {groupItems.filter((pathItem) => pathItem.kind === 'result').map((resultItem) => (
                          <ProcessPosePointInfoRow
                            key={`compact-assemble-result-${groupIndex}-${resultItem.sourceIndex}`}
                            label={`点位 ${resultItem.sourceIndex + 1}`}
                            point={getCompactCoordinateFramePoint(toProcessPosePoint(resultItem.point), compactPathCoordinateFrame)}
                            selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === groupIndex}
                            selectedVariant="subtle"
                            collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                            onSelect={() => step.id && showResultPointPosePreview(step.id, groupIndex)}
                            onAxisChange={(axis, nextValue) => updateProcessPosePointByIndex(step.id!, groupIndex, axis, nextValue)}
                          />
                        ))}
                      </div>
                    ) : null
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      if (!assembleHasResults) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            选择装配基准特征并点击"生成定位路径"后，这里显示工艺参数。
          </div>
        );
      }

      const assembleParams = cloneAssembleProcessParams(assembleConfig.assembleParams);
      const assembleParameterDirty = assembleParameterDirtyStepIds.has(assembleRootStepId);
      const updateCompactAssembleConfig = (
        updater: (config: FeatureProcessConfig) => FeatureProcessConfig,
        options: { markPoint?: boolean; markParameter?: boolean; preview?: boolean } = {}
      ) => {
        if (options.markPoint) markProcessPointDirty(step.id!);
        if (options.markParameter) markAssembleParameterDirty(step.id!);
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          assembleConfig: updater(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
        }));
      };

      const paramCards = [
        {
          title: '扫描距离',
          body: <ProcessNumberField value={assembleParams.scanDistance} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactAssembleConfig((currentConfig) => ({ ...currentConfig, assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), scanDistance: nextValue } }), { markParameter: true })} />,
        },
        {
          title: '扫描方向',
          body: (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              {(['逆时针', '顺时针'] as const).map((item) => {
                const selected = assembleParams.scanDirection === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    className={`h-9 rounded-md px-3 text-sm font-medium transition-colors ${
                      selected ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                    }`}
                    onClick={() =>
                      updateCompactAssembleConfig(
                        (currentConfig) => ({
                          ...currentConfig,
                          assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), scanDirection: item },
                        }),
                        { markParameter: true }
                      )
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          ),
        },
        {
          title: '粗定位保护阈值',
          body: <ProcessNumberField value={assembleParams.roughOffsetProtectThreshold} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactAssembleConfig((currentConfig) => ({ ...currentConfig, assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), roughOffsetProtectThreshold: nextValue } }), { markParameter: true })} />,
        },
        { title: '粗定位X偏移', body: <ProcessNumberField value={assembleParams.roughOffsetX} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactAssembleConfig((currentConfig) => ({ ...currentConfig, assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), roughOffsetX: nextValue } }), { markParameter: true })} /> },
        { title: '粗定位Y偏移', body: <ProcessNumberField value={assembleParams.roughOffsetY} unit="mm" inputClassName={processParameterInputSmClassName} onChange={(nextValue) => updateCompactAssembleConfig((currentConfig) => ({ ...currentConfig, assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), roughOffsetY: nextValue } }), { markParameter: true })} /> },
      ];

      return (
        <div className="ds-task-parameter-detail-top space-y-3 px-2 pb-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {paramCards.map((card) => (
              <div key={card.title} className="rounded-lg bg-white p-2.5 ring-1 ring-slate-100">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-slate-700">{card.title}</div>
                </div>
                {card.body}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-100">
            <div className="mb-2 text-xs font-medium text-slate-700">装配偏移</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['ΔX', assembleParams.offsetX, 'offsetX'],
                ['ΔY', assembleParams.offsetY, 'offsetY'],
                ['ΔZ', assembleParams.offsetZ, 'offsetZ'],
              ].map(([label, value, key]) => (
                <div key={label as string}>
                  <div className="mb-1 text-[11px] text-slate-400">{label as string}</div>
                  <ProcessNumberField
                    value={value as string}
                    unit="mm"
                    inputClassName={processParameterInputSmClassName}
                    onChange={(nextValue) =>
                      updateCompactAssembleConfig(
                        (currentConfig) => ({
                          ...currentConfig,
                          assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), [key as keyof AssembleProcessParams]: nextValue } as AssembleProcessParams,
                        }),
                        { markParameter: true }
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-100">
            <div className="mb-2 text-xs font-medium text-slate-700">姿态角</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['RX', assembleParams.poseRx, 'poseRx'],
                ['RY', assembleParams.poseRy, 'poseRy'],
                ['RZ', assembleParams.poseRz, 'poseRz'],
              ].map(([label, value, key]) => (
                <div key={label as string}>
                  <div className="mb-1 text-[11px] text-slate-400">{label as string}</div>
                  <ProcessNumberField
                    value={value as string}
                    unit="°"
                    inputClassName={processParameterInputSmUnitClassName}
                    onChange={(nextValue) =>
                      updateCompactAssembleConfig(
                        (currentConfig) => ({
                          ...currentConfig,
                          assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), [key as keyof AssembleProcessParams]: nextValue } as AssembleProcessParams,
                        }),
                        { markParameter: true }
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-100">
            <div className="mb-2 text-xs font-medium text-slate-700">采样设置</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[11px] text-slate-400">采样形状</div>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  {(['直线', '圆弧'] as const).map((item) => {
                    const selected = assembleParams.sampleShape === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={selected}
                        className={`h-9 rounded-md px-3 text-sm font-medium transition-colors ${
                          selected ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                        }`}
                        onClick={() =>
                          updateCompactAssembleConfig(
                            (currentConfig) => ({
                              ...currentConfig,
                              assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), sampleShape: item },
                            }),
                            { markParameter: true }
                          )
                        }
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11px] text-slate-400">
                  {assembleParams.sampleShape === '直线' ? '直线采样模式' : '圆弧采样模式'}
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  {(assembleParams.sampleShape === '直线'
                    ? (['距离', '数量'] as const)
                    : (['弦长', '数量'] as const)
                  ).map((item) => {
                    const currentMode = assembleParams.sampleShape === '直线' ? assembleParams.lineSampleMode : assembleParams.arcSampleMode;
                    const selected = currentMode === item;
                    const modeKey = assembleParams.sampleShape === '直线' ? 'lineSampleMode' : 'arcSampleMode';
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={selected}
                        className={`h-9 rounded-md px-3 text-sm font-medium transition-colors ${
                          selected ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                        }`}
                        onClick={() =>
                          updateCompactAssembleConfig(
                            (currentConfig) => ({
                              ...currentConfig,
                              assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), [modeKey]: item },
                            }),
                            { markParameter: true }
                          )
                        }
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-2 max-w-[200px]">
              <div className="mb-1 text-[11px] text-slate-400">采样值</div>
              <ProcessNumberField
                value={assembleParams.sampleValue}
                unit={assembleParams.sampleShape === '直线'
                  ? (assembleParams.lineSampleMode === '距离' ? 'mm' : '个')
                  : (assembleParams.arcSampleMode === '弦长' ? 'mm' : '个')}
                inputClassName={processParameterInputSmClassName}
                onChange={(nextValue) =>
                  updateCompactAssembleConfig(
                    (currentConfig) => ({
                      ...currentConfig,
                      assembleParams: { ...cloneAssembleProcessParams(currentConfig.assembleParams), sampleValue: nextValue },
                    }),
                    { markParameter: true }
                  )
                }
              />
            </div>
          </div>
        </div>
      );
    }

    if (step.type === 'weld-combined' && step.weldConfig && step.weldScanConfig) {
      const scanConfig = step.weldScanConfig;
      const weldingConfig = step.weldConfig;
      const scanParams = cloneWeldProcessParams(scanConfig.weldParams);
      const weldingParams = cloneWeldProcessParams(weldingConfig.weldParams);
      const scanHasResults = scanConfig.posePoints?.some((point) => point.x !== '') ?? false;
      const weldingHasResults = weldingConfig.posePoints?.some((point) => point.x !== '') ?? false;
      const updateCombinedWeldConfig = (
        mode: CombinedWeldPathMode,
        updater: (config: FeatureProcessConfig) => FeatureProcessConfig,
        options: { markPoint?: boolean; markParameter?: boolean } = {}
      ) => {
        if (options.markPoint) markProcessPointDirty(step.id!);
        if (options.markParameter) markWeldParameterDirty(step.id!);
        const configKey = mode === 'scan' ? 'weldScanConfig' : 'weldConfig';
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          [configKey]: updater(currentStep[configKey] ?? createEmptyFeatureProcessConfig()),
        }));
      };

      if (activeDetailTab === 'path-points') {
        return renderCompactWeldSegmentPathPoints(step);
      }

      if (!scanHasResults || !weldingHasResults) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            当前焊接任务尚未生成完整的扫描与焊接结果。
          </div>
        );
      }

      return (
        <div className="ds-task-parameter-detail-top flex flex-col gap-ds-300 px-ds-150 pb-2">
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 text-xs font-medium text-zinc-700">
              <ScanFace className="size-3.5 text-ds-brand-primary-text" />
              扫描参数
            </div>
            <div className="ds-parameter-group-stack">
              <div className="ds-label-input-compact">
                <div className={compactProcessParameterNameClassName}>扫描距离</div>
                <ProcessNumberField
                  value={scanParams.scanDistance}
                  unit="mm"
                  inputClassName={processParameterInputSmClassName}
                  onChange={(nextValue) => updateCombinedWeldConfig('scan', (currentConfig) => ({
                    ...currentConfig,
                    weldParams: { ...cloneWeldProcessParams(currentConfig.weldParams), scanDistance: nextValue },
                  }), { markParameter: true })}
                />
              </div>
              <div className="ds-label-input-compact">
                <div className={compactProcessParameterNameClassName}>扫描偏移（基于焊接起点）</div>
                <div className="grid gap-2 px-0.5 sm:grid-cols-3">
                  {[
                    ['ΔX', scanParams.scanOffsetX, 'scanOffsetX'],
                    ['ΔY', scanParams.scanOffsetY, 'scanOffsetY'],
                    ['ΔZ', scanParams.scanOffsetZ, 'scanOffsetZ'],
                  ].map(([label, value, key]) => (
                    <div key={label as string} className="ds-label-input-compact">
                      <div className={compactProcessParameterNameClassName}>{label as string}</div>
                      <ProcessNumberField
                        value={value as string}
                        unit="mm"
                        inputClassName={processParameterInputSmClassName}
                        onChange={(nextValue) => updateCombinedWeldConfig('scan', (currentConfig) => ({
                          ...currentConfig,
                          weldParams: {
                            ...cloneWeldProcessParams(currentConfig.weldParams),
                            [key as keyof WeldProcessParams]: nextValue,
                          } as WeldProcessParams,
                        }), { markParameter: true })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="ds-label-input-compact">
                <div className={compactProcessParameterNameClassName}>扫描姿态</div>
                <div className="grid gap-2 px-0.5 sm:grid-cols-3">
                  {[
                    ['Rx', scanParams.scanPoseRx, 'scanPoseRx'],
                    ['Ry', scanParams.scanPoseRy, 'scanPoseRy'],
                    ['Rz', scanParams.scanPoseRz, 'scanPoseRz'],
                  ].map(([label, value, key]) => (
                    <div key={label as string} className="ds-label-input-compact">
                      <div className={compactProcessParameterNameClassName}>{label as string}</div>
                      <ProcessNumberField
                        value={value as string}
                        unit="°"
                        inputClassName={processParameterInputSmUnitClassName}
                        onChange={(nextValue) => updateCombinedWeldConfig('scan', (currentConfig) => ({
                          ...currentConfig,
                          weldParams: {
                            ...cloneWeldProcessParams(currentConfig.weldParams),
                            [key as keyof WeldProcessParams]: nextValue,
                          } as WeldProcessParams,
                        }), { markParameter: true })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 text-xs font-medium text-zinc-700">
              <Hammer className="size-3.5 text-ds-brand-primary-text" />
              焊接参数
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="ds-label-input-compact">
                <div className={compactProcessParameterNameClassName}>焊脚高度</div>
                <ProcessNumberField
                  value={weldingParams.weldLegHeight}
                  unit="mm"
                  inputClassName={processParameterInputSmClassName}
                  onChange={(nextValue) => updateCombinedWeldConfig('weld', (currentConfig) => ({
                    ...currentConfig,
                    weldParams: { ...cloneWeldProcessParams(currentConfig.weldParams), weldLegHeight: nextValue },
                  }), { markParameter: true })}
                />
              </div>
            </div>
          </section>
        </div>
      );
    }

    if ((step.type === 'weld' || step.type === 'weld-scan') && step.weldConfig) {
      const weldConfig = step.weldConfig;
      const weldRootStepId = getRootProcessStepId(step.id) || step.id;
      const weldDirty = weldParameterDirtyStepIds.has(weldRootStepId);
      const weldParams = cloneWeldProcessParams(weldConfig.weldParams);
      const weldHasResults = weldConfig.posePoints?.some((p) => p.x !== '') ?? false;
      const compactWeldParameterContainerClassName = 'ds-task-parameter-detail-top space-y-3 px-ds-150 pb-2';
      const updateCompactWeldConfig = (
        updater: (config: FeatureProcessConfig) => FeatureProcessConfig,
        options: { markPoint?: boolean; markParameter?: boolean; preview?: boolean } = {}
      ) => {
        if (options.markPoint) markProcessPointDirty(step.id!);
        if (options.markParameter) markWeldParameterDirty(step.id!);
        updateProcessStepById(step.id!, (currentStep) => ({
          ...currentStep,
          weldConfig: updater(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
        }));
      };

      if (activeDetailTab === 'path-points') {
        return renderCompactWeldSegmentPathPoints(step);
      }

      if (!weldHasResults) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            {step.type === 'weld-scan'
              ? '选择焊缝特征并点击"生成定位焊扫描路径"后，这里显示工艺参数。'
              : '选择焊缝特征并点击"生成定点焊接路径"后，这里显示工艺参数。'}
          </div>
        );
      }

      return (
        <div className={compactWeldParameterContainerClassName}>
          {step.type === 'weld' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="ds-label-input-compact">
                <div className="flex items-center justify-between gap-2">
                  <div className={compactProcessParameterNameClassName}>焊脚高度</div>
                </div>
                <ProcessNumberField
                  value={weldParams.weldLegHeight}
                  unit="mm"
                  inputClassName={processParameterInputSmClassName}
                  onChange={(nextValue) =>
                    updateCompactWeldConfig(
                      (currentConfig) => ({
                        ...currentConfig,
                        weldParams: { ...cloneWeldProcessParams(currentConfig.weldParams), weldLegHeight: nextValue },
                      }),
                      { markParameter: true }
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="ds-parameter-group-stack">
                <div className="ds-label-input-compact">
                  <div className="flex items-center justify-between gap-2">
                    <div className={compactProcessParameterNameClassName}>扫描距离</div>
                  </div>
                  <ProcessNumberField
                    value={weldParams.scanDistance}
                    unit="mm"
                    inputClassName={processParameterInputSmClassName}
                    onChange={(nextValue) =>
                      updateCompactWeldConfig(
                        (currentConfig) => ({
                          ...currentConfig,
                          weldParams: { ...cloneWeldProcessParams(currentConfig.weldParams), scanDistance: nextValue },
                        }),
                        { markParameter: true }
                      )
                    }
                  />
                </div>
                <div className="ds-label-input-compact">
                  <div className={compactProcessParameterNameClassName}>扫描偏移（基于焊接起点）</div>
                  <div className="grid gap-2 px-0.5 sm:grid-cols-3">
                    {[
                      ['ΔX', weldParams.scanOffsetX, 'scanOffsetX'],
                      ['ΔY', weldParams.scanOffsetY, 'scanOffsetY'],
                      ['ΔZ', weldParams.scanOffsetZ, 'scanOffsetZ'],
                    ].map(([label, value, key]) => (
                      <div key={label as string} className="ds-label-input-compact">
                        <div className={compactProcessParameterNameClassName}>{label as string}</div>
                        <ProcessNumberField
                          value={value as string}
                          unit="mm"
                          inputClassName={processParameterInputSmClassName}
                          onChange={(nextValue) =>
                            updateCompactWeldConfig(
                              (currentConfig) => ({
                                ...currentConfig,
                                weldParams: { ...cloneWeldProcessParams(currentConfig.weldParams), [key as keyof WeldProcessParams]: nextValue } as WeldProcessParams,
                              }),
                              { markParameter: true }
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ds-label-input-compact">
                  <div className={compactProcessParameterNameClassName}>扫描姿态</div>
                  <div className="grid gap-2 px-0.5 sm:grid-cols-3">
                    {[
                      ['Rx', weldParams.scanPoseRx, 'scanPoseRx'],
                      ['Ry', weldParams.scanPoseRy, 'scanPoseRy'],
                      ['Rz', weldParams.scanPoseRz, 'scanPoseRz'],
                    ].map(([label, value, key]) => (
                      <div key={label as string} className="ds-label-input-compact">
                        <div className={compactProcessParameterNameClassName}>{label as string}</div>
                        <ProcessNumberField
                          value={value as string}
                          unit="°"
                          inputClassName={processParameterInputSmUnitClassName}
                          onChange={(nextValue) =>
                            updateCompactWeldConfig(
                              (currentConfig) => ({
                                ...currentConfig,
                                weldParams: { ...cloneWeldProcessParams(currentConfig.weldParams), [key as keyof WeldProcessParams]: nextValue } as WeldProcessParams,
                              }),
                              { markParameter: true }
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step.type !== 'pick' || !step.pickConfig) {
      return (
        <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-zinc-200/80 bg-white/40 px-3 text-center text-[11px] leading-5 text-zinc-400">
          当前任务的详情内容沿用原任务卡片结构，后续按工序逐步迁移。
        </div>
      );
    }

    const config = step.pickConfig;
    const rootStepId = getRootProcessStepId(step.id) || step.id;
    const isProcessPointDirty = processPointDirtyStepIds.has(rootStepId);
    const hasResults = !!config.actualCoverage || !!config.actualLoadCoefficient || !!config.actualEccentricDistance;
    const gripperConfig = getGripperConfigForType(config.gripperType);
    const pickCoverageThreshold = config.coverageOverride || gripperConfig.coverageThreshold;
    const pickSafetyThreshold = config.safetyCoefficientOverride || gripperConfig.safetyCoefficient;
    const pickEccentricThreshold = config.eccentricThresholdOverride || gripperConfig.eccentricThreshold;
    const pickCoverageSatisfied = !!config.actualCoverage && Number(config.actualCoverage) >= Number(pickCoverageThreshold);
    const pickSafetySatisfied = !!config.actualLoadCoefficient && Number(config.actualLoadCoefficient) <= Number(pickSafetyThreshold);
    const pickEccentricSatisfied = !!config.actualEccentricDistance && Number(config.actualEccentricDistance) <= Number(pickEccentricThreshold);

    if (activeDetailTab === 'path-points') {
      if (!hasResults) {
        return (
          <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
            点击“生成抓取位置”后，这里显示路径点位。
          </div>
        );
      }

      return (
        <div className="space-y-1.5">
          {mergeSafeAndResultPathPoints(getProcessPathPoints(step), [config.magnetPosition.x ? config.magnetPosition : compactResultPointPreview]).map((item, itemIndex, items) =>
            item.kind === 'safe' ? (
              <ProcessPosePointInfoRow
                key={`compact-path-safe-${item.sourceIndex}`}
                label={`点位 ${item.sourceIndex + 1}`}
                point={getCompactCoordinateFramePoint(item.point, compactPathCoordinateFrame)}
                selected={pickPathPosePreview?.stepId === step.id && pickPathPosePreview.source === 'safe' && pickPathPosePreview.pointIndex === item.sourceIndex}
                selectedVariant="subtle"
                collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                onSelect={() => step.id && showPickPathPosePreview(step.id, item.sourceIndex as PickPathPosePointIndex)}
                onAxisChange={(axis, nextValue) =>
                  updatePickPathPoint(
                    step.id!,
                    0,
                    item.sourceIndex,
                    axis,
                    getPathPointStoredAxisValue(axis, nextValue, compactPathCoordinateFrame)
                  )
                }
              />
            ) : itemIndex === 0 || items[itemIndex - 1]?.kind !== 'result' ? (
              <div key="compact-path-result" className="rounded-lg bg-zinc-200/45 p-1 ring-1 ring-inset ring-zinc-200/80">
                {items.filter((pathItem) => pathItem.kind === 'result').map((resultItem) => (
                  <ProcessPosePointInfoRow
                    key={`compact-path-result-${resultItem.sourceIndex}`}
                    label={`点位 ${resultItem.sourceIndex + 1}`}
                    point={getCompactCoordinateFramePoint(toProcessPosePoint(resultItem.point), compactPathCoordinateFrame)}
                    selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === resultItem.sourceIndex}
                    selectedVariant="subtle"
                    collapseSignal={compactPathPointCollapseSignal}
                  hidePoseDivider
                  expandedFirstRowExtraGap
                    onSelect={() => step.id && showResultPointPosePreview(step.id, resultItem.sourceIndex)}
                    onAxisChange={(axis, nextValue) => updateProcessPosePointByIndex(step.id!, resultItem.sourceIndex, axis, nextValue)}
                  />
                ))}
              </div>
            ) : null
          )}
        </div>
      );
    }

    if (!hasResults) {
      return (
        <div className="flex h-full items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/50 px-4 text-center text-xs leading-5 text-slate-400">
          选择抓取对象并点击“生成抓取位置”后，这里显示工艺参数。
        </div>
      );
    }

    const updateCompactPickConfig = (
      updater: (config: PickProcessConfig) => PickProcessConfig,
      options: { markMagnet?: boolean; markPoint?: boolean; preview?: boolean; updateMagnetPosition?: boolean } = {}
    ) => {
      updatePickConfigWithRecalculation(step.id!, updater, options);
    };
    const metricRows = [
      {
        label: '电磁铁覆盖率',
        threshold: `${pickCoverageThreshold}%`,
        result: config.actualCoverage ? `${config.actualCoverage}%` : '--',
        satisfied: pickCoverageSatisfied,
        failText: '低于阈值',
      },
      {
        label: '安全系数',
        threshold: pickSafetyThreshold,
        result: config.actualLoadCoefficient || '--',
        satisfied: pickSafetySatisfied,
        failText: '超出阈值',
      },
      {
        label: '偏心距',
        threshold: `${pickEccentricThreshold}mm`,
        result: config.actualEccentricDistance ? `${config.actualEccentricDistance}mm` : '--',
        satisfied: pickEccentricSatisfied,
        failText: '超出阈值',
      },
    ];

    return (
      <div className="ds-task-parameter-detail-top space-y-3 px-ds-150 pb-2">
        <div>
          <div className="ds-parameter-category-stack">
            <div className="ds-parameter-group-stack">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="ds-label-input-compact min-w-[160px]">
                  <div className="ds-label-input-compact-label">抓具类型</div>
                  <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
                    <span className="truncate">{config.gripperType}</span>
                  </div>
                </div>
              </div>
              {pickMagnetDefinitions.map((magnet) => {
                const magnetSetting = config.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings(config.gripperType)[magnet.name];
                const magnetDisabled = !magnetSetting.enabled;
                return (
                  <div key={magnet.name} className="ds-parameter-group">
                    <div className="flex min-h-6 items-center justify-between gap-3">
                      <div className={`truncate ${compactProcessParameterNameClassName}`}>{magnet.name}磁铁</div>
                      <CompactSwitch
                        checked={magnetSetting.enabled}
                        ariaLabel={`${magnet.name}磁铁启用状态`}
                        onChange={(checked) =>
                          updateCompactPickConfig(
                            (currentConfig) => ({
                              ...currentConfig,
                              magnetSettings: {
                                ...currentConfig.magnetSettings,
                                [magnet.name]: {
                                  ...(currentConfig.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings(currentConfig.gripperType)[magnet.name]),
                                  enabled: checked,
                                },
                              },
                            }),
                            { markMagnet: true, markPoint: true, preview: true }
                          )
                        }
                      />
                    </div>
                    <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 px-0.5 ${magnetDisabled ? 'opacity-70' : ''}`}>
                      <div className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-2">
                        <div className={compactProcessSubParameterNameClassName}>Z</div>
                        <ProcessNumberField
                          value={magnet.name === '中' ? '--' : magnetSetting.z}
                          unit="mm"
                          disabled={magnet.name === '中' || magnetDisabled}
                          invalid={false}
                          inputClassName="h-8 px-2 pr-8 text-left text-xs"
                          onChange={(nextValue) => {
                            if (magnet.name === '中') return;
                            updateCompactPickConfig(
                              (currentConfig) => ({
                                ...currentConfig,
                                magnetSettings: {
                                  ...currentConfig.magnetSettings,
                                  [magnet.name]: {
                                    ...(currentConfig.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings(currentConfig.gripperType)[magnet.name]),
                                    z: nextValue,
                                  },
                                },
                              }),
                              { markMagnet: true, markPoint: true, preview: true }
                            );
                          }}
                        />
                      </div>
                      <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <div className={compactProcessSubParameterNameClassName}>磁力档位</div>
                        <PickMagnetForceLevelSelect
                          value={magnetSetting.forceLevel}
                          disabled={magnetDisabled}
                          size="task"
                          onChange={(nextValue) =>
                            updateCompactPickConfig(
                              (currentConfig) => ({
                                ...currentConfig,
                                magnetSettings: {
                                  ...currentConfig.magnetSettings,
                                  [magnet.name]: {
                                    ...(currentConfig.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings(currentConfig.gripperType)[magnet.name]),
                                    forceLevel: nextValue,
                                  },
                                },
                              }),
                              { markMagnet: true, markPoint: true, preview: true }
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ds-parameter-group">
              {metricRows.map((row) => (
                <div key={row.label} className="flex min-h-8 items-center justify-between gap-3 rounded-lg bg-white/30 px-2.5 py-1.5 ring-1 ring-slate-200">
                  <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-12">
                    <div className="text-xs text-ds-text-parameter-label">{row.label}</div>
                    <div className="truncate text-xs font-medium text-slate-700">{row.result}</div>
                  </div>
                  <div className="shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${row.satisfied ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {row.satisfied ? '满足阈值' : `${row.failText} ${row.threshold}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleExtractWeldFeatures = () => {
    if (!currentProject) return;

    const definitions = getWeldFeatureDefinitions(currentProject.tree.id);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? { ...project, tree: appendFeatureNodes(project.tree, definitions) }
          : project
      )
    );
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      [
        currentProject.tree.id,
        `${currentProject.tree.id}-02`,
        `${currentProject.tree.id}-03`,
        `${currentProject.tree.id}-04`,
      ].forEach((id) => next.delete(id));
      return next;
    });
    setSelectedId(currentProject.tree.id);
    setAssemblyContextMenu(null);
    markFeatureDirty(currentProject.id);
    showToast('焊缝特征提取完成，已生成 3 条焊缝', 'success');
  };

  const hasCreatedWeldFeatures = () => weldFeatureItems.length > 0;

  const guardRequiresWeldFeatures = () => {
    if (hasCreatedWeldFeatures()) return true;
    showToast('请先创建焊缝特征', 'error');
    return false;
  };

  const handleExtractGrindFeatures = () => {
    if (!currentProject) return;
    if (!guardRequiresWeldFeatures()) return;

    const definitions = getGrindFeatureDefinitions(currentProject.tree.id);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? { ...project, tree: appendFeatureNodes(project.tree, definitions) }
          : project
      )
    );
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      [
        currentProject.tree.id,
        `${currentProject.tree.id}-01`,
        `${currentProject.tree.id}-02`,
        `${currentProject.tree.id}-03`,
        `${currentProject.tree.id}-04`,
      ].forEach((id) => next.delete(id));
      return next;
    });
    setSelectedId(currentProject.tree.id);
    markFeatureDirty(currentProject.id);
    showToast('打磨特征提取完成，已生成 5 条打磨线', 'success');
  };

  const createDatumDefinition = (
    baseId: string,
    partAId: string,
    partBId: string,
    edgeIds: string[],
  ): { definition: { parentId: string; node: TreeNode }; datum: NonNullable<Project['datums']>[number] } => {
    const partAName = findNodeById(currentProject!.tree, partAId)?.name ?? partAId;
    const partBName = findNodeById(currentProject!.tree, partBId)?.name ?? partBId;
    const datumName = getDatumFeatureDisplayName(partAId, partBId);
    const datumId = `${baseId}-${partAId}-${partBId}-datum`;
    const datumParentId =
      getPartSuffix(partAId) === '02'
        ? partAId
        : getPartSuffix(partBId) === '02'
          ? partBId
          : partBId;
    const edgeModelUrls = edgeIds.map((edgeId) => `${ASSET_BASE}models/datum-edges/${edgeId}.obj`);

    return {
      definition: {
        parentId: datumParentId,
        node: {
          id: datumId,
          name: datumName,
          nodeType: 'feature',
          featureType: 'datum',
          featureUrl: edgeModelUrls[0],
          relatedPartIds: [partAId, partBId],
          datumMeta: {
            partAId,
            partBId,
            edgeModelUrl: edgeModelUrls[0],
            edgeModelUrls,
          },
        },
      },
      datum: {
        id: datumId,
        name: datumName === '装配基准' ? `${partAName} / ${partBName} 装配基准` : datumName,
        partAId,
        partBId,
        edgeModelUrl: edgeModelUrls[0],
      },
    };
  };

  const createAllDatumItems = (baseId: string) => [
    createDatumDefinition(baseId, `${baseId}-01`, `${baseId}-02`, [
      '01-datum-edge-02',
      '02-datum-edge-01',
      '01-datum-edge-02-2',
      '02-datum-edge-01-2',
    ]),
    createDatumDefinition(baseId, `${baseId}-01`, `${baseId}-03`, [
      '01-datum-edge-03',
      '03-datum-edge-01',
      '01-datum-edge-03-2',
      '03-datum-edge-01-2',
    ]),
    createDatumDefinition(baseId, `${baseId}-03`, `${baseId}-04`, [
      '03-04-datum-edge',
      '04-datum-edge-03',
    ]),
  ];

  const handleCreateAllAssemblyDatums = () => {
    if (!currentProject) return;
    if (!guardRequiresWeldFeatures()) return;
    const baseId = currentProject.tree.id;
    const items = createAllDatumItems(baseId);
    const definitions = items.map((item) => item.definition);
    const datums = items.map((item) => item.datum);

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== currentProject.id) return project;
        const existingDatumIds = new Set((project.datums || []).map((datum) => datum.id));
        return {
          ...project,
          tree: appendFeatureNodes(project.tree, definitions),
          datums: [
            ...(project.datums || []),
            ...datums.filter((datum) => !existingDatumIds.has(datum.id)),
          ],
        };
      })
    );
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      [baseId, `${baseId}-02`, `${baseId}-03`, `${baseId}-04`].forEach((id) => next.delete(id));
      return next;
    });
    setAssemblyDatumModal(null);
    setSelectedId(baseId);
    markFeatureDirty(currentProject.id);
    showToast('装配基准特征已批量创建，可一键生成任务', 'success');
  };

  const openAssemblyDatumSelectionModal = () => {
    if (!guardRequiresWeldFeatures()) return;
    closeExclusiveViewportToolPanels('datum');
    setAssemblyDatumModal({
      open: true,
      minimized: false,
      partAId: null,
      partBId: null,
      partAFeatureId1: null,
      partAFeatureId2: null,
      partBFeatureId1: null,
      partBFeatureId2: null,
      selectedEdgeId: null,
      activeDatumPart: null,
      error: null,
    });
  };

  const resetAssemblyDatumSelection = () => {
    setAssemblyDatumModal((prev) =>
      prev
        ? {
            ...prev,
            partAId: null,
            partBId: null,
            partAFeatureId1: null,
            partAFeatureId2: null,
            partBFeatureId1: null,
            partBFeatureId2: null,
            selectedEdgeId: null,
            activeDatumPart: null,
            error: null,
          }
        : prev
    );
  };

  const handleOpenAssemblyDatumModal = () => {
    if (!guardRequiresWeldFeatures()) return;
    const now = Date.now();
    const isQuickSecondClick = now - assemblyDatumQuickClickRef.current < 1200;
    assemblyDatumQuickClickRef.current = now;

    if (assemblyDatumModal?.open || isQuickSecondClick) {
      handleCreateAllAssemblyDatums();
      return;
    }

    openAssemblyDatumSelectionModal();
  };

  const handleConfirmAssemblyDatum = () => {
    if (!currentProject || !assemblyDatumModal) return;
    if (!guardRequiresWeldFeatures()) return;
    const {
      partAId,
      partBId,
      partAFeatureId1,
      partAFeatureId2,
      partBFeatureId1,
      partBFeatureId2,
    } = assemblyDatumModal;
    const partA = findNodeById(currentProject.tree, partAId ?? '');
    const partB = findNodeById(currentProject.tree, partBId ?? '');
    const aName = partA?.name ?? partAId ?? '';
    const bName = partB?.name ?? partBId ?? '';

    const fail = (reason: string) => {
      showToast(`零件[${aName}]与零件[${bName}]装配基准设置失败：${reason}`, 'error');
      setAssemblyDatumModal((prev) => (prev ? { ...prev, error: reason } : prev));
    };

    if (!partAId || !partBId) {
      fail('定位基准无效，无法满足装配');
      return;
    }
    if (!arePartsAdjacent(partAId, partBId, currentProject.tree)) {
      fail('定位基准无效，无法满足装配');
      return;
    }
    if (!partAFeatureId1 || !partAFeatureId2 || !partBFeatureId1 || !partBFeatureId2) {
      fail('定位基准无效，无法满足装配');
      return;
    }

    const partAForNode = findNodeById(currentProject.tree, partAId);
    const partBForNode = findNodeById(currentProject.tree, partBId);
    const datumId = `${currentProject.tree.id}-${partAId}-${partBId}-datum`;
    const datumName = getDatumFeatureDisplayName(partAId, partBId);
    const datumParentId =
      getPartSuffix(partAId) === '02'
        ? partAId
        : getPartSuffix(partBId) === '02'
          ? partBId
          : partBId;
    const edgeModelUrls = [
      `${ASSET_BASE}models/datum-edges/${partAFeatureId1}.obj`,
      `${ASSET_BASE}models/datum-edges/${partBFeatureId1}.obj`,
      `${ASSET_BASE}models/datum-edges/${partAFeatureId2}.obj`,
      `${ASSET_BASE}models/datum-edges/${partBFeatureId2}.obj`,
    ];
    const featureDefinitions: { parentId: string; node: TreeNode }[] = [
      {
        parentId: datumParentId,
        node: {
          id: datumId,
          name: datumName,
          nodeType: 'feature',
          featureType: 'datum',
          featureUrl: edgeModelUrls[0],
          relatedPartIds: [partAId, partBId],
          datumMeta: {
            partAId,
            partBId,
            edgeModelUrl: edgeModelUrls[0],
            edgeModelUrls,
          },
        },
      },
    ];

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== currentProject.id) return project;
        const newTree = appendFeatureNodes(project.tree, featureDefinitions);
        const newDatums = [
          ...(project.datums || []),
          {
            id: datumId,
            name: datumName === '装配基准' ? `${partAForNode?.name ?? partAId} / ${partBForNode?.name ?? partBId} 装配基准` : datumName,
            partAId,
            partBId,
            edgeModelUrl: edgeModelUrls[0],
          },
        ];
        return { ...project, tree: newTree, datums: newDatums };
      })
    );

    showToast(
      `零件[${partAForNode?.name ?? partAId}]与零件[${partBForNode?.name ?? partBId}]装配基准设置成功`,
      'success'
    );
    markFeatureDirty(currentProject.id);
    setAssemblyDatumModal(null);
  };

  const handleDatumEdgeClick = (edgeId: string) => {
    setAssemblyDatumModal((prev) =>
      prev ? { ...prev, selectedEdgeId: edgeId, error: null } : prev
    );
  };

  const handleAssignDatumFeature = (partKey: 'A' | 'B', slot: 1 | 2) => {
    setAssemblyDatumModal((prev) => {
      if (!prev) return prev;
      const { partAId, partBId, selectedEdgeId } = prev;
      const stepKey = `${partKey}${slot}` as AssemblyDatumStepKey;
      const stepMeta = assemblyDatumStepMeta[stepKey];
      const tree = currentProject?.tree ?? objectTree;
      if (!tree || !partAId || !partBId || !arePartsAdjacent(partAId, partBId, tree)) {
        return { ...prev, activeDatumPart: stepKey, error: '请选择相接的子板和父板' };
      }
      if (!selectedEdgeId) {
        return { ...prev, activeDatumPart: stepKey, error: '请在 3D 视窗中点击蓝色棱边' };
      }
      const expectedPartId = partKey === 'A' ? partAId : partBId;
      if (getDatumEdgeOwnerSuffix(selectedEdgeId) !== getPartSuffix(expectedPartId)) {
        return { ...prev, activeDatumPart: stepKey, error: `请选择${stepMeta.partLabel}对应的装配基准线` };
      }
      if (partKey === 'B') {
        const pairedFeature = slot === 1 ? prev.partAFeatureId1 : prev.partAFeatureId2;
        if (!pairedFeature) {
          return { ...prev, activeDatumPart: stepKey, error: `请先设置子板的装配基准${slot}` };
        }
      }
      const nextState = {
        ...prev,
        partAFeatureId1: partKey === 'A' && slot === 1 ? selectedEdgeId : prev.partAFeatureId1,
        partAFeatureId2: partKey === 'A' && slot === 2 ? selectedEdgeId : prev.partAFeatureId2,
        partBFeatureId1: partKey === 'B' && slot === 1 ? selectedEdgeId : prev.partBFeatureId1,
        partBFeatureId2: partKey === 'B' && slot === 2 ? selectedEdgeId : prev.partBFeatureId2,
        selectedEdgeId: null,
        error: null,
      };
      return {
        ...nextState,
        activeDatumPart: getNextAssemblyDatumStep(nextState),
      };
    });
  };

  const resetManualFeatureSelection = () => {
    setManualFeaturePartAId(null);
    setManualFeaturePartBId(null);
    setManualFeatureCandidateId(null);
    setManualGrindWeldFeatureId(null);
    setManualWeldSelectedFaceIds([]);
    setManualWeldFaceMap({});
    setManualWeldCandidates([]);
    setManualWeldFaceSelectionActive(false);
    setManualWeldGenerated(false);
    setManualFeatureError(null);
  };

  const resetManualFeatureCandidate = () => {
    setManualFeatureCandidateId(null);
    setManualGrindWeldFeatureId(null);
    setManualWeldSelectedFaceIds([]);
    setManualWeldFaceMap({});
    setManualWeldCandidates([]);
    setManualWeldFaceSelectionActive(false);
    setManualWeldGenerated(false);
    setManualFeatureError(null);
  };

  const startManualWeldFaceSelection = () => {
    if (!objectTree || !manualFeaturePartAId || !manualFeaturePartBId) {
      setManualFeatureError('请先选择两个相接零件');
      return;
    }
    if (!arePartsAdjacent(manualFeaturePartAId, manualFeaturePartBId, objectTree)) {
      setManualFeatureError('所选零件不相接，请重新选择');
      return;
    }
    setManualWeldSelectedFaceIds([]);
    setManualWeldFaceMap({});
    setManualWeldCandidates([]);
    setManualFeatureCandidateId(null);
    setManualWeldGenerated(false);
    setManualWeldFaceSelectionActive(true);
    setManualFeatureError(null);
  };

  const selectManualWeldFace = (faceId: string, additive = false) => {
    setManualWeldSelectedFaceIds((prev) => {
      const selected = prev.includes(faceId);
      if (selected && additive) return prev.filter((item) => item !== faceId);
      if (selected) return prev;
      return [...prev, faceId];
    });
    setManualFeatureCandidateId(null);
    setManualWeldGenerated(false);
    setManualWeldCandidates([]);
    setManualFeatureError(null);
  };

  const handleSelectableFacesReady = useCallback((partId: string, faces: SelectableFaceGeometry[]) => {
    setManualWeldFaceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((faceId) => {
        if (next[faceId].partId === partId) delete next[faceId];
      });
      faces.forEach((face) => {
        next[face.id] = face;
      });
      return next;
    });
  }, []);

  const generateManualWeldFromFaces = () => {
    if (!manualWeldFaceSelectionActive) {
      setManualFeatureError('请先点击选择面');
      return;
    }
    if (manualWeldSelectedFaceIds.length < 2) {
      setManualFeatureError('请在 3D 视窗中至少选择两个面');
      return;
    }
    const selectedFaces = manualWeldSelectedFaceIds
      .map((faceId) => manualWeldFaceMap[faceId])
      .filter((face): face is SelectableFaceGeometry => Boolean(face));
    const candidates = computeManualWeldCandidatesFromFaces(selectedFaces);
    if (candidates.length === 0) {
      setManualFeatureCandidateId(null);
      setManualWeldCandidates([]);
      setManualWeldGenerated(false);
      setManualFeatureError('所选的面不相交');
      showToast('生成失败，所选的面不相交', 'error');
      return;
    }
    setManualFeatureCandidateId(null);
    setManualWeldCandidates(candidates);
    setManualWeldGenerated(true);
    setManualWeldFaceSelectionActive(false);
    setManualFeatureError(null);
    showToast('生成成功', 'success');
  };

  const selectManualWeldSegment = (segmentId: string) => {
    setManualFeatureCandidateId(segmentId);
    setManualFeatureError(null);
  };

  const selectManualGrindWeldFeature = (featureId: string | null) => {
    setManualGrindWeldFeatureId(featureId);
    setManualFeatureCandidateId(featureId);
    setManualFeatureError(null);
    if (!featureId || !objectTree) {
      setManualFeaturePartAId(null);
      setManualFeaturePartBId(null);
      return;
    }
    const weldFeature = findNodeById(objectTree, featureId);
    const relatedPartIds = weldFeature?.relatedPartIds ?? [];
    setManualFeaturePartAId(relatedPartIds[0] ?? null);
    setManualFeaturePartBId(relatedPartIds[1] ?? null);
  };

  const createManualWeldHack0102 = () => {
    if (!currentProject) return;
    const baseId = currentProject.tree.id;
    const partAId = `${baseId}-01`;
    const partBId = `${baseId}-02`;
    const featureId = `${baseId}-weld-manual-01-02-hack`;
    const definition = {
      parentId: partBId,
      node: {
        id: featureId,
        name: '01-02 手动焊缝',
        nodeType: 'feature' as const,
        featureType: 'weld' as const,
        featureUrl: `${ASSET_BASE}models/intersections/front-intersection.obj`,
        relatedPartIds: [partAId, partBId],
      },
    };

    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? { ...project, tree: appendFeatureNodes(project.tree, [definition]) }
          : project
      )
    );
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      [baseId, partAId, partBId].forEach((id) => next.delete(id));
      return next;
    });
    setSelectedId(featureId);
    setAssemblyContextMenu(null);
    markFeatureDirty(currentProject.id);
    showToast('已创建 01-02 手动焊缝', 'success');
  };

  const openManualFeatureExtraction = (type: ManualFeatureExtractionTab) => {
    if (type === 'grind' && !guardRequiresWeldFeatures()) return;
    if (type === 'weld') {
      const now = Date.now();
      const isQuickSecondClick = now - manualWeldQuickClickRef.current < 1200;
      manualWeldQuickClickRef.current = now;
      if (isQuickSecondClick) {
        createManualWeldHack0102();
        closeExclusiveViewportToolPanels();
        return;
      }
    }
    closeExclusiveViewportToolPanels('manual');
    setOpenManualFeaturePanels([type]);
    setMinimizedManualFeaturePanels([]);
    setManualFeatureExtractionOpen(true);
    setActiveManualFeatureTab(type);
    resetManualFeatureSelection();
  };

  const handleCreateWeldFeatureFromContext = () => {
    setAssemblyContextMenu(null);
    openManualFeatureExtraction('weld');
  };

  const handleCreateGrindFeatureFromContext = () => {
    if (!hasCreatedWeldFeatures()) {
      setAssemblyContextMenu(null);
      showToast('请先创建焊缝特征', 'error');
      return;
    }
    setAssemblyContextMenu(null);
    openManualFeatureExtraction('grind');
  };

  const handleCreateDatumFeatureFromContext = () => {
    if (!hasCreatedWeldFeatures()) {
      setAssemblyContextMenu(null);
      showToast('请先创建焊缝特征', 'error');
      return;
    }
    setAssemblyContextMenu(null);
    handleOpenAssemblyDatumModal();
  };

  const toggleManualFeaturePanelMinimized = (type: ManualFeatureExtractionTab) => {
    setMinimizedManualFeaturePanels((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const closeManualFeatureExtraction = (type: ManualFeatureExtractionTab) => {
    setMinimizedManualFeaturePanels((prev) => prev.filter((item) => item !== type));
    setOpenManualFeaturePanels((prev) => {
      const next = prev.filter((item) => item !== type);
      if (next.length === 0) {
        setManualFeatureExtractionOpen(false);
      }
      if (activeManualFeatureTab === type) {
        setActiveManualFeatureTab(next[0] ?? 'weld');
        resetManualFeatureSelection();
      }
      return next;
    });
  };

  const getManualFeatureUrl = (type: ManualFeatureExtractionTab, partAId: string, partBId: string) => {
    const pairKey = [getPartSuffix(partAId), getPartSuffix(partBId)].sort().join('-');
    if (type === 'weld') {
      return {
        '01-02': `${ASSET_BASE}models/intersections/front-intersection.obj`,
        '01-03': `${ASSET_BASE}models/intersections/back-intersection-1.obj`,
        '03-04': `${ASSET_BASE}models/intersections/back-intersection-2.obj`,
      }[pairKey] ?? `${ASSET_BASE}models/intersections/front-intersection.obj`;
    }
    return {
      '01-02': `${ASSET_BASE}models/features/02-grind-face.obj`,
      '01-03': `${ASSET_BASE}models/features/03-grind-face-1.obj`,
      '03-04': `${ASSET_BASE}models/features/03-grind-face-2.obj`,
    }[pairKey] ?? `${ASSET_BASE}models/features/02-grind-face.obj`;
  };

  const getManualFeatureParentId = (partAId: string, partBId: string) => {
    const suffixA = getPartSuffix(partAId);
    const suffixB = getPartSuffix(partBId);
    if (suffixA === '01') return partBId;
    if (suffixB === '01') return partAId;
    return partAId;
  };

  const confirmManualFeatureExtraction = () => {
    if (!currentProject || !objectTree) return;
    if (activeManualFeatureTab === 'grind' && !guardRequiresWeldFeatures()) return;
    if (activeManualFeatureTab === 'grind') {
      if (!manualGrindWeldFeatureId) {
        setManualFeatureError('请先选择焊缝特征');
        return;
      }
      if (!manualFeaturePartAId || !manualFeaturePartBId) {
        setManualFeatureError('请指配两个相接零件');
        return;
      }
      if (!arePartsAdjacent(manualFeaturePartAId, manualFeaturePartBId, objectTree)) {
        setManualFeatureError('所选零件不相接，请重新选择');
        return;
      }
      const weldFeature = findNodeById(objectTree, manualGrindWeldFeatureId);
      const weldName = weldFeature?.name ?? '焊缝';
      const partAName = findNodeById(objectTree, manualFeaturePartAId)?.name ?? manualFeaturePartAId;
      const partBName = findNodeById(objectTree, manualFeaturePartBId)?.name ?? manualFeaturePartBId;
      const createdAt = Date.now();
      const partItems = [
        { key: 'A', partId: manualFeaturePartAId, partName: partAName },
        { key: 'B', partId: manualFeaturePartBId, partName: partBName },
      ];
      const definitions = partItems.map((item) => ({
        parentId: item.partId,
        node: {
          id: `${currentProject.tree.id}-grind-manual-${getPartSuffix(item.partId)}-${createdAt}-${item.key}`,
          name: `${item.partName} 打磨特征`,
          nodeType: 'feature' as const,
          featureType: 'grind' as const,
          featureUrl: getManualFeatureUrl('grind', manualFeaturePartAId, manualFeaturePartBId),
          relatedPartIds: [item.partId],
          sourceWeldFeatureIds: [manualGrindWeldFeatureId],
        },
      }));
      setProjects((prev) =>
        prev.map((project) =>
          project.id === currentProject.id
            ? { ...project, tree: appendFeatureNodes(project.tree, definitions) }
            : project
        )
      );
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        [currentProject.tree.id, manualFeaturePartAId, manualFeaturePartBId].forEach((id) => next.delete(id));
        return next;
      });
      setSelectedId(definitions[0].node.id);
      markFeatureDirty(currentProject.id);
      closeManualFeatureExtraction('grind');
      showToast(`已基于[${weldName}]创建 2 条打磨特征`, 'success');
      return;
    }
    if (!manualFeaturePartAId || !manualFeaturePartBId) {
      setManualFeatureError('请先选择两个相接零件');
      return;
    }
    if (!arePartsAdjacent(manualFeaturePartAId, manualFeaturePartBId, objectTree)) {
      setManualFeatureError('所选零件不相接，请重新选择');
      return;
    }
    if (!manualFeatureCandidateId) {
      setManualFeatureError(activeManualFeatureTab === 'weld' ? '请先选择面并生成焊缝' : '请在 3D 视窗中点选相接打磨线');
      return;
    }
    if (activeManualFeatureTab === 'weld' && !manualWeldGenerated) {
      setManualFeatureError('请先点击生成焊缝');
      return;
    }

    const parentId = getManualFeatureParentId(manualFeaturePartAId, manualFeaturePartBId);
    const partAName = findNodeById(objectTree, manualFeaturePartAId)?.name ?? manualFeaturePartAId;
    const partBName = findNodeById(objectTree, manualFeaturePartBId)?.name ?? manualFeaturePartBId;
    const suffixLabel = [getPartSuffix(manualFeaturePartAId), getPartSuffix(manualFeaturePartBId)].filter(Boolean).join('-');
    const featureId = `${currentProject.tree.id}-${activeManualFeatureTab}-manual-${suffixLabel}-${Date.now()}`;
    const featureName =
      activeManualFeatureTab === 'weld'
        ? `${partAName} / ${partBName} 手动焊缝`
        : `${partAName} / ${partBName} 手动打磨线`;
    const definition = {
      parentId,
      node: {
        id: featureId,
        name: featureName,
        nodeType: 'feature' as const,
        featureType: activeManualFeatureTab,
        featureUrl: getManualFeatureUrl(activeManualFeatureTab, manualFeaturePartAId, manualFeaturePartBId),
        relatedPartIds: [manualFeaturePartAId, manualFeaturePartBId],
      },
    };

    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? { ...project, tree: appendFeatureNodes(project.tree, [definition]) }
          : project
      )
    );
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      [currentProject.tree.id, manualFeaturePartAId, manualFeaturePartBId, parentId].forEach((id) => next.delete(id));
      return next;
    });
    setSelectedId(featureId);
    markFeatureDirty(currentProject.id);
    closeManualFeatureExtraction(activeManualFeatureTab);
    showToast(activeManualFeatureTab === 'weld' ? '焊缝特征已创建' : '打磨特征已创建', 'success');
  };

  // 切换项目时重置选中状态
  const selectProject = (projectId: string, nextSelectedId?: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if (!project.hasAssemblyDrawing) {
      setDrawingRequiredDialog({ projectId, name: project.name });
      return;
    }
    const enterProject = () => {
      setOpenProcessPlanningProjectIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]));
      setCurrentProjectId(projectId);
      setSelectedId(nextSelectedId ?? project.tree.id);
      setCollapsedIds(new Set());
    };

    if (immersiveLayout && !currentProjectId) {
      clearWorkspaceTransitionTimers();
      setWorkspaceTransitionPhase('project-exit');
      const switchTimer = window.setTimeout(() => {
        enterProject();
        setWorkspaceTransitionPhase('planning-enter');
        const resetTimer = window.setTimeout(() => {
          setWorkspaceTransitionPhase('idle');
          workspaceTransitionTimersRef.current = workspaceTransitionTimersRef.current.filter((timer) => timer !== resetTimer);
        }, 1100);
        workspaceTransitionTimersRef.current.push(resetTimer);
        workspaceTransitionTimersRef.current = workspaceTransitionTimersRef.current.filter((timer) => timer !== switchTimer);
      }, 700);
      workspaceTransitionTimersRef.current.push(switchTimer);
      return;
    }

    clearWorkspaceTransitionTimers();
    setWorkspaceTransitionPhase('idle');
    enterProject();
  };

  const backToAllProjects = () => {
    if (currentProjectHasUnsavedChanges) {
      setBackUnsavedNoticeOpen(true);
      return;
    }
    setCurrentProjectId(null);
  };

  const clearProjectProcessPlanningDirtyState = (projectId: string | null = currentProjectId) => {
    setProcessPointDirtyStepIds(new Set());
    setMagnetDirtyStepIds(new Set());
    setGrindParameterDirtyStepIds(new Set());
    setAssembleParameterDirtyStepIds(new Set());
    setWeldParameterDirtyStepIds(new Set());
    if (projectId) {
      setProcessPlanningDirtyProjectIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
    setProcessParameterDirty(false);
    setProcessParameterDiscardConfirmOpen(false);
    processParameterSnapshotRef.current = null;
    if (projectId) clearFeatureDirty(projectId);
  };

  const confirmBackWithUnsavedProcessPlanning = () => {
    setBackUnsavedNoticeOpen(false);
    setCurrentProjectId(null);
  };

  const closeProcessPlanningProject = (projectId: string) => {
    clearProjectProcessPlanningDirtyState(projectId);
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setSelectedId('');
    }
    setOpenProcessPlanningProjectIds((prev) => prev.filter((id) => id !== projectId));
  };

  const requestCloseProcessPlanningProject = (project: Project) => {
    if (openProcessPlanningProjectIds.includes(project.id) && getProjectHasUnsavedChanges(project)) {
      setProcessPlanningMenuOpen(false);
      setCloseProcessPlanningConfirm({ projectId: project.id, name: project.tree.id });
      return;
    }
    closeProcessPlanningProject(project.id);
  };

  const confirmCloseProcessPlanningProject = () => {
    if (!closeProcessPlanningConfirm) return;
    closeProcessPlanningProject(closeProcessPlanningConfirm.projectId);
    setCloseProcessPlanningConfirm(null);
  };

  const handleCreateProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newId,
      name: '新建项目',
      tree: {
        id: newId,
        name: '新建项目',
      },
      processSteps: [],
    };
    setProjects((prev) => [newProject, ...prev]);
    setEditingProjectId(newId);
    setEditingProjectName('新建项目');
    setPreviewProjectId(null);
    setPreviewSelectedId(null);
    setCurrentProjectId(null);
    setTimeout(() => {
      projectInputRef.current?.focus();
      projectInputRef.current?.select();
    }, 50);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (previewProjectId === projectId) {
      setPreviewProjectId(null);
      setPreviewSelectedId(null);
    }
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setSelectedId('');
    }
  };

  const isModelStructureCheckableNode = (node: TreeNode) => node.nodeType !== 'feature';
  const isFeatureChecked = (node: TreeNode) => checkedIds.has(node.id);
  const isModelStructureNodeChecked = (node: TreeNode) => isNodeChecked(node, checkedIds, isModelStructureCheckableNode);
  const isModelStructureNodeIndeterminate = (node: TreeNode) =>
    isNodeIndeterminate(node, checkedIds, isModelStructureCheckableNode);

  const toggleFeatureChecked = (node: TreeNode) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  };

  const toggleModelStructureChecked = (node: TreeNode) => {
    const isChecked = isModelStructureNodeChecked(node);
    const descendantIds = collectDescendantIds(node, isModelStructureCheckableNode);

    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.delete(node.id);
        descendantIds.forEach((id) => next.delete(id));
      } else {
        next.add(node.id);
        descendantIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const isProjectListVisibleNode = (node: TreeNode) => node.nodeType !== 'feature';
  const isProjectManagementWorkfaceGroup = (node: TreeNode) => node.name === '工作面正面' || node.name === '工作面反面';

  const isProjectListNodeChecked = (node: TreeNode) => isNodeChecked(node, checkedIds, isProjectListVisibleNode);

  const isProjectListNodeIndeterminate = (node: TreeNode) =>
    isNodeIndeterminate(node, checkedIds, isProjectListVisibleNode);

  const toggleProjectListChecked = (node: TreeNode) => {
    const isChecked = isProjectListNodeChecked(node);
    const descendantIds = collectDescendantIds(node, isProjectListVisibleNode);

    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.delete(node.id);
        descendantIds.forEach((id) => next.delete(id));
      } else {
        next.add(node.id);
        descendantIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };
  const getProjectListSelectableIds = (node: TreeNode) => [
    node.id,
    ...collectDescendantIds(node, isProjectListVisibleNode),
  ];
  const isProjectGroupChecked = (groupProjects: Project[]) =>
    groupProjects.length > 0 && groupProjects.every((project) => isProjectListNodeChecked(project.tree));
  const isProjectGroupIndeterminate = (groupProjects: Project[]) => {
    const checked = isProjectGroupChecked(groupProjects);
    if (checked) return false;
    return groupProjects.some((project) => isProjectListNodeChecked(project.tree) || isProjectListNodeIndeterminate(project.tree));
  };
  const toggleProjectGroupChecked = (groupProjects: Project[]) => {
    const checked = isProjectGroupChecked(groupProjects);
    const selectableIds = groupProjects.flatMap((project) => getProjectListSelectableIds(project.tree));

    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const getDeleteConfirmKind = (ids: string[]): DeleteConfirmKind => {
    let hasFeature = false;
    let hasModel = false;

    ids.forEach((id) => {
      const matchedNode = projects.map((project) => findNodeById(project.tree, id)).find(Boolean);
      if (matchedNode?.nodeType === 'feature') {
        hasFeature = true;
      } else {
        hasModel = true;
      }
    });

    return hasFeature && !hasModel ? 'feature' : 'model';
  };

  const handleBatchDelete = () => {
    if (checkedIds.size === 0) return;
    const ids = Array.from(checkedIds);
    const kind = getDeleteConfirmKind(ids);
    setDeleteConfirm({
      ids,
      label: kind === 'feature' ? '选中的特征' : '选中的三维模型',
      kind,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.kind === 'process') {
      deleteProcessSteps(deleteConfirm.ids);
      return;
    }

    const checkedArray = deleteConfirm.ids;
    const projectIdSet = new Set(projects.map((p) => p.id));
    const checkedProjectIds = checkedArray.filter((id) => projectIdSet.has(id));
    const checkedNodeIds = checkedArray.filter((id) => !projectIdSet.has(id));

    // 删除项目，并从剩余项目的树中删除选中的节点
    setProjects((prev) => {
      const remaining = prev.filter((p) => !checkedProjectIds.includes(p.id));
      if (checkedNodeIds.length === 0) return remaining;
      return remaining.map((p) => {
        let newTree = p.tree;
        for (const nodeId of checkedNodeIds) {
          const result = removeNode(newTree, nodeId);
          if (result.removed) {
            newTree = result.newTree;
          }
        }
        return { ...p, tree: newTree };
      });
    });

    // 节点软删除（加入 deletedIds）
    if (checkedNodeIds.length > 0) {
      setDeletedIds((prev) => {
        const next = new Set(prev);
        checkedNodeIds.forEach((id) => next.add(id));
        return next;
      });
      if (objectTree && checkedNodeIds.includes(selectedId)) {
        setSelectedId(objectTree.id);
      }
    }

    // 清理选中状态
    setCheckedIds(new Set());

    // 若当前预览/工艺规划的项目被删除，同步清理状态
    checkedProjectIds.forEach((projectId) => {
      if (previewProjectId === projectId) {
        setPreviewProjectId(null);
        setPreviewSelectedId(null);
      }
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setSelectedId('');
      }
    });
    if (checkedProjectIds.length > 0) {
      setOpenProcessPlanningProjectIds((prev) => prev.filter((projectId) => !checkedProjectIds.includes(projectId)));
    }
    setDeleteConfirm(null);
  };

  const processStepTypeOptions: { key: ProcessStepType; label: string; icon: typeof Move3D }[] = [
    { key: 'pick', label: '抓取', icon: Move3D },
    { key: 'place', label: '放置', icon: Box },
    { key: 'polish', label: '打磨', icon: Sparkles },
    { key: 'assemble', label: '装配', icon: Layers3 },
    { key: 'turnover-clamp', label: '翻面压紧', icon: Pin },
    { key: 'weld-combined', label: '焊接', icon: Hammer },
    { key: 'weld-scan', label: '定位焊扫描', icon: Target },
    { key: 'weld', label: '定位焊', icon: Hammer },
  ];
  const availableProcessStepTypeOptions = layoutVariant === 'immersive' && selectedPlanningProcess
    ? processStepTypeOptions.filter((option) => selectedPlanningProcess.allowedTaskTypes.includes(option.key))
    : processStepTypeOptions.filter((option) => option.key !== 'weld-combined');

  const getAddProcessSelectionSpec = (type: ProcessStepType) => {
    if (type === 'polish') {
      return {
        label: '打磨线',
        items: grindFeatureItems,
        placeholder: '请选择打磨线',
        emptyText: '尚未提取打磨特征',
        mode: 'multiple' as const,
        missingMessage: '请先提取打磨特征',
        requiredMessage: '请先选择打磨线',
      };
    }
    if (type === 'weld' || type === 'weld-scan' || type === 'weld-combined') {
      return {
        label: '焊缝',
        items: weldFeatureItems,
        placeholder: '请选择焊缝',
        emptyText: '尚未提取焊缝特征',
        mode: 'single' as const,
        missingMessage: '请先提取焊缝特征',
        requiredMessage: '请先选择焊缝',
      };
    }
    if (type === 'assemble') {
      return {
        label: '装配基准特征',
        items: datumFeatureItems,
        placeholder: '请选择装配基准特征',
        emptyText: '请先生成装配基准特征',
        mode: 'multiple' as const,
        missingMessage: '请先生成装配基准特征',
        requiredMessage: '请先选择装配基准特征',
      };
    }
    return {
      label: '零件',
      items: leafParts,
      placeholder: '请选择零件',
      emptyText: '当前装配体没有可选零件',
      mode: 'multiple' as const,
      missingMessage: '当前装配体没有可选零件',
      requiredMessage: '请先选择零件',
    };
  };

  const getSelectionNames = (items: { id: string; name: string }[], ids: string[]) =>
    ids.map((id) => items.find((item) => item.id === id)?.name ?? id);

  const createGeneratedManualProcessStep = (type: ProcessStepType, selectedIds: string[]) => {
    if (!currentProject) return;

    const actionMap: Record<ProcessStepType, string> = {
      pick: '抓取',
      place: '放置',
      polish: '打磨',
      assemble: '装配',
      'turnover-clamp': '翻面压紧',
      'weld-combined': '焊接',
      weld: '焊接',
      'weld-scan': '定位焊扫描',
    };

    const fixedStyleCWorkpieceIds = layoutVariant === 'immersive' && selectedPlanningProcess
      ? selectedPlanningProcess.workpieceIds
      : null;
    const configWorkpieceIds = fixedStyleCWorkpieceIds ?? selectedIds;
    let board = fixedStyleCWorkpieceIds && selectedPlanningProcess ? selectedPlanningProcess.object : '';
    if (!board && (type === 'pick' || type === 'place' || type === 'turnover-clamp')) {
      board = getSelectionNames(leafParts, selectedIds).join('+');
    } else if (!board && type === 'polish') {
      board = getSelectionNames(grindFeatureItems, selectedIds).join('+');
    } else if (!board && type === 'assemble') {
      board = getSelectionNames(datumFeatureItems, selectedIds).join('+');
    } else if (!board && (type === 'weld' || type === 'weld-scan' || type === 'weld-combined')) {
      board = getSelectionNames(weldFeatureItems, selectedIds).join('+');
    }
    if (!board) {
      const mainBoard = currentProject.tree.children?.[0];
      board = mainBoard ? mainBoard.name : currentProject.tree.name;
    }

    const missingFixedSlot = selectedPlanningProcess?.taskSlots.find((slot) => (
      slot.type === type && !allProcessSteps.some((step) => step.id === slot.id)
    ));
    const stepId = missingFixedSlot?.id ?? `${type}-${Date.now()}`;
    const taskName = missingFixedSlot?.label ?? actionMap[type];
    const newStep: ProcessStep = {
      id: stepId,
      processId: layoutVariant === 'immersive' ? selectedPlanningProcess?.id : undefined,
      name: taskName,
      confirmed: layoutVariant === 'immersive',
      board,
      action: taskName,
      type,
      ...(type === 'pick' ? { pickConfig: createGeneratedPickConfig(configWorkpieceIds) } : {}),
      ...(type === 'place' ? { placeConfig: createGeneratedPlaceConfig(configWorkpieceIds) } : {}),
      ...(type === 'turnover-clamp' ? { turnoverClampConfig: createGeneratedClampConfig(configWorkpieceIds) } : {}),
      ...(type === 'polish' ? { grindConfig: createGeneratedGrindConfig(selectedIds) } : {}),
      ...(type === 'assemble' ? { assembleConfig: createGeneratedAssembleConfig(selectedIds) } : {}),
      ...(type === 'weld-combined' ? createGeneratedCombinedWeldConfig(selectedIds, weldScanParams, weldParams) : {}),
      ...(type === 'weld' ? { weldConfig: createGeneratedWeldConfig(selectedIds, weldParams) } : {}),
      ...(type === 'weld-scan' ? { weldConfig: createGeneratedWeldScanConfig(selectedIds, weldScanParams) } : {}),
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentProject.id
          ? { ...p, processSteps: [...p.processSteps, newStep] }
          : p
      )
    );
    markCurrentProcessPlanningDirty();
    if (type === 'polish') {
      void hydrateGeneratedGrindSteps([newStep]);
    }

    if (type === 'pick') {
      setCollapsedPickPointInfoIds((prev) => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
      setPickPreviewOverlayStepId(stepId);
    }
    if (type === 'place') {
      setCollapsedPlacePointInfoIds((prev) => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
      setPlacePreviewOverlayStepId(stepId);
    }
    if (type === 'turnover-clamp') {
      setCollapsedClampPointInfoIds((prev) => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
      setClampPreviewOverlayStepId(stepId);
    }
    if (type === 'polish') {
      setGrindPreviewOverlayStepId(stepId);
    }
    if (type === 'assemble') {
      setAssemblePreviewOverlayStepId(stepId);
    }
    if (type === 'weld' || type === 'weld-scan' || type === 'weld-combined') {
      setCollapsedPickPointInfoIds((prev) => {
        const next = new Set(prev);
        next.delete(`${stepId}-weld`);
        return next;
      });
      setWeldPreviewOverlayStepId(stepId);
    }
    if (layoutVariant === 'immersive' && selectedPlanningProcess) {
      setSelectedCompactProcessStepKey(stepId);
      setIsolatedCompactProcessStepKey(stepId);
      setProcessIsolationDismissed(false);
      setSelectedId('');
    }
    setActiveCompactProcessDetailTab(getCompactProcessDefaultDetailTab(type));
  };

  const handleAddProcessStep = (type: ProcessStepType) => {
    if (!currentProject) return;

    const actionMap: Record<ProcessStepType, string> = {
      pick: '抓取',
      place: '放置',
      polish: '打磨',
      assemble: '装配',
      'turnover-clamp': '翻面压紧',
      'weld-combined': '焊接',
      weld: '焊接',
      'weld-scan': '定位焊扫描',
    };

    let board = '';
    if (selectedId && selectedId !== currentProject.tree.id) {
      const node = findNodeById(currentProject.tree, selectedId);
      if (node) board = node.name;
    }
    if (!board) {
      const mainBoard = currentProject.tree.children?.[0];
      board = mainBoard ? mainBoard.name : currentProject.tree.name;
    }

    const stepId = `${type}-${Date.now()}`;
    const newStep: ProcessStep = {
      id: stepId,
      name: actionMap[type],
      board,
      action: actionMap[type],
      type,
      ...(type === 'pick' ? { pickConfig: createEmptyPickProcessConfig() } : {}),
      ...(type === 'place' ? { placeConfig: createEmptyPlaceProcessConfig() } : {}),
      ...(type === 'turnover-clamp' ? { turnoverClampConfig: createEmptyTurnoverClampProcessConfig() } : {}),
      ...(type === 'polish' ? { grindConfig: createEmptyFeatureProcessConfig() } : {}),
      ...(type === 'assemble' ? { assembleConfig: createEmptyFeatureProcessConfig() } : {}),
      ...(type === 'weld-combined' ? {
        weldConfig: createFeatureProcessConfigWithParams({ weldParams }),
        weldScanConfig: createFeatureProcessConfigWithParams({ weldParams: weldScanParams }),
      } : {}),
      ...(type === 'weld' ? { weldConfig: createFeatureProcessConfigWithParams({ weldParams }) } : {}),
      ...(type === 'weld-scan' ? { weldConfig: createFeatureProcessConfigWithParams({ weldParams: weldScanParams }) } : {}),
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentProject.id
          ? { ...p, processSteps: [...p.processSteps, newStep] }
          : p
      )
    );

    if (type === 'pick') {
      setCollapsedPickPointInfoIds((prev) => {
        const next = new Set(prev);
        next.add(stepId);
        return next;
      });
      setPickPreviewOverlayStepId(null);
    }
    if (type === 'place') {
      setCollapsedPlacePointInfoIds((prev) => {
        const next = new Set(prev);
        next.add(stepId);
        return next;
      });
      setPlacePreviewOverlayStepId(null);
    }
    if (type === 'turnover-clamp') {
      setCollapsedClampPointInfoIds((prev) => {
        const next = new Set(prev);
        next.add(stepId);
        return next;
      });
      setClampPreviewOverlayStepId(null);
    }
    if (type === 'polish') {
      setPickPreviewOverlayStepId(null);
    }
    if (type === 'assemble') {
      setAssemblePreviewOverlayStepId(null);
    }
    if (type === 'weld' || type === 'weld-scan' || type === 'weld-combined') {
      setCollapsedPickPointInfoIds((prev) => {
        const next = new Set(prev);
        next.add(`${stepId}-weld`);
        return next;
      });
      setWeldPreviewOverlayStepId(null);
    }
  };

  const openAddProcessTaskDialog = (type: ProcessStepType = 'pick') => {
    if (layoutVariant === 'immersive' && !selectedPlanningProcess) {
      showToast('请先选择需要配置的工序', 'error');
      return;
    }
    if (layoutVariant === 'immersive' && !currentProjectStyleCTasksGenerated) {
      showToast('请先一键生成任务', 'error');
      return;
    }
    const nextType = layoutVariant === 'immersive' && selectedPlanningProcess && !selectedPlanningProcess.allowedTaskTypes.includes(type)
      ? selectedPlanningProcess.allowedTaskTypes[0]
      : type;
    setAddProcessTaskDialog({ open: true, type: nextType, selectedIds: [] });
    setProcessMenuOpen(false);
  };

  const updateAddProcessTaskType = (type: ProcessStepType) => {
    setAddProcessTaskDialog({ open: true, type, selectedIds: [] });
  };

  const confirmAddProcessTask = () => {
    if (!addProcessTaskDialog) return;
    if (layoutVariant === 'immersive' && (!selectedPlanningProcess || !selectedPlanningProcess.allowedTaskTypes.includes(addProcessTaskDialog.type))) {
      showToast('当前任务类型不属于所选工序', 'error');
      return;
    }
    const usesFixedStyleCWorkpiece = layoutVariant === 'immersive' && Boolean(selectedPlanningProcess) && (
      addProcessTaskDialog.type === 'pick' ||
      addProcessTaskDialog.type === 'place' ||
      addProcessTaskDialog.type === 'turnover-clamp'
    );
    const selectionSpec = getAddProcessSelectionSpec(addProcessTaskDialog.type);
    if (!usesFixedStyleCWorkpiece && selectionSpec.items.length === 0) {
      showToast(selectionSpec.missingMessage, 'error');
      return;
    }
    if (!usesFixedStyleCWorkpiece && addProcessTaskDialog.selectedIds.length === 0) {
      showToast(selectionSpec.requiredMessage, 'error');
      return;
    }
    if (!usesFixedStyleCWorkpiece && (addProcessTaskDialog.type === 'pick' || addProcessTaskDialog.type === 'place' || addProcessTaskDialog.type === 'turnover-clamp')) {
      const invalid = objectTree &&
        addProcessTaskDialog.selectedIds.length > 1 &&
        addProcessTaskDialog.selectedIds.some((partId, partIndex, ids) =>
          ids.slice(partIndex + 1).some((otherId) => !arePartsAdjacent(partId, otherId, objectTree))
        );
      if (invalid) {
        showToast('所选工件不相接，请重新选择', 'error');
        return;
      }
    }
    createGeneratedManualProcessStep(addProcessTaskDialog.type, addProcessTaskDialog.selectedIds);
    setAddProcessTaskDialog(null);
    showToast(`已新增${getShortProcessStepTitle(addProcessTaskDialog.type)}任务`, 'success');
  };

  const handleGenerateProcessSequence = (styleCDemo = false) => {
    if (!currentProject) return;
    const baseId = currentProject.tree.id;
    const part01 = `${baseId}-01`;
    const part02 = `${baseId}-02`;
    const part03 = `${baseId}-03`;
    const part04 = `${baseId}-04`;
    const hasGrindFeatures = processFeatureItems.some((item) => item.featureType === 'grind');
    const hasWeldFeatures = processFeatureItems.some((item) => item.featureType === 'weld');
    const hasDatumFeatures = processFeatureItems.some((item) => item.featureType === 'datum');

    const missingFeatureLabels = [
      !hasGrindFeatures ? '打磨特征' : null,
      !hasWeldFeatures ? '焊缝特征' : null,
      !hasDatumFeatures ? '装配基准特征' : null,
    ].filter(Boolean) as string[];

    if (missingFeatureLabels.length > 0 && !styleCDemo) {
      const missingFeatureAttempts = processGenerationMissingFeatureAttemptsRef.current[currentProject.id] ?? 0;
      processGenerationMissingFeatureAttemptsRef.current[currentProject.id] = missingFeatureAttempts + 1;
      if (missingFeatureAttempts === 0) {
        showToast(`请先提取${missingFeatureLabels.join('、')}，再次点击将自动补齐并生成任务`, 'error');
        return;
      }
    } else {
      processGenerationMissingFeatureAttemptsRef.current[currentProject.id] = 0;
    }

    const datumItems = styleCDemo || !hasDatumFeatures ? createAllDatumItems(baseId) : [];
    const autoFeatureDefinitions = [
      ...(styleCDemo || !hasWeldFeatures ? getWeldFeatureDefinitions(baseId) : []),
      ...(styleCDemo || !hasGrindFeatures ? getGrindFeatureDefinitions(baseId) : []),
      ...datumItems.map((item) => item.definition),
    ];
    const nextTreeForGeneration = appendFeatureNodes(currentProject.tree, autoFeatureDefinitions);
    const featureItemsForGeneration = collectDetachedFeatureItems(nextTreeForGeneration);
    const findFeatureIdsForPartsFromItems = (featureType: NonNullable<TreeNode['featureType']>, partIds: string[]) => {
      const uniquePartIds = Array.from(new Set(partIds));
      return featureItemsForGeneration
        .filter((item) => {
          if (item.featureType !== featureType) return false;
          const relatedIds = Array.from(new Set(item.relatedPartIds));
          if (!relatedIds.length) return false;
          if (uniquePartIds.length === 1) return relatedIds.includes(uniquePartIds[0]);
          if (uniquePartIds.length === 2) {
            return relatedIds.length === 2 && uniquePartIds.every((partId) => relatedIds.includes(partId));
          }
          return relatedIds.every((partId) => uniquePartIds.includes(partId));
        })
        .map((item) => item.id);
    };

    const partNames = (partIds: string[]) => partIds.map((partId) => findNodeById(nextTreeForGeneration, partId)?.name ?? partId).join('+');
    const createPickStep = (id: string, partIds: string[], processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '抓取',
      type: 'pick',
      pickConfig: createGeneratedPickConfig(partIds),
    });
    const createPlaceStep = (id: string, partIds: string[], processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '放置',
      type: 'place',
      placeConfig: createGeneratedPlaceConfig(partIds),
    });
    const createGrindStep = (id: string, partIds: string[], featureIds = findFeatureIdsForPartsFromItems('grind', partIds), processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '打磨',
      type: 'polish',
      grindConfig: createGeneratedGrindConfig(featureIds),
    });
    const createAssembleStep = (id: string, displayPartIds: string[], matchPartIds = displayPartIds, processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(displayPartIds),
      action: '装配',
      type: 'assemble',
      assembleConfig: createGeneratedAssembleConfig(findFeatureIdsForPartsFromItems('datum', matchPartIds)),
    });
    const createClampStep = (id: string, partIds: string[], processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '翻面压紧',
      type: 'turnover-clamp',
      turnoverClampConfig: createGeneratedClampConfig(partIds),
    });
    const createWeldScanStep = (id: string, partIds: string[], featureIds = findFeatureIdsForPartsFromItems('weld', partIds), processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '定位焊扫描',
      type: 'weld-scan',
      weldConfig: createGeneratedWeldScanConfig(featureIds, weldScanParams),
    });
    const createWeldStep = (id: string, partIds: string[], featureIds = findFeatureIdsForPartsFromItems('weld', partIds), processId?: string): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '定位焊',
      type: 'weld',
      weldConfig: createGeneratedWeldConfig(featureIds, weldParams),
    });
    const createCombinedWeldStep = (
      id: string,
      partIds: string[],
      featureIds = findFeatureIdsForPartsFromItems('weld', partIds),
      processId?: string
    ): ProcessStep => ({
      id,
      processId,
      board: partNames(partIds),
      action: '焊接',
      type: 'weld-combined',
      ...createGeneratedCombinedWeldConfig(featureIds, weldScanParams, weldParams),
    });

    const legacySteps: ProcessStep[] = [
      createPickStep('generated-pick-01', [part01]),
      createPlaceStep('generated-place-01', [part01]),
      createGrindStep('generated-grind-01', [part01], [`${baseId}-01-grind-1`]),
      createPickStep('generated-pick-02', [part02]),
      createPlaceStep('generated-place-02', [part02]),
      createGrindStep('generated-grind-02', [part02], [`${baseId}-02-grind`]),
      createAssembleStep('generated-assemble-02', [part02], [part01, part02]),
      createClampStep('generated-clamp-02-01', [part02, part01]),
      createWeldScanStep('generated-weld-scan-02-01', [part02, part01]),
      createWeldStep('generated-weld-02-01', [part02, part01]),
      createPickStep('generated-pick-03', [part03]),
      createPlaceStep('generated-place-03', [part03]),
      createGrindStep('generated-grind-03', [part03], [`${baseId}-03-grind-1`]),
      createAssembleStep('generated-assemble-03', [part03], [part01, part03]),
      createClampStep('generated-clamp-03-02-01', [part03, part02, part01]),
      createWeldScanStep('generated-weld-scan-03-02-01', [part03, part02, part01], [`${baseId}-03-weld-back-1`]),
      createWeldStep('generated-weld-03-02-01', [part03, part02, part01], [`${baseId}-03-weld-back-1`]),
      createPickStep('generated-pick-04', [part04]),
      createPlaceStep('generated-place-04', [part04]),
      createGrindStep('generated-grind-04', [part04], [`${baseId}-04-grind`]),
      createAssembleStep('generated-assemble-04', [part04], [part03, part04]),
      createClampStep('generated-clamp-04-03-02-01', [part04, part03, part02, part01]),
      createWeldScanStep('generated-weld-scan-04-03-02-01', [part04, part03, part02, part01], [`${baseId}-04-weld-back-2`]),
      createWeldStep('generated-weld-04-03-02-01', [part04, part03, part02, part01], [`${baseId}-04-weld-back-2`]),
    ];

    const styleCDemoSteps: ProcessStep[] = createStyleCGeneratedProcessSteps();
    const nextSteps = styleCDemo ? styleCDemoSteps : legacySteps;

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== currentProject.id) return project;
        const existingDatumIds = new Set((project.datums || []).map((datum) => datum.id));
        return {
          ...project,
          tree: appendFeatureNodes(project.tree, autoFeatureDefinitions),
          datums: [
            ...(project.datums || []),
            ...datumItems.map((item) => item.datum).filter((datum) => !existingDatumIds.has(datum.id)),
          ],
          processSteps: nextSteps,
        };
      })
    );
    void hydrateGeneratedGrindSteps(nextSteps, featureItemsForGeneration);
    setExpandedProcessStepIds(new Set());
    setProcessPointDirtyStepIds(new Set());
    setMagnetDirtyStepIds(new Set());
    setGrindParameterDirtyStepIds(new Set());
    setAssembleParameterDirtyStepIds(new Set());
    setWeldParameterDirtyStepIds(new Set());
    setCollapsedPickPointInfoIds(new Set());
    setCollapsedPlacePointInfoIds(new Set());
    setCollapsedClampPointInfoIds(new Set());
    setSelectedPlanningProcessId(null);
    setProcessIsolationDismissed(false);
    setSelectedCompactProcessStepKey(styleCDemo ? null : nextSteps[0]?.id ?? null);
    setIsolatedCompactProcessStepKey(null);
    setDisabledCompactProcessStepKeys(new Set());
    setCompactProcessBatchMode(false);
    setCheckedCompactProcessStepKeys(new Set());
    setActiveCompactProcessDetailTab(getCompactProcessDefaultDetailTab(nextSteps[0]?.type ?? 'pick'));
    setPickPreviewOverlayStepId(null);
    setPlacePreviewOverlayStepId(null);
    setClampPreviewOverlayStepId(null);
    setGrindPreviewOverlayStepId(null);
    setAssemblePreviewOverlayStepId(null);
    setWeldPreviewOverlayStepId(null);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      [baseId, part01, part02, part03, part04].forEach((id) => next.delete(id));
      return next;
    });
    if (autoFeatureDefinitions.length > 0) {
      markFeatureDirty(currentProject.id);
    }
    markCurrentProcessPlanningDirty();
    if (styleCDemo) {
      setGeneratedStyleCProjectIds((previous) => {
        const next = new Set(previous);
        next.add(currentProject.id);
        return next;
      });
      setStyleCRegenerationNeededProjectIds((previous) => {
        const next = new Set(previous);
        next.delete(currentProject.id);
        return next;
      });
    }
    processGenerationMissingFeatureAttemptsRef.current[currentProject.id] = 0;
    showToast(
      styleCDemo
        ? `已完成 ${fixedPlanningProcesses.length} 道工序配置，共填入 ${nextSteps.length} 项任务及其参数和点位`
        : autoFeatureDefinitions.length > 0
          ? '已自动补齐特征并一键生成完整任务列表'
          : '已一键生成完整任务列表',
      'success'
    );
  };

  const requestGenerateProcessSequence = (styleCDemo = false) => {
    if (styleCDemo && currentProjectStyleCTasksGenerated) {
      setProcessRegenerationConfirmOpen(true);
      return;
    }
    handleGenerateProcessSequence(styleCDemo);
  };

  const confirmRegenerateProcessSequence = () => {
    setProcessRegenerationConfirmOpen(false);
    handleGenerateProcessSequence(true);
  };

  const openAddAssemblyDialog = (target: 'project' | 'group0162', projectId?: string) => {
    setNewAssemblyName('新建装配体');
    setAddAssemblyDialog({ target, projectId });
  };

  const handleConfirmAddAssembly = () => {
    if (!addAssemblyDialog) return;
    const name = newAssemblyName.trim();
    if (!name) {
      showToast('请输入装配体名称', 'error');
      return;
    }

    if (addAssemblyDialog.target === 'project' && addAssemblyDialog.projectId) {
      const newAssemblyId = `assembly-${Date.now()}`;
      const newAssembly: TreeNode = {
        id: newAssemblyId,
        name,
        children: [],
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === addAssemblyDialog.projectId
            ? { ...p, tree: { ...p.tree, children: [...(p.tree.children || []), newAssembly] } }
            : p
        )
      );
      setProjectListCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(addAssemblyDialog.projectId!);
        return next;
      });
    }

    if (addAssemblyDialog.target === 'group0162') {
      const newProjectId = `0162-${Date.now()}`;
      const newProject: Project = {
        id: newProjectId,
        name,
        tree: {
          id: newProjectId,
          name,
          children: [],
        },
        processSteps: [],
      };

      setProjects((prev) => [...prev, newProject]);
      setProjectListCollapsed((prev) => {
        const next = new Set(prev);
        next.delete('group-0162');
        return next;
      });
    }

    setAddAssemblyDialog(null);
    showToast('装配体创建成功', 'success');
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingProjectName(e.target.value);
  };

  const handleProjectNameBlur = () => {
    if (!editingProjectId) return;
    const name = editingProjectName.trim() || '新建项目';
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProjectId
          ? {
              ...p,
              name,
              tree: { ...p.tree, name },
            }
          : p
      )
    );
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleProjectNameBlur();
    }
  };

  const startEditingAssemblyNode = (projectId: string, node: TreeNode) => {
    setEditingAssemblyNode({ projectId, nodeId: node.id });
    setEditingAssemblyName(node.name);
    setTimeout(() => {
      assemblyInputRef.current?.focus();
      assemblyInputRef.current?.select();
    }, 50);
  };

  const cancelEditingAssemblyNode = () => {
    setEditingAssemblyNode(null);
    setEditingAssemblyName('');
  };

  const commitEditingAssemblyNode = () => {
    if (!editingAssemblyNode) return;
    const name = editingAssemblyName.trim() || '新建装配体';
    setProjects((prev) =>
      prev.map((project) =>
        project.id === editingAssemblyNode.projectId
          ? { ...project, tree: renameTreeNode(project.tree, editingAssemblyNode.nodeId, name) }
          : project
      )
    );
    cancelEditingAssemblyNode();
  };

  const handleAssemblyNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEditingAssemblyNode();
    if (e.key === 'Escape') cancelEditingAssemblyNode();
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleHidden = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showFeatureInViewport = (featureNode: TreeNode) => {
    setSelectedId(featureNode.id);
    setHiddenIds((prev) => {
      if (!prev.has(featureNode.id)) return prev;
      const next = new Set(prev);
      next.delete(featureNode.id);
      return next;
    });
  };

  const selectTreeNode = (node: TreeNode) => {
    setIsolatedCompactProcessStepKey(null);
    if (layoutVariant === 'immersive' && selectedPlanningProcessId) {
      setProcessIsolationDismissed(true);
    }
    if (node.nodeType === 'feature') {
      showFeatureInViewport(node);
    } else {
      setSelectedId(node.id);
    }
    if (updatedDrawingIds.has(node.id)) {
      setUpdatedDrawingIds((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
    }
  };

  const arrangeDemoAssemblyTree = (node: TreeNode) => {
    if (!currentProject || node.id !== '0162-03-030303') return;
    const featureDefinitions = collectFeatureNodeDefinitionsByParent(currentProject.tree);
    const arrangedTree = appendFeatureNodes(createArrangedAssemblyTree(node.id, node.name), featureDefinitions);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProject.id
          ? { ...project, tree: arrangedTree }
          : project
      )
    );
    setSelectedId(node.id);
    setCollapsedIds(new Set());
    showToast('已整理为 01 层级树：零件挂入正反工作面', 'success');
  };

  const deleteNode = (id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (selectedId === id && objectTree) {
      setSelectedId(objectTree.id);
    }
  };

  const collectVisibleModels = (node: TreeNode): { url: string; name: string; id: string }[] => {
    if (deletedIds.has(node.id)) return [];
    const results: { url: string; name: string; id: string }[] = [];
    if (node.modelPath) {
      results.push({ url: node.modelPath, name: node.name, id: node.id });
    }
    for (const child of node.children || []) {
      results.push(...collectVisibleModels(child));
    }
    return results;
  };

  const getProjectListVisibleChildren = (node: TreeNode): TreeNode[] =>
    (node.children ?? []).flatMap((child) => {
      if (!isProjectListVisibleNode(child)) return [];
      if (isProjectManagementWorkfaceGroup(child)) {
        return getProjectListVisibleChildren(child);
      }
      return [child];
    });

  // 全部项目页的树节点渲染（含层级折叠）
  const renderProjectListTreeNode = (node: TreeNode, level = 0, ownerProjectId?: string) => {
    const ownerProject = ownerProjectId ? projects.find((project) => project.id === ownerProjectId) : null;
    const hasModel = Boolean(node.modelPath);
    const isWorkfaceGroup = node.name === '工作面正面' || node.name === '工作面反面';
    const isAssemblyNode = level === 0 && !hasModel && !isWorkfaceGroup;
    const assemblyDrawingMissing = isAssemblyNode && ownerProject?.hasAssemblyDrawing === false;
    const visibleChildren = isAssemblyNode ? collectProjectManagementPartRows(node) : getProjectListVisibleChildren(node);
    const hasChildren = visibleChildren.length > 0;
    const collapsed = projectListNodeCollapsed.has(node.id);
    const isSelected = previewSelectedId === node.id;
    const selectedProjectListNode = previewSelectedId ? findNodeById(node, previewSelectedId) : null;
    const assemblyHasSelectedChildPart =
      isAssemblyNode &&
      !isSelected &&
      Boolean(previewSelectedId && selectedProjectListNode?.modelPath && isDescendant(node, previewSelectedId));
    const isUpdated = updatedDrawingIds.has(node.id);
    const isEditingAssemblyNode = Boolean(ownerProjectId && editingAssemblyNode?.projectId === ownerProjectId && editingAssemblyNode.nodeId === node.id);
    const projectListRowPaddingLeft = isAssemblyNode
      ? level * 14 + getProjectManagementAssemblyPaddingLeft()
      : level * 14 + 4 + projectManagementPartPaddingBump;
    const projectListTitleGapClassName = !isWorkfaceGroup && (isAssemblyNode || hasModel) ? 'ds-tree-icon-title-gap' : '';
    const workfaceGroupClassName = isSelected
      ? 'min-h-6 rounded-sm border-y border-orange-100 bg-orange-50 py-0.5 text-[10px] text-ds-brand-primary-text'
      : 'min-h-6 rounded-sm border-y border-zinc-100/80 bg-zinc-100/55 py-0.5 text-[10px] text-ds-text-muted hover:bg-zinc-100/80';

    const handleSelect = () => {
      if (ownerProjectId) {
        setPreviewProjectId(ownerProjectId);
      }
      setPreviewSelectedId(node.id);
      // 点选后清除该对象的更新状态
      if (isUpdated) {
        setUpdatedDrawingIds((prev) => {
          const next = new Set(prev);
          next.delete(node.id);
          return next;
        });
      }
    };

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 px-1 transition-colors cursor-pointer ${
            isWorkfaceGroup
              ? workfaceGroupClassName
              : isAssemblyNode
                ? `rounded-md py-1.5 text-sm ${
                    isSelected
                        ? 'bg-orange-50 text-ds-brand-primary-text'
                      : assemblyHasSelectedChildPart
                        ? 'bg-orange-50/45 text-ds-text-secondary ring-1 ring-inset ring-orange-100'
                        : 'text-ds-text-secondary hover:bg-zinc-100'
                  }`
                : `rounded-md py-1 text-xs ${isSelected ? 'bg-orange-50 text-ds-brand-primary-text' : 'text-ds-text-secondary hover:bg-zinc-100'}`
          }`}
          style={{ paddingLeft: `${projectListRowPaddingLeft}px` }}
          onClick={handleSelect}
          onDoubleClick={(e) => {
            if (!isAssemblyNode || !ownerProjectId) return;
            e.stopPropagation();
            startEditingAssemblyNode(ownerProjectId, node);
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className={`size-4 shrink-0 p-0 ${hasChildren ? 'text-ds-text-disabled' : 'invisible'}`}
            title={hasChildren ? (collapsed ? '展开' : '折叠') : ''}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleProjectListNodeCollapse(node.id);
            }}
          >
            {hasChildren ? (
              collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </Button>
          <ThemedCheckbox
            className={getProjectListCheckboxClassName(isProjectListNodeChecked(node) || isProjectListNodeIndeterminate(node))}
            checked={isProjectListNodeChecked(node)}
            indeterminate={isProjectListNodeIndeterminate(node)}
            onChange={() => toggleProjectListChecked(node)}
            onClick={(e) => e.stopPropagation()}
          />
          {isWorkfaceGroup ? (
            <div className="size-3 shrink-0" />
          ) : !isAssemblyNode && !hasModel ? (
            <Layers3 className="size-3 shrink-0 text-ds-text-disabled" />
          ) : null}
          {isEditingAssemblyNode ? (
            <input
              ref={assemblyInputRef}
              type="text"
              value={editingAssemblyName}
              onChange={(event) => setEditingAssemblyName(event.target.value)}
              onBlur={commitEditingAssemblyNode}
              onKeyDown={handleAssemblyNameKeyDown}
              onClick={(event) => event.stopPropagation()}
              className="min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-ds-brand-primary"
              placeholder="装配体名称"
            />
          ) : (
            <span className={`${projectListTitleGapClassName} min-w-0 flex-1 truncate ${isWorkfaceGroup ? (isSelected ? 'font-normal text-ds-brand-primary-text' : 'font-normal text-ds-text-muted') : isAssemblyNode ? 'font-medium' : ''}`}>
              {node.name}
            </span>
          )}
          {isAssemblyNode && ownerProjectId && (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                size="sm"
                variant="ghost"
                className={`size-6 p-0 ${assemblyDrawingMissing ? 'text-red-500 hover:text-red-600' : 'text-ds-text-disabled hover:text-ds-text-muted'}`}
                title={assemblyDrawingMissing ? '装配图纸缺失' : '图纸管理'}
                onClick={(e) => {
                  e.stopPropagation();
                  openDrawingManager(ownerProjectId);
                }}
              >
                {assemblyDrawingMissing ? <FileWarning className="size-3.5" /> : <FileCog className="size-3.5" />}
              </Button>
              {assemblyDrawingMissing ? (
                <span className="size-6 shrink-0" aria-hidden="true" />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-6 p-0 text-ds-text-disabled hover:text-orange-500"
                  title="进入工艺规划"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectProject(ownerProjectId, node.id);
                  }}
                >
                  <SquareArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        {hasChildren && !collapsed && (
          <div className="mt-0.5 space-y-0.5">
            {visibleChildren.map((child) => renderProjectListTreeNode(child, level + 1, ownerProjectId))}
          </div>
        )}
      </div>
    );
  };

  const renderTreeNode = (node: TreeNode, level = 0, isRoot = false, detachFeatures = false, parentNode: TreeNode | null = null) => {
    if (deletedIds.has(node.id)) return null;

    const visibleChildren = (node.children || []).filter((child) => !detachFeatures || child.nodeType !== 'feature');
    const hasChildren = visibleChildren.length > 0;
    const collapsed = collapsedIds.has(node.id);
    const hidden = hiddenIds.has(node.id);
    const selected = selectedId === node.id;
    const secondaryTreeSelected = secondaryTreeHighlightIds.has(node.id);
    const processIsolationClassName = processIsolationActive
      ? getProcessIsolationOpacityClassName(getProcessIsolationOpacity(node.id))
      : '';
    const canDelete = Boolean(node.modelPath);
    const isFeatureNode = node.nodeType === 'feature';
    const relatedFeatureHighlighted = isFeatureNode && relatedFeatureHighlightIds.has(node.id);
    const isGrindFeature = node.featureType === 'grind';
    const isDatumFeature = node.featureType === 'datum';
    const isUpdated = updatedDrawingIds.has(node.id);
    const isWorkfaceGroup = node.name === '工作面正面' || node.name === '工作面反面';
    const isFeatureGroup = node.name === '打磨特征' || node.name === '焊接特征' || node.name === '装配特征';
    const isDropTarget = dragState?.targetId === node.id;
    const firstVisibleFeatureSiblingId = parentNode?.children
      ?.filter((child) => !detachFeatures || child.nodeType !== 'feature')
      .find((child) => child.nodeType === 'feature')?.id;
    const isFirstNestedGrindFeature =
      currentProject &&
      layoutVariant === 'immersive' &&
      !detachFeatures &&
      isGrindFeature &&
      parentNode?.modelPath &&
      firstVisibleFeatureSiblingId === node.id;
    const compactObjectNode = (flatProjectLayout || immersiveProjectLayout) && !isRoot && !isFeatureNode && !isWorkfaceGroup && !isFeatureGroup;
    const baseRowPaddingLeft = compactObjectNode
      ? level <= 1
        ? 8
        : level >= 4
          ? 48
          : 36
      : isWorkfaceGroup
        ? 36
      : level * 18 + 8;
    const rowPaddingLeft =
      currentProject && layoutVariant === 'immersive' && !detachFeatures && isFeatureNode
        ? Math.max(8, baseRowPaddingLeft - 16)
        : baseRowPaddingLeft;
    const featureCheckboxVisible = isFeatureChecked(node);
    const assemblyPartCount = collectLeafParts(node).length;
    const workfaceGroupRowClassName = selected
      ? 'border-y border-orange-100 bg-orange-50 text-ds-brand-primary-text'
      : secondaryTreeSelected
        ? 'border-y border-orange-100/70 bg-orange-50/45 text-ds-text-secondary ring-1 ring-inset ring-orange-100'
        : 'border-y border-zinc-100/80 bg-zinc-100/55 text-ds-text-muted hover:bg-zinc-100/80';

    const handleSelect = () => selectTreeNode(node);

    const handleDragStart = (event: React.DragEvent) => {
      if (isRoot || isFeatureNode) {
        event.preventDefault();
        return;
      }
      dragIdRef.current = node.id;
      setDragState({ draggingId: node.id, targetId: null, position: 'after', nest: false });
      event.dataTransfer.effectAllowed = 'move';
    };

    const handleWrapperDragOver = (event: React.DragEvent) => {
      event.preventDefault();
      const draggingId = dragIdRef.current;
      if (!draggingId) return;
      if (node.id === draggingId) return;
      if (!objectTree) return;

      const draggedNode = findNodeById(objectTree, draggingId);
      if (!draggedNode) return;
      if (isDescendant(draggedNode, node.id)) return;

      // 获取行 div 的 rect，只处理当前节点行的上半部分（before）
      const rowEl = (event.currentTarget as HTMLElement).querySelector('[data-drag-row]') as HTMLElement | null;
      if (!rowEl) return;
      const rowRect = rowEl.getBoundingClientRect();
      const relativeY = event.clientY - rowRect.top;
      if (relativeY > rowRect.height / 2) return;

      const relativeX = event.clientX - rowRect.left;
      const nestThreshold = 24; // 距离行左边缘超过 24px 视为 nest
      const nest = relativeX > nestThreshold;

      setDragState({ draggingId, targetId: node.id, position: 'before', nest });
    };

    const handleAfterZoneDragOver = (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const draggingId = dragIdRef.current;
      if (!draggingId) return;
      if (node.id === draggingId) return;
      if (!objectTree) return;

      const draggedNode = findNodeById(objectTree, draggingId);
      if (!draggedNode) return;
      if (isDescendant(draggedNode, node.id)) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const nestThreshold = (level + 1) * 18 + 8;
      const nest = relativeX > nestThreshold;

      setDragState({ draggingId, targetId: node.id, position: 'after', nest });
    };

    const handleWrapperDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const draggingId = dragIdRef.current;
      if (!draggingId || !dragState?.targetId || !currentProject) {
        dragIdRef.current = null;
        setDragState(null);
        return;
      }

      const { newTree, removed } = removeNode(currentProject.tree, draggingId);
      if (!removed) {
        dragIdRef.current = null;
        setDragState(null);
        return;
      }

      const finalTree = insertNode(newTree, dragState.targetId, removed, dragState.position, dragState.nest);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProject.id ? { ...p, tree: finalTree } : p
        )
      );
      setStyleCRegenerationNeededProjectIds((previous) => {
        const next = new Set(previous);
        next.add(currentProject.id);
        return next;
      });
      showToast('零件层级已调整，工序列表需要重新生成', 'error');
      dragIdRef.current = null;
      setDragState(null);
    };

    const handleDragEnd = () => {
      dragIdRef.current = null;
      setDragState(null);
    };

    const canOpenFeatureContextMenu = isRoot || (!isFeatureNode && !isWorkfaceGroup && !isFeatureGroup);

    const handleContextMenu = (event: React.MouseEvent) => {
      if (!canOpenFeatureContextMenu) return;
      event.preventDefault();
      event.stopPropagation();
      setSelectedId(node.id);
      setAssemblyContextMenu({
        x: Math.min(event.clientX, window.innerWidth - 180),
        y: Math.min(event.clientY, window.innerHeight - 132),
        nodeId: node.id,
        nodeType: isRoot ? 'assembly' : 'part',
      });
    };

    const renderDropIndicator = (indicatorPosition: 'before' | 'after') => {
      if (!dragState || dragState.targetId !== node.id || dragState.position !== indicatorPosition) {
        return null;
      }
      const indent = (dragState.nest ? level + 1 : level) * 18 + 8;
      return (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-0.5">
          <div style={{ width: `${indent}px`, flexShrink: 0 }} />
          <div className={getStructureTreeDropIndicatorClassName()} />
        </div>
      );
    };

    if (isRoot) {
      const rootCollapsed = collapsedIds.has(node.id);
      return (
        <div key={node.id} className="relative">
          <div
            data-drag-row
            onContextMenu={handleContextMenu}
            className="group grid min-h-7 w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-1 overflow-hidden rounded-md bg-ds-bg-process-planning-tree-group pr-2 text-[11px] text-ds-text-secondary transition-colors hover:bg-ds-bg-process-planning-tree-group-hover"
            style={{ paddingLeft: '8px' }}
            onClick={handleSelect}
            onDoubleClick={(event) => {
              if (node.id !== '0162-03-030303') return;
              event.stopPropagation();
              arrangeDemoAssemblyTree(node);
            }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="size-6 shrink-0 p-0"
              title={hasChildren ? (rootCollapsed ? '展开' : '折叠') : ''}
              onClick={(event) => {
                event.stopPropagation();
                if (hasChildren) toggleCollapse(node.id);
              }}
            >
              {hasChildren ? (
                rootCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
            <Layers3 className="size-4 shrink-0 text-ds-text-disabled" />
            <span className="ds-tree-icon-title-gap min-w-0 flex-1 truncate font-normal">{node.name}</span>
            <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] leading-none text-zinc-600">
              {assemblyPartCount}
            </span>
          </div>
          {hasChildren && !rootCollapsed && (
            <div>
              {visibleChildren.map((child) => renderTreeNode(child, level + 1, false, detachFeatures, node))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        className="relative"
        onDragOver={handleWrapperDragOver}
        onDrop={handleWrapperDrop}
      >
        {renderDropIndicator('before')}
        <div
          data-drag-row
          draggable={!isRoot && !isFeatureNode}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onContextMenu={handleContextMenu}
              className={`group relative grid ${isFeatureNode ? 'h-8 grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] overflow-visible rounded-md text-xs' : isWorkfaceGroup ? 'h-6 grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-sm text-[10px]' : compactObjectNode ? 'h-8 grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-md text-xs' : 'h-9 grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-md text-sm'} w-full min-w-0 items-center gap-1 pr-2 transition-[colors,opacity] ${
            isWorkfaceGroup
              ? workfaceGroupRowClassName
              : selected
                ? 'bg-orange-50 text-ds-brand-primary-text'
                : relatedFeatureHighlighted
                  ? 'bg-orange-50/50 text-ds-text-secondary ring-1 ring-inset ring-orange-100'
                : secondaryTreeSelected
                  ? 'bg-orange-50/45 text-ds-text-secondary ring-1 ring-inset ring-orange-100'
                  : 'text-ds-text-secondary hover:bg-ds-bg-process-planning-tree-group-hover'
          } ${hidden ? 'text-ds-text-structure-hidden' : ''} ${processIsolationClassName} ${dragState?.draggingId === node.id ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${rowPaddingLeft}px` }}
          onClick={handleSelect}
        >
          <Button
            size="sm"
            variant="ghost"
            className={`size-6 shrink-0 p-0 transition-opacity ${hasChildren ? '' : 'invisible'} ${isWorkfaceGroup ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100' : ''}`}
            title={hasChildren ? (collapsed ? '展开' : '折叠') : ''}
            onClick={(event) => {
              event.stopPropagation();
              if (hasChildren) {
                toggleCollapse(node.id);
              }
            }}
          >
            {hasChildren ? (
              collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
          {isFeatureNode ? (
            <>
              <div className="relative size-4 shrink-0">
                <span
                  className={`absolute left-2 w-px ${
                    isDatumFeature
                      ? 'top-[-18px] h-8 bg-slate-300/80'
                      : isFirstNestedGrindFeature
                        ? 'top-0 h-4 bg-slate-300/80'
                      : isGrindFeature
                        ? 'top-[-28px] h-11 bg-slate-300/80'
                        : 'top-0 h-4 bg-slate-300/80'
                  }`}
                />
                <span
                  className={`absolute left-2 top-3 h-px w-3 ${
                    isDatumFeature
                      ? 'bg-slate-300/80'
                      : isGrindFeature
                        ? 'bg-slate-300/80'
                        : 'bg-slate-300/80'
                  }`}
                />
              </div>
              <ThemedCheckbox
                className={`shrink-0 transition-opacity ${featureCheckboxVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                checked={isFeatureChecked(node)}
                onChange={() => toggleFeatureChecked(node)}
                onClick={(event) => event.stopPropagation()}
              />
            </>
          ) : (
            <ThemedCheckbox
              className={`shrink-0 transition-opacity ${isModelStructureNodeChecked(node) || isModelStructureNodeIndeterminate(node) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              checked={isModelStructureNodeChecked(node)}
              indeterminate={isModelStructureNodeIndeterminate(node)}
              onChange={() => toggleModelStructureChecked(node)}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          {isWorkfaceGroup || node.modelPath ? (
            <div className={`${immersiveProjectLayout || projectManagementImmersiveLayout ? 'w-0' : 'size-4'} shrink-0`} />
          ) : isFeatureNode ? (
            null
          ) : (
            <Layers3 className="size-4 shrink-0 text-ds-text-disabled" />
          )}
          <span className={`min-w-0 flex-1 truncate ${isWorkfaceGroup ? (selected ? 'font-normal text-ds-brand-primary-text' : 'font-normal text-ds-text-muted') : node.modelPath ? 'font-medium' : 'font-normal'}`}>
            {node.name}
          </span>
          {isUpdated && (
            <Badge className="shrink-0 bg-green-100 text-green-700 border-green-200 text-[10px] leading-none px-1 py-0">
              更新
            </Badge>
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="size-6 shrink-0 p-0 opacity-80"
                title={hidden ? '显示模型' : '隐藏模型'}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleHidden(node.id);
                }}
              >
                {hidden ? (
                  <EyeOff className="size-4 text-ds-text-structure-hidden" />
                ) : (
                  <Eye className="size-4 text-ds-text-disabled" />
                )}
              </Button>
            )}

          </div>
        </div>
        <div
          className="relative h-0 py-1 w-full"
          onDragOver={handleAfterZoneDragOver}
          onDrop={handleWrapperDrop}
        >
          {renderDropIndicator('after')}
        </div>
        {hasChildren && !collapsed && (
          <div>
            {visibleChildren.map((child) => renderTreeNode(child, level + 1, false, detachFeatures, node))}
          </div>
        )}
      </div>
    );
  };

  // 计算模型：在项目页用 selectedNode，在全部项目页用预览项目的整棵树
  const previewProject = !currentProject && previewProjectId
    ? projects.find((p) => p.id === previewProjectId) ?? null
    : null;
  const drawingManagerProject: Project | null = createModelFlow
    ? {
        id: createModelFlow.assemblyId,
        name: createModelFlow.assemblyName,
        tree: createDemoAssemblyTree(createModelFlow.assemblyId, createModelFlow.assemblyName),
        processSteps: [],
        hasAssemblyDrawing: createModelFlow.stage !== 'missing-assembly',
      }
    : previewProject;
  const drawingManagerTitle = createModelFlow ? '创建模型' : '图纸管理';
  const drawingManagerLabel = createModelFlow ? createModelFlow.assemblyName : drawingManagerProject?.id;
  const drawingManagerImported = createModelFlow ? createModelFlow.stage === 'complete' : Boolean(previewProject?.hasAssemblyDrawing);
  const createModelHasMissingDrawings = Boolean(createModelFlow && (createModelFlow.stage !== 'complete' || createModelFlow.failedPartIds.length > 0));
  const hasPartDrawingInDrawingManager = (partId: string) => {
    const baseHasDrawing = drawingManagerProject && COMPLETE_DRAWING_PROJECT_IDS.has(drawingManagerProject.id)
      ? true
      : hasAlternatingDemoPartDrawing(partId);
    const createModelPartFailed = Boolean(createModelFlow?.failedPartIds.includes(partId));
    return createModelFlow ? (drawingManagerImported || baseHasDrawing) && !createModelPartFailed : baseHasDrawing;
  };
  const selectedNode = objectTree ? findNodeById(objectTree, selectedId) : null;
  const shouldKeepAllPlanningModelsVisible = Boolean(currentProject && layoutVariant === 'immersive' && objectTree);
  const models = shouldKeepAllPlanningModelsVisible && objectTree
    ? collectVisibleModels(objectTree)
    : selectedNode?.nodeType === 'feature' && objectTree
    ? collectVisibleModels(objectTree)
    : selectedNode
      ? collectVisibleModels(selectedNode)
    : previewProject
      ? collectVisibleModels(previewProject.tree)
      : [];
  const hideViewportModelsForProjectExit = workspaceTransitionPhase === 'project-exit' && layoutVariant === 'immersive' && !currentProject;
  const viewportModels = hideViewportModelsForProjectExit ? [] : models;
  const showViewportCanvas = models.length > 0 || hideViewportModelsForProjectExit;
  const selectedPartGumballSceneParts: SelectableFacePart[] =
    currentProject &&
    layoutVariant === 'immersive' &&
    !coordinateTransformOpen &&
    gumballHackAssemblyIds.has(currentProject.id) &&
    selectedNode?.nodeType !== 'feature' &&
    selectedNode.id !== objectTree?.id &&
    selectedNode.modelPath
      ? [{ id: selectedNode.id, name: selectedNode.name, url: selectedNode.modelPath }]
      : [];
  const selectedRelatedPartIds =
    selectedNode && selectedNode.nodeType !== 'feature' && selectedNode.modelPath
      ? [selectedNode.id]
      : [];
  const viewportPrimaryHighlightId =
    !processIsolationActive && currentProject && selectedNode && selectedNode.nodeType !== 'feature' && selectedNode.modelPath
      ? selectedNode.id
      : !currentProject
        ? previewSelectedId
        : undefined;
  const viewportPrimaryHighlightMode = currentProject ? 'overlay' : 'color';
  const relatedFeatureHighlightIds =
    !processIsolationActive && objectTree && selectedRelatedPartIds.length > 0
      ? new Set(
          collectAllFeatureNodes(objectTree)
            .filter((featureNode) => {
              if (featureNode.featureType === 'grind') {
                return selectedRelatedPartIds.some((partId) => getParentId(objectTree, featureNode.id) === partId);
              }
              return getFeatureRelatedPartIds(featureNode).some((partId) => selectedRelatedPartIds.includes(partId));
            })
            .map((featureNode) => featureNode.id)
        )
      : new Set<string>();
  const viewportSelectedFeatureId = processIsolationActive
    ? null
    : activeManualFeatureTab === 'grind' && manualGrindWeldFeatureId
    ? manualGrindWeldFeatureId
    : selectedId;
  const viewportWeldHighlightIds = new Set<string>(relatedFeatureHighlightIds);
  if (selectedNode?.featureType === 'grind') {
    selectedNode.sourceWeldFeatureIds?.forEach((featureId) => viewportWeldHighlightIds.add(featureId));
  }
  const manualGrindSelectedWeldNode = objectTree && manualGrindWeldFeatureId ? findNodeById(objectTree, manualGrindWeldFeatureId) : null;
  const manualGrindRelatedPartIds =
    activeManualFeatureTab === 'grind' && manualGrindSelectedWeldNode?.relatedPartIds
      ? manualGrindSelectedWeldNode.relatedPartIds
      : [];
  const applyProcessIsolationToFeatureViews = (featureViews: FeatureView[]) =>
    processIsolationActive
      ? featureViews.map((feature) => ({
          ...feature,
          selected: false,
          highlighted: false,
          opacityScale: getProcessIsolationOpacity(feature.sourceId),
        }))
      : featureViews;
  const weldFeatureViews = currentProject && objectTree
    ? applyProcessIsolationToFeatureViews(collectSceneFeatureViews(objectTree, 'weld', viewportSelectedFeatureId, viewportWeldHighlightIds))
    : [];
  const grindFeatureViews = currentProject && objectTree
    ? applyProcessIsolationToFeatureViews(collectSceneFeatureViews(objectTree, 'grind', processIsolationActive ? null : selectedId, relatedFeatureHighlightIds))
    : [];
  const datumFeatureViews = currentProject && objectTree
    ? applyProcessIsolationToFeatureViews(collectSceneFeatureViews(objectTree, 'datum', processIsolationActive ? null : selectedId, relatedFeatureHighlightIds))
    : [];
  const detachedFeatureItems = currentProject && objectTree ? collectDetachedFeatureItems(objectTree) : [];
  const manualWeldSelectableFaceParts = useMemo<SelectableFacePart[]>(() => {
    if (!objectTree || !manualWeldFaceSelectionActive || activeManualFeatureTab !== 'weld') return [];
    return [manualFeaturePartAId, manualFeaturePartBId]
      .filter((partId): partId is string => Boolean(partId))
      .map((partId) => findNodeById(objectTree, partId))
      .filter((part): part is TreeNode & { modelPath: string } => Boolean(part?.modelPath))
      .map((part) => ({ id: part.id, name: part.name, url: part.modelPath }));
  }, [activeManualFeatureTab, manualFeaturePartAId, manualFeaturePartBId, manualWeldFaceSelectionActive, objectTree]);

  const grindToolHeadItems = useMemo<GrindToolHeadPoseItem[]>(() => {
    const activeStepId = pickPathPosePreview?.stepId ?? selectedResultPointPreview?.stepId ?? grindPreviewOverlayStepId;
    const activeStep = activeStepId ? processSteps.find((step) => step.id === activeStepId) : null;
    if (!activeStep || activeStep.type !== 'polish' || !activeStep.grindConfig) return [];

    const featureId = activeStep.grindConfig.featureIds[0];
    const featurePath = featureId ? grindFeaturePaths[featureId] : undefined;
    if (!featurePath) return [];

    const resultPoints = normalizeFeaturePosePoints(activeStep.grindConfig.points, activeStep.grindConfig.posePoints).slice(0, 6);
    const safePoints = getProcessPathPoints(activeStep);
    const normal = new THREE.Vector3(...featurePath.normal);
    const resultPosition = (point: ProcessPosePoint) => {
      const target = new THREE.Vector3(Number(point.x) || 0, Number(point.y) || 0, Number(point.z) || 0);
      return target.clone().addScaledVector(normal, featurePath.resultStandoff);
    };
    const pointTarget = (point: ProcessPosePoint): [number, number, number] => [
      Number(point.x) || 0,
      Number(point.y) || 0,
      Number(point.z) || 0,
    ];
    const resultSelected = selectedResultPointPreview?.stepId === activeStep.id
      ? selectedResultPointPreview.pointIndex
      : null;
    const safeSelected = pickPathPosePreview?.stepId === activeStep.id && pickPathPosePreview.source === 'safe'
      ? pickPathPosePreview.pointIndex
      : null;

    const resultItems = resultPoints.map((point, index) => ({
      id: `${activeStep.id}-result-${index}`,
      label: `P${index + 1}`,
      position: resultPosition(point).toArray() as [number, number, number],
      target: pointTarget(point),
      rx: point.rx,
      ry: point.ry,
      rz: point.rz,
      active: resultSelected === index,
      opacity: resultSelected === index ? 1 : 0.68,
      showTarget: true,
      showToolHead: safeSelected === null,
    }));

    if (safeSelected !== null) {
      const selectedIndices = safeSelected === 'all'
        ? safePoints.map((point, index) => (point.enabled === false ? null : index)).filter((index): index is number => index !== null)
        : safePoints[safeSelected]?.enabled === false ? [] : [safeSelected];
      return [
        ...resultItems,
        ...selectedIndices.map((index) => {
          const point = safePoints[index];
          const target = resultPoints[index < 3 ? 0 : resultPoints.length - 1];
          return {
            id: `${activeStep.id}-safe-${index}`,
            label: `安全点 ${index + 1}`,
            position: [Number(point.x) || 0, Number(point.y) || 0, Number(point.z) || 0] as [number, number, number],
            target: target ? pointTarget(target) : [0, 0, 0] as [number, number, number],
            rx: point.rx,
            ry: point.ry,
            rz: point.rz,
            active: true,
            opacity: 0.96,
            showTarget: false,
          };
        }),
      ];
    }

    return resultItems;
  }, [grindFeaturePaths, grindPreviewOverlayStepId, pickPathPosePreview, processSteps, selectedResultPointPreview]);

	  const viewportSceneModels = useMemo(() => {
    if (manualWeldSelectableFaceParts.length === 0 && manualGrindRelatedPartIds.length === 0 && (!coordinateTransformOpen || coordinateTransformPartIds.length === 0)) {
      return viewportModels;
    }
    const merged = new Map(viewportModels.map((model) => [model.id, model]));
    manualWeldSelectableFaceParts.forEach((part) => {
      if (!merged.has(part.id)) {
        merged.set(part.id, { id: part.id, name: part.name, url: part.url });
      }
    });
    manualGrindRelatedPartIds.forEach((partId) => {
      const part = objectTree ? findNodeById(objectTree, partId) : null;
      if (part?.modelPath && !merged.has(part.id)) {
        merged.set(part.id, { id: part.id, name: part.name, url: part.modelPath });
      }
    });
    if (coordinateTransformOpen) {
      coordinateTransformPartIds.forEach((partId) => {
        const part = objectTree ? findNodeById(objectTree, partId) : null;
        if (part?.modelPath && !merged.has(part.id)) {
          merged.set(part.id, { id: part.id, name: part.name, url: part.modelPath });
        }
      });
    }
	    return Array.from(merged.values());
	  }, [coordinateTransformOpen, coordinateTransformPartIds, manualGrindRelatedPartIds, manualWeldSelectableFaceParts, objectTree, viewportModels]);
  const viewportModelOpacityById = useMemo(() => {
    if (!processIsolationActive) return undefined;
    return new Map(viewportSceneModels.map((model) => [model.id, getProcessIsolationOpacity(model.id)]));
  }, [planningProcessIsolationActive, planningProcessIsolationRelatedIds, processIsolationActive, taskFocusActive, taskFocusRelatedIds, viewportSceneModels]);
	  const secondaryHighlightIds =
	    processIsolationActive
	      ? []
	      : manualGrindRelatedPartIds.length > 0
	      ? manualGrindRelatedPartIds
	      : selectedNode?.nodeType === 'feature'
      ? getFeatureRelatedPartIds(selectedNode)
      : [];
  const secondaryTreeHighlightIds = new Set(secondaryHighlightIds);

  // 装配基准提取：根据当前选中的零件对生成可点击的棱边曲线列表
  const inDatumMode = Boolean(assemblyDatumModal?.open);
  const datumEdgeCandidates = useMemo(() => {
    if (!inDatumMode || !currentProject) return [];
    return [
      { id: '01-datum-edge-02', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-02`] },
      { id: '02-datum-edge-01', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-02`] },
      { id: '01-datum-edge-02-2', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-02`] },
      { id: '02-datum-edge-01-2', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-02`] },
      { id: '01-datum-edge-03', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-03`] },
      { id: '03-datum-edge-01', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-03`] },
      { id: '01-datum-edge-03-2', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-03`] },
      { id: '03-datum-edge-01-2', partIds: [`${currentProject.tree.id}-01`, `${currentProject.tree.id}-03`] },
      { id: '04-datum-edge-03', partIds: [`${currentProject.tree.id}-03`, `${currentProject.tree.id}-04`] },
    ];
  }, [inDatumMode, currentProject]);
  const activeDatumPartIds = useMemo(() => {
    if (!assemblyDatumModal?.partAId || !assemblyDatumModal?.partBId) return [];
    return [assemblyDatumModal.partAId, assemblyDatumModal.partBId];
  }, [assemblyDatumModal?.partAId, assemblyDatumModal?.partBId]);
  const datumEdgeViews = datumEdgeCandidates
    .filter((edge) => edge.partIds.every((id) => activeDatumPartIds.includes(id)))
    .map((edge) => ({
      id: edge.id,
      sourceId: edge.id,
      url: `${ASSET_BASE}models/datum-edges/${edge.id}.obj`,
      selected: assemblyDatumModal?.selectedEdgeId === edge.id,
    }));
  const visibleDatumEdges = inDatumMode ? datumEdgeViews : datumFeatureViews;
  const assemblyDatumPartAId = assemblyDatumModal?.partAId ?? null;
  const assemblyDatumPartBId = assemblyDatumModal?.partBId ?? null;
  const assemblyDatumBothSelected = Boolean(assemblyDatumPartAId && assemblyDatumPartBId);
  const assemblyDatumPartsAdjacent = Boolean(
    objectTree &&
      assemblyDatumPartAId &&
      assemblyDatumPartBId &&
      arePartsAdjacent(assemblyDatumPartAId, assemblyDatumPartBId, objectTree)
  );
  const assemblyDatumSelectionInvalid = assemblyDatumBothSelected && !assemblyDatumPartsAdjacent;

  // 项目管理列表：按 0162 前缀分组显示
  const group0162 = projects.filter((p) => p.id.startsWith('0162-'));
  const otherProjects = projects.filter((p) => !p.id.startsWith('0162-'));
  const group0162Collapsed = projectListCollapsed.has('group-0162');
  const projectManagementAssemblyPaddingBump = 6;
  const projectManagementPartPaddingBump = -1;
  const getProjectManagementGroupPaddingLeft = () => (styleCProjectManagementLayout ? 12 : 16);
  const getProjectManagementAssemblyPaddingLeft = () => getProjectManagementGroupPaddingLeft() + projectManagementAssemblyPaddingBump;

  const renderTopLevelProjectGroup = (project: Project) => {
    const isCollapsed = projectListCollapsed.has(project.id);
    const visibleChildren = getProjectListVisibleChildren(project.tree);
    const hasChildren = visibleChildren.length > 0;
    const isEditing = editingProjectId === project.id;
    return (
      <div key={project.id}>
        <div
          className={`group flex items-center gap-1 rounded-md px-1 py-1.5 text-sm text-ds-text-secondary transition-colors ${
            isEditing ? 'bg-orange-50 text-ds-brand-primary-text' : 'cursor-pointer hover:bg-zinc-100'
          }`}
          style={{ paddingLeft: `${getProjectManagementGroupPaddingLeft()}px` }}
          onClick={() => {
            if (isEditing) return;
            toggleProjectListCollapse(project.id);
            setPreviewProjectId(null);
            setPreviewSelectedId(null);
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className="size-5 shrink-0 p-0 text-ds-text-disabled"
            title={isCollapsed ? '展开' : '折叠'}
            onClick={(e) => {
              e.stopPropagation();
              toggleProjectListCollapse(project.id);
            }}
          >
            {hasChildren ? (
              isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />
            ) : (
              <span className="size-3.5" />
            )}
          </Button>
          <ThemedCheckbox
            className={getProjectListCheckboxClassName(isProjectListNodeChecked(project.tree) || isProjectListNodeIndeterminate(project.tree))}
            checked={isProjectListNodeChecked(project.tree)}
            indeterminate={isProjectListNodeIndeterminate(project.tree)}
            onChange={() => toggleProjectListChecked(project.tree)}
            onClick={(e) => e.stopPropagation()}
          />
          <FolderOpen className="size-4 shrink-0 text-amber-500" />
          {isEditing ? (
            <input
              ref={projectInputRef}
              type="text"
              value={editingProjectName}
              onChange={handleProjectNameChange}
              onBlur={handleProjectNameBlur}
              onKeyDown={handleProjectNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-ds-brand-primary"
              placeholder="项目名称"
            />
          ) : (
            <span className="ds-tree-icon-title-gap min-w-0 flex-1 truncate font-medium">{project.name}</span>
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              className="size-6 p-0 text-ds-text-disabled hover:text-orange-500"
              title="导出项目"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectExport(project.id, project.name);
              }}
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="size-6 p-0 text-ds-text-disabled hover:text-emerald-600"
              title="新增装配体"
              onClick={(e) => {
                e.stopPropagation();
                openCreateModelFlow('project', project.id);
              }}
            >
              <FolderPlus className="size-3.5" />
            </Button>
          </div>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {visibleChildren.map((child) => renderProjectListTreeNode(child, 0, project.id))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectItem = (project: Project) => {
    const isCollapsed = projectListCollapsed.has(project.id);
    const visibleChildren = project.id.startsWith('proj-')
      ? getProjectListVisibleChildren(project.tree)
      : collectProjectManagementPartRows(project.tree);
    const hasChildren = visibleChildren.length > 0;
    const isEditing = editingProjectId === project.id;
    const isStandaloneAssemblyProject = !project.id.startsWith('proj-');
    const isProjectItemSelected = previewProjectId === project.id && previewSelectedId === project.tree.id;
    const selectedProjectItemNode = previewProjectId === project.id && previewSelectedId ? findNodeById(project.tree, previewSelectedId) : null;
    const projectItemHasSelectedChildPart =
      isStandaloneAssemblyProject &&
      !isProjectItemSelected &&
      Boolean(previewSelectedId && selectedProjectItemNode?.modelPath && isDescendant(project.tree, previewSelectedId));
    const projectAssemblyDrawingMissing = isStandaloneAssemblyProject && project.hasAssemblyDrawing === false;
    const projectItemPaddingLeft = styleCProjectManagementLayout && project.id.startsWith('0162-') ? getProjectManagementAssemblyPaddingLeft() : undefined;
    return (
      <div key={project.id}>
        <div
          className={`group flex items-center gap-1 rounded-md px-1 py-1.5 text-sm text-ds-text-secondary transition-colors ${
            isEditing || isProjectItemSelected || projectItemHasSelectedChildPart ? '' : 'hover:bg-zinc-100'
          } ${
            isEditing ? 'bg-orange-50 text-ds-brand-primary-text' : 'cursor-pointer'
          } ${
            !isEditing && isProjectItemSelected
              ? 'bg-orange-50 text-ds-brand-primary-text'
              : !isEditing && projectItemHasSelectedChildPart
                ? 'bg-orange-50/45 text-ds-text-secondary ring-1 ring-inset ring-orange-100'
                : ''
          }`}
          style={projectItemPaddingLeft === undefined ? undefined : { paddingLeft: `${projectItemPaddingLeft}px` }}
          onClick={() => {
            if (isEditing) return;
            setPreviewProjectId(project.id);
            setPreviewSelectedId(project.tree.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingProjectId(project.id);
            setEditingProjectName(project.name);
            setTimeout(() => {
              projectInputRef.current?.focus();
              projectInputRef.current?.select();
            }, 50);
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className="size-5 shrink-0 p-0 text-ds-text-disabled"
            title={isCollapsed ? '展开' : '折叠'}
            onClick={(e) => {
              e.stopPropagation();
              toggleProjectListCollapse(project.id);
            }}
          >
            {hasChildren ? (
              isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />
            ) : (
              <span className="size-3.5" />
            )}
          </Button>
          <ThemedCheckbox
            className={getProjectListCheckboxClassName(isProjectListNodeChecked(project.tree) || isProjectListNodeIndeterminate(project.tree))}
            checked={isProjectListNodeChecked(project.tree)}
            indeterminate={isProjectListNodeIndeterminate(project.tree)}
            onChange={() => toggleProjectListChecked(project.tree)}
            onClick={(e) => e.stopPropagation()}
          />
          {project.id.startsWith('0162-') ? (
            null
          ) : (
            <FolderOpen className="size-4 shrink-0 text-amber-500" />
          )}
          {isEditing ? (
            <input
              ref={projectInputRef}
              type="text"
              value={editingProjectName}
              onChange={handleProjectNameChange}
              onBlur={handleProjectNameBlur}
              onKeyDown={handleProjectNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-ds-brand-primary"
              placeholder="项目名称"
            />
          ) : (
            <span className="ds-tree-icon-title-gap min-w-0 flex-1 truncate font-medium">{project.name}</span>
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            {project.id.startsWith('proj-') && (
              <Button
                size="sm"
                variant="ghost"
                className="size-6 p-0 text-ds-text-disabled hover:text-orange-500"
                title="导出项目"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectExport(project.id, project.name);
                }}
              >
                <Download className="size-3.5" />
              </Button>
            )}
            {project.id.startsWith('proj-') && (
              <Button
                size="sm"
                variant="ghost"
                className="size-6 p-0 text-ds-text-disabled hover:text-emerald-600"
                title="新增装配体"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModelFlow('project', project.id);
                }}
              >
                <FolderPlus className="size-3.5" />
              </Button>
            )}
            {!project.id.startsWith('proj-') && (
              <Button
                size="sm"
                variant="ghost"
                className={`size-6 p-0 ${projectAssemblyDrawingMissing ? 'text-red-500 hover:text-red-600' : 'text-ds-text-disabled hover:text-ds-text-muted'}`}
                title={projectAssemblyDrawingMissing ? '装配图纸缺失' : '图纸管理'}
                onClick={(e) => {
                  e.stopPropagation();
                  openDrawingManager(project.id);
                }}
              >
                {projectAssemblyDrawingMissing ? <FileWarning className="size-3.5" /> : <FileCog className="size-3.5" />}
              </Button>
            )}
            {!project.id.startsWith('proj-') && (
              projectAssemblyDrawingMissing ? (
                <span className="size-6 shrink-0" aria-hidden="true" />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-6 p-0 text-ds-text-disabled hover:text-orange-500"
                  title="进入工艺规划"
                  onClick={() => selectProject(project.id)}
                >
                  <SquareArrowRight className="size-3.5" />
                </Button>
              )
            )}
          </div>
        </div>
        {hasChildren && !isCollapsed && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {visibleChildren.map((child) => renderProjectListTreeNode(child, 0, project.id))}
          </div>
        )}
      </div>
    );
  };

  const flatLayout = layoutVariant !== 'classic';
  const immersiveLayout = layoutVariant === 'immersive' || layoutVariant === 'project-immersive';
  const flatProjectLayout = layoutVariant === 'flat' && Boolean(currentProject);
  const immersiveProjectLayout = immersiveLayout && Boolean(currentProject);
  const styleCProcessPlanningLayout = layoutVariant === 'immersive' && Boolean(currentProject);
  const styleDProcessPlanningLayout = layoutVariant === 'project-immersive' && Boolean(currentProject);
  const styleCProjectManagementLayout = layoutVariant === 'immersive' && !currentProject;
  const projectManagementImmersiveLayout = layoutVariant === 'project-immersive' && !currentProject;
  const styleCProjectManagementTransitionOut = workspaceTransitionPhase === 'project-exit' && styleCProjectManagementLayout;
  const projectManagementTransitionOut = workspaceTransitionPhase === 'project-exit' && projectManagementImmersiveLayout;
  const processPlanningTransitionIn = workspaceTransitionPhase === 'planning-enter' && immersiveProjectLayout;
  const processStructurePanelClassName = styleCProcessPlanningLayout
    ? `absolute left-0 top-[74px] bottom-0 z-20 w-[320px] min-w-0 gap-0 overflow-hidden rounded-none border-0 border-r border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel shadow-none backdrop-blur-md transition-[transform,opacity] duration-700 ease-out ${processPlanningTransitionIn ? 'beimei-left-panel-enter' : ''}`
    : styleDProcessPlanningLayout || projectManagementImmersiveLayout
      ? `absolute left-2 top-[80px] bottom-2 z-20 ${currentProject ? 'w-[320px]' : 'w-[300px]'} min-w-0 gap-0 overflow-hidden rounded-xl border border-white/65 bg-white/76 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-md transition-[transform,opacity] duration-700 ease-out ${projectManagementTransitionOut ? '-translate-x-[calc(100%+56px)] opacity-0' : 'translate-x-0 opacity-100'} ${processPlanningTransitionIn ? 'beimei-left-panel-enter' : ''}`
      : `${flatProjectLayout ? 'row-start-2' : ''} h-full min-h-0 min-w-0 gap-0 overflow-hidden rounded-none border-0 border-r border-slate-200/75 bg-transparent shadow-none transition-[transform,opacity] duration-700 ease-out will-change-transform transform-gpu ${styleCProjectManagementTransitionOut ? '-translate-x-[calc(100%+56px)] opacity-0' : 'translate-x-0 opacity-100'}`;
  const processTaskPanelClassName = styleCProcessPlanningLayout
    ? `absolute right-0 top-[74px] bottom-0 z-20 w-[420px] min-h-0 gap-0 overflow-hidden rounded-none border-0 border-l border-ds-border-process-planning-structure bg-white/72 shadow-none backdrop-blur-md transition-[transform,opacity] duration-700 ease-out ${processPlanningTransitionIn ? 'beimei-right-panel-enter' : ''}`
    : styleDProcessPlanningLayout || projectManagementImmersiveLayout
      ? `absolute right-2 top-[80px] bottom-2 z-20 w-[420px] min-h-0 gap-0 overflow-hidden rounded-xl border border-white/60 ${immersiveProjectLayout ? 'bg-white/76' : 'bg-ds-bg-glass-float'} shadow-lg shadow-black/5 backdrop-blur-md transition-[transform,opacity] duration-700 ease-out ${projectManagementTransitionOut ? 'translate-x-[calc(100%+56px)] opacity-0' : 'translate-x-0 opacity-100'} ${processPlanningTransitionIn ? 'beimei-right-panel-enter' : ''}`
      : flatProjectLayout
        ? 'absolute bottom-4 right-4 top-[108px] z-20 w-[420px] min-h-0 max-h-[calc(100%-124px)] gap-0 overflow-hidden rounded-xl border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md'
        : `h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 bg-transparent shadow-none transition-[transform,opacity] duration-700 ease-out will-change-transform transform-gpu ${styleCProjectManagementTransitionOut ? 'translate-x-[calc(100%+56px)] opacity-0' : 'translate-x-0 opacity-100'}`;
  const layoutMenuItems: { key: typeof layoutVariant; label: string; description: string }[] = [
    { key: 'classic', label: '样式 A', description: '经典卡片布局' },
    { key: 'flat', label: '样式 B', description: '扁平工作台布局' },
    { key: 'immersive', label: '样式 C', description: '沉浸式主版本' },
    { key: 'project-immersive', label: '样式 D', description: '项目管理沉浸版' },
  ];
  const currentLayoutLabel = layoutMenuItems.find((item) => item.key === layoutVariant)?.label ?? '样式 C';
  const componentMenuItems = [
    { label: 'Component Lab', href: '/component-lab' },
    { label: 'Component Demo', href: '/component-demo' },
    { label: 'Component System', href: '/component-system' },
    { label: 'Primitive Lab', href: '/primitive-lab' },
    { label: 'Welding Input Style', href: '/welding-input-style' },
  ];
  const getManualFeaturePanelHeight = (type: ManualFeatureExtractionTab) => {
    if (minimizedManualFeaturePanels.includes(type)) return 36;
    return type === 'weld' ? 300 : 330;
  };
  const viewportToolPanelTop = immersiveProjectLayout ? 12 : 64;
  const sortingAreaStandalone = routePath === '/生产执行/理料区视图';

  return (
    <div className="flex h-full min-h-0 flex-col bg-ds-bg-viewport">
      {!sortingAreaStandalone && (
      <div className={`${immersiveLayout ? 'relative z-[100] flex h-[56px] shrink-0 items-center px-0' : flatLayout ? 'relative z-[100] flex h-[70px] shrink-0 items-center px-3' : 'relative z-[100] flex h-[84px] shrink-0 items-center px-6'}`}>
        <div className={`${immersiveLayout ? 'ds-main-nav-immersive flex h-full w-full items-center gap-4 bg-zinc-950 px-3 text-white' : flatLayout ? 'flex h-14 w-full items-center gap-5 px-4' : 'ds-main-nav flex h-14 w-full items-center gap-5 rounded-xl px-4'}`}>
          <img
            src={`${ASSET_BASE}brand/dajie-rplus-filled-orange-256.png`}
            alt="大界 Logo"
            className="size-8 shrink-0 object-contain"
          />
          <div className="min-w-0 leading-none">
            <img
              src={robimLogoImg}
              alt="RoBIM 云平台"
              className="h-[16px] w-auto max-w-[132px] origin-bottom-left scale-[0.88] object-contain object-left"
            />
            <div className={`mt-0.5 truncate text-[14px] font-semibold [font-family:initial] ${immersiveLayout ? 'text-white' : 'text-zinc-900'}`}>RobimWeld_Assembly</div>
          </div>
          <nav className={`${immersiveLayout ? 'ml-20 flex items-center gap-3' : flatLayout ? 'ml-6 flex items-center gap-1 rounded-xl border border-transparent bg-zinc-300/18 p-1' : 'ds-main-nav-tabs flex items-center gap-1 rounded-xl p-1'}`}>
            {(
              layoutVariant === 'immersive'
                ? ['工艺规划', '虚拟仿真', '生产执行', '产能统计']
                : immersiveLayout
                  ? ['项目管理', '工艺规划', '虚拟仿真', '生产执行', '产能统计']
                  : ['工艺规划', '虚拟仿真', '生产执行', '产能统计']
            ).map((item) => {
              const active = item === '生产执行'
                ? activeMainNav === 'production-execution'
                : item === '虚拟仿真'
                  ? activeMainNav === 'virtual-simulation'
                  : item === '产能统计'
                    ? activeMainNav === 'capacity-statistics'
                    : activeMainNav === 'process-planning' && (item === '项目管理' ? !currentProject : item === '工艺规划' ? Boolean(currentProject) : false);
              const hasProcessPlanningMenu = immersiveLayout && item === '工艺规划';
              const hasVirtualSimulationMenu = immersiveLayout && item === '虚拟仿真' && simulationWorkspaces.length > 0;
              const hasMainNavMenu = hasProcessPlanningMenu || hasVirtualSimulationMenu;
              const mainNavMenuOpen = hasProcessPlanningMenu ? processPlanningMenuOpen : virtualSimulationMenuOpen;
              return (
                <div key={item} className="relative">
                  <button
                    type="button"
                    className={`group relative inline-flex h-9 items-center px-3 text-[15px] leading-none transition-all ${
                      active
                        ? immersiveLayout
                          ? 'rounded-lg border border-white/10 bg-white font-semibold text-zinc-950 shadow-[0_1px_2px_rgba(255,255,255,0.12)]'
                          : flatLayout
                          ? 'rounded-lg border border-white/70 bg-white/88 font-semibold text-zinc-950 shadow-[0_1px_2px_rgba(15,23,42,0.08)] backdrop-blur-md'
                          : 'ds-main-nav-tab-active font-semibold text-zinc-950'
                        : immersiveLayout
                          ? 'rounded-md border border-transparent font-medium text-zinc-300 hover:bg-white/10 hover:text-white'
                          : flatLayout
                          ? 'rounded-md border border-transparent font-medium text-zinc-600 hover:bg-zinc-300/45 hover:text-zinc-950'
                          : 'border border-transparent font-medium text-zinc-500 hover:bg-white/35 hover:text-zinc-900'
                    }`}
                    onClick={() => {
                      if (item === '项目管理') {
                        setActiveMainNav('process-planning');
                        updateMainNavRoute('process-planning');
                        setProcessPlanningMenuOpen(false);
                        setVirtualSimulationMenuOpen(false);
                        backToAllProjects();
                        return;
                      }
                      if (item === '生产执行') {
                        setActiveMainNav('production-execution');
                        updateMainNavRoute('production-execution');
                        setProcessPlanningMenuOpen(false);
                        setVirtualSimulationMenuOpen(false);
                        return;
                      }
                      if (item === '产能统计') {
                        setActiveMainNav('capacity-statistics');
                        updateMainNavRoute('capacity-statistics');
                        setProcessPlanningMenuOpen(false);
                        setVirtualSimulationMenuOpen(false);
                        return;
                      }
                      if (item === '虚拟仿真') {
                        if (hasVirtualSimulationMenu) {
                          setProcessPlanningMenuOpen(false);
                          setVirtualSimulationMenuOpen((open) => !open);
                          return;
                        }
                        if (!activeSimulationWorkspaceId && simulationWorkspaces.length > 0) {
                          setActiveSimulationWorkspaceId(simulationWorkspaces[simulationWorkspaces.length - 1].id);
                        }
                        setActiveMainNav('virtual-simulation');
                        updateMainNavRoute('virtual-simulation');
                        setProcessPlanningMenuOpen(false);
                        setVirtualSimulationMenuOpen(false);
                        return;
                      }
                      if (item === '工艺规划') {
                        if (activeMainNav !== 'process-planning') {
                          setActiveMainNav('process-planning');
                          updateMainNavRoute('process-planning');
                          setProcessPlanningMenuOpen(false);
                          setVirtualSimulationMenuOpen(false);
                          return;
                        }
                        if (hasProcessPlanningMenu) {
                          setProcessPlanningMenuOpen((open) => !open);
                          return;
                        }
                        setActiveMainNav('process-planning');
                        updateMainNavRoute('process-planning');
                      }
                    }}
                  >
                    {item}
                    {hasMainNavMenu && (
                      <span className={`ml-0 flex w-0 shrink-0 -translate-x-1 items-center justify-end overflow-hidden opacity-0 transition-[width,margin-left,opacity,transform] duration-200 ease-ds-standard group-hover:ml-2 group-hover:w-3.5 group-hover:translate-x-0 group-hover:opacity-100 ${
                        mainNavMenuOpen ? 'ml-2 w-3.5 translate-x-0 opacity-100' : ''
                      }`}>
                        <ChevronDown className={`size-3.5 shrink-0 transition-transform duration-200 ease-ds-standard ${mainNavMenuOpen ? 'rotate-180' : ''}`} />
                      </span>
                    )}
                  </button>
                  {hasProcessPlanningMenu && processPlanningMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-[90] w-64 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/92 py-1.5 shadow-xl shadow-black/25 backdrop-blur-md">
                      {openProcessPlanningProjects.length === 0 && (
                        <div className="px-3 py-2 text-xs text-zinc-500">暂无已打开的工艺规划</div>
                      )}
                      {openProcessPlanningProjects.map((project) => {
                        const selected = currentProjectId === project.id;
                        const projectDirty = getProjectHasUnsavedChanges(project);
                        return (
                          <div
                            key={project.id}
                            className={`flex h-9 w-full items-center gap-2 px-3 text-left text-xs transition-colors ${
                              selected
                                ? 'bg-white/12 text-white'
                                : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                            }`}
                          >
                            <button
                              type="button"
                              className="flex h-full min-w-0 flex-1 items-center text-left"
                              onClick={() => {
                                setProcessPlanningMenuOpen(false);
                                setActiveMainNav('process-planning');
                                updateMainNavRoute('process-planning');
                                selectProject(project.id);
                              }}
                            >
                              <span className="min-w-0 flex-1 truncate text-[14px] font-normal leading-5">{project.tree.id}</span>
                            </button>
                            {projectDirty ? (
                              <span className="flex w-3 shrink-0 justify-center text-sm font-semibold text-orange-500">
                                *
                              </span>
                            ) : (
                              <span className="w-3 shrink-0" />
                            )}
                            <button
                              type="button"
                              className="flex size-5 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                              title="关闭工艺规划"
                              onClick={(event) => {
                                event.stopPropagation();
                                requestCloseProcessPlanningProject(project);
                              }}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {hasVirtualSimulationMenu && virtualSimulationMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-[90] w-80 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/92 py-1.5 shadow-xl shadow-black/25 backdrop-blur-md">
                      {simulationWorkspaces.map((workspace) => {
                        const selected = activeSimulationWorkspaceId === workspace.id;
                        return (
                          <div
                            key={workspace.id}
                            className={`flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left transition-colors ${selected ? 'bg-white/12 text-white' : 'text-zinc-300 hover:bg-white/8 hover:text-white'}`}
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 flex-col items-start text-left"
                              onClick={() => activateSimulationWorkspace(workspace.id)}
                            >
                              <span className="w-full truncate text-[14px] font-normal leading-5">{workspace.displayName}</span>
                              <span className="mt-0.5 w-full truncate text-[11px] font-normal leading-4 text-zinc-400">{getSimulationNavigationTaskSubtitle(workspace)}</span>
                            </button>
                            <button
                              type="button"
                              className="flex size-5 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                              title="关闭仿真副本"
                              onClick={(event) => {
                                event.stopPropagation();
                                closeSimulationWorkspace(workspace.id);
                              }}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <div className="mx-2 my-1 border-t border-white/10" />
                      <button
                        type="button"
                        className="flex h-9 w-full items-center gap-2 px-3 text-left text-xs text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
                        onClick={openSimulationFilePicker}
                      >
                        <Plus className="size-3.5" />
                        新建仿真任务
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {layoutVariant === 'flat' && currentProject && !flatProjectLayout && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 rounded-full px-3 text-xs text-ds-brand-primary-hover hover:bg-transparent hover:text-ds-brand-primary"
                onClick={openProcessParameterModal}
              >
                <Cog className="size-3.5" />
                工艺参数设置
              </Button>
            )}
            <div ref={layoutMenuRef} className="relative shrink-0">
              <button
                type="button"
                className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium opacity-0 transition-colors ${
                  immersiveLayout
                    ? 'border-white/20 text-zinc-300 hover:border-white/35 hover:bg-white/10 hover:text-white'
                    : 'border-zinc-300/80 text-zinc-600 hover:border-zinc-400 hover:bg-white/45 hover:text-zinc-900'
                }`}
                onClick={() => setLayoutMenuOpen((open) => !open)}
              >
                {currentLayoutLabel}
                <ChevronDown className={`size-3.5 transition-transform ${layoutMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {layoutMenuOpen && (
                <div
                  className={`absolute right-0 top-[calc(100%+8px)] z-[110] w-56 overflow-hidden rounded-xl border py-1.5 text-xs shadow-xl backdrop-blur-md ${
                    immersiveLayout
                      ? 'border-white/10 bg-zinc-950/92 shadow-black/25'
                      : 'border-white/70 bg-white/94 shadow-slate-900/12'
                  }`}
                >
                  {layoutMenuItems.map((item) => {
                    const selected = layoutVariant === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                          selected
                            ? immersiveLayout
                              ? 'bg-white/12 text-white'
                              : 'bg-orange-50 text-ds-brand-primary-text'
                            : immersiveLayout
                              ? 'text-zinc-300 hover:bg-white/8 hover:text-white'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                        }`}
                        onClick={() => {
                          setLayoutVariant(item.key);
                          setSelectedPlanningProcessId(null);
                          setProcessIsolationDismissed(false);
                          setSelectedCompactProcessStepKey(null);
                          setIsolatedCompactProcessStepKey(null);
                          setCompactProcessBatchMode(false);
                          setCheckedCompactProcessStepKeys(new Set());
                          setLayoutMenuOpen(false);
                        }}
                      >
                        <span className="font-medium">{item.label}</span>
                        <span className={`text-[10px] ${selected ? immersiveLayout ? 'text-zinc-300' : 'text-orange-500' : immersiveLayout ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                  <div className={`my-1 h-px ${immersiveLayout ? 'bg-white/10' : 'bg-slate-200/80'}`} />
                  {componentMenuItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2 font-medium transition-colors ${
                        immersiveLayout
                          ? 'text-zinc-300 hover:bg-white/8 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                      }`}
                      onClick={() => setLayoutMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className={`flex min-w-0 items-center gap-2 truncate text-xs font-medium ${immersiveLayout ? 'text-zinc-300' : 'text-slate-500'}`}>
              <span className="min-w-0 truncate font-normal">煤机三大件主筋自动拼装生产线</span>
              <span className={`shrink-0 ${immersiveLayout ? 'text-zinc-500' : 'text-slate-400'}`}>V-1.0.0</span>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className={`${sortingAreaStandalone ? 'relative min-h-0 flex-1 overflow-hidden px-0 pb-0' : immersiveLayout ? 'relative min-h-0 flex-1 px-0 pb-0' : flatLayout ? 'relative min-h-0 flex-1 px-3 pb-3' : 'relative min-h-0 flex-1 px-6 pb-6'}`}>
        <div
          className={`absolute inset-0 ${activeMainNav === 'production-execution' ? 'visible' : 'invisible pointer-events-none'}`}
          aria-hidden={activeMainNav !== 'production-execution'}
        >
          <ProductionExecutionPage />
        </div>
        <div
          className={`absolute inset-0 ${activeMainNav === 'virtual-simulation' ? 'visible' : 'invisible pointer-events-none'}`}
          aria-hidden={activeMainNav !== 'virtual-simulation'}
        >
          <VirtualSimulationPage
            tasks={activeSimulationWorkspace?.tasks ?? []}
            entryTaskId={activeSimulationWorkspace?.tasks[0]?.id ?? null}
            onBackToPlanning={returnFromSimulationToPlanning}
            onImportFile={openSimulationFilePicker}
            onDeleteTask={(taskId) => {
              if (activeSimulationWorkspace) {
                deleteSimulationWorkspaceTask(activeSimulationWorkspace.id, taskId);
              }
            }}
          />
        </div>
        <div
          className={`absolute inset-0 ${activeMainNav === 'capacity-statistics' ? 'visible' : 'invisible pointer-events-none'}`}
          aria-hidden={activeMainNav !== 'capacity-statistics'}
        >
          <CapacityStatisticsPage />
        </div>
        <div
          className={`absolute inset-0 ${activeMainNav === 'process-planning' ? 'visible' : 'invisible pointer-events-none'}`}
          aria-hidden={activeMainNav !== 'process-planning'}
        >
        <div className={`${immersiveLayout ? 'flex h-full min-h-0 flex-col overflow-hidden bg-transparent' : flatLayout ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/70 bg-white/82 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur'}`}>
          <div className={`${flatLayout ? 'hidden' : 'flex h-11 shrink-0 items-center justify-between border-b border-slate-100/80 px-5'}`}>
            <div className="flex min-w-0 items-center gap-3">
              {currentProject && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 shrink-0 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  onClick={backToAllProjects}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <div className="flex min-w-0 items-center gap-1.5 text-sm">
                {currentProject ? (
                  <>
                    <span className="font-normal text-zinc-400">0162</span>
                    <ChevronRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.4} />
                    <span className="truncate font-medium text-zinc-900">{currentProject.tree.id}</span>
                    {currentProjectHasUnsavedChanges && <span className="font-medium text-ds-brand-primary-text">*</span>}
                  </>
                ) : (
                  immersiveLayout ? (
                    <span className="truncate font-medium text-zinc-900">项目管理</span>
                  ) : (
                    <>
                      <span className="font-normal text-zinc-400">工艺规划</span>
                      <ChevronRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.4} />
                      <span className="truncate font-medium text-zinc-900">项目管理</span>
                    </>
                  )
                )}
              </div>
            </div>
            {currentProject && !flatLayout && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 rounded-full px-3 text-xs text-ds-brand-primary-hover hover:bg-transparent hover:text-ds-brand-primary"
                onClick={openProcessParameterModal}
              >
                <Cog className="size-3.5" />
                工艺参数设置
              </Button>
            )}
          </div>

          <div className={`${immersiveProjectLayout || projectManagementImmersiveLayout ? 'relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[74px_minmax(0,1fr)] overflow-hidden' : flatProjectLayout ? 'relative grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] grid-rows-[64px_minmax(0,1fr)] overflow-hidden rounded-xl border border-white/70 bg-white/82 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur' : styleCProjectManagementLayout ? 'grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_420px] grid-rows-1 overflow-hidden bg-white/72' : flatLayout ? 'grid min-h-0 flex-1 grid-cols-[1fr_2fr_1fr] grid-rows-1 overflow-hidden rounded-xl border border-white/70 bg-white/82 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur' : 'grid min-h-0 flex-1 grid-cols-[1fr_2fr_1fr] grid-rows-1 overflow-hidden bg-white/72'}`}>
            {(flatProjectLayout || immersiveProjectLayout) && currentProject && (
              <div className={`${immersiveProjectLayout ? `ds-process-toolbar relative z-50 col-span-1 grid min-h-0 grid-cols-[320px_minmax(0,1fr)_420px] items-center gap-2 overflow-visible border-b border-ds-border-process-planning-structure bg-ds-bg-process-planning-toolbar px-3 backdrop-blur-sm ${processPlanningTransitionIn ? 'beimei-toolbar-enter' : ''}` : 'relative z-50 col-span-2 grid min-h-0 grid-cols-[280px_minmax(0,1fr)_400px] items-center gap-3 overflow-visible border-b border-ds-border-process-planning-structure bg-ds-bg-process-planning-toolbar px-4 backdrop-blur-sm'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`${immersiveProjectLayout ? 'size-7' : 'size-8'} shrink-0 rounded-lg p-0 text-ds-text-control-muted hover:bg-white/70 hover:text-ds-text-control-strong`}
                    onClick={backToAllProjects}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5 text-sm">
                      <span className="font-normal text-zinc-400">0162</span>
                      <ChevronRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.4} />
                      <span className="truncate font-medium text-zinc-900">{currentProject.tree.id}</span>
                      {currentProjectHasUnsavedChanges && <span className="font-medium text-ds-brand-primary-text">*</span>}
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 items-center justify-center overflow-visible px-1">
                  <div className="flex shrink-0 items-center gap-1.5">
                  {immersiveProjectLayout && (
                    <>
                      <button
                        type="button"
                        data-active={coordinateTransformOpen}
                        className={`flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border px-2.5 ds-process-toolbar-action transition-colors ${
                          coordinateTransformOpen
                            ? 'border-white/75 bg-white/86 text-ds-text-control-strong shadow-sm backdrop-blur-md hover:bg-white/92'
                            : 'border-transparent text-ds-text-control hover:bg-white/80 hover:text-ds-text-control-strong'
                        }`}
                        onClick={handleCoordinateTransformButtonClick}
                        onDoubleClick={applyCoordinateTransformGumballHack}
                      >
                        <Axis3d className="size-6" />
                        <span>坐标转换</span>
                      </button>
                      <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                    </>
                  )}
                  {[
                    {
                      type: 'weld' as const,
                      label: '焊缝特征',
                      icon: WeldFeatureIcon,
                      onAutoExtract: handleExtractWeldFeatures,
                      onManualExtract: () => openManualFeatureExtraction('weld'),
                      active: openManualFeaturePanels.includes('weld'),
                    },
                    {
                      type: 'grind' as const,
                      label: '打磨特征',
                      icon: GrindFeatureIcon,
                      onAutoExtract: handleExtractGrindFeatures,
                      onManualExtract: () => openManualFeatureExtraction('grind'),
                      active: openManualFeaturePanels.includes('grind'),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const menuOpen = featureExtractMenuOpen === item.type;
                    const itemDisabled = item.type !== 'weld' && !hasCreatedWeldFeatures();
                    const toneClassName =
                        itemDisabled
                            ? 'cursor-not-allowed border-transparent text-ds-text-control-disabled focus:outline-none focus-visible:outline-none'
                        : item.active || menuOpen
                        ? 'border-white/75 bg-white/86 text-ds-text-control-strong shadow-sm backdrop-blur-md hover:bg-white/92'
                        : 'border-transparent text-ds-text-control hover:bg-white/80 hover:text-ds-text-control-strong';
                    return (
                      <div key={item.label} className="flex shrink-0 items-center gap-2">
	                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-disabled={itemDisabled}
                            data-active={item.active || menuOpen}
                            className={`group flex ${immersiveProjectLayout ? 'h-16 min-w-[82px]' : 'h-14 min-w-[78px]'} shrink-0 flex-col items-center justify-center gap-2 rounded-lg border px-2.5 ds-process-toolbar-action transition-colors ${toneClassName}`}
                            onClick={() => {
                              if (itemDisabled) {
                                showToast('请先生成焊接特征', 'error');
                                return;
                              }
                              setFeatureExtractMenuOpen((open) => open === item.type ? null : item.type);
                            }}
	                          >
	                            <Icon className={immersiveProjectLayout ? 'size-6' : 'size-5'} />
	                            <span className="relative block w-16 text-center">
	                              <span className={`block transition-transform duration-150 ${menuOpen ? '-translate-x-2' : 'group-hover:-translate-x-2'}`}>
	                                {item.label}
	                              </span>
	                              <ChevronDown className={`absolute right-0 top-1/2 size-3 -translate-y-1/2 transition-[opacity,transform] duration-150 ${menuOpen ? 'rotate-180 opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
	                            </span>
	                          </button>
                          {menuOpen && (
                            <div className="absolute left-1/2 top-[calc(100%+6px)] z-[80] w-32 -translate-x-1/2 overflow-hidden rounded-xl border border-white/80 bg-white/96 py-1 shadow-lg shadow-black/5 backdrop-blur-md">
                              {[
                                { label: '自动提取', onClick: item.onAutoExtract },
                                { label: '手动提取', onClick: item.onManualExtract },
                              ].map((menuItem) => (
                                <button
                                  key={menuItem.label}
                                  type="button"
                                  className="flex h-8 w-full items-center justify-center px-3 text-center text-xs text-ds-text-control transition-colors hover:bg-orange-50 hover:text-ds-brand-primary-text"
                                  onClick={() => {
                                    menuItem.onClick();
                                    setFeatureExtractMenuOpen(null);
                                  }}
                                >
                                  {menuItem.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    aria-disabled={!hasCreatedWeldFeatures()}
                    data-active={Boolean(assemblyDatumModal?.open)}
                    className={`flex ${immersiveProjectLayout ? 'h-16 min-w-[82px]' : 'h-14 min-w-[78px]'} shrink-0 flex-col items-center justify-center gap-2 rounded-lg border px-2.5 ds-process-toolbar-action transition-colors ${
                      !hasCreatedWeldFeatures()
                        ? 'cursor-not-allowed border-transparent text-ds-text-control-disabled focus:outline-none focus-visible:outline-none'
                        : assemblyDatumModal?.open
                        ? 'border-white/75 bg-white/86 text-ds-text-control-strong shadow-sm backdrop-blur-md hover:bg-white/92'
                        : 'border-transparent text-ds-text-control hover:bg-white/80 hover:text-ds-text-control-strong'
                    }`}
                    onClick={() => {
                      if (!hasCreatedWeldFeatures()) {
                        showToast('请先生成焊接特征', 'error');
                        return;
                      }
                      setFeatureExtractMenuOpen(null);
                      handleOpenAssemblyDatumModal();
                    }}
                  >
                    <AssemblyFeatureIcon className={immersiveProjectLayout ? 'size-6' : 'size-5'} />
                    <span>装配特征</span>
                  </button>
                  {(styleCProcessPlanningLayout || styleDProcessPlanningLayout) && (
                    <>
                      <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                      <button
                        type="button"
                        className={`flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action transition-colors hover:bg-white/80 ${currentProjectStyleCNeedsRegeneration ? 'text-ds-brand-primary' : 'text-ds-text-control hover:text-ds-text-control-strong'}`}
                        onClick={() => requestGenerateProcessSequence(styleCProcessPlanningLayout)}
                        title={currentProjectStyleCNeedsRegeneration ? '工序列表需要重新生成' : undefined}
                      >
                        <SlidersHorizontal className="size-6" />
                        <span>{styleCProcessPlanningLayout && currentProjectStyleCTasksGenerated ? '重新生成' : '一键生成'}</span>
                      </button>
                      {styleDProcessPlanningLayout && (
                        <button
                          type="button"
                          className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                          onClick={() => openAddProcessTaskDialog()}
                        >
                          <Plus className="size-6" />
                          <span>新增任务</span>
                        </button>
                      )}
                    </>
                  )}
                  </div>
                </div>
                <div className="flex min-w-0 items-center justify-end gap-2">
                  <button
                    type="button"
                    className={`${immersiveProjectLayout ? 'h-16 min-w-[116px]' : 'h-14 min-w-[110px]'} flex shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong`}
                    onClick={() => setFeatureDetachedView((value) => !value)}
                  >
                    <ListTree className={immersiveProjectLayout ? 'size-6' : 'size-5'} />
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      特征独立显示
                      <span
                        role="switch"
                        aria-checked={featureDetachedView}
                        aria-label="切换特征独立显示"
                        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                        featureDetachedView ? 'bg-ds-brand-primary' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block size-3 rounded-full bg-white shadow-sm transition-transform ${
                            featureDetachedView ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                        />
                      </span>
                    </span>
                  </button>
                  <div className={`${immersiveProjectLayout ? 'h-9' : 'h-8'} w-px shrink-0 bg-ds-bg-process-planning-separator`} />
                  <button
                    type="button"
                    className={`${immersiveProjectLayout ? 'h-16 min-w-[92px]' : 'h-14 min-w-[88px]'} flex shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong`}
                    onClick={openProcessParameterModal}
                  >
                    <Cog className={immersiveProjectLayout ? 'size-6' : 'size-5'} />
                    <span>工艺参数设置</span>
                  </button>
                  {immersiveProjectLayout && (
                    <>
                      <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                      <button
                        type="button"
                        disabled={!currentProjectHasUnsavedChanges}
                        className={`flex h-16 min-w-[70px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action transition-colors ${
                          currentProjectHasUnsavedChanges
                            ? 'text-ds-brand-primary hover:bg-white/80 hover:text-ds-brand-primary'
                            : 'cursor-not-allowed text-ds-text-control-disabled'
                        }`}
                        onClick={saveCurrentProcessPlanning}
                        title={currentProjectHasUnsavedChanges ? '当前工艺规划有未保存修改' : '当前无未保存修改'}
                      >
                        <Save className="size-6 text-current" />
                        <span>保存</span>
                      </button>
                      <button
                        type="button"
                        className="flex h-16 w-[70px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                        onClick={() => {
                          if (styleCProcessPlanningLayout) {
                            handlePlanningProcessExport();
                            return;
                          }
                          if (currentProject) {
                            handleProjectExport(currentProject.id, currentProject.tree.id);
                          }
                        }}
                      >
                        <Download className="size-6" />
                        <span className="whitespace-nowrap">{styleCProcessPlanningLayout ? planningProcessExportLabel : '导出'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {projectManagementImmersiveLayout && (
              <div className={`relative z-50 col-span-1 grid min-h-0 grid-cols-[240px_minmax(0,1fr)_240px] items-center gap-2 overflow-visible border-0 bg-zinc-100/30 px-3 backdrop-blur-sm transition-[transform,opacity] duration-700 ease-out ${projectManagementTransitionOut ? '-translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="flex min-w-0 items-center gap-1.5 text-sm">
                  <span className="truncate font-medium text-zinc-900">项目管理</span>
                </div>
                <div className="flex min-w-0 items-center justify-center gap-2">
                  <button
                    type="button"
                    className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                    onClick={handleCreateProject}
                  >
                    <Plus className="size-6" />
                    <span>新建项目</span>
                  </button>
                  <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                  <button
                    type="button"
                    className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                    onClick={handleProjectManagementImport}
                  >
                    <Import className="size-6" />
                    <span>导入项目</span>
                  </button>
                </div>
                <div />
              </div>
            )}
            <Card className={processStructurePanelClassName}>
          <CardHeader className={`${flatProjectLayout || immersiveProjectLayout || projectManagementImmersiveLayout ? 'hidden' : 'flex'} ${styleCProjectManagementLayout ? 'h-9 border-b border-zinc-200/75' : 'h-12 border-b border-slate-100'} shrink-0 items-center p-0 pb-0!`}>
            {currentProject ? (
                <div className="flex h-full w-full items-center gap-2 px-4">
                <div className="flex min-w-0 items-center gap-1.5">
                  {flatLayout ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mr-1 size-7 shrink-0 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        onClick={backToAllProjects}
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <span className="text-sm font-normal text-zinc-400">0162</span>
                      <ChevronRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.4} />
                      <span className="truncate text-sm font-medium text-zinc-900">{currentProject.tree.id}</span>
                      {currentProjectHasUnsavedChanges && <span className="text-sm font-medium text-ds-brand-primary-text">*</span>}
                    </>
                  ) : (
                    <span className="text-base font-semibold text-slate-900">模型结构</span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                    disabled={checkedIds.size === 0}
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="size-3.5" />
                    删除{checkedIds.size > 0 ? ` (${checkedIds.size})` : ''}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`flex h-full w-full items-center gap-2 ${styleCProjectManagementLayout ? 'px-3' : 'px-4'}`}>
                <CardTitle className={styleCProjectManagementLayout ? 'text-xs font-medium text-slate-500' : 'text-base'}>
                  {immersiveLayout ? (
                    <span className={styleCProjectManagementLayout ? 'truncate text-xs font-medium text-slate-500' : 'truncate text-sm font-semibold text-zinc-900'}>项目管理</span>
                  ) : flatLayout ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="text-sm font-normal text-zinc-400">工艺规划</span>
                      <ChevronRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.4} />
                      <span className="truncate text-sm font-medium text-zinc-900">项目管理</span>
                    </span>
                  ) : (
                    '项目管理'
                  )}
                </CardTitle>
	                <Button
	                  size="sm"
	                  variant={styleCProjectManagementLayout ? 'ghost' : 'outline'}
	                  className={`ml-auto h-7 gap-1 px-2 text-xs ${styleCProjectManagementLayout ? 'text-slate-500 hover:bg-transparent hover:text-slate-800' : ''}`}
	                  onClick={handleCreateProject}
	                >
                  <Plus className="size-3.5" />
                  新建
                </Button>
	                <Button size="sm" variant={styleCProjectManagementLayout ? 'ghost' : 'outline'} className={`h-7 gap-1 px-2 text-xs ${styleCProjectManagementLayout ? 'text-slate-500 hover:bg-transparent hover:text-slate-800' : ''}`} onClick={handleProjectManagementImport}>
                  <FolderOpen className="size-3.5" />
                  导入
                </Button>
                {checkedIds.size === 0 ? (
                  <Tooltip title="请先选中零件模型">
                    <span>
                      <Button
                        size="sm"
                        variant="outline"
	                        className={`h-7 gap-1 px-2 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 ${styleCProjectManagementLayout ? 'hover:bg-transparent' : 'hover:bg-red-50'}`}
                        disabled
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </Button>
                    </span>
                  </Tooltip>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
	                      className={`h-7 gap-1 px-2 text-xs text-red-600 hover:text-red-700 ${styleCProjectManagementLayout ? 'hover:bg-transparent' : 'hover:bg-red-50'}`}
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="size-3.5" />
                    删除 ({checkedIds.size})
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="relative min-h-0 flex-1 p-0 !pb-0">
            {(immersiveProjectLayout || projectManagementImmersiveLayout) && (
              <div
                className={`relative z-10 flex h-9 shrink-0 items-center gap-2 border-b ${styleCProcessPlanningLayout || styleCProjectManagementLayout ? 'border-ds-border-process-planning-structure' : 'border-white/55'} px-3 transition-shadow duration-200 ${
                  projectStructureScrolled
                    ? 'bg-ds-bg-sticky-overlap shadow-ds-sticky-overlap backdrop-blur-[var(--ds-blur-sticky-overlap)]'
                    : 'bg-transparent shadow-none'
                }`}
              >
                <span className="text-xs font-medium text-ds-text-control">{currentProject ? '零件结构' : '项目结构'}</span>
                <div className="ml-auto flex items-center gap-1">
                  {selectedPlanningProcess && (
                    <button
                      type="button"
                      className="h-7 rounded-md px-1.5 text-[11px] font-medium text-ds-brand-primary-text transition-colors hover:bg-orange-50 hover:text-ds-brand-primary-text"
	                      onClick={() => {
	                        if (processIsolationActive) {
	                          setProcessIsolationDismissed(true);
	                          setIsolatedCompactProcessStepKey(null);
	                          setSelectedId('');
	                          return;
	                        }
	                        setProcessIsolationDismissed(false);
	                        setIsolatedCompactProcessStepKey(null);
	                        setSelectedId('');
	                      }}
                    >
                      {processIsolationActive ? '显示全部' : '隔离显示'}
                    </button>
                  )}
                  <Tooltip title={checkedIds.size === 0 ? '请先勾选零件' : '删除已勾选零件'}>
                    <span>
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-transparent hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                      disabled={checkedIds.size === 0}
                      onClick={handleBatchDelete}
                      aria-label={checkedIds.size === 0 ? '请先勾选零件' : `删除已勾选零件 ${checkedIds.size}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                  </Tooltip>
                </div>
              </div>
            )}
            <ScrollArea
              className={immersiveProjectLayout || projectManagementImmersiveLayout ? 'h-[calc(100%-36px)]' : 'h-full'}
              onScrollCapture={(event) => {
                if (!(immersiveProjectLayout || projectManagementImmersiveLayout)) return;
                const target = event.target as HTMLElement;
                if (target.dataset.slot !== 'scroll-area-viewport') return;
                const nextScrolled = target.scrollTop > 0;
                setProjectStructureScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
              }}
            >
              {currentProject && objectTree ? (
                <div className={`min-w-0 space-y-4 p-3 ${(immersiveProjectLayout || projectManagementImmersiveLayout) ? 'pb-0' : 'pb-20'}`}>
                  <div className="space-y-1">
                    {renderTreeNode(objectTree, 0, true, featureDetachedView)}
                    {featureDetachedView && (() => {
                      const allFeatureNodes = objectTree ? collectAllFeatureNodes(objectTree) : [];
                      if (allFeatureNodes.length === 0) return null;
                      const grindNodes = allFeatureNodes.filter((f) => f.featureType === 'grind');
                      const weldNodes = allFeatureNodes.filter((f) => f.featureType === 'weld');
                      const datumNodes = allFeatureNodes.filter((f) => f.featureType === 'datum');
                      const groups: { groupId: string; label: string; type: keyof typeof detachedFeatureTheme; featureNodes: TreeNode[] }[] = [];
                      if (weldNodes.length > 0) groups.push({ groupId: 'feature-group-weld', label: '焊接特征', type: 'weld', featureNodes: weldNodes });
                      if (grindNodes.length > 0) groups.push({ groupId: 'feature-group-grind', label: '打磨特征', type: 'grind', featureNodes: grindNodes });
                      if (datumNodes.length > 0) groups.push({ groupId: 'feature-group-datum', label: '装配特征', type: 'datum', featureNodes: datumNodes });
                      return groups.map((group) => {
                        const groupCollapsed = collapsedIds.has(group.groupId);
                        const groupTheme = detachedFeatureTheme[group.type];
                        const GroupIcon = groupTheme.icon;
                        const groupProcessIsolationClassName = processIsolationActive
                          ? getProcessIsolationOpacityClassName(Math.max(...group.featureNodes.map((featureNode) => getProcessIsolationOpacity(featureNode.id))))
                          : '';
                        return (
                          <div key={group.groupId}>
                            <div
                              className={`group grid min-h-7 w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-1 overflow-hidden rounded-md bg-ds-bg-process-planning-tree-group pr-2 text-[11px] text-zinc-500 transition-[colors,opacity] hover:bg-ds-bg-process-planning-tree-group-hover ${groupProcessIsolationClassName}`}
                              style={{ paddingLeft: '8px' }}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-6 shrink-0 p-0"
                                title={groupCollapsed ? '展开' : '折叠'}
                                onClick={() => {
                                  setCollapsedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(group.groupId)) next.delete(group.groupId);
                                    else next.add(group.groupId);
                                    return next;
                                  });
                                }}
                              >
                                {groupCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                              </Button>
                              <GroupIcon className="size-4 shrink-0 text-slate-500" />
                              <span className="ds-tree-icon-title-gap min-w-0 flex-1 truncate font-normal text-zinc-500">{group.label}</span>
                              <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-none ${groupTheme.countBadge}`}>
                                {group.featureNodes.length}
                              </span>
                            </div>
                            {!groupCollapsed && (
                              <div>
                                {group.featureNodes.map((featureNode) => {
                                  const featureSelected = selectedId === featureNode.id;
                                  const featureHighlighted = relatedFeatureHighlightIds.has(featureNode.id);
                                  const featureHidden = hiddenIds.has(featureNode.id);
                                  const featureProcessIsolationClassName = processIsolationActive
                                    ? getProcessIsolationOpacityClassName(getProcessIsolationOpacity(featureNode.id))
                                    : '';
                                  return (
                                    <div key={featureNode.id}>
                                      <div
                                        className={`group grid h-8 w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-1 overflow-visible rounded-md pr-2 text-xs transition-[colors,opacity] ${
                                          featureSelected
                                            ? 'bg-orange-50 text-ds-brand-primary-text'
                                            : featureHighlighted
                                              ? 'bg-orange-50/50 text-slate-700 ring-1 ring-inset ring-orange-100'
                                              : 'hover:bg-ds-bg-process-planning-tree-group-hover'
                                        } ${featureHidden ? 'text-ds-text-structure-hidden' : ''} ${featureProcessIsolationClassName}`}
                                        style={{ paddingLeft: '36px' }}
                                        onClick={() => selectTreeNode(featureNode)}
                                      >
                                        <ThemedCheckbox
                                          className={`shrink-0 transition-opacity ${isFeatureChecked(featureNode) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                          checked={isFeatureChecked(featureNode)}
                                          onChange={() => toggleFeatureChecked(featureNode)}
                                          onClick={(event) => event.stopPropagation()}
                                        />
                                        <div className="w-0 shrink-0" />
                                        <span className="min-w-0 flex-1 truncate">
                                          {featureNode.name}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="size-6 shrink-0 p-0 opacity-75"
                                          title={featureHidden ? '显示特征' : '隐藏特征'}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            toggleHidden(featureNode.id);
                                          }}
                                        >
                                          {featureHidden ? (
                                            <EyeOff className="size-3.5 text-ds-text-structure-hidden" />
                                          ) : (
                                            <Eye className="size-3.5 text-ds-text-disabled" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <div className="min-w-0 space-y-1 p-3">
                  {group0162.length > 0 && (
                    <div>
                      <div
                                        className="group flex cursor-pointer items-center gap-1 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-ds-bg-process-planning-tree-group-hover"
                        style={styleCProjectManagementLayout ? { paddingLeft: `${getProjectManagementGroupPaddingLeft()}px` } : undefined}
                        onClick={() => toggleProjectListCollapse('group-0162')}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-5 shrink-0 p-0 text-slate-400"
                          title={group0162Collapsed ? '展开' : '折叠'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectListCollapse('group-0162');
                          }}
                        >
                          {group0162Collapsed ? (
                            <ChevronRight className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </Button>
                        <ThemedCheckbox
                          className={getProjectListCheckboxClassName(isProjectGroupChecked(group0162) || isProjectGroupIndeterminate(group0162))}
                          checked={isProjectGroupChecked(group0162)}
                          indeterminate={isProjectGroupIndeterminate(group0162)}
                          onChange={() => toggleProjectGroupChecked(group0162)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FolderOpen className="size-4 shrink-0 text-amber-500" />
                        <span className="ds-tree-icon-title-gap min-w-0 flex-1 truncate font-medium">0162</span>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-6 p-0 text-slate-400 hover:text-orange-500"
                            title="导出项目"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectExport('group-0162', '0162');
                            }}
                          >
                            <Download className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-6 p-0 text-slate-400 hover:text-emerald-600"
                            title="新增装配体"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateModelFlow('group0162');
                            }}
                          >
                            <FolderPlus className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      {!group0162Collapsed && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {group0162.map(renderProjectItem)}
                        </div>
                      )}
                    </div>
                  )}
                  {otherProjects.map(renderTopLevelProjectGroup)}
                </div>
              )}
            </ScrollArea>
            {currentProject && !flatProjectLayout && !immersiveProjectLayout && (
              <div className="pointer-events-none absolute bottom-4 right-4 z-10">
                <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-medium text-slate-700">特征独立显示</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={featureDetachedView}
                    aria-label="切换特征独立显示"
                    className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                      featureDetachedView ? 'bg-ds-brand-primary' : 'bg-slate-300'
                    }`}
                    onClick={() => setFeatureDetachedView((value) => !value)}
                  >
                    <span
                      className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                        featureDetachedView ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
            {currentProject && <ScrollPanelEdge className="z-10 shadow-ds-footer-up" />}
          </CardContent>
            </Card>

        <Card className={`${immersiveProjectLayout || projectManagementImmersiveLayout ? 'h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 border-r border-slate-200/75 bg-transparent shadow-none' : flatProjectLayout ? 'row-start-2 col-start-2 min-w-0' : ''} h-full min-h-0 min-w-0 gap-0 overflow-hidden rounded-none border-0 border-r border-slate-200/75 bg-transparent shadow-none`}>
          <CardContent className="min-h-0 flex-1 p-0 !pb-0">
            <div className="relative h-full min-h-[240px] bg-ds-bg-viewport">
              {currentProject && !flatProjectLayout && !immersiveProjectLayout && (
                <FeatureExtractionToolbar
                  onOpenManualWeld={() => openManualFeatureExtraction('weld')}
                  onOpenManualGrind={() => openManualFeatureExtraction('grind')}
                  onOpenDatum={() => {
                    handleOpenAssemblyDatumModal();
                  }}
                  onAutoExtractWeld={handleExtractWeldFeatures}
                  onAutoExtractGrind={handleExtractGrindFeatures}
                  activeManualType={manualFeatureExtractionOpen ? activeManualFeatureTab : assemblyDatumModal?.open ? 'datum' : null}
                  hasWeldFeatures={weldFeatureItems.length > 0}
                  onBlocked={() => showToast('请先生成焊接特征', 'error')}
                />
              )}
              {currentProject && immersiveProjectLayout && compactProcessFilterOpen && (
                <div className="pointer-events-auto absolute right-[440px] top-3 z-40 w-[280px] overflow-visible rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Filter className="size-4 text-orange-500" />
                        <span className="text-xs font-medium text-slate-800">任务筛选</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      onClick={() => setCompactProcessFilterOpen(false)}
                      aria-label="关闭任务筛选"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5 p-3">
                    <div>
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <div className="text-[11px] text-slate-500">筛选方式</div>
                        <div className="min-w-0 flex-1">
                          <ObjectMultiSelect
                            items={styleCProcessPlanningLayout
                              ? compactProcessFilterKindOptions.map((option) => option.id === 'type' ? { ...option, name: '任务类型' } : option)
                              : compactProcessFilterKindOptions}
                            selectedIds={compactProcessFilterKinds}
                            placeholder="请选择筛选方式"
                            size="sm"
                            onChange={(nextIds) => setCompactProcessFilterKinds(nextIds as CompactProcessFilterKind[])}
                          />
                        </div>
                      </div>
                      <div className="mt-3 h-px bg-slate-200/80" />
                    </div>
                    {compactProcessFilterKinds.map((kind) => {
                      const valueOptions = getCompactProcessFilterValueOptions(kind);
                      return (
                        <div key={kind} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                          <div className="text-[11px] text-slate-500">
                            {kind === 'part'
                              ? '零件名称'
                              : kind === 'type'
                                ? styleCProcessPlanningLayout ? '任务类型' : '工序类型'
                                : kind === 'weld-feature'
                                  ? '焊缝特征'
                                  : kind === 'grind-feature'
                                    ? '打磨特征'
                                    : '装配特征'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <ObjectMultiSelect
                              items={valueOptions}
                              selectedIds={compactProcessFilterValues[kind] ?? []}
                              placeholder={valueOptions.length > 0 ? '请选择筛选值' : '暂无可筛选项'}
                              size="sm"
                              onChange={(nextValues) =>
                                setCompactProcessFilterValues((currentValues) => ({
                                  ...currentValues,
                                  [kind]: nextValues,
                                }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100/80 pt-3">
                      <span className="text-[11px] text-slate-400">
                        显示 {compactProcessVisibleEntries.length} / {processSteps.length} 项
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        disabled={!compactProcessFilterActive}
                        onClick={() => {
                          setCompactProcessFilterKinds([]);
                          setCompactProcessFilterValues({});
                        }}
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {coordinateTransformOpen && currentProject && objectTree && (
                <CoordinateTransformPanel
                  parts={leafParts}
                  selectedPartIds={coordinateTransformPartIds}
                  selectedPivotPoint={coordinateTransformSelectedPivotPoint}
                  pivotOverride={coordinateTransformPivotOverride}
                  offset={coordinateTransformOffset}
                  immersive={immersiveProjectLayout}
                  onPartIdsChange={(nextIds) => {
                    setCoordinateTransformPartIds(nextIds);
                    setCoordinateTransformSelectedPivotPoint(null);
                    const overrideSourceIds = coordinateTransformPivotOverride?.sourcePartIds ?? [coordinateTransformPivotOverride?.partId].filter(Boolean);
                    if (overrideSourceIds.some((partId) => !nextIds.includes(partId))) setCoordinateTransformPivotOverride(null);
                  }}
                  onSetPivot={setCoordinateTransformPivotPoint}
                  onOffsetChange={updateCoordinateTransformOffset}
                  onApply={applyCoordinateTransform}
                  onCancel={cancelCoordinateTransform}
                />
              )}
              {manualFeatureExtractionOpen && currentProject && objectTree && openManualFeaturePanels.map((panelType) => {
                const leafParts = collectLeafParts(objectTree);
                const bothSelected = Boolean(manualFeaturePartAId && manualFeaturePartBId);
                const adjacent = bothSelected && manualFeaturePartAId && manualFeaturePartBId
                  ? arePartsAdjacent(manualFeaturePartAId, manualFeaturePartBId, objectTree)
                  : false;
                return (
                  <ManualFeatureExtractionPanel
                    key={panelType}
                    type={panelType}
                    parts={leafParts}
                    weldFeatures={weldFeatureItems}
                    minimized={minimizedManualFeaturePanels.includes(panelType)}
                    immersive={immersiveProjectLayout}
                    top={viewportToolPanelTop}
                    height={getManualFeaturePanelHeight(panelType)}
                    partAId={manualFeaturePartAId}
                    partBId={manualFeaturePartBId}
                    grindWeldFeatureId={manualGrindWeldFeatureId}
                    selectedFaceCount={manualWeldSelectedFaceIds.length}
                    generated={manualWeldGenerated}
                    faceSelectionActive={manualWeldFaceSelectionActive}
                    candidateId={manualFeatureCandidateId}
                    candidateCount={manualWeldCandidates.length}
                    error={manualFeatureError}
                    adjacent={adjacent}
                    onActivate={() => setActiveManualFeatureTab(panelType)}
                    onToggleMinimized={() => toggleManualFeaturePanelMinimized(panelType)}
                    onClose={() => closeManualFeatureExtraction(panelType)}
                    onPartChange={(partKey, nextId) => {
                      if (partKey === 'A') setManualFeaturePartAId(nextId);
                      else setManualFeaturePartBId(nextId);
                      resetManualFeatureCandidate();
                    }}
                    onGrindWeldFeatureChange={selectManualGrindWeldFeature}
                    onStartFaceSelection={startManualWeldFaceSelection}
                    onGenerateWeld={generateManualWeldFromFaces}
                    onReset={resetManualFeatureSelection}
                    onConfirm={confirmManualFeatureExtraction}
                  />
                );
              })}
              {manualFeatureExtractionOpen && currentProject && objectTree && manualFeaturePartAId && manualFeaturePartBId && arePartsAdjacent(manualFeaturePartAId, manualFeaturePartBId, objectTree) && (
                <div className="pointer-events-none absolute inset-0 z-10">
                </div>
              )}
              {magnetParameterPanel && (() => {
                const magnet = pickMagnetDefinitions.find((item) => item.name === magnetParameterPanel.magnetName) ?? pickMagnetDefinitions[0];
                const activeStep = currentProject?.processSteps.find((item) => item.id === magnetParameterPanel.stepId);
                const activePickConfig = activeStep?.pickConfig ?? createEmptyPickProcessConfig();
                const panelGripperType = activePickConfig.gripperType ?? gripperType;
                const magnetSetting = activePickConfig.magnetSettings?.[magnet.name] ?? createDefaultPickMagnetSettings(panelGripperType)[magnet.name];
                const updatePanelMagnetSetting = (updater: (setting: PickMagnetSetting) => PickMagnetSetting) =>
                  updatePickConfigWithRecalculation(
                    magnetParameterPanel.stepId,
                    (config) => ({ ...config, magnetSettings: { ...config.magnetSettings, [magnet.name]: updater(config.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings(config.gripperType)[magnet.name]) } }),
                    { markMagnet: true, markPoint: true, preview: true }
                  );
                return (
                  <MagnetParameterPanelView
                    magnetName={magnet.name}
                    gripperType={panelGripperType}
                    setting={magnetSetting}
                    minimized={magnetParameterPanel.minimized}
                    immersive={immersiveProjectLayout}
                    top={viewportToolPanelTop}
                    onToggleMinimized={() => setMagnetParameterPanel((prev) => (prev ? { ...prev, minimized: !prev.minimized } : prev))}
                    onClose={() => setMagnetParameterPanel(null)}
                    onSettingChange={updatePanelMagnetSetting}
                    onReset={() => updatePanelMagnetSetting(() => createDefaultPickMagnetSettings(panelGripperType)[magnet.name])}
                  />
                );
              })()}
              {pickPathPosePreview && currentProject && (() => {
                const previewStep = currentProject.processSteps.find((step) => step.id === pickPathPosePreview.stepId);
                const previewSegmentIndex =
                  pickPathModal?.stepId === pickPathPosePreview.stepId ? pickPathModal.segmentIndex ?? 0 : 0;
                const previewPoints = getProcessPathPoints(
                  previewStep,
                  previewSegmentIndex,
                  pickPathPosePreview.combinedWeldMode
                );
                const previewItems = getPickPathPosePreviewItems(pickPathPosePreview.pointIndex, previewPoints);
                if (previewItems.length === 0 || previewStep?.type === 'polish') return null;
                return (
                  <div className="pointer-events-none absolute inset-0 z-10 bg-blue-950/10 backdrop-blur-[1px]">
                    <div className="absolute left-4 top-4 rounded-xl border border-blue-100/80 bg-white/86 px-3 py-2 shadow-lg shadow-blue-950/10 backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <Rotate3D className="size-3.5 text-blue-500" />
                        <span>{getPickPathPosePreviewTitle(pickPathPosePreview.pointIndex)}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">遮罩 demo · 待接入真实 TCP 姿态模型</div>
                    </div>
                    {previewItems.map(({ anchor, pointIndex }) => {
                      const point =
                        pickPathPosePreview.source === 'result'
                          ? getProcessResultPosePreviewPoint(
                            previewStep,
                            selectedResultPointPreview?.pointIndex ?? pointIndex,
                            pickPathPosePreview.combinedWeldMode
                          )
                          : previewPoints[pointIndex];
                      const rotation = getMockToolHeadRotation(anchor.rotate, point);
                      return (
                        <div
                          key={anchor.label}
                          className="absolute transition-transform duration-150 ease-out"
                          style={{ top: anchor.top, left: anchor.left }}
                        >
                          <div
                            className="relative h-11 w-16 rounded-[6px] border border-blue-300 bg-blue-500/18 shadow-lg shadow-blue-950/15 backdrop-blur-sm transition-transform duration-150 ease-out"
                            style={{ transform: `${getMockToolHeadTranslate(point)} rotate(${rotation}deg)` }}
                          >
                            <div className="absolute left-1/2 top-1/2 h-1 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
                            <div className="absolute right-1 top-1/2 size-3 -translate-y-1/2 rounded-sm bg-orange-400" />
                          </div>
                          <div className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-center text-[10px] font-medium text-blue-700 shadow-sm">
                            {anchor.label}
                            {point ? ` · RZ ${point.rz || '0.0'}°` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {weldSegmentPreview && currentProject && (() => {
                const previewStep = currentProject.processSteps.find((step) => step.id === weldSegmentPreview.stepId);
                const posePoints = normalizeWeldPosePoints(previewStep?.weldConfig?.posePoints);
                const startIndex = weldSegmentPreview.segmentIndex * 2;
                const endIndex = startIndex + 1;
                const startPoint = posePoints[startIndex];
                const endPoint = posePoints[endIndex];
                const segmentVisuals = [
                  { top: '30%', left: '32%', width: '25%', rotate: -10 },
                  { top: '42%', left: '45%', width: '28%', rotate: 4 },
                  { top: '55%', left: '35%', width: '30%', rotate: 13 },
                  { top: '66%', left: '52%', width: '26%', rotate: -6 },
                ];
                const visual = segmentVisuals[weldSegmentPreview.segmentIndex] ?? segmentVisuals[0];
                const poseAnchors = [
                  { label: `P${startIndex + 1} 起点`, top: visual.top, left: visual.left, point: startPoint, offset: -12 },
                  { label: `P${endIndex + 1} 终点`, top: visual.top, left: `calc(${visual.left} + ${visual.width})`, point: endPoint, offset: 12 },
                ];
                return (
                  <div className="pointer-events-none absolute inset-0 z-10 bg-amber-950/10 backdrop-blur-[1px]">
                    <div className="absolute left-4 top-4 rounded-xl border border-amber-100/80 bg-white/86 px-3 py-2 shadow-lg shadow-amber-950/10 backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <Flame className="size-3.5 text-amber-500" />
                        <span>高亮焊缝段{weldSegmentPreview.segmentIndex + 1}并回显起终点工具头位姿</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">遮罩 demo · 待接入真实焊缝段几何与 TCP 姿态</div>
                    </div>
                    <div
                      className="absolute h-2 origin-left rounded-full bg-amber-400 shadow-lg shadow-amber-950/20"
                      style={{ top: visual.top, left: visual.left, width: visual.width, transform: `rotate(${visual.rotate}deg)` }}
                    />
                    {poseAnchors.map((anchor) => (
                      <div
                        key={anchor.label}
                        className="absolute transition-transform duration-150 ease-out"
                        style={{ top: anchor.top, left: anchor.left, transform: getMockToolHeadTranslate(anchor.point, anchor.offset) }}
                      >
                        <div
                          className="relative h-10 w-14 rounded-[6px] border border-amber-300 bg-amber-500/20 shadow-lg shadow-amber-950/15 backdrop-blur-sm transition-transform duration-150 ease-out"
                          style={{ transform: `rotate(${getMockToolHeadRotation(visual.rotate, anchor.point)}deg)` }}
                        >
                          <div className="absolute left-1/2 top-1/2 h-1 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500" />
                          <div className="absolute right-1 top-1/2 size-3 -translate-y-1/2 rounded-sm bg-ds-brand-primary" />
                        </div>
                        <div className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-center text-[10px] font-medium text-amber-700 shadow-sm">
                          {anchor.label} · RZ {anchor.point?.rz || '0.0'}°
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {assemblyDatumModal?.open && currentProject && objectTree && (
                <AssemblyDatumExtractionPanel
                  modal={assemblyDatumModal}
                  parts={collectLeafParts(objectTree)}
                  immersive={immersiveProjectLayout}
                  adjacent={assemblyDatumPartsAdjacent}
                  selectionInvalid={assemblyDatumSelectionInvalid}
                  stepOrder={assemblyDatumStepOrder}
                  stepMeta={assemblyDatumStepMeta}
                  getStepValue={(stepKey) => getAssemblyDatumStepValue(assemblyDatumModal, stepKey)}
                  nextStep={getNextAssemblyDatumStep(assemblyDatumModal)}
                  onToggleMinimized={() => setAssemblyDatumModal((prev) => prev ? { ...prev, minimized: !prev.minimized } : prev)}
                  onClose={() => setAssemblyDatumModal(null)}
                  onPartChange={(partKey, nextId) => setAssemblyDatumModal((prev) => prev ? {
                    ...prev,
                    ...(partKey === 'A'
                      ? { partAId: nextId, partAFeatureId1: null, partAFeatureId2: null }
                      : { partBId: nextId, partBFeatureId1: null, partBFeatureId2: null }),
                    selectedEdgeId: null,
                    activeDatumPart: null,
                    error: null,
                  } : prev)}
                  onAssign={handleAssignDatumFeature}
                  onReset={resetAssemblyDatumSelection}
                  onConfirm={handleConfirmAssemblyDatum}
                />
              )}
              {/* 抓取安全路径点位弹窗 */}
              {pickPathModal && currentProject && (() => {
                const modalStep = currentProject.processSteps.find(s => s.id === pickPathModal.stepId);
                const combinedWeldMode = pickPathModal.combinedWeldMode ?? 'weld';
                const segmentCount = getProcessPathPointSegmentCount(modalStep, combinedWeldMode);
                const activeSegmentIndex = Math.min(pickPathModal.segmentIndex ?? 0, segmentCount - 1);
                const pathPoints = getProcessPathPoints(modalStep, activeSegmentIndex, combinedWeldMode);
                const segmentTabLabelPrefix =
                  modalStep?.type === 'weld-combined'
                    ? combinedWeldMode === 'scan' ? '扫描点' : '焊缝段'
                    : modalStep?.type === 'weld-scan'
                    ? '扫描点'
                    : modalStep?.type === 'weld'
                      ? '焊缝段'
                      : '扫描点组';
                const enabledPathPointIndices = pathPoints
                  .map((point, index) => (point.enabled === false ? null : index))
                  .filter((index): index is number => index !== null);
                const isPickPathDirty = processPointDirtyStepIds.has(getRootProcessStepId(pickPathModal.stepId));
                const selectedPosePointIndex =
                  pickPathPosePreview?.stepId === pickPathModal.stepId &&
                  pickPathPosePreview.source === 'safe' &&
                  pickPathPosePreview.combinedWeldMode === pickPathModal.combinedWeldMode
                    ? pickPathPosePreview.pointIndex
                    : null;
                const showPickPathPose = (pointIndex: PickPathPosePointIndex) => {
                  if (pointIndex !== 'all' && pathPoints[pointIndex]?.enabled === false) {
                    showToast('该安全点已禁用', 'error');
                    return;
                  }
                  if (pointIndex === 'all' && enabledPathPointIndices.length === 0) {
                    showToast('当前没有启用的安全点', 'error');
                    return;
                  }
                  showPickPathPosePreview(pickPathModal.stepId, pointIndex, pickPathModal.combinedWeldMode);
                };
                const pickPathModalPositionClassName = immersiveProjectLayout
                  ? 'right-[440px] z-30'
                  : 'right-3 z-20';
                return (
                  <div
                    className={`absolute top-3 rounded-lg border border-white/50 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md transition-[width] ${pickPathModalPositionClassName} ${
                      pickPathLegendCollapsed ? 'w-[360px]' : 'w-[500px]'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Move3D className="size-4 text-orange-500" />
                        <span className="text-xs font-medium">安全点配置</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip title={pickPathLegendCollapsed ? '展开图例' : '收起图例'} placement="bottom">
                          <button
                            type="button"
                            className={`rounded-sm p-0.5 transition-colors ${
                              pickPathLegendCollapsed
                                ? 'bg-orange-50 text-ds-brand-primary-text hover:bg-orange-100'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            onClick={() => setPickPathLegendCollapsed((collapsed) => !collapsed)}
                            aria-label={pickPathLegendCollapsed ? '展开图例' : '收起图例'}
                          >
                            <PanelLeft className="size-3.5" />
                          </button>
                        </Tooltip>
                        <button
                          type="button"
                          className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100"
                          onClick={() =>
                            setPickPathModal((prev) =>
                              prev ? { ...prev, minimized: !prev.minimized } : prev
                            )
                          }
                          title={pickPathModal.minimized ? '展开' : '最小化'}
                        >
                          {pickPathModal.minimized ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <Minus className="size-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100"
                          onClick={() => closeProcessPathPointModal(pickPathModal.stepId)}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {!pickPathModal.minimized && (
                      <>
                        <div className="px-3 pt-3">
                          {segmentCount > 1 && (
                            <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg bg-ds-bg-segmented p-1">
                              {Array.from({ length: segmentCount }).map((_, segmentIndex) => {
                                const active = activeSegmentIndex === segmentIndex;
                                return (
                                  <button
                                    key={segmentIndex}
                                    type="button"
                                    className={`h-7 shrink-0 rounded-md px-2.5 text-[11px] transition-colors ${
                                      active ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-zinc-500 hover:bg-white/70'
                                    }`}
                                    onClick={() => selectProcessPathPointSegment(segmentIndex)}
                                  >
                                    {segmentTabLabelPrefix}{segmentIndex + 1}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div
                          className={`grid overflow-hidden px-3 pb-3 ${
                            pickPathLegendCollapsed
                              ? 'max-h-[286px] grid-cols-1'
                              : 'max-h-[286px] grid-cols-[140px_minmax(0,1fr)] gap-3'
                          }`}
                        >
                          {!pickPathLegendCollapsed && (
                            <div className="relative flex h-[270px] flex-col items-center rounded-lg border border-ds-border-default bg-zinc-50/80 px-2 py-3">
                              <div className="relative h-[168px] w-[104px]">
                                <div className="absolute left-[34px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
                                <div className="absolute left-[34px] bottom-[24px] h-[3px] w-[36px] rounded-full bg-red-500" />
                                <ArrowRight className="absolute left-[46px] bottom-[15px] size-5 text-red-500" strokeWidth={2.75} />
                                <div className="absolute left-[70px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
                                {pickPathDiagramPoints.map((point, pointIndex) => {
                                  const enabled = pathPoints[pointIndex]?.enabled !== false;
                                  return (
                                  <button
                                    key={point.label}
                                    type="button"
                                    className="absolute -translate-x-1/2 text-left"
                                    style={{ top: point.top, left: point.left }}
                                    onClick={() => showPickPathPose(pointIndex)}
                                  >
                                    <div
                                      className={`size-3 rounded-full border-2 bg-white shadow-sm ${
                                        enabled && (selectedPosePointIndex === 'all' || selectedPosePointIndex === pointIndex)
                                          ? 'border-ds-brand-primary ring-4 ring-orange-100'
                                          : enabled
                                            ? 'border-orange-300'
                                            : 'border-slate-300 bg-slate-100'
                                      }`}
                                    />
                                    <div className={`mt-0.5 -translate-x-[6px] text-[9px] font-medium ${enabled ? 'text-slate-500' : 'text-slate-300'}`}>{point.label}</div>
                                  </button>
                                  );
                                })}
                              </div>
                              <div className="absolute bottom-9 left-0 right-0 flex justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-3 text-[10px]"
                                  disabled={enabledPathPointIndices.length === 0}
                                  onClick={() => showPickPathPose('all')}
                                >
                                  显示全部位姿
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="grid max-h-[270px] grid-cols-1 gap-2 overflow-y-auto pr-1">
                            {pathPoints.map((point, pi) => (
                                <PickPathPointCard
                                  key={pi}
                                  index={pi}
                                  point={point}
                                  selected={selectedPosePointIndex === 'all' || selectedPosePointIndex === pi}
                                  variant="compactSubtle"
                                  onSelect={() => showPickPathPose(pi)}
                                  onToggleEnabled={(enabled) => setPickPathPointEnabled(
                                    pickPathModal.stepId,
                                    activeSegmentIndex,
                                    pi,
                                    enabled,
                                    pickPathModal.combinedWeldMode
                                  )}
                                  onAxisChange={(axis, nextValue) =>
                                    updatePickPathPoint(
                                      pickPathModal.stepId,
                                      activeSegmentIndex,
                                      pi,
                                      axis,
                                      nextValue,
                                      pickPathModal.combinedWeldMode
                                    )
                                  }
                                />
                              ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => resetPickPathPoints(pickPathModal.stepId, pickPathModal.combinedWeldMode)}
                          >
                            重置
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 bg-ds-brand-primary px-2.5 text-[11px] text-white hover:bg-ds-brand-primary-hover"
                            disabled={!isPickPathDirty}
                            onClick={() => clearProcessPointDirty(pickPathModal.stepId, '已应用路径点位更新')}
                          >
                            确认
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              {(pickPreviewOverlayStepId || placePreviewOverlayStepId || clampPreviewOverlayStepId || assemblePreviewOverlayStepId || weldPreviewOverlayStepId) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/28 backdrop-blur-[2px]">
                  <div className="rounded-xl border border-white/40 bg-white/92 px-5 py-4 text-center shadow-lg">
                    <div className="text-sm font-medium text-slate-700">
                      {weldPreviewOverlayStepId
                        ? '3D场景回显定点焊接路径点位'
                        : assemblePreviewOverlayStepId
                          ? '3D场景回显装配定位路径点位'
                          : grindPreviewOverlayStepId
                            ? '3D场景回显打磨路径点位'
                            : clampPreviewOverlayStepId
                            ? '3D场景回显压紧位置'
                            : placePreviewOverlayStepId
                              ? '3D场景回显支撑位置'
                              : '模型上回显抓取路径点位和抓取位置投影'}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {weldPreviewOverlayStepId
                        ? '当前为占位示意，待接入真实定点焊接路径模型'
                        : assemblePreviewOverlayStepId
                          ? '当前为占位示意，待接入真实装配定位路径模型'
                          : grindPreviewOverlayStepId
                            ? '当前为占位示意，待接入真实打磨路径模型'
                            : clampPreviewOverlayStepId
                            ? '当前为占位示意，待接入真实压紧位置模型'
                            : placePreviewOverlayStepId
                              ? '当前为占位示意，待接入真实支撑位置模型'
                              : '当前为占位示意，待接入真实抓取模型'}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 h-7 px-3 text-[11px]"
                      onClick={() => {
                        setPickPreviewOverlayStepId(null);
                        setPlacePreviewOverlayStepId(null);
                        setClampPreviewOverlayStepId(null);
                        setGrindPreviewOverlayStepId(null);
                        setAssemblePreviewOverlayStepId(null);
                        setWeldPreviewOverlayStepId(null);
                      }}
                    >
                      关闭预览
                    </Button>
                  </div>
                </div>
              )}
              {showViewportCanvas ? (
                <Canvas
                  className="relative z-0 h-full min-h-[420px]"
                  camera={{ position: [0, 0, 200], fov: 45, near: 0.1, far: 5000 }}
                  gl={{ antialias: true }}
                >
                  <Suspense
                    fallback={
                      <mesh>
                        <boxGeometry />
                        <meshBasicMaterial color="#334155" wireframe />
                      </mesh>
                    }
                  >
                    <Scene
                      models={viewportSceneModels}
                      hiddenIds={hiddenIds}
                      uniformColor={!currentProject}
                      highlightId={viewportPrimaryHighlightId}
                      highlightMode={viewportPrimaryHighlightMode}
                      modelOpacityById={viewportModelOpacityById}
                      isolationActive={processIsolationActive}
                      isolationTargetIds={isolatedProcessRelatedIds}
                      secondaryHighlightIds={secondaryHighlightIds}
                      coordinateTransformIds={coordinateTransformOpen ? coordinateTransformPartIds : []}
                      coordinateTransformPivotTargetParts={coordinateTransformOpen ? coordinateTransformPivotTargetSceneParts : []}
                      coordinateTransformSelectedPivotPoint={coordinateTransformSelectedPivotPoint}
                      coordinateTransformPivotOverride={coordinateTransformPivotOverride}
                      coordinateTransformOffset={coordinateTransformOffset}
                      onCoordinateTransformPivotPointClick={(point) => {
                        setCoordinateTransformSelectedPivotPoint(point);
                        showToast(`已选择中心点：${point.label}`, 'success');
                      }}
                      selectedPartGumballParts={selectedPartGumballSceneParts}
                      intersectionFeatures={weldFeatureViews}
                      surfaceFeatures={grindFeatureViews}
                      datumEdges={visibleDatumEdges}
                      grindToolHeadItems={grindToolHeadItems}
                      selectableFaceParts={manualWeldSelectableFaceParts}
                      selectedFaceIds={manualWeldSelectedFaceIds}
                      manualWeldCandidates={manualWeldGenerated ? manualWeldCandidates : []}
                      selectedManualWeldCandidateId={manualFeatureCandidateId}
                      onSelectableFaceClick={selectManualWeldFace}
                      onSelectableFacesReady={handleSelectableFacesReady}
                      onManualWeldCandidateClick={selectManualWeldSegment}
                      onDatumEdgeClick={handleDatumEdgeClick}
                      selectionMode={inDatumMode ? 'datum-edge' : 'normal'}
                      useProcessPlanningDefaultView={Boolean(currentProject)}
                      defaultViewHorizontalOffset={immersiveProjectLayout ? 20 : 0}
                    />
                  </Suspense>
                </Canvas>
              ) : (
                <div className="relative flex h-full min-h-[240px] items-center justify-center">
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(107,114,128,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(107,114,128,0.18)_1px,transparent_1px)] [background-size:32px_32px]" />
                </div>
              )}
              {styleCProcessPlanningLayout && processIsolationActive && selectedPlanningProcess && (
                <div className="pointer-events-none absolute inset-y-0 left-[320px] right-[420px] z-30 min-w-0">
                  <div className="absolute left-3 top-3 max-w-[calc(100%-24px)] rounded-md bg-white/25 px-2.5 py-2 ring-1 ring-inset ring-white/28 backdrop-blur-xl">
                    <div className="mb-1 text-[11px] font-medium text-slate-500">当前工序对象</div>
                    <div className="flex min-w-0 flex-wrap gap-1">
                      {selectedPlanningProcess.displayObjects.map((displayObject) => (
                        <span
                          key={displayObject}
                          className="max-w-full truncate rounded-sm bg-white/16 px-1.5 py-0.5 text-xs leading-4 text-zinc-600 ring-1 ring-inset ring-white/28"
                        >
                          {displayObject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {immersiveProjectLayout && (
                <div>
                  {viewportLogMinimized ? (
                    <button
                      type="button"
                      className={`absolute bottom-2 left-[336px] z-30 flex h-9 w-[320px] items-center justify-between overflow-hidden rounded-xl border border-white/65 bg-ds-bg-glass-float px-3 text-xs font-medium text-slate-600 shadow-lg shadow-black/5 backdrop-blur-md transition-[transform,opacity] duration-700 ease-out will-change-transform transform-gpu hover:bg-white/90 ${styleCProjectManagementTransitionOut ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}
                      onClick={() => setViewportLogMinimized(false)}
                    >
                      <span>打印日志</span>
                      <ChevronUp className="size-3.5 text-slate-400" />
                    </button>
                  ) : (
                    <div className={`absolute bottom-2 left-[336px] z-30 flex h-[156px] w-[360px] flex-col overflow-hidden rounded-xl border border-white/65 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md transition-[transform,opacity] duration-700 ease-out will-change-transform transform-gpu ${styleCProjectManagementTransitionOut ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}>
                      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/55 px-3">
                        <span className="text-xs font-medium text-slate-700">打印日志</span>
                        <button
                          type="button"
                          className="rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          onClick={() => setViewportLogMinimized(true)}
                          title="最小化"
                        >
                          <Minus className="size-3.5" />
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-5 text-slate-600">
                        {[
                          '[10:42:08] INFO  0162-01-010101 装配体模型加载完成',
                          '[10:42:11] INFO  焊缝特征缓存就绪，等待路径生成',
                          '[10:42:16] DEBUG  3D视窗相机参数同步完成',
                          '[10:42:23] INFO  任务列表配置变更已写入前端状态',
                        ].map((line) => (
                          <div key={line} className="whitespace-nowrap">{line}</div>
                        ))}
                      </div>
                      <ScrollPanelEdge className="z-10" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={processTaskPanelClassName}>
          <CardHeader
            className={`relative z-10 flex ${immersiveProjectLayout || projectManagementImmersiveLayout || styleCProjectManagementLayout ? `h-9 border-b ${styleCProcessPlanningLayout || styleCProjectManagementLayout ? 'border-ds-border-process-planning-structure' : 'border-white/55'}` : 'h-12'} shrink-0 items-center p-0 pb-0! transition-[background-color,box-shadow,backdrop-filter] duration-200 ${
              currentProject
                ? processSequenceScrolled
                  ? 'bg-ds-bg-sticky-overlap shadow-ds-sticky-overlap backdrop-blur-[var(--ds-blur-sticky-overlap)]'
                  : 'bg-transparent shadow-none'
                : projectPropertiesScrolled
                  ? 'bg-ds-bg-sticky-overlap shadow-ds-sticky-overlap backdrop-blur-[var(--ds-blur-sticky-overlap)]'
                    : projectManagementImmersiveLayout || styleCProjectManagementLayout
                      ? 'bg-transparent shadow-none'
                    : 'border-b border-slate-100'
            }`}
          >
            <CardTitle className={`flex h-full w-full items-center gap-2 ${immersiveProjectLayout || projectManagementImmersiveLayout || styleCProjectManagementLayout ? 'px-3 text-xs font-medium text-ds-text-control' : 'px-4 text-base'}`}>
              {currentProject ? (
                <>
                  {styleCProcessPlanningLayout ? (
                    selectedPlanningProcess ? (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Tooltip title="返回工序规划">
                          <button
                            type="button"
                            className="flex size-6 shrink-0 items-center justify-center rounded-ds-sm text-slate-500 transition-colors hover:bg-white/70 hover:text-ds-brand-primary-text"
                            aria-label="返回工序规划"
                            onClick={() => {
                              setSelectedPlanningProcessId(null);
                              setProcessIsolationDismissed(false);
                              setSelectedCompactProcessStepKey(null);
                              setIsolatedCompactProcessStepKey(null);
                              setCompactProcessBatchMode(false);
                              setCheckedCompactProcessStepKeys(new Set());
                              setCompactProcessFilterOpen(false);
                            }}
                          >
                            <ArrowLeft className="size-3.5" />
                          </button>
                        </Tooltip>
                        <span className="truncate">{String(selectedPlanningProcess.sequence).padStart(2, '0')} {selectedPlanningProcess.name}</span>
                      </div>
                    ) : (
                      <span
                        className="select-none"
                        title={currentProjectStyleCTasksGenerated ? '双击重新生成完整工序任务 Demo' : '双击生成完整工序任务 Demo'}
                        onDoubleClick={() => requestGenerateProcessSequence(true)}
                      >
                        工序规划
                      </span>
                    )
                  ) : (
                    <span>任务列表</span>
                  )}
                  {(!styleCProcessPlanningLayout || (selectedPlanningProcess && currentProjectStyleCTasksGenerated)) && (
                  <div className={`ml-auto flex items-center ${immersiveProjectLayout ? 'gap-1' : 'gap-2'}`}>
                    {styleCProcessPlanningLayout && selectedPlanningProcess?.sequence === 6 && (
                      <Tooltip title="每次发送都会创建新的仿真副本">
                        <span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-1.5 text-[11px] font-normal text-ds-brand-primary-text hover:bg-transparent hover:text-ds-brand-primary"
                            onClick={() => addSimulationWorkspace('process-planning', undefined, selectedPlanningProcess.sequence)}
                          >
                            <MonitorPlay className="size-3.5" />
                            发送仿真
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {styleCProcessPlanningLayout && selectedPlanningProcess && (
                      <Tooltip title={`在第 ${String(selectedPlanningProcess.sequence).padStart(2, '0')} 道工序中新增任务`}>
                        <span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-1.5 text-[11px] font-normal text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text"
                            onClick={() => openAddProcessTaskDialog(selectedPlanningProcess.allowedTaskTypes[0])}
                          >
                            <Plus className="size-3.5" />
                            新增任务
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {!immersiveProjectLayout && (
                      <Tooltip title="收起全部任务卡片">
                        <span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="!font-normal size-7 p-0 text-zinc-500 hover:text-zinc-900 disabled:opacity-40"
                            disabled={expandedProcessStepIds.size === 0}
                            onClick={() => setExpandedProcessStepIds(new Set())}
                          >
                            <ChevronsUp className="size-3.5" />
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {immersiveProjectLayout && (
                      <>
                        {compactProcessBatchMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`!font-normal h-7 px-1.5 text-[11px] hover:bg-transparent disabled:text-slate-300 disabled:hover:bg-transparent ${
                              compactProcessAllVisibleSelected
                                ? 'text-ds-brand-primary-text hover:text-ds-brand-primary-text'
                                : 'text-slate-500 hover:text-ds-brand-primary-text'
                            }`}
                            disabled={compactProcessSelectableVisibleKeys.length === 0}
                            onClick={() => {
                              setCheckedCompactProcessStepKeys((prev) => {
                                const next = new Set(prev);
                                compactProcessSelectableVisibleKeys.forEach((key) => next.add(key));
                                return next;
                              });
                            }}
                          >
                            全选
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="!font-normal h-7 px-1.5 text-[11px] text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text disabled:text-slate-300 disabled:hover:bg-transparent"
                          disabled={processSteps.length === 0}
                          onClick={() => {
                            setCompactProcessBatchMode((enabled) => !enabled);
                            setCheckedCompactProcessStepKeys(new Set());
                          }}
                        >
                          批量操作
                        </Button>
                        <Tooltip title="筛选">
                          <span>
                        <Button
                          size="sm"
                          variant="ghost"
                              className={`size-7 p-0 ${
                            compactProcessFilterOpen || compactProcessFilterActive
                              ? 'text-ds-brand-primary-text hover:bg-transparent hover:text-ds-brand-primary-text'
                              : 'text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text'
                          } disabled:text-slate-300 disabled:hover:bg-transparent`}
                          disabled={processSteps.length === 0}
                          onClick={() => setCompactProcessFilterOpen((open) => !open)}
                        >
                          <Filter className="size-3.5" />
                        </Button>
                          </span>
                        </Tooltip>
                        {(!styleCProcessPlanningLayout || compactProcessBatchMode) && (
                          <>
                            <Tooltip title={selectedCompactProcessStepKey && disabledCompactProcessStepKeys.has(selectedCompactProcessStepKey) ? '解除禁用选中任务' : '禁用选中任务'}>
                              <span>
                            <Button
                              size="sm"
                              variant="ghost"
                                  className={`size-7 p-0 ${
                                selectedCompactProcessStepKey && disabledCompactProcessStepKeys.has(selectedCompactProcessStepKey)
                                  ? 'text-ds-brand-primary-text hover:bg-transparent hover:text-ds-brand-primary-text'
                                  : 'text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text'
                              } disabled:text-slate-300 disabled:hover:bg-transparent`}
                              disabled={!selectedCompactProcessStepKey}
                              onClick={() => {
                                if (!selectedCompactProcessStepKey) return;
                                const stepKey = selectedCompactProcessStepKey;
                                setDisabledCompactProcessStepKeys((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(stepKey)) next.delete(stepKey);
                                  else next.add(stepKey);
                                  return next;
                                });
                                setHoveredCompactProcessStepKey(stepKey);
                              }}
                            >
                              <Ban className="size-3.5" />
                            </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title={compactProcessBatchMode && checkedCompactProcessStepKeyList.length > 0 ? `删除已勾选的 ${checkedCompactProcessStepKeyList.length} 项任务` : '删除选中任务'}>
                              <span>
                            <Button
                              size="sm"
                              variant="ghost"
                                  className="size-7 p-0 text-slate-500 hover:bg-transparent hover:text-red-600 disabled:text-slate-300 disabled:hover:bg-transparent"
                              disabled={compactProcessDeleteKeys.length === 0}
                              onClick={() => {
                                if (compactProcessDeleteKeys.length === 0) return;
                                setDeleteConfirm({
                                  ids: compactProcessDeleteKeys,
                                  label: compactProcessDeleteKeys.length > 1 ? `已勾选的 ${compactProcessDeleteKeys.length} 项任务条目` : '选中的任务条目',
                                  kind: 'process',
                                });
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </>
                    )}
                    {!immersiveProjectLayout && (
                      <>
                        <Tooltip title="重新排序">
                          <span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="!font-normal h-7 gap-1.5 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                              disabled={processSteps.length === 0}
                              onClick={restoreDefaultProcessStepOrder}
                            >
                              <RefreshCw className="size-3.5 -rotate-45" />
                              重新排序
                            </Button>
                          </span>
                        </Tooltip>
                        <Button
                          size="sm"
                          variant="outline"
                          className="!font-normal h-7 gap-1.5 px-2.5 text-xs text-zinc-600 hover:text-zinc-900"
                          onClick={() => handleGenerateProcessSequence()}
                        >
                          <SlidersHorizontal className="size-3.5" />
                          一键生成任务
                        </Button>
                        <div ref={processMenuRef} className="relative">
                          <Button
                            size="sm"
                            variant="outline"
                            className="!font-normal h-7 gap-1.5 px-2.5 text-xs text-zinc-600 hover:text-zinc-900"
                            onClick={() => setProcessMenuOpen((open) => !open)}
                          >
                            <Plus className="size-3.5" />
                            新增
                            <ChevronDown className={`size-3.5 transition-transform ${processMenuOpen ? 'rotate-180' : ''}`} />
                          </Button>
                          {processMenuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
                              {processStepTypeOptions.map((item) => (
                                  <button
                                    key={item.key}
                                    type="button"
                                    className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs text-zinc-700 transition-colors hover:bg-orange-50 hover:text-ds-brand-primary-text"
                                    onClick={() => {
                                      handleAddProcessStep(item.key);
                                      setProcessMenuOpen(false);
                                    }}
                                  >
                                    <item.icon className="size-3.5 shrink-0" />
                                    {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  )}
                </>
              ) : (
                <>
                  属性参数
                  {previewProject && (
	                    <span className="ml-1 text-[11px] text-slate-400">{previewProject.id}</span>
                  )}
                  {previewProject && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        size="sm"
	                        variant={styleCProjectManagementLayout ? 'ghost' : 'outline'}
	                        className={`h-6 gap-1 px-2 text-[11px] text-slate-500 hover:text-slate-700 ${styleCProjectManagementLayout ? 'hover:bg-transparent' : ''}`}
                        onClick={() => previewProject && openDrawingManager(previewProject.id, previewSelectedId)}
                      >
                        <FileCog className="size-3" />
                        图纸管理
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className={`relative min-h-0 flex-1 p-0 !pb-0 ${currentProject && !flatProjectLayout && !immersiveProjectLayout ? 'bg-[#fafafa]' : ''}`}>
            {currentProject && styleCProcessPlanningLayout && currentProjectStyleCNeedsRegeneration && (
              <div className="absolute inset-0 z-20 bg-zinc-300/70 p-ds-150 backdrop-blur-[1px]">
                <PanelEmptyState icon={RefreshCw} label="工序列表需要重新生成" className="bg-zinc-100/50" />
              </div>
            )}
		            <ScrollArea
		              className="h-full [&_[data-slot=scroll-area-viewport]>div]:h-full"
              onScrollCapture={(event) => {
                const target = event.target as HTMLElement;
                if (target.dataset.slot !== 'scroll-area-viewport') return;
                if (currentProject) {
                  setProcessSequenceScrolled(target.scrollTop > 0);
                  return;
                }
                setProjectPropertiesScrolled(target.scrollTop > 0);
              }}
            >
	              {currentProject ? (
	                /* 工艺规划页：任务列表 */
		                <div className={`${immersiveProjectLayout ? 'px-ds-150 py-ds-150' : 'p-ds-150'} ${processSteps.length === 0 || immersiveProjectLayout ? 'h-full' : ''}`}>
		                  <div className={processSteps.length === 0 || immersiveProjectLayout ? 'h-full' : 'space-y-ds-075'}>
                    {styleCProcessPlanningLayout && !selectedPlanningProcess ? (
                      <div className="flex h-full min-h-0 flex-col">
                        <div className="min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto pr-1">
                          {fixedPlanningProcesses.map((process) => {
                            const processChecked = checkedPlanningProcessIds.has(process.id);
                            const taskSlots = currentProjectStyleCTasksGenerated
                              ? process.taskSlots.flatMap((slot) => {
                                  const step = planningProcessStepsById.get(slot.id);
                                  if (!step) return [];
                                  const dirty = isProcessStepTaskDirty(step);
                                  const validationMessage = getProcessStepValidationMessage(step);
                                  const status = validationMessage
                                    ? 'invalid' as const
                                    : dirty
                                      ? 'dirty' as const
                                      : 'generated' as const;
                                  return [{ ...slot, status, validationMessage }];
                                })
                              : [];
                            return (
                              <div
                                key={process.id}
                                role="button"
                                tabIndex={0}
                                className="group w-[391px] max-w-full cursor-pointer rounded-ds-md bg-white/84 px-3.5 py-2 text-left shadow-ds-sm ring-1 ring-inset ring-zinc-100/80 transition-colors hover:bg-orange-50/65 focus-visible:outline-none focus-visible:ring-orange-300"
                                onClick={() => {
                                  setSelectedPlanningProcessId(process.id);
                                  setProcessIsolationDismissed(false);
                                  setSelectedCompactProcessStepKey(null);
                                  setIsolatedCompactProcessStepKey(null);
                                  setSelectedId('');
                                  setCompactProcessBatchMode(false);
                                  setCheckedCompactProcessStepKeys(new Set());
                                  setCompactProcessFilterKinds([]);
                                  setCompactProcessFilterValues({});
                                  setCompactProcessFilterOpen(false);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key !== 'Enter' && event.key !== ' ') return;
                                  event.preventDefault();
                                  setSelectedPlanningProcessId(process.id);
                                  setProcessIsolationDismissed(false);
                                  setSelectedCompactProcessStepKey(null);
                                  setIsolatedCompactProcessStepKey(null);
                                  setSelectedId('');
                                  setCompactProcessBatchMode(false);
                                  setCheckedCompactProcessStepKeys(new Set());
                                  setCompactProcessFilterKinds([]);
                                  setCompactProcessFilterValues({});
                                  setCompactProcessFilterOpen(false);
                                }}
                              >
                                <span className="flex min-w-0 items-start justify-between gap-2">
                                  <span className="flex h-5 min-w-0 flex-1 items-center gap-1.5">
                                    <span className="relative flex h-5 w-[18px] shrink-0 items-center justify-center">
                                      <span className={`ds-process-index text-xs font-normal text-zinc-400 transition-colors group-hover:text-ds-brand-primary-text group-focus:text-ds-brand-primary-text group-focus-within:text-ds-brand-primary-text ${processChecked ? 'opacity-0' : 'opacity-100 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0'}`}>
                                        {String(process.sequence).padStart(2, '0')}
                                      </span>
                                      <ThemedCheckbox
                                        aria-label={`选择第 ${String(process.sequence).padStart(2, '0')} 道工序：${process.name}`}
                                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity ${processChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100'}`}
                                        checked={processChecked}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => {
                                          event.stopPropagation();
                                          togglePlanningProcessChecked(process.id);
                                        }}
                                      />
                                    </span>
                                    <span className="truncate text-sm font-medium text-zinc-800">{process.name}</span>
                                  </span>
                                  <span className="flex min-w-0 flex-wrap justify-end gap-1">
                                    {taskSlots.map((slot) => {
                                      const statusLabel = slot.status === 'generated'
                                        ? '已生成'
                                        : slot.status === 'dirty'
                                          ? '有未保存修改'
                                          : slot.validationMessage ?? '参数校验失败';
                                      return (
                                        <span
                                          key={slot.id}
                                          className="inline-flex h-5 max-w-full items-center gap-1 rounded-full bg-zinc-100/80 pl-1.5 pr-2 text-[11px] leading-none text-zinc-600"
                                          title={`${slot.label} · ${statusLabel}`}
                                        >
                                          {slot.status === 'invalid' ? (
                                            <AlertTriangle className="size-3 shrink-0 text-red-500" />
                                          ) : (
                                            <span className={`size-1.5 shrink-0 rounded-full ${slot.status === 'generated' ? 'bg-emerald-500' : 'bg-ds-brand-primary'}`} />
                                          )}
                                          <span className="truncate pb-px">{slot.label}</span>
                                        </span>
                                      );
                                    })}
                                  </span>
                                </span>
                                <span className="mt-3 flex min-w-0 items-center gap-1.5">
                                  <Tooltip title={process.displayObject}>
                                    <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                                      {process.displayObjects.map((displayObject) => (
                                        <span
                                          key={displayObject}
                                          className="min-w-0 truncate rounded-sm bg-zinc-100/90 px-1.5 py-0.5 text-xs leading-4 text-zinc-500"
                                        >
                                          {displayObject}
                                        </span>
                                      ))}
                                    </span>
                                  </Tooltip>
                                  <span className="max-w-[118px] shrink-0 truncate text-right text-xs leading-4 text-zinc-400" title={process.station}>
                                    {process.station}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : processSteps.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200/70 bg-transparent px-5 py-8 text-center text-slate-400">
                        <div className="flex -translate-y-4 flex-col items-center gap-4">
                          <SlidersHorizontal className="size-10" />
                          <div className="text-sm font-light">暂无任务</div>
                          {styleCProcessPlanningLayout && selectedPlanningProcess && currentProjectStyleCTasksGenerated && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-orange-200 bg-white px-3 text-xs font-normal text-ds-brand-primary-text hover:bg-orange-50"
                              onClick={() => openAddProcessTaskDialog(selectedPlanningProcess.allowedTaskTypes[0])}
                            >
                              <Plus className="size-3.5" />
                              新增任务
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : immersiveProjectLayout ? (
                      <div className="flex h-full min-h-0 flex-col rounded-ds-xl bg-transparent">
                        <div
                          className="relative min-h-0 overflow-hidden"
                          style={{
                            height: styleCProcessPlanningLayout
                              ? compactProcessTaskPaneHeight ?? Math.min(220, Math.max(84, compactProcessVisibleEntries.length * 42 + 2))
                              : compactProcessTaskPaneHeight ?? 128,
                          }}
                        >
                          <div className="h-full overflow-y-auto pr-1">
                            <div className={`grid gap-1.5 ${styleCProcessPlanningLayout ? 'grid-cols-1' : 'grid-cols-3'}`}>
                              {compactProcessVisibleEntries.length === 0 ? (
                                <div className={`${styleCProcessPlanningLayout ? 'col-span-1' : 'col-span-3'} flex h-[72px] items-center justify-center rounded-ds-md border border-dashed border-slate-200/70 bg-white/45 px-3 text-center text-[11px] leading-5 text-slate-400`}>
                                  当前筛选条件下没有任务条目
                                </div>
	                              ) : compactProcessVisibleEntries.map(({ step, index, key: stepKey }) => {
	                                const isDetailActive = selectedCompactProcessStepKey === stepKey;
                                const isTaskFocused = isolatedCompactProcessStepKey === stepKey;
	                                const isAnyDirty = isProcessStepTaskDirty(step);
                                const validationMessage = getProcessStepValidationMessage(step);
                                const needsTaskSave = isAnyDirty;
                                const targetLabel = getCompactProcessTargetLabel(step, objectTree, leafParts, grindFeatureItems, datumFeatureItems, weldFeatureItems);
                                const isCompactStepDisabled = disabledCompactProcessStepKeys.has(stepKey);
                                return (
                                  <Tooltip key={stepKey} title={styleCProcessPlanningLayout ? undefined : targetLabel}>
                                    <div
	                                      className={`relative grid min-w-0 grid-cols-[12px_20px_minmax(0,1fr)] items-center gap-0 rounded-ds-md py-0 pl-px text-left shadow-ds-sm backdrop-blur-sm transition-colors [&_svg]:size-3.5 ${styleCProcessPlanningLayout ? 'h-10 pr-[92px]' : 'h-8 pr-1'} ${
                                        isCompactStepDisabled
                                          ? 'cursor-not-allowed bg-ds-bg-process-planning-tree-group text-ds-text-control-disabled shadow-none ring-1 ring-inset ring-ds-border-process-planning-structure'
                                          : isTaskFocused
                                            ? 'bg-orange-50 text-ds-brand-primary-text ring-1 ring-inset ring-orange-200'
                                          : isDetailActive
                                            ? 'bg-ds-bg-process-planning-task-surface text-ds-brand-primary-text ring-1 ring-inset ring-orange-200'
                                          : 'bg-ds-bg-process-planning-task-surface text-ds-text-control hover:bg-orange-50/60 hover:text-ds-brand-primary-text'
                                      }`}
                                      aria-disabled={isCompactStepDisabled || undefined}
                                      draggable={!isCompactStepDisabled}
                                      onDragStart={(event) => {
                                        if (isCompactStepDisabled) {
                                          event.preventDefault();
                                          return;
                                        }
                                        processSequenceDragKeyRef.current = stepKey;
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', stepKey);
                                        setProcessSequenceDragState({ draggingKey: stepKey, targetKey: stepKey, position: 'before' });
                                      }}
                                      onDragOver={(event) => {
                                        const draggingKey = processSequenceDragKeyRef.current;
                                        if (!draggingKey || draggingKey === stepKey || isCompactStepDisabled) return;
                                        event.preventDefault();
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                                        setProcessSequenceDragState({ draggingKey, targetKey: stepKey, position });
                                      }}
                                      onDrop={(event) => {
                                        event.preventDefault();
                                        const draggingKey = processSequenceDragKeyRef.current;
                                        const position = processSequenceDragState?.targetKey === stepKey ? processSequenceDragState.position : 'after';
                                        if (draggingKey && draggingKey !== stepKey) reorderProcessStep(draggingKey, stepKey, position);
                                        processSequenceDragKeyRef.current = null;
                                        setProcessSequenceDragState(null);
                                      }}
                                      onDragEnd={() => {
                                        processSequenceDragKeyRef.current = null;
                                        setProcessSequenceDragState(null);
                                      }}
                                      onPointerEnter={() => setHoveredCompactProcessStepKey(stepKey)}
                                      onPointerLeave={() => setHoveredCompactProcessStepKey((currentKey) => (currentKey === stepKey ? null : currentKey))}
                                      onMouseEnter={() => setHoveredCompactProcessStepKey(stepKey)}
                                      onMouseLeave={() => setHoveredCompactProcessStepKey((currentKey) => (currentKey === stepKey ? null : currentKey))}
                                      onFocusCapture={() => setHoveredCompactProcessStepKey(stepKey)}
                                      onBlurCapture={(event) => {
                                        if (!event.currentTarget.contains(event.relatedTarget)) {
                                          setHoveredCompactProcessStepKey((currentKey) => (currentKey === stepKey ? null : currentKey));
                                        }
                                      }}
                                    >
                                      <button
                                        type="button"
                                        className={`flex h-6 w-3 shrink-0 items-center justify-center rounded-ds-sm ${isCompactStepDisabled ? 'cursor-not-allowed text-ds-icon-drag-handle' : 'cursor-grab text-ds-icon-drag-handle active:cursor-grabbing'}`}
                                        title="拖拽排序"
                                        disabled={isCompactStepDisabled}
                                      >
                                        <span aria-hidden className="flex h-4 w-1 flex-col items-center justify-center gap-0.5">
                                          <span className="size-0.5 rounded-full bg-current" />
                                          <span className="size-0.5 rounded-full bg-current" />
                                          <span className="size-0.5 rounded-full bg-current" />
                                        </span>
                                      </button>
                                      <span className="flex h-6 w-4 shrink-0 items-center justify-center text-xs font-normal leading-none text-slate-400">
                                        {compactProcessBatchMode ? (
                                          <ThemedCheckbox
                                            aria-label={`选择${getShortProcessStepTitle(step.type)}`}
                                            className="size-3.5 [&_svg]:size-2.5"
                                            checked={checkedCompactProcessStepKeys.has(stepKey)}
                                            disabled={isCompactStepDisabled}
                                            size="sm"
                                            onChange={(event) => {
                                              event.stopPropagation();
                                              setCheckedCompactProcessStepKeys((prev) => {
                                                const next = new Set(prev);
                                                if (event.target.checked) next.add(stepKey);
                                                else next.delete(stepKey);
                                                return next;
                                              });
                                            }}
                                          />
                                        ) : (
                                          <span className="ds-process-index">{index + 1}</span>
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        className="flex min-w-0 items-center gap-1.5 pl-1 text-left"
                                        disabled={isCompactStepDisabled}
	                                        onClick={() => {
	                                          if (isCompactStepDisabled) return;
	                                          setSelectedCompactProcessStepKey(stepKey);
	                                          setIsolatedCompactProcessStepKey(isTaskFocused ? null : stepKey);
	                                          if (layoutVariant === 'immersive') setProcessIsolationDismissed(false);
	                                          setSelectedId('');
	                                          setActiveCompactProcessDetailTab(getCompactProcessDefaultDetailTab(step.type));
	                                          if (step.type === 'weld-combined') setCompactCombinedWeldPathMode('scan');
	                                        }}
                                      >
                                        <span className={isCompactStepDisabled ? 'opacity-35 grayscale' : ''}>{getProcessIcon(step.type)}</span>
                                        <span className="flex min-w-0 flex-1 flex-col justify-center">
                                          <span className={`flex min-w-0 items-center gap-1 truncate text-xs font-medium leading-4 ${isCompactStepDisabled ? 'text-ds-text-control-disabled' : isDetailActive ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`}>
                                            <span className="ds-process-title-text truncate">{step.name ?? getShortProcessStepTitle(step.type)}</span>
                                            {isAnyDirty && <span className="shrink-0 text-ds-brand-primary-text">*</span>}
                                            {validationMessage && (
                                              <Tooltip title={validationMessage}>
                                                <AlertTriangle className="size-3 shrink-0 text-red-500" />
                                              </Tooltip>
                                            )}
                                          </span>
                                        </span>
                                      </button>
                                      <span className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5">
                                        {needsTaskSave ? (
                                          <button
                                            type="button"
                                            disabled={isCompactStepDisabled || Boolean(validationMessage) || !step.id}
                                            className={`flex h-5 w-7 shrink-0 items-center justify-center rounded-ds-sm text-[11px] font-medium transition-colors ${
                                              !isCompactStepDisabled && !validationMessage && step.id
                                                ? 'text-ds-brand-primary-text hover:bg-orange-50'
                                                : 'cursor-not-allowed text-slate-300'
                                            }`}
                                            title={validationMessage ?? '保存当前任务'}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              if (step.id && !validationMessage && !isCompactStepDisabled) saveProcessTask(step.id);
                                            }}
                                          >
                                            保存
                                          </button>
                                        ) : (
                                          <span aria-hidden className="h-5 w-7 shrink-0" />
                                        )}
                                        <button
                                          type="button"
                                          className={`flex size-5 shrink-0 items-center justify-center text-[11px] transition-colors [&_svg]:size-3 ${
                                            isCompactStepDisabled
                                              ? 'text-ds-brand-primary-text hover:text-ds-brand-primary-text'
                                              : 'text-ds-text-disabled hover:text-ds-text-muted'
                                          }`}
                                          title={isCompactStepDisabled ? '解除禁用' : '禁用任务'}
                                          aria-pressed={isCompactStepDisabled}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setDisabledCompactProcessStepKeys((prev) => {
                                              const next = new Set(prev);
                                              if (next.has(stepKey)) next.delete(stepKey);
                                              else next.add(stepKey);
                                              return next;
                                            });
                                            setHoveredCompactProcessStepKey(stepKey);
                                          }}
                                        >
                                          <Ban className="size-3" />
                                        </button>
                                        <button
                                          type="button"
                                          className="flex size-5 shrink-0 items-center justify-center text-ds-text-disabled transition-colors hover:text-red-600 [&_svg]:size-3"
                                          title="删除任务"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setDeleteConfirm({
                                              ids: [stepKey],
                                              label: getShortProcessStepTitle(step.type),
                                              kind: 'process',
                                            });
                                          }}
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </span>
                                    </div>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </div>
                          <ScrollPanelEdge className="z-10" />
                        </div>
                        <div
                          className="group my-1 flex h-3 shrink-0 cursor-row-resize items-center px-2"
                          role="separator"
                          aria-orientation="horizontal"
                          title="拖动调整任务列表与下方详情区域高度"
                          onPointerDown={handleCompactProcessSplitDragStart}
                        >
                          <div className={`h-0.5 flex-1 rounded-full transition-[background-color,box-shadow] group-hover:bg-[#FFD591] group-hover:shadow-[0_0_4px_#FFEDD5] ${compactProcessSplitDragging ? 'bg-[#FFD591] shadow-[0_0_1px_#FFEDD5]' : 'bg-zinc-100 shadow-none'}`} />
                        </div>
                                          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-ds-md border border-ds-border-process-planning-structure bg-ds-bg-process-planning-task-detail">
                          <ProcessDetailTabBar
                            tabs={(() => {
                              if (compactProcessVisibleEntries.length === 0 || !selectedCompactProcessStepKey) return [];
                              const compactSelectedEntry = compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey);
                              if (!compactSelectedEntry) return [];
                              return getCompactProcessDetailTabs(compactSelectedEntry.step.type);
                            })()}
                            activeKey={(() => {
                              if (compactProcessVisibleEntries.length === 0 || !selectedCompactProcessStepKey) return activeCompactProcessDetailTab;
                              const compactSelectedEntry = compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey);
                              if (!compactSelectedEntry) return activeCompactProcessDetailTab;
                              return getCompactProcessEffectiveDetailTab(compactSelectedEntry.step.type, activeCompactProcessDetailTab);
                            })()}
                            onChange={handleCompactProcessDetailTabChange}
                            action={(() => {
                              if (compactProcessVisibleEntries.length === 0 || !selectedCompactProcessStepKey) return null;
                              const compactSelectedEntry = compactProcessVisibleEntries.find((entry) => entry.key === selectedCompactProcessStepKey);
                              if (!compactSelectedEntry) return null;
                              const stepId = compactSelectedEntry.step.id;
                              return (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="!font-normal h-6 px-1.5 text-[11px] text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text disabled:text-slate-300 disabled:hover:bg-transparent"
                                  disabled={!stepId}
                                  onClick={() => stepId && resetCompactProcessStepToGeneratedDefaults(stepId)}
                                >
                                  重置
                                </Button>
                              );
                            })()}
                          />
                          {renderCompactProcessPathPointToolbar()}
                          <div className="min-h-0 flex-1 overflow-auto p-1.5">
                            {renderCompactProcessDetailPanel()}
                          </div>
                        </div>
                      </div>
                    ) : (
                    processSteps.map((step, index) => {
                      const stepKey = getProcessStepKey(step, index);
                      const isPickStep = step.type === 'pick' && !!step.id && !!step.pickConfig;
                      const isPlaceStep = step.type === 'place' && !!step.id && !!step.placeConfig;
                      const isClampStep = step.type === 'turnover-clamp' && !!step.id && !!step.turnoverClampConfig;
                      const isGrindStep = step.type === 'polish' && !!step.id && !!step.grindConfig;
                      const isAssembleStep = step.type === 'assemble' && !!step.id && !!step.assembleConfig;
                      const isWeldStep = (step.type === 'weld' || step.type === 'weld-scan') && !!step.id && !!step.weldConfig;
                      const isExpanded = expandedProcessStepIds.has(stepKey);
                      const pickConfig = step.pickConfig;
                      const placeConfig = step.placeConfig;
                      const clampConfig = step.turnoverClampConfig;
                      const grindConfig = step.grindConfig;
                      const assembleConfig = step.assembleConfig;
                      const weldConfig = step.weldConfig;
                      const resolveProcessParts = (partIds: string[]) =>
                        partIds
                          .map((partId) => (objectTree ? findNodeById(objectTree, partId) : null) ?? leafParts.find((part) => part.id === partId))
                          .filter(Boolean) as TreeNode[];
                      const selectedWorkpieces = pickConfig ? resolveProcessParts(pickConfig.workpieceIds) : [];
                      const selectedPlaceWorkpieces = placeConfig ? resolveProcessParts(placeConfig.workpieceIds) : [];
                      const selectedClampWorkpieces = clampConfig ? resolveProcessParts(clampConfig.workpieceIds) : [];
                      const selectedGrindFeatures = grindConfig
                        ? grindFeatureItems.filter((item) => grindConfig.featureIds.includes(item.id))
                        : [];
                      const selectedDatumFeatures = assembleConfig
                        ? datumFeatureItems.filter((item) => assembleConfig.featureIds.includes(item.id))
                        : [];
                      const selectedWeldFeatures = weldConfig
                        ? weldFeatureItems.filter((item) => weldConfig.featureIds.includes(item.id))
                        : [];
                      const pickGripperType = pickConfig?.gripperType ?? '桁架抓具';
                      const pickMagnetSettings = pickConfig?.magnetSettings ?? createDefaultPickMagnetSettings();
                      const pickStepGripperConfig = getGripperConfigForType(pickGripperType);
                      const pickCoverageThreshold = pickConfig?.coverageOverride || pickStepGripperConfig.coverageThreshold;
                      const pickSafetyThreshold = pickConfig?.safetyCoefficientOverride || pickStepGripperConfig.safetyCoefficient;
                      const pickEccentricThreshold = pickConfig?.eccentricThresholdOverride || pickStepGripperConfig.eccentricThreshold;
                      const pickActualCoverage = pickConfig?.actualCoverage ? Number(pickConfig.actualCoverage) : null;
                      const pickActualLoadCoefficient = pickConfig?.actualLoadCoefficient ? Number(pickConfig.actualLoadCoefficient) : null;
                      const pickActualEccentricDistance = pickConfig?.actualEccentricDistance ? Number(pickConfig.actualEccentricDistance) : null;
                      const pickCoverageSatisfied = pickActualCoverage !== null && Number.isFinite(pickActualCoverage) && pickActualCoverage >= Number(pickCoverageThreshold);
                      const pickSafetySatisfied = pickActualLoadCoefficient !== null && Number.isFinite(pickActualLoadCoefficient) && pickActualLoadCoefficient <= Number(pickSafetyThreshold);
                      const pickEccentricSatisfied = pickActualEccentricDistance !== null && Number.isFinite(pickActualEccentricDistance) && pickActualEccentricDistance <= Number(pickEccentricThreshold);
                      const pickThresholdSatisfied = pickCoverageSatisfied && pickSafetySatisfied && pickEccentricSatisfied;
                      const pickThresholdOverridden =
                        !!(pickConfig?.coverageOverride || pickConfig?.safetyCoefficientOverride || pickConfig?.eccentricThresholdOverride);
                      const pickSelectionInvalid =
                        !!pickConfig &&
                        pickConfig.workpieceIds.length > 1 &&
                        pickConfig.workpieceIds.some((partId, partIndex, ids) =>
                          ids.slice(partIndex + 1).some((otherId) => !arePartsAdjacent(partId, otherId, objectTree!))
                        );
                      const placeSelectionInvalid =
                        !!placeConfig &&
                        placeConfig.workpieceIds.length > 1 &&
                        placeConfig.workpieceIds.some((partId, partIndex, ids) =>
                          ids.slice(partIndex + 1).some((otherId) => !arePartsAdjacent(partId, otherId, objectTree!))
                        );
                      const clampSelectionInvalid =
                        !!clampConfig &&
                        clampConfig.workpieceIds.length > 1 &&
                        clampConfig.workpieceIds.some((partId, partIndex, ids) =>
                          ids.slice(partIndex + 1).some((otherId) => !arePartsAdjacent(partId, otherId, objectTree!))
                        );
                      const isPointInfoCollapsed = !!step.id && collapsedPickPointInfoIds.has(step.id);
                      const isPlacePointInfoCollapsed = !!step.id && collapsedPlacePointInfoIds.has(step.id);
                      const isClampPointInfoCollapsed = !!step.id && collapsedClampPointInfoIds.has(step.id);
                      const isGrindPointInfoCollapsed = !!step.id && collapsedPickPointInfoIds.has(`${step.id}-grind`);
                      const isAssemblePointInfoCollapsed = !!step.id && collapsedPlacePointInfoIds.has(`${step.id}-assemble-visual`);
                      const isWeldPointInfoCollapsed = !!step.id && collapsedPickPointInfoIds.has(`${step.id}-weld`);
                      const rootStepId = getRootProcessStepId(step.id) || stepKey;
                      const isProcessPointDirty = processPointDirtyStepIds.has(rootStepId);
                      const isMagnetDirty = magnetDirtyStepIds.has(rootStepId);
                      const isAnyDirty = isProcessPointDirty || isMagnetDirty;
                      const pickParameterOverridden =
                        pickThresholdOverridden || isMagnetDirty || (!!pickConfig && pickConfig.gripperType !== gripperType);
                      const isExpandableStep = isProcessStepExpandableType(step.type);
                      const uiSpec = getProcessCardUiSpec(step);
                      const pickName = isPickStep
                        ? selectedWorkpieces.length > 0
                          ? `抓取${selectedWorkpieces.map((part) => part.name).join('+')}`
                          : getPickProcessDisplayName(step, index)
                        : isPlaceStep
                          ? selectedPlaceWorkpieces.length > 0
                            ? `放置${selectedPlaceWorkpieces.map((part) => part.name).join('+')}`
                            : (step.name || step.action)
                          : isClampStep
                            ? selectedClampWorkpieces.length > 0
                              ? `翻面压紧${selectedClampWorkpieces.map((part) => part.name).join('+')}`
                              : (step.name || step.action)
                            : isGrindStep
                              ? displayActionName('打磨', step.board)
                              : isAssembleStep
                                ? displayActionName('装配', step.board)
                                : isWeldStep
                                  ? displayActionName(step.type === 'weld-scan' ? '定位焊扫描' : '定位焊', step.board)
                                  : step.name || step.action;
                      const displayPickName = isPickStep
                        ? compactProcessName('抓取', selectedWorkpieces.map((part) => part.name), getPickProcessDisplayName(step, index))
                        : isPlaceStep
                          ? compactProcessName('放置', selectedPlaceWorkpieces.map((part) => part.name), step.name || step.action)
                          : isClampStep
                            ? compactProcessName('翻面压紧', selectedClampWorkpieces.map((part) => part.name), step.name || step.action)
                            : isGrindStep
                              ? compactProcessName('打磨', selectedGrindFeatures.map((feature) => feature.name), displayActionName('打磨', step.board))
                              : isAssembleStep
                                ? compactProcessName('装配', selectedDatumFeatures.map((feature) => feature.name), displayActionName('装配', step.board))
                                : isWeldStep
                                  ? compactProcessName(step.type === 'weld-scan' ? '定位焊扫描' : '定位焊', selectedWeldFeatures.map((feature) => feature.name), displayActionName(step.type === 'weld-scan' ? '定位焊扫描' : '定位焊', step.board))
                                  : pickName;
                      const processDeletePopoverOpen = processDeletePopoverKey === stepKey;
                      const handleProcessStepDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
                        processSequenceDragKeyRef.current = stepKey;
                        setProcessSequenceDragState({ draggingKey: stepKey, targetKey: null, position: 'after' });
                        setProcessDeletePopoverKey(null);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', stepKey);
                      };
                      const handleProcessStepDragOver = (event: React.DragEvent<HTMLDivElement>) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const draggingKey = processSequenceDragKeyRef.current;
                        if (!draggingKey || draggingKey === stepKey) return;
                        const rect = event.currentTarget.getBoundingClientRect();
                        const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                        setProcessSequenceDragState({ draggingKey, targetKey: stepKey, position });
                        event.dataTransfer.dropEffect = 'move';
                      };
                      const handleProcessStepDrop = (event: React.DragEvent<HTMLDivElement>) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const draggingKey = processSequenceDragKeyRef.current;
                        const targetKey = processSequenceDragState?.targetKey;
                        if (!draggingKey || !targetKey) {
                          processSequenceDragKeyRef.current = null;
                          setProcessSequenceDragState(null);
                          return;
                        }
                        reorderProcessStep(draggingKey, targetKey, processSequenceDragState.position);
                        processSequenceDragKeyRef.current = null;
                        setProcessSequenceDragState(null);
                      };
                      const handleProcessStepDragEnd = () => {
                        processSequenceDragKeyRef.current = null;
                        setProcessSequenceDragState(null);
                      };

                      return (
                        <div
                          key={stepKey}
                          data-process-step-key={stepKey}
                          className={`relative min-w-0 rounded-ds-lg bg-ds-bg-glass-float px-ds-100 py-ds-075 shadow-ds-sm backdrop-blur-sm transition-opacity ${processDeletePopoverOpen ? 'z-50' : 'z-0'} ${processSequenceDragState?.draggingKey === stepKey ? 'opacity-60' : ''}`}
                          onDragOver={handleProcessStepDragOver}
                          onDrop={handleProcessStepDrop}
                          onDragLeave={(event) => {
                            const nextTarget = event.relatedTarget as Node | null;
                            if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                            if (processSequenceDragState?.targetKey === stepKey) {
                              setProcessSequenceDragState((prev) => (prev?.targetKey === stepKey ? { ...prev, targetKey: null } : prev));
                            }
                          }}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            setProcessContextMenu({
                              x: event.clientX,
                              y: event.clientY,
                              stepId: getRootProcessStepId(step.id) || stepKey,
                            });
                          }}
                        >
                          {processSequenceDragState?.targetKey === stepKey && processSequenceDragState.position === 'before' && (
                            <div className="pointer-events-none absolute inset-x-ds-050 top-[-3px] z-30 flex h-1.5 items-center">
                              <div className={getProcessSequenceDropIndicatorClassName()} />
                            </div>
                          )}
                          <div className="grid min-w-0 grid-cols-[24px_24px_minmax(0,1fr)_auto] items-center gap-ds-100">
                            <div className="flex size-6 shrink-0 items-center justify-center text-ds-label font-medium leading-none text-ds-text-muted">
                              {index + 1}
                            </div>
                            {isExpandableStep && (
                              <button
                                type="button"
                                className="flex size-6 shrink-0 items-center justify-center rounded-ds-sm text-ds-text-disabled transition-colors hover:bg-ds-bg-subtle hover:text-ds-text-muted"
                                onClick={() => toggleProcessStepExpanded(stepKey)}
                                title={isExpanded ? '收起任务参数' : '展开任务参数'}
                              >
                                <ChevronRight className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-ds-100">
                                {getProcessIcon(step.type)}
                                <Tooltip title={pickName}>
                                  <span className="block min-w-0 flex-1 truncate text-ds-panel-title font-medium text-ds-text-secondary">{displayPickName}</span>
                                </Tooltip>
                              </div>
                              {!isPickStep && !isPlaceStep && !isClampStep && !isGrindStep && !isAssembleStep && !isWeldStep && <div className="mt-ds-050 truncate text-ds-label text-ds-text-muted">{step.board}</div>}
                            </div>
                            <div className="relative flex shrink-0 items-center gap-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-6 shrink-0 p-0 text-ds-text-disabled hover:bg-red-50 hover:text-red-600"
                                title="删除任务"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setProcessDeletePopoverKey((prev) => (prev === stepKey ? null : stepKey));
                                  setProcessContextMenu(null);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-6 shrink-0 cursor-grab p-0 text-ds-icon-drag-handle active:cursor-grabbing"
                                title="拖拽排序"
                                draggable
                                onDragStart={handleProcessStepDragStart}
                                onDragEnd={handleProcessStepDragEnd}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <GripVertical className="size-4" />
                              </Button>
                            </div>
                          </div>
                          {processDeletePopoverOpen && (
                            <div
                              className="ds-dropdown-surface absolute right-ds-100 top-[calc(100%+6px)] z-40 w-56 rounded-lg p-3"
                              onPointerDown={(event) => event.stopPropagation()}
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              <div className="ds-dropdown-arrow absolute -top-1.5 right-9 size-3 rotate-45 border-l border-t" />
                              <div className="text-sm font-medium text-slate-900">确认删除</div>
                              <div className="mt-3 flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setProcessDeletePopoverKey(null);
                                  }}
                                >
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 bg-red-500 px-2.5 text-xs text-white hover:bg-red-600"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteProcessSteps([stepKey]);
                                  }}
                                >
                                  删除
                                </Button>
                              </div>
                            </div>
                          )}
                          {processSequenceDragState?.targetKey === stepKey && processSequenceDragState.position === 'after' && (
                            <div className="pointer-events-none absolute inset-x-ds-050 bottom-[-3px] z-30 flex h-1.5 items-center">
                              <div className={getProcessSequenceDropIndicatorClassName()} />
                            </div>
                          )}

                          {isPickStep && isExpanded && pickConfig && (
                            <div className="mt-ds-075 space-y-ds-150 border-t border-ds-border-subtle ds-parameter-content">
                              <ProcessSelectionPanel
                                className="p-ds-150"
                                label="工件模型选择"
                                items={leafParts}
                                selectedIds={pickConfig.workpieceIds}
                                placeholder="请选择工件模型"
                                actionLabel="生成抓取位置"
                                invalid={pickSelectionInvalid}
                                onChange={(nextIds) =>
                                  updateProcessStepById(step.id!, (currentStep) => ({
                                    ...currentStep,
                                    board: nextIds.length ? nextIds.map((id) => leafParts.find((leafPart) => leafPart.id === id)?.name ?? id).join('+') : currentStep.board,
                                    pickConfig: {
                                      ...(currentStep.pickConfig ?? createEmptyPickProcessConfig()),
                                      workpieceIds: nextIds,
                                    },
                                  }))
                                }
                                onAction={() => {
                                  if (!step.id) return;
                                  if (!pickConfig.workpieceIds.length) {
                                    showToast('请先选择工件模型', 'error');
                                    return;
                                  }
                                  if (pickSelectionInvalid) {
                                    showToast('所选工件不相接，请重新选择', 'error');
                                    return;
                                  }
                                  const nextPathPoints = [
                                    { x: '120.0', y: '80.0', z: '15.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                    { x: '240.0', y: '95.0', z: '15.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                    { x: '360.0', y: '110.0', z: '18.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                    { x: '480.0', y: '125.0', z: '18.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                    { x: '600.0', y: '140.0', z: '20.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                    { x: '720.0', y: '155.0', z: '20.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                  ];
                                  updateProcessStepById(step.id, (currentStep) => {
                                    const nextPickConfig = {
                                      ...(currentStep.pickConfig ?? createEmptyPickProcessConfig()),
                                      magnetPosition: { x: '', y: '240.0', z: '96.0', rx: '0.0', ry: '0.0', rz: '0.0' },
                                      pathPoints: nextPathPoints,
                                    };
                                    return {
                                      ...currentStep,
                                      pickConfig: recalculatePickConfig(nextPickConfig),
                                    };
                                  });
                                  setPickPreviewOverlayStepId(step.id);
                                  showToast('已生成抓取位置', 'success');
                                }}
                              />

                              <div className="rounded-xl bg-slate-50/80 p-ds-150">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <div className="ds-label-input-compact min-w-[160px]">
                                    <div className="ds-label-input-compact-label">抓具类型</div>
                                    <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
                                      <span className="truncate">{pickGripperType}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="!font-normal h-6 px-1.5 text-[11px] text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text disabled:text-slate-300 disabled:hover:bg-transparent"
                                      disabled={!pickParameterOverridden}
                                      onClick={() => {
                                        updatePickConfigWithRecalculation(
                                          step.id!,
                                          (config) => ({
                                            ...config,
                                            gripperType,
                                            magnetSettings: createDefaultPickMagnetSettings(),
                                            coverageOverride: '',
                                            safetyCoefficientOverride: '',
                                            eccentricThresholdOverride: '',
                                          }),
                                          { markMagnet: true, markPoint: true, preview: true }
                                        );
                                      }}
                                    >
                                      重置
                                    </Button>
                                  </div>
                                </div>
                                <div className="mb-4 grid gap-2 sm:grid-cols-3">
                                  {pickMagnetDefinitions.map((magnet) => {
                                    const magnetSetting = pickMagnetSettings[magnet.name] ?? createDefaultPickMagnetSettings()[magnet.name];
                                    return (
                                      <div key={magnet.name} className="ds-parameter-card-inset rounded-lg bg-white ring-1 ring-slate-100">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                          <div className="flex min-w-0 items-center gap-1.5">
                                            <div className="truncate text-xs font-medium text-slate-700">{magnet.name}磁铁</div>
                                            <Tooltip title="设置磁铁参数">
                                              <button
                                                type="button"
                                                className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setMagnetParameterPanel({ stepId: step.id!, magnetName: magnet.name, minimized: false });
                                                }}
                                                aria-label={`设置${magnet.name}磁铁参数`}
                                              >
                                                <SolidGearIcon className="size-3" />
                                              </button>
                                            </Tooltip>
                                          </div>
                                          <CompactSwitch
                                            checked={magnetSetting.enabled}
                                            ariaLabel={`${magnet.name}磁铁启用状态`}
                                            onChange={(checked) =>
                                              updatePickConfigWithRecalculation(
                                                step.id!,
                                                (config) => ({
                                                  ...config,
                                                  magnetSettings: {
                                                    ...config.magnetSettings,
                                                    [magnet.name]: {
                                                      ...(config.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings()[magnet.name]),
                                                      enabled: checked,
                                                    },
                                                  },
                                                }),
                                                { markMagnet: true, markPoint: true, preview: true }
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="grid grid-cols-[14px_minmax(0,1fr)] items-center gap-1">
                                          <div className="text-[11px] text-slate-400">Z</div>
                                          <ProcessNumberField
                                            value={magnet.name === '中' ? '--' : magnetSetting.z}
                                            unit="mm"
                                            disabled={magnet.name === '中' || !magnetSetting.enabled}
                                            invalid={false}
                                            inputClassName="h-8 px-2 pr-8 text-left text-xs"
                                            onChange={(nextValue) => {
                                              if (magnet.name === '中') return;
                                              updatePickConfigWithRecalculation(
                                                step.id!,
                                                (config) => ({
                                                  ...config,
                                                  magnetSettings: {
                                                    ...config.magnetSettings,
                                                    [magnet.name]: {
                                                      ...(config.magnetSettings[magnet.name] ?? createDefaultPickMagnetSettings()[magnet.name]),
                                                      z: nextValue,
                                                    },
                                                  },
                                                }),
                                                { markMagnet: true, markPoint: true, preview: true }
                                              );
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="space-y-4">
                                  {[
                                    {
                                      label: '电磁铁覆盖率',
                                      threshold: `${pickCoverageThreshold}%`,
                                      result: pickConfig.actualCoverage ? `${pickConfig.actualCoverage}%` : '--',
                                      satisfied: pickCoverageSatisfied,
                                      failText: '低于阈值',
                                    },
                                    {
                                      label: '安全系数',
                                      threshold: pickSafetyThreshold,
                                      result: pickConfig.actualLoadCoefficient || '--',
                                      satisfied: pickSafetySatisfied,
                                      failText: '超出阈值',
                                    },
                                    {
                                      label: '偏心距',
                                      threshold: `${pickEccentricThreshold}mm`,
                                      result: pickConfig.actualEccentricDistance ? `${pickConfig.actualEccentricDistance}mm` : '--',
                                      satisfied: pickEccentricSatisfied,
                                      failText: '超出阈值',
                                    },
                                  ].map((row) => (
                                    <div key={row.label} className="flex min-h-8 items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-100">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <div className="shrink-0 text-xs text-ds-text-parameter-label">{row.label}</div>
                                        <div className="truncate text-xs font-medium text-slate-700">{row.result}</div>
                                      </div>
                                      <div className="shrink-0">
                                        {pickConfig.actualCoverage ? (
                                          <span className={`rounded-full px-2 py-0.5 text-[11px] ${row.satisfied ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {row.satisfied ? '满足阈值' : `${row.failText} ${row.threshold}`}
                                          </span>
                                        ) : (
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">待计算</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {pickConfig.actualCoverage && !pickThresholdSatisfied && (
                                  <Tooltip title="当前抓取计算结果超出阈值，请检查抓具、磁铁设置或重新生成抓取位置。">
                                    <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-red-500">
                                      <CircleAlert className="size-3.5" />
                                      当前计算结果有阈值异常
                                    </div>
                                  </Tooltip>
                                )}
                                <ProcessResultPointPanel
                                  title="路径点位"
                                  subtitle={uiSpec.pathSubtitle}
                                  dirty={isProcessPointDirty}
                                  surfaceClassName="bg-slate-50/80"
                                  className="mt-ds-200"
                                  action={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 gap-1 px-2 text-[11px]"
                                      onClick={() => {
                                        if (!step.id) return;
                                        toggleProcessPathPointModal(step.id);
                                      }}
                                    >
                                      <Eye className="size-3" />
                                      查看路径点位
                                    </Button>
                                  }
                                />
                              </div>
                            </div>
                          )}

                          {isPlaceStep && isExpanded && placeConfig && (
                            <div className="mt-ds-075 space-y-ds-150 border-t border-ds-border-subtle ds-parameter-content">
                              <ProcessSelectionPanel
                                className="p-ds-150"
                                label="工件模型选择"
                                items={leafParts}
                                selectedIds={placeConfig.workpieceIds}
                                placeholder="请选择工件模型"
                                actionLabel="生成支撑位置"
                                invalid={placeSelectionInvalid}
                                onChange={(nextIds) =>
                                  updateProcessStepById(step.id!, (currentStep) => ({
                                    ...currentStep,
                                    board: nextIds.length ? nextIds.map((id) => leafParts.find((leafPart) => leafPart.id === id)?.name ?? id).join('+') : currentStep.board,
                                    placeConfig: {
                                      ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
                                      workpieceIds: nextIds,
                                    },
                                  }))
                                }
                                onAction={() => {
                                  if (!step.id) return;
                                  if (!placeConfig.workpieceIds.length) {
                                    showToast('请先选择工件模型', 'error');
                                    return;
                                  }
                                  if (placeSelectionInvalid) {
                                    showToast('所选工件不相接，请重新选择', 'error');
                                    return;
                                  }
                                  const nextPoints = [
                                    { x: '80.0', y: '40.0', z: '0.0' },
                                    { x: '220.0', y: '40.0', z: '0.0' },
                                    { x: '360.0', y: '40.0', z: '0.0' },
                                    { x: '80.0', y: '180.0', z: '0.0' },
                                    { x: '220.0', y: '180.0', z: '0.0' },
                                    { x: '360.0', y: '180.0', z: '0.0' },
                                  ];
                                  const nextJoints = ['120.00', '0.00', '18.20', '36.80', '72.40', '-44.60', '28.30', '91.20'];
                                  updateProcessStepById(step.id, (currentStep) => ({
                                    ...currentStep,
                                    placeConfig: {
                                      ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
                                      points: nextPoints,
                                      joints: nextJoints,
                                    },
                                  }));
                                  setCollapsedPlacePointInfoIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(step.id!);
                                    return next;
                                  });
                                  setPlacePreviewOverlayStepId(step.id);
                                  showToast('已生成支撑位置', 'success');
                                }}
                              />

                              {renderPlaceSupportParameterControls(step.id, placeConfig)}

                              <ProcessResultPointPanel
                                title={uiSpec.resultTitle}
                                subtitle={uiSpec.resultSubtitle}
                                dirty={isProcessPointDirty}
                                onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
                                showUpdateButton={false}
                              >
                                  <div className="grid gap-2">
                                    {(placeConfig.joints ?? createEmptyPlaceProcessConfig().joints ?? []).map((jointValue, jointIndex) => (
                                      <ProcessJointAngleRow
                                        key={`${stepKey}-place-joint-${jointIndex}`}
                                        index={jointIndex}
                                        value={jointValue}
                                        selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === jointIndex}
                                        onSelect={() => step.id && showResultPointPosePreview(step.id, jointIndex)}
                                        onChange={(nextValue) => {
                                          markProcessPointDirty(step.id!);
                                          updateProcessStepById(step.id!, (currentStep) => ({
                                            ...currentStep,
                                            placeConfig: {
                                              ...(currentStep.placeConfig ?? createEmptyPlaceProcessConfig()),
                                              joints: (currentStep.placeConfig?.joints ?? createEmptyPlaceProcessConfig().joints ?? []).map((currentValue, currentIndex) =>
                                                currentIndex === jointIndex ? nextValue : currentValue
                                              ),
                                            },
                                          }));
                                          setPlacePreviewOverlayStepId(step.id!);
                                        }}
                                      />
                                    ))}
                                  </div>
                              </ProcessResultPointPanel>
                            </div>
                          )}


                          {isGrindStep && isExpanded && grindConfig && (
                            <div className="mt-ds-075 space-y-ds-150 border-t border-ds-border-subtle ds-parameter-content">
                              <ProcessSelectionPanel
                                className="p-3"
                                label="打磨特征选择"
                                items={grindFeatureItems}
                                selectedIds={grindConfig.featureIds}
                                placeholder="请选择打磨特征"
                                actionLabel="生成打磨路径"
                                emptyText="尚未提取打磨特征"
                                onChange={(nextIds) =>
                                  updateProcessStepById(step.id!, (currentStep) => ({
                                    ...currentStep,
                                    grindConfig: {
                                      ...(currentStep.grindConfig ?? createEmptyFeatureProcessConfig()),
                                      featureIds: nextIds,
                                    },
                                  }))
                                }
                                onAction={() => {
                                  if (!step.id) return;
                                  if (grindFeatureItems.length === 0) {
                                    showToast('请先提取打磨特征', 'error');
                                    return;
                                  }
                                  if (!grindConfig.featureIds.length) {
                                    showToast('请先选择打磨特征', 'error');
                                    return;
                                  }
                                  void generateGrindPathForStep(step.id, grindConfig.featureIds);
                                }}
                              />
                              <ProcessResultPointPanel
                                title={uiSpec.resultTitle}
                                subtitle={uiSpec.resultSubtitle}
                                dirty={isProcessPointDirty}
                                onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
                              >
                                {normalizeFeaturePosePoints(grindConfig.points, grindConfig.posePoints).map((point, pointIndex) => (
                                  <ProcessPosePointInfoRow
                                    key={`${stepKey}-grind-point-${pointIndex}`}
                                    label={`点位 ${pointIndex + 1}`}
                                    point={point}
                                    selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === pointIndex}
                                    onSelect={() => step.id && showResultPointPosePreview(step.id, pointIndex)}
                                    onAxisChange={(axis, nextValue) => {
                                      markProcessPointDirty(step.id!);
                                      updateProcessStepById(step.id!, (currentStep) => {
                                        const config = currentStep.grindConfig ?? createEmptyFeatureProcessConfig();
                                        const currentPosePoints = normalizeFeaturePosePoints(config.points, config.posePoints);
                                        const nextPosePoints = currentPosePoints.map((currentPoint, currentIndex) =>
                                          currentIndex === pointIndex ? { ...currentPoint, [axis]: nextValue } : currentPoint
                                        );
                                        return {
                                          ...currentStep,
                                          grindConfig: {
                                            ...config,
                                            posePoints: nextPosePoints,
                                            points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
                                          },
                                        };
                                      });
                                      setGrindPreviewOverlayStepId(step.id!);
                                    }}
                                  />
                                ))}
                              </ProcessResultPointPanel>
                              {uiSpec.showPathPanel && (
                                <ProcessResultPointPanel
                                  title="路径点位"
                                  subtitle={uiSpec.pathSubtitle}
                                  dirty={isProcessPointDirty}
                                  surfaceClassName="bg-slate-50/80"
                                  action={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 gap-1 px-2 text-[11px]"
                                      onClick={() => {
                                        if (!step.id) return;
                                        toggleProcessPathPointModal(step.id);
                                      }}
                                    >
                                      <Eye className="size-3" />
                                      查看路径点位
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                          )}


                          {isWeldStep && isExpanded && weldConfig && (
                            <div className="mt-ds-075 space-y-ds-150 border-t border-ds-border-subtle ds-parameter-content">
                              <ProcessSelectionPanel
                                className="p-3"
                                label="焊缝特征选择"
                                items={weldFeatureItems}
                                selectedIds={weldConfig.featureIds}
                                placeholder="请选择焊缝特征"
                                actionLabel={step.type === 'weld-scan' ? '生成定位焊扫描路径' : '生成定点焊接路径'}
                                emptyText="尚未提取焊缝特征"
                                onChange={(nextIds) =>
                                  updateProcessStepById(step.id!, (currentStep) => ({
                                    ...currentStep,
                                    weldConfig: {
                                      ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
                                      featureIds: nextIds,
                                    },
                                  }))
                                }
                                onAction={() => {
                                  if (!step.id) return;
                                  if (weldFeatureItems.length === 0) {
                                    showToast('请先提取焊缝特征', 'error');
                                    return;
                                  }
                                  if (!weldConfig.featureIds.length) {
                                    showToast('请先选择焊缝特征', 'error');
                                    return;
                                  }
                                  const weldPathPoints = [
                                    { x: '100.0', y: '70.0', z: '8.0' },
                                    { x: '220.0', y: '90.0', z: '8.0' },
                                    { x: '340.0', y: '110.0', z: '8.0' },
                                    { x: '460.0', y: '130.0', z: '8.0' },
                                    { x: '580.0', y: '150.0', z: '8.0' },
                                    { x: '700.0', y: '170.0', z: '8.0' },
                                    { x: '820.0', y: '190.0', z: '8.0' },
                                    { x: '940.0', y: '210.0', z: '8.0' },
                                  ];
                                  const scanPathPoints = weldPathPoints.slice(0, 6);
                                  const nextPoints = step.type === 'weld-scan' ? scanPathPoints : weldPathPoints;
                                  const nextPosePoints = nextPoints.map((point, pointIndex) => ({
                                    ...point,
                                    rx: '0.0',
                                    ry: '0.0',
                                    rz: pointIndex % 2 === 0 ? '45.0' : '48.0',
                                  }));
                                  updateProcessStepById(step.id, (currentStep) => ({
                                    ...currentStep,
                                    weldConfig: {
                                      ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
                                      points: nextPoints,
                                      posePoints: nextPosePoints,
                                      pathPointGroups:
                                        step.type === 'weld-scan'
                                          ? createPathPointGroups(compactWeldScanPathPointPreviews.length, currentStep)
                                          : createWeldPathPointGroups(),
                                    },
                                  }));
                                  setCollapsedPickPointInfoIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(`${step.id!}-weld`);
                                    return next;
                                  });
                                  setWeldPreviewOverlayStepId(step.id);
                                  showToast(step.type === 'weld-scan' ? '已生成定位焊扫描路径' : '已生成定点焊接路径', 'success');
                                }}
                              />
                              <ProcessResultPointPanel
                                title={uiSpec.resultTitle}
                                subtitle={uiSpec.resultSubtitle}
                                dirty={isProcessPointDirty}
                                onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
                              >
                                {step.type === 'weld' ? (
                                  <WeldSegmentPosePointGroups
                                    points={normalizeWeldPosePoints(weldConfig.posePoints)}
                                    selectedSegmentIndex={weldSegmentPreview?.stepId === step.id ? weldSegmentPreview.segmentIndex : null}
                                    selectedPointIndex={
                                      selectedResultPointPreview?.stepId === step.id
                                        ? selectedResultPointPreview.pointIndex
                                        : null
                                    }
                                    onPointSelect={(pointIndex) => {
                                      if (!step.id) return;
                                      showResultPointPosePreview(step.id, pointIndex);
                                    }}
                                    onSegmentSelect={(segmentIndex) => {
                                      if (!step.id) return;
                                      showWeldSegmentPreview(step.id, segmentIndex);
                                    }}
                                    onAxisChange={(pointIndex, axis, nextValue) => {
                                      markProcessPointDirty(step.id!);
                                      updateProcessStepById(step.id!, (currentStep) => {
                                        const currentPosePoints = normalizeWeldPosePoints(currentStep.weldConfig?.posePoints);
                                        const nextPosePoints = currentPosePoints.map((currentPoint, currentIndex) =>
                                          currentIndex === pointIndex ? { ...currentPoint, [axis]: nextValue } : currentPoint
                                        );
                                        return {
                                          ...currentStep,
                                          weldConfig: {
                                            ...(currentStep.weldConfig ?? createEmptyFeatureProcessConfig()),
                                            posePoints: nextPosePoints,
                                            points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
                                          },
                                        };
                                      });
                                      setWeldPreviewOverlayStepId(step.id!);
                                    }}
                                  />
                                ) : (
                                  normalizeFeaturePosePoints(weldConfig.points, weldConfig.posePoints).map((point, pointIndex) => (
                                    <ProcessPosePointInfoRow
                                      key={`${stepKey}-weld-point-${pointIndex}`}
                                      label={`点位 ${pointIndex + 1}`}
                                      point={point}
                                      selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === pointIndex}
                                      onSelect={() => step.id && showResultPointPosePreview(step.id, pointIndex)}
                                      onAxisChange={(axis, nextValue) => {
                                        markProcessPointDirty(step.id!);
                                        updateProcessStepById(step.id!, (currentStep) => {
                                          const config = currentStep.weldConfig ?? createEmptyFeatureProcessConfig();
                                          const currentPosePoints = normalizeFeaturePosePoints(config.points, config.posePoints);
                                          const nextPosePoints = currentPosePoints.map((currentPoint, currentIndex) =>
                                            currentIndex === pointIndex ? { ...currentPoint, [axis]: nextValue } : currentPoint
                                          );
                                          return {
                                            ...currentStep,
                                            weldConfig: {
                                              ...config,
                                              posePoints: nextPosePoints,
                                              points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
                                            },
                                          };
                                        });
                                        setWeldPreviewOverlayStepId(step.id!);
                                      }}
                                    />
                                  ))
                                )}
                              </ProcessResultPointPanel>
                              {uiSpec.showPathPanel && (
                                <ProcessResultPointPanel
                                  title="路径点位"
                                  subtitle={uiSpec.pathSubtitle}
                                  dirty={isProcessPointDirty}
                                  surfaceClassName="bg-slate-50/80"
                                  action={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 gap-1 px-2 text-[11px]"
                                      onClick={() => {
                                        if (!step.id) return;
                                        toggleProcessPathPointModal(step.id);
                                      }}
                                    >
                                      <Eye className="size-3" />
                                      查看路径点位
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                          )}

                          {isAssembleStep && isExpanded && assembleConfig && (
                            <div className="mt-ds-075 space-y-ds-150 border-t border-ds-border-subtle ds-parameter-content">
                              <ProcessSelectionPanel
                                className="p-3"
                                label="装配基准特征"
                                items={datumFeatureItems}
                                selectedIds={assembleConfig.featureIds}
                                placeholder="请选择装配基准特征"
                                actionLabel="生成定位路径"
                                emptyText="请先生成装配基准特征"
                                onChange={(nextIds) =>
                                  updateProcessStepById(step.id!, (currentStep) => ({
                                    ...currentStep,
                                    assembleConfig: {
                                      ...(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
                                      featureIds: nextIds,
                                    },
                                  }))
                                }
                                onAction={() => {
                                  if (!step.id) return;
                                  if (processFeatureItems.filter((item) => item.featureType === 'datum').length === 0) {
                                    showToast('请先生成装配基准特征', 'error');
                                    return;
                                  }
                                  if (!assembleConfig.featureIds.length) {
                                    showToast('请先选择装配基准特征', 'error');
                                    return;
                                  }
                                  const nextPoints = [
                                    { x: '90.0', y: '60.0', z: '12.0' },
                                    { x: '210.0', y: '88.0', z: '12.0' },
                                    { x: '330.0', y: '116.0', z: '12.0' },
                                    { x: '450.0', y: '144.0', z: '12.0' },
                                    { x: '570.0', y: '172.0', z: '12.0' },
                                    { x: '690.0', y: '200.0', z: '12.0' },
                                  ];
                                  const nextPosePoints = nextPoints.map((point, pointIndex) => ({
                                    ...point,
                                    rx: '0.0',
                                    ry: pointIndex % 2 === 0 ? '85.0' : '88.0',
                                    rz: '0.0',
                                  }));
                                  updateProcessStepById(step.id, (currentStep) => ({
                                    ...currentStep,
                                    assembleConfig: {
                                      ...(currentStep.assembleConfig ?? createEmptyFeatureProcessConfig()),
                                      featureIds: assembleConfig.featureIds,
                                      points: nextPoints,
                                      posePoints: nextPosePoints,
                                    },
                                  }));
                                  setCollapsedPlacePointInfoIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(`${step.id!}-assemble-visual`);
                                    return next;
                                  });
                                  setAssemblePreviewOverlayStepId(step.id);
                                  showToast('已生成定位路径', 'success');
                                }}
                              />
                              <ProcessResultPointPanel
                                title={uiSpec.resultTitle}
                                subtitle={uiSpec.resultSubtitle}
                                dirty={isProcessPointDirty}
                                onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
                              >
                                {normalizeFeaturePosePoints(assembleConfig.points, assembleConfig.posePoints).map((point, pointIndex) => (
                                  <ProcessPosePointInfoRow
                                    key={`${stepKey}-assemble-point-${pointIndex}`}
                                    label={`点位 ${pointIndex + 1}`}
                                    point={point}
                                    selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === pointIndex}
                                    onSelect={() => step.id && showResultPointPosePreview(step.id, pointIndex)}
                                    onAxisChange={(axis, nextValue) => {
                                      markProcessPointDirty(step.id!);
                                      updateProcessStepById(step.id!, (currentStep) => {
                                        const config = currentStep.assembleConfig ?? createEmptyFeatureProcessConfig();
                                        const currentPosePoints = normalizeFeaturePosePoints(config.points, config.posePoints);
                                        const nextPosePoints = currentPosePoints.map((currentPoint, currentIndex) =>
                                          currentIndex === pointIndex ? { ...currentPoint, [axis]: nextValue } : currentPoint
                                        );
                                        return {
                                          ...currentStep,
                                          assembleConfig: {
                                            ...config,
                                            posePoints: nextPosePoints,
                                            points: nextPosePoints.map(({ x, y, z }) => ({ x, y, z })),
                                          },
                                        };
                                      });
                                      setAssemblePreviewOverlayStepId(step.id!);
                                    }}
                                  />
                                ))}
                              </ProcessResultPointPanel>
                              {uiSpec.showPathPanel && (
                                <ProcessResultPointPanel
                                  title="路径点位"
                                  subtitle={uiSpec.pathSubtitle}
                                  dirty={isProcessPointDirty}
                                  surfaceClassName="bg-slate-50/80"
                                  action={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 gap-1 px-2 text-[11px]"
                                      onClick={() => {
                                        if (!step.id) return;
                                        toggleProcessPathPointModal(step.id);
                                      }}
                                    >
                                      <Eye className="size-3" />
                                      查看路径点位
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                          )}

                          {isClampStep && isExpanded && clampConfig && (
                            <div className="mt-ds-075 space-y-ds-150 border-t border-ds-border-subtle ds-parameter-content">
                              <ProcessSelectionPanel
                                className="p-3"
                                label="工件模型选择"
                                items={leafParts}
                                selectedIds={clampConfig.workpieceIds}
                                placeholder="请选择工件模型"
                                actionLabel="生成压紧位置"
                                invalid={clampSelectionInvalid}
                                onChange={(nextIds) =>
                                  updateProcessStepById(step.id!, (currentStep) => ({
                                    ...currentStep,
                                    board: nextIds.length ? nextIds.map((id) => leafParts.find((leafPart) => leafPart.id === id)?.name ?? id).join('+') : currentStep.board,
                                    turnoverClampConfig: {
                                      ...(currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig()),
                                      workpieceIds: nextIds,
                                    },
                                  }))
                                }
                                onAction={() => {
                                  if (!step.id) return;
                                  if (!clampConfig.workpieceIds.length) {
                                    showToast('请先选择工件模型', 'error');
                                    return;
                                  }
                                  if (clampSelectionInvalid) {
                                    showToast('所选工件不相接，请重新选择', 'error');
                                    return;
                                  }
                                  const nextJoints = ['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30', '6.80', '91.20'];
                                  updateProcessStepById(step.id, (currentStep) => ({
                                    ...currentStep,
                                    turnoverClampConfig: {
                                      ...(currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig()),
                                      joints: nextJoints,
                                    },
                                  }));
                                  setCollapsedClampPointInfoIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(step.id!);
                                    return next;
                                  });
                                  setClampPreviewOverlayStepId(step.id);
                                  showToast('已生成压紧位置', 'success');
                                }}
                              />

                              {renderClampParameterControls(step.id, clampConfig)}

                              <ProcessResultPointPanel
                                title={uiSpec.resultTitle}
                                subtitle={uiSpec.resultSubtitle}
                                dirty={isProcessPointDirty}
                                onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
                                showUpdateButton={false}
                              >
                                <div className="grid gap-2">
                                  {(clampConfig.joints ?? createEmptyTurnoverClampProcessConfig().joints ?? []).map((jointValue, jointIndex) => (
                                    <ProcessJointAngleRow
                                      key={`${stepKey}-clamp-joint-${jointIndex}`}
                                      index={jointIndex}
                                      value={jointValue}
                                      selected={selectedResultPointPreview?.stepId === step.id && selectedResultPointPreview.pointIndex === jointIndex}
                                      onSelect={() => step.id && showResultPointPosePreview(step.id, jointIndex)}
                                      onChange={(nextValue) => {
                                        markProcessPointDirty(step.id!);
                                        updateProcessStepById(step.id!, (currentStep) => ({
                                          ...currentStep,
                                          turnoverClampConfig: {
                                            ...(currentStep.turnoverClampConfig ?? createEmptyTurnoverClampProcessConfig()),
                                            joints: (currentStep.turnoverClampConfig?.joints ?? createEmptyTurnoverClampProcessConfig().joints ?? []).map((currentValue, currentIndex) =>
                                              currentIndex === jointIndex ? nextValue : currentValue
                                            ),
                                          },
                                        }));
                                        setClampPreviewOverlayStepId(step.id!);
                                      }}
                                    />
                                  ))}
                                </div>
                              </ProcessResultPointPanel>
                            </div>
                          )}
                        </div>
                      );
                    })
                    )}
                  </div>
                </div>
              ) : (
                /* 项目管理页：模型属性 */
                <ModelPropertiesPanel
                  project={previewProject}
                  selectedNodeId={previewSelectedId}
                />
              )}
            </ScrollArea>
            {currentProject && (
              <ScrollPanelEdge className="z-10 shadow-ds-footer-up" />
            )}
          </CardContent>
        </Card>
          </div>
        </div>
        </div>
      </div>

      {drawingRequiredDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">缺少装配图纸</span>
            </div>
            <div className="space-y-2 px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">请先上传图纸解析模型，再进入工艺规划。</p>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">{drawingRequiredDialog.name}</div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setDrawingRequiredDialog(null)}>取消</Button>
              <Button
                size="sm"
                className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover"
                onClick={() => {
                  setDrawingRequiredDialog(null);
                  openDrawingManager(drawingRequiredDialog.projectId);
                }}
              >
                去上传图纸
              </Button>
            </div>
          </div>
        </div>
      )}

      {addAssemblyDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <FolderPlus className="size-5 text-emerald-500" />
              <span className="text-sm font-medium">新增装配体</span>
            </div>
            <div className="space-y-2 px-5 py-4">
              <label className="text-xs text-slate-400" htmlFor="new-assembly-name">装配体名称</label>
              <input
                id="new-assembly-name"
                value={newAssemblyName}
                onChange={(event) => setNewAssemblyName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleConfirmAddAssembly();
                  if (event.key === 'Escape') setAddAssemblyDialog(null);
                }}
                autoFocus
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-orange-300"
                placeholder="请输入装配体名称"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setAddAssemblyDialog(null)}>取消</Button>
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={handleConfirmAddAssembly}>确认创建</Button>
            </div>
          </div>
        </div>
      )}

      {addProcessTaskDialog && currentProject && (() => {
        const selectionSpec = getAddProcessSelectionSpec(addProcessTaskDialog.type);
        const usesFixedStyleCWorkpiece = layoutVariant === 'immersive' && Boolean(selectedPlanningProcess) && (
          addProcessTaskDialog.type === 'pick' ||
          addProcessTaskDialog.type === 'place' ||
          addProcessTaskDialog.type === 'turnover-clamp'
        );
        const partSelectionInvalid =
          !usesFixedStyleCWorkpiece &&
          (addProcessTaskDialog.type === 'pick' || addProcessTaskDialog.type === 'place' || addProcessTaskDialog.type === 'turnover-clamp') &&
          !!objectTree &&
          addProcessTaskDialog.selectedIds.length > 1 &&
          addProcessTaskDialog.selectedIds.some((partId, partIndex, ids) =>
            ids.slice(partIndex + 1).some((otherId) => !arePartsAdjacent(partId, otherId, objectTree))
          );

        return (
          <AddProcessTaskDialogView onClose={() => setAddProcessTaskDialog(null)} onConfirm={confirmAddProcessTask}>
                {layoutVariant === 'immersive' && selectedPlanningProcess && (
                  <div className="flex items-center justify-between gap-3 rounded-ds-md bg-zinc-100/80 px-3 py-2 text-xs">
                    <span className="font-medium text-slate-700">第 {String(selectedPlanningProcess.sequence).padStart(2, '0')} 道 · {selectedPlanningProcess.name}</span>
                    <span className="truncate text-[11px] text-slate-400">{selectedPlanningProcess.station}</span>
                  </div>
                )}
                {layoutVariant === 'immersive' && selectedPlanningProcess && (
                  <div className="ds-label-input-compact">
                    <div className="text-xs text-ds-text-parameter-label">工件对象</div>
                    <div className="flex min-h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600">
                      {selectedPlanningProcess.displayObject}
                    </div>
                  </div>
                )}
                {!usesFixedStyleCWorkpiece && <div>
                  <div className="mb-2 text-xs text-ds-text-parameter-label">{layoutVariant === 'immersive' ? '任务类型' : '工序类型'}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {availableProcessStepTypeOptions.map((item) => {
                      const selected = item.key === addProcessTaskDialog.type;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs transition-colors ${
                            selected
                              ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/60 hover:text-ds-brand-primary-text'
                          }`}
                          onClick={() => updateAddProcessTaskType(item.key)}
                        >
                          <item.icon className="size-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>}
                {!usesFixedStyleCWorkpiece && <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xs text-ds-text-parameter-label">选择{selectionSpec.label}</span>
                    </div>
                    {partSelectionInvalid && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-red-500">
                        <CircleAlert className="size-3.5" />
                        所选工件不相接
                      </span>
                    )}
                  </div>
                  {selectionSpec.items.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 ring-1 ring-slate-200">
                      {selectionSpec.emptyText}
                    </div>
                  ) : selectionSpec.mode === 'single' ? (
                    <ProcessSingleSelect
                      items={selectionSpec.items}
                      selectedId={addProcessTaskDialog.selectedIds[0] ?? null}
                      placeholder={selectionSpec.placeholder}
                      elevation="none"
                      onChange={(nextId) =>
                        setAddProcessTaskDialog((prev) =>
                          prev ? { ...prev, selectedIds: nextId ? [nextId] : [] } : prev
                        )
                      }
                    />
                  ) : (
                    <ObjectMultiSelect
                      items={selectionSpec.items}
                      selectedIds={addProcessTaskDialog.selectedIds}
                      placeholder={selectionSpec.placeholder}
                      invalid={partSelectionInvalid}
                      onChange={(nextIds) =>
                        setAddProcessTaskDialog((prev) =>
                          prev ? { ...prev, selectedIds: nextIds } : prev
                        )
                      }
                    />
                  )}
                </div>}
              </AddProcessTaskDialogView>
        );
      })()}

      {createModelFolderPickerHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-[360px] rounded-xl bg-zinc-200 px-5 py-4 text-center shadow-xl shadow-black/10 ring-1 ring-white/60">
            <div className="text-sm font-medium text-zinc-700">本地选择文件夹</div>
            <div className="mt-1 text-xs text-zinc-500">正在选择 {createModelFolderPickerHint.assemblyName} 图纸文件夹...</div>
          </div>
        </div>
      )}

      {simulationFilePickerOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/20">
          <div className="w-[360px] rounded-xl bg-zinc-200 px-5 py-4 text-center shadow-xl shadow-black/10 ring-1 ring-white/60">
            <div className="text-sm font-medium text-zinc-700">本地选择文件</div>
            <div className="mt-1 text-xs text-zinc-500">正在选择包含第 06 / 12 道装配任务的仿真文件...</div>
          </div>
        </div>
      )}

      {/* 图纸管理弹窗 */}
      {drawingManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[800px] overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{drawingManagerTitle}</span>
                {drawingManagerLabel && (
                  <span className="text-xs text-slate-400">{drawingManagerLabel}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="size-7 p-0 text-slate-400 hover:text-slate-600"
                onClick={closeDrawingManager}
              >
                <X className="size-4" />
              </Button>
            </div>
            {drawingManagerProject ? (
              <div className="flex h-[480px]">
                {/* 左侧：图纸列表 */}
                <div className="w-[300px] shrink-0 border-r border-white/50 bg-ds-bg-glass-modal-sidebar flex flex-col">
                  {/* 顶部导入文件夹按钮 */}
                  <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-white/50 bg-white/25 px-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2 text-[11px]"
                      title="导入文件夹"
                      disabled={createModelFlow?.stage === 'missing-assembly'}
                      onClick={() => handleDrawingManagerBatchImport(drawingManagerProject.id)}
                    >
                      <FolderPlus className="size-3" />
                      导入文件夹
                    </Button>
                  </div>
                  {/* 图纸列表 */}
                  <div className="flex-1 overflow-auto p-3 space-y-1.5">
                    <div className="flex items-center justify-between px-1 pt-0.5">
                      <div className="text-[11px] font-medium text-slate-400">装配图纸</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 px-2 text-[11px]"
                        title="导入装配图纸"
                        onClick={() =>
                          createModelFlow
                            ? handleCreateModelAssemblyImport()
                            : handleDrawingManagerBatchImport(drawingManagerProject.id)
                        }
                      >
                        <Import className="size-3" />
                        导入
                      </Button>
                    </div>
                    {/* 装配图纸 */}
                    <div
                      className={`group flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                        selectedDrawingItem?.type === 'assembly'
                          ? 'border-orange-200 bg-orange-50'
                          : drawingManagerProject.hasAssemblyDrawing
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-white hover:bg-red-50'
                      }`}
                      onClick={() =>
                        setSelectedDrawingItem({
                          type: 'assembly',
                          id: drawingManagerProject.id,
                          name: '装配图纸',
                        })
                      }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {drawingManagerProject.hasAssemblyDrawing ? (
                            <FileSpreadsheet
                              className={`size-4 shrink-0 ${selectedDrawingItem?.type === 'assembly' ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'}`}
                            />
                          ) : (
                            <FileQuestion className="size-4 shrink-0 text-red-400" />
                          )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-700 truncate">装配图纸</div>
                          <div className={`text-[10px] ${drawingManagerProject.hasAssemblyDrawing ? 'text-slate-400' : 'text-red-400'}`}>
                            {drawingManagerProject.hasAssemblyDrawing ? (createModelFlow ? '已导入' : '已上传') : '缺失'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`size-6 shrink-0 p-0 ${drawingManagerProject.hasAssemblyDrawing ? 'text-slate-400 hover:text-orange-500' : 'text-red-400 hover:text-red-500'}`}
                        title={createModelFlow ? '导入装配图纸' : drawingManagerProject.hasAssemblyDrawing ? '重新导入（将替换原图纸）' : '导入装配图纸'}
                        disabled={createModelFlow?.stage === 'missing-assembly'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (createModelFlow) {
                            handleCreateModelAssemblyImport();
                          } else if (drawingManagerProject.hasAssemblyDrawing) {
                            setReplaceConfirm({
                              type: 'assembly',
                              id: drawingManagerProject.id,
                              name: '装配图纸',
                            });
                          } else {
                            // 缺失图纸直接导入
                            const targetId = drawingManagerProject.id;
                            const isSuccess = Math.random() > 0.5;
                            if (isSuccess) {
                              setUpdatedDrawingIds((prev) => {
                                const next = new Set(prev);
                                next.add(targetId);
                                return next;
                              });
                              showToast('解析成功，导入成功', 'success');
                            } else {
                              showToast('图纸解析失败，导入失败', 'error');
                            }
                          }
                        }}
                      >
                        <Import className="size-3" />
                      </Button>
                    </div>

                    {/* 零件图纸标题 */}
                    <div className="flex items-center justify-between px-1 pt-1">
                      <div className="text-[11px] font-medium text-slate-400">零件图纸</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 px-2 text-[11px]"
                        title="导入零件图纸"
                        disabled={createModelFlow?.stage === 'missing-assembly'}
                        onClick={() => handleDrawingManagerBatchImport(drawingManagerProject.id)}
                      >
                        <Import className="size-3" />
                        导入
                      </Button>
                    </div>

                    {createModelFlow?.stage === 'missing-assembly' ? (
                      <div className="rounded-md border border-dashed border-slate-200 bg-white/45 px-3 py-4 text-center text-[11px] text-slate-400">
                        请先导入装配图纸
                      </div>
                    ) : collectModels(drawingManagerProject.tree).map((part) => {
                      const hasPartDrawing = hasPartDrawingInDrawingManager(part.id);
                      return (
                      <div
                        key={part.id}
                        className={`group flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                          selectedDrawingItem?.type === 'part' && selectedDrawingItem?.id === part.id
                            ? 'border-orange-200 bg-orange-50'
                            : hasPartDrawing
                              ? 'bg-white hover:bg-slate-50'
                              : 'bg-white hover:bg-red-50'
                        }`}
                        onClick={() =>
                          setSelectedDrawingItem({
                            type: 'part',
                            id: part.id,
                            name: part.name,
                          })
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {hasPartDrawing ? (
                            <FileMinus
                              className={`size-4 shrink-0 ${selectedDrawingItem?.type === 'part' && selectedDrawingItem?.id === part.id ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-500'}`}
                            />
                          ) : (
                            <FileQuestion className="size-4 shrink-0 text-red-400" />
                          )}
                          <div className="min-w-0">
                            <span className="block truncate text-xs text-slate-700">{part.name}</span>
                            <span className={`block text-[10px] ${hasPartDrawing ? 'text-slate-400' : 'font-medium text-red-400'}`}>
                              {hasPartDrawing ? (createModelFlow ? '已导入' : '已上传') : '缺失'}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`size-6 shrink-0 p-0 ${hasPartDrawing ? 'text-slate-400 hover:text-orange-500' : 'text-red-400 hover:text-red-500'}`}
                            title={createModelFlow ? '导入零件图纸' : hasPartDrawing ? '重新导入零件图纸（将替换原图纸）' : '导入零件图纸'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (createModelFlow) {
                                handleCreateModelPartImport(part.id);
                              } else if (hasPartDrawing) {
                                setReplaceConfirm({
                                  type: 'part',
                                  id: part.id,
                                  name: part.name,
                                });
                              } else {
                                // 缺失图纸直接导入
                                const targetId = part.id;
                                const isSuccess = Math.random() > 0.5;
                                if (isSuccess) {
                                  setUpdatedDrawingIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(targetId);
                                    return next;
                                  });
                                  showToast('解析成功，导入成功', 'success');
                                } else {
                                  showToast('图纸解析失败，导入失败', 'error');
                                }
                              }
                            }}
                          >
                            <Import className="size-3" />
                          </Button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* 右侧：图纸预览 */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/50 px-4">
                    {selectedDrawingItem ? (
                      (() => {
                        const isAssembly = selectedDrawingItem.type === 'assembly';
                        const hasDrawing = isAssembly
                          ? drawingManagerProject.hasAssemblyDrawing
                          : hasPartDrawingInDrawingManager(selectedDrawingItem.id);
                        return (
                          <>
                            {isAssembly ? (
                              hasDrawing ? (
                                <FileSpreadsheet className="size-4 text-orange-500" />
                              ) : (
                                <FileQuestion className="size-4 text-red-400" />
                              )
                            ) : hasDrawing ? (
                              <FileMinus className="size-4 text-orange-500" />
                            ) : (
                              <FileQuestion className="size-4 text-red-400" />
                            )}
                            <span className="truncate text-sm font-medium text-slate-700">
                              {selectedDrawingItem.name}
                            </span>
                            {!hasDrawing && (
                              <span className="text-[10px] text-red-400">缺失</span>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-slate-400">请选择左侧图纸查看预览</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-white/20">
                    {selectedDrawingItem ? (
                      (() => {
                        const isAssembly = selectedDrawingItem.type === 'assembly';
                        const hasDrawing = isAssembly
                          ? drawingManagerProject.hasAssemblyDrawing
                          : hasPartDrawingInDrawingManager(selectedDrawingItem.id);
                        return hasDrawing ? (
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            {isAssembly ? (
                              <FileSpreadsheet className="size-20 opacity-20" />
                            ) : (
                              <FileMinus className="size-20 opacity-20" />
                            )}
                            <div className="text-sm">
                              {isAssembly
                                ? '装配图纸预览区域'
                                : '零件二维图纸预览区域'}
                            </div>
                            <div className="text-xs text-slate-300">（占位示意 - 图纸预览待接入）</div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-red-300">
                            <FileQuestion className="size-20 opacity-30" />
                            <div className="text-sm text-red-400">图纸缺失</div>
                            <div className="text-xs text-red-300">请通过左侧列表导入图纸</div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <FileCog className="size-12 opacity-30" />
                        <span className="text-xs">在左侧选择图纸查看预览</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                请先选择左侧项目
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              {createModelFlow ? (
                <Button
                  size="sm"
                  disabled={createModelHasMissingDrawings}
                  onClick={confirmCreateModelParsing}
                >
                  确认解析
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={closeDrawingManager}>
                  关闭
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {assemblyContextMenu && currentProject && (
        <div
          className="fixed z-[80] w-44 overflow-hidden rounded-md border border-white/50 bg-ds-bg-glass-modal py-1 shadow-lg shadow-black/5 backdrop-blur-md"
          style={{ left: assemblyContextMenu.x, top: assemblyContextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-ds-brand-primary-text"
            onClick={handleCreateWeldFeatureFromContext}
          >
            <Flame className="size-3.5 text-orange-500" />
            新建焊缝特征
          </button>
          <button
            type="button"
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-ds-brand-primary-text"
            onClick={handleCreateGrindFeatureFromContext}
          >
            <Sparkles className="size-3.5 text-teal-500" />
            新建打磨特征
          </button>
          <button
            type="button"
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-xs text-slate-700 hover:bg-orange-50 hover:text-ds-brand-primary-text"
            onClick={handleCreateDatumFeatureFromContext}
          >
            <Target className="size-3.5 text-blue-500" />
            新建装配基准
          </button>
        </div>
      )}

      {processContextMenu && (
        <div
          className="fixed z-[80] w-36 overflow-hidden rounded-md border border-white/50 bg-ds-bg-glass-modal py-1 shadow-lg shadow-black/5 backdrop-blur-md"
          style={{ left: processContextMenu.x, top: processContextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-xs text-red-600 hover:bg-red-50"
            onClick={() => {
              setDeleteConfirm({
                ids: [processContextMenu.stepId],
                label: '选中的任务条目',
                kind: 'process',
              });
              setProcessContextMenu(null);
            }}
          >
            <Trash2 className="size-3.5" />
            删除
          </button>
        </div>
      )}

      {processRegenerationConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-[460px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">重新生成全部任务</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                重新生成将根据当前工艺参数替换全部现有任务。任务参数、结果点位、路径点位、排序、禁用状态及手动新增任务都会被覆盖，此操作无法撤销。
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setProcessRegenerationConfirmOpen(false)}>取消</Button>
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={confirmRegenerateProcessSequence}>
                替换并重新生成
              </Button>
            </div>
          </div>
        </div>
      )}

      {closeProcessPlanningConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">关闭工艺规划</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                {closeProcessPlanningConfirm.name} 仍有未保存的工艺规划更改。关闭将丢弃所有未保存的工艺规划更改，是否确认丢弃？
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setCloseProcessPlanningConfirm(null)}>继续编辑</Button>
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={confirmCloseProcessPlanningProject}>确认丢弃</Button>
            </div>
          </div>
        </div>
      )}

      {backUnsavedNoticeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">当前未保存</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                当前装配体工艺规划尚未保存。返回项目管理后，可以稍后在顶部“工艺规划”下拉任务中继续编辑。
              </p>
            </div>
            <div className="flex items-center justify-end border-t border-white/50 px-5 py-3">
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={confirmBackWithUnsavedProcessPlanning}>确认</Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-[400px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-red-500" />
              <span className="font-medium text-sm">确认删除</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-600">
                {deleteConfirm.kind === 'process'
                  ? `是否确认删除${deleteConfirm.ids.length > 1 ? `这 ${deleteConfirm.ids.length} 项` : '选中的'}任务条目？删除后将同时移除其关联配置且无法恢复`
                  : deleteConfirm.kind === 'feature'
                    ? '确认删除选中的特征？删除后需重新提取生成'
                    : '确认删除选中的三维模型？删除后需重新导入图纸'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                取消
              </Button>
              <Button
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={handleConfirmDelete}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 图纸替换确认弹窗 */}
      {replaceConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-[400px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-amber-500" />
              <span className="font-medium text-sm">确认导入图纸</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-600">
                导入新图纸将替换当前 <span className="font-medium text-slate-800">{replaceConfirm.name}</span> 的已有图纸，是否继续？
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplaceConfirm(null)}
              >
                取消
              </Button>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleReplaceConfirm}
              >
                确认替换
              </Button>
            </div>
          </div>
        </div>
      )}

      {processParameterModalOpen && (
        <ProcessParameterModalView
          scrolled={processParameterScrolled}
          onClose={requestCloseProcessParameterModal}
          onSave={saveProcessParameters}
        >
            <div className="flex min-h-0 flex-1">
              <div className="flex w-[240px] shrink-0 flex-col border-r border-white/50 bg-ds-bg-glass-modal-sidebar">
                <div className="flex-1 space-y-1 p-3">
                  {processParameterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                        activeProcessParameterTab === tab.key
                          ? 'bg-orange-50 text-ds-brand-primary-hover'
                          : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                      }`}
                      onClick={() => setActiveProcessParameterTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative min-w-0 flex-1">
                <div
                  className={`h-full overflow-auto px-5 pb-5 pt-4 ${layoutVariant === 'immersive' ? 'bg-white/50' : ''}`}
                  onScrollCapture={(event) => {
                    const nextScrolled = event.currentTarget.scrollTop > 2;
                    setProcessParameterScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
                  }}
                  onChangeCapture={markProcessParameterDirty}
                >
                  {activeProcessParameterTab === 'pick' ? (
                  <div className="space-y-4">
                    <div className="flex h-10 items-end gap-5 border-b border-white/70 px-1">
                        {gripperTypes.map((item) => {
                          const selected = gripperType === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={selected}
                              className={`relative flex h-full items-start px-0.5 pt-1 text-sm font-medium transition-colors ${
                                selected
                                  ? 'text-zinc-800'
                                  : 'text-zinc-400 hover:text-zinc-600'
                              }`}
                              onClick={() => {
                                if (gripperType !== item) markProcessParameterDirty();
                                setGripperType(item);
                              }}
                            >
                              {item}
                              <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${selected ? 'bg-ds-brand-primary' : 'bg-transparent'}`} />
                            </button>
                          );
                        })}
                    </div>

                    <div className="space-y-ds-150 ds-parameter-card">
                      <div className="grid gap-ds-150 xl:grid-cols-3">
                      {pickMagnetDefinitions.map((magnet) => {
                        const magnetPreset = processParameterGripperPresets[gripperType][magnet.name];
                        const magnetDisabled = activeGripperConfig.magnetEnabled[magnet.name] === false;
                        return (
                        <div key={magnet.name} className="ds-parameter-card-inset rounded-ds-xl bg-zinc-100/55 ring-1 ring-ds-border-default">
                          <div className="mb-ds-200 flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-800">{magnet.name}磁铁</div>
                            <ParameterSwitch
                              checked={activeGripperConfig.magnetEnabled[magnet.name] ?? true}
                              ariaLabel={`${magnet.name}磁铁启用状态`}
                              size="sm"
                              onChange={(checked) =>
                                updateGripperConfig((config) => ({
                                  ...config,
                                  magnetEnabled: { ...config.magnetEnabled, [magnet.name]: checked },
                                }))
                              }
                            />
                          </div>
                          <div className={`space-y-ds-150 ${magnetDisabled ? 'opacity-60' : ''}`}>
                            <div className="grid grid-cols-2 gap-ds-150">
                              <div className="ds-parameter-field">
                                <div className="text-xs text-slate-400">磁铁尺寸 - 长</div>
                                <ProcessNumberField value={magnetPreset.length} unit="mm" disabled={magnetDisabled} />
                              </div>
                              <div className="ds-parameter-field">
                                <div className="text-xs text-slate-400">磁铁尺寸 - 宽</div>
                                <ProcessNumberField value={magnetPreset.width} unit="mm" disabled={magnetDisabled} />
                              </div>
                            </div>
                            <div className="ds-parameter-field">
                              <div className="flex items-center gap-ds-050 text-xs text-slate-400">
                                <span>磁力档位配置</span>
                                <Tooltip title="用户调整磁力以避免抓取粘连">
                                  <CircleAlert className="size-3.5 text-slate-300" />
                                </Tooltip>
                              </div>
                              <PickMagnetForceLevelSelect
                                value={activeGripperConfig.magnetForceLevels[magnet.name]}
                                onChange={(nextValue) => updateGripperConfig((config) => ({ ...config, magnetForceLevels: { ...config.magnetForceLevels, [magnet.name]: nextValue } }))}
                                disabled={magnetDisabled}
                              />
                            </div>
                            <div className={`grid gap-ds-150 ${magnet.name === '中' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              <div className="ds-parameter-field">
                                <div className="text-xs text-slate-400">额定负载</div>
                                <ProcessNumberField value={magnetPreset.load} unit="kg" disabled={magnetDisabled} />
                              </div>
                              {magnet.name !== '中' && (
                                <div className="ds-parameter-field">
                                  <div className="text-xs text-slate-400">升降行程</div>
                                  <ProcessNumberField value={magnetPreset.travel} unit="mm" disabled={magnetDisabled} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      </div>
                      <div className="p-ds-150">
                        <div className="mb-ds-100 text-xs font-medium text-slate-500">磁铁间距</div>
                        <div className="grid gap-ds-150 sm:grid-cols-2">
                          {['左--中磁铁间距', '中--右磁铁间距'].map((label) => {
                            const spacingKey = label.replace('磁铁间距', '');
                            return (
                              <div key={label} className="ds-parameter-field">
                                <div className="flex items-center gap-ds-050 text-xs text-slate-400">
                                  <span>{label}</span>
                                  <Tooltip
                                    title={
                                      <div className="max-w-[220px] overflow-hidden rounded-md">
                                        <img
                                          src={magnetShowcaseImg}
                                          alt="磁铁间距示意"
                                          className="block max-h-[180px] w-full object-contain"
                                        />
                                      </div>
                                    }
                                  >
                                    <CircleAlert className="size-3.5 text-slate-300" />
                                  </Tooltip>
                                </div>
                                <ProcessNumberField
                                  value={activeGripperConfig.magnetSpacing[spacingKey]}
                                  onChange={(nextValue) => updateGripperConfig((config) => ({ ...config, magnetSpacing: { ...config.magnetSpacing, [spacingKey]: nextValue } }))}
                                  unit="mm"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="ds-parameter-card ds-parameter-card-title-stack">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          覆盖率阈值
                          <Tooltip title="低于该覆盖率阈值时提示重新规划抓点。">
                            <CircleAlert className="size-3.5 text-slate-300" />
                          </Tooltip>
                        </div>
                        <div>
                          <ProcessPercentSlider value={activeGripperConfig.coverageThreshold} onChange={(nextValue) => updateGripperConfig((config) => ({ ...config, coverageThreshold: nextValue }))} />
                        </div>
                      </div>
                      <div className="ds-parameter-card ds-parameter-card-title-stack">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          安全阈值系数
                          <Tooltip title="实际磁力 100kg 时，工件重量小于 80kg 可抓取。">
                            <CircleAlert className="size-3.5 text-slate-300" />
                          </Tooltip>
                        </div>
                        <div>
                          <ProcessNumberField value={activeGripperConfig.safetyCoefficient} inputClassName="pr-10" onChange={(nextValue) => updateGripperConfig((config) => ({ ...config, safetyCoefficient: nextValue }))} />
                        </div>
                      </div>
                      <div className="ds-parameter-card ds-parameter-card-title-stack">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          偏心距阈值
                          <Tooltip title="工件质心与实际抓取质心距离需小于该阈值。">
                            <CircleAlert className="size-3.5 text-slate-300" />
                          </Tooltip>
                        </div>
                        <div>
                          <ProcessNumberField value={activeGripperConfig.eccentricThreshold} unit="mm" onChange={(nextValue) => updateGripperConfig((config) => ({ ...config, eccentricThreshold: nextValue }))} />
                        </div>
                      </div>
                    </div>

                    <div className="ds-parameter-card ds-parameter-card-title-stack">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                        <span>抓取路径设置：安全点高度</span>
                        <Tooltip title="左侧为下降路径安全点，末端向右切换后上升至右侧路径安全点，各点高度均可独立设置。">
                          <CircleAlert className="size-3.5 text-slate-300" />
                        </Tooltip>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <div className="relative mx-auto h-[184px] w-[280px]">
                            <div className="absolute left-[108px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
                            <div className="absolute left-[108px] bottom-[24px] h-[3px] w-[76px] rounded-full bg-red-500" />
                            <ArrowRight className="absolute left-[134px] bottom-[15px] size-5 text-red-500" strokeWidth={2.75} />
                            <div className="absolute left-[184px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />

                            {[
                              { top: '16px', left: '108px', value: '900' },
                              { top: '62px', left: '108px', value: '650' },
                              { top: '108px', left: '108px', value: '420' },
                            ].map((point, index) => (
                              <div key={`left-${index}`}>
                                <div className="absolute flex items-center gap-2" style={{ top: point.top, left: '6px' }}>
                                  <div className="relative w-[88px]">
                                    <ProcessNumberField defaultValue={point.value} unit="mm" inputClassName="pr-10 text-right" />
                                  </div>
                                  <div className="size-3 rounded-full border-2 border-ds-brand-primary bg-white" />
                                </div>
                              </div>
                            ))}

                            {[
                              { top: '108px', left: '184px', value: '180' },
                              { top: '62px', left: '184px', value: '420' },
                              { top: '16px', left: '184px', value: '700' },
                            ].map((point, index) => (
                              <div key={`right-${index}`}>
                                <div className="absolute flex items-center gap-2" style={{ top: point.top, left: '178px' }}>
                                  <div className="size-3 rounded-full border-2 border-ds-brand-primary bg-white" />
                                  <div className="relative w-[88px]">
                                    <ProcessNumberField defaultValue={point.value} unit="mm" inputClassName="pr-10" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>
                    </div>
                  </div>
                ) : activeProcessParameterTab === 'workbench' ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex h-10 items-end gap-5 overflow-x-auto border-b border-white/70 px-1">
                        {workbenchTypes.map((item) => {
                          const selected = workbenchType === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={selected}
                              className={`relative flex h-full shrink-0 items-start px-0.5 pt-1 text-sm font-medium transition-colors ${
                                selected
                                  ? 'text-zinc-800'
                                  : 'text-zinc-400 hover:text-zinc-600'
                              }`}
                              onClick={() => {
                                if (workbenchType !== item) markProcessParameterDirty();
                                setWorkbenchType(item);
                              }}
                            >
                              {item}
                              <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${selected ? 'bg-ds-brand-primary' : 'bg-transparent'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                      {[
                        { key: 'support' as const, label: '支撑参数' },
                        { key: 'clamp' as const, label: '压紧参数' },
                      ].map((item) => {
                        const selected = activeWorkbenchParameterTab === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            aria-pressed={selected}
                            className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-white text-ds-brand-primary-hover shadow-sm'
                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                            }`}
                            onClick={() => setActiveWorkbenchParameterTab(item.key)}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {activeWorkbenchParameterTab === 'support' && (
                    <div className="ds-parameter-card">
                      <div className="mb-4 text-sm font-medium text-slate-800">支撑参数</div>
                      <div className="space-y-4">
                        <ProcessMultiSelectBlock
                          label="支撑编号"
                          values={workbenchSupportIdOptions[workbenchType]}
                          selectedValues={activeWorkbenchConfig.supportIds}
                          className="px-3"
                          onToggle={(item) =>
                            updateWorkbenchConfig((config) => ({
                              ...config,
                              supportIds: config.supportIds.includes(item)
                                ? config.supportIds.filter((value) => value !== item)
                                : [...config.supportIds, item],
                              supportSettings: config.supportSettings[item]
                                ? config.supportSettings
                                : {
                                  ...config.supportSettings,
                                  [item]: createDefaultWorkbenchSupportSetting(item),
                                },
                            }))
                          }
                        />

                        {activeWorkbenchConfig.supportIds.length > 0 && (
                          <div className="grid gap-3 xl:grid-cols-2">
                            {activeWorkbenchConfig.supportIds.map((supportId) => {
                              const supportSetting = activeWorkbenchConfig.supportSettings[supportId] ?? createDefaultWorkbenchSupportSetting(supportId);
                              const supportAxes = workbenchSupportAxisOptions[workbenchType][supportId] ?? ['Y', 'Z'];
                              return (
                                <div key={supportId} className="ds-parameter-card-inset rounded-ds-xl bg-zinc-100/55 ring-1 ring-ds-border-default">
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-slate-700">支撑 {supportId}</div>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">编号 {supportId}</span>
                                  </div>
                                  <div className="grid gap-ds-150 md:grid-cols-2">
                                    <div className="ds-parameter-field">
                                      <div className="ds-parameter-label">支撑宽度</div>
                                      <ProcessNumberField
                                        value={supportSetting.width}
                                        unit="mm"
                                        onChange={(nextValue) =>
                                          updateWorkbenchSupportSetting(supportId, (setting) => ({
                                            ...setting,
                                            width: nextValue,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="ds-parameter-field">
                                      <div className="ds-parameter-label">零件位置</div>
                                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                                        {['左端', '右端'].map((item) => {
                                          const selected = supportSetting.partPosition === item;
                                          return (
                                            <button
                                              key={item}
                                              type="button"
                                              aria-pressed={selected}
                                              className={`min-h-8 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                                selected
                                                  ? 'bg-white text-ds-brand-primary-hover shadow-sm'
                                                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                                              }`}
                                              onClick={() =>
                                                updateWorkbenchSupportSetting(supportId, (setting) => ({
                                                  ...setting,
                                                  partPosition: item,
                                                }))
                                              }
                                            >
                                              {item}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-ds-150 ds-parameter-subfield-stack">
                                    <div className="text-xs text-slate-400">软限位轴</div>
                                    {supportAxes.map((axis) => {
                                      const axisWarningText = getProcessNumberRangeWarning(supportSetting.softLimits[axis].min, supportSetting.softLimits[axis].max);
                                      return (
                                      <div key={axis} className="ds-parameter-field">
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                          <div className="font-medium text-slate-600">{axis} 轴</div>
                                          {axisWarningText && (
                                            <div className="flex items-center gap-1 text-red-500">
                                              <CircleAlert className="size-3.5" />
                                              <span>{axisWarningText}</span>
                                            </div>
                                          )}
                                        </div>
                                        <ProcessNumberRangeField
                                          minValue={supportSetting.softLimits[axis].min}
                                          maxValue={supportSetting.softLimits[axis].max}
                                          minLabel="最小值"
                                          maxLabel="最大值"
                                          unit="mm"
                                          warningPlacement="none"
                                          onMinChange={(nextValue) =>
                                            updateWorkbenchSupportSetting(supportId, (setting) => ({
                                              ...setting,
                                              softLimits: {
                                                ...setting.softLimits,
                                                [axis]: {
                                                  ...setting.softLimits[axis],
                                                  min: nextValue,
                                                },
                                              },
                                            }))
                                          }
                                          onMaxChange={(nextValue) =>
                                            updateWorkbenchSupportSetting(supportId, (setting) => ({
                                              ...setting,
                                              softLimits: {
                                                ...setting.softLimits,
                                                [axis]: {
                                                  ...setting.softLimits[axis],
                                                  max: nextValue,
                                                },
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="grid gap-ds-150 xl:grid-cols-2">
                        <div className="ds-parameter-card ds-parameter-card-sm">
                          <div className="text-sm font-medium text-slate-700">支撑间距阈值</div>
                          <div className="mt-ds-150">
                            <ProcessNumberRangeField defaultMinValue="300" defaultMaxValue="1200" minLabel="最小间距" maxLabel="最大间距" unit="mm" />
                          </div>
                        </div>
                        <div className="ds-parameter-card ds-parameter-card-sm">
                          <div className="text-sm font-medium text-slate-700">单个支撑范围阈值</div>
                          <div className="mt-ds-150">
                            <ProcessNumberRangeField defaultMinValue="150" defaultMaxValue="450" minLabel="最小范围" maxLabel="最大范围" unit="mm" />
                          </div>
                        </div>

                        <div className="ds-parameter-card ds-parameter-card-sm">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <span>支撑覆盖率阈值</span>
                            <Tooltip title="例 70%">
                              <CircleAlert className="size-3.5 text-slate-300" />
                            </Tooltip>
                          </div>
                          <div className="mt-ds-150">
                            <ProcessPercentSlider value={activeWorkbenchConfig.supportCoverage} onChange={(nextValue) => updateWorkbenchConfig((config) => ({ ...config, supportCoverage: nextValue }))} />
                          </div>
                        </div>
                        <div className="ds-parameter-card ds-parameter-card-sm">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            <span>支撑位置采样间隔</span>
                            <Tooltip title="当支撑位置不满足覆盖率阈值时，按该采样间隔调整支撑位置。">
                              <CircleAlert className="size-3.5 text-slate-300" />
                            </Tooltip>
                          </div>
                          <div className="mt-ds-150">
                            <ProcessNumberField defaultValue="50" unit="mm" />
                          </div>
                        </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {activeWorkbenchParameterTab === 'clamp' && (
                    <div className="ds-parameter-card">
                      <div className="mb-4 text-sm font-medium text-slate-800">压紧参数</div>
                      <div className="ds-parameter-stack">
                        <ProcessMultiSelectBlock
                          label="压紧编号"
                          values={workbenchClampIdOptions[workbenchType]}
                          selectedValues={activeWorkbenchConfig.clampIds}
                          className="px-3"
                          onToggle={(item) =>
                            updateWorkbenchConfig((config) => ({
                              ...config,
                              clampIds: config.clampIds.includes(item) ? config.clampIds.filter((value) => value !== item) : [...config.clampIds, item],
                              clampSettings: config.clampSettings[item]
                                ? config.clampSettings
                                : {
                                  ...config.clampSettings,
                                  [item]: createDefaultWorkbenchClampSetting(item),
                                },
                            }))
                          }
                        />

                        {activeWorkbenchConfig.clampIds.length > 0 && (
                          <div className="grid gap-ds-150 xl:grid-cols-2">
                            {activeWorkbenchConfig.clampIds.map((clampId) => {
                              const clampSetting = activeWorkbenchConfig.clampSettings[clampId] ?? createDefaultWorkbenchClampSetting(clampId);
                              const clampAxes = workbenchClampAxisOptions[workbenchType][clampId] ?? ['Y', 'Z'];
                              return (
                                <div key={clampId} className="ds-parameter-card-inset rounded-ds-xl bg-zinc-100/55 ring-1 ring-ds-border-default">
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-slate-700">压紧 {clampId}</div>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">编号 {clampId}</span>
                                  </div>
                                  <div className="grid gap-ds-150 md:grid-cols-2">
                                    <div className="ds-parameter-field">
                                      <div className="ds-parameter-label">压紧类型</div>
                                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                                        {['翻转', '定位焊'].map((item) => {
                                          const selected = clampSetting.type === item;
                                          return (
                                            <button
                                              key={item}
                                              type="button"
                                              aria-pressed={selected}
                                              className={`min-h-8 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                                selected
                                                  ? 'bg-white text-ds-brand-primary-hover shadow-sm'
                                                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                                              }`}
                                              onClick={() =>
                                                updateWorkbenchClampSetting(clampId, (setting) => ({
                                                  ...setting,
                                                  type: item,
                                                }))
                                              }
                                            >
                                              {item}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="ds-parameter-field">
                                      <div className="ds-parameter-label">零位位置</div>
                                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                                        {['左端', '右端'].map((item) => {
                                          const selected = clampSetting.zeroPosition === item;
                                          return (
                                            <button
                                              key={item}
                                              type="button"
                                              aria-pressed={selected}
                                              className={`min-h-8 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                                selected
                                                  ? 'bg-white text-ds-brand-primary-hover shadow-sm'
                                                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                                              }`}
                                              onClick={() =>
                                                updateWorkbenchClampSetting(clampId, (setting) => ({
                                                  ...setting,
                                                  zeroPosition: item,
                                                }))
                                              }
                                            >
                                              {item}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-ds-150 ds-parameter-field">
                                    <div className="ds-parameter-label">压紧尺寸</div>
                                    <ProcessFieldGroup cols={2}>
                                      <div className="ds-parameter-field">
                                        <div className="ds-parameter-label">长</div>
                                        <ProcessNumberField
                                          value={clampSetting.size.length}
                                          unit="mm"
                                          onChange={(nextValue) =>
                                            updateWorkbenchClampSetting(clampId, (setting) => ({
                                              ...setting,
                                              size: {
                                                ...setting.size,
                                                length: nextValue,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                      <div className="ds-parameter-field">
                                        <div className="ds-parameter-label">宽</div>
                                        <ProcessNumberField
                                          value={clampSetting.size.width}
                                          unit="mm"
                                          onChange={(nextValue) =>
                                            updateWorkbenchClampSetting(clampId, (setting) => ({
                                              ...setting,
                                              size: {
                                                ...setting.size,
                                                width: nextValue,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                    </ProcessFieldGroup>
                                  </div>
                                  <div className="mt-ds-150 ds-parameter-subfield-stack">
                                    <div className="text-xs text-slate-400">软限位轴</div>
                                    {clampAxes.map((axis) => {
                                      const axisWarningText = getProcessNumberRangeWarning(clampSetting.softLimits[axis].min, clampSetting.softLimits[axis].max);
                                      return (
                                      <div key={axis} className="ds-parameter-field">
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                          <div className="font-medium text-slate-600">{axis} 轴</div>
                                          {axisWarningText && (
                                            <div className="flex items-center gap-1 text-red-500">
                                              <CircleAlert className="size-3.5" />
                                              <span>{axisWarningText}</span>
                                            </div>
                                          )}
                                        </div>
                                        <ProcessNumberRangeField
                                          minValue={clampSetting.softLimits[axis].min}
                                          maxValue={clampSetting.softLimits[axis].max}
                                          minLabel="最小值"
                                          maxLabel="最大值"
                                          unit="mm"
                                          warningPlacement="none"
                                          onMinChange={(nextValue) =>
                                            updateWorkbenchClampSetting(clampId, (setting) => ({
                                              ...setting,
                                              softLimits: {
                                                ...setting.softLimits,
                                                [axis]: {
                                                  ...setting.softLimits[axis],
                                                  min: nextValue,
                                                },
                                              },
                                            }))
                                          }
                                          onMaxChange={(nextValue) =>
                                            updateWorkbenchClampSetting(clampId, (setting) => ({
                                              ...setting,
                                              softLimits: {
                                                ...setting.softLimits,
                                                [axis]: {
                                                  ...setting.softLimits[axis],
                                                  max: nextValue,
                                                },
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="grid gap-ds-150 xl:grid-cols-2">
                          <div className="ds-parameter-card ds-parameter-card-sm">
                            <div className="text-sm font-medium text-slate-700">压紧间距阈值</div>
                            <div className="mt-ds-150">
                              <ProcessNumberRangeField defaultMinValue="260" defaultMaxValue="900" minLabel="最小间距" maxLabel="最大间距" unit="mm" />
                            </div>
                          </div>
                          <div className="ds-parameter-card ds-parameter-card-sm">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                              <span>压紧覆盖率阈值</span>
                              <Tooltip title="例 70%">
                                <CircleAlert className="size-3.5 text-slate-300" />
                              </Tooltip>
                            </div>
                            <div className="mt-ds-150">
                              <ProcessPercentSlider value={activeWorkbenchConfig.clampCoverage} onChange={(nextValue) => updateWorkbenchConfig((config) => ({ ...config, clampCoverage: nextValue }))} />
                            </div>
                          </div>

                          <div className="ds-parameter-card ds-parameter-card-sm xl:col-span-2">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                              <span>压紧位置采样间隔</span>
                              <Tooltip title="用于计算压紧位置不满足覆盖率阈值时采样调整压紧位置。">
                                <CircleAlert className="size-3.5 text-slate-300" />
                              </Tooltip>
                            </div>
                            <div className="mt-ds-150 max-w-[240px]">
                              <ProcessNumberField defaultValue="40" unit="mm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                ) : activeProcessParameterTab === 'grind' ? (
                  <div className="space-y-4">
                    <div className="flex h-10 items-end gap-5 border-b border-white/70 px-1">
                        {grindToolModes.map((item) => {
                          const selected = grindToolMode === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={selected}
                              className={`relative flex h-full items-start px-0.5 pt-1 text-sm font-medium transition-colors ${
                                selected
                                  ? 'text-zinc-800'
                                  : 'text-zinc-400 hover:text-zinc-600'
                              }`}
                              onClick={() => {
                                if (grindToolMode !== item) markProcessParameterDirty();
                                setGrindToolMode(item);
                              }}
                            >
                              {item}
                              <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${selected ? 'bg-ds-brand-primary' : 'bg-transparent'}`} />
                            </button>
                          );
                        })}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">打磨宽度</div>
                        <ProcessNumberField defaultValue="12" unit="mm" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">打磨速度</div>
                        <ProcessNumberField defaultValue="80" unit="mm/s" inputClassName="pr-16" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">打磨力</div>
                        <ProcessNumberField defaultValue="80" unit="N" inputClassName="pr-10" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">打磨转速</div>
                        <ProcessNumberField defaultValue="3000" unit="/rpm" inputClassName="pr-16" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">轴角</div>
                        <ProcessNumberField defaultValue="15" unit="°" inputClassName="pr-10" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">摆动幅度</div>
                        <ProcessNumberField defaultValue="60" unit="mm" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">预压高度</div>
                        <ProcessNumberField defaultValue="30" unit="mm" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">递进预压高度</div>
                        <ProcessNumberField defaultValue="20" unit="mm" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">安全点高度</div>
                        <ProcessNumberField defaultValue="100" unit="mm" />
                      </div>
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">采样密度</div>
                        <ProcessNumberField defaultValue="10" unit="mm" />
                      </div>

                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">打磨偏移</div>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                          {[
                            ['ΔX', '0'],
                            ['ΔY', '0'],
                            ['ΔZ', '120'],
                          ].map(([label, value]) => (
                            <div key={label} className="ds-parameter-field">
                              <div className="ds-parameter-label">{label}</div>
                              <ProcessNumberField defaultValue={value} unit="mm" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                            <span>路径自动合并使能</span>
                            <Tooltip title="当打磨路径可以合并时，开启后自动合并，合并条件：直线与直线夹角范围、直线与圆弧切线夹角范围、圆弧与圆弧切线夹角范围。">
                              <CircleAlert className="size-3.5 text-slate-300" />
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${activeGrindToolConfig.pathMergeEnabled ? 'text-ds-brand-primary-text' : 'text-slate-400'}`}>
                              {activeGrindToolConfig.pathMergeEnabled ? '已开启' : '已关闭'}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={activeGrindToolConfig.pathMergeEnabled}
                              className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                                activeGrindToolConfig.pathMergeEnabled ? 'bg-ds-brand-primary' : 'bg-slate-300'
                              }`}
                              onClick={() => updateGrindToolConfig((config) => ({ ...config, pathMergeEnabled: !config.pathMergeEnabled }))}
                            >
                              <span
                                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                                  activeGrindToolConfig.pathMergeEnabled ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        <div className={`mt-3 grid gap-4 ${activeGrindToolConfig.pathMergeEnabled ? '' : 'opacity-60'}`}>
                          {[
                            ['直线与直线夹角范围', '0', '15'],
                            ['直线与圆弧切线夹角范围', '0', '10'],
                            ['圆弧与圆弧切线夹角范围', '0', '10'],
                          ].map(([label, minValue, maxValue]) => {
                            const warningText = activeGrindToolConfig.pathMergeEnabled ? getProcessNumberRangeWarning(minValue, maxValue) : '';
                            const rangeInvalid = Boolean(warningText);
                            return (
                            <div key={label} className="ds-parameter-field">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="ds-parameter-label">{label}</div>
                                {warningText && <ProcessRangeWarning>{warningText}</ProcessRangeWarning>}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <ProcessNumberField defaultValue={minValue} unit="°" inputClassName="pr-10" placeholder="最小值" invalid={rangeInvalid} disabled={!activeGrindToolConfig.pathMergeEnabled} />
                                <ProcessNumberField defaultValue={maxValue} unit="°" inputClassName="pr-10" placeholder="最大值" invalid={rangeInvalid} disabled={!activeGrindToolConfig.pathMergeEnabled} />
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="ds-parameter-card ds-parameter-field xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">双机协作安全距离</div>
                        <div className="max-w-[240px]">
                          <ProcessNumberField defaultValue="500" unit="mm" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeProcessParameterTab === 'assemble' ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">扫描距离</div>
                        <ProcessNumberField defaultValue="250" unit="mm" />
                      </div>

                      <div className="ds-parameter-card ds-parameter-field">
                        <div className="text-sm font-medium text-slate-800">扫描方向</div>
                        <div className="grid grid-cols-2 gap-2">
                          {['逆时针', '顺时针'].map((item) => {
                            const selected = assemblyScanDirection === item;
                            return (
                              <button
                                key={item}
                                type="button"
                                aria-pressed={selected}
                                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                  selected
                                    ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-hover'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                                onClick={() => {
                                  if (assemblyScanDirection !== item) markProcessParameterDirty();
                                  setAssemblyScanDirection(item);
                                }}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">扫描偏移</div>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                          {[
                            ['ΔX', '0'],
                            ['ΔY', '0'],
                            ['ΔZ', '120'],
                          ].map(([label, value]) => (
                            <div key={label} className="ds-parameter-field">
                              <div className="ds-parameter-label">{label}</div>
                              <ProcessNumberField defaultValue={value} unit="mm" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">扫描姿态</div>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                          {[
                            ['Rx', '0'],
                            ['Ry', '0'],
                            ['Rz', '90'],
                          ].map(([label, value]) => (
                            <div key={label} className="ds-parameter-field">
                              <div className="ds-parameter-label">{label}</div>
                              <ProcessNumberField defaultValue={value} unit="°" inputClassName="pr-10" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">采样设置</div>
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">特征类型</div>
                            <div className="grid grid-cols-2 gap-2">
                              {(['直线', '圆弧'] as const).map((item) => {
                                const selected = assemblySampleShape === item;
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    aria-pressed={selected}
                                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                      selected
                                        ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-hover'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                    onClick={() => {
                                      if (assemblySampleShape !== item) markProcessParameterDirty();
                                      setAssemblySampleShape(item);
                                    }}
                                  >
                                    {item}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">
                              {assemblySampleShape === '直线' ? '直线采样方式' : '圆弧采样方式'}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {(assemblySampleShape === '直线' ? ['距离', '数量'] : ['弦长', '数量']).map((item) => {
                                const selected =
                                  assemblySampleShape === '直线'
                                    ? assemblyLineSampleMode === item
                                    : assemblyArcSampleMode === item;
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    aria-pressed={selected}
                                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                      selected
                                        ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-hover'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                    onClick={() => {
                                      if (assemblySampleShape === '直线') {
                                        if (assemblyLineSampleMode !== item) markProcessParameterDirty();
                                        setAssemblyLineSampleMode(item as '距离' | '数量');
                                      } else {
                                        if (assemblyArcSampleMode !== item) markProcessParameterDirty();
                                        setAssemblyArcSampleMode(item as '弦长' | '数量');
                                      }
                                    }}
                                  >
                                    {item}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">采样数值</div>
                            <ProcessNumberField
                              defaultValue={
                                assemblySampleShape === '直线'
                                  ? assemblyLineSampleMode === '距离'
                                    ? '50'
                                    : '12'
                                  : assemblyArcSampleMode === '弦长'
                                    ? '30'
                                    : '16'
                              }
                              unit={
                                assemblySampleShape === '直线'
                                  ? assemblyLineSampleMode === '距离'
                                    ? 'mm'
                                    : undefined
                                  : assemblyArcSampleMode === '弦长'
                                    ? 'mm'
                                    : undefined
                              }
                              inputClassName={
                                (assemblySampleShape === '直线' && assemblyLineSampleMode === '数量') ||
                                (assemblySampleShape === '圆弧' && assemblyArcSampleMode === '数量')
                                  ? 'pr-3'
                                  : 'pr-12'
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ds-parameter-card">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          <span>粗装配偏移距离</span>
                          <Tooltip title="基于装配基准向内偏移。">
                            <CircleAlert className="size-3.5 text-slate-300" />
                          </Tooltip>
                        </div>
                        <ProcessFieldGroup cols={2} className="mt-3">
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">X</div>
                            <ProcessNumberField defaultValue="15" unit="mm" />
                          </div>
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">Y</div>
                            <ProcessNumberField defaultValue="15" unit="mm" />
                          </div>
                        </ProcessFieldGroup>
                      </div>

                      <div className="ds-parameter-card">
                        <div className="text-sm font-medium text-slate-800">粗装配偏移保护阈值</div>
                        <div className="mt-3 ds-parameter-field">
                          <div className="ds-parameter-label invisible">阈值</div>
                          <ProcessNumberField defaultValue="80" unit="mm" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeProcessParameterTab === 'weld' ? (
                  <div className="space-y-4">
                    <div className="ds-parameter-card">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                        <span>定位焊参数</span>
                        <Tooltip title="用于生成定位焊路径和工艺参数，定位焊区域需避让角点，便于保证机器定位焊精度。">
                          <CircleAlert className="size-3.5 text-slate-300" />
                        </Tooltip>
                      </div>
                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <div className="ds-parameter-field">
                          <div className="ds-parameter-label">定位焊长度（10-100）</div>
                          <ProcessNumberField defaultValue="50" unit="mm" />
                        </div>
                        <div className="ds-parameter-field">
                          <div className="ds-parameter-label">焊脚高度（5-8）</div>
                          <ProcessNumberField
                            value={weldParams.weldLegHeight}
                            unit="mm"
                            onChange={(nextValue) =>
                              updateWeldParams((params) => ({
                                ...params,
                                weldLegHeight: nextValue,
                              }))
                            }
                          />
                        </div>
                        <div className="ds-parameter-field">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>最小定位焊数量（1-5）</span>
                            <Tooltip title="定位焊数量优先按间隔计算；当不满足最小定位焊数量时，优先保证定位焊数量并自动调整间隔。">
                              <CircleAlert className="size-3.5 text-slate-300" />
                            </Tooltip>
                          </div>
                          <ProcessNumberField defaultValue="3" inputClassName="pr-3" />
                        </div>
                      </div>
                    </div>

                    <div className="ds-parameter-card">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                        <span>定位焊间距</span>
                        <Tooltip title="闭合轮廓起点为零件左下角点；点距在长度有余的前提下自动均布调整。">
                          <CircleAlert className="size-3.5 text-slate-300" />
                        </Tooltip>
                      </div>
                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <div className="ds-parameter-field">
                          <div className="ds-parameter-label">起始边距（0-100）</div>
                          <ProcessNumberField defaultValue="20" unit="mm" />
                        </div>
                        <div className="ds-parameter-field">
                          <div className="ds-parameter-label">点距（100-500）</div>
                          <ProcessNumberField defaultValue="400" unit="mm" />
                        </div>
                        <div className="ds-parameter-field">
                          <div className="ds-parameter-label">终点边距（0-100）</div>
                          <ProcessNumberField defaultValue="20" unit="mm" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">焊接角度</div>
                        <div className="mt-3 grid grid-cols-5 gap-ds-250">
                          {[
                            { img: weldAngleImg0, value: '0' },
                            { img: weldAngleImg1, value: '0' },
                            { img: weldAngleImg2, value: '0' },
                            { img: weldAngleImg3, value: '0' },
                            { img: weldAngleImg4, value: '90' },
                          ].map(({ img, value }, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <div className="flex h-20 w-20 items-center justify-center">
                                <img
                                  src={img}
                                  alt={`焊接角度 ${index + 1}`}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <ProcessNumberField defaultValue={value} unit="°" inputClassName="w-20 pr-8 text-center" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="ds-parameter-card xl:col-span-2">
                        <div className="text-sm font-medium text-slate-800">焊接偏移（工具系）</div>
                        <div className="mt-3 grid grid-cols-5 gap-ds-250">
                          {[
                            { img: offsetImg1, value: '0' },
                            { img: offsetImg2, value: '0' },
                            { img: offsetImg3, value: '0' },
                            { img: offsetImg4, value: '0' },
                            { img: offsetImg5, value: '20' },
                          ].map(({ img, value }, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                              <div className="flex h-20 w-20 items-center justify-center">
                                <img
                                  src={img}
                                  alt={`焊接偏移 ${index + 1}`}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <ProcessNumberField defaultValue={value} unit="mm" inputClassName="w-20 pr-8 text-center" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="ds-parameter-card">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          <span>最小定位压紧尺寸（AABB）</span>
                          <Tooltip title="定位焊时为消除贴板和主筋板/贴板之间的缝隙，通过压紧装置压紧；当尺寸小于设置时，无需压紧。">
                            <CircleAlert className="size-3.5 text-slate-300" />
                          </Tooltip>
                        </div>
                        <ProcessFieldGroup cols={2} className="mt-3">
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">A（0-3000）</div>
                            <ProcessNumberField defaultValue="800" unit="mm" />
                          </div>
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">B（0-3000）</div>
                            <ProcessNumberField defaultValue="100" unit="mm" />
                          </div>
                        </ProcessFieldGroup>
                      </div>

                      <div className="ds-parameter-card">
                        <div className="text-sm font-medium text-slate-800">压紧位置与定位焊间距阈值</div>
                        <ProcessFieldGroup cols={2} className="mt-3">
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">压辊位置 X 向</div>
                            <ProcessNumberField defaultValue="120" unit="mm" />
                          </div>
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label">压辊位置 Y 向</div>
                            <ProcessNumberField defaultValue="120" unit="mm" />
                          </div>
                        </ProcessFieldGroup>
                      </div>

                      <div className="ds-parameter-card ds-parameter-field xl:col-span-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          <span>双机协作安全距离</span>
                          <Tooltip title="末端 TCP 距离。">
                            <CircleAlert className="size-3.5 text-slate-300" />
                          </Tooltip>
                        </div>
                        <div className="max-w-[240px]">
                          <ProcessNumberField defaultValue="500" unit="mm" />
                        </div>
                      </div>
                    </div>

                    <div className="ds-parameter-card">
                      <div className="text-sm font-medium text-slate-800">定位焊扫描参数</div>
                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <div className="ds-parameter-field">
                          <div className="ds-parameter-label">扫描距离</div>
                          <div className="ds-parameter-field">
                            <div className="ds-parameter-label invisible">距离</div>
                            <ProcessNumberField
                              value={weldScanParams.scanDistance}
                              unit="mm"
                              onChange={(nextValue) =>
                                updateWeldScanParams((params) => ({
                                  ...params,
                                  scanDistance: nextValue,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="ds-parameter-field xl:col-span-2">
                          <div className="ds-parameter-label">扫描偏移（基于焊接起点）</div>
                          <ProcessFieldGroup cols={3}>
                            {[
                              ['ΔX', weldScanParams.scanOffsetX, 'scanOffsetX'],
                              ['ΔY', weldScanParams.scanOffsetY, 'scanOffsetY'],
                              ['ΔZ', weldScanParams.scanOffsetZ, 'scanOffsetZ'],
                            ].map(([label, value, key]) => (
                              <div key={label} className="ds-parameter-field">
                                <div className="ds-parameter-label">{label}</div>
                                <ProcessNumberField
                                  value={value}
                                  unit="mm"
                                  onChange={(nextValue) =>
                                    updateWeldScanParams((params) => ({
                                      ...params,
                                      [key]: nextValue,
                                    }) as WeldProcessParams)
                                  }
                                />
                              </div>
                            ))}
                          </ProcessFieldGroup>
                        </div>
                        <div className="ds-parameter-field xl:col-span-3">
                          <div className="ds-parameter-label">扫描姿态</div>
                          <div className="grid gap-ds-250 md:grid-cols-3">
                            {[
                              ['Rx', weldScanParams.scanPoseRx, 'scanPoseRx'],
                              ['Ry', weldScanParams.scanPoseRy, 'scanPoseRy'],
                              ['Rz', weldScanParams.scanPoseRz, 'scanPoseRz'],
                            ].map(([label, value, key]) => (
                              <div key={label} className="ds-parameter-field">
                                <div className="ds-parameter-label">{label}</div>
                                <ProcessNumberField
                                  value={value}
                                  unit="°"
                                  inputClassName="pr-10"
                                  onChange={(nextValue) =>
                                    updateWeldScanParams((params) => ({
                                      ...params,
                                      [key]: nextValue,
                                    }) as WeldProcessParams)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        ['参数组', '当前分页参数配置'],
                        ['作用对象', currentProject?.tree.id ?? '未选择项目'],
                        ['工艺模式', '标准模式'],
                        ['版本', 'V1.0 Demo'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="text-xs text-slate-400">{label}</div>
                          <div className="mt-2 text-sm font-medium text-slate-700">{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-5">
                      <div className="text-sm font-medium text-slate-700">参数占位区域</div>
                      <div className="mt-2 text-sm leading-6 text-slate-500">
                        后续这里可以继续接入对应分页的表单字段、参数分组、校验规则和默认值。当前先完成分页入口和弹窗框架，方便你继续评审交互布局。
                      </div>
                    </div>
                  </>
                  )}
                </div>
                <ScrollPanelEdge className="z-10" />
              </div>
            </div>
        </ProcessParameterModalView>
      )}

      {processParameterDiscardConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-4">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">未保存的工艺参数</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                当前工艺参数设置中仍有未保存的修改。关闭窗口后，这些修改不会应用到当前项目，是否确认放弃？
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setProcessParameterDiscardConfirmOpen(false)}>
                继续编辑
              </Button>
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={discardProcessParameterChanges}>
                放弃更改
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-14 left-1/2 z-[2000] -translate-x-1/2 -translate-y-1/2 animate-in slide-in-from-top-2">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : toast.type === 'info'
                  ? 'bg-slate-50 border border-slate-200 text-slate-600'
                  : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CircleCheck className="size-4 text-emerald-500" />
            ) : toast.type === 'info' ? (
              <CircleAlert className="size-4 text-slate-400" />
            ) : (
              <CircleAlert className="size-4 text-red-500" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
