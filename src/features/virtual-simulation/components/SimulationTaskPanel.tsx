import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, FileUp, Flame, Route, Trash2 } from 'lucide-react';
import type { SimulationSourceTask, SimulationWeldSegment } from '../types';

function WeldSegmentRow({
  segment,
  selected,
  associated,
  onSelect,
}: {
  segment: SimulationWeldSegment;
  selected: boolean;
  associated: boolean;
  onSelect: (segmentId: string) => void;
}) {
  const stateClass = selected
    ? 'bg-orange-50 text-ds-brand-primary-text'
    : associated
      ? 'text-ds-brand-primary-text'
      : 'text-ds-text-control hover:bg-ds-bg-process-planning-tree-group-hover';
  return (
    <button
      type="button"
      className={`grid h-7 w-full grid-cols-[16px_16px_minmax(0,1fr)] items-center gap-1.5 rounded-md px-2 text-left text-[11px] transition-colors ${stateClass}`}
      title={associated && !selected ? '与当前程序关联的焊缝段' : undefined}
      onClick={() => onSelect(segment.id)}
    >
      <span className="text-center text-[10px] text-zinc-400">•</span>
      <Route className={`size-3.5 ${selected || associated ? 'text-orange-500' : 'text-zinc-400'}`} />
      <span className="min-w-0 truncate">{segment.name}</span>
    </button>
  );
}

