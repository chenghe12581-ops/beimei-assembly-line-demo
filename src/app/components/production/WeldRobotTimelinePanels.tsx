import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { WeldRobotTimeline } from './weld-robot-timeline';

export const WELD_ROBOT_COLORS: Record<string, { chip: string; bar: string; dot: string }> = {
  Robot1: { chip: 'bg-orange-100/90 text-orange-700', bar: 'bg-orange-500/85', dot: 'bg-orange-500' },
  Robot2: { chip: 'bg-blue-100/90 text-blue-700', bar: 'bg-blue-500/85', dot: 'bg-blue-500' },
};

function getRobotColor(robotName: string) {
  return WELD_ROBOT_COLORS[robotName] ?? { chip: 'bg-zinc-100/90 text-zinc-600', bar: 'bg-zinc-400/85', dot: 'bg-zinc-400' };
}

/** 焊缝列表：单步模式选中「贴板[xx]焊接」工步时，模型视图左侧（属性参数下方）展示该工步的全部焊缝段。 */
export function WeldSegmentListPanel({
  timeline,
  workstepName,
  selectedSegmentIndex,
  onSelectSegment,
}: {
  timeline: WeldRobotTimeline;
  workstepName: string;
  selectedSegmentIndex: number | null;
  onSelectSegment: (segmentIndex: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 backdrop-blur-xl ${
        collapsed ? 'h-8 flex-none' : 'max-h-[46%] flex-none min-h-0'
      }`}
    >
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">焊缝列表（{timeline.segments.length}）</span>
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/65 hover:text-slate-600"
          title={collapsed ? '展开焊缝列表' : '收起焊缝列表'}
          aria-label={collapsed ? '展开焊缝列表' : '收起焊缝列表'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>
      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="truncate px-2.5 pt-1.5 text-[10px] text-slate-500">{workstepName}</div>
          <div className="space-y-1 p-1.5">
            {timeline.segments.map((segment, segmentIndex) => {
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
                  <span className={`size-1.5 shrink-0 rounded-full ${colors.dot}`} />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{segment.name}</span>
                  <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${colors.chip}`}>{segment.robotName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/** 焊接时序面板：双行甘特图展示焊缝组的双机焊接顺序（不含播放与时间显示）。 */
export function WeldRobotTimelinePanel({
  timeline,
  selectedSegmentIndex,
  onSelectSegment,
}: {
  timeline: WeldRobotTimeline;
  selectedSegmentIndex: number | null;
  onSelectSegment: (segmentIndex: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 backdrop-blur-xl ${
        collapsed ? 'h-8' : 'h-auto'
      }`}
    >
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">焊接时序</span>
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/65 hover:text-slate-600"
          title={collapsed ? '展开焊接时序' : '收起焊接时序'}
          aria-label={collapsed ? '展开焊接时序' : '收起焊接时序'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>
      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <div className="rounded-md bg-white/30 p-1.5 ring-1 ring-inset ring-white/30">
            <div className="mb-1 text-[10px] text-slate-500">开局双机并行 · Robot1 续焊剩余焊缝</div>
            <div>
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
                        const selected = selectedSegmentIndex === segmentIndex;
                        return (
                          <button
                            key={segment.id}
                            type="button"
                            onClick={() => onSelectSegment(segmentIndex)}
                            title={`${segment.name} · ${segment.robotName}`}
                            className={`absolute top-0.5 h-3 truncate rounded-sm px-0.5 text-left text-[9px] leading-3 text-white ${colors.bar} ${
                              selected ? 'ring-1 ring-inset ring-slate-700/60' : ''
                            }`}
                            style={{
                              left: `${(segment.start / timeline.totalDuration) * 100}%`,
                              width: `${(segment.duration / timeline.totalDuration) * 100}%`,
                            }}
                          >
                            {segment.name.replace('焊缝 ', '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
