import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Checkbox, ConfigProvider } from 'antd';
import type { CheckboxProps } from 'antd/es/checkbox';

export type ObjectMultiSelectItem = {
  id: string;
  name: string;
};

const ThemedCheckbox = ({ className = '', ...props }: CheckboxProps) => (
  <ConfigProvider theme={{ token: { colorPrimary: '#FF6900' } }}>
    <Checkbox className={className} {...props} />
  </ConfigProvider>
);

export function ObjectMultiSelect({
  items,
  selectedIds,
  invalid,
  placeholder = '请选择对象',
  size = 'md',
  showSelectAll = false,
  selectAllLabel = '全选',
  onChange,
}: {
  items: ObjectMultiSelectItem[];
  selectedIds: string[];
  invalid?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
  showSelectAll?: boolean;
  selectAllLabel?: string;
  onChange: (nextIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItems = selectedIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as ObjectMultiSelectItem[];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const toggleItem = (itemId: string, checked: boolean) => {
    const nextIds = checked
      ? Array.from(new Set([...selectedIds, itemId]))
      : selectedIds.filter((id) => id !== itemId);
    onChange(nextIds);
  };

  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const partiallySelected = selectedIds.length > 0 && !allSelected;
  const compact = size === 'sm';
  const visibleSelectedItems = compact ? selectedItems.slice(0, 2) : selectedItems;
  const hiddenSelectedCount = compact ? Math.max(0, selectedItems.length - visibleSelectedItems.length) : 0;
  const triggerClassName = compact
    ? 'flex h-7 w-full items-center justify-between gap-1.5 rounded-md border bg-white px-2 text-left text-[11px] shadow-none transition-colors hover:border-ds-border-strong'
    : 'flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left text-xs shadow-none transition-colors hover:border-ds-border-strong';
  const selectedWrapClassName = compact
    ? 'flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden'
    : 'flex min-w-0 flex-1 flex-wrap items-center gap-1.5';
  const chipClassName = compact
    ? 'max-w-[96px] truncate rounded-full px-1.5 py-0 text-[10px] leading-5'
    : 'max-w-[180px] truncate rounded-full px-2 py-0.5';
  const optionClassName = compact
    ? 'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-slate-600 transition-colors hover:bg-slate-50'
    : 'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50';
  const checkboxClassName = compact
    ? '[&_.ant-checkbox]:h-3.5 [&_.ant-checkbox]:w-3.5 [&_.ant-checkbox-input]:h-3.5 [&_.ant-checkbox-input]:w-3.5 [&_.ant-checkbox-inner]:h-3.5 [&_.ant-checkbox-inner]:w-3.5 [&_.ant-checkbox-inner:after]:h-[7px] [&_.ant-checkbox-inner:after]:w-[4px]'
    : '';

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        className={`${triggerClassName} ${invalid ? 'border-red-300' : 'border-ds-border-default'}`}
        onClick={() => setOpen((value) => !value)}
      >
        <div className={selectedWrapClassName}>
          {selectedItems.length === 0 ? (
            <span className="font-normal text-slate-400">{placeholder}</span>
          ) : (
            visibleSelectedItems.map((item) => (
              <span
                key={item.id}
                className={`${chipClassName} ${invalid ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-slate-100 text-slate-600'}`}
                title={item.name}
              >
                {item.name}
              </span>
            ))
          )}
          {hiddenSelectedCount > 0 && (
            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[10px] leading-5 text-slate-500">
              +{hiddenSelectedCount}
            </span>
          )}
        </div>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="ds-dropdown-surface absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-auto rounded-xl p-1.5">
          {showSelectAll && items.length > 0 && (
            <div
              role="button"
              tabIndex={0}
              className="mb-1 flex cursor-pointer items-center gap-2 rounded-lg border-b border-slate-100 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              onClick={() => {
                onChange(allSelected ? [] : items.map((item) => item.id));
                setOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onChange(allSelected ? [] : items.map((item) => item.id));
                setOpen(false);
              }}
            >
              <ThemedCheckbox
                checked={allSelected}
                indeterminate={partiallySelected}
                className={checkboxClassName}
                onChange={() => undefined}
              />
              <span className="min-w-0 flex-1 truncate">{selectAllLabel}</span>
            </div>
          )}
          {items.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className={`${optionClassName} ${invalid && checked ? 'ring-1 ring-inset ring-red-300' : ''}`}
              >
                <ThemedCheckbox
                  checked={checked}
                  className={checkboxClassName}
                  onChange={(event) => toggleItem(item.id, event.target.checked)}
                />
                <span className="min-w-0 flex-1 truncate" title={item.name}>
                  {item.name}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
