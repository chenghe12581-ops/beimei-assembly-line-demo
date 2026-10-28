import { useEffect, useState } from 'react';
import { Circle, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Tooltip } from 'antd';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { PanelEmptyState } from '../ui/panel-empty-state';
import {
  ProductionManualControlPanel,
  type ProductionManualControlTarget,
} from './ProductionManualControlPanel';
import {
  getProductionStationDisplayStatus,
  getProductionStationStatusLabel,
  type ProductionStationStatus,
} from './ProductionStationCard';
import type {
  ProcessOption,
  ProductionTaskState,
  WorkpieceState,
} from './ProductionTaskTreePanel1';
import { formatProductionWorkpieceSerial } from './ProductionTaskTreePanel2';
import { HierarchicalWorkstepList, type HierarchicalWorkstepGroup } from './HierarchicalWorkstepList';

export type ProductionDebugExecutionMode = 'auto' | 'single-step' | 'manual';

export type ProductionDebugStation = {
  id: string;
  name: string;
  status: ProductionDebugStationStatus;
  processName?: string;
  workpieceSerial?: string;
};

export type ProductionDebugStationStatus = ProductionStationStatus;

export type ProductionDebugStationSnapshot = {
  stationId: string;
  stationName: string;
  taskName: string | null;
  taskState: ProductionTaskState | null;
  workpieceSerial: string | null;
  workpieceOrder?: number | null;
  // 空闲工位演示态使用的装配体级工件标签，如 0162-01-010101（1）
  demoWorkpieceLabel?: string | null;
  workpieceState: WorkpieceState | null;
  workpieceProgress: number | null;
  process: ProcessOption | null;
  partName: string | null;
  quantity: number;
  workstepNames: string[];
  workstepGroups?: HierarchicalWorkstepGroup[];
  currentWorkstepIndex: number;
  compositeStation?: {
    id: string;
    name: string;
    stations: Array<{ stationId: string; stationName: string }>;
    activeStationId: string;
  } | null;
};

export type ProductionTrayStationSnapshot = {
  trayCode: string;
  stationName: string;
  stateLabel: string;
  material: string | null;
  quantity: number;
};

type SingleStepDebugPanelProps = {
  stations: ProductionDebugStation[];
  snapshot: ProductionDebugStationSnapshot | null;
  traySnapshot?: ProductionTrayStationSnapshot | null;
  executionMode: ProductionDebugExecutionMode;
  canInitialize: boolean;
  canStart: boolean;
  startDisabledReason?: string;
  canExecuteStep: boolean;
  taskState: ProductionTaskState | null;
  /** 整线执行会话中：单站控制条互锁置灰。 */
  lineLocked?: boolean;
  /** 单站执行会话模式（无单站会话时为 null）。 */
  stationSessionMode?: 'auto' | 'single-step' | null;
  /** 单站执行会话占用工位（无单站会话时为 null）。 */
  stationSessionStationId?: string | null;
  /** 进度所在工位（v3 进度续跑）：当前工单记住的 { 工位, 工步 }。 */
  breakpointStationId?: string | null;
  /** 进度工步被「异常中断」标记为异常时的工步索引（用于工步列表红色徽标）。 */
  breakpointErrorIndex?: number | null;
  onExecutionPause?: () => void;
  onExecutionModeChange: (mode: ProductionDebugExecutionMode) => void;
  onInitialize: () => void;
  onRunOrPause: (stationId: string | undefined, side: 'line' | 'station', mode: 'auto' | 'single-step') => void;
  /** 请求单步执行选中工步（页面级先做跳选前序校验，必要时弹前序非完成提示）。 */
  onRequestExecuteStep?: (workstepIndex: number) => void;
  onExecuteStep: (workstepIndex: number) => void;
  positioningResultKeysByWorkstep?: Record<number, string>;
  onViewPositioningResult?: (key: string) => void;
  onEditTrayMaterial?: (trayCode: string) => void;
  onDispatchTrayAgv?: (trayCode: string, pickupPoint: string) => void;
  onManualCommand?: (message: string) => void;
  /** 单步模式下选中工位工步的回调：用于模型视图联动（如贴板焊接工步的焊缝时序视图）。 */
  onSelectedWorkstepChange?: (workstepIndex: number) => void;
};

