export type VisionFeedStatus = 'normal' | 'warning' | 'offline';

export type VisionExceptionDemoKind = 'pose-6d' | 'transport' | 'intersection-3d';

export type VisionFeedOption = {
  id: string;
  label: string;
  status: VisionFeedStatus;
  exceptionKind: VisionExceptionDemoKind;
  unitLabel: string;
};

export const visionFeedOptions: VisionFeedOption[] = [
  { id: 'gantry-1', label: '桁架1视觉', status: 'normal', exceptionKind: 'pose-6d', unitLabel: '桁架定位单元' },
  { id: 'gantry-2', label: '桁架2视觉', status: 'normal', exceptionKind: 'pose-6d', unitLabel: '桁架复核单元' },
  { id: 'transport-1', label: '搬运机器人1视觉', status: 'normal', exceptionKind: 'transport', unitLabel: '搬运抓取 / 装配定位单元' },
  { id: 'transport-2', label: '搬运机器人2视觉', status: 'offline', exceptionKind: 'transport', unitLabel: '搬运复核单元' },
  { id: 'weld-1', label: '焊接机器人1视觉', status: 'normal', exceptionKind: 'intersection-3d', unitLabel: '正面焊接测量单元 1' },
  { id: 'weld-2', label: '焊接机器人2视觉', status: 'warning', exceptionKind: 'intersection-3d', unitLabel: '正面焊接测量单元 2' },
  { id: 'weld-3', label: '焊接机器人3视觉', status: 'normal', exceptionKind: 'intersection-3d', unitLabel: '反面焊接测量单元 1' },
  { id: 'weld-4', label: '焊接机器人4视觉', status: 'warning', exceptionKind: 'intersection-3d', unitLabel: '反面焊接测量单元 2' },
];

function getVisionFeedStatusLabel(status: VisionFeedStatus | 'abnormal') {
  if (status === 'abnormal') return '异常';
  if (status === 'warning') return '告警';
  if (status === 'offline') return '离线';
  return '正常';
}

function getVisionFeedStatusClassName(status: VisionFeedStatus | 'abnormal') {
  if (status === 'abnormal') return 'bg-red-500 ring-2 ring-red-100 shadow-[0_0_8px_rgba(239,68,68,0.45)]';
  if (status === 'warning') return 'bg-amber-400';
  if (status === 'offline') return 'bg-slate-300';
  return 'bg-emerald-500';
}

export function VisionFeedBar({
  activeFeedId,
  abnormalFeedId,
  allAbnormal = false,
  onSelect,
  disabled = false,
  className = '',
}: {
  activeFeedId: string;
  abnormalFeedId?: string;
  allAbnormal?: boolean;
  onSelect: (feedId: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex w-fit min-w-0 max-w-full items-center gap-2 overflow-x-auto rounded-xl border border-white/65 bg-white/72 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${disabled ? 'opacity-55' : ''} ${className}`.trim()}
      aria-label="视觉监控视图切换"
    >
      {visionFeedOptions.map((feed) => {
        const active = feed.id === activeFeedId;
        const status = allAbnormal || feed.id === abnormalFeedId ? 'abnormal' : feed.status;
        const statusLabel = getVisionFeedStatusLabel(status);

        return (
          <button
            key={feed.id}
            type="button"
            disabled={disabled}
            title={`${feed.label} · ${statusLabel}${status === 'abnormal' ? ' · 切换后打开异常处理' : ''}`}
            aria-pressed={active}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
            }`}
            onClick={() => onSelect(feed.id)}
          >
            <span className={`size-1.5 shrink-0 rounded-full ${getVisionFeedStatusClassName(status)}`} aria-hidden="true" />
            {feed.label}
            <span className="sr-only">，{statusLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
