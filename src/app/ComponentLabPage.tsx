import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ASSET_BASE } from '../asset-base';
import { AlertTriangle, ArrowLeft, ArrowRight, Ban, Box, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp, ChevronUp, CircleAlert, CircleCheck, Cog, Download, Eye, FileCog, FileQuestion, FileSpreadsheet, FileWarning, Filter, Flame, FolderOpen, FolderPlus, Forklift, GripVertical, Hammer, History, Import, Layers3, ListX, Minus, MonitorUp, Move3D, PanelLeft, Pin, Play, Plus, RefreshCw, Save, ScanFace, Search, SlidersHorizontal, Sparkles, Square, SquareArrowRight, Target, Trash2, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WeldFeatureIcon, GrindFeatureIcon, AssemblyFeatureIcon } from './components/icons/FeatureToolIcons';
import { Dropdown, Tooltip } from 'antd';
import { Button } from './components/ui/button';
import { Checkbox as DsCheckbox, type CheckboxProps } from '../components/ui/checkbox';
import { ProcessDetailTabBar } from './components/process/ProcessDetailTabBar';
import { ProcessFieldGroup } from './components/process/ProcessFieldGroup';
import { ProcessJointAngleRow as JointAngleRowDemo } from './components/process/ProcessJointAngleRow';
import { ProcessPathPointModeToolbar } from './components/process/ProcessPathPointModeToolbar';
import { ClampPointConfigPanel, createDefaultClampPointSegments, type ClampPointSegmentConfig } from './components/process/ClampPointConfigPanel';
import { ProcessPathPointMarkerModel } from './components/process/GrindToolHeadPoseModel';
import { ProcessResultPointPanel } from './components/process/ProcessResultPointPanel';
import { ProcessSelectionPanel } from './components/process/ProcessSelectionPanel';
import { ProcessSingleSelect } from './components/process/ProcessSingleSelect';
import {
  ProductionStationCard,
  productionStationCardHorizontalWidth,
  productionStationCardSkewWidth,
  type ProductionStationStatus,
} from './components/production/ProductionStationCard';
import {
  ProductionTrayCard,
  ProductionTrayEditDialog,
  productionTrayCardHorizontalWidth,
  productionTrayCardSkewWidth,
  type ProductionTrayCardState,
} from './components/production/ProductionTrayCard';
import { useProductionStationCardVariant } from './components/production/production-station-card-variant';
import { getProductionWorkbenchGroundRectStyle } from './components/production/production-workbench-ground-rect';
import { TrayAllocationCard, TrayReferenceStrip, type TrayAllocation } from './components/production/TrayManagement';
import {
  convertVisionCoordinatePose,
  defaultVisionCoarseResultPoint,
  defaultVisionPhotoPose,
  defaultVisionRelativePose,
  defaultVisionResultPoint,
  resolveVisionAbsolutePose,
  visionPosesEqual,
  visionRescanResultFixtures,
  VisionAbnormalCalibrationPanel,
  type VisionCalibrationPose,
  type VisionCoordinateMode,
  type VisionScanStatus,
} from './components/production/VisionAbnormalCalibrationPanel';
import { VisionPointCloud } from './components/production/VisionPointCloud';
import { VisionFeedBar, visionFeedOptions } from './components/production/VisionFeedBar';
import { VisionExceptionDemoPanel } from './components/production/VisionExceptionDemoPanel';
import { PositioningChoiceDialog, type PositioningDialogImportStatus } from './components/production/PositioningChoiceDialog';
import { VisionPositionResultPanel, type VisionPositionResult } from './components/production/VisionPositionResultPanel';
import {
  createDefaultGantryVisionViewportState,
  GantryVisionScanPanel,
  type GantryVisionViewportState,
} from './components/production/GantryVisionScanPanel';
import type { ProcessPosePointValue } from './components/process/PoseAxisFieldGroup';
import {
  SingleStepDebugPanel,
  type ProductionDebugExecutionMode,
  type ProductionDebugStation,
  type ProductionDebugStationSnapshot,
} from './components/production/SingleStepDebugPanel';
import {
  findProductionCompositeWorkstepLocation,
  getProductionCompositeStation,
  getProductionCompositeWorkstepNames,
  getProductionStationWorkstepNames,
} from './components/production/production-station-worksteps';
import { ProductionManualControlPanel } from './components/production/ProductionManualControlPanel';
import { HierarchicalWorkstepList, type HierarchicalWorkstepGroup } from './components/production/HierarchicalWorkstepList';
import { formatCombinedPartObject } from './components/production/ProductionTaskTreePanel2';
import { PanelEmptyState } from './components/ui/panel-empty-state';
import { ParameterSwitch } from './components/ui/parameter-switch';
import { GlobalAlertProvider, useGlobalAlert } from './components/ui/global-alert';
import { ViewCube } from './components/viewport/ViewCube';
import { ProductionExecutionPage } from './ProductionExecutionPage';
import { createFixedPlanningProcesses, type FixedPlanningProcess } from './process-planning-model';
import { SimulationAssemblyPositionOverlay } from '../features/virtual-simulation/components/SimulationAssemblyPositionOverlay';
import { SimulationProgramGenerateDialog } from '../features/virtual-simulation/components/SimulationProgramGenerateDialog';
import { SimulationProgramPanel } from '../features/virtual-simulation/components/SimulationProgramPanel';
import { SimulationRobotPoseOverlay } from '../features/virtual-simulation/components/SimulationRobotPoseOverlay';
import { SimulationTaskPanel } from '../features/virtual-simulation/components/SimulationTaskPanel';
import {
  findProgramNode,
  generateRobotProgram,
  getDefaultRobotAssignments,
} from '../features/virtual-simulation/services/generateRobotProgram';
import type { SimulationRobotJointReadout } from '../features/virtual-simulation/services/urdfKinematics';
import type {
  SimulationAssemblyTransform,
  SimulationCoordinateFrame,
  SimulationDetailTab,
  SimulationProgramNode,
  SimulationRobotCoordinateFrame,
  SimulationRobotId,
  SimulationRobotProgram,
  SimulationSourceTask,
  SimulationWeldTask,
} from '../features/virtual-simulation/types';

type DemoState = 'default' | 'invalid' | 'disabled';
type LabTab = 'interaction' | 'business' | 'tokens';
type ComponentViewMode = 'split' | 'grid';
type PickGripperType = 'gantry' | 'robot';
type PickMagnetKey = 'left' | 'center' | 'right';
type PickMagnetForceLevel = '大' | '中' | '小';
type TrayAgvDemoState = 'pending' | 'running' | 'done';
const compactProcessParameterNameDemoClassName = 'text-xs font-normal text-ds-text-parameter-label';
const compactProcessSubParameterNameDemoClassName = 'text-[11px] font-normal text-ds-text-parameter-label';
const hierarchicalWorkstepDemoGroups: HierarchicalWorkstepGroup[] = [
  {
    id: 'main-feed',
    label: '主筋板上料',
    objectLabel: '0162-01-010101-01',
    steps: ['支撑调整', '主筋板粗定位', '主筋板抓取', '主筋板放置', '精定位/导入工件位置'].map((name, index) => ({ name, index })),
  },
  {
    id: 'main-grind',
    label: '主筋板打磨',
    objectLabel: '0162-01-010101-01',
    steps: ['正面打磨', '压紧', '翻面', '压紧释放', '反面打磨', '压紧', '翻面', '压紧释放'].map((name, index) => ({ name, index: index + 5 })),
  },
];
const compactGrindParameterDemoItems = [
  ['打磨宽度', '12', 'mm'],
  ['打磨速度', '80', 'mm/s'],
  ['打磨力', '80', 'N'],
  ['打磨转速', '3000', '/rpm'],
  ['轴角', '15', '°'],
  ['摆动幅度', '60', 'mm'],
  ['预压高度', '30', 'mm'],
  ['采样密度', '10', 'mm'],
];
const processPanelCoverageRows = [
  ['抓取', '工艺参数 + 路径点位', '结果点位 XYZ/RPY + 6 个安全点'],
  ['放置', '工艺参数', '工作台、支撑编号、支撑覆盖率 + J1-J8'],
  ['打磨', '工艺参数 + 路径点位', '结果点位 P1-6(n) + 单组 6 个安全点'],
  ['装配定位', '路径点位', '结果点位 P1-3/4(n) + 4 组安全点'],
  ['翻面压紧', '工艺参数', '工作台、压紧编号、覆盖率 + J1-J8'],
  ['焊接', '工艺参数 + 路径点位', '扫描/焊接参数 + 两套 6 组结果点与安全点'],
];

const componentLabPathPointMarkers = [
  { id: 'component-lab-p1', label: 'P1', position: [-72, -12, 0] as [number, number, number] },
  { id: 'component-lab-p2', label: 'P2', position: [-43, -7, 0] as [number, number, number] },
  { id: 'component-lab-p3', label: 'P3', position: [-14, -2, 0] as [number, number, number] },
  { id: 'component-lab-p4', label: 'P4', position: [14, 2, 0] as [number, number, number] },
  { id: 'component-lab-p5', label: 'P5', position: [43, 7, 0] as [number, number, number] },
  { id: 'component-lab-p6', label: 'P6', position: [72, 12, 0] as [number, number, number] },
];

function ComponentLabPathPointMarkerPreview() {
  return (
    <div className="mb-4 max-w-2xl overflow-hidden rounded-lg border border-zinc-200/70 bg-ds-bg-viewport">
      <div className="border-b border-zinc-200/70 bg-white/70 px-3 py-2">
        <div className="text-xs font-medium text-slate-700">路径点位标记</div>
        <div className="mt-0.5 text-[10px] text-slate-400">打磨路径与虚拟仿真共用橙色点球 + 编号标签样式</div>
      </div>
      <div className="h-28">
        <Canvas orthographic camera={{ position: [0, 0, 120], zoom: 2.2, near: 0.1, far: 500 }}>
          <ProcessPathPointMarkerModel items={componentLabPathPointMarkers} />
        </Canvas>
      </div>
    </div>
  );
}

function ViewCubeReferenceModel() {
  return (
    <group position={[0, 0.5, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.34, 2.3]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.68} metalness={0.08} />
      </mesh>
      <mesh position={[-1.15, 0.7, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 1.4, 1.65]} />
        <meshStandardMaterial color="#64748b" roughness={0.66} metalness={0.08} />
      </mesh>
      <mesh position={[0.75, 0.5, 0.3]} rotation={[0, 0, -Math.PI / 5]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 1.8, 1.2]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[1.45, 0.45, -0.55]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.9, 24]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.7} metalness={0.08} />
      </mesh>
    </group>
  );
}

function ViewCubePreviewCanvas() {
  return (
    <div className="relative h-[240px] overflow-hidden rounded-lg border border-zinc-200/70 bg-ds-bg-viewport">
      <Canvas
        camera={{ position: [5.4, 4.2, 6.2], fov: 42, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#e4e4e4']} />
        <ambientLight intensity={1.15} />
        <hemisphereLight intensity={0.52} color="#ffffff" groundColor="#94a3b8" />
        <directionalLight position={[5, 8, 6]} intensity={1.5} castShadow />
        <ViewCubeReferenceModel />
        <gridHelper args={[10, 20, '#a1a1aa', '#d4d4d8']} position={[0, 0, 0]} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          target={[0, 0.65, 0]}
        />
        <ViewCube />
      </Canvas>
    </div>
  );
}

function ViewCubeComponentLabPreview() {
  return (
    <div className="mb-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-slate-700">视图盒子</div>
          <div className="mt-0.5 text-[10px] leading-4 text-slate-400">
            点击面、棱和角切换视向；拖动模型时盒子同步跟随当前相机。
          </div>
        </div>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500">固定右下角</span>
      </div>
      <div className="max-w-3xl">
        <div className="mb-2">
          <div className="text-[11px] font-medium text-slate-700">品牌反馈·最终方案</div>
          <div className="mt-0.5 text-[10px] leading-4 text-slate-400">
            常态使用白色 / Zinc 中性面，面、棱或角 hover 时使用品牌橙；中文标签使用高分辨率面纹理。
          </div>
        </div>
        <ViewCubePreviewCanvas />
      </div>
    </div>
  );
}

function SimulationAssemblyPositionOverlayDemo() {
  const [coordinateFrame, setCoordinateFrame] = useState<SimulationCoordinateFrame>('world');
  const [transform, setTransform] = useState<SimulationAssemblyTransform>({
    x: '120.0', y: '-40.0', z: '0.0', rx: '0.0', ry: '0.0', rz: '15.0',
  });

  return (
    <div className="relative h-[256px] max-w-[420px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]">
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg border border-white/70 bg-ds-bg-glass-float p-1 shadow-lg shadow-black/5 backdrop-blur-md">
        <span className="flex h-7 items-center rounded-md bg-white px-2.5 text-[11px] font-medium text-ds-brand-primary-text shadow-sm">正面工位</span>
        <span className="flex h-7 items-center px-2.5 text-[11px] text-zinc-300">背面工位</span>
      </div>
      <SimulationAssemblyPositionOverlay
        coordinateFrame={coordinateFrame}
        transform={transform}
        onCoordinateFrameChange={setCoordinateFrame}
        onTransformChange={(axis, value) => setTransform((current) => ({ ...current, [axis]: value }))}
      />
    </div>
  );
}

function SimulationRobotPoseOverlayDemo() {
  const [coordinateFrames, setCoordinateFrames] = useState<Record<SimulationRobotId, SimulationRobotCoordinateFrame>>({
    robot1: 'world',
    robot2: 'object',
  });
  const joints: SimulationRobotJointReadout[] = [
    ...['15.0', '-60.0', '10.0', '180.0', '30.0', '0.0'].map((value, index) => ({
      axis: `J${index + 1}` as const,
      value,
      unit: '°' as const,
    })),
    { axis: 'J7', value: '1200.0', unit: 'mm' },
  ];
  const robots = [
    {
      robotId: 'robot1' as const,
      coordinateFrame: coordinateFrames.robot1,
      pose: { x: '3068.0', y: '670.0', z: '3925.0', rx: '180.0', ry: '-90.0', rz: '0.0' },
      jointValues: joints,
    },
    {
      robotId: 'robot2' as const,
      coordinateFrame: coordinateFrames.robot2,
      pose: { x: '1198.0', y: '1812.0', z: '3124.0', rx: '180.0', ry: '-90.0', rz: '0.0' },
      jointValues: joints.map((joint) => ({ ...joint, value: String(-Number(joint.value)).replace('-0', '0') })),
    },
  ];

  return (
    <div className="relative h-[500px] max-w-[520px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]">
      <SimulationRobotPoseOverlay
        robots={robots}
        onCoordinateFrameChange={(robotId, coordinateFrame) => {
          setCoordinateFrames((current) => ({ ...current, [robotId]: coordinateFrame }));
        }}
      />
    </div>
  );
}
const newTaskPreviewRowsDemo = [
  { id: 'generated-grind-01', index: '02', name: '打磨', part: '0162-01-010101-01', sidePlate: false },
  { id: 'generated-grind-02', index: '05', name: '侧面打磨', part: '0162-01-010101-02', sidePlate: true },
  { id: 'generated-assemble-02', index: '06', name: '装配', part: '0162-01-010101-02 + 0162-01-010101-01', sidePlate: false },
  { id: 'generated-grind-03', index: '10', name: '侧面打磨', part: '0162-01-010101-03', sidePlate: true },
  { id: 'generated-surface-grind-03', index: '11', name: '表面打磨', part: '0162-01-010101-03', sidePlate: false },
  { id: 'generated-grind-04', index: '14', name: '侧面打磨', part: '0162-01-010101-04', sidePlate: true },
];
type PathCoordinateFrame = '世界' | '父系坐标系' | '物体';
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
const pickMagnetForceLevelOptions: PickMagnetForceLevel[] = ['大', '中', '小'];
type ComponentSection =
  | 'button'
  | 'main-nav-menu'
  | 'tree'
  | 'modal'
  | 'toast'
  | 'unit-number'
  | 'number'
  | 'range'
  | 'slider'
  | 'multi'
  | 'support-settings'
  | 'checkbox'
  | 'object-select'
  | 'axis-row'
  | 'point-row'
  | 'pick-path-points'
  | 'clamp-point-config'
  | 'joint-row'
  | 'pick-parameters'
  | 'viewport-workspace'
  | 'virtual-simulation'
  | 'process-panel'
  | 'production-task-panels'
  | 'production-execution'
  | 'tray-card'
  | 'global-alert'
  | 'composite';

type ComponentSectionPage = 'general' | 'process-execution' | 'production-execution';
type ComponentSectionLayerId = 'foundation' | 'navigation-feedback' | 'domain-composite' | 'workspace-viewport' | 'process-application' | 'production-application';

type ComponentSectionLayer = {
  id: ComponentSectionLayerId;
  page: ComponentSectionPage;
  title: string;
  description: string;
  sections: ComponentSection[];
};

const demoStateLabels: Record<DemoState, string> = {
  default: '默认',
  invalid: '异常',
  disabled: '置灰',
};

type DemoDeviceState = 'connected' | 'disconnected' | 'abnormal';

const productionFooterDevices: { name: string; state: DemoDeviceState }[] = [
  { name: 'PLC', state: 'connected' },
  { name: '主筋板打磨机器人1', state: 'connected' },
  { name: '搬运机器人2', state: 'disconnected' },
  { name: '桁架相机', state: 'connected' },
  { name: '反面焊接机器人2', state: 'abnormal' },
];

const trayCardDemoSlots: Record<'empty' | 'collapsed' | 'single' | 'full' | 'multi', TrayAllocation> = {
  empty: {
    id: 'demo-tray-empty',
    area: '装配区',
    code: '08',
    name: '08 号位',
    x: 18,
    y: 48.7,
    w: 6.17,
    h: 7.62,
    partName: null,
    partNo: null,
    count: 0,
    materials: [],
    occupied: false,
  },
  collapsed: {
    id: 'demo-tray-collapsed',
    area: '装配区',
    code: '07',
    name: '07 号位',
    x: 24.83,
    y: 48.7,
    w: 6.17,
    h: 7.62,
    partName: null,
    partNo: null,
    count: 0,
    materials: [],
    occupied: false,
  },
  single: {
    id: 'demo-tray-single',
    area: '装配区',
    code: '03',
    name: '03 号位',
    x: 54.71,
    y: 48.7,
    w: 6.17,
    h: 7.62,
    partName: '0162-01-010101-02',
    partNo: '02',
    count: 4,
    materials: [{ partName: '0162-01-010101-02', partNo: '02', count: 4 }],
    occupied: true,
  },
  full: {
    id: 'demo-tray-full',
    area: '装配区',
    code: '04',
    name: '04 号位',
    x: 47.87,
    y: 48.7,
    w: 6.17,
    h: 7.62,
    partName: '0162-01-010101-03',
    partNo: '03',
    count: 5,
    materials: [{ partName: '0162-01-010101-03', partNo: '03', count: 5 }],
    occupied: true,
  },
  multi: {
    id: 'demo-tray-multi',
    area: '装配区',
    code: '02',
    name: '02 号位',
    x: 64.68,
    y: 49.54,
    w: 6.17,
    h: 6.76,
    partName: '0162-01-010101-01',
    partNo: '01',
    count: 4,
    materials: [
      { partName: '0162-01-010101-01', partNo: '01', count: 1 },
      { partName: '0162-01-010101-02', partNo: '02', count: 1 },
      { partName: '0162-01-010101-03', partNo: '03', count: 1 },
      { partName: '0162-01-010101-04', partNo: '04', count: 1 },
    ],
    occupied: true,
  },
};

const productionTrayLogisticsVariants: Array<{
  label: string;
  code: string;
  state: ProductionTrayCardState;
  material?: string;
  materials?: string[];
  quantity?: number;
  activity?: string;
}> = [
  { label: '空闲', code: '08', state: 'empty' },
  { label: '上料预约', code: '01', state: 'reserved', material: '0162-01-010101-01', activity: '等待AGV' },
  { label: '零件到达', code: '01', state: 'loaded', material: '0162-01-010101-01', quantity: 6 },
  { label: '多料到达', code: '04', state: 'loaded', materials: ['零件01 主筋板', '零件02 加强板', '零件03 底板'], quantity: 5 },
  { label: '空托回收中', code: '01', state: 'empty-frame', activity: '等待AGV' },
  { label: '成品到达', code: '09', state: 'full', material: '工件-0162-01-010101', quantity: 6 },
  { label: '成品下料中', code: '09', state: 'unloading', material: '工件-0162-01-010101', quantity: 6, activity: '等待AGV' },
  { label: '下料完成', code: '09', state: 'empty' },
];

const productionTrayEditDemoOptions = [
  { value: '0162-01-010101-01', label: '0162-01-010101-01' },
  { value: '0162-01-010101-02', label: '0162-01-010101-02' },
  { value: '0162-01-010101-03', label: '0162-01-010101-03' },
  { value: '0162-01-010101-04', label: '0162-01-010101-04' },
];

function getProductionFooterDeviceStateStyle(state: DemoDeviceState) {
  if (state === 'connected') return 'bg-emerald-500 ring-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.45)]';
  if (state === 'abnormal') return 'bg-red-500 ring-red-100 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  return 'bg-slate-300 ring-slate-100';
}

function getRoundedIsometricPath(points: number[][], radius: number) {
  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous[0] - point[0], previous[1] - point[1]);
    const nextLength = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const offset = Math.min(radius, previousLength / 2, nextLength / 2);
    return {
      start: [
        point[0] + ((previous[0] - point[0]) / previousLength) * offset,
        point[1] + ((previous[1] - point[1]) / previousLength) * offset,
      ],
      end: [
        point[0] + ((next[0] - point[0]) / nextLength) * offset,
        point[1] + ((next[1] - point[1]) / nextLength) * offset,
      ],
    };
  });

  return corners.reduce((path, corner, index) => (
    `${path}${index === 0 ? `M ${corner.start[0]} ${corner.start[1]}` : `L ${corner.start[0]} ${corner.start[1]}`} Q ${points[index][0]} ${points[index][1]} ${corner.end[0]} ${corner.end[1]}${index === corners.length - 1 ? ' Z' : ' '}`
  ), '');
}

const labTabLabels: Record<LabTab, string> = {
  interaction: '交互组件',
  business: '业务组件',
  tokens: 'Design Token',
};

const pathCoordinateFrameOptions = ['世界', '父系坐标系', '物体'] as const;
const pathCoordinateFrameOffsets: Record<PathCoordinateFrame, Record<'x' | 'y' | 'z', number>> = {
  世界: { x: 0, y: 0, z: 0 },
  父系坐标系: { x: -120, y: -40, z: -5 },
  物体: { x: -240, y: -80, z: -12 },
};

function formatPathCoordinateFrameValue(value: string, offset: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return (numericValue + offset).toFixed(1);
}

function getPathCoordinateFramePoint<T extends { x: string; y: string; z: string }>(point: T, frame: PathCoordinateFrame): T {
  const offsets = pathCoordinateFrameOffsets[frame];
  return {
    ...point,
    x: formatPathCoordinateFrameValue(point.x, offsets.x),
    y: formatPathCoordinateFrameValue(point.y, offsets.y),
    z: formatPathCoordinateFrameValue(point.z, offsets.z),
  };
}

function isInvalidNumberText(value: string) {
  const text = value.trim();
  if (!text) return true;
  const numericValue = Number(text);
  return !Number.isFinite(numericValue) || Number.isNaN(numericValue) || numericValue < 0;
}

function getNumberRangeWarning(minValue: string, maxValue: string) {
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

function isInvalidNumberRange(minValue: string, maxValue: string) {
  return Boolean(getNumberRangeWarning(minValue, maxValue));
}

function clampPercent(value: string | number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

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

function getDemoWorkbenchSupportAxes(id: string): WorkbenchSupportAxis[] {
  return id === '2' ? ['Y'] : ['Y', 'Z'];
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

function getDemoWorkbenchClampAxes(workbenchIndex: number): WorkbenchSupportAxis[] {
  return workbenchIndex === 1 || workbenchIndex === 3 ? ['X', 'Y', 'Z'] : ['Y', 'Z'];
}

const ThemedCheckbox = ({ className = '', ...props }: CheckboxProps) => <DsCheckbox className={className} {...props} />;

function NumberFieldDemo({
  value,
  onChange,
  unit,
  disabled,
  inputClassName = 'pr-12',
}: {
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  disabled?: boolean;
  inputClassName?: string;
}) {
  const invalid = isInvalidNumberText(value);

  return (
    <div className="relative">
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-orange-300 disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-slate-400 ${
          invalid && !disabled ? 'border-red-300 bg-red-50/60' : 'border-ds-border-default'
        } ${inputClassName}`}
      />
      {unit && (
        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${invalid && !disabled ? 'text-red-300' : 'text-slate-300'}`}>
          {unit}
        </span>
      )}
    </div>
  );
}

function UnitNumberInputDemo({
  value,
  onChange,
  unit,
  disabled,
  size = 'md',
  align = 'left',
  label,
  stepper = false,
  step = 0.1,
  invalid: invalidOverride,
}: {
  value: string;
  onChange: (value: string) => void;
  unit: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  label?: string;
  stepper?: boolean;
  step?: number;
  invalid?: boolean;
}) {
  const invalid = invalidOverride ?? isInvalidNumberText(value);
  const sizeClass = {
    sm: stepper ? 'h-8 px-2 pr-[3.25rem] text-xs' : 'h-8 px-2 pr-9 text-xs',
    md: stepper ? 'h-9 px-3 pr-14 text-sm' : 'h-9 px-3 pr-11 text-sm',
    lg: stepper ? 'h-10 px-3.5 pr-16 text-sm' : 'h-10 px-3.5 pr-12 text-sm',
  }[size];
  const unitClass = {
    sm: stepper ? 'right-7 text-[10px]' : 'right-2.5 text-[10px]',
    md: stepper ? 'right-8 text-[11px]' : 'right-3 text-[11px]',
    lg: stepper ? 'right-9 text-xs' : 'right-3.5 text-xs',
  }[size];
  const changeByStep = (direction: 1 | -1) => {
    if (disabled) return;
    const numericValue = Number(value);
    const nextValue = Number.isFinite(numericValue) ? numericValue + direction * step : direction * step;
    onChange(nextValue.toFixed(1));
  };

  return (
    <div>
      {label && <div className="ds-parameter-label">{label}</div>}
      <div className="relative">
        <input
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border bg-white text-slate-700 outline-none transition-colors focus:border-orange-300 disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-slate-400 ${
            align === 'right' ? 'text-right' : 'text-left'
          } ${invalid && !disabled ? 'border-red-300 bg-red-50/60' : 'border-ds-border-default'} ${sizeClass}`}
        />
        <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${unitClass} ${invalid && !disabled ? 'text-red-300' : 'text-slate-300'}`}>
          {unit}
        </span>
        {stepper && (
          <div className="absolute right-1 top-1/2 flex h-6 w-4 -translate-y-1/2 flex-col overflow-hidden rounded border border-ds-border-default bg-slate-50 text-ds-text-disabled shadow-[0_1px_1px_rgba(15,23,42,0.04)]">
            <button
              type="button"
              aria-label="增加数值"
              disabled={disabled}
              className="flex h-3 items-center justify-center border-b border-ds-border-default transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled"
              onClick={(event) => {
                event.stopPropagation();
                changeByStep(1);
              }}
            >
              <ChevronUp className="size-2.5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="减少数值"
              disabled={disabled}
              className="flex h-3 items-center justify-center transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled"
              onClick={(event) => {
                event.stopPropagation();
                changeByStep(-1);
              }}
            >
              <ChevronDown className="size-2.5" strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyPointNumberInputDemo({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const invalid = isInvalidNumberText(value);

  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`h-7 w-full rounded-lg border bg-white px-1.5 py-1 text-right text-[11px] text-slate-700 outline-none transition-colors focus:border-orange-300 disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-slate-400 ${
        invalid && !disabled ? 'border-red-300 bg-red-50/60' : 'border-ds-border-default'
      }`}
    />
  );
}

function UnitNumberInputVariantsDemo({
  value,
  invalid,
  disabled,
  onChange,
}: {
  value: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const shownValue = invalid ? '-20' : value;
  const rows: { size: 'sm' | 'md' | 'lg'; height: string; maxChars: string; gap: string; stroke: string }[] = [
    { size: 'sm', height: '32px', maxChars: '8-10', gap: '8px', stroke: '1px / slate-200' },
    { size: 'md', height: '36px', maxChars: '10-12', gap: '10px', stroke: '1px / slate-200' },
    { size: 'lg', height: '40px', maxChars: '12-14', gap: '12px', stroke: '1px / slate-200' },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[72px_96px_110px_88px_132px_40px_minmax(170px,1fr)_32px_minmax(170px,1fr)] border-b border-slate-200 px-2 pb-3 text-[11px] font-medium text-slate-400">
          <div>型号</div>
          <div>Height</div>
          <div>最大字符宽度</div>
          <div>字距单位</div>
          <div>Stroke</div>
          <div />
          <div>左对齐</div>
          <div />
          <div>右对齐</div>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.size} className="grid grid-cols-[72px_96px_110px_88px_132px_40px_minmax(170px,1fr)_32px_minmax(170px,1fr)] items-center gap-0 px-2 py-5">
              <div className="text-xs font-medium uppercase text-slate-700">{row.size}</div>
              <div className="font-mono text-xs text-slate-500">{row.height}</div>
              <div className="font-mono text-xs text-slate-500">{row.maxChars}</div>
              <div className="font-mono text-xs text-slate-500">{row.gap}</div>
              <div className="font-mono text-xs text-slate-500">{row.stroke}</div>
              <div />
              <div>
                <UnitNumberInputDemo
                  value={shownValue}
                  onChange={onChange}
                  unit="mm"
                  disabled={disabled}
                  size={row.size}
                  align="left"
                />
              </div>
              <div />
              <div>
                <UnitNumberInputDemo
                  value={shownValue}
                  onChange={onChange}
                  unit="mm"
                  disabled={disabled}
                  size={row.size}
                  align="right"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RangeFieldDemo({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minLabel,
  maxLabel,
  unit,
  disabled,
  warningPlacement = 'absolute',
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minLabel: string;
  maxLabel: string;
  unit: string;
  disabled?: boolean;
  warningPlacement?: 'absolute' | 'inline' | 'none';
}) {
  const warningText = getNumberRangeWarning(minValue, maxValue);
  const invalid = Boolean(warningText);

  return (
    <div className="relative">
      {invalid && !disabled && warningPlacement === 'absolute' && (
        <div className="absolute -top-7 right-0 flex items-center gap-1 text-xs text-red-500">
          <CircleAlert className="size-3.5" />
          <span>{warningText}</span>
        </div>
      )}
      {invalid && !disabled && warningPlacement === 'inline' && (
        <div className="mb-1 flex items-center gap-1 text-xs text-red-500">
          <CircleAlert className="size-3.5" />
          <span>{warningText}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[
          [minLabel, minValue, onMinChange],
          [maxLabel, maxValue, onMaxChange],
        ].map(([label, value, onChange]) => (
          <div key={label as string} className="ds-parameter-field">
            <UnitNumberInputDemo
              value={value as string}
              onChange={onChange as (value: string) => void}
              unit={unit}
              disabled={disabled}
              size="md"
              align="left"
              label={label as string}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PercentSliderDemo({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const percent = clampPercent(value);

  return (
    <div className="flex items-center gap-3">
      <div className="relative ml-2 h-8 flex-1">
        <input
          type="range"
          min="0"
          max="100"
          value={percent}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-x-0 top-0 z-10 h-5 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center">
          <div className="relative h-1.5 flex-1 rounded-full bg-ds-bg-slider-track">
            <div className={`absolute inset-y-0 left-0 rounded-full ${disabled ? 'bg-slate-300' : 'bg-ds-brand-primary'}`} style={{ width: `${percent}%` }} />
            <div className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm ${disabled ? 'border-slate-300' : 'border-ds-brand-primary'}`} style={{ left: `${percent}%` }} />
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
        <UnitNumberInputDemo value={value} onChange={onChange} unit="%" disabled={disabled} size="sm" align="right" />
      </div>
    </div>
  );
}

function SegmentedControlDemo<T extends string>({
  value,
  options,
  onChange,
  disabled,
  className = '',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-lg bg-ds-bg-segmented p-0.5 ${disabled ? 'opacity-60' : ''} ${className}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
              selected ? 'bg-white text-ds-brand-primary-text shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SwitchDemo({
  checked,
  onChange,
  disabled,
  label,
  enabledLabel = '启用',
  disabledLabel = '关闭',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  enabledLabel?: string;
  disabledLabel?: string;
}) {
  return (
    <ParameterSwitch
      checked={checked}
      onChange={onChange}
      ariaLabel={label ?? '参数开关'}
      enabledLabel={enabledLabel}
      disabledLabel={disabledLabel}
      disabled={disabled}
      size="sm"
    />
  );
}

function ForceLevelSelectDemo({
  value,
  onChange,
  disabled,
  size = 'md',
}: {
  value: PickMagnetForceLevel;
  onChange: (value: PickMagnetForceLevel) => void;
  disabled?: boolean;
  size?: 'sm' | 'task' | 'md';
}) {
  return (
    <ProcessSingleSelect
      items={pickMagnetForceLevelOptions.map((level) => ({ id: level, name: level }))}
      selectedId={value}
      disabled={disabled}
      size={size}
      elevation="none"
      onChange={(nextValue) => nextValue && onChange(nextValue as PickMagnetForceLevel)}
    />
  );
}

function SolidGearIcon({ className = 'size-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.28 7.28 0 0 0-1.69-.98L14.5 2.42A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42L9.12 5.07c-.6.24-1.16.56-1.69.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.23.4.32.6.22l2.49-1c.53.41 1.09.74 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.6-.24 1.16-.57 1.69-.98l2.49 1c.2.1.47.01.6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
    </svg>
  );
}

function PickMagnetRowCardsDemo({
  magnets,
  forceLevels,
  disabled,
  invalid,
  onMagnetEnabledChange,
  onMagnetZChange,
  onMagnetForceLevelChange,
}: {
  magnets: Record<PickMagnetKey, { enabled: boolean; z: string }>;
  forceLevels: Record<PickMagnetKey, PickMagnetForceLevel>;
  disabled?: boolean;
  invalid?: boolean;
  onMagnetEnabledChange: (key: PickMagnetKey, enabled: boolean) => void;
  onMagnetZChange: (key: PickMagnetKey, value: string) => void;
  onMagnetForceLevelChange: (key: PickMagnetKey, value: PickMagnetForceLevel) => void;
}) {
  const magnetRows: { key: PickMagnetKey; label: string }[] = [
    { key: 'left', label: '左磁铁' },
    { key: 'center', label: '中磁铁' },
    { key: 'right', label: '右磁铁' },
  ];

  return (
    <div className="w-[396px] max-w-full ds-parameter-group-stack">
      {magnetRows.map((item) => {
        const magnet = magnets[item.key];
        const cardDisabled = disabled || !magnet.enabled;
        return (
          <div key={item.key} className="w-full px-ds-150 ds-parameter-group">
            <div className="flex min-h-6 items-center justify-between gap-3">
              <div className={`truncate ${compactProcessParameterNameDemoClassName}`}>{item.label}</div>
              <SwitchDemo
                checked={magnet.enabled}
                disabled={disabled}
                label={`${item.label}启用状态`}
                onChange={(enabled) => onMagnetEnabledChange(item.key, enabled)}
              />
            </div>
            <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 px-0.5 ${cardDisabled ? 'opacity-70' : ''}`}>
              <div className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-2">
                <div className={compactProcessSubParameterNameDemoClassName}>Z</div>
                <UnitNumberInputDemo
                  value={item.key === 'center' ? '--' : magnet.z}
                  unit="mm"
                  disabled={item.key === 'center' || cardDisabled}
                  size="sm"
                  align="right"
                  onChange={(value) => {
                    if (item.key === 'center') return;
                    onMagnetZChange(item.key, value);
                  }}
                />
              </div>
              <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                <div className={compactProcessSubParameterNameDemoClassName}>磁力档位</div>
                <ForceLevelSelectDemo
                  value={forceLevels[item.key]}
                  disabled={cardDisabled}
                  size="task"
                  onChange={(value) => onMagnetForceLevelChange(item.key, value)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PickParameterValidationDemo({
  gripperType,
  magnets,
  disabled,
  invalid,
  onGripperTypeChange,
  onMagnetEnabledChange,
  onMagnetZChange,
}: {
  gripperType: PickGripperType;
  magnets: Record<PickMagnetKey, { enabled: boolean; z: string }>;
  disabled?: boolean;
  invalid?: boolean;
  onGripperTypeChange: (value: PickGripperType) => void;
  onMagnetEnabledChange: (key: PickMagnetKey, enabled: boolean) => void;
  onMagnetZChange: (key: PickMagnetKey, value: string) => void;
}) {
  const magnetRows: { key: PickMagnetKey; label: string }[] = [
    { key: 'left', label: '左磁铁' },
    { key: 'center', label: '中磁铁' },
    { key: 'right', label: '右磁铁' },
  ];
  const enabledCount = magnetRows.filter((item) => magnets[item.key].enabled).length;
  const resultValues =
    gripperType === 'gantry'
      ? { coverage: `${70 + enabledCount * 4}.99%`, safety: (0.68 + enabledCount * 0.04).toFixed(2), eccentric: `${188 - enabledCount * 8}mm` }
      : { coverage: `${64 + enabledCount * 5}.50%`, safety: (0.62 + enabledCount * 0.05).toFixed(2), eccentric: `${206 - enabledCount * 11}mm` };
  const thresholdRows = [
    { label: '电磁铁覆盖率', threshold: '50%', result: resultValues.coverage, status: invalid ? '低于阈值' : '满足阈值' },
    { label: '安全系数', threshold: '0.80', result: resultValues.safety, status: gripperType === 'robot' && enabledCount < 3 ? '超出阈值' : '满足阈值' },
    { label: '偏心距', threshold: '200mm', result: resultValues.eccentric, status: invalid ? '超出阈值' : '满足阈值' },
  ];

  return (
    <div className="w-[396px] max-w-full rounded-xl bg-slate-50/80 p-ds-150">
      <div className="ds-parameter-category-stack">
        <div className="ds-parameter-group-stack">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="ds-label-input-compact min-w-[160px]">
              <div className="ds-label-input-compact-label">抓具类型</div>
              <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
                <span className="truncate">{gripperType === 'gantry' ? '桁架抓具' : '机器人抓具'}</span>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {magnetRows.map((item) => {
              const magnet = magnets[item.key];
              return (
                <div key={item.key} className="ds-parameter-card-inset rounded-lg bg-white ring-1 ring-slate-100">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="truncate text-xs font-medium text-slate-700">{item.label}</div>
                    <button
                      type="button"
                      title="设置磁铁参数"
                      className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label={`设置${item.label}参数`}
                    >
                      <SolidGearIcon className="size-3" />
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-[36px_minmax(0,1fr)] items-center gap-1">
                    <div className="text-[11px] text-slate-400">启用</div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={magnet.enabled}
                        aria-label={`${item.label}启用状态`}
                        disabled={disabled}
                        onClick={() => onMagnetEnabledChange(item.key, !magnet.enabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                          magnet.enabled ? 'bg-ds-brand-primary' : 'bg-slate-300'
                        } ${disabled ? 'opacity-60' : ''}`}
                      >
                        <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${magnet.enabled ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-1">
                    <div className="text-[11px] text-slate-400">Z</div>
                    <UnitNumberInputDemo
                      value={item.key === 'center' ? '--' : magnet.z}
                      unit="mm"
                      disabled={item.key === 'center' || disabled || !magnet.enabled}
                      size="sm"
                      align="right"
                      onChange={(value) => {
                        if (item.key === 'center') return;
                        onMagnetZChange(item.key, value);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="ds-parameter-group">
          {thresholdRows.map((row) => {
            const satisfied = row.status === '满足阈值';
            return (
              <div key={row.label} className="flex min-h-8 items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-100">
                <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-9">
                  <div className={compactProcessParameterNameDemoClassName}>{row.label}</div>
                  <div className="truncate text-xs font-medium text-slate-700">{row.result}</div>
                </div>
                <div className="shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${satisfied ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {satisfied ? '满足阈值' : `${row.status} ${row.threshold}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PointInfoRowDemo({
  index,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  selectedVariant = 'emphasis',
}: {
  index: number;
  point: { x: string; y: string; z: string };
  onAxisChange: (axis: 'x' | 'y' | 'z', value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  return (
    <div
      className={`grid grid-cols-[48px_repeat(3,minmax(0,1fr))] items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all ${
        selected
          ? selectedVariant === 'subtle'
            ? 'border-ds-border-default bg-white'
            : 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200'
          : 'border-transparent hover:bg-white/70'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
      {(['x', 'y', 'z'] as const).map((axis) => (
        <div key={axis} className="grid min-w-0 grid-cols-[12px_minmax(0,1fr)] items-center gap-1">
          <span className="text-[11px] uppercase text-slate-400">{axis}</span>
          <UnitNumberInputDemo
            value={point[axis]}
            onChange={(value) => onAxisChange(axis, value)}
            unit="mm"
            disabled={disabled}
            size="sm"
            align="right"
          />
        </div>
      ))}
    </div>
  );
}

function DeltaPointInfoRowDemo({
  index,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  selectedVariant = 'emphasis',
}: {
  index: number;
  point: { x: string; y: string; z: string };
  onAxisChange: (axis: 'x' | 'y' | 'z', value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  return (
    <div
      className={`grid grid-cols-[48px_repeat(3,minmax(0,1fr))] items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all ${
        selected
          ? selectedVariant === 'subtle'
            ? 'border-ds-border-default bg-white'
            : 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200'
          : 'border-transparent hover:bg-white/70'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
      {(['x', 'y', 'z'] as const).map((axis) => (
        <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
          <span className="text-[11px] uppercase text-slate-400">Δ{axis}</span>
          <UnitNumberInputDemo
            value={point[axis]}
            onChange={(value) => onAxisChange(axis, value)}
            unit="mm"
            disabled={disabled}
            size="sm"
            align="right"
          />
        </div>
      ))}
    </div>
  );
}

function PointInfoRowWithRPYDemo({
  index,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  defaultCollapsed = false,
}: {
  index: number;
  point: { x: string; y: string; z: string; rx: string; ry: string; rz: string };
  onAxisChange: (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 transition-all ${
        selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent hover:bg-white/70'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="grid grid-cols-[48px_minmax(0,1fr)_20px] items-center gap-1.5">
        <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
        {collapsed ? <PosePointSummaryTextDemo point={point} /> : <div />}
        <button
          type="button"
          aria-label={collapsed ? '展开点位' : '折叠点位'}
          aria-expanded={!collapsed}
          disabled={disabled}
          className="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
          onClick={(event) => {
            event.stopPropagation();
            setCollapsed((current) => !current);
          }}
        >
          <ChevronRight className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="mt-1 grid grid-cols-[48px_repeat(3,minmax(0,1fr))_20px] items-center gap-1.5 border-t border-slate-100/80 pt-1">
            <div />
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[11px] uppercase text-slate-400">{axis}</span>
                <UnitNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  unit="mm"
                  disabled={disabled}
                  size="sm"
                  align="right"
                  stepper
                />
              </div>
            ))}
            <div />
          </div>
          <div className="mt-1 grid grid-cols-[48px_repeat(3,minmax(0,1fr))_20px] items-center gap-1.5 border-t border-slate-100/80 pt-1">
            <div />
            {(['rx', 'ry', 'rz'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[11px] uppercase text-slate-400">{axis}</span>
                <UnitNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  unit="deg"
                  disabled={disabled}
                  size="sm"
                  align="right"
                  stepper
                />
              </div>
            ))}
            <div />
          </div>
        </>
      )}
    </div>
  );
}

function PosePointSummaryTextDemo({
  point,
  delta = false,
}: {
  point: { x: string; y: string; z: string; rx: string; ry: string; rz: string };
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
          <span className="font-medium text-slate-400">{label}</span>
          <span className="ml-0.5 font-mono tabular-nums text-slate-600">{value}</span>
        </span>
      ))}
    </div>
  );
}

function DeltaPointInfoRowWithRPYDemo({
  index,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  defaultCollapsed = false,
}: {
  index: number;
  point: { x: string; y: string; z: string; rx: string; ry: string; rz: string };
  onAxisChange: (axis: 'x' | 'y' | 'z' | 'rx' | 'ry' | 'rz', value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 transition-all ${
        selected ? 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200' : 'border-transparent hover:bg-white/70'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="grid grid-cols-[48px_minmax(0,1fr)_20px] items-center gap-1.5">
        <div className="text-xs font-medium text-slate-600">点位 {index + 1}</div>
        {collapsed ? <PosePointSummaryTextDemo point={point} delta /> : <div />}
        <button
          type="button"
          aria-label={collapsed ? '展开点位' : '折叠点位'}
          aria-expanded={!collapsed}
          disabled={disabled}
          className="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
          onClick={(event) => {
            event.stopPropagation();
            setCollapsed((current) => !current);
          }}
        >
          <ChevronRight className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="mt-1 grid grid-cols-[48px_repeat(3,minmax(0,1fr))_20px] items-center gap-1.5 border-t border-slate-100/80 pt-1">
            <div />
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[11px] uppercase text-slate-400">Δ{axis}</span>
                <UnitNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  unit="mm"
                  disabled={disabled}
                  size="sm"
                  align="right"
                  stepper
                />
              </div>
            ))}
            <div />
          </div>
          <div className="mt-1 grid grid-cols-[48px_repeat(3,minmax(0,1fr))_20px] items-center gap-1.5 border-t border-slate-100/80 pt-1">
            <div />
            {(['rx', 'ry', 'rz'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[11px] uppercase text-slate-400">{axis}</span>
                <UnitNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  unit="deg"
                  disabled={disabled}
                  size="sm"
                  align="right"
                  stepper
                />
              </div>
            ))}
            <div />
          </div>
        </>
      )}
    </div>
  );
}

type PickPathPointDemoValue = { x: string; y: string; z: string; rx: string; ry: string; rz: string; enabled?: boolean };
const pickPathPointDemoAxes = ['x', 'y', 'z', 'rx', 'ry', 'rz'] as const;
const createDefaultPickPathPointDemoValues = (): PickPathPointDemoValue[] => [
  { x: '120.0', y: '80.0', z: '900.0', rx: '0.0', ry: '0.0', rz: '0.0', enabled: true },
  { x: '120.0', y: '80.0', z: '650.0', rx: '0.0', ry: '0.0', rz: '0.0', enabled: true },
  { x: '120.0', y: '80.0', z: '420.0', rx: '0.0', ry: '0.0', rz: '0.0', enabled: true },
  { x: '240.0', y: '95.0', z: '420.0', rx: '0.0', ry: '0.0', rz: '0.0', enabled: true },
  { x: '240.0', y: '95.0', z: '650.0', rx: '0.0', ry: '0.0', rz: '0.0', enabled: true },
  { x: '240.0', y: '95.0', z: '900.0', rx: '0.0', ry: '0.0', rz: '0.0', enabled: true },
];

function PosePointInfoRowDemo({
  label,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  selectedVariant = 'emphasis',
}: {
  label: string;
  point: PickPathPointDemoValue;
  onAxisChange: (axis: typeof pickPathPointDemoAxes[number], value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  return (
    <div
      className={`space-y-1 rounded-lg border px-2.5 py-2 transition-all ${
        selected
          ? selectedVariant === 'subtle'
            ? 'border-ds-border-default bg-white'
            : 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200'
          : 'border-transparent bg-white/70 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="text-[11px] font-medium text-slate-600">{label}</div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { axes: ['x', 'y', 'z'] as const, unit: 'mm' },
          { axes: ['rx', 'ry', 'rz'] as const, unit: '°' },
        ].flatMap((row) =>
          row.axes.map((axis) => (
            <div key={axis} className="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center gap-1">
              <span className="text-[10px] uppercase text-slate-400">{axis}</span>
              <UnitNumberInputDemo
                value={point[axis]}
                onChange={(value) => onAxisChange(axis, value)}
                unit={row.unit}
                disabled={disabled}
                size="sm"
                align="right"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StyleCPathPosePointInfoRowDemo({
  label,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  defaultCollapsed = false,
  collapseSignal = 0,
}: {
  label: string;
  point: PickPathPointDemoValue;
  onAxisChange: (axis: typeof pickPathPointDemoAxes[number], value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  defaultCollapsed?: boolean;
  collapseSignal?: number;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  useEffect(() => {
    if (collapseSignal > 0) setCollapsed(collapseSignal % 2 === 1);
  }, [collapseSignal]);
  return (
    <div
      className={`space-y-1 rounded-lg border px-2.5 py-2 transition-all ${
        selected ? 'border-ds-border-default bg-white' : 'border-transparent bg-white/70 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_20px] items-center gap-1.5">
        <div className="text-[11px] font-medium text-slate-600">{label}</div>
        {collapsed ? <PosePointSummaryTextDemo point={point} /> : <div />}
        <button
          type="button"
          aria-label={collapsed ? '展开点位' : '折叠点位'}
          aria-expanded={!collapsed}
          disabled={disabled}
          className="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
          onClick={(event) => {
            event.stopPropagation();
            setCollapsed((current) => !current);
          }}
        >
          <ChevronRight className={`size-3.5 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100/80 pt-[6px]">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[10px] uppercase text-slate-400">{axis}</span>
                <UnitNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  unit="mm"
                  disabled={disabled}
                  size="sm"
                  align="right"
                  stepper
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['rx', 'ry', 'rz'] as const).map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[10px] uppercase text-slate-400">{axis}</span>
                <UnitNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  unit="°"
                  disabled={disabled}
                  size="sm"
                  align="right"
                  stepper
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WeldSegmentPosePointGroupsDemo({
  points,
  onAxisChange,
  disabled,
  selectedSegmentIndex,
  onSegmentSelect,
  selectedPointIndex,
  onPointSelect,
  selectedVariant = 'emphasis',
}: {
  points: PickPathPointDemoValue[];
  onAxisChange: (pointIndex: number, axis: typeof pickPathPointDemoAxes[number], value: string) => void;
  disabled?: boolean;
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
              className={`mb-2 rounded px-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
                selected ? 'text-slate-700' : 'text-slate-500 hover:bg-white/70 hover:text-ds-brand-primary-text'
              }`}
              disabled={disabled}
              onClick={() => onSegmentSelect?.(segmentIndex)}
            >
              焊缝段{segmentIndex + 1}
            </button>
            <div className="space-y-1.5">
              {[
                { label: `起点 P${startIndex + 1}`, index: startIndex },
                { label: `终点 P${endIndex + 1}`, index: endIndex },
              ].map((item) => (
                <PosePointInfoRowDemo
                  key={item.index}
                  label={item.label}
                  point={points[item.index] ?? { x: '', y: '', z: '', rx: '', ry: '', rz: '' }}
                  disabled={disabled}
                  selected={selectedPointIndex === item.index}
                  selectedVariant={selectedVariant}
                  onSelect={() => onPointSelect?.(item.index)}
                  onAxisChange={(axis, value) => onAxisChange(item.index, axis, value)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PickPathPointCardDemo({
  index,
  point,
  onAxisChange,
  onToggleEnabled,
  disabled,
  selected,
  onSelect,
  variant = 'default',
}: {
  index: number;
  point: PickPathPointDemoValue;
  onAxisChange: (axis: typeof pickPathPointDemoAxes[number], value: string) => void;
  onToggleEnabled: (enabled: boolean) => void;
  disabled?: boolean;
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
      className={`rounded-lg border px-2.5 py-2 transition-all ${cardStateClassName} ${enabled ? '' : 'opacity-55'}`}
      onClick={disabled || !enabled ? undefined : onSelect}
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
            disabled={disabled}
            aria-label={`启用安全点 ${index + 1}`}
            onChange={(event) => onToggleEnabled(event.target.checked)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { label: '坐标', axes: ['x', 'y', 'z'] as const, unit: 'mm', prefix: 'Δ' },
          { label: '姿态', axes: ['rx', 'ry', 'rz'] as const, unit: '°', prefix: '' },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-3 items-center gap-1.5">
            {row.axes.map((axis) => (
              <div key={axis} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1">
                <span className="text-[10px] uppercase text-slate-400">{row.prefix}{axis}</span>
                <SafetyPointNumberInputDemo
                  value={point[axis]}
                  onChange={(value) => onAxisChange(axis, value)}
                  disabled={disabled || !enabled}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PickPathPointsDemo({
  points,
  onAxisChange,
  onToggleEnabled,
  onReset,
  disabled,
}: {
  points: PickPathPointDemoValue[];
  onAxisChange: (pointIndex: number, axis: typeof pickPathPointDemoAxes[number], value: string) => void;
  onToggleEnabled: (pointIndex: number, enabled: boolean) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const [selectedPosePointIndex, setSelectedPosePointIndex] = useState<number | 'all'>(0);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const showPose = (pointIndex: number | 'all') => {
    if (disabled) return;
    if (pointIndex !== 'all' && points[pointIndex]?.enabled === false) return;
    if (pointIndex === 'all' && points.every((point) => point.enabled === false)) return;
    setSelectedPosePointIndex(pointIndex);
  };
  const togglePointEnabled = (pointIndex: number, enabled: boolean) => {
    onToggleEnabled(pointIndex, enabled);
    if (!enabled && selectedPosePointIndex === pointIndex) {
      const nextEnabledIndex = points.findIndex((point, index) => index !== pointIndex && point.enabled !== false);
      setSelectedPosePointIndex(nextEnabledIndex >= 0 ? nextEnabledIndex : 'all');
    }
  };
  return (
    <div className={`rounded-lg border border-white/50 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md ${legendCollapsed ? 'w-[360px]' : 'w-[500px]'}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Move3D className="size-4 text-orange-500" />
          <span className="text-xs font-medium">安全点配置</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`rounded-sm p-0.5 transition-colors ${legendCollapsed ? 'bg-orange-50 text-ds-brand-primary-text hover:bg-orange-100' : 'text-slate-400 hover:bg-slate-100'}`}
            onClick={() => setLegendCollapsed((value) => !value)}
            aria-label={legendCollapsed ? '展开图例' : '收起图例'}
          >
            <PanelLeft className="size-3.5" />
          </button>
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100" title="最小化" disabled={disabled}>
            <Minus className="size-3.5" />
          </button>
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100" title="关闭" disabled={disabled}>
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div className={`grid overflow-hidden px-3 pb-3 ${legendCollapsed ? 'max-h-[286px] grid-cols-1' : 'max-h-[286px] grid-cols-[140px_minmax(0,1fr)] gap-3'}`}>
        {!legendCollapsed && (
          <div className="relative flex h-[270px] flex-col items-center rounded-lg border border-ds-border-default bg-zinc-50/80 px-2 py-3">
            <div className="relative h-[168px] w-[104px]">
              <div className="absolute left-[34px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
              <div className="absolute left-[34px] bottom-[24px] h-[3px] w-[36px] rounded-full bg-red-500" />
              <ArrowRight className="absolute left-[46px] bottom-[15px] size-5 text-red-500" strokeWidth={2.75} />
              <div className="absolute left-[70px] top-3 bottom-[24px] w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
              {[
                { label: 'P1', top: '14px', left: '34px' },
                { label: 'P2', top: '58px', left: '34px' },
                { label: 'P3', top: '102px', left: '34px' },
                { label: 'P4', top: '102px', left: '70px' },
                { label: 'P5', top: '58px', left: '70px' },
                { label: 'P6', top: '14px', left: '70px' },
              ].map((point, pointIndex) => {
                const enabled = points[pointIndex]?.enabled !== false;
                return (
                  <button
                    key={point.label}
                    type="button"
                    className="absolute -translate-x-1/2 text-left disabled:cursor-not-allowed"
                    style={{ top: point.top, left: point.left }}
                    disabled={disabled}
                    onClick={() => showPose(pointIndex)}
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
                disabled={disabled || points.every((point) => point.enabled === false)}
                onClick={() => showPose('all')}
              >
                显示全部位姿
              </Button>
            </div>
          </div>
        )}
        <div className="grid max-h-[270px] grid-cols-1 gap-2 overflow-y-auto pr-1">
          {points.map((point, index) => (
              <PickPathPointCardDemo
                key={index}
                index={index}
                point={point}
                disabled={disabled}
                selected={(selectedPosePointIndex === 'all' || selectedPosePointIndex === index) && point.enabled !== false}
                variant="compactSubtle"
                onSelect={() => showPose(index)}
                onToggleEnabled={(enabled) => togglePointEnabled(index, enabled)}
                onAxisChange={(axis, value) => onAxisChange(index, axis, value)}
              />
            ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2">
        <Button size="sm" variant="secondary" className="h-7 px-2.5 text-[11px]" disabled={disabled} onClick={onReset}>
          重置
        </Button>
        <Button size="sm" className="h-7 bg-ds-brand-primary px-2.5 text-[11px] text-white hover:bg-ds-brand-primary-hover" disabled={disabled}>
          确认
        </Button>
      </div>
    </div>
  );
}

function AxisUnitInputRowDemo({
  label,
  values,
  axes,
  unit = 'mm',
  onAxisChange,
  disabled,
  disabledAxes = [],
  frameless = false,
  selected,
  onSelect,
  selectedVariant = 'emphasis',
}: {
  label: string;
  values: Record<string, string>;
  axes: string[];
  unit?: string;
  onAxisChange: (axis: string, value: string) => void;
  disabled?: boolean;
  disabledAxes?: string[];
  frameless?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  const hasLabel = label.trim().length > 0;
  return (
    <div
      className={`grid items-center gap-ds-100 border transition-all ${
        selected
          ? selectedVariant === 'subtle'
            ? 'rounded-ds-lg border-ds-border-default bg-white p-ds-100'
            : 'rounded-ds-lg border-orange-200 bg-white p-ds-100 shadow-selected ring-1 ring-inset ring-orange-200'
          : frameless
            ? 'rounded-ds-lg border-transparent hover:bg-white/70'
            : 'rounded-ds-lg border-transparent bg-ds-bg-surface p-ds-100 ring-1 ring-ds-border-default'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ gridTemplateColumns: `${hasLabel ? '72px ' : ''}${axes.length === 2 ? 'repeat(2,minmax(84px,1fr))' : 'repeat(3,minmax(72px,1fr))'}` }}
      onClick={disabled ? undefined : onSelect}
    >
      {hasLabel && <div className="text-ds-label font-medium text-ds-text-secondary">{label}</div>}
      {axes.map((axis) => (
        <div key={axis} className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] items-center gap-ds-050">
          <span className={`text-ds-helper uppercase ${disabled || disabledAxes.includes(axis) ? 'text-ds-text-disabled' : 'text-ds-text-muted'}`}>{axis}</span>
          <UnitNumberInputDemo
            value={values[axis] ?? ''}
            onChange={(value) => onAxisChange(axis, value)}
            unit={unit}
            disabled={disabled || disabledAxes.includes(axis)}
            size="sm"
            align="left"
          />
        </div>
      ))}
    </div>
  );
}


function MultiSelectDemo({
  label,
  values,
  selectedValues,
  onToggle,
  disabled,
  compact = false,
}: {
  label: string;
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const empty = selectedValues.length === 0;
  const fieldClassName = compact ? 'ds-label-input-compact' : 'ds-parameter-field';
  const labelClassName = compact ? 'ds-label-input-compact-label' : 'ds-parameter-label';

  return (
    <div className={fieldClassName}>
      <div className={`${labelClassName} flex items-center justify-between gap-2`}>
        <span>{label}</span>
        {empty && !disabled && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-red-500">
            <CircleAlert className="size-3.5" />
            至少选择一项
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((item) => {
          const selected = selectedValues.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              className={`rounded-full border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed ${
                compact ? 'inline-flex min-h-8 items-center justify-center' : ''
              } ${
                selected
                  ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-slate-400'
                  : empty && !disabled
                    ? 'border-red-300 bg-white text-slate-500 hover:bg-red-50/40'
                  : 'border-ds-border-default bg-white text-slate-500 hover:border-ds-border-strong hover:bg-slate-50 disabled:bg-ds-bg-control-disabled disabled:text-slate-400'
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

function ObjectMultiSelectDemo({
  values = [],
  selectedValues = [],
  onToggle = () => {},
  onChange,
  disabled,
  invalid,
  placeholder = '请选择对象',
  size = 'md',
  showSelectAll = false,
}: {
  values?: string[];
  selectedValues?: string[];
  onToggle?: (value: string) => void;
  onChange?: (values: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  showSelectAll?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allSelected = values.length > 0 && values.every((item) => selectedValues.includes(item));
  const partiallySelected = selectedValues.length > 0 && !allSelected;
  const compact = size === 'sm';
  const visibleSelectedValues = compact ? selectedValues.slice(0, 2) : selectedValues;
  const hiddenSelectedCount = compact ? Math.max(0, selectedValues.length - visibleSelectedValues.length) : 0;
  const triggerClassName = compact
    ? 'flex h-7 w-full items-center justify-between gap-1.5 rounded-md border bg-white px-2 text-left text-[11px] shadow-none transition-colors disabled:cursor-not-allowed disabled:bg-ds-bg-control-disabled'
    : 'flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left text-xs shadow-none transition-colors disabled:cursor-not-allowed disabled:bg-ds-bg-control-disabled';
  const selectedWrapClassName = compact
    ? 'flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden'
    : 'flex min-w-0 flex-1 flex-wrap items-center gap-1.5';
  const chipClassName = compact
    ? 'max-w-[96px] truncate rounded-full px-1.5 py-0 text-[10px] leading-5'
    : 'max-w-[180px] truncate rounded-full px-2 py-0.5';
  const optionClassName = compact
    ? 'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50'
    : 'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50';
  const checkboxSize = compact ? 'sm' : 'md';
  const toggleValue = (item: string) => {
    if (!onChange) {
      onToggle(item);
      return;
    }
    const nextValues = selectedValues.includes(item)
      ? selectedValues.filter((value) => value !== item)
      : [...selectedValues, item];
    onChange(nextValues);
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        className={`${triggerClassName} ${invalid ? 'border-red-300' : 'border-ds-border-default hover:border-ds-border-strong'}`}
        onClick={() => setOpen((value) => !value)}
      >
        <div className={selectedWrapClassName}>
          {selectedValues.length === 0 ? (
            <span className="font-normal text-slate-400">{placeholder}</span>
          ) : visibleSelectedValues.map((item) => (
            <span key={item} className={`${chipClassName} ${invalid ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-slate-100 text-slate-600'}`} title={item}>{item}</span>
          ))}
          {hiddenSelectedCount > 0 && (
            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[10px] leading-5 text-slate-500">
              +{hiddenSelectedCount}
            </span>
          )}
        </div>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="ds-dropdown-surface absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-xl p-1.5">
          {showSelectAll && values.length > 0 && (
            <div
              role="button"
              tabIndex={0}
              className="mb-1 flex cursor-pointer items-center gap-2 rounded-lg border-b border-slate-100 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onChange?.(allSelected ? [] : values);
                setOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onChange?.(allSelected ? [] : values);
                setOpen(false);
              }}
            >
              <ThemedCheckbox
                checked={allSelected}
                indeterminate={partiallySelected}
                size={checkboxSize}
                onChange={() => undefined}
              />
              <span className="min-w-0 flex-1 truncate">全选零件</span>
            </div>
          )}
          {values.map((item) => {
            const selected = selectedValues.includes(item);
            return (
              <label key={item} className={`${optionClassName} ${invalid && selected ? 'ring-1 ring-inset ring-red-300' : ''}`}>
                <ThemedCheckbox
                  checked={selected}
                  size={checkboxSize}
                  onChange={() => toggleValue(item)}
                />
                <span className="min-w-0 flex-1 truncate" title={item}>{item}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ObjectSingleSelectDemo({
  values,
  selectedValue,
  onChange,
  disabled,
  invalid,
  placeholder = '请选择对象',
  size = 'md',
}: {
  values: string[];
  selectedValue: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const compact = size === 'sm';
  const triggerClassName = compact
    ? 'flex h-7 w-full items-center justify-between gap-1.5 rounded-md border bg-white px-2 text-left text-[11px] shadow-none transition-colors disabled:cursor-not-allowed disabled:bg-ds-bg-control-disabled'
    : 'flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left text-xs shadow-none transition-colors disabled:cursor-not-allowed disabled:bg-ds-bg-control-disabled';
  const optionClassName = compact
    ? 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors'
    : 'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors';

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const selectValue = (value: string | null) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        className={`${triggerClassName} ${invalid ? 'border-red-300' : 'border-ds-border-default hover:border-ds-border-strong'}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedValue ? invalid ? 'text-red-600' : 'text-slate-600' : 'text-slate-400'}`}>
          {selectedValue ?? <span className="font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="ds-dropdown-surface absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-xl p-1.5">
          {values.map((item) => {
            const selected = selectedValue === item;
            return (
              <button
                key={item}
                type="button"
                className={`${optionClassName} ${
                  selected
                    ? invalid
                      ? 'bg-red-50 text-red-600'
                      : 'bg-slate-50 text-slate-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => selectValue(item)}
              >
                <span className="min-w-0 flex-1 truncate">{item}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ObjectProcessPanelDemo({
  title,
  selectionLabel = '工件模型选择',
  selectionPlaceholder = '请选择工件模型',
  options = ['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03'],
  actionLabel,
  selectedValues,
  onToggle,
  points,
  posePoints,
  joints,
  pointMode = 'xyz',
  pointTitle,
  pointSubtitle,
  showPathPointEntry,
  pathSubtitle = '6个安全点',
  onPointAxisChange,
  onJointChange,
  selectedWeldSegmentIndex,
  onWeldSegmentSelect,
  selectedResultPointIndex,
  onResultPointSelect,
  selectedVariant = 'emphasis',
  showPlaceSupportParameters = false,
  placeWorkbenchType,
  placeSupportIds = [],
  placeCoverageById,
  onPlaceSupportToggle,
  showClampParameters = false,
  clampWorkbenchType,
  processClampIds = [],
  clampCoverageById,
  onProcessClampToggle,
  disabled,
  invalid,
  invalidText = '所选工件不相接',
  dirty,
  onApply,
}: {
  title: string;
  selectionLabel?: string;
  selectionPlaceholder?: string;
  options?: string[];
  actionLabel: string;
  selectedValues: string[];
  onToggle: (value: string) => void;
  points: { x: string; y: string; z: string }[];
  posePoints?: PickPathPointDemoValue[];
  joints?: string[];
  pointMode?: 'xyz' | 'pose' | 'joint' | 'weldSegment';
  pointTitle?: string;
  pointSubtitle?: string;
  showPathPointEntry?: boolean;
  pathSubtitle?: string;
  onPointAxisChange: (index: number, axis: typeof pickPathPointDemoAxes[number], value: string) => void;
  onJointChange?: (index: number, value: string) => void;
  selectedWeldSegmentIndex?: number | null;
  onWeldSegmentSelect?: (segmentIndex: number) => void;
  selectedResultPointIndex?: number | null;
  onResultPointSelect?: (pointIndex: number) => void;
  selectedVariant?: 'emphasis' | 'subtle';
  showPlaceSupportParameters?: boolean;
  placeWorkbenchType?: string;
  placeSupportIds?: string[];
  placeCoverageById?: Record<string, string>;
  onPlaceSupportToggle?: (value: string) => void;
  showClampParameters?: boolean;
  clampWorkbenchType?: string;
  processClampIds?: string[];
  clampCoverageById?: Record<string, string>;
  onProcessClampToggle?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  invalidText?: string;
  dirty?: boolean;
  onApply?: () => void;
}) {
  const resolvedPointTitle = pointTitle ?? (pointMode === 'joint' ? '关节参数' : pointMode === 'weldSegment' ? '结果点位' : '点位信息');
  return (
    <div className="rounded-xl bg-slate-50/80 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{title}</span>
      </div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">{selectionLabel}</div>
          {invalid && (
            <div className="flex items-center gap-1 text-[11px] text-red-500">
              <CircleAlert className="size-3.5" />
              {invalidText}
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={disabled}>
          {actionLabel}
        </Button>
      </div>
      <ObjectMultiSelectDemo
        values={options}
        selectedValues={selectedValues}
        disabled={disabled}
        invalid={invalid}
        placeholder={selectionPlaceholder}
        onToggle={onToggle}
      />
      {pointMode === 'joint' && showPlaceSupportParameters && (
        <div className="mt-ds-150 ds-task-parameter-detail-top ds-parameter-group-stack px-ds-150">
          <div className="grid gap-ds-150 md:grid-cols-2">
            <div className="ds-label-input-compact">
              <div className="ds-label-input-compact-label">工作台</div>
              <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
                <span className="truncate">{placeWorkbenchType ?? '--'}</span>
              </div>
            </div>
            <MultiSelectDemo
              label="支撑编号"
              values={placeWorkbenchType === '主筋板背面装配平台' ? ['1', '2', '3', '4', '5'] : ['1', '2']}
              selectedValues={placeSupportIds}
              disabled={disabled}
              compact
              onToggle={(item) => onPlaceSupportToggle?.(item)}
            />
          </div>
          {placeSupportIds.length === 0 && !disabled ? (
            <div className="ds-label-input-compact">
              <div className="ds-label-input-compact-label">支撑覆盖率</div>
              <div className="flex h-8 items-center justify-between rounded-lg bg-red-50 px-2.5 text-xs text-red-600 ring-1 ring-red-100">
                <span className="font-semibold">--</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-600">待选择</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-ds-150 sm:grid-cols-2">
              {placeSupportIds.map((supportId) => (
                <div key={supportId} className="ds-label-input-compact">
                  <div className="ds-label-input-compact-label">编号{supportId}覆盖率</div>
                  <div className="flex h-8 items-center justify-between rounded-lg bg-white px-2.5 text-xs text-slate-700 ring-1 ring-slate-100">
                      <span className="font-semibold">{placeCoverageById?.[supportId] ?? '76.0%'}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">已计算</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {pointMode === 'joint' && showClampParameters && (
        <div className="mt-ds-150 ds-task-parameter-detail-top ds-parameter-group-stack px-ds-150">
          <div className="grid gap-ds-150 md:grid-cols-2">
            <div className="ds-label-input-compact">
              <div className="ds-label-input-compact-label">工作台</div>
              <div className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100">
                <span className="truncate">{clampWorkbenchType ?? '--'}</span>
              </div>
            </div>
            <MultiSelectDemo
              label="压紧编号"
              values={['1', '2']}
              selectedValues={processClampIds}
              disabled={disabled}
              compact
              onToggle={(item) => onProcessClampToggle?.(item)}
            />
          </div>
          <div className="grid gap-ds-150 sm:grid-cols-2">
            {['1', '2'].map((clampId) => {
              const selected = processClampIds.includes(clampId);
              return (
                <div key={clampId} className="ds-label-input-compact">
                  <div className="ds-label-input-compact-label">编号{clampId}覆盖率</div>
                  <div className={`flex h-8 items-center justify-between rounded-lg px-2.5 text-xs ring-1 ${
                    !selected && !disabled ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-white text-slate-700 ring-slate-100'
                  }`}>
                    <span className="font-semibold">{clampCoverageById?.[clampId] ?? '72.0%'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                      !selected && !disabled ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {selected ? '已计算' : '未选中'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ProcessResultPointPanel
        title={resolvedPointTitle}
        subtitle={pointSubtitle}
        dirty={dirty}
        onApplyUpdate={onApply}
        className="mt-ds-150"
        headerClassName={showPlaceSupportParameters ? 'px-ds-150' : ''}
        showUpdateButton={!showPlaceSupportParameters && !showClampParameters}
      >
        {pointMode === 'joint' ? (
          <div className="grid gap-2">
            {(joints ?? []).map((value, index) => (
              <JointAngleRowDemo
                key={index}
                index={index}
                value={value}
                disabled={disabled}
                selected={selectedResultPointIndex === index}
                selectedVariant={selectedVariant}
                onSelect={() => onResultPointSelect?.(index)}
                onChange={(nextValue) => onJointChange?.(index, nextValue)}
              />
            ))}
          </div>
        ) : pointMode === 'weldSegment' ? (
          <WeldSegmentPosePointGroupsDemo
            points={posePoints ?? []}
            disabled={disabled}
            selectedSegmentIndex={selectedWeldSegmentIndex}
            onSegmentSelect={onWeldSegmentSelect}
            selectedPointIndex={selectedResultPointIndex}
            selectedVariant={selectedVariant}
            onPointSelect={onResultPointSelect}
            onAxisChange={(pointIndex, axis, value) => onPointAxisChange(pointIndex, axis, value)}
          />
        ) : pointMode === 'pose' ? (
          <div className="space-y-2">
            {(posePoints ?? []).slice(0, points.length).map((point, index) => (
              <PosePointInfoRowDemo
                key={index}
                label={`点位 ${index + 1}`}
                point={point}
                disabled={disabled}
                selected={selectedResultPointIndex === index}
                selectedVariant={selectedVariant}
                onSelect={() => onResultPointSelect?.(index)}
                onAxisChange={(axis, value) => onPointAxisChange(index, axis, value)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {points.map((point, index) => (
              <PointInfoRowDemo
                key={index}
                index={index}
                point={point}
                disabled={disabled}
                selected={selectedResultPointIndex === index}
                selectedVariant={selectedVariant}
                onSelect={() => onResultPointSelect?.(index)}
                onAxisChange={(axis, value) => onPointAxisChange(index, axis, value)}
              />
            ))}
          </div>
        )}
      </ProcessResultPointPanel>
      {showPathPointEntry && (
        <ProcessResultPointPanel
          title="路径点位"
          subtitle={pathSubtitle}
          dirty={dirty}
          surfaceClassName="bg-slate-50/80"
          className="mt-ds-150"
          action={
            <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" disabled={disabled}>
              <Move3D className="size-3" />
              查看路径点位
            </Button>
          }
        />
      )}
    </div>
  );
}


function DemoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
      <div className="mb-4 text-sm font-medium text-slate-800">{title}</div>
      {children}
    </section>
  );
}

function MainNavigationMenuDemo() {
  const [planningOpen, setPlanningOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSimulationTask, setSelectedSimulationTask] = useState<6 | 12>(6);
  const simulationTasks = [
    { id: 'planning', title: '0162 · 06装配 · 副本1', subtitle: '工艺规划 · 0162' },
    { id: 'local', title: '0162-01-010101-装配任务 · 副本1', subtitle: '本地导入 · 0162-01-010101-装配任务.rt' },
  ];

  return (
    <div className="max-w-[460px]">
      <div className="relative rounded-lg bg-zinc-950 px-3 py-2 shadow-ds-main-nav-immersive">
        <div className="flex h-9 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md px-2 text-[15px] font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-expanded={planningOpen}
            onClick={() => {
              setPlanningOpen((current) => !current);
              setOpen(false);
            }}
          >
            工艺规划
            <ChevronDown className={`ml-1.5 size-3.5 transition-transform duration-200 ease-ds-standard ${planningOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            className="group inline-flex h-9 items-center rounded-lg border border-white/10 bg-white px-3 text-[15px] font-semibold text-zinc-950 shadow-[0_1px_2px_rgba(255,255,255,0.12)]"
            aria-expanded={open}
            onClick={() => {
              setOpen((current) => !current);
              setPlanningOpen(false);
            }}
          >
            虚拟仿真
            <span className={`ml-2 flex w-3.5 items-center justify-end transition-transform duration-200 ease-ds-standard ${open ? 'rotate-180' : ''}`}>
              <ChevronDown className="size-3.5" />
            </span>
          </button>
          <span className="text-[15px] font-medium text-zinc-300">生产执行</span>
        </div>
        {planningOpen && (
          <div className="absolute left-3 top-[calc(100%+8px)] z-20 w-64 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 py-1.5 shadow-xl shadow-black/25 backdrop-blur-md">
            <button type="button" className="flex h-9 w-full items-center px-3 text-left text-[14px] font-normal leading-5 text-white transition-colors hover:bg-white/8">
              0162-01-010101
            </button>
          </div>
        )}
        {open && (
          <div className="absolute left-[82px] top-[calc(100%+8px)] z-20 w-80 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 py-1.5 shadow-xl shadow-black/25 backdrop-blur-md">
            {simulationTasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left transition-colors ${index === 0 ? 'bg-white/12 text-white' : 'text-zinc-300 hover:bg-white/8 hover:text-white'}`}
              >
                <button type="button" className="flex min-w-0 flex-1 flex-col items-start text-left">
                  <span className="w-full truncate text-[14px] font-normal leading-5">{task.title}</span>
                  <span className="mt-0.5 w-full truncate text-[11px] font-normal leading-4 text-zinc-400">{task.subtitle}</span>
                </button>
                <button
                  type="button"
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={`关闭${task.title}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="mx-2 my-1 border-t border-white/10" />
            <button type="button" className="flex h-9 w-full items-center gap-2 px-3 text-left text-xs text-zinc-300 transition-colors hover:bg-white/8 hover:text-white">
              <Plus className="size-3.5" />
              新建仿真任务
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-400">
        有仿真任务时，单击导航先展开菜单；选择具体任务后才进入对应工作区。工艺规划与虚拟仿真任务标题统一为 14px / 400，副标题为 11px / 400，并使用“来源 · 名称”。
      </p>
      <div className="mt-4 w-[320px] overflow-hidden rounded-lg border border-zinc-200 bg-ds-bg-process-planning-panel shadow-sm">
        <div className="flex h-9 items-center justify-between border-b border-zinc-200/75 px-3">
          <span className="text-xs font-medium text-ds-text-control">本地导入 / 多装配任务</span>
          <span className="text-[10px] text-ds-text-control-muted">2 个任务</span>
        </div>
        <div className="space-y-2 p-2.5">
          {[
            { sequence: 6 as const, object: '0162-01-010101-02 + 0162-01-010101-01', side: '正面', weldTaskNames: ['焊接任务1', '焊接任务2'] },
            { sequence: 12 as const, object: '0162-01-010101-03 + 0162-01-010101-(02+01)', side: '反面', weldTaskNames: ['焊接任务'] },
          ].map((task) => {
            const selected = selectedSimulationTask === task.sequence;
            return (
              <div
                key={task.sequence}
                className={`overflow-hidden rounded-lg border shadow-sm transition-colors ${selected ? 'border-orange-200 bg-orange-50/75 ring-1 ring-inset ring-orange-100' : 'border-zinc-200 bg-white/82'}`}
              >
                <div className="grid min-h-11 grid-cols-[18px_minmax(0,1fr)_auto_auto] items-center gap-1.5 px-2.5">
                  <ChevronDown className={`size-3.5 text-zinc-400 ${selected ? '' : '-rotate-90'}`} />
                  <button type="button" className="min-w-0 py-1.5 text-left" onClick={() => setSelectedSimulationTask(task.sequence)}>
                    <div className={`truncate text-xs font-medium ${selected ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`}>第{String(task.sequence).padStart(2, '0')}道 · 装配任务</div>
                    <div className="mt-0.5 truncate text-[9px] text-zinc-400">{task.object}</div>
                  </button>
                  <span className={`text-[9px] ${selected ? 'text-orange-600' : 'text-zinc-400'}`}>{task.side}</span>
                  <Trash2 className="size-3.5 text-zinc-400" />
                </div>
                {selected && (
                  <div className="space-y-1 border-t border-orange-100/80 px-2 py-1.5 pl-5">
                    {task.weldTaskNames.map((weldTaskName) => (
                      <div key={weldTaskName}>
                        <div className="grid h-7 grid-cols-[16px_16px_minmax(0,1fr)] items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-ds-text-control">
                          <ChevronDown className="size-3 text-zinc-400" />
                          <Flame className="size-3.5 text-orange-500" />
                          <span>{weldTaskName}</span>
                        </div>
                        <div className="space-y-0.5 pl-5">
                          {[1, 2, 3].map((segment) => (
                            <div key={segment} className="grid h-7 grid-cols-[16px_minmax(0,1fr)] items-center gap-1.5 rounded-md px-2 text-[11px] text-ds-text-control">
                              <span className="text-center text-[10px] text-zinc-400">•</span>
                              <span>焊缝段{segment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        本地文件副本可包含多条装配任务；当前项使用浅橙底与品牌描边，未选项收起内部焊接任务。删除入口移除整条装配任务及其内部数据。
      </p>
    </div>
  );
}

type ComponentLabSimulationAssignments = Record<string, Record<string, SimulationRobotId>>;

const componentLabSupportAxisBase = ['12.50', '-30.00', '18.00', '0.00', '12.00', '-8.00', '5.00', '0.00'];
const componentLabClampAxisBase = ['120.00', '-18.00', '36.00', '0.00', '0.00', '0.00'];

function createComponentLabAxisValues(values: string[]) {
  return values.map((value, index) => ({
    axis: `J${index + 1}` as `J${number}`,
    value,
    unit: index === 0 ? 'mm' as const : '°' as const,
  }));
}

function createComponentLabWeldTask({
  taskId,
  index,
  name,
  supportValues,
  clampValues,
}: {
  taskId: string;
  index: number;
  name: string;
  supportValues: string[];
  clampValues: string[];
}): SimulationWeldTask {
  const sourceStepKey = `${taskId}-weld-task-${index}`;
  return {
    id: sourceStepKey,
    index,
    name,
    sourceStepKey,
    weldFeatureNames: [`Demo 焊缝 ${index}`],
    weldFeatureUrls: [],
    supportAxisValues: createComponentLabAxisValues(supportValues),
    clampAxisValues: createComponentLabAxisValues(clampValues),
    weldSegments: Array.from({ length: 6 }, (_, segmentOffset) => {
      const segmentIndex = segmentOffset + 1;
      const baseX = index * 100 + segmentIndex * 18;
      const firstPoint = {
        x: baseX.toFixed(3),
        y: (segmentIndex * 12).toFixed(3),
        z: '36.000',
        rx: '0.000',
        ry: '0.000',
        rz: '0.000',
      };
      const secondPoint = {
        ...firstPoint,
        x: (baseX + 12).toFixed(3),
      };
      return {
        id: `${sourceStepKey}-segment-${segmentIndex}`,
        index: segmentIndex,
        name: `焊缝段${segmentIndex}`,
        featureName: `Demo 焊缝 ${index} · 焊缝段${segmentIndex}`,
        scanPosePoints: [
          { ...firstPoint, z: '116.000' },
          { ...secondPoint, z: '116.000' },
        ],
        weldPosePoints: [firstPoint, secondPoint],
        defaultRobot: segmentIndex <= 3 ? 'robot1' : 'robot2',
      };
    }),
  };
}

function createComponentLabSimulationTask(
  processSequence: 6 | 12,
  side: 'front' | 'back',
  weldTasks: SimulationWeldTask[],
): SimulationSourceTask {
  const taskId = `component-lab-simulation-${processSequence}`;
  const primaryWeldTask = weldTasks[0];
  return {
    id: taskId,
    displayName: `0162 · ${String(processSequence).padStart(2, '0')}装配`,
    name: '装配',
    sourceKind: 'local-file',
    sourceLabel: `本地文件 / 0162-01-010101-装配任务.rt / 第${String(processSequence).padStart(2, '0')}道装配`,
    sourceIdentity: 'component-lab-local-file',
    sourceFileName: '0162-01-010101-装配任务.rt',
    createdAt: '2026-08-07T00:00:00.000Z',
    copyIndex: 1,
    sourceStepId: `${taskId}-source-step`,
    sourceStepKey: `${taskId}-source-step`,
    clampStepId: `${taskId}-clamp-step`,
    scanStepId: `${taskId}-weld-step`,
    processId: `${taskId}-process`,
    processSequence,
    processName: '装配',
    assemblyId: '0162-01-010101',
    station: side === 'front' ? '主筋板装配工位1' : '主筋板装配工位2',
    side,
    targetLabel: processSequence === 6
      ? '0162-01-010101-02 + 0162-01-010101-01'
      : '0162-01-010101-03 + 0162-01-010101-(02+01)',
    weldFeatureNames: [...primaryWeldTask.weldFeatureNames],
    weldFeatureUrls: [],
    modelParts: [],
    supportAxisValues: primaryWeldTask.supportAxisValues,
    clampAxisValues: primaryWeldTask.clampAxisValues,
    weldSegments: primaryWeldTask.weldSegments,
    weldTasks,
  };
}

const componentLabTask06Id = 'component-lab-simulation-6';
const componentLabTask12Id = 'component-lab-simulation-12';
const componentLabTask06 = createComponentLabSimulationTask(6, 'front', [
  createComponentLabWeldTask({
    taskId: componentLabTask06Id,
    index: 1,
    name: '焊接任务1',
    supportValues: componentLabSupportAxisBase,
    clampValues: componentLabClampAxisBase,
  }),
  createComponentLabWeldTask({
    taskId: componentLabTask06Id,
    index: 2,
    name: '焊接任务2',
    supportValues: ['30.50', '-26.00', '12.00', '8.00', '7.00', '-1.00', '8.00', '-4.00'],
    clampValues: ['132.00', '-12.00', '31.00', '8.00', '-6.00', '9.00'],
  }),
]);
const componentLabTask12 = createComponentLabSimulationTask(12, 'back', [
  createComponentLabWeldTask({
    taskId: componentLabTask12Id,
    index: 1,
    name: '焊接任务',
    supportValues: componentLabSupportAxisBase,
    clampValues: componentLabClampAxisBase,
  }),
]);

function createComponentLabPrograms(task: SimulationSourceTask) {
  return task.weldTasks.map((weldTask) => generateRobotProgram(
    task,
    weldTask,
    getDefaultRobotAssignments(weldTask),
  ));
}

function getComponentLabExpandedProgramIds(programs: SimulationRobotProgram[]) {
  return new Set(programs.flatMap((program) => [
    program.root.id,
    ...(program.root.children ?? []).map((node) => node.id),
  ]));
}

function VirtualSimulationMultiWeldDemo() {
  const [tasks, setTasks] = useState<SimulationSourceTask[]>([componentLabTask06, componentLabTask12]);
  const [selectedTaskId, setSelectedTaskId] = useState(componentLabTask06.id);
  const [selectedWeldNodeId, setSelectedWeldNodeId] = useState<string | null>(null);
  const [selectedInstructionId, setSelectedInstructionId] = useState<string | null>(null);
  const [programsByTaskId, setProgramsByTaskId] = useState<Record<string, SimulationRobotProgram[]>>(() => ({
    [componentLabTask06.id]: createComponentLabPrograms(componentLabTask06),
    [componentLabTask12.id]: createComponentLabPrograms(componentLabTask12),
  }));
  const initialPrograms = programsByTaskId[componentLabTask06.id] ?? [];
  const [selectedProgramNodeId, setSelectedProgramNodeId] = useState(initialPrograms[0]?.root.id ?? null);
  const [expandedProgramNodeIds, setExpandedProgramNodeIds] = useState<Set<string>>(() => getComponentLabExpandedProgramIds(initialPrograms));
  const [detailTab, setDetailTab] = useState<SimulationDetailTab>('params');
  const [programGenerateDialogOpen, setProgramGenerateDialogOpen] = useState(false);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const programs = selectedTask ? programsByTaskId[selectedTask.id] ?? [] : [];
  const selectedProgram = programs.find((program) => Boolean(findProgramNode(program.root, selectedProgramNodeId)))
    ?? programs[0]
    ?? null;
  const selectedProgramNode: SimulationProgramNode | null = selectedProgram
    ? findProgramNode(selectedProgram.root, selectedProgramNodeId) ?? selectedProgram.root
    : null;
  const assignments = useMemo<ComponentLabSimulationAssignments>(() => (
    selectedTask
      ? Object.fromEntries(selectedTask.weldTasks.map((weldTask) => [
          weldTask.id,
          programs.find((program) => program.weldTaskId === weldTask.id)?.robotAssignments
            ?? getDefaultRobotAssignments(weldTask),
        ]))
      : {}
  ), [programs, selectedTask]);

  const selectTask = (taskId: string) => {
    const nextPrograms = programsByTaskId[taskId] ?? [];
    setSelectedTaskId(taskId);
    setSelectedWeldNodeId(null);
    setSelectedInstructionId(null);
    setSelectedProgramNodeId(nextPrograms[0]?.root.id ?? null);
    setExpandedProgramNodeIds(getComponentLabExpandedProgramIds(nextPrograms));
    setDetailTab('params');
  };

  const deleteTask = (taskId: string) => {
    const nextTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(nextTasks);
    if (taskId === selectedTaskId) {
      const nextTask = nextTasks[0] ?? null;
      setSelectedTaskId(nextTask?.id ?? '');
      setSelectedInstructionId(null);
      const nextPrograms = nextTask ? programsByTaskId[nextTask.id] ?? [] : [];
      setSelectedProgramNodeId(nextPrograms[0]?.root.id ?? null);
      setExpandedProgramNodeIds(getComponentLabExpandedProgramIds(nextPrograms));
    }
  };

  const updateSelectedProgram = (updater: (program: SimulationRobotProgram) => SimulationRobotProgram) => {
    if (!selectedTask || !selectedProgram) return;
    setProgramsByTaskId((current) => ({
      ...current,
      [selectedTask.id]: (current[selectedTask.id] ?? []).map((program) => (
        program.id === selectedProgram.id ? updater(program) : program
      )),
    }));
  };

  const generatePrograms = (nextAssignments: ComponentLabSimulationAssignments) => {
    if (!selectedTask) return;
    const currentPrograms = programsByTaskId[selectedTask.id] ?? [];
    const nextPrograms = selectedTask.weldTasks.map((weldTask) => {
      const currentProgram = currentPrograms.find((program) => program.weldTaskId === weldTask.id);
      return generateRobotProgram(
        selectedTask,
        weldTask,
        nextAssignments[weldTask.id],
        currentProgram?.version ?? 0,
      );
    });
    setProgramsByTaskId((current) => ({ ...current, [selectedTask.id]: nextPrograms }));
    setSelectedProgramNodeId(nextPrograms[0]?.root.id ?? null);
    setSelectedInstructionId(null);
    setExpandedProgramNodeIds(getComponentLabExpandedProgramIds(nextPrograms));
    setProgramGenerateDialogOpen(false);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-5 text-slate-400">
          默认展示第 06 道两组焊接任务及加工程序1 / 2；程序2的支撑 J1 为 30.50，压紧 J1 为 132.00。
        </p>
        <Button size="sm" className="h-8 px-3 text-xs" disabled={!selectedTask} onClick={() => setProgramGenerateDialogOpen(true)}>
          <Sparkles className="size-3.5" />
          打开程序生成
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-ds-bg-process-planning-panel">
        <div className="grid h-[660px] w-[740px] grid-cols-[320px_420px]">
          <SimulationTaskPanel
            tasks={tasks}
            selectedTaskId={selectedTask?.id ?? null}
            selectedWeldNodeId={selectedWeldNodeId}
            associatedWeldSegmentIds={[]}
            onSelectTask={selectTask}
            onSelectWeldTask={setSelectedWeldNodeId}
            onSelectWeldSegment={setSelectedWeldNodeId}
            onDeleteTask={deleteTask}
            onImport={() => undefined}
          />
          <SimulationProgramPanel
            task={selectedTask}
            programs={programs}
            selectedProgram={selectedProgram}
            selectedNode={selectedProgramNode}
            selectedNodeId={selectedProgramNodeId}
            selectedInstructionId={selectedInstructionId}
            expandedNodeIds={expandedProgramNodeIds}
            detailTab={detailTab}
            detailOnly={false}
            onToggleNode={(nodeId) => setExpandedProgramNodeIds((current) => {
              const next = new Set(current);
              if (next.has(nodeId)) next.delete(nodeId);
              else next.add(nodeId);
              return next;
            })}
            onSelectNode={(nodeId) => {
              setSelectedProgramNodeId(nodeId);
              setSelectedWeldNodeId(null);
              setSelectedInstructionId(null);
              setDetailTab('params');
            }}
            onSelectInstruction={setSelectedInstructionId}
            onDetailTabChange={setDetailTab}
            onAxisValueChange={(axisGroup, axisName, value) => updateSelectedProgram((program) => ({
              ...program,
              [axisGroup === 'support' ? 'supportAxisValues' : 'clampAxisValues']:
                program[axisGroup === 'support' ? 'supportAxisValues' : 'clampAxisValues'].map((axis) => (
                  axis.axis === axisName ? { ...axis, value } : axis
                )),
            }))}
            onResetProgramParams={() => {
              if (!selectedTask || !selectedProgram) return;
              const weldTask = selectedTask.weldTasks.find((item) => item.id === selectedProgram.weldTaskId);
              if (!weldTask) return;
              updateSelectedProgram(() => generateRobotProgram(
                selectedTask,
                weldTask,
                selectedProgram.robotAssignments,
                selectedProgram.version,
              ));
            }}
            onGenerate={() => setProgramGenerateDialogOpen(true)}
          />
        </div>
      </div>
      {programGenerateDialogOpen && selectedTask && (
        <SimulationProgramGenerateDialog
          task={selectedTask}
          assignments={assignments}
          hasExistingProgram={programs.length > 0}
          onClose={() => setProgramGenerateDialogOpen(false)}
          onConfirm={generatePrograms}
        />
      )}
    </div>
  );
}

type ProcessPlanningToolbarDemoState = 'saved' | 'dirty' | 'missing-weld';

const processPlanningToolbarDemoStates: {
  id: ProcessPlanningToolbarDemoState;
  label: string;
  description: string;
  token: string;
}[] = [
  {
    id: 'saved',
    label: '无修改',
    description: '保存入口使用弱化的禁用态视觉',
    token: 'text-ds-text-control-disabled · #A1A1AA',
  },
  {
    id: 'dirty',
    label: '有未保存修改',
    description: '保存入口使用品牌橙，icon 与文字同步',
    token: 'text-ds-brand-primary · #FF6900',
  },
  {
    id: 'missing-weld',
    label: '未提取焊缝特征',
    description: '打磨特征、装配特征为真正 disabled，焊缝入口保持可用',
    token: 'text-ds-text-control-disabled · #A1A1AA',
  },
];

function ProcessPlanningToolbarStatesDemo() {
  const featureActions = [
    { id: 'weld', label: '焊缝特征', icon: WeldFeatureIcon, hasMenu: true },
    { id: 'grind', label: '打磨特征', icon: GrindFeatureIcon, hasMenu: true },
    { id: 'assembly', label: '装配特征', icon: AssemblyFeatureIcon, hasMenu: false },
  ] as const;

  return (
    <div className="space-y-3">
      {processPlanningToolbarDemoStates.map((demoState) => {
        const missingWeld = demoState.id === 'missing-weld';
        const saveDisabled = demoState.id !== 'dirty';
        const saveClassName = saveDisabled
          ? 'cursor-not-allowed text-ds-text-control-disabled'
          : 'text-ds-brand-primary hover:bg-white/80 hover:text-ds-brand-primary';
        return (
          <div key={demoState.id} className="overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50/60">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-800">{demoState.label}</span>
                <span className="text-[11px] text-zinc-500">{demoState.description}</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">{demoState.token}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-border-process-planning-structure bg-ds-bg-process-planning-toolbar px-3 backdrop-blur-sm">
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                  >
                    <Move3D className="size-6" />
                    <span>坐标转换</span>
                  </button>
                  <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                  {featureActions.map((item) => {
                    const Icon = item.icon;
                    const itemDisabled = missingWeld && (item.id === 'grind' || item.id === 'assembly');
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={itemDisabled}
                        className={`group flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action transition-colors ${
                          itemDisabled
                            ? 'cursor-not-allowed text-ds-text-control-disabled'
                            : 'text-ds-text-control hover:bg-white/80 hover:text-ds-text-control-strong'
                        }`}
                      >
                        <Icon className="size-6" />
                        <span className="relative block w-16 text-center">
                          <span className={`block transition-transform duration-150 ${item.hasMenu ? 'group-hover:-translate-x-2' : ''}`}>
                            {item.label}
                          </span>
                          {item.hasMenu && <ChevronDown className="absolute right-0 top-1/2 size-3 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />}
                        </span>
                      </button>
                    );
                  })}
                  <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                  <button
                    type="button"
                    className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                  >
                    <SlidersHorizontal className="size-6" />
                    <span>一键生成</span>
                  </button>
                  <button
                    type="button"
                    className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                  >
                    <Plus className="size-6" />
                    <span>新增任务</span>
                  </button>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="flex h-16 min-w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                  >
                    <Cog className="size-6" />
                    <span>工艺参数设置</span>
                  </button>
                  <div className="h-9 w-px shrink-0 bg-ds-bg-process-planning-separator" />
                  <button
                    type="button"
                    disabled={saveDisabled}
                    className={`flex h-16 min-w-[70px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action transition-colors ${saveClassName}`}
                    title={saveDisabled ? '当前无未保存修改' : '当前有未保存修改'}
                  >
                    <Save className="size-6 text-current" />
                    <span>保存</span>
                  </button>
                  <button
                    type="button"
                    className="flex h-16 min-w-[70px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 ds-process-toolbar-action text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
                  >
                    <Download className="size-6" />
                    <span>导出</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type TrayHeaderUsage = 'agv' | 'overview';

const trayHeaderUsageMeta: Record<TrayHeaderUsage, { title: string; usage: string; metrics: string }> = {
  agv: {
    title: 'AGV 任务调度',
    usage: '普通 section header：标题 + 右侧操作',
    metrics: 'h-10 / 40px · px-4 / 16px · 操作 gap-1.5 / 6px',
  },
  overview: {
    title: '理料区视图',
    usage: '完整屏幕入口：区位显示现场状态，卡片显示配盘明细',
    metrics: 'Header h-16 / 64px · 页面级返回入口',
  },
};

function TrayHeaderUsagePreview({ usage }: { usage: TrayHeaderUsage }) {
  const isAgv = usage === 'agv';

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200/70 bg-white shadow-sm">
      <div className={`flex items-center justify-between gap-4 px-4 ${isAgv ? 'h-10 border-b border-white/60' : 'h-16 border-b border-zinc-200/70'}`}>
        {isAgv ? (
          <>
            <div className="text-[11px] font-semibold leading-4 text-zinc-800">AGV 任务调度</div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className="flex items-center gap-1 text-slate-500"><History className="size-3" />历史任务</span>
              <Button size="sm" className="h-7 gap-1 px-2.5 text-[11px]"><Plus className="size-3" />新建任务</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <div>
                <div className="text-[11px] font-semibold leading-4 text-zinc-800">理料区视图</div>
                <div className="text-[9px] text-slate-400">现场托盘位置与计划摆盘回显</div>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-ds-brand-primary-text"><MonitorUp className="size-3" />独立屏幕入口</span>
          </>
        )}
      </div>
    </div>
  );
}

export function ComponentDraftOriginalDemos() {
  const [pointRow, setPointRow] = useState({ x: '120.0', y: '80.0', z: '15.0' });
  const [pointRowWithRPY, setPointRowWithRPY] = useState({
    x: '120.0',
    y: '80.0',
    z: '15.0',
    rx: '0.0',
    ry: '85.0',
    rz: '0.0',
  });
  const [pickPathPoints, setPickPathPoints] = useState(createDefaultPickPathPointDemoValues());
  const [pickGripperType, setPickGripperType] = useState<PickGripperType>('gantry');
  const [pickMagnets, setPickMagnets] = useState<Record<PickMagnetKey, { enabled: boolean; z: string }>>({
    left: { enabled: true, z: '120.0' },
    center: { enabled: true, z: '--' },
    right: { enabled: false, z: '118.0' },
  });
  const processPoints = [
    { x: '120.0', y: '80.0', z: '15.0' },
    { x: '240.0', y: '95.0', z: '15.0' },
  ];
  const processPosePoints = createDefaultPickPathPointDemoValues();
  const [axisRow, setAxisRow] = useState({ y: '120.0', z: '80.0' });
  const [processJoints, setProcessJoints] = useState(['80.0', '12.0', '-8.0', '24.0', '0.0', '16.0', '-6.0', '30.0']);
  const disabled = false;
  const invalid = false;

  return (
    <div className="space-y-6">
      <DemoCard title="旧强调态点位信息单行组件（原 Component Lab 迁出）">
        <div className="w-[396px] max-w-full">
          <div className="mb-2 text-xs font-medium text-slate-500">绝对值变体（xyz）</div>
          <div className="space-y-2">
            <PointInfoRowDemo
              index={0}
              point={pointRow}
              disabled={disabled}
              selected
              onSelect={() => undefined}
              onAxisChange={(axis, value) => setPointRow((prev) => ({ ...prev, [axis]: value }))}
            />
            <PointInfoRowDemo
              index={1}
              point={{ x: '240.0', y: '95.0', z: '15.0' }}
              disabled={disabled}
              selected={false}
              onSelect={() => undefined}
              onAxisChange={() => {}}
            />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-2 text-xs font-medium text-slate-500">相对值变体（Δxyz）</div>
            <div className="space-y-2">
              <DeltaPointInfoRowDemo
                index={0}
                point={pointRow}
                disabled={disabled}
                selected
                onSelect={() => undefined}
                onAxisChange={(axis, value) => setPointRow((prev) => ({ ...prev, [axis]: value }))}
              />
              <DeltaPointInfoRowDemo
                index={1}
                point={{ x: '12.5', y: '-3.0', z: '8.0' }}
                disabled={disabled}
                selected={false}
                onSelect={() => undefined}
                onAxisChange={() => {}}
              />
            </div>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="旧强调态点位信息带 RPY 组件（原 Component Lab 迁出）">
        <div className="w-[396px] max-w-full">
          <div className="mb-2 text-xs font-medium text-slate-500">绝对值变体（xyz + rpy）</div>
          <div className="space-y-2">
            <PointInfoRowWithRPYDemo
              index={0}
              point={pointRowWithRPY}
              disabled={disabled}
              selected
              onSelect={() => undefined}
              onAxisChange={(axis, value) => setPointRowWithRPY((prev) => ({ ...prev, [axis]: value }))}
            />
            <PointInfoRowWithRPYDemo
              index={1}
              point={{ x: '210.0', y: '88.0', z: '12.0', rx: '0.0', ry: '88.0', rz: '0.0' }}
              disabled={disabled}
              selected={false}
              onSelect={() => undefined}
              onAxisChange={() => {}}
              defaultCollapsed
            />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-2 text-xs font-medium text-slate-500">相对值变体（Δxyz + rpy）</div>
            <div className="space-y-2">
              <DeltaPointInfoRowWithRPYDemo
                index={0}
                point={pointRowWithRPY}
                disabled={disabled}
                selected
                onSelect={() => undefined}
                onAxisChange={(axis, value) => setPointRowWithRPY((prev) => ({ ...prev, [axis]: value }))}
              />
              <DeltaPointInfoRowWithRPYDemo
                index={1}
                point={{ x: '21.0', y: '3.0', z: '6.0', rx: '0.0', ry: '88.0', rz: '0.0' }}
                disabled={disabled}
                selected={false}
                onSelect={() => undefined}
                onAxisChange={() => {}}
                defaultCollapsed
              />
            </div>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="旧强调态安全点卡片（原 Component Lab 迁出）">
        <div className="w-[344px] max-w-full">
          <PickPathPointCardDemo
            index={0}
            point={pickPathPoints[0]}
            disabled={disabled}
            selected
            onSelect={() => undefined}
            onToggleEnabled={(enabled) =>
              setPickPathPoints((prev) => prev.map((point, index) => (index === 0 ? { ...point, enabled } : point)))
            }
            onAxisChange={(axis, value) =>
              setPickPathPoints((prev) => prev.map((point, index) => (index === 0 ? { ...point, [axis]: value } : point)))
            }
          />
        </div>
      </DemoCard>

      <DemoCard title="旧强调态轴向单位输入行（原 Component Lab 迁出）">
        <div className="w-[396px] max-w-full">
          <AxisUnitInputRowDemo
            label="电磁铁位置"
            values={axisRow}
            axes={['y', 'z']}
            unit="mm"
            disabled={disabled}
            selected
            onSelect={() => undefined}
            onAxisChange={(axis, value) => setAxisRow((prev) => ({ ...prev, [axis]: value }))}
          />
        </div>
      </DemoCard>

      <DemoCard title="旧强调态翻面压紧关节角组件（原 Component Lab 迁出）">
        <div className="w-[396px] max-w-full rounded-xl bg-slate-50/80 p-ds-150">
          <div className="grid gap-2">
            {processJoints.map((value, index) => (
              <JointAngleRowDemo
                key={index}
                index={index}
                value={value}
                disabled={disabled}
                selected={index === 0}
                onSelect={() => undefined}
                onChange={(nextValue) => setProcessJoints((prev) => prev.map((item, itemIndex) => (itemIndex === index ? nextValue : item)))}
              />
            ))}
          </div>
        </div>
      </DemoCard>

      <DemoCard title="抓取参数旧三列磁铁卡片（原 Component Lab 迁出）">
        <PickParameterValidationDemo
          gripperType={pickGripperType}
          magnets={pickMagnets}
          disabled={disabled}
          invalid={invalid}
          onGripperTypeChange={setPickGripperType}
          onMagnetEnabledChange={(key, enabled) =>
            setPickMagnets((prev) => ({
              ...prev,
              [key]: { ...prev[key], enabled },
            }))
          }
          onMagnetZChange={(key, value) =>
            setPickMagnets((prev) => ({
              ...prev,
              [key]: { ...prev[key], z: value },
            }))
          }
        />
        <div className="mt-4 w-[300px] overflow-hidden rounded-lg border border-white/60 bg-white/75 shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Cog className="size-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-800">左磁铁参数设置</span>
            </div>
            <X className="size-3.5 text-slate-400" />
          </div>
          <div className="space-y-3 p-3">
            <div className="ds-parameter-card-inset-sm rounded-lg border border-slate-200/80 bg-white/70">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['磁铁尺寸 - 长', '180', 'mm'],
                  ['磁铁尺寸 - 宽', '120', 'mm'],
                  ['额定负载', '100', 'kg'],
                  ['升降行程', '200', 'mm'],
                ].map(([label, value, unit]) => (
                  <div key={label} className="ds-parameter-field">
                    <div className="text-[10px] text-slate-400">{label}</div>
                    <UnitNumberInputDemo value={value} unit={unit} disabled={disabled} size="sm" align="right" onChange={() => {}} />
                  </div>
                ))}
              </div>
              <div className="mt-ds-150 ds-parameter-field">
                <div className="text-[10px] text-slate-400">磁力档位配置</div>
                <ForceLevelSelectDemo value="大" disabled={disabled} size="sm" onChange={() => {}} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-3 py-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">重置</Button>
            <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover">确认</Button>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="样式 A/B 工艺任务大卡片（原 ObjectProcessPanelDemo 迁出）">
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            {
              title: '抓取任务面板',
              selectionLabel: '工件模型选择',
              selectionPlaceholder: '请选择工件模型',
              actionLabel: '生成抓取位置',
              options: ['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03'],
              selectedValues: ['0162-01-010101-01', '0162-01-010101-02'],
              pointMode: 'pose' as const,
              pointTitle: '结果点位',
              pointSubtitle: 'XYZ/RPY',
              showPathPointEntry: true,
            },
            {
              title: '打磨任务面板',
              selectionLabel: '打磨特征选择',
              selectionPlaceholder: '请选择打磨特征',
              actionLabel: '生成打磨路径',
              options: ['01 打磨线 1', '01 打磨线 2', '02 打磨线 1', '03 打磨线 1'],
              selectedValues: ['01 打磨线 1', '02 打磨线 1'],
              pointMode: 'pose' as const,
              pointTitle: '结果点位',
              pointSubtitle: 'P1-6(n) · XYZ/RPY',
              showPathPointEntry: true,
              pathSubtitle: '6个安全点',
            },
          ].map((variant) => (
            <div key={variant.title} className="w-full max-w-[620px] justify-self-center">
              <ObjectProcessPanelDemo
                title={variant.title}
                selectionLabel={variant.selectionLabel}
                selectionPlaceholder={variant.selectionPlaceholder}
                options={variant.options}
                actionLabel={variant.actionLabel}
                selectedValues={variant.selectedValues}
                disabled={disabled}
                invalid={invalid}
                dirty
                onApply={() => undefined}
                onToggle={() => undefined}
                pointMode={variant.pointMode}
                pointTitle={variant.pointTitle}
                pointSubtitle={variant.pointSubtitle}
                showPathPointEntry={variant.showPathPointEntry}
                pathSubtitle={variant.pathSubtitle}
                posePoints={processPosePoints}
                selectedResultPointIndex={0}
                onResultPointSelect={() => undefined}
                points={processPoints}
                onPointAxisChange={() => undefined}
              />
            </div>
          ))}
        </div>
      </DemoCard>
    </div>
  );
}

const weakTextStyleSamples = [
  {
    label: '辅助说明 / muted',
    token: 'typography.helper + color.text.muted',
    className: 'text-ds-helper font-normal text-ds-text-muted',
    sample: '用于补充说明、Tooltip 外的短提示，以及不会阻塞操作的辅助信息。',
    usage: '可读性优先，弱于正文。',
  },
  {
    label: '弱占位 / disabled',
    token: 'typography.helper + color.text.disabled',
    className: 'text-ds-helper font-normal text-ds-text-disabled',
    sample: '暂无可配置内容，请先完成上一步选择。',
    usage: '用于空状态、未生成内容、缺省页占位。',
  },
  {
    label: '表单标签 / label',
    token: 'typography.label + color.text.muted',
    className: 'text-ds-label font-medium text-ds-text-muted',
    sample: '定位焊长度（10-100）',
    usage: '用于输入框上方 label，不建议用于整段空状态说明。',
  },
];

function WeakTextStyleSamples() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <div className="grid grid-cols-[150px_minmax(240px,1fr)_240px_minmax(180px,0.8fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
          <div>Usage</div>
          <div>Preview</div>
          <div>Class</div>
          <div>Token</div>
        </div>
        <div className="divide-y divide-slate-100">
          {weakTextStyleSamples.map((item) => (
            <div key={item.label} className="grid grid-cols-[150px_minmax(240px,1fr)_240px_minmax(180px,0.8fr)] items-center gap-3 px-3 py-3">
              <div>
                <div className="text-xs font-medium text-slate-700">{item.label}</div>
                <div className="mt-1 text-[11px] leading-4 text-slate-400">{item.usage}</div>
              </div>
              <div className={item.className}>{item.sample}</div>
              <div className="font-mono text-[11px] leading-4 text-slate-500">{item.className}</div>
              <div className="font-mono text-[11px] leading-4 text-slate-400">{item.token}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-32 items-center justify-center rounded-ds-md border border-dashed border-ds-border-default bg-white/50 px-4 text-center text-slate-400">
          <div className="flex -translate-y-6 flex-col items-center gap-6">
            <SlidersHorizontal className="size-10" />
            <div className="text-sm font-light">暂无任务</div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <div className="text-xs font-medium text-slate-700">空状态推荐组合</div>
          <div className="mt-2 font-mono text-[11px] leading-5 text-slate-500">
            outer: flex items-center justify-center rounded-ds-md border border-dashed border-ds-border-default bg-white/50 px-4 text-center text-slate-400; inner: flex -translate-y-6 flex-col items-center gap-6
          </div>
          <div className="mt-2 text-[11px] leading-4 text-slate-400">
            中文说明默认字距即可，不使用 tracking-wide；`text-ds-helper` 已带 11px / 16px。
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCandidateStatusRowDemo({
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
        {selected ? <CircleCheck className="size-3.5 shrink-0" /> : <CircleAlert className="size-3.5 shrink-0" />}
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

function ColorSwatch({
  name,
  className,
  usage,
}: {
  name: string;
  className: string;
  usage: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
      <div className={`size-10 shrink-0 rounded-lg ring-1 ring-black/5 ${className}`} />
      <div className="min-w-0">
        <div className="font-mono text-xs text-slate-600">{name}</div>
        <div className="mt-1 text-xs text-slate-400">{usage}</div>
      </div>
    </div>
  );
}

function TypographyTab() {
  const rows = [
    {
      label: '页面标题 / 模块标题',
      sample: '工艺参数设置',
      className: 'text-base font-semibold text-slate-900',
      usage: '用于页面标题、弹窗主标题、左侧栏标题。',
    },
    {
      label: '卡片标题',
      sample: '支撑覆盖率阈值',
      className: 'text-sm font-medium text-slate-700',
      usage: '用于参数卡片标题、表单分组标题。',
    },
    {
      label: '正文输入值',
      sample: '450',
      className: 'text-sm text-slate-700',
      usage: '用于输入框内容、普通表格值、列表主信息。',
    },
    {
      label: '辅助标签',
      sample: '最小间距',
      className: 'text-xs text-slate-400',
      usage: '用于输入框上方 label、单位辅助信息、弱说明。',
    },
    {
      label: 'Tooltip 文案',
      sample: '当支撑位置不满足覆盖率阈值时，按该采样间隔调整支撑位置。',
      className: 'text-ds-tooltip font-light leading-4 text-slate-500',
      usage: '用于工艺规划、生产执行和组件库中的 hover tips。',
    },
    {
      label: '异常提示',
      sample: '至少选择一项',
      className: 'text-xs text-red-500',
      usage: '用于输入异常、多选为空等即时校验提示。',
    },
  ];

  return (
    <div className="space-y-4">
      <DemoCard title="弱提示文字 / 空状态">
        <WeakTextStyleSamples />
      </DemoCard>

      {rows.map((row) => (
        <section key={row.label} className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(220px,0.9fr)] md:items-center">
            <div>
              <div className="text-xs text-slate-400">{row.label}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">{row.className}</div>
            </div>
            <div className={row.className}>{row.sample}</div>
            <div className="text-xs leading-5 text-slate-500">{row.usage}</div>
          </div>
        </section>
      ))}
    </div>
  );
}

function NeutralColorTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <div className="px-1 text-xs font-medium text-slate-500">Slate</div>
        <ColorSwatch name="slate-900" className="bg-slate-900" usage="一级文字、强标题。" />
        <ColorSwatch name="slate-800" className="bg-slate-800" usage="重要标题、参数组标题。" />
        <ColorSwatch name="slate-700" className="bg-slate-700" usage="正文输入值、常规标题。" />
        <ColorSwatch name="slate-600" className="bg-slate-600" usage="按钮文字、次级正文。" />
        <ColorSwatch name="slate-500" className="bg-slate-500" usage="普通说明、弱按钮。" />
        <ColorSwatch name="slate-400" className="bg-slate-400" usage="表单 label、单位、辅助信息。" />
        <ColorSwatch name="slate-300" className="bg-slate-300" usage="弱图标、开关关闭。Slider 刻度线使用独立 Zinc token。" />
        <ColorSwatch name="slate-200" className="bg-slate-200" usage="弱背景和旧组件过渡分层。Slider 轨道使用独立 Zinc token。" />
        <ColorSwatch name="slate-100" className="bg-slate-100" usage="禁用背景、浅底按钮、页面细分层。" />
        <ColorSwatch name="slate-50" className="bg-slate-50" usage="局部灰色区域背景。" />
      </div>
      <div className="space-y-4">
        <div className="px-1 text-xs font-medium text-zinc-600">Zinc</div>
        <ColorSwatch name="zinc-900" className="bg-zinc-900" usage="高对比控件文字、强中性标题。" />
        <ColorSwatch name="zinc-800" className="bg-zinc-800" usage="重要控件文字、参数组标题。" />
        <ColorSwatch name="zinc-700" className="bg-zinc-700" usage="工具栏按钮、常规控件文字。" />
        <ColorSwatch name="zinc-600" className="bg-zinc-600" usage="参数 label、次级控件文字。" />
        <ColorSwatch name="zinc-500" className="bg-zinc-500" usage="弱控件文字、辅助说明。" />
        <ColorSwatch name="zinc-400" className="bg-zinc-400" usage="禁用文字、弱控件图标。" />
        <ColorSwatch name="zinc-300" className="bg-zinc-300" usage="Slider 刻度线、结构隐藏态和拖拽抓手。" />
        <ColorSwatch name="zinc-200" className="bg-zinc-200" usage="输入框边框、常规中性 stroke、Slider 轨道。" />
        <ColorSwatch name="zinc-100" className="bg-zinc-100" usage="禁用输入、分段控件未选中底色。" />
        <ColorSwatch name="zinc-50" className="bg-zinc-50" usage="局部中性灰底和轻量分层。" />
      </div>
    </div>
  );
}

function ThemeColorTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <ColorSwatch name="color.brand.primary" className="bg-ds-brand-primary" usage="主操作、开启态 switch、slider active 轨道、tab 下划线。" />
        <ColorSwatch name="orange-50" className="bg-orange-50" usage="选中项浅底、主色弱反馈。" />
        <ColorSwatch name="color.brand.primaryText" className="bg-ds-brand-primary-text" usage="白底小字号选中项文字。" />
        <ColorSwatch name="orange-200" className="bg-orange-200" usage="选中 chip / 分段按钮 stroke。" />
        <ColorSwatch name="red-500" className="bg-red-500" usage="异常提示文字、危险操作。" />
        <ColorSwatch name="red-300" className="bg-red-300" usage="异常输入框、异常选项 stroke。" />
        <ColorSwatch name="red-50" className="bg-red-50" usage="异常输入框浅底。" />
        <ColorSwatch name="emerald-500" className="bg-emerald-500" usage="成功 toast、完成状态。" />
      </div>
      <DemoCard title="主题色使用规则">
        <div className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2">
          <div className="rounded-lg bg-orange-50 px-3 py-2 text-ds-brand-primary-text">橙色只用于主动作、选中态和当前配置中的关键交互。</div>
          <div className="rounded-lg bg-red-50 px-3 py-2 text-red-600">红色只用于校验异常、删除和不可恢复风险。</div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">绿色用于成功结果和已完成反馈，不参与普通选中态。</div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">中性色承担结构、层级、禁用与阅读秩序。</div>
        </div>
      </DemoCard>
    </div>
  );
}


function ModalSource({ children, notes }: { children: React.ReactNode; notes?: React.ReactNode }) {
  return (
    <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
      <div>应用出处：{children}</div>
      {notes && <div className="text-slate-400">{notes}</div>}
    </div>
  );
}

function TreeRowDemo({
  level,
  kind,
  name,
  selected,
  highlighted,
  checked,
  suffix,
  compact = false,
  alignTitleWithWorkface = false,
  drawingMissing = false,
  dimmed = false,
}: {
  level: number;
  kind: 'project' | 'assembly' | 'workface' | 'part' | 'weld' | 'grind' | 'datum';
  name: string;
  selected?: boolean;
  highlighted?: boolean;
  checked?: boolean;
  suffix?: string;
  compact?: boolean;
  alignTitleWithWorkface?: boolean;
  drawingMissing?: boolean;
  dimmed?: boolean;
}) {
  const isFeature = kind === 'weld' || kind === 'grind' || kind === 'datum';
  const isAssembly = kind === 'assembly';
  const isWorkface = kind === 'workface';
  const rowPaddingLeft = compact && kind === 'part'
    ? level <= 1
      ? 8
      : level >= 4
        ? 48
        : 36
    : kind === 'project'
      ? 12
    : isAssembly
      ? level * 18 + 28
    : kind === 'workface'
      ? 36
    : alignTitleWithWorkface
      ? Math.max(8, (level - 1) * 18 + 8)
      : kind === 'part'
        ? level * 18 + 16
        : level * 18 + 8;
  const objectTextClassName = compact ? 'h-8 rounded-md text-xs' : 'h-9 rounded-md text-sm';
  const icon = (() => {
    if (kind === 'project') return <FolderOpen className="size-4 shrink-0 text-amber-500" />;
    if (kind === 'assembly') return null;
    if (kind === 'workface') return null;
    if (kind === 'part') return null;
    if (kind === 'grind') return <Sparkles className="size-4 shrink-0 text-slate-500" />;
    if (kind === 'datum') return <Target className="size-4 shrink-0 text-slate-500" />;
    return <Flame className="size-4 shrink-0 text-slate-500" />;
  })();
  const titleGapClassName = kind === 'project' || isAssembly || (kind === 'part' && !compact) ? 'ds-tree-icon-title-gap' : '';

  return (
    <div
      className={`group flex items-center gap-1 px-1 pr-2 transition-[colors,opacity] ${dimmed ? 'opacity-25' : ''} ${
        isWorkface
          ? selected
            ? 'h-6 rounded-sm border-y border-orange-100 bg-orange-50 text-[10px] text-ds-brand-primary-text'
            : highlighted
              ? 'h-6 rounded-sm border-y border-orange-100/70 bg-orange-50/45 text-[10px] text-ds-text-secondary ring-1 ring-inset ring-orange-100'
            : 'h-6 rounded-sm border-y border-zinc-100/80 bg-zinc-100/55 text-[10px] text-ds-text-muted hover:bg-zinc-100/80'
          : `${objectTextClassName} ${
              selected
                ? 'bg-orange-50 text-ds-brand-primary-text'
                : highlighted
                  ? 'bg-orange-50/45 text-ds-text-secondary ring-1 ring-inset ring-orange-100'
                  : 'text-ds-text-secondary hover:bg-slate-50'
            }`
      }`}
      style={{ paddingLeft: `${rowPaddingLeft}px` }}
    >
      <button type="button" className={`flex size-5 items-center justify-center text-ds-text-disabled transition-opacity ${isWorkface ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100' : ''}`}>
        {kind === 'part' || isFeature ? <span className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
      <ThemedCheckbox className={`transition-opacity ${checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={checked} onChange={() => {}} />
      {isFeature && (
        <div className="relative size-4 shrink-0">
          <span className="absolute left-2 top-[-18px] h-8 w-px bg-slate-300/80" />
          <span className="absolute left-2 top-3 h-px w-3 bg-slate-300/80" />
        </div>
      )}
      {icon}
      <span className={`${titleGapClassName} min-w-0 flex-1 truncate ${isWorkface ? (selected ? 'font-normal text-ds-brand-primary-text' : 'font-normal text-ds-text-muted') : isAssembly || kind === 'project' || (kind === 'part' && compact) ? 'font-medium' : 'font-normal'}`}>{name}</span>
      {suffix && <span className="shrink-0 text-[11px] text-ds-text-disabled">{suffix}</span>}
      {(kind === 'project' || isAssembly) && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className={`flex size-6 items-center justify-center rounded-sm ${drawingMissing ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-ds-text-disabled hover:bg-slate-100 hover:text-ds-text-muted'}`}
            title={drawingMissing ? '装配图纸缺失' : '图纸管理'}
          >
            {drawingMissing ? <FileWarning className="size-3.5" /> : <FileCog className="size-3.5" />}
          </button>
          {drawingMissing ? (
            <span className="size-6 shrink-0" aria-hidden="true" />
          ) : (
            <button type="button" className="flex size-6 items-center justify-center rounded-sm text-ds-text-disabled hover:bg-orange-50 hover:text-orange-500" title="进入工艺规划">
              <SquareArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StructureGroupHeaderDemo({
  name,
  icon: Icon,
  count,
  badgeClassName = 'bg-zinc-100 text-zinc-600',
}: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  badgeClassName?: string;
}) {
  return (
    <div
      className="group grid min-h-7 w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-1 overflow-hidden rounded-md bg-zinc-200/60 pr-2 text-[11px] text-ds-text-secondary transition-colors hover:bg-zinc-200/75"
      style={{ paddingLeft: '8px' }}
    >
      <button type="button" className="flex size-6 shrink-0 items-center justify-center text-ds-text-disabled">
        <ChevronDown className="size-4" />
      </button>
      <Icon className="size-4 shrink-0 text-ds-text-disabled" />
      <span className="ds-tree-icon-title-gap min-w-0 flex-1 truncate font-normal">{name}</span>
      <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-none ${badgeClassName}`}>{count}</span>
    </div>
  );
}

function FeatureObjectRowDemo({ name, checked, selected }: { name: string; checked?: boolean; selected?: boolean }) {
  return (
    <div
      className={`group grid h-8 w-full min-w-0 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-1 overflow-visible rounded-md pr-2 text-xs transition-colors ${
        selected ? 'bg-orange-50 text-ds-brand-primary-text' : 'text-ds-text-secondary hover:bg-zinc-100'
      }`}
      style={{ paddingLeft: '26px' }}
    >
      <ThemedCheckbox className={`shrink-0 transition-opacity ${checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={checked} onChange={() => {}} />
      <div className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <Eye className="size-3.5 shrink-0 text-ds-text-disabled" />
    </div>
  );
}

function NestedFeatureObjectRowDemo({ name, checked, selected, first = false }: { name: string; checked?: boolean; selected?: boolean; first?: boolean }) {
  return (
    <div
      className={`group grid h-8 w-full min-w-0 grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] items-center gap-1 overflow-visible rounded-md pr-2 text-xs transition-colors ${
        selected ? 'bg-orange-50 text-ds-brand-primary-text' : 'text-ds-text-secondary hover:bg-zinc-100'
      }`}
      style={{ paddingLeft: '64px' }}
    >
      <button type="button" className="invisible flex size-6 shrink-0 items-center justify-center text-ds-text-disabled">
        <ChevronRight className="size-4" />
      </button>
      <div className="relative size-4 shrink-0">
        <span className={`absolute left-2 w-px bg-slate-300/80 ${first ? 'top-0 h-4' : 'top-[-28px] h-11'}`} />
        <span className="absolute left-2 top-3 h-px w-3 bg-slate-300/80" />
      </div>
      <ThemedCheckbox className={`shrink-0 transition-opacity ${checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={checked} onChange={() => {}} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <Eye className="size-3.5 shrink-0 text-ds-text-disabled" />
    </div>
  );
}

type ProcessSequenceDemoType = 'pick' | 'place' | 'polish' | 'assemble' | 'turnover-clamp' | 'weld-scan' | 'weld';

function getProcessSequenceDemoIcon(type: ProcessSequenceDemoType) {
  if (type === 'pick') return <Move3D className="size-4 text-current" />;
  if (type === 'place') return <Box className="size-4 text-current" />;
  if (type === 'polish') return <Sparkles className="size-4 text-current" />;
  if (type === 'assemble') return <Layers3 className="size-4 text-current" />;
  if (type === 'turnover-clamp') return <Pin className="size-4 text-current" />;
  return <Hammer className="size-4 text-current" />;
}

function ProcessSequenceRowDemo({
  index,
  title,
  type,
  dirty,
  expanded,
  dropTarget,
  hideCaret,
  compactWidth,
  hideDelete,
  selected,
  focusDetached,
  executionActive,
  disabled,
  leadingControl = 'index',
  checked,
  hoverCheckbox,
  showCompactTailActions,
}: {
  index: number;
  title: string;
  type: ProcessSequenceDemoType;
  dirty?: boolean;
  expanded?: boolean;
  dropTarget?: 'before' | 'after';
  hideCaret?: boolean;
  compactWidth?: boolean;
  hideDelete?: boolean;
  selected?: boolean;
  focusDetached?: boolean;
  executionActive?: boolean;
  disabled?: boolean;
  leadingControl?: 'index' | 'checkbox';
  checked?: boolean;
  hoverCheckbox?: boolean;
  showCompactTailActions?: boolean;
}) {
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const [compactActionsVisible, setCompactActionsVisible] = useState(false);
  const [isDisabled, setIsDisabled] = useState(Boolean(disabled));
  const compactActionsActive = compactWidth && showCompactTailActions && (compactActionsVisible || deletePopoverOpen);
  const leadingCheckboxVisible = leadingControl === 'checkbox' || checked || (hoverCheckbox && compactActionsVisible);
  const compactLeadingClassName = compactWidth ? 'flex h-6 w-4 text-xs font-normal text-slate-400' : 'flex size-6 text-ds-label font-medium text-ds-text-muted';
  const compactTailActionClassName = 'flex size-5 shrink-0 items-center justify-center rounded-ds-sm bg-white/90 text-ds-text-disabled shadow-sm ring-1 ring-inset ring-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:size-3';
  const rowStateClassName = isDisabled
    ? 'bg-neutral-100 text-ds-text-control-disabled shadow-none'
    : executionActive
      ? 'bg-neutral-200/60 text-ds-text-control'
    : selected
      ? focusDetached
        ? 'bg-ds-bg-glass-float text-ds-brand-primary-text ring-1 ring-inset ring-orange-200'
        : 'bg-orange-50 text-ds-brand-primary-text ring-1 ring-inset ring-orange-200'
      : 'bg-ds-bg-glass-float text-ds-text-control';
  return (
    <div
      className={`relative shadow-ds-sm backdrop-blur-sm ${compactWidth ? 'h-8 w-full min-w-0 rounded-ds-md py-0 pl-px pr-1' : 'w-full rounded-ds-lg px-ds-100 py-ds-075'} ${rowStateClassName} ${isDisabled ? 'cursor-not-allowed' : ''} ${deletePopoverOpen ? 'z-50' : 'z-0'}`}
      aria-disabled={isDisabled || undefined}
      onPointerEnter={() => {
        setCompactActionsVisible(true);
      }}
      onPointerLeave={() => {
        if (!deletePopoverOpen) setCompactActionsVisible(false);
      }}
      onMouseEnter={() => {
        setCompactActionsVisible(true);
      }}
      onMouseLeave={() => {
        if (!deletePopoverOpen) setCompactActionsVisible(false);
      }}
      onFocusCapture={() => {
        setCompactActionsVisible(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setCompactActionsVisible(false);
      }}
    >
      {dropTarget === 'before' && (
        <div className="pointer-events-none absolute inset-x-ds-050 top-[-3px] z-30 flex h-1.5 items-center">
          <div className="h-1 flex-1 rounded-full bg-ds-brand-primary shadow-[0_0_0_1px_rgba(255,105,0,0.15)]" />
        </div>
      )}
      <div className={`grid min-w-0 ${hideCaret ? (compactWidth ? 'grid-cols-[12px_16px_minmax(0,1fr)]' : 'grid-cols-[16px_minmax(0,1fr)_18px]') : 'grid-cols-[24px_24px_minmax(0,1fr)_auto]'} items-center ${compactWidth ? 'h-full gap-0' : 'gap-ds-100'}`}>
        {compactWidth ? (
          <button
            type="button"
            className={`flex h-6 w-3 shrink-0 items-center justify-center rounded-ds-sm ${isDisabled ? 'cursor-not-allowed text-ds-icon-drag-handle' : 'cursor-grab text-ds-icon-drag-handle active:cursor-grabbing'}`}
            title="拖拽排序"
            disabled={isDisabled}
          >
            <span aria-hidden className="flex h-4 w-1 flex-col items-center justify-center gap-0.5">
              <span className="size-0.5 rounded-full bg-current" />
              <span className="size-0.5 rounded-full bg-current" />
              <span className="size-0.5 rounded-full bg-current" />
            </span>
          </button>
        ) : null}
        <div className={`${compactLeadingClassName} shrink-0 items-center justify-center leading-none`}>
          {hoverCheckbox ? (
            <div className="relative flex size-4 shrink-0 items-center justify-center">
              <span className={`absolute inset-0 flex items-center justify-start text-[10px] font-medium leading-none tabular-nums transition-opacity ${
                leadingCheckboxVisible ? 'opacity-0' : 'opacity-100'
              } text-slate-400`}>
                <span className="ds-process-index">{index}</span>
              </span>
              <ThemedCheckbox
                aria-label={`选择${title}`}
                className={`absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 transition-opacity [&_svg]:size-2.5 ${leadingCheckboxVisible ? 'opacity-100' : 'opacity-0'}`}
                checked={checked}
                disabled={isDisabled}
                size="sm"
                onChange={() => {}}
              />
            </div>
          ) : leadingControl === 'checkbox' ? (
            <ThemedCheckbox
              aria-label={`选择${title}`}
              className={compactWidth ? 'size-3.5 [&_svg]:size-2.5' : ''}
              checked={checked}
              disabled={isDisabled}
              size="sm"
              onChange={() => {}}
            />
          ) : (
            index
          )}
        </div>
        {!hideCaret && (
          <button type="button" className="flex size-6 shrink-0 items-center justify-center rounded-ds-sm text-ds-text-disabled hover:bg-ds-bg-subtle hover:text-ds-text-muted">
            <ChevronRight className={`size-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
        <div className={`${compactWidth ? 'pl-1' : ''} min-w-0`}>
          <div className={`flex min-w-0 items-center ${compactWidth ? 'gap-1' : 'gap-ds-100'}`}>
            <span className={isDisabled ? 'opacity-35 grayscale' : ''}>{getProcessSequenceDemoIcon(type)}</span>
            <div className={`min-w-0 flex-1 truncate ${compactWidth ? 'text-xs font-medium leading-5' : 'text-ds-panel-title font-medium'} ${isDisabled ? 'text-ds-text-control-disabled' : executionActive ? 'text-ds-text-control' : selected ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`} title={title}><span className="ds-process-title-text">{title}</span></div>
          </div>
        </div>
        <div className={`${compactWidth && showCompactTailActions ? `absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 transition-opacity ${compactActionsActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}` : 'relative flex shrink-0 items-center gap-0.5'}`}>
          {compactWidth && showCompactTailActions && (
            <button
              type="button"
              className={`${compactTailActionClassName} ${isDisabled ? 'text-ds-brand-primary-text ring-orange-100 hover:bg-orange-50 hover:text-ds-brand-primary-text' : 'hover:bg-slate-100 hover:text-ds-text-muted'}`}
              title={isDisabled ? '解除禁用' : '禁用任务'}
              aria-pressed={isDisabled}
              onClick={(event) => {
                event.stopPropagation();
                setIsDisabled((current) => !current);
                setCompactActionsVisible(true);
              }}
            >
              <Ban className="size-3.5" />
            </button>
          )}
          {!hideDelete || (compactWidth && showCompactTailActions) ? (
            <button
              type="button"
              className={`${compactWidth ? compactTailActionClassName : 'flex size-6 shrink-0 items-center justify-center rounded-ds-sm text-ds-text-disabled'} hover:bg-red-50 hover:text-red-600`}
              title="删除任务"
              onClick={() => setDeletePopoverOpen((open) => !open)}
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
          {!compactWidth && (
          <button type="button" className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-ds-sm text-ds-icon-drag-handle active:cursor-grabbing" title="拖拽排序">
              <GripVertical className="size-4" />
            </button>
          )}
        </div>
      </div>
      {deletePopoverOpen && (
        <div className="ds-popover-glass-surface absolute right-ds-100 top-[calc(100%+6px)] z-20 w-56 rounded-lg p-3">
          <div className="ds-popover-glass-arrow absolute -top-1.5 right-9 size-3 rotate-45 border-l border-t" />
          <div className="text-sm font-medium text-slate-900">确认删除</div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setDeletePopoverOpen(false)}>取消</Button>
            <Button size="sm" className="h-7 bg-red-500 px-2.5 text-xs text-white hover:bg-red-600" onClick={() => setDeletePopoverOpen(false)}>删除</Button>
          </div>
        </div>
      )}
      {expanded && (
        <div className="mt-ds-075 rounded-ds-xl bg-ds-bg-subtle/80 p-ds-100">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-400"><span>点位信息</span><ChevronRight className="size-3.5 rotate-90" /></div>
            <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]">更新</Button>
          </div>
          <PointInfoRowDemo index={0} point={{ x: '120.0', y: '80.0', z: '15.0' }} onAxisChange={() => {}} />
        </div>
      )}
      {dropTarget === 'after' && (
        <div className="pointer-events-none absolute inset-x-ds-050 bottom-[-3px] z-30 flex h-1.5 items-center">
          <div className="h-1 flex-1 rounded-full bg-ds-brand-primary shadow-[0_0_0_1px_rgba(255,105,0,0.15)]" />
        </div>
      )}
    </div>
  );
}

const componentLabPlanningAssemblyId = '0162-01-010101';
const componentLabFixedPlanningProcesses = createFixedPlanningProcesses(componentLabPlanningAssemblyId);

type PlanningProcessTaskSlotStatusDemo = 'generated' | 'dirty' | 'invalid';

type PlanningProcessTaskSlotDemo = {
  id: string;
  label: string;
  status: PlanningProcessTaskSlotStatusDemo;
};

const componentLabPlanningTaskSlotStatuses: Partial<Record<number, PlanningProcessTaskSlotStatusDemo[]>> = {
  1: ['generated', 'generated'],
  2: ['generated', 'dirty'],
  3: ['generated', 'invalid'],
  4: ['generated'],
  5: ['dirty'],
  6: ['generated', 'dirty', 'invalid'],
};

function getPlanningProcessTaskSlotsDemo(process: FixedPlanningProcess): PlanningProcessTaskSlotDemo[] {
  const statuses = componentLabPlanningTaskSlotStatuses[process.sequence] ?? [];
  return process.taskSlots.map((slot, index) => ({
    id: slot.id,
    label: slot.label,
    status: statuses[index] ?? 'generated',
  }));
}

function FixedPlanningProcessRowDemo({ process, taskCount = 0 }: { process: FixedPlanningProcess; taskCount?: number }) {
  return (
    <button
      type="button"
      className="group grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-2 rounded-ds-md bg-ds-bg-process-planning-task-surface px-2.5 py-2 text-left shadow-ds-sm transition-colors hover:bg-orange-50/70"
    >
      <span className="flex size-7 items-center justify-center rounded-ds-sm bg-zinc-100 text-[11px] font-medium text-slate-500 group-hover:bg-white group-hover:text-ds-brand-primary-text">
        {String(process.sequence).padStart(2, '0')}
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-ds-text-control">{process.name}</span>
          <span className="truncate text-[10px] text-slate-400">{process.taskSummary}</span>
        </span>
        <span className="mt-1 block truncate text-[11px] leading-4 text-slate-500">{process.object}</span>
        <span className="mt-0.5 block truncate text-[10px] leading-4 text-slate-400">{process.station}</span>
      </span>
      <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${taskCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
        {taskCount > 0 ? `${taskCount} 项` : '未配置'}
      </span>
    </button>
  );
}

function PlanningProcessTaskStatusTagDemo({ slot }: { slot: PlanningProcessTaskSlotDemo }) {
  const statusLabel = slot.status === 'generated' ? '已生成' : slot.status === 'dirty' ? '有未保存修改' : '参数校验失败';

  return (
    <span
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
}

function FixedPlanningProcessStatusRowDemo({
  process,
  checked,
  onCheckedChange,
}: {
  process: FixedPlanningProcess;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  const taskSlots = getPlanningProcessTaskSlotsDemo(process);

  return (
    <div
      role="button"
      tabIndex={0}
      className="group w-[391px] max-w-full cursor-pointer rounded-ds-md bg-white/84 px-3.5 py-2 text-left shadow-ds-sm ring-1 ring-inset ring-zinc-100/80 transition-colors hover:bg-orange-50/65 focus-visible:outline-none focus-visible:ring-orange-300"
    >
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex h-5 min-w-0 flex-1 items-center gap-1.5">
          <span className="relative flex h-5 w-[18px] shrink-0 items-center justify-center">
            <span className={`ds-process-index text-xs font-normal text-zinc-400 transition-colors group-hover:text-ds-brand-primary-text group-focus:text-ds-brand-primary-text group-focus-within:text-ds-brand-primary-text ${checked ? 'opacity-0' : 'opacity-100 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0'}`}>
              {String(process.sequence).padStart(2, '0')}
            </span>
            <ThemedCheckbox
              aria-label={`选择第 ${String(process.sequence).padStart(2, '0')} 道工序：${process.name}`}
              size="sm"
              className={`absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 transition-opacity [&_svg]:size-2.5 ${checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100'}`}
              checked={checked}
              onClick={(event) => event.stopPropagation()}
              onChange={onCheckedChange}
            />
          </span>
          <span className="truncate text-sm font-medium text-zinc-800">{process.name}</span>
        </span>
        <span className="flex min-w-0 flex-wrap justify-end gap-1">
          {taskSlots.map((slot) => <PlanningProcessTaskStatusTagDemo key={slot.id} slot={slot} />)}
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
}

function FixedPlanningProcessOverviewDemo({ variant }: { variant: 'legacy' | 'status-tags' }) {
  const isStatusTagVariant = variant === 'status-tags';
  const [checkedProcessIds, setCheckedProcessIds] = useState<Set<string>>(new Set());
  const toggleProcessChecked = (processId: string) => {
    setCheckedProcessIds((previous) => {
      const next = new Set(previous);
      if (next.has(processId)) {
        next.delete(processId);
      } else {
        next.add(processId);
      }
      return next;
    });
  };

  return (
    <div className={`flex h-[560px] w-[420px] shrink-0 flex-col overflow-hidden border border-ds-border-process-planning-structure backdrop-blur-md ${isStatusTagVariant ? 'bg-white/72' : 'bg-white/76'}`}>
      <div className="flex h-9 shrink-0 items-center border-b border-zinc-200/75 px-3 text-xs font-medium text-ds-text-control">
        工序规划
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        {!isStatusTagVariant && (
          <div className="mb-2 flex h-7 shrink-0 items-center justify-between px-1 text-[11px] text-slate-400">
            <span>{componentLabPlanningAssemblyId}</span>
            <span>16 道工序</span>
          </div>
        )}
        <div className={`min-h-0 flex-1 space-y-1 overflow-y-auto ${isStatusTagVariant ? 'overflow-x-hidden pr-1' : 'pr-1'}`}>
          {componentLabFixedPlanningProcesses.map((process) => {
            if (isStatusTagVariant) {
              return (
                <FixedPlanningProcessStatusRowDemo
                  key={process.id}
                  process={process}
                  checked={checkedProcessIds.has(process.id)}
                  onCheckedChange={() => toggleProcessChecked(process.id)}
                />
              );
            }
            const taskCount = getPlanningProcessTaskSlotsDemo(process).length;
            return <FixedPlanningProcessRowDemo key={process.id} process={process} taskCount={taskCount} />;
          })}
        </div>
      </div>
    </div>
  );
}

function CurrentPlanningProcessObjectOverlayDemo({ displayObjects }: { displayObjects: string[] }) {
  return (
    <div className="pointer-events-none absolute left-4 top-[58px] z-20 max-w-[calc(100%-32px)] rounded-md bg-white/25 px-2.5 py-2 ring-1 ring-inset ring-white/28 backdrop-blur-xl">
      <div className="mb-1 text-[11px] font-medium text-slate-500">当前工序对象</div>
      <div className="flex min-w-0 flex-wrap gap-1">
        {displayObjects.map((displayObject) => (
          <span
            key={displayObject}
            className="max-w-full truncate rounded-sm bg-white/16 px-1.5 py-0.5 text-xs leading-4 text-zinc-600 ring-1 ring-inset ring-white/28"
          >
            {displayObject}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlanningProcessCardEvolutionDemo() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">页面实宽 420px</span>
        <span>首次生成前不显示任务 Tag</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />已生成</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ds-brand-primary" />有未保存修改</span>
        <span className="inline-flex items-center gap-1.5"><AlertTriangle className="size-3 text-red-500" />参数校验失败</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex w-max gap-4">
          <div className="w-[420px] shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-slate-700">V1 · 当前方案基线</span>
              <span className="text-[10px] text-slate-400">原样保留</span>
            </div>
            <FixedPlanningProcessOverviewDemo variant="legacy" />
          </div>
          <div className="w-[420px] shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-slate-700">V2 · 当前主页面方案</span>
              <span className="text-[10px] text-slate-400">同尺寸比较</span>
            </div>
            <FixedPlanningProcessOverviewDemo variant="status-tags" />
          </div>
        </div>
      </div>
      <ModalSource>工序规划一级卡片演进对照固定使用主页面右栏真实 420px 宽度。V1 原样保留“工序名称 + 任务摘要 + 对象 + 工位 + 数量状态”结构；V2 为主页面当前方案，序号与工序名称在左上同一行水平居中，任务 Tag 放在右上角，不显示任务计数，也去掉列表顶部的装配体编号 / 工序总数摘要。首次一键生成前不显示任务 Tag；生成成功后绿色表示已生成且合法，橙色表示有未保存修改，红色三角感叹号表示参数校验失败。V2 的序号在 hover 或键盘聚焦时替换为 checkbox，勾选只用于工具栏的批量导出，不进入工序、不产生卡片 fill 或 stroke；勾选后 checkbox 保持可见。未勾选时工具栏显示“导出全部”，勾选 n 道后显示“导出（n）”。零件 / 组合对象与工位放在同一底行；第 07 / 08 道使用已装配组合 (02+01)，第 12 / 15 道区分新加入零件与既有组合，第 16 道表达完整成品组合。V2 表面与正文使用白色 / Zinc 中性色，避免在整栏堆叠 Slate 灰。</ModalSource>
    </div>
  );
}

function PlanningTaskLongRowDemo({ index, type, title, selected = false, focusDetached = false, dirty = false, invalid = false }: {
  index: number;
  type: ProcessSequenceDemoType;
  title: string;
  selected?: boolean;
  focusDetached?: boolean;
  dirty?: boolean;
  invalid?: boolean;
}) {
  const needsTaskSave = dirty;
  return (
    <div className={`group relative grid h-10 min-w-0 grid-cols-[12px_20px_minmax(0,1fr)] items-center rounded-ds-md py-0 pl-px pr-[92px] shadow-ds-sm ${selected ? focusDetached ? 'bg-ds-bg-process-planning-task-surface ring-1 ring-inset ring-orange-200' : 'bg-orange-50 ring-1 ring-inset ring-orange-200' : 'bg-ds-bg-process-planning-task-surface'}`}>
      <span className="flex h-6 w-3 cursor-grab flex-col items-center justify-center gap-0.5 text-ds-icon-drag-handle">
        <span className="size-0.5 rounded-full bg-current" />
        <span className="size-0.5 rounded-full bg-current" />
        <span className="size-0.5 rounded-full bg-current" />
      </span>
      <span className="text-center text-xs font-normal text-slate-400">{index}</span>
      <span className="flex min-w-0 items-center gap-1.5 pl-1">
        <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
          {getProcessSequenceDemoIcon(type)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={`flex min-w-0 items-center gap-1 truncate text-xs font-medium leading-4 ${selected ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`}>
            <span className="truncate">{title}</span>
            {dirty && <span className="shrink-0 text-ds-brand-primary-text">*</span>}
            {invalid && <AlertTriangle className="size-3 shrink-0 text-red-500" />}
          </span>
        </span>
      </span>
      <span className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
        {needsTaskSave ? (
          <button
            type="button"
            disabled={invalid}
            className={`flex h-5 w-7 items-center justify-center rounded-ds-sm text-[11px] font-medium ${invalid ? 'cursor-not-allowed text-slate-300' : 'text-ds-brand-primary-text hover:bg-orange-50'}`}
          >
            保存
          </button>
        ) : (
          <span aria-hidden className="h-5 w-7" />
        )}
        <button type="button" className="flex size-5 items-center justify-center text-slate-400 transition-colors hover:text-slate-600" aria-label="禁用任务示例"><Ban className="size-3" /></button>
        <button type="button" className="flex size-5 items-center justify-center text-slate-400 transition-colors hover:text-red-600" aria-label="删除任务示例"><Trash2 className="size-3" /></button>
      </span>
    </div>
  );
}

function CompactProcessDetailDemo() {
  const [pathCoordinateFrame, setPathCoordinateFrame] = useState<PathCoordinateFrame>('世界');
  const [weldPathMode, setWeldPathMode] = useState<'scan' | 'weld'>('scan');
  const [pathPointCollapseSignal, setPathPointCollapseSignal] = useState(0);
  const pathPoints = [
    { x: '120.0', y: '80.0', z: '15.0' },
    { x: '240.0', y: '95.0', z: '15.0' },
    { x: '360.0', y: '110.0', z: '18.0' },
    { x: '480.0', y: '125.0', z: '18.0' },
    { x: '600.0', y: '140.0', z: '20.0' },
    { x: '720.0', y: '155.0', z: '20.0' },
  ];
  const allPathPointsCollapsed = pathPointCollapseSignal % 2 === 1;
  const toPosePoint = (point: { x: string; y: string; z: string }) => ({
    ...getPathCoordinateFramePoint(point, pathCoordinateFrame),
    rx: '0.0',
    ry: '0.0',
    rz: '0.0',
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-ds-md border border-zinc-200/70 bg-zinc-100/55">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-zinc-200 pl-3.5 pr-1.5">
        <span className="relative flex h-full items-center px-0.5 pt-1 text-[11px] font-normal leading-4 text-zinc-700">
          路径点位
          <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ds-brand-primary" />
        </span>
      </div>
      <div className="flex h-10 shrink-0 items-center border-b border-zinc-100/80 px-2">
        <SegmentedControlDemo
          value={weldPathMode}
          options={[
            { value: 'scan', label: '扫描点位' },
            { value: 'weld', label: '焊接点位' },
          ]}
          onChange={setWeldPathMode}
          className="w-full [&>button]:flex-1"
        />
      </div>
      <ProcessPathPointModeToolbar
        value={pathCoordinateFrame}
        options={pathCoordinateFrameOptions}
        onChange={setPathCoordinateFrame}
        showRadioGroup={false}
        action={(
          <div className="flex w-full shrink-0 items-center justify-end gap-1.5">
            <Tooltip title={allPathPointsCollapsed ? '全部展开' : '全部收起'}>
              <button
                type="button"
                aria-label={`${allPathPointsCollapsed ? '全部展开' : '全部收起'}路径点位`}
                className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-ds-brand-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-100"
                onClick={() => setPathPointCollapseSignal((signal) => signal + 1)}
              >
                {allPathPointsCollapsed ? <ChevronsDown className="size-3.5" /> : <ChevronsUp className="size-3.5" />}
              </button>
            </Tooltip>
          </div>
        )}
      />
      <div className="min-h-0 flex-1 overflow-auto p-1.5">
        <div className="space-y-1.5">
          {pathPoints.map((point, index) => (
            <div key={`lab-path-point-${index}`} className="space-y-1.5">
              <StyleCPathPosePointInfoRowDemo
                label={`${weldPathMode === 'scan' ? '扫描' : '焊接'}点位 ${index + 1}`}
                point={toPosePoint(point)}
                onAxisChange={() => {}}
                collapseSignal={pathPointCollapseSignal}
              />
              {index === 2 && (
                <div className="rounded-lg bg-zinc-200/45 p-1 ring-1 ring-inset ring-zinc-200/80">
                  <StyleCPathPosePointInfoRowDemo
                    label={`${weldPathMode === 'scan' ? '扫描' : '焊接'}结果点 1`}
                    point={toPosePoint({ x: '240.0', y: '96.0', z: '0.0' })}
                    onAxisChange={() => {}}
                    collapseSignal={pathPointCollapseSignal}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelPropertyCardDemo() {
  const items = [
    ['名称', '主板'],
    ['材质', 'Q345B'],
    ['重量', '320.5 kg'],
    ['厚度', '12.0 mm'],
  ];

  return (
    <div className="ds-parameter-card ds-parameter-card-sm overflow-hidden bg-zinc-100/55 shadow-ds-sm">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-800">0162-01-010101-01</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg bg-white">
        {items.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2 border-b border-slate-100/80 px-3 py-2 last:border-b-0">
            <span className="text-xs text-slate-400">{label}</span>
            <span className="truncate text-sm font-medium text-slate-700">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductionModelPropertyOverlayDemo() {
  const propertyCards = [
    { id: '0162-01-010101-01', material: 'Q345B', weight: '320.5 kg', name: '主板', expanded: false },
    { id: '0162-01-010101-02', material: 'Q235B', weight: '45.2 kg', name: '正面加强板', expanded: true },
    { id: '0162-01-010101-03', material: 'Q345B', weight: '38.6 kg', name: '反面底板', expanded: false },
    { id: '0162-01-010101-04', material: 'Q235B', weight: '12.8 kg', name: '底板加强筋', expanded: false },
  ];

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]">
      <div className="absolute left-3 top-3 flex h-10 items-center rounded-xl border border-white/70 bg-white/86 p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
        <span className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white">模型视图</span>
      </div>
      <div className="absolute left-3 top-16 w-[264px]">
        <div className="space-y-0.5 py-1.5">
          <div className="flex h-7 items-center gap-1 rounded-md bg-zinc-100/56 px-2 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-white/45 backdrop-blur-xl">
            <ChevronDown className="size-3 shrink-0 text-zinc-400" />
            <span className="truncate">0162-01-010101</span>
          </div>
          <div className="flex h-7 items-center gap-1 rounded-md bg-white/25 px-3 text-xs text-zinc-600 ring-1 ring-inset ring-white/28 backdrop-blur-xl">
            <ChevronDown className="size-3 shrink-0 text-zinc-400" />
            <span className="truncate">0162-01-010101-01</span>
          </div>
          <div className="flex h-7 items-center gap-1 rounded-md bg-orange-50/76 px-3 text-xs text-ds-brand-primary-text ring-1 ring-inset ring-orange-200/90 backdrop-blur-xl">
            <ChevronRight className="size-3 shrink-0 text-orange-400" />
            <span className="truncate">0162-01-010101-02</span>
          </div>
        </div>
        <div className="mt-2 overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 shadow-none backdrop-blur-xl">
          <div className="flex h-8 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
            <span className="flex-1 text-xs font-medium text-slate-700">属性参数</span>
            <ChevronUp className="size-3.5 text-slate-400" />
          </div>
          <div className="space-y-1.5 p-2">
            {propertyCards.map((card) => (
              <div
                key={card.id}
                className={`overflow-hidden rounded-md ring-1 ring-inset backdrop-blur-xl ${
                  card.expanded
                    ? 'bg-orange-50/76 ring-orange-200/90'
                    : 'bg-white/25 ring-white/28'
                }`}
              >
                <div className={`flex h-8 items-center gap-1.5 px-2 ${card.expanded ? 'text-ds-brand-primary-text' : 'text-zinc-600'}`}>
                  {card.expanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{card.id}</span>
                  <span className="shrink-0 text-[11px] font-light text-slate-400">{card.material} · {card.weight}</span>
                </div>
                {card.expanded && (
                  <div className="border-t border-white/35 bg-white/16 px-2 py-1">
                    {[
                      ['名称', card.name],
                      ['材质', card.material],
                      ['重量', card.weight],
                      ['厚度', '8.0 mm'],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2 border-b border-white/30 py-1 last:border-b-0">
                        <span className="!text-[11px] !font-extralight !text-slate-400/70">{label}</span>
                        <span className="truncate text-xs font-normal text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex h-9 items-center justify-between rounded-xl border border-white/65 bg-ds-bg-glass-float px-3 text-xs font-medium text-slate-600 shadow-lg shadow-black/5 backdrop-blur-md">
        <span>打印日志</span>
        <ChevronUp className="size-3.5 text-slate-400" />
      </div>
    </div>
  );
}

function TreeCatalogTab() {
  const [planningTaskBatchMode, setPlanningTaskBatchMode] = useState(false);
  const [planningProcessIsolationActive, setPlanningProcessIsolationActive] = useState(true);

  return (
    <div className="space-y-6">
      <DemoCard title="项目管理结构树条目">
        <div className="space-y-1 rounded-xl bg-white p-3 ring-1 ring-slate-100">
          <TreeRowDemo level={0} kind="project" name="0162-03-030303" checked />
          <TreeRowDemo level={1} kind="assembly" name="0162-03-030303" highlighted />
          <TreeRowDemo level={1} kind="assembly" name="0162-02-020202" drawingMissing />
          <TreeRowDemo level={2} kind="part" name="0162-03-030303-01" selected />
          <TreeRowDemo level={2} kind="part" name="0162-03-030303-02" />
          <TreeRowDemo level={2} kind="part" name="0162-03-030303-03" />
          <TreeRowDemo level={2} kind="part" name="0162-03-030303-04" />
        </div>
        <ModalSource>项目管理左侧结构树：项目、装配体、零件层级条目；行内顺序为 caret 在前、checkbox 在后；不显示工作面分组，零件在装配体下同层展示。选中装配体下级零件时，零件使用选中高亮，装配体半选中状态复用工艺规划中关联零件高亮：半透明品牌浅底 + inset stroke。缺失装配图纸的装配体条目在原图纸管理位置显示红色 FileWarning icon，进入工艺规划 icon 不显示但保留占位。</ModalSource>
      </DemoCard>

      <DemoCard title="项目管理属性参数卡片">
        <div className="space-y-3">
          <ModelPropertyCardDemo />
          <ModelPropertyCardDemo />
        </div>
        <ModalSource>项目管理右侧属性参数：参数卡片外表面使用工作面条目同款弱灰，内部字段区域保持白色；属性参数 header 在内容滚动遮挡时使用任务列表同款 sticky overlap 阴影；选中零件显示单张卡片，选中装配体时纵向堆叠所有零件卡片。</ModalSource>
      </DemoCard>

      <DemoCard title="工艺规划模型结构树条目">
        <div className="mb-3 grid gap-3 lg:grid-cols-2">
          <div className="min-w-0 overflow-hidden rounded-none border-0 border-r border-zinc-200 bg-white/76 p-3 shadow-none backdrop-blur-md">
            <div className="mb-2 flex h-9 items-center border-b border-zinc-200/75 px-3 text-xs font-medium text-slate-500">样式 C · 直角侧栏</div>
            <StructureGroupHeaderDemo name="0162-03-030303" icon={Layers3} count={4} />
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border border-white/65 bg-white/76 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <div className="mb-2 flex h-9 items-center border-b border-white/55 px-3 text-xs font-medium text-slate-500">样式 D · 圆角浮层</div>
            <StructureGroupHeaderDemo name="0162-03-030303" icon={Layers3} count={4} />
          </div>
        </div>
        <div className="space-y-1 rounded-xl bg-white p-3 ring-1 ring-slate-100">
          <StructureGroupHeaderDemo name="0162-03-030303" icon={Layers3} count={4} />
          <TreeRowDemo level={1} kind="part" name="0162-03-030303-01" compact />
          <TreeRowDemo level={1} kind="part" name="0162-03-030303-02" compact />
          <TreeRowDemo level={1} kind="part" name="0162-03-030303-03" compact dimmed={planningProcessIsolationActive} />
          <TreeRowDemo level={1} kind="part" name="0162-03-030303-04" compact dimmed={planningProcessIsolationActive} />
          <div className="flex h-7 items-center justify-end border-t border-dashed border-slate-200 pt-1">
            <button
              type="button"
              className="h-6 rounded-md px-1.5 text-[11px] font-medium text-ds-brand-primary-text hover:bg-orange-50 hover:text-ds-brand-primary-text"
              onClick={() => setPlanningProcessIsolationActive((active) => !active)}
            >
              {planningProcessIsolationActive ? '显示全部' : '隔离显示'}
            </button>
          </div>
          <TreeRowDemo level={1} kind="workface" name="工作面正面" />
          <TreeRowDemo level={1} kind="workface" name="工作面反面" />
          <div className="border-t border-dashed border-slate-200 pt-2">
            <div className="mb-1 text-[11px] text-slate-400">双击装配体后</div>
            <TreeRowDemo level={1} kind="part" name="0162-03-030303-01" compact />
            <TreeRowDemo level={2} kind="workface" name="工作面正面" />
            <TreeRowDemo level={3} kind="part" name="0162-03-030303-02" compact />
            <NestedFeatureObjectRowDemo name="01-02 焊缝（非独立显示）" first />
            <NestedFeatureObjectRowDemo name="02 打磨线 1（非独立显示）" />
            <TreeRowDemo level={2} kind="workface" name="工作面反面" />
            <TreeRowDemo level={3} kind="part" name="0162-03-030303-03" compact />
            <TreeRowDemo level={4} kind="part" name="0162-03-030303-04" compact />
          </div>
          <StructureGroupHeaderDemo name="焊接特征" icon={Flame} count={1} badgeClassName="bg-orange-50 text-ds-brand-primary-text" />
          <FeatureObjectRowDemo name="01-02 焊缝" checked selected />
          <StructureGroupHeaderDemo name="打磨特征" icon={Sparkles} count={2} badgeClassName="bg-teal-50 text-teal-600" />
          <FeatureObjectRowDemo name="01 打磨线 1" checked />
          <FeatureObjectRowDemo name="02 打磨线 2" />
          <StructureGroupHeaderDemo name="装配特征" icon={Target} count={1} badgeClassName="bg-blue-50 text-blue-600" />
          <FeatureObjectRowDemo name="02 01装配基准" />
        </div>
        <ModalSource>工艺规划左侧模型结构树：0162-03-030303 起始屏先以零件 1/2/3/4 同层展示，并将工作面正面、工作面反面排列在零件后；演示时双击装配体条目整理为 01 的正反工作面层级。样式 C 工艺规划外层面板使用项目管理同源直角侧栏；样式 D 保留原样式 C 工艺规划的圆角玻璃浮层。样式 C 非独立显示时，同一零件下特征按焊缝、打磨、装配基准顺序展示，特征对象行仅在原树层级基础上减少 16px 左 padding，不改变独立显示特征条目，也不改变任何零件条目的 padding 或 gap。装配体与特征分组统一灰底 header 和数量 badge；特征对象不显示类型 icon，使用 checkbox 支持勾选删除。进入工序后不关联对象统一使用 25% 不透明度，操作区显示“显示全部”；退出隔离后同一位置切换为“隔离显示”，支持重新进入当前工序隔离。</ModalSource>
      </DemoCard>

      <DemoCard title="工艺规划任务列表条目">
        <div className="mb-4 grid gap-3 xl:grid-cols-2">
          <div className="flex h-[430px] min-w-0 flex-col overflow-hidden border-l border-zinc-200 bg-white/76 backdrop-blur-md">
            <div className="flex h-9 shrink-0 items-center border-b border-zinc-200/75 px-3 text-xs font-medium text-ds-text-control">工序规划</div>
            <div className="flex min-h-0 flex-1 flex-col p-ds-150">
              <div className="min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto pr-1">
                {componentLabFixedPlanningProcesses.map((process) => (
                  <FixedPlanningProcessStatusRowDemo key={process.id} process={process} checked={false} onCheckedChange={() => undefined} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex h-[430px] min-w-0 flex-col overflow-hidden border-l border-zinc-200 bg-white/76 backdrop-blur-md">
            <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-zinc-200/75 px-3 text-xs font-medium text-ds-text-control">
              <button type="button" className="flex size-6 items-center justify-center rounded-ds-sm text-slate-500" aria-label="返回工序规划示例"><ArrowLeft className="size-3.5" /></button>
              <span>第 06 道 · 装配</span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1 px-1.5 text-[11px] font-normal text-slate-500">
                <Plus className="size-3.5" />
                新增任务
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 px-1.5 text-[11px] font-normal hover:bg-transparent ${planningTaskBatchMode ? 'text-ds-brand-primary-text' : 'text-slate-500'}`}
                onClick={() => setPlanningTaskBatchMode((enabled) => !enabled)}
              >
                批量操作
              </Button>
              <Filter className="size-3.5 text-slate-500" />
              {planningTaskBatchMode && (
                <>
                  <Ban className="size-3.5 text-slate-500" />
                  <Trash2 className="size-3.5 text-slate-500" />
                </>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div className="space-y-1.5">
                <PlanningTaskLongRowDemo index={1} type="assemble" title="装配" selected dirty />
                <PlanningTaskLongRowDemo index={2} type="turnover-clamp" title="翻面压紧" selected focusDetached />
                <PlanningTaskLongRowDemo index={3} type="weld" title="焊接" dirty invalid />
              </div>
              <div className="my-2 h-px shrink-0 bg-zinc-100" />
              <div className="min-h-0 flex-1 overflow-hidden rounded-ds-md border border-ds-border-process-planning-structure bg-ds-bg-process-planning-task-detail">
                <CompactProcessDetailDemo />
              </div>
              <div className="mt-2 flex h-16 shrink-0 items-center justify-center rounded-ds-md border border-dashed border-zinc-200 text-xs text-zinc-400">
                请选择任务查看和配置参数
              </div>
            </div>
          </div>
        </div>
        <ModalSource>样式 C 长任务条保留两种当前态：浅橙 fill + 品牌描边表示任务聚焦；任务中性表面 + 品牌描边表示详情仍显示但主选中已转移或任务聚焦已退出。再次点击当前聚焦任务进入仅详情态，再次点击仅详情任务可恢复任务聚焦。</ModalSource>
        <div className="mb-2 text-[11px] font-medium text-slate-400">样式 A / B / D 保留方案</div>
        <div className="flex h-12 items-center rounded-t-xl bg-white px-4 text-base font-semibold text-zinc-900">
          任务列表
        </div>
        <div className="rounded-ds-xl bg-[#fafafa] p-ds-150">
          <div className="grid gap-ds-200 lg:grid-cols-[minmax(0,420px)_minmax(0,420px)]">
            <div className="min-w-0">
              <div className="mb-ds-075 text-[11px] font-medium text-slate-400">当前未展开卡片 / 完整名称</div>
              <div className="space-y-ds-075">
                <ProcessSequenceRowDemo index={1} type="pick" title="抓取0162-01-010101-01" />
                <ProcessSequenceRowDemo index={2} type="place" title="放置0162-01-010101-02+0162-01-010101-01" />
                <ProcessSequenceRowDemo index={3} type="polish" title="打磨01 打磨线 1+02 打磨线 2" dirty />
                <ProcessSequenceRowDemo index={4} type="assemble" title="装配02 01装配基准" />
                <ProcessSequenceRowDemo index={5} type="turnover-clamp" title="翻面压紧0162-01-010101-03" />
                <ProcessSequenceRowDemo index={6} type="weld-scan" title="定位焊扫描0162-01-010101-02+0162-01-010101-01" dropTarget="before" />
                <ProcessSequenceRowDemo index={7} type="weld" title="定位焊01-02 焊缝" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-ds-075 text-[11px] font-medium text-slate-400">D 当前变体 / 短名称</div>
              <div className="mb-2 flex h-9 items-center rounded-none border-0 border-b border-zinc-200/75 bg-transparent px-3 text-xs font-medium text-zinc-700">
                <span>任务列表</span>
                <div className="ml-auto flex items-center gap-1">
                  <Tooltip title="新建工单">
                    <span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="!font-normal h-7 gap-1 px-1.5 text-xs text-zinc-600 hover:bg-transparent hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
                      >
                        <Plus className="size-3.5" />
                        新建工单
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title="清除当前列表">
                    <span>
                      <Button size="sm" variant="ghost" className="!font-normal h-7 w-7 p-0 text-zinc-600 hover:bg-transparent hover:text-zinc-900">
                        <ListX className="size-3.5" />
                      </Button>
                    </span>
                  </Tooltip>
                </div>
              </div>
              <div className="flex h-[332px] min-h-0 flex-col">
                <div className="relative h-[188px] overflow-hidden">
                  <div className="h-full overflow-auto pr-1">
                    <div>
                      <div className="mb-1.5 text-[10px] font-medium text-slate-400">标号变体 / 左侧抓手 + 右侧操作</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <ProcessSequenceRowDemo index={1} type="pick" title="抓取" hideCaret compactWidth showCompactTailActions />
                        <ProcessSequenceRowDemo index={2} type="place" title="放置" hideCaret compactWidth showCompactTailActions />
                        <ProcessSequenceRowDemo index={3} type="polish" title="打磨" dirty hideCaret compactWidth showCompactTailActions />
                        <ProcessSequenceRowDemo index={4} type="assemble" title="装配" selected hideCaret compactWidth showCompactTailActions />
                        <ProcessSequenceRowDemo index={5} type="turnover-clamp" title="翻面压紧" hideCaret compactWidth showCompactTailActions />
                        <ProcessSequenceRowDemo index={6} type="weld-scan" title="定位焊扫描" selected focusDetached hideCaret compactWidth showCompactTailActions />
                        <ProcessSequenceRowDemo index={7} type="weld" title="定位焊" dropTarget="before" hideCaret compactWidth showCompactTailActions />
                      </div>
                    </div>
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <div className="mb-1.5 text-[10px] font-medium text-slate-400">工单概要 / 排单与折叠</div>
                      <div className="space-y-1">
                        <div className="rounded-md bg-ds-bg-production-list-header px-3.5 py-1.5 text-ds-text-muted shadow-sm">
                          <div className="flex h-5 min-w-0 items-center gap-1.5">
                            <ChevronDown className="size-3.5 shrink-0 text-ds-text-disabled" />
                            <span className="shrink-0 font-mono text-[11px] font-medium leading-none text-ds-text-disabled">01</span>
                            <span className="min-w-0 truncate text-sm font-medium leading-none text-ds-text-secondary">0162-01-010101</span>
                            <span className="shrink-0 text-xs font-medium leading-none text-ds-text-disabled">6 件</span>
                            <span className="ml-auto w-[84px] shrink-0 text-right text-xs font-medium leading-none text-ds-text-disabled">待执行</span>
                          </div>
                          <div className="mt-3 flex min-w-0 items-center gap-2 pl-[22px]">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ds-bg-slider-track">
                              <div className="h-full w-0 rounded-full bg-ds-brand-primary" />
                            </div>
                            <span className="w-9 shrink-0 text-right text-xs font-medium leading-none text-ds-text-muted">0%</span>
                          </div>
                        </div>
                        <div className="group/work-order rounded-md bg-ds-bg-production-list-header pl-1.5 pr-3.5 py-1.5 text-ds-text-muted shadow-sm">
                          <div className="flex h-5 min-w-0 items-center gap-1.5">
                            <ChevronRight className="size-3.5 shrink-0 text-ds-text-disabled" />
                            <span className="shrink-0 font-mono text-[11px] font-medium leading-none text-ds-text-disabled">02</span>
                            <span className="min-w-0 truncate text-sm font-medium leading-none text-ds-text-control">0163-02-020202</span>
                            <span className="shrink-0 text-xs font-medium leading-none text-ds-text-disabled">4 件</span>
                            <div className="ml-auto flex h-5 shrink-0 items-center justify-end gap-1">
                              <span className="w-[62px] shrink-0 text-right text-xs font-medium leading-none text-ds-text-disabled">待执行</span>
                              <button type="button" className="flex h-5 w-0 shrink-0 items-center justify-center overflow-hidden text-ds-text-disabled opacity-0 transition-[width,opacity,color] hover:text-red-500 focus-visible:w-5 focus-visible:opacity-100 group-hover/work-order:w-5 group-hover/work-order:opacity-100" aria-label="删除工单示例">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <div className="mb-1.5 text-[10px] font-medium text-slate-400">生产任务变体 / 序号与 Checkbox 同心切换</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <ProcessSequenceRowDemo index={1} type="pick" title="抓取" hideCaret compactWidth showCompactTailActions hoverCheckbox />
                        <ProcessSequenceRowDemo index={2} type="assemble" title="装配" hideCaret compactWidth showCompactTailActions hoverCheckbox checked />
                      </div>
                    </div>
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <div className="mb-1.5 text-[10px] font-medium text-slate-400">Checkbox 批量变体 / 标号替换为 Checkbox</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <ProcessSequenceRowDemo index={1} type="pick" title="抓取" hideCaret compactWidth showCompactTailActions leadingControl="checkbox" checked />
                        <ProcessSequenceRowDemo index={2} type="place" title="放置" hideCaret compactWidth showCompactTailActions leadingControl="checkbox" />
                        <ProcessSequenceRowDemo index={3} type="polish" title="打磨" dirty hideCaret compactWidth showCompactTailActions leadingControl="checkbox" />
                      </div>
                    </div>
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <div className="mb-1.5 text-[10px] font-medium text-slate-400">执行状态变体 / 浅灰底，不使用橙色点选态</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <ProcessSequenceRowDemo index={7} type="assemble" title="装配" hideCaret compactWidth showCompactTailActions executionActive />
                      </div>
                    </div>
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      <div className="mb-1.5 text-[10px] font-medium text-slate-400">禁用变体 / 不响应选择，尾部操作 hover 显示</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <ProcessSequenceRowDemo index={8} type="place" title="放置" hideCaret compactWidth showCompactTailActions disabled />
                        <ProcessSequenceRowDemo index={9} type="weld" title="定位焊" hideCaret compactWidth showCompactTailActions leadingControl="checkbox" disabled />
                      </div>
                    </div>
                  </div>
                  <div className="ds-scroll-edge-bottom z-10" />
                </div>
                <div className="group my-1 flex h-3 shrink-0 cursor-row-resize items-center px-2">
                  <div className="h-0.5 flex-1 rounded-full bg-zinc-100 shadow-none transition-[background-color,box-shadow] group-hover:bg-[#FFD591] group-hover:shadow-[0_0_4px_#FFEDD5]" />
                </div>
                <CompactProcessDetailDemo />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="min-w-0 overflow-hidden rounded-none border-0 border-l border-zinc-200 bg-white/76 p-3 shadow-none backdrop-blur-md">
                  <div className="mb-2 flex h-9 items-center border-b border-zinc-200/75 px-3 text-xs font-medium text-zinc-700">样式 C · 工序规划直角侧栏</div>
                  <FixedPlanningProcessRowDemo process={componentLabFixedPlanningProcesses[0]} taskCount={2} />
                </div>
                <div className="min-w-0 overflow-hidden rounded-xl border border-white/60 bg-white/76 p-3 shadow-lg shadow-black/5 backdrop-blur-md">
                  <div className="mb-2 flex h-9 items-center border-b border-white/55 px-3 text-xs font-medium text-zinc-700">样式 D · 任务列表圆角浮层</div>
                  <ProcessSequenceRowDemo index={1} type="pick" title="抓取" hideCaret compactWidth showCompactTailActions />
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-ds-bg-viewport p-3">
                <div className="relative h-[184px] overflow-hidden rounded-lg border border-white/50 bg-slate-200/70">
                  <div className="absolute right-3 top-3 w-[250px] overflow-visible rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
                    <div className="border-b border-slate-100/80 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Filter className="size-4 text-orange-500" />
                        <span className="text-xs font-medium text-slate-800">任务筛选</span>
                      </div>
                    </div>
                    <div className="grid gap-2.5 p-3">
                      <div>
                        <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                          <div className="text-[11px] text-slate-500">筛选方式</div>
                          <div className="flex h-7 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md border border-ds-border-default bg-white px-2 text-[11px] text-slate-600 shadow-sm">
                            <span className="max-w-[92px] truncate rounded-full bg-slate-100 px-1.5 text-[10px] leading-5">焊缝特征</span>
                            <span className="max-w-[92px] truncate rounded-full bg-slate-100 px-1.5 text-[10px] leading-5">装配特征</span>
                            <span className="max-w-[92px] truncate rounded-full bg-slate-100 px-1.5 text-[10px] leading-5">工序类型</span>
                            <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
                          </div>
                        </div>
                        <div className="mt-2 h-px bg-ds-border-production-list" />
                      </div>
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <div className="text-[11px] text-slate-500">焊缝特征</div>
                        <div className="min-w-0 flex-1">
                          <ObjectMultiSelectDemo
                            values={['01-02 焊缝', '03-04 焊缝']}
                            selectedValues={['01-02 焊缝', '03-04 焊缝']}
                            placeholder="请选择筛选值"
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <div className="text-[11px] text-slate-500">装配特征</div>
                        <div className="min-w-0 flex-1">
                          <ObjectMultiSelectDemo
                            values={['02 01装配基准', '04 03装配基准']}
                            selectedValues={['02 01装配基准']}
                            placeholder="请选择筛选值"
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <div className="text-[11px] text-slate-500">工序类型</div>
                        <div className="min-w-0 flex-1">
                          <ObjectMultiSelectDemo
                            values={['装配', '焊接', '翻面压紧']}
                            selectedValues={['装配', '焊接']}
                            placeholder="请选择筛选值"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-ds-bg-viewport p-3">
                <div className="flex h-[236px] items-center justify-center rounded-lg border border-white/50 bg-slate-200/70 px-3">
                  <div className="w-[360px] overflow-visible rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
                    <div className="flex items-center gap-2 border-b border-white/50 px-4 py-2.5">
                      <Plus className="size-4 text-orange-500" />
                      <span className="text-xs font-medium text-slate-700">新增任务</span>
                    </div>
                    <div className="space-y-3 px-4 py-3">
                      <div>
                        <div className="mb-1.5 text-[11px] text-ds-text-parameter-label">任务类型</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: '抓取', icon: Move3D, selected: false },
                            { label: '打磨', icon: Sparkles, selected: true },
                            { label: '焊接', icon: Hammer, selected: false },
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              className={`flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border px-1.5 text-[11px] transition-colors ${
                                item.selected
                                  ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text'
                                  : 'border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              <item.icon className="size-3 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 text-[11px] text-ds-text-parameter-label">工件对象</div>
                        <div className="flex min-h-8 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-[11px] text-zinc-600">
                          0162-01-010101-01
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 text-[11px] text-ds-text-parameter-label">选择打磨线</div>
                        <ObjectMultiSelectDemo
                          values={['01 打磨线', '02 打磨线', '04 打磨线']}
                          selectedValues={['01 打磨线', '02 打磨线']}
                          placeholder="请选择打磨线"
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-white/50 px-4 py-2.5">
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">取消</Button>
                      <Button size="sm" className="h-7 bg-ds-brand-primary px-2.5 text-[11px] text-white hover:bg-ds-brand-primary-hover">确认新增</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ModalSource>工艺规划右侧：样式 C 当前方案使用“固定 16 道工序 → 工序内任务”两级结构。一级 V2 工序卡片在左上同一行显示序号和工序名称；首次一键生成前不显示任务 Tag，成功生成后右上显示绿色、橙色或红色三角感叹号状态 Tag；底行显示固定对象与工位。进入未生成工序时显示暂无任务，首次生成完成后才出现任务条与新增、筛选、批量操作入口。任务条只有参数修改后才显示“保存”，未修改时为保持禁用/删除图标位置保留等宽空位；校验失败显示红色三角感叹号并禁用保存。新增任务弹窗固定回显工件对象，只有特征继续选择。装配工序中的扫描与焊接合并为一个“焊接”任务，内部使用扫描参数 / 焊接参数小标题，并在路径点位中使用扫描点位 / 焊接点位分段切换，两侧各 6 组。样式 A/B 保留完整任务卡片，样式 D 保留原紧凑三列任务与圆角玻璃浮层。</ModalSource>
      </DemoCard>
    </div>
  );
}

function ModalCatalogTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white px-4 py-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-slate-900">全屏玻璃态弹窗</div>
        <div className="mt-1 text-xs text-slate-400">
          统一使用外层遮罩 + 玻璃态容器的 fullscreen modal。容器样式：
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[11px]">rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md</code>
          ；侧栏/列表分区使用
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[11px]">bg-ds-bg-glass-modal-sidebar</code>
          。
        </div>
      </div>

      <DemoCard title="工艺参数设置弹窗 / 大型参数配置">
        <div className="overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex h-[300px] flex-col">
            <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-4 backdrop-blur-[var(--ds-blur-sticky-overlap)]">
              <div className="text-sm font-medium">工艺参数设置</div>
              <X className="size-4 text-slate-400" />
            </div>
            <div className="flex min-h-0 flex-1">
              <aside className="w-[190px] shrink-0 border-r border-white/50 bg-ds-bg-glass-modal-sidebar p-3">
                {['抓取工艺参数设置', '工作台参数设置', '打磨工艺参数设置', '装配定位工艺参数设置', '定位焊工艺参数设置'].map((item, index) => (
                  <div key={item} className={`mb-1 rounded-md px-3 py-2 text-xs ${index === 0 ? 'bg-orange-50 text-ds-brand-primary-hover' : 'text-slate-500'}`}>{item}</div>
                ))}
              </aside>
              <section className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white/50 px-4 pb-4 pt-4">
                <div className="mb-4 flex h-9 items-end gap-5 border-b border-white/70 px-1">
                  {[
                    { value: 'gantry', label: '桁架抓具' },
                    { value: 'robot', label: '机器人抓具' },
                  ].map((item) => {
                    const selected = item.value === 'gantry';
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`relative flex h-full items-start px-0.5 pt-1 text-xs font-medium transition-colors ${
                          selected ? 'text-zinc-800' : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        {item.label}
                        <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${selected ? 'bg-ds-brand-primary' : 'bg-transparent'}`} />
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="ds-parameter-card ds-parameter-card-sm">
                    <div className="text-xs text-slate-400">左磁铁尺寸</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm font-medium text-slate-700">
                      <span>220mm</span>
                      <span>150mm</span>
                    </div>
                  </div>
                  <div className="ds-parameter-card ds-parameter-card-sm ds-parameter-card-title-stack">
                    <div className="text-xs text-slate-400">覆盖率阈值</div>
                    <PercentSliderDemo value="70" onChange={() => {}} />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex h-[48px] shrink-0 items-center justify-end bg-ds-bg-glass-modal px-4 shadow-ds-footer-up backdrop-blur-[var(--ds-blur-sticky-overlap)]">
              <Button size="sm" className="h-8 bg-ds-brand-primary px-3 text-xs text-white hover:bg-ds-brand-primary-hover">
                保存
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="brandOutline" className="h-8 gap-1.5 rounded-full px-3 text-xs">
            <Cog className="size-3.5" />
            工艺参数设置
          </Button>
        </div>
        <ModalSource notes={<>容器：rounded-lg + bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；样式 C header/footer 横向贯穿，header 显示“工艺参数设置”和关闭入口，footer 复用 header 偏白玻璃底，并使用任务列表下端同款向上阴影；header/footer 之间使用 min-h-0 flex-1 约束内容高度，右侧内容区独立 overflow-y-auto；侧栏：bg-ds-bg-glass-modal-sidebar；内容区使用 bg-white/50；内容卡片：ds-parameter-card；title-content gap：ds-parameter-card-title-stack；遮罩：bg-black/45。</>}>
          顶部“拼装 Demo 关键屏”右侧的“工艺参数设置”按钮。
        </ModalSource>
      </DemoCard>

      <DemoCard title="图纸管理弹窗 / 文件列表与预览">
        <div className="overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-5 py-3">
            <div className="text-sm font-medium text-slate-700">图纸管理</div>
            <X className="size-4 text-slate-400" />
          </div>
          <div className="grid h-[220px] grid-cols-[210px_minmax(0,1fr)]">
            <div className="border-r border-white/50 bg-ds-bg-glass-modal-sidebar">
              <div className="flex h-12 items-center gap-1.5 border-b border-white/50 bg-white/25 px-3">
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                  <FolderPlus className="size-3" />
                  导入文件夹
                </Button>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[11px] font-medium text-slate-400">装配图纸</div>
                  <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]">
                    <Import className="size-3" />
                    导入
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2 text-xs text-ds-brand-primary-text ring-1 ring-orange-200">
                  <span className="truncate">装配图纸</span>
                  <span className="ml-2 flex shrink-0 items-center gap-1.5">
                    <Import className="size-3 text-slate-400" />
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 pt-1">
                  <div className="text-[11px] font-medium text-slate-400">零件图纸</div>
                  <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]">
                    <Import className="size-3" />
                    导入
                  </Button>
                </div>
                {[
                  { name: '零件图纸 01', missing: false },
                  { name: '零件图纸 02', missing: true },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-100"
                  >
                    <div className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className={`block text-[10px] ${item.missing ? 'font-medium text-red-400' : 'text-slate-400'}`}>
                        {item.missing ? '缺失' : '已上传'}
                      </span>
                    </div>
                    <span className="ml-2 flex shrink-0 items-center gap-1.5">
                      <Import className="size-3 text-slate-400" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex h-12 items-center gap-2 border-b border-white/50 px-4">
                <FileSpreadsheet className="size-4 text-orange-500" />
                <span className="truncate text-sm font-medium text-slate-700">装配图纸</span>
              </div>
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">图纸预览区域</div>
            </div>
          </div>
        </div>
        <ModalSource notes={<>容器：rounded-lg + bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；header 不放业务 icon；左侧列表区：bg-ds-bg-glass-modal-sidebar；图纸名称 heading 不额外加亮白背景；选中态使用品牌橙；遮罩：bg-black/40。</>}>
          属性参数栏里的“图纸管理”按钮，包含图纸替换入口。
        </ModalSource>
      </DemoCard>

      <DemoCard title="创建模型弹窗 / 新增装配体新建流">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-slate-700">创建模型</div>
                <span className="text-xs text-slate-400">0162-01-010101</span>
              </div>
              <X className="size-4 text-slate-400" />
            </div>
            <div className="grid h-[240px] grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-r border-white/50 bg-ds-bg-glass-modal-sidebar">
                <div className="flex h-12 items-center gap-1.5 border-b border-white/50 bg-white/25 px-3">
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" disabled>
                    <FolderPlus className="size-3" />
                    导入文件夹
                  </Button>
                </div>
                <div className="space-y-1.5 p-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[11px] font-medium text-slate-400">装配图纸</div>
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]">
                      <Import className="size-3" />
                      导入
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-red-100 bg-white px-3 py-2 text-xs text-slate-700">
                    <div className="min-w-0">
                      <span className="block truncate">装配图纸</span>
                      <span className="block text-[10px] font-medium text-red-400">缺失</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1 pt-1">
                    <div className="text-[11px] font-medium text-slate-400">零件图纸</div>
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]" disabled>
                      <Import className="size-3" />
                      导入
                    </Button>
                  </div>
                  <div className="rounded-md border border-dashed border-slate-200 bg-white/45 px-3 py-4 text-center text-[11px] text-slate-400">
                    请先导入装配图纸
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex h-12 items-center gap-2 border-b border-white/50 px-4">
                  <FileQuestion className="size-4 text-red-400" />
                  <span className="truncate text-sm font-medium text-slate-700">装配图纸</span>
                  <span className="text-[10px] text-red-400">缺失</span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-red-300">
                  <FileQuestion className="size-12 opacity-30" />
                  <span className="text-sm text-red-400">图纸缺失</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-white/50 px-5 py-3">
              <Button size="sm" disabled>确认解析</Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-slate-700">创建模型</div>
                <span className="text-xs text-slate-400">0162-01-010101</span>
              </div>
              <X className="size-4 text-slate-400" />
            </div>
            <div className="grid h-[240px] grid-cols-[220px_minmax(0,1fr)]">
              <div className="border-r border-white/50 bg-ds-bg-glass-modal-sidebar">
                <div className="flex h-12 items-center gap-1.5 border-b border-white/50 bg-white/25 px-3">
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                    <FolderPlus className="size-3" />
                    导入文件夹
                  </Button>
                </div>
                <div className="space-y-1.5 p-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[11px] font-medium text-slate-400">装配图纸</div>
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]">
                      <Import className="size-3" />
                      导入
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-ds-brand-primary-text">
                    <div className="min-w-0">
                      <span className="block truncate">装配图纸</span>
                      <span className="block text-[10px] text-slate-400">已导入</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1 pt-1">
                    <div className="text-[11px] font-medium text-slate-400">零件图纸</div>
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]">
                      <Import className="size-3" />
                      导入
                    </Button>
                  </div>
                  {[
                    { name: '0162-01-010101-01', state: '缺失' },
                    { name: '0162-01-010101-02', state: '已导入' },
                    { name: '0162-01-010101-03', state: '导入失败' },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500"
                    >
                      <div className="min-w-0">
                        <span className="block truncate">{item.name}</span>
                        <span className={`block text-[10px] ${item.state === '已导入' ? 'text-slate-400' : 'font-medium text-red-400'}`}>
                          {item.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex h-12 items-center gap-2 border-b border-white/50 px-4">
                  <FileSpreadsheet className="size-4 text-orange-500" />
                  <span className="truncate text-sm font-medium text-slate-700">装配图纸</span>
                </div>
                <div className="flex flex-1 items-center justify-center text-sm text-slate-400">图纸预览区域</div>
              </div>
            </div>
            <div className="flex justify-end border-t border-white/50 px-5 py-3">
              <Button size="sm" disabled>确认解析</Button>
            </div>
          </div>
        </div>
        <ModalSource notes={<>复用图纸管理弹窗外壳；初始态装配图纸缺失且零件图纸不展示条目；点击“装配图纸”标题右侧导入后进入装配图纸已导入、零件图纸部分缺失态；存在缺失时“确认解析”置灰；第三个零件图纸单独替换导入失败时显示失败 toast，并保留缺失状态；继续批量导入后切换为全量已导入。</>}>
          C 样式项目条目尾部“新增装配体”按钮的新建模型 flow。
        </ModalSource>
      </DemoCard>

      <DemoCard title="本地文件夹选择提示 / 创建模型过渡">
        <div className="flex h-[150px] items-center justify-center rounded-xl bg-slate-100">
          <div className="w-[320px] rounded-xl bg-zinc-200 px-5 py-4 text-center shadow-xl shadow-black/10 ring-1 ring-white/60">
            <div className="text-sm font-medium text-zinc-700">本地选择文件夹</div>
            <div className="mt-1 text-xs text-zinc-500">正在选择 0162-04-040404 图纸文件夹...</div>
          </div>
        </div>
        <ModalSource notes={<>点击“新增装配体”后先显示 2 秒圆角灰框，模拟系统本地文件夹选择器；消失后再出现“创建模型”弹窗。</>}>
          C 样式项目条目尾部“新增装配体”按钮进入创建模型前的 demo 过渡。
        </ModalSource>
      </DemoCard>

      <div className="rounded-xl bg-white px-4 py-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-slate-900">通用确认弹窗</div>
        <div className="mt-1 text-xs text-slate-400">跨项目管理和工艺规划复用的危险操作或表单确认，居中小尺寸弹窗。</div>
      </div>

      <DemoCard title="确认删除弹窗 / 危险确认">
        <div className="mx-auto w-full max-w-[400px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
            <AlertTriangle className="size-5 text-red-500" />
            <span className="text-sm font-medium">确认删除</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-slate-600">是否确认删除选中的任务条目？删除后将同时移除其关联配置且无法恢复</p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
            <Button size="sm" variant="outline">取消</Button>
            <Button size="sm" className="bg-red-500 text-white hover:bg-red-600">确认删除</Button>
          </div>
        </div>
        <ModalSource notes={<>容器：bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；遮罩：bg-black/50。</>}>
          任务右键菜单删除、结构树批量删除三维模型、特征勾选删除。
        </ModalSource>
      </DemoCard>

      <DemoCard title="生产执行清除列表确认 / 二次确认">
        <div className="mx-auto w-full max-w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
            <AlertTriangle className="size-5 text-orange-500" />
            <span className="text-sm font-medium">确认清除当前列表</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-6 text-slate-600">当前筛选后可见的 3 项生产任务将从生产执行列表移出，不会删除工艺规划数据。是否继续？</p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
            <Button size="sm" variant="outline">取消</Button>
            <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover">确认清除</Button>
          </div>
        </div>
        <ModalSource notes={<>容器：bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；遮罩：bg-black/45。</>}>
          生产执行左侧任务栏“清除当前列表”只移出当前筛选后可见任务，确认文案必须说明不删除工艺规划数据。
        </ModalSource>
      </DemoCard>

      <DemoCard title="生产执行删除工单确认 / 危险确认">
        <div className="mx-auto w-full max-w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
            <AlertTriangle className="size-5 text-red-500" />
            <span className="text-sm font-medium">确认删除工单</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-6 text-slate-600">是否确认删除工单 0163-02-020202？删除后将从当前排单移出，不会删除工艺规划数据。</p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
            <Button size="sm" variant="outline">取消</Button>
            <Button size="sm" className="bg-red-500 text-white hover:bg-red-600">确认删除</Button>
          </div>
        </div>
        <ModalSource notes={<>容器：bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；遮罩：bg-black/45。</>}>
          未执行工单的 hover 删除入口使用该确认弹窗；确认后只移出当前排单，不删除工艺规划数据。
        </ModalSource>
      </DemoCard>

      <DemoCard title="新增装配体弹窗 / 表单创建">
        <div className="mx-auto w-full max-w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
            <FolderPlus className="size-5 text-emerald-500" />
            <span className="text-sm font-medium">新增装配体</span>
          </div>
          <div className="space-y-2 px-5 py-4">
            <label className="text-xs text-slate-400">装配体名称</label>
            <input
              value="新建装配体"
              readOnly
              className="h-9 w-full rounded-lg border border-ds-border-default bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-300"
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
            <Button size="sm" variant="outline">取消</Button>
            <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover">确认创建</Button>
          </div>
        </div>
        <ModalSource notes={<>容器：bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；遮罩：bg-black/45。</>}>
          历史表单样式保留作小型确认弹窗参考；C 样式项目/0162 分组尾部“新增装配体”当前走“创建模型”弹窗变体。
        </ModalSource>
      </DemoCard>

      <DemoCard title="缺少装配图纸拦截弹窗 / 前置校验">
        <div className="mx-auto w-full max-w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
            <AlertTriangle className="size-5 text-orange-500" />
            <span className="text-sm font-medium">缺少装配图纸</span>
          </div>
          <div className="space-y-2 px-5 py-4">
            <p className="text-sm leading-6 text-slate-600">请先上传图纸解析模型，再进入工艺规划。</p>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">新建装配体</div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
            <Button size="sm" variant="outline">取消</Button>
            <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover">去上传图纸</Button>
          </div>
        </div>
        <ModalSource notes={<>容器：bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；遮罩：bg-black/45。</>}>
          项目管理中装配体未上传装配图纸时，点击“进入工艺规划”触发。
        </ModalSource>
      </DemoCard>

      <DemoCard title="图纸替换确认弹窗 / 二次确认">
        <div className="mx-auto w-full max-w-[400px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
            <AlertTriangle className="size-5 text-orange-500" />
            <span className="text-sm font-medium">确认替换图纸</span>
          </div>
          <div className="px-5 py-4 text-sm leading-6 text-slate-600">替换后将重新解析图纸并更新对应模型信息，是否继续？</div>
          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
            <Button size="sm" variant="outline">取消</Button>
            <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover">确认替换</Button>
          </div>
        </div>
        <ModalSource notes={<>容器：bg-ds-bg-glass-modal + backdrop-blur-md + shadow-black/5；遮罩：bg-black/50。</>}>
          图纸管理弹窗内的装配图纸/零件图纸替换操作。
        </ModalSource>
      </DemoCard>

      <div className="rounded-xl bg-white px-4 py-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-slate-900">3D 视窗内浮层</div>
        <div className="mt-1 text-xs text-slate-400">
          不占用 fullscreen 遮罩，直接叠加在 3D 视窗或场景上方。坐标转换、手动焊缝、手动打磨和装配特征提取使用同一玻璃浮层样式，并且同一时间只允许打开一个，避免 3D 点选行为互相抢占。
        </div>
      </div>

      <DemoCard title="模型坐标系转换浮窗 / 3D 视窗内浮层">
        <div className="relative h-[370px] rounded-xl bg-slate-200 p-3">
          <div className="absolute left-3 top-3 flex w-[320px] flex-col overflow-visible rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Move3D className="size-4 text-orange-500" />
                <span className="text-xs font-medium text-slate-800">模型坐标系转换</span>
              </div>
              <X className="size-3.5 text-slate-400" />
            </div>
            <div className="space-y-3 p-3">
              <div>
                <div className="mb-1.5 text-[11px] text-slate-500">选择零件</div>
                <div className="rounded-md border border-slate-200 bg-white/85 px-2 py-1.5 text-[11px] text-slate-600">
                  0162-01-010101-01、0162-01-010101-02
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="mb-2 text-[11px] font-medium text-slate-500">重选中心</div>
                <div className="grid grid-cols-[minmax(0,1fr)_84px] gap-2">
                  <div className="h-7 truncate rounded-md border border-slate-200 bg-white/85 px-2 py-1 text-[11px] text-slate-600">
                    0162-01-010101-01
                  </div>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs">吸附选点</Button>
                </div>
                <Button size="sm" className="mt-2 h-8 w-full bg-ds-brand-primary px-2 text-xs text-white hover:bg-ds-brand-primary-hover">
                  设为中心
                </Button>
                <div className="mt-2 truncate text-[11px] text-slate-400">当前中心：目标零件质心</div>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-medium text-slate-500">操作轴偏移</div>
                <div className="grid grid-cols-3 gap-2">
                  {['x', 'y', 'z', 'rx', 'ry', 'rz'].map((axis) => (
                    <div key={axis}>
                      <label className="mb-1 block text-[10px] uppercase text-slate-400">{axis}</label>
                      <div className="h-8 rounded-md border border-slate-200 bg-white/85 px-2 py-1.5 text-right text-xs text-slate-500">
                        0.0
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">取消</Button>
              <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-xs text-white hover:bg-ds-brand-primary-hover">应用</Button>
            </div>
          </div>
        </div>
        <ModalSource notes={<>浮层容器：w-[320px] + rounded-lg + bg-ds-bg-glass-float + backdrop-blur-md + shadow-black/5；与手动焊缝、手动打磨、装配特征提取互斥，打开时清理其它 3D 工具浮窗的临时选择。</>}>
          3D 视窗顶部工具栏“坐标转换”。
        </ModalSource>
      </DemoCard>

      <DemoCard title="焊缝特征提取浮窗 / 打磨特征提取浮窗">
        <div className="relative h-[380px] rounded-xl bg-slate-200 p-3">
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/72 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md">
            <button className="flex h-9 min-w-[82px] flex-col items-center justify-center gap-1 rounded-lg border border-white/75 bg-white/86 px-2 text-[11px] font-medium text-slate-900 shadow-sm">
              <Flame className="size-3.5" />焊缝特征<ChevronDown className="size-3" />
            </button>
            <button className="flex h-9 min-w-[82px] flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-2 text-[11px] font-medium text-slate-500">
              <Sparkles className="size-3.5" />打磨特征<ChevronDown className="size-3" />
            </button>
            <button className="flex h-9 min-w-[82px] flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-2 text-[11px] font-medium text-slate-500">
              <Target className="size-3.5" />装配特征
            </button>
          </div>
          <div className="absolute left-3 top-16 flex h-[300px] w-[280px] flex-col overflow-hidden rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Flame className="size-4 text-orange-500" />
                <span className="text-xs font-medium text-slate-800">焊缝特征提取</span>
              </div>
              <div className="flex items-center gap-1">
                <Minus className="size-3.5 text-slate-400" />
                <X className="size-3.5 text-slate-400" />
              </div>
            </div>
            <div className="min-h-0 flex-1 p-3">
              <div className="space-y-3">
                <div className="space-y-2">
                  {['零件 A', '零件 B'].map((item, index) => (
                    <div key={item} className="ds-label-input-mini">
                      <label className="ds-label-input-mini-label">{item}</label>
                      <div className="h-7 truncate rounded-md border border-slate-200 bg-white/80 px-2 py-1 text-[11px] text-slate-600">
                        {index === 0 ? '0162-01-010101-01' : '0162-01-010101-02'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="h-7 border-orange-200 bg-orange-50 px-2 text-[11px] text-ds-brand-primary-text">
                    <ScanFace className="size-3.5" />
                    选择面
                  </Button>
                  <Button size="sm" className="h-7 px-2 text-[11px]">
                    <Flame className="size-3.5" />
                    生成焊缝
                  </Button>
                </div>
                <FeatureCandidateStatusRowDemo status="pending" value="请点选焊缝段后点击确定创建焊缝特征" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
              <div className="min-w-0 flex-1">
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">清空</Button>
                <Button size="sm" disabled className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400">确定</Button>
              </div>
            </div>
          </div>
          <div className="absolute left-[304px] top-16 flex h-[126px] w-[280px] flex-col overflow-hidden rounded-lg border border-dashed border-white/70 bg-white/48 shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-teal-600" />
                <span className="text-xs font-medium text-slate-800">打磨特征提取</span>
              </div>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-slate-400">切换后显示</span>
            </div>
            <div className="space-y-2 p-3">
              <FeatureCandidateStatusRowDemo status="selected" value="选择打磨后关闭焊缝浮窗，并在同一位置显示打磨内容" />
              <div className="text-[11px] leading-4 text-slate-500">
                坐标转换 / 焊缝 / 打磨 / 装配特征共用互斥规则。
              </div>
            </div>
          </div>
        </div>
        <ModalSource notes={<>浮层容器：w-[280px] + rounded-lg + bg-ds-bg-glass-float + backdrop-blur-md + shadow-black/5；宽度与装配基准提取一致。焊缝浮窗在零件选择下方提供“选择面”和“生成焊缝”。打磨浮窗顶部先选焊缝特征并回显，分割线下方指配零件 A/B，确认后创建两条打磨特征，分别归属于零件 A 和零件 B。底部 footer 使用 border-t + px-3 py-2，与装配基准提取一致；零件不相接提示与清空/确定同处 footer。焊缝/打磨入口已拆分为各自的“自动提取 / 手动提取”下拉，浮窗内部不再展示 tab、特征类型标题、手动点选模式或说明文案。坐标转换、手动焊缝、手动打磨和装配特征提取同一时间只显示一个操作浮窗。</>}>
          3D 视窗浮动工具栏“焊缝提取 / 打磨提取”下拉。
        </ModalSource>
      </DemoCard>

      <DemoCard title="装配基准提取浮窗 / 3D 视窗内浮层">
        <div className="relative h-[380px] rounded-xl bg-slate-200 p-3">
          <div className="absolute left-3 top-3 w-[280px] rounded-lg border border-white/50 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="flex items-center gap-1.5"><Target className="size-4 text-orange-500" /><span className="text-xs font-medium">装配基准提取</span></div>
              <div className="flex items-center gap-1"><Minus className="size-3.5 text-slate-400" /><X className="size-3.5 text-slate-400" /></div>
            </div>
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500">子板</div>
                  <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 shadow-sm">0162-01-010101-02</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500">父板</div>
                  <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 shadow-sm">0162-01-010101-01</div>
                </div>
              </div>
              {[
                { slot: 1, rows: [
                  { index: 1, status: 'selected' as const, value: '02-datum-edge-01', button: '设为子板基准1', selected: true },
                  { index: 2, status: 'selected' as const, value: '01-datum-edge-02', button: '设为父板基准1', selected: true },
                ] },
                { slot: 2, rows: [
                  { index: 3, status: 'pending' as const, value: '请点选子板基准线', button: '设为子板基准2', current: true },
                  { index: 4, status: 'empty' as const, value: '待设置父板基准2', button: '设为父板基准2' },
                ] },
              ].map((group) => (
                <div key={group.slot} className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">装配基准{group.slot}</div>
                  {group.rows.map((row) => (
                    <div
                      key={row.index}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${
                        row.current
                          ? 'border-orange-200 bg-orange-50/80'
                          : row.selected
                            ? 'border-emerald-100 bg-emerald-50/40'
                            : 'border-slate-100 bg-slate-50/65 opacity-70'
                      }`}
                    >
                      <div className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${row.selected ? 'bg-emerald-500 text-white' : row.current ? 'bg-ds-brand-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {row.selected ? <CircleCheck className="size-3.5" /> : row.index}
                      </div>
                      <div className="min-w-0 flex-1">
                        <FeatureCandidateStatusRowDemo status={row.status} value={row.value} surface={false} />
                      </div>
                      <Button size="sm" variant={row.current ? 'default' : 'outline'} className={`h-6 shrink-0 px-2 text-[11px] ${row.current ? 'bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover' : ''}`} disabled={!row.current && !row.selected}>
                        {row.button}
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-slate-400">当前：点选子板基准2</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">清空</Button>
                <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover" disabled>确定</Button>
              </div>
            </div>
          </div>
        </div>
        <ModalSource notes={<>浮层容器：bg-ds-bg-glass-float + backdrop-blur-md + shadow-black/5 + border-white/50；内部下拉选择使用 bg-ds-bg-glass-modal-sidebar；不经过 fullscreen 遮罩，直接定位在 3D 视窗工具浮窗列；零件不相接提示放在 footer 左侧，与清空/确定同处一行；与坐标转换、手动焊缝、手动打磨互斥。</>}>
          3D 视窗浮动工具栏“焊缝提取 / 打磨提取”下拉与“装配基准提取”。
        </ModalSource>
      </DemoCard>

      <DemoCard title="工艺规划日志浮窗 / 3D 视窗内浮层">
        <div className="relative h-[260px] overflow-hidden rounded-xl bg-slate-200 p-3">
          <div className="absolute left-3 top-3 bottom-3 w-[86px] rounded-xl border border-white/65 bg-white/58 shadow-lg shadow-black/5 backdrop-blur-sm" />
          <div className="absolute right-3 top-3 bottom-3 w-[112px] rounded-xl border border-white/60 bg-white/58 shadow-lg shadow-black/5 backdrop-blur-sm" />
          <div className="absolute bottom-3 left-[108px] flex h-[138px] w-[320px] flex-col overflow-hidden rounded-xl border border-white/65 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/55 px-3">
              <span className="text-xs font-medium text-slate-700">打印日志</span>
              <Minus className="size-3.5 text-slate-400" />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-3 py-2 font-mono text-[11px] leading-5 text-slate-600">
              {[
                '[10:42:08] INFO  0162-01-010101 装配体模型加载完成',
                '[10:42:11] INFO  焊缝特征缓存就绪，等待路径生成',
                '[10:42:16] DEBUG  3D视窗相机参数同步完成',
                '[10:42:23] INFO  任务列表配置变更已写入前端状态',
              ].map((line) => (
                <div key={line} className="whitespace-nowrap">{line}</div>
              ))}
            </div>
          </div>
          <button className="absolute left-[108px] top-4 flex h-9 w-[280px] items-center justify-between rounded-xl border border-white/65 bg-ds-bg-glass-float px-3 text-xs font-medium text-slate-600 shadow-lg shadow-black/5 backdrop-blur-md">
            <span>打印日志</span>
            <ChevronUp className="size-3.5 text-slate-400" />
          </button>
        </div>
        <ModalSource notes={<>日志使用工艺规划结构树和任务列表同源的圆角玻璃浮窗，不贴住 3D 视窗底边；展开态为独立浮层，收起态为圆角长条，点击长条重新展开。</>}>
          工艺规划 3D 视窗内日志。
        </ModalSource>
      </DemoCard>

      <DemoCard title="3D 视窗预览遮罩 / 生成结果占位">
        <div className="relative flex h-[220px] items-center justify-center rounded-xl bg-slate-300">
          <div className="absolute inset-0 rounded-xl bg-slate-900/28 backdrop-blur-[2px]" />
          <div className="relative rounded-xl border border-white/40 bg-white/95 px-5 py-4 text-center shadow-lg">
            <div className="text-sm font-medium text-slate-700">3D场景回显定点焊接路径点位</div>
            <div className="mt-1 text-xs text-slate-400">当前为占位示意，待接入真实定点焊接路径模型</div>
            <Button size="sm" variant="outline" className="mt-3 h-7 px-3 text-[11px]">关闭预览</Button>
          </div>
        </div>
        <ModalSource>抓取/放置/翻面压紧/打磨/装配定位/定位焊扫描生成后的 3D 视窗反馈。</ModalSource>
      </DemoCard>
    </div>
  );
}


function GlobalAlertDemo() {
  const { notifyException } = useGlobalAlert();
  const [lastAction, setLastAction] = useState<string>('');

  const handleNotify = () => {
    setLastAction('');
    notifyException({
      key: 'component-lab-wp06-abnormal',
      title: '生产执行异常',
      description: '0162-01-010101(6) 第 06 工序装配视觉异常，等待人工确认。',
      actionText: '查看详情',
      onAction: () => setLastAction('已触发「查看详情」→ 切换到视觉监控'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 text-xs text-slate-400">触发演示</div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={handleNotify} className="h-8 gap-1.5 px-3 text-xs">
            <AlertTriangle className="size-3.5" />
            模拟(6) 异常
          </Button>
          <span className="text-xs text-slate-400">点击后右上角弹出红色异常 Alert，不自动关闭。</span>
        </div>
        {lastAction && (
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{lastAction}</div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs text-slate-400">定位</div>
          <div className="text-sm text-slate-700">固定右上角（topRight），宽度 360px，使用页面内固定提示层。</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs text-slate-400">行为</div>
          <div className="text-sm text-slate-700">duration=0 常驻；点击「查看详情」后自动关闭并触发业务跳转回调。</div>
        </div>
      </div>
    </div>
  );
}

function GlobalAlertDemoWithProvider() {
  return (
    <GlobalAlertProvider>
      <GlobalAlertDemo />
    </GlobalAlertProvider>
  );
}

function ToastCatalogTab() {
  const groups = [
    {
      title: '项目管理部分用到的 Toast',
      items: [
        { type: 'error', text: '项目文件解析失败，导入失败', source: '项目管理顶部“导入”第一次点击。' },
        { type: 'success', text: '项目解析成功，已导入 0163 项目', source: '项目管理顶部“导入”第二次点击。' },
        { type: 'error', text: '图纸解析失败，导入失败', source: '图纸管理弹窗内图纸导入/替换失败。' },
        { type: 'success', text: '解析成功，导入成功', source: '图纸管理弹窗内图纸导入/替换成功。' },
        { type: 'error', text: '请输入装配体名称', source: '新增装配体弹窗确认时名称为空。' },
        { type: 'success', text: '装配体创建成功', source: '项目行右侧新增装配体确认成功。' },
      ],
    },
    {
      title: '工艺规划 / 特征提取 Toast',
      items: [
        { type: 'success', text: '焊缝特征提取完成，已生成 3 条焊缝', source: '3D 视窗浮动工具栏“焊缝提取”下拉的“自动提取”。' },
        { type: 'success', text: '打磨特征提取完成，已生成 5 条打磨线', source: '3D 视窗浮动工具栏“打磨提取”下拉的“自动提取”。' },
        { type: 'error', text: '零件[A]与零件[B]装配基准设置失败：基准线不匹配', source: '装配基准提取浮窗确认失败。' },
        { type: 'success', text: '装配基准设置完成，已生成装配基准特征', source: '装配基准提取浮窗确认成功。' },
        { type: 'success', text: '装配基准特征已批量创建，可一键生成任务', source: '3D 视窗工具栏“装配基准提取”连续点击第二次。' },
        { type: 'error', text: '请先提取打磨特征、焊缝特征、装配基准特征，无法生成任务', source: '任务列表“一键生成任务”前置校验失败。' },
        { type: 'success', text: '已一键生成完整任务列表', source: '任务列表“一键生成任务”成功。' },
        { type: 'success', text: '已完成对任务重新排序', source: '任务列表“重新排序”按钮。' },
        { type: 'success', text: '工艺参数已保存', source: '工艺参数设置弹窗确认保存。' },
      ],
    },
    {
      title: '任务条目 / 路径生成 Toast',
      items: [
        { type: 'success', text: '任务条目已删除', source: '任务条目右键菜单删除并确认。' },
        { type: 'error', text: '请先选择工件模型', source: '抓取/放置/翻面压紧生成位置前未选择工件。' },
        { type: 'error', text: '所选工件不相接，请重新选择', source: '抓取/放置/翻面压紧选择了不相接工件。' },
        { type: 'success', text: '已生成抓取位置', source: '抓取任务条目“生成抓取位置”。' },
        { type: 'success', text: '已生成支撑位置', source: '放置任务条目“生成支撑位置”。' },
        { type: 'success', text: '已生成压紧位置', source: '翻面压紧任务条目“生成压紧位置”。' },
        { type: 'error', text: '请先提取打磨特征', source: '打磨任务条目无可选打磨特征。' },
        { type: 'error', text: '请先选择打磨特征', source: '打磨任务条目未勾选特征。' },
        { type: 'success', text: '已生成打磨路径', source: '打磨任务条目“生成打磨路径”。' },
        { type: 'error', text: '请先提取焊缝特征', source: '定位焊/定位焊扫描任务条目无可选焊缝特征。' },
        { type: 'error', text: '请先选择焊缝特征', source: '定位焊/定位焊扫描任务条目未勾选焊缝特征。' },
        { type: 'success', text: '已生成定点焊接路径', source: '定位焊/定位焊扫描任务条目生成路径。' },
        { type: 'error', text: '请先生成装配基准特征', source: '装配定位任务条目无可选装配基准特征。' },
        { type: 'error', text: '请先选择装配基准特征', source: '装配定位任务条目未选择装配基准特征。' },
        { type: 'success', text: '已生成定位路径', source: '装配定位任务条目“生成定位路径”。' },
        { type: 'success', text: '已应用点位位置更新', source: '点位信息编辑后点击“更新”。' },
      ],
    },
  ] as const;

  return (
    <div className="space-y-6">
      <DemoCard title="Toast 视窗定位">
        <div className="relative h-[168px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <div className="absolute inset-x-0 top-0 h-10 border-b border-white/70 bg-white/76 backdrop-blur-md" />
          <div className="absolute left-1/2 top-14 z-[2000] -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-lg">
              <Sparkles className="size-4 text-emerald-500" />
              <span>已一键生成完整任务列表</span>
            </div>
          </div>
          <div className="absolute left-1/2 top-20 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-white/70 bg-white/80 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md">
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">坐标转换</Button>
            <Button size="sm" variant="outline" className="group h-7 gap-1 px-2 text-[11px]">
              <WeldFeatureIcon className="size-4" />
              <span className="relative block w-16 text-center">
                <span className="block transition-transform duration-150 group-hover:-translate-x-2">焊缝特征</span>
                <ChevronDown className="absolute right-0 top-1/2 size-3 -translate-y-1/2 opacity-0 transition-[opacity,transform] duration-150 group-hover:opacity-100" />
              </span>
            </Button>
            <Button size="sm" variant="outline" className="group h-7 gap-1 px-2 text-[11px]">
              <GrindFeatureIcon className="size-4" />
              <span className="relative block w-16 text-center">
                <span className="block transition-transform duration-150 group-hover:-translate-x-2">打磨特征</span>
                <ChevronDown className="absolute right-0 top-1/2 size-3 -translate-y-1/2 opacity-0 transition-[opacity,transform] duration-150 group-hover:opacity-100" />
              </span>
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
              <AssemblyFeatureIcon className="size-4" />
              装配特征
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-200/70 to-transparent" />
        </div>
        <ModalSource>主页面 Toast 使用 fixed top-14 居中定位，并额外向上偏移自身高度的 1/2，只轻微压到 3D 视窗顶部工具栏上沿；层级使用 z-[2000]，必须高于全屏弹窗、确认弹窗和 portal 浮层。</ModalSource>
      </DemoCard>
      {groups.map((group) => (
        <DemoCard key={group.title} title={group.title}>
          <div className="space-y-2">
            {group.items.map((item) => {
              const isSuccess = item.type === 'success';
              return (
                <div key={`${group.title}-${item.text}`} className="grid gap-3 rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {isSuccess ? <Sparkles className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
                    <span>{isSuccess ? '成功 Toast' : '异常 Toast'}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">{item.text}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">应用出处：{item.source}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </DemoCard>
      ))}
    </div>
  );
}
type TokenColorItem = { name: string; value: string; raw: string; use: string };
type TokenScaleItem = { name: string; value: string; raw: string; use: string };
type RawColorItem = { name: string; value: string; source: string };
type RawScaleItem = { name: string; px: string; rem?: string; alias?: string; source: string };
type ComponentTokenItem = { component: string; token: string; reference: string; resolved: string; use: string };

const tokenLayerSummaries = [
  {
    title: 'Raw Tokens',
    path: 'design-tokens/source/*.tokens.json',
    purpose: '保留 Figma / shadcn / 当前 UI 推导出的原始材料，不直接表达业务语义。',
    consume: '用于追溯事实来源，通常不被业务组件直接引用。',
  },
  {
    title: 'Semantic Tokens',
    path: 'design-tokens/semantic/semantic-tokens.json',
    purpose: '把 raw token 转成 UI 语义，例如页面背景、主文字、默认边框、状态色。',
    consume: '新基础组件和后续迁移优先引用这一层。',
  },
  {
    title: 'Component Tokens',
    path: 'design-tokens/component/*.tokens.json',
    purpose: '把 semantic token 收敛成组件级规则，例如 Button 高度、Input 边框、Modal 阴影。',
    consume: '后续给基础组件接 token 时，以这一层作为组件视觉契约。',
  },
];

const rawColorGroups: { title: string; items: RawColorItem[] }[] = [
  {
    title: 'Current / Brand RoboticsAi',
    items: [
      { name: 'brand-RoboticsAi.50', value: '#FFF7ED', source: 'colors.current' },
      { name: 'brand-RoboticsAi.100', value: '#FFEDD5', source: 'colors.current' },
      { name: 'brand-RoboticsAi.200', value: '#FED7AA', source: 'colors.current' },
      { name: 'brand-RoboticsAi.300', value: '#FFD591', source: 'colors.current' },
      { name: 'brand-RoboticsAi.400', value: '#FFC069', source: 'colors.current' },
      { name: 'brand-RoboticsAi.500', value: '#FFA940', source: 'colors.current' },
      { name: 'brand-RoboticsAi.600', value: '#FF6900', source: 'colors.current' },
      { name: 'brand-RoboticsAi.700', value: '#E85D00', source: 'colors.current' },
      { name: 'brand-RoboticsAi.800', value: '#D46B08', source: 'colors.current' },
    ],
  },
  {
    title: 'Current / Neutral Slate',
    items: [
      { name: 'slate.50', value: '#F8FAFC', source: 'colors.current' },
      { name: 'slate.100', value: '#F1F5F9', source: 'colors.current' },
      { name: 'slate.200', value: '#E2E8F0', source: 'colors.current' },
      { name: 'slate.300', value: '#CBD5E1', source: 'colors.current' },
      { name: 'slate.400', value: '#94A3B8', source: 'colors.current' },
      { name: 'slate.500', value: '#64748B', source: 'colors.current' },
      { name: 'slate.600', value: '#475569', source: 'colors.current' },
      { name: 'slate.700', value: '#334155', source: 'colors.current' },
      { name: 'slate.800', value: '#1E293B', source: 'colors.current' },
      { name: 'slate.900', value: '#0F172A', source: 'colors.current' },
    ],
  },
  {
    title: 'Current / Neutral Zinc',
    items: [
      { name: 'zinc.50', value: '#FAFAFA', source: 'colors.current' },
      { name: 'zinc.100', value: '#F4F4F5', source: 'colors.current' },
      { name: 'zinc.200', value: '#E4E4E7', source: 'colors.current' },
      { name: 'zinc.300', value: '#D4D4D8', source: 'colors.current' },
      { name: 'zinc.400', value: '#A1A1AA', source: 'colors.current' },
      { name: 'zinc.500', value: '#71717A', source: 'colors.current' },
      { name: 'zinc.600', value: '#52525B', source: 'colors.current' },
      { name: 'zinc.700', value: '#3F3F46', source: 'colors.current' },
      { name: 'zinc.800', value: '#27272A', source: 'colors.current' },
      { name: 'zinc.900', value: '#18181B', source: 'colors.current' },
    ],
  },
  {
    title: 'Current / Status And Feature Anchors',
    items: [
      { name: 'red.50', value: '#FEF2F2', source: 'colors.current' },
      { name: 'red.500', value: '#EF4444', source: 'colors.current' },
      { name: 'red.600', value: '#DC2626', source: 'colors.current' },
      { name: 'red.700', value: '#B91C1C', source: 'colors.current' },
      { name: 'amber.50', value: '#FFFBEB', source: 'colors.current' },
      { name: 'amber.500', value: '#F59E0B', source: 'colors.current' },
      { name: 'amber.700', value: '#B45309', source: 'colors.current' },
      { name: 'emerald.50', value: '#ECFDF5', source: 'colors.current' },
      { name: 'emerald.500', value: '#10B981', source: 'colors.current' },
      { name: 'emerald.700', value: '#047857', source: 'colors.current' },
      { name: 'blue.50', value: '#EFF6FF', source: 'colors.current' },
      { name: 'blue.500', value: '#3B82F6', source: 'colors.current' },
      { name: 'blue.600', value: '#2563EB', source: 'colors.current' },
      { name: 'teal.600', value: '#0D9488', source: 'colors.current' },
    ],
  },
];

const rawSpacingItems: RawScaleItem[] = [
  { name: 'raw.space.0', px: '0px', rem: '0rem', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.025', px: '2px', rem: '0.125rem', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.050', px: '4px', rem: '0.25rem', alias: 'Spacing.xs', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.075', px: '6px', rem: '0.375rem', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.100', px: '8px', rem: '0.5rem', alias: 'Spacing.sm', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.150', px: '12px', rem: '0.75rem', alias: 'Spacing.md', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.200', px: '16px', rem: '1rem', alias: 'Spacing.lg', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.250', px: '20px', rem: '1.25rem', alias: 'Spacing.xl', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.300', px: '24px', rem: '1.5rem', alias: 'Spacing.2xl', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.400', px: '32px', rem: '2rem', alias: 'Spacing.3xl', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.500', px: '40px', rem: '2.5rem', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.600', px: '48px', rem: '3rem', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.800', px: '64px', rem: '4rem', source: 'spacing.pixels / spacing.rem' },
  { name: 'raw.space.1000', px: '80px', rem: '5rem', source: 'spacing.pixels / spacing.rem' },
];

const rawRadiusItems: TokenScaleItem[] = [
  { name: 'rounded-none', value: '0px', raw: 'radius.shadcn', use: 'shadcn 原始圆角' },
  { name: 'Radius.sm / rounded-sm', value: '4px', raw: 'radius.default / radius.shadcn', use: 'RobimWeld + shadcn 共同值' },
  { name: 'rounded-md', value: '6px', raw: 'radius.shadcn', use: 'shadcn 紧凑圆角' },
  { name: 'Radius.md / rounded-lg', value: '8px', raw: 'radius.default / radius.shadcn', use: '当前输入框和常规控件高频值' },
  { name: 'radius', value: '10px', raw: 'radius.shadcn', use: 'shadcn 原始默认值，暂不进入语义主 scale' },
  { name: 'Radius.lg', value: '12px', raw: 'radius.default', use: '面板、灰底容器' },
  { name: 'Radius.xl', value: '16px', raw: 'radius.default', use: '宽松大面板、特殊展示弹窗' },
  { name: 'rounded-full', value: '9999px', raw: 'radius.shadcn', use: 'badge、pill' },
];

const tokenColorGroups: { title: string; items: TokenColorItem[] }[] = [
  {
    title: 'Background',
    items: [
      { name: 'color.bg.page', value: '#F8FAFC', raw: 'slate.50', use: '页面背景' },
      { name: 'color.bg.surface', value: '#FFFFFF', raw: 'white', use: '普通表面、输入框' },
      { name: 'color.bg.subtle', value: '#F1F5F9', raw: 'slate.100', use: '次级灰底区域' },
      { name: 'color.bg.segmented', value: '#F4F4F5', raw: 'zinc.100', use: '分段控件未选中底色' },
      { name: 'color.bg.muted', value: '#E2E8F0', raw: 'slate.200', use: '禁用、弱背景' },
      { name: 'color.bg.glass', value: 'rgba(255,255,255,0.72)', raw: 'custom rgba', use: '3D 工具条、通用玻璃背景' },
      { name: 'color.bg.glass-modal', value: 'rgba(255,255,255,0.75)', raw: 'white alpha 0.75', use: '全屏玻璃弹窗底色' },
      { name: 'color.bg.glass-modal-sidebar', value: 'rgba(255,255,255,0.45)', raw: 'white alpha 0.45', use: '弹窗内左侧边栏/列表分区' },
      { name: 'color.bg.glass-float', value: 'rgba(255,255,255,0.80)', raw: 'white alpha 0.80', use: '3D 视窗内玻璃浮层' },
    ],
  },
  {
    title: 'Text',
    items: [
      { name: 'color.text.primary', value: '#0F172A', raw: 'slate.900', use: '主标题、正文重点' },
      { name: 'color.text.secondary', value: '#334155', raw: 'slate.700', use: '常规正文' },
      { name: 'color.text.muted', value: '#64748B', raw: 'slate.500', use: '辅助说明' },
      { name: 'color.text.disabled', value: '#A1A1AA', raw: 'zinc.400', use: '禁用文字、弱控件图标' },
      { name: 'color.text.inverse', value: '#FFFFFF', raw: 'white', use: '深色/品牌底文字' },
    ],
  },
  {
    title: 'Border',
    items: [
      { name: 'color.border.subtle', value: '#F1F5F9', raw: 'slate.100', use: '极弱分割线' },
      { name: 'color.border.default', value: '#E2E8F0', raw: 'slate.200', use: '常规 stroke' },
      { name: 'color.border.strong', value: '#CBD5E1', raw: 'slate.300', use: '强 stroke' },
      { name: 'color.border.focus', value: '#FFD591', raw: 'brand-RoboticsAi.300', use: 'focus / active stroke' },
      { name: 'color.border.glass', value: 'rgba(255,255,255,0.68)', raw: 'custom rgba', use: '玻璃弹窗 stroke' },
    ],
  },
  {
    title: 'Brand / Status / Feature',
    items: [
      { name: 'color.brand.primary', value: '#FF6900', raw: 'custom.brand.primary', use: '主按钮、主操作' },
      { name: 'color.brand.primaryHover', value: '#E85D00', raw: 'custom.brand.primaryHover', use: 'hover / active' },
      { name: 'color.brand.primarySubtle', value: '#FFF7ED', raw: 'brand-RoboticsAi.50', use: '品牌浅底' },
      { name: 'color.brand.primaryText', value: '#C2410C', raw: 'custom.brand.primaryText', use: '白底小字号品牌文字' },
      { name: 'color.status.danger', value: '#EF4444', raw: 'red.500', use: '错误、异常 stroke' },
      { name: 'color.status.warning', value: '#F59E0B', raw: 'amber.500', use: 'warning、脏状态' },
      { name: 'color.status.success', value: '#10B981', raw: 'emerald.500', use: '成功状态' },
      { name: 'color.status.info', value: '#3B82F6', raw: 'blue.500', use: '信息状态' },
      { name: 'color.feature.grind', value: '#0D9488', raw: 'teal.600', use: '打磨可视化标记' },
      { name: 'color.feature.weld', value: '#DC2626', raw: 'red.600', use: '焊接可视化标记' },
      { name: 'color.feature.datum', value: '#2563EB', raw: 'blue.600', use: '装配基准可视化标记' },
    ],
  },
];

const tokenSpacingItems: TokenScaleItem[] = [
  { name: 'space.0', value: '0px', raw: 'raw.space.0', use: '无间距' },
  { name: 'space.025', value: '2px', raw: 'raw.space.025', use: '细微偏移、hair gap' },
  { name: 'space.050', value: '4px', raw: 'raw.space.050', use: '图标文字小间距' },
  { name: 'space.075', value: '6px', raw: 'raw.space.075', use: '紧凑控件内部 gap' },
  { name: 'space.100', value: '8px', raw: 'raw.space.100', use: '按钮、chip、行内 gap' },
  { name: 'space.150', value: '12px', raw: 'raw.space.150', use: '卡片内边距、表单组 gap' },
  { name: 'space.200', value: '16px', raw: 'raw.space.200', use: '面板内边距' },
  { name: 'space.250', value: '20px', raw: 'raw.space.250', use: '较大区块间距' },
  { name: 'space.300', value: '24px', raw: 'raw.space.300', use: '页面模块间距' },
  { name: 'space.400', value: '32px', raw: 'raw.space.400', use: '大模块间距' },
  { name: 'space.500', value: '40px', raw: 'raw.space.500', use: '宽松布局' },
  { name: 'space.600', value: '48px', raw: 'raw.space.600', use: '页面级留白' },
  { name: 'space.800', value: '64px', raw: 'raw.space.800', use: '大页面留白' },
  { name: 'space.1000', value: '80px', raw: 'raw.space.1000', use: '极大页面留白' },
];

const tokenRadiusItems: TokenScaleItem[] = [
  { name: 'radius.none', value: '0px', raw: 'rounded-none', use: '无圆角' },
  { name: 'radius.sm', value: '4px', raw: 'Radius.sm / rounded-sm', use: '小控件、树节点内层' },
  { name: 'radius.md', value: '6px', raw: 'rounded-md', use: '按钮、紧凑控件' },
  { name: 'radius.lg', value: '8px', raw: 'Radius.md / rounded-lg', use: '输入框、常规控件、密集玻璃弹窗外壳' },
  { name: 'radius.xl', value: '12px', raw: 'Radius.lg', use: '面板、灰底容器' },
  { name: 'radius.2xl', value: '16px', raw: 'Radius.xl', use: '宽松大面板、特殊展示弹窗' },
  { name: 'radius.full', value: '9999px', raw: 'rounded-full', use: 'badge、pill' },
];


const tokenControlHeightItems: TokenScaleItem[] = [
  { name: 'height.control.xs', value: '24px', raw: 'global', use: 'Toolbar tiny action / compact controls' },
  { name: 'height.control.sm', value: '28px', raw: 'global', use: 'Button sm / compact toolbar button' },
  { name: 'height.control.md', value: '32px', raw: 'global', use: 'Input md / TreeRow / default compact form control' },
  { name: 'height.control.lg', value: '36px', raw: 'global', use: 'Button md-lg / prominent form control' },
  { name: 'height.control.xl', value: '40px', raw: 'global', use: 'Large input / primary action in spacious layouts' },
];

const tokenShadowItems: TokenScaleItem[] = [
  { name: 'shadow.none', value: 'none', raw: 'global', use: '扁平控件、无浮层' },
  { name: 'shadow.sm', value: '0 1px 2px rgba(15,23,42,0.06)', raw: 'global', use: '轻量按钮、chip、输入浮起' },
  { name: 'shadow.md', value: '0 8px 24px rgba(15,23,42,0.08)', raw: 'global', use: 'Card / Panel' },
  { name: 'shadow.overlay', value: '0 20px 60px rgba(15,23,42,0.18)', raw: 'global', use: 'Modal / Dropdown / Overlay' },
  { name: 'shadow.mainNav', value: '0 8px 24px rgba(15,23,42,0.07)', raw: 'global', use: '主导航浮层' },
  { name: 'shadow.mainNavImmersive', value: '0px 2px 8px 0px rgba(0,0,0,0.12)', raw: 'global', use: '样式 C 主导航轻投影' },
  { name: 'shadow.processToolbar', value: 'none', raw: 'global', use: '样式 C 工艺规划顶部工具栏' },
  { name: 'shadow.mainNavActive', value: '0 1px 2px rgba(15,23,42,0.08)', raw: 'global', use: '主导航选中项' },
  { name: 'shadow.scrollEdgeBottom', value: 'inset 0 -2px 3px -1px rgba(0,0,0,0.04)', raw: 'global', use: '滚动容器底部结束/裁切提示' },
  { name: 'shadow.stickyOverlap', value: '0 2px 4px rgba(0,0,0,0.06)', raw: 'global', use: 'sticky 标题行遮挡内容时的浮层阴影' },
];

const tokenStrokeItems: TokenScaleItem[] = [
  { name: 'stroke.default', value: '1px', raw: 'global', use: '默认 border / control stroke' },
  { name: 'stroke.strong', value: '2px', raw: 'global', use: '强调描边、图形选中态、可视化线条' },
];

const tokenMotionItems: TokenScaleItem[] = [
  { name: 'motion.duration.fast', value: '100ms', raw: 'global', use: '按钮 hover、短反馈' },
  { name: 'motion.duration.normal', value: '200ms', raw: 'global', use: '下拉、弹窗、折叠展开' },
  { name: 'motion.easing.standard', value: 'cubic-bezier(0.645,0.045,0.355,1)', raw: 'Ant Design ease-in-out family', use: '常规状态切换' },
  { name: 'motion.easing.emphasized', value: 'cubic-bezier(0.215,0.61,0.355,1)', raw: 'Ant Design ease-out family', use: '弹窗/浮层出现' },
];

const tokenTypographyItems = [
  { name: 'typography.pageTitle', size: '16px', lineHeight: '24px', weight: '600', use: '页面标题' },
  { name: 'typography.panelTitle', size: '14px', lineHeight: '20px', weight: '600', use: '面板标题' },
  { name: 'typography.sectionTitle', size: '14px', lineHeight: '20px', weight: '500', use: '区块标题' },
  { name: 'typography.body', size: '14px', lineHeight: '20px', weight: '400', use: '正文' },
  { name: 'typography.label', size: '12px', lineHeight: '16px', weight: '500', use: '表单 label' },
  { name: 'typography.productionProcessTask', size: '12px', lineHeight: '16px', weight: '500', use: '生产任务栏与新建任务预览的工序名称' },
  { name: 'typography.helper', size: '11px', lineHeight: '16px', weight: '400', use: '辅助说明' },
  { name: 'typography.micro', size: '10px', lineHeight: '14px', weight: '500', use: 'badge、极小标签' },
  { name: 'typography.inputSm', size: '12px', lineHeight: '16px', weight: '400', use: '小输入框' },
  { name: 'typography.inputMd', size: '14px', lineHeight: '20px', weight: '400', use: '常规输入框' },
];

const componentTokenItems: ComponentTokenItem[] = [
  { component: 'Button', token: 'button.height.sm', reference: 'height.control.sm', resolved: '28px', use: '小按钮 / 工具按钮' },
  { component: 'Button', token: 'button.height.md', reference: 'height.control.lg', resolved: '36px', use: '常规主操作按钮' },
  { component: 'Button', token: 'button.height.icon', reference: 'height.control.sm', resolved: '28px', use: '纯图标按钮' },
  { component: 'Button', token: 'button.radius.default', reference: 'radius.lg', resolved: '8px', use: '按钮默认圆角' },
  { component: 'Button', token: 'button.paddingX.sm', reference: 'space.150', resolved: '12px', use: '小按钮横向 padding' },
  { component: 'Button', token: 'button.paddingX.md', reference: 'space.200', resolved: '16px', use: '常规按钮横向 padding' },
  { component: 'Button', token: 'button.bg.primary', reference: 'color.brand.primary', resolved: '#FF6900', use: '主按钮底色' },
  { component: 'Button', token: 'button.bg.primaryHover', reference: 'color.brand.primaryHover', resolved: '#E85D00', use: '主按钮 hover' },
  { component: 'Button', token: 'button.text.primary', reference: 'color.text.inverse', resolved: '#FFFFFF', use: '主按钮文字' },
  { component: 'Button', token: 'button.border.secondary', reference: 'color.border.default', resolved: '#E2E8F0', use: '次级按钮描边' },
  { component: 'Button', token: 'button.border.brandOutline', reference: 'stroke.strong + color.brand.primary', resolved: '2px / #FF6900', use: '无底重点色描边按钮' },
  { component: 'Input', token: 'input.height.sm', reference: 'height.control.sm', resolved: '28px', use: '紧凑数字输入' },
  { component: 'Input', token: 'input.height.md', reference: 'height.control.md', resolved: '32px', use: '常规表单输入' },
  { component: 'Input', token: 'input.height.lg', reference: 'height.control.lg', resolved: '36px', use: '宽松表单输入' },
  { component: 'Input', token: 'input.radius.default', reference: 'radius.lg', resolved: '8px', use: '输入框圆角' },
  { component: 'Input', token: 'input.bg.default', reference: 'color.bg.surface', resolved: '#FFFFFF', use: '输入框底色' },
  { component: 'Input', token: 'input.bg.disabled', reference: 'color.bg.controlDisabled', resolved: '#F4F4F5', use: '置灰输入框底色' },
  { component: 'Input', token: 'input.bg.invalid', reference: 'color.status.dangerSubtle', resolved: '#FEF2F2', use: '异常输入框底色' },
  { component: 'Input', token: 'input.border.default', reference: 'color.border.default', resolved: '#E2E8F0', use: '默认描边' },
  { component: 'Input', token: 'input.border.focus', reference: 'color.border.focus', resolved: '#FFD591', use: '聚焦描边' },
  { component: 'Input', token: 'input.border.invalid', reference: 'color.status.danger', resolved: '#EF4444', use: '异常描边' },
  { component: 'Input', token: 'input.unitGap.sm', reference: 'space.050', resolved: '4px', use: '小输入单位间距' },
  { component: 'Input', token: 'input.unitGap.md', reference: 'space.075', resolved: '6px', use: '常规输入单位间距' },
  { component: 'Checkbox', token: 'checkbox.size.sm', reference: 'custom/component', resolved: '16px', use: '下拉列表、树节点内勾选' },
  { component: 'Checkbox', token: 'checkbox.size.md', reference: 'custom/component', resolved: '20px', use: '普通表单勾选' },
  { component: 'Checkbox', token: 'checkbox.radius.default', reference: 'radius.sm', resolved: '4px', use: '勾选框圆角' },
  { component: 'Checkbox', token: 'checkbox.bg.unchecked', reference: 'color.bg.surface', resolved: '#FFFFFF', use: '未选底色' },
  { component: 'Checkbox', token: 'checkbox.bg.checked', reference: 'color.brand.primary', resolved: '#FF6900', use: '选中底色' },
  { component: 'Checkbox', token: 'checkbox.bg.indeterminate', reference: 'color.brand.primary', resolved: '#FF6900', use: '半选底色' },
  { component: 'Checkbox', token: 'checkbox.bg.disabled', reference: 'color.bg.subtle', resolved: '#F1F5F9', use: '置灰底色' },
  { component: 'Checkbox', token: 'checkbox.bg.invalid', reference: 'color.status.dangerSubtle', resolved: '#FEF2F2', use: '异常底色' },
  { component: 'Checkbox', token: 'checkbox.border.unchecked', reference: 'color.border.default', resolved: '#E2E8F0', use: '未选描边' },
  { component: 'Checkbox', token: 'checkbox.border.checked', reference: 'color.brand.primary', resolved: '#FF6900', use: '选中描边' },
  { component: 'Checkbox', token: 'checkbox.border.focus', reference: 'color.border.focus', resolved: '#FFD591', use: '聚焦描边' },
  { component: 'Checkbox', token: 'checkbox.border.invalid', reference: 'color.status.danger', resolved: '#EF4444', use: '异常描边' },
  { component: 'Checkbox', token: 'checkbox.icon.checked', reference: 'color.text.inverse', resolved: '#FFFFFF', use: '选中图标' },
  { component: 'Checkbox', token: 'checkbox.icon.size.sm', reference: 'custom/component', resolved: '12px', use: '小尺寸图标' },
  { component: 'Checkbox', token: 'checkbox.icon.size.md', reference: 'custom/component', resolved: '14px', use: '常规图标' },
  { component: 'Checkbox', token: 'checkbox.shadow.checked', reference: 'shadow.sm', resolved: '0 1px 2px rgba(15, 23, 42, 0.06)', use: '选中阴影' },
  { component: 'Panel', token: 'panel.bg.default', reference: 'color.bg.surface', resolved: '#FFFFFF', use: '普通面板底色' },
  { component: 'Panel', token: 'panel.bg.subtle', reference: 'color.bg.subtle', resolved: '#F1F5F9', use: '弱分区面板底色' },
  { component: 'Panel', token: 'panel.radius.default', reference: 'radius.xl', resolved: '12px', use: '参数面板圆角' },
  { component: 'Panel', token: 'panel.border.default', reference: 'color.border.default', resolved: '#E2E8F0', use: '面板默认描边' },
  { component: 'Panel', token: 'panel.padding.default', reference: 'space.150', resolved: '12px', use: '紧凑面板内边距' },
  { component: 'Panel', token: 'panel.padding.spacious', reference: 'space.200', resolved: '16px', use: '宽松面板内边距' },
  { component: 'Panel', token: 'panel.shadow.default', reference: 'shadow.md', resolved: '0 8px 24px rgba(15, 23, 42, 0.08)', use: '面板浮起阴影' },
  { component: 'Panel', token: 'panel.bg.parameterCard', reference: 'color.bg.surface alpha', resolved: 'rgba(255, 255, 255, 0.72)', use: '工艺参数弹窗内容卡片' },
  { component: 'Panel', token: 'panel.shadow.mainNav', reference: 'shadow.mainNav', resolved: '0 8px 24px rgba(15, 23, 42, 0.07)', use: '主导航容器阴影' },
  { component: 'Panel', token: 'panel.shadow.mainNavImmersive', reference: 'shadow.mainNavImmersive', resolved: '0px 2px 8px 0px rgba(0, 0, 0, 0.12)', use: '样式 C 主导航轻投影' },
  { component: 'Panel', token: 'panel.shadow.processToolbar', reference: 'shadow.processToolbar', resolved: 'none', use: '样式 C 工艺规划顶部工具栏' },
  { component: 'Panel', token: 'panel.shadow.scrollEdgeBottom', reference: 'shadow.scrollEdgeBottom', resolved: 'inset 0 -2px 3px -1px rgba(0, 0, 0, 0.04)', use: '滚动面板底部结束提示' },
  { component: 'Panel', token: 'panel.shadow.stickyOverlap', reference: 'shadow.stickyOverlap', resolved: '0 2px 4px rgba(0, 0, 0, 0.06)', use: 'sticky 标题遮挡内容时的层级提示' },
  { component: 'Panel', token: 'panel.bg.stickyOverlap', reference: 'color.bg.sticky-overlap', resolved: 'rgba(250, 250, 250, 0.50)', use: '数据密集面板 sticky 标题遮挡态底色' },
  { component: 'Panel', token: 'panel.blur.stickyOverlap', reference: 'blur.stickyOverlap', resolved: '24px', use: 'sticky 标题遮挡态背景模糊' },
  { component: 'Tree', token: 'tree.row.height.default', reference: 'height.control.md', resolved: '32px', use: '树节点默认行高' },
  { component: 'Tree', token: 'tree.row.radius.default', reference: 'radius.md', resolved: '6px', use: '树节点圆角' },
  { component: 'Tree', token: 'tree.row.bg.hover', reference: 'color.bg.subtle', resolved: '#F1F5F9', use: '树节点 hover 底色' },
  { component: 'Tree', token: 'tree.row.bg.active', reference: 'color.brand.primarySubtle', resolved: '#FFF7ED', use: '树节点选中底色' },
  { component: 'Tree', token: 'tree.row.text.default', reference: 'color.text.secondary', resolved: '#334155', use: '树节点默认文字' },
  { component: 'Tree', token: 'tree.row.text.active', reference: 'color.text.primary', resolved: '#0F172A', use: '树节点选中文字' },
  { component: 'Modal', token: 'modal.bg.default', reference: 'color.bg.glass-modal', resolved: 'rgba(255, 255, 255, 0.75)', use: '全屏玻璃弹窗底色' },
  { component: 'Modal', token: 'modal.bg.sidebar', reference: 'color.bg.glass-modal-sidebar', resolved: 'rgba(255, 255, 255, 0.45)', use: '弹窗内左侧边栏/列表分区' },
  { component: 'Modal', token: 'modal.bg.float', reference: 'color.bg.glass-float', resolved: 'rgba(255, 255, 255, 0.80)', use: '3D 视窗内玻璃浮层' },
  { component: 'Modal', token: 'modal.border.default', reference: 'color.border.glass', resolved: 'rgba(255, 255, 255, 0.68)', use: '玻璃弹窗描边' },
  { component: 'Modal', token: 'modal.radius.default', reference: 'radius.lg', resolved: '8px', use: '密集玻璃弹窗圆角' },
  { component: 'Modal', token: 'modal.shadow.default', reference: 'shadow.overlay', resolved: '0 20px 60px rgba(15, 23, 42, 0.18)', use: '浮层阴影' },
  { component: 'Modal', token: 'modal.padding.default', reference: 'space.300', resolved: '24px', use: '弹窗内容内边距' },
  { component: 'Modal', token: 'modal.backdrop.default', reference: 'custom rgba', resolved: 'rgba(15, 23, 42, 0.22)', use: '弹窗遮罩' },
];

const componentTokenGroups = ['Button', 'Input', 'Checkbox', 'Panel', 'Tree', 'Modal'].map((component) => ({
  component,
  items: componentTokenItems.filter((item) => item.component === component),
}));

function TokenLayerHeading({ label, title, children }: { label: string; title: string; children: string }) {
  return (
    <div className="space-y-1">
      <div className="font-mono text-[11px] font-medium uppercase tracking-wide text-ds-brand-primary-text">{label}</div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <div className="max-w-3xl text-xs leading-5 text-slate-500">{children}</div>
    </div>
  );
}

function TokenCatalogTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white px-4 py-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-slate-900">Design Token 打印页</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">
          来源：design-tokens/semantic/semantic-tokens.json 与 design-tokens/component/*.tokens.json。当前只用于确认 token 命名与映射，不做 UI 样式收敛。
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {tokenLayerSummaries.map((item) => (
          <div key={item.title} className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
            <div className="font-mono text-[11px] text-ds-brand-primary-text">{item.path}</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{item.title}</div>
            <div className="mt-2 text-xs leading-5 text-slate-500">{item.purpose}</div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">{item.consume}</div>
          </div>
        ))}
      </div>

      <TokenLayerHeading label="Layer 1" title="Raw Tokens">
        这一层只展示原始 token 事实来源，包括当前主色板、spacing 的 px/rem 对照、radius 的 default/shadcn 对照，以及从现有 UI 固化出的 typography 原始层级。
      </TokenLayerHeading>

      <DemoCard title="Raw Tokens / Colors">
        <div className="space-y-5">
          {rawColorGroups.map((group) => (
            <div key={group.title}>
              <div className="mb-2 text-xs font-medium text-slate-500">{group.title}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-2">
                    <span className="size-7 shrink-0 rounded-md border border-slate-200" style={{ background: item.value }} />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[11px] text-slate-700">{item.name}</span>
                      <span className="block font-mono text-[10px] text-slate-400">{item.value} / {item.source}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Raw Tokens / Spacing">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[150px_90px_90px_120px_minmax(220px,1fr)_160px] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
            <div>Raw token</div>
            <div>px</div>
            <div>rem</div>
            <div>Alias</div>
            <div>Preview</div>
            <div>Source</div>
          </div>
          <div className="divide-y divide-slate-100">
            {rawSpacingItems.map((item) => (
              <div key={item.name} className="grid grid-cols-[150px_90px_90px_120px_minmax(220px,1fr)_160px] items-center px-3 py-3 text-xs">
                <div className="font-mono text-slate-700">{item.name}</div>
                <div className="font-mono text-slate-500">{item.px}</div>
                <div className="font-mono text-slate-500">{item.rem}</div>
                <div className="font-mono text-slate-400">{item.alias ?? '-'}</div>
                <div className="flex items-center gap-2">
                  <span className="h-3 rounded-full bg-slate-300" style={{ width: item.px }} />
                  <span className="text-[11px] text-slate-400">{item.px}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">{item.source}</div>
              </div>
            ))}
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Raw Tokens / Radius">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rawRadiusItems.map((item) => (
            <div key={item.name} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs text-slate-700">{item.name}</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-400">{item.raw} / {item.value}</div>
                </div>
                <div className="size-12 border border-slate-300 bg-slate-50" style={{ borderRadius: item.value }} />
              </div>
              <div className="mt-2 text-xs text-slate-500">{item.use}</div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Raw Tokens / Typography">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
          当前没有独立 Figma typography 导出，`source/typography.tokens.json` 来自现有 UI 与文档推导。下一次设计导出包含字体变量后，应把这里从推导层升级为真实 raw source。
        </div>
      </DemoCard>

      <TokenLayerHeading label="Layer 2" title="Semantic Tokens">
        这一层把 raw token 映射成 UI 语义，是后续业务 UI 和基础组件优先读取的命名层。
      </TokenLayerHeading>

      {tokenColorGroups.map((group) => (
        <DemoCard key={group.title} title={'Color / ' + group.title}>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <div className="grid grid-cols-[180px_160px_150px_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
              <div>Semantic token</div>
              <div>Preview / Resolved</div>
              <div>Raw source</div>
              <div>Usage</div>
            </div>
            <div className="divide-y divide-slate-100">
              {group.items.map((item) => (
                <div key={item.name} className="grid grid-cols-[180px_160px_150px_minmax(0,1fr)] items-center px-3 py-3 text-xs">
                  <div className="font-mono text-slate-700">{item.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-md border border-slate-200" style={{ background: item.value }} />
                    <span className="font-mono text-slate-500">{item.value}</span>
                  </div>
                  <div className="font-mono text-slate-400">{item.raw}</div>
                  <div className="text-slate-500">{item.use}</div>
                </div>
              ))}
            </div>
          </div>
        </DemoCard>
      ))}

      <DemoCard title="Spacing Scale">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[140px_100px_150px_minmax(220px,1fr)_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
            <div>Semantic token</div>
            <div>Value</div>
            <div>Raw source</div>
            <div>Preview</div>
            <div>Usage</div>
          </div>
          <div className="divide-y divide-slate-100">
            {tokenSpacingItems.map((item) => (
              <div key={item.name} className="grid grid-cols-[140px_100px_150px_minmax(220px,1fr)_minmax(0,1fr)] items-center px-3 py-3 text-xs">
                <div className="font-mono text-slate-700">{item.name}</div>
                <div className="font-mono text-slate-500">{item.value}</div>
                <div className="font-mono text-slate-400">{item.raw}</div>
                <div className="flex items-center gap-2">
                  <span className="h-3 rounded-full bg-orange-400" style={{ width: item.value }} />
                  <span className="text-[11px] text-slate-400">{item.value}</span>
                </div>
                <div className="text-slate-500">{item.use}</div>
              </div>
            ))}
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Radius Scale">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tokenRadiusItems.map((item) => (
            <div key={item.name} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-slate-700">{item.name}</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-400">{item.raw} / {item.value}</div>
                </div>
                <div className="size-12 border border-orange-200 bg-orange-50" style={{ borderRadius: item.value }} />
              </div>
              <div className="mt-2 text-xs text-slate-500">{item.use}</div>
            </div>
          ))}
        </div>
      </DemoCard>



      <DemoCard title="Control Height Scale">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[190px_90px_minmax(220px,1fr)_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
            <div>Semantic token</div>
            <div>Value</div>
            <div>Preview</div>
            <div>Recommended use</div>
          </div>
          <div className="divide-y divide-slate-100">
            {tokenControlHeightItems.map((item) => (
              <div key={item.name} className="grid grid-cols-[190px_90px_minmax(220px,1fr)_minmax(0,1fr)] items-center px-3 py-3 text-xs">
                <div className="font-mono text-slate-700">{item.name}</div>
                <div className="font-mono text-slate-500">{item.value}</div>
                <div className="flex items-center gap-2">
                  <span className="w-28 rounded-md border border-orange-200 bg-orange-50" style={{ height: item.value }} />
                  <span className="text-[11px] text-slate-400">{item.value}</span>
                </div>
                <div className="text-slate-500">{item.use}</div>
              </div>
            ))}
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Shadow Scale">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tokenShadowItems.map((item) => (
            <div key={item.name} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="h-20 rounded-xl border border-slate-100 bg-white" style={{ boxShadow: item.value }} />
              <div className="mt-3 font-mono text-xs text-slate-700">{item.name}</div>
              <div className="mt-1 text-[11px] leading-4 text-slate-400">{item.value}</div>
              <div className="mt-2 text-xs text-slate-500">{item.use}</div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="阴影应用方式 / Directional Shadow Usage">
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="relative h-36 overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
              <div className="p-3">
                <div className="mb-2 h-4 w-24 rounded bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-end bg-white/88 px-3 shadow-ds-footer-up backdrop-blur-md">
                <div className="h-6 w-14 rounded-md bg-ds-brand-primary" />
              </div>
            </div>
            <div className="mt-3 font-mono text-[11px] text-slate-700">shadow-ds-footer-up</div>
            <div className="mt-1 text-xs text-slate-500">用于任务列表下端操作条、工艺参数 footer：外投影向上压内容，不加顶部 stroke。</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="relative h-36 overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
              <div className="p-3">
                <div className="mb-2 h-4 w-24 rounded bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 shadow-[inset_0_-2px_3px_-1px_rgba(0,0,0,0.04)]" />
            </div>
            <div className="mt-3 font-mono text-[11px] text-slate-700">shadow.scrollEdgeBottom</div>
            <div className="mt-1 text-xs text-slate-500">只用于滚动容器底部结束提示：很薄的 inset hint，不承载 footer 或按钮。</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="relative h-36 overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
              <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center bg-white/88 px-3 shadow-[0_2px_4px_rgba(0,0,0,0.06)] backdrop-blur-md">
                <div className="h-3 w-24 rounded bg-slate-300" />
              </div>
              <div className="space-y-1.5 p-3 pt-12">
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
            <div className="mt-3 font-mono text-[11px] text-slate-700">shadow.stickyOverlap</div>
            <div className="mt-1 text-xs text-slate-500">用于 sticky heading 遮挡内容时的向下层级提示，方向和 footer 相反。</div>
          </div>

          <div className="rounded-xl bg-red-50/50 p-3 ring-1 ring-red-100">
            <div className="relative h-36 overflow-hidden rounded-lg bg-white ring-1 ring-red-100">
              <div className="p-3">
                <div className="mb-2 h-4 w-24 rounded bg-red-100" />
                <div className="space-y-1.5">
                  <div className="h-3 rounded bg-red-100" />
                  <div className="h-3 rounded bg-red-100" />
                  <div className="h-3 w-2/3 rounded bg-red-100" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-end bg-white/88 px-3 shadow-[inset_0_8px_16px_-16px_rgba(15,23,42,0.42)]">
                <div className="h-6 w-14 rounded-md bg-red-300" />
              </div>
            </div>
            <div className="mt-3 font-mono text-[11px] text-red-700">avoid: inset footer shadow</div>
            <div className="mt-1 text-xs text-red-600">不要用于 footer：和分割线/玻璃底容易打架，且不像下端浮起层。</div>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Stroke Scale">
        <div className="grid gap-ds-150 md:grid-cols-2">
          {tokenStrokeItems.map((item) => (
            <div key={item.name} className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
              <div className="rounded-xl bg-orange-50 p-4" style={{ border: item.value + ' solid #FF6900' }} />
              <div className="mt-3 font-mono text-xs text-slate-700">{item.name}</div>
              <div className="mt-1 text-xs text-slate-500">{item.value} / {item.use}</div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Motion Tokens">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[210px_260px_220px_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
            <div>Semantic token</div>
            <div>Value</div>
            <div>Source</div>
            <div>Usage</div>
          </div>
          <div className="divide-y divide-slate-100">
            {tokenMotionItems.map((item) => (
              <div key={item.name} className="grid grid-cols-[210px_260px_220px_minmax(0,1fr)] items-center px-3 py-3 text-xs">
                <div className="font-mono text-slate-700">{item.name}</div>
                <div className="font-mono text-slate-500">{item.value}</div>
                <div className="text-slate-400">{item.raw}</div>
                <div className="text-slate-500">{item.use}</div>
              </div>
            ))}
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Typography Scale">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[190px_80px_100px_90px_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
            <div>Semantic token</div>
            <div>Size</div>
            <div>Line height</div>
            <div>Weight</div>
            <div>Usage / Preview</div>
          </div>
          <div className="divide-y divide-slate-100">
            {tokenTypographyItems.map((item) => (
              <div key={item.name} className="grid grid-cols-[190px_80px_100px_90px_minmax(0,1fr)] items-center px-3 py-3">
                <div className="font-mono text-xs text-slate-700">{item.name}</div>
                <div className="font-mono text-xs text-slate-500">{item.size}</div>
                <div className="font-mono text-xs text-slate-500">{item.lineHeight}</div>
                <div className="font-mono text-xs text-slate-500">{item.weight}</div>
                <div className="text-slate-700" style={{ fontSize: item.size, lineHeight: item.lineHeight, fontWeight: Number(item.weight) }}>
                  {item.use} / 北煤机拼装产线
                </div>
              </div>
            ))}
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Typography Usage / Weak Text">
        <WeakTextStyleSamples />
      </DemoCard>

      <TokenLayerHeading label="Layer 3" title="Component Tokens">
        这一层把 semantic token 收敛到具体组件。它先作为组件视觉契约展示，后面再逐步让基础组件真正读取这些 token。
      </TokenLayerHeading>

      {componentTokenGroups.map((group) => (
        <DemoCard key={group.component} title={'Component Tokens / ' + group.component}>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <div className="grid grid-cols-[220px_220px_220px_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
              <div>Component token</div>
              <div>Semantic reference</div>
              <div>Resolved</div>
              <div>Usage</div>
            </div>
            <div className="divide-y divide-slate-100">
              {group.items.map((item) => (
                <div key={item.token} className="grid grid-cols-[220px_220px_220px_minmax(0,1fr)] items-center px-3 py-3 text-xs">
                  <div className="font-mono text-slate-700">{item.token}</div>
                  <div className="font-mono text-slate-400">{item.reference}</div>
                  <div className="flex items-center gap-2 font-mono text-slate-500">
                    {item.resolved.startsWith('#') || item.resolved.startsWith('rgba') ? (
                      <span className="size-5 shrink-0 rounded border border-slate-200" style={{ background: item.resolved }} />
                    ) : (
                      <span className="h-5 w-10 shrink-0 rounded border border-slate-200 bg-slate-50" />
                    )}
                    <span className="truncate">{item.resolved}</span>
                  </div>
                  <div className="text-slate-500">{item.use}</div>
                </div>
              ))}
            </div>
          </div>
        </DemoCard>
      ))}
    </div>
  );
}

type ComponentContract = {
  name: string;
  purpose: string;
  variants: string[];
  sizes: string[];
  states: string[];
  tokenSource: string[];
  notes?: string;
};

const componentContracts: ComponentContract[] = [
  {
    name: 'Button',
    purpose: '页面命令、弹窗操作、工具按钮。',
    variants: ['primary', 'secondary', 'brandOutline', 'ghost', 'danger'],
    sizes: ['sm', 'md', 'lg', 'icon'],
    states: ['default', 'hover', 'active', 'disabled', 'loading'],
    tokenSource: ['height.control.sm', 'height.control.md', 'color.brand.primary', 'color.brand.primaryHover', 'color.status.danger', 'stroke.strong', 'radius.md', 'typography.label', 'space.100', 'motion.duration.fast'],
  },
  {
    name: 'UnitNumberInput',
    purpose: '所有带单位的数字输入，包括点位、关节、阈值、参数设置。',
    variants: ['default', 'stepper', 'invalid', 'readonly'],
    sizes: ['sm', 'md', 'lg'],
    states: ['default', 'focus', 'disabled', 'invalid'],
    tokenSource: ['height.control.sm', 'height.control.md', 'height.control.lg', 'color.bg.surface', 'color.border.default', 'color.border.focus', 'color.status.danger', 'radius.lg', 'stroke.default', 'typography.inputSm', 'typography.inputMd', 'space.075'],
    notes: '复合组件只能选择 size、align 和是否显示 stepper，不重新定义 height、stroke、unit gap；安全点弹窗不复用此输入，改用独立 SafetyPointNumberInput 变体。',
  },
  {
    name: 'ObjectMultiSelect',
    purpose: '工件模型、打磨特征、焊缝特征、装配基准特征的多选。',
    variants: ['object', 'feature', 'compact'],
    sizes: ['sm', 'md'],
    states: ['default', 'open', 'hover', 'disabled', 'invalid'],
    tokenSource: ['height.control.sm', 'height.control.lg', 'color.bg.surface', 'color.border.default', 'color.border.focus', 'color.status.danger', 'radius.lg', 'shadow.overlay', 'typography.body', 'typography.helper', 'space.100'],
    notes: '不相接异常时只给选项自身 red stroke，不在外层再包红框。',
  },
  {
    name: 'ObjectSingleSelect',
    purpose: '特征提取里的零件 A/B 单选。',
    variants: ['object', 'feature', 'compact'],
    sizes: ['sm', 'md'],
    states: ['default', 'open', 'hover', 'disabled', 'invalid'],
    tokenSource: ['height.control.sm', 'height.control.md', 'color.bg.surface', 'color.border.default', 'color.border.focus', 'color.status.danger', 'radius.lg', 'shadow.overlay', 'typography.body', 'typography.helper', 'space.100'],
    notes: '与多选保持同样的触发器和浮层，但只允许单个结果，空值用于重新选择。',
  },
  {
    name: 'ProcessStepPanel',
    purpose: '抓取、放置、打磨、装配定位、翻面压紧和样式 C 合并焊接的任务配置母组件。',
    variants: ['pick', 'place', 'grind', 'assemblyLocate', 'turnoverClamp', 'weldScan', 'weld'],
    sizes: ['sequenceWidth'],
    states: ['collapsed', 'expanded', 'dirty', 'disabled', 'invalid'],
    tokenSource: ['color.bg.glass-float', 'color.bg.subtle', 'color.border.subtle', 'color.status.warning', 'radius.lg', 'radius.xl', 'shadow.sm', 'typography.panelTitle', 'typography.label', 'space.075', 'space.100', 'space.150'],
    notes: '任务标题行使用 ds 语义 token：卡片间距 space.075（6px），标题行 py space.075，展开分隔 mt/pt space.075；业务差异通过配置传入。',
  },
  {
    name: 'PointInfoRow',
    purpose: '点位名称 + XYZ 单行回显/编辑。',
    variants: ['xyz', 'readonly', 'dirty'],
    sizes: ['md'],
    states: ['default', 'focus', 'disabled', 'invalid', 'dirty'],
    tokenSource: ['UnitNumberInput', 'color.bg.surface', 'color.border.default', 'typography.label', 'space.100'],
  },
  {
    name: 'PickPathPoints',
    purpose: '工艺安全点浮窗，支持单组安全点、左侧图例折叠、单点启用/禁用和 XYZ/RPY 姿态角输入。',
    variants: ['singleGroup', 'groupTabs', 'legendCollapsed', 'safetyPointAdjust', 'dirty', 'readonly'],
    sizes: ['modalFloatExpanded', 'modalFloatCollapsed'],
    states: ['selectedPoint', 'allPosePreview', 'disabledPoint', 'disabled', 'invalid', 'dirty'],
    tokenSource: ['UnitNumberInput', 'PointInfoRow', 'color.bg.glass-float', 'color.bg.subtle', 'color.bg.surface', 'color.brand.primary', 'color.border.default', 'typography.label', 'space.100'],
    notes: '打磨使用单组 6 个安全点且不显示分组 tab；样式 C 合并焊接先切换扫描点位 / 焊接点位，再分别使用 6 组安全点 tab。左侧图例收起时浮窗宽度缩小，右侧编辑区不扩宽；安全点 XYZ/RPY 输入采用独立 SafetyPointNumberInput 无单位字符、无上下箭头变体；显示全部位姿按钮固定在图例底部；C/D 工艺规划布局中定位在右侧任务列表左边。',
  },
  {
    name: 'JointValueRow',
    purpose: '放置/翻面压紧 J1-J8 单行 slider + stepper 输入，J1 为 mm，其余为 °。',
    variants: ['distance', 'angle', 'sliderStepper'],
    sizes: ['md'],
    states: ['default', 'focus', 'disabled', 'invalid', 'dirty'],
    tokenSource: ['UnitNumberInput', 'color.bg.slider.track', 'color.border.default', 'color.brand.primary', 'typography.label', 'space.100'],
  },
  {
    name: 'TreeNodeRow',
    purpose: '项目管理、工艺规划和生产模型视图结构树的统一行组件。',
    variants: ['project', 'assembly', 'part'],
    sizes: ['md'],
    states: ['default', 'hover', 'selected', 'checked', 'disabled'],
    tokenSource: ['color.text.secondary', 'color.text.primary', 'color.bg.subtle', 'color.brand.primarySubtle', 'radius.md', 'typography.body', 'space.100'],
    notes: '装配体无 icon，使用低不透明度中性 zinc fill 且不投影；模型视图的零件对象行保持紧凑字号，首级左内边距为 16px，并使用更轻的白色 fill。模型视图中的树行使用 backdrop blur，hover 提升白色或 zinc 填充与中性 stroke，选中统一使用 orange-700 文字、浅橙 fill + stroke。生产模型视图的零件选中需同步触发 3D 隔离高亮。项目管理和工艺规划树只展示项目、装配体、工件层级，不展示解析出的特征节点。',
  },
  {
    name: 'ModalShell',
    purpose: '确认、表单、大型参数设置、图纸管理等弹窗统一外壳。',
    variants: ['confirm', 'dangerConfirm', 'form', 'largeConfig', 'viewportOverlay'],
    sizes: ['sm', 'md', 'lg', 'fullscreenPanel'],
    states: ['default', 'loading', 'destructive'],
    tokenSource: ['color.bg.glass', 'color.border.glass', 'radius.lg', 'shadow.overlay', 'typography.panelTitle', 'space.200', 'motion.duration.normal', 'motion.easing.emphasized'],
    notes: '弹窗使用 3D 工具按钮行同源玻璃底和白色 stroke，不再使用重灰 stroke；图纸管理、工艺参数设置等密集弹窗外壳使用 8px 圆角。',
  },
  {
    name: 'Toast',
    purpose: '项目管理、特征提取、任务生成等反馈。',
    variants: ['success', 'error', 'warning', 'info'],
    sizes: ['md'],
    states: ['entering', 'visible', 'leaving'],
    tokenSource: ['color.status.success', 'color.status.danger', 'color.status.warning', 'color.status.info', 'radius.lg', 'shadow.overlay', 'typography.body', 'space.150', 'motion.duration.normal'],
  },
  {
    name: 'Badge',
    purpose: '阈值通过/异常、数量、状态标记。',
    variants: ['neutral', 'success', 'warning', 'danger', 'count'],
    sizes: ['sm', 'md'],
    states: ['default', 'disabled'],
    tokenSource: ['color.bg.subtle', 'color.status.successSubtle', 'color.status.warningSubtle', 'color.status.dangerSubtle', 'radius.full', 'typography.micro', 'space.050'],
  },
  {
    name: 'Switch',
    purpose: '路径自动合并、磁铁启用等二值设置。',
    variants: ['default'],
    sizes: ['sm', 'md'],
    states: ['checked', 'unchecked', 'disabled'],
    tokenSource: ['color.brand.primary', 'color.bg.muted', 'color.text.muted', 'typography.helper', 'radius.full', 'space.050'],
  },
  {
    name: 'SegmentedControl',
    purpose: '抓具类型、模式等少量互斥选项切换。',
    variants: ['default'],
    sizes: ['sm'],
    states: ['selected', 'unselected', 'disabled'],
    tokenSource: ['color.bg.segmented', 'color.bg.surface', 'color.brand.primary', 'radius.md', 'typography.micro', 'space.050'],
  },
  {
    name: 'PickParameterValidation',
    purpose: '抓取任务条目内抓具切换、磁铁启用、左/右 Z 值、中磁铁 Z 只读与阈值结果回显。',
    variants: ['gantry', 'robot', 'style-c-row-card'],
    sizes: ['md'],
    states: ['default', 'invalid', 'disabled', 'dirty'],
    tokenSource: ['SegmentedControl', 'Switch', 'UnitNumberInput', 'Badge', 'select.native', 'color.bg.subtle', 'radius.lg', 'space.150'],
    notes: '位于抓取参数校验区顶部；当前 Component Lab 只展示样式 C 行卡片：去掉齿轮，每个磁铁占满一整行，第二行展示 Z 与磁力档位；中磁铁 Z 固定为 -- 且不可编辑。旧三列磁铁卡片迁入 /component-drafts 过程稿。',
  },
  {
    name: 'PercentSlider',
    purpose: '覆盖率、阈值等百分比设置，保留刻度数字。',
    variants: ['default', 'invalid'],
    sizes: ['md'],
    states: ['default', 'hover', 'disabled', 'invalid'],
    tokenSource: ['color.brand.primary', 'color.bg.slider.track', 'color.border.slider.tick', 'color.text.slider.tick', 'UnitNumberInput', 'radius.full', 'space.150'],
  },
];

function ComponentContractTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white px-4 py-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-slate-900">Component Contract</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">
          基础组件必须按契约回答 variants、sizes、states、token source。后续 AI 写组件时优先查这里，不自由发挥底层视觉规则。
        </div>
      </div>
      <ParameterSpacingContractDemo />
      <ParameterCardTitleStackContractDemo />
      <ParameterCompactGroupContractDemo />
      <ParameterCardSubfieldContractDemo />
      <div className="grid gap-4 lg:grid-cols-2">
        {componentContracts.map((contract) => (
          <DemoCard key={contract.name} title={contract.name}>
            <div className="space-y-4">
              <div className="text-sm leading-6 text-slate-600">{contract.purpose}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ContractList title="Variants" items={contract.variants} />
                <ContractList title="Sizes" items={contract.sizes} />
                <ContractList title="States" items={contract.states} />
                <ContractList title="Token source" items={contract.tokenSource} mono />
              </div>
              {contract.notes && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                  {contract.notes}
                </div>
              )}
            </div>
          </DemoCard>
        ))}
      </div>
    </div>
  );
}

function ParameterCardTitleStackContractDemo() {
  return (
    <DemoCard title="参数卡片间距规则 / title-content gap">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">ds-parameter-card-title-stack</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  只用于参数卡片内标题到下面主要控件的距离，不替代参数项 label 到 input 的间距。
                </div>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] text-ds-brand-primary-text ring-1 ring-orange-100">
                gap = ds-200 / 16px
              </div>
            </div>
            <div className="mt-4 grid gap-ds-150 lg:grid-cols-3">
              {[
                { title: '覆盖率阈值', body: <PercentSliderDemo value="70" onChange={() => undefined} /> },
                { title: '安全阈值系数', body: <UnitNumberInputDemo value="0.80" unit="" onChange={() => undefined} /> },
                { title: '偏心距阈值', body: <UnitNumberInputDemo value="200" unit="mm" onChange={() => undefined} /> },
              ].map((item) => (
                <div key={item.title} className="ds-parameter-card ds-parameter-card-title-stack">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    <span>{item.title}</span>
                    <CircleAlert className="size-3.5 text-slate-300" />
                  </div>
                  {item.body}
                </div>
              ))}
              <div className="ds-parameter-card ds-parameter-card-title-stack lg:col-span-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <span>抓取路径设置：安全点高度</span>
                  <CircleAlert className="size-3.5 text-slate-300" />
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="relative mx-auto h-[112px] max-w-[360px]">
                    <div className="absolute left-[48%] top-2 bottom-6 w-[3px] -translate-x-1/2 rounded-full bg-slate-900" />
                    <div className="absolute left-[48%] bottom-6 h-[3px] w-[96px] rounded-full bg-red-500" />
                    <ArrowRight className="absolute left-[calc(48%+34px)] bottom-[15px] size-5 text-red-500" strokeWidth={2.75} />
                    {['900', '650'].map((value, index) => (
                      <div key={value} className="absolute flex items-center gap-2" style={{ top: `${12 + index * 42}px`, left: '12px' }}>
                        <div className="w-[90px]">
                          <UnitNumberInputDemo value={value} unit="mm" size="sm" align="right" onChange={() => undefined} />
                        </div>
                        <div className="size-3 rounded-full border-2 border-ds-brand-primary bg-white" />
                      </div>
                    ))}
                    <div className="absolute right-3 top-9 w-[90px]">
                      <UnitNumberInputDemo value="900" unit="mm" size="sm" align="right" onChange={() => undefined} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="text-xs font-medium text-slate-500">应用边界</div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">规则命名：</span>
                title-content gap
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">唯一 class：</span>
                <span className="font-mono"> ds-parameter-card-title-stack</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">当前应用：</span>
                抓取页 3 个阈值卡片 + 安全点高度卡片
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">不要替代：</span>
                <span className="font-mono"> ds-parameter-field</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-3">
          <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="text-xs font-medium text-ds-brand-primary-text">视觉标尺</div>
            <div className="flex items-start gap-3">
              <div className="ds-parameter-card ds-parameter-card-title-stack w-full max-w-sm">
                <div className="text-sm font-medium text-slate-800">card title</div>
                <div className="relative h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-500">
                  primary content
                  <div className="absolute left-3 top-[-16px] h-[16px] w-16 bg-orange-300/45" />
                </div>
              </div>
              <div className="pt-[34px] font-mono text-[11px] leading-4 text-ds-brand-primary-text">16px</div>
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

function ParameterSpacingContractDemo() {
  return (
    <DemoCard title="参数间距规则 / label-input gap">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">ds-parameter-field</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  只负责 label 到 input 的垂直距离。input 包括输入框、选择器、分段选择、多选、Slider 和只读回显框。
                </div>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] text-ds-brand-primary-text ring-1 ring-orange-100">
                gap: ds-075 / 6px
              </div>
            </div>
            <div className="mt-4 grid gap-ds-150 md:grid-cols-2">
              <div className="ds-parameter-field">
                <div className="ds-parameter-label">支撑宽度</div>
                <NumberFieldDemo value="450" unit="mm" onChange={() => undefined} />
              </div>
              <div className="ds-parameter-field">
                <div className="ds-parameter-label">对象多选</div>
                <ObjectMultiSelectDemo
                  values={['0162-01-010101-01', '0162-01-010101-02', '01 打磨线 1']}
                  selectedValues={['0162-01-010101-01']}
                  placeholder="请选择对象"
                  onToggle={() => undefined}
                />
              </div>
              <div className="ds-parameter-field">
                <div className="ds-parameter-label">零件位置</div>
                <SegmentedControlDemo
                  value="left"
                  options={[
                    { value: 'left', label: '左端' },
                    { value: 'right', label: '右端' },
                  ]}
                  onChange={() => undefined}
                />
              </div>
              <div className="ds-parameter-field">
                <div className="ds-parameter-label">覆盖率回显</div>
                <div className="flex h-8 items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600">
                  <span>编号1覆盖率</span>
                  <span className="font-mono text-slate-800">76.8%</span>
                </div>
              </div>
              <div className="ds-parameter-field md:col-span-2">
                <div className="ds-parameter-label">覆盖率阈值</div>
                <PercentSliderDemo value="70" onChange={() => undefined} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="text-xs font-medium text-slate-500">如何在页面里表现</div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">规则命名：</span>
                label-input gap
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">唯一 class：</span>
                <span className="font-mono"> ds-parameter-field</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">不要混用：</span>
                <span className="font-mono"> mb-1 / mt-3 / space-y-3</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">相邻参数行：</span>
                <span className="font-mono"> ds-parameter-stack</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">紧凑浮窗：</span>
                <span className="font-mono"> ds-label-input-mini / 4px</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-3">
          <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="text-xs font-medium text-ds-brand-primary-text">视觉标尺</div>
            <div className="flex flex-wrap items-start gap-6">
              <div className="ds-parameter-field w-full max-w-xs">
                <div className="ds-parameter-label">label</div>
                <div className="relative h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-500">
                  input surface
                  <div className="absolute left-3 top-[-6px] h-[6px] w-12 bg-orange-300/45" />
                </div>
              </div>
              <div className="pt-[22px] font-mono text-[11px] leading-4 text-ds-brand-primary-text">6px</div>
              <div className="ds-label-input-mini w-full max-w-xs">
                <div className="ds-label-input-mini-label">mini label</div>
                <div className="relative h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] leading-7 text-slate-500">
                  compact select
                  <div className="absolute left-2 top-[-4px] h-[4px] w-10 bg-teal-300/45" />
                </div>
              </div>
              <div className="pt-[20px] font-mono text-[11px] leading-4 text-teal-700">4px</div>
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

function ParameterCompactGroupContractDemo() {
  return (
    <DemoCard title="参数间距规则 / compact & group spacing">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">ds-label-input-compact / ds-parameter-group / ds-parameter-group-stack / ds-parameter-category-stack</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  紧凑 label 到输入为 8px；同一卡片内字段组为 12px；独立参数卡片/组之间为 16px；不同大类别之间为 36px。
                </div>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] text-ds-brand-primary-text ring-1 ring-orange-100">
                8px / 12px / 16px / 36px
              </div>
            </div>
            <div className="mt-4 grid gap-ds-150 md:grid-cols-2">
              <div className="ds-label-input-compact">
                <div className="ds-label-input-compact-label">Z 轴档位</div>
                <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600">
                  12
                </div>
              </div>
              <div className="ds-parameter-group">
                <div className="ds-parameter-field">
                  <div className="ds-parameter-label">磁铁尺寸 - 长</div>
                  <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600">
                    120 mm
                  </div>
                </div>
                <div className="ds-parameter-field">
                  <div className="ds-parameter-label">磁铁尺寸 - 宽</div>
                  <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600">
                    80 mm
                  </div>
                </div>
              </div>
              <div className="ds-parameter-group-stack md:col-span-2">
                <div className="ds-parameter-card ds-parameter-card-sm p-3">
                  <div className="text-xs font-medium text-slate-700">左磁铁组</div>
                </div>
                <div className="ds-parameter-card ds-parameter-card-sm p-3">
                  <div className="text-xs font-medium text-slate-700">中磁铁组</div>
                </div>
              </div>
              <div className="ds-parameter-category-stack md:col-span-2">
                <div className="ds-parameter-card ds-parameter-card-sm p-3">
                  <div className="text-xs font-medium text-slate-700">右磁铁组</div>
                </div>
                <div className="ds-parameter-card-surface">
                  <div className="text-xs font-medium text-slate-700">覆盖率 / 安全系数 / 偏心距</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="text-xs font-medium text-slate-500">如何在页面里表现</div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">规则命名：</span>
                compact &amp; group spacing
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">唯一 class：</span>
                <span className="font-mono"> ds-label-input-compact / ds-parameter-group / ds-parameter-group-stack / ds-parameter-category-stack</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">不要混用：</span>
                <span className="font-mono"> ds-parameter-field (6px)</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">组内：</span>
                <span className="font-mono"> ds-parameter-group / 12px</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">组间 / 类别间：</span>
                <span className="font-mono"> ds-parameter-group-stack / 16px；ds-parameter-category-stack / 36px</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-3">
          <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="text-xs font-medium text-ds-brand-primary-text">视觉标尺</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="ds-label-input-compact w-full max-w-[180px]">
                  <div className="ds-label-input-compact-label">Z 轴档位</div>
                  <div className="relative h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs leading-8 text-slate-500">
                    12
                    <div className="absolute left-2.5 top-[-8px] h-[8px] w-14 bg-indigo-300/50" />
                  </div>
                </div>
                <div className="pt-[24px] font-mono text-[11px] text-indigo-700">8px</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="ds-parameter-group w-full max-w-[180px]">
                  <div className="ds-parameter-field">
                    <div className="ds-parameter-label">磁铁尺寸 - 长</div>
                    <div className="relative h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-500">input</div>
                  </div>
                  <div className="ds-parameter-field">
                    <div className="ds-parameter-label">磁铁尺寸 - 宽</div>
                    <div className="relative h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-500">input</div>
                    <div className="absolute left-3 top-[-12px] h-[12px] w-14 bg-violet-300/50" />
                  </div>
                </div>
                <div className="pt-[26px] font-mono text-[11px] text-violet-700">12px</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="ds-parameter-group-stack w-full max-w-[180px]">
                  <div className="ds-parameter-card ds-parameter-card-sm p-3">
                    <div className="text-xs font-medium text-slate-700">左磁铁组</div>
                  </div>
                  <div className="ds-parameter-card ds-parameter-card-sm p-3">
                    <div className="text-xs font-medium text-slate-700">中磁铁组</div>
                  </div>
                  <div className="absolute left-4 top-[44px] h-[16px] w-16 bg-fuchsia-300/50" />
                </div>
                <div className="pt-[26px] font-mono text-[11px] text-fuchsia-700">16px</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="ds-parameter-category-stack w-full max-w-[180px]">
                  <div className="ds-parameter-card ds-parameter-card-sm p-3">
                    <div className="text-xs font-medium text-slate-700">右磁铁组</div>
                  </div>
                  <div className="ds-parameter-card-surface">
                    <div className="text-xs font-medium text-slate-700">覆盖率 / 安全系数 / 偏心距</div>
                  </div>
                  <div className="absolute left-4 top-[44px] h-[36px] w-16 bg-rose-300/50" />
                </div>
                <div className="pt-[36px] font-mono text-[11px] text-rose-700">36px</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

function ParameterCardSubfieldContractDemo() {
  return (
    <DemoCard title="参数卡片间距规则 / card & subfield spacing">
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">ds-parameter-card / ds-parameter-card-surface / ds-parameter-subfield-stack / ds-parameter-content</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  参数卡片容器内边距 16px；结果/汇总类浅灰卡片内边距 12px；同一字段下子字段堆叠 8px；参数详情滚动区内容顶部 padding 12px。
                </div>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] text-ds-brand-primary-text ring-1 ring-orange-100">
                16px / 12px / 8px / 12px
              </div>
            </div>
            <div className="mt-4 grid gap-ds-150 md:grid-cols-2">
              <div className="ds-parameter-card">
                <div className="text-xs font-medium text-slate-700">磁铁参数</div>
                <div className="mt-2 h-16 rounded-lg border border-dashed border-slate-200 bg-slate-100/70" />
              </div>
              <div className="ds-parameter-card-surface">
                <div className="text-xs font-medium text-slate-700">结果汇总</div>
                <div className="mt-2 h-14 rounded-lg border border-dashed border-slate-200 bg-slate-100/70" />
              </div>
              <div className="ds-parameter-subfield-stack md:col-span-2">
                <div className="ds-parameter-label">位置</div>
                <div className="ds-parameter-field">
                  <div className="ds-parameter-label">X</div>
                  <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600">
                    0
                  </div>
                </div>
                <div className="ds-parameter-field">
                  <div className="ds-parameter-label">Y</div>
                  <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600">
                    0
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="relative rounded-lg border border-slate-200 bg-white">
                  <div className="ds-parameter-content">
                    <div className="h-12 rounded-lg border border-dashed border-slate-200 bg-slate-100/70" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="text-xs font-medium text-slate-500">如何在页面里表现</div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">规则命名：</span>
                card &amp; subfield spacing
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">唯一 class：</span>
                <span className="font-mono"> ds-parameter-card / ds-parameter-card-surface / ds-parameter-subfield-stack / ds-parameter-content</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">卡片内边距：</span>
                <span className="font-mono"> ds-parameter-card / 16px</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">浅灰卡片内边距：</span>
                <span className="font-mono"> ds-parameter-card-surface / 12px</span>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">不要混用：</span>
                <span className="font-mono"> p-3 / p-4 临时写死</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-3">
          <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="text-xs font-medium text-ds-brand-primary-text">视觉标尺</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="ds-parameter-card relative w-full max-w-[180px]">
                  <div className="text-xs font-medium text-slate-700">磁铁参数</div>
                  <div className="mt-2 h-16 rounded-lg border border-dashed border-slate-200 bg-slate-100/70" />
                  <div className="absolute left-0 top-0 h-full w-full rounded-xl border-2 border-dashed border-cyan-300/50 bg-cyan-300/10" />
                </div>
                <div className="pt-[20px] font-mono text-[11px] text-cyan-700">16px</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="ds-parameter-card-surface relative w-full max-w-[180px]">
                  <div className="text-xs font-medium text-slate-700">结果汇总</div>
                  <div className="mt-2 h-14 rounded-lg border border-dashed border-slate-200 bg-slate-100/70" />
                  <div className="absolute left-0 top-0 h-full w-full rounded-xl border-2 border-dashed border-sky-300/50 bg-sky-300/10" />
                </div>
                <div className="pt-[18px] font-mono text-[11px] text-sky-700">12px</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="ds-parameter-subfield-stack w-full max-w-[180px]">
                  <div className="ds-parameter-label">位置</div>
                  <div className="ds-parameter-field">
                    <div className="ds-parameter-label">X</div>
                    <div className="relative h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-8 text-slate-500">0</div>
                  </div>
                  <div className="ds-parameter-field">
                    <div className="ds-parameter-label">Y</div>
                    <div className="relative h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-8 text-slate-500">0</div>
                    <div className="absolute left-3 top-[-8px] h-[8px] w-14 bg-emerald-300/50" />
                  </div>
                </div>
                <div className="pt-[32px] font-mono text-[11px] text-emerald-700">8px</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="relative w-full max-w-[180px] rounded-lg border border-slate-200 bg-white">
                  <div className="ds-parameter-content">
                    <div className="h-12 rounded-lg border border-dashed border-slate-200 bg-slate-100/70" />
                  </div>
                  <div className="absolute left-3 top-0 h-[12px] w-16 bg-amber-300/50" />
                </div>
                <div className="pt-[20px] font-mono text-[11px] text-amber-700">12px</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  );
}

function ContractList({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`rounded-full bg-white px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-100 ${mono ? 'font-mono' : ''}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function DesignTokenTab() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white px-4 py-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-slate-900">Design Token</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">
          颜色、文字、间距、圆角、阴影、动效和组件契约统一放在这里；正式 Lab 不再把文字样式、中性色、主题色拆成一级页。
        </div>
      </div>

      <section className="space-y-4">
        <div className="px-1">
          <div className="text-sm font-semibold text-slate-800">Color / 品牌色、语义色与中性色</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">主题色和中性色合并查看，避免颜色规则分散。</div>
        </div>
        <ThemeColorTab />
        <NeutralColorTab />
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <div className="text-sm font-semibold text-slate-800">Typography / 文字层级</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">标题、正文、标签、辅助文字和异常提示统一归入 token。</div>
        </div>
        <TypographyTab />
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <div className="text-sm font-semibold text-slate-800">Token Catalog / 间距、圆角、阴影与动效</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">保留原 token catalog 作为事实来源和映射记录。</div>
        </div>
        <TokenCatalogTab />
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <div className="text-sm font-semibold text-slate-800">Usage Rules / 组件契约</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">组件契约作为 token 如何落到组件上的规则层，而不是独立一级入口。</div>
        </div>
        <ComponentContractTab />
      </section>
    </div>
  );
}


export function ComponentLabPage() {
  const [activeTab, setActiveTab] = useState<LabTab>('interaction');
  const [activeComponentSection, setActiveComponentSection] = useState<ComponentSection>('button');
  const [activeComponentPage, setActiveComponentPage] = useState<ComponentSectionPage>('general');
  const [expandedComponentLayerId, setExpandedComponentLayerId] = useState<ComponentSectionLayerId>('foundation');
  const [componentViewMode, setComponentViewMode] = useState<ComponentViewMode>('split');
  const [state, setState] = useState<DemoState>('default');
  const [productionStationCardVariant, setProductionStationCardVariant] = useProductionStationCardVariant();
  const [productionTaskPanelVariant, setProductionTaskPanelVariant] = useState<'v1' | 'v2'>('v2');
  const [productionTrayEditDemoOpen, setProductionTrayEditDemoOpen] = useState(false);
  const [productionDebugStationDemoId, setProductionDebugStationDemoId] = useState('area-main-assembly-1');
  const [productionDebugModeDemo, setProductionDebugModeDemo] = useState<ProductionDebugExecutionMode>('single-step');
  const productionDebugStationsDemo: ProductionDebugStation[] = [
    { id: 'area-main-assembly-2', name: '主筋板装配工位2', status: 'idle' },
    { id: 'area-side-grind-2', name: '贴板打磨工位2', status: 'idle' },
    { id: 'area-turnover', name: '翻面工位', status: 'abnormal', processName: '翻面', workpieceSerial: 'WP-02' },
    { id: 'area-side-grind-1', name: '贴板打磨工位1', status: 'idle' },
    { id: 'area-main-assembly-1', name: '主筋板装配工位1', status: 'running', processName: '装配', workpieceSerial: 'WP-01' },
    { id: 'area-main-grinding', name: '主筋板打磨工位1', status: 'idle' },
  ];
  const productionDebugStationDemoName = productionDebugStationsDemo.find((station) => station.id === productionDebugStationDemoId)?.name ?? '主筋板装配工位1';
  const productionDebugProcessByStation: Record<string, ProductionDebugStationSnapshot['process']> = {
    'area-main-grinding': {
      id: 'generated-grind-01',
      name: '打磨',
      partObject: '0162-01-010101-01',
      unit: '打磨',
    },
    'area-main-assembly-1': {
      id: 'generated-assemble-02',
      name: '装配',
      partObject: '0162-01-010101-02 + 0162-01-010101-01',
      unit: '装配',
    },
    'area-side-grind-1': {
      id: 'generated-grind-02',
      name: '侧面打磨',
      partObject: '0162-01-010101-02',
      unit: '打磨',
      batchGroup: 'side-plate-grind',
    },
    'area-turnover': {
      id: 'generated-turnover-02-01',
      name: '翻面',
      partObject: '0162-01-010101-02 + 0162-01-010101-01',
      unit: '翻面',
    },
    'area-side-grind-2': {
      id: 'generated-grind-03',
      name: '侧面打磨',
      partObject: '0162-01-010101-03',
      unit: '打磨',
      batchGroup: 'side-plate-grind',
    },
    'area-main-assembly-2': {
      id: 'generated-assemble-03',
      name: '装配',
      partObject: '0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01',
      unit: '装配',
    },
  };
  const productionDebugStationDemoProcess = productionDebugProcessByStation[productionDebugStationDemoId] ?? null;
  const productionDebugCompositeDemo = getProductionCompositeStation(productionDebugStationDemoId);
  const productionDebugCompositeDemoLocation = productionDebugCompositeDemo && productionDebugStationDemoProcess
    ? findProductionCompositeWorkstepLocation(productionDebugCompositeDemo, [], productionDebugStationDemoProcess.id)
    : null;
  const productionDebugStationDemoWorkstepNames = productionDebugCompositeDemo
    ? getProductionCompositeWorkstepNames(productionDebugCompositeDemo)
    : productionDebugStationDemoProcess
      ? getProductionStationWorkstepNames(productionDebugStationDemoProcess)
      : [];
  const productionDebugStationDemoCurrentWorkstepIndex = productionDebugCompositeDemoLocation
    ? productionDebugCompositeDemoLocation.startIndex + Math.min(1, productionDebugCompositeDemoLocation.workstepNames.length - 1)
    : productionDebugStationDemoWorkstepNames.length > 0
      ? Math.min(1, productionDebugStationDemoWorkstepNames.length - 1)
      : 0;
  const productionDebugStationDemoSnapshot: ProductionDebugStationSnapshot = {
    stationId: productionDebugStationDemoId,
    stationName: productionDebugCompositeDemo?.name ?? productionDebugStationDemoName,
    taskName: productionDebugStationDemoProcess ? '0162-01-010101 主筋板拼装件' : null,
    taskState: productionDebugStationDemoProcess ? 'paused' : null,
    workpieceSerial: productionDebugStationDemoProcess ? '0162-01-010101-01' : null,
    workpieceState: productionDebugStationDemoProcess ? 'paused' : null,
    workpieceProgress: productionDebugStationDemoProcess ? 42 : null,
    process: productionDebugCompositeDemo && !productionDebugCompositeDemoLocation ? null : productionDebugStationDemoProcess,
    partName: productionDebugStationDemoProcess?.partObject ?? null,
    quantity: productionDebugStationDemoProcess ? 6 : 0,
    workstepNames: productionDebugStationDemoWorkstepNames,
    currentWorkstepIndex: productionDebugStationDemoCurrentWorkstepIndex,
    compositeStation: productionDebugCompositeDemo
      ? {
          id: productionDebugCompositeDemo.id,
          name: productionDebugCompositeDemo.name,
          stations: productionDebugCompositeDemo.stationIds.map((stationId) => ({
            stationId,
            stationName: productionDebugStationsDemo.find((station) => station.id === stationId)?.name ?? stationId,
          })),
          activeStationId: productionDebugStationDemoId,
        }
      : null,
  };
  const disabled = state === 'disabled';
  const invalid = state === 'invalid';

  const [numberValue, setNumberValue] = useState('450');
  const [minValue, setMinValue] = useState('300');
  const [maxValue, setMaxValue] = useState('1200');
  const [percentValue, setPercentValue] = useState('70');
  const [selectedValues, setSelectedValues] = useState<string[]>(['1', '2']);
  const [activeWorkbenchParameterTab, setActiveWorkbenchParameterTab] = useState<'support' | 'clamp'>('support');
  const [demoWorkbenchIndex, setDemoWorkbenchIndex] = useState(1);
  const [selectedClampIds, setSelectedClampIds] = useState<string[]>(['1', '2']);
  const [placeWorkbenchType, setPlaceWorkbenchType] = useState('主筋板正面装配平台');
  const [placeSupportIds, setPlaceSupportIds] = useState<string[]>(['1', '2']);
  const [turnoverClampWorkbenchType, setTurnoverClampWorkbenchType] = useState('主筋板正面装配平台');
  const [turnoverClampIds, setTurnoverClampIds] = useState<string[]>(['1', '2']);
  const [supportSettings, setSupportSettings] = useState<Record<string, WorkbenchSupportSetting>>({
    '1': createDefaultWorkbenchSupportSetting('1'),
    '2': createDefaultWorkbenchSupportSetting('2'),
  });
  const [clampSettings, setClampSettings] = useState<Record<string, WorkbenchClampSetting>>({
    '1': createDefaultWorkbenchClampSetting('1'),
    '2': createDefaultWorkbenchClampSetting('2'),
  });
  const [pointRow, setPointRow] = useState({ x: '120.0', y: '80.0', z: '15.0' });
  const [pointRowWithRPY, setPointRowWithRPY] = useState({ x: '90.0', y: '60.0', z: '12.0', rx: '0.0', ry: '85.0', rz: '0.0' });
  const [axisRow, setAxisRow] = useState<Record<string, string>>({ y: '240.0', z: '96.0' });
  const [processParts, setProcessParts] = useState<string[]>(['0162-01-010101-01']);
  const [objectSelectValue, setObjectSelectValue] = useState<string | null>('0162-01-010101-01');
  const [coordinatePivotTargets, setCoordinatePivotTargets] = useState<string[]>(['0162-01-010101-01']);
  const [processGrindFeatures, setProcessGrindFeatures] = useState<string[]>(['01 打磨线 1']);
  const [processDatumFeatures, setProcessDatumFeatures] = useState<string[]>(['02 01装配基准']);
  const [processWeldFeatures, setProcessWeldFeatures] = useState<string[]>(['01-02 焊缝']);
  const [processPanelDirty, setProcessPanelDirty] = useState(false);
  const [pickGripperType, setPickGripperType] = useState<PickGripperType>('gantry');
  const [pickMagnets, setPickMagnets] = useState<Record<PickMagnetKey, { enabled: boolean; z: string }>>({
    left: { enabled: true, z: '96.0' },
    center: { enabled: true, z: '88.0' },
    right: { enabled: false, z: '96.0' },
  });
  const [pickMagnetForceLevels, setPickMagnetForceLevels] = useState<Record<PickMagnetKey, PickMagnetForceLevel>>({
    left: '大',
    center: '中',
    right: '小',
  });
  const [pickMagnetPanelForceLevel, setPickMagnetPanelForceLevel] = useState<PickMagnetForceLevel>('中');
  const [previewWeldSegmentIndex, setPreviewWeldSegmentIndex] = useState<number | null>(0);
  const [previewPointRowIndex, setPreviewPointRowIndex] = useState(0);
  const [previewJointIndex, setPreviewJointIndex] = useState(0);
  const [previewPanelPoint, setPreviewPanelPoint] = useState<{ panelTitle: string; pointIndex: number } | null>({
    panelTitle: '抓取任务面板',
    pointIndex: 0,
  });
  const [trayAgvDemoState, setTrayAgvDemoState] = useState<TrayAgvDemoState>('pending');
  const [trayAgvDemoArchived, setTrayAgvDemoArchived] = useState(false);
  const [trayAgvHistoryView, setTrayAgvHistoryView] = useState(false);
  const [trayPlanDemoStates, setTrayPlanDemoStates] = useState<Partial<Record<string, TrayAgvDemoState>>>({
    '04': 'running',
    '07': 'done',
  });
  const [traySelectedWorkOrderDemoId, setTraySelectedWorkOrderDemoId] = useState('WO-20260723-001');
  const [trayOverviewDemoReleased, setTrayOverviewDemoReleased] = useState(false);
  const [visionDemoCoordinateMode, setVisionDemoCoordinateMode] = useState<VisionCoordinateMode>('absolute');
  const [visionDemoPhotoPoseBaseline, setVisionDemoPhotoPoseBaseline] = useState<VisionCalibrationPose>(defaultVisionPhotoPose);
  const [visionDemoPhotoPose, setVisionDemoPhotoPose] = useState<VisionCalibrationPose>(defaultVisionPhotoPose);
  const [visionDemoResultPoint, setVisionDemoResultPoint] = useState<VisionCalibrationPose>(defaultVisionResultPoint);
  const [visionDemoScanStatus, setVisionDemoScanStatus] = useState<VisionScanStatus>('idle');
  const [visionDemoScanCount, setVisionDemoScanCount] = useState(0);
  const [visionDemoActiveFeedId, setVisionDemoActiveFeedId] = useState(visionFeedOptions[0]?.id ?? 'gantry-1');
  const [positioningDemoOpen, setPositioningDemoOpen] = useState(false);
  const [positioningDemoLocateState, setPositioningDemoLocateState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [positioningDemoImportStatus, setPositioningDemoImportStatus] = useState<PositioningDialogImportStatus>('idle');
  const [positioningDemoImportAttempts, setPositioningDemoImportAttempts] = useState(0);
  const [positioningDemoResult, setPositioningDemoResult] = useState<VisionPositionResult | null>(null);
  const [positioningDemoResultOpen, setPositioningDemoResultOpen] = useState(false);
  const [gantryVisionDemoViewport, setGantryVisionDemoViewport] = useState<GantryVisionViewportState>(
    createDefaultGantryVisionViewportState,
  );
  const visionDemoScanTimerRef = useRef<number | null>(null);
  const [newTaskPreviewDisabledIdsDemo, setNewTaskPreviewDisabledIdsDemo] = useState<Set<string>>(
    () => new Set(['generated-grind-03']),
  );
  const [newTaskPreviewSelectedIdsDemo, setNewTaskPreviewSelectedIdsDemo] = useState<Set<string>>(
    () => new Set(['generated-grind-02', 'generated-grind-03']),
  );
  const [processPoints, setProcessPoints] = useState([
    { x: '80.0', y: '40.0', z: '0.0' },
    { x: '220.0', y: '40.0', z: '0.0' },
  ]);
  const [processPosePoints, setProcessPosePoints] = useState<PickPathPointDemoValue[]>([
    { x: '100.0', y: '70.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '220.0', y: '90.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '48.0' },
    { x: '340.0', y: '110.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '460.0', y: '130.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '48.0' },
    { x: '580.0', y: '150.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '700.0', y: '170.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '48.0' },
    { x: '820.0', y: '190.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '45.0' },
    { x: '940.0', y: '210.0', z: '8.0', rx: '0.0', ry: '0.0', rz: '48.0' },
  ]);
  const [pickPathPoints, setPickPathPoints] = useState<PickPathPointDemoValue[]>(createDefaultPickPathPointDemoValues);
  const [clampPointSegments, setClampPointSegments] = useState<ClampPointSegmentConfig[]>(createDefaultClampPointSegments);
  const [clampPointActiveSegmentIndex, setClampPointActiveSegmentIndex] = useState(0);
  const [processJoints, setProcessJoints] = useState(['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30', '6.80', '91.20']);
  const [urdfJointDemoValues, setUrdfJointDemoValues] = useState(['0.0', '0.0']);
  const visionDemoAbsolutePose = resolveVisionAbsolutePose(
    visionDemoPhotoPose,
    visionDemoCoordinateMode,
    visionDemoPhotoPoseBaseline,
  );
  const visionDemoPoseDirty = !visionDemoAbsolutePose
    || !visionPosesEqual(visionDemoAbsolutePose, visionDemoPhotoPoseBaseline);
  const trayOverviewDemoAllocations = [
    trayCardDemoSlots.single,
    trayOverviewDemoReleased
      ? {
        ...trayCardDemoSlots.full,
        partName: null,
        partNo: null,
        count: 0,
        materials: [],
        occupied: true,
        state: 'empty-frame' as const,
      }
      : { ...trayCardDemoSlots.full, state: 'loaded' as const },
    trayCardDemoSlots.multi,
    trayCardDemoSlots.empty,
    trayCardDemoSlots.collapsed,
  ];

  const resetVisionDemo = () => {
    if (visionDemoScanTimerRef.current !== null) {
      window.clearTimeout(visionDemoScanTimerRef.current);
      visionDemoScanTimerRef.current = null;
    }
    setVisionDemoCoordinateMode('absolute');
    setVisionDemoPhotoPoseBaseline(defaultVisionPhotoPose);
    setVisionDemoPhotoPose(defaultVisionPhotoPose);
    setVisionDemoResultPoint(defaultVisionResultPoint);
    setVisionDemoScanStatus('idle');
    setVisionDemoScanCount(0);
  };

  const handleVisionDemoRescan = () => {
    const absolutePose = resolveVisionAbsolutePose(
      visionDemoPhotoPose,
      visionDemoCoordinateMode,
      visionDemoPhotoPoseBaseline,
    );
    if (!absolutePose || visionDemoScanStatus === 'scanning') return;
    setVisionDemoScanStatus('scanning');
    visionDemoScanTimerRef.current = window.setTimeout(() => {
      const resultFixture = visionRescanResultFixtures[visionDemoScanCount % visionRescanResultFixtures.length]
        ?? defaultVisionResultPoint;
      setVisionDemoResultPoint({ ...resultFixture });
      setVisionDemoPhotoPoseBaseline({ ...absolutePose });
      setVisionDemoPhotoPose(
        visionDemoCoordinateMode === 'absolute'
          ? { ...absolutePose }
          : { ...defaultVisionRelativePose },
      );
      setVisionDemoScanCount((current) => current + 1);
      setVisionDemoScanStatus('success');
      visionDemoScanTimerRef.current = null;
    }, 800);
  };

  const buildPositioningDemoResult = (source: VisionPositionResult['source']): VisionPositionResult => ({
    key: 'component-lab:positioning-demo',
    taskId: 'component-lab-task',
    taskLabel: '工单 WO-20260826-001',
    workpieceId: 'component-lab-wp-01',
    workpieceLabel: 'WP-01 · 主筋板拼装件',
    stationId: 'composite-assembly-grind-1',
    stationLabel: '主筋板装配工位1 + 贴板打磨工位1',
    processId: 'generated-assemble-02',
    workstepIndex: 2,
    source,
    pose: (source === 'scan'
      ? { x: '125.4', y: '-48.2', z: '32.6', rx: '0.0', ry: '90.0', rz: '180.0' }
      : { x: '126.1', y: '-47.8', z: '32.4', rx: '0.0', ry: '90.0', rz: '179.6' }) as ProcessPosePointValue,
    createdAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  });

  const openPositioningDemo = () => {
    setPositioningDemoOpen(true);
    setPositioningDemoLocateState(positioningDemoResult?.source === 'scan' ? 'success' : 'idle');
    setPositioningDemoImportStatus('idle');
  };

  const executePositioningDemo = () => {
    setPositioningDemoLocateState('loading');
    setPositioningDemoImportStatus('idle');
    window.setTimeout(() => {
      setPositioningDemoResult(buildPositioningDemoResult('scan'));
      setPositioningDemoLocateState('success');
      setPositioningDemoResultOpen(false);
    }, 650);
  };

  const importPositioningDemo = () => {
    if (positioningDemoImportAttempts === 0) {
      setPositioningDemoImportAttempts(1);
      setPositioningDemoImportStatus('error');
      return;
    }
    setPositioningDemoImportStatus('loading');
    window.setTimeout(() => {
      setPositioningDemoResult(buildPositioningDemoResult('import'));
      setPositioningDemoImportStatus('idle');
      setPositioningDemoOpen(false);
      setPositioningDemoResultOpen(true);
    }, 500);
  };

  useEffect(() => () => {
    if (visionDemoScanTimerRef.current !== null) {
      window.clearTimeout(visionDemoScanTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (trayAgvDemoState !== 'running' || trayAgvDemoArchived) return;
    const timer = window.setTimeout(() => {
      setTrayAgvDemoState('done');
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [trayAgvDemoArchived, trayAgvDemoState]);

  const newTaskPreviewRowIdsDemo = newTaskPreviewRowsDemo.map((row) => row.id);
  const newTaskPreviewSelectedIdsArrayDemo = newTaskPreviewRowIdsDemo.filter((rowId) =>
    newTaskPreviewSelectedIdsDemo.has(rowId)
  );
  const newTaskPreviewSelectedCountDemo = newTaskPreviewSelectedIdsArrayDemo.length;
  const newTaskPreviewSelectedDisabledCountDemo = newTaskPreviewSelectedIdsArrayDemo.filter((rowId) =>
    newTaskPreviewDisabledIdsDemo.has(rowId)
  ).length;
  const newTaskPreviewAllSelectedDemo =
    newTaskPreviewRowIdsDemo.length > 0 && newTaskPreviewRowIdsDemo.every((rowId) => newTaskPreviewSelectedIdsDemo.has(rowId));
  const newTaskPreviewSelectionIndeterminateDemo =
    newTaskPreviewSelectedCountDemo > 0 && !newTaskPreviewAllSelectedDemo;
  const newTaskPreviewSidePlateIdsDemo = newTaskPreviewRowsDemo.filter((row) => row.sidePlate).map((row) => row.id);
  const newTaskPreviewAllSidePlateDisabledDemo = newTaskPreviewSidePlateIdsDemo.every((rowId) =>
    newTaskPreviewDisabledIdsDemo.has(rowId)
  );
  const setNewTaskPreviewRowsDisabledDemo = (rowIds: string[], disabled: boolean) => {
    setNewTaskPreviewDisabledIdsDemo((current) => {
      const next = new Set(current);
      rowIds.forEach((rowId) => {
        if (disabled) next.add(rowId);
        else next.delete(rowId);
      });
      return next;
    });
  };
  const toggleNewTaskPreviewRowSelectedDemo = (rowId: string) => {
    setNewTaskPreviewSelectedIdsDemo((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };
  const toggleAllNewTaskPreviewRowsSelectedDemo = () => {
    setNewTaskPreviewSelectedIdsDemo(() => (
      newTaskPreviewAllSelectedDemo ? new Set() : new Set(newTaskPreviewRowIdsDemo)
    ));
  };
  const toggleSelectedNewTaskPreviewRowsDisabledDemo = () => {
    if (newTaskPreviewSelectedIdsArrayDemo.length === 0) return;
    setNewTaskPreviewRowsDisabledDemo(
      newTaskPreviewSelectedIdsArrayDemo,
      newTaskPreviewSelectedDisabledCountDemo === 0,
    );
  };

  const displayValues = useMemo(() => {
    if (invalid) {
      return {
        numberValue: '-20',
        minValue: '1200',
        maxValue: '300',
        percentValue: 'abc',
        selectedValues: [],
      };
    }
    return { numberValue, minValue, maxValue, percentValue, selectedValues };
  }, [invalid, maxValue, minValue, numberValue, percentValue, selectedValues]);

  const toggleStringSelection = (setter: Dispatch<SetStateAction<string[]>>) => (item: string) => {
    setter((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]));
  };
  const toggleSupportSelection = (item: string) => {
    setSelectedValues((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]));
    setSupportSettings((prev) => (prev[item] ? prev : { ...prev, [item]: createDefaultWorkbenchSupportSetting(item) }));
  };
  const calculateDemoPlaceCoverage = (workbench: string, supportId: string, supportIds: string[]) => {
    const workbenchOffset = workbench === '主筋板背面装配平台' ? 2 : workbench === '主筋板翻面平台' ? 1 : 0;
    const idOffset = ((Number(supportId) || 0) - 1) * 0.85;
    const selectedOffset = supportIds.includes(supportId) ? 3 : -10;
    return `${Math.min(99, Math.max(0, 70 + workbenchOffset + selectedOffset + idOffset)).toFixed(1)}%`;
  };
  const placeCoverageById = placeSupportIds.reduce<Record<string, string>>((coverageMap, supportId) => {
    coverageMap[supportId] = calculateDemoPlaceCoverage(placeWorkbenchType, supportId, placeSupportIds);
    return coverageMap;
  }, {});
  const calculateDemoClampCoverage = (workbench: string, clampId: string, clampIds: string[]) => {
    const workbenchOffset = workbench === '主筋板背面装配平台' || workbench === '主筋板翻面平台' ? 2 : 0;
    const selectedOffset = clampIds.includes(clampId) ? 4 : -10;
    const sideOffset = clampId === '2' ? 1.5 : 0;
    return `${Math.min(99, Math.max(0, 68 + workbenchOffset + selectedOffset + sideOffset)).toFixed(1)}%`;
  };
  const turnoverClampCoverageById = {
    '1': calculateDemoClampCoverage(turnoverClampWorkbenchType, '1', turnoverClampIds),
    '2': calculateDemoClampCoverage(turnoverClampWorkbenchType, '2', turnoverClampIds),
  };
  const calculateDemoPlaceJointRows = (workbench: string, supportIds: string[]) => {
    const workbenchIndex = ['主筋板打磨翻面平台', '主筋板正面装配平台', '主筋板翻面平台', '主筋板背面装配平台'].indexOf(workbench);
    const supportCount = supportIds.length;
    const supportAverage = supportCount > 0 ? supportIds.reduce((total, id) => total + (Number(id) || 0), 0) / supportCount : 0;
    const coverage = Math.min(99, 70 + supportCount * 3 + (workbench === '主筋板背面装配平台' ? 2 : 0));
    return ['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30', '6.80', '91.20'].map((baseValue, jointIndex) => {
      const base = Number(baseValue) || 0;
      const direction = jointIndex % 2 === 0 ? 1 : -1;
      const resolvedWorkbenchIndex = Math.max(0, workbenchIndex);
      const workbenchOffset = resolvedWorkbenchIndex * (jointIndex === 0 ? 7.5 : 2.15);
      const supportOffset = supportCount * (jointIndex === 0 ? 4.25 : 1.05) + supportAverage * (jointIndex === 0 ? 1.6 : 0.42);
      const coverageOffset = (coverage - 75) * (jointIndex === 0 ? 0.2 : 0.055);
      const axisOffset = jointIndex === 0 ? 0 : (jointIndex - 3) * 0.18 * (resolvedWorkbenchIndex + 1);
      return (base + direction * (workbenchOffset + supportOffset + coverageOffset) + axisOffset).toFixed(2);
    });
  };
  const calculateDemoClampJointRows = (workbench: string, clampIds: string[]) => {
    const workbenchIndex = ['主筋板打磨翻面平台', '主筋板正面装配平台', '主筋板翻面平台', '主筋板背面装配平台'].indexOf(workbench);
    const resolvedWorkbenchIndex = Math.max(0, workbenchIndex);
    const clampScore = clampIds.reduce((total, id) => total + (Number(id) || 0), 0);
    const coverageAverage = (Number(calculateDemoClampCoverage(workbench, '1', clampIds).replace('%', '')) + Number(calculateDemoClampCoverage(workbench, '2', clampIds).replace('%', ''))) / 2;
    return ['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30', '6.80', '91.20'].map((baseValue, jointIndex) => {
      const base = Number(baseValue) || 0;
      const direction = jointIndex % 2 === 0 ? 1 : -1;
      const workbenchOffset = resolvedWorkbenchIndex * (jointIndex === 0 ? 6.2 : 1.85);
      const clampOffset = clampIds.length * (jointIndex === 0 ? 3.8 : 0.9) + clampScore * (jointIndex === 0 ? 1.25 : 0.36);
      const coverageOffset = (coverageAverage - 72) * (jointIndex === 0 ? 0.18 : 0.05);
      const axisOffset = jointIndex === 0 ? 0 : (jointIndex - 3) * 0.14 * (resolvedWorkbenchIndex + 1);
      return (base + direction * (workbenchOffset + clampOffset + coverageOffset) + axisOffset).toFixed(2);
    });
  };
  const updateSupportSetting = (supportId: string, updater: (setting: WorkbenchSupportSetting) => WorkbenchSupportSetting) => {
    setSupportSettings((prev) => {
      const currentSetting = prev[supportId] ?? createDefaultWorkbenchSupportSetting(supportId);
      return {
        ...prev,
        [supportId]: updater(currentSetting),
      };
    });
  };
  const toggleClampSelection = (item: string) => {
    setSelectedClampIds((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]));
    setClampSettings((prev) => (prev[item] ? prev : { ...prev, [item]: createDefaultWorkbenchClampSetting(item) }));
  };
  const updateClampSetting = (clampId: string, updater: (setting: WorkbenchClampSetting) => WorkbenchClampSetting) => {
    setClampSettings((prev) => {
      const currentSetting = prev[clampId] ?? createDefaultWorkbenchClampSetting(clampId);
      return {
        ...prev,
        [clampId]: updater(currentSetting),
      };
    });
  };

  const processPanelVariants = [
    {
      title: '抓取任务面板',
      selectionLabel: '工件模型选择',
      selectionPlaceholder: '请选择工件模型',
      actionLabel: '生成抓取位置',
      options: ['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03'],
      selectedValues: invalid ? ['0162-01-010101-01', '0162-01-010101-03'] : processParts,
      onToggle: toggleStringSelection(setProcessParts),
      invalidText: '所选工件不相接',
      pointMode: 'pose' as const,
      pointTitle: '结果点位',
      pointSubtitle: 'XYZ/RPY',
      showPathPointEntry: true,
    },
    {
      title: '放置任务面板',
      selectionLabel: '工件模型选择',
      selectionPlaceholder: '请选择工件模型',
      actionLabel: '生成支撑位置',
      options: ['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-04'],
      selectedValues: processParts,
      onToggle: toggleStringSelection(setProcessParts),
      invalidText: '所选工件不相接',
      pointMode: 'joint' as const,
      pointTitle: '结果点位',
      pointSubtitle: 'J1-J8',
      showPathPointEntry: false,
      showPlaceSupportParameters: true,
      placeWorkbenchType,
      placeSupportIds,
      placeCoverageById,
      onPlaceSupportToggle: (supportId: string) =>
        setPlaceSupportIds((prev) => {
          const nextSupportIds = prev.includes(supportId) ? prev.filter((id) => id !== supportId) : [...prev, supportId];
          setProcessJoints(calculateDemoPlaceJointRows(placeWorkbenchType, nextSupportIds));
          return nextSupportIds;
        }),
    },
    {
      title: '打磨任务面板',
      selectionLabel: '打磨特征选择',
      selectionPlaceholder: '请选择打磨特征',
      actionLabel: '生成打磨路径',
      options: ['01 打磨线 1', '01 打磨线 2', '02 打磨线 1', '03 打磨线 1'],
      selectedValues: processGrindFeatures,
      onToggle: toggleStringSelection(setProcessGrindFeatures),
      invalidText: '请先选择打磨特征',
      pointMode: 'pose' as const,
      pointTitle: '结果点位',
      pointSubtitle: 'P1-6(n) · XYZ/RPY',
      showPathPointEntry: true,
      pathSubtitle: '6个安全点',
    },
    {
      title: '装配定位任务面板',
      selectionLabel: '装配基准特征',
      selectionPlaceholder: '请选择装配基准特征',
      actionLabel: '生成定位路径',
      options: ['02 01装配基准', '04 03装配基准', '04 03 02 01装配基准'],
      selectedValues: processDatumFeatures,
      onToggle: toggleStringSelection(setProcessDatumFeatures),
      invalidText: '请先选择装配基准特征',
      pointMode: 'pose' as const,
      pointTitle: '结果点位',
      pointSubtitle: 'P1-3/4(n) · XYZ/RPY',
      showPathPointEntry: true,
      pathSubtitle: 'n×6个安全点',
    },
    {
      title: '翻面压紧任务面板',
      selectionLabel: '工件模型选择',
      selectionPlaceholder: '请选择工件模型',
      actionLabel: '生成压紧位置',
      options: ['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03'],
      selectedValues: processParts,
      onToggle: toggleStringSelection(setProcessParts),
      invalidText: '所选工件不相接',
      pointMode: 'joint' as const,
      pointTitle: '结果点位',
      pointSubtitle: 'J1-J8',
      showPathPointEntry: false,
      showClampParameters: true,
      clampWorkbenchType: turnoverClampWorkbenchType,
      processClampIds: turnoverClampIds,
      clampCoverageById: turnoverClampCoverageById,
      onProcessClampToggle: (clampId: string) =>
        setTurnoverClampIds((prev) => {
          const nextClampIds = prev.includes(clampId) ? prev.filter((id) => id !== clampId) : [...prev, clampId];
          setProcessJoints(calculateDemoClampJointRows(turnoverClampWorkbenchType, nextClampIds));
          return nextClampIds;
        }),
    },
    {
      title: '焊接任务面板',
      selectionLabel: '焊缝特征选择',
      selectionPlaceholder: '请选择焊缝特征',
      actionLabel: '生成扫描与焊接路径',
      options: ['01-02 焊缝', '03-04 焊缝', '03+04-02+01 焊缝'],
      selectedValues: processWeldFeatures,
      onToggle: toggleStringSelection(setProcessWeldFeatures),
      invalidText: '请先选择焊缝特征',
      pointMode: 'weldSegment' as const,
      pointTitle: '扫描 / 焊接结果点位',
      pointSubtitle: '各 6 组 · XYZ/RPY',
      showPathPointEntry: true,
      pathSubtitle: '扫描与焊接各 6 组安全点',
    },
  ];

  const componentSectionMeta: Record<ComponentSection, { id: ComponentSection; title: string; description: string }> = {
    button: { id: 'button', title: '按钮', description: '主操作、次级、无底重点色描边按钮。' },
    'main-nav-menu': { id: 'main-nav-menu', title: '主导航仿真菜单', description: '仿真任务切换菜单的打开行为、条目层级和来源文案。' },
    tree: { id: 'tree', title: '树结构条目', description: '项目、工件、工序和模型对象的层级选择与结构导航。' },
    modal: { id: 'modal', title: '弹窗样式', description: '确认、表单、大型参数设置和视窗内浮层的统一外壳。' },
    toast: { id: 'toast', title: 'Toast 提示', description: '全局反馈、导入结果、保存状态和异常提示。' },
    'global-alert': { id: 'global-alert', title: '全局异常 Alert', description: '右上角常驻异常通知，支持查看详情跳转。' },
    'unit-number': { id: 'unit-number', title: '带单位输入框', description: 'sm / md / lg，对齐规则和状态变体。' },
    number: { id: 'number', title: '数字输入框 + 单位', description: '白底输入、固定单位、异常边框。' },
    range: { id: 'range', title: '范围输入框', description: '最小 / 最大数值校验。' },
    slider: { id: 'slider', title: '百分比 Slider', description: '滑杆、刻度、右侧数值输入。' },
    multi: { id: 'multi', title: '多选控件', description: '小型 chip 多选，支持空选择异常。' },
    'support-settings': { id: 'support-settings', title: '支撑参数组', description: '支撑编号下方按编号生成宽度、零件位置和软限位范围。' },
    checkbox: { id: 'checkbox', title: 'Checkbox', description: '树节点、多选下拉、复合选择控件共用的勾选原语。' },
    'object-select': { id: 'object-select', title: '对象/特征选择下拉', description: '零件单选、工件/特征多选共用视觉规范。' },
    'axis-row': { id: 'axis-row', title: '轴向单位输入行', description: 'YZ / XYZ / RXYZ 偏移类参数。' },
    'point-row': { id: 'point-row', title: '点位信息单行', description: '点位名称 + XYZ/RPY 回显与编辑。' },
    'pick-path-points': { id: 'pick-path-points', title: '工艺安全点浮窗', description: '打磨单组安全点、图例折叠、单点启用和 6 个 XYZ / RPY 点位。' },
    'clamp-point-config': { id: 'clamp-point-config', title: '压紧点配置面板', description: '内嵌于焊缝段表格当前段，承载启用压紧开关与 J1-J6 关节角编辑。' },
    'joint-row': { id: 'joint-row', title: '关节角组件', description: '外部轴与 URDF 姿态共用的 slider + stepper 行，支持标签、单位、范围和步长配置。' },
    'pick-parameters': { id: 'pick-parameters', title: '抓取参数校验区', description: '抓具切换、磁铁启用、左/右 Z 值、中磁铁 Z 只读、磁力档位与阈值回显。' },
    'viewport-workspace': { id: 'viewport-workspace', title: '视窗工作区组件', description: '3D 视窗壳、视窗内浮层、模型对象 pill 和特征回显，不混入任务面板。' },
    'virtual-simulation': { id: 'virtual-simulation', title: '虚拟仿真多焊接任务', description: '第 06 道双焊接任务、双加工程序和分页生成交互。' },
    'process-panel': { id: 'process-panel', title: '工艺规划工序与任务面板', description: '样式 C 固定工序总览、工序内任务，以及旧样式任务详情变体。' },
    'production-task-panels': { id: 'production-task-panels', title: '生产执行整页预览', description: '对照查看旧版 24 条工序与新版工件分组 16 条聚合任务。' },
    'production-execution': { id: 'production-execution', title: '生产执行组件', description: '生产执行工位卡片、产线轴测回显和底部设备状态。' },
    'tray-card': { id: 'tray-card', title: '托盘管理组件状态', description: '生产执行托盘管理、AGV 调度、托盘整体视图和托盘清单卡片。' },
    composite: { id: 'composite', title: '组合参数卡片', description: '工艺参数设置里的组合控件。' },
  };
  const componentPageTabs: { id: ComponentSectionPage; title: string; description: string }[] = [
    { id: 'general', title: '基础交互', description: '跨页面复用的控件、结构、浮层与反馈。' },
    { id: 'process-execution', title: '工艺执行', description: '工艺参数、路径点位、3D 视窗和工艺规划任务面板。' },
    { id: 'production-execution', title: '生产执行', description: '生产工位、设备状态、托盘管理和 AGV 调度。' },
  ];
  const componentSectionLayers: ComponentSectionLayer[] = [
    {
      id: 'foundation',
      page: 'general',
      title: '基础交互控件',
      description: '只沉淀跨页面可复用的输入、选择、按钮和状态原语。',
      sections: ['button', 'global-alert', 'unit-number', 'number', 'range', 'slider', 'multi', 'checkbox', 'object-select'],
    },
    {
      id: 'navigation-feedback',
      page: 'general',
      title: '导航、浮层与反馈',
      description: '树结构、弹窗和 Toast 归入交互组件，不再作为正式 Lab 的一级规范页。',
      sections: ['main-nav-menu', 'tree', 'modal', 'toast'],
    },
    {
      id: 'domain-composite',
      page: 'process-execution',
      title: '领域复合组件',
      description: '表达工艺参数、点位、路径、关节角和组合配置等领域控件。',
      sections: ['axis-row', 'point-row', 'pick-path-points', 'clamp-point-config', 'joint-row', 'pick-parameters', 'support-settings', 'composite'],
    },
    {
      id: 'workspace-viewport',
      page: 'process-execution',
      title: '工作区 / 视窗组件',
      description: '承载 3D 视窗内工具条、特征提取浮层、模型对象选择和视窗反馈；不归入任务面板。',
      sections: ['viewport-workspace'],
    },
    {
      id: 'process-application',
      page: 'process-execution',
      title: '工艺执行场景变体',
      description: '展示样式 C 工序规划两级结构、虚拟仿真多焊接任务和工序内任务详情。',
      sections: ['virtual-simulation', 'process-panel'],
    },
    {
      id: 'production-application',
      page: 'production-execution',
      title: '场景应用变体',
      description: '展示生产执行现场组件、托盘管理、AGV 调度和托盘整体视图。',
      sections: ['production-task-panels', 'production-execution', 'tray-card'],
    },
  ];
  const componentSections = Object.values(componentSectionMeta);
  const visibleComponentPageTabs = activeTab === 'business'
    ? componentPageTabs.filter((page) => page.id !== 'general')
    : componentPageTabs.filter((page) => page.id === 'general');
  const visibleComponentSectionLayers = componentSectionLayers.filter((layer) => layer.page === activeComponentPage);
  const visibleComponentSectionIds = visibleComponentSectionLayers.flatMap((layer) => layer.sections);
  const shownComponentSection = visibleComponentSectionIds.includes(activeComponentSection) ? activeComponentSection : visibleComponentSectionIds[0];
  const visibleExpandedComponentLayerId = visibleComponentSectionLayers.some((layer) => layer.id === expandedComponentLayerId)
    ? expandedComponentLayerId
    : visibleComponentSectionLayers[0]?.id;
  const activeComponentLayer = visibleComponentSectionLayers.find((layer) => layer.sections.includes(shownComponentSection)) ?? visibleComponentSectionLayers[0];
  const activeComponentMeta = componentSections.find((item) => item.id === shownComponentSection) ?? componentSections[0];
  const switchComponentPage = (page: ComponentSectionPage) => {
    setActiveComponentPage(page);
    const firstLayer = componentSectionLayers.find((layer) => layer.page === page);
    if (firstLayer) {
      setExpandedComponentLayerId(firstLayer.id);
      const firstSection = firstLayer.sections[0];
      if (firstSection) setActiveComponentSection(firstSection);
    }
  };
  const switchLabTab = (tab: LabTab) => {
    setActiveTab(tab);
    if (tab === 'interaction') {
      switchComponentPage('general');
      return;
    }
    if (tab === 'business') {
      const nextPage = activeComponentPage === 'production-execution' ? 'production-execution' : 'process-execution';
      switchComponentPage(nextPage);
    }
  };
  const expandComponentLayer = (layer: ComponentSectionLayer) => {
    setExpandedComponentLayerId(layer.id);
    if (!layer.sections.includes(shownComponentSection)) {
      setActiveComponentSection(layer.sections[0]);
    }
  };
  const styleRows = [
    ['圆角', shownComponentSection === 'process-panel' ? '12px 外层 / 8px 输入框' : '8px 输入框 / 12px 面板'],
    ['Stroke', '输入框 slate-200，异常 red-300，选中 orange-200'],
    ['背景', shownComponentSection === 'process-panel' ? '外层 slate-50/80，输入白底' : '白底为主，局部 slate-50 弱分区'],
    ['字体', '标题 text-sm / label text-xs / 单位 text-[11px]'],
    ['主题色', 'orange 用于主选中与关键操作，red 用于异常，emerald 用于通过状态'],
  ];

  const renderComponentDetail = (section: ComponentSection = activeComponentSection) => {
    switch (section) {
      case 'button':
        return (
          <DemoCard title="按钮变体">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="mb-3 text-xs text-slate-400">重点描边 / brandOutline</div>
                <Button size="sm" variant="brandOutline" className="h-8 rounded-full px-3 text-xs">
                  <Cog className="size-3.5" />
                  工艺参数设置
                </Button>
                <div className="mt-2 text-[11px] leading-4 text-slate-400">透明背景，2px brand-RoboticsAi.600 stroke，文字和 icon 同色。</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="mb-3 text-xs text-slate-400">常规主操作</div>
                <Button size="sm" className="h-8 rounded-full px-3 text-xs">
                  <Sparkles className="size-3.5" />
                  一键生成任务
                </Button>
                <div className="mt-2 text-[11px] leading-4 text-slate-400">用于确认、生成、保存等最高优先级动作。</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="mb-3 text-xs text-slate-400">禁用状态</div>
                <Button size="sm" variant="brandOutline" className="h-8 rounded-full px-3 text-xs" disabled>
                  <Cog className="size-3.5" />
                  工艺参数设置
                </Button>
                <div className="mt-2 text-[11px] leading-4 text-slate-400">禁用沿用按钮基础透明度，不额外铺背景。</div>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">Primary 禁用状态</div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-400">主按钮禁用使用中性浅灰底；圆角保持按钮默认 8px。</div>
                </div>
                <div className="text-[11px] text-slate-400">secondary 保持透明度方案</div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="mb-3 text-xs text-slate-400">Primary / 中性浅灰底</div>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled
                  >
                    <Sparkles className="size-3.5" />
                    确认解析
                  </Button>
                  <div className="mt-2 text-[11px] leading-4 text-slate-400">最低存在感，适合不抢主流程视线。</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="mb-3 text-xs text-slate-400">Secondary / 当前透明度</div>
                  <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" disabled>
                    取消
                  </Button>
                  <div className="mt-2 text-[11px] leading-4 text-slate-400">次级按钮继续沿用 opacity-50。</div>
                </div>
              </div>
            </div>
          </DemoCard>
        );
      case 'main-nav-menu':
        return (
          <DemoCard title="主导航 / 虚拟仿真任务菜单">
            <MainNavigationMenuDemo />
          </DemoCard>
        );
      case 'virtual-simulation':
        return (
          <DemoCard title="虚拟仿真 / 多焊接任务与程序生成">
            <VirtualSimulationMultiWeldDemo />
          </DemoCard>
        );
      case 'tree':
        return <TreeCatalogTab />;
      case 'modal':
        return <ModalCatalogTab />;
      case 'toast':
        return <ToastCatalogTab />;
      case 'global-alert':
        return (
          <DemoCard title="全局异常 Alert">
            <GlobalAlertDemoWithProvider />
          </DemoCard>
        );
      case 'unit-number':
        return (
          <DemoCard title="带单位输入框变体">
            <UnitNumberInputVariantsDemo
              value={numberValue}
              invalid={invalid}
              disabled={disabled}
              onChange={setNumberValue}
            />
          </DemoCard>
        );
      case 'number':
        return (
          <DemoCard title="数字输入框 + 单位">
            <div className="max-w-sm">
              <div className="ds-parameter-label">支撑宽度</div>
              <NumberFieldDemo value={displayValues.numberValue} disabled={disabled} unit="mm" onChange={setNumberValue} />
            </div>
          </DemoCard>
        );
      case 'range':
        return (
          <DemoCard title="范围输入框">
            <RangeFieldDemo
              minValue={displayValues.minValue}
              maxValue={displayValues.maxValue}
              disabled={disabled}
              minLabel="最小间距"
              maxLabel="最大间距"
              unit="mm"
              onMinChange={setMinValue}
              onMaxChange={setMaxValue}
            />
          </DemoCard>
        );
      case 'slider':
        return (
          <DemoCard title="百分比 Slider + 输入框">
            <PercentSliderDemo value={displayValues.percentValue} disabled={disabled} onChange={setPercentValue} />
          </DemoCard>
        );
      case 'multi':
        return (
          <DemoCard title="多选控件">
            <MultiSelectDemo
              label="支撑编号（多选）"
              values={['1', '2', '3', '4', '5']}
              selectedValues={displayValues.selectedValues}
              disabled={disabled}
              onToggle={(item) =>
                setSelectedValues((prev) =>
                  prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]
                )
              }
            />
          </DemoCard>
        );
      case 'support-settings':
        return (
          <DemoCard title="支撑编号参数组">
            <div className="space-y-4">
              <MultiSelectDemo
                label="支撑编号"
                values={['1', '2', '3', '4', '5']}
                selectedValues={displayValues.selectedValues}
                disabled={disabled}
                onToggle={toggleSupportSelection}
              />
              {displayValues.selectedValues.length > 0 && (
                <div className="grid gap-ds-150 xl:grid-cols-2">
                  {displayValues.selectedValues.map((supportId) => {
                    const supportSetting = supportSettings[supportId] ?? createDefaultWorkbenchSupportSetting(supportId);
                    const supportAxes = getDemoWorkbenchSupportAxes(supportId);
                    return (
                      <div key={supportId} className="ds-parameter-card-inset rounded-ds-xl bg-zinc-100/55 ring-1 ring-ds-border-default">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="text-sm font-medium text-slate-700">支撑 {supportId}</div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">编号 {supportId}</span>
                        </div>
                        <div className="grid gap-ds-150 md:grid-cols-2">
                          <div>
                            <div className="ds-parameter-label">支撑宽度</div>
                            <NumberFieldDemo
                              value={invalid ? '-20' : supportSetting.width}
                              unit="mm"
                              disabled={disabled}
                              onChange={(nextValue) =>
                                updateSupportSetting(supportId, (setting) => ({
                                  ...setting,
                                  width: nextValue,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <div className="ds-parameter-label">零件位置</div>
                            <div className={`grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
                              {['左端', '右端'].map((item) => {
                                const selected = supportSetting.partPosition === item;
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    aria-pressed={selected}
                                    disabled={disabled}
                                    className={`min-h-8 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-white text-ds-brand-primary-text shadow-sm'
                                        : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                                    }`}
                                    onClick={() =>
                                      updateSupportSetting(supportId, (setting) => ({
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
                            const shownMinValue = invalid && axis === supportAxes[0] ? '' : supportSetting.softLimits[axis].min;
                            const shownMaxValue = invalid && axis === supportAxes[0] ? '300' : supportSetting.softLimits[axis].max;
                            const axisWarningText = disabled ? '' : getNumberRangeWarning(shownMinValue, shownMaxValue);
                            const axisRangeInvalid = Boolean(axisWarningText);
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
                              <RangeFieldDemo
                                minValue={shownMinValue}
                                maxValue={shownMaxValue}
                                disabled={disabled}
                                minLabel="最小值"
                                maxLabel="最大值"
                                unit="mm"
                                warningPlacement="none"
                                onMinChange={(nextValue) =>
                                  updateSupportSetting(supportId, (setting) => ({
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
                                  updateSupportSetting(supportId, (setting) => ({
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
            </div>
          </DemoCard>
        );
      case 'checkbox':
        return (
          <DemoCard title="Checkbox">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[
                { label: '默认', props: {} },
                { label: '选中', props: { checked: true } },
                { label: '半选', props: { indeterminate: true } },
                { label: '异常', props: { invalid: true } },
                { label: '置灰', props: { checked: true, disabled: true } },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="mb-3 text-xs text-slate-400">{item.label}</div>
                  <div className="flex items-center gap-2">
                    <ThemedCheckbox {...item.props} aria-label={item.label} />
                    <span className="text-xs text-slate-600">工件模型</span>
                  </div>
                </div>
              ))}
            </div>
          </DemoCard>
        );
      case 'object-select':
        return (
          <DemoCard title="对象/特征选择下拉">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="ds-parameter-label">零件单选 / 特征提取</div>
                <ObjectSingleSelectDemo
                  values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-04']}
                  selectedValue={invalid ? '0162-01-010101-04' : objectSelectValue}
                  disabled={disabled}
                  invalid={invalid}
                  placeholder="请选择零件"
                  onChange={setObjectSelectValue}
                />
                <div className="mt-2 text-[11px] leading-4 text-slate-400">用于焊缝/打磨/装配特征提取里的零件 A、零件 B。</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="ds-parameter-label">零件单选 / 紧凑 28px</div>
                <ObjectSingleSelectDemo
                  values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-04']}
                  selectedValue="0162-01-010101-01"
                  disabled={disabled}
                  invalid={invalid}
                  placeholder="请选择零件"
                  size="sm"
                  onChange={() => undefined}
                />
                <div className="mt-2 text-[11px] leading-4 text-slate-400">用于紧凑特征提取场景；单选触发框统一无阴影。</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="ds-parameter-label">对象多选 / 任务配置</div>
                <ObjectMultiSelectDemo
                  values={['0162-01-010101-01', '0162-01-010101-02', '01 打磨线 1', '01-02 焊缝', '02 01装配基准']}
                  selectedValues={invalid ? ['0162-01-010101-01', '01-02 焊缝'] : processParts}
                  disabled={disabled}
                  invalid={invalid}
                  placeholder="请选择工件模型 / 特征"
                  onToggle={toggleStringSelection(setProcessParts)}
                />
                <div className="mt-2 text-[11px] leading-4 text-slate-400">用于工件模型、焊缝特征、打磨特征、装配基准特征的多选；触发框统一无阴影。</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="ds-parameter-label">对象多选 / 紧凑 28px</div>
                <ObjectMultiSelectDemo
                  values={['0162-01-010101-01', '0162-01-010101-02', '01 打磨线 1', '01-02 焊缝', '02 01装配基准']}
                  selectedValues={invalid ? ['0162-01-010101-01', '01-02 焊缝', '02 01装配基准'] : processParts}
                  disabled={disabled}
                  invalid={invalid}
                  placeholder="请选择工件模型 / 特征"
                  size="sm"
                  onToggle={toggleStringSelection(setProcessParts)}
                />
                <div className="mt-2 text-[11px] leading-4 text-slate-400">用于样式 C 高密度区域，触发器固定 28px 且无阴影，超出选项折叠为数量。</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="ds-parameter-label">全选多选 / 坐标转换</div>
                <ObjectMultiSelectDemo
                  values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03', '0162-01-010101-04']}
                  selectedValues={processParts}
                  disabled={disabled}
                  invalid={invalid}
                  placeholder="请选择零件对象"
                  showSelectAll
                  onToggle={toggleStringSelection(setProcessParts)}
                  onChange={setProcessParts}
                />
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-2 text-[11px] font-medium text-slate-500">重选中心</div>
                  <div className="grid grid-cols-[minmax(0,1fr)_84px] gap-2">
                    <ObjectMultiSelectDemo
                      values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03', '0162-01-010101-04']}
                      selectedValues={coordinatePivotTargets}
                      disabled={disabled}
                      invalid={invalid}
                      placeholder="请选择中心目标"
                      size="sm"
                      onChange={setCoordinatePivotTargets}
                    />
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={disabled}>
                      吸附选点
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button size="sm" className="h-8 w-full px-2 text-xs bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" disabled={disabled}>
                      设为中心
                    </Button>
                  </div>
                  <div className="mt-2 text-[11px] leading-4 text-slate-400">目标零件限定视窗内可点选的 bbox 角点、体积中心和面中心。</div>
                </div>
              </div>
            </div>
          </DemoCard>
        );
      case 'axis-row':
        return (
          <DemoCard title="轴向单位输入行">
            <div className="space-y-ds-150">
              <AxisUnitInputRowDemo
                label="电磁铁位置"
                values={invalid ? { y: '-20', z: 'abc' } : axisRow}
                axes={['y', 'z']}
                unit="mm"
                disabled={disabled}
                selected={previewPanelPoint?.panelTitle === '轴向单位输入行' && previewPanelPoint.pointIndex === 0}
                selectedVariant="subtle"
                onSelect={() => setPreviewPanelPoint({ panelTitle: '轴向单位输入行', pointIndex: 0 })}
                onAxisChange={(axis, value) => setAxisRow((prev) => ({ ...prev, [axis]: value }))}
              />
              <div className="mt-ds-200 rounded-xl bg-slate-50/80 p-ds-150">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">工件模型选择</div>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={disabled}>
                      生成抓取位置
                    </Button>
                  </div>
                  <ObjectMultiSelectDemo
                    values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-03']}
                    selectedValues={processParts}
                    disabled={disabled}
                    invalid={invalid}
                    placeholder="请选择工件模型"
                    onToggle={toggleStringSelection(setProcessParts)}
                  />
                  <div className="mt-ds-200 space-y-2">
                    {[
                      ['电磁铁覆盖率', '70.99%'],
                      ['安全系数', '0.72'],
                      ['偏心距', '168mm'],
                    ].map(([label, result]) => (
                      <div key={label} className="flex min-h-8 items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-100">
                        <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-9">
                          <div className="text-xs text-ds-text-parameter-label">{label}</div>
                          <div className="truncate text-xs font-medium text-slate-700">{result}</div>
                        </div>
                        <div className="shrink-0">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
                            满足阈值
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                <ProcessResultPointPanel
                  title="路径点位"
                  subtitle="6个安全点"
                  dirty={processPanelDirty}
                  surfaceClassName="bg-slate-50/80"
                  className="mt-ds-200"
                  action={
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" disabled={disabled}>
                      <Move3D className="size-3" />
                      查看路径点位
                    </Button>
                  }
                />
              </div>
            </div>
          </DemoCard>
        );
      case 'point-row':
        return (
          <DemoCard title="样式 C 点位信息组件（xyz + rpy）">
              <div className="mb-2 text-xs font-medium text-slate-500">任务列表路径点位当前态</div>
                <div className="w-[396px] max-w-full rounded-lg bg-slate-50/80 p-1.5">
                  <div className="space-y-1.5">
                    <StyleCPathPosePointInfoRowDemo
                      label="点位 1"
                      point={invalid ? { x: '-20', y: 'abc', z: '15.0', rx: '0.0', ry: '85.0', rz: '0.0' } : pointRowWithRPY}
                      disabled={disabled}
                      selected={previewPointRowIndex === 8}
                      onSelect={() => setPreviewPointRowIndex(8)}
                      onAxisChange={(axis, value) => setPointRowWithRPY((prev) => ({ ...prev, [axis]: value }))}
                    />
                    <StyleCPathPosePointInfoRowDemo
                      label="点位 2"
                      point={{ x: '210.0', y: '88.0', z: '12.0', rx: '0.0', ry: '88.0', rz: '0.0' }}
                      disabled={disabled}
                      selected={previewPointRowIndex === 9}
                      onSelect={() => setPreviewPointRowIndex(9)}
                      onAxisChange={() => {}}
                      defaultCollapsed
                    />
                  </div>
                </div>
                <div className="mt-2 w-[396px] max-w-full text-[11px] leading-5 text-slate-400">
                  样式 C 路径点位使用轻量选中态；旧 xyz / xyz+rpy 橙色强调态已迁入过程稿页，不再作为当前组件展示。
                </div>
            </DemoCard>
        );
      case 'pick-path-points':
        return (
          <DemoCard title="工艺安全点浮窗">
            <PickPathPointsDemo
              points={invalid ? pickPathPoints.map((point, index) => (index === 1 ? { ...point, z: 'abc', ry: '-20' } : point)) : pickPathPoints}
              disabled={disabled}
              onAxisChange={(pointIndex, axis, value) =>
                setPickPathPoints((prev) =>
                  prev.map((point, index) => (index === pointIndex ? { ...point, [axis]: value } : point))
                )
              }
              onToggleEnabled={(pointIndex, enabled) =>
                setPickPathPoints((prev) =>
                  prev.map((point, index) => (index === pointIndex ? { ...point, enabled } : point))
                )
              }
              onReset={() => setPickPathPoints(createDefaultPickPathPointDemoValues())}
            />
            <div className="mt-3 text-[11px] leading-5 text-slate-400">
              C/D 工艺规划布局中，打磨安全点浮窗使用单组 6 点，不显示分组 tab；安全点调整输入使用独立 SafetyPointNumberInput 变体，不显示单位字符和上下箭头。
            </div>
          </DemoCard>
        );
      case 'clamp-point-config':
        return (
          <DemoCard title="压紧点配置面板">
            <div className="w-[420px] max-w-full rounded-lg bg-white p-2 ring-1 ring-slate-100">
              <div className="mb-2 flex gap-0.5 rounded-lg bg-ds-bg-segmented p-0.5">
                {clampPointSegments.map((_, segmentIndex) => {
                  const active = clampPointActiveSegmentIndex === segmentIndex;
                  return (
                    <button
                      key={`lab-clamp-segment-${segmentIndex}`}
                      type="button"
                      className={`h-7 shrink-0 rounded-md px-2.5 text-[11px] transition-colors ${
                        active ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-zinc-500 hover:bg-white/70'
                      }`}
                      onClick={() => setClampPointActiveSegmentIndex(segmentIndex)}
                    >
                      焊缝段{segmentIndex + 1}
                    </button>
                  );
                })}
              </div>
              <ClampPointConfigPanel
                segment={clampPointSegments[clampPointActiveSegmentIndex]}
                onToggleEnabled={(enabled) =>
                  setClampPointSegments((prev) =>
                    prev.map((segment, index) => (index === clampPointActiveSegmentIndex ? { ...segment, enabled } : segment))
                  )
                }
                onJointChange={(jointIndex, value) =>
                  setClampPointSegments((prev) =>
                    prev.map((segment, index) =>
                      index === clampPointActiveSegmentIndex
                        ? { ...segment, joints: segment.joints.map((joint, jointIdx) => (jointIdx === jointIndex ? value : joint)) }
                        : segment
                    )
                  )
                }
              />
            </div>
            <div className="mt-3 text-[11px] leading-5 text-slate-400">
              样式 C 焊接任务路径点位改为焊缝段表格：段切换由外层段列表承担，本面板内嵌于选中段的「压紧配置」视图，只负责当前段的启用压紧开关与 J1-J6 关节角编辑（J1 为 mm、其余为 °）；关闭压紧后关节角行禁用。已取代原压紧点配置浮窗。
            </div>
          </DemoCard>
        );
      case 'joint-row':
        return (
          <DemoCard title="翻面压紧关节角组件">
            <div className="w-[396px] max-w-full rounded-xl bg-slate-50/80 p-ds-150">
              <div className="grid gap-2">
                {processJoints.map((value, index) => (
                  <JointAngleRowDemo
                    key={index}
                    index={index}
                    value={invalid && index === 1 ? 'abc' : value}
                    disabled={disabled}
                    selected={previewJointIndex === index}
                    selectedVariant="subtle"
                    onSelect={() => setPreviewJointIndex(index)}
                    onChange={(nextValue) => setProcessJoints((prev) => prev.map((item, itemIndex) => (itemIndex === index ? nextValue : item)))}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/70 p-ds-150">
              <div className="mb-2 text-[11px] font-medium text-slate-600">URDF 姿态范围配置示例</div>
              <div className="grid gap-2">
                <JointAngleRowDemo
                  index={0}
                  label="滑台"
                  value={urdfJointDemoValues[0]}
                  unit="mm"
                  min={0}
                  max={8000}
                  step={1}
                  disabled={disabled}
                  selectedVariant="subtle"
                  onChange={(value) => setUrdfJointDemoValues((current) => [value, current[1]])}
                />
                <JointAngleRowDemo
                  index={1}
                  label="J1"
                  value={invalid ? 'abc' : urdfJointDemoValues[1]}
                  unit="°"
                  min={-169.5}
                  max={169.5}
                  step={0.1}
                  disabled={disabled}
                  selectedVariant="subtle"
                  onChange={(value) => setUrdfJointDemoValues((current) => [current[0], value])}
                />
              </div>
              <div className="mt-2 text-[11px] leading-5 text-slate-400">
                虚拟仿真使用同一组件传入 URDF 标签、单位、实际限位和步长；外部轴默认范围不受影响。
              </div>
            </div>
            <div className="mt-2 w-[396px] max-w-full text-[11px] leading-5 text-slate-400">
              按右侧任务列表实际内容宽度展示，避免在组件库宽卡片中误判 slider/input 比例。
            </div>
          </DemoCard>
        );
      case 'pick-parameters':
        return (
          <DemoCard title="抓取参数校验区">
            <div className="space-y-3">
              <div className="w-[396px] max-w-full rounded-xl bg-slate-50/80 px-ds-150 pb-ds-150 ds-task-parameter-detail-top">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">样式 C · 抓取工艺磁铁行卡片</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">已用于样式 C 抓取工艺；旧三列磁铁和齿轮浮窗已迁入过程稿页。</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-100">样式 C 当前应用</span>
                </div>
                <PickMagnetRowCardsDemo
                  magnets={pickMagnets}
                  forceLevels={pickMagnetForceLevels}
                  disabled={disabled}
                  invalid={invalid}
                  onMagnetEnabledChange={(key, enabled) =>
                    setPickMagnets((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], enabled },
                    }))
                  }
                  onMagnetZChange={(key, value) =>
                    setPickMagnets((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], z: value },
                    }))
                  }
                  onMagnetForceLevelChange={(key, value) =>
                    setPickMagnetForceLevels((prev) => ({
                      ...prev,
                      [key]: value,
                    }))
                  }
                />
              </div>
            </div>
          </DemoCard>
        );
      case 'process-panel':
        return (
          <DemoCard title="工艺规划任务面板">
            <PlanningProcessCardEvolutionDemo />
            <div className="my-6 h-px bg-slate-100" />
            <div className="mb-4 max-w-[820px]">
              <div className="mb-3">
                <div className="text-xs font-semibold text-slate-800">样式 C · 任务主选中与详情查看态</div>
                <div className="mt-1 text-[11px] leading-5 text-slate-400">
                  任务聚焦使用浅橙 fill + 品牌描边；退出任务聚焦或主选中转移到结构树后，保留中性任务表面 + 品牌描边以表示详情仍在展示。
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <div className="mb-2 text-[11px] font-medium text-slate-500">任务聚焦 / 当前主选中</div>
                  <PlanningTaskLongRowDemo index={1} type="assemble" title="装配" selected dirty />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 text-[11px] font-medium text-slate-500">仅展示详情 / 无主选中 fill</div>
                  <PlanningTaskLongRowDemo index={1} type="assemble" title="装配" selected focusDetached />
                </div>
              </div>
            </div>
            <div className="my-6 h-px bg-slate-100" />
            <div className="mb-4 max-w-[620px] overflow-hidden rounded-ds-md border border-ds-border-process-planning-structure bg-zinc-100/55">
              <ProcessDetailTabBar
                tabs={[
                  { key: 'parameter-results', label: '工艺参数' },
                  { key: 'path-points', label: '路径点位' },
                ]}
                activeKey="parameter-results"
                onChange={() => undefined}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!font-normal h-6 px-1.5 text-[11px] text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text disabled:text-slate-300 disabled:hover:bg-transparent"
                    disabled={disabled}
                  >
                    重置
                  </Button>
                }
              />
            </div>
            <div className="mb-4 w-[396px] max-w-full rounded-xl bg-slate-50/80 px-ds-150 pb-ds-150 ds-task-parameter-detail-top">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-800">样式 C · 打磨任务工艺参数详情</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">任务详情普通工艺参数左对齐；路径点位和安全点数值继续右对齐。</div>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-100">样式 C 当前应用</span>
              </div>
              <div className="grid gap-ds-150 sm:grid-cols-2">
                {compactGrindParameterDemoItems.map(([label, value, unit]) => (
                  <div key={label} className="ds-label-input-compact">
                    <div className={compactProcessParameterNameDemoClassName}>{label}</div>
                    <UnitNumberInputDemo value={value} unit={unit} disabled={disabled} size="sm" align="left" onChange={() => {}} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4 flex w-[396px] max-w-full flex-col gap-ds-300 rounded-xl bg-slate-50/80 px-ds-150 pb-ds-150 ds-task-parameter-detail-top">
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 text-xs font-medium text-zinc-700">
                  <ScanFace className="size-3.5 text-ds-brand-primary-text" />
                  扫描参数
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="ds-label-input-compact">
                    <div className={compactProcessParameterNameDemoClassName}>扫描距离</div>
                    <UnitNumberInputDemo value="180" unit="mm" disabled={disabled} size="sm" align="left" onChange={() => {}} />
                  </div>
                  <div className="ds-label-input-compact">
                    <div className={compactProcessParameterNameDemoClassName}>扫描偏移 ΔZ</div>
                    <UnitNumberInputDemo value="80" unit="mm" disabled={disabled} size="sm" align="left" onChange={() => {}} />
                  </div>
                </div>
              </section>
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 text-xs font-medium text-zinc-700">
                  <Hammer className="size-3.5 text-ds-brand-primary-text" />
                  焊接参数
                </div>
                <div className="max-w-[180px] ds-label-input-compact">
                  <div className={compactProcessParameterNameDemoClassName}>焊脚高度</div>
                  <UnitNumberInputDemo value="6" unit="mm" disabled={disabled} size="sm" align="left" onChange={() => {}} />
                </div>
              </section>
            </div>
            <div className="max-w-[760px] overflow-hidden rounded-xl border border-slate-100 bg-white">
              <div className="grid grid-cols-[120px_180px_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
                <div>工序</div>
                <div>当前详情页签</div>
                <div>覆盖内容</div>
              </div>
              {processPanelCoverageRows.map(([processName, tabs, coverage]) => (
                <div key={processName} className="grid grid-cols-[120px_180px_minmax(0,1fr)] border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
                  <div className="font-medium text-slate-700">{processName}</div>
                  <div>{tabs}</div>
                  <div className="text-slate-500">{coverage}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 max-w-[760px] text-[11px] leading-5 text-slate-400">
              七套完整 A/B 大卡片已迁入过程稿页；当前交互组件页只保留样式 C 参数详情和覆盖矩阵，避免工艺执行页重复铺满。
            </div>
          </DemoCard>
        );
      case 'viewport-workspace':
        return (
          <>
            <DemoCard title="工艺规划工具栏 / 状态样式">
              <div className="mb-4 max-w-3xl text-[11px] leading-5 text-slate-400">
                保存按钮无修改时保留工具栏底色，只弱化文字与 icon；缺少焊缝特征时，打磨特征和装配特征同步进入真正 disabled 状态。主页面中间 6 个入口按 320px 左栏 / 420px 右栏之间的 3D 有效视窗居中。
              </div>
              <ProcessPlanningToolbarStatesDemo />
            </DemoCard>
            <DemoCard title="视窗工作区组件">
              <div className="mb-4 max-w-2xl text-[11px] leading-5 text-slate-400">
                视窗组件只治理 3D 工作区内的壳、工具、浮层和模型对象回显，不承载工艺规划任务列表或生产执行托盘语义；模型选中保留原色并使用橙色轮廓，隔离背景使用中性低饱和材质。
              </div>
              <ViewCubeComponentLabPreview />
              <ComponentLabPathPointMarkerPreview />
              <div className="mb-4 max-w-[420px]">
                <div className="mb-2 text-xs font-medium text-slate-700">虚拟仿真 / 调整装配体位置浮窗</div>
                <SimulationAssemblyPositionOverlayDemo />
                <div className="mb-2 mt-5 text-xs font-medium text-slate-700">虚拟仿真 / 机器人位姿回显浮窗</div>
                <SimulationRobotPoseOverlayDemo />
              </div>
              <div className="relative h-[360px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:48px_48px] p-4">
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/60 bg-white/72 px-2 py-1.5 shadow-ds-sm backdrop-blur-md">
                {[
                  { label: '坐标转换', icon: Move3D },
                  { label: '焊缝提取', icon: Flame },
                  { label: '打磨提取', icon: Sparkles },
                  { label: '装配基准', icon: Target },
                ].map((item, index) => (
                  <Tooltip key={item.label} title={item.label}>
                    <button
                      type="button"
                      className={`flex size-8 items-center justify-center rounded-md transition-colors ${index === 1 ? 'bg-orange-50 text-ds-brand-primary-text' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                    >
                      <item.icon className="size-4" />
                    </button>
                  </Tooltip>
                ))}
              </div>
              <CurrentPlanningProcessObjectOverlayDemo
                displayObjects={componentLabFixedPlanningProcesses.find((process) => process.sequence === 6)?.displayObjects ?? []}
              />

              <div className="absolute bottom-4 left-4 w-[236px] rounded-lg border border-white/55 bg-white/72 p-3 shadow-ds-overlay backdrop-blur-md">
                <div className="mb-2 text-xs font-semibold text-slate-800">模型对象</div>
                <div className="space-y-1.5">
                  {[
                    { label: '0162-01-010101-01', tone: 'part', state: 'selected' },
                    { label: '0162-01-010101-02', tone: 'part', state: 'isolation-background' },
                    { label: '01-02 焊缝', tone: 'weld' },
                    { label: '01 打磨线 1', tone: 'grind' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] transition-colors ${
                        item.state === 'isolation-background'
                          ? 'bg-slate-500/25 text-slate-500 ring-1 ring-inset ring-slate-400/45 opacity-50'
                          : item.state === 'selected'
                          ? 'bg-white/78 text-slate-700 ring-1 ring-inset ring-[#F59E0B]'
                          : item.tone === 'weld'
                          ? 'bg-orange-50 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100'
                          : item.tone === 'grind'
                          ? 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-100'
                          : 'bg-white/65 text-slate-600 ring-1 ring-inset ring-slate-100'
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current opacity-70" />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="absolute right-5 top-16 w-[300px] overflow-hidden rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/50 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="size-4 text-orange-500" />
                    <span className="text-xs font-medium text-slate-800">手动焊缝提取</span>
                  </div>
                  <X className="size-3.5 text-slate-400" />
                </div>
                <div className="grid gap-2.5 p-3">
                  <div className="ds-label-input-mini">
                    <div className="ds-parameter-label">零件 A</div>
                    <ObjectSingleSelectDemo
                      values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-04']}
                      selectedValue="0162-01-010101-01"
                      disabled={disabled}
                      placeholder="请选择零件"
                      size="sm"
                      onChange={() => undefined}
                    />
                  </div>
                  <div className="ds-label-input-mini">
                    <div className="ds-parameter-label">零件 B</div>
                    <ObjectSingleSelectDemo
                      values={['0162-01-010101-01', '0162-01-010101-02', '0162-01-010101-04']}
                      selectedValue="0162-01-010101-02"
                      disabled={disabled}
                      placeholder="请选择零件"
                      size="sm"
                      onChange={() => undefined}
                    />
                  </div>
                  <div className="rounded-md bg-white/62 p-2 text-[11px] leading-4 text-slate-500 ring-1 ring-inset ring-white/70">
                    已选择 2 个面，生成 3 条焊缝段；点选焊缝段后可确认创建特征。
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/50 px-3 py-2">
                  <span className="text-[11px] text-ds-brand-primary-text">等待点选焊缝段</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">取消</Button>
                    <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover" disabled={disabled}>确定</Button>
                  </div>
                </div>
              </div>
              </div>
            </DemoCard>
          </>
        );
      case 'production-task-panels':
        return (
          <DemoCard title="生产执行整页预览 / 任务方案">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl text-[11px] leading-5 text-slate-400">
                {productionTaskPanelVariant === 'v1'
                  ? '旧样式保留原 24 条工序名称和零件对象。'
                  : '新样式在每个工件分组内显示 16 条聚合任务，标题行提供确认后删除工件的图标，条目仍为序号、状态灯、工序名称和零件名称的单行样式。'}
              </div>
              <div className="inline-flex rounded-md bg-slate-100 p-0.5" role="group" aria-label="生产任务方案">
                {([
                  ['v1', '旧样式'],
                  ['v2', '新样式'],
                ] as const).map(([variant, label]) => (
                  <button
                    key={variant}
                    type="button"
                    className={`h-7 rounded px-2.5 text-[11px] transition-colors ${
                      productionTaskPanelVariant === variant
                        ? 'bg-white text-ds-brand-primary-text shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    aria-pressed={productionTaskPanelVariant === variant}
                    onClick={() => setProductionTaskPanelVariant(variant)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-slate-100 shadow-ds-sm">
              <div className="flex h-9 items-center justify-between border-b border-zinc-200 bg-white/80 px-3">
                <span className="text-xs font-medium text-slate-600">/生产执行 · 当前页面嵌入</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {productionTaskPanelVariant === 'v1' ? 'legacy 24 / status 360' : '工件 route 15 / debug 420'}
                </span>
              </div>
              <div className="overflow-auto bg-[#e9e9e7]">
                <div className="h-[760px] min-w-[1040px]">
                  <ProductionExecutionPage
                    key={productionTaskPanelVariant}
                    leftPanel={productionTaskPanelVariant}
                    rightPanel={productionTaskPanelVariant === 'v1' ? 'task-status' : 'single-step'}
                  />
                </div>
              </div>
            </div>
          </DemoCard>
        );
      case 'production-execution':
        return (
          <DemoCard title="生产执行组件">
            <div className="mb-4 max-w-2xl text-[11px] leading-5 text-slate-400">
              生产执行组件独立表达现场工位、设备和产线视图状态；卡片表面复用工艺规划的白色任务面与 zinc 结构边线，状态色只落在左侧短条、圆点和 badge；不承载工艺规划中的特征提取、路径点编辑或任务详情表单。
            </div>
            <div className="mb-4 max-w-[520px]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-700">工位详情 / 三级工步树</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">工件名称 → 工步类 → 工步；用于主筋板打磨工位1及复合装配工位详情。</div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">workpiece · class · step</span>
              </div>
              <HierarchicalWorkstepList
                workpieceLabel="0162-01-010101(1)"
                groups={hierarchicalWorkstepDemoGroups}
                currentIndex={6}
                className="border border-zinc-200/70 shadow-ds-sm"
              />
            </div>
            <div className="mb-4 max-w-[820px] overflow-hidden rounded-xl border border-zinc-200/70 bg-white/72 shadow-ds-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/70 px-3 py-2.5">
                <div>
                  <div className="text-xs font-medium text-slate-700">二次定位弹窗 / 视觉结果</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">单步选中“二次定位/导入工件位置”后的 mock 流程：定位成功保留弹窗，导入首次失败后第二次成功并跳转视觉监控。</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-[10px] ${positioningDemoResult ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {positioningDemoResult ? `${positioningDemoResult.source === 'scan' ? '执行定位' : '导入结果'} · 已完成` : '未产生结果'}
                  </span>
                  <Button type="button" size="sm" className="h-7 gap-1.5 bg-ds-brand-primary px-2.5 text-[11px] text-white hover:bg-ds-brand-primary-hover" onClick={openPositioningDemo}>
                    <ScanFace className="size-3.5" />打开弹窗
                  </Button>
                </div>
              </div>
              {positioningDemoResultOpen && positioningDemoResult ? (
                <div className="grid min-h-[360px] lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="relative min-h-[300px] overflow-hidden bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]">
                    <VisionPointCloud sourceUrl={`${ASSET_BASE}pointclouds/ori-pcc-in-world-sampled.bin`} cameraIndex={1} />
                    <div className="pointer-events-none absolute inset-5 rounded-2xl border border-zinc-400/35" />
                    <div className="absolute left-3 top-3 rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-500 shadow-sm">视觉监控 · 点云回显</div>
                  </div>
                  <VisionPositionResultPanel result={positioningDemoResult} onClose={() => setPositioningDemoResultOpen(false)} />
                </div>
              ) : (
                <div className="flex min-h-[180px] items-center justify-center px-4 py-8 text-xs text-slate-400">点击“打开弹窗”查看二次定位与导入工件位置的交互状态</div>
              )}
            </div>
            {positioningDemoOpen && (
              <PositioningChoiceDialog
                locating={positioningDemoLocateState === 'loading'}
                locateSucceeded={positioningDemoLocateState === 'success'}
                importStatus={positioningDemoImportStatus}
                onExecutePositioning={executePositioningDemo}
                onImportPosition={importPositioningDemo}
                onViewResult={() => {
                  setPositioningDemoResultOpen(true);
                }}
                onClose={() => setPositioningDemoOpen(false)}
              />
            )}
            <div className="mb-4 max-w-[760px] rounded-lg border border-zinc-200/70 bg-white/62 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-700">顶部悬浮控制组</span>
                <span className="font-mono text-[10px] text-slate-400">color.bg.productionExecutionToolbar · rgba(255,255,255,0.36)</span>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-ds-bg-viewport p-3">
                <div className="flex h-10 items-center gap-1 rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
                  <button type="button" className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white shadow-sm">生产监控</button>
                  <button type="button" className="h-8 rounded-lg px-3 text-xs font-medium text-slate-500">模型视图</button>
                  <button type="button" className="h-8 rounded-lg px-3 text-xs font-medium text-slate-500">视觉监控</button>
                </div>
                <div className="flex h-10 items-center gap-1 rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600">
                    <RefreshCw className="size-3.5" />初始化
                  </button>
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-medium text-slate-900 shadow-sm">
                    <Play className="size-3.5" />执行
                  </button>
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-500">
                    <Square className="size-3.5" />停止
                  </button>
                </div>
                <div className="flex h-10 items-center rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
                  <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-600">
                    <Forklift className="size-3.5" />托盘管理
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-4 max-w-[760px] overflow-hidden rounded-xl border border-zinc-200/70 bg-white/72 p-3 shadow-ds-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600">模型视图 / 属性参数浮层</span>
                <span className="font-mono text-[10px] text-slate-400">tree stack · read-only · log clearance</span>
              </div>
              <ProductionModelPropertyOverlayDemo />
            </div>
            <div className="mb-4 max-w-[760px] overflow-hidden rounded-xl border border-zinc-200/70 bg-white/72 shadow-ds-sm">
              <div className="flex h-9 items-center justify-between border-b border-zinc-200/70 px-3">
                <span className="text-xs font-medium text-slate-600">视觉监控点云视图</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {invalid ? '0162-01-010101(6) 异常 · 142,511 pts' : disabled ? '视觉能力置灰' : '0162-01-010101(6) 异常后加载'}
                </span>
              </div>
              <div className="relative h-[280px] overflow-hidden bg-ds-bg-viewport">
                {invalid ? (
                  <>
                    <VisionPointCloud
                      sourceUrl={`${ASSET_BASE}pointclouds/ori-pcc-in-world-sampled.bin`}
                      cameraIndex={2}
                    />
                    <div className="pointer-events-none absolute inset-4 rounded-2xl border border-red-300/45" />
                    <div className="absolute inset-x-4 bottom-4 z-20 flex justify-center">
                      <VisionFeedBar
                        activeFeedId={visionDemoActiveFeedId}
                        abnormalFeedId="gantry-1"
                        onSelect={setVisionDemoActiveFeedId}
                        className="max-w-full"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-4">
                      <PanelEmptyState
                        icon={ScanFace}
                        label={disabled ? '视觉监控不可用' : '当前无视觉内容'}
                        className={disabled ? 'border-zinc-200 bg-zinc-100/60 text-zinc-300' : 'border-slate-300/70 bg-white/15'}
                      />
                    </div>
                    <div className="absolute inset-x-4 bottom-4 z-20 flex justify-center">
                      <VisionFeedBar
                        activeFeedId={visionDemoActiveFeedId}
                        onSelect={setVisionDemoActiveFeedId}
                        disabled={disabled}
                        className="max-w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mb-4 max-w-[760px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport p-3 shadow-inner shadow-slate-900/5">
              <div className="relative h-[560px] overflow-hidden rounded-xl border border-white/70 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:48px_48px]">
                <div className="absolute right-4 top-4 flex max-h-[calc(100%-32px)] w-[420px] max-w-[calc(100%-32px)]">
                  <VisionAbnormalCalibrationPanel
                    currentProcessLabel="0162-01-010101(1) · 装配0162-01-010101-02 + 0162-01-010101"
                    reason="点云识别失败"
                    resultPoint={visionDemoResultPoint}
                    coarseResultPoint={defaultVisionCoarseResultPoint}
                    photoPose={visionDemoPhotoPose}
                    coordinateMode={visionDemoCoordinateMode}
                    poseDirty={visionDemoPoseDirty}
                    scanStatus={visionDemoScanStatus}
                    disabled={disabled}
                    onCoordinateModeChange={(nextMode) => {
                      const convertedPose = convertVisionCoordinatePose(
                        visionDemoPhotoPose,
                        visionDemoCoordinateMode,
                        nextMode,
                        visionDemoPhotoPoseBaseline,
                      );
                      if (!convertedPose) return;
                      setVisionDemoPhotoPose(convertedPose);
                      setVisionDemoCoordinateMode(nextMode);
                    }}
                    onPhotoPoseChange={(axis, value) => {
                      setVisionDemoPhotoPose((current) => ({ ...current, [axis]: value }));
                      setVisionDemoScanStatus('idle');
                    }}
                    onResetPhotoPose={() => {
                      setVisionDemoPhotoPose(
                        visionDemoCoordinateMode === 'absolute'
                          ? { ...visionDemoPhotoPoseBaseline }
                          : { ...defaultVisionRelativePose },
                      );
                      setVisionDemoScanStatus('idle');
                    }}
                    onRescan={handleVisionDemoRescan}
                    onSkip={resetVisionDemo}
                    onConfirm={resetVisionDemo}
                    onClose={resetVisionDemo}
                  />
                </div>
              </div>
            <div className="mt-2 text-[10px] leading-4 text-slate-400">
              生产执行 / 视觉监控：异常处理只作为视觉视窗内浮窗出现；扁平六轴输入支持绝对 / 相对坐标切换，重新扫描后返回新视觉结果。
            </div>
            </div>
            <div className="mb-4 max-w-[420px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport p-3 shadow-inner shadow-slate-900/5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600">视觉异常处理 · Demo 变体</span>
                <span className="font-mono text-[10px] text-slate-400">sidebar · action footer</span>
              </div>
              <div className="h-[560px] overflow-hidden rounded-xl border border-white/70 bg-ds-bg-viewport">
                <VisionAbnormalCalibrationPanel
                  currentProcessLabel="0162-01-010101(1) · 装配0162-01-010101-02 + 0162-01-010101"
                  reason="点云识别失败"
                  resultPoint={visionDemoResultPoint}
                  coarseResultPoint={defaultVisionCoarseResultPoint}
                  photoPose={visionDemoPhotoPose}
                  coordinateMode={visionDemoCoordinateMode}
                  poseDirty={visionDemoPoseDirty}
                  scanStatus={visionDemoScanStatus}
                  disabled={disabled}
                  variant="demo"
                  onCoordinateModeChange={(nextMode) => {
                    const convertedPose = convertVisionCoordinatePose(
                      visionDemoPhotoPose,
                      visionDemoCoordinateMode,
                      nextMode,
                      visionDemoPhotoPoseBaseline,
                    );
                    if (!convertedPose) return;
                    setVisionDemoPhotoPose(convertedPose);
                    setVisionDemoCoordinateMode(nextMode);
                  }}
                  onPhotoPoseChange={(axis, value) => {
                    setVisionDemoPhotoPose((current) => ({ ...current, [axis]: value }));
                    setVisionDemoScanStatus('idle');
                  }}
                  onResetPhotoPose={() => {
                    setVisionDemoPhotoPose(
                      visionDemoCoordinateMode === 'absolute'
                        ? { ...visionDemoPhotoPoseBaseline }
                        : { ...defaultVisionRelativePose },
                    );
                    setVisionDemoScanStatus('idle');
                  }}
                  onRescan={handleVisionDemoRescan}
                  onSkip={resetVisionDemo}
                  onConfirm={resetVisionDemo}
                  onClose={resetVisionDemo}
                />
              </div>
              <div className="mt-2 text-[10px] leading-4 text-slate-400">
                Demo 流程变体：拍照位置保留六轴参数编辑，隐藏重置和坐标模式操作，重新扫描移到跳过按钮左侧。
              </div>
            </div>
            <div data-testid="vision-exception-demo-8" className="mb-4 max-w-[820px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport p-3 shadow-inner shadow-slate-900/5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600">视觉异常处理 · 8 视觉 Tab Demo</span>
                <span className="font-mono text-[10px] text-slate-400">point cloud · tab switch · sidebar</span>
              </div>
              <div className="grid h-[560px] min-h-0 overflow-hidden rounded-xl border border-white/70 bg-white lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="relative min-h-[220px] overflow-hidden bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]">
                  <VisionPointCloud
                    sourceUrl={`${ASSET_BASE}pointclouds/ori-pcc-in-world-sampled.bin`}
                    cameraIndex={Math.max(0, visionFeedOptions.findIndex((feed) => feed.id === visionDemoActiveFeedId))}
                  />
                  <div className="absolute inset-x-3 bottom-3 z-20 flex justify-center">
                    <VisionFeedBar
                      activeFeedId={visionDemoActiveFeedId}
                      abnormalFeedId="weld-1"
                      allAbnormal
                      onSelect={setVisionDemoActiveFeedId}
                      className="max-w-full"
                    />
                  </div>
                </div>
                <VisionExceptionDemoPanel
                  feed={visionFeedOptions.find((feed) => feed.id === visionDemoActiveFeedId) ?? visionFeedOptions[0]}
                  currentTaskLabel="0162-01-010101(6) · 第 06 工序异常视觉复核"
                  onSkip={() => undefined}
                  onConfirm={() => undefined}
                  onClose={() => undefined}
                />
              </div>
              <div className="mt-2 text-[10px] leading-4 text-slate-400">
                第六个任务异常时，视觉监控底部 Tab 切换 8 个视觉；每次只显示当前视觉的点云和对应异常字段，不平铺多个面板。
              </div>
            </div>
            <div className="mb-4 max-w-[760px] overflow-hidden rounded-xl border border-zinc-200/70 bg-ds-bg-viewport p-3 shadow-inner shadow-slate-900/5">
              <div className="grid h-[560px] min-h-0 overflow-hidden rounded-xl border border-white/70 bg-white lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="relative min-h-[220px] overflow-hidden bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]">
                  <VisionPointCloud
                    sourceUrl={`${ASSET_BASE}pointclouds/ori-pcc-in-world-sampled.bin`}
                    cameraIndex={0}
                    gantryViewport={gantryVisionDemoViewport}
                  />
                  <div className="absolute inset-x-3 bottom-3 z-20 flex justify-center">
                    <VisionFeedBar
                      activeFeedId="gantry-1"
                      abnormalFeedId="gantry-1"
                      onSelect={() => undefined}
                      className="max-w-full"
                    />
                  </div>
                </div>
                <div className="min-h-0 border-l border-zinc-200/75">
                  <GantryVisionScanPanel
                    disabled={disabled}
                    onSkip={() => setGantryVisionDemoViewport(createDefaultGantryVisionViewportState())}
                    onApply={() => setGantryVisionDemoViewport(createDefaultGantryVisionViewportState())}
                    onViewportStateChange={setGantryVisionDemoViewport}
                  />
                </div>
              </div>
              <div className="mt-2 text-[10px] leading-4 text-slate-400">
                生产执行 / 桁架1视觉：P1 / P2 标出固定焊缝的起终点；切到扫描参数设置后，两个拍照位置的工具头随距离、偏移和姿态实时回显，关闭结果点则工具头置灰。
              </div>
            </div>
            <div className="mb-4 grid max-w-[760px] gap-3 md:grid-cols-2">
              <div className="flex h-[240px] min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200/70 bg-white/58">
                <div className="flex h-9 shrink-0 items-center border-b border-slate-200/70 px-3">
                  <div className="text-xs font-medium text-slate-500">生产任务</div>
                </div>
                <div className="min-h-0 flex-1 p-3">
                  <PanelEmptyState />
                </div>
              </div>
              <div className="h-[240px] min-h-0 overflow-hidden rounded-lg border border-slate-200/70 bg-white/58">
                <SingleStepDebugPanel
                  stations={productionDebugStationsDemo}
                  snapshot={productionDebugStationDemoSnapshot}
                  executionMode={productionDebugModeDemo}
                  activeExecutionMode={productionDebugModeDemo}
                  activeExecutionStationId={productionDebugStationDemoSnapshot?.stationId ?? null}
                  taskState="paused"
                  canInitialize={false}
                  canStart={true}
                  canExecuteStep={true}
                  onExecutionModeChange={setProductionDebugModeDemo}
                  onInitialize={() => undefined}
                  onRunOrPause={() => undefined}
                  onExecuteStep={() => undefined}
                  onExecutionStop={() => undefined}
                />
              </div>
            </div>
            <div className="mb-4 max-w-[920px]">
              <div className="mb-2">
                <div className="text-xs font-semibold text-slate-800">工位手动控制</div>
                <div className="mt-0.5 text-[10px] text-slate-400">矩形透明硬件按钮、机器人控制、复用点动行和托盘 AGV 调度，复合工位用 tab 切换物理工位</div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="h-[620px] overflow-y-auto border border-zinc-200/80 bg-white/62 p-3">
                  <div className="mb-3 border-b border-zinc-200 pb-2 text-xs font-medium text-zinc-700">主筋板装配工位1 + 贴板打磨工位1 · 复合手动控制</div>
                  <ProductionManualControlPanel
                    target={{
                      kind: 'station-group',
                      groupName: '主筋板装配工位1 + 贴板打磨工位1',
                      stations: [
                        { stationId: 'area-main-assembly-1', stationName: '主筋板装配工位1' },
                        { stationId: 'area-side-grind-1', stationName: '贴板打磨工位1' },
                      ],
                      activeStationId: 'area-main-assembly-1',
                    }}
                  />
                </div>
                <div className="h-[620px] overflow-y-auto border border-zinc-200/80 bg-white/62 p-3">
                  <div className="mb-3 border-b border-zinc-200 pb-2 text-xs font-medium text-zinc-700">主筋板装配工位2 · J1-J16</div>
                  <ProductionManualControlPanel
                    target={{
                      kind: 'station',
                      stationId: 'area-main-assembly-2',
                      stationName: '主筋板装配工位2',
                    }}
                  />
                </div>
                <div className="h-[620px] overflow-y-auto border border-zinc-200/80 bg-white/62 p-3">
                  <div className="mb-3 border-b border-zinc-200 pb-2 text-xs font-medium text-zinc-700">01号托盘工位 · 手动调度</div>
                  <ProductionManualControlPanel
                    target={{
                      kind: 'tray',
                      trayCode: '01',
                      stationName: '01号托盘工位',
                      material: '0162-01-010101-01',
                      quantity: 6,
                      stateLabel: '已占用',
                    }}
                    onEditTrayMaterial={() => setProductionTrayEditDemoOpen(true)}
                  />
                </div>
              </div>
            </div>
            <div className="mb-3 flex max-w-[760px] flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/72 px-3 py-2.5 shadow-ds-sm">
              <div>
                <div className="text-xs font-semibold text-slate-800">工位卡片方案</div>
                <div className="mt-0.5 text-[10px] text-slate-400">选择会同步控制生产执行工作台，并在刷新后保留</div>
              </div>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="工位卡片方案">
                {[
                  { value: 'horizontal', label: '水平方案' },
                  { value: 'skew', label: 'skew方案' },
                ].map((option) => {
                  const selected = productionStationCardVariant === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`h-7 rounded-md px-3 text-[11px] font-medium transition-all ${
                        selected
                          ? 'bg-white text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      aria-pressed={selected}
                      onClick={() => setProductionStationCardVariant(option.value as 'horizontal' | 'skew')}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {productionStationCardVariant === 'horizontal' ? (
              <div className="mb-4 max-w-[860px] rounded-xl border border-slate-200/80 bg-slate-50/72 p-3 shadow-ds-sm">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">水平方案</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">水平展示工位和托盘，字段与 skew 方案保持一致</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-slate-500">平面卡片</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {[
                    { title: '未占用工位卡片', label: '主筋板装配工位2', tone: 'idle', partName: undefined },
                    { title: '已占用工位卡片', label: '贴板打磨工位1', tone: 'running', partName: '0162-01-010101-02' },
                    { title: '异常工位卡片', label: '主筋板装配工位1', tone: 'abnormal', partName: '0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01 + 0162-01-010101-04' },
                  ].map((item) => (
                    <div key={item.title} className="overflow-hidden rounded-xl border border-white/55 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:32px_32px] p-3 shadow-ds-sm">
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-slate-800">{item.title}</div>
                        <div className="mt-0.5 text-[10px] text-slate-500">工位名 / 占用状态 / 加工零件</div>
                      </div>
                      <div style={{ width: productionStationCardHorizontalWidth }}>
                        <ProductionStationCard
                          variant="horizontal"
                          density="compact"
                          name={item.label}
                          status={item.tone as ProductionStationStatus}
                          partName={item.partName}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="mb-2 text-xs font-semibold text-slate-700">物流状态托盘卡片</div>
                  <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white/60 px-4 py-4">
                    {productionTrayLogisticsVariants.map((item) => (
                      <div key={`${item.label}-${item.code}`} className="flex flex-col gap-1" style={{ width: productionTrayCardHorizontalWidth }}>
                        <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
                        <ProductionTrayCard
                          variant="horizontal"
                          code={item.code}
                          state={item.state}
                          material={item.material}
                          materials={item.materials}
                          quantity={item.quantity}
                          activity={item.activity}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-2 text-xs font-semibold text-slate-700">占用托盘卡片 / 编辑入口</div>
                  <div style={{ width: productionTrayCardHorizontalWidth }}>
                    <ProductionTrayCard
                      variant="horizontal"
                      code="01"
                      state="loaded"
                      material="0162-01-010101-01"
                      quantity={6}
                      editable
                      onEdit={() => setProductionTrayEditDemoOpen(true)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 max-w-[760px] rounded-xl border border-slate-200/80 bg-slate-50/72 p-3 shadow-ds-sm">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">skew方案</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">沿工位轴测面 skew 展示，字段与水平方案保持一致</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-emerald-600">生产流程已启用</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div
                    className="mx-auto max-w-full py-6"
                    style={{ width: productionStationCardSkewWidth }}
                  >
                    <ProductionStationCard
                      variant="skew"
                      density="compact"
                      name="贴板打磨工位1"
                      status="running"
                      partName="0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01 + 0162-01-010101-04"
                    />
                  </div>
                  <div
                    className="mx-auto max-w-full py-6"
                    style={{ width: productionStationCardSkewWidth }}
                  >
                    <ProductionStationCard
                      variant="skew"
                      density="compact"
                      name="主筋板打磨工位1"
                      status="idle"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-2 text-xs font-semibold text-slate-700">物流状态托盘卡片</div>
                  <div className="flex flex-wrap items-end gap-6 rounded-xl border border-slate-100 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:32px_32px] px-5 py-7">
                    {productionTrayLogisticsVariants.map((item) => (
                      <div key={`${item.label}-${item.code}`} className="flex flex-col gap-1" style={{ width: productionTrayCardSkewWidth }}>
                        <div className="text-[10px] font-medium text-slate-500">{item.label}</div>
                        <ProductionTrayCard
                          variant="skew"
                          code={item.code}
                          state={item.state}
                          material={item.material}
                          materials={item.materials}
                          quantity={item.quantity}
                          activity={item.activity}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-2 text-xs font-semibold text-slate-700">占用托盘卡片 / 编辑入口</div>
                  <div style={{ width: productionTrayCardSkewWidth }}>
                    <ProductionTrayCard
                      variant="skew"
                      code="01"
                      state="loaded"
                      material="0162-01-010101-01"
                      quantity={6}
                      editable
                      onEdit={() => setProductionTrayEditDemoOpen(true)}
                    />
                  </div>
                </div>
              </div>
            )}
            <ProductionTrayEditDialog
              open={productionTrayEditDemoOpen}
              code="01"
              material="0162-01-010101-01"
              quantity={6}
              materialOptions={productionTrayEditDemoOptions}
              onClose={() => setProductionTrayEditDemoOpen(false)}
              onSave={() => setProductionTrayEditDemoOpen(false)}
            />
            <div className="mb-4 max-w-[1240px] overflow-hidden rounded-lg border border-white/70 bg-ds-bg-glass-modal shadow-ds-sm">
              <div className="flex h-[52px] items-center justify-between border-b border-white/60 px-4">
                <span className="text-sm font-semibold text-slate-800">新建工单</span>
                <X className="size-4 text-zinc-400" />
              </div>
              <div className="grid h-[520px] grid-cols-[240px_280px_minmax(0,1fr)]">
                <div className="min-h-0 border-r border-zinc-200/70 bg-white/80">
                  <div className="flex h-12 items-center justify-between border-b border-zinc-200/70 px-3">
                    <div className="text-xs font-semibold text-slate-700">工单列表</div>
                    <div className="flex items-center gap-2">
                      <DsCheckbox size="sm" checked aria-label="全选配置完成工单" />
                      <Button size="sm" className="h-7 gap-1 bg-ds-brand-primary px-2 text-[11px] font-normal text-white hover:bg-ds-brand-primary-hover">
                        <Plus className="size-3.5" />
                        新建工单
                      </Button>
                    </div>
                  </div>
                  <div className="border-b border-zinc-200/70 p-3">
                    <div className="flex h-8 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-500">
                      <Search className="size-3.5 shrink-0" />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[11px]"
                        placeholder="关键词筛选"
                        aria-label="筛选工单列表示例"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="relative rounded-md border border-zinc-200/80 bg-white/70 px-3 py-2.5 pl-9 shadow-sm">
                      <DsCheckbox size="sm" disabled className="absolute left-2 top-2.5 size-4" aria-label="数量未设置不可下发" />
                      <div className="font-mono text-[11px] font-medium text-zinc-700">WO-20260722-008</div>
                      <div className="mt-1.5 text-xs text-slate-600">0162-01-010101</div>
                      <div className="mt-2 text-[10px] font-medium text-amber-600">待设置数量</div>
                    </div>
                    <div className="relative rounded-md border border-orange-200 bg-orange-50/70 px-3 py-2.5 pl-9 shadow-sm ring-1 ring-inset ring-orange-100">
                      <DsCheckbox size="sm" checked className="absolute left-2 top-2.5 size-4" aria-label="选择下发工单 WO-20260722-009" />
                      <div className="font-mono text-[11px] font-medium text-zinc-700">WO-20260722-009</div>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span>0163-02-020202</span>
                        <span className="text-[10px] text-zinc-400">× 4</span>
                      </div>
                      <div className="mt-2 text-[10px] font-medium text-emerald-600">配置完成</div>
                    </div>
                  </div>
                </div>
                <div className="min-h-0 border-r border-white/60 bg-ds-bg-glass-modal-sidebar">
                  <div className="border-b border-white/50 p-3">
                    <div className="flex h-8 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] text-zinc-400">
                      <Search className="size-3.5" />
                      输入项目名、工件名、图号
                    </div>
                  </div>
                  <div className="p-3 text-[11px] text-zinc-600">
                    <div className="flex h-7 items-center gap-1.5 rounded-md bg-zinc-200/60 px-2">
                      <ChevronDown className="size-3.5" />
                      0162
                    </div>
                    <div className="mt-1 flex h-7 items-center gap-1.5 rounded-md bg-orange-50 px-2 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100">
                      <ChevronDown className="size-3.5" />
                      <span className="font-medium">0162-01-010101</span>
                      <span className="ml-auto rounded-full bg-zinc-100 px-1.5 text-[10px] text-zinc-500">15</span>
                    </div>
                    {['01', '02', '03', '04'].map((partNo) => (
                      <div key={partNo} className="ml-6 mt-1 h-6 border-l border-zinc-200 pl-4 leading-6 text-zinc-400">
                        0162-01-010101-{partNo}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex min-h-0 flex-col bg-white/45">
                  <div className="min-h-0 flex-1 p-3">
                    <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-white/70 bg-ds-bg-viewport shadow-inner">
                      <TrayReferenceStrip
                        allocations={trayOverviewDemoAllocations}
                        quantityReady
                        showOccupancyStatusTag={false}
                        showAreaLabels={false}
                        showPlanCards={false}
                        fitOverview
                      />
                    </div>
                  </div>
                  <div className="flex h-[360px] min-h-0 shrink-0 flex-col border-t border-white/60 bg-ds-bg-glass-modal-sidebar">
                    <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] items-stretch gap-3 overflow-hidden p-3">
                      <div className="ds-parameter-card self-start">
                        <div className="text-[11px] text-slate-400">当前工件</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">0162-01-010101</div>
                        <div className="mt-4 border-t border-slate-200/70 pt-3 text-xs font-semibold text-slate-700">加工设置</div>
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-[11px] text-slate-600">
                          侧面打磨
                          <Ban className="size-3.5 text-ds-brand-primary-text" />
                        </div>
                        <div className="mt-3 text-[11px] font-medium text-slate-600">加工数量</div>
                        <div className="relative mt-1.5">
                          <input
                            value="4"
                            readOnly
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-xs font-medium text-slate-700 outline-none"
                          />
                          <div className="absolute right-1 top-1/2 flex h-6 w-4 -translate-y-1/2 flex-col overflow-hidden rounded border border-slate-200 bg-slate-50 text-slate-400">
                            <ChevronUp className="size-2.5" />
                            <ChevronDown className="size-2.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/70 bg-white/72 p-3 shadow-ds-sm">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">托盘卡片</span>
                          <span className="text-[11px] text-zinc-400">已配 4 个</span>
                        </div>
                        <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-3 items-start gap-2 overflow-hidden">
                          <TrayAllocationCard slot={trayCardDemoSlots.multi} quantityReady showState={false} layout="stack" autoHeight />
                          <TrayAllocationCard slot={trayCardDemoSlots.full} quantityReady showState={false} layout="stack" autoHeight />
                          <TrayAllocationCard slot={trayCardDemoSlots.single} quantityReady showState={false} layout="stack" autoHeight />
                        </div>
                      </div>
                    </div>
                    <div className="flex h-12 items-center justify-end border-t border-white/50 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">返回任务设置</Button>
                        <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover">确认工单</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex h-14 items-center gap-2 bg-ds-bg-glass-modal px-4 shadow-ds-footer-up">
                <span className="min-w-0 flex-1 text-[11px] text-zinc-400">已选择 1 张工单，可下发生产</span>
                <Button size="sm" variant="outline">取消</Button>
                <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover">下发生产</Button>
              </div>
            </div>
            <div className="mb-4 max-w-[420px] space-y-3">
              <div className="rounded-xl border border-white/70 bg-white/72 p-3 shadow-ds-sm">
                <div className="text-left">
                  <div className="text-[11px] text-slate-400">当前工件</div>
                  <div className="mt-1 text-sm font-medium text-slate-700">0162-01-010101</div>
                </div>
                <div className="mt-4 border-t border-slate-200/70 pt-4">
                  <div className="mb-2 text-xs font-semibold text-slate-700">加工设置</div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-600">侧面打磨</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">贴板侧面打磨任务</div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-7 gap-1.5 px-2.5 text-[11px] ${
                        newTaskPreviewAllSidePlateDisabledDemo
                          ? 'border-zinc-200 bg-zinc-100 text-zinc-500 hover:bg-white hover:text-zinc-700'
                          : 'border-orange-100 bg-orange-50/70 text-ds-brand-primary-text hover:bg-orange-100'
                      }`}
                      onClick={() => setNewTaskPreviewRowsDisabledDemo(
                        newTaskPreviewSidePlateIdsDemo,
                        !newTaskPreviewAllSidePlateDisabledDemo,
                      )}
                      aria-pressed={newTaskPreviewAllSidePlateDisabledDemo}
                    >
                      <Ban className="size-3.5" />
                      {newTaskPreviewAllSidePlateDisabledDemo ? '启用' : '禁用'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/72 p-3 shadow-ds-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700">新建工单 · 工序任务预览</div>
                  <div className="flex items-center gap-1.5">
                    <ThemedCheckbox
                      size="sm"
                      checked={newTaskPreviewAllSelectedDemo}
                      indeterminate={newTaskPreviewSelectionIndeterminateDemo}
                      className="size-3.5 cursor-pointer [&_svg]:size-2.5"
                      onChange={toggleAllNewTaskPreviewRowsSelectedDemo}
                      aria-label={newTaskPreviewAllSelectedDemo ? '取消全选工序任务' : '全选工序任务'}
                    />
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                      已选 {newTaskPreviewSelectedCountDemo}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-1.5 text-[11px] text-slate-500 hover:bg-orange-50 hover:text-ds-brand-primary-text disabled:text-zinc-300"
                      onClick={toggleSelectedNewTaskPreviewRowsDisabledDemo}
                      disabled={newTaskPreviewSelectedCountDemo === 0}
                    >
                      <Ban className="size-3.5" />
                      {newTaskPreviewSelectedDisabledCountDemo > 0 ? '启用' : '禁用'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {newTaskPreviewRowsDemo.map((row) => {
                    const rowDisabled = newTaskPreviewDisabledIdsDemo.has(row.id);
                    const rowChecked = newTaskPreviewSelectedIdsDemo.has(row.id);
                    return (
                      <div
                        key={row.id}
                        className={`flex h-10 items-center gap-2 rounded-lg border px-2 text-xs transition-colors ${
                          rowDisabled
                            ? 'cursor-not-allowed border-zinc-200 bg-zinc-100/80 text-zinc-400 opacity-75 grayscale shadow-none'
                            : rowChecked
                              ? 'border-orange-100 bg-orange-50/30 text-zinc-700'
                              : 'border-zinc-100 bg-zinc-50 text-zinc-600'
                        }`}
                        aria-disabled={rowDisabled || undefined}
                      >
                        <ThemedCheckbox
                          size="sm"
                          checked={rowChecked}
                          className="size-3.5 cursor-pointer [&_svg]:size-2.5"
                          onChange={() => toggleNewTaskPreviewRowSelectedDemo(row.id)}
                          aria-label={`选择${row.name}${row.part}`}
                        />
                        <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                          rowDisabled
                            ? 'bg-zinc-200 text-zinc-400'
                            : rowChecked
                              ? 'bg-orange-100/80 text-ds-brand-primary-text'
                              : 'bg-zinc-200/80 text-zinc-500'
                        }`}>
                          {row.index}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-normal leading-4">
                          <span className={`text-xs ${rowDisabled ? 'text-zinc-400' : 'text-zinc-700'}`}>{row.name}</span>
                          <span className={`ml-1 text-[11px] font-normal ${rowDisabled ? 'text-zinc-300' : 'text-slate-400'}`}>
                            {formatCombinedPartObject(row.part)}
                          </span>
                        </span>
                        {rowDisabled && (
                          <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                            已禁用
                          </span>
                        )}
                        <button
                          type="button"
                          className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded-md transition-colors ${
                            rowDisabled
                              ? 'bg-white/80 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100 hover:bg-orange-50 hover:text-ds-brand-primary-text'
                              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                          }`}
                          onClick={() => setNewTaskPreviewRowsDisabledDemo([row.id], !rowDisabled)}
                          aria-label={rowDisabled ? '解除禁用工序' : '禁用工序'}
                          aria-pressed={rowDisabled}
                        >
                          <Ban className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mb-4 h-[360px] max-w-[420px] overflow-hidden rounded-lg border border-slate-200/70 bg-white/58">
              <SingleStepDebugPanel
                stations={productionDebugStationsDemo}
                snapshot={productionDebugStationDemoSnapshot}
                executionMode={productionDebugModeDemo}
                activeExecutionMode={productionDebugModeDemo}
                activeExecutionStationId={productionDebugStationDemoSnapshot?.stationId ?? null}
                taskState="paused"
                canInitialize={false}
                canStart={true}
                canExecuteStep={true}
                onExecutionModeChange={setProductionDebugModeDemo}
                onInitialize={() => undefined}
                onRunOrPause={() => undefined}
                onExecuteStep={() => undefined}
                onExecutionStop={() => undefined}
              />
            </div>
            <div className="mb-4 max-w-[760px] overflow-hidden rounded-xl border border-zinc-200/70 bg-white/72 shadow-ds-sm">
              <div className="relative h-[268px] overflow-hidden bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:48px_48px] p-3">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 268" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <defs>
                    <filter id="labProductionCuboidShadow" x="-20%" y="-20%" width="140%" height="160%">
                      <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#52525B" floodOpacity="0.16" />
                    </filter>
                  </defs>
                  <g transform="translate(-18 -10)">
                  {[
                    { id: 'lab-ground-rect-assembly-2', labels: ['主筋板装配工位2', '贴板打磨工位2'], status: 'running' as const },
                    { id: 'lab-ground-rect-assembly-1', labels: ['贴板打磨工位1', '主筋板装配工位1'], status: 'abnormal' as const },
                  ].map((rect) => {
                    const items = rect.labels
                      .map((label) => ([
                        { cx: 110, cy: 82, w: 68, d: 32, label: '主筋板装配工位2' },
                        { cx: 214, cy: 114, w: 68, d: 32, label: '贴板打磨工位2' },
                        { cx: 422, cy: 178, w: 68, d: 32, label: '贴板打磨工位1' },
                        { cx: 526, cy: 210, w: 68, d: 32, label: '主筋板装配工位1' },
                      ].find((item) => item.label === label)))
                      .filter((item): item is { cx: number; cy: number; w: number; d: number; label: string } => Boolean(item));
                    const reference = items[0];
                    if (!reference) return null;
                    const halfWidth = reference.w / 2;
                    const halfDepth = reference.d / 2;
                    const frontVector = [halfWidth, halfDepth];
                    const depthVector = [halfWidth, -halfDepth];
                    const frontLength = Math.hypot(frontVector[0], frontVector[1]);
                    const depthLength = Math.hypot(depthVector[0], depthVector[1]);
                    const frontUnit = frontVector.map((value) => value / frontLength);
                    const depthUnit = depthVector.map((value) => value / depthLength);
                    const determinant = frontUnit[0] * depthUnit[1] - frontUnit[1] * depthUnit[0];
                    const topPoints = items.flatMap((item) => {
                      const itemHalfWidth = item.w / 2;
                      const itemHalfDepth = item.d / 2;
                      const itemFrontVector = [itemHalfWidth, itemHalfDepth];
                      const itemDepthVector = [itemHalfWidth, -itemHalfDepth];
                      const frontStart = [item.cx - itemFrontVector[0], item.cy];
                      const frontEnd = [frontStart[0] + itemFrontVector[0], frontStart[1] + itemFrontVector[1]];
                      const backStart = [frontStart[0] + itemDepthVector[0], frontStart[1] + itemDepthVector[1]];
                      const backEnd = [frontEnd[0] + itemDepthVector[0], frontEnd[1] + itemDepthVector[1]];
                      return [backStart, backEnd, frontEnd, frontStart];
                    });
                    const localPoints = topPoints.map(([x, y]) => ({
                      front: (x * depthUnit[1] - y * depthUnit[0]) / determinant,
                      depth: (frontUnit[0] * y - frontUnit[1] * x) / determinant,
                    }));
                    const frontMin = Math.min(...localPoints.map((point) => point.front)) - 16;
                    const frontMax = Math.max(...localPoints.map((point) => point.front)) + 16 + 12;
                    const depthMin = Math.min(...localPoints.map((point) => point.depth)) - 36;
                    const depthMax = Math.max(...localPoints.map((point) => point.depth)) + 36;
                    const point = (front: number, depth: number) => [
                      front * frontUnit[0] + depth * depthUnit[0],
                      front * frontUnit[1] + depth * depthUnit[1],
                    ];
                    const points = [
                      point(frontMin, depthMin),
                      point(frontMax, depthMin),
                      point(frontMax, depthMax),
                      point(frontMin, depthMax),
                    ];
                    const rectStyle = getProductionWorkbenchGroundRectStyle(rect.status);
                    return (
                      <path
                        key={rect.id}
                        d={getRoundedIsometricPath(points, 6)}
                        transform="translate(-12 24)"
                        fill={rectStyle.fill}
                        fillOpacity={rectStyle.fillOpacity}
                        stroke={rectStyle.stroke}
                        strokeOpacity={rectStyle.strokeOpacity}
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                  {[
                    { cx: 110, cy: 82, w: 68, d: 32, h: 14, label: '主筋板装配工位2', cardY: 8, status: 'idle' },
                    { cx: 214, cy: 114, w: 68, d: 32, h: 14, label: '贴板打磨工位2', cardY: 34, status: 'idle' },
                    { cx: 318, cy: 146, w: 68, d: 32, h: 14, label: '翻面工位', cardY: 62, status: 'running' },
                    { cx: 422, cy: 178, w: 68, d: 32, h: 14, label: '贴板打磨工位1', cardY: 92, status: 'running' },
                    { cx: 526, cy: 210, w: 68, d: 32, h: 14, label: '主筋板装配工位1', cardY: 120, status: 'abnormal' },
                    { cx: 630, cy: 242, w: 68, d: 32, h: 14, label: '主筋板打磨工位1', cardY: 150, status: 'idle' },
                  ].map((item) => {
                    const running = item.status === 'running';
                    const abnormal = item.status === 'abnormal';
                    const active = running || abnormal;
                    const cardWidth = 150;
                    const cardVisibleHeight = 36;
                    const frontScale = item.frontScale ?? 1;
                    const depthScale = item.depthScale ?? 1;
                    const halfWidth = item.w / 2;
                    const halfDepth = item.d / 2;
                    const frontVector = [halfWidth * frontScale, halfDepth * frontScale];
                    const depthVector = [halfWidth * depthScale, -halfDepth * depthScale];
                    const frontStart = [item.cx - frontVector[0], item.cy];
                    const frontEnd = [frontStart[0] + frontVector[0], frontStart[1] + frontVector[1]];
                    const backStart = [frontStart[0] + depthVector[0], frontStart[1] + depthVector[1]];
                    const backEnd = [frontEnd[0] + depthVector[0], frontEnd[1] + depthVector[1]];
                    const topCenter = {
                      x: (backStart[0] + backEnd[0] + frontEnd[0] + frontStart[0]) / 4,
                      y: (backStart[1] + backEnd[1] + frontEnd[1] + frontStart[1]) / 4,
                    };
                    const top = `${backStart[0]},${backStart[1]} ${backEnd[0]},${backEnd[1]} ${frontEnd[0]},${frontEnd[1]} ${frontStart[0]},${frontStart[1]}`;
                    const right = `${backEnd[0]},${backEnd[1]} ${backEnd[0]},${backEnd[1] + item.h} ${frontEnd[0]},${frontEnd[1] + item.h} ${frontEnd[0]},${frontEnd[1]}`;
                    const front = `${frontStart[0]},${frontStart[1]} ${frontEnd[0]},${frontEnd[1]} ${frontEnd[0]},${frontEnd[1] + item.h} ${frontStart[0]},${frontStart[1] + item.h}`;
                    const connectorStroke = abnormal ? '#EF4444' : running ? '#8E97D9' : '#A1A1AA';
                    return (
                      <g key={item.label}>
                        <g filter="url(#labProductionCuboidShadow)">
                          <polygon points={top} fill={abnormal ? '#F87171' : '#FFFFFF'} stroke={abnormal ? '#FCA5A5' : running ? '#B9C6FF' : '#FFFFFF'} strokeWidth="1.2" />
                          <polygon points={right} fill={abnormal ? '#DC2626' : '#E4E4E7'} stroke={abnormal ? '#F87171' : running ? '#AFC0FF' : '#D4D4D8'} strokeWidth="1" />
                          <polygon points={front} fill={abnormal ? '#EF4444' : '#F4F4F5'} stroke={abnormal ? '#F87171' : running ? '#AFC0FF' : '#E4E4E7'} strokeWidth="1" />
                          {running ? (
                            <>
                              <polygon points={top} fill="#5E6FB8" opacity="0.22" />
                              <polygon points={right} fill="#5E6FB8" opacity="0.16" />
                              <polygon points={front} fill="#5E6FB8" opacity="0.18" />
                            </>
                          ) : null}
                        </g>
                        <line x1={topCenter.x} y1={item.cardY + cardVisibleHeight} x2={topCenter.x} y2={topCenter.y} stroke={connectorStroke} strokeWidth="1.2" opacity={active ? '0.72' : '0.24'} strokeLinecap="round" />
                        <circle cx={topCenter.x} cy={topCenter.y} r="2.2" fill={connectorStroke} opacity={active ? '0.78' : '0.36'} />
                        <foreignObject x={topCenter.x - cardWidth / 2} y={item.cardY} width={cardWidth} height={40}>
                          <div className={`flex h-9 items-center gap-2 rounded-lg border border-white/35 bg-slate-100/35 px-3 text-[12px] font-semibold shadow-ds-sm backdrop-blur-xl ${abnormal ? 'text-red-600' : running ? 'text-slate-700' : 'text-slate-400'}`}>
                            <span className={`size-2.5 shrink-0 rounded-full ${abnormal ? 'bg-red-500' : running ? 'bg-emerald-500 ring-2 ring-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.45)]' : 'bg-zinc-300/80'}`} />
                            <span className="min-w-0 truncate">{item.label}</span>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                  {[
                    { label: '09', x: 96, y: 186, large: true },
                    { label: '08', x: 174, y: 202 },
                    { label: '07', x: 208, y: 208 },
                    { label: '06', x: 242, y: 214 },
                    { label: '05', x: 320, y: 226 },
                    { label: '04', x: 354, y: 232 },
                    { label: '03', x: 388, y: 238 },
                    { label: '02', x: 422, y: 244 },
                    { label: '01', x: 500, y: 254, large: true },
                  ].map((item) => {
                    const width = item.large ? 28 : 14;
                    const depth = item.large ? 12 : 6;
                    const top = `${item.x},${item.y - depth / 2} ${item.x + width / 2},${item.y} ${item.x},${item.y + depth / 2} ${item.x - width / 2},${item.y}`;
                    const right = `${item.x + width / 2},${item.y} ${item.x + width / 2},${item.y + 4} ${item.x},${item.y + depth / 2 + 4} ${item.x},${item.y + depth / 2}`;
                    const front = `${item.x - width / 2},${item.y} ${item.x},${item.y + depth / 2} ${item.x},${item.y + depth / 2 + 4} ${item.x - width / 2},${item.y + 4}`;
                    return (
                      <g key={item.label}>
                        <polygon points={top} fill="#F8FAFC" stroke="#FFFFFF" strokeWidth="0.8" />
                        <polygon points={right} fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.6" />
                        <polygon points={front} fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.6" />
                      </g>
                    );
                  })}
                  </g>
                </svg>
                <div className="pointer-events-none absolute left-4 top-3 z-10 flex items-center gap-3 rounded-lg border border-white/65 bg-white/58 px-2.5 py-1.5 text-[10px] text-slate-600 shadow-sm backdrop-blur-sm">
                  <span className="font-medium text-slate-500">地面矩形状态</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-slate-200 ring-1 ring-slate-300" />未选中</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-green-200 ring-1 ring-green-300" />执行中</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-yellow-200 ring-1 ring-yellow-300" />内部异常</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-10 flex h-[86px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/65 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
                  <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/55 px-3">
                    <span className="text-[11px] font-medium text-slate-700">打印日志</span>
                    <Minus className="size-3.5 text-slate-400" />
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-[58px_48px_minmax(0,1fr)] items-center gap-2 px-3 font-mono text-[10px] text-slate-600">
                    <span className="text-slate-400">08:30:12</span>
                    <span className="text-emerald-600">INFO</span>
                    <span className="truncate">生产执行工作台初始化完成，设备与任务状态已同步</span>
                  </div>
                </div>
                <div className="relative z-10 mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full border border-white/45 bg-slate-100/35 px-2 py-0.5 backdrop-blur-xl">轴测总览：只展示相对位置和状态灯</span>
                  <span className="rounded-full border border-white/55 bg-white/60 px-2 py-0.5 backdrop-blur-xl">完整卡片样式独立于工艺规划任务面板</span>
                </div>
              </div>
              <div className="flex h-9 items-center gap-4 border-t border-zinc-200 bg-white/82 px-4 shadow-ds-footer-up backdrop-blur-md">
                <div className="flex shrink-0 items-center text-xs font-semibold text-slate-700">
                  设备状态
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex min-w-0 items-center justify-end gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {productionFooterDevices.map((device) => (
                      <Tooltip key={device.name} title={device.name}>
                        <div className="flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/78 px-2.5 text-[11px] text-slate-600 shadow-sm">
                          <span className={`size-2 shrink-0 rounded-full ring-2 ${getProductionFooterDeviceStateStyle(device.state)}`} />
                          <span className="max-w-[126px] truncate">{device.name}</span>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white/62 px-4 py-2 text-[11px] text-slate-500">
                生产工作台、模型视图、视觉监控统一使用 color.bg.viewport；打印日志在工作台视窗内左右留边后横向占满可用宽度，底部 footer 状态灯沿用红 / 灰 / 绿表达异常、未连接、连接。
              </div>
            </div>
          </DemoCard>
        );
      case 'tray-card':
        return (
          <DemoCard title="托盘管理组件状态">
            <div className="mb-4 max-w-2xl text-[11px] leading-5 text-slate-400">
              用于托盘管理完整页面、理料区视图、AGV 调度列表和新建生产任务托盘预览；托盘管理页面只回显九个托盘位现场状态，理料区视图再追加配盘明细，托盘承载面不分格，多种零件使用真实俯视图单列排列。
            </div>
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50/70">
              <div className="border-b border-slate-200/80 px-3 py-2">
                <div className="text-xs font-semibold text-slate-700">托盘管理 Header 规范</div>
                  <div className="mt-0.5 text-[10px] leading-4 text-slate-400">
                  AGV 调度保留紧凑分区标题；理料区视图使用页面级 Header 和返回入口。
                </div>
              </div>
              <div className="grid gap-3 p-3 xl:grid-cols-2">
                {(['agv', 'overview'] as TrayHeaderUsage[]).map((usage) => {
                  const meta = trayHeaderUsageMeta[usage];
                  return (
                    <div key={usage} className="min-w-0">
                      <div className="mb-1.5 text-[11px] font-semibold text-slate-600">{meta.title}</div>
                      <TrayHeaderUsagePreview usage={usage} />
                      <div className="mt-1 text-[10px] leading-4 text-slate-400">{meta.usage}</div>
                      <div className="text-[10px] leading-4 text-slate-500">{meta.metrics}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mb-4 grid gap-3">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
                  <div className="flex items-center gap-3">
                    <button type="button" className="flex size-9 items-center justify-center rounded-lg text-slate-500" aria-label="返回生产执行">
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">托盘管理</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">AGV 任务调度与托盘现场管理</div>
                    </div>
                  </div>
                  <button type="button" className="flex h-9 items-center gap-1.5 rounded-lg bg-ds-brand-primary px-3 text-xs font-medium text-white" aria-label="进入理料区视图">
                    <MonitorUp className="size-3.5" />
                    理料区视图
                  </button>
                </div>
                <div className="bg-slate-50/70 px-5 py-3 text-[11px] text-slate-400">
                  页面 Header 提供返回生产执行和进入理料区视图的入口；管理页只显示现场地图，理料区视图追加计划摆盘，不使用遮罩或关闭按钮。
                </div>
              </div>
              <div className="flex h-[260px] flex-col overflow-hidden rounded-lg border border-white/60 bg-zinc-100/60 shadow-inner shadow-slate-900/5">
                <div className="relative z-10 flex h-10 shrink-0 flex-row items-center justify-between border-b border-white/60 bg-white px-4 shadow-ds-sticky-overlap backdrop-blur-[var(--ds-blur-sticky-overlap)]">
                  <div className="text-[11px] font-semibold leading-4 text-zinc-800">{trayAgvHistoryView ? 'AGV 历史任务' : 'AGV 任务调度'}</div>
                  <div className="flex items-center gap-1.5">
                    {trayAgvHistoryView ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-1.5 text-xs text-slate-500 hover:bg-transparent hover:text-slate-800"
                        onClick={() => setTrayAgvHistoryView(false)}
                      >
                        <ArrowLeft className="size-3.5" />
                        返回任务调度
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-1.5 text-xs text-slate-500 hover:bg-transparent hover:text-slate-800"
                          onClick={() => setTrayAgvHistoryView(true)}
                        >
                          <History className="size-3.5" />
                          历史任务
                          {trayAgvDemoArchived && (
                            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-slate-100 px-1 text-[9px] font-semibold leading-4 text-slate-500">1</span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1 px-2.5 text-xs"
                          onClick={() => {
                            setTrayAgvDemoArchived(false);
                            setTrayAgvDemoState('pending');
                          }}
                        >
                          <Plus className="size-3.5" />
                          新建任务
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-white/30 p-3">
                  <div className="grid grid-cols-[minmax(108px,0.95fr)_minmax(180px,1.25fr)_84px_84px_82px_196px] items-center gap-4 rounded-t-lg border border-white/70 bg-slate-100/70 px-3 py-2 text-[11px] font-semibold text-slate-500">
                    <div>任务类型</div>
                    <div>执行零件</div>
                    <div>取货点</div>
                    <div>卸货点</div>
                    <div>状态</div>
                    <div>操作</div>
                  </div>
                  {trayAgvHistoryView === trayAgvDemoArchived ? <div
                    className={`relative grid grid-cols-[minmax(108px,0.95fr)_minmax(180px,1.25fr)_84px_84px_82px_196px] items-center gap-4 overflow-hidden border-x border-b border-white/70 px-3 py-2 text-[11px] transition-colors ${
                      trayAgvDemoState === 'running'
                        ? 'bg-orange-50/88 text-ds-brand-primary-text shadow-[inset_3px_0_0_rgba(255,105,0,0.85)]'
                        : trayAgvDemoState === 'done'
                        ? 'bg-white/45 text-slate-500'
                        : 'bg-white/45 text-slate-500'
                    }`}
                  >
                    {trayAgvHistoryView ? (
                      <>
                        <div className="h-7 truncate rounded-md px-2 py-1 leading-5 text-slate-500">上料任务</div>
                        <div className="h-7 truncate rounded-md px-2 py-1 leading-5 text-slate-500">0162-01-010101-01</div>
                        <div className="h-7 rounded-md px-2 py-1 leading-5 text-slate-500">01</div>
                        <div className="h-7 rounded-md px-2 py-1 leading-5 text-slate-500">02</div>
                      </>
                    ) : <>
                    <ProcessSingleSelect
                      items={[
                        { id: '上料任务', name: '上料任务' },
                        { id: '空托任务', name: '空托任务' },
                        { id: '满托任务', name: '满托任务' },
                      ]}
                      selectedId="上料任务"
                      size="sm"
                      elevation="none"
                      onChange={() => undefined}
                    />
                    <ProcessSingleSelect
                      items={[
                        { id: '0162-01-010101-01', name: '0162-01-010101-01' },
                        { id: '0162-01-010101-02', name: '0162-01-010101-02' },
                        { id: '0162-01-010101-03', name: '0162-01-010101-03' },
                        { id: '0162-01-010101-04', name: '0162-01-010101-04' },
                      ]}
                      selectedId="0162-01-010101-01"
                      size="sm"
                      elevation="none"
                      onChange={() => undefined}
                    />
                    <ProcessSingleSelect
                      items={['01', '02', '03', '04', '05', '06', '07', '08', '09'].map((id) => ({ id, name: id }))}
                      selectedId="01"
                      size="sm"
                      elevation="none"
                      onChange={() => undefined}
                    />
                    <ProcessSingleSelect
                      items={['01', '02', '03', '04', '05', '06', '07', '08', '09'].map((id) => ({ id, name: id }))}
                      selectedId="02"
                      size="sm"
                      elevation="none"
                      onChange={() => undefined}
                    />
                    </>}
                    <div className="flex h-7 items-center">
                      {trayAgvDemoState === 'running' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-ds-brand-primary-text">
                          <span className="size-1.5 rounded-full bg-ds-brand-primary animate-pulse" />
                          执行中
                        </span>
                      ) : trayAgvDemoState === 'done' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          已完成
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          待执行
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      {trayAgvHistoryView ? (
                        <button
                          type="button"
                          className="h-7 whitespace-nowrap px-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-ds-brand-primary-text"
                          onClick={() => setTrayAgvDemoArchived(false)}
                        >
                          恢复
                        </button>
                      ) : <>
                      <button
                        type="button"
                        className={`h-7 whitespace-nowrap text-[11px] font-medium transition-colors ${
                          trayAgvDemoState === 'running'
                            ? 'cursor-not-allowed text-slate-300'
                            : trayAgvDemoState === 'done'
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-slate-500 hover:text-ds-brand-primary-text'
                        }`}
                        disabled={trayAgvDemoState !== 'pending'}
                        onClick={() => setTrayAgvDemoState('running')}
                      >
                        执行
                      </button>
                      <button
                        type="button"
                        className={`h-7 whitespace-nowrap text-[11px] font-medium transition-colors ${
                          trayAgvDemoState === 'done'
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-slate-500 hover:text-emerald-700'
                        }`}
                        disabled={trayAgvDemoState === 'done'}
                        onClick={() => setTrayAgvDemoState('done')}
                      >
                        确认到达
                      </button>
                      <button
                        type="button"
                        className="h-7 whitespace-nowrap px-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-slate-300"
                        disabled={trayAgvDemoState !== 'done'}
                        onClick={() => setTrayAgvDemoArchived(true)}
                      >
                        归档
                      </button>
                      <button
                        type="button"
                        className="h-7 whitespace-nowrap text-[11px] font-medium text-red-400 transition-colors hover:text-red-600"
                        onClick={() => setTrayAgvDemoState('pending')}
                      >
                        删除
                      </button>
                      </>}
                    </div>
                  </div> : (
                    <div className="border-x border-b border-white/70 px-3 py-8 text-center text-xs text-slate-400">
                      {trayAgvHistoryView ? '暂无历史任务。' : '暂无 AGV 任务，点击新建任务添加一行。'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4 overflow-hidden rounded-lg border border-white/60 bg-white shadow-inner shadow-slate-900/5">
              <div className="flex h-10 items-center justify-between gap-4 border-b border-zinc-200/70 bg-white px-4">
                <div className="text-[11px] font-semibold text-zinc-800">理料区视图内容</div>
                <div className="truncate text-right text-[10px] font-medium text-zinc-400">点击已占用点位转为空托</div>
              </div>
              <div className="flex min-w-0 items-center gap-2 overflow-hidden border-b border-zinc-200/70 bg-white px-4 py-2">
                <span className="shrink-0 text-[10px] font-medium text-slate-400">待下发工单</span>
                <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max min-w-full items-center gap-1.5">
                    {[
                      { id: 'WO-20260723-001', label: '0162-01-010101' },
                      { id: 'WO-20260723-002', label: '0163-02-020202' },
                      { id: 'WO-20260723-003', label: '0164-03-030303' },
                    ].map((workOrder) => {
                      const selected = traySelectedWorkOrderDemoId === workOrder.id;
                      return (
                        <button
                          key={workOrder.id}
                          type="button"
                          className={`max-w-[180px] shrink-0 truncate rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${selected
                            ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100'
                            : 'border-zinc-200 bg-zinc-50 text-slate-500 hover:border-orange-200 hover:bg-orange-50/60 hover:text-slate-700'}`}
                          aria-pressed={selected}
                          title={`${workOrder.id} · ${workOrder.label}`}
                          onClick={() => setTraySelectedWorkOrderDemoId(workOrder.id)}
                        >
                          {workOrder.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="relative h-[780px] min-h-[780px] bg-white">
                <TrayReferenceStrip
                  allocations={trayOverviewDemoAllocations}
                  quantityReady
                  onReleaseOccupiedTray={(trayCode) => {
                    if (trayCode === '04') setTrayOverviewDemoReleased(true);
                  }}
                  screenMode
                  planTaskStates={trayPlanDemoStates}
                  planTaskExecutionDisabled={Object.fromEntries(
                    trayOverviewDemoAllocations.map((slot) => [
                      slot.code,
                      Object.entries(trayPlanDemoStates).some(([code, taskState]) => code !== slot.code && taskState === 'running'),
                    ]),
                  )}
                  onExecutePlanTray={(slot) => {
                    setTrayPlanDemoStates((current) => ({ ...current, [slot.code]: 'running' }));
                  }}
                  onConfirmPlanTrayArrival={(slot) => {
                    setTrayPlanDemoStates((current) => ({ ...current, [slot.code]: 'done' }));
                  }}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-3">
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-700">展开状态</div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="min-w-0">
                      <div className="mb-1.5 text-[11px] text-slate-400">无零件 / 置灰</div>
                      <TrayAllocationCard
                        slot={trayCardDemoSlots.empty}
                        quantityReady
                        showState={false}
                        layout="stack"
                        compact
                        disabled
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1.5 text-[11px] text-slate-400">单料</div>
                      <TrayAllocationCard
                        slot={trayCardDemoSlots.single}
                        quantityReady
                        showState={false}
                        layout="stack"
                        compact
                        taskState="pending"
                        onExecute={() => undefined}
                        onConfirmArrival={() => undefined}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1.5 text-[11px] text-slate-400">满盘警告</div>
                      <TrayAllocationCard
                        slot={trayCardDemoSlots.full}
                        quantityReady
                        showState={false}
                        layout="stack"
                        compact
                        taskState="running"
                        onExecute={() => undefined}
                        onConfirmArrival={() => undefined}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1.5 text-[11px] text-slate-400">多料 / 单列摆放</div>
                      <TrayAllocationCard
                        slot={trayCardDemoSlots.multi}
                        quantityReady
                        showState={false}
                        layout="stack"
                        compact
                        taskState="done"
                        onExecute={() => undefined}
                        onConfirmArrival={() => undefined}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-700">横向清单组合</div>
                  <div className="flex items-stretch gap-1.5 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <TrayAllocationCard slot={trayCardDemoSlots.multi} quantityReady showState={false} layout="stack" />
                    <TrayAllocationCard slot={trayCardDemoSlots.full} quantityReady showState={false} layout="stack" />
                    <TrayAllocationCard slot={trayCardDemoSlots.single} quantityReady showState={false} layout="stack" />
                    <TrayAllocationCard slot={trayCardDemoSlots.empty} quantityReady showState={false} layout="stack" disabled />
                    <TrayAllocationCard slot={trayCardDemoSlots.collapsed} quantityReady showState={false} layout="stack" collapsed disabled />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-700">工作台轴测托盘卡片</div>
                  <div className="flex flex-wrap items-end gap-6 rounded-xl border border-slate-100 bg-ds-bg-viewport bg-[linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:32px_32px] px-5 py-7">
                    <div style={{ width: productionTrayCardSkewWidth }}>
                      <ProductionTrayCard variant="skew" code="02" state="loaded" material="零件01 主筋板" quantity={5} />
                    </div>
                    <div style={{ width: productionTrayCardSkewWidth }}>
                      <ProductionTrayCard variant="skew" code="08" state="empty" />
                    </div>
                    <div style={{ width: productionTrayCardSkewWidth }}>
                      <ProductionTrayCard variant="skew" code="03" state="reserved" activity="等待 AGV 入站" />
                    </div>
                    <div style={{ width: productionTrayCardSkewWidth }}>
                      <ProductionTrayCard variant="skew" code="05" state="empty-frame" activity="AGV 空托回收中" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex min-w-[76px] flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="text-[11px] text-slate-400">折叠态</div>
                <TrayAllocationCard
                  slot={trayCardDemoSlots.collapsed}
                  quantityReady
                  showState={false}
                  layout="stack"
                  collapsed
                  disabled
                />
              </div>
            </div>
          </DemoCard>
        );
      case 'composite':
      default:
        return (
          <>
            <DemoCard title="工作台参数设置">
              <div className="space-y-4">
                <div>
                  <div className={`flex h-10 items-end gap-5 overflow-x-auto border-b border-white/70 px-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
                    {['主筋板打磨翻面平台', '主筋板正面装配平台', '主筋板翻面平台', '主筋板背面装配平台'].map((item, index) => {
                      const selected = demoWorkbenchIndex === index;
                      return (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={selected}
                          disabled={disabled}
                          className={`relative flex h-full shrink-0 items-start px-0.5 pt-1 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                            selected
                              ? 'text-zinc-800'
                              : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                          onClick={() => setDemoWorkbenchIndex(index)}
                        >
                          {item}
                          <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${selected ? 'bg-ds-brand-primary' : 'bg-transparent'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
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
                        disabled={disabled}
                        className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          selected
                            ? 'bg-white text-ds-brand-primary-text shadow-sm'
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                        }`}
                        onClick={() => setActiveWorkbenchParameterTab(item.key)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {activeWorkbenchParameterTab === 'support' ? (
                  <div className="rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                    <div className="mb-4 text-sm font-medium text-slate-800">支撑参数</div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="ds-parameter-field rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                        <div className="text-sm font-medium text-slate-700">支撑间距阈值</div>
                        <RangeFieldDemo
                          minValue={displayValues.minValue}
                          maxValue={displayValues.maxValue}
                          disabled={disabled}
                          minLabel="最小间距"
                          maxLabel="最大间距"
                          unit="mm"
                          onMinChange={setMinValue}
                          onMaxChange={setMaxValue}
                        />
                      </div>
                      <div className="ds-parameter-field rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <span>支撑覆盖率阈值</span>
                          <CircleAlert className="size-3.5 text-slate-300" />
                        </div>
                        <PercentSliderDemo value={displayValues.percentValue} disabled={disabled} onChange={setPercentValue} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                    <div className="mb-4 text-sm font-medium text-slate-800">压紧参数</div>
                    <div className="space-y-4">
                      <MultiSelectDemo
                        label="压紧编号"
                        values={['1', '2']}
                        selectedValues={invalid ? [] : selectedClampIds}
                        disabled={disabled}
                        onToggle={toggleClampSelection}
                      />
                      {(invalid ? [] : selectedClampIds).length > 0 && (
                        <div className="grid gap-ds-150 xl:grid-cols-2">
                          {(invalid ? [] : selectedClampIds).map((clampId) => {
                            const clampSetting = clampSettings[clampId] ?? createDefaultWorkbenchClampSetting(clampId);
                            const clampAxes = getDemoWorkbenchClampAxes(demoWorkbenchIndex);
                            return (
                              <div key={clampId} className="ds-parameter-card-inset rounded-ds-xl bg-zinc-100/55 ring-1 ring-ds-border-default">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <div className="text-sm font-medium text-slate-700">压紧 {clampId}</div>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">编号 {clampId}</span>
                                </div>
                                <div className="grid gap-ds-150 md:grid-cols-2">
                                  <div className="ds-parameter-field">
                                    <div className="ds-parameter-label">压紧类型</div>
                                    <div className={`grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
                                      {['翻转', '定位焊'].map((item) => {
                                        const selected = clampSetting.type === item;
                                        return (
                                          <button
                                            key={item}
                                            type="button"
                                            aria-pressed={selected}
                                            disabled={disabled}
                                            className={`min-h-8 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                              selected
                                                ? 'bg-white text-ds-brand-primary-text shadow-sm'
                                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                                            }`}
                                            onClick={() =>
                                              updateClampSetting(clampId, (setting) => ({
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
                                    <div className={`grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
                                      {['左端', '右端'].map((item) => {
                                        const selected = clampSetting.zeroPosition === item;
                                        return (
                                          <button
                                            key={item}
                                            type="button"
                                            aria-pressed={selected}
                                            disabled={disabled}
                                            className={`min-h-8 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                              selected
                                                ? 'bg-white text-ds-brand-primary-text shadow-sm'
                                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                                            }`}
                                            onClick={() =>
                                              updateClampSetting(clampId, (setting) => ({
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
                                      <UnitNumberInputDemo
                                        value={clampSetting.size.length}
                                        unit="mm"
                                        disabled={disabled}
                                        onChange={(nextValue) =>
                                          updateClampSetting(clampId, (setting) => ({
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
                                      <UnitNumberInputDemo
                                        value={clampSetting.size.width}
                                        unit="mm"
                                        disabled={disabled}
                                        onChange={(nextValue) =>
                                          updateClampSetting(clampId, (setting) => ({
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
                                    const shownMinValue = invalid && axis === clampAxes[0] ? 'abc' : clampSetting.softLimits[axis].min;
                                    const shownMaxValue = invalid && axis === clampAxes[0] ? '300' : clampSetting.softLimits[axis].max;
                                    const axisWarningText = disabled ? '' : getNumberRangeWarning(shownMinValue, shownMaxValue);
                                    const axisRangeInvalid = Boolean(axisWarningText);
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
                                        <RangeFieldDemo
                                          minValue={shownMinValue}
                                          maxValue={shownMaxValue}
                                          disabled={disabled}
                                          minLabel="最小值"
                                          maxLabel="最大值"
                                          unit="mm"
                                          onMinChange={(nextValue) =>
                                            updateClampSetting(clampId, (setting) => ({
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
                                            updateClampSetting(clampId, (setting) => ({
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
                      <div className="ds-parameter-field rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100 xl:col-span-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <span>压紧覆盖率阈值</span>
                          <CircleAlert className="size-3.5 text-slate-300" />
                        </div>
                        <PercentSliderDemo value="72" disabled={disabled} onChange={() => {}} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DemoCard>
            <DemoCard title="组合参数卡片">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="ds-parameter-field rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                  <div className="text-sm font-medium text-slate-700">支撑间距阈值</div>
                  <RangeFieldDemo
                    minValue={displayValues.minValue}
                    maxValue={displayValues.maxValue}
                    disabled={disabled}
                    minLabel="最小间距"
                    maxLabel="最大间距"
                    unit="mm"
                    onMinChange={setMinValue}
                    onMaxChange={setMaxValue}
                  />
                </div>
                <div className="ds-parameter-field rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <span>支撑覆盖率阈值</span>
                    <CircleAlert className="size-3.5 text-slate-300" />
                  </div>
                  <PercentSliderDemo value={displayValues.percentValue} disabled={disabled} onChange={setPercentValue} />
                </div>
              </div>
            </DemoCard>
            <DemoCard title="复合输入框布局（ProcessFieldGroup）">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-xs text-slate-400">双字段：长 / 宽</div>
                  <ProcessFieldGroup cols={2}>
                    <div className="ds-parameter-field">
                      <div className="ds-parameter-label">长</div>
                      <UnitNumberInputDemo value="280" unit="mm" disabled={disabled} onChange={() => {}} />
                    </div>
                    <div className="ds-parameter-field">
                      <div className="ds-parameter-label">宽</div>
                      <UnitNumberInputDemo value="180" unit="mm" disabled={disabled} onChange={() => {}} />
                    </div>
                  </ProcessFieldGroup>
                </div>
                <div>
                  <div className="mb-2 text-xs text-slate-400">三字段：Rx / Ry / Rz</div>
                  <ProcessFieldGroup cols={3}>
                    {['Rx', 'Ry', 'Rz'].map((label) => (
                      <div key={label} className="ds-label-input-compact">
                        <div className="ds-parameter-label">{label}</div>
                        <UnitNumberInputDemo value="0" unit="°" disabled={disabled} onChange={() => {}} />
                      </div>
                    ))}
                  </ProcessFieldGroup>
                </div>
                <div>
                  <div className="mb-2 text-xs text-slate-400">角度范围：空值 / 非法数字 / 最小值大于最大值</div>
                  <div className="grid gap-ds-150">
                    {[
                      ['直线与直线夹角范围', invalid ? '' : '0', '15'],
                      ['直线与圆弧切线夹角范围', invalid ? 'abc' : '0', '10'],
                      ['圆弧与圆弧切线夹角范围', invalid ? '30' : '0', '10'],
                    ].map(([label, minValue, maxValue]) => {
                      const warningText = disabled ? '' : getNumberRangeWarning(minValue, maxValue);
                      const rangeInvalid = Boolean(warningText);
                      return (
                      <div key={label} className="ds-parameter-field">
                        <div className="flex min-h-6 items-center justify-between gap-2">
                          <div className="min-w-0 truncate text-xs font-normal text-slate-500">{label}</div>
                          {warningText && (
                            <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs leading-4 text-red-500">
                              <CircleAlert className="size-3.5" />
                              <span>{warningText}</span>
                            </div>
                          )}
                        </div>
                        <ProcessFieldGroup cols={2}>
                          <UnitNumberInputDemo value={minValue} unit="°" disabled={disabled} label="最小值" invalid={rangeInvalid} onChange={() => {}} />
                          <UnitNumberInputDemo value={maxValue} unit="°" disabled={disabled} label="最大值" invalid={rangeInvalid} onChange={() => {}} />
                        </ProcessFieldGroup>
                      </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs text-slate-400">范围校验 warning 平铺</div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {[
                      ['空值', '直线与直线夹角范围', '', '15'],
                      ['非法数字', '直线与圆弧切线夹角范围', 'abc', '10'],
                      ['最小值大于最大值', '圆弧与圆弧切线夹角范围', '30', '10'],
                      ['正常', '参考正常范围', '0', '15'],
                    ].map(([caseLabel, label, minValue, maxValue]) => {
                      const warningText = disabled ? '' : getNumberRangeWarning(minValue, maxValue);
                      const rangeInvalid = Boolean(warningText);
                      return (
                        <div key={caseLabel} className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-medium text-slate-600">{caseLabel}</div>
                            {warningText ? (
                              <div className="flex items-center gap-1 text-xs text-red-500">
                                <CircleAlert className="size-3.5" />
                                <span>{warningText}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-600">校验通过</span>
                            )}
                          </div>
                          <div className="ds-label-input-compact">
                            <div className="ds-label-input-compact-label">{label}</div>
                            <ProcessFieldGroup cols={2}>
                              <UnitNumberInputDemo value={minValue} unit="°" disabled={disabled} label="最小值" invalid={rangeInvalid} onChange={() => {}} />
                              <UnitNumberInputDemo value={maxValue} unit="°" disabled={disabled} label="最大值" invalid={rangeInvalid} onChange={() => {}} />
                            </ProcessFieldGroup>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                  规范：复合输入框统一使用 gap-ds-250（20px），通过 ProcessFieldGroup 控制，不在业务代码里写死 grid gap。
                </div>
              </div>
            </DemoCard>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <SlidersHorizontal className="size-4 text-orange-500" />
              工艺参数组件管理
            </div>
            <div className="mt-1 text-xs text-slate-400">/component-lab</div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab !== 'tokens' && (
              <div className="mr-1 flex rounded-lg bg-slate-100 p-0.5">
                {([
                  ['split', '分栏'],
                  ['grid', '平铺'],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`h-7 rounded-md px-2.5 text-xs transition-colors ${
                      componentViewMode === mode
                        ? 'bg-white text-ds-brand-primary-text shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setComponentViewMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {activeTab !== 'tokens' && (Object.keys(demoStateLabels) as DemoState[]).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={state === item ? 'default' : 'outline'}
                className={`h-8 px-3 text-xs ${state === item ? 'bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover' : ''}`}
                onClick={() => setState(item)}
              >
                {demoStateLabels[item]}
              </Button>
            ))}
            <a href="/primitive-lab" className="ml-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-ds-brand-primary-text hover:bg-orange-100">
              基础组件试验页
            </a>
            <a href="/component-drafts" className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              过程稿
            </a>
            <a href="/" className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              返回主页面
            </a>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 px-6 pb-3">
          {(Object.keys(labTabLabels) as LabTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                activeTab === tab
                  ? 'bg-orange-50 text-ds-brand-primary-text'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              onClick={() => switchLabTab(tab)}
            >
              {labTabLabels[tab]}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {activeTab === 'tokens' && <DesignTokenTab />}
        {activeTab !== 'tokens' && (
          <>
            <div className="rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">交互组件分页</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    当前只展示一个分页内的组件，避免通用控件、工艺执行和生产执行混在同一屏。
                  </div>
                </div>
                <div className="grid gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-3">
                  {componentPageTabs.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      className={`min-w-[108px] rounded-md px-3 py-2 text-left transition-colors ${
                        activeComponentPage === page.id
                          ? 'bg-white text-ds-brand-primary-text shadow-sm'
                          : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                      }`}
                      onClick={() => switchComponentPage(page.id)}
                    >
                      <div className="text-xs font-semibold">{page.title}</div>
                      <div className={`mt-0.5 text-[10px] leading-4 ${activeComponentPage === page.id ? 'text-ds-brand-primary-text/70' : 'text-slate-400'}`}>
                        {page.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {componentViewMode === 'split' ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2.2fr)]">
              <aside className="lg:sticky lg:top-32 lg:self-start">
                <div className="rounded-xl bg-white p-3 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                  <div className="px-2 pb-3 text-xs font-medium text-slate-400">
                    组件栏 · {componentPageTabs.find((page) => page.id === activeComponentPage)?.title}
                  </div>
                  <div className="space-y-3">
                    {visibleComponentSectionLayers.map((layer) => {
                      const expanded = visibleExpandedComponentLayerId === layer.id;
                      return (
                        <div key={layer.id} className="overflow-hidden rounded-lg bg-slate-50/70">
                          <button
                            type="button"
                            className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors ${
                              expanded ? 'bg-orange-50/70 text-ds-brand-primary-text' : 'text-slate-700 hover:bg-white/80'
                            }`}
                            onClick={() => expandComponentLayer(layer)}
                            aria-expanded={expanded}
                          >
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold">{layer.title}</span>
                              <span className={`mt-0.5 block text-[10px] leading-4 ${expanded ? 'text-ds-brand-primary-text/70' : 'text-slate-400'}`}>
                                {layer.description}
                              </span>
                            </span>
                            <span className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${expanded ? 'bg-white text-ds-brand-primary-text' : 'bg-white/80 text-slate-400'}`}>
                              {layer.sections.length}
                            </span>
                          </button>
                          {expanded && (
                            <div className="space-y-1 border-t border-white/70 p-2">
                              {layer.sections.map((sectionId) => {
                                const item = componentSectionMeta[sectionId];
                                const selected = shownComponentSection === item.id;
                                return (
                                  <button
                                    key={`${layer.id}-${item.id}`}
                                    type="button"
                                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                                      selected
                                        ? 'bg-white text-ds-brand-primary-text shadow-sm'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-800'
                                    }`}
                                    onClick={() => {
                                      setExpandedComponentLayerId(layer.id);
                                      setActiveComponentSection(item.id);
                                    }}
                                  >
                                    <div className="text-xs font-medium">{item.title}</div>
                                    <div className={`mt-1 text-[11px] leading-4 ${selected ? 'text-ds-brand-primary-text/70' : 'text-slate-400'}`}>
                                      {item.description}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="min-w-0 space-y-4">
                <div className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 text-[11px] font-medium text-ds-brand-primary-text">{activeComponentLayer.title}</div>
                      <div className="text-base font-semibold text-slate-800">{activeComponentMeta.title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">{activeComponentMeta.description}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                      当前状态：{demoStateLabels[state]}
                    </div>
                  </div>
                </div>

                {renderComponentDetail(shownComponentSection)}

                <DemoCard title="样式参数">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {styleRows.map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-[11px] text-slate-400">{label}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-600">{value}</div>
                      </div>
                    ))}
                  </div>
                </DemoCard>
              </section>
            </div>
            ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-800">
                      {componentPageTabs.find((page) => page.id === activeComponentPage)?.title}平铺总览
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">快速扫视当前分页组件及其当前状态，适合做一致性检查。</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                    当前状态：{demoStateLabels[state]}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                {visibleComponentSectionLayers.map((layer) => {
                  const expanded = visibleExpandedComponentLayerId === layer.id;
                  return (
                    <section key={layer.id} className="overflow-hidden rounded-xl border border-white bg-white/78 shadow-md shadow-slate-200/50 ring-1 ring-slate-100">
                      <button
                        type="button"
                        className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors ${
                          expanded ? 'bg-orange-50/70 text-ds-brand-primary-text' : 'text-slate-800 hover:bg-slate-50'
                        }`}
                        onClick={() => expandComponentLayer(layer)}
                        aria-expanded={expanded}
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-white/80">
                          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{layer.title}</span>
                          <span className={`mt-1 block text-xs leading-5 ${expanded ? 'text-ds-brand-primary-text/70' : 'text-slate-400'}`}>
                            {layer.description}
                          </span>
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${expanded ? 'bg-white text-ds-brand-primary-text' : 'bg-slate-50 text-slate-400'}`}>
                          {layer.sections.length} 项
                        </span>
                      </button>
                      {expanded && (
                        <div className="grid gap-4 border-t border-white/70 p-4 lg:grid-cols-2">
                          {layer.sections.map((sectionId) => (
                            <div
                              key={`${layer.id}-${sectionId}`}
                              className={sectionId === 'unit-number' || sectionId === 'checkbox' || sectionId === 'object-select' || sectionId === 'pick-path-points' || sectionId === 'clamp-point-config' || sectionId === 'viewport-workspace' || sectionId === 'process-panel' || sectionId === 'production-task-panels' || sectionId === 'production-execution' || sectionId === 'tray-card' ? 'col-span-full' : ''}
                            >
                              {renderComponentDetail(sectionId)}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