const modeOptions: Array<{
  id: ProductionDebugExecutionMode;
  label: string;
  description: string;
}> = [
  { id: 'auto', label: '自动', description: '自动顺序执行工序内工步' },
  { id: 'single-step', label: '单步', description: '单次执行一个工步' },
  { id: 'manual', label: '手动', description: '手动控制当前工位设备' },
];

function getStatusTone(snapshot: ProductionDebugStationSnapshot | null, demoExecuting = false) {
  const status: ProductionStationStatus = demoExecuting && !snapshot?.process
    ? 'running'
    : !snapshot?.process
    ? 'idle'
    : snapshot.workpieceState === 'abnormal'
      ? 'abnormal'
      : snapshot.taskState === 'paused' || snapshot.workpieceState === 'paused'
      ? 'paused'
      : 'running';
  const displayStatus = getProductionStationDisplayStatus(status);
  if (displayStatus === 'idle') {
    return { label: getProductionStationStatusLabel(status), dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-400' };
  }
  if (displayStatus === 'paused') {
    return { label: getProductionStationStatusLabel(status), dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' };
  }
  if (displayStatus === 'abnormal') {
    return { label: getProductionStationStatusLabel(status), dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' };
  }
  return { label: getProductionStationStatusLabel(status), dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
}

function getTrayStatusTone(snapshot: ProductionTrayStationSnapshot) {
  if (snapshot.stateLabel === '已占用') {
    return { label: snapshot.stateLabel, dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
  }
  if (snapshot.stateLabel === '已预约') {
    return { label: snapshot.stateLabel, dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' };
  }
  if (snapshot.stateLabel === '空托') {
    return { label: snapshot.stateLabel, dot: 'bg-zinc-400', badge: 'bg-zinc-100 text-zinc-600' };
  }
  return { label: snapshot.stateLabel, dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-400' };
}

function getTaskStateLabel(state: ProductionTaskState | null) {
  if (state === 'draft') return '待初始化';
  if (state === 'ready') return '就绪';
  if (state === 'running') return '加工中';
  if (state === 'paused') return '暂停';
  if (state === 'stopped') return '异常中断';
  if (state === 'done') return '已完成';
  if (state === 'abnormal') return '异常';
  return '暂无任务';
}

export function SingleStepDebugPanel({
  stations,
  snapshot,
  traySnapshot = null,
  executionMode,
  canInitialize,
  canStart,
  startDisabledReason,
  canExecuteStep,
  taskState,
  lineLocked = false,
  stationSessionMode = null,
  stationSessionStationId = null,
  breakpointStationId = null,
  breakpointErrorIndex = null,
  onExecutionPause,
  onExecutionModeChange,
  onInitialize,
  onRunOrPause,
  onRequestExecuteStep,
  onExecuteStep,
  positioningResultKeysByWorkstep = {},
  onViewPositioningResult,
  onEditTrayMaterial,
  onDispatchTrayAgv,
  onManualCommand,
  onSelectedWorkstepChange,
}: SingleStepDebugPanelProps) {
  const [selectedWorkstepIndex, setSelectedWorkstepIndex] = useState(0);
  const handleSelectWorkstep = (index: number) => {
    setSelectedWorkstepIndex(index);
    onSelectedWorkstepChange?.(index);
  };
  const [demoExecutingWorkstepIndex, setDemoExecutingWorkstepIndex] = useState<number | null>(null);
  const selectedMode = modeOptions.find((option) => option.id === executionMode) ?? modeOptions[0];
  const isRunning = taskState === 'running';
  const isPaused = taskState === 'paused';
  const isStopped = taskState === 'stopped';
  const workstepNames = snapshot?.workstepNames ?? [];
  const workstepGroups = snapshot?.workstepGroups ?? [{ id: 'station-worksteps', label: '工位工步', steps: workstepNames.map((name, index) => ({ name, index })) }];
  const hasWorksteps = workstepNames.length > 0;
  const stationHasRunningWorkstep = Boolean(
    (snapshot?.process && snapshot.workpieceState === 'running')
    || (!snapshot?.process && demoExecutingWorkstepIndex !== null),
  );
  // 互锁派生：整线会话中整组置灰；单站会话占用其他工位时整组置灰；本会话工位内模式互斥。
  const sessionHere = Boolean(stationSessionStationId && stationSessionStationId === snapshot?.stationId);
  const otherStationLocked = Boolean(stationSessionStationId) && !sessionHere;
  const barLocked = lineLocked || otherStationLocked;
  const crossModeLock = Boolean(sessionHere && stationSessionMode && stationSessionMode !== executionMode);
  const sessionActive = lineLocked || Boolean(stationSessionStationId);
  const isIdle = !taskState || taskState === 'ready' || taskState === 'draft';
  // 初始化（仅自动 tab）：会话存在期间（running / paused）始终禁点。
  const canInitControl = canInitialize && !sessionActive;
  // 自动执行：空闲 / 异常中断态可启动；暂停（软暂停停住）后可恢复继续。
  const canRunControl = (isIdle || isPaused || isStopped) && canStart && !barLocked && !crossModeLock && (!sessionHere || stationSessionMode === executionMode);
  // 单步执行（v3 单步 tab 唯一按钮）：仅空闲 / 异常中断态可点；暂停态（任务停住等待恢复）禁点，回自动 tab 恢复。
  const canStepRunControl = (isIdle || isStopped) && canStart && !barLocked && !crossModeLock && (!sessionHere || stationSessionMode === executionMode) && demoExecutingWorkstepIndex === null;
  const canPauseControl = isRunning && !barLocked && (!sessionHere || stationSessionMode === executionMode);
  const singleStepExecutionActive = stationSessionMode === 'single-step'
    && sessionHere
    && stationHasRunningWorkstep;
  // v3：自动执行会话中不允许单步选择其他工步——单步 tab 仅可查看，工步列表禁选。
  const workstepSelectionLocked = singleStepExecutionActive
    || Boolean(sessionHere && stationSessionMode === 'auto')
    || lineLocked;
  const workpieceDisplaySerial = snapshot?.workpieceSerial
    ? formatProductionWorkpieceSerial(snapshot.workpieceSerial)
    : null;
  const manualControlTarget: ProductionManualControlTarget | null = traySnapshot
    ? {
        kind: 'tray',
        trayCode: traySnapshot.trayCode,
        stationName: traySnapshot.stationName,
        material: traySnapshot.material,
        quantity: traySnapshot.quantity,
        stateLabel: traySnapshot.stateLabel,
      }
    : snapshot
      ? snapshot.compositeStation
        ? {
            kind: 'station-group',
            groupName: snapshot.compositeStation.name,
            stations: snapshot.compositeStation.stations,
            activeStationId: snapshot.compositeStation.activeStationId,
          }
        : { kind: 'station', stationId: snapshot.stationId, stationName: snapshot.stationName }
      : null;
  const statusTone = traySnapshot
    ? getTrayStatusTone(traySnapshot)
    : getStatusTone(snapshot, demoExecutingWorkstepIndex !== null);

  useEffect(() => {
    if (!hasWorksteps) {
      setSelectedWorkstepIndex(0);
      return;
    }
    const defaultIndex = snapshot?.process ? snapshot.currentWorkstepIndex : 0;
    setSelectedWorkstepIndex(Math.min(Math.max(defaultIndex, 0), workstepNames.length - 1));
  }, [hasWorksteps, snapshot?.stationId, snapshot?.process?.id, snapshot?.currentWorkstepIndex, workstepNames.join('|')]);

  useEffect(() => {
    setDemoExecutingWorkstepIndex(null);
  }, [snapshot?.stationId, snapshot?.process?.id]);

  const executionControls = !traySnapshot && executionMode !== 'manual' ? (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200/80 bg-white/55 p-2">
      <div className="min-w-0">
        <div className="truncate whitespace-nowrap text-xs font-medium text-slate-600">{selectedMode.description}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {executionMode === 'single-step' ? (
          // v3：单步 tab 仅保留「执行工步」一个按钮——无初始化、无暂停；执行状态由工步列表回显。
          <Tooltip title={barLocked ? (lineLocked ? '整线正在执行，暂不可操作' : '当前工位正在执行，暂不可操作') : crossModeLock ? `当前为${stationSessionMode === 'auto' ? '自动' : '单步'}执行会话，暂不可操作` : isPaused ? '任务已暂停（当前工步已执行完）；请切换到自动模式恢复执行' : singleStepExecutionActive ? '工步执行中，请稍候' : canStepRunControl ? '执行选中工步' : '当前不可执行工步'}>
            <span>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                disabled={!canStepRunControl}
                onClick={() => {
                  if (snapshot?.process) {
                    // v3：不再弹单步确认弹窗；页面先做跳选前序校验，必要时弹前序非完成提示。
                    onRequestExecuteStep?.(selectedWorkstepIndex);
                  } else {
                    setDemoExecutingWorkstepIndex(selectedWorkstepIndex);
                    onExecuteStep(selectedWorkstepIndex);
                  }
                }}
              >
                <SkipForward className="size-3.5" />
                执行工步
              </Button>
            </span>
          </Tooltip>
        ) : (
          <>
            <Tooltip title={sessionActive ? '执行中不可初始化' : canInitControl ? '初始化任务' : '当前任务不可初始化'}>
              <span>
                <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" disabled={!canInitControl} onClick={onInitialize}>
                  <RotateCcw className="size-3.5" />
                  初始化
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={barLocked ? (lineLocked ? '整线正在执行，暂不可操作' : '当前工位正在执行，暂不可操作') : crossModeLock ? `当前为${stationSessionMode === 'auto' ? '自动' : '单步'}执行会话，暂不可操作` : !canStart && startDisabledReason ? startDisabledReason : canPauseControl ? '点击暂停：当前工步执行完后停住' : canRunControl ? (isPaused ? '点击继续自动执行' : '点击开始自动执行') : '当前不可自动执行'}>
              <span>
                <Button type="button" size="sm" className="h-8 gap-1 px-2 text-xs" disabled={!canRunControl && !canPauseControl} onClick={() => {
                  if (canPauseControl) {
                    onExecutionPause?.();
                  } else if (canRunControl) {
                    onRunOrPause(snapshot?.stationId, 'station', 'auto');
                  }
                }}>
                  {canPauseControl ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  {canPauseControl ? '暂停' : isPaused ? '继续' : '自动执行'}
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 border-l border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel shadow-none backdrop-blur-sm">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-ds-border-process-planning-structure bg-transparent px-3 py-0">
        <CardTitle className="text-xs font-medium text-ds-text-control">工位详情</CardTitle>
        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${statusTone.badge}`}>
          <span className={`size-1.5 rounded-full ${statusTone.dot}`} />
          {statusTone.label}
        </span>
      </div>
      <div className="shrink-0 border-b border-ds-border-process-planning-structure px-3 py-2">
        <div className="mb-1.5 text-xs font-medium text-ds-text-muted">执行模式</div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-ds-bg-segmented p-0.5" role="group" aria-label="执行模式">
          {modeOptions.map((option) => {
            const selected = option.id === executionMode;
            const disabled = false;
            return (
              <Tooltip
                key={option.id}
                title={option.description}
              >
                <button
                  type="button"
                  className={`flex h-8 items-center justify-center gap-1 rounded-md px-3 text-sm font-medium transition-colors ${disabled ? 'cursor-not-allowed text-slate-300' : selected ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}
                  aria-pressed={selected}
                  onClick={() => onExecutionModeChange(option.id)}
                >
                  {option.label}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 !pb-3">
        {stations.length === 0 && !traySnapshot ? (
          <PanelEmptyState label="暂无可见工位" />
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-ds-border-default bg-white/72 px-2.5 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-700">{traySnapshot?.stationName ?? snapshot?.stationName ?? '未选择工位'}</div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {traySnapshot
                      ? `${traySnapshot.trayCode} 号托盘 · ${traySnapshot.stateLabel}`
                      : workpieceDisplaySerial
                        ? `${workpieceDisplaySerial} · 当前执行工件`
                        : demoExecutingWorkstepIndex !== null
                          ? `${workstepNames[demoExecutingWorkstepIndex] ?? '当前工步'} · 单步演示执行中`
                        : '当前工位暂无执行任务'}
                  </div>
                </div>
                {snapshot?.workpieceProgress !== null && snapshot?.workpieceProgress !== undefined && (
                  <span className="shrink-0 text-xs tabular-nums text-slate-400">{snapshot.workpieceProgress}%</span>
                )}
              </div>
              {snapshot?.workpieceProgress !== null && snapshot?.workpieceProgress !== undefined && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ds-bg-slider-track">
                  <div className="h-full rounded-full bg-ds-brand-primary transition-[width]" style={{ width: `${snapshot.workpieceProgress}%` }} />
                </div>
              )}
            </div>

            {executionMode === 'manual' && manualControlTarget ? (
              <ProductionManualControlPanel
                target={manualControlTarget}
                disabled={executionControlsDisabled || taskState === 'running'}
                disabledReason="任务执行中不可用，请先暂停或等待执行完成"
                onEditTrayMaterial={onEditTrayMaterial}
                onDispatchAgv={onDispatchTrayAgv}
                onCommand={onManualCommand}
              />
            ) : traySnapshot ? (
              <div className="space-y-2 px-1">
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">托盘状态</span>
                  <span className="text-xs font-normal text-slate-700">{traySnapshot.stateLabel}</span>
                </div>
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">托盘物料</span>
                  <span className="min-w-0 truncate text-xs font-normal text-slate-700" title={traySnapshot.material ?? undefined}>{traySnapshot.material ?? '空'}</span>
                </div>
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">物料数量</span>
                  <span className="text-xs font-normal tabular-nums text-slate-700">{traySnapshot.quantity} 件</span>
                </div>
              </div>
            ) : snapshot?.process ? (
              <div className="space-y-2 pl-3 pr-1">
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">当前任务</span>
                  <span className="min-w-0 truncate text-xs font-normal text-slate-700" title={workpieceDisplaySerial ?? snapshot.taskName ?? undefined}>{workpieceDisplaySerial ?? snapshot.taskName ?? '暂无'}</span>
                </div>
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">工序任务</span>
                  <span className="min-w-0 truncate text-xs font-normal text-slate-700" title={snapshot.process.name}>{snapshot.process.name}</span>
                </div>
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">加工零件</span>
                  <span className="min-w-0 truncate text-xs font-normal text-slate-700" title={snapshot.partName ?? undefined}>{snapshot.partName ?? '暂无'}</span>
                </div>
                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-xs text-ds-text-muted">任务状态</span>
                  <span className="text-xs font-normal text-slate-700">{getTaskStateLabel(snapshot.taskState)}</span>
                </div>
              </div>
            ) : demoExecutingWorkstepIndex !== null ? (
              <div className="rounded-md border border-orange-200 bg-orange-50/60 px-2.5 py-3 text-center text-xs text-orange-700">
                当前工位正在执行单步演示工步
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 bg-white/45 px-2.5 py-3 text-center text-xs text-slate-400">
                该工位当前没有在执行的工序任务
              </div>
            )}

            {executionControls}

            {executionMode !== 'manual' && workstepNames.length > 0 && (
              <div className="border-t border-slate-200/80 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ds-text-muted">{snapshot.process ? '当前工步' : '工位工步'}</span>
                </div>
                <HierarchicalWorkstepList
                  workpieceLabel={workpieceDisplaySerial ?? snapshot.demoWorkpieceLabel ?? (snapshot.workpieceOrder ? `(${snapshot.workpieceOrder})` : '(1)')}
                  groups={workstepGroups}
                  currentIndex={snapshot.process ? snapshot.currentWorkstepIndex : undefined}
                  completedUntil={snapshot.process ? snapshot.currentWorkstepIndex : undefined}
                  selectedIndex={executionMode === 'single-step' ? selectedWorkstepIndex : undefined}
                  executingIndex={!snapshot.process ? demoExecutingWorkstepIndex : undefined}
                  interactive={executionMode === 'single-step' && !workstepSelectionLocked}
                  disabled={workstepSelectionLocked}
                  onSelect={handleSelectWorkstep}
                  renderStepSuffix={(step) => {
                    const showErrorBadge = snapshot.stationId === breakpointStationId
                      && breakpointErrorIndex !== null
                      && step.index === breakpointErrorIndex;
                    const positioningResultKey = positioningResultKeysByWorkstep[step.index];
                    if (!showErrorBadge && (!positioningResultKey || !onViewPositioningResult)) return null;
                    return (
                      <span className="flex shrink-0 items-center gap-2 pt-0.5">
                        {showErrorBadge && (
                          <span className="rounded bg-red-50 px-1 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-inset ring-red-200">
                            异常
                          </span>
                        )}
                        {positioningResultKey && onViewPositioningResult && (
                          <span
                            role="button"
                            tabIndex={0}
                            className="text-[11px] font-medium text-ds-brand-primary-text hover:text-ds-brand-primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              onViewPositioningResult(positioningResultKey);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                onViewPositioningResult(positioningResultKey);
                              }
                            }}
                          >查看工件位置</span>
                        )}
                      </span>
                    );
                  }}
                />
                <div className="hidden">
                  {workstepNames.map((stepName, index) => {
                    const demoExecuting = !snapshot.process && index === demoExecutingWorkstepIndex;
                    const current = (Boolean(snapshot.process) && index === snapshot.currentWorkstepIndex) || demoExecuting;
                    const completed = Boolean(snapshot.process) && index < snapshot.currentWorkstepIndex;
                    const selected = executionMode === 'single-step' && index === selectedWorkstepIndex;
                    const positioningResultKey = positioningResultKeysByWorkstep[index];
                    return (
                      <button
                        key={`${stepName}-${index}`}
                        type="button"
                        className={`flex min-h-7 w-full items-start gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${current ? 'bg-orange-50 text-ds-brand-primary-text' : completed ? 'bg-emerald-50/70 text-emerald-700' : 'text-slate-400'} ${selected ? 'ring-1 ring-inset ring-orange-300' : 'hover:bg-slate-100/80'} ${executionMode === 'single-step' ? 'cursor-pointer' : 'cursor-default'}`}
                        aria-pressed={selected}
                        disabled={singleStepExecutionActive}
                        onClick={() => executionMode === 'single-step' && !singleStepExecutionActive && setSelectedWorkstepIndex(index)}
                      >
                        <Circle className={`mt-1 size-2.5 shrink-0 ${current ? 'fill-orange-500 text-orange-500' : completed ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-200 text-slate-200'}`} />
                        <span className="min-w-0 flex-1 break-words whitespace-normal leading-4">{stepName}</span>
                        {positioningResultKey && onViewPositioningResult && (
                          <span
                            role="button"
                            tabIndex={0}
                            className="shrink-0 pt-0.5 text-[11px] font-medium text-ds-brand-primary-text hover:text-ds-brand-primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              onViewPositioningResult(positioningResultKey);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                onViewPositioningResult(positioningResultKey);
                              }
                            }}
                          >
                            查看工件位置
                          </span>
                        )}
                        {current && <span className="shrink-0 pt-0.5 text-[11px] font-medium">{demoExecuting ? '执行中' : '当前'}</span>}
                        {selected && <span className="shrink-0 pt-0.5 text-[11px] font-medium text-orange-600">已选</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
