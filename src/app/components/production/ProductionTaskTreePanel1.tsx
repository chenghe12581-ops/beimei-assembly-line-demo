import { useState } from 'react';
import { Ban, ChevronDown, Circle, Filter, ListX, Plus } from 'lucide-react';
import { Tooltip } from 'antd';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

/**
 * Open Specs: ProductionTaskTreePanel1
 *
 * - Version 1 keeps the original production-task tree behavior.
 * - The task summary card is task-level and can seed the selected process.
 * - Clicking an enabled process row calls `onSelectProcess`, which lets the page
 *   enter model view and highlight the process-related parts.
 * - Batch selection and soft-disable keys are task/process scoped:
 *   `taskId:processId`.
 * - This file remains the archived reference for the original model-highlight
 *   flow. Workpiece-grouped visualization belongs to ProductionTaskTreePanel2.
 */

export type ProductionTaskState = 'draft' | 'ready' | 'running' | 'paused' | 'stopped' | 'done' | 'abnormal';
export type WorkpieceState = 'pending' | 'running' | 'paused' | 'done' | 'abnormal';
export type ProductionTaskFilterKind = 'state' | 'workpiece' | 'process';
export type ProductionProcessFilterState = WorkpieceState | 'disabled';

export type ProcessOption = {
  id: string;
  name: string;
  partObject: string;
  unit: string;
  batchGroup?: 'side-plate-grind';
};

export type ProductionWorkpiece = {
  id: string;
  name: string;
  serial: string;
  process: string;
  currentProcessId?: string | null;
  currentStepIndex?: number;
  progress: number;
  state: WorkpieceState;
  visionSummary: string;
  abnormalProcessId?: string;
  abnormalVisionFeedId?: string;
};

export type ProductionTask = {
  id: string;
  workOrderNo: string;
  name: string;
  project: string;
  drawingNo: string;
  quantity: number;
  state: ProductionTaskState;
  currentProcess: string;
  currentProcessId: string | null;
  progress: number;
  processIds: string[];
  workpieces: ProductionWorkpiece[];
};

export type SelectOption = {
  id: string;
  name: string;
};

export const productionProcessFilterStateOptions: SelectOption[] = [
  { id: 'pending', name: '未加工' },
  { id: 'running', name: '加工中' },
  { id: 'paused', name: '暂停' },
  { id: 'done', name: '已完成' },
  { id: 'abnormal', name: '异常' },
  { id: 'disabled', name: '已禁用' },
];

const productionTaskFilterKindOptions: SelectOption[] = [
  { id: 'state', name: '工序状态' },
  { id: 'workpiece', name: '零件名称' },
  { id: 'process', name: '工序类型' },
];

export function getProcessPartNames(process: ProcessOption) {
  return process.partObject.split(/\s*\+\s*/).filter(Boolean);
}

export function getProductionProcessKey(taskId: string, processId: string) {
  return `${taskId}:${processId}`;
}

export function getProductionProcessFilterState(
  task: ProductionTask,
  processId: string,
  disabled: boolean,
): ProductionProcessFilterState {
  if (disabled) return 'disabled';
  if (task.workpieces.some(
    (workpiece) => workpiece.state === 'abnormal' && workpiece.abnormalProcessId === processId,
  )) {
    return 'abnormal';
  }
  if (task.state === 'done') return 'done';

  const processIndex = task.processIds.indexOf(processId);
  const currentProcessIndex = task.currentProcessId ? task.processIds.indexOf(task.currentProcessId) : -1;
  if (currentProcessIndex >= 0 && processIndex < currentProcessIndex) return 'done';
  if (task.currentProcessId === processId) {
    if (task.state === 'paused') return 'paused';
    if (task.state === 'abnormal') return 'abnormal';
    if (task.state === 'running') return 'running';
  }
  return 'pending';
}

function ProcessTitle({ process, disabled = false }: { process: ProcessOption; disabled?: boolean }) {
  return (
    <span className="min-w-0 flex-1 truncate">
      <span className={disabled ? 'text-ds-text-disabled' : 'text-ds-text-secondary'}>{process.name}</span>
      <span className={`ml-1 text-[10px] font-normal ${disabled ? 'text-ds-text-disabled' : 'text-ds-text-muted'}`}>{process.partObject}</span>
    </span>
  );
}

