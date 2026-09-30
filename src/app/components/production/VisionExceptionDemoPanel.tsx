import { LoaderCircle, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  PoseAxisFieldGroup,
  type ProcessPosePointAxis,
  type ProcessPosePointValue,
} from '../process/PoseAxisFieldGroup';
import { Button } from '../ui/button';
import type { VisionFeedOption } from './VisionFeedBar';
import { visionAssemblyDatumGroups } from './vision-assembly-demo';

type TransportPositionMode = 'line' | 'arc';
type ScanStatus = 'idle' | 'scanning' | 'success';

const defaultPose: ProcessPosePointValue = {
  x: '1650.00',
  y: '-629.50',
  z: '-232.00',
  rx: '179.84',
  ry: '0.37',
  rz: '-89.62',
};

const defaultIntersection = { x: '1650.00', y: '-629.50', z: '-232.00' };
const defaultTransportAngle = '1.80';
const defaultTransportCenterDistance = '85.00';

function getDefaultWorkpieceCode(feedId: string) {
  const partNo = feedId === 'gantry-2' || feedId === 'transport-2' || feedId === 'weld-2' || feedId === 'weld-4'
    ? '03'
    : '02';
  return `0162-01-010101-${partNo}`;
}

function parseNumber(value: string) {
  return value.trim() !== '' && Number.isFinite(Number(value));
}

function DemoField({
  label,
  value,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  unit?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-ds-075 text-xs text-ds-text-parameter-label">
      <span>{label}</span>
      <span className="relative min-w-0">
        <input
          value={value}
          disabled={disabled}
          inputMode="decimal"
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full rounded-ds-lg border border-ds-border-default bg-white px-2 pr-8 text-right text-xs tabular-nums text-ds-text-control outline-none transition-colors hover:border-ds-border-strong focus:border-orange-200 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-ds-text-disabled"
        />
        {unit && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ds-text-disabled">{unit}</span>}
      </span>
    </label>
  );
}

function WorkpieceCodeField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-2 text-xs text-ds-text-parameter-label">
      <span>工件代号</span>
      <input
        value={value}
        disabled={disabled}
        aria-label="工件代号"
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-w-0 rounded-ds-lg border border-ds-border-default bg-white px-2 text-xs font-mono text-ds-text-control outline-none transition-colors hover:border-ds-border-strong focus:border-orange-200 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-ds-text-disabled"
      />
    </label>
  );
}

function formatScanValue(value: string, delta: number) {
  const parsed = Number(value);
  return (Number.isFinite(parsed) ? parsed + delta : delta).toFixed(2);
}

