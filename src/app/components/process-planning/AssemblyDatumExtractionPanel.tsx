import { ChevronDown, CircleAlert, CircleCheck, Minus, Target, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';
import type { AssemblyDatumModalState, ProcessPlanningPart } from './types';

export function AssemblyDatumExtractionPanel({
  modal,
  parts,
  immersive,
  adjacent,
  selectionInvalid,
  onToggleMinimized,
  onClose,
  onPartChange,
  onNameChange,
  onConfirm,
}: {
  modal: AssemblyDatumModalState;
  parts: ProcessPlanningPart[];
  immersive: boolean;
  adjacent: boolean;
  selectionInvalid: boolean;
  onToggleMinimized: () => void;
  onClose: () => void;
  onPartChange: (partKey: 'A' | 'B', id: string | null) => void;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
}) {
  const ready = Boolean(
    modal.partAId && modal.partBId && adjacent && modal.selectedEdgeId && modal.datumName.trim()
  );

  return (
    <div className={`absolute top-3 z-50 w-[280px] rounded-lg border border-white/50 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md ${immersive ? 'left-[336px]' : 'right-3'}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Target className="size-4 text-orange-500" />
          <span className="text-xs font-medium">装配基准提取</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100"
            onClick={onToggleMinimized}
            title={modal.minimized ? '展开' : '最小化'}
          >
            {modal.minimized ? <ChevronDown className="size-3.5" /> : <Minus className="size-3.5" />}
          </button>
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100" onClick={onClose} aria-label="关闭装配基准提取">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {!modal.minimized && (
        <>
          <div className="space-y-3 p-3">
            <div className="space-y-2">
              <div className="ds-label-input-mini">
                <label className="ds-label-input-mini-label">子板</label>
                <ProcessSingleSelect
                  items={parts}
                  selectedId={modal.partAId}
                  invalid={selectionInvalid}
                  placeholder="请选择子板"
                  size="sm"
                  elevation="none"
                  wrapSelectedLabel
                  onChange={(id) => onPartChange('A', id)}
                />
              </div>
              <div className="ds-label-input-mini">
                <label className="ds-label-input-mini-label">父板</label>
                <ProcessSingleSelect
                  items={parts}
                  selectedId={modal.partBId}
                  invalid={selectionInvalid}
                  placeholder="请选择父板"
                  size="sm"
                  elevation="none"
                  wrapSelectedLabel
                  onChange={(id) => onPartChange('B', id)}
                />
              </div>
            </div>

            <div className="space-y-2">
              {modal.selectedEdgeId ? (
                <div className="flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50/40 px-2 py-1.5 text-[11px] text-emerald-600">
                  <CircleCheck className="size-3.5 shrink-0" />
                  <span className="min-w-0 truncate" title={modal.selectedEdgeId}>{`已选择基准线：${modal.selectedEdgeId}`}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50/65 px-2 py-1.5 text-[11px] text-slate-500">
                  <CircleAlert className="size-3.5 shrink-0 text-slate-400" />
                  <span>请选择基准线</span>
                </div>
              )}
              <div className="ds-label-input-mini">
                <label className="ds-label-input-mini-label">基准名称</label>
                <input
                  type="text"
                  value={modal.datumName}
                  placeholder="自动生成，可编辑"
                  onChange={(event) => onNameChange(event.target.value)}
                  className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-ds-brand-primary"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
            <div className="min-w-0 flex-1">
              {selectionInvalid ? (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600"><CircleAlert className="size-3.5 shrink-0" /><span className="truncate">子板与父板不相接</span></div>
              ) : modal.error && !modal.selectedEdgeId ? (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600"><CircleAlert className="size-3.5 shrink-0" /><span className="truncate">{modal.error}</span></div>
              ) : !modal.partAId || !modal.partBId ? (
                <div className="truncate text-[11px] text-slate-400">请选择相接的子板和父板</div>
              ) : !modal.selectedEdgeId ? (
                <div className="truncate text-[11px] text-slate-400">请在 3D 视窗中点击基准线</div>
              ) : (
                <div className="truncate text-[11px] text-slate-400">可确认添加基准</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={onClose}>关闭</Button>
              <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover" disabled={!ready} onClick={onConfirm}>确认</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
