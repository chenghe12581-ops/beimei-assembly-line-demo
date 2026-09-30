import { useState } from 'react';
import { ChevronDown, Circle, ListX, Plus, Trash2 } from 'lucide-react';
import { Tooltip } from 'antd';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { PanelEmptyState } from '../ui/panel-empty-state';
import { ScrollArea } from '../ui/scroll-area';
import {
  getProductionProcessFilterState,
  getProductionProcessKey,
  type ProcessOption,
  type ProductionProcessFilterState,
  type ProductionTask,
  type ProductionTaskFilterKind,
  type ProductionWorkpiece,
  type SelectOption,
  type WorkpieceState,
} from './ProductionTaskTreePanel1';

/**
 * Open Specs: ProductionTaskTreePanel2
 *
 * - Version 2 consumes the parent-filtered process list, including creation
 *   modal omissions for disabled processes, while execution keeps the
 *   corresponding soft-disable state.
 * - The former task summary is the work-order row. It shows the generated work
 *   order number and a collapse affordance while preserving the existing WP
 *   and process rows.
 * - Under the selected task, process rows are grouped by workpiece instance. A
 *   quantity of 6 renders six groups (`WP-01` through `WP-06`) and repeats the
 *   same visible process list inside each group.
 * - Process rows are display controls only. They never call
 *   model-selection callbacks, never switch to model view, and never create
 *   process-related part highlights.
 * - The serial remains visible until an explicit batch-selection mode is
 *   entered. Individual disable affordances are intentionally absent.
 */

const productionTaskFilterKindOptions: SelectOption[] = [
  { id: 'state', name: '工序状态' },
  { id: 'workpiece', name: '零件名称' },
  { id: 'process', name: '工序类型' },
];

export function formatProductionWorkpieceSerial(serial: string) {
  return serial.replace(/-(\d+)$/, (_, digits) => `(${Number(digits)})`);
}

export function formatCombinedPartObject(partObject: string) {
  const parts = partObject.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return partObject;

  const matches = parts.map((part) => part.match(/^(.*-)([^-]+)$/));
  if (matches.some((match) => !match)) return partObject;

  const validMatches = matches as RegExpMatchArray[];
  const prefix = validMatches[0][1];
  if (!validMatches.every((match) => match[1] === prefix)) return partObject;

  return `${prefix} (${validMatches.map((match) => match[2]).join(' + ')})`;
}

export function ProductionProcessTitle({ process, disabled = false }: { process: ProcessOption; disabled?: boolean }) {
  return (
    <span className="block min-w-0 truncate">
      <span className={`ds-production-process-title ${disabled ? 'text-ds-text-disabled' : 'text-ds-text-control'}`}>{process.name}</span>
      <span className={`ml-3 text-[11px] font-normal ${disabled ? 'text-ds-text-disabled' : 'text-ds-text-part-object'}`}>
        {formatCombinedPartObject(process.partObject)}
      </span>
    </span>
  );
}

