import { useEffect, useRef, useState } from 'react';
import type { ProductionPoint } from '../types';
import { capacityVisualColors } from '../visual-tokens';

const compactLabel = (label: string, index: number, count: number) => {
  if (count <= 12) return label;
  if (index === 0 || index === count - 1 || index % Math.ceil(count / 8) === 0) return label;
  return '';
};

export function ProductionEfficiencyChart({ points }: { points: ProductionPoint[] }) {
  const chartFrameRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 980, height: 330 });

  useEffect(() => {
    const frame = chartFrameRef.current;
    if (!frame) return undefined;

    const updateSize = () => {
      const nextSize = {
        width: Math.max(1, Math.round(frame.clientWidth)),
        height: Math.max(1, Math.round(frame.clientHeight)),
      };
      setChartSize((currentSize) => currentSize.width === nextSize.width && currentSize.height === nextSize.height ? currentSize : nextSize);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const { width, height } = chartSize;
  const left = 54;
  const right = 56;
  const top = 40;
  const bottom = 44;
  const chartWidth = Math.max(1, width - left - right);
  const chartHeight = Math.max(1, height - top - bottom);
  const maxValue = Math.max(60, ...points.map((point) => (point.runtimeSeconds + point.faultSeconds) / 60));
  const step = chartWidth / Math.max(points.length, 1);
  const barWidth = Math.max(4, Math.min(30, step * 0.56));
  const xFor = (index: number) => left + step * index + step / 2;
  const yForUtilization = (value: number) => top + chartHeight - (value / 100) * chartHeight;
  const utilizationPoints = points.map((point, index) => {
    const utilization = point.onSeconds > 0 ? (point.runtimeSeconds / point.onSeconds) * 100 : 0;
    return `${xFor(index)},${yForUtilization(utilization)}`;
  }).join(' ');

  return (
    <div className="rounded-ds-lg border border-ds-border-default bg-ds-bg-surface p-4 shadow-ds-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-medium text-ds-text-control-strong">生产能效趋势</h3>
        <span className="text-ds-helper text-ds-text-muted">时长 / min · 稼动率 / %</span>
      </div>
      <div className="mb-2 flex justify-end gap-4 text-ds-helper text-ds-text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm" style={{ backgroundColor: capacityVisualColors.runtime }} />运行时长</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm" style={{ backgroundColor: capacityVisualColors.fault }} />故障时长</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-4 rounded-full" style={{ backgroundColor: capacityVisualColors.utilization }} />稼动率</span>
      </div>
      <div ref={chartFrameRef} className="h-[310px] w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="生产运行、故障时长和稼动率趋势图">
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yForUtilization(tick);
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="#f0f1f4" />
                <text x={left - 10} y={y + 4} textAnchor="end" fill="#a1a1aa" fontSize="10">{Math.round((tick / 100) * maxValue)}′</text>
                <text x={width - right + 10} y={y + 4} fill={capacityVisualColors.utilization} fontSize="10">{tick}%</text>
              </g>
            );
          })}
          <line x1={left} x2={left} y1={top} y2={height - bottom} stroke="#dfe2e8" />
          <line x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} stroke="#dfe2e8" />
          {points.map((point, index) => {
            const runtimeHeight = (point.runtimeSeconds / 60 / maxValue) * chartHeight;
            const faultHeight = (point.faultSeconds / 60 / maxValue) * chartHeight;
            const x = xFor(index) - barWidth / 2;
            const runtimeY = height - bottom - runtimeHeight;
            const faultY = runtimeY - faultHeight;
            return (
              <g key={point.id}>
                <title>{`${point.label} 运行 ${Math.round(point.runtimeSeconds / 60)} 分钟，故障 ${Math.round(point.faultSeconds / 60)} 分钟`}</title>
                <rect x={x} y={runtimeY} width={barWidth} height={runtimeHeight} rx="1" fill={capacityVisualColors.runtime} />
                <rect x={x} y={faultY} width={barWidth} height={faultHeight} rx="1" fill={capacityVisualColors.fault} />
                <text x={xFor(index)} y={height - bottom + 21} textAnchor="middle" fill="#a1a1aa" fontSize="10">{compactLabel(point.label, index, points.length)}</text>
              </g>
            );
          })}
          <polyline points={utilizationPoints} fill="none" stroke={capacityVisualColors.utilization} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((point, index) => {
            const utilization = point.onSeconds > 0 ? (point.runtimeSeconds / point.onSeconds) * 100 : 0;
            return <circle key={`${point.id}-util`} cx={xFor(index)} cy={yForUtilization(utilization)} r="5" fill="transparent"><title>{`${point.label} 稼动率 ${utilization.toFixed(1)}%`}</title></circle>;
          })}
        </svg>
      </div>
    </div>
  );
}
