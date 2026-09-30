import {
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  PoseAxisFieldGroup,
  type ProcessPosePointAxis,
  type ProcessPosePointValue,
} from '../process/PoseAxisFieldGroup';
import { Button } from '../ui/button';

export type VisionCalibrationPose = ProcessPosePointValue;
export type VisionCoordinateMode = 'absolute' | 'relative';
export type VisionScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export const visionCalibrationAxes: ProcessPosePointAxis[] = ['x', 'y', 'z', 'rx', 'ry', 'rz'];

export const defaultVisionResultPoint: VisionCalibrationPose = {
  x: '1650.00',
  y: '-629.50',
  z: '-232.00',
  rx: '179.84',
  ry: '0.37',
  rz: '-89.62',
};

export const defaultVisionCoarseResultPoint: VisionCalibrationPose = {
  x: '1635.00',
  y: '-620.00',
  z: '-225.00',
  rx: '179.90',
  ry: '0.20',
  rz: '-89.80',
};

export const defaultVisionPhotoPose: VisionCalibrationPose = {
  x: '1500.00',
  y: '-750.00',
  z: '-300.00',
  rx: '180.00',
  ry: '0.00',
  rz: '-90.00',
};

export const defaultVisionRelativePose: VisionCalibrationPose = {
  x: '0.00',
  y: '0.00',
  z: '0.00',
  rx: '0.00',
  ry: '0.00',
  rz: '0.00',
};

export const visionRescanResultFixtures: VisionCalibrationPose[] = [
  {
    x: '1642.00',
    y: '-624.00',
    z: '-228.00',
    rx: '179.92',
    ry: '0.22',
    rz: '-89.78',
  },
  {
    x: '1646.00',
    y: '-626.50',
    z: '-230.00',
    rx: '179.95',
    ry: '0.18',
    rz: '-89.84',
  },
  {
    x: '1650.00',
    y: '-629.50',
    z: '-232.00',
    rx: '179.97',
    ry: '0.14',
    rz: '-89.88',
  },
];

