import { ChevronDown, CircleAlert, CircleCheck, Minus, Target, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';
import type {
  AssemblyDatumModalState,
  AssemblyDatumStepKey,
  AssemblyDatumStepMeta,
  ProcessPlanningPart,
} from './types';

function DatumStatusRow({ status, value }: { status: 'empty' | 'pending' | 'selected'; value: string }) {
  const selected = status === 'selected';
  const pending = status === 'pending';
  return (
    <div className={`text-[11px] ${selected ? 'text-emerald-600' : pending ? 'text-slate-500' : 'text-slate-400'}`}>
      <div className="flex min-w-0 items-center gap-1.5">
        {selected ? <CircleCheck className="size-3.5 shrink-0" /> : <CircleAlert className="size-3.5 shrink-0" />}
        <span className="min-w-0 truncate" title={value}>{value}</span>
      </div>
    </div>
  );
}

export function AssemblyDatumExtractionPanel({
  modal,
  parts,
  immersive,
  adjacent,
  selectionInvalid,
  stepOrder,
  stepMeta,
  getStepValue,
  nextStep,
  onToggleMinimized,
  onClose,
  onPartChange,
  onAssign,
  onReset,
  onConfirm,
}: {
  modal: AssemblyDatumModalState;
  parts: ProcessPlanningPart[];
  immersive: boolean;
  adjacent: boolean;
  selectionInvalid: boolean;
  stepOrder: AssemblyDatumStepKey[];
  stepMeta: Record<AssemblyDatumStepKey, AssemblyDatumStepMeta>;
  getStepValue: (stepKey: AssemblyDatumStepKey) => string | null;
  nextStep: AssemblyDatumStepKey | null;
  onToggleMinimized: () => void;
  onClose: () => void;
  onPartChange: (partKey: 'A' | 'B', id: string | null) => void;
  onAssign: (partKey: 'A' | 'B', slot: 1 | 2) => void;
  onReset: () => void;
  onConfirm: () => void;
}) {
  const activeStep = adjacent ? modal.activeDatumPart ?? nextStep : null;
  const complete = nextStep === null;

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
              {[1, 2].map((slot) => (
                <div key={slot} className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500">{`装配基准${slot}`}</div>
                  {(['A', 'B'] as const).map((partKey) => {
                    const stepKey = `${partKey}${slot}` as AssemblyDatumStepKey;
                    const meta = stepMeta[stepKey];
                    const featureId = getStepValue(stepKey);
                    const stepIndex = stepOrder.indexOf(stepKey);
                    const current = !complete && activeStep === stepKey;
                    const previousComplete = stepOrder
                      .slice(0, stepIndex)
                      .every((previous) => Boolean(getStepValue(previous)));
                    const canAssign = Boolean(modal.partAId && modal.partBId && adjacent && previousComplete && (current || featureId));
                    const status = featureId ? 'selected' : current ? 'pending' : 'empty';
                    const value = featureId ?? (current ? `请点选${meta.partLabel}基准线` : `待设置${meta.shortLabel}`);
                    return (
                      <div key={stepKey} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors ${current ? 'border-orange-200 bg-orange-50/80' : featureId ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-slate-50/65 opacity-70'}`}>
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${featureId ? 'bg-emerald-500 text-white' : current ? 'bg-ds-brand-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {featureId ? <CircleCheck className="size-3.5" /> : stepIndex + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <DatumStatusRow status={status} value={value} />
                        </div>
                        <Button
                          size="sm"
                          variant={current ? 'default' : 'outline'}
                          className={`h-6 shrink-0 px-2 text-[11px] ${current ? 'bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover' : ''}`}
                          disabled={!canAssign}
                          onClick={() => onAssign(meta.partKey, meta.slot)}
                        >
                          {meta.actionLabel}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))}
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
              ) : nextStep ? (
                <div className="truncate text-[11px] text-slate-400">{`当前：点选${stepMeta[nextStep].shortLabel}`}</div>
              ) : (
                <div className="truncate text-[11px] text-slate-400">基准已完成，可确定</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={onReset}>清空</Button>
              <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover" disabled={!modal.partAId || !modal.partBId || !adjacent || nextStep !== null} onClick={onConfirm}>确定</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
