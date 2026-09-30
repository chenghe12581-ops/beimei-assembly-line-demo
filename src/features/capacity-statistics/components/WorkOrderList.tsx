import { Search } from 'lucide-react';
import { ProcessSingleSelect } from '../../../app/components/process/ProcessSingleSelect';
import type { WorkOrder, WorkOrderStatus } from '../types';

export type WorkOrderSort = 'start' | 'completed';

const statusOptions = ['全部状态', '待生产', '加工中', '已完成', '异常中断']
  .map((value) => ({ id: value, name: value }));

const sortOptions: Array<{ id: WorkOrderSort; name: string }> = [
  { id: 'start', name: '开始时间 ↓' },
  { id: 'completed', name: '已完成数量 ↓' },
];

const statusClass: Record<WorkOrderStatus, string> = {
  待生产: 'bg-ds-bg-subtle text-ds-text-muted',
  加工中: 'bg-ds-status-info-subtle text-ds-status-info',
  已完成: 'bg-ds-status-success-subtle text-ds-status-success-text',
  异常中断: 'bg-ds-status-danger-subtle text-ds-status-danger-text',
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-ds-helper font-medium ${statusClass[status]}`}>{status}</span>;
}

type Props = {
  orders: WorkOrder[];
  selectedOrderId: string | null;
  query: string;
  status: WorkOrderStatus | '全部状态';
  sort: WorkOrderSort;
  onSelect: (id: string) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: WorkOrderStatus | '全部状态') => void;
  onSortChange: (value: WorkOrderSort) => void;
};

export function WorkOrderList({ orders, selectedOrderId, query, status, sort, onSelect, onQueryChange, onStatusChange, onSortChange }: Props) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-ds-lg border border-ds-border-default bg-ds-bg-surface">
      <div className="flex items-center justify-between border-b border-ds-border-subtle px-3.5 py-2.5">
        <strong className="text-sm font-medium text-ds-text-control-strong">工单列表</strong>
        <span className="text-ds-helper text-ds-text-muted">共 {orders.length} 个工单</span>
      </div>
      <div className="border-b border-ds-border-subtle p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-ds-text-muted" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索工单编号 / 工件代号" className="h-8 w-full rounded-ds-md border border-ds-border-default bg-ds-bg-surface pl-8 pr-2 text-xs text-ds-text-control-strong outline-none transition focus:border-ds-border-focus focus:ring-2 focus:ring-ds-brand-primary/15" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-ds-border-subtle px-3 py-2">
        <ProcessSingleSelect
          items={statusOptions}
          selectedId={status}
          size="sm"
          elevation="none"
          dropdownMode="portal"
          onChange={(value) => value && onStatusChange(value as WorkOrderStatus | '全部状态')}
        />
        <ProcessSingleSelect
          items={sortOptions}
          selectedId={sort}
          size="sm"
          elevation="none"
          dropdownMode="portal"
          onChange={(value) => value && onSortChange(value as WorkOrderSort)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-ds-text-muted">暂无匹配工单</div>
        ) : orders.map((order) => {
          const progress = order.planCount > 0 ? Math.round((order.completedCount / order.planCount) * 100) : 0;
          return (
            <button key={order.id} type="button" onClick={() => onSelect(order.id)} className={`w-full border-b border-ds-border-subtle px-3 py-3 text-left transition ${selectedOrderId === order.id ? 'bg-ds-brand-primary-subtle' : 'hover:bg-ds-bg-subtle'}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-ds-text-control-strong">{order.orderNo}</span>
                <WorkOrderStatusBadge status={order.status} />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-ds-helper text-ds-text-muted">
                <span className="truncate">{order.productType}</span>
                <span className="shrink-0">{order.completedCount}/{order.planCount} 件</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-ds-bg-muted"><i className="block h-full rounded-full bg-ds-brand-primary" style={{ width: `${progress}%` }} /></div>
              <div className="mt-1.5 flex items-center justify-between text-ds-helper text-ds-text-muted"><span>开始 {order.startTime?.slice(5, 16) ?? '--'}</span><span>{progress}%</span></div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
