import { ChevronRight } from 'lucide-react';

export function ProcessPathPointGroupHeader({
  title,
  collapsed,
  onToggle,
  className = '',
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      className={`flex h-7 w-full items-center justify-between rounded-ds-sm border-y border-slate-900/[0.00] bg-slate-900/[0.03] pl-2.5 pr-2 text-left transition-colors hover:bg-slate-900/[0.05] ${className}`.trim()}
      onClick={onToggle}
    >
      <span className="text-[10px] font-medium text-ds-text-parameter-label">{title}</span>
      <ChevronRight className={`size-3.5 text-zinc-400 transition-transform duration-500 ease-ds-standard ${collapsed ? 'rotate-180' : 'rotate-90'}`} />
    </button>
  );
}
