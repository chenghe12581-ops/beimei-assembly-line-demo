import { Axis3d, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ObjectMultiSelect } from '../process/ObjectMultiSelect';
import { ProcessNumberField } from '../process/ProcessNumberField';
import type { ProcessPlanningPart, ProcessPivotSnapPoint, ProcessPoseOffset } from './types';

export function CoordinateTransformPanel({
  parts,
  selectedPartIds,
  selectedPivotPoint,
  pivotOverride,
  offset,
  immersive,
  onPartIdsChange,
  onSetPivot,
  onOffsetChange,
  onApply,
  onCancel,
}: {
  parts: ProcessPlanningPart[];
  selectedPartIds: string[];
  selectedPivotPoint: ProcessPivotSnapPoint | null;
  pivotOverride: ProcessPivotSnapPoint | null;
  offset: ProcessPoseOffset;
  immersive: boolean;
  onPartIdsChange: (ids: string[]) => void;
  onSetPivot: () => void;
  onOffsetChange: (axis: keyof ProcessPoseOffset, value: string) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={`pointer-events-auto absolute flex w-[320px] flex-col overflow-visible rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md ${
        immersive ? 'left-[336px] top-3 z-[90]' : 'left-3 top-16 z-[90]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Axis3d className="size-4 text-orange-500" />
          <span className="text-xs font-medium text-slate-800">模型坐标系转换</span>
        </div>
        <button
          type="button"
          className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={onCancel}
          aria-label="关闭模型坐标系转换"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="space-y-3 p-3">
        <div>
          <div className="mb-1.5 text-[11px] text-slate-500">选择零件</div>
          <ObjectMultiSelect
            items={parts}
            selectedIds={selectedPartIds}
            placeholder="请选择零件对象"
            showSelectAll
            selectAllLabel="全选零件"
            onChange={onPartIdsChange}
          />
        </div>
        <div className="border-t border-slate-100 pt-3">
          <div className="mb-2 text-[11px] font-medium text-slate-500">重选中心</div>
          <Button
            size="sm"
            className="h-8 w-full bg-ds-brand-primary px-2 text-xs text-white hover:bg-ds-brand-primary-hover"
            disabled={!selectedPivotPoint}
            onClick={onSetPivot}
          >
            设为中心
          </Button>
          <div className="mt-2 truncate text-[11px] text-slate-400">
            {selectedPivotPoint
              ? `新中心点：${selectedPivotPoint.label}`
              : pivotOverride
                ? `当前中心：${pivotOverride.label}`
                : selectedPartIds.length > 0
                  ? '请在视窗内选择新的中心点'
                  : '请先选择零件对象'}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-medium text-slate-500">操作轴偏移</div>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="mb-1 block text-[10px] uppercase text-slate-400">{axis}</label>
                <ProcessNumberField
                  value={offset[axis]}
                  unit="mm"
                  inputClassName="h-8 px-2 pr-8 text-right text-xs"
                  onChange={(value) => onOffsetChange(axis, value)}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['rx', 'ry', 'rz'] as const).map((axis) => (
              <div key={axis}>
                <label className="mb-1 block text-[10px] uppercase text-slate-400">{axis}</label>
                <ProcessNumberField
                  value={offset[axis]}
                  unit="°"
                  inputClassName="h-8 px-2 pr-8 text-right text-xs"
                  onChange={(value) => onOffsetChange(axis, value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2">
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-xs text-white hover:bg-ds-brand-primary-hover" onClick={onApply}>
          应用
        </Button>
      </div>
    </div>
  );
}
