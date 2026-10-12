import { Pause, Play } from 'lucide-react';
import {
  getWeldRobotPlayState,
  getWeldSegmentPlayState,
  type WeldRobotTimeline,
  type WeldTimelineSegment,
} from './weld-robot-timeline';

export const WELD_ROBOT_COLORS: Record<string, { chip: string; bar: string; dot: string }> = {
  Robot1: { chip: 'bg-orange-100/90 text-orange-700', bar: 'bg-orange-500/85', dot: 'bg-orange-500' },
  Robot2: { chip: 'bg-blue-100/90 text-blue-700', bar: 'bg-blue-500/85', dot: 'bg-blue-500' },
};

function getRobotColor(robotName: string) {
  return WELD_ROBOT_COLORS[robotName] ?? { chip: 'bg-zinc-100/90 text-zinc-600', bar: 'bg-zinc-400/85', dot: 'bg-zinc-400' };
}

function formatWeldTime(seconds: number): string {
  return `${Math.max(0, Math.round(seconds))}s`;
}

type PlayState = 'pending' | 'running' | 'done';

const PLAY_STATE_LABELS: Record<PlayState, string> = { pending: '待焊', running: '焊接中', done: '已焊完' };

/** 焊缝列表：单步模式选中「贴板[xx]焊接」工步时，模型视图左侧展示该工步的全部焊缝段。 */
export function WeldSegmentListPanel({
  timeline,
  time,
  workstepName,
  selectedSegmentIndex,
  onSelectSegment,
}: {
  timeline: WeldRobotTimeline;
  time: number;
  workstepName: string;
  selectedSegmentIndex: number | null;
  onSelectSegment: (segmentIndex: number) => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 backdrop-blur-xl">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">焊缝列表（{timeline.segments.length}）</span>
      </div>
      <div className="shrink-0 truncate px-2.5 pt-1.5 text-[10px] text-slate-500">{workstepName}</div>
      <div className="min-h-0 flex-1 overflow-auto p-1.5">
        <div className="space-y-1">
          {timeline.segments.map((segment, segmentIndex) => {
            const playState = getWeldSegmentPlayState(segment, time);
            const colors = getRobotColor(segment.robotName);
            const selected = selectedSegmentIndex === segmentIndex;
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => onSelectSegment(segmentIndex)}
                className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left transition-colors ${
                  selected ? 'bg-orange-50/80 ring-1 ring-inset ring-orange-200/90' : 'hover:bg-white/45'
                }`}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    playState === 'done' ? 'bg-emerald-500' : playState === 'running' ? `${colors.dot} animate-pulse` : 'bg-zinc-300'
                  }`}
                  title={PLAY_STATE_LABELS[playState]}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{segment.name}</span>
                <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${colors.chip}`}>{segment.robotName}</span>
                <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-slate-400">{formatWeldTime(segment.duration)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RobotCard({
  timeline,
  rowIndex,
  time,
}: {
  timeline: WeldRobotTimeline;
  rowIndex: number;
  time: number;
}) {
  const row = timeline.rows[rowIndex];
  if (!row) return null;
  const colors = getRobotColor(row.robotName);
  const playState = getWeldRobotPlayState(row, time);
  const current = playState.currentSegment;
  const currentProgress = current
    ? Math.min(1, Math.max(0, (time - current.start) / current.duration))
    : playState.status === 'done' ? 1 : 0;

  return (
    <div className="rounded-md bg-white/30 px-2 py-1.5 ring-1 ring-inset ring-white/30">
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${colors.dot}`} />
        <span className="text-[11px] font-medium text-slate-700">{row.robotName}</span>
        <span className="ml-auto text-[10px] text-slate-400">
          {playState.status === 'done' ? '已完成' : current ? PLAY_STATE_LABELS.running : '空闲'}
        </span>
      </div>
      <div className="mt-1 truncate text-[10px] text-slate-500">
        {current ? `当前：${current.name}` : playState.status === 'done' ? '全部焊缝焊接完成' : '等待分配焊缝'}
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200/80">
        <div className={`h-full rounded-full transition-[width] duration-100 ${colors.bar}`} style={{ width: `${currentProgress * 100}%` }} />
      </div>
    </div>
  );
}

