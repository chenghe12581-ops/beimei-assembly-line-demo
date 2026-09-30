import { Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';

export function AddProcessTaskDialog({ children, onClose, onConfirm }: { children: ReactNode; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[520px] overflow-visible rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/50 px-5 py-3">
          <div className="flex items-center gap-2"><Plus className="size-5 text-orange-500" /><span className="text-sm font-medium">新增任务</span></div>
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={onClose} aria-label="关闭新增任务弹窗"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3"><Button size="sm" variant="outline" onClick={onClose}>取消</Button><Button size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={onConfirm}>确认新增</Button></div>
      </div>
    </div>
  );
}
