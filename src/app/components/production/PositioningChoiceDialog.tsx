import { Camera, ChevronRight, Import, LoaderCircle, X } from 'lucide-react';
import { Button } from '../ui/button';

export type PositioningDialogImportStatus = 'idle' | 'error' | 'loading';

export function PositioningChoiceDialog({
  locating,
  locateSucceeded,
  importStatus,
  onExecutePositioning,
  onImportPosition,
  onViewResult,
  onClose,
}: {
  locating: boolean;
  locateSucceeded: boolean;
  importStatus: PositioningDialogImportStatus;
  onExecutePositioning: () => void;
  onImportPosition: () => void;
  onViewResult: () => void;
  onClose: () => void;
}) {
  const busy = locating || importStatus === 'loading';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true" aria-labelledby="positioning-dialog-title">
      <div className="flex w-full max-w-[780px] flex-col overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md">
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-white/50 px-5">
          <div id="positioning-dialog-title" className="text-sm font-medium text-ds-text-control-strong">二次定位/导入工件位置</div>
          <button type="button" className="rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" onClick={onClose} aria-label="关闭二次定位弹窗">
            <X className="size-4" />
          </button>
        </div>

        <div className="bg-transparent px-8 py-8">
          <div className="relative grid min-h-[318px] grid-cols-2 overflow-hidden rounded-lg border border-dashed border-slate-200/70 bg-zinc-100/55 pt-12">
          <section className="flex min-w-0 flex-col items-center justify-center px-10 py-10 text-center">
            <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-orange-50 text-ds-brand-primary-text">
              <Camera className="size-5" />
            </div>
            <div className="text-sm font-medium text-ds-text-control-strong">执行定位</div>
            <Button type="button" size="sm" className="mt-5 h-8 min-w-28 gap-1.5 bg-ds-brand-primary text-xs text-white hover:bg-ds-brand-primary-hover" disabled={busy} onClick={onExecutePositioning}>
              {locating ? <LoaderCircle className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
              {locating ? '定位中' : locateSucceeded ? '重新执行定位' : '执行定位'}
            </Button>
            <div className="mt-3 min-h-7">
              {locateSucceeded && !locating && (
                <button type="button" className="inline-flex items-center gap-0.5 text-xs font-medium text-ds-brand-primary-text hover:text-ds-brand-primary" onClick={onViewResult}>
                  查看视觉结果
                  <ChevronRight className="size-3.5" />
                </button>
              )}
              {locating && <div className="text-xs text-ds-text-muted">正在获取视觉定位结果</div>}
            </div>
          </section>

          <section className="flex min-w-0 flex-col items-center justify-center px-10 py-10 text-center">
            <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-zinc-100 text-ds-text-control">
              <Import className="size-5" />
            </div>
            <div className="text-sm font-medium text-ds-text-control-strong">导入工件位置</div>
            <Button type="button" size="sm" variant="outline" className="mt-5 h-8 min-w-28 gap-1.5 text-xs" disabled={busy} onClick={onImportPosition}>
              {importStatus === 'loading' ? <LoaderCircle className="size-3.5 animate-spin" /> : <Import className="size-3.5" />}
              {importStatus === 'loading' ? '导入中' : '导入工件位置'}
            </Button>
            <div className="mt-3 min-h-7" aria-live="polite">
              {importStatus === 'error' && (
                <div className="text-xs leading-5 text-red-600">
                  <div className="font-medium">导入失败</div>
                  <div className="text-red-500">结果数据不完整，请重新导入</div>
                </div>
              )}
              {importStatus === 'loading' && <div className="text-xs text-ds-text-muted">正在校验导入结果</div>}
            </div>
          </section>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-12 left-1/2 border-l border-ds-border-default" />
          </div>
        </div>

        <div className="flex items-center justify-end bg-ds-bg-glass-modal px-5 py-4 shadow-ds-footer-up">
          <Button type="button" size="sm" variant="outline" className="h-8 px-3 text-xs" disabled={busy} onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
