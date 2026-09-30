import { ConfigProvider, DatePicker } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createCapacityDataset, formatDuration, formatNumber, totalProduction } from './demo-data';
import { CapacityMetricCards } from './components/CapacityMetricCards';
import { CapacitySegmentedControl } from './components/CapacitySegmentedControl';
import { ProductionEfficiencyChart } from './components/ProductionEfficiencyChart';
import { WorkOrderDetail } from './components/WorkOrderDetail';
import { WorkOrderList, type WorkOrderSort } from './components/WorkOrderList';
import type { CapacityPeriod, WorkOrderStatus } from './types';
import { capacityVisualColors } from './visual-tokens';

dayjs.locale('zh-cn');

const periodOptions: Array<{ value: CapacityPeriod; label: string }> = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
];

export function CapacityStatisticsWorkspace() {
  const [period, setPeriod] = useState<CapacityPeriod>('day');
  const [date, setDate] = useState('2026-08-11');
  const [activeTab, setActiveTab] = useState<'production' | 'orders'>('production');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedWorkpieceId, setExpandedWorkpieceId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus | '全部状态'>('全部状态');
  const [sort, setSort] = useState<WorkOrderSort>('start');
  const [notice, setNotice] = useState<string | null>(null);

  const dataset = useMemo(() => createCapacityDataset(period, date), [period, date]);
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return dataset.orders
      .filter((order) => status === '全部状态' || order.status === status)
      .filter((order) => {
        if (!normalizedQuery) return true;
        return order.orderNo.toLowerCase().includes(normalizedQuery)
          || order.productType.toLowerCase().includes(normalizedQuery)
          || order.workpieces.some((workpiece) => workpiece.code.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => sort === 'completed'
        ? right.completedCount - left.completedCount
        : (right.startTime ?? '').localeCompare(left.startTime ?? ''));
  }, [dataset.orders, query, sort, status]);

  useEffect(() => {
    if (!filteredOrders.some((order) => order.id === selectedOrderId)) setSelectedOrderId(filteredOrders[0]?.id ?? null);
    setExpandedWorkpieceId(null);
  }, [filteredOrders, selectedOrderId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedOrder = filteredOrders.find((order) => order.id === selectedOrderId) ?? null;
  const onSeconds = dataset.points.reduce((sum, point) => sum + point.onSeconds, 0);
  const runtimeSeconds = dataset.points.reduce((sum, point) => sum + point.runtimeSeconds, 0);
  const faultSeconds = dataset.points.reduce((sum, point) => sum + point.faultSeconds, 0);
  const idleSeconds = Math.max(0, onSeconds - runtimeSeconds - faultSeconds);
  const utilization = onSeconds > 0 ? (runtimeSeconds / onSeconds) * 100 : 0;
  const metrics = [
    { label: '开机时长', value: formatDuration(onSeconds), color: capacityVisualColors.on },
    { label: '运行时长', value: formatDuration(runtimeSeconds), color: capacityVisualColors.runtime },
    { label: '待机时长', value: formatDuration(idleSeconds), color: capacityVisualColors.standby },
    { label: '故障时长', value: formatDuration(faultSeconds), color: capacityVisualColors.fault },
    { label: '稼动率', value: formatNumber(utilization, 1), unit: '%', color: capacityVisualColors.utilization },
    { label: '产量', value: formatNumber(totalProduction(dataset.points)), unit: '件', color: capacityVisualColors.output },
  ];

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-ds-bg-page text-ds-text-primary">
      {notice && <div role="status" className="fixed left-1/2 top-14 z-[2000] -translate-x-1/2 rounded-ds-md bg-ds-text-control-strong px-3 py-1.5 text-xs text-ds-text-inverse shadow-ds-md">{notice}</div>}
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 xl:px-4 xl:py-4">
        <div className="flex min-h-full w-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-ds-lg border border-ds-border-default bg-ds-bg-surface px-3 py-2.5 shadow-ds-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <CapacitySegmentedControl value={period} options={periodOptions} onChange={setPeriod} ariaLabel="统计周期" />
              <ConfigProvider locale={zhCN}>
                <DatePicker
                  aria-label="统计日期"
                  allowClear={false}
                  value={dayjs(date)}
                  format="YYYY/MM/DD"
                  className="capacity-statistics-date-picker h-8 w-[132px] text-xs"
                  classNames={{ popup: { root: 'capacity-statistics-date-picker-popup' } }}
                  onChange={(value) => value && setDate(value.format('YYYY-MM-DD'))}
                />
              </ConfigProvider>
            </div>
            <button type="button" onClick={() => setNotice('Excel 导出将在数据接口接入后启用')} className="inline-flex h-8 items-center gap-1.5 rounded-ds-md bg-ds-brand-primary px-3 text-xs font-medium text-ds-text-inverse transition hover:bg-ds-brand-primary-hover"><Download className="size-3.5" />导出数据</button>
          </div>

          <div className="flex h-9 items-end gap-4 border-b border-ds-border-default px-1">
            <button type="button" onClick={() => setActiveTab('production')} className={`relative h-9 px-1.5 text-xs transition-colors ${activeTab === 'production' ? 'font-medium text-ds-brand-primary-text after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-ds-brand-primary' : 'text-ds-text-control-muted hover:text-ds-text-control-strong'}`}>生产数据</button>
            <button type="button" onClick={() => setActiveTab('orders')} className={`relative h-9 px-1.5 text-xs transition-colors ${activeTab === 'orders' ? 'font-medium text-ds-brand-primary-text after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-ds-brand-primary' : 'text-ds-text-control-muted hover:text-ds-text-control-strong'}`}>工单数据</button>
          </div>

          {activeTab === 'production' ? (
            <div className="flex flex-col gap-3">
              <CapacityMetricCards metrics={metrics} />
              <ProductionEfficiencyChart points={dataset.points} />
            </div>
          ) : (
            <div className="grid min-h-[520px] min-w-0 grid-cols-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
              <WorkOrderList orders={filteredOrders} selectedOrderId={selectedOrderId} query={query} status={status} sort={sort} onSelect={(id) => { setSelectedOrderId(id); setExpandedWorkpieceId(null); }} onQueryChange={setQuery} onStatusChange={setStatus} onSortChange={setSort} />
              <WorkOrderDetail order={selectedOrder} expandedWorkpieceId={expandedWorkpieceId} onToggleWorkpiece={(id) => setExpandedWorkpieceId((current) => current === id ? null : id)} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
