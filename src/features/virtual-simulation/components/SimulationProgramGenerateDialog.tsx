import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import type { SimulationRobotId, SimulationSourceTask } from '../types';

type SimulationTaskRobotAssignments = Record<string, Record<string, SimulationRobotId>>;

const robotOptions: { id: SimulationRobotId; label: string }[] = [
  { id: 'robot1', label: 'Robot1' },
  { id: 'robot2', label: 'Robot2' },
];

export function SimulationProgramGenerateDialog({
  task,
  assignments,
  hasExistingProgram,
  onClose,
  onConfirm,
}: {
  task: SimulationSourceTask;
  assignments: SimulationTaskRobotAssignments;
  hasExistingProgram: boolean;
  onClose: () => void;
  onConfirm: (assignments: SimulationTaskRobotAssignments) => void;
}) {
  const [draftAssignments, setDraftAssignments] = useState(assignments);
  const [currentWeldTaskIndex, setCurrentWeldTaskIndex] = useState(0);
  const [lastPageVisited, setLastPageVisited] = useState(task.weldTasks.length <= 1);
  const [replaceConfirmationOpen, setReplaceConfirmationOpen] = useState(false);
  const currentWeldTask = task.weldTasks[currentWeldTaskIndex] ?? task.weldTasks[0];
  const hasMultipleWeldTasks = task.weldTasks.length > 1;
  const generationUnlocked = !hasMultipleWeldTasks || lastPageVisited;

  useEffect(() => {
    setDraftAssignments(assignments);
    setCurrentWeldTaskIndex(0);
    setLastPageVisited(task.weldTasks.length <= 1);
    setReplaceConfirmationOpen(false);
  }, [assignments, task.id, task.weldTasks.length]);

  const requestGenerate = () => {
    if (!generationUnlocked) return;
    if (hasExistingProgram) {
      setReplaceConfirmationOpen(true);
      return;
    }
    onConfirm(draftAssignments);
  };

  const goToWeldTask = (nextIndex: number) => {
    const safeIndex = Math.min(task.weldTasks.length - 1, Math.max(0, nextIndex));
    setCurrentWeldTaskIndex(safeIndex);
    if (safeIndex === task.weldTasks.length - 1) setLastPageVisited(true);
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="flex max-h-[min(720px,calc(100vh-48px))] w-full max-w-[500px] flex-col overflow-hidden rounded-xl border border-white/70 bg-ds-bg-process-planning-panel shadow-2xl shadow-black/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-program-generate-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-orange-500" />
            <h2 id="simulation-program-generate-title" className="text-sm font-medium text-ds-text-control-strong">程序生成</h2>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white hover:text-zinc-600"
            aria-label="关闭程序生成"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
            <div className="text-xs text-ds-text-parameter-label">加工任务</div>
            <div className="min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-ds-text-control shadow-ds-sm">
              <div className="truncate font-medium">第{String(task.processSequence).padStart(2, '0')}道 · 装配任务</div>
              <div className="mt-0.5 truncate text-[10px] text-zinc-400">{task.targetLabel}</div>
            </div>
          </div>

          {currentWeldTask && (
            <section className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-white/70 p-3">
              <div className="mb-2.5 flex h-7 items-center justify-between gap-3">
                <div className="min-w-0 truncate text-xs font-medium text-ds-text-control">
                  {currentWeldTask.name}
                </div>
                {hasMultipleWeldTasks && (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 text-[10px] text-zinc-400">{currentWeldTaskIndex + 1} / {task.weldTasks.length}</span>
                    <button
                      type="button"
                      disabled={currentWeldTaskIndex === 0}
                      className="flex size-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-orange-50 hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
                      aria-label="上一个焊接任务"
                      onClick={() => goToWeldTask(currentWeldTaskIndex - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentWeldTaskIndex === task.weldTasks.length - 1}
                      className="flex size-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-orange-50 hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
                      aria-label="下一个焊接任务"
                      onClick={() => goToWeldTask(currentWeldTaskIndex + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {currentWeldTask.weldSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-zinc-100 bg-ds-bg-process-planning-task-detail px-2.5 py-1.5"
                  >
                    <span className="truncate text-xs font-medium text-ds-text-control">{segment.name}</span>
                    <div className="flex items-center gap-1.5">
                      {robotOptions.map((robot) => {
                        const selected = draftAssignments[currentWeldTask.id]?.[segment.id] === robot.id;
                        return (
                          <button
                            key={robot.id}
                            type="button"
                            aria-pressed={selected}
                            className={`flex h-7 items-center rounded-full border px-2.5 text-[11px] transition-colors ${
                              selected
                                ? 'border-orange-300 bg-orange-50 font-medium text-ds-brand-primary-text'
                                : 'border-zinc-200 bg-white text-ds-text-control-muted hover:border-orange-200 hover:text-ds-brand-primary-text'
                            }`}
                            onClick={() => setDraftAssignments((current) => ({
                              ...current,
                              [currentWeldTask.id]: {
                                ...(current[currentWeldTask.id] ?? {}),
                                [segment.id]: robot.id,
                              },
                            }))}
                          >
                            {robot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="flex h-14 shrink-0 items-center justify-between gap-2 border-t border-zinc-200/80 bg-white/55 px-4">
          <span className="text-[10px] text-zinc-400">
            {hasMultipleWeldTasks && !generationUnlocked ? '请翻到最后一个焊接任务后生成程序' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs text-ds-text-control transition-colors hover:bg-zinc-50"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              disabled={!currentWeldTask || currentWeldTask.weldSegments.length === 0 || !generationUnlocked}
              className="h-8 rounded-md bg-ds-brand-primary px-3 text-xs font-medium text-white transition-colors hover:bg-ds-brand-primary-hover disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={requestGenerate}
            >
              程序生成
            </button>
          </div>
        </footer>
      </section>

      {replaceConfirmationOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-6"
          role="presentation"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <section
            className="w-full max-w-[400px] overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/10 backdrop-blur-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="simulation-program-replace-title"
            aria-describedby="simulation-program-replace-description"
          >
            <header className="flex items-center gap-2 border-b border-white/50 px-5 py-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <h3 id="simulation-program-replace-title" className="text-sm font-medium text-ds-text-control-strong">确认替换程序</h3>
            </header>
            <p id="simulation-program-replace-description" className="px-5 py-4 text-sm leading-6 text-slate-600">
              当前装配任务已存在加工程序。继续生成将替换其全部焊接任务对应的程序列表和指令数据，各组轴值沿用当前设置。
            </p>
            <footer className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
              <button
                type="button"
                className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-xs text-ds-text-control transition-colors hover:bg-zinc-50"
                onClick={() => setReplaceConfirmationOpen(false)}
              >
                返回修改
              </button>
              <button
                type="button"
                className="h-8 rounded-md bg-ds-brand-primary px-3 text-xs font-medium text-white transition-colors hover:bg-ds-brand-primary-hover"
                onClick={() => onConfirm(draftAssignments)}
              >
                确认替换
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
