import { ChevronDown, ChevronLeft, Info, RefreshCw, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProcessNumberField } from '../process/ProcessNumberField';
import { ProcessPathPointModeToolbar } from '../process/ProcessPathPointModeToolbar';
import { Button } from '../ui/button';
import { ParameterSwitch } from '../ui/parameter-switch';

export type GantryVisionScanPose = {
  distance: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  pitch: string;
  workAngle: string;
  roll: string;
};

export type GantryVisionScanPoint = {
  enabled: boolean;
  pose: GantryVisionScanPose;
};

type GantryVisionPositionMode = 'relative' | 'absolute';

type GantryVisionAbsolutePose = {
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
};

export type GantryVisionViewportState = {
  screen: 'result' | 'parameters';
  resultPoints: Record<'p1' | 'p2', boolean>;
  scanPoints: GantryVisionScanPoint[];
  activeScanPoint: number | null;
};

const defaultScanPose: GantryVisionScanPose = {
  distance: '450',
  offsetX: '0',
  offsetY: '0',
  offsetZ: '0',
  pitch: '45',
  workAngle: '0',
  roll: '0',
};

const toleranceFields = [
  ['长度相对容差', 'lengthRelative', 'mm'],
  ['长度绝对容差', 'lengthAbsolute', 'mm'],
  ['角度绝对容差', 'angleAbsolute', '°'],
  ['侧向偏移绝对容差', 'lateralOffset', 'mm'],
] as const;

const defaultTolerances: Record<string, string> = {
  lengthRelative: '0',
  lengthAbsolute: '0',
  angleAbsolute: '0',
  lateralOffset: '0',
};

const defaultResultPoints = { p1: true, p2: true };

const gantryScanPointAnchors = [
  { x: 1450.9, y: -629.441, z: -230.882 },
  { x: 1798.31, y: -629.639, z: -233.726 },
] as const;

function toFiniteNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCoordinate(value: number) {
  return value.toFixed(2);
}

function toAbsoluteScanPose(pose: GantryVisionScanPose, index: number): GantryVisionAbsolutePose {
  const anchor = gantryScanPointAnchors[index] ?? gantryScanPointAnchors[0];
  return {
    x: formatCoordinate(anchor.x + toFiniteNumber(pose.offsetX)),
    y: formatCoordinate(anchor.y + toFiniteNumber(pose.offsetY)),
    z: formatCoordinate(anchor.z + toFiniteNumber(pose.distance) + toFiniteNumber(pose.offsetZ)),
    rx: formatCoordinate(toFiniteNumber(pose.pitch)),
    ry: formatCoordinate(toFiniteNumber(pose.workAngle)),
    rz: formatCoordinate(toFiniteNumber(pose.roll)),
  };
}

function toRelativeScanPose(
  absolutePose: GantryVisionAbsolutePose,
  currentPose: GantryVisionScanPose,
  index: number,
): GantryVisionScanPose {
  const anchor = gantryScanPointAnchors[index] ?? gantryScanPointAnchors[0];
  return {
    ...currentPose,
    offsetX: formatCoordinate(toFiniteNumber(absolutePose.x) - anchor.x),
    offsetY: formatCoordinate(toFiniteNumber(absolutePose.y) - anchor.y),
    offsetZ: formatCoordinate(toFiniteNumber(absolutePose.z) - anchor.z - toFiniteNumber(currentPose.distance)),
    pitch: absolutePose.rx,
    workAngle: absolutePose.ry,
    roll: absolutePose.rz,
  };
}

export function createDefaultGantryVisionViewportState(): GantryVisionViewportState {
  return {
    screen: 'result',
    resultPoints: { ...defaultResultPoints },
    scanPoints: [
      { enabled: true, pose: { ...defaultScanPose } },
      { enabled: true, pose: { ...defaultScanPose } },
    ],
    activeScanPoint: null,
  };
}

function ScanInput({
  value,
  onChange,
  unit,
  disabled = false,
  inputClassName = '!h-8 !px-2 !py-1 !pr-8 text-left !text-xs',
}: {
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  disabled?: boolean;
  inputClassName?: string;
}) {
  return (
    <ProcessNumberField
      value={value}
      unit={unit}
      disabled={disabled}
      inputClassName={inputClassName}
      onChange={onChange}
    />
  );
}

function DirtyMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="text-orange-500" title="有修改未应用" aria-label="有修改未应用">
      *
    </span>
  );
}

function PoseField({
  label,
  value,
  onChange,
  disabled = false,
  withInfo = false,
  unit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  withInfo?: boolean;
  unit: string;
}) {
  return (
    <label className="ds-label-input-compact min-w-0">
      <span className="ds-label-input-compact-label flex items-center gap-1 whitespace-nowrap">
        {label}
        {withInfo && <Info className="size-3.5 text-slate-400" />}
      </span>
      <ScanInput value={value} unit={unit} disabled={disabled} onChange={onChange} />
    </label>
  );
}

function ScanPointCard({
  index,
  title,
  enabled,
  pose,
  disabled,
  active,
  positionMode,
  absolutePose,
  onActivate,
  onEnabledChange,
  onPoseChange,
  onAbsolutePoseChange,
}: {
  index: number;
  title: string;
  enabled: boolean;
  pose: GantryVisionScanPose;
  disabled: boolean;
  active: boolean;
  positionMode: GantryVisionPositionMode;
  absolutePose: GantryVisionAbsolutePose;
  onActivate: () => void;
  onEnabledChange: (next: boolean) => void;
  onPoseChange: (key: keyof GantryVisionScanPose, value: string) => void;
  onAbsolutePoseChange: (key: keyof GantryVisionAbsolutePose, value: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-ds-sm">
      <div className="flex h-10 items-center gap-2.5 bg-zinc-100/80 px-3">
        <span className="text-xs font-medium text-slate-700">{title}</span>
        <span className="ml-auto">
          <ParameterSwitch
            checked={enabled}
            onChange={onEnabledChange}
            ariaLabel={`${title}启用状态`}
            disabled={disabled}
            size="sm"
            showStateLabel={false}
          />
        </span>
        <ChevronDown className="size-3.5 text-slate-500" />
      </div>
      <div className="ds-parameter-group-stack px-3 py-3.5">
        <button
          type="button"
          aria-pressed={active}
          className={`flex h-8 w-full items-center gap-1.5 rounded-md border px-2 text-left text-xs font-medium outline-none transition-colors focus-visible:border-orange-300 focus-visible:text-ds-brand-primary-text ${
            active
              ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text'
              : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-ds-brand-primary-text'
          }`}
          onClick={onActivate}
        >
          拍照位置{index}
          <ChevronDown className="ml-auto size-3.5" />
        </button>
        {positionMode === 'relative' ? (
          <div className="ds-parameter-group-stack px-1">
            <label className="ds-label-input-compact">
              <span className="ds-label-input-compact-label">拍照距离</span>
              <ScanInput value={pose.distance} unit="mm" disabled={disabled} onChange={(value) => onPoseChange('distance', value)} />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="ds-parameter-stack">
                <PoseField label="ΔX" value={pose.offsetX} unit="mm" disabled={disabled} onChange={(value) => onPoseChange('offsetX', value)} />
                <PoseField label="ΔY" value={pose.offsetY} unit="mm" disabled={disabled} onChange={(value) => onPoseChange('offsetY', value)} />
                <PoseField label="ΔZ" value={pose.offsetZ} unit="mm" disabled={disabled} onChange={(value) => onPoseChange('offsetZ', value)} />
              </div>
              <div className="ds-parameter-stack">
                <PoseField label="仰角" value={pose.pitch} unit="°" disabled={disabled} onChange={(value) => onPoseChange('pitch', value)} withInfo />
                <PoseField label="工作角" value={pose.workAngle} unit="°" disabled={disabled} onChange={(value) => onPoseChange('workAngle', value)} withInfo />
                <PoseField label="旋转角" value={pose.roll} unit="°" disabled={disabled} onChange={(value) => onPoseChange('roll', value)} withInfo />
              </div>
            </div>
          </div>
        ) : (
          <div className="px-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="ds-parameter-stack">
                <PoseField label="X" value={absolutePose.x} unit="mm" disabled={disabled} onChange={(value) => onAbsolutePoseChange('x', value)} />
                <PoseField label="Y" value={absolutePose.y} unit="mm" disabled={disabled} onChange={(value) => onAbsolutePoseChange('y', value)} />
                <PoseField label="Z" value={absolutePose.z} unit="mm" disabled={disabled} onChange={(value) => onAbsolutePoseChange('z', value)} />
              </div>
              <div className="ds-parameter-stack">
                <PoseField label="RX" value={absolutePose.rx} unit="°" disabled={disabled} onChange={(value) => onAbsolutePoseChange('rx', value)} />
                <PoseField label="RY" value={absolutePose.ry} unit="°" disabled={disabled} onChange={(value) => onAbsolutePoseChange('ry', value)} />
                <PoseField label="RZ" value={absolutePose.rz} unit="°" disabled={disabled} onChange={(value) => onAbsolutePoseChange('rz', value)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function GantryVisionScanPanel({
  disabled = false,
  onSkip,
  onApply,
  onViewportStateChange,
}: {
  disabled?: boolean;
  onSkip: () => void;
  onApply: () => void;
  onViewportStateChange?: (state: GantryVisionViewportState) => void;
}) {
  const [screen, setScreen] = useState<'result' | 'parameters'>('result');
  const [tolerances, setTolerances] = useState<Record<string, string>>({ ...defaultTolerances });
  const [appliedTolerances, setAppliedTolerances] = useState<Record<string, string>>({ ...defaultTolerances });
  const [resultPoints, setResultPoints] = useState({ ...defaultResultPoints });
  const [appliedResultPoints, setAppliedResultPoints] = useState({ ...defaultResultPoints });
  const [scanResultUpdated, setScanResultUpdated] = useState(false);
  const [fittingExpanded, setFittingExpanded] = useState(true);
  const [reconstructionResolved, setReconstructionResolved] = useState(false);
  const [positionMode, setPositionMode] = useState<GantryVisionPositionMode>('relative');
  const [appliedPositionMode, setAppliedPositionMode] = useState<GantryVisionPositionMode>('relative');
  const [scanPoints, setScanPoints] = useState(() => createDefaultGantryVisionViewportState().scanPoints);
  const [appliedScanPoints, setAppliedScanPoints] = useState(() => createDefaultGantryVisionViewportState().scanPoints);
  const [absoluteScanPoses, setAbsoluteScanPoses] = useState<GantryVisionAbsolutePose[]>(() => (
    createDefaultGantryVisionViewportState().scanPoints.map((point, index) => toAbsoluteScanPose(point.pose, index))
  ));
  const absoluteScanPosesRef = useRef(absoluteScanPoses);
  const [activeScanPoint, setActiveScanPoint] = useState<number | null>(null);
  const fittingDirty = JSON.stringify(tolerances) !== JSON.stringify(appliedTolerances);
  const resultPointsDirty = JSON.stringify(resultPoints) !== JSON.stringify(appliedResultPoints);
  const reconstructionDirty = fittingDirty || resultPointsDirty || scanResultUpdated;
  const reconstructionResultResolved = reconstructionResolved && !reconstructionDirty;
  const scanParametersDirty = positionMode !== appliedPositionMode
    || JSON.stringify(scanPoints) !== JSON.stringify(appliedScanPoints);

  const updateScanPoint = (index: number, key: keyof GantryVisionScanPose, value: string) => {
    setScanPoints((points) => points.map((point, pointIndex) => (
      pointIndex === index ? { ...point, pose: { ...point.pose, [key]: value } } : point
    )));
  };

  const changePositionMode = (nextMode: GantryVisionPositionMode) => {
    if (nextMode === 'absolute') {
      const nextAbsolutePoses = scanPoints.map((point, index) => toAbsoluteScanPose(point.pose, index));
      absoluteScanPosesRef.current = nextAbsolutePoses;
      setAbsoluteScanPoses(nextAbsolutePoses);
    }
    setPositionMode(nextMode);
  };

  const updateAbsoluteScanPose = (index: number, key: keyof GantryVisionAbsolutePose, value: string) => {
    const nextAbsolutePoses = absoluteScanPosesRef.current.map((pose, poseIndex) => (
      poseIndex === index ? { ...pose, [key]: value } : pose
    ));
    absoluteScanPosesRef.current = nextAbsolutePoses;
    setAbsoluteScanPoses(nextAbsolutePoses);
    setScanPoints((points) => points.map((point, pointIndex) => (
      pointIndex === index
        ? { ...point, pose: toRelativeScanPose(nextAbsolutePoses[index], point.pose, index) }
        : point
    )));
  };

  useEffect(() => {
    onViewportStateChange?.({
      screen,
      resultPoints: { ...resultPoints },
      scanPoints: scanPoints.map((point) => ({ ...point, pose: { ...point.pose } })),
      activeScanPoint,
    });
  }, [activeScanPoint, onViewportStateChange, resultPoints, scanPoints, screen]);

  const applyRefit = () => {
    setAppliedTolerances({ ...tolerances });
    setAppliedResultPoints({ ...resultPoints });
    setScanResultUpdated(false);
    setReconstructionResolved(true);
  };

  const replanScan = () => {
    setAppliedPositionMode(positionMode);
    setAppliedScanPoints(scanPoints.map((point) => ({ ...point, pose: { ...point.pose } })));
    setScanResultUpdated(true);
    setScreen('result');
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-zinc-200 bg-white">
      <div className="flex h-9 shrink-0 items-center border-b border-zinc-200/75 px-3">
        <div className="text-xs font-medium text-slate-500">异常处理</div>
      </div>

      {screen === 'result' ? (
        <>
          <div key="scan-result" className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
            <section className="space-y-ds-150">
              <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
                <span className="shrink-0 text-slate-400">当前任务：</span>
                <span className="truncate font-medium text-slate-600" title="0162-01-010101(1) · 装配0162-01-010101- (02 + 01)">
                  0162-01-010101(1) · 装配0162-01-010101- (02 + 01)
                </span>
              </div>
              <div className={`space-y-1.5 rounded-lg border px-3 py-2 ${
                reconstructionResultResolved ? 'border-emerald-100 bg-emerald-50/80' : 'border-red-100 bg-red-50/80'
              }`}>
                <div>
                  <div className={`text-[10px] ${reconstructionResultResolved ? 'text-emerald-500' : 'text-red-400'}`}>
                    {reconstructionResultResolved ? '重构结果' : '异常原因'}
                  </div>
                  <div className={`text-xs font-semibold ${reconstructionResultResolved ? 'text-emerald-700' : 'text-red-600'}`}>
                    {reconstructionResultResolved ? '重构符合设定容差' : '点云识别失败'}
                  </div>
                </div>
                <div className={`break-words text-[9px] leading-4 ${reconstructionResultResolved ? 'text-emerald-600/80' : 'text-red-500/75'}`}>
                  <span className="whitespace-nowrap">重构容差 </span>
                  <span className="font-mono tabular-nums">[长度相对:15，长度绝对:30，角度绝对:7，侧向绝对:15]</span>
                </div>
              </div>
            </section>

            <div className="my-5 border-t border-zinc-200/75" />

            <div className="flex items-center gap-1.5">
              <div className="text-[11px] font-medium text-slate-600">重构设置</div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <span className={`text-[11px] ${
                  reconstructionDirty ? 'text-orange-500' : reconstructionResultResolved ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {reconstructionDirty ? '待重新拟合' : reconstructionResultResolved ? '重构结果已更新' : '调整后重新拟合'}
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || !reconstructionDirty}
                  className="h-7 gap-1 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover"
                  onClick={applyRefit}
                >
                  <RefreshCw className="size-3" />
                  重新拟合
                </Button>
              </div>
            </div>

            <section className="mt-4">
              <button
                type="button"
                aria-expanded={fittingExpanded}
                aria-label="切换拟合设置"
                className="flex min-h-6 w-full items-center gap-1.5 text-left"
                onClick={() => setFittingExpanded((expanded) => !expanded)}
              >
                <span className="text-[11px] font-medium text-slate-600">拟合设置</span>
                <DirtyMark show={fittingDirty} />
                <ChevronDown className={`ml-auto size-3.5 text-slate-400 transition-transform ${fittingExpanded ? '' : '-rotate-90'}`} />
              </button>
              {fittingExpanded && (
                <div className="mt-2 ds-parameter-stack">
                  {toleranceFields.map(([label, key, unit]) => (
                    <label key={key} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-2 text-[11px] text-slate-500">
                      <span>{label}</span>
                      <ScanInput
                        value={tolerances[key]}
                        unit={unit}
                        onChange={(value) => {
                          setReconstructionResolved(false);
                          setTolerances((current) => ({ ...current, [key]: value }));
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}
            </section>

            <div className="my-5 border-t border-zinc-200/75" />

            <section>
              <div className="flex min-h-6 items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-600">结果点设置</span>
                <DirtyMark show={resultPointsDirty || scanResultUpdated} />
              </div>
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200/75 bg-white text-center text-[11px]">
                <div className="grid h-8 grid-cols-3 items-center bg-zinc-100/80 px-3 text-slate-500">
                  <span>扫描结果点</span><span>状态</span><span>启用</span>
                </div>
                {(['p1', 'p2'] as const).map((point, index) => (
                  <div key={point} className="grid h-10 grid-cols-3 items-center border-t border-zinc-200/75 px-3 text-slate-700">
                    <span>P{index + 1}</span>
                    <span className="mx-auto size-3 rounded-full bg-emerald-500" aria-label="状态正常" />
                    <span className="mx-auto">
                      <ParameterSwitch
                        checked={resultPoints[point]}
                        onChange={(checked) => {
                          setReconstructionResolved(false);
                          setResultPoints((points) => ({ ...points, [point]: checked }));
                        }}
                        ariaLabel={`P${index + 1}启用状态`}
                        disabled={disabled}
                        size="sm"
                        showStateLabel={false}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <button
              type="button"
              disabled={disabled}
              className="mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200/75 bg-white text-xs font-medium text-slate-700 shadow-ds-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setScreen('parameters')}
            >
              <Settings2 className="size-4 text-orange-500" />
              扫描参数设置
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-3 border-t border-white/55 bg-white/38 px-4 py-3">
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => { setScanResultUpdated(false); onSkip(); }}>跳过工件</Button>
              <Button type="button" size="sm" disabled={disabled} className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={() => { setScanResultUpdated(false); onApply(); }}>应用</Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div key="scan-parameters" className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
            <button type="button" className="flex items-center gap-1 text-xs font-medium text-orange-500" onClick={() => setScreen('result')}>
              <ChevronLeft className="size-4" />
              返回扫描结果
            </button>
            <div className="my-4 border-t border-zinc-200/75" />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                扫描参数设置 <DirtyMark show={scanParametersDirty} />
              </div>
              <ProcessPathPointModeToolbar
                value={positionMode}
                options={[
                  { value: 'absolute', label: '绝对位置' },
                  { value: 'relative', label: '相对位置' },
                ]}
                onChange={changePositionMode}
                className="h-8 border-0 !pl-0 !pr-0"
                radioClassName="gap-6"
              />
            </div>
            <div className="mt-4 space-y-3">
              {scanPoints.map((point, index) => (
                <ScanPointCard
                  key={index}
                  index={index + 1}
                  title={`P${index + 1}`}
                  enabled={point.enabled}
                  pose={point.pose}
                  disabled={disabled}
                  active={activeScanPoint === index}
                  positionMode={positionMode}
                  absolutePose={absoluteScanPoses[index] ?? toAbsoluteScanPose(point.pose, index)}
                  onActivate={() => setActiveScanPoint(index)}
                  onEnabledChange={(enabled) => setScanPoints((points) => points.map((current, pointIndex) => pointIndex === index ? { ...current, enabled } : current))}
                  onPoseChange={(key, value) => updateScanPoint(index, key, value)}
                  onAbsolutePoseChange={(key, value) => updateAbsoluteScanPose(index, key, value)}
                />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/55 bg-white/38 px-4 py-3">
            <Button type="button" size="sm" className="bg-ds-brand-primary text-white hover:bg-ds-brand-primary-hover" onClick={replanScan}>
              重新扫描
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
