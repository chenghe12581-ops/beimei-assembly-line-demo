import { SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from './utils';

type PanelEmptyStateProps = {
  label?: string;
  icon?: LucideIcon;
  className?: string;
};

export function PanelEmptyState({
  label = '暂无任务',
  icon: Icon = SlidersHorizontal,
  className,
}: PanelEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 items-center justify-center rounded-lg border border-dashed border-slate-200/70 bg-transparent px-5 py-8 text-center text-slate-400',
        className,
      )}
    >
      <div className="flex -translate-y-6 flex-col items-center gap-6">
        <Icon className="size-10" />
        <div className="text-sm font-light">{label}</div>
      </div>
    </div>
  );
}
