import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';

export function ProcessParameterModal({
  children,
  scrolled,
  onClose,
  onSave,
}: {
  children: ReactNode;
  scrolled: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4">
      <div className="flex h-[min(800px,calc(100vh-32px))] max-h-[calc(100vh-32px)] w-full max-w-[1280px] flex-col overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
        <div className={`relative z-10 box-border flex h-[52px] max-h-[52px] min-h-[52px] shrink-0 items-center justify-between border-b border-white/50 bg-ds-bg-glass-modal px-5 backdrop-blur-[var(--ds-blur-sticky-overlap)] transition-shadow duration-200 ${scrolled ? 'shadow-ds-sticky-overlap' : 'shadow-none'}`}>
          <div className="text-sm font-medium">工艺参数设置</div>
          <button type="button" className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={onClose} aria-label="关闭工艺参数设置"><X className="size-4" /></button>
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
        <div className="flex items-center justify-end gap-2 bg-ds-bg-glass-modal px-5 py-4 shadow-ds-footer-up backdrop-blur-[var(--ds-blur-sticky-overlap)]">
          <Button size="sm" className="h-8 bg-ds-brand-primary px-3 text-xs text-white hover:bg-ds-brand-primary-hover" onClick={onSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}