export function parsePoseValue(value: string) {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPoseValue(value: number) {
  return value.toFixed(2);
}

export function isVisionPoseValid(pose: VisionCalibrationPose) {
  return visionCalibrationAxes.every((axis) => parsePoseValue(pose[axis]) !== null);
}

export function resolveVisionAbsolutePose(
  pose: VisionCalibrationPose,
  mode: VisionCoordinateMode,
  baselinePose: VisionCalibrationPose,
): VisionCalibrationPose | null {
  if (!isVisionPoseValid(pose) || !isVisionPoseValid(baselinePose)) return null;

  return visionCalibrationAxes.reduce<VisionCalibrationPose>((nextPose, axis) => {
    const value = parsePoseValue(pose[axis]) ?? 0;
    const baselineValue = parsePoseValue(baselinePose[axis]) ?? 0;
    nextPose[axis] = formatPoseValue(mode === 'relative' ? baselineValue + value : value);
    return nextPose;
  }, { ...pose });
}

export function convertVisionCoordinatePose(
  pose: VisionCalibrationPose,
  fromMode: VisionCoordinateMode,
  toMode: VisionCoordinateMode,
  baselinePose: VisionCalibrationPose,
): VisionCalibrationPose | null {
  if (fromMode === toMode) return { ...pose };
  const absolutePose = resolveVisionAbsolutePose(pose, fromMode, baselinePose);
  if (!absolutePose) return null;
  if (toMode === 'absolute') return absolutePose;

  return visionCalibrationAxes.reduce<VisionCalibrationPose>((nextPose, axis) => {
    const absoluteValue = parsePoseValue(absolutePose[axis]) ?? 0;
    const baselineValue = parsePoseValue(baselinePose[axis]) ?? 0;
    nextPose[axis] = formatPoseValue(absoluteValue - baselineValue);
    return nextPose;
  }, { ...absolutePose });
}

export function visionPosesEqual(firstPose: VisionCalibrationPose, secondPose: VisionCalibrationPose) {
  if (!isVisionPoseValid(firstPose) || !isVisionPoseValid(secondPose)) return false;
  return visionCalibrationAxes.every((axis) => {
    const firstValue = parsePoseValue(firstPose[axis]) ?? 0;
    const secondValue = parsePoseValue(secondPose[axis]) ?? 0;
    return Math.abs(firstValue - secondValue) < 0.005;
  });
}

function formatVisionPoseVector(pose: VisionCalibrationPose) {
  return `[${visionCalibrationAxes.map((axis) => pose[axis]).join(', ')}]`;
}

function CoordinateModeControl({
  value,
  disabled,
  onChange,
}: {
  value: VisionCoordinateMode;
  disabled?: boolean;
  onChange: (mode: VisionCoordinateMode) => void;
}) {
  return (
    <div className="inline-flex h-6 rounded-md bg-slate-100 p-0.5" role="group" aria-label="拍照位置坐标模式">
      {([
        ['absolute', '绝对位置'],
        ['relative', '相对位置'],
      ] as const).map(([mode, label]) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            className={`h-5 rounded px-1.5 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:text-slate-300 ${
              selected
                ? 'bg-white text-ds-brand-primary-text shadow-sm ring-1 ring-slate-100'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => onChange(mode)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function VisionPoseFields({
  label,
  point,
  valueMode = 'absolute',
  readOnly = false,
  disabled = false,
  supportingContent,
  supportingContentPlacement = 'afterTitle',
  titleAction,
  action,
  onAxisChange,
}: {
  label: string;
  point: VisionCalibrationPose;
  valueMode?: 'absolute' | 'delta';
  readOnly?: boolean;
  disabled?: boolean;
  supportingContent?: ReactNode;
  supportingContentPlacement?: 'beforeTitle' | 'afterTitle';
  titleAction?: ReactNode;
  action?: ReactNode;
  onAxisChange: (axis: ProcessPosePointAxis, value: string) => void;
}) {
  return (
    <div>
      {supportingContentPlacement === 'beforeTitle' && supportingContent && (
        <div className="mb-ds-150">{supportingContent}</div>
      )}
      <div className="flex min-h-6 items-center gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0 text-[11px] font-medium text-slate-600">{label}</div>
          {titleAction && <div className="flex shrink-0 items-center gap-1">{titleAction}</div>}
        </div>
        {action && <div className="ml-auto flex shrink-0 items-center gap-ds-150">{action}</div>}
      </div>
      {supportingContentPlacement === 'afterTitle' && supportingContent && (
        <div className="mt-ds-150">{supportingContent}</div>
      )}
      <div className="mt-ds-200">
        <PoseAxisFieldGroup
          point={point}
          valueMode={valueMode}
          readOnly={readOnly}
          disabled={disabled}
          inputVariant="flat"
          inputClassName="h-8 px-2 pr-8 text-right text-xs"
          rowGapClassName="mt-ds-100"
          onAxisChange={onAxisChange}
        />
      </div>
    </div>
  );
}

export function VisionAbnormalCalibrationPanel({
  currentProcessLabel,
  resultPoint,
  coarseResultPoint,
  photoPose,
  coordinateMode,
  poseDirty,
  scanStatus,
  reason = '点云识别失败',
  disabled = false,
  onCoordinateModeChange,
  onPhotoPoseChange,
  onResetPhotoPose,
  onRescan,
  onSkip,
  onConfirm,
  onClose,
  variant = 'floating',
  className = '',
}: {
  currentProcessLabel: string;
  resultPoint: VisionCalibrationPose;
  coarseResultPoint: VisionCalibrationPose;
  photoPose: VisionCalibrationPose;
  coordinateMode: VisionCoordinateMode;
  poseDirty: boolean;
  scanStatus: VisionScanStatus;
  reason?: string;
  disabled?: boolean;
  onCoordinateModeChange: (mode: VisionCoordinateMode) => void;
  onPhotoPoseChange: (axis: ProcessPosePointAxis, value: string) => void;
  onResetPhotoPose: () => void;
  onRescan: () => void;
  onSkip: () => void;
  onConfirm: () => void;
  onClose?: () => void;
  variant?: 'floating' | 'sidebar' | 'demo';
  className?: string;
}) {
  const scanning = scanStatus === 'scanning';
  const poseValid = isVisionPoseValid(photoPose);
  const demoVariant = variant === 'demo';
  const sidebarVariant = variant === 'sidebar' || demoVariant;

  return (
    <div className={`flex max-h-full w-full max-w-[420px] flex-col overflow-hidden backdrop-blur-md ${sidebarVariant ? 'rounded-none border-0 border-l border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel shadow-none' : 'rounded-lg border border-white/55 bg-ds-bg-glass-modal shadow-xl shadow-black/10'} ${className}`.trim()}>
      <div className={`flex shrink-0 items-center justify-between gap-3 border-b ${sidebarVariant ? 'h-9 border-ds-border-process-planning-structure bg-transparent px-3 py-0' : 'border-white/55 px-4 py-3'}`}>
        <div className={sidebarVariant ? 'shrink-0 text-xs font-medium text-slate-500' : 'shrink-0 text-sm font-semibold text-slate-800'}>异常处理</div>
        {onClose && (
          <button
            type="button"
            aria-label="关闭异常处理"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/75 hover:text-slate-700"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-ds-300 overflow-y-auto px-4 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent]">
        <section>
          <VisionPoseFields
            label="结果点坐标"
            point={resultPoint}
            readOnly
            supportingContentPlacement="beforeTitle"
            supportingContent={(
              <div className="space-y-ds-150">
                <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
                  <span className="shrink-0 text-slate-400">当前任务：</span>
                  <span className="truncate font-medium text-slate-600" title={currentProcessLabel}>
                    {currentProcessLabel}
                  </span>
                </div>
                <div className={`space-y-1.5 rounded-lg border px-3 py-2 transition-colors ${
                  poseDirty
                    ? 'border-amber-100 bg-amber-50/80'
                    : 'border-red-100 bg-red-50/80'
                }`}>
                  <div>
                    <div className={`text-[10px] ${poseDirty ? 'text-amber-500' : 'text-red-400'}`}>异常原因</div>
                    <div className={`text-xs font-semibold ${poseDirty ? 'text-amber-700' : 'text-red-600'}`}>{reason}</div>
                  </div>
                  <div className={`break-words text-[9px] leading-4 ${poseDirty ? 'text-amber-600/80' : 'text-red-500/75'}`}>
                    <span className="whitespace-nowrap">粗定位结果坐标 </span>
                    <span className="font-mono tabular-nums" title={formatVisionPoseVector(coarseResultPoint)}>
                      {formatVisionPoseVector(coarseResultPoint)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            onAxisChange={() => undefined}
          />
        </section>

        <div className="border-t border-slate-200/80" />

        <section>
          <VisionPoseFields
            label="拍照位置"
            point={photoPose}
            disabled={disabled || scanning}
            valueMode={coordinateMode === 'relative' ? 'delta' : 'absolute'}
            onAxisChange={onPhotoPoseChange}
            titleAction={demoVariant ? undefined : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-1.5 text-[10px] text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                disabled={disabled || scanning || !poseDirty}
                onClick={onResetPhotoPose}
              >
                <RotateCcw className="size-3" />
                重置
              </Button>
            )}
            action={(
              <>
                {!demoVariant && (
                  <CoordinateModeControl
                    value={coordinateMode}
                    disabled={disabled || scanning || !poseValid}
                    onChange={onCoordinateModeChange}
                  />
                )}
                {!demoVariant && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 gap-1 px-2 text-[11px]"
                    disabled={disabled || scanning || !poseValid}
                    onClick={onRescan}
                  >
                    <RefreshCw className={`size-3.5 ${scanning ? 'animate-spin' : ''}`} />
                    {scanning ? '扫描中' : '重新扫描'}
                  </Button>
                )}
              </>
            )}
          />
        </section>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-white/55 bg-white/38 px-4 py-3">
        {scanning && (
          <div className="flex min-w-0 items-center gap-2 text-[11px]">
            <LoaderCircle className="size-4 shrink-0 animate-spin text-orange-500" />
            <span className="truncate text-slate-500">正在使用当前拍照位置重新扫描</span>
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {demoVariant && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || scanning || !poseValid}
              onClick={onRescan}
            >
              <RefreshCw className={`size-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? '扫描中' : '重新扫描'}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || scanning}
            onClick={onSkip}
          >
            跳过
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={disabled || scanning || poseDirty || !poseValid}
            className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover"
            onClick={onConfirm}
          >
            确定
          </Button>
        </div>
      </div>
    </div>
  );
}
