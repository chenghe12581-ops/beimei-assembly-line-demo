import { Camera, FileInput, MapPin, X } from 'lucide-react';
import { PoseAxisFieldGroup, type ProcessPosePointValue } from '../process/PoseAxisFieldGroup';

export type PositioningResultSource = 'scan' | 'import';

export type VisionPositionResult = {
  key: string;
  taskId: string;
  taskLabel: string;
  workpieceId: string;
  workpieceLabel: string;
  stationId: string;
  stationLabel: string;
  processId: string;
  workstepIndex: number;
  source: PositioningResultSource;
  pose: ProcessPosePointValue;
  createdAt: string;
};

export function VisionPositionResultPanel({ result, onClose }: { result: VisionPositionResult; onClose: () => void }) {
  const SourceIcon = result.source === 'scan' ? Camera : FileInput;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel">
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-ds-border-process-planning-structure px-3">
        <div className="truncate text-xs font-medium text-ds-text-control">视觉结果</div>
        <button type="button" aria-label="关闭视觉结果" className="flex size-7 shrink-0 items-center justify-center rounded-md text-ds-text-disabled transition-colors hover:bg-white/75 hover:text-ds-text-control" onClick={onClose}>
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-ds-300 overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
        <section className="space-y-ds-150">
          <div className="grid grid-cols-[68px_minmax(0,1fr)] items-center gap-2 text-xs">
            <span className="text-ds-text-muted">当前任务</span>
            <span className="truncate font-medium text-ds-text-secondary" title={result.taskLabel}>{result.taskLabel}</span>
          </div>
          <div className="grid grid-cols-[68px_minmax(0,1fr)] items-center gap-2 text-xs">
            <span className="text-ds-text-muted">当前工件</span>
            <span className="truncate text-ds-text-secondary" title={result.workpieceLabel}>{result.workpieceLabel}</span>
          </div>
          <div className="grid grid-cols-[68px_minmax(0,1fr)] items-center gap-2 text-xs">
            <span className="text-ds-text-muted">执行工位</span>
            <span className="truncate text-ds-text-secondary" title={result.stationLabel}>{result.stationLabel}</span>
          </div>
        </section>

        <div className="border-t border-ds-border-default" />

        <section className="space-y-ds-150">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-ds-text-control">工件位置</div>
            <div className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-100 px-2 text-[11px] text-ds-text-muted">
              <SourceIcon className="size-3.5" />
              {result.source === 'scan' ? '执行定位' : '导入结果'}
            </div>
          </div>
          <PoseAxisFieldGroup
            point={result.pose}
            readOnly
            inputVariant="flat"
            inputClassName="h-8 px-2 pr-8 text-right text-xs"
            axisLabelClassName="text-xs uppercase text-ds-text-parameter-label"
            rowGapClassName="mt-ds-100"
            onAxisChange={() => undefined}
          />
        </section>

        <div className="border-t border-ds-border-default" />

        <section className="space-y-ds-150">
          <div className="flex items-center gap-2 text-xs text-ds-text-secondary">
            <MapPin className="size-4 text-ds-brand-primary-text" />
            <span>点云与工件位置已同步回显</span>
          </div>
          <div className="text-[11px] text-ds-text-muted">结果时间：{result.createdAt}</div>
        </section>
      </div>
    </div>
  );
}
