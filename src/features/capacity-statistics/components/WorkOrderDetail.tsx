import { ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import type { ProcessLane, ProcessSegment, WorkOrder, Workpiece } from '../types';
import { formatDuration } from '../demo-data';
import { WorkOrderStatusBadge } from './WorkOrderList';

const kindColor: Record<ProcessSegment['kind'], string> = {
  load: '#a9cbee',
  grind: '#4a90d9',
  assemble: 'var(--ds-color-brand-primary)',
  weld: '#dc2626',
  flip: '#a97bd6',
  unload: '#8a94a6',
  wait: '#d9dde4',
};

const segmentDuration = (segment: ProcessSegment) => segment.endSeconds - segment.startSeconds;

function ProcessGantt({ workpiece }: { workpiece: Workpiece }) {
  const total = Math.max(workpiece.totalSeconds, 1);
  const tickStep = total > 2400 ? 600 : total > 1200 ? 300 : 120;
  const ticks: number[] = [];
  for (let current = 0; current <= total; current += tickStep) ticks.push(Math.min(current, total));
  if (ticks[ticks.length - 1] !== total) ticks.push(total);

  return (
    <div className="mt-3 rounded-ds-lg border border-ds-border-default bg-ds-bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-ds-text-control">
        <span>并行工序甘特图</span>
        <span className="text-ds-helper font-normal text-ds-text-muted">贴板配置 正{workpiece.frontPlates.length} / 反{workpiece.backPlates.length} · 总时长 {formatDuration(workpiece.totalSeconds)}</span>
      </div>
      <div className="mt-2 mb-2 flex flex-wrap gap-x-4 gap-y-1 text-ds-micro text-ds-text-muted">
        {(['load', 'grind', 'assemble', 'weld', 'flip', 'unload', 'wait'] as ProcessSegment['kind'][]).map((kind) => <span key={kind} className="inline-flex items-center gap-1"><i className={`size-2 rounded-sm ${kind === 'wait' ? 'bg-[repeating-linear-gradient(45deg,#d9dde4,#d9dde4_2px,#eef0f3_2px,#eef0f3_4px)]' : ''}`} style={{ backgroundColor: kind === 'wait' ? undefined : kindColor[kind] }} />{kind === 'load' ? '上料/搬运' : kind === 'grind' ? '打磨' : kind === 'assemble' ? '装配' : kind === 'weld' ? '定位焊' : kind === 'flip' ? '组件翻面' : kind === 'unload' ? '下料' : '等待'}</span>)}
      </div>
      <div className="relative mb-2 ml-[164px] h-5 border-b border-ds-border-default">
        {ticks.map((tick) => <span key={tick} className="absolute top-0 -translate-x-1/2 text-ds-micro text-ds-text-muted" style={{ left: `${(tick / total) * 100}%` }}>{Math.round(tick / 60)}′</span>)}
      </div>
      <div className="space-y-1.5">
        {workpiece.lanes.map((lane) => {
          const laneSegments = workpiece.segments.filter((segment) => segment.laneId === lane.id);
          return (
            <div key={lane.id} className="flex min-w-0 items-center gap-2">
              <div className={`w-[156px] shrink-0 text-left ${lane.type === 'main' ? 'text-ds-helper font-medium text-ds-text-control' : 'text-ds-text-muted'}`} title={lane.label}>
                {lane.type === 'main' ? lane.label : <><span className="block text-ds-micro leading-3">{lane.type === 'front' ? '正面' : '反面'}</span><span className="block whitespace-nowrap text-ds-helper leading-4">{lane.label}</span></>}
              </div>
              <div className="relative h-7 min-w-0 flex-1 overflow-visible rounded-ds-sm bg-ds-bg-subtle">
                {laneSegments.map((segment) => {
                  const planned = workpiece.currentSeconds !== undefined && segment.startSeconds >= workpiece.currentSeconds;
                  const left = (segment.startSeconds / total) * 100;
                  const width = (segmentDuration(segment) / total) * 100;
                  return (
                    <div key={segment.id} className="group absolute inset-y-0 overflow-visible" style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}>
                      <div aria-label={`${segment.label} ${formatDuration(segmentDuration(segment))}`} className={`absolute inset-0 rounded-[1px] ${planned ? 'opacity-35' : ''} ${segment.kind === 'wait' ? 'bg-[repeating-linear-gradient(45deg,#d9dde4,#d9dde4_3px,#eef0f3_3px,#eef0f3_6px)]' : ''}`} style={{ backgroundColor: segment.kind === 'wait' ? undefined : kindColor[segment.kind] }} />
                      <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-ds-sm bg-ds-text-control-strong px-2 py-1 text-ds-micro font-normal text-ds-text-inverse opacity-0 shadow-ds-md transition-opacity duration-100 group-hover:opacity-100">{segment.label} · {formatDuration(segmentDuration(segment))}</span>
                    </div>
                  );
                })}
                {workpiece.currentSeconds !== undefined && <i className="absolute inset-y-0 z-10 w-px bg-red-500" style={{ left: `${(workpiece.currentSeconds / total) * 100}%` }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepRows({ title, color, segments, suffix }: { title: string; color: string; segments: ProcessSegment[]; suffix?: string }) {
  return (
    <div className="rounded-ds-lg border border-ds-border-default bg-ds-bg-surface p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-ds-text-control"><i className="h-3.5 w-1 rounded-full" style={{ backgroundColor: color }} />{title}{suffix && <span className="ml-auto text-ds-helper font-normal text-ds-text-muted">{suffix}</span>}</div>
      {segments.length === 0 ? <div className="text-ds-helper text-ds-text-muted">--</div> : segments.map((segment) => <div key={segment.id} className="flex items-center justify-between border-b border-dashed border-ds-border-subtle py-1.5 text-ds-helper last:border-b-0"><span className={segment.kind === 'wait' ? 'text-ds-text-muted' : 'text-ds-text-control'}>{segment.label}</span><strong className={segment.kind === 'wait' ? 'font-normal text-ds-text-muted' : 'font-medium tabular-nums text-ds-text-control'}>{formatDuration(segmentDuration(segment))}</strong></div>)}
    </div>
  );
}

function WorkpieceExpandedDetail({ workpiece }: { workpiece: Workpiece }) {
  const mainSegments = workpiece.segments.filter((segment) => segment.laneId === 'main' && !['flip', 'unload'].includes(segment.kind));
  const flipSegments = workpiece.segments.filter((segment) => segment.laneId === 'main' && segment.kind === 'flip');
  const backLoadSegments = workpiece.segments.filter((segment) => segment.laneId === 'main' && segment.label.includes('工位2上料'));
  const unloadSegments = workpiece.segments.filter((segment) => segment.laneId === 'main' && segment.kind === 'unload');
  const frontLanes = workpiece.lanes.filter((lane) => lane.type === 'front');
  const backLanes = workpiece.lanes.filter((lane) => lane.type === 'back');
  const laneSegments = (lane: ProcessLane) => workpiece.segments.filter((segment) => segment.laneId === lane.id);
  return (
    <div className="bg-ds-bg-subtle/70 px-4 py-3">
      <ProcessGantt workpiece={workpiece} />
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <StepRows title="主筋板处理" color="#4a90d9" segments={mainSegments} />
        <StepRows title="正面贴板工序" color="var(--ds-color-brand-primary)" suffix={`${frontLanes.length} 块`} segments={frontLanes.flatMap(laneSegments)} />
        {backLanes.length > 0 && <StepRows title="翻面与转位" color="#a97bd6" segments={[...flipSegments, ...backLoadSegments]} />}
        {backLanes.length > 0 && <StepRows title="反面贴板工序" color="#22a06b" suffix={`${backLanes.length} 块`} segments={backLanes.flatMap(laneSegments)} />}
        <StepRows title="收尾与汇总" color="#8a94a6" segments={[...unloadSegments, { id: `${workpiece.id}-fault`, laneId: 'summary', label: '故障等待', kind: 'wait', startSeconds: 0, endSeconds: workpiece.faultWaitSeconds }]} />
      </div>
    </div>
  );
}

type Props = {
  order: WorkOrder | null;
  expandedWorkpieceId: string | null;
  onToggleWorkpiece: (id: string) => void;
};

export function WorkOrderDetail({ order, expandedWorkpieceId, onToggleWorkpiece }: Props) {
  if (!order) return <section className="flex min-h-0 items-center justify-center rounded-ds-lg border border-ds-border-default bg-ds-bg-surface text-xs text-ds-text-muted">暂无匹配工单</section>;
  const progress = order.planCount > 0 ? Math.round((order.completedCount / order.planCount) * 100) : 0;
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-ds-lg border border-ds-border-default bg-ds-bg-surface">
      <header className="shrink-0 border-b border-ds-border-subtle px-4 py-3">
        <div className="flex items-center justify-between gap-3"><h2 className="truncate text-sm font-semibold text-ds-text-control-strong">{order.orderNo}</h2><WorkOrderStatusBadge status={order.status} /></div>
        <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          {[
            ['计划数量', `${order.planCount} 件`],
            ['已完成数量', `${order.completedCount} 件`],
            ['加工中数量', `${order.runningCount} 件`],
            ['工单总加工时长', formatDuration(order.totalSeconds)],
            ['工单开始时间', order.startTime ?? '--'],
            ['工单结束时间', order.endTime ?? (order.status === '加工中' ? '加工中' : '--')],
            ['产品类型', order.productType],
            ['完成进度', `${progress}%`],
          ].map(([label, value]) => <div key={label} className="min-w-0"><div className="text-ds-helper text-ds-text-muted">{label}</div><div className={`mt-1 truncate text-xs font-medium tabular-nums ${label === '工单总加工时长' ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`}>{value}</div></div>)}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="mb-2"><strong className="text-sm font-medium text-ds-text-control-strong">工件明细</strong></div>
        {order.workpieces.length === 0 ? <div className="border border-dashed border-ds-border-default py-12 text-center text-xs text-ds-text-muted">该工单暂未开始加工</div> : (
          <div className="overflow-x-auto rounded-ds-md border border-ds-border-default">
            <table className="w-full min-w-[820px] border-collapse text-xs">
              <thead><tr className="bg-ds-bg-subtle text-left text-ds-helper font-medium text-ds-text-muted">{['工件代号', '开始加工', '结束加工', '贴板配置', '故障等待', '总加工时长', '加工状态', ''].map((label) => <th key={label} className="whitespace-nowrap border-b border-ds-border-default px-2.5 py-2.5">{label === '工件代号' ? <span className="flex items-center"><span className="inline-flex w-4 shrink-0" aria-hidden="true" /><span className="ml-2">{label}</span></span> : label}</th>)}</tr></thead>
              <tbody>{order.workpieces.map((workpiece) => {
                const expanded = expandedWorkpieceId === workpiece.id;
                return (
                  <Fragment key={workpiece.id}>
                    <tr key={workpiece.id} onClick={() => onToggleWorkpiece(workpiece.id)} className={`cursor-pointer border-b border-ds-border-subtle transition hover:bg-ds-bg-subtle ${expanded ? 'bg-ds-brand-primary-subtle/70' : ''}`}>
                      <td className="whitespace-nowrap px-2.5 py-2.5 font-medium text-ds-text-control"><span className="flex items-center"><span className="inline-flex w-4 shrink-0 items-center justify-center">{expanded ? <ChevronDown className="size-3.5 text-ds-brand-primary" /> : <ChevronRight className="size-3.5 text-ds-text-muted" />}</span><span className="ml-2">{workpiece.code}</span></span></td>
                      <td className="whitespace-nowrap px-2.5 py-2.5 tabular-nums text-ds-text-muted">{workpiece.startTime}</td>
                      <td className="whitespace-nowrap px-2.5 py-2.5 tabular-nums text-ds-text-muted">{workpiece.endTime ?? '加工中'}</td>
                      <td className="whitespace-nowrap px-2.5 py-2.5 text-ds-text-muted">正{workpiece.frontPlates.length} / 反{workpiece.backPlates.length}</td>
                      <td className="whitespace-nowrap px-2.5 py-2.5 tabular-nums text-ds-text-muted">{formatDuration(workpiece.faultWaitSeconds)}</td>
                      <td className="whitespace-nowrap px-2.5 py-2.5 font-medium tabular-nums text-ds-text-control">{workpiece.status === '加工中' ? '--' : formatDuration(workpiece.totalSeconds)}</td>
                      <td className="whitespace-nowrap px-2.5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-ds-helper font-medium ${workpiece.status === '已完成' ? 'bg-ds-status-success-subtle text-ds-status-success-text' : workpiece.status === '加工中' ? 'bg-ds-status-info-subtle text-ds-status-info' : 'bg-ds-status-danger-subtle text-ds-status-danger-text'}`}>{workpiece.status}</span></td>
                      <td className="w-4 whitespace-nowrap px-2.5 py-2.5" />
                    </tr>
                    {expanded && <tr key={`${workpiece.id}-expanded`}><td colSpan={8} className="p-0"><WorkpieceExpandedDetail workpiece={workpiece} /></td></tr>}
                  </Fragment>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