function MiniProgress({ value, tone = 'orange' }: { value: number; tone?: 'orange' | 'emerald' | 'slate' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'slate' ? 'bg-slate-400' : 'bg-ds-brand-primary';
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
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
        className="flex min-h-7 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-[11px] text-slate-600 shadow-sm transition-colors hover:border-orange-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedItems.length === 0 ? (
            <span className="font-normal text-ds-text-disabled">{placeholder}</span>
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
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
          {items.length === 0 ? (
            <div className="px-2 py-2 text-[11px] text-ds-text-disabled">暂无可选项</div>
          ) : (
            items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] transition-colors ${
                    checked ? 'bg-orange-50 text-ds-brand-primary-text' : 'text-ds-text-muted hover:bg-slate-50'
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

type ProductionTaskTreePanel1Props = {
  tasks: ProductionTask[];
  filteredTasks: ProductionTask[];
  processes: ProcessOption[];
  selectedTaskId: string | null;
  selectedProcessId: string | null;
  selectedTaskIds: Set<string>;
  disabledProcessKeys: Set<string>;
  hoveredTaskId: string | null;
  visibleProcessIdsByTask: Record<string, string[]>;
  batchMode: boolean;
  filterOpen: boolean;
  filterActive: boolean;
  filterKinds: ProductionTaskFilterKind[];
  filterValues: Partial<Record<ProductionTaskFilterKind, string[]>>;
  filterValueOptions: Record<ProductionTaskFilterKind, SelectOption[]>;
  allVisibleSelected: boolean;
  canCreateTask: boolean;
  onSelectTask: (taskId: string) => void;
  onSelectProcess: (processId: string) => void;
  onCreateTask: () => void;
  onToggleTaskSelection: (processKey: string) => void;
  onToggleBatchMode: () => void;
  onSelectAllVisible: () => void;
  onToggleProcessDisabled: (processKey: string) => void;
  onDisableSelection: () => void;
  onClearVisibleTasks: () => void;
  onToggleFilter: () => void;
  onFilterKindsChange: (nextKinds: ProductionTaskFilterKind[]) => void;
  onFilterValueChange: (kind: ProductionTaskFilterKind, nextValues: string[]) => void;
  onClearFilters: () => void;
  onHoverTaskChange: (taskId: string | null) => void;
};

export function ProductionTaskTreePanel1({
  tasks,
  filteredTasks,
  processes,
  selectedTaskId,
  selectedProcessId,
  selectedTaskIds,
  disabledProcessKeys,
  hoveredTaskId,
  batchMode,
  filterOpen,
  filterActive,
  filterKinds,
  filterValues,
  filterValueOptions,
  allVisibleSelected,
  canCreateTask,
  onSelectTask,
  onSelectProcess,
  onCreateTask,
  onToggleTaskSelection,
  onToggleBatchMode,
  onSelectAllVisible,
  onToggleProcessDisabled,
  onDisableSelection,
  onClearVisibleTasks,
  onToggleFilter,
  onFilterKindsChange,
  onFilterValueChange,
  onClearFilters,
  onHoverTaskChange,
}: ProductionTaskTreePanel1Props) {
  const selectedCount = selectedTaskIds.size;
  const hasVisibleTasks = filteredTasks.length > 0;

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 border-r border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel shadow-none backdrop-blur-sm">
      <div className="flex h-9 shrink-0 items-center border-b border-ds-border-process-planning-structure bg-transparent px-3 py-0">
        <div className="flex w-full items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium text-ds-text-control">生产任务</CardTitle>
          <div className="ml-auto flex items-center gap-1">
            {batchMode && (
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 px-1.5 text-xs hover:bg-transparent ${
                  allVisibleSelected ? 'text-ds-brand-primary-text hover:text-ds-brand-primary-text' : 'text-ds-text-muted hover:text-ds-text-primary'
                }`}
                disabled={!hasVisibleTasks}
                onClick={onSelectAllVisible}
              >
                全选
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-1.5 text-xs hover:bg-transparent ${
                batchMode ? 'text-ds-brand-primary-text hover:text-ds-brand-primary-text' : 'text-ds-text-muted hover:text-ds-text-primary'
              }`}
              disabled={tasks.length === 0}
              onClick={onToggleBatchMode}
            >
              批量操作
            </Button>
            <Tooltip title="筛选">
              <span>
                <button
                  type="button"
                  className={`inline-flex size-6 items-center justify-center rounded-md transition-colors ${
                    filterOpen || filterActive
                      ? 'text-ds-brand-primary-text hover:bg-transparent hover:text-ds-brand-primary-text'
                      : 'text-ds-text-disabled hover:bg-white/70 hover:text-ds-text-secondary'
                  } disabled:cursor-not-allowed disabled:text-ds-text-disabled`}
                  disabled={tasks.length === 0}
                  onClick={onToggleFilter}
                  aria-label="筛选生产任务"
                >
                  <Filter className="size-3.5" />
                </button>
              </span>
            </Tooltip>
            <Tooltip title={selectedCount > 0 ? `切换已勾选工序任务 ${selectedCount} 项禁用状态` : '请先勾选工序任务'}>
              <span>
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-md text-ds-text-disabled transition-colors hover:bg-white/70 hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled disabled:hover:bg-transparent"
                  disabled={selectedCount === 0}
                  onClick={onDisableSelection}
                  aria-label="切换已勾选工序任务禁用状态"
                >
                  <Ban className="size-3.5" />
                </button>
              </span>
            </Tooltip>
            <Tooltip title={canCreateTask ? '新建任务' : '请先清空任务列表后再新建任务'}>
              <span>
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-md text-ds-text-disabled transition-colors hover:bg-white/70 hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled disabled:hover:bg-transparent"
                  disabled={!canCreateTask}
                  onClick={onCreateTask}
                  aria-label="新建任务"
                >
                  <Plus className="size-3.5" />
                </button>
              </span>
            </Tooltip>
            <Tooltip title={hasVisibleTasks ? '清除当前列表' : '当前列表为空'}>
              <span>
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-md text-ds-text-disabled transition-colors hover:bg-white/70 hover:text-ds-text-secondary disabled:cursor-not-allowed disabled:text-ds-text-disabled disabled:hover:bg-transparent"
                  disabled={!hasVisibleTasks}
                  onClick={onClearVisibleTasks}
                  aria-label="清除当前列表"
                >
                  <ListX className="size-3.5" />
                </button>
              </span>
            </Tooltip>
          </div>
        </div>
      </div>
      <CardContent className="min-h-0 flex-1 p-0 !pb-0">
        {filterOpen && (
          <div className="border-b border-zinc-200/75 bg-white/54 p-3">
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
                <div className="mt-2 h-px bg-slate-200/80" />
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
                  {filterActive ? `已筛选 ${filteredTasks.length} / ${tasks.length} 项` : `共 ${tasks.length} 项任务`}
                </span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={!filterActive} onClick={onClearFilters}>
                  清除筛选
                </Button>
              </div>
            </div>
          </div>
        )}
        <ScrollArea className="h-full">
          <div className="space-y-1 p-3">
            {filteredTasks.length === 0 ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-dashed border-slate-200/70 bg-white/45 px-3 text-sm text-ds-text-disabled">
                {filterActive ? '当前筛选条件下没有生产任务' : '暂无生产任务'}
              </div>
            ) : filteredTasks.map((task) => {
                const selected = task.id === selectedTaskId;
                const taskProcesses = task.processIds.filter((processId) => processes.some((item) => item.id === processId));
                return (
                  <div
                    key={task.id}
                    className="group space-y-1"
                    onMouseEnter={() => onHoverTaskChange(task.id)}
                    onMouseLeave={() => onHoverTaskChange(null)}
                    onFocusCapture={() => onHoverTaskChange(task.id)}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) onHoverTaskChange(null);
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      className="relative w-full rounded-md border border-zinc-200/55 bg-zinc-50/55 px-2.5 py-1.5 text-left text-ds-text-muted shadow-none transition-colors hover:bg-zinc-50/80"
                      onClick={() => {
                        onSelectTask(task.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        onSelectTask(task.id);
                      }}
                    >
                      <div className="grid gap-1.5">
                        <div className="grid h-5 min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
                          <span className="flex h-full items-center text-[10px] font-medium leading-none text-ds-text-disabled">工件名称</span>
                          <span className="flex h-full min-w-0 items-center truncate text-xs font-medium leading-none text-ds-text-secondary">{task.name}</span>
                        </div>
                        <div className="grid h-5 min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
                          <span className="flex h-full items-center text-[10px] font-medium leading-none text-ds-text-disabled">加工数量</span>
                          <span className="flex h-full min-w-0 items-center text-xs font-medium leading-none text-ds-text-muted">{task.quantity} 件</span>
                        </div>
                        <div className="grid h-5 min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
                          <span className="flex h-full items-center text-[10px] font-medium leading-none text-ds-text-disabled">总体进度</span>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <MiniProgress value={task.progress} tone={task.state === 'done' ? 'emerald' : task.state === 'stopped' ? 'slate' : 'orange'} />
                            </div>
                            <span className="w-9 shrink-0 text-right text-xs font-medium text-ds-text-muted">{task.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <div className="space-y-1">
                        {taskProcesses.map((processId) => {
                          const process = processes.find((item) => item.id === processId);
                          const processSelected = selectedProcessId === processId;
                          const processKey = getProductionProcessKey(task.id, processId);
                          const processChecked = selectedTaskIds.has(processKey);
                          const processDisabled = disabledProcessKeys.has(processKey);
                          const processCheckboxVisible = batchMode || hoveredTaskId === processKey || processChecked;
                          const processAbnormal = task.workpieces.some(
                            (workpiece) => workpiece.state === 'abnormal' && workpiece.abnormalProcessId === processId,
                          );
                          const processRunning = !processAbnormal && task.state === 'running' && task.currentProcessId === processId;
                          const processPaused = !processAbnormal && task.state === 'paused' && task.currentProcessId === processId;
                          const processExecutionActive = processRunning || processPaused;
                          return (
                            <div
                              key={processId}
                              role="button"
                              tabIndex={processDisabled ? -1 : 0}
                              className={`group/process grid h-6 w-full grid-cols-[16px_8px_minmax(0,1fr)_24px] items-center gap-1.5 rounded-md px-1 text-left text-[11px] transition-colors ${
                                processDisabled
                                  ? 'cursor-not-allowed bg-neutral-100/60 text-ds-text-disabled'
                                  : processExecutionActive
                                    ? 'bg-neutral-200/60 text-ds-text-secondary'
                                    : processSelected
                                      ? 'bg-orange-50 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100'
                                      : 'text-ds-text-muted hover:bg-white/60'
                              }`}
                              onMouseEnter={() => onHoverTaskChange(processKey)}
                              onMouseLeave={() => onHoverTaskChange(null)}
                              onFocus={() => onHoverTaskChange(processKey)}
                              onBlur={() => onHoverTaskChange(null)}
                              onClick={() => {
                                if (!processDisabled) onSelectProcess(processId);
                              }}
                              onKeyDown={(event) => {
                                if (processDisabled || (event.key !== 'Enter' && event.key !== ' ')) return;
                                event.preventDefault();
                                onSelectProcess(processId);
                              }}
                            >
                              <Checkbox
                                size="sm"
                                checked={processChecked}
                                className={`size-3.5 transition-opacity [&_svg]:size-2.5 ${processCheckboxVisible ? 'opacity-100' : 'opacity-0'}`}
                                aria-label={`选择${process?.name ?? processId}`}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => onToggleTaskSelection(processKey)}
                              />
                              <Circle className={`size-2 ${
                                processDisabled
                                  ? 'fill-slate-200 text-slate-200'
                                  : processAbnormal
                                    ? 'fill-red-500 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.45)]'
                                    : processPaused
                                      ? 'fill-amber-500 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.35)]'
                                      : processRunning
                                        ? 'fill-emerald-500 text-emerald-500'
                                        : 'fill-slate-300 text-slate-300'
                              }`} />
                              {process ? (
                                <span className="min-w-0 overflow-hidden">
                                  <ProcessTitle process={process} disabled={processDisabled} />
                                </span>
                              ) : (
                                <span className={`min-w-0 flex-1 truncate ${processDisabled ? 'text-ds-text-disabled' : 'text-ds-text-secondary'}`}>{processId}</span>
                              )}
                              <span className={`pointer-events-none flex size-5 shrink-0 items-center justify-center rounded-ds-sm bg-white/90 opacity-0 shadow-sm ring-1 ring-inset transition-opacity transition-colors group-hover/process:pointer-events-auto group-hover/process:opacity-100 group-focus-within/process:pointer-events-auto group-focus-within/process:opacity-100 ${
                                disabledProcessKeys.has(processKey)
                                  ? 'text-ds-brand-primary-text ring-orange-100 hover:bg-orange-50 hover:text-ds-brand-primary-text'
                                  : 'text-ds-text-disabled ring-slate-100 hover:bg-slate-100 hover:text-ds-text-muted'
                              }`}>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  title={disabledProcessKeys.has(processKey) ? '解除禁用' : '禁用工序'}
                                  aria-label={disabledProcessKeys.has(processKey) ? '解除禁用工序' : '禁用工序'}
                                  aria-pressed={disabledProcessKeys.has(processKey)}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onToggleProcessDisabled(processKey);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key !== 'Enter' && event.key !== ' ') return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onToggleProcessDisabled(processKey);
                                  }}
                                >
                                  <Ban className="size-3" />
                                </span>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