function MiniProgress({ value, tone = 'orange' }: { value: number; tone?: 'orange' | 'emerald' | 'slate' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'slate' ? 'bg-slate-400' : 'bg-ds-brand-primary';
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-ds-bg-slider-track">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function getWorkOrderStateLabel(task: ProductionTask) {
  const labels: Record<ProductionTask['state'], string> = {
    draft: '待初始化',
    ready: '待执行',
    running: '执行中',
    paused: '已暂停',
    stopped: '已停止',
    done: '已完成',
    abnormal: '异常',
  };
  return labels[task.state];
}

function getWorkOrderStateClassName(task: ProductionTask) {
  if (task.state === 'running') return 'text-emerald-600';
  if (task.state === 'paused') return 'text-amber-600';
  if (task.state === 'abnormal') return 'text-red-600';
  if (task.state === 'done') return 'text-emerald-600';
  return 'text-ds-text-disabled';
}

function CompactMultiSelect({
  items,
  selectedIds,
  placeholder,
  disabled = false,
  onChange,
}: {
  items: SelectOption[];
  selectedIds: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (nextIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  return (
    <div className="relative w-full">
      <button
        type="button"
        className="flex min-h-7 w-full items-center justify-between gap-2 rounded-md border border-ds-border-default bg-white px-2 py-1 text-left text-[11px] text-slate-600 shadow-sm transition-colors hover:border-orange-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedItems.length === 0 ? (
            <span className="font-normal text-slate-400">{placeholder}</span>
          ) : (
            selectedItems.slice(0, 2).map((item) => (
              <span key={item.id} className="max-w-[94px] truncate rounded-full bg-slate-100 px-1.5 leading-5 text-slate-600">
                {item.name}
              </span>
            ))
          )}
          {selectedItems.length > 2 && (
            <span className="rounded-full bg-orange-50 px-1.5 leading-5 text-ds-brand-primary-text">+{selectedItems.length - 2}</span>
          )}
        </span>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-ds-border-default bg-white p-1.5 shadow-xl shadow-slate-900/10">
          {items.length === 0 ? (
            <div className="px-2 py-2 text-[11px] text-slate-400">暂无可选项</div>
          ) : (
            items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] transition-colors ${
                    checked ? 'bg-orange-50 text-ds-brand-primary-text' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    const nextIds = checked ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id];
                    onChange(nextIds);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    const nextIds = checked ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id];
                    onChange(nextIds);
                  }}
                >
                  <Checkbox size="sm" checked={checked} className="size-3.5 [&_svg]:size-2.5" onChange={() => undefined} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function getWorkpieceStateLabel(state: WorkpieceState) {
  const labels: Record<WorkpieceState, string> = {
    pending: '未开始',
    running: '进行中',
    paused: '暂停中',
    done: '已完成',
    abnormal: '任务异常',
  };
  return labels[state];
}

function getWorkpieceStateClassName(state: WorkpieceState) {
  const classes: Record<WorkpieceState, string> = {
    pending: 'border-ds-border-default bg-ds-bg-control-disabled text-ds-text-control-muted',
    running: 'border-orange-200 bg-orange-50 text-ds-brand-primary-text',
    paused: 'border-amber-200 bg-amber-50 text-amber-700',
    done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    abnormal: 'border-red-200 bg-red-50 text-red-700',
  };
  return classes[state];
}

function getDisplayWorkpieceState(task: ProductionTask, workpiece: ProductionWorkpiece): WorkpieceState {
  if (task.state === 'paused' && workpiece.state === 'running') return 'paused';
  return workpiece.state;
}

function getWorkpieceProcessState({
  task,
  workpiece,
  processId,
  processIndex,
  taskProcesses,
}: {
  task: ProductionTask;
  workpiece: ProductionWorkpiece;
  processId: string;
  processIndex: number;
  taskProcesses: ProcessOption[];
}): ProductionProcessFilterState {
  const displayState = getDisplayWorkpieceState(task, workpiece);
  if (displayState === 'abnormal' && workpiece.abnormalProcessId === processId) return 'abnormal';
  if (displayState === 'done') return 'done';

  const currentProcessIndex = workpiece.currentProcessId
    ? taskProcesses.findIndex((process) => process.id === workpiece.currentProcessId)
    : -1;
  if (currentProcessIndex >= 0 && processIndex < currentProcessIndex) return 'done';
  if (workpiece.currentProcessId === processId) {
    if (displayState === 'paused') return 'paused';
    if (displayState === 'abnormal') return 'abnormal';
    if (displayState === 'running') return 'running';
  }
  return 'pending';
}

function getPanelWorkpieces(task: ProductionTask): ProductionWorkpiece[] {
  if (task.workpieces.length > 0) return task.workpieces;

  return Array.from({ length: Math.max(1, task.quantity) }, (_, index) => {
    const serial = `WP-${String(index + 1).padStart(2, '0')}`;
    return {
      id: `${task.id}-${serial.toLowerCase()}`,
      name: task.name,
      serial,
      process: '未开始',
      currentProcessId: null,
      progress: 0,
      state: 'pending',
      visionSummary: '等待视觉采集',
    };
  });
}

type ProductionTaskTreePanel2Props = {
  filteredTasks: ProductionTask[];
  processes: ProcessOption[];
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  disabledProcessKeys: Set<string>;
  visibleProcessIdsByTask: Record<string, string[]>;
  batchMode: boolean;
  filterOpen: boolean;
  filterActive: boolean;
  filterKinds: ProductionTaskFilterKind[];
  filterValues: Partial<Record<ProductionTaskFilterKind, string[]>>;
  filterValueOptions: Record<ProductionTaskFilterKind, SelectOption[]>;
  displayableProcessCount: number;
  canCreateTask: boolean;
  onSelectTask: (taskId: string) => void;
  onReorderTask: (sourceTaskId: string, targetTaskId: string) => void;
  onRequestDeleteTask: (taskId: string) => void;
  onCreateTask: () => void;
  onToggleTaskSelection: (processKey: string) => void;
  onClearVisibleTasks: () => void;
  onToggleFilter: () => void;
  onFilterKindsChange: (nextKinds: ProductionTaskFilterKind[]) => void;
  onFilterValueChange: (kind: ProductionTaskFilterKind, nextValues: string[]) => void;
  onClearFilters: () => void;
  onRequestDeleteWorkpiece: (taskId: string, workpieceId: string) => void;
  onDoubleClickProcess?: (payload: {
    task: ProductionTask;
    workpiece: ProductionWorkpiece;
    process: ProcessOption;
    processIndex: number;
  }) => void;
};

export function ProductionTaskTreePanel2({
  filteredTasks,
  processes,
  selectedTaskId,
  selectedTaskIds,
  disabledProcessKeys,
  visibleProcessIdsByTask,
  batchMode,
  filterOpen,
  filterActive,
  filterKinds,
  filterValues,
  filterValueOptions,
  displayableProcessCount,
  canCreateTask,
  onSelectTask,
  onReorderTask,
  onRequestDeleteTask,
  onCreateTask,
  onToggleTaskSelection,
  onClearVisibleTasks,
  onToggleFilter,
  onFilterKindsChange,
  onFilterValueChange,
  onClearFilters,
  onRequestDeleteWorkpiece,
  onDoubleClickProcess,
}: ProductionTaskTreePanel2Props) {
  const [collapsedWorkpieceGroupIds, setCollapsedWorkpieceGroupIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [taskListScrolled, setTaskListScrolled] = useState(false);

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTaskId((current) => {
      if (current === taskId) return null;
      onSelectTask(taskId);
      return taskId;
    });
  };
  const toggleWorkpieceGroup = (groupId: string) => {
    setCollapsedWorkpieceGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const hasVisibleTasks = filteredTasks.length > 0;
  const visibleProcessCount = filteredTasks.reduce(
    (total, task) => total + (visibleProcessIdsByTask[task.id]?.length ?? 0),
    0,
  );

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 border-r border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel shadow-none">
      <div className="flex h-9 shrink-0 items-center border-b border-ds-border-process-planning-structure bg-transparent px-3 py-0">
        <div className="flex w-full items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium text-ds-text-control">生产任务</CardTitle>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip title={canCreateTask ? '新建工单' : '当前不可新建工单'}>
              <span>
                <Button
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  disabled={!canCreateTask}
                  onClick={onCreateTask}
                >
                  <Plus className="size-3" />
                  新建工单
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={hasVisibleTasks ? '清除当前列表' : '当前列表为空'}>
              <span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-ds-text-muted hover:bg-transparent hover:text-ds-text-primary disabled:text-ds-text-disabled disabled:hover:bg-transparent"
                  disabled={!hasVisibleTasks}
                  onClick={onClearVisibleTasks}
                  aria-label="清除当前列表"
                >
                  <ListX className="size-3.5" />
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 !pb-0">
        {filterOpen && (
          <div className="border-b border-ds-border-production-list bg-ds-bg-production-list-header p-3">
            <div className="grid gap-2">
              <div>
                <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                  <div className="text-[11px] text-ds-text-muted">筛选方式</div>
                  <CompactMultiSelect
                    items={productionTaskFilterKindOptions}
                    selectedIds={filterKinds}
                    placeholder="请选择筛选方式"
                    onChange={(nextIds) => onFilterKindsChange(nextIds as ProductionTaskFilterKind[])}
                  />
                </div>
                <div className="mt-2 h-px bg-ds-border-production-list" />
              </div>
              {filterKinds.map((kind) => {
                const kindMeta = productionTaskFilterKindOptions.find((item) => item.id === kind);
                return (
                  <div key={kind} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                    <div className="text-[11px] text-ds-text-muted">{kindMeta?.name ?? kind}</div>
                    <CompactMultiSelect
                      items={filterValueOptions[kind]}
                      selectedIds={filterValues[kind] ?? []}
                      placeholder={filterValueOptions[kind].length > 0 ? '请选择筛选值' : '暂无可筛选项'}
                      disabled={filterValueOptions[kind].length === 0}
                      onChange={(nextValues) => onFilterValueChange(kind, nextValues)}
                    />
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-ds-text-disabled">
                  {filterActive ? `已筛选 ${visibleProcessCount} / ${displayableProcessCount} 项工序` : `共 ${displayableProcessCount} 项工序`}
                </span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={!filterActive} onClick={onClearFilters}>
                  清除筛选
                </Button>
              </div>
            </div>
          </div>
        )}
        {filteredTasks.length === 0 ? (
          <div className="min-h-0 flex-1 p-3">
            <PanelEmptyState label={filterActive ? '当前筛选条件下暂无任务' : '暂无任务'} />
          </div>
        ) : (
          <ScrollArea
            type="hover"
            className="min-h-0 flex-1"
            scrollBarClassName="!top-[69px] !h-auto"
            onScrollCapture={(event) => {
              const target = event.target as HTMLElement;
              if (target.dataset.slot !== 'scroll-area-viewport') return;
              const nextScrolled = target.scrollTop > 0;
              setTaskListScrolled((current) => (current === nextScrolled ? current : nextScrolled));
            }}
          >
            <div className="min-w-0 max-w-full space-y-1 px-2 pb-3 pt-2">
              {filteredTasks.map((task) => {
                const selected = task.id === selectedTaskId;
                const expanded = task.id === expandedTaskId;
                const canReorder = !['running', 'paused', 'abnormal'].includes(task.state);
                const taskBlockClassName = 'w-full min-w-0 max-w-full space-y-1';
                const taskSummaryContainerClassName = expanded
                  ? `sticky top-0 z-20 -mx-2 w-[calc(100%+1rem)] min-w-0 bg-ds-bg-production-list-header transition-shadow duration-200 ${
                      taskListScrolled ? 'shadow-ds-sticky-overlap' : 'shadow-none'
                    }`
                  : 'sticky top-0 z-20 w-full min-w-0 bg-ds-bg-production-list-header';
                const taskSummaryClassName = expanded
                  ? `w-full min-w-0 px-4 text-left text-ds-text-muted transition-[padding,color,background-color] duration-200 ${taskListScrolled ? 'py-1.5' : 'py-3'}`
                  : 'w-full rounded-md bg-ds-bg-production-list-header pl-1.5 pr-3.5 py-1.5 text-left text-ds-text-muted shadow-sm transition-colors hover:bg-ds-bg-production-list';
                const taskProcesses = (visibleProcessIdsByTask[task.id] ?? [])
                  .map((processId) => processes.find((item) => item.id === processId))
                  .filter((process): process is ProcessOption => Boolean(process));
                const workpieces = getPanelWorkpieces(task);
                const taskSummaryName = task.workOrderNo;

                return (
                  <div
                    key={task.id}
                    className={`${taskBlockClassName} group/work-order ${draggingTaskId === task.id ? 'opacity-60' : ''}`}
                    onDragOver={(event) => {
                      if (!draggingTaskId || draggingTaskId === task.id) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceTaskId = draggingTaskId || event.dataTransfer.getData('text/plain');
                      setDraggingTaskId(null);
                      if (sourceTaskId && sourceTaskId !== task.id) onReorderTask(sourceTaskId, task.id);
                    }}
                  >
                    <div
                      className={`${taskSummaryContainerClassName} ${canReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      draggable={canReorder}
                      onDragStart={(event) => {
                        if (!canReorder) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', task.id);
                        setDraggingTaskId(task.id);
                      }}
                      onDragEnd={() => setDraggingTaskId(null)}
                    >
                      <div className={taskSummaryClassName}>
                        <div className={expanded ? 'grid gap-3' : 'grid'}>
                          <div className="flex h-5 min-w-0 items-center gap-1.5">
                            <button
                              type="button"
                              className="flex size-4 shrink-0 items-center justify-center text-ds-text-disabled transition-colors hover:text-ds-text-control"
                              aria-label={`${expanded ? '折叠' : '展开'}工单 ${taskSummaryName}`}
                              aria-expanded={expanded}
                              onClick={() => toggleTaskExpanded(task.id)}
                            >
                              <ChevronDown className={`size-3.5 transition-transform ${expanded ? '' : '-rotate-90'}`} />
                            </button>
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              onClick={() => {
                                onSelectTask(task.id);
                                setExpandedTaskId(task.id);
                              }}
                            >
                              <Tooltip title={taskSummaryName}>
                                <span className={`min-w-0 truncate text-xs font-medium leading-none ${selected ? 'text-ds-text-secondary' : 'text-ds-text-control'}`}>
                                  {taskSummaryName}
                                </span>
                              </Tooltip>
                            </button>
                            {task.state === 'ready' ? (
                              <div className="flex h-5 shrink-0 items-center justify-end gap-1">
                                <span className={`shrink-0 whitespace-nowrap text-right text-xs font-medium leading-none ${getWorkOrderStateClassName(task)}`}>
                                  {getWorkOrderStateLabel(task)}
                                </span>
                                <Tooltip title="删除工单">
                                  <button
                                    type="button"
                                    draggable={false}
                                    className="flex h-5 w-0 shrink-0 items-center justify-center overflow-hidden text-ds-text-disabled opacity-0 transition-[width,opacity,color] hover:text-red-500 focus-visible:w-5 focus-visible:opacity-100 group-hover/work-order:w-5 group-hover/work-order:opacity-100"
                                    aria-label={`删除工单 ${task.workOrderNo}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onRequestDeleteTask(task.id);
                                    }}
                                    onDragStart={(event) => event.preventDefault()}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </Tooltip>
                              </div>
                            ) : (
                              <span className={`shrink-0 whitespace-nowrap text-right text-xs font-medium leading-none ${getWorkOrderStateClassName(task)}`}>
                                {getWorkOrderStateLabel(task)}
                              </span>
                            )}
                          </div>
                          {expanded && (
                            <div className="flex min-w-0 items-center gap-2 pl-[22px]">
                              <div className="min-w-0 flex-1">
                                <MiniProgress value={task.progress} tone={task.state === 'done' ? 'emerald' : task.state === 'stopped' ? 'slate' : 'orange'} />
                              </div>
                              <span className="w-9 shrink-0 text-right text-xs font-medium leading-none text-ds-text-muted">{task.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {expanded && <div className="h-px w-full bg-zinc-200/70" />}
                    </div>
                    {expanded && (
                        <div className="min-w-0 max-w-full space-y-2 pt-2">
                          {workpieces.map((workpiece, workpieceIndex) => {
                            const displayState = getDisplayWorkpieceState(task, workpiece);
                            const workpieceGroupId = `${task.id}:${workpiece.id}`;
                            const workpieceSerial = workpiece.serial || `WP-${String(workpieceIndex + 1).padStart(2, '0')}`;
                            const workpieceDisplaySerial = formatProductionWorkpieceSerial(workpieceSerial);
                            const workpieceCollapsed = collapsedWorkpieceGroupIds.has(workpieceGroupId);
                            const canDeleteWorkpiece = task.state !== 'running' && workpieces.length > 1;
                            const deleteWorkpieceTooltip = task.state === 'running'
                              ? '任务执行中不可删除工件'
                              : workpieces.length <= 1
                                ? '生产任务至少保留一个工件'
                                : `删除 ${workpieceDisplaySerial}`;
                            return (
                              <div key={workpiece.id} className="w-full min-w-0 max-w-full overflow-hidden rounded-ds-md bg-transparent">
                              <div
                                role="button"
                                tabIndex={0}
                                className={`flex h-8 w-full min-w-0 items-center justify-between gap-2 bg-ds-bg-process-planning-tree-group px-2 text-left transition-colors hover:bg-ds-bg-process-planning-tree-group-hover ${workpieceCollapsed ? '' : 'border-b border-ds-border-tree-divider'}`}
                                aria-expanded={!workpieceCollapsed}
                                onClick={() => toggleWorkpieceGroup(workpieceGroupId)}
                                onKeyDown={(event) => {
                                  if (event.key !== 'Enter' && event.key !== ' ') return;
                                  event.preventDefault();
                                  toggleWorkpieceGroup(workpieceGroupId);
                                }}
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <ChevronDown className={`size-3.5 shrink-0 text-ds-text-disabled transition-transform ${workpieceCollapsed ? '-rotate-90' : ''}`} />
                                  <span className="text-xs font-medium text-ds-text-control">{workpieceDisplaySerial}</span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span className="text-[11px] tabular-nums text-ds-text-disabled">{workpiece.progress}%</span>
                                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${getWorkpieceStateClassName(displayState)}`}>
                                    {getWorkpieceStateLabel(displayState)}
                                  </span>
                                  <Tooltip title={deleteWorkpieceTooltip}>
                                    <span>
                                      <button
                                        type="button"
                                        className="flex size-5 items-center justify-center rounded-ds-sm text-ds-text-disabled transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-ds-text-disabled disabled:hover:bg-transparent disabled:hover:text-ds-text-disabled"
                                        aria-label={`删除 ${workpieceDisplaySerial}`}
                                        disabled={!canDeleteWorkpiece}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          onRequestDeleteWorkpiece(task.id, workpiece.id);
                                        }}
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </span>
                                  </Tooltip>
                                </div>
                              </div>
                              {!workpieceCollapsed && (
                              <div className="min-w-0 max-w-full space-y-1 bg-ds-bg-process-planning-task-detail p-1">
                                {taskProcesses.map((process, processIndex) => {
                                  const processId = process.id;
                                  const processKey = getProductionProcessKey(task.id, processId);
                                  const processChecked = selectedTaskIds.has(processKey);
                                  const processDisabled = disabledProcessKeys.has(processKey);
                                  const processCheckboxVisible = batchMode;
                                  const processFilterState = processDisabled
                                    ? getProductionProcessFilterState(task, processId, true)
                                    : getWorkpieceProcessState({ task, workpiece, processId, processIndex, taskProcesses });
                                  const processAbnormal = processFilterState === 'abnormal';
                                  const processRunning = processFilterState === 'running';
                                  const processPaused = processFilterState === 'paused';
                                  const processExecutionActive = processRunning || processPaused;

                                  return (
                                    <div
                                      key={`${workpiece.id}-${processId}`}
                                      data-testid={`production-process-${workpieceSerial}-${processId}`}
                                      className={`relative grid h-8 w-full min-w-0 max-w-full grid-cols-[16px_8px_minmax(0,1fr)] items-center gap-1.5 rounded-ds-md px-1 py-1 text-left text-xs transition-colors ${
                                        processDisabled
                                          ? 'cursor-not-allowed bg-ds-bg-process-planning-tree-group text-ds-text-disabled shadow-none'
                                          : processExecutionActive
                                            ? 'bg-ds-bg-production-process-task text-ds-text-control'
                                            : 'bg-ds-bg-production-process-task text-ds-text-control hover:bg-white/70'
                                      }`}
                                      onDoubleClick={() => {
                                        if (!processDisabled) {
                                          onDoubleClickProcess?.({ task, workpiece, process, processIndex });
                                        }
                                      }}
                                    >
                                      <div className="relative flex size-4 shrink-0 items-center justify-center">
                                        <span className={`ds-process-index absolute inset-0 flex items-center justify-start text-xs font-normal leading-none tabular-nums transition-opacity ${
                                          processCheckboxVisible ? 'opacity-0' : 'opacity-100'
                                        } text-slate-400`}>
                                          {processIndex + 1}
                                        </span>
                                        <Checkbox
                                          size="sm"
                                          checked={processChecked}
                                          className={`absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 transition-opacity [&_svg]:size-2.5 ${processCheckboxVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                                          aria-label={`选择${workpieceDisplaySerial}${process.name}`}
                                          onClick={(event) => event.stopPropagation()}
                                          onChange={() => onToggleTaskSelection(processKey)}
                                        />
                                      </div>
                                      <Circle className={`size-2 ${
                                        processDisabled
                                          ? 'fill-ds-border-default text-ds-border-default'
                                          : processAbnormal
                                            ? 'fill-red-500 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.45)]'
                                            : processPaused
                                              ? 'fill-amber-500 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.35)]'
                                              : processRunning
                                                ? 'fill-emerald-500 text-emerald-500'
                                                : 'fill-ds-border-strong text-ds-border-strong'
                                      }`} />
                                      <span className="block min-w-0 overflow-hidden">
                                        <ProductionProcessTitle process={process} disabled={processDisabled} />
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              )}
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
