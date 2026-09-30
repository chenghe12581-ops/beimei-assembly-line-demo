import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ASSET_BASE } from '../asset-base';
import { createPortal } from 'react-dom';
import { Canvas, useLoader } from '@react-three/fiber';
import { Bounds, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  AlertTriangle,
  Ban,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Forklift,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Tooltip } from 'antd';
import { Button } from './components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useGlobalAlertHolder } from './components/ui/global-alert';
import { PanelEmptyState } from './components/ui/panel-empty-state';
import { ScrollArea } from './components/ui/scroll-area';
import {
  buildTrayPlanAllocations,
  getTrayPlanSummary,
  TrayAllocationCard,
  type TrayManagedTask,
  TrayManagementPage,
  TrayReferenceStrip,
  type TrayAllocation,
  type TraySlot,
  type TrayTask,
} from './components/production/TrayManagement';
import {
  getProductionStationCardHeight,
  ProductionStationCard,
  productionStationCardHorizontalWidth,
  productionStationCardSkewWidth,
  type ProductionStationStatus,
} from './components/production/ProductionStationCard';
import {
  getProductionTrayCardHeight,
  ProductionTrayCard,
  ProductionTrayEditDialog,
  productionTrayCardHorizontalWidth,
  productionTrayCardSkewWidth,
  type ProductionTrayCardEditPayload,
  type ProductionTrayMaterialOption,
} from './components/production/ProductionTrayCard';
import { useProductionStationCardVariant, type ProductionStationCardVariant } from './components/production/production-station-card-variant';
import {
  SingleStepDebugPanel,
  type ProductionDebugExecutionMode,
  type ProductionDebugStation,
  type ProductionDebugStationSnapshot,
  type ProductionTrayStationSnapshot,
} from './components/production/SingleStepDebugPanel';
import {
  findProductionCompositeWorkstepLocation,
  getProductionCompositeStation,
  getProductionCompositeWorkstepSegments,
  getProductionCompositeWorkstepNames,
  getProductionCompositeWorkstepGroups,
  getProductionStationDemoProcess,
  getProductionStationWorkstepNames,
  getProductionStationWorkstepGroups,
  resolveProductionCompositeWorkstepIndex,
} from './components/production/production-station-worksteps';
import {
  getProductionWorkbenchGroundRectStyle,
  type ProductionWorkbenchGroundRectStatus,
} from './components/production/production-workbench-ground-rect';
import {
  ProductionTaskTreePanel1,
  getProcessPartNames,
  getProductionProcessFilterState,
  getProductionProcessKey,
  productionProcessFilterStateOptions,
  type ProcessOption,
  type ProductionTask,
  type ProductionTaskFilterKind,
  type ProductionWorkpiece,
  type SelectOption,
  type WorkpieceState,
} from './components/production/ProductionTaskTreePanel1';
import { formatCombinedPartObject, formatProductionWorkpieceSerial, ProductionProcessTitle, ProductionTaskTreePanel2 } from './components/production/ProductionTaskTreePanel2';
import { TaskStatusMonitorPanel } from './components/production/TaskStatusMonitorPanel';
import { VisionExceptionDemoPanel } from './components/production/VisionExceptionDemoPanel';
import { VisionPointCloud } from './components/production/VisionPointCloud';
import { VisionFeedBar, visionFeedOptions } from './components/production/VisionFeedBar';
import { PositioningChoiceDialog, type PositioningDialogImportStatus } from './components/production/PositioningChoiceDialog';
import { VisionPositionResultPanel, type VisionPositionResult, type PositioningResultSource } from './components/production/VisionPositionResultPanel';
import { visionAssemblyWorkpieceCode } from './components/production/vision-assembly-demo';
import { createFixedPlanningProcesses, type PlanningProcessLocationId } from './process-planning-model';

type DeviceState = 'connected' | 'disconnected' | 'abnormal';
type WorkspaceTab = 'execution' | 'model' | 'vision';

type WorkpieceOption = {
  id: string;
  project: string;
  name: string;
  drawingNo: string;
  material: string;
  processIds: string[];
};

type NewWorkOrderPayload = {
  draftId: string;
  workOrderNo: string;
  workpiece: WorkpieceOption;
  quantity: number;
  processIds: string[];
  disabledProcessIds: string[];
};

type NewWorkOrderDraft = {
  id: string;
  workOrderNo: string;
  workOrderNoCustomized?: boolean;
  createdAt: number;
  confirmed: boolean;
  workpieceId: string | null;
  quantityInput: string;
  dialogStep: 'workpiece' | 'tray';
  selectedPreviewProcessId: string | null;
  selectedPreviewPartId: string | null;
  selectedPreviewProcessIds: Set<string>;
  disabledPreviewProcessIds: Set<string>;
};

function formatWorkOrderTimestamp(time: number) {
  const date = new Date(time);
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${pad(date.getFullYear(), 4)}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// 默认工单名称：工件代号 + 数量 + 时间戳（年月日时分秒）
function formatDefaultWorkOrderNo(drawingNo: string, quantity: number, createdAt: number) {
  return `${drawingNo}_${quantity}_${formatWorkOrderTimestamp(createdAt)}`;
}

// 工单名称过长时在静止展示态横向滚动，短名称保持静态截断。
function WorkOrderNoText({ value, className }: { value: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    setOverflowing(element.scrollWidth > element.clientWidth + 1);
  }, [value]);
  if (!overflowing) {
    return (
      <div ref={containerRef} className={`truncate ${className ?? ''}`}>{value}</div>
    );
  }
  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      <div className="work-order-name-marquee flex w-max">
        <span className="shrink-0 pr-10">{value}</span>
        <span className="shrink-0 pr-10" aria-hidden="true">{value}</span>
      </div>
    </div>
  );
}

function serializeNewWorkOrderDrafts(drafts: NewWorkOrderDraft[]) {
  return JSON.stringify(drafts.map((draft) => ({
    ...draft,
    selectedPreviewProcessIds: Array.from(draft.selectedPreviewProcessIds).sort(),
    disabledPreviewProcessIds: Array.from(draft.disabledPreviewProcessIds).sort(),
  })));
}

type LogEntry = {
  id: string;
  level: 'info' | 'warning' | 'error';
  time: string;
  text: string;
};

type ProductionModelPart = {
  id: string;
  name: string;
  partNo: string;
  level: number;
  modelPath: string;
  parentId?: string;
};

type ProductionModelProperties = {
  modelName: string;
  material: string;
  weight: string;
  thickness: string;
};

type ProductionWorkbenchArea = {
  id: string;
  name: string;
  cx: number;
  cy: number;
  topWidth: number;
  topDepth: number;
  frontScale?: number;
  depthScale?: number;
  height: number;
  labelSvgX: number;
  labelSvgY: number;
  labelSvgWidth: number;
};

type WorkbenchStationStatus = ProductionStationStatus;
type ProductionWorkbenchTrayPosition = {
  label: string;
  cx: number;
  cy: number;
  large?: boolean;
};

type ProductionWorkbenchTrayZoneLabel = {
  id: string;
  label: string;
  trayCodes: string[];
};

type ProductionWorkbenchProcessPlacement = {
  areaId?: string;
  trayCode?: string;
};

type ProductionWorkbenchGroundRect = {
  id: string;
  areaIds: string[];
};

const productionViewportBackgroundColor = '#e4e4e4';

const beimei010101LegacyProcessOptions: ProcessOption[] = [
  { id: 'generated-pick-01', name: '抓取', partObject: '0162-01-010101-01', unit: '上料' },
  { id: 'generated-place-01', name: '放置', partObject: '0162-01-010101-01', unit: '放置' },
  { id: 'generated-grind-01', name: '打磨', partObject: '0162-01-010101-01', unit: '打磨' },
  { id: 'generated-pick-02', name: '抓取', partObject: '0162-01-010101-02', unit: '上料' },
  { id: 'generated-place-02', name: '放置', partObject: '0162-01-010101-02', unit: '放置' },
  { id: 'generated-grind-02', name: '打磨', partObject: '0162-01-010101-02', unit: '打磨', batchGroup: 'side-plate-grind' },
  { id: 'generated-assemble-02', name: '装配', partObject: '0162-01-010101-02', unit: '装配' },
  { id: 'generated-clamp-02-01', name: '翻面压紧', partObject: '0162-01-010101-02 + 0162-01-010101-01', unit: '压紧' },
  { id: 'generated-weld-scan-02-01', name: '定位焊扫描', partObject: '0162-01-010101-02 + 0162-01-010101-01', unit: '扫描' },
  { id: 'generated-weld-02-01', name: '定位焊', partObject: '0162-01-010101-02 + 0162-01-010101-01', unit: '焊接' },
  { id: 'generated-pick-03', name: '抓取', partObject: '0162-01-010101-03', unit: '上料' },
  { id: 'generated-place-03', name: '放置', partObject: '0162-01-010101-03', unit: '放置' },
  { id: 'generated-grind-03', name: '打磨', partObject: '0162-01-010101-03', unit: '打磨', batchGroup: 'side-plate-grind' },
  { id: 'generated-assemble-03', name: '装配', partObject: '0162-01-010101-03', unit: '装配' },
  { id: 'generated-clamp-03-02-01', name: '翻面压紧', partObject: '0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01', unit: '压紧' },
  { id: 'generated-weld-scan-03-02-01', name: '定位焊扫描', partObject: '0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01', unit: '扫描' },
  { id: 'generated-weld-03-02-01', name: '定位焊', partObject: '0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01', unit: '焊接' },
  { id: 'generated-pick-04', name: '抓取', partObject: '0162-01-010101-04', unit: '上料' },
  { id: 'generated-place-04', name: '放置', partObject: '0162-01-010101-04', unit: '放置' },
  { id: 'generated-grind-04', name: '打磨', partObject: '0162-01-010101-04', unit: '打磨', batchGroup: 'side-plate-grind' },
  { id: 'generated-assemble-04', name: '装配', partObject: '0162-01-010101-04', unit: '装配' },
  { id: 'generated-clamp-04-03-02-01', name: '翻面压紧', partObject: '0162-01-010101-04 + 0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01', unit: '压紧' },
  { id: 'generated-weld-scan-04-03-02-01', name: '定位焊扫描', partObject: '0162-01-010101-04 + 0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01', unit: '扫描' },
  { id: 'generated-weld-04-03-02-01', name: '定位焊', partObject: '0162-01-010101-04 + 0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01', unit: '焊接' },
];

const beimei010101ProcessOptions: ProcessOption[] = createFixedPlanningProcesses('0162-01-010101').map((process) => ({
  id: process.id,
  name: process.name,
  partObject: process.object,
  unit: process.productionUnit,
  batchGroup: process.batchGroup,
}));

const processOptions: ProcessOption[] = beimei010101ProcessOptions;
const mockedAbnormalProcessId: string | null = 'generated-assemble-02';
const mockedAbnormalWorkpieceSerial = '0162-01-010101-01';

