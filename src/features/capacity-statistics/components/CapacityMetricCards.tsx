import type { CapacityMetric } from '../types';

export function CapacityMetricCards({ metrics }: { metrics: CapacityMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
      {metrics.map((metric) => (
        <div key={metric.label} className="relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-ds-lg border border-ds-border-default bg-ds-bg-surface px-4 py-3 shadow-ds-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-ds-text-muted">
            <span className="size-2 rounded-full" style={{ backgroundColor: metric.color }} />
            {metric.label}
          </div>
          <div className="flex items-baseline gap-1 text-2xl font-medium tabular-nums text-ds-text-control-strong">
            {metric.value}
            {metric.unit && <span className="text-xs font-normal text-ds-text-muted">{metric.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
