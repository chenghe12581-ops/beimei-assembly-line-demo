import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';
import { Button } from '../ui/button';

export type ProductionTrayCardVariant = 'horizontal' | 'skew';

export type ProductionTrayCardState = 'empty' | 'reserved' | 'empty-frame' | 'loaded' | 'full' | 'unloading';

export type ProductionTrayMaterialOption = {
  value: string;
  label: string;
};

export type ProductionTrayCardEditPayload = {
  material: string;
  quantity: number;
};

type ProductionTrayCardProps = {
  variant?: ProductionTrayCardVariant;
  code: string;
  occupied?: boolean;
  state?: ProductionTrayCardState;
  material?: string;
  materials?: string[];
  quantity?: number;
  activity?: string;
  activeStatus?: 'running' | 'paused' | 'abnormal';
  editable?: boolean;
  onEdit?: () => void;
};

const productionTrayCardIsometricAngle = 25.4;
const productionTrayCardScale = 0.75;
const productionTrayCardHorizontalScale = 0.75;
const productionTrayCardBaseWidth = 176;
const productionTrayCardBaseHeight = 88;

export const productionTrayCardHorizontalWidth = productionTrayCardBaseWidth * productionTrayCardHorizontalScale;
export const productionTrayCardHorizontalHeight = productionTrayCardBaseHeight * productionTrayCardHorizontalScale;
export const productionTrayCardSkewWidth = productionTrayCardBaseWidth * productionTrayCardScale;
export const productionTrayCardSkewHeight = productionTrayCardBaseHeight * productionTrayCardScale;
export const productionTrayCardWidth = productionTrayCardSkewWidth;
export const productionTrayCardHeight = productionTrayCardSkewHeight;

const productionTrayCardScaleOffsetX = (productionTrayCardBaseWidth - productionTrayCardSkewWidth) / 2;
const productionTrayCardScaleOffsetY = productionTrayCardBaseHeight - productionTrayCardSkewHeight;
const productionTrayCardHorizontalScaleOffsetX = (productionTrayCardBaseWidth - productionTrayCardHorizontalWidth) / 2;
const productionTrayCardHorizontalScaleOffsetY = productionTrayCardBaseHeight - productionTrayCardHorizontalHeight;

export function getProductionTrayCardHeight(variant: ProductionTrayCardVariant) {
  return variant === 'skew' ? productionTrayCardSkewHeight : productionTrayCardHorizontalHeight;
}

function getTrayState(occupied: boolean | undefined, state: ProductionTrayCardState | undefined): ProductionTrayCardState {
  return state ?? (occupied ? 'loaded' : 'empty');
}

type ProductionTrayCardTone = {
  accent: string;
  badge: string;
  dot: string;
  border: string;
  surface: string;
  label: string;
};