function NewTaskTrayTree({
  allocations,
  quantityReady,
}: {
  allocations: TrayAllocation[];
  quantityReady: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/45 p-3">
        <div className="text-xs font-semibold text-slate-800">托盘信息</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="relative space-y-1.5 pl-3 before:absolute before:bottom-4 before:left-[12px] before:top-2 before:w-px before:bg-zinc-300/70">
          {allocations.map((slot) => {
            const materials = slot.materials.length > 0
              ? slot.materials
              : slot.partName
                ? [{ partName: slot.partName, partNo: slot.partNo, count: slot.count }]
                : [];
            const disabled = materials.length === 0;
            return (
              <div key={slot.id} className="relative pl-5">
                <span className="absolute left-0 top-3 h-px w-4 bg-zinc-300/70" />
                <div className={`rounded-lg border px-2.5 py-2 ${
                  disabled
                    ? 'border-zinc-200 bg-zinc-100/80 text-zinc-400 opacity-80 grayscale'
                    : materials.length > 0
                    ? 'border-zinc-200 bg-white/70'
                    : 'border-dashed border-zinc-200 bg-white/45'
                }`} aria-disabled={disabled || undefined}>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      disabled ? 'bg-zinc-300 text-zinc-500' : 'bg-zinc-700 text-white'
                    }`}>
                      {slot.code}
                    </span>
                  </div>
                  {materials.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {materials.map((material) => (
                        <div key={material.partName} className="flex min-w-0 flex-col rounded-md bg-white/72 px-2 py-1.5">
                          <span className="truncate text-[11px] font-semibold leading-4 text-slate-700">{material.partName}</span>
                          <span className="text-[10px] font-medium leading-4 text-slate-400">
                            {quantityReady ? `${material.count} 件` : '待输入数量'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 truncate text-[11px] font-semibold leading-4 text-zinc-400">暂无零件</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getWorkpiecePartNames(workpiece: Pick<WorkpieceOption, 'drawingNo'>) {
  return ['01', '02', '03', '04'].map((partNo) => `${workpiece.drawingNo}-${partNo}`);
}

const workpieceLibrary: WorkpieceOption[] = [
  {
    id: 'wp-0162-01',
    project: '0162',
    name: '0162-01-010101',
    drawingNo: '0162-01-010101',
    material: '主筋板 / 贴板组件',
    processIds: beimei010101ProcessOptions.map((item) => item.id),
  },
  {
    id: 'wp-0162-02',
    project: '0162',
    name: '0162-02-020202',
    drawingNo: '0162-02-020202',
    material: '侧板 / 贴板组件',
    processIds: beimei010101ProcessOptions.map((item) => item.id),
  },
  {
    id: 'wp-0162-03',
    project: '0162',
    name: '0162-03-030303',
    drawingNo: '0162-03-030303',
    material: '反面主筋板 / 辅筋板',
    processIds: beimei010101ProcessOptions.map((item) => item.id),
  },
  {
    id: 'wp-0162-04',
    project: '0162',
    name: '0162-04-040404',
    drawingNo: '0162-04-040404',
    material: '连杆组件',
    processIds: beimei010101ProcessOptions.slice(0, 17).map((item) => item.id),
  },
  {
    id: 'wp-0162-05',
    project: '0162',
    name: '0162-05-050505',
    drawingNo: '0162-05-050505',
    material: '加强框组件',
    processIds: beimei010101ProcessOptions.slice(0, 21).map((item) => item.id),
  },
  {
    id: 'wp-0162-06',
    project: '0162',
    name: '0162-06-060606',
    drawingNo: '0162-06-060606',
    material: '转接板组件',
    processIds: beimei010101ProcessOptions.slice(0, 15).map((item) => item.id),
  },
  {
    id: 'wp-0163-01',
    project: '0163',
    name: '0163-01-010101',
    drawingNo: '0163-01-010101',
    material: '主板 / 加强板组件',
    processIds: beimei010101ProcessOptions.map((item) => item.id),
  },
  {
    id: 'wp-0163-02',
    project: '0163',
    name: '0163-02-020202',
    drawingNo: '0163-02-020202',
    material: '侧板 / 盖板组件',
    processIds: beimei010101ProcessOptions.slice(0, 20).map((item) => item.id),
  },
  {
    id: 'wp-0163-03',
    project: '0163',
    name: '0163-03-030303',
    drawingNo: '0163-03-030303',
    material: '底板 / 筋板组件',
    processIds: beimei010101ProcessOptions.slice(0, 14).map((item) => item.id),
  },
  {
    id: 'wp-0163-04',
    project: '0163',
    name: '0163-04-040404',
    drawingNo: '0163-04-040404',
    material: '连接座组件',
    processIds: beimei010101ProcessOptions.slice(0, 16).map((item) => item.id),
  },
  {
    id: 'wp-0163-05',
    project: '0163',
    name: '0163-05-050505',
    drawingNo: '0163-05-050505',
    material: '支架板组件',
    processIds: beimei010101ProcessOptions.slice(0, 19).map((item) => item.id),
  },
  {
    id: 'wp-0163-06',
    project: '0163',
    name: '0163-06-060606',
    drawingNo: '0163-06-060606',
    material: '定位板组件',
    processIds: beimei010101ProcessOptions.slice(0, 13).map((item) => item.id),
  },
  {
    id: 'wp-0164-01',
    project: '0164',
    name: '0164-01-010101',
    drawingNo: '0164-01-010101',
    material: '支撑板 / 贴板组件',
    processIds: beimei010101ProcessOptions.map((item) => item.id),
  },
  {
    id: 'wp-0164-02',
    project: '0164',
    name: '0164-02-020202',
    drawingNo: '0164-02-020202',
    material: '连接板 / 辅件组件',
    processIds: beimei010101ProcessOptions.slice(0, 18).map((item) => item.id),
  },
  {
    id: 'wp-0164-03',
    project: '0164',
    name: '0164-03-030303',
    drawingNo: '0164-03-030303',
    material: '翻面装配组件',
    processIds: beimei010101ProcessOptions.slice(0, 12).map((item) => item.id),
  },
  {
    id: 'wp-0164-04',
    project: '0164',
    name: '0164-04-040404',
    drawingNo: '0164-04-040404',
    material: '过渡板组件',
    processIds: beimei010101ProcessOptions.slice(0, 22).map((item) => item.id),
  },
  {
    id: 'wp-0164-05',
    project: '0164',
    name: '0164-05-050505',
    drawingNo: '0164-05-050505',
    material: '压紧板组件',
    processIds: beimei010101ProcessOptions.slice(0, 18).map((item) => item.id),
  },
  {
    id: 'wp-0164-06',
    project: '0164',
    name: '0164-06-060606',
    drawingNo: '0164-06-060606',
    material: '安装板组件',
    processIds: beimei010101ProcessOptions.slice(0, 15).map((item) => item.id),
  },
];

const queuedDemoWorkOrders = [
  { workpieceId: 'wp-0163-02', quantity: 4 },
  { workpieceId: 'wp-0163-03', quantity: 3 },
  { workpieceId: 'wp-0163-04', quantity: 5 },
  { workpieceId: 'wp-0164-01', quantity: 2 },
  { workpieceId: 'wp-0164-05', quantity: 4 },
  { workpieceId: 'wp-0164-06', quantity: 3 },
];

const demoWorkOrderBaseTime = new Date('2026-07-06T09:00:00').getTime();
const firstDemoWorkOrderNo = formatDefaultWorkOrderNo('0162-01-010101', 6, demoWorkOrderBaseTime);

const initialTasks: ProductionTask[] = [
  {
    id: 'task-20260706-001',
    workOrderNo: firstDemoWorkOrderNo,
    name: '0162-01-010101 主筋板拼装件',
    project: '0162 煤机三大件',
    drawingNo: '0162-01-010101',
    quantity: 6,
    state: 'ready',
    currentProcess: '待初始化',
    currentProcessId: null,
    progress: 0,
    processIds: beimei010101ProcessOptions.map((item) => item.id),
    workpieces: Array.from({ length: 6 }, (_, index) => ({
      id: `task-20260706-001-wp-${index + 1}`,
      name: '主筋板拼装件',
      serial: `0162-01-010101-${String(index + 1).padStart(2, '0')}`,
      process: index === 0 ? '桁架上料抓取' : '未开始',
      progress: 0,
      state: 'pending',
      visionSummary: '等待视觉采集',
    })),
  },
  ...queuedDemoWorkOrders.flatMap((fixture, index) => {
    const workpiece = workpieceLibrary.find((item) => item.id === fixture.workpieceId);
    if (!workpiece) return [];
    const taskId = `task-20260706-${String(index + 2).padStart(3, '0')}`;
    return [{
      id: taskId,
      workOrderNo: formatDefaultWorkOrderNo(workpiece.drawingNo, fixture.quantity, demoWorkOrderBaseTime + (index + 1) * 60_000),
      name: `${workpiece.drawingNo} ${workpiece.material}`,
      project: workpiece.project,
      drawingNo: workpiece.drawingNo,
      quantity: fixture.quantity,
      state: 'ready' as const,
      currentProcess: '待初始化',
      currentProcessId: null,
      progress: 0,
      processIds: workpiece.processIds,
      workpieces: makeWorkpieces(taskId, workpiece.drawingNo, workpiece.material, fixture.quantity),
    }];
  }),
];

const initialLegacyTasks: ProductionTask[] = initialTasks.slice(0, 1).map((task) => ({
  ...task,
  processIds: beimei010101LegacyProcessOptions.map((item) => item.id),
}));

const initialTraySlots: TraySlot[] = [
  { id: '1', area: '上料区', trayType: '大托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '2', area: '装配区', trayType: '大托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '3', area: '装配区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '4', area: '装配区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '5', area: '装配区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '6', area: '装配区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '7', area: '装配区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '8', area: '装配区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
  { id: '9', area: '下料区', trayType: '中托盘', material: '空', quantity: 0, state: 'empty' },
];

const initialTrayTasks: TrayTask[] = [
  { id: 'AGV-001', workOrderNo: firstDemoWorkOrderNo, type: '上料任务', mode: '自动', material: '0162-01-010101-01', quantity: 6, pickup: '00', dropoff: '01', state: 'pending' },
  { id: 'AGV-002', type: '空托任务', mode: '自动', material: '', quantity: 0, pickup: '01', dropoff: '00', state: 'pending' },
];

const productionTrayDemoStepInterval = 4000;

const devices: { name: string; state: DeviceState; group: string }[] = [
  { name: 'PLC', state: 'connected', group: '控制' },
  { name: '主筋板打磨机器人1', state: 'connected', group: '机器人' },
  { name: '主筋板打磨机器人2', state: 'connected', group: '机器人' },
  { name: '搬运机器人1', state: 'connected', group: '搬运' },
  { name: '搬运机器人1相机', state: 'connected', group: '视觉' },
  { name: '搬运机器人2', state: 'disconnected', group: '搬运' },
  { name: '搬运机器人2相机', state: 'disconnected', group: '视觉' },
  { name: '桁架相机', state: 'connected', group: '视觉' },
  { name: '正面焊接台焊接机器人1', state: 'connected', group: '焊接' },
  { name: '正面焊接台焊接机器人2', state: 'connected', group: '焊接' },
  { name: '反面焊接台焊接机器人1', state: 'connected', group: '焊接' },
  { name: '反面焊接台焊接机器人2', state: 'abnormal', group: '焊接' },
];

const productionModelParts: ProductionModelPart[] = [
  { id: '0162-01-010101-01', name: '0162-01-010101-01', partNo: '01', level: 0, modelPath: `${ASSET_BASE}models/0162-01-010101-01.stl` },
  { id: '0162-01-010101-02', name: '0162-01-010101-02', partNo: '02', level: 1, parentId: '0162-01-010101-01', modelPath: `${ASSET_BASE}models/0162-01-010101-02.stl` },
  { id: '0162-01-010101-03', name: '0162-01-010101-03', partNo: '03', level: 1, parentId: '0162-01-010101-01', modelPath: `${ASSET_BASE}models/0162-01-010101-03.stl` },
  { id: '0162-01-010101-04', name: '0162-01-010101-04', partNo: '04', level: 2, parentId: '0162-01-010101-03', modelPath: `${ASSET_BASE}models/0162-01-010101-04.stl` },
];

// Read-only prototype metadata, aligned with the process-planning property fields.
const productionModelProperties: Record<string, ProductionModelProperties> = {
  '0162-01-010101-01': { modelName: '主板', material: 'Q345B', weight: '320.5 kg', thickness: '12.0 mm' },
  '0162-01-010101-02': { modelName: '正面加强板', material: 'Q235B', weight: '45.2 kg', thickness: '8.0 mm' },
  '0162-01-010101-03': { modelName: '反面底板', material: 'Q345B', weight: '38.6 kg', thickness: '10.0 mm' },
  '0162-01-010101-04': { modelName: '底板加强筋', material: 'Q235B', weight: '12.8 kg', thickness: '6.0 mm' },
};

const productionModelColors = ['#2f57dd', '#34d399', '#7c3aed', '#f87171'];

const productionWorkbenchAreas: ProductionWorkbenchArea[] = [
  {
    id: 'area-main-assembly-2',
    name: '主筋板装配工位2',
    cx: 210,
    cy: 171,
    topWidth: 156,
    topDepth: 74,
    height: 28,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  },
  {
    id: 'area-side-grind-2',
    name: '贴板打磨工位2',
    cx: 354,
    cy: 237,
    topWidth: 156,
    topDepth: 74,
    height: 28,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  },
  {
    id: 'area-turnover',
    name: '翻面工位',
    cx: 498,
    cy: 303,
    topWidth: 156,
    topDepth: 74,
    height: 28,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  },
  {
    id: 'area-side-grind-1',
    name: '贴板打磨工位1',
    cx: 642,
    cy: 369,
    topWidth: 156,
    topDepth: 74,
    height: 28,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  },
  {
    id: 'area-main-assembly-1',
    name: '主筋板装配工位1',
    cx: 786,
    cy: 435,
    topWidth: 156,
    topDepth: 74,
    height: 28,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  },
  {
    id: 'area-main-grinding',
    name: '主筋板打磨工位1',
    cx: 930,
    cy: 501,
    topWidth: 156,
    topDepth: 74,
    height: 28,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  },
];

const productionWorkbenchGroundRects: ProductionWorkbenchGroundRect[] = [
  {
    id: 'ground-rect-assembly-2',
    areaIds: ['area-main-assembly-2', 'area-side-grind-2'],
  },
  {
    id: 'ground-rect-assembly-1',
    areaIds: ['area-side-grind-1', 'area-main-assembly-1'],
  },
];
const productionWorkbenchGroundRectAxisPadding = 16;
const productionWorkbenchGroundRectDepthPadding = 36;

const agvTrayInnerStep = { x: 48, y: 22 };
const agvTrayGroupStep = { x: 106, y: 48 };
const agvTrayStart = { x: 160, y: 408 };

const agvTrayPositions = [
  { label: '09', large: true, gap: 'start' },
  { label: '08', gap: 'group' },
  { label: '07', gap: 'inner' },
  { label: '06', gap: 'inner' },
  { label: '05', gap: 'inner' },
  { label: '04', gap: 'group' },
  { label: '03', gap: 'inner' },
  { label: '02', gap: 'inner' },
  { label: '01', large: true, gap: 'group' },
].reduce<ProductionWorkbenchTrayPosition[]>((positions, tray) => {
  const previous = positions.at(-1);
  const step = tray.gap === 'group' ? agvTrayGroupStep : agvTrayInnerStep;
  const baseline = previous
    ? { x: previous.cx + step.x, y: previous.cy + step.y + (previous.large ? 10 : 0) }
    : agvTrayStart;
  positions.push({
    label: tray.label,
    cx: baseline.x,
    cy: baseline.y - (tray.large ? 10 : 0),
    large: tray.large,
  });
  return positions;
}, [] as ProductionWorkbenchTrayPosition[]);
const productionWorkbenchTrayZoneLabels: ProductionWorkbenchTrayZoneLabel[] = [
  { id: 'unloading', label: '下料区', trayCodes: ['09'] },
  { id: 'loading', label: '上料区', trayCodes: ['01'] },
];
const productionWorkbenchTrayAxisLength = Math.hypot(44, 20);
const productionWorkbenchTrayAxis = {
  x: 44 / productionWorkbenchTrayAxisLength,
  y: 20 / productionWorkbenchTrayAxisLength,
};
const productionWorkbenchTrayScreenNormal = {
  x: -productionWorkbenchTrayAxis.y,
  y: productionWorkbenchTrayAxis.x,
};
const productionWorkbenchTrayVerticalAxis = {
  x: -productionWorkbenchTrayAxis.x,
  y: productionWorkbenchTrayAxis.y,
};
const productionWorkbenchTrayZoneLabelDirectionLength = Math.hypot(
  productionWorkbenchTrayScreenNormal.x + productionWorkbenchTrayVerticalAxis.x,
  productionWorkbenchTrayScreenNormal.y + productionWorkbenchTrayVerticalAxis.y,
);
const productionWorkbenchTrayZoneLabelDirection = {
  x: (productionWorkbenchTrayScreenNormal.x + productionWorkbenchTrayVerticalAxis.x)
    / productionWorkbenchTrayZoneLabelDirectionLength,
  y: (productionWorkbenchTrayScreenNormal.y + productionWorkbenchTrayVerticalAxis.y)
    / productionWorkbenchTrayZoneLabelDirectionLength,
};
const productionWorkbenchTrayZoneLabelDistance = 48;
const productionWorkbenchTrayZoneLabelAngle = Math.atan2(
  productionWorkbenchTrayAxis.y,
  productionWorkbenchTrayAxis.x,
) * (180 / Math.PI);
const workbenchTrayConnectorLength = 58;
const workbenchTrayConnectorOffsetY: Partial<Record<string, number>> = {
  '09': -18,
  '08': -18,
  '07': -18,
  '06': -18,
  '05': -18,
  '04': 14,
  '03': 14,
  '02': 14,
  '01': 14,
};
const productionViewportBox = { width: 1180, height: 680, translateX: 78, translateY: -52 };
const defaultProductionViewportFrame = { left: 0, top: 0, scale: 1, ready: false };
const stationCardBaseConnectorLength = 48;
const stationCardConnectorReferenceAreaId = 'area-turnover';
const stationCardAnchorOffsetY: Partial<Record<string, number>> = {};

function getProductionViewportFrame(width: number, height: number) {
  if (width <= 0 || height <= 0) return defaultProductionViewportFrame;

  const scale = Math.min(width / productionViewportBox.width, height / productionViewportBox.height);
  const scaledWidth = productionViewportBox.width * scale;
  const scaledHeight = productionViewportBox.height * scale;

  return {
    left: (width - scaledWidth) / 2,
    top: (height - scaledHeight) / 2,
    scale,
    ready: true,
  };
}

function getWorkbenchCuboidGeometry(area: ProductionWorkbenchArea) {
  const halfWidth = area.topWidth / 2;
  const halfDepth = area.topDepth / 2;
  const frontScale = area.frontScale ?? 1;
  const depthScale = area.depthScale ?? 1;
  const frontVector = [halfWidth * frontScale, halfDepth * frontScale];
  const depthVector = [halfWidth * depthScale, -halfDepth * depthScale];
  const frontStart = [area.cx - frontVector[0], area.cy];
  const frontEnd = [frontStart[0] + frontVector[0], frontStart[1] + frontVector[1]];
  const backStart = [frontStart[0] + depthVector[0], frontStart[1] + depthVector[1]];
  const backEnd = [frontEnd[0] + depthVector[0], frontEnd[1] + depthVector[1]];
  const top = [
    backStart,
    backEnd,
    frontEnd,
    frontStart,
  ];
  const topCenter = {
    x: (backStart[0] + backEnd[0] + frontEnd[0] + frontStart[0]) / 4,
    y: (backStart[1] + backEnd[1] + frontEnd[1] + frontStart[1]) / 4,
  };
  return { top, topCenter };
}

function getProductionWorkbenchGroundRectGeometry(rect: ProductionWorkbenchGroundRect) {
  const areas = rect.areaIds
    .map((areaId) => productionWorkbenchAreas.find((area) => area.id === areaId))
    .filter((area): area is ProductionWorkbenchArea => Boolean(area));
  const referenceTop = getWorkbenchCuboidGeometry(areas[0] ?? productionWorkbenchAreas[0]).top;
  const frontAxis = {
    x: referenceTop[1][0] - referenceTop[0][0],
    y: referenceTop[1][1] - referenceTop[0][1],
  };
  const depthAxis = {
    x: referenceTop[0][0] - referenceTop[3][0],
    y: referenceTop[0][1] - referenceTop[3][1],
  };
  const frontAxisLength = Math.hypot(frontAxis.x, frontAxis.y);
  const depthAxisLength = Math.hypot(depthAxis.x, depthAxis.y);
  const frontUnit = { x: frontAxis.x / frontAxisLength, y: frontAxis.y / frontAxisLength };
  const depthUnit = { x: depthAxis.x / depthAxisLength, y: depthAxis.y / depthAxisLength };
  const determinant = frontUnit.x * depthUnit.y - frontUnit.y * depthUnit.x;
  const localPoints = areas.flatMap((area) => getWorkbenchCuboidGeometry(area).top).map(([x, y]) => ({
    front: (x * depthUnit.y - y * depthUnit.x) / determinant,
    depth: (frontUnit.x * y - frontUnit.y * x) / determinant,
  }));
  const frontMin = Math.min(...localPoints.map((point) => point.front)) - productionWorkbenchGroundRectAxisPadding;
  const frontMax = Math.max(...localPoints.map((point) => point.front)) + productionWorkbenchGroundRectAxisPadding + 12;
  const depthMin = Math.min(...localPoints.map((point) => point.depth)) - productionWorkbenchGroundRectDepthPadding;
  const depthMax = Math.max(...localPoints.map((point) => point.depth)) + productionWorkbenchGroundRectDepthPadding;
  const point = (front: number, depth: number) => [
    front * frontUnit.x + depth * depthUnit.x,
    front * frontUnit.y + depth * depthUnit.y,
  ];

  return [
    point(frontMin, depthMin),
    point(frontMax, depthMin),
    point(frontMax, depthMax),
    point(frontMin, depthMax),
  ];
}

function getRoundedPolygonPath(points: number[][], radius: number) {
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

  return corners.reduce((path, corner, index) => {
    return `${path}${index === 0 ? `M ${corner.start[0]} ${corner.start[1]}` : `L ${corner.start[0]} ${corner.start[1]}`} Q ${points[index][0]} ${points[index][1]} ${corner.end[0]} ${corner.end[1]}${index === corners.length - 1 ? ' Z' : ' '}`;
  }, '');
}

const stationCardConnectorLength = (() => {
  const referenceArea = productionWorkbenchAreas.find((area) => (
    area.id === stationCardConnectorReferenceAreaId
  )) ?? productionWorkbenchAreas[1] ?? productionWorkbenchAreas[0];
  const referenceAnchor = getWorkbenchCuboidGeometry(referenceArea).topCenter;
  return referenceAnchor.y - (referenceArea.cy - stationCardBaseConnectorLength);
})();

function getProductionStationCardPlacement({
  area,
  variant: _variant,
}: {
  area: ProductionWorkbenchArea;
  variant: ProductionStationCardVariant;
}) {
  const connectorAnchor = getWorkbenchCuboidGeometry(area).topCenter;
  const connectorX = connectorAnchor.x;

  const cardAnchorOffsetY = stationCardAnchorOffsetY[area.id] ?? 0;
  const connectorStartY = connectorAnchor.y - stationCardConnectorLength + cardAnchorOffsetY;
  return {
    connectorAnchor,
    connectorX,
    connectorStartY,
    cardBottomCenterX: connectorAnchor.x + productionViewportBox.translateX,
    cardBottomCenterY: connectorStartY + productionViewportBox.translateY,
  };
}

function getProductionTrayCuboidArea(tray: ProductionWorkbenchTrayPosition): ProductionWorkbenchArea {
  return {
    id: `tray-${tray.label}`,
    name: tray.label,
    cx: tray.cx,
    cy: tray.cy,
    topWidth: tray.large ? 88 : 44,
    topDepth: tray.large ? 40 : 20,
    height: 8,
    labelSvgX: 0,
    labelSvgY: 0,
    labelSvgWidth: 0,
  };
}

function getProductionTrayCardPlacement(tray: ProductionWorkbenchTrayPosition) {
  const connectorAnchor = getWorkbenchCuboidGeometry(getProductionTrayCuboidArea(tray)).topCenter;
  const connectorStartY = connectorAnchor.y - workbenchTrayConnectorLength + (workbenchTrayConnectorOffsetY[tray.label] ?? 0);

  return {
    connectorAnchor,
    connectorX: connectorAnchor.x,
    connectorStartY,
    cardBottomCenterX: connectorAnchor.x + productionViewportBox.translateX,
    cardBottomCenterY: connectorStartY + productionViewportBox.translateY,
  };
}

function getProductionTrayZoneLabelPlacement(zone: ProductionWorkbenchTrayZoneLabel) {
  const topVertices = zone.trayCodes
    .map((code) => agvTrayPositions.find((tray) => tray.label === code))
    .filter((tray): tray is ProductionWorkbenchTrayPosition => Boolean(tray))
    .flatMap((tray) => getWorkbenchCuboidGeometry(getProductionTrayCuboidArea(tray)).top);

  if (topVertices.length === 0) return { x: 0, y: 0 };

  const axisProjections = topVertices.map(([x, y]) => (
    x * productionWorkbenchTrayAxis.x + y * productionWorkbenchTrayAxis.y
  ));
  const normalProjections = topVertices.map(([x, y]) => (
    x * productionWorkbenchTrayScreenNormal.x + y * productionWorkbenchTrayScreenNormal.y
  ));
  const axisCenter = (Math.min(...axisProjections) + Math.max(...axisProjections)) / 2;
  const normalCenter = (Math.min(...normalProjections) + Math.max(...normalProjections)) / 2;
  const regionCenter = {
    x: axisCenter * productionWorkbenchTrayAxis.x
      + normalCenter * productionWorkbenchTrayScreenNormal.x,
    y: axisCenter * productionWorkbenchTrayAxis.y
      + normalCenter * productionWorkbenchTrayScreenNormal.y,
  };

  return {
    x: regionCenter.x
      + productionWorkbenchTrayZoneLabelDirection.x * productionWorkbenchTrayZoneLabelDistance,
    y: regionCenter.y
      + productionWorkbenchTrayZoneLabelDirection.y * productionWorkbenchTrayZoneLabelDistance,
  };
}

function getTraySlotByCode(traySlots: TraySlot[]) {
  return new Map(traySlots.map((slot) => [slot.id.padStart(2, '0'), slot]));
}

function isProductionTrayOccupied(slot: TraySlot | undefined) {
  return Boolean(slot && slot.state !== 'empty');
}

function getProductionTrayCardState(slot: TraySlot | undefined) {
  if (!slot) return 'empty' as const;
  if (slot.state === 'reserved') return 'reserved' as const;
  if (slot.state === 'empty-frame' || slot.state === 'moving') return 'empty-frame' as const;
  if (slot.state === 'full') return 'full' as const;
  if (slot.state === 'loaded') return 'loaded' as const;
  return 'empty' as const;
}

function WorkbenchIsometricCuboid({ area, status = 'idle' }: { area: ProductionWorkbenchArea; status?: WorkbenchStationStatus }) {
  const { top } = getWorkbenchCuboidGeometry(area);
  const right = [
    top[1],
    [top[1][0], top[1][1] + area.height],
    [top[2][0], top[2][1] + area.height],
    top[2],
  ];
  const front = [
    top[3],
    top[2],
    [top[2][0], top[2][1] + area.height],
    [top[3][0], top[3][1] + area.height],
  ];
  const points = (items: number[][]) => items.map((item) => item.join(',')).join(' ');
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isAbnormal = status === 'abnormal';
  const isDefault = status === 'default';
  const isActive = isRunning || isPaused || isAbnormal;
  const shadowFilter = isAbnormal
    ? 'url(#abnormalCuboidShadow)'
    : isPaused
      ? 'url(#pausedCuboidShadow)'
      : isRunning
        ? 'url(#activeCuboidShadow)'
        : 'url(#cuboidShadow)';
  const topFill = isAbnormal ? '#F87171' : '#FFFFFF';
  const rightFill = isAbnormal ? '#DC2626' : '#E4E4E7';
  const frontFill = isAbnormal ? '#EF4444' : '#F4F4F5';
  const sheenFill = isAbnormal
    ? 'url(#abnormalCuboidSheen)'
    : isPaused
      ? 'url(#pausedCuboidSheen)'
      : isRunning
        ? 'url(#activeCuboidSheen)'
        : 'url(#cuboidSheen)';

  return (
    <g filter={shadowFilter}>
      <polygon points={points(top)} fill={topFill} stroke="none" />
      <polygon points={points(right)} fill={rightFill} stroke="none" />
      <polygon points={points(front)} fill={frontFill} stroke="none" />
      {isRunning || isPaused ? (
        <>
          <polygon points={points(top)} fill={isPaused ? '#F59E0B' : '#7ECCA8'} opacity="0.16" />
          <polygon points={points(right)} fill={isPaused ? '#F59E0B' : '#7ECCA8'} opacity="0.12" />
          <polygon points={points(front)} fill={isPaused ? '#F59E0B' : '#7ECCA8'} opacity="0.14" />
        </>
      ) : null}
      <polygon points={points(top)} fill={sheenFill} opacity={isActive ? '0.5' : '0.58'} />
    </g>
  );
}

function getFixedProcessPlacement(locationId: PlanningProcessLocationId): ProductionWorkbenchProcessPlacement {
  if (locationId.startsWith('tray-')) return { trayCode: locationId.slice('tray-'.length) };
  return { areaId: locationId };
}

const fixedProductionWorkbenchProcessPlacements = Object.fromEntries(
  createFixedPlanningProcesses('0162-01-010101').map((process) => [
    process.id,
    getFixedProcessPlacement(process.locationId),
  ]),
) as Record<string, ProductionWorkbenchProcessPlacement>;

const productionWorkbenchProcessPlacements: Record<string, ProductionWorkbenchProcessPlacement> = {
  ...fixedProductionWorkbenchProcessPlacements,
  'generated-pick-01': { areaId: 'area-main-grinding' },
  'generated-place-01': { areaId: 'area-main-grinding' },
  'generated-place-02': { areaId: 'area-side-grind-1' },
  'generated-clamp-02-01': { areaId: 'area-main-assembly-1' },
  'generated-weld-scan-02-01': { areaId: 'area-main-assembly-1' },
  'generated-weld-02-01': { areaId: 'area-main-assembly-1' },
  'generated-place-03': { areaId: 'area-side-grind-2' },
  'generated-clamp-03-02-01': { areaId: 'area-main-assembly-2' },
  'generated-weld-scan-03-02-01': { areaId: 'area-main-assembly-2' },
  'generated-weld-03-02-01': { areaId: 'area-main-assembly-2' },
  'generated-place-04': { areaId: 'area-main-assembly-2' },
  'generated-clamp-04-03-02-01': { areaId: 'area-main-assembly-2' },
  'generated-weld-scan-04-03-02-01': { areaId: 'area-main-assembly-2' },
  'generated-weld-04-03-02-01': { areaId: 'area-main-assembly-2' },
};

function getNowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function makeWorkpieces(taskId: string, drawingNo: string, workpieceName: string, quantity: number): ProductionWorkpiece[] {
  return Array.from({ length: quantity }, (_, index) => ({
    id: `${taskId}-wp-${index + 1}`,
    name: workpieceName,
    serial: `${drawingNo}-${String(index + 1).padStart(2, '0')}`,
    process: '未开始',
    progress: 0,
    state: 'pending',
    visionSummary: '等待视觉采集',
  }));
}

function getProcessName(processId: string | null | undefined, fallback = '未开始') {
  return processOptions.find((item) => item.id === processId)?.name ?? fallback;
}

function getProcessFromOptions(processId: string | null | undefined, options: ProcessOption[]) {
  return options.find((item) => item.id === processId);
}

function getProcessProgress(processIds: string[], processId: string | null | undefined) {
  if (!processId || processIds.length === 0) return 0;
  const processIndex = processIds.findIndex((item) => item === processId);
  if (processIndex < 0) return 0;
  return Math.round(((processIndex + 1) / processIds.length) * 100);
}

function calculateOverallTaskProgress(workpieces: ProductionWorkpiece[]) {
  if (workpieces.length === 0) return 0;
  return Math.round(workpieces.reduce((total, workpiece) => total + workpiece.progress, 0) / workpieces.length);
}

function getExecutableWorkpieceIndex(task: ProductionTask) {
  const activeIndex = task.workpieces.findIndex((item) => item.state === 'paused' || item.state === 'running');
  if (activeIndex >= 0) return activeIndex;
  return task.workpieces.findIndex((item) => item.state === 'pending');
}

function isPositioningWorkstepName(name: string | undefined) {
  return name === '二次定位/导入工件位置' || name?.includes('精定位/导入工件位置') === true;
}

function getTaskProcessLabel(workpiece: ProductionWorkpiece, processName: string, suffix?: string) {
  return `${formatProductionWorkpieceSerial(workpiece.serial)} · ${processName}${suffix ? ` · ${suffix}` : ''}`;
}

function getDeviceStateClassName(state: DeviceState) {
  if (state === 'connected') return 'bg-emerald-500 ring-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.45)]';
  if (state === 'abnormal') return 'bg-red-500 ring-red-100 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
  return 'bg-slate-300 ring-slate-100';
}

function getDeviceStateLabel(state: DeviceState) {
  if (state === 'connected') return '连接';
  if (state === 'abnormal') return '异常';
  return '未连接';
}

function getProcessRelatedPartIds(process: ProcessOption | undefined) {
  if (!process) return [];
  return productionModelParts
    .filter((part) => process.partObject.includes(part.id))
    .map((part) => part.id);
}

function getProcessRelatedPartIdSet(processId: string | null) {
  const process = processOptions.find((item) => item.id === processId);
  return new Set(getProcessRelatedPartIds(process));
}

function getEnabledTaskProcessIds(taskId: string, processIds: string[], disabledProcessKeys: ReadonlySet<string>) {
  return processIds.filter((processId) => !disabledProcessKeys.has(getProductionProcessKey(taskId, processId)));
}

function getNextEnabledTaskProcessId(
  taskId: string,
  processIds: string[],
  currentProcessId: string | null | undefined,
  disabledProcessKeys: ReadonlySet<string>,
) {
  const currentIndex = currentProcessId ? processIds.indexOf(currentProcessId) : -1;
  const nextStartIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  return processIds
    .slice(nextStartIndex)
    .find((processId) => !disabledProcessKeys.has(getProductionProcessKey(taskId, processId))) ?? null;
}

function getProductionProcessTaskId(processKey: string) {
  return processKey.split(':')[0] ?? processKey;
}

function areSetsEqual<T>(left: Set<T>, right: Set<T>) {
  return left.size === right.size && Array.from(left).every((item) => right.has(item));
}

function ProductionSTLModel({
  part,
  color,
  related,
  dimmed,
}: {
  part: ProductionModelPart;
  color: string;
  related: boolean;
  dimmed: boolean;
}) {
  const loadedGeometry = useLoader(STLLoader, part.modelPath);
  const geometry = useMemo(() => loadedGeometry.clone(), [loadedGeometry]);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 28), [geometry]);
  const opacity = dimmed ? 0.46 : 1;

  useEffect(() => () => {
    geometry.dispose();
    edgesGeometry.dispose();
  }, [edgesGeometry, geometry]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity >= 1}
        />
      </mesh>
      {related && (
        <mesh geometry={geometry} renderOrder={15}>
          <meshBasicMaterial
            color="#FACC15"
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
            side={THREE.DoubleSide}
            transparent
            opacity={0.42}
          />
        </mesh>
      )}
      {(related || dimmed) && (
        <lineSegments geometry={edgesGeometry} renderOrder={16}>
          <lineBasicMaterial
            color={related ? '#FF6900' : '#64748b'}
            transparent
            opacity={related ? 0.9 : 0.35}
            depthTest={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

function ProductionModelScene({ relatedPartIds }: { relatedPartIds: Set<string> }) {
  const isolationActive = relatedPartIds.size > 0;

  return (
    <>
      <color attach="background" args={[productionViewportBackgroundColor]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Bounds fit clip observe margin={1.2}>
        <group>
          {productionModelParts.map((part, index) => {
            const related = relatedPartIds.has(part.id);
            const dimmed = isolationActive && !related;
            return (
              <ProductionSTLModel
                key={part.id}
                part={part}
                color={productionModelColors[index % productionModelColors.length]}
                related={related}
                dimmed={dimmed}
              />
            );
          })}
        </group>
      </Bounds>
      <OrbitControls makeDefault />
    </>
  );
}

function getActiveWorkbenchProcessId(task: ProductionTask | null) {
  if (!task) return null;

  const activeWorkpiece = task.workpieces.find((workpiece) => (
    workpiece.state === 'abnormal'
    || workpiece.state === 'paused'
    || workpiece.state === 'running'
  ));

  return activeWorkpiece?.abnormalProcessId
    ?? activeWorkpiece?.currentProcessId
    ?? task.currentProcessId
    ?? null;
}

function getActiveWorkbenchProcess(task: ProductionTask | null) {
  const hasAbnormalWorkpiece = task?.workpieces.some((workpiece) => workpiece.state === 'abnormal');
  if (!task || (task.state !== 'running' && task.state !== 'paused' && !hasAbnormalWorkpiece)) return null;
  const processId = getActiveWorkbenchProcessId(task);
  if (!processId) return null;
  const process = processOptions.find((item) => item.id === processId);
  const placement = productionWorkbenchProcessPlacements[processId];
  if (!process || !placement) return null;
  return { process, placement, title: `${process.name} ${process.partObject}` };
}

function ProductionViewport({
  task,
  traySlots,
  trayTasks,
  logs,
  logMinimized,
  onToggleLogMinimized,
  controls,
  onStationSelect,
  onTraySelect,
  editingTrayCode,
  onStartTrayCardEdit,
  onCancelTrayCardEdit,
  onSaveTrayCardEdit,
}: {
  task: ProductionTask | null;
  traySlots: TraySlot[];
  trayTasks: TrayTask[];
  logs: LogEntry[];
  logMinimized: boolean;
  onToggleLogMinimized: (value: boolean) => void;
  controls?: ReactNode;
  onStationSelect: (stationId: string) => void;
  onTraySelect: (trayCode: string) => void;
  editingTrayCode: string | null;
  onStartTrayCardEdit: (trayCode: string) => void;
  onCancelTrayCardEdit: () => void;
  onSaveTrayCardEdit: (trayCode: string, payload: ProductionTrayCardEditPayload) => void;
}) {
  const [stationCardVariant] = useProductionStationCardVariant();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportFrame, setViewportFrame] = useState(defaultProductionViewportFrame);
  const activeWorkbenchProcess = getActiveWorkbenchProcess(task);
  const hasAbnormalWorkpiece = Boolean(task?.workpieces.some((workpiece) => workpiece.state === 'abnormal'));
  const displayWorkbenchStatus: WorkbenchStationStatus = !activeWorkbenchProcess
    ? 'idle'
    : hasAbnormalWorkpiece
      ? 'abnormal'
      : task?.state === 'paused'
        ? 'paused'
        : 'running';
  const traySlotByCode = useMemo(() => getTraySlotByCode(traySlots), [traySlots]);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;

    const measureViewport = () => {
      const { width, height } = element.getBoundingClientRect();
      const nextFrame = getProductionViewportFrame(width, height);
      setViewportFrame((previousFrame) => {
        const unchanged = previousFrame.ready === nextFrame.ready
          && Math.abs(previousFrame.left - nextFrame.left) < 0.1
          && Math.abs(previousFrame.top - nextFrame.top) < 0.1
          && Math.abs(previousFrame.scale - nextFrame.scale) < 0.0001;
        return unchanged ? previousFrame : nextFrame;
      });
    };

    measureViewport();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureViewport);
      return () => window.removeEventListener('resize', measureViewport);
    }

    const resizeObserver = new ResizeObserver(measureViewport);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const stationCards = productionWorkbenchAreas.map((area) => {
    const areaActive = activeWorkbenchProcess?.placement.areaId === area.id;
    const stationStatus: WorkbenchStationStatus = areaActive ? displayWorkbenchStatus : activeWorkbenchProcess ? 'idle' : 'default';
    const partName = areaActive ? activeWorkbenchProcess?.process.partObject : undefined;
    const cardWidth = stationCardVariant === 'skew'
      ? productionStationCardSkewWidth
      : productionStationCardHorizontalWidth;
    const cardHeight = getProductionStationCardHeight(stationCardVariant, stationStatus, partName);
    const placement = getProductionStationCardPlacement({
      area,
      variant: stationCardVariant,
    });

    return {
      area,
      areaActive,
      stationStatus,
      partName,
      cardWidth,
      cardHeight,
      cardBottomCenterX: placement.cardBottomCenterX,
      cardBottomCenterY: placement.cardBottomCenterY,
    };
  });
  const trayCardVariant = stationCardVariant;
  const trayCardWidth = trayCardVariant === 'skew' ? productionTrayCardSkewWidth : productionTrayCardHorizontalWidth;
  const trayMaterialOptions: ProductionTrayMaterialOption[] = getWorkpiecePartNames({
    drawingNo: task?.drawingNo ?? '0162-01-010101',
  }).map((value) => ({
    value,
    label: value,
  }));
  const trayCards = agvTrayPositions.map((tray) => {
    const placement = getProductionTrayCardPlacement(tray);
    const slot = traySlotByCode.get(tray.label);
    const runningTask = trayTasks.find((trayTask) => (
      trayTask.state === 'running' && (trayTask.pickup === tray.label || trayTask.dropoff === tray.label)
    ));
    const baseState = getProductionTrayCardState(slot);
    const state = runningTask?.type === '满托任务' && runningTask.pickup === tray.label
      ? 'unloading' as const
      : baseState;
    const inboundTask = runningTask?.dropoff === tray.label ? runningTask : undefined;
    const material = slot?.material === '空' ? inboundTask?.material : slot?.material;
    const quantity = slot?.material === '空' ? inboundTask?.quantity : slot?.quantity;
    const editable = Boolean(material && material !== '空' && (state === 'loaded' || state === 'full'));
    const materialOptions = material && !trayMaterialOptions.some((option) => option.value === material)
      ? [{ value: material, label: '当前' }, ...trayMaterialOptions]
      : trayMaterialOptions;
    return {
      tray,
      state,
      material,
      quantity,
      activity: runningTask ? '等待AGV' : undefined,
      editable,
      materialOptions,
      cardHeight: getProductionTrayCardHeight(trayCardVariant),
      cardBottomCenterX: placement.cardBottomCenterX,
      cardBottomCenterY: placement.cardBottomCenterY,
    };
  });

  const editingTrayCard = trayCards.find((card) => card.tray.label === editingTrayCode);

  const renderTrayCard = (card: (typeof trayCards)[number]) => {
    return (
      <ProductionTrayCard
        variant={trayCardVariant}
        code={card.tray.label}
        state={card.state}
        material={card.material}
        quantity={card.quantity}
        activity={card.activity}
        editable={card.editable}
        onEdit={() => onStartTrayCardEdit(card.tray.label)}
      />
    );
  };

  return (
    <div ref={viewportRef} className="relative h-full min-h-[420px] overflow-hidden bg-ds-bg-viewport">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(255,255,255,0.62),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(244,244,245,0.55),transparent_36%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1180 680" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <filter id="cuboidShadow" x="-80%" y="-80%" width="260%" height="320%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#52525B" floodOpacity="0.15" />
          </filter>
          <filter id="activeCuboidShadow" x="-80%" y="-80%" width="260%" height="330%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#7ECCA8" floodOpacity="0.20" />
          </filter>
          <filter id="pausedCuboidShadow" x="-80%" y="-80%" width="260%" height="330%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#F59E0B" floodOpacity="0.3" />
          </filter>
          <filter id="abnormalCuboidShadow" x="-80%" y="-80%" width="260%" height="330%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#EF4444" floodOpacity="0.22" />
          </filter>
          <linearGradient id="cuboidSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F4F4F5" />
          </linearGradient>
          <linearGradient id="activeCuboidSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#BFE8D8" />
            <stop offset="1" stopColor="#7ECCA8" />
          </linearGradient>
          <linearGradient id="pausedCuboidSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#FDE68A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="abnormalCuboidSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#FECACA" />
            <stop offset="1" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <g transform="translate(78 -52)">
          {productionWorkbenchTrayZoneLabels.map((zone) => {
            const placement = getProductionTrayZoneLabelPlacement(zone);
            return (
              <g key={zone.id} transform={`translate(${placement.x} ${placement.y})`}>
                <g transform={`rotate(${productionWorkbenchTrayZoneLabelAngle}) skewX(-38) scale(1 0.62)`}>
                  <text
                    x="0"
                    y="0"
                    fill="#71717A"
                    fillOpacity="0.66"
                    fontSize="13"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {zone.label}
                  </text>
                </g>
              </g>
            );
          })}
          {productionWorkbenchGroundRects.map((rect) => {
            const points = getProductionWorkbenchGroundRectGeometry(rect);
            const rectHasAbnormal = Boolean(
              activeWorkbenchProcess
              && rect.areaIds.includes(activeWorkbenchProcess.placement.areaId ?? '')
              && displayWorkbenchStatus === 'abnormal',
            );
            const rectHasRunning = Boolean(
              activeWorkbenchProcess
              && rect.areaIds.includes(activeWorkbenchProcess.placement.areaId ?? '')
              && displayWorkbenchStatus !== 'abnormal'
              && (displayWorkbenchStatus === 'running' || displayWorkbenchStatus === 'paused'),
            );
            const rectStatus: ProductionWorkbenchGroundRectStatus = rectHasAbnormal
              ? 'abnormal'
              : rectHasRunning
                ? 'running'
                : 'idle';
            const rectStyle = getProductionWorkbenchGroundRectStyle(rectStatus);
            return (
              <path
                key={rect.id}
                d={getRoundedPolygonPath(points, 8)}
                transform="translate(-12 24)"
                fill={rectStyle.fill}
                fillOpacity={rectStyle.fillOpacity}
                stroke={rectStyle.stroke}
                strokeOpacity={rectStyle.strokeOpacity}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
            );
          })}
          {agvTrayPositions.map((tray) => {
            const traySlot = traySlotByCode.get(tray.label);
            const occupied = isProductionTrayOccupied(traySlot);
            const trayCardState = getProductionTrayCardState(traySlot);
            const trayStatus: WorkbenchStationStatus = occupied ? 'default' : 'idle';
            const placement = getProductionTrayCardPlacement(tray);
            const connectorStroke = trayCardState === 'reserved'
              ? '#F59E0B'
              : trayCardState === 'empty-frame'
                ? '#71717A'
                : occupied
                  ? '#10B981'
                  : '#D4D4D8';
            return (
              <g key={tray.label}>
                <WorkbenchIsometricCuboid area={getProductionTrayCuboidArea(tray)} status={trayStatus} />
                <line x1={placement.connectorX} y1={placement.connectorStartY} x2={placement.connectorX} y2={placement.connectorAnchor.y} stroke={connectorStroke} strokeWidth="1.1" opacity={occupied ? '0.58' : '0.3'} strokeLinecap="round" />
                <circle cx={placement.connectorX} cy={placement.connectorAnchor.y} r="2" fill={connectorStroke} opacity={occupied ? '0.7' : '0.42'} />
              </g>
            );
          })}
          {productionWorkbenchAreas.map((area) => {
            const areaActive = activeWorkbenchProcess?.placement.areaId === area.id;
            const stationStatus: WorkbenchStationStatus = areaActive ? displayWorkbenchStatus : activeWorkbenchProcess ? 'idle' : 'default';
            const stationRunning = stationStatus === 'running';
            const stationPaused = stationStatus === 'paused';
            const stationAbnormal = stationStatus === 'abnormal';
            const stationDefault = stationStatus === 'default';
            const connectorStroke = stationAbnormal ? '#EF4444' : stationPaused ? '#F59E0B' : stationRunning ? '#7ECCA8' : '#A1A1AA';
            const placement = getProductionStationCardPlacement({
              area,
              variant: stationCardVariant,
            });
            return (
              <g key={area.id}>
                <WorkbenchIsometricCuboid area={area} status={stationStatus} />
                <line x1={placement.connectorX} y1={placement.connectorStartY} x2={placement.connectorX} y2={placement.connectorAnchor.y} stroke={connectorStroke} strokeWidth="1.4" opacity={stationStatus === 'idle' ? '0.24' : stationDefault ? '0.5' : '0.72'} strokeLinecap="round" />
                <circle cx={placement.connectorX} cy={placement.connectorAnchor.y} r="2.8" fill={connectorStroke} opacity={stationStatus === 'idle' ? '0.36' : stationDefault ? '0.62' : '0.78'} />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {viewportFrame.ready ? (
          <div
            className="absolute"
            style={{
              left: viewportFrame.left,
              top: viewportFrame.top,
              width: productionViewportBox.width,
              height: productionViewportBox.height,
              transform: `scale(${viewportFrame.scale})`,
              transformOrigin: 'top left',
            }}
          >
            {stationCards.map((card) => (
              <div
                key={card.area.id}
                className="pointer-events-auto absolute"
                style={{
                  left: card.cardBottomCenterX,
                  top: card.cardBottomCenterY,
                  width: 0,
                  height: 0,
                  zIndex: Math.round(card.area.cy),
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: -card.cardWidth / 2,
                    top: -card.cardHeight,
                    width: card.cardWidth,
                    height: card.cardHeight,
                  }}
                >
                  <button
                    type="button"
                    className="absolute appearance-none border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                    style={{ inset: 0 }}
                    aria-label={`查看工位卡片：${card.area.name}`}
                    data-testid={`production-station-card-${card.area.id}`}
                    onClick={() => onStationSelect(card.area.id)}
                  >
                    <ProductionStationCard
                      variant={stationCardVariant}
                      density="viewport"
                      name={card.area.name}
                      status={card.stationStatus}
                      partName={card.partName}
                    />
                  </button>
                </div>
              </div>
            ))}
            {trayCards.map((card) => (
              <div
                key={card.tray.label}
                className="pointer-events-auto absolute"
                style={{
                  left: card.cardBottomCenterX,
                  top: card.cardBottomCenterY,
                  width: 0,
                  height: 0,
                  zIndex: Math.round(card.tray.cy),
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: -trayCardWidth / 2,
                    top: -card.cardHeight,
                    width: trayCardWidth,
                    height: card.cardHeight,
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看托盘工位详情：${card.tray.label}号托盘`}
                  data-testid={`production-tray-card-${card.tray.label}`}
                  onClick={() => onTraySelect(card.tray.label)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    onTraySelect(card.tray.label);
                  }}
                >
                  {renderTrayCard(card)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {controls}

      {editingTrayCard ? (
        <ProductionTrayEditDialog
          open
          code={editingTrayCard.tray.label}
          material={editingTrayCard.material}
          quantity={editingTrayCard.quantity}
          materialOptions={editingTrayCard.materialOptions}
          onClose={onCancelTrayCardEdit}
          onSave={(payload) => onSaveTrayCardEdit(editingTrayCard.tray.label, payload)}
        />
      ) : null}

      <LogPanel logs={logs} minimized={logMinimized} onToggleMinimized={onToggleLogMinimized} />
    </div>
  );
}

function ProductionModelViewport({
  controls,
  logs,
  logMinimized,
  onToggleLogMinimized,
  task,
  selectedProcessId,
  relatedPartIds,
  onDeselectProcess,
}: {
  controls?: ReactNode;
  logs: LogEntry[];
  logMinimized: boolean;
  onToggleLogMinimized: (value: boolean) => void;
  task: ProductionTask | null;
  selectedProcessId: string | null;
  relatedPartIds: Set<string>;
  onDeselectProcess: () => void;
}) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const highlightedPartIds = useMemo(
    () => (selectedPartId ? new Set([selectedPartId]) : relatedPartIds),
    [relatedPartIds, selectedPartId],
  );

  useEffect(() => {
    setSelectedPartId(null);
    setPropertiesCollapsed(false);
  }, [task?.id]);

  const handleSelectPart = (partId: string | null) => {
    setSelectedPartId(partId);
  };

  const clearModelSelection = () => {
    if (selectedPartId) {
      setSelectedPartId(null);
      return;
    }
    if (selectedProcessId) onDeselectProcess();
  };

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-ds-bg-viewport">
      {task ? (
        <Canvas
          shadows
          camera={{ position: [650, 520, 720], fov: 45 }}
          className="absolute inset-0"
          onPointerMissed={() => setSelectedPartId(null)}
        >
          <Suspense fallback={null}>
            <ProductionModelScene relatedPartIds={highlightedPartIds} />
          </Suspense>
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          请选择或新建工单
        </div>
      )}

      {controls}

      {task && (
        <div className="absolute left-3 top-16 z-30 flex h-[calc(100%-15.5rem)] w-[292px] flex-col gap-2">
          <ModelStructureTreeOverlay
            task={task}
            selectedProcessId={selectedProcessId}
            relatedPartIds={relatedPartIds}
            selectedPartId={selectedPartId}
            onSelectPart={handleSelectPart}
            onClearSelection={clearModelSelection}
          />
          <ProductionModelPropertiesOverlay
            selectedPartId={selectedPartId}
            relatedPartIds={relatedPartIds}
            collapsed={propertiesCollapsed}
            onToggleCollapsed={() => setPropertiesCollapsed((current) => !current)}
          />
        </div>
      )}

      <LogPanel logs={logs} minimized={logMinimized} onToggleMinimized={onToggleLogMinimized} />
    </div>
  );
}