/** 双机任务面板：播放控制 + 机器人状态卡 + 双行甘特时序图。 */
export function WeldRobotTimelinePanel({
  timeline,
  time,
  playing,
  speed,
  selectedSegmentIndex,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onSelectSegment,
}: {
  timeline: WeldRobotTimeline;
  time: number;
  playing: boolean;
  speed: number;
  selectedSegmentIndex: number | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onSelectSegment: (segmentIndex: number) => void;
}) {
  const progress = timeline.totalDuration > 0 ? Math.min(1, time / timeline.totalDuration) : 0;

  const handleTrackSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onSeek(ratio * timeline.totalDuration);
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 backdrop-blur-xl">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">双机任务</span>
        <button
          type="button"
          onClick={onPlayPause}
          className="flex size-5 items-center justify-center rounded-sm text-slate-500 transition-colors hover:bg-white/65 hover:text-slate-700"
          title={playing ? '暂停' : '播放'}
          aria-label={playing ? '暂停焊接时序' : '播放焊接时序'}
        >
          {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
        </button>
        <select
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          className="h-5 rounded-sm bg-white/60 text-[10px] text-slate-600 outline-none"
          title="播放速度"
          aria-label="播放速度"
        >
          {[0.5, 1, 2].map((option) => (
            <option key={option} value={option}>{option.toFixed(1)}x</option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {/* 总进度：点击跳转 */}
        <div className="mb-2">
          <div
            className="relative h-1.5 cursor-pointer overflow-hidden rounded-full bg-zinc-200/85"
            onClick={handleTrackSeek}
            role="slider"
            aria-label="焊接总进度"
            aria-valuemin={0}
            aria-valuemax={Math.round(timeline.totalDuration)}
            aria-valuenow={Math.round(time)}
            tabIndex={0}
          >
            <div className="h-full rounded-full bg-ds-brand-primary/85" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-slate-400">
            <span>{formatWeldTime(time)}</span>
            <span>{formatWeldTime(timeline.totalDuration)}</span>
          </div>
        </div>

        {/* 机器人状态卡 */}
        <div className="space-y-1.5">
          {timeline.rows.map((_, rowIndex) => (
            <RobotCard key={`weld-robot-card-${timeline.rows[rowIndex]?.robotName ?? rowIndex}`} timeline={timeline} rowIndex={rowIndex} time={time} />
          ))}
        </div>

        {/* 双行甘特时序图 */}
        <div className="mt-2 rounded-md bg-white/30 p-1.5 ring-1 ring-inset ring-white/30">
          <div className="mb-1 text-[10px] font-medium text-slate-500">焊接时序</div>
          <div className="relative">
            {timeline.rows.map((row, rowIndex) => {
              const colors = getRobotColor(row.robotName);
              return (
                <div key={`weld-gantt-row-${row.robotName}`} className={rowIndex > 0 ? 'mt-1.5' : ''}>
                  <div className="mb-0.5 flex items-center gap-1">
                    <span className={`size-1.5 rounded-full ${colors.dot}`} />
                    <span className="text-[10px] text-slate-600">{row.robotName}</span>
                  </div>
                  <div className="relative h-4 overflow-hidden rounded bg-zinc-100/85">
                    {row.segments.map((segment) => {
                      const segmentIndex = timeline.segments.indexOf(segment);
                      const playState = getWeldSegmentPlayState(segment, time);
                      const selected = selectedSegmentIndex === segmentIndex;
                      return (
                        <button
                          key={segment.id}
                          type="button"
                          onClick={() => onSelectSegment(segmentIndex)}
                          title={`${segment.name} · ${segment.robotName} · ${formatWeldTime(segment.duration)}`}
                          className={`absolute top-0.5 h-3 truncate rounded-sm px-0.5 text-left text-[9px] leading-3 text-white transition-opacity ${
                            colors.bar
                          } ${playState === 'pending' ? 'opacity-45' : ''} ${selected ? 'ring-1 ring-inset ring-slate-700/60' : ''}`}
                          style={{
                            left: `${(segment.start / timeline.totalDuration) * 100}%`,
                            width: `${(segment.duration / timeline.totalDuration) * 100}%`,
                          }}
                        >
                          {segment.name.replace('焊缝段 ', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* 当前时间游标 */}
            <div
              className="pointer-events-none absolute bottom-0 top-3 w-px bg-slate-600/70"
              style={{ left: `calc(${progress * 100}% )` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] tabular-nums text-slate-400">
            <span>0s</span>
            <span>{formatWeldTime(timeline.totalDuration / 2)}</span>
            <span>{formatWeldTime(timeline.totalDuration)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
