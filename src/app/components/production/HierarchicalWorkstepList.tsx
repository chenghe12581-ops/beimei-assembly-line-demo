import { Box, Circle, Layers3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatCombinedPartObject } from './ProductionTaskTreePanel2';

export type HierarchicalWorkstep = { name: string; index: number };
export type HierarchicalWorkstepGroup = { id: string; label: string; objectLabel?: string; steps: HierarchicalWorkstep[] };

type HierarchicalWorkstepListProps = {
  workpieceLabel: string;
  groups: HierarchicalWorkstepGroup[];
  currentIndex?: number;
  selectedIndex?: number;
  executingIndex?: number | null;
  completedUntil?: number;
  interactive?: boolean;
  disabled?: boolean;
  onSelect?: (index: number) => void;
  renderStepSuffix?: (step: HierarchicalWorkstep) => ReactNode;
  className?: string;
};

/** 生产执行工位详情的三级工步样式：工件 → 工步类 → 工步。 */
export function HierarchicalWorkstepList({
  workpieceLabel, groups, currentIndex, selectedIndex, executingIndex = null,
  interactive = false, disabled = false, onSelect, renderStepSuffix, completedUntil, className = '',
}: HierarchicalWorkstepListProps) {
  const stepContent = (step: HierarchicalWorkstep, current: boolean, selected: boolean, executing: boolean, completed: boolean) => (
    <>
      <span className="flex h-5 shrink-0 items-center">
        <Circle className={'size-2.5 shrink-0 ' + (executing || current ? 'fill-orange-500 text-orange-500' : completed ? 'fill-emerald-500 text-emerald-500' : selected ? 'fill-orange-300 text-orange-400' : 'fill-slate-200 text-slate-200')} />
      </span>
      <span className={'flex min-w-0 flex-1 items-center break-words whitespace-normal pb-0.5 leading-5 ' + (executing || current ? 'text-slate-700' : completed ? 'text-emerald-700' : selected ? 'text-orange-700' : 'text-slate-500')}>{step.name}</span>
      {executing && <span className="shrink-0 text-xs font-medium leading-5 text-orange-600">执行中</span>}
      {!executing && current && <span className="shrink-0 text-xs font-medium leading-5 text-orange-600">当前</span>}
      {selected && !current && !executing && <span className="shrink-0 text-xs font-medium leading-5 text-orange-600">已选</span>}
      {renderStepSuffix?.(step)}
    </>
  );
  return (
    <div className={'overflow-hidden rounded-ds-md bg-white/60 ' + className}>
      <div className="flex items-center gap-2 bg-ds-bg-process-planning-tree-group px-3 py-2 text-xs font-medium text-slate-700">
        <Box className="size-4 shrink-0 text-slate-400" strokeWidth={1.8} />
        <span className="min-w-0 flex-1 truncate">{workpieceLabel || '工件'}</span>
      </div>
      <div className="space-y-1.5 px-2 py-2">
        {groups.map((group) => (
          <section key={group.id} className="rounded-ds-md bg-white/70 px-2.5 py-1">
            <div className="flex min-w-0 items-center gap-2 pb-1.5">
              <Layers3 className="size-4 shrink-0 text-slate-400" strokeWidth={1.8} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{group.label}</span>
              {group.objectLabel && <span className="max-w-[48%] shrink-0 truncate text-xs text-slate-400">{formatCombinedPartObject(group.objectLabel)}</span>}
            </div>
            <div className="space-y-0.5 pl-5">
              {group.steps.map((step) => {
                const current = currentIndex === step.index;
                const selected = selectedIndex === step.index;
                const executing = executingIndex === step.index;
                const completed = completedUntil !== undefined && step.index < completedUntil;
                const content = stepContent(step, current, selected, executing, completed);
                if (!interactive) return <div key={group.id + step.index} className="flex min-h-7 items-start gap-2 px-3 py-1 text-xs">{content}</div>;
                return <button key={group.id + step.index} type="button" className={(selected ? 'bg-orange-50/80 ring-1 ring-inset ring-orange-300 ' : 'hover:bg-slate-100/80 ') + (disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer') + ' flex min-h-7 w-full items-start gap-2 rounded-md px-3 py-1 text-left text-xs transition-colors'} aria-pressed={selected} disabled={disabled} onClick={() => onSelect?.(step.index)}>{content}</button>;
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
