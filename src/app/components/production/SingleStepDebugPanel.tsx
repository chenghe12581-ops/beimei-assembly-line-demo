import { useEffect, useState } from 'react';
import { Circle, Pause, Play, RotateCcw, SkipForward, Square } from 'lucide-react';
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
  activeExecutionMode?: ProductionDebugExecutionMode | null;
  activeExecutionStationId?: string | null;
  onExecutionStart?: (mode: ProductionDebugExecutionMode, stationId: string) => void;
  onExecutionPause?: () => void;
  onExecutionStop?: () => void;
  onExecutionModeChange: (mode: ProductionDebugExecutionMode) => void;
  onInitialize: () => void;
  onRunOrPause: () => void;
  onExecuteStep: (workstepIndex: number) => void;
  positioningResultKeysByWorkstep?: Record<number, string>;
  onViewPositioningResult?: (key: string) => void;
  onEditTrayMaterial?: (trayCode: string) => void;
  onDispatchTrayAgv?: (trayCode: string, pickupPoint: string) => void;
  onManualCommand?: (message: string) => void;
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
  if (state === 'stopped') return '已停止';
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
  activeExecutionMode = null,
  activeExecutionStationId = null,
  onExecutionStart,
  onExecutionPause,
  onExecutionStop,
  onExecutionModeChange,
  onInitialize,
  onRunOrPause,
  onExecuteStep,
  positioningResultKeysByWorkstep = {},
  onViewPositioningResult,
  onEditTrayMaterial,
  onDispatchTrayAgv,
  onManualCommand,
}: SingleStepDebugPanelProps) {
  const [selectedWorkstepIndex, setSelectedWorkstepIndex] = useState(0);
  const [demoExecutingWorkstepIndex, setDemoExecutingWorkstepIndex] = useState<number | null>(null);
  const selectedMode = modeOptions.find((option) => option.id === executionMode) ?? modeOptions[0];
  const isRunning = taskState === 'running';
  const isPaused = taskState === 'paused';
  const workstepNames = snapshot?.workstepNames ?? [];
  const workstepGroups = snapshot?.workstepGroups ?? [{ id: 'station-worksteps', label: '工位工步', steps: workstepNames.map((name, index) => ({ name, index })) }];
  const hasWorksteps = workstepNames.length > 0;
  const stationHasRunningWorkstep = Boolean(
    (snapshot?.process && snapshot.workpieceState === 'running')
    || (!snapshot?.process && demoExecutingWorkstepIndex !== null),
  );
  const viewingExecutionStation = !activeExecutionStationId || activeExecutionStationId === snapshot?.stationId;
  // 互锁只按工位判断，不按模式判断：当前工位占用执行会话时，其他工位置灰；本工位始终可展示自身状态。
  const isLockedOut = Boolean(activeExecutionStationId && activeExecutionStationId !== snapshot?.stationId);
  const controlPhase = isLockedOut ? 'locked'
    : taskState === 'stopped' ? 'stopped'
    : taskState === 'paused' ? 'paused'
    : taskState === 'running' ? 'running'
    : 'idle';
  const canInitControl = controlPhase === 'stopped';
  const canRunControl = controlPhase === 'idle' && canStart;
  const canPauseControl = controlPhase === 'running';
  const canStopControl = controlPhase === 'paused';
  const singleStepExecutionActive = activeExecutionMode === 'single-step'
    && viewingExecutionStation
    && stationHasRunningWorkstep;
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
          <>
            <Tooltip title={isLockedOut ? '当前有工位正在执行，请先暂停或停止当前任务' : canInitControl ? '初始化任务' : '当前任务不可初始化'}>
              <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" disabled={isLockedOut || !canInitControl} onClick={() => { setDemoExecutingWorkstepIndex(null); onInitialize(); }}>
                <RotateCcw className="size-3.5" />
                初始化
              </Button>
            </Tooltip>
            <Tooltip title={isLockedOut ? '当前有工位正在执行，请先暂停或停止当前任务' : canPauseControl ? '点击暂停当前单步工步' : canRunControl ? '点击执行选中工步' : '当前不可执行工步'}>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                disabled={isLockedOut || (!canRunControl && !canPauseControl)}
                onClick={() => {
                  if (canPauseControl) {
                    if (snapshot?.process) {
                      onExecutionPause?.();
                    } else {
                      setDemoExecutingWorkstepIndex(null);
                    }
                    return;
                  }
                  if (canRunControl) {
                    onExecutionStart?.('single-step', snapshot?.stationId ?? '');
                    if (snapshot?.process) {
                      onRunOrPause();
                    } else {
                      setDemoExecutingWorkstepIndex(selectedWorkstepIndex);
                    }
                    onExecuteStep(selectedWorkstepIndex);
                  }
                }}
              >
                {canPauseControl ? <Pause className="size-3.5" /> : <SkipForward className="size-3.5" />}
                {canPauseControl ? '暂停' : '执行工步'}
              </Button>
            </Tooltip>
            <Tooltip title={isLockedOut ? '当前有工位正在执行，请先暂停或停止当前任务' : canStopControl ? '停止当前单步执行并释放工位控制' : '当前无执行中的任务'}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                disabled={isLockedOut || !canStopControl}
                onClick={() => { setDemoExecutingWorkstepIndex(null); onExecutionStop?.(); }}
              >
                <Square className="size-3.5" />
                停止执行
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title={isLockedOut ? '当前有工位正在执行，请先暂停或停止当前任务' : canInitControl ? '初始化任务' : '当前任务不可初始化'}>
              <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" disabled={isLockedOut || !canInitControl} onClick={onInitialize}>
                <RotateCcw className="size-3.5" />
                初始化
              </Button>
            </Tooltip>
            <Tooltip title={isLockedOut ? '当前有工位正在执行，请先暂停或停止当前任务' : !canStart && startDisabledReason ? startDisabledReason : canPauseControl ? '点击暂停自动执行' : canRunControl ? '点击开始自动执行' : '当前不可自动执行'}>
              <Button type="button" size="sm" className="h-8 gap-1 px-2 text-xs" disabled={isLockedOut || (!canRunControl && !canPauseControl)} onClick={() => {
                if (canPauseControl) {
                  onExecutionPause?.();
                } else if (canRunControl) {
                  onExecutionStart?.('auto', snapshot?.stationId ?? '');
                  onRunOrPause();
                }
              }}>
                {canPauseControl ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {canPauseControl ? '暂停' : '自动执行'}
              </Button>
            </Tooltip>
            <Tooltip title={isLockedOut ? '当前有工位正在执行，请先暂停或停止当前任务' : canStopControl ? '停止当前自动执行并释放工位控制' : '当前无执行中的任务'}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                disabled={isLockedOut || !canStopControl}
                onClick={onExecutionStop}
              >
                <Square className="size-3.5" />
                停止执行
              </Button>
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
                disabledReason="请先停止生产任务"
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
                  interactive={executionMode === 'single-step'}
                  disabled={singleStepExecutionActive}
                  onSelect={(index) => setSelectedWorkstepIndex(index)}
                  renderStepSuffix={(step) => {
                    const positioningResultKey = positioningResultKeysByWorkstep[step.index];
                    if (!positioningResultKey || !onViewPositioningResult) return null;
                    return (
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
                      >查看工件位置</span>
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
