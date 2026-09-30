import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  PoseAxisFieldGroup,
  type ProcessPosePointAxis,
  type ProcessPosePointValue,
} from './PoseAxisFieldGroup';

export type { ProcessPosePointAxis, ProcessPosePointValue } from './PoseAxisFieldGroup';

function ProcessPosePointSummaryText({
  point,
  delta = false,
}: {
  point: ProcessPosePointValue;
  delta?: boolean;
}) {
  const items = [
    [`${delta ? 'Δ' : ''}X`, point.x],
    [`${delta ? 'Δ' : ''}Y`, point.y],
    [`${delta ? 'Δ' : ''}Z`, point.z],
    ['RX', point.rx],
    ['RY', point.ry],
    ['RZ', point.rz],
  ];

  return (
    <div className="min-w-0 truncate text-[11px] leading-5 text-slate-500" title={items.map(([label, value]) => `${label} ${value}`).join(' / ')}>
      {items.map(([label, value], itemIndex) => (
        <span key={label} className="whitespace-nowrap">
          {itemIndex > 0 && <span className="mx-1 text-slate-300">/</span>}
          <span className="font-medium text-ds-text-parameter-label">{label}</span>
          <span className="ml-0.5 font-mono tabular-nums text-slate-600">{value}</span>
        </span>
      ))}
    </div>
  );
}

export function ProcessPosePointInfoRow({
  label,
  point,
  onAxisChange,
  disabled,
  selected,
  onSelect,
  collapsed,
  onCollapsedChange,
  defaultCollapsed = false,
  valueMode = 'absolute',
}: {
  label: string;
  point: ProcessPosePointValue;
  onAxisChange: (axis: ProcessPosePointAxis, value: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  valueMode?: 'absolute' | 'delta';
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsed ?? internalCollapsed;
  const delta = valueMode === 'delta';

  const setNextCollapsed = (nextCollapsed: boolean) => {
    if (collapsed === undefined) {
      setInternalCollapsed(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  };

  return (
    <div
      className={`rounded-lg border px-2.5 py-2 transition-[background-color,border-color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        selected ? 'border-ds-border-default bg-white' : 'border-transparent bg-white/70 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_20px] items-center gap-1.5">
        <div className="text-[11px] font-medium text-ds-text-parameter-label">{label}</div>
        <div
          className={`min-w-0 transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isCollapsed ? 'translate-y-0 opacity-100 delay-75' : '-translate-y-0.5 opacity-0'
          }`}
        >
          <ProcessPosePointSummaryText point={point} delta={delta} />
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? '展开点位' : '折叠点位'}
          aria-expanded={!isCollapsed}
          disabled={disabled}
          className="flex size-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
          onClick={(event) => {
            event.stopPropagation();
            setNextCollapsed(!isCollapsed);
          }}
        >
          <ChevronRight className={`size-3.5 transition-transform duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isCollapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>
      <div
        className={`grid transition-[grid-template-rows,opacity,margin-top] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCollapsed ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-1 grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isCollapsed ? '-translate-y-1 opacity-0' : 'translate-y-0 opacity-100 delay-75'
            }`}
          >
            <PoseAxisFieldGroup
              point={point}
              valueMode={delta ? 'delta' : 'absolute'}
              disabled={disabled}
              inputVariant="elevated"
              firstRowClassName="border-t border-slate-100/80 pt-[6px]"
              rowGapClassName="pt-1"
              onAxisChange={onAxisChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