export function VisionExceptionDemoPanel({
  feed,
  currentTaskLabel,
  transportPanelMode = 'all',
  demoWorkpieceCode,
  disabled = false,
  onSkip,
  onConfirm,
  onClose,
}: {
  feed: VisionFeedOption;
  currentTaskLabel: string;
  transportPanelMode?: 'all' | 'grab';
  demoWorkpieceCode?: string;
  disabled?: boolean;
  onSkip: () => void;
  onConfirm: () => void;
  onClose?: () => void;
}) {
  const [workpieceCode, setWorkpieceCode] = useState(() => demoWorkpieceCode ?? getDefaultWorkpieceCode(feed.id));
  const [pose, setPose] = useState<ProcessPosePointValue>({ ...defaultPose });
  const [intersection, setIntersection] = useState({ ...defaultIntersection });
  const [transportDatumDistances, setTransportDatumDistances] = useState(() => visionAssemblyDatumGroups.map((group) => group.distance));
  const [transportDatumAngles, setTransportDatumAngles] = useState(() => visionAssemblyDatumGroups.map(() => defaultTransportAngle));
  const [transportDatumCenterDistances, setTransportDatumCenterDistances] = useState(() => visionAssemblyDatumGroups.map(() => defaultTransportCenterDistance));
  const [transportMode, setTransportMode] = useState<TransportPositionMode>('line');
  const [dirty, setDirty] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const scanTimerRef = useRef<number | null>(null);
  const scanning = scanStatus === 'scanning';

  useEffect(() => {
    setWorkpieceCode(demoWorkpieceCode ?? getDefaultWorkpieceCode(feed.id));
    setPose({ ...defaultPose });
    setIntersection({ ...defaultIntersection });
    setTransportDatumDistances(visionAssemblyDatumGroups.map((group) => group.distance));
    setTransportDatumAngles(visionAssemblyDatumGroups.map(() => defaultTransportAngle));
    setTransportDatumCenterDistances(visionAssemblyDatumGroups.map(() => defaultTransportCenterDistance));
    setTransportMode('line');
    setDirty(false);
    setScanStatus('idle');
  }, [demoWorkpieceCode, feed.id]);

  useEffect(() => () => {
    if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
  }, []);

  const resultValid = Boolean(workpieceCode.trim()) && (
    feed.exceptionKind === 'pose-6d'
      ? (Object.values(pose) as string[]).every(parseNumber)
      : feed.exceptionKind === 'intersection-3d'
        ? Object.values(intersection).every(parseNumber)
        : transportDatumDistances.every(parseNumber)
          && transportDatumAngles.every(parseNumber)
          && transportDatumCenterDistances.every(parseNumber)
          && (transportPanelMode === 'all' || (Object.values(pose) as string[]).every(parseNumber))
  );

  const updatePose = (axis: ProcessPosePointAxis, value: string) => {
    setPose((current) => ({ ...current, [axis]: value }));
    setDirty(true);
    setScanStatus('idle');
  };

  const updateIntersection = (axis: keyof typeof intersection, value: string) => {
    setIntersection((current) => ({ ...current, [axis]: value }));
    setDirty(true);
    setScanStatus('idle');
  };

  const updateIntersectionAxis = (axis: ProcessPosePointAxis, value: string) => {
    if (axis !== 'x' && axis !== 'y' && axis !== 'z') return;
    updateIntersection(axis, value);
  };

  const rescan = () => {
    if (!resultValid || scanning) return;
    setScanStatus('scanning');
    scanTimerRef.current = window.setTimeout(() => {
      if (feed.exceptionKind === 'pose-6d' || (feed.exceptionKind === 'transport' && transportPanelMode === 'grab')) {
        setPose((current) => ({
          x: formatScanValue(current.x, 1.5),
          y: formatScanValue(current.y, -0.8),
          z: formatScanValue(current.z, 0.6),
          rx: formatScanValue(current.rx, 0.02),
          ry: formatScanValue(current.ry, -0.01),
          rz: formatScanValue(current.rz, 0.03),
        }));
      }
      if (feed.exceptionKind === 'intersection-3d') {
        setIntersection((current) => ({
          x: formatScanValue(current.x, 1.2),
          y: formatScanValue(current.y, -0.5),
          z: formatScanValue(current.z, 0.4),
        }));
      }
      if (feed.exceptionKind === 'transport') {
        setTransportDatumDistances((current) => current.map((value) => formatScanValue(value, 0.8)));
        setTransportDatumAngles((current) => current.map((value) => formatScanValue(value, 0.1)));
        setTransportDatumCenterDistances((current) => current.map((value) => formatScanValue(value, 0.6)));
      }
      setDirty(false);
      setScanStatus('success');
      scanTimerRef.current = null;
    }, 800);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-ds-border-process-planning-structure bg-ds-bg-process-planning-panel">
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-ds-border-process-planning-structure px-3">
        <div className="truncate text-xs font-medium text-ds-text-control">异常处理</div>
        <div className="truncate text-xs text-ds-text-muted">{feed.label}</div>
        {onClose && (
          <button
            type="button"
            aria-label="关闭异常处理"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-ds-text-disabled transition-colors hover:bg-white/75 hover:text-ds-text-control"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-ds-300 overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
        <section className="space-y-ds-150">
          <div className="flex min-w-0 items-center gap-1.5 text-xs">
            <span className="shrink-0 text-ds-text-muted">当前任务：</span>
            <span className="truncate font-medium text-ds-text-secondary" title={currentTaskLabel}>{currentTaskLabel}</span>
          </div>
          <div className="space-y-1.5 rounded-lg border border-red-100 bg-red-50/80 px-3 py-2">
            <div className="text-xs text-red-400">异常原因</div>
            <div className="text-xs font-semibold text-red-600">点云识别失败</div>
          </div>
        </section>

        <div className="border-t border-ds-border-default" />

        <section>
          <div className="mb-ds-300">
            <WorkpieceCodeField
              value={workpieceCode}
              disabled={disabled || scanning}
              onChange={(value) => {
                setWorkpieceCode(value);
                setDirty(true);
                setScanStatus('idle');
              }}
            />
          </div>
          <div className="mb-ds-150 text-xs font-medium text-ds-text-control">结果数据</div>
          <div className="space-y-ds-150">
            {feed.exceptionKind === 'pose-6d' && (
              <PoseAxisFieldGroup
                point={pose}
                disabled={disabled || scanning}
                inputVariant="flat"
                inputClassName="h-8 px-2 pr-8 text-right text-xs"
                axisLabelClassName="text-xs uppercase text-ds-text-parameter-label"
                disabledAxisLabelClassName="text-xs uppercase text-ds-text-disabled"
                rowGapClassName="mt-ds-100"
                onAxisChange={updatePose}
              />
            )}

            {feed.exceptionKind === 'intersection-3d' && (
              <PoseAxisFieldGroup
                point={{ ...intersection, rx: '', ry: '', rz: '' }}
                axes={['x', 'y', 'z']}
                disabled={disabled || scanning}
                inputVariant="flat"
                inputClassName="h-8 px-2 pr-8 text-right text-xs"
                axisLabelClassName="text-xs uppercase text-ds-text-parameter-label"
                disabledAxisLabelClassName="text-xs uppercase text-ds-text-disabled"
                onAxisChange={updateIntersectionAxis}
              />
            )}

            {feed.exceptionKind === 'transport' && (
              <>
                {transportPanelMode === 'grab' && (
                  <>
                    <div className="border-t border-ds-border-default pt-ds-150 text-xs font-medium text-ds-text-control">抓取结果</div>
                    <PoseAxisFieldGroup
                      point={pose}
                      disabled={disabled || scanning}
                      inputVariant="flat"
                      inputClassName="h-8 px-2 pr-8 text-right text-xs"
                      axisLabelClassName="text-xs uppercase text-ds-text-parameter-label"
                      disabledAxisLabelClassName="text-xs uppercase text-ds-text-disabled"
                      rowGapClassName="mt-ds-100"
                      onAxisChange={updatePose}
                    />
                  </>
                )}
                {transportPanelMode === 'all' && (
                  <>
                    <div className="flex items-center justify-between gap-3 border-t border-ds-border-default pt-ds-150">
                      <div className="text-xs font-medium text-ds-text-control">装配定位</div>
                      <div className="inline-flex h-7 rounded-md bg-ds-bg-segmented p-0.5" role="group" aria-label="装配定位类型">
                        {([['line', '直线'], ['arc', '圆弧']] as const).map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            disabled={disabled || scanning}
                            aria-pressed={transportMode === mode}
                            className={`h-6 rounded px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${transportMode === mode ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-ds-text-muted hover:text-ds-text-control'}`}
                            onClick={() => {
                              setTransportMode(mode);
                              setDirty(true);
                              setScanStatus('idle');
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {transportMode === 'line' ? (
                      <div className="ds-parameter-group-stack">
                        {visionAssemblyDatumGroups.map((group, index) => (
                          <div key={group.id} className="ds-parameter-group">
                            <div className="text-xs font-medium text-ds-text-parameter-label">{group.panelLabel}</div>
                            <DemoField
                              label="基准距离"
                              value={transportDatumDistances[index] ?? group.distance}
                              unit="mm"
                              disabled={disabled || scanning}
                              onChange={(value) => {
                                setTransportDatumDistances((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
                                setDirty(true);
                                setScanStatus('idle');
                              }}
                            />
                            <DemoField
                              label="角度"
                              value={transportDatumAngles[index] ?? defaultTransportAngle}
                              unit="°"
                              disabled={disabled || scanning}
                              onChange={(value) => {
                                setTransportDatumAngles((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
                                setDirty(true);
                                setScanStatus('idle');
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ds-parameter-group-stack">
                        {visionAssemblyDatumGroups.map((group, index) => (
                          <div key={group.id} className="ds-parameter-group">
                            <div className="text-xs font-medium text-ds-text-parameter-label">{group.panelLabel}</div>
                            <DemoField
                              label="中心距"
                              value={transportDatumCenterDistances[index] ?? defaultTransportCenterDistance}
                              unit="mm"
                              disabled={disabled || scanning}
                              onChange={(value) => {
                                setTransportDatumCenterDistances((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
                                setDirty(true);
                                setScanStatus('idle');
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-white/55 bg-white/38 px-4 py-3">
        {scanning && (
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <LoaderCircle className="size-4 shrink-0 animate-spin text-orange-500" />
            <span className="truncate text-ds-text-muted">正在重新扫描当前视觉结果</span>
          </div>
        )}
        {scanStatus === 'success' && !scanning && <span className="text-xs text-ds-status-success">重新扫描完成</span>}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled || scanning || !resultValid} onClick={rescan}>
            <RefreshCw className={`size-3.5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? '扫描中' : '重新扫描'}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled || scanning} onClick={onSkip}>跳过</Button>
          <Button type="button" size="sm" disabled={disabled || scanning || dirty || !resultValid} className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={onConfirm}>确定</Button>
        </div>
      </div>
    </div>
  );
}
