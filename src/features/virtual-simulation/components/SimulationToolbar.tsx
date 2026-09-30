import { ArrowLeft, ChevronRight, Download, FileUp, Sparkles } from 'lucide-react';
import type { SimulationSourceTask } from '../types';

export function SimulationToolbar({
  task,
  hasProgram,
  onBackToPlanning,
  onImport,
  onGenerate,
  onExport,
}: {
  task: SimulationSourceTask | null;
  hasProgram: boolean;
  onBackToPlanning: () => void;
  onImport: () => void;
  onGenerate: () => void;
  onExport: () => void;
}) {
  const hasPlanningTaskPath = task?.sourceKind === 'process-planning';

  return (
    <div className="ds-process-toolbar relative z-50 grid h-[74px] shrink-0 grid-cols-[320px_minmax(0,1fr)_420px] items-center gap-2 overflow-visible border-b border-ds-border-process-planning-structure bg-ds-bg-process-planning-toolbar px-3 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        {hasPlanningTaskPath && (
          <button
            type="button"
            className="flex h-7 shrink-0 items-center gap-1 rounded-lg px-1.5 text-sm text-ds-text-control-muted transition-colors hover:bg-white/70 hover:text-ds-text-control-strong"
            onClick={onBackToPlanning}
            aria-label="返回工艺规划"
          >
            <ArrowLeft className="size-4" />
            <span>返回工艺规划</span>
          </button>
        )}
        <div className="min-w-0">
          {task ? (
            <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-sm">
              <span className="font-normal text-zinc-400">
                {task.sourceKind === 'local-file' ? '本地文件' : '0162'}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={2.4} />
              <span className="font-medium text-zinc-900" title={task.sourceFileName ?? task.assemblyId}>
                {task.sourceKind === 'local-file'
                  ? task.sourceFileName ?? task.displayName
                  : task.assemblyId}
              </span>
            </div>
          ) : (
            <div className="whitespace-nowrap text-sm font-medium text-zinc-900">虚拟仿真</div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-center gap-1">
        <button
          type="button"
          className="flex h-16 min-w-[82px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong"
          onClick={onImport}
        >
          <FileUp className="size-6" />
          <span className="text-xs">导入文件</span>
        </button>
        <button
          type="button"
          disabled={!task}
          className="flex h-16 min-w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong disabled:cursor-not-allowed disabled:text-ds-text-control-disabled disabled:hover:bg-transparent"
          onClick={onGenerate}
        >
          <Sparkles className="size-6" />
          <span className="text-xs">程序生成</span>
        </button>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1">
        <button
          type="button"
          disabled={!hasProgram}
          className="flex h-16 min-w-[70px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 text-ds-text-control transition-colors hover:bg-white/80 hover:text-ds-text-control-strong disabled:cursor-not-allowed disabled:text-ds-text-control-disabled disabled:hover:bg-transparent"
          onClick={onExport}
        >
          <Download className="size-6" />
          <span className="text-xs">导出指令</span>
        </button>
      </div>
    </div>
  );
}