export function SimulationTaskPanel({
  tasks,
  selectedTaskId,
  selectedWeldNodeId,
  associatedWeldSegmentIds,
  onSelectTask,
  onSelectWeldTask,
  onSelectWeldSegment,
  onDeleteTask,
  onImport,
}: {
  tasks: SimulationSourceTask[];
  selectedTaskId: string | null;
  selectedWeldNodeId: string | null;
  associatedWeldSegmentIds: string[];
  onSelectTask: (taskId: string) => void;
  onSelectWeldTask: (weldTaskId: string) => void;
  onSelectWeldSegment: (segmentId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onImport: () => void;
}) {
  const [pendingDeleteTask, setPendingDeleteTask] = useState<SimulationSourceTask | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  return (
    <aside className="flex min-h-0 min-w-0 flex-col border-r border-zinc-200 bg-ds-bg-process-planning-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-200/75 px-3">
        <div className="text-xs font-medium text-ds-text-control">任务列表</div>
        <span className="text-[10px] text-ds-text-control-muted">{tasks.length} 个任务</span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-5 text-center">
          <div className="w-full rounded-ds-md border border-dashed border-zinc-200/80 bg-white/35 px-6 py-10">
            <FileUp className="mx-auto size-9 text-zinc-300" />
            <div className="mt-3 text-xs font-medium text-ds-text-control-muted">暂无仿真任务</div>
            <p className="mt-1.5 text-[10px] leading-5 text-zinc-400">从工艺规划发送，或从本地导入包含装配任务的文件</p>
            <button
              type="button"
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-md bg-ds-brand-primary px-3 text-[11px] font-medium text-white transition-colors hover:bg-ds-brand-primary-hover"
              onClick={onImport}
            >
              <FileUp className="size-3.5" />
              导入文件
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
          {tasks.map((task) => {
            const selected = task.id === selectedTask?.id;
            return (
              <div
                key={task.id}
                className={`overflow-hidden rounded-lg border shadow-ds-sm transition-colors ${
                  selected
                    ? 'border-orange-200 bg-orange-50/75 ring-1 ring-inset ring-orange-100'
                    : 'border-ds-border-process-planning-structure bg-white/82 hover:border-orange-100 hover:bg-white'
                }`}
              >
                <div className="grid min-h-11 grid-cols-[18px_minmax(0,1fr)_auto_auto] items-center gap-1.5 px-2.5">
                  <button
                    type="button"
                    className="flex size-5 items-center justify-center text-ds-text-control-muted"
                    aria-label={`选择第 ${String(task.processSequence).padStart(2, '0')} 道装配任务`}
                    onClick={() => onSelectTask(task.id)}
                  >
                    {selected ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="min-w-0 py-1.5 text-left"
                    aria-pressed={selected}
                    onClick={() => onSelectTask(task.id)}
                  >
                    <div className={`truncate text-xs font-medium ${selected ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`} title={task.displayName}>
                      第{String(task.processSequence).padStart(2, '0')}道 · 装配任务
                    </div>
                    <div className="mt-0.5 truncate text-[9px] text-zinc-400" title={task.targetLabel}>{task.targetLabel}</div>
                  </button>
                  <span className={`text-[9px] ${selected ? 'text-orange-600' : 'text-zinc-400'}`}>
                    {task.side === 'front' ? '正面' : '反面'}
                  </span>
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center text-zinc-400 transition-colors hover:text-red-600"
                    aria-label={`删除第 ${String(task.processSequence).padStart(2, '0')} 道装配任务`}
                    title="删除装配任务"
                    onClick={() => setPendingDeleteTask(task)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {selected && (
                  <div className="space-y-1 border-t border-orange-100/80 px-2 py-1.5 pl-5">
                    {task.weldTasks.map((weldTask) => {
                      const weldTaskSelected = selectedWeldNodeId === weldTask.id;
                      const weldTaskAssociated = weldTask.weldSegments.some((segment) => associatedWeldSegmentIds.includes(segment.id));
                      return (
                        <div key={weldTask.id}>
                          <button
                            type="button"
                            className={`grid h-7 w-full grid-cols-[16px_16px_minmax(0,1fr)] items-center gap-1.5 rounded-md px-2 text-left text-[11px] font-medium transition-colors ${
                              weldTaskSelected
                                ? 'bg-orange-100/75 text-ds-brand-primary-text'
                                : weldTaskAssociated
                                  ? 'text-ds-brand-primary-text'
                                  : 'text-ds-text-control hover:bg-white/65'
                            }`}
                            title={weldTaskAssociated && !weldTaskSelected ? '包含当前程序关联的焊缝段' : undefined}
                            onClick={() => onSelectWeldTask(weldTask.id)}
                          >
                            <ChevronDown className="size-3 text-ds-text-control-muted" />
                            <Flame className="size-3.5 text-orange-500" />
                            <span className="min-w-0 truncate">{weldTask.name}</span>
                          </button>

                          <div className="mt-0.5 space-y-0.5 pl-5">
                            {weldTask.weldSegments.map((segment) => (
                              <WeldSegmentRow
                                key={segment.id}
                                segment={segment}
                                selected={selectedWeldNodeId === segment.id}
                                associated={associatedWeldSegmentIds.includes(segment.id)}
                                onSelect={onSelectWeldSegment}
                              />
                            ))}
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
      )}

      <div className="shrink-0 border-t border-zinc-200/75 px-3 py-2 text-[10px] leading-4 text-ds-text-control-muted">
        {selectedTask ? `当前：第 ${String(selectedTask.processSequence).padStart(2, '0')} 道 · ${selectedTask.station}` : '可从工艺规划或本地文件创建'}
      </div>

      {pendingDeleteTask && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/35 p-6" role="presentation" onMouseDown={() => setPendingDeleteTask(null)}>
          <section
            className="w-full max-w-[400px] overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/10 backdrop-blur-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="simulation-task-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-red-500" />
              <h3 id="simulation-task-delete-title" className="text-sm font-medium text-ds-text-control-strong">确认删除装配任务</h3>
            </header>
            <p className="px-5 py-4 text-sm leading-6 text-slate-600">
              是否删除第 {String(pendingDeleteTask.processSequence).padStart(2, '0')} 道装配任务？其内部焊接任务、焊缝段和已生成程序将一并移除。
            </p>
            <footer className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <button type="button" className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs text-ds-text-control hover:bg-zinc-50" onClick={() => setPendingDeleteTask(null)}>
                取消
              </button>
              <button
                type="button"
                className="h-8 rounded-md bg-red-500 px-3 text-xs font-medium text-white hover:bg-red-600"
                onClick={() => {
                  onDeleteTask(pendingDeleteTask.id);
                  setPendingDeleteTask(null);
                }}
              >
                确认删除
              </button>
            </footer>
          </section>
        </div>
      )}
    </aside>
  );
}