function getProductionTrayCardTone(state: ProductionTrayCardState, activeStatus: ProductionTrayCardProps['activeStatus']) {
  if (activeStatus === 'abnormal') {
    return { accent: 'bg-red-500', badge: 'bg-red-50 text-red-700', dot: 'bg-red-500', border: 'border-ds-border-process-planning-structure shadow-ds-sm', surface: 'bg-ds-bg-process-planning-task-surface', label: '异常' } satisfies ProductionTrayCardTone;
  }
  if (activeStatus === 'paused') {
    return { accent: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-ds-border-process-planning-structure shadow-ds-sm', surface: 'bg-ds-bg-process-planning-task-surface', label: '暂停' } satisfies ProductionTrayCardTone;
  }

  const emptyTone: ProductionTrayCardTone = {
    accent: 'bg-slate-300/60',
    badge: 'bg-slate-100/55 text-slate-400/80',
    dot: 'bg-slate-300/70',
    border: 'border-white/50 shadow-none',
    surface: 'bg-white/58 backdrop-blur-md transition-[background-color,border-color,box-shadow] group-hover:bg-white/78 group-hover:border-white/85 group-hover:shadow-ds-sm',
    label: '空闲',
  };
  const emptyFrameTone: ProductionTrayCardTone = {
    accent: 'bg-slate-400/70',
    badge: 'bg-slate-100/70 text-slate-500/85',
    dot: 'bg-slate-400/80',
    border: 'border-white/60 shadow-none',
    surface: 'bg-white/68 backdrop-blur-sm',
    label: '空托',
  };
  const tones: Record<ProductionTrayCardState, ProductionTrayCardTone> = {
    empty: emptyTone,
    reserved: { accent: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-ds-border-process-planning-structure shadow-ds-sm', surface: 'bg-ds-bg-process-planning-task-surface', label: '已预约' },
    'empty-frame': emptyFrameTone,
    loaded: { accent: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', border: 'border-ds-border-process-planning-structure shadow-ds-sm', surface: 'bg-ds-bg-process-planning-task-surface', label: '已占用' },
    full: { accent: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', border: 'border-ds-border-process-planning-structure shadow-ds-sm', surface: 'bg-ds-bg-process-planning-task-surface', label: '已占用' },
    unloading: { accent: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-ds-border-process-planning-structure shadow-ds-sm', surface: 'bg-ds-bg-process-planning-task-surface', label: '已预约' },
  };
  return tones[state];
}

function getTrayContents(state: ProductionTrayCardState, material?: string, materials?: string[], activity?: string) {
  if (state === 'empty-frame') return [activity ? '空托回收任务' : '空料框'];
  const resolvedMaterials = materials?.map((item) => item.trim()).filter(Boolean) ?? [];
  if (resolvedMaterials.length > 0) return resolvedMaterials;
  return [material ?? (state === 'reserved' ? '待上料零件' : '载荷待确认')];
}

export type ProductionTrayEditDialogProps = {
  open: boolean;
  code: string;
  material?: string;
  quantity?: number;
  materialOptions?: ProductionTrayMaterialOption[];
  onClose: () => void;
  onSave: (payload: ProductionTrayCardEditPayload) => void;
};

export function ProductionTrayEditDialog({
  open,
  code,
  material,
  quantity,
  materialOptions = [],
  onClose,
  onSave,
}: ProductionTrayEditDialogProps) {
  const [draftMaterial, setDraftMaterial] = useState(material ?? materialOptions[0]?.value ?? '');
  const [draftQuantity, setDraftQuantity] = useState(Math.max(1, quantity ?? 1));

  useEffect(() => {
    if (!open) return;
    setDraftMaterial(material ?? materialOptions[0]?.value ?? '');
    setDraftQuantity(Math.max(1, quantity ?? 1));
  }, [open, material, materialOptions, quantity]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 px-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-[420px] overflow-hidden rounded-lg border border-white/50 bg-ds-bg-glass-modal shadow-lg shadow-black/5 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`production-tray-edit-title-${code}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Pencil className="size-4 text-orange-500" />
            <span id={`production-tray-edit-title-${code}`} className="text-sm font-medium text-slate-900">编辑 {code} 号托盘</span>
          </div>
          <button type="button" className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={onClose} aria-label={`关闭${code}号托盘编辑`}>
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3 px-5 py-5">
          <label className="ds-label-input-mini min-w-0">
            <span className="ds-parameter-label">零件类型</span>
            <ProcessSingleSelect
              items={materialOptions.map((option) => ({ id: option.value, name: option.label }))}
              selectedId={draftMaterial || null}
              placeholder="请选择零件"
              size="task"
              elevation="none"
              dropdownMode="portal"
              wrapSelectedLabel
              onChange={(nextId) => {
                if (nextId) setDraftMaterial(nextId);
              }}
            />
          </label>
          <label className="ds-label-input-mini">
            <span className="ds-parameter-label">数量</span>
            <input
              type="number"
              min={1}
              step={1}
              value={draftQuantity}
              aria-label={`${code}号托盘数量`}
              className="h-8 w-full rounded-md border border-slate-200 bg-white/80 px-2 text-xs font-medium tabular-nums text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              onChange={(event) => setDraftQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-3">
          <Button size="sm" variant="outline" onClick={onClose}>取消</Button>
          <Button
            size="sm"
            className="gap-1.5 bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover"
            onClick={() => onSave({ material: draftMaterial, quantity: Math.max(1, Math.floor(draftQuantity) || 1) })}
          >
            <Check className="size-3.5" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}

function TrayCardFace({ code, state, material, materials, quantity, activity, activeStatus, editable, onEdit }: Omit<ProductionTrayCardProps, 'variant' | 'occupied'> & { state: ProductionTrayCardState }) {
  const tone = getProductionTrayCardTone(state, activeStatus);
  const [content, ...additionalContents] = getTrayContents(state, material, materials, activity);
  const showQuantity = (state === 'loaded' || state === 'full' || state === 'unloading') && quantity != null;
  const showWaiting = state === 'reserved' || state === 'empty-frame' || state === 'unloading';
  const empty = state === 'empty';
  const neutralState = empty || state === 'empty-frame';
  const showStateBadge = !(state === 'empty-frame' && activity);

  return (
    <div className={`overflow-hidden rounded-ds-md border ${empty ? `absolute inset-x-0 bottom-0 h-fit ${tone.surface}` : `relative h-fit w-full ${tone.surface}`} ${tone.border}`}>
      <div className={`absolute inset-y-0 left-0 w-0.5 ${tone.accent}`} />
      <div className="relative z-10 flex h-fit min-w-0 flex-col gap-1 px-3 py-2">
        <div className={`flex items-center justify-between gap-2 ${empty ? 'h-5' : ''}`}>
          <div className="flex min-w-0 items-center gap-1.5">
            <div className={`text-[18px] font-medium leading-none ${neutralState ? 'text-ds-text-control-muted' : 'text-ds-text-control'}`}>{code}</div>
            {editable && (state === 'loaded' || state === 'full') ? (
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                aria-label={`${code}号托盘编辑`}
                title="编辑托盘"
                data-testid={`production-tray-card-edit-${code}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.();
                }}
              >
                <Pencil className="size-3" />
              </button>
            ) : null}
          </div>
          {showStateBadge ? (
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[12px] font-medium ${empty ? 'leading-4' : ''} ${tone.badge}`}>
              <span className={`size-1.5 rounded-full ${tone.dot}`} />
              {tone.label}
            </span>
          ) : null}
        </div>
        {!empty && (
          <>
            <div className="whitespace-nowrap text-[16px] font-medium leading-6 text-ds-text-secondary" title={content}>{content}</div>
            {additionalContents.map((item) => (
              <div key={item} className="whitespace-nowrap text-[16px] font-medium leading-6 text-ds-text-secondary" title={item}>{item}</div>
            ))}
            <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[14px] leading-4 text-ds-text-disabled">
              <span className="truncate">{showWaiting ? (activity ?? '等待AGV') : ''}</span>
              {showQuantity ? <span className="shrink-0 font-medium text-ds-text-muted">数量 {quantity}件</span> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProductionTrayCard({
  variant = 'horizontal',
  code,
  occupied,
  state: inputState,
  material,
  materials,
  quantity,
  activity,
  activeStatus,
  editable = false,
  onEdit,
}: ProductionTrayCardProps) {
  const state = getTrayState(occupied, inputState);
  const isometricTransform = `skewY(-${productionTrayCardIsometricAngle}deg) scaleX(0.84)`;

  if (variant === 'horizontal') {
    const visualHeight = productionTrayCardHorizontalHeight;
    const baseHeight = productionTrayCardBaseHeight;
    const scaleOffsetY = baseHeight - visualHeight;
    return (
      <div className="group relative overflow-visible transition-transform duration-200 hover:-translate-y-0.5" data-tray-code={code} data-tray-state={state} data-tray-mode="view" style={{ width: productionTrayCardHorizontalWidth, height: visualHeight }}>
        <div className="absolute" style={{ left: -productionTrayCardHorizontalScaleOffsetX, top: -scaleOffsetY, width: productionTrayCardBaseWidth, height: productionTrayCardBaseHeight, transform: `scale(${productionTrayCardHorizontalScale})`, transformOrigin: '50% 100%' }}>
          <TrayCardFace code={code} state={state} material={material} materials={materials} quantity={quantity} activity={activity} activeStatus={activeStatus} editable={editable} onEdit={onEdit} />
        </div>
      </div>
    );
  }

  const visualHeight = productionTrayCardSkewHeight;
  const baseHeight = productionTrayCardBaseHeight;
  const scaleOffsetY = baseHeight - visualHeight;
  return (
    <div className="group relative overflow-visible transition-transform duration-200 hover:-translate-y-0.5" data-tray-code={code} data-tray-state={state} data-tray-mode="view" style={{ width: productionTrayCardSkewWidth, height: visualHeight }}>
      <div className="absolute" style={{ left: -productionTrayCardScaleOffsetX, top: -scaleOffsetY, width: productionTrayCardBaseWidth, height: baseHeight, transform: `scale(${productionTrayCardScale})`, transformOrigin: '50% 100%' }}>
        <div className="absolute inset-0 overflow-visible" style={{ transform: isometricTransform, transformOrigin: '50% 100%' }}>
          <TrayCardFace code={code} state={state} material={material} materials={materials} quantity={quantity} activity={activity} activeStatus={activeStatus} editable={editable} onEdit={onEdit} />
        </div>
      </div>
    </div>
  );
}
