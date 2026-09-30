import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export type ProcessSingleSelectItem = {
  id: string;
  name: string;
};

export function ProcessSingleSelect({
  items,
  selectedId,
  invalid,
  disabled = false,
  placeholder = '请选择',
  size = 'md',
  elevation = 'none',
  dropdownMode = 'inline',
  wrapSelectedLabel = false,
  onChange,
}: {
  items: ProcessSingleSelectItem[];
  selectedId: string | null;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'task' | 'md';
  elevation?: 'none' | 'sm';
  dropdownMode?: 'inline' | 'portal';
  wrapSelectedLabel?: boolean;
  onChange: (nextId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [portalRect, setPortalRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) : null;
  const compact = size === 'sm';
  const taskCompact = size === 'task';
  const triggerSizeClass = compact
    ? 'min-h-7 rounded-md px-2 py-1 text-[11px]'
    : taskCompact
      ? 'h-8 rounded-md px-2 text-xs'
      : 'min-h-9 rounded-lg px-2.5 py-1.5 text-xs';
  const optionSizeClass = compact ? 'px-2 py-1.5 text-[11px]' : 'px-2.5 py-2 text-xs';
  const triggerElevationClass = elevation === 'none' ? 'shadow-none' : 'shadow-sm';

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || dropdownMode !== 'portal') return;

    const updatePortalRect = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPortalRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
      });
    };

    updatePortalRect();
    window.addEventListener('resize', updatePortalRect);
    window.addEventListener('scroll', updatePortalRect, true);
    return () => {
      window.removeEventListener('resize', updatePortalRect);
      window.removeEventListener('scroll', updatePortalRect, true);
    };
  }, [dropdownMode, open]);

  const selectItem = (itemId: string | null) => {
    onChange(itemId);
    setOpen(false);
  };

  const dropdownMenu = open && !disabled ? (
    <div
      ref={menuRef}
      className={`ds-dropdown-surface max-h-56 overflow-auto rounded-xl p-1.5 ${
        dropdownMode === 'portal' ? 'fixed z-[1000]' : 'absolute left-0 right-0 top-full z-50 mt-1'
      }`}
      style={dropdownMode === 'portal' && portalRect ? {
        left: portalRect.left,
        top: portalRect.top,
        width: portalRect.width,
      } : undefined}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            className={`flex w-full items-center gap-2 rounded-lg text-left transition-colors ${optionSizeClass} ${
              selected
                ? invalid
                  ? 'bg-red-50 text-red-600'
                  : 'bg-slate-50 text-slate-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => selectItem(item.id)}
          >
            <span className="min-w-0 flex-1 truncate" title={item.name}>
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 border bg-white text-left transition-colors hover:border-ds-border-strong disabled:cursor-not-allowed disabled:bg-ds-bg-control-disabled ${triggerElevationClass} ${triggerSizeClass} ${invalid ? 'border-red-300 bg-red-50/60' : 'border-ds-border-default'}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className={`min-w-0 flex-1 ${wrapSelectedLabel ? '!whitespace-normal !overflow-visible !text-clip break-all leading-4' : 'truncate'} ${selectedItem ? invalid ? 'text-red-600' : 'text-slate-600' : 'font-normal text-slate-400'}`}
          title={selectedItem?.name}
        >
          {selectedItem?.name ?? placeholder}
        </span>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {dropdownMode === 'portal' && typeof document !== 'undefined'
        ? createPortal(dropdownMenu, document.body)
        : dropdownMenu}
    </div>
  );
}
