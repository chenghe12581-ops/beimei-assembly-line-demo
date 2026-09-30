import { useEffect, useState } from 'react';
import { ChevronDown, ChevronsUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardTitle } from '../ui/card';
import { PanelEmptyState } from '../ui/panel-empty-state';
import { ScrollArea } from '../ui/scroll-area';
import { formatProductionWorkpieceSerial } from './ProductionTaskTreePanel2';

export type TaskStatusMonitorWorkpieceState = 'pending' | 'running' | 'paused' | 'done' | 'abnormal';

export type TaskStatusMonitorProcess = {
  id: string;
  name: string;
  partObject: string;
  unit: string;
};

export type TaskStatusMonitorWorkpiece = {
  id: string;
  name: string;
  serial: string;
  process: string;
  currentProcessId?: string | null;
  progress: number;
  state: TaskStatusMonitorWorkpieceState;
  visionSummary: string;
  abnormalProcessId?: string;
};

export type TaskStatusMonitorTask = {
  id: string;
  name: string;
  drawingNo?: string;
  state?: 'draft' | 'ready' | 'running' | 'paused' | 'stopped' | 'done' | 'abnormal';
  processIds: string[];
  workpieces: TaskStatusMonitorWorkpiece[];
};

type TaskStatusMonitorPanelProps = {
  task: TaskStatusMonitorTask | null;
  processes: TaskStatusMonitorProcess[];
  disabledProcessIds?: ReadonlySet<string>;
  onOpenVision: (payload: { workpieceId: string; processId?: string }) => void;
  onClearAbnormal?: (payload: { workpieceId: string; processId: string }) => void;
};

function getWorkpieceStateLabel(state: TaskStatusMonitorWorkpieceState) {
  const labels: Record<TaskStatusMonitorWorkpieceState, string> = {
    pending: '未开始',
    running: '进行中',
    paused: '暂停中',
    done: '已完成',
    abnormal: '任务异常',
  };
  return labels[state];
}

function getWorkpieceStateClassName(state: TaskStatusMonitorWorkpieceState) {
  const classes: Record<TaskStatusMonitorWorkpieceState, string> = {
    pending: 'border-slate-200 bg-slate-50 text-slate-500',
    running: 'border-orange-200 bg-orange-50 text-ds-brand-primary-text',
    paused: 'border-amber-200 bg-amber-50 text-amber-700',
    done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    abnormal: 'border-red-200 bg-red-50 text-red-700',
  };
  return classes[state];
}

function getProcessRowClassName(state: TaskStatusMonitorWorkpieceState) {
  const classes: Record<TaskStatusMonitorWorkpieceState, string> = {
    pending: 'border-white/70 bg-white/54 shadow-ds-sm',
    running: 'border-orange-200 bg-orange-50/75 shadow-ds-sm',
    paused: 'border-amber-200 bg-amber-50/75 shadow-ds-sm',
    done: 'border-white/70 bg-white/54 shadow-ds-sm',
    abnormal: 'border-red-200 bg-red-50/80 shadow-ds-sm',
  };
  return classes[state];
}

function getProcessState(
  workpiece: TaskStatusMonitorWorkpiece,
  process: TaskStatusMonitorProcess,
  processIndex: number,
  currentProcessIndex: number,
): TaskStatusMonitorWorkpieceState {
  if (workpiece.state === 'abnormal' && workpiece.abnormalProcessId === process.id) return 'abnormal';
  if (workpiece.state === 'abnormal' && !workpiece.abnormalProcessId && workpiece.process === process.name) return 'abnormal';
  if (workpiece.state === 'done') return 'done';
  if (workpiece.currentProcessId) {
    const currentIndex = Math.max(0, currentProcessIndex);
    if (processIndex < currentIndex) return 'done';
    if (processIndex === currentIndex) return workpiece.state === 'paused' ? 'paused' : workpiece.state === 'abnormal' ? 'abnormal' : 'running';
    return 'pending';
  }
  if (workpiece.state === 'paused') {
    const currentIndex = Math.max(0, currentProcessIndex);
    if (processIndex < currentIndex) return 'done';
    if (processIndex === currentIndex) return 'paused';
    return 'pending';
  }
  if (workpiece.state === 'pending') return 'pending';

  const currentIndex = Math.max(0, currentProcessIndex);
  if (processIndex < currentIndex) return 'done';
  if (processIndex === currentIndex) return 'running';
  return 'pending';
}