function ModelStructureTreeOverlay({
  task,
  selectedProcessId,
  relatedPartIds,
  selectedPartId,
  onSelectPart,
  onClearSelection,
}: {
  task: ProductionTask | null;
  selectedProcessId: string | null;
  relatedPartIds: Set<string>;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  onClearSelection: () => void;
}) {
  const isolationActive = selectedProcessId != null && relatedPartIds.size > 0;
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const assemblyId = task?.drawingNo ?? '0162-01-010101';
  const assemblyCollapsed = collapsedIds.has(assemblyId);
  const childPartsByParentId = useMemo(() => {
    const grouped = new Map<string, ProductionModelPart[]>();
    productionModelParts.forEach((part) => {
      if (!part.parentId) return;
      const children = grouped.get(part.parentId) ?? [];
      children.push(part);
      grouped.set(part.parentId, children);
    });
    return grouped;
  }, []);
  const rootParts = useMemo(() => productionModelParts.filter((part) => !part.parentId), []);
  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const renderPartRow = (part: ProductionModelPart): ReactNode => {
    const selected = selectedPartId === part.id;
    const related = !selectedPartId && relatedPartIds.has(part.id);
    const dimmed = (selectedPartId != null || isolationActive) && !selected && !related;
    const children = childPartsByParentId.get(part.id) ?? [];
    const hasChildren = children.length > 0;
    const collapsed = collapsedIds.has(part.id);
    const paddingLeft = part.level === 0 ? 16 : part.level === 1 ? 44 : 56;

    return (
      <div key={part.id} className="space-y-0.5">
        <div
          className={`group flex h-7 cursor-pointer items-center gap-1 rounded-md bg-white/25 px-1 pr-2 text-xs ring-1 ring-inset ring-white/28 backdrop-blur-xl transition-[background-color,color,box-shadow,opacity] ${
            selected
              ? 'bg-orange-50/76 text-ds-brand-primary-text ring-orange-200/90'
              : related
                ? 'bg-orange-50/36 text-ds-brand-primary-text ring-orange-200/75'
                : 'text-zinc-600 hover:bg-white/58 hover:text-zinc-800 hover:ring-zinc-300/65'
          } ${dimmed ? 'opacity-45' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          role="treeitem"
          aria-selected={selected}
          aria-expanded={hasChildren ? !collapsed : undefined}
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onSelectPart(selected ? null : part.id);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectPart(selected ? null : part.id);
            }
          }}
        >
          <button
            type="button"
            className={`flex size-4 shrink-0 items-center justify-center rounded-sm text-zinc-400 transition-colors ${
              hasChildren ? 'hover:bg-white/45 hover:text-zinc-600' : 'invisible'
            }`}
            title={hasChildren ? (collapsed ? '展开' : '折叠') : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (hasChildren) toggleCollapsed(part.id);
            }}
          >
            {hasChildren ? (
              collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
          <span className="min-w-0 flex-1 truncate">{part.name}</span>
        </div>
        {hasChildren && !collapsed && children.map((child) => renderPartRow(child))}
      </div>
    );
  };

  return (
    <div className="shrink-0">
      <div
        className="py-1.5"
        onClick={onClearSelection}
      >
        <div className="space-y-0.5">
        <div
          className="mb-1 flex h-7 max-w-full items-center gap-1 rounded-md bg-zinc-100/56 px-1 pr-2 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-white/45 backdrop-blur-xl transition-colors hover:bg-zinc-200/58"
          onClick={(event) => event.stopPropagation()}
          role="treeitem"
          aria-expanded={!assemblyCollapsed}
        >
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded-sm text-zinc-400 transition-colors hover:bg-white/45 hover:text-zinc-600"
            title={assemblyCollapsed ? '展开' : '折叠'}
            onClick={(event) => {
              event.stopPropagation();
              toggleCollapsed(assemblyId);
            }}
          >
            {assemblyCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
          <span className="min-w-0 flex-1 truncate">{assemblyId}</span>
        </div>
        {!assemblyCollapsed && rootParts.map((part) => renderPartRow(part))}
        </div>
      </div>
    </div>
  );
}

function ProductionModelPropertiesOverlay({
  selectedPartId,
  relatedPartIds,
  collapsed,
  onToggleCollapsed,
}: {
  selectedPartId: string | null;
  relatedPartIds: Set<string>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [collapsedPartIds, setCollapsedPartIds] = useState<Set<string>>(
    () => new Set(productionModelParts.map((part) => part.id)),
  );

  useEffect(() => {
    if (!selectedPartId) return;
    setCollapsedPartIds((current) => {
      if (!current.has(selectedPartId)) return current;
      const next = new Set(current);
      next.delete(selectedPartId);
      return next;
    });
  }, [selectedPartId]);

  const togglePartCollapsed = (partId: string) => {
    setCollapsedPartIds((current) => {
      const next = new Set(current);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  return (
    <section className={`flex min-h-0 overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 shadow-none backdrop-blur-xl ${collapsed ? 'h-8 flex-none' : 'flex-1'}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">属性参数</span>
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/65 hover:text-slate-600"
            title={collapsed ? '展开属性参数' : '收起属性参数'}
            aria-label={collapsed ? '展开属性参数' : '收起属性参数'}
            aria-expanded={!collapsed}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
        </div>
        {!collapsed && (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-1.5 p-2">
              {productionModelParts.map((part) => {
                const properties = productionModelProperties[part.id];
                const isSelected = selectedPartId === part.id;
                const isRelated = !selectedPartId && relatedPartIds.has(part.id);
                const isPartCollapsed = collapsedPartIds.has(part.id);
                const propertyItems = [
                  ['名称', properties?.modelName ?? part.name],
                  ['材质', properties?.material ?? '未知'],
                  ['重量', properties?.weight ?? '未知'],
                  ['厚度', properties?.thickness ?? '未知'],
                ];

                return (
                  <div
                    key={part.id}
                    className={`overflow-hidden rounded-md ring-1 ring-inset backdrop-blur-xl ${
                      isSelected
                        ? 'bg-orange-50/76 ring-orange-200/90'
                        : isRelated
                          ? 'bg-orange-50/36 ring-orange-200/75'
                          : 'bg-white/25 ring-white/28'
                    }`}
                  >
                    <button
                      type="button"
                      className={`flex h-8 w-full items-center gap-1.5 px-2 text-left transition-colors ${
                        isSelected || isRelated ? 'text-ds-brand-primary-text' : 'text-zinc-600 hover:bg-white/38 hover:text-zinc-800'
                      }`}
                      aria-expanded={!isPartCollapsed}
                      onClick={() => togglePartCollapsed(part.id)}
                    >
                      {isPartCollapsed ? <ChevronRight className="size-3.5 shrink-0" /> : <ChevronDown className="size-3.5 shrink-0" />}
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{part.name}</span>
                      <span className="shrink-0 text-[11px] font-light text-slate-400">{properties?.material ?? '未知'} · {properties?.weight ?? '—'}</span>
                    </button>
                    {!isPartCollapsed && (
                      <div className="border-t border-white/35 bg-white/16 px-2 py-1">
                        {propertyItems.map(([label, value]) => (
                          <div key={label} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2 border-b border-white/30 py-1 last:border-b-0">
                            <span className="!text-[11px] !font-extralight !text-slate-400/70">{label}</span>
                            <span className="truncate text-xs font-normal text-slate-700">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </section>
  );
}

function FloatingWorkspaceControls({
  activeTab,
  trayManagementOpen,
  selectedTask,
  canRun,
  onTabChange,
  onOpenTrayManagement,
  onInitialize,
  onRunOrPause,
  onRequestStop,
}: {
  activeTab: WorkspaceTab;
  trayManagementOpen: boolean;
  selectedTask: ProductionTask | null;
  canRun: boolean;
  onTabChange: (tab: WorkspaceTab) => void;
  onOpenTrayManagement: () => void;
  onInitialize: () => void;
  onRunOrPause: () => void;
  onRequestStop: () => void;
}) {
  const workspaceTabs = [
    { id: 'execution' as const, label: '生产监控' },
    { id: 'model' as const, label: '模型视图' },
    { id: 'vision' as const, label: '视觉监控' },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-40 flex flex-wrap items-start justify-between gap-2">
      <div className="pointer-events-auto flex h-10 items-center gap-1 rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
        {workspaceTabs.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="pointer-events-auto flex h-10 items-center gap-1 rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!selectedTask || selectedTask.state === 'running' || selectedTask.state === 'paused'}
          onClick={onInitialize}
        >
          <RefreshCw className="size-3.5" />
          初始化
        </button>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-medium text-slate-900 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canRun}
          onClick={onRunOrPause}
        >
          {selectedTask?.state === 'running' ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {selectedTask?.state === 'running' ? '暂停' : '执行'}
        </button>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50/80 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!selectedTask || selectedTask.state === 'running'}
          onClick={onRequestStop}
        >
          <Square className="size-3.5" />
          停止
        </button>
      </div>

      <div className="pointer-events-auto flex h-10 items-center rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
        <button
          type="button"
          className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
            trayManagementOpen
              ? 'bg-ds-brand-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
          }`}
          onClick={onOpenTrayManagement}
        >
          <Forklift className="size-3.5" />
          托盘管理
        </button>
      </div>
    </div>
  );
}

function DeviceStatusFooter() {
  return (
    <div className="relative z-40 flex h-9 shrink-0 items-center gap-4 border-t border-zinc-200 bg-white/82 px-4 shadow-ds-footer-up backdrop-blur-md">
      <div className="flex shrink-0 items-center text-xs font-medium text-ds-text-control">
        设备状态
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-center justify-end gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {devices.map((device) => (
            <Tooltip key={device.name} title={`${device.name} · ${getDeviceStateLabel(device.state)}`}>
              <div className="flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/78 px-2.5 text-[11px] text-slate-600 shadow-sm">
                <span className={`size-2 shrink-0 rounded-full ring-2 ${getDeviceStateClassName(device.state)}`} />
                <span className="max-w-[126px] truncate">{device.name}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogPanel({
  logs,
  minimized,
  onToggleMinimized,
}: {
  logs: LogEntry[];
  minimized: boolean;
  onToggleMinimized: (value: boolean) => void;
}) {
  if (minimized) {
    return (
      <button
        type="button"
        className="absolute bottom-3 left-3 right-3 z-30 flex h-9 min-w-0 items-center justify-between overflow-hidden rounded-xl border border-white/65 bg-ds-bg-glass-float px-3 text-xs font-medium text-slate-600 shadow-lg shadow-black/5 backdrop-blur-md transition-colors hover:bg-white/90"
        onClick={() => onToggleMinimized(false)}
      >
        <span>打印日志</span>
        <ChevronUp className="size-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 flex h-[156px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/65 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/55 px-3">
        <span className="text-xs font-medium text-slate-700">打印日志</span>
        <button
          type="button"
          className="rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          onClick={() => onToggleMinimized(true)}
          title="最小化"
        >
          <Minus className="size-3.5" />
        </button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 px-3 py-2 font-mono text-[11px] leading-5 text-slate-600">
          {logs.map((log) => (
            <div key={log.id} className="grid grid-cols-[64px_54px_minmax(0,1fr)] gap-2 whitespace-nowrap">
              <span className="text-slate-400">{log.time}</span>
              <span className={log.level === 'error' ? 'text-red-500' : log.level === 'warning' ? 'text-amber-500' : 'text-emerald-600'}>
                {log.level.toUpperCase()}
              </span>
              <span className="truncate">{log.text}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function NewTaskDialog({
  open,
  drafts,
  selectedDraftId,
  selectedDraftIds,
  onClose,
  onConfirm,
  onDraftsChange,
  onSelectedDraftIdChange,
  onSelectedDraftIdsChange,
  onConfiguredDraftsChange,
  onNextDraftSequence,
  existingWorkOrderNos,
}: {
  open: boolean;
  drafts: NewWorkOrderDraft[];
  selectedDraftId: string | null;
  selectedDraftIds: Set<string>;
  onClose: () => void;
  onConfirm: (payloads: NewWorkOrderPayload[]) => void;
  onDraftsChange: (next: NewWorkOrderDraft[] | ((current: NewWorkOrderDraft[]) => NewWorkOrderDraft[])) => void;
  onSelectedDraftIdChange: (next: string | null) => void;
  onSelectedDraftIdsChange: (next: Set<string> | ((current: Set<string>) => Set<string>)) => void;
  onConfiguredDraftsChange: (drafts: TrayManagedTask[]) => void;
  onNextDraftSequence: () => number;
  existingWorkOrderNos: string[];
}) {
  const [query, setQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [selectedId, setSelectedId] = useState(workpieceLibrary[0].id);
  const [workpieceBound, setWorkpieceBound] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');
  const [draftConfirmed, setDraftConfirmed] = useState(false);
  const [dialogStep, setDialogStep] = useState<'workpiece' | 'tray'>('workpiece');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set(['0162', '0163', '0164']));
  const [expandedWorkpieces, setExpandedWorkpieces] = useState<Set<string>>(() => new Set(workpieceLibrary.map((item) => item.id)));
  const [selectedPreviewProcessId, setSelectedPreviewProcessId] = useState<string | null>(null);
  const [selectedPreviewPartId, setSelectedPreviewPartId] = useState<string | null>(null);
  const [selectedPreviewProcessIds, setSelectedPreviewProcessIds] = useState<Set<string>>(new Set());
  const [disabledPreviewProcessIds, setDisabledPreviewProcessIds] = useState<Set<string>>(new Set());
  const [deletePopoverDraftId, setDeletePopoverDraftId] = useState<string | null>(null);
  const [deletePopoverRect, setDeletePopoverRect] = useState<{ right: number; top: number } | null>(null);
  const deleteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [editingNameDraftId, setEditingNameDraftId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [nameEditError, setNameEditError] = useState<string | null>(null);

  const setDrafts = onDraftsChange;
  const setSelectedDraftId = onSelectedDraftIdChange;
  const setSelectedDraftIds = onSelectedDraftIdsChange;

  const invalidateCurrentDraft = () => {
    setDraftConfirmed(false);
    if (!selectedDraftId) return;
    setSelectedDraftIds((current) => {
      if (!current.has(selectedDraftId)) return current;
      const next = new Set(current);
      next.delete(selectedDraftId);
      return next;
    });
  };

  // 默认名称跟随工件与数量自动生成；用户双击改名后以自定义值为准。
  const getEffectiveWorkOrderNo = (draft: NewWorkOrderDraft) => {
    if (draft.workOrderNoCustomized && draft.workOrderNo.trim()) return draft.workOrderNo;
    const workpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
    const quantity = Number(draft.quantityInput);
    if (workpiece && Number.isFinite(quantity) && quantity > 0) {
      return formatDefaultWorkOrderNo(workpiece.drawingNo, quantity, draft.createdAt);
    }
    // 未配置完整时不回退已持久化的旧自动名，避免换工件后显示过期名称
    return '';
  };

  const snapshotCurrentDraft = (draft: NewWorkOrderDraft): NewWorkOrderDraft => ({
    ...draft,
    confirmed: draftConfirmed,
    workpieceId: workpieceBound ? selectedId : null,
    quantityInput,
    dialogStep,
    selectedPreviewProcessId,
    selectedPreviewPartId,
    selectedPreviewProcessIds: new Set(selectedPreviewProcessIds),
    disabledPreviewProcessIds: new Set(disabledPreviewProcessIds),
  });

  const getDraftsWithCurrentState = () => drafts.map((draft) => (
    draft.id === selectedDraftId ? snapshotCurrentDraft(draft) : draft
  ));

  const handleClose = () => {
    onDraftsChange(getDraftsWithCurrentState());
    setDeletePopoverDraftId(null);
    onClose();
  };

  const loadDraft = (draft: NewWorkOrderDraft) => {
    setSelectedId(draft.workpieceId ?? workpieceLibrary[0].id);
    setWorkpieceBound(Boolean(draft.workpieceId));
    setQuantityInput(draft.quantityInput);
    setDraftConfirmed(draft.confirmed);
    setDialogStep(draft.dialogStep);
    setSelectedPreviewProcessId(draft.selectedPreviewProcessId);
    setSelectedPreviewPartId(draft.selectedPreviewPartId);
    setSelectedPreviewProcessIds(new Set(draft.selectedPreviewProcessIds));
    setDisabledPreviewProcessIds(new Set(draft.disabledPreviewProcessIds));
  };

  useLayoutEffect(() => {
    if (!open) return;
    const activeDraft = selectedDraftId ? drafts.find((draft) => draft.id === selectedDraftId) : null;
    if (activeDraft) {
      loadDraft(activeDraft);
      return;
    }
    if (drafts.length === 0) {
      setSelectedId(workpieceLibrary[0].id);
      setWorkpieceBound(false);
      setQuantityInput('');
      setDraftConfirmed(false);
      setDialogStep('workpiece');
      setSelectedPreviewProcessId(null);
      setSelectedPreviewPartId(null);
      setSelectedPreviewProcessIds(new Set());
      setDisabledPreviewProcessIds(new Set());
    }
  }, [open, selectedDraftId, drafts]);

  useEffect(() => {
    if (!open || !deletePopoverDraftId) {
      setDeletePopoverRect(null);
      return undefined;
    }
    const updateDeletePopoverRect = () => {
      const triggerRect = deleteButtonRefs.current[deletePopoverDraftId]?.getBoundingClientRect();
      if (!triggerRect) return;
      setDeletePopoverRect({
        right: window.innerWidth - triggerRect.right,
        top: triggerRect.bottom + 6,
      });
    };
    updateDeletePopoverRect();
    window.addEventListener('resize', updateDeletePopoverRect);
    window.addEventListener('scroll', updateDeletePopoverRect, true);
    return () => {
      window.removeEventListener('resize', updateDeletePopoverRect);
      window.removeEventListener('scroll', updateDeletePopoverRect, true);
    };
  }, [open, deletePopoverDraftId]);

  const addDraft = () => {
    const currentDrafts = getDraftsWithCurrentState();
    const nextSequence = onNextDraftSequence();
    const draft: NewWorkOrderDraft = {
      id: `new-work-order-${nextSequence}`,
      workOrderNo: '',
      createdAt: Date.now(),
      confirmed: false,
      workpieceId: null,
      quantityInput: '',
      dialogStep: 'workpiece',
      selectedPreviewProcessId: null,
      selectedPreviewPartId: null,
      selectedPreviewProcessIds: new Set(),
      disabledPreviewProcessIds: new Set(),
    };
    setDrafts([...currentDrafts, draft]);
    setSelectedDraftId(draft.id);
    loadDraft(draft);
  };

  const selectDraft = (draftId: string) => {
    if (draftId === selectedDraftId) return;
    const currentDrafts = getDraftsWithCurrentState();
    const nextDraft = currentDrafts.find((draft) => draft.id === draftId);
    if (!nextDraft) return;
    setDrafts(currentDrafts);
    setSelectedDraftId(draftId);
    loadDraft(nextDraft);
  };

  const deleteDraft = (draftId: string) => {
    const currentDrafts = getDraftsWithCurrentState();
    const draftIndex = currentDrafts.findIndex((draft) => draft.id === draftId);
    const nextDrafts = currentDrafts.filter((draft) => draft.id !== draftId);
    setDeletePopoverDraftId(null);
    setDrafts(nextDrafts);
    setSelectedDraftIds((current) => {
      if (!current.has(draftId)) return current;
      const next = new Set(current);
      next.delete(draftId);
      return next;
    });
    if (draftId !== selectedDraftId) return;
    const nextDraft = nextDrafts[Math.min(Math.max(0, draftIndex), nextDrafts.length - 1)];
    setSelectedDraftId(nextDraft?.id ?? null);
    if (nextDraft) loadDraft(nextDraft);
    else {
      setWorkpieceBound(false);
      setDialogStep('workpiece');
      setQuantityInput('');
      setDraftConfirmed(false);
      setSelectedPreviewProcessId(null);
      setSelectedPreviewPartId(null);
      setSelectedPreviewProcessIds(new Set());
      setDisabledPreviewProcessIds(new Set());
    }
  };

  const filteredLibrary = workpieceLibrary.filter((item) =>
    [item.project, item.name, item.drawingNo].join(' ').toLowerCase().includes(query.toLowerCase())
  );
  const selectedWorkpiece = workpieceLibrary.find((item) => item.id === selectedId) ?? workpieceLibrary[0];
  const availableProcesses = processOptions.filter((item) => selectedWorkpiece.processIds.includes(item.id));
  const availableProcessIds = availableProcesses.map((process) => process.id);
  const selectedPreviewProcessIdsArray = availableProcessIds.filter((processId) => selectedPreviewProcessIds.has(processId));
  const selectedPreviewProcessCount = selectedPreviewProcessIdsArray.length;
  const selectedPreviewDisabledProcessCount = selectedPreviewProcessIdsArray.filter((processId) =>
    disabledPreviewProcessIds.has(processId)
  ).length;
  const allPreviewProcessesSelected =
    availableProcessIds.length > 0 && availableProcessIds.every((processId) => selectedPreviewProcessIds.has(processId));
  const previewProcessSelectionIndeterminate = selectedPreviewProcessCount > 0 && !allPreviewProcessesSelected;
  const sidePlateGrindingProcessIds = availableProcesses
    .filter((process) => process.batchGroup === 'side-plate-grind')
    .map((process) => process.id);
  const allSidePlateGrindingDisabled =
    sidePlateGrindingProcessIds.length > 0
    && sidePlateGrindingProcessIds.every((processId) => disabledPreviewProcessIds.has(processId));
  const previewRelatedPartIds = selectedPreviewPartId ? new Set([selectedPreviewPartId]) : getProcessRelatedPartIdSet(selectedPreviewProcessId);
  const filteredWorkpieceIds = filteredLibrary.map((item) => item.id);
  const allFilteredWorkpiecesExpanded =
    filteredWorkpieceIds.length > 0 && filteredWorkpieceIds.every((workpieceId) => expandedWorkpieces.has(workpieceId));
  const quantityValue = Number(quantityInput);
  const hasQuantity = Number.isFinite(quantityValue) && quantityValue > 0;
  const previewQuantity = hasQuantity ? quantityValue : 0;
  const trayAllocations = buildTrayPlanAllocations(selectedWorkpiece, previewQuantity);
  const trayPlanSummary = getTrayPlanSummary(selectedWorkpiece, previewQuantity);
  const quantityAtTrayLimit = hasQuantity && previewQuantity >= trayPlanSummary.maximumQuantity;
  const goToTrayStep = () => {
    if (!selectedDraftId || !workpieceBound) return;
    if (!hasQuantity) {
      setQuantityInput('1');
      invalidateCurrentDraft();
    }
    setSelectedPreviewProcessId(null);
    setSelectedPreviewPartId(null);
    setSelectedPreviewProcessIds(new Set());
    setDialogStep('tray');
  };
  const goToWorkpieceStep = () => {
    setDialogStep('workpiece');
  };

  const displayedDrafts = drafts.map((draft) => {
    const effectiveDraft = draft.id === selectedDraftId ? snapshotCurrentDraft(draft) : draft;
    return { ...effectiveDraft, workOrderNo: getEffectiveWorkOrderNo(effectiveDraft) };
  });
  const startDraftNameEdit = (draft: NewWorkOrderDraft) => {
    setEditingNameDraftId(draft.id);
    setEditingNameValue(draft.workOrderNo);
    setNameEditError(null);
  };
  const cancelDraftNameEdit = () => {
    setEditingNameDraftId(null);
    setEditingNameValue('');
    setNameEditError(null);
  };
  const commitDraftNameEdit = (draft: NewWorkOrderDraft) => {
    if (editingNameDraftId !== draft.id) return;
    const value = editingNameValue.trim();
    if (!value) {
      setNameEditError('工单名称不能为空');
      return;
    }
    const duplicated = displayedDrafts.some((other) => other.id !== draft.id && other.workOrderNo === value)
      || existingWorkOrderNos.includes(value);
    if (duplicated) {
      setNameEditError('工单名称不可重复');
      return;
    }
    setDrafts((current) => current.map((item) => (
      item.id === draft.id ? { ...item, workOrderNo: value, workOrderNoCustomized: true } : item
    )));
    cancelDraftNameEdit();
  };
  const getDraftStatus = (draft: NewWorkOrderDraft) => {
    if (!draft.workpieceId) return { label: '待选择任务', tone: 'text-zinc-400' };
    const draftQuantity = Number(draft.quantityInput);
    if (!Number.isFinite(draftQuantity) || draftQuantity <= 0) return { label: '待设置数量', tone: 'text-amber-600' };
    const draftWorkpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
    if (!draftWorkpiece) return { label: '待选择任务', tone: 'text-zinc-400' };
    if (getTrayPlanSummary(draftWorkpiece, draftQuantity).hasOverflow) return { label: '托盘不足', tone: 'text-red-600' };
    if (draft.confirmed) return { label: '配置完成', tone: 'text-emerald-600' };
    if (draft.dialogStep === 'workpiece') return { label: '待预览配盘', tone: 'text-amber-600' };
    return { label: '待确认', tone: 'text-amber-600' };
  };
  const normalizedDraftQuery = draftQuery.trim().toLowerCase();
  const filteredDisplayedDrafts = normalizedDraftQuery
    ? displayedDrafts.filter((draft) => {
        const workpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
        return [
          draft.workOrderNo,
          workpiece?.drawingNo,
          workpiece?.name,
          getDraftStatus(draft).label,
        ].some((value) => value?.toLowerCase().includes(normalizedDraftQuery));
      })
    : displayedDrafts;
  const isDraftDispatchable = (draft: NewWorkOrderDraft) => {
    if (!draft.confirmed || !draft.workpieceId) return false;
    const draftQuantity = Number(draft.quantityInput);
    if (!Number.isFinite(draftQuantity) || draftQuantity <= 0) return false;
    const draftWorkpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
    return Boolean(draftWorkpiece && !getTrayPlanSummary(draftWorkpiece, draftQuantity).hasOverflow);
  };
  const setDraftSelection = (draftId: string, checked: boolean) => {
    const draft = displayedDrafts.find((item) => item.id === draftId);
    if (!draft || !isDraftDispatchable(draft)) return;
    setSelectedDraftIds((current) => {
      const next = new Set(current);
      if (checked) next.add(draftId);
      else next.delete(draftId);
      return next;
    });
  };
  const dispatchableDrafts = displayedDrafts.filter(isDraftDispatchable);
  const completedDraftCount = dispatchableDrafts.length;
  const selectedDispatchDrafts = dispatchableDrafts.filter((draft) => selectedDraftIds.has(draft.id));
  const allDispatchableDraftsSelected = completedDraftCount > 0 && selectedDispatchDrafts.length === completedDraftCount;
  const dispatchableDraftSelectionIndeterminate = selectedDispatchDrafts.length > 0 && !allDispatchableDraftsSelected;
  const setAllDispatchableDraftSelections = (checked: boolean) => {
    setSelectedDraftIds((current) => {
      const next = new Set(current);
      dispatchableDrafts.forEach((draft) => {
        if (checked) next.add(draft.id);
        else next.delete(draft.id);
      });
      return next;
    });
  };
  const canConfirmDrafts = selectedDispatchDrafts.length > 0;
  const canConfirmCurrentDraft = Boolean(
    selectedDraftId
    && workpieceBound
    && hasQuantity
    && !trayPlanSummary.hasOverflow,
  );
  const displayedDraftSignature = serializeNewWorkOrderDrafts(displayedDrafts);
  const storedDraftSignature = serializeNewWorkOrderDrafts(drafts);
  useEffect(() => {
    if (!open || displayedDraftSignature === storedDraftSignature) return;
    onDraftsChange(displayedDrafts);
  }, [open, displayedDraftSignature, storedDraftSignature, onDraftsChange]);
  useEffect(() => {
    const configuredDrafts = displayedDrafts.flatMap((draft): TrayManagedTask[] => {
      if (!isDraftDispatchable(draft)) return [];
      const workpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
      if (!workpiece) return [];
      return [{
        id: draft.id,
        workOrderNo: draft.workOrderNo,
        name: workpiece.drawingNo,
        drawingNo: workpiece.drawingNo,
        quantity: Number(draft.quantityInput),
      }];
    });
    onConfiguredDraftsChange(configuredDrafts);
  }, [
    drafts,
    selectedDraftId,
    selectedId,
    workpieceBound,
    quantityInput,
    draftConfirmed,
    dialogStep,
    selectedPreviewProcessId,
    selectedPreviewPartId,
    selectedPreviewProcessIds,
    disabledPreviewProcessIds,
    onConfiguredDraftsChange,
  ]);
  const confirmCurrentDraft = () => {
    if (!selectedDraftId || !canConfirmCurrentDraft) return;
    setDrafts((current) => current.map((draft) => (
      draft.id === selectedDraftId
        ? { ...snapshotCurrentDraft(draft), confirmed: true, dialogStep: 'tray' }
        : draft
    )));
    setDraftConfirmed(true);
  };
  const confirmDrafts = () => {
    if (!canConfirmDrafts) return;
    const dispatchedIds = new Set(selectedDispatchDrafts.map((draft) => draft.id));
    const payloads = selectedDispatchDrafts.flatMap((draft): NewWorkOrderPayload[] => {
      const workpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
      const draftQuantity = Number(draft.quantityInput);
      if (!workpiece || !Number.isFinite(draftQuantity) || draftQuantity <= 0) return [];
      return [{
        draftId: draft.id,
        workOrderNo: draft.workOrderNo,
        workpiece,
        quantity: draftQuantity,
        processIds: workpiece.processIds,
        disabledProcessIds: Array.from(draft.disabledPreviewProcessIds).filter((processId) => workpiece.processIds.includes(processId)),
      }];
    });
    const remainingDrafts = displayedDrafts.filter((draft) => !dispatchedIds.has(draft.id));
    setDrafts(remainingDrafts);
    setSelectedDraftIds(new Set());
    if (selectedDraftId && dispatchedIds.has(selectedDraftId)) {
      const nextDraft = remainingDrafts[0];
      setSelectedDraftId(nextDraft?.id ?? null);
      if (nextDraft) {
        loadDraft(nextDraft);
      } else {
        setWorkpieceBound(false);
        setDialogStep('workpiece');
        setQuantityInput('');
        setDraftConfirmed(false);
        setSelectedPreviewProcessId(null);
        setSelectedPreviewPartId(null);
        setSelectedPreviewProcessIds(new Set());
        setDisabledPreviewProcessIds(new Set());
      }
    }
    onConfirm(payloads);
  };
  const toggleProjectExpanded = (project: string) => {
    setExpandedProjects((current) => {
      const next = new Set(current);
      if (next.has(project)) {
        next.delete(project);
      } else {
        next.add(project);
      }
      return next;
    });
  };
  const toggleWorkpieceExpanded = (workpieceId: string) => {
    setExpandedWorkpieces((current) => {
      const next = new Set(current);
      if (next.has(workpieceId)) {
        next.delete(workpieceId);
      } else {
        next.add(workpieceId);
      }
      return next;
    });
  };
  const toggleAllWorkpiecesExpanded = () => {
    setExpandedWorkpieces((current) => {
      const next = new Set(current);
      if (allFilteredWorkpiecesExpanded) {
        filteredWorkpieceIds.forEach((workpieceId) => next.delete(workpieceId));
      } else {
        filteredWorkpieceIds.forEach((workpieceId) => next.add(workpieceId));
      }
      return next;
    });
  };
  const setPreviewProcessesDisabled = (processIds: string[], disabled: boolean) => {
    if (processIds.length === 0) return;
    invalidateCurrentDraft();
    const targetProcessIds = new Set(processIds);
    setDisabledPreviewProcessIds((current) => {
      const next = new Set(current);
      targetProcessIds.forEach((processId) => {
        if (disabled) next.add(processId);
        else next.delete(processId);
      });
      return next;
    });
    if (disabled && selectedPreviewProcessId && targetProcessIds.has(selectedPreviewProcessId)) {
      setSelectedPreviewProcessId(null);
      setSelectedPreviewPartId(null);
    }
  };
  const toggleSidePlateGrindingDisabled = () => {
    setPreviewProcessesDisabled(sidePlateGrindingProcessIds, !allSidePlateGrindingDisabled);
  };
  const togglePreviewProcessSelected = (processId: string) => {
    setSelectedPreviewProcessIds((current) => {
      const next = new Set(current);
      if (next.has(processId)) next.delete(processId);
      else next.add(processId);
      return next;
    });
  };
  const toggleAllPreviewProcessesSelected = () => {
    setSelectedPreviewProcessIds(() => {
      if (allPreviewProcessesSelected) return new Set();
      return new Set(availableProcessIds);
    });
  };
  const togglePreviewProcessDisabled = (processId: string) => {
    setPreviewProcessesDisabled([processId], !disabledPreviewProcessIds.has(processId));
  };
  const toggleSelectedPreviewProcessesDisabled = () => {
    if (selectedPreviewProcessIdsArray.length === 0) return;
    setPreviewProcessesDisabled(selectedPreviewProcessIdsArray, selectedPreviewDisabledProcessCount === 0);
  };
  const completeAllDraftsForDemo = () => {
    const currentDrafts = getDraftsWithCurrentState();
    if (currentDrafts.length === 0) return;
    const nextDrafts = currentDrafts.map((draft, index) => {
      const workpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId)
        ?? workpieceLibrary[index % workpieceLibrary.length];
      const maximumQuantity = Math.max(1, getTrayPlanSummary(workpiece, 1).maximumQuantity);
      const randomQuantity = Math.floor(Math.random() * maximumQuantity) + 1;
      return {
        ...draft,
        confirmed: true,
        workpieceId: workpiece.id,
        quantityInput: String(randomQuantity),
        dialogStep: 'tray' as const,
        selectedPreviewProcessId: null,
        selectedPreviewPartId: null,
        selectedPreviewProcessIds: new Set<string>(),
      };
    });
    setDrafts(nextDrafts);
    const activeDraft = nextDrafts.find((draft) => draft.id === selectedDraftId);
    if (activeDraft) loadDraft(activeDraft);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4">
      <div className="flex h-[860px] w-[calc(100vw-48px)] max-w-[1720px] flex-col overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
        <div className="relative z-10 box-border flex h-[52px] max-h-[52px] min-h-[52px] shrink-0 items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-5 backdrop-blur-[var(--ds-blur-sticky-overlap)]">
          <div className="text-sm font-semibold text-slate-900">新建工单</div>
          <button
            type="button"
            className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={handleClose}
            aria-label="关闭新建工单"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="relative z-[1] flex w-[240px] shrink-0 flex-col border-r border-zinc-200/70 bg-white/80">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200/70 px-3">
              <div
                className="select-none text-xs font-semibold text-slate-700"
                onDoubleClick={completeAllDraftsForDemo}
              >
                工单列表
              </div>
              <div className="flex items-center gap-2">
                <Tooltip title={completedDraftCount > 0 ? (allDispatchableDraftsSelected ? '取消全选配置完成工单' : '全选配置完成工单') : '暂无配置完成工单'}>
                  <span className="inline-flex">
                    <Checkbox
                      size="sm"
                      checked={allDispatchableDraftsSelected}
                      indeterminate={dispatchableDraftSelectionIndeterminate}
                      disabled={completedDraftCount === 0}
                      aria-label="全选配置完成工单"
                      onChange={(event) => setAllDispatchableDraftSelections(event.target.checked)}
                    />
                  </span>
                </Tooltip>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1 bg-ds-brand-primary px-2 text-[11px] font-normal text-white hover:bg-ds-brand-primary-hover"
                  onClick={addDraft}
                >
                  <Plus className="size-3.5" />
                  新建工单
                </Button>
              </div>
            </div>
            <div className="shrink-0 border-b border-zinc-200/70 p-3">
              <div className="flex h-8 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-500">
                <Search className="size-3.5 shrink-0" />
                <input
                  value={draftQuery}
                  onChange={(event) => {
                    setDraftQuery(event.target.value);
                    setDeletePopoverDraftId(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[11px]"
                  placeholder="关键词筛选"
                  aria-label="筛选工单列表"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {displayedDrafts.length === 0 ? (
                <PanelEmptyState label="暂无草稿工单" />
              ) : filteredDisplayedDrafts.length === 0 ? (
                <PanelEmptyState label="暂无匹配工单" />
              ) : (
                <div className="space-y-2">
                  {filteredDisplayedDrafts.map((draft) => {
                    const selected = draft.id === selectedDraftId;
                    const status = getDraftStatus(draft);
                    const draftWorkpiece = workpieceLibrary.find((item) => item.id === draft.workpieceId);
                    const draftQuantity = Number(draft.quantityInput);
                    const draftSelectable = isDraftDispatchable(draft);
                    return (
                      <div
                        key={draft.id}
                        className={`group relative overflow-hidden rounded-md border shadow-sm transition-colors ${
                          selected
                            ? 'border-orange-200 bg-orange-50/70 ring-1 ring-inset ring-orange-100'
                            : 'border-zinc-200/80 bg-white/70 hover:border-zinc-300 hover:bg-white'
                        }`}
                      >
                        <Checkbox
                          size="sm"
                          checked={selectedDraftIds.has(draft.id)}
                          disabled={!draftSelectable}
                          className="absolute left-1.5 top-2.5 z-10 size-4"
                          title={draftSelectable ? '选择下发该工单' : '完成数量与配盘配置后才可下发'}
                          aria-label={`${draftSelectable ? '选择' : '不可选择'}工单 ${draft.workOrderNo}`}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => setDraftSelection(draft.id, event.target.checked)}
                        />
                        <div
                          role="button"
                          tabIndex={0}
                          className="block w-full cursor-pointer px-3 py-2.5 pl-8 pr-8 text-left"
                          onClick={() => selectDraft(draft.id)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return;
                            if (event.key !== 'Enter' && event.key !== ' ') return;
                            event.preventDefault();
                            selectDraft(draft.id);
                          }}
                          aria-pressed={selected}
                          aria-label={`选择工单 ${draft.workOrderNo}`}
                        >
                          {editingNameDraftId === draft.id ? (
                            <div
                              className="relative flex h-4 items-center"
                              onClick={(event) => event.stopPropagation()}
                              onDoubleClick={(event) => event.stopPropagation()}
                            >
                              <input
                                autoFocus
                                value={editingNameValue}
                                onChange={(event) => {
                                  setEditingNameValue(event.target.value);
                                  setNameEditError(null);
                                }}
                                onBlur={() => commitDraftNameEdit(draft)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    commitDraftNameEdit(draft);
                                  } else if (event.key === 'Escape') {
                                    event.preventDefault();
                                    cancelDraftNameEdit();
                                  }
                                }}
                                className="h-4 w-full rounded-sm border border-ds-brand-primary/50 bg-white px-1 font-mono text-[11px] font-medium leading-3 text-zinc-700 outline-none"
                                aria-label="编辑工单名称"
                              />
                              {nameEditError && (
                                <div className="absolute left-0 top-full z-10 mt-0.5 whitespace-nowrap rounded-sm bg-white/95 px-1 text-[10px] font-normal text-red-500 shadow-sm">{nameEditError}</div>
                              )}
                            </div>
                          ) : (
                            <div
                              title="双击修改工单名称"
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                startDraftNameEdit(draft);
                              }}
                            >
                              {draft.workOrderNo ? (
                                <WorkOrderNoText value={draft.workOrderNo} className="font-mono text-[11px] font-medium text-zinc-700" />
                              ) : (
                                <div className="truncate text-[11px] font-normal text-zinc-400">选择装配体与数量后生成</div>
                              )}
                            </div>
                          )}
                          <div className="mt-1.5 flex min-w-0 items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                              {draftWorkpiece?.drawingNo ?? '未选择装配体'}
                            </span>
                            {Number.isFinite(draftQuantity) && draftQuantity > 0 && (
                              <span className="shrink-0 text-[10px] font-medium text-zinc-400">× {draftQuantity}</span>
                            )}
                          </div>
                          <div className={`mt-2 text-[10px] font-medium ${status.tone}`}>{status.label}</div>
                        </div>
                        <Tooltip title="删除工单">
                          <button
                            ref={(element) => {
                              deleteButtonRefs.current[draft.id] = element;
                            }}
                            type="button"
                            className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-sm text-zinc-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 group-focus-within:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeletePopoverDraftId((currentId) => currentId === draft.id ? null : draft.id);
                            }}
                            aria-label={`删除工单 ${draft.workOrderNo}`}
                            aria-expanded={deletePopoverDraftId === draft.id}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </Tooltip>
                        {deletePopoverDraftId === draft.id && deletePopoverRect && typeof document !== 'undefined' && createPortal(
                          <div
                            className="ds-popover-glass-surface fixed z-[1000] w-56 rounded-lg p-3"
                            style={{ right: deletePopoverRect.right, top: deletePopoverRect.top }}
                            role="alertdialog"
                            aria-labelledby={`delete-work-order-title-${draft.id}`}
                            onPointerDown={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                          >
                            <div className="ds-popover-glass-arrow absolute -top-1.5 right-2 size-3 rotate-45 border-l border-t" />
                            <div id={`delete-work-order-title-${draft.id}`} className="text-sm font-medium text-slate-900">
                              确认删除工单？
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeletePopoverDraftId(null);
                                }}
                              >
                                取消
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 bg-red-500 px-2.5 text-xs text-white hover:bg-red-600"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteDraft(draft.id);
                                }}
                              >
                                删除
                              </Button>
                            </div>
                          </div>,
                          document.body,
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {selectedDraftId ? (
            <>
            <div className="flex w-[300px] shrink-0 flex-col border-r border-white/50 bg-ds-bg-glass-modal-sidebar">
              <div className="border-b border-white/45 p-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-500">
                    <Search className="size-3.5" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[11px]"
                      placeholder="输入项目名、工件名、图号"
                    />
                  </div>
                  <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={toggleAllWorkpiecesExpanded}
                    disabled={filteredWorkpieceIds.length === 0}
                    title={allFilteredWorkpiecesExpanded ? '全部折叠' : '全部展开'}
                    aria-label={allFilteredWorkpiecesExpanded ? '全部折叠装配体零件' : '全部展开装配体零件'}
                  >
                    {allFilteredWorkpiecesExpanded ? <ChevronsUp className="size-3.5" /> : <ChevronsDown className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-scroll [scrollbar-gutter:stable]">
                <div className="space-y-2 p-3">
                  {['0162', '0163', '0164'].map((project) => {
                    const items = filteredLibrary.filter((item) => item.project === project);
                    if (items.length === 0) return null;
                    const projectExpanded = expandedProjects.has(project);
                    return (
                      <div key={project} className="space-y-1">
                        <button
                          type="button"
                          className="flex h-7 w-full items-center gap-1.5 rounded-md bg-zinc-200/60 px-2 text-left text-[11px] text-zinc-500 transition-colors hover:bg-zinc-200/80 hover:text-zinc-700"
                          onClick={() => toggleProjectExpanded(project)}
                          aria-expanded={projectExpanded}
                        >
                          <ChevronDown className={`size-3.5 shrink-0 transition-transform ${projectExpanded ? '' : '-rotate-90'}`} />
                          {project}
                        </button>
                        {projectExpanded && items.map((item) => {
                          const selected = workpieceBound && item.id === selectedId;
                          const expanded = expandedWorkpieces.has(item.id);
                          return (
                            <div key={item.id} className="space-y-1">
                              <button
                                type="button"
                                className={`h-7 w-full rounded-md px-2 text-left transition-colors ${
                                  selected ? 'bg-orange-50 text-ds-brand-primary-hover' : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                                }`}
                                onClick={() => {
                                  const workpieceChanged = !workpieceBound || selectedId !== item.id;
                                  setSelectedId(item.id);
                                  setWorkpieceBound(true);
                                  setSelectedPreviewProcessId(null);
                                  setSelectedPreviewPartId(null);
                                  if (workpieceChanged) {
                                    setQuantityInput('');
                                    invalidateCurrentDraft();
                                    setDialogStep('workpiece');
                                    setSelectedPreviewProcessIds(new Set());
                                    setDisabledPreviewProcessIds(new Set());
                                  }
                                  setExpandedWorkpieces((current) => {
                                    if (current.has(item.id)) return current;
                                    const next = new Set(current);
                                    next.add(item.id);
                                    return next;
                                  });
                                }}
                                aria-expanded={expanded}
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <ChevronDown className={`size-3.5 shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
                                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.name}</span>
                                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200/70 px-1.5 text-[10px] font-semibold text-zinc-500">
                                    {item.processIds.length}
                                  </span>
                                </div>
                              </button>
                              {expanded && (
                                <div className="relative space-y-1 pl-7 before:absolute before:bottom-3 before:left-[14px] before:top-0 before:w-px before:bg-zinc-300/70">
                                  {getWorkpiecePartNames(item).map((partName) => {
                                    const partNo = partName.match(/-(\d{2})$/)?.[1] ?? '';
                                    const modelPartId = productionModelParts.find((part) => part.partNo === partNo)?.id ?? null;
                                    const partSelected = selected && modelPartId != null && selectedPreviewPartId === modelPartId;
                                    return (
                                      <button
                                        key={partName}
                                        type="button"
                                        className={`flex h-6 w-full min-w-0 items-center gap-1.5 rounded-md px-2 text-left text-[11px] transition-colors ${
                                          partSelected
                                            ? 'bg-orange-50/70 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100/80'
                                            : selected
                                              ? 'text-orange-500/80 hover:bg-orange-50/45'
                                              : 'text-zinc-400 hover:bg-white/55 hover:text-zinc-600'
                                        }`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          if (!selected) {
                                            setSelectedId(item.id);
                                            setWorkpieceBound(true);
                                            setQuantityInput('');
                                            invalidateCurrentDraft();
                                            setDialogStep('workpiece');
                                            setSelectedPreviewProcessIds(new Set());
                                            setDisabledPreviewProcessIds(new Set());
                                          }
                                          setSelectedPreviewPartId((current) => (modelPartId && current === modelPartId ? null : modelPartId));
                                          setSelectedPreviewProcessId(null);
                                        }}
                                        aria-pressed={partSelected}
                                      >
                                        <span className="relative size-3 shrink-0 before:absolute before:left-[-20px] before:top-1/2 before:h-px before:w-[26px] before:-translate-y-1/2 before:bg-zinc-300/70" />
                                        <span className="truncate">{partName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white/50">
            <div className="min-h-0 flex-1 p-4">
              <div
                    className="relative h-full min-h-0 overflow-hidden rounded-lg border border-white/60 bg-ds-bg-viewport shadow-inner shadow-slate-900/5"
                    onClick={() => {
                      setSelectedPreviewPartId(null);
                      setSelectedPreviewProcessId(null);
                    }}
                  >
                {dialogStep === 'workpiece' ? (
                  workpieceBound ? (
                    <Canvas
                    shadows
                    camera={{ position: [650, 520, 720], fov: 45 }}
                    className="absolute inset-0"
                    >
                      <Suspense fallback={null}>
                        <ProductionModelScene relatedPartIds={previewRelatedPartIds} />
                      </Suspense>
                    </Canvas>
                  ) : (
                    <PanelEmptyState label="从项目管理结构树选择装配体" />
                  )
                ) : (
                  <TrayReferenceStrip
                    allocations={trayAllocations}
                    quantityReady={hasQuantity}
                    showOccupancyStatusTag={false}
                    showAreaLabels={false}
                    showPlanCards={false}
                    fitOverview
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex h-[392px] min-h-0 w-full shrink-0 flex-col border-t border-white/50 bg-ds-bg-glass-modal-sidebar">
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <div className="grid h-full min-h-0 grid-cols-[260px_minmax(0,1fr)] items-stretch gap-3">
                {!workpieceBound ? (
                  <div className="col-span-full h-full min-h-0">
                    <PanelEmptyState label="选择装配体后预览工序任务" />
                  </div>
                ) : (
                  <>
                <div className="ds-parameter-card self-start">
                  <div className="text-left">
                    <div className="text-[11px] text-slate-400">所属项目</div>
                    <div className="mt-1 text-sm font-medium text-slate-700">{selectedWorkpiece.project}</div>
                  </div>
                  <div className="mt-3 text-left">
                    <div className="text-[11px] text-slate-400">当前工件</div>
                    <div className="mt-1 text-sm font-medium text-slate-700">{selectedWorkpiece.name}</div>
                  </div>
                  <div className="mt-4 border-t border-slate-200/70 pt-4">
                    <div className="mb-2 text-xs font-semibold text-slate-700">加工设置</div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-600">侧面打磨</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">贴板侧面打磨任务</div>
                      </div>
                      <Tooltip title={allSidePlateGrindingDisabled ? '启用全部贴板侧面打磨任务' : '禁用全部贴板侧面打磨任务'}>
                        <span className="inline-flex">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className={`h-7 gap-1.5 px-2.5 text-[11px] ${
                              allSidePlateGrindingDisabled
                                ? 'border-zinc-200 bg-zinc-100 text-zinc-500 hover:bg-white hover:text-zinc-700'
                                : 'border-orange-100 bg-orange-50/70 text-ds-brand-primary-text hover:bg-orange-100'
                            }`}
                            onClick={toggleSidePlateGrindingDisabled}
                            disabled={sidePlateGrindingProcessIds.length === 0}
                            aria-pressed={allSidePlateGrindingDisabled}
                          >
                            <Ban className="size-3.5" />
                            {allSidePlateGrindingDisabled ? '启用' : '禁用'}
                          </Button>
                        </span>
                      </Tooltip>
                    </div>
                    <div className="mt-3 text-[11px] font-medium text-slate-600">加工数量</div>
                    <div className="relative mt-1.5">
                      <input
                        value={quantityInput}
                        onChange={(event) => {
                          setQuantityInput(event.target.value);
                          invalidateCurrentDraft();
                        }}
                        placeholder="请输入"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-14 text-left text-xs font-medium text-slate-700 outline-none transition-colors placeholder:text-xs placeholder:text-slate-300 focus:border-orange-300"
                      />
                      <div className="absolute right-1 top-1/2 flex h-6 w-4 -translate-y-1/2 flex-col overflow-hidden rounded border border-slate-200 bg-slate-50 text-slate-400 shadow-[0_1px_1px_rgba(15,23,42,0.04)]">
                        <button
                          type="button"
                          aria-label="增加加工个数"
                          className="flex h-3 items-center justify-center border-b border-slate-200 transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
                          disabled={quantityAtTrayLimit}
                          onClick={(event) => {
                            event.stopPropagation();
                            const numericValue = Number(quantityInput);
                            const nextValue = Number.isFinite(numericValue)
                              ? Math.min(trayPlanSummary.maximumQuantity, numericValue + 1)
                              : 1;
                            setQuantityInput(String(nextValue));
                            invalidateCurrentDraft();
                          }}
                        >
                          <ChevronUp className="size-2.5" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          aria-label="减少加工个数"
                          className="flex h-3 items-center justify-center transition-colors hover:bg-white hover:text-ds-brand-primary-text"
                          onClick={(event) => {
                            event.stopPropagation();
                            const numericValue = Number(quantityInput);
                            const nextValue = Number.isFinite(numericValue) ? Math.max(1, numericValue - 1) : 1;
                            setQuantityInput(String(nextValue));
                            invalidateCurrentDraft();
                          }}
                        >
                          <ChevronDown className="size-2.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                    {hasQuantity && (
                      <div className={`mt-2 flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11px] font-medium leading-4 ${
                        trayPlanSummary.hasOverflow
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : trayPlanSummary.fullTrayCount > 0
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                          {trayPlanSummary.hasOverflow
                            ? `托盘不足：需 ${trayPlanSummary.requiredTrayCount} 个，可用 ${trayPlanSummary.availableTrayCount} 个（09 不参与配盘）`
                            : quantityAtTrayLimit
                              ? `已达到配盘上限：${trayPlanSummary.availableTrayCount} 个托盘均为满盘（5/5）`
                              : trayPlanSummary.fullTrayCount > 0
                              ? `满盘警告：${trayPlanSummary.fullTrayCount} 个托盘已达 5 件`
                              : `已配盘 ${trayPlanSummary.usedTrayCount}/${trayPlanSummary.availableTrayCount} 个托盘`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {dialogStep === 'workpiece' ? (
                  <div className="ds-parameter-card flex h-full min-h-0 flex-col overflow-hidden">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">工序任务预览</div>
                      <div className="flex items-center gap-1.5">
                        <Tooltip title={allPreviewProcessesSelected ? '取消全选工序任务' : '全选工序任务'}>
                          <span>
                            <Checkbox
                              size="sm"
                              checked={allPreviewProcessesSelected}
                              indeterminate={previewProcessSelectionIndeterminate}
                              className="size-3.5 cursor-pointer [&_svg]:size-2.5"
                              onChange={toggleAllPreviewProcessesSelected}
                              aria-label={allPreviewProcessesSelected ? '取消全选工序任务' : '全选工序任务'}
                            />
                          </span>
                        </Tooltip>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                          已选 {selectedPreviewProcessCount}
                        </span>
                        <Tooltip title={selectedPreviewProcessCount === 0 ? '先勾选需要批量处理的工序' : selectedPreviewDisabledProcessCount > 0 ? '启用已勾选工序' : '禁用已勾选工序'}>
                          <span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-1.5 text-[11px] text-slate-500 hover:bg-orange-50 hover:text-ds-brand-primary-text disabled:text-zinc-300"
                              onClick={toggleSelectedPreviewProcessesDisabled}
                              disabled={selectedPreviewProcessCount === 0}
                            >
                              <Ban className="size-3.5" />
                              {selectedPreviewDisabledProcessCount > 0 ? '启用' : '禁用'}
                            </Button>
                          </span>
                        </Tooltip>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                          共 {availableProcesses.length} 道
                        </span>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                      <div className="grid grid-cols-1 gap-2">
                      {availableProcesses.map((process, index) => {
                        const processDisabled = disabledPreviewProcessIds.has(process.id);
                        const processChecked = selectedPreviewProcessIds.has(process.id);
                        const selected = !processDisabled && selectedPreviewProcessId === process.id;
                        return (
                          <div
                            key={process.id}
                            className={`flex h-10 items-center gap-2 rounded-lg border px-2 text-left text-xs transition-colors ${
                              processDisabled
                                ? 'cursor-not-allowed border border-zinc-200 bg-zinc-100/80 text-zinc-400 opacity-75 grayscale shadow-none'
                                : selected
                                ? 'border border-orange-200 bg-orange-50/70 text-ds-brand-primary-text'
                                : processChecked
                                  ? 'border border-orange-100 bg-orange-50/30 text-zinc-700'
                                  : 'border border-zinc-100 bg-zinc-50 text-zinc-600 hover:bg-white hover:text-zinc-800'
                            }`}
                            aria-disabled={processDisabled || undefined}
                          >
                            <Checkbox
                              size="sm"
                              checked={processChecked}
                              className="size-3.5 cursor-pointer [&_svg]:size-2.5"
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => togglePreviewProcessSelected(process.id)}
                              aria-label={`选择${process.name}${process.partObject}`}
                            />
                            <button
                              type="button"
                              disabled={processDisabled}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs disabled:cursor-not-allowed"
                              onClick={() => {
                                setSelectedPreviewPartId(null);
                                setSelectedPreviewProcessId((current) => current === process.id ? null : process.id);
                              }}
                              aria-pressed={selected}
                              aria-disabled={processDisabled || undefined}
                            >
                              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                                processDisabled
                                  ? 'bg-zinc-200 text-zinc-400'
                                  : selected
                                    ? 'bg-orange-100 text-ds-brand-primary-text'
                                    : processChecked
                                      ? 'bg-orange-100/80 text-ds-brand-primary-text'
                                      : 'bg-zinc-200/80 text-zinc-500'
                              }`}>
                                {index + 1}
                              </span>
                              <ProductionProcessTitle process={process} disabled={processDisabled} />
                              {processDisabled && (
                                <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                                  已禁用
                                </span>
                              )}
                            </button>
                            <Tooltip title={processDisabled ? '解除禁用此工序' : '禁用此工序'}>
                              <button
                                type="button"
                                className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded-md transition-colors ${
                                  processDisabled
                                    ? 'bg-white/80 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100 hover:bg-orange-50 hover:text-ds-brand-primary-text'
                                    : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                                }`}
                                onClick={() => togglePreviewProcessDisabled(process.id)}
                                aria-label={processDisabled ? '解除禁用工序' : '禁用工序'}
                                aria-pressed={processDisabled}
                              >
                                <Ban className="size-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ds-parameter-card flex h-full min-h-0 flex-col overflow-hidden">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">托盘卡片</div>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                        已配 {trayPlanSummary.usedTrayCount} 个
                      </span>
                    </div>
                    {hasQuantity ? (
                      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-4 items-start gap-2 overflow-hidden">
                        {trayAllocations.filter((slot) => slot.occupied).map((slot) => (
                          <TrayAllocationCard
                            key={slot.id}
                            slot={slot}
                            quantityReady
                            showState={false}
                            layout="stack"
                            autoHeight
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="min-h-[220px]">
                        <PanelEmptyState label="设置加工数量后预览托盘卡片" />
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
            <div className="flex h-14 shrink-0 items-center justify-end gap-2 bg-ds-bg-glass-modal px-5 shadow-ds-footer-up">
              {dialogStep === 'workpiece' ? (
                <Button
                  size="sm"
                  className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover disabled:opacity-50"
                  disabled={!workpieceBound}
                  onClick={goToTrayStep}
                >
                  下一步：预览配盘
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={goToWorkpieceStep}>返回任务设置</Button>
                  <Tooltip title={draftConfirmed ? '当前工单已确认' : canConfirmCurrentDraft ? '确认当前工单配置' : '请先设置有效数量并完成配盘'}>
                    <span>
                      <Button
                        size="sm"
                        className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover disabled:opacity-50"
                        disabled={!canConfirmCurrentDraft || draftConfirmed}
                        onClick={confirmCurrentDraft}
                      >
                        确认工单
                      </Button>
                    </span>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
          </div>
            </>
          ) : (
            <div className="min-w-0 flex-1 p-4">
              <PanelEmptyState label="点击左侧“新建工单”开始配置" />
            </div>
          )}
        </div>
        <div className="flex h-14 shrink-0 items-center gap-3 bg-ds-bg-glass-modal px-5 shadow-ds-footer-up">
          <div className="min-w-0 flex-1 text-[11px] text-slate-400">
            {selectedDispatchDrafts.length > 0
              ? `已选择 ${selectedDispatchDrafts.length} 张工单，可下发生产`
              : displayedDrafts.length > 0
                ? `共 ${displayedDrafts.length} 张草稿工单，${completedDraftCount} 张配置完成`
              : '新建草稿工单后，再选择装配体与配置数量'}
          </div>
          <Button size="sm" variant="outline" onClick={handleClose}>取消</Button>
          <Tooltip title={canConfirmDrafts ? '下发已勾选的工单' : '请先勾选配置完成的工单'}>
            <span>
              <Button
                size="sm"
                className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover disabled:opacity-50"
                disabled={!canConfirmDrafts}
                onClick={confirmDrafts}
              >
                下发生产
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function VisionMonitorView({
  controls,
  abnormalWorkpiece,
  positioningResult,
  activeFeedId,
  visionDemoTarget,
  onSelectFeed,
}: {
  controls?: ReactNode;
  abnormalWorkpiece: ProductionWorkpiece | null;
  positioningResult: VisionPositionResult | null;
  activeFeedId: string;
  visionDemoTarget: 'abnormal' | 'grab' | 'gantry-grab';
  onSelectFeed: (feedId: string) => void;
}) {
  const activeCameraIndex = Math.max(0, visionFeedOptions.findIndex((feed) => feed.id === activeFeedId));
  const activeFeed = visionFeedOptions[activeCameraIndex] ?? visionFeedOptions[0];
  const abnormalVisionFeedId = abnormalWorkpiece?.abnormalVisionFeedId;
  const pointCloudVisible = Boolean(abnormalWorkpiece || positioningResult);
  const assemblyDemoVisible = pointCloudVisible && activeFeed.exceptionKind === 'transport' && visionDemoTarget === 'abnormal';
  const showFeedBar = Boolean(abnormalWorkpiece || positioningResult?.source === 'scan');

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-ds-bg-viewport">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:48px_48px]" />
      {pointCloudVisible ? (
        <>
          <VisionPointCloud
            sourceUrl={`${ASSET_BASE}pointclouds/ori-pcc-in-world-sampled.bin`}
            cameraIndex={activeCameraIndex}
            assemblyDemoVisible={assemblyDemoVisible}
            className="z-[1]"
          />
          <div className="pointer-events-none absolute inset-8 z-[2] rounded-[32px] border border-zinc-400/35" />
          <div className="pointer-events-none absolute inset-x-12 top-1/2 z-[2] h-px bg-zinc-400/35" />
          <div className="pointer-events-none absolute inset-y-12 left-1/2 z-[2] w-px bg-zinc-400/35" />

        </>
      ) : (
        <div className="absolute inset-8 z-[1]">
          <PanelEmptyState
            icon={Camera}
            label="当前无视觉内容"
            className="border-slate-300/70 bg-white/15"
          />
        </div>
      )}

      {showFeedBar && (
        <div className="absolute inset-x-4 bottom-4 z-20 flex justify-center">
          <VisionFeedBar
            activeFeedId={activeFeed?.id ?? activeFeedId}
            abnormalFeedId={abnormalVisionFeedId}
            allAbnormal={Boolean(abnormalWorkpiece)}
            onSelect={(feedId) => {
              onSelectFeed(feedId);
            }}
            className="max-w-full"
          />
        </div>
      )}

      {controls}
    </div>
  );
}

type ProductionExecutionLeftPanel = 'v1' | 'v2';
type ProductionExecutionRightPanel = 'single-step' | 'task-status';
type ProductionDetailTarget =
  | { kind: 'station'; stationId: string }
  | { kind: 'tray'; trayCode: string };

type PositioningTarget = {
  key: string;
  taskId: string;
  taskLabel: string;
  workpieceId: string;
  workpieceLabel: string;
  stationId: string;
  stationLabel: string;
  processId: string;
  workstepIndex: number;
};

export function ProductionExecutionPage({
  leftPanel = 'v2',
  rightPanel = 'single-step',
}: {
  leftPanel?: ProductionExecutionLeftPanel;
  rightPanel?: ProductionExecutionRightPanel;
} = {}) {
  const { contextHolder, notifyException } = useGlobalAlertHolder();
  const activeProcessOptions = leftPanel === 'v1' ? beimei010101LegacyProcessOptions : processOptions;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('execution');
  const [tasks, setTasks] = useState<ProductionTask[]>(() => leftPanel === 'v1' ? initialLegacyTasks : initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => (
    leftPanel === 'v1' ? initialLegacyTasks[0]?.id ?? null : initialTasks[0]?.id ?? null
  ));
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<ProductionDebugExecutionMode>('auto');
  const [activeExecutionMode, setActiveExecutionMode] = useState<ProductionDebugExecutionMode | null>(null);
  const [activeExecutionStationId, setActiveExecutionStationId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<ProductionDetailTarget>(() => ({
    kind: 'station',
    stationId: productionWorkbenchAreas[0]?.id ?? '',
  }));
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<NewWorkOrderDraft[]>([]);
  const [pendingSelectedDraftId, setPendingSelectedDraftId] = useState<string | null>(null);
  const [pendingSelectedDraftIds, setPendingSelectedDraftIds] = useState<Set<string>>(new Set());
  const [pendingWorkOrders, setPendingWorkOrders] = useState<TrayManagedTask[]>([]);
  const [trayManagementOpen, setTrayManagementOpen] = useState(() => (
    decodeURI(window.location.pathname) === '/生产执行/理料区视图'
  ));
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [workOrderDeleteTargetId, setWorkOrderDeleteTargetId] = useState<string | null>(null);
  const [workpieceDeleteTarget, setWorkpieceDeleteTarget] = useState<{ taskId: string; workpieceId: string } | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [disabledProcessKeys, setDisabledProcessKeys] = useState<Set<string>>(new Set());
  const [suppressedProcessKeys, setSuppressedProcessKeys] = useState<Set<string>>(new Set());
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [taskBatchMode, setTaskBatchMode] = useState(false);
  const [taskFilterOpen, setTaskFilterOpen] = useState(false);
  const [taskFilterKinds, setTaskFilterKinds] = useState<ProductionTaskFilterKind[]>([]);
  const [taskFilterValues, setTaskFilterValues] = useState<Partial<Record<ProductionTaskFilterKind, string[]>>>({});
  const [traySlots, setTraySlots] = useState<TraySlot[]>(initialTraySlots);
  const [trayTasks, setTrayTasks] = useState<TrayTask[]>(initialTrayTasks);
  const [editingTrayCode, setEditingTrayCode] = useState<string | null>(null);
  const [logMinimized, setLogMinimized] = useState(true);
  const [visionCalibrationOpen, setVisionCalibrationOpen] = useState(false);
  const [positioningDialogTarget, setPositioningDialogTarget] = useState<PositioningTarget | null>(null);
  const [positioningDialogLocateState, setPositioningDialogLocateState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [positioningDialogImportStatus, setPositioningDialogImportStatus] = useState<PositioningDialogImportStatus>('idle');
  const [positioningResults, setPositioningResults] = useState<Record<string, VisionPositionResult>>({});
  const [activePositioningResultKey, setActivePositioningResultKey] = useState<string | null>(null);
  const positioningImportAttemptsRef = useRef<Record<string, number>>({});
  const positioningLocateTimerRef = useRef<number | null>(null);
  const positioningImportTimerRef = useRef<number | null>(null);
  const [activeVisionFeedId, setActiveVisionFeedId] = useState('weld-1');
  const [visionDemoTarget, setVisionDemoTarget] = useState<'abnormal' | 'grab' | 'gantry-grab'>('abnormal');
  const [visionGrabTaskLabel, setVisionGrabTaskLabel] = useState('');
  const [visionGrabWorkpieceCode, setVisionGrabWorkpieceCode] = useState('');
  const draftSequenceRef = useRef(tasks.length);
  const logisticsDemoTimerRef = useRef<number | null>(null);
  const logisticsDemoEditingRef = useRef(false);
  const logisticsDemoDelayUntilRef = useRef(0);
  const completedWorkpieceIdsRef = useRef<Set<string>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'log-1', level: 'info', time: '08:30:12', text: '生产执行工作台初始化完成' },
    { id: 'log-2', level: 'info', time: '08:31:04', text: '已加载设备状态轮询配置' },
    { id: 'log-3', level: 'warning', time: '08:32:18', text: '搬运机器人2暂未连接，当前任务可先执行单线演示' },
  ]);

  useEffect(() => () => {
    if (logisticsDemoTimerRef.current !== null) window.clearTimeout(logisticsDemoTimerRef.current);
    if (positioningLocateTimerRef.current !== null) window.clearTimeout(positioningLocateTimerRef.current);
    if (positioningImportTimerRef.current !== null) window.clearTimeout(positioningImportTimerRef.current);
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedTaskDisabledProcessIds = useMemo(() => {
    if (!selectedTask) return new Set<string>();
    return new Set(
      selectedTask.processIds.filter((processId) =>
        disabledProcessKeys.has(getProductionProcessKey(selectedTask.id, processId))
      )
    );
  }, [selectedTask, disabledProcessKeys]);
  const debugStations = useMemo<ProductionDebugStation[]>(() => {
    const activeWorkpiece = selectedTask?.workpieces.find((workpiece) => (
      workpiece.state === 'abnormal'
      || workpiece.state === 'paused'
      || workpiece.state === 'running'
    )) ?? null;
    const activeProcessId = activeWorkpiece?.abnormalProcessId
      ?? activeWorkpiece?.currentProcessId
      ?? selectedTask?.currentProcessId
      ?? null;
    const placement = activeProcessId ? productionWorkbenchProcessPlacements[activeProcessId] : undefined;
    const process = getProcessFromOptions(activeProcessId, activeProcessOptions);
    const activeStatus: ProductionDebugStation['status'] = activeWorkpiece?.state === 'abnormal'
      ? 'abnormal'
      : selectedTask?.state === 'paused' || activeWorkpiece?.state === 'paused'
        ? 'paused'
        : selectedTask?.state === 'running' && activeWorkpiece?.state === 'running'
          ? 'running'
          : 'idle';

    return productionWorkbenchAreas.map((area) => {
      const active = Boolean(process && placement?.areaId === area.id);
      return {
        id: area.id,
        name: area.name,
        status: active ? activeStatus : 'idle',
        processName: active ? process?.name : undefined,
        workpieceSerial: active ? activeWorkpiece?.serial : undefined,
      };
    });
  }, [activeProcessOptions, selectedTask]);
  const selectedDebugStationSnapshot = useMemo<ProductionDebugStationSnapshot | null>(() => {
    if (detailTarget.kind !== 'station') return null;
    const station = productionWorkbenchAreas.find((area) => area.id === detailTarget.stationId);
    if (!station) return null;

    const activeWorkpiece = selectedTask?.workpieces.find((workpiece) => (
      workpiece.state === 'abnormal'
      || workpiece.state === 'paused'
      || workpiece.state === 'running'
    )) ?? null;
    const activeProcessId = activeWorkpiece?.abnormalProcessId
      ?? activeWorkpiece?.currentProcessId
      ?? selectedTask?.currentProcessId
      ?? null;
    const placement = activeProcessId ? productionWorkbenchProcessPlacements[activeProcessId] : undefined;
    const taskProcesses = selectedTask?.processIds
      .map((processId) => getProcessFromOptions(processId, activeProcessOptions))
      .filter((process): process is ProcessOption => Boolean(process)) ?? [];
    const process = getProcessFromOptions(activeProcessId, activeProcessOptions);
    const demoProcess = getProductionStationDemoProcess(station.id);
    const composite = getProductionCompositeStation(station.id);
    const workpieceOrder = activeWorkpiece && selectedTask
      ? selectedTask.workpieces.indexOf(activeWorkpiece) + 1
      : null;
    // 空闲工位的工步演示使用装配体级工件标签，与生产任务中的显示格式保持一致
    const demoWorkpieceLabel = `${selectedTask?.drawingNo ?? '0162-01-010101'}(1)`;

    if (composite) {
      const workstepNames = getProductionCompositeWorkstepNames(composite, taskProcesses);
      const workstepGroups = getProductionCompositeWorkstepGroups(composite, taskProcesses);
      const location = findProductionCompositeWorkstepLocation(composite, taskProcesses, activeProcessId);
      const stationMatches = Boolean(location);
      const localWorkstepIndex = location
        ? location.aliasLocalWorkstepIndex
          ?? Math.min(Math.max(activeWorkpiece?.currentStepIndex ?? 0, 0), Math.max(0, location.workstepNames.length - 1))
        : 0;
      const currentWorkstepIndex = location ? location.startIndex + localWorkstepIndex : 0;

      return {
        stationId: station.id,
        stationName: composite.name,
        taskName: stationMatches && selectedTask ? selectedTask.name : null,
        taskState: stationMatches ? selectedTask?.state ?? null : null,
        workpieceSerial: stationMatches ? activeWorkpiece?.serial ?? null : null,
        workpieceOrder: stationMatches ? workpieceOrder : null,
        demoWorkpieceLabel: stationMatches ? null : demoWorkpieceLabel,
        workpieceState: stationMatches ? activeWorkpiece?.state ?? null : null,
        workpieceProgress: stationMatches ? activeWorkpiece?.progress ?? null : null,
        process: stationMatches ? process ?? null : null,
        partName: stationMatches ? process?.partObject ?? null : null,
        quantity: stationMatches ? selectedTask?.quantity ?? 0 : 0,
        workstepNames,
        workstepGroups,
        currentWorkstepIndex,
        compositeStation: {
          id: composite.id,
          name: composite.name,
          stations: composite.stationIds.map((stationId) => ({
            stationId,
            stationName: productionWorkbenchAreas.find((area) => area.id === stationId)?.name ?? stationId,
          })),
          activeStationId: station.id,
        },
      };
    }

    const stationMatches = placement?.areaId === station.id;
    const workstepNames = getProductionStationWorkstepNames(
      stationMatches ? process : demoProcess,
      taskProcesses,
    );
    const workstepGroups = getProductionStationWorkstepGroups(
      stationMatches ? process : demoProcess,
      taskProcesses,
    );
    const currentWorkstepIndex = workstepNames.length > 0
      ? Math.min(Math.max(activeWorkpiece?.currentStepIndex ?? 0, 0), workstepNames.length - 1)
      : 0;

    return {
      stationId: station.id,
      stationName: station.name,
      taskName: stationMatches && selectedTask ? selectedTask.name : null,
      taskState: stationMatches ? selectedTask?.state ?? null : null,
      workpieceSerial: stationMatches ? activeWorkpiece?.serial ?? null : null,
      workpieceOrder: stationMatches ? workpieceOrder : null,
      demoWorkpieceLabel: stationMatches ? null : demoWorkpieceLabel,
      workpieceState: stationMatches ? activeWorkpiece?.state ?? null : null,
      workpieceProgress: stationMatches ? activeWorkpiece?.progress ?? null : null,
      process: stationMatches ? process ?? null : null,
      partName: stationMatches ? process?.partObject ?? null : null,
      quantity: stationMatches ? selectedTask?.quantity ?? 0 : 0,
      workstepNames,
      workstepGroups,
      currentWorkstepIndex,
    };
  }, [activeProcessOptions, detailTarget, selectedTask]);

  const getPositioningTargetForIndex = (workstepIndex: number): PositioningTarget | null => {
    const snapshot = selectedDebugStationSnapshot;
    if (!snapshot || detailTarget.kind !== 'station') return null;
    const stationEligible = snapshot.stationId === 'area-main-grinding' || Boolean(snapshot.compositeStation);
    if (!stationEligible) return null;
    const selectedWorkpiece = selectedTask
      ? selectedTask.workpieces.find((workpiece) => workpiece.state === 'abnormal' || workpiece.state === 'paused' || workpiece.state === 'running')
        ?? selectedTask.workpieces.find((workpiece) => workpiece.state === 'pending')
      : null;
    let processId = snapshot.process?.id ?? getProductionStationDemoProcess(snapshot.stationId)?.id ?? '';
    let localIndex = workstepIndex;
    if (snapshot.compositeStation) {
      // The snapshot shape is intentionally presentation-only; resolve worksteps
      // against the domain composite so segmentProcessIds is always available.
      const composite = getProductionCompositeStation(snapshot.stationId);
      if (!composite) return null;
      const taskProcesses = selectedTask?.processIds
        .map((processIdValue) => getProcessFromOptions(processIdValue, activeProcessOptions))
        .filter((process): process is ProcessOption => Boolean(process)) ?? [];
      const target = resolveProductionCompositeWorkstepIndex(composite, taskProcesses, workstepIndex);
      if (!target) return null;
      processId = target.processId;
      localIndex = target.localWorkstepIndex;
    }
    const process = getProcessFromOptions(processId, activeProcessOptions)
      ?? getProductionStationDemoProcess(snapshot.stationId);
    const stepNames = snapshot.compositeStation
      ? (() => {
          const composite = getProductionCompositeStation(snapshot.stationId);
          if (!composite) return [];
          const taskProcesses = selectedTask?.processIds
            .map((processIdValue) => getProcessFromOptions(processIdValue, activeProcessOptions))
            .filter((item): item is ProcessOption => Boolean(item)) ?? [];
          const segment = getProductionCompositeWorkstepSegments(composite, taskProcesses).find((item) => item.processId === processId);
          return segment?.workstepNames ?? [];
        })()
      : getProductionStationWorkstepNames(process, selectedTask?.processIds.map((processIdValue) => getProcessFromOptions(processIdValue, activeProcessOptions)).filter((item): item is ProcessOption => Boolean(item)) ?? []);
    if (!isPositioningWorkstepName(stepNames[localIndex])) return null;
    const taskId = selectedTask?.id ?? `demo-${snapshot.stationId}`;
    const workpieceId = selectedWorkpiece?.id ?? `${taskId}-workpiece`;
    const workpieceLabel = selectedWorkpiece ? formatProductionWorkpieceSerial(selectedWorkpiece.serial) : '演示工件';
    const resultStationId = snapshot.compositeStation?.id ?? snapshot.stationId;
    return {
      key: `${taskId}:${workpieceId}:${resultStationId}:${processId}:${localIndex}`,
      taskId,
      taskLabel: snapshot.taskName ?? `${snapshot.stationName}演示任务`,
      workpieceId,
      workpieceLabel,
      stationId: resultStationId,
      stationLabel: snapshot.stationName,
      processId,
      workstepIndex: localIndex,
    };
  };

  const positioningResultKeysByWorkstep = useMemo(() => {
    if (!selectedDebugStationSnapshot) return {};
    return Object.fromEntries(
      selectedDebugStationSnapshot.workstepNames.map((_, index) => {
        const target = getPositioningTargetForIndex(index);
        return [index, target && positioningResults[target.key] ? target.key : null];
      }).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ) as Record<number, string>;
  }, [activeProcessOptions, detailTarget, positioningResults, selectedDebugStationSnapshot, selectedTask]);

  const activePositioningResult = activePositioningResultKey ? positioningResults[activePositioningResultKey] ?? null : null;

  useEffect(() => {
    // Changing task, workpiece context, or station invalidates the currently viewed result.
    setActivePositioningResultKey(null);
    setPositioningDialogTarget(null);
    setPositioningDialogLocateState('idle');
    setPositioningDialogImportStatus('idle');
  }, [detailTarget, selectedTaskId]);

  const selectedTrayStationSnapshot = useMemo<ProductionTrayStationSnapshot | null>(() => {
    if (detailTarget.kind !== 'tray') return null;
    const slot = traySlots.find((item) => item.id.padStart(2, '0') === detailTarget.trayCode);
    if (!slot) return null;
    const runningTask = trayTasks.find((task) => (
      task.state === 'running' && (task.pickup === detailTarget.trayCode || task.dropoff === detailTarget.trayCode)
    ));
    const material = slot.material === '空' && runningTask?.dropoff === detailTarget.trayCode
      ? runningTask.material
      : slot.material;
    const quantity = slot.material === '空' && runningTask?.dropoff === detailTarget.trayCode
      ? runningTask.quantity
      : slot.quantity;
    const stateLabel = runningTask?.type === '满托任务' && runningTask.pickup === detailTarget.trayCode
      ? '已预约'
      : slot.state === 'reserved'
        ? '已预约'
        : slot.state === 'empty-frame' || slot.state === 'moving'
          ? '空托'
          : slot.state === 'loaded' || slot.state === 'full'
            ? '已占用'
            : '空闲';
    return {
      trayCode: detailTarget.trayCode,
      stationName: `${detailTarget.trayCode}号托盘工位`,
      stateLabel,
      material: material && material !== '空' ? material : null,
      quantity,
    };
  }, [detailTarget, traySlots, trayTasks]);
  const visionAbnormalWorkpiece = selectedTask?.workpieces.find(
    (workpiece) =>
      workpiece.serial === mockedAbnormalWorkpieceSerial
      && workpiece.state === 'abnormal'
      && Boolean(workpiece.abnormalProcessId),
  ) ?? null;
  const visionAbnormalProcess = activeProcessOptions.find((item) => item.id === visionAbnormalWorkpiece?.abnormalProcessId);
  const visionExceptionDeviceLabel = '焊接机器人1视觉';
  const visionAbnormalTaskName = visionAbnormalProcess
    ? `${formatProductionWorkpieceSerial(mockedAbnormalWorkpieceSerial)} · ${visionAbnormalProcess.name}${formatCombinedPartObject(visionAbnormalProcess.partObject)}`
    : selectedTask?.name ?? '生产任务';
  const visionNotificationWorkpiece = selectedTask?.workpieces.find((workpiece) => workpiece.state === 'running')
    ?? selectedTask?.workpieces[0]
    ?? null;
  const visionNotificationSerial = formatProductionWorkpieceSerial(visionNotificationWorkpiece?.serial ?? mockedAbnormalWorkpieceSerial);
  const visionAbnormalProcessIndex = selectedTask?.processIds.findIndex((processId) => processId === visionAbnormalWorkpiece?.abnormalProcessId) ?? -1;
  const visionNotificationDescription = visionAbnormalProcess && visionAbnormalProcessIndex >= 0
    ? `${visionNotificationSerial} 第 ${String(visionAbnormalProcessIndex + 1).padStart(2, '0')} 工序${visionAbnormalProcess.name}${visionExceptionDeviceLabel}异常，等待人工确认`
    : `${visionNotificationSerial} ${(visionAbnormalWorkpiece?.visionSummary ?? '装配视觉异常，等待人工确认').replace(/^(?:WP|工件)-\d+\s+/, '')}`;
  useEffect(() => {
    if (!visionAbnormalWorkpiece) {
      setVisionCalibrationOpen(false);
      setVisionDemoTarget('abnormal');
      setVisionGrabTaskLabel('');
      setVisionGrabWorkpieceCode('');
      return;
    }

    notifyException({
      key: `pe-vision-abnormal:${visionAbnormalWorkpiece.id}:${visionAbnormalWorkpiece.abnormalProcessId}`,
      title: '生产执行异常',
      description: visionNotificationDescription,
      actionText: '查看详情',
      duration: 0,
      onAction: () => {
        setActiveTab('vision');
        setVisionCalibrationOpen(true);
      },
    });

    setActiveVisionFeedId(visionAbnormalWorkpiece.abnormalVisionFeedId ?? 'weld-1');
    setVisionDemoTarget('abnormal');
    setVisionGrabTaskLabel('');
    setVisionGrabWorkpieceCode('');
  }, [visionAbnormalWorkpiece?.id, visionAbnormalWorkpiece?.abnormalProcessId, visionAbnormalWorkpiece?.abnormalVisionFeedId]);

  useEffect(() => {
    if (activeTab === 'vision' && visionAbnormalWorkpiece) {
      setVisionCalibrationOpen(true);
    }
  }, [activeTab, visionAbnormalWorkpiece?.id]);
  const relatedPartIds = new Set(getProcessRelatedPartIds(activeProcessOptions.find((item) => item.id === selectedProcessId)));
  const taskFilterActive = taskFilterKinds.length > 0;
  const displayableProcessCount = useMemo(
    () => tasks.reduce(
      (total, task) => total + task.processIds.filter(
        (processId) => !suppressedProcessKeys.has(getProductionProcessKey(task.id, processId)),
      ).length,
      0,
    ),
    [tasks, suppressedProcessKeys],
  );
  const taskFilterValueOptions = useMemo<Record<ProductionTaskFilterKind, SelectOption[]>>(
    () => {
      const availableProcesses = tasks
        .flatMap((task) => task.processIds.filter(
          (processId) => !suppressedProcessKeys.has(getProductionProcessKey(task.id, processId)),
        ))
        .map((processId) => activeProcessOptions.find((item) => item.id === processId))
        .filter((process): process is ProcessOption => Boolean(process));
      return {
        state: productionProcessFilterStateOptions.filter((option) =>
          tasks.some((task) =>
            task.processIds.some((processId) =>
              !suppressedProcessKeys.has(getProductionProcessKey(task.id, processId)) &&
              getProductionProcessFilterState(
                task,
                processId,
                disabledProcessKeys.has(getProductionProcessKey(task.id, processId)),
              ) === option.id
            )
          )
        ),
        workpiece: Array.from(new Map(
          availableProcesses
            .flatMap((process) => getProcessPartNames(process))
            .map((partName) => [partName, { id: partName, name: partName }])
        ).values()),
        process: Array.from(new Map(
          availableProcesses.map((process) => [process.name, { id: process.name, name: process.name }])
        ).values()),
      };
    },
    [tasks, disabledProcessKeys, suppressedProcessKeys, activeProcessOptions],
  );
  const visibleProcessIdsByTask = useMemo<Record<string, string[]>>(() => {
    const nextVisibleProcessIdsByTask: Record<string, string[]> = {};
    tasks.forEach((task) => {
      nextVisibleProcessIdsByTask[task.id] = task.processIds.filter((processId) => {
        if (suppressedProcessKeys.has(getProductionProcessKey(task.id, processId))) return false;
        if (!taskFilterActive) return true;
        const process = activeProcessOptions.find((item) => item.id === processId);
        if (!process) return false;
        return taskFilterKinds.every((kind) => {
          const values = taskFilterValues[kind] ?? [];
          if (values.length === 0) return false;
          if (kind === 'workpiece') {
            const partNames = getProcessPartNames(process);
            return values.some((value) => partNames.includes(value));
          }
          if (kind === 'process') return values.includes(process.name);
          const processState = getProductionProcessFilterState(
            task,
            processId,
            disabledProcessKeys.has(getProductionProcessKey(task.id, processId)),
          );
          return values.includes(processState);
        });
      });
    });
    return nextVisibleProcessIdsByTask;
  }, [tasks, taskFilterActive, taskFilterKinds, taskFilterValues, disabledProcessKeys, suppressedProcessKeys, activeProcessOptions]);
  const filteredTasks = tasks.filter((task) => (visibleProcessIdsByTask[task.id]?.length ?? 0) > 0);
  const canCreateTask = true;
  const visibleProcessKeys = filteredTasks.flatMap((task) =>
    (visibleProcessIdsByTask[task.id] ?? []).map((processId) => getProductionProcessKey(task.id, processId))
  );
  const visibleSelectableProcessKeys = visibleProcessKeys;
  const allVisibleTasksSelected =
    visibleSelectableProcessKeys.length > 0 && visibleSelectableProcessKeys.every((processKey) => selectedTaskIds.has(processKey));

  useEffect(() => {
    const validTaskIds = new Set(tasks.map((task) => task.id));
    const validProcessKeys = new Set(tasks.flatMap((task) =>
      task.processIds.map((processId) => getProductionProcessKey(task.id, processId))
    ));
    setSelectedTaskIds((prev) => {
      const next = new Set([...prev].filter((processKey) =>
        validProcessKeys.has(processKey)
      ));
      return areSetsEqual(next, prev) ? prev : next;
    });
    setDisabledProcessKeys((prev) => {
      const next = new Set([...prev].filter((processKey) => validProcessKeys.has(processKey)));
      return areSetsEqual(next, prev) ? prev : next;
    });
    setSuppressedProcessKeys((prev) => {
      const next = new Set([...prev].filter((processKey) => validProcessKeys.has(processKey)));
      return areSetsEqual(next, prev) ? prev : next;
    });
    if (selectedTaskId && !validTaskIds.has(selectedTaskId)) {
      const nextTask = tasks[0] ?? null;
      setSelectedTaskId(nextTask?.id ?? null);
      setSelectedProcessId(null);
    }
  }, [tasks, selectedTaskId, disabledProcessKeys]);

  useEffect(() => {
    setSelectedTaskIds((prev) => {
      const visibleKeys = new Set(visibleProcessKeys);
      const next = new Set([...prev].filter((processKey) => visibleKeys.has(processKey)));
      return areSetsEqual(next, prev) ? prev : next;
    });
  }, [visibleProcessKeys.join('|')]);

  useEffect(() => {
    if (!selectedTaskId || !selectedProcessId) return;
    const selectedProcessVisible = (visibleProcessIdsByTask[selectedTaskId] ?? []).includes(selectedProcessId);
    if (!selectedProcessVisible) setSelectedProcessId(null);
  }, [selectedTaskId, selectedProcessId, visibleProcessIdsByTask]);

  useEffect(() => {
    setTaskFilterValues((currentValues) => {
      const nextValues: Partial<Record<ProductionTaskFilterKind, string[]>> = {};
      let changed = false;
      taskFilterKinds.forEach((kind) => {
        const optionIds = new Set(taskFilterValueOptions[kind].map((item) => item.id));
        const currentKindValues = currentValues[kind] ?? [];
        const nextKindValues = currentKindValues.filter((value) => optionIds.has(value));
        if (nextKindValues.length === 0 && taskFilterValueOptions[kind][0]) nextKindValues.push(taskFilterValueOptions[kind][0].id);
        nextValues[kind] = nextKindValues;
        if (currentKindValues.length !== nextKindValues.length || currentKindValues.some((value, index) => value !== nextKindValues[index])) {
          changed = true;
        }
      });
      (Object.keys(currentValues) as ProductionTaskFilterKind[]).forEach((kind) => {
        if (!taskFilterKinds.includes(kind)) changed = true;
      });
      return changed ? nextValues : currentValues;
    });
  }, [taskFilterKinds, taskFilterValueOptions]);

  const addLog = (text: string, level: LogEntry['level'] = 'info') => {
    setLogs((prev) => [{ id: `log-${Date.now()}`, level, time: getNowTime(), text }, ...prev].slice(0, 80));
  };

  const scheduleLogisticsDemoStep = (callback: () => void, delay = productionTrayDemoStepInterval) => {
    const scheduleRun = () => {
      const remainingDelay = logisticsDemoDelayUntilRef.current - Date.now();
      if (logisticsDemoEditingRef.current || remainingDelay > 0) {
        logisticsDemoTimerRef.current = window.setTimeout(
          scheduleRun,
          Math.max(250, logisticsDemoEditingRef.current ? productionTrayDemoStepInterval : remainingDelay),
        );
        return;
      }
      callback();
    };

    logisticsDemoTimerRef.current = window.setTimeout(
      scheduleRun,
      Math.max(delay, logisticsDemoDelayUntilRef.current - Date.now()),
    );
  };

  useEffect(() => {
    const unloadingSlot = traySlots.find((slot) => slot.id === '9');
    if (!unloadingSlot || unloadingSlot.state !== 'empty') return;

    const completed = tasks
      .flatMap((task) => task.workpieces.map((workpiece) => ({ task, workpiece })))
      .find(({ workpiece }) => workpiece.state === 'done' && !completedWorkpieceIdsRef.current.has(workpiece.id));
    if (!completed) return;

    completedWorkpieceIdsRef.current.add(completed.workpiece.id);
    const completedWorkpieceSerial = formatProductionWorkpieceSerial(completed.workpiece.serial);
    const completedMaterial = `${completedWorkpieceSerial} 加工完成工件`;
    setTraySlots((prev) => prev.map((slot) => (
      slot.id === '9'
        ? { ...slot, material: completedMaterial, quantity: 1, state: 'full' }
        : slot
    )));
    setTrayTasks((prev) => {
      const nextNumber = prev.reduce((max, task) => {
        const numericId = Number(task.id.match(/^AGV-(\d+)$/)?.[1] ?? 0);
        return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
      }, 0) + 1;
      return [
        ...prev,
        {
          id: `AGV-${String(nextNumber).padStart(3, '0')}`,
          type: '满托任务' as const,
          mode: '自动' as const,
          material: completedMaterial,
          quantity: 1,
          pickup: '09',
          dropoff: '10',
          state: 'pending' as const,
        },
      ];
    });
    addLog(`${completedWorkpieceSerial} 全部工序已完成，09 号托盘已入成品并生成 09 -> 10 满托任务`);
  }, [tasks, traySlots]);

  const updateSelectedTask = (updater: (task: ProductionTask) => ProductionTask) => {
    if (!selectedTaskId) return;
    setTasks((prev) => prev.map((task) => (task.id === selectedTaskId ? updater(task) : task)));
  };

  const createVisionAbnormalTask = (
    task: ProductionTask,
    processId: string,
    activeWorkpieceIndex = task.workpieces.findIndex((item) => item.state === 'running' || item.state === 'paused'),
  ): ProductionTask | null => {
    const enabledProcessIds = getEnabledTaskProcessIds(task.id, task.processIds, disabledProcessKeys);
    if (!enabledProcessIds.includes(processId)) return null;

    const abnormalProcess = getProcessFromOptions(processId, activeProcessOptions);
    const abnormalWorkpieceIndex = task.workpieces.findIndex(
      (workpiece) => workpiece.serial === mockedAbnormalWorkpieceSerial,
    );
    if (!abnormalProcess || abnormalWorkpieceIndex < 0) return null;

    const processProgress = getProcessProgress(enabledProcessIds, processId);
    const abnormalWorkpieces = task.workpieces.map((item, index) => {
      if (index === abnormalWorkpieceIndex) {
        return {
          ...item,
          state: 'abnormal' as const,
          progress: Math.max(item.progress, processProgress),
          process: abnormalProcess.name,
          currentProcessId: processId,
          currentStepIndex: 0,
          visionSummary: '0162-01-010101(1) 第 06 工序装配焊接机器人1视觉异常，等待人工确认',
          abnormalProcessId: processId,
          abnormalVisionFeedId: 'weld-1',
        };
      }
      if (index === activeWorkpieceIndex) {
        return {
          ...item,
          state: 'running' as const,
          progress: Math.max(item.progress, processProgress),
          process: abnormalProcess.name,
          currentProcessId: processId,
          currentStepIndex: 0,
          visionSummary: '检测到0162-01-010101(6) 视觉异常，产线联锁暂停',
          abnormalProcessId: undefined,
          abnormalVisionFeedId: undefined,
        };
      }
      return item;
    });
    const abnormalWorkpiece = abnormalWorkpieces[abnormalWorkpieceIndex];

    return {
      ...task,
      state: 'paused',
      currentProcess: getTaskProcessLabel(abnormalWorkpiece, abnormalProcess.name, '视觉异常暂停'),
      currentProcessId: processId,
      progress: calculateOverallTaskProgress(abnormalWorkpieces),
      workpieces: abnormalWorkpieces,
    };
  };

  const advanceProductionTask = (
    task: ProductionTask,
    requestedWorkstepIndex?: number,
    stationScoped = false,
  ): ProductionTask => {
    const enabledProcessIds = getEnabledTaskProcessIds(task.id, task.processIds, disabledProcessKeys);
    if (enabledProcessIds.length === 0) return task;

    const activeWorkpieceIndex = task.workpieces.findIndex((item) => item.state === 'running' || item.state === 'paused');
    if (activeWorkpieceIndex < 0) return task;

    const activeWorkpiece = task.workpieces[activeWorkpieceIndex];
    const currentProcessId = activeWorkpiece.currentProcessId ?? task.currentProcessId;
    if (!currentProcessId) return task;

    const taskProcesses = task.processIds
      .map((processId) => getProcessFromOptions(processId, activeProcessOptions))
      .filter((process): process is ProcessOption => Boolean(process));
    const currentProcess = getProcessFromOptions(currentProcessId, activeProcessOptions);
    const workstepNames = getProductionStationWorkstepNames(currentProcess, taskProcesses);
    const currentPlacement = productionWorkbenchProcessPlacements[currentProcessId];
    const composite = stationScoped ? getProductionCompositeStation(currentPlacement?.areaId) : null;
    const compositeSegments = composite ? getProductionCompositeWorkstepSegments(composite, taskProcesses) : [];
    const compositeLocation = composite
      ? findProductionCompositeWorkstepLocation(composite, taskProcesses, currentProcessId)
      : null;
    const activeSegmentIndex = compositeLocation
      ? compositeSegments.findIndex((segment) => segment.processId === compositeLocation.segmentProcessId)
      : -1;
    const executionWorkstepNames = compositeLocation?.workstepNames ?? workstepNames;
    const currentStepIndex = Math.min(
      Math.max(activeWorkpiece.currentStepIndex ?? compositeLocation?.aliasLocalWorkstepIndex ?? 0, 0),
      Math.max(0, executionWorkstepNames.length - 1),
    );

    if (requestedWorkstepIndex !== undefined && workstepNames.length > 0) {
      const selectedStepIndex = Math.min(Math.max(requestedWorkstepIndex, 0), workstepNames.length - 1);
      if (selectedStepIndex !== currentStepIndex) {
        const runningWorkpieces = task.workpieces.map((item, index) => index === activeWorkpieceIndex ? {
          ...item,
          state: 'running' as const,
          process: currentProcess?.name ?? item.process,
          currentProcessId,
          currentStepIndex: selectedStepIndex,
          visionSummary: '工位执行中',
        } : item);
        const selectedWorkpiece = runningWorkpieces[activeWorkpieceIndex];
        return {
          ...task,
          state: 'running',
          currentProcess: getTaskProcessLabel(selectedWorkpiece, currentProcess?.name ?? selectedWorkpiece.process),
          currentProcessId,
          progress: calculateOverallTaskProgress(runningWorkpieces),
          workpieces: runningWorkpieces,
        };
      }
    }

    if (executionWorkstepNames.length > 1 && currentStepIndex < executionWorkstepNames.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      const runningWorkpieces = task.workpieces.map((item, index) => index === activeWorkpieceIndex ? {
        ...item,
        state: 'running' as const,
        process: currentProcess?.name ?? item.process,
        currentProcessId,
        currentStepIndex: nextStepIndex,
        visionSummary: '工位执行中',
      } : item);
      const nextWorkpiece = runningWorkpieces[activeWorkpieceIndex];
      return {
        ...task,
        state: 'running',
        currentProcess: getTaskProcessLabel(nextWorkpiece, currentProcess?.name ?? nextWorkpiece.process),
        currentProcessId,
        progress: calculateOverallTaskProgress(runningWorkpieces),
        workpieces: runningWorkpieces,
      };
    }

    if (stationScoped && activeSegmentIndex >= 0) {
      const nextSegment = compositeSegments
        .slice(activeSegmentIndex + 1)
        .find((segment) => enabledProcessIds.includes(segment.processId));
      if (nextSegment) {
        if (nextSegment.processId === mockedAbnormalProcessId && activeWorkpieceIndex === 0) {
          return createVisionAbnormalTask(task, nextSegment.processId, activeWorkpieceIndex) ?? task;
        }
        const nextSegmentProcess = getProcessFromOptions(nextSegment.processId, activeProcessOptions);
        const runningWorkpieces = task.workpieces.map((item, index) => index === activeWorkpieceIndex ? {
          ...item,
          state: 'running' as const,
          progress: Math.max(item.progress, getProcessProgress(enabledProcessIds, nextSegment.processId)),
          process: nextSegmentProcess?.name ?? item.process,
          currentProcessId: nextSegment.processId,
          currentStepIndex: 0,
          visionSummary: '工位执行中',
        } : item);
        const nextWorkpiece = runningWorkpieces[activeWorkpieceIndex];
        return {
          ...task,
          state: 'running',
          currentProcess: getTaskProcessLabel(nextWorkpiece, nextSegmentProcess?.name ?? nextWorkpiece.process),
          currentProcessId: nextSegment.processId,
          progress: calculateOverallTaskProgress(runningWorkpieces),
          workpieces: runningWorkpieces,
        };
      }
    }

    const nextProcessId = getNextEnabledTaskProcessId(
      task.id,
      task.processIds,
      currentProcessId,
      disabledProcessKeys,
    );

    if (!nextProcessId) {
      const completedWorkpieces = task.workpieces.map((item, index) => index === activeWorkpieceIndex ? {
        ...item,
        state: 'done' as const,
        progress: 100,
        process: '已完成',
        currentProcessId: null,
        currentStepIndex: 0,
        visionSummary: '加工完成',
        abnormalProcessId: undefined,
        abnormalVisionFeedId: undefined,
      } : item);
      const nextWorkpieceIndex = completedWorkpieces.findIndex((item) => item.state === 'pending');

      if (nextWorkpieceIndex < 0) {
        return {
          ...task,
          state: 'done',
          currentProcess: '全部工件已完成',
          currentProcessId: null,
          progress: 100,
          workpieces: completedWorkpieces,
        };
      }

      const firstProcessId = enabledProcessIds[0] ?? null;
      const firstProcessName = getProcessFromOptions(firstProcessId, activeProcessOptions)?.name ?? '首道工序';
      const firstProgress = getProcessProgress(enabledProcessIds, firstProcessId);
      const runningWorkpieces = completedWorkpieces.map((item, index) => index === nextWorkpieceIndex ? {
        ...item,
        state: 'running' as const,
        progress: Math.max(item.progress, firstProgress),
        process: firstProcessName,
        currentProcessId: firstProcessId,
        currentStepIndex: 0,
        visionSummary: '工位执行中',
        abnormalProcessId: undefined,
        abnormalVisionFeedId: undefined,
      } : item);
      const nextWorkpiece = runningWorkpieces[nextWorkpieceIndex];

      return {
        ...task,
        state: 'running',
        currentProcess: getTaskProcessLabel(nextWorkpiece, firstProcessName),
        currentProcessId: firstProcessId,
        progress: calculateOverallTaskProgress(runningWorkpieces),
        workpieces: runningWorkpieces,
      };
    }

    const nextProcess = getProcessFromOptions(nextProcessId, activeProcessOptions);
    const nextProcessName = nextProcess?.name ?? '下一工序';
    const nextProgress = getProcessProgress(enabledProcessIds, nextProcessId);
    const mockedAbnormalWorkpieceIndex = task.workpieces.findIndex(
      (workpiece) => workpiece.serial === mockedAbnormalWorkpieceSerial,
    );
    const shouldMockAbnormal = Boolean(mockedAbnormalProcessId)
      && activeWorkpieceIndex === 0
      && mockedAbnormalWorkpieceIndex >= 0
      && nextProcessId === mockedAbnormalProcessId;

    if (shouldMockAbnormal) return createVisionAbnormalTask(task, nextProcessId, activeWorkpieceIndex) ?? task;

    const runningWorkpieces = task.workpieces.map((item, index) => index === activeWorkpieceIndex ? {
      ...item,
      state: 'running' as const,
      progress: Math.max(item.progress, nextProgress),
      process: nextProcessName,
      currentProcessId: nextProcessId,
      currentStepIndex: 0,
      visionSummary: '工位执行中',
      abnormalProcessId: undefined,
      abnormalVisionFeedId: undefined,
    } : item);

    return {
      ...task,
      state: 'running',
      currentProcess: getTaskProcessLabel(runningWorkpieces[activeWorkpieceIndex], nextProcessName),
      currentProcessId: nextProcessId,
      progress: calculateOverallTaskProgress(runningWorkpieces),
      workpieces: runningWorkpieces,
    };
  };

  const buildPositioningResult = (target: PositioningTarget, source: PositioningResultSource): VisionPositionResult => ({
    key: target.key,
    taskId: target.taskId,
    taskLabel: target.taskLabel,
    workpieceId: target.workpieceId,
    workpieceLabel: target.workpieceLabel,
    stationId: target.stationId,
    stationLabel: target.stationLabel,
    processId: target.processId,
    workstepIndex: target.workstepIndex,
    source,
    pose: source === 'scan'
      ? { x: '125.4', y: '-48.2', z: '32.6', rx: '0.0', ry: '90.0', rz: '180.0' }
      : { x: '126.1', y: '-47.8', z: '32.4', rx: '0.0', ry: '90.0', rz: '179.6' },
    createdAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  });

  const completePositioningStep = (target: PositioningTarget, result: VisionPositionResult) => {
    setPositioningResults((prev) => ({ ...prev, [target.key]: result }));
    if (!selectedTask || selectedTask.id !== target.taskId) return;
    updateSelectedTask((task) => {
      const workpieces = task.workpieces.map((item) => item.id === target.workpieceId
        ? { ...item, state: 'paused' as const, visionSummary: '二次定位完成，等待查看结果' }
        : item);
      const workpiece = workpieces.find((item) => item.id === target.workpieceId) ?? workpieces.find((item) => item.state === 'paused' || item.state === 'running');
      return {
        ...task,
        state: 'paused',
        currentProcess: workpiece ? getTaskProcessLabel(workpiece, getProcessName(target.processId), '二次定位完成') : task.currentProcess,
        currentProcessId: target.processId,
        workpieces,
      };
    });
    setActiveExecutionMode(null);
    setActiveExecutionStationId(null);
  };

  const handleOpenPositioningDialog = (target: PositioningTarget) => {
    if (positioningLocateTimerRef.current !== null) window.clearTimeout(positioningLocateTimerRef.current);
    if (positioningImportTimerRef.current !== null) window.clearTimeout(positioningImportTimerRef.current);
    setPositioningDialogTarget(target);
    setPositioningDialogLocateState(positioningResults[target.key]?.source === 'scan' ? 'success' : 'idle');
    setPositioningDialogImportStatus('idle');
  };

  const handleExecutePositioning = () => {
    if (!positioningDialogTarget) return;
    const target = positioningDialogTarget;
    setPositioningDialogLocateState('loading');
    setPositioningDialogImportStatus('idle');
    positioningLocateTimerRef.current = window.setTimeout(() => {
      const result = buildPositioningResult(target, 'scan');
      completePositioningStep(target, result);
      setPositioningDialogLocateState('success');
      addLog(`${target.workpieceLabel} 已完成二次定位，视觉结果可查看`);
    }, 650);
  };

  const handleImportPosition = () => {
    if (!positioningDialogTarget) return;
    const target = positioningDialogTarget;
    const attempts = positioningImportAttemptsRef.current[target.key] ?? 0;
    if (attempts === 0) {
      positioningImportAttemptsRef.current[target.key] = 1;
      setPositioningDialogImportStatus('error');
      addLog(`${target.workpieceLabel} 工件位置导入失败：结果数据不完整`, 'warning');
      return;
    }
    setPositioningDialogImportStatus('loading');
    positioningImportTimerRef.current = window.setTimeout(() => {
      const result = buildPositioningResult(target, 'import');
      completePositioningStep(target, result);
      setPositioningDialogImportStatus('idle');
      setPositioningDialogTarget(null);
      setActivePositioningResultKey(target.key);
      setActiveTab('vision');
      addLog(`${target.workpieceLabel} 已导入工件位置，视觉结果已覆盖并打开`);
    }, 500);
  };

  const handleViewPositioningResult = (key: string) => {
    if (!positioningResults[key]) return;
    setActivePositioningResultKey(key);
    setActiveTab('vision');
  };

  const handleExecuteStep = (requestedWorkstepIndex?: number) => {
    const selectedSnapshot = selectedDebugStationSnapshot;
    const selectedIndex = requestedWorkstepIndex ?? selectedSnapshot?.currentWorkstepIndex ?? 0;
    const selectedStepName = selectedSnapshot?.workstepNames[selectedIndex] ?? '选中工步';
    const positioningTarget = getPositioningTargetForIndex(selectedIndex);
    if (positioningTarget && executionMode === 'single-step') {
      handleOpenPositioningDialog(positioningTarget);
      return;
    }
    if (selectedSnapshot?.compositeStation) {
      // 复合工位单步调试：允许打断自动顺序，并把选中工步切为单步执行态。
      if (!selectedSnapshot.process || !selectedTask) {
        if (selectedSnapshot.workstepNames.length) {
          addLog(`${selectedSnapshot.stationName} 已演示执行：${selectedStepName}`);
        }
        return;
      }
      if (selectedTask.workpieces.some((workpiece) => workpiece.state === 'abnormal')) {
        addLog(`${selectedTask.drawingNo} 存在视觉异常，请先完成异常处理`, 'error');
        return;
      }
      const composite = getProductionCompositeStation(selectedSnapshot.stationId);
      const taskProcesses = selectedTask.processIds
        .map((processId) => getProcessFromOptions(processId, activeProcessOptions))
        .filter((process): process is ProcessOption => Boolean(process));
      const jumpTarget = composite
        ? resolveProductionCompositeWorkstepIndex(composite, taskProcesses, selectedIndex)
        : null;
      if (!jumpTarget || !selectedTask.processIds.includes(jumpTarget.processId)) {
        if (selectedSnapshot.workstepNames.length) {
          addLog(`${selectedSnapshot.stationName} 已演示执行：${selectedStepName}`);
        }
        return;
      }
      const jumpProcess = getProcessFromOptions(jumpTarget.processId, activeProcessOptions);
      const jumpProcessStepNames = getProductionStationWorkstepNames(jumpProcess, taskProcesses);
      const localStepIndex = Math.min(jumpTarget.localWorkstepIndex, Math.max(0, jumpProcessStepNames.length - 1));
      updateSelectedTask((task) => {
        const startedTask = task.state === 'running' || task.state === 'paused'
          ? task
          : buildStartedTask(task, selectedSnapshot.stationId);
        if (startedTask.state !== 'running' && startedTask.state !== 'paused') return task;
        const workpieceIndex = getExecutableWorkpieceIndex(startedTask);
        if (workpieceIndex < 0) return startedTask;
        const enabledProcessIds = getEnabledTaskProcessIds(startedTask.id, startedTask.processIds, disabledProcessKeys);
        const jumpProgress = getProcessProgress(enabledProcessIds, jumpTarget.processId);
        const workpieces = startedTask.workpieces.map((item, index) => index === workpieceIndex ? {
          ...item,
          state: 'running' as const,
          progress: Math.max(item.progress, jumpProgress),
          process: jumpProcess?.name ?? item.process,
          currentProcessId: jumpTarget.processId,
          currentStepIndex: localStepIndex,
          visionSummary: '单步调试执行中',
        } : item);
        return {
          ...startedTask,
          state: 'running',
          currentProcess: getTaskProcessLabel(workpieces[workpieceIndex], jumpProcess?.name ?? workpieces[workpieceIndex].process),
          currentProcessId: jumpTarget.processId,
          progress: calculateOverallTaskProgress(workpieces),
          workpieces,
        };
      });
      addLog(`${selectedTask.drawingNo} 已进入单步调试并执行：${selectedStepName}`);
      return;
    }
    if (!selectedSnapshot?.process) {
      if (selectedSnapshot?.workstepNames.length) {
        addLog(`${selectedSnapshot.stationName} 已演示执行：${selectedStepName}`);
      }
      return;
    }
    if (!selectedTask) return;
    if (selectedTask.workpieces.some((workpiece) => workpiece.state === 'abnormal')) {
      addLog(`${selectedTask.drawingNo} 存在视觉异常，请先完成异常处理`, 'error');
      return;
    }
    updateSelectedTask((task) => {
      const startedTask = task.state === 'running' || task.state === 'paused'
        ? task
        : buildStartedTask(task, selectedSnapshot?.stationId ?? '');
      if (startedTask.state !== 'running' && startedTask.state !== 'paused') return task;
      return advanceProductionTask(startedTask, selectedIndex);
    });
    addLog(`${selectedTask.drawingNo} 已执行工步：${selectedStepName}`);
  };

  useEffect(() => {
    if (executionMode !== 'auto') return undefined;
    const timer = window.setInterval(() => {
      setTasks((prev) => prev.map((task) => (
        task.state === 'running' ? advanceProductionTask(task, undefined, true) : task
      )));
    }, 12000);

    return () => window.clearInterval(timer);
  }, [activeProcessOptions, disabledProcessKeys, executionMode]);

  useEffect(() => {
    if (executionMode !== 'auto' || !selectedTask || selectedTask.state !== 'running') return;
    const activeWorkpiece = selectedTask.workpieces.find((item) => item.state === 'running' || item.state === 'paused');
    const processId = activeWorkpiece?.currentProcessId ?? selectedTask.currentProcessId;
    if (!activeWorkpiece || !processId) return;
    const placement = productionWorkbenchProcessPlacements[processId];
    const composite = getProductionCompositeStation(placement?.areaId);
    const taskProcesses = selectedTask.processIds
      .map((processIdValue) => getProcessFromOptions(processIdValue, activeProcessOptions))
      .filter((item): item is ProcessOption => Boolean(item));
    const location = composite ? findProductionCompositeWorkstepLocation(composite, taskProcesses, processId) : null;
    const names = location?.workstepNames ?? getProductionStationWorkstepNames(getProcessFromOptions(processId, activeProcessOptions), taskProcesses);
    const stepIndex = location?.aliasLocalWorkstepIndex ?? activeWorkpiece.currentStepIndex ?? 0;
    if (!isPositioningWorkstepName(names[stepIndex])) return;
    const resultStationId = composite?.id ?? placement?.areaId ?? '';
    const targetKey = `${selectedTask.id}:${activeWorkpiece.id}:${resultStationId}:${processId}:${stepIndex}`;
    if (positioningResults[targetKey]) return;
    const stationLabel = composite?.name ?? productionWorkbenchAreas.find((area) => area.id === resultStationId)?.name ?? resultStationId;
    const target: PositioningTarget = {
      key: targetKey,
      taskId: selectedTask.id,
      taskLabel: selectedTask.name,
      workpieceId: activeWorkpiece.id,
      workpieceLabel: formatProductionWorkpieceSerial(activeWorkpiece.serial),
      stationId: resultStationId,
      stationLabel,
      processId,
      workstepIndex: stepIndex,
    };
    setPositioningResults((prev) => ({ ...prev, [target.key]: buildPositioningResult(target, 'scan') }));
  }, [activeProcessOptions, executionMode, positioningResults, selectedTask]);

  const handleCreateTasks = (payloads: NewWorkOrderPayload[]) => {
    if (!canCreateTask || payloads.length === 0) {
      setNewTaskOpen(false);
      return;
    }
    const creationKey = Date.now();
    const created = payloads.map((payload, index) => {
      const taskId = `task-${creationKey}-${index + 1}`;
      const disabledProcessIds = new Set(
        payload.disabledProcessIds.filter((processId) => payload.processIds.includes(processId))
      );
      const firstEnabledProcessId = payload.processIds.find((processId) => !disabledProcessIds.has(processId)) ?? null;
      const firstProcess = processOptions.find((item) => item.id === firstEnabledProcessId)?.name ?? '未开始';
      const task: ProductionTask = {
        id: taskId,
        workOrderNo: payload.workOrderNo,
        name: payload.workpiece.name,
        project: payload.workpiece.project,
        drawingNo: payload.workpiece.drawingNo,
        quantity: payload.quantity,
        state: 'ready',
        currentProcess: '待初始化',
        currentProcessId: null,
        progress: 0,
        processIds: payload.processIds,
        workpieces: makeWorkpieces(taskId, payload.workpiece.drawingNo, payload.workpiece.name, payload.quantity),
      };
      return { task, payload, disabledProcessIds, firstProcess };
    });
    setTasks((prev) => [...prev, ...created.map((item) => item.task)]);
    setDisabledProcessKeys((prev) => {
      const next = new Set(prev);
      created.forEach(({ task, disabledProcessIds }) => {
        disabledProcessIds.forEach((processId) => next.add(getProductionProcessKey(task.id, processId)));
      });
      return next;
    });
    setSuppressedProcessKeys((prev) => {
      const next = new Set(prev);
      created.forEach(({ task, disabledProcessIds }) => {
        disabledProcessIds.forEach((processId) => next.add(getProductionProcessKey(task.id, processId)));
      });
      return next;
    });
    setSelectedTaskId(created[created.length - 1].task.id);
    setSelectedTaskIds(new Set());
    setNewTaskOpen(false);
    setTrayTasks((prev) => {
      let nextNumber = prev.reduce((max, task) => {
        const numericId = Number(task.id.match(/^AGV-(\d+)$/)?.[1] ?? 0);
        return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
      }, 0);
      const next = [...prev];
      created.forEach(({ payload }) => {
        if (next.some((task) => task.workOrderNo === payload.workOrderNo)) return;
        nextNumber += 1;
        next.unshift({
          id: `AGV-${String(nextNumber).padStart(3, '0')}`,
          workOrderNo: payload.workOrderNo,
          type: '上料任务',
          mode: '自动',
          material: `${payload.workpiece.drawingNo}-01`,
          quantity: payload.quantity,
          pickup: '00',
          dropoff: '01',
          state: 'pending',
        });
      });
      return next;
    });
    created.forEach(({ payload, disabledProcessIds, firstProcess }) => {
      addLog(`工单 ${payload.workOrderNo} · ${payload.workpiece.drawingNo}，数量 ${payload.quantity}，已下发生产，首工序 ${firstProcess}`);
      if (disabledProcessIds.size > 0) addLog(`${payload.workOrderNo} 已软禁用 ${disabledProcessIds.size} 项工序任务`, 'warning');
    });
    addLog(`已下发 ${created.length} 张工单进入生产任务列表`);
    setSelectedProcessId(null);
  };

  const handleRequestCreateTask = () => {
    if (!canCreateTask) return;
    setNewTaskOpen(true);
  };

  const allocateDraftSequence = () => {
    draftSequenceRef.current += 1;
    return draftSequenceRef.current;
  };

  const handleInitialize = () => {
    if (!selectedTask) return;
    updateSelectedTask((task) => ({
      ...task,
      state: 'ready',
      currentProcess: '初始化完成，等待执行',
      currentProcessId: null,
      progress: task.state === 'stopped' ? 0 : task.progress,
      workpieces: task.workpieces.map((item) => task.state === 'stopped' ? { ...item, progress: 0, state: 'pending', process: '未开始', currentProcessId: null, currentStepIndex: 0, abnormalProcessId: undefined, abnormalVisionFeedId: undefined } : item),
    }));
    addLog(`${selectedTask.drawingNo} 初始化完成，PLC、机器人、视觉信号已复位`);
  };

  // 工位详情自动执行：起点对齐到当前查看工位（复合工位取首个启用段落），而不是整张工单首道工序。
  const resolveStationStartProcessId = (
    stationId: string | null | undefined,
    enabledProcessIds: string[],
    taskProcesses: ProcessOption[],
  ) => {
    if (!stationId) return null;
    const composite = getProductionCompositeStation(stationId);
    if (composite) {
      const segment = getProductionCompositeWorkstepSegments(composite, taskProcesses)
        .find((item) => enabledProcessIds.includes(item.processId));
      return segment?.processId ?? null;
    }
    return enabledProcessIds.find((processId) => productionWorkbenchProcessPlacements[processId]?.areaId === stationId) ?? null;
  };

  const buildStartedTask = (task: ProductionTask, startStationId?: string): ProductionTask => {
    const enabledProcessIds = getEnabledTaskProcessIds(task.id, task.processIds, disabledProcessKeys);
    const executableWorkpieceIndex = getExecutableWorkpieceIndex(task);
    if (executableWorkpieceIndex < 0 || enabledProcessIds.length === 0) return task;
    const executableWorkpiece = task.workpieces[executableWorkpieceIndex];
    const taskProcesses = task.processIds
      .map((processId) => getProcessFromOptions(processId, activeProcessOptions))
      .filter((process): process is ProcessOption => Boolean(process));
    const stationStartProcessId = executableWorkpiece.state === 'pending'
      ? resolveStationStartProcessId(startStationId, enabledProcessIds, taskProcesses)
      : null;
    const currentProcessId = executableWorkpiece.currentProcessId ?? task.currentProcessId;
    const currentProcessEnabled = Boolean(currentProcessId && enabledProcessIds.includes(currentProcessId));
    const processId = executableWorkpiece.state === 'pending'
      ? stationStartProcessId ?? enabledProcessIds[0] ?? null
      : currentProcessEnabled
        ? currentProcessId
        : getNextEnabledTaskProcessId(task.id, task.processIds, currentProcessId, disabledProcessKeys)
          ?? enabledProcessIds[0]
          ?? null;
    const processName = getProcessName(processId, '桁架上料抓取');
    const processProgress = getProcessProgress(enabledProcessIds, processId);
    const runningWorkpieces = task.workpieces.map((item, index) => {
      if (index !== executableWorkpieceIndex) return item;
      return {
        ...item,
        state: 'running' as const,
        process: processName,
        currentProcessId: processId,
        currentStepIndex: item.currentProcessId === processId ? item.currentStepIndex ?? 0 : 0,
        progress: Math.max(item.progress, processProgress),
        visionSummary: item.state === 'pending' && !stationStartProcessId ? '桁架视觉定位完成' : '工位执行中',
        abnormalProcessId: undefined,
        abnormalVisionFeedId: undefined,
      };
    });

    return {
      ...task,
      state: 'running' as const,
      currentProcess: getTaskProcessLabel(runningWorkpieces[executableWorkpieceIndex], processName),
      currentProcessId: processId,
      progress: calculateOverallTaskProgress(runningWorkpieces),
      workpieces: runningWorkpieces,
    };
  };

  const startSelectedProductionTask = (startStationId?: string) => {
    if (!selectedTask) return;
    updateSelectedTask((task) => buildStartedTask(task, startStationId));
    addLog(`${selectedTask.drawingNo} 开始执行，已下发任务信息至 PLC`);
    addLog('机器人调度与视觉识别进入监测状态');
  };

  const handleRunOrPause = (startStationId?: string) => {
    if (!selectedTask) return;
    if (selectedTask.state === 'running') {
      updateSelectedTask((task) => ({
        ...task,
        state: 'paused',
        currentProcess: `${task.currentProcess.replace(/ · 已暂停$/, '')} · 已暂停`,
        workpieces: task.workpieces.map((item) => item.state === 'running' ? { ...item, state: 'paused', visionSummary: '任务暂停，等待继续执行' } : item),
      }));
      addLog(`${selectedTask.drawingNo} 已暂停，暂停与 PLC / 机器人 / 视觉交互`, 'warning');
      // 暂停不释放执行会话锁，只有「停止执行」或任务终态才释放。
      return;
    }

    const abnormalWorkpiece = selectedTask.workpieces.find((item) => item.state === 'abnormal');
    if (abnormalWorkpiece) {
      addLog(`${selectedTask.drawingNo} ${abnormalWorkpiece.serial} 存在异常，请先双击视觉入口解除`, 'error');
      return;
    }

    setSelectedProcessId(null);
    setSelectedTaskIds(new Set());
    const isInitialWorkpieceStart = selectedTask.state !== 'paused'
      && selectedTask.workpieces.some((workpiece) => workpiece.state === 'pending');
    const inputTray = traySlots.find((slot) => slot.id === '1');
    if (leftPanel === 'v2' && isInitialWorkpieceStart) {
      if (!inputTray || inputTray.state === 'empty' || inputTray.state === 'reserved' || inputTray.material === '空') {
        const loadingTask = trayTasks.find((task) => (
          task.type === '上料任务' && task.pickup === '00' && task.dropoff === '01' && task.state === 'pending'
        ));
        if (!loadingTask) {
          addLog('01 号托盘尚未就绪，等待 00 -> 01 上料任务创建', 'warning');
          return;
        }
        setTrayTasks((prev) => prev.map((task) => (
          task.id === loadingTask.id ? { ...task, state: 'running' } : task
        )));
        setTraySlots((prev) => prev.map((slot) => (
          slot.id === '1' ? { ...slot, state: 'reserved' } : slot
        )));
        updateSelectedTask((task) => ({
          ...task,
          state: 'running',
          currentProcess: '等待 01 号托盘上料',
          currentProcessId: null,
          workpieces: task.workpieces.map((workpiece) => (
            workpiece.state === 'pending'
              ? { ...workpiece, visionSummary: '等待 00 -> 01 上料任务完成' }
              : workpiece
          )),
        }));
        addLog(`${loadingTask.id} 已执行：01 号托盘已预约，AGV 正从 00 号位上料`);
        if (logisticsDemoTimerRef.current !== null) window.clearTimeout(logisticsDemoTimerRef.current);
        scheduleLogisticsDemoStep(() => {
          setTrayTasks((prev) => prev.map((task) => (
            task.id === loadingTask.id ? { ...task, state: 'done' } : task
          )));
          setTraySlots((prev) => prev.map((slot) => (
            slot.id === '1'
              ? { ...slot, material: loadingTask.material, quantity: loadingTask.quantity, state: 'loaded' }
              : slot
          )));
          addLog(`${loadingTask.id} 已到达：01 号托盘已放入 ${loadingTask.material} ×${loadingTask.quantity}`);
          scheduleLogisticsDemoStep(() => {
            setTraySlots((prev) => prev.map((slot) => (
              slot.id === '1' ? { ...slot, material: '空', quantity: 0, state: 'empty-frame' } : slot
            )));
            addLog('工位已接料：01 号托盘零件已上工作台，现场保留空料框');
            startSelectedProductionTask(startStationId);
            const emptyTrayTask = trayTasks.find((task) => (
              task.type === '空托任务' && task.pickup === '01' && task.dropoff === '00' && task.state === 'pending'
            ));
            const outputTaskId = 'AGV-MOCK-009';
            scheduleLogisticsDemoStep(() => {
              if (emptyTrayTask) {
                setTrayTasks((prev) => prev.map((task) => (
                  task.id === emptyTrayTask.id ? { ...task, state: 'running' } : task
                )));
                addLog(`${emptyTrayTask.id} 已执行：01 号空托正回收至 00 号位`);
              }
              scheduleLogisticsDemoStep(() => {
                setTrayTasks((prev) => {
                  const completed = prev.map((task) => (
                    task.id === emptyTrayTask?.id ? { ...task, state: 'done' } : task
                  ));
                  if (completed.some((task) => task.id === outputTaskId)) return completed;
                  return [
                    ...completed,
                    {
                      id: outputTaskId,
                      type: '满托任务' as const,
                      mode: '自动' as const,
                      material: '工件-0162-01-010101',
                      quantity: 6,
                      pickup: '09',
                      dropoff: '10',
                      state: 'pending' as const,
                    },
                  ];
                });
                const firstWorkpiece = selectedTask.workpieces[0];
                if (firstWorkpiece) completedWorkpieceIdsRef.current.add(firstWorkpiece.id);
                setTraySlots((prev) => prev.map((slot) => {
                  if (slot.id === '1') return { ...slot, material: '空', quantity: 0, state: 'empty' };
                  if (slot.id === '9') return { ...slot, material: '工件-0162-01-010101', quantity: 6, state: 'full' };
                  return slot;
                }));
                addLog('01 号空托已回收至 00；09 号托盘已接收加工完成装配体');
                scheduleLogisticsDemoStep(() => {
                  setTrayTasks((prev) => prev.map((task) => (
                    task.id === outputTaskId ? { ...task, state: 'running' } : task
                  )));
                  addLog(`${outputTaskId} 已执行：09 号满托正下料至 10 号位`);
                  scheduleLogisticsDemoStep(() => {
                    setTrayTasks((prev) => prev.map((task) => (
                      task.id === outputTaskId ? { ...task, state: 'done' } : task
                    )));
                    setTraySlots((prev) => prev.map((slot) => (
                      slot.id === '9' ? { ...slot, material: '空', quantity: 0, state: 'empty' } : slot
                    )));
                    addLog(`${outputTaskId} 已确认到达：09 号满托已下料至 10 号位，托盘恢复空闲`);
                  }, 4000);
                }, 4000);
              }, 4000);
            }, 4000);
          }, 4000);
        }, 4000);
        return;
      }
      setTraySlots((prev) => prev.map((slot) => (
        slot.id === '1'
          ? { ...slot, material: '空', quantity: 0, state: 'empty-frame' }
          : slot
      )));
      addLog('工位已接料：01 号托盘零件已上工作台，现场保留空料框');
    }
    updateSelectedTask((task) => ({
      ...(() => {
        const enabledProcessIds = getEnabledTaskProcessIds(task.id, task.processIds, disabledProcessKeys);
        const executableWorkpieceIndex = getExecutableWorkpieceIndex(task);
        if (executableWorkpieceIndex < 0 || enabledProcessIds.length === 0) return task;
        const executableWorkpiece = task.workpieces[executableWorkpieceIndex];
        const taskProcesses = task.processIds
          .map((processId) => getProcessFromOptions(processId, activeProcessOptions))
          .filter((process): process is ProcessOption => Boolean(process));
        const stationStartProcessId = executableWorkpiece.state === 'pending'
          ? resolveStationStartProcessId(startStationId, enabledProcessIds, taskProcesses)
          : null;
        const currentProcessId = executableWorkpiece.currentProcessId ?? task.currentProcessId;
        const currentProcessEnabled = Boolean(currentProcessId && enabledProcessIds.includes(currentProcessId));
        const processId = executableWorkpiece.state === 'pending'
          ? stationStartProcessId ?? enabledProcessIds[0] ?? null
          : currentProcessEnabled
            ? currentProcessId
            : getNextEnabledTaskProcessId(task.id, task.processIds, currentProcessId, disabledProcessKeys)
              ?? enabledProcessIds[0]
              ?? null;
        const processName = getProcessName(processId, '桁架上料抓取');
        const processProgress = getProcessProgress(enabledProcessIds, processId);
        const runningWorkpieces = task.workpieces.map((item, index) => {
          if (index !== executableWorkpieceIndex) return item;
          return {
            ...item,
            state: 'running',
            process: processName,
            currentProcessId: processId,
            progress: Math.max(item.progress, processProgress),
            visionSummary: item.state === 'pending' && !stationStartProcessId ? '桁架视觉定位完成' : '工位执行中',
            abnormalProcessId: undefined,
            abnormalVisionFeedId: undefined,
          };
        });

        return {
          ...task,
          state: 'running',
          currentProcess: getTaskProcessLabel(runningWorkpieces[executableWorkpieceIndex], processName),
          currentProcessId: processId,
          progress: calculateOverallTaskProgress(runningWorkpieces),
          workpieces: runningWorkpieces,
        };
      })(),
    }));
    addLog(`${selectedTask.drawingNo} 开始执行，已下发任务信息至 PLC`);
    addLog('机器人调度与视觉识别进入监测状态');
  };

  const handleClearWorkpieceAbnormal = ({ workpieceId, processId }: { workpieceId: string; processId: string }) => {
    if (!selectedTask) return;
    updateSelectedTask((task) => ({
      ...(() => {
        const processName = getProcessName(processId, '异常工序');
        const clearedWorkpieces = task.workpieces.map((item) => {
          if (item.id !== workpieceId || item.abnormalProcessId !== processId) return item;
          return {
            ...item,
            state: 'paused',
            process: processName,
            visionSummary: '异常已人工解除，等待继续执行',
            currentProcessId: processId,
            currentStepIndex: item.currentStepIndex ?? 0,
            abnormalProcessId: undefined,
            abnormalVisionFeedId: undefined,
          };
        });
        const executableWorkpiece = clearedWorkpieces.find((item) => item.state === 'running' || item.state === 'paused');
        const executableProcessName = getProcessName(executableWorkpiece?.currentProcessId, processName);

        return {
          ...task,
          state: 'paused',
          currentProcess: executableWorkpiece
            ? getTaskProcessLabel(executableWorkpiece, executableProcessName, '异常已解除')
            : '异常已解除，等待继续执行',
          currentProcessId: executableWorkpiece?.currentProcessId ?? processId,
          progress: calculateOverallTaskProgress(clearedWorkpieces),
          workpieces: clearedWorkpieces,
        };
      })(),
    }));
    addLog(`${selectedTask.drawingNo} ${processId} 异常已临时解除，等待继续执行`, 'warning');
  };

  const handleResolveVisionAbnormal = (resolution: 'skipped' | 'confirmed') => {
    if (!selectedTask || !visionAbnormalWorkpiece?.abnormalProcessId) return;
    const processId = visionAbnormalWorkpiece.abnormalProcessId;

    updateSelectedTask((task) => ({
      ...(() => {
        const processName = getProcessName(processId, '异常工序');
        const clearedWorkpieces = task.workpieces.map((item) => {
          if (item.id !== visionAbnormalWorkpiece.id || item.abnormalProcessId !== processId) return item;
          return {
            ...item,
            state: 'paused' as const,
            visionSummary: resolution === 'confirmed'
              ? '视觉结果已人工确认，等待继续执行'
              : '本次视觉结果已跳过，等待继续执行',
            currentProcessId: processId,
            currentStepIndex: item.currentStepIndex ?? 0,
            abnormalProcessId: undefined,
            abnormalVisionFeedId: undefined,
          };
        });
        const executableWorkpiece = clearedWorkpieces.find((item) => item.state === 'running' || item.state === 'paused');
        const executableProcessName = getProcessName(executableWorkpiece?.currentProcessId, processName);

        return {
          ...task,
          state: 'paused' as const,
          currentProcess: executableWorkpiece
            ? getTaskProcessLabel(
                executableWorkpiece,
                executableProcessName,
                resolution === 'confirmed' ? '视觉结果已确认' : '视觉结果已跳过',
              )
            : resolution === 'confirmed'
              ? '视觉结果已确认，等待继续执行'
              : '视觉结果已跳过，等待继续执行',
          currentProcessId: executableWorkpiece?.currentProcessId ?? processId,
          progress: calculateOverallTaskProgress(clearedWorkpieces),
          workpieces: clearedWorkpieces,
        };
      })(),
    }));
    setVisionCalibrationOpen(false);

    if (resolution === 'confirmed') {
      const activeFeed = visionFeedOptions.find((feed) => feed.id === activeVisionFeedId);
      addLog(`${visionAbnormalWorkpiece.serial} 已确认${activeFeed?.label ?? '视觉'}结果，任务保持暂停`);
      return;
    }
    addLog(`${visionAbnormalWorkpiece.serial} 已跳过本次视觉结果，任务保持暂停`, 'warning');
  };

  const handleVisionDemoProcessDoubleClick = ({
    task,
    workpiece,
    process,
    processIndex,
  }: {
    task: ProductionTask;
    workpiece: ProductionWorkpiece;
    process: ProcessOption;
    processIndex: number;
  }) => {
    const isAssemblyShortcut = !visionAbnormalWorkpiece
      && task.id === selectedTask?.id
      && workpiece.serial === mockedAbnormalWorkpieceSerial
      && process.id === mockedAbnormalProcessId
      && process.name === '装配';
    if (isAssemblyShortcut && mockedAbnormalProcessId) {
      const abnormalTask = createVisionAbnormalTask(task, mockedAbnormalProcessId, -1);
      if (!abnormalTask) return;
      setTasks((prev) => prev.map((item) => (item.id === task.id ? abnormalTask : item)));
      setSelectedProcessId(null);
      setActiveVisionFeedId('weld-1');
      setVisionDemoTarget('abnormal');
      setVisionGrabTaskLabel('');
      setVisionGrabWorkpieceCode('');
      setActiveTab('vision');
      setVisionCalibrationOpen(true);
      addLog('0162-01-010101(1) 第 06 道装配已通过快捷入口进入视觉异常处理', 'warning');
      return;
    }

    const transportFeed = activeVisionFeedId === 'transport-1' || activeVisionFeedId === 'transport-2';
    if (!visionAbnormalWorkpiece || task.id !== selectedTask?.id || workpiece.serial !== mockedAbnormalWorkpieceSerial || processIndex !== 3 || !transportFeed || process.name !== '抓取') {
      return;
    }
    setVisionDemoTarget('grab');
    setVisionGrabTaskLabel(`${formatProductionWorkpieceSerial(workpiece.serial)} · ${process.name}${formatCombinedPartObject(process.partObject)}`);
    setVisionGrabWorkpieceCode(process.partObject.split(' + ')[0] ?? process.partObject);
    setActiveTab('vision');
    setVisionCalibrationOpen(true);
  };

  const handleVisionFeedSelect = (feedId: string) => {
    setActiveVisionFeedId(feedId);
    if (visionAbnormalWorkpiece && (feedId === 'gantry-1' || feedId === 'gantry-2')) {
      setVisionDemoTarget('gantry-grab');
      setVisionGrabTaskLabel('0162-01-010101(1) · 04 抓取0162-01-010101-02');
      setVisionGrabWorkpieceCode('0162-01-010101-02');
    } else {
      setVisionDemoTarget('abnormal');
      setVisionGrabTaskLabel('');
      setVisionGrabWorkpieceCode('');
    }
    if (visionAbnormalWorkpiece) setVisionCalibrationOpen(true);
  };

  const handleStop = () => {
    if (!selectedTask) return;
    updateSelectedTask((task) => ({ ...task, state: 'stopped', currentProcess: '已停止，需初始化后重新执行', currentProcessId: null, workpieces: task.workpieces.map((item) => ({ ...item, currentStepIndex: 0 })) }));
    setActiveExecutionMode(null);
    setActiveExecutionStationId(null);
    setStopConfirmOpen(false);
    addLog(`${selectedTask.drawingNo} 已停止，任务需初始化后才能重新执行`, 'warning');
  };

  const handleToggleTaskSelection = (processKey: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(processKey)) next.delete(processKey);
      else next.add(processKey);
      return next;
    });
  };

  const handleSelectAllVisibleTasks = () => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (allVisibleTasksSelected) {
        visibleSelectableProcessKeys.forEach((processKey) => next.delete(processKey));
      } else {
        visibleSelectableProcessKeys.forEach((processKey) => next.add(processKey));
      }
      return next;
    });
  };

  const handleToggleProcessDisabled = (processKey: string) => {
    setDisabledProcessKeys((prev) => {
      const next = new Set(prev);
      if (next.has(processKey)) next.delete(processKey);
      else next.add(processKey);
      return next;
    });
    if (selectedTaskId && selectedProcessId && processKey === getProductionProcessKey(selectedTaskId, selectedProcessId)) {
      setSelectedProcessId(null);
    }
    addLog(`工序任务 ${processKey} 禁用状态已切换`, 'warning');
  };

  const handleDisableSelectedTasks = () => {
    if (selectedTaskIds.size === 0) return;
    const processKeys = Array.from(selectedTaskIds);
    const shouldEnableSelection = processKeys.some((processKey) => disabledProcessKeys.has(processKey));
    setDisabledProcessKeys((prev) => {
      const next = new Set(prev);
      processKeys.forEach((processKey) => {
        if (shouldEnableSelection) next.delete(processKey);
        else next.add(processKey);
      });
      return next;
    });
    setSelectedTaskIds(new Set());
    if (!shouldEnableSelection && selectedTaskId && selectedProcessId && processKeys.includes(getProductionProcessKey(selectedTaskId, selectedProcessId))) {
      setSelectedProcessId(null);
    }
    addLog(`已批量${shouldEnableSelection ? '解除禁用' : '禁用'} ${processKeys.length} 项工序任务`, 'warning');
  };

  const handleReorderTask = (sourceTaskId: string, targetTaskId: string) => {
    const sourceTask = tasks.find((task) => task.id === sourceTaskId);
    const targetTask = tasks.find((task) => task.id === targetTaskId);
    const lockedStates: ProductionTask['state'][] = ['running', 'paused', 'abnormal'];
    if (!sourceTask || !targetTask || sourceTaskId === targetTaskId) return;
    if (lockedStates.includes(sourceTask.state) || lockedStates.includes(targetTask.state)) return;

    setTasks((current) => {
      const sourceIndex = current.findIndex((task) => task.id === sourceTaskId);
      const targetIndex = current.findIndex((task) => task.id === targetTaskId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [movedTask] = next.splice(sourceIndex, 1);
      const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(insertionIndex, 0, movedTask);
      return next;
    });
    addLog(`${sourceTask.drawingNo} 工单排单顺序已调整`);
  };

  const handleRequestDeleteTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.state !== 'ready') return;
    setWorkOrderDeleteTargetId(taskId);
  };

  const handleDeleteTask = () => {
    if (!workOrderDeleteTargetId) return;
    const task = tasks.find((item) => item.id === workOrderDeleteTargetId);
    if (!task || task.state !== 'ready') {
      setWorkOrderDeleteTargetId(null);
      return;
    }

    const remainingTasks = tasks.filter((item) => item.id !== task.id);
    setTasks(remainingTasks);
    if (selectedTaskId === task.id) {
      setSelectedTaskId(remainingTasks[0]?.id ?? null);
      setSelectedProcessId(null);
    }
    setSelectedTaskIds((current) => new Set(
      [...current].filter((processKey) => getProductionProcessTaskId(processKey) !== task.id),
    ));
    setDisabledProcessKeys((current) => new Set(
      [...current].filter((processKey) => getProductionProcessTaskId(processKey) !== task.id),
    ));
    setSuppressedProcessKeys((current) => new Set(
      [...current].filter((processKey) => getProductionProcessTaskId(processKey) !== task.id),
    ));
    setWorkOrderDeleteTargetId(null);
    addLog(`${task.drawingNo} 工单已从生产任务列表移出`, 'warning');
  };

  const handleRequestClearVisibleTasks = () => {
    if (filteredTasks.length === 0) return;
    setClearConfirmOpen(true);
  };

  const handleRequestDeleteWorkpiece = (taskId: string, workpieceId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.state === 'running' || task.workpieces.length <= 1 || !task.workpieces.some((item) => item.id === workpieceId)) return;
    setWorkpieceDeleteTarget({ taskId, workpieceId });
  };

  const handleDeleteWorkpiece = () => {
    if (!workpieceDeleteTarget) return;
    const { taskId, workpieceId } = workpieceDeleteTarget;
    const task = tasks.find((item) => item.id === taskId);
    const workpiece = task?.workpieces.find((item) => item.id === workpieceId);
    if (!task || !workpiece || task.state === 'running' || task.workpieces.length <= 1) {
      setWorkpieceDeleteTarget(null);
      return;
    }

    setTasks((prev) => prev.map((item) => {
      if (item.id !== taskId) return item;
      const workpieces = item.workpieces.filter((candidate) => candidate.id !== workpieceId);
      return {
        ...item,
        quantity: workpieces.length,
        progress: calculateOverallTaskProgress(workpieces),
        workpieces,
      };
    }));
    setWorkpieceDeleteTarget(null);
    addLog(`${formatProductionWorkpieceSerial(workpiece.serial)} 已从 ${task.drawingNo} 生产任务移除，剩余 ${task.workpieces.length - 1} 件`, 'warning');
  };

  const handleClearVisibleTasks = () => {
    if (filteredTasks.length === 0) {
      setClearConfirmOpen(false);
      return;
    }
    const visibleIds = new Set(filteredTasks.map((task) => task.id));
    setTasks((prev) => {
      const next = prev.filter((task) => !visibleIds.has(task.id));
      const nextTask = next[0] ?? null;
      setSelectedTaskId(nextTask?.id ?? null);
      setSelectedProcessId(null);
      return next;
    });
    setSelectedTaskIds(new Set());
    setDisabledProcessKeys((prev) => new Set([...prev].filter((processKey) => !visibleIds.has(getProductionProcessTaskId(processKey)))));
    setSuppressedProcessKeys((prev) => new Set([...prev].filter((processKey) => !visibleIds.has(getProductionProcessTaskId(processKey)))));
    setClearConfirmOpen(false);
    addLog(`已清除当前列表 ${visibleIds.size} 张工单`, 'warning');
  };

  const handleClearTaskFilters = () => {
    setTaskFilterKinds([]);
    setTaskFilterValues({});
  };

  const handleRunTrayTask = (taskId: string) => {
    const targetTask = trayTasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.state !== 'pending') return;

    const occupiedPoints = new Set(
      trayTasks
        .filter((task) => task.state === 'running' && task.id !== taskId)
        .flatMap((task) => [task.pickup, task.dropoff]),
    );
    const conflictPoints = [targetTask.pickup, targetTask.dropoff].filter((point, index, points) => (
      occupiedPoints.has(point) && points.indexOf(point) === index
    ));

    if (conflictPoints.length > 0) {
      addLog(`${taskId} 无法执行，取货点或卸货点 ${conflictPoints.join('、')} 已被执行中 AGV 任务占用`, 'warning');
      return;
    }

    setTrayTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, state: 'running' } : task));
    setTraySlots((prev) => prev.map((slot) => (
      slot.id.padStart(2, '0') === targetTask.dropoff && slot.state === 'empty'
        ? { ...slot, state: 'reserved' }
        : slot
    )));
    addLog(`${taskId} 已执行：${targetTask.pickup} 取货，${targetTask.dropoff} 已预约，等待确认到达`);
  };

  const handleDispatchTrayAgv = (trayCode: string, pickupPoint: string) => {
    if (trayCode === '09' || pickupPoint === trayCode) return;
    const occupiedPoints = new Set(
      trayTasks
        .filter((task) => task.state === 'running')
        .flatMap((task) => [task.pickup, task.dropoff]),
    );
    const conflictPoints = [pickupPoint, trayCode].filter((point, index, points) => (
      occupiedPoints.has(point) && points.indexOf(point) === index
    ));
    if (conflictPoints.length > 0) {
      addLog(`${trayCode} 号托盘 AGV 调度失败，点位 ${conflictPoints.join('、')} 已被执行中任务占用`, 'warning');
      return;
    }

    const targetSlot = traySlots.find((slot) => slot.id.padStart(2, '0') === trayCode);
    const fallbackMaterial = selectedTask ? `${selectedTask.drawingNo}-01` : '0162-01-010101-01';
    const material = targetSlot?.material && targetSlot.material !== '空' ? targetSlot.material : fallbackMaterial;
    const quantity = targetSlot?.quantity && targetSlot.quantity > 0
      ? targetSlot.quantity
      : selectedTask?.quantity && selectedTask.quantity > 0
        ? selectedTask.quantity
        : 1;
    const nextNumber = trayTasks.reduce((max, task) => {
      const numericId = Number(task.id.match(/^AGV-(\d+)$/)?.[1] ?? 0);
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0) + 1;
    const taskId = `AGV-${String(nextNumber).padStart(3, '0')}`;

    setTrayTasks((current) => [{
      id: taskId,
      type: '上料任务',
      mode: '手动',
      material,
      quantity,
      pickup: pickupPoint,
      dropoff: trayCode,
      state: 'running',
    }, ...current]);
    setTraySlots((current) => current.map((slot) => (
      slot.id.padStart(2, '0') === trayCode && slot.state === 'empty'
        ? { ...slot, state: 'reserved' }
        : slot
    )));
    addLog(`${taskId} 已手动调度：${pickupPoint} 取货，${trayCode} 已预约`);
  };

  const handleCompleteTrayTask = (taskId: string) => {
    const targetTask = trayTasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.state !== 'running') return;

    setTrayTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, state: 'done' } : task));
    setTraySlots((prev) => {
      const sourceSlot = prev.find((slot) => slot.id.padStart(2, '0') === targetTask.pickup);
      const sourceHasMaterial = Boolean(sourceSlot && sourceSlot.material !== '空');
      const sourceMaterial = sourceHasMaterial ? sourceSlot.material : targetTask.material;
      const sourceQuantity = sourceHasMaterial ? sourceSlot.quantity : targetTask.quantity;
      return prev.map((slot) => {
        const code = slot.id.padStart(2, '0');
        if (code === targetTask.pickup) {
          return { ...slot, material: '空', quantity: 0, state: 'empty' };
        }
        if (code !== targetTask.dropoff) return slot;
        if (targetTask.type === '空托任务') {
          return { ...slot, material: '空', quantity: 0, state: 'empty-frame' };
        }
        return {
          ...slot,
          material: sourceMaterial || targetTask.material,
          quantity: sourceQuantity || targetTask.quantity,
          state: targetTask.type === '满托任务' ? 'full' : 'loaded',
        };
      });
    });
    addLog(`${taskId} 已确认到达：${targetTask.pickup} 已释放，${targetTask.dropoff} 现场状态已更新`);
  };

  const handleReleaseOccupiedTray = (trayCode: string) => {
    const targetSlot = traySlots.find((slot) => slot.id.padStart(2, '0') === trayCode);
    const canRelease = targetSlot && targetSlot.material !== '空'
      && (targetSlot.state === 'loaded' || targetSlot.state === 'full');
    if (!canRelease) return;

    setTraySlots((prev) => prev.map((slot) => (
      slot.id.padStart(2, '0') === trayCode
        ? { ...slot, material: '空', quantity: 0, state: 'empty-frame' }
        : slot
    )));
    addLog(`${trayCode} 号已占用托盘已释放为空托，等待空托回收任务`);
  };

  const deferLogisticsDemoAfterTrayEdit = () => {
    logisticsDemoEditingRef.current = false;
    logisticsDemoDelayUntilRef.current = Date.now() + productionTrayDemoStepInterval;
  };

  const handleStartTrayCardEdit = (trayCode: string) => {
    const targetSlot = traySlots.find((slot) => slot.id.padStart(2, '0') === trayCode);
    if (!targetSlot || trayCode === '09') return;
    logisticsDemoEditingRef.current = true;
    setEditingTrayCode(trayCode);
  };

  const handleCancelTrayCardEdit = () => {
    setEditingTrayCode(null);
    deferLogisticsDemoAfterTrayEdit();
  };

  const handleSaveTrayCardEdit = (trayCode: string, payload: ProductionTrayCardEditPayload) => {
    const normalizedQuantity = Math.max(1, Math.floor(payload.quantity));
    const normalizedMaterial = payload.material.trim();
    if (!normalizedMaterial || !Number.isFinite(normalizedQuantity)) return;

    setTraySlots((prev) => prev.map((slot) => (
      slot.id.padStart(2, '0') === trayCode
        ? {
            ...slot,
            material: normalizedMaterial,
            quantity: normalizedQuantity,
            state: slot.state === 'full' ? 'full' : 'loaded',
          }
        : slot
    )));
    setTrayTasks((prev) => prev.map((task) => (
      task.pickup === trayCode && task.type !== '空托任务' && task.state !== 'done'
        ? { ...task, material: normalizedMaterial, quantity: normalizedQuantity }
        : task
    )));
    setEditingTrayCode(null);
    deferLogisticsDemoAfterTrayEdit();
    addLog(`${trayCode} 号托盘已更新：${normalizedMaterial} ×${normalizedQuantity}，Demo 节奏顺延`);
  };

  const handleCreateTrayTask = () => {
    setTrayTasks((prev) => {
      const nextNumber = prev.reduce((max, task) => {
        const numericId = Number(task.id.match(/^AGV-(\d+)$/)?.[1] ?? 0);
        return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
      }, 0) + 1;
      const taskId = `AGV-${String(nextNumber).padStart(3, '0')}`;
      const fallbackQuantity = selectedTask?.quantity && selectedTask.quantity > 0 ? selectedTask.quantity : 1;
      return [
        {
          id: taskId,
          type: '上料任务',
          mode: '手动',
          material: selectedTask ? `${selectedTask.drawingNo}-01` : '0162-01-010101-01',
          quantity: fallbackQuantity,
          pickup: '00',
          dropoff: '01',
          state: 'pending',
        },
        ...prev,
      ];
    });
    addLog('已新增 AGV 调度任务行');
  };

  const handleUpdateTrayTask = (taskId: string, updates: Partial<TrayTask>) => {
    setTrayTasks((prev) => prev.map((task) => {
      if (task.id !== taskId) return task;
      const nextTask = { ...task, ...updates };
      if (updates.type === '空托任务') {
        nextTask.material = '';
      }
      if ((updates.type === '上料任务' || updates.type === '满托任务') && !nextTask.material) {
        nextTask.material = selectedTask ? `${selectedTask.drawingNo}-01` : '0162-01-010101-01';
      }
      return nextTask;
    }));
    addLog(`${taskId} AGV 任务信息已更新`);
  };

  const handleDeleteTrayTask = (taskId: string) => {
    setTrayTasks((prev) => prev.filter((task) => task.id !== taskId));
    addLog(`${taskId} AGV 任务已删除`, 'warning');
  };

  const handleArchiveTrayTask = (taskId: string) => {
    const targetTask = trayTasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.state !== 'done' || targetTask.archived) return;
    setTrayTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, archived: true } : task));
    addLog(`${taskId} AGV 任务已归档，可在历史任务中查看`);
  };

  const handleRestoreTrayTask = (taskId: string) => {
    const targetTask = trayTasks.find((task) => task.id === taskId);
    if (!targetTask?.archived) return;
    setTrayTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, archived: false } : task));
    addLog(`${taskId} AGV 任务已从历史任务恢复`);
  };

  const handleRunPlanTrayTask = (slot: TrayAllocation, workOrderNo?: string) => {
    const planMaterials = slot.materials.length > 0
      ? slot.materials
      : slot.partName
        ? [{ partName: slot.partName, partNo: slot.partNo, count: slot.count }]
        : [];
    if (planMaterials.length === 0) return;

    const materialNames = planMaterials.map((material) => material.partName);
    const taskMaterial = materialNames.join(' / ');
    const taskQuantity = planMaterials.reduce((sum, material) => sum + material.count, 0);
    const matchingTasks = trayTasks.filter((task) => (
      !task.archived
      && task.type === '上料任务'
      && task.dropoff === slot.code
      && (!workOrderNo || task.workOrderNo === workOrderNo)
      && (materialNames.includes(task.material) || materialNames.every((materialName) => task.material.includes(materialName)))
    ));
    const existingTask = matchingTasks.find((task) => task.state === 'running')
      ?? matchingTasks.find((task) => task.state === 'pending')
      ?? matchingTasks.find((task) => task.state === 'done');
    if (existingTask?.state === 'running' || existingTask?.state === 'done') return;

    const occupiedPoints = new Set(
      trayTasks
        .filter((task) => task.state === 'running' && task.id !== existingTask?.id)
        .flatMap((task) => [task.pickup, task.dropoff]),
    );
    const conflictPoints = ['00', slot.code].filter((point, index, points) => (
      occupiedPoints.has(point) && points.indexOf(point) === index
    ));
    if (conflictPoints.length > 0) {
      addLog(`${slot.code} 号托盘无法执行，点位 ${conflictPoints.join('、')} 已被执行中 AGV 任务占用`, 'warning');
      return;
    }

    const nextNumber = trayTasks.reduce((max, task) => {
      const numericId = Number(task.id.match(/^AGV-(\d+)$/)?.[1] ?? 0);
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0) + 1;
    const taskId = existingTask?.id ?? `AGV-${String(nextNumber).padStart(3, '0')}`;
    setTrayTasks((prev) => existingTask
      ? prev.map((task) => task.id === existingTask.id
        ? {
          ...task,
          mode: '自动',
          material: taskMaterial,
          quantity: taskQuantity,
          pickup: '00',
          dropoff: slot.code,
          state: 'running',
        }
        : task)
      : [
        {
          id: taskId,
          workOrderNo,
          type: '上料任务',
          mode: '自动',
          material: taskMaterial,
          quantity: taskQuantity,
          pickup: '00',
          dropoff: slot.code,
          state: 'running',
        },
        ...prev,
      ]);
    setTraySlots((prev) => prev.map((traySlot) => (
      traySlot.id.padStart(2, '0') === slot.code && traySlot.state === 'empty'
        ? { ...traySlot, state: 'reserved' }
        : traySlot
    )));
    addLog(`${taskId} 已从理料区执行：00 取货，${slot.code} 已预约，等待确认到达`);
  };

  // 工位详情自动执行起点：当前查看工位没有该任务启用工序时，不允许从该工位启动自动执行。
  const viewedStationStartProcessId = (() => {
    if (!selectedTask || !selectedDebugStationSnapshot) return null;
    const enabledProcessIds = getEnabledTaskProcessIds(selectedTask.id, selectedTask.processIds, disabledProcessKeys);
    const taskProcesses = selectedTask.processIds
      .map((processId) => getProcessFromOptions(processId, activeProcessOptions))
      .filter((process): process is ProcessOption => Boolean(process));
    return resolveStationStartProcessId(selectedDebugStationSnapshot.stationId, enabledProcessIds, taskProcesses);
  })();
  const stationStartUnavailable = Boolean(selectedTask && selectedDebugStationSnapshot && !viewedStationStartProcessId);
  const canRun = Boolean(selectedTask && selectedTask.state !== 'stopped' && selectedTask.state !== 'done' && selectedTask.state !== 'abnormal') && !stationStartUnavailable;
  const canInitialize = Boolean(
    selectedTask
    && selectedTask.state !== 'running'
    && selectedTask.state !== 'paused'
    && selectedTask.state !== 'done'
    && selectedTask.state !== 'abnormal',
  );
  const canExecuteStep = Boolean(
    selectedTask
    && (selectedTask.state === 'running' || selectedTask.state === 'paused')
    && !selectedTask.workpieces.some((workpiece) => workpiece.state === 'abnormal')
    && (executionMode !== 'manual' || Boolean(selectedDebugStationSnapshot?.process)),
  );
  const handleExecutionStart = (mode: ProductionDebugExecutionMode, stationId: string) => {
    setActiveExecutionMode(mode);
    setActiveExecutionStationId(stationId || (detailTarget.kind === 'station' ? detailTarget.stationId : null));
  };
  const handleExecutionPause = () => {
    // 仅暂停任务，不释放执行会话（mode + stationId 保持），这样暂停期间其他工位仍被锁定。
    if (selectedTask?.state === 'running') {
      handleRunOrPause();
    }
  };
  const handleExecutionStop = () => {
    // 停止当前自动/单步执行会话：任务置为 stopped，释放 mode + stationId，之后可初始化。
    if (!selectedTask) return;
    updateSelectedTask((task) => ({
      ...task,
      state: 'stopped',
      currentProcess: '已停止，需初始化后重新执行',
    }));
    setActiveExecutionMode(null);
    setActiveExecutionStationId(null);
    addLog(`${selectedTask.drawingNo} 单步/自动执行已停止，需初始化后重新执行`, 'warning');
  };
  const handleMainRunOrPause = () => {
    if (selectedTask?.state === 'running') {
      handleRunOrPause();
      return;
    }
    handleExecutionStart('auto', detailTarget.kind === 'station' ? detailTarget.stationId : '');
    handleRunOrPause();
  };
  useEffect(() => {
    // 只在任务进入终态或非活跃态时释放执行会话，running/paused/ready 保持锁定。
    if (activeExecutionMode && ['stopped', 'done', 'abnormal', 'draft'].includes(selectedTask?.state ?? '')) {
      setActiveExecutionMode(null);
      setActiveExecutionStationId(null);
    }
  }, [activeExecutionMode, selectedTask?.state]);
  const activeExecutionStationIdForPanel = activeExecutionMode === 'auto'
    ? (getActiveWorkbenchProcessId(selectedTask)
      ? productionWorkbenchProcessPlacements[getActiveWorkbenchProcessId(selectedTask) ?? '']?.areaId ?? null
      : null)
    : activeExecutionStationId;
  const handleSelectTask = (taskId: string) => {
    const activeExecutionTask = tasks.find((task) => ['running', 'paused', 'abnormal'].includes(task.state));
    if (activeExecutionTask && activeExecutionTask.id !== taskId) return;
    setSelectedTaskId(taskId);
    setSelectedProcessId(null);
  };
  const handleSelectProcess = (processId: string) => {
    setSelectedProcessId((current) => (current === processId ? null : processId));
    setActiveTab('model');
  };

  if (trayManagementOpen) {
    return (
      <TrayManagementPage
        traySlots={traySlots}
        trayTasks={trayTasks}
        selectedTask={selectedTask}
        pendingWorkOrders={pendingWorkOrders}
        onCreateTask={handleCreateTrayTask}
        onUpdateTrayTask={handleUpdateTrayTask}
        onClose={() => setTrayManagementOpen(false)}
        onRunTrayTask={handleRunTrayTask}
        onRunPlanTrayTask={handleRunPlanTrayTask}
        onCompleteTrayTask={handleCompleteTrayTask}
        onArchiveTrayTask={handleArchiveTrayTask}
        onRestoreTrayTask={handleRestoreTrayTask}
        onDeleteTrayTask={handleDeleteTrayTask}
        onReleaseOccupiedTray={handleReleaseOccupiedTray}
      />
    );
  }

  const floatingControls = (
    <FloatingWorkspaceControls
      activeTab={activeTab}
      trayManagementOpen={trayManagementOpen}
      selectedTask={selectedTask}
      canRun={canRun}
      onTabChange={setActiveTab}
      onOpenTrayManagement={() => setTrayManagementOpen(true)}
      onInitialize={handleInitialize}
    onRunOrPause={handleMainRunOrPause}
      onRequestStop={() => setStopConfirmOpen(true)}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-ds-bg-viewport">
      {contextHolder}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)_420px]">
          <div className="h-full min-h-0 overflow-hidden">
            {leftPanel === 'v1' ? (
              <ProductionTaskTreePanel1
                tasks={tasks}
                filteredTasks={filteredTasks}
                processes={activeProcessOptions}
                selectedTaskId={selectedTaskId}
                selectedProcessId={selectedProcessId}
                selectedTaskIds={selectedTaskIds}
                disabledProcessKeys={disabledProcessKeys}
                hoveredTaskId={hoveredTaskId}
                visibleProcessIdsByTask={visibleProcessIdsByTask}
                batchMode={taskBatchMode}
                filterOpen={taskFilterOpen}
                filterActive={taskFilterActive}
                filterKinds={taskFilterKinds}
                filterValues={taskFilterValues}
                filterValueOptions={taskFilterValueOptions}
                allVisibleSelected={allVisibleTasksSelected}
                canCreateTask={canCreateTask}
                onSelectTask={handleSelectTask}
                onSelectProcess={handleSelectProcess}
                onCreateTask={handleRequestCreateTask}
                onToggleTaskSelection={handleToggleTaskSelection}
                onToggleBatchMode={() => {
                  setTaskBatchMode((enabled) => !enabled);
                  setSelectedTaskIds(new Set());
                }}
                onSelectAllVisible={handleSelectAllVisibleTasks}
                onToggleProcessDisabled={handleToggleProcessDisabled}
                onDisableSelection={handleDisableSelectedTasks}
                onClearVisibleTasks={handleRequestClearVisibleTasks}
                onToggleFilter={() => setTaskFilterOpen((open) => !open)}
                onFilterKindsChange={setTaskFilterKinds}
                onFilterValueChange={(kind, nextValues) => setTaskFilterValues((prev) => ({ ...prev, [kind]: nextValues }))}
                onClearFilters={handleClearTaskFilters}
                onHoverTaskChange={setHoveredTaskId}
              />
            ) : (
              <ProductionTaskTreePanel2
                filteredTasks={filteredTasks}
                processes={activeProcessOptions}
                selectedTaskId={selectedTaskId}
                selectedTaskIds={selectedTaskIds}
                disabledProcessKeys={disabledProcessKeys}
                visibleProcessIdsByTask={visibleProcessIdsByTask}
                batchMode={taskBatchMode}
                filterOpen={taskFilterOpen}
                filterActive={taskFilterActive}
                filterKinds={taskFilterKinds}
                filterValues={taskFilterValues}
                filterValueOptions={taskFilterValueOptions}
                displayableProcessCount={displayableProcessCount}
                canCreateTask={canCreateTask}
                onSelectTask={handleSelectTask}
                onReorderTask={handleReorderTask}
                onRequestDeleteTask={handleRequestDeleteTask}
                onCreateTask={handleRequestCreateTask}
                onToggleTaskSelection={handleToggleTaskSelection}
                onClearVisibleTasks={handleRequestClearVisibleTasks}
                onToggleFilter={() => setTaskFilterOpen((open) => !open)}
                onFilterKindsChange={setTaskFilterKinds}
                onFilterValueChange={(kind, nextValues) => setTaskFilterValues((prev) => ({ ...prev, [kind]: nextValues }))}
                onClearFilters={handleClearTaskFilters}
                onRequestDeleteWorkpiece={handleRequestDeleteWorkpiece}
                onDoubleClickProcess={handleVisionDemoProcessDoubleClick}
              />
            )}
          </div>
          <div className="min-h-0 border-r border-slate-200/75">
            {activeTab === 'vision' ? (
              <VisionMonitorView
                controls={floatingControls}
                  abnormalWorkpiece={visionAbnormalWorkpiece}
                  positioningResult={activePositioningResult}
                  activeFeedId={activeVisionFeedId}
                  visionDemoTarget={visionDemoTarget}
                  onSelectFeed={handleVisionFeedSelect}
              />
            ) : activeTab === 'model' ? (
              <ProductionModelViewport
                logs={logs}
                logMinimized={logMinimized}
                onToggleLogMinimized={setLogMinimized}
                controls={floatingControls}
                task={selectedTask}
                selectedProcessId={selectedProcessId}
                relatedPartIds={relatedPartIds}
                onDeselectProcess={() => setSelectedProcessId(null)}
              />
            ) : (
              <ProductionViewport
                task={selectedTask}
                traySlots={traySlots}
                trayTasks={trayTasks}
                logs={logs}
                logMinimized={logMinimized}
                onToggleLogMinimized={setLogMinimized}
                controls={floatingControls}
                onStationSelect={(stationId) => setDetailTarget({ kind: 'station', stationId })}
                onTraySelect={(trayCode) => setDetailTarget({ kind: 'tray', trayCode })}
                editingTrayCode={editingTrayCode}
                onStartTrayCardEdit={handleStartTrayCardEdit}
                onCancelTrayCardEdit={handleCancelTrayCardEdit}
                onSaveTrayCardEdit={handleSaveTrayCardEdit}
              />
            )}
          </div>
          <div className="h-full min-h-0 overflow-hidden">
            {rightPanel === 'task-status' ? (
              <TaskStatusMonitorPanel
                task={selectedTask}
                processes={activeProcessOptions}
                disabledProcessIds={selectedTaskDisabledProcessIds}
                onOpenVision={() => setActiveTab('vision')}
                onClearAbnormal={handleClearWorkpieceAbnormal}
              />
            ) : activeTab === 'vision' ? (
              activePositioningResult ? (
                <VisionPositionResultPanel
                  result={activePositioningResult}
                  onClose={() => setActivePositioningResultKey(null)}
                />
              ) :
              visionCalibrationOpen && visionAbnormalWorkpiece ? (
                <VisionExceptionDemoPanel
                  feed={visionFeedOptions.find((feed) => feed.id === activeVisionFeedId) ?? visionFeedOptions[0]}
                  transportPanelMode={visionDemoTarget === 'grab' ? 'grab' : 'all'}
                  demoWorkpieceCode={visionDemoTarget === 'grab' || visionDemoTarget === 'gantry-grab'
                    ? visionGrabWorkpieceCode
                    : (visionFeedOptions.find((feed) => feed.id === activeVisionFeedId)?.exceptionKind === 'transport' ? visionAssemblyWorkpieceCode : undefined)}
                  currentTaskLabel={(visionDemoTarget === 'grab' || visionDemoTarget === 'gantry-grab') && visionGrabTaskLabel ? visionGrabTaskLabel : visionAbnormalTaskName}
                  onSkip={() => handleResolveVisionAbnormal('skipped')}
                  onConfirm={() => handleResolveVisionAbnormal('confirmed')}
                  onClose={() => setVisionCalibrationOpen(false)}
                />
              ) : (
                <div className="flex h-full min-h-0 flex-col border-l border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel backdrop-blur-sm">
                  <div className="flex h-9 shrink-0 items-center border-b border-ds-border-process-planning-structure bg-transparent px-3">
                    <div className="text-xs font-medium text-slate-500">异常处理</div>
                  </div>
                  <div className="min-h-0 flex-1 p-3">
                    <PanelEmptyState
                      icon={AlertTriangle}
                      label={visionAbnormalWorkpiece ? '切换到红色异常相机以打开处理面板' : '暂无视觉异常'}
                    />
                  </div>
                </div>
              )
            ) : (
              <SingleStepDebugPanel
                stations={debugStations}
                snapshot={selectedDebugStationSnapshot}
                traySnapshot={selectedTrayStationSnapshot}
                executionMode={executionMode}
                activeExecutionMode={activeExecutionMode}
                activeExecutionStationId={activeExecutionStationIdForPanel}
                taskState={selectedTask?.state ?? null}
                canInitialize={canInitialize}
                canStart={canRun}
                startDisabledReason={stationStartUnavailable ? '当前工位没有可执行的工序' : undefined}
                canExecuteStep={canExecuteStep}
                positioningResultKeysByWorkstep={positioningResultKeysByWorkstep}
                onViewPositioningResult={handleViewPositioningResult}
                onExecutionModeChange={setExecutionMode}
                onExecutionStart={handleExecutionStart}
                onExecutionPause={handleExecutionPause}
                onExecutionStop={handleExecutionStop}
                onInitialize={handleInitialize}
                onRunOrPause={() => handleRunOrPause(selectedDebugStationSnapshot?.stationId)}
                onExecuteStep={handleExecuteStep}
                onEditTrayMaterial={handleStartTrayCardEdit}
                onDispatchTrayAgv={handleDispatchTrayAgv}
                onManualCommand={addLog}
              />
            )}
          </div>
        </div>
      </div>

      <DeviceStatusFooter />

      <NewTaskDialog
        open={newTaskOpen}
        drafts={pendingDrafts}
        selectedDraftId={pendingSelectedDraftId}
        selectedDraftIds={pendingSelectedDraftIds}
        onClose={() => setNewTaskOpen(false)}
        onConfirm={handleCreateTasks}
        onDraftsChange={setPendingDrafts}
        onSelectedDraftIdChange={setPendingSelectedDraftId}
        onSelectedDraftIdsChange={setPendingSelectedDraftIds}
        onConfiguredDraftsChange={setPendingWorkOrders}
        onNextDraftSequence={allocateDraftSequence}
        existingWorkOrderNos={Array.from(new Set(tasks.map((task) => task.workOrderNo)))}
      />

      {positioningDialogTarget && (
        <PositioningChoiceDialog
          locating={positioningDialogLocateState === 'loading'}
          locateSucceeded={positioningDialogLocateState === 'success'}
          importStatus={positioningDialogImportStatus}
          onExecutePositioning={handleExecutePositioning}
          onImportPosition={handleImportPosition}
          onViewResult={() => handleViewPositioningResult(positioningDialogTarget.key)}
          onClose={() => setPositioningDialogTarget(null)}
        />
      )}

      {stopConfirmOpen && selectedTask && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">确认停止任务</span>
            </div>
            <div className="px-5 py-4 text-sm leading-6 text-slate-600">
              停止后当前任务需要重新初始化才能执行。是否停止 {selectedTask.drawingNo}？
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setStopConfirmOpen(false)}>取消</Button>
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={handleStop}>确认停止</Button>
            </div>
          </div>
        </div>
      )}

      {clearConfirmOpen && filteredTasks.length > 0 && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4">
          <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <span className="text-sm font-medium">确认清除当前排单</span>
            </div>
            <div className="px-5 py-4 text-sm leading-6 text-slate-600">
              当前筛选后可见的 {filteredTasks.length} 张工单将从生产执行列表移出，不会删除工艺规划数据。是否继续？
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <Button size="sm" variant="outline" onClick={() => setClearConfirmOpen(false)}>取消</Button>
              <Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={handleClearVisibleTasks}>确认清除</Button>
            </div>
          </div>
        </div>
      )}

      {workOrderDeleteTargetId && (() => {
        const task = tasks.find((item) => item.id === workOrderDeleteTargetId);
        if (!task) return null;
        return (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4">
            <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
                <AlertTriangle className="size-5 text-red-500" />
                <span className="text-sm font-medium">确认删除工单</span>
              </div>
              <div className="px-5 py-4 text-sm leading-6 text-slate-600">
                是否确认删除工单 {task.workOrderNo}？删除后将从当前排单移出，不会删除工艺规划数据。
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
                <Button size="sm" variant="outline" onClick={() => setWorkOrderDeleteTargetId(null)}>取消</Button>
                <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={handleDeleteTask}>确认删除</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {workpieceDeleteTarget && (() => {
        const task = tasks.find((item) => item.id === workpieceDeleteTarget.taskId);
        const workpiece = task?.workpieces.find((item) => item.id === workpieceDeleteTarget.workpieceId);
        if (!task || !workpiece) return null;
        return (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4">
            <div className="w-[420px] rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
                <AlertTriangle className="size-5 text-red-500" />
                <span className="text-sm font-medium">确认删除工件</span>
              </div>
              <div className="px-5 py-4 text-sm leading-6 text-slate-600">
                是否确认删除 {formatProductionWorkpieceSerial(workpiece.serial)}？删除后工单加工数量将从 {task.quantity} 件减少为 {task.quantity - 1} 件。
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
                <Button size="sm" variant="outline" onClick={() => setWorkpieceDeleteTarget(null)}>取消</Button>
                <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={handleDeleteWorkpiece}>确认删除</Button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
