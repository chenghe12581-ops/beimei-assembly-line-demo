import { ChevronDown, CircleAlert, CircleCheck, Flame, Minus, ScanFace, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';
import type { ManualFeaturePanelType, ProcessPlanningPart } from './types';

function CandidateStatus({ status, value }: { status: 'empty' | 'pending' | 'selected'; value: string }) {
  const selected = status === 'selected';
  const pending = status === 'pending';
  return (
    <div className="rounded-md bg-slate-50/90 px-2.5 py-2 text-[11px]">
      <div className={`flex items-center gap-1.5 ${selected ? 'text-emerald-600' : pending ? 'text-slate-500' : 'text-slate-400'}`}>
        {selected ? <CircleCheck className="size-3.5 shrink-0" /> : <CircleAlert className="size-3.5 shrink-0" />}
        <span className="min-w-0 truncate" title={value}>{value}</span>
      </div>
    </div>
  );
}

export function ManualFeatureExtractionPanel({
  type,
  parts,
  weldFeatures,
  minimized,
  immersive,
  top,
  height,
  partAId,
  partBId,
  grindWeldFeatureId,
  selectedFaceCount,
  generated,
  faceSelectionActive,
  candidateId,
  candidateCount,
  error,
  onActivate,
  onToggleMinimized,
  onClose,
  onPartChange,
  onGrindWeldFeatureChange,
  onStartFaceSelection,
  onGenerateWeld,
  onReset,
  onConfirm,
  adjacent,
}: {
  type: ManualFeaturePanelType;
  parts: ProcessPlanningPart[];
  weldFeatures: ProcessPlanningPart[];
  minimized: boolean;
  immersive: boolean;
  top: number;
  height: number;
  partAId: string | null;
  partBId: string | null;
  grindWeldFeatureId: string | null;
  selectedFaceCount: number;
  generated: boolean;
  faceSelectionActive: boolean;
  candidateId: string | null;
  candidateCount: number;
  error: string | null;
  adjacent: boolean;
  onActivate: () => void;
  onToggleMinimized: () => void;
  onClose: () => void;
  onPartChange: (partKey: 'A' | 'B', id: string | null) => void;
  onGrindWeldFeatureChange: (id: string | null) => void;
  onStartFaceSelection: () => void;
  onGenerateWeld: () => void;
  onReset: () => void;
  onConfirm: () => void;
}) {
  const bothSelected = Boolean(partAId && partBId);
  const canSelectFace = type === 'weld' && bothSelected && adjacent;
  const canGenerateWeld = canSelectFace && selectedFaceCount >= 2 && !generated;
  const confirmDisabled = type === 'weld'
    ? !generated || !candidateId
    : !grindWeldFeatureId || !partAId || !partBId || !adjacent;

  const status = type === 'weld'
    ? generated ? 'selected' : selectedFaceCount > 0 ? 'pending' : 'empty'
    : grindWeldFeatureId && bothSelected && adjacent ? 'selected' : 'empty';
  const value = type === 'weld'
    ? generated
      ? candidateId
        ? `已选 ${candidateId.replace('manual-weld-segment-', '焊缝段 ')}，点击确定创建焊缝特征`
        : `已生成 ${candidateCount} 条交线候选，请点选焊缝段`
      : selectedFaceCount > 0
        ? `已选 ${selectedFaceCount} 个面，待生成焊缝`
        : faceSelectionActive ? '请在视窗内逐个点击面' : '未选特征'
    : grindWeldFeatureId && bothSelected && adjacent ? '创建零件 A / 零件 B 两条打磨特征' : '请选择焊缝并指配零件';

  return (
    <div
      className={`absolute flex w-[280px] flex-col overflow-hidden rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md ${immersive ? 'left-[336px] z-50' : 'left-3 z-20'} ${type === 'weld' ? 'ring-1 ring-orange-100/30' : ''}`}
      style={{ top, height }}
      onMouseDown={onActivate}
    >
      <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {type === 'weld' ? <Flame className="size-4 text-orange-500" /> : <Sparkles className="size-4 text-teal-600" />}
          <span className="text-xs font-medium text-slate-800">{type === 'weld' ? '焊缝特征提取' : '打磨特征提取'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={(event) => { event.stopPropagation(); onToggleMinimized(); }} title={minimized ? '展开' : '最小化'}>
            {minimized ? <ChevronDown className="size-3.5" /> : <Minus className="size-3.5" />}
          </button>
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={(event) => { event.stopPropagation(); onClose(); }} aria-label="关闭手动提取特征">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="min-h-0 flex-1 p-3">
            <div className="space-y-3">
              {type === 'grind' && (
                <>
                  <div className="ds-label-input-mini">
                    <label className="ds-label-input-mini-label">焊缝特征</label>
                    <ProcessSingleSelect items={weldFeatures} selectedId={grindWeldFeatureId} invalid={!grindWeldFeatureId && Boolean(error)} placeholder="请选择焊缝" size="sm" elevation="none" onChange={onGrindWeldFeatureChange} />
                  </div>
                  <div className="h-px bg-slate-200/80" />
                </>
              )}
              <div className="space-y-2">
                <div className="ds-label-input-mini">
                  <label className="ds-label-input-mini-label">零件 A</label>
                  <ProcessSingleSelect items={parts} selectedId={partAId} invalid={bothSelected && !adjacent} placeholder="请选择" size="sm" elevation="none" onChange={(id) => onPartChange('A', id)} />
                </div>
                <div className="ds-label-input-mini">
                  <label className="ds-label-input-mini-label">零件 B</label>
                  <ProcessSingleSelect items={parts} selectedId={partBId} invalid={bothSelected && !adjacent} placeholder="请选择" size="sm" elevation="none" onChange={(id) => onPartChange('B', id)} />
                </div>
              </div>
              {type === 'weld' && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={!canSelectFace} className={`h-7 px-2 text-[11px] ${faceSelectionActive ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text' : ''}`} onClick={onStartFaceSelection}>
                    <ScanFace className="size-3.5" />
                    选择面
                  </Button>
                  <Button size="sm" disabled={!canGenerateWeld} className="h-7 px-2 text-[11px] disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400" onClick={onGenerateWeld}>
                    <Flame className="size-3.5" />
                    生成焊缝
                  </Button>
                </div>
              )}
              <CandidateStatus status={status} value={value} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
            <div className="min-w-0 flex-1">
              {bothSelected && !adjacent ? (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600"><CircleAlert className="size-3.5 shrink-0" /><span className="truncate">所选零件不相接</span></div>
              ) : error ? (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600"><CircleAlert className="size-3.5 shrink-0" /><span className="truncate">{error}</span></div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={onReset}>清空</Button>
              <Button size="sm" disabled={confirmDisabled} className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400" onClick={onConfirm}>确定</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