function MiniProgress({ value, tone = 'orange' }: { value: number; tone?: 'orange' | 'amber' | 'emerald' | 'slate' | 'red' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'slate' ? 'bg-slate-400' : tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-ds-brand-primary';
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function getProgressTone(state: TaskStatusMonitorWorkpieceState): 'orange' | 'amber' | 'emerald' | 'slate' | 'red' {
  if (state === 'done') return 'emerald';
  if (state === 'pending') return 'slate';
  if (state === 'paused') return 'amber';
  if (state === 'abnormal') return 'red';
  return 'orange';
}

function getDisplayWorkpieceState(task: TaskStatusMonitorTask, workpiece: TaskStatusMonitorWorkpiece): TaskStatusMonitorWorkpieceState {
  if (task.state === 'paused' && workpiece.state === 'running') return 'paused';
  return workpiece.state;
}

function shouldAutoExpandWorkpiece(state: TaskStatusMonitorWorkpieceState) {
  return state === 'running' || state === 'paused' || state === 'abnormal';
}

export function TaskStatusMonitorPanel({
  task,
  processes,
  disabledProcessIds,
  onOpenVision,
  onClearAbnormal,
}: TaskStatusMonitorPanelProps) {
  const [expandedWorkpieceIds, setExpandedWorkpieceIds] = useState<Set<string>>(new Set());
  const [autoExpandSuppressedKey, setAutoExpandSuppressedKey] = useState<string | null>(null);
  const processMap = new Map(processes.map((process) => [process.id, process]));
  const taskProcesses = task?.processIds.map((processId) => processMap.get(processId)).filter(Boolean) as TaskStatusMonitorProcess[] | undefined;
  const allWorkpiecesDone = Boolean(task?.workpieces.length) && task!.workpieces.every((workpiece) => workpiece.state === 'done');
  const autoExpandKey = task
    ? task.workpieces
      .map((workpiece) => {
        const displayState = getDisplayWorkpieceState(task, workpiece);
        if (!shouldAutoExpandWorkpiece(displayState)) return null;
        return `${workpiece.id}:${workpiece.currentProcessId ?? 'none'}:${displayState}`;
      })
      .filter(Boolean)
      .join('|')
    : '';
  const autoExpansionActive = Boolean(autoExpandKey) && autoExpandSuppressedKey !== autoExpandKey;
  const hasExpandedCards = autoExpansionActive || expandedWorkpieceIds.size > 0;

  useEffect(() => {
    if (!allWorkpiecesDone) return;
    setExpandedWorkpieceIds(new Set());
    setAutoExpandSuppressedKey(null);
  }, [allWorkpiecesDone, task?.id]);

  useEffect(() => {
    if (!autoExpandSuppressedKey) return;
    if (!autoExpandKey || autoExpandSuppressedKey !== autoExpandKey) {
      setAutoExpandSuppressedKey(null);
    }
  }, [autoExpandKey, autoExpandSuppressedKey]);

  const toggleExpanded = (workpieceId: string) => {
    setExpandedWorkpieceIds((current) => {
      const next = new Set(current);
      if (next.has(workpieceId)) {
        next.delete(workpieceId);
      } else {
        next.add(workpieceId);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedWorkpieceIds(new Set());
    setAutoExpandSuppressedKey(autoExpandKey || null);
  };

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 border-l border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel shadow-none backdrop-blur-sm">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-ds-border-process-planning-structure bg-transparent px-3 py-0">
        <CardTitle className="text-xs font-medium text-slate-500">任务状态监控</CardTitle>
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-35"
          onClick={collapseAll}
          disabled={!hasExpandedCards}
          title="全部收起"
          aria-label="全部收起任务状态卡片"
        >
          <ChevronsUp className="size-3.5" />
        </button>
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0 !pb-0">
        {!task ? (
          <div className="min-h-0 flex-1 p-3">
            <PanelEmptyState />
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3">
	              {task.workpieces.map((workpiece) => {
	                const displayState = getDisplayWorkpieceState(task, workpiece);
	                const autoExpanded = shouldAutoExpandWorkpiece(displayState) && autoExpansionActive;
	                const expanded = autoExpanded || expandedWorkpieceIds.has(workpiece.id);
	                const progressTone = getProgressTone(displayState);
	                const compactCard = (displayState === 'pending' || allWorkpiecesDone) && !expanded;
	                const workpieceTitle = task.drawingNo ?? task.name;

	                return (
	                  <div key={workpiece.id} className={`max-w-full overflow-hidden rounded-xl border border-white/70 bg-white/72 shadow-sm ${compactCard ? 'px-3 py-2' : 'p-3'}`}>
	                    <button
	                      type="button"
	                      className={`flex w-full justify-between gap-2 text-left ${compactCard ? 'items-center' : 'items-start'}`}
	                      onClick={() => toggleExpanded(workpiece.id)}
	                    >
	                      <div className={`min-w-0 ${compactCard ? 'flex h-6 items-center' : ''}`}>
	                        <div className={`truncate text-xs font-semibold text-slate-700 ${compactCard ? 'leading-none' : ''}`}>{formatProductionWorkpieceSerial(workpiece.serial)} · {workpieceTitle}</div>
	                        {!compactCard && <div className="mt-1 text-[11px] text-slate-400">当前工序：{workpiece.process}</div>}
	                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline" className={`rounded-full px-2 text-[10px] ${getWorkpieceStateClassName(displayState)}`}>
                          {getWorkpieceStateLabel(displayState)}
                        </Badge>
	                        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
	                      </div>
	                    </button>
	                    {!compactCard && <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>当前进度</span>
                        <span>{workpiece.progress}%</span>
                      </div>
                      <MiniProgress value={workpiece.progress} tone={displayState === 'done' ? progressTone : 'slate'} />
                    </div>}
                    {expanded && (
                      <div className="mt-3 max-w-full space-y-1.5 overflow-hidden border-t border-white/70 pt-2">
                        {(taskProcesses ?? []).map((process, processIndex) => {
                          const currentProcessIndex = Math.max(0, (taskProcesses ?? []).findIndex((item) => item.id === workpiece.currentProcessId));
                          const processState = getProcessState({ ...workpiece, state: displayState }, process, processIndex, currentProcessIndex);
                          const processDisabled = disabledProcessIds?.has(process.id) ?? false;
                          const abnormal = !processDisabled && processState === 'abnormal';

                          return (
                            <div
                              key={process.id}
                              className={`max-w-full overflow-hidden rounded-lg border px-2 py-1 ${
                                processDisabled
                                  ? 'border-zinc-200 bg-zinc-100/80 opacity-75 grayscale shadow-none'
                                  : getProcessRowClassName(processState)
                              }`}
                              aria-disabled={processDisabled || undefined}
                              title={processDisabled ? '该工序已禁用' : abnormal ? '双击“查看视觉”临时解除异常' : undefined}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-semibold ${processDisabled ? 'text-zinc-300' : 'text-slate-400'}`}>
                                      {String(processIndex + 1).padStart(2, '0')}
                                    </span>
                                    <span className={`truncate text-[11px] font-medium ${processDisabled ? 'text-zinc-400' : 'text-slate-700'}`}>
                                      {process.name}
                                    </span>
                                  </div>
                                  <div className={`mt-0.5 whitespace-normal break-words text-[10px] leading-4 ${processDisabled ? 'text-zinc-300' : 'text-slate-400'}`}>
                                    {process.partObject}
                                  </div>
	                                </div>
	                                <div className="flex shrink-0 items-center gap-1">
	                                  <button
	                                    type="button"
	                                    className={`h-5 items-center rounded-md px-1.5 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-50 ${
	                                      abnormal ? 'inline-flex' : 'hidden'
	                                    }`}
	                                    aria-hidden={!abnormal}
	                                    tabIndex={abnormal ? 0 : -1}
	                                    onClick={(event) => {
	                                      event.stopPropagation();
	                                      if (!abnormal) return;
	                                      onOpenVision({ workpieceId: workpiece.id, processId: process.id });
	                                    }}
	                                    onDoubleClick={(event) => {
	                                      event.preventDefault();
	                                      event.stopPropagation();
	                                      if (!abnormal) return;
	                                      onClearAbnormal?.({ workpieceId: workpiece.id, processId: process.id });
	                                    }}
	                                    title={abnormal ? '单击查看视觉，双击临时解除异常' : undefined}
	                                  >
	                                    查看视觉
	                                  </button>
	                                  <Badge
                                    variant="outline"
                                    className={`rounded-full px-1.5 text-[10px] ${
                                      processDisabled
                                        ? 'border-zinc-200 bg-zinc-100 text-zinc-400'
                                        : getWorkpieceStateClassName(processState)
                                    }`}
                                  >
                                    {processDisabled ? '已禁用' : getWorkpieceStateLabel(processState)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
