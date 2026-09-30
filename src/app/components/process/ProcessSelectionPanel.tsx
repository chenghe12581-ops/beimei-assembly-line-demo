import { CircleAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { ObjectMultiSelect, type ObjectMultiSelectItem } from './ObjectMultiSelect';

export function ProcessSelectionPanel({
  label,
  items,
  selectedIds,
  placeholder,
  actionLabel,
  onChange,
  onAction,
  invalid = false,
  invalidMessage = '所选工件不相接',
  emptyText,
  className = '',
  variant = 'default',
  selectSize = 'md',
}: {
  label: string;
  items: ObjectMultiSelectItem[];
  selectedIds: string[];
  placeholder: string;
  actionLabel: string;
  onChange: (nextIds: string[]) => void;
  onAction: () => void;
  invalid?: boolean;
  invalidMessage?: string;
  emptyText?: string;
  className?: string;
  variant?: 'default' | 'flush';
  selectSize?: 'sm' | 'md';
}) {
  const surfaceClassName = variant === 'flush' ? '' : 'rounded-xl bg-slate-50/80 p-3';

  return (
    <div className={`${surfaceClassName} ${className}`.trim()}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="shrink-0 text-xs text-ds-text-parameter-label">{label}</div>
          {invalid && (
            <div className="flex shrink-0 items-center gap-1 text-[11px] text-red-500">
              <CircleAlert className="size-3.5" />
              {invalidMessage}
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-[11px]" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
      {emptyText && items.length === 0 ? (
        <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-400 ring-1 ring-slate-200">{emptyText}</div>
      ) : (
        <ObjectMultiSelect
          items={items}
          selectedIds={selectedIds}
          invalid={invalid}
          placeholder={placeholder}
          size={selectSize}
          onChange={onChange}
        />
      )}
    </div>
  );
}
