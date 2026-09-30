import { ChevronDown, ChevronUp } from 'lucide-react';

export type ProcessPosePointValue = {
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
};

export type ProcessPosePointAxis = keyof ProcessPosePointValue;

export const processPosePointAxes: ProcessPosePointAxis[] = ['x', 'y', 'z', 'rx', 'ry', 'rz'];

const positionAxes = ['x', 'y', 'z'] as const;
const rotationAxes = ['rx', 'ry', 'rz'] as const;

function formatSteppedPoseValue(value: string, step: number, direction: 1 | -1) {
  const numericValue = Number(value);
  const nextValue = Number.isFinite(numericValue) ? numericValue + direction * step : direction * step;
  return nextValue.toFixed(1);
}

function defaultAxisLabel(axis: ProcessPosePointAxis, valueMode: 'absolute' | 'delta') {
  const delta = valueMode === 'delta' && (axis === 'x' || axis === 'y' || axis === 'z');
  return `${delta ? 'Δ' : ''}${axis.toUpperCase()}`;
}

function PoseAxisField({
  axis,
  unit,
  value,
  valueMode,
  readOnly,
  disabled,
  stepper,
  step,
  axisLayout,
  axisGridClassName,
  axisLabelClassName,
  disabledAxisLabelClassName,
  inputClassName,
  inputVariant,
  unitClassName,
  stepperClassName,
  onAxisChange,
}: {
  axis: ProcessPosePointAxis;
  unit: string;
  value: string;
  valueMode: 'absolute' | 'delta';
  readOnly?: boolean;
  disabled?: boolean;
  stepper?: boolean;
  step: number;
  axisLayout: 'inline' | 'stacked';
  axisGridClassName: string;
  axisLabelClassName: string;
  disabledAxisLabelClassName: string;
  inputClassName: string;
  inputVariant: 'flat' | 'elevated';
  unitClassName: string;
  stepperClassName: string;
  onAxisChange: (axis: ProcessPosePointAxis, value: string) => void;
}) {
  const inputStateClassName = readOnly
    ? 'border-ds-border-default bg-slate-50/80 text-slate-500 shadow-none'
    : inputVariant === 'elevated'
      ? 'border-ds-border-default bg-white text-ds-text-secondary shadow-ds-sm hover:border-ds-border-strong focus:border-orange-200 focus:ring-2 focus:ring-orange-100'
      : 'border-ds-border-default bg-white text-slate-700 shadow-none hover:border-ds-border-strong focus:border-orange-200 focus:ring-2 focus:ring-orange-100';
  const unitOffsetClassName = stepper ? 'right-7' : 'right-2';

  return (
    <label className={axisLayout === 'stacked' ? 'flex min-w-0 flex-col gap-1' : `grid min-w-0 ${axisGridClassName} items-center gap-1`}>
      <span className={disabled ? disabledAxisLabelClassName : axisLabelClassName}>
        {defaultAxisLabel(axis, valueMode)}
      </span>
      <span className="relative min-w-0">
        <input
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          aria-label={`${defaultAxisLabel(axis, valueMode)} 坐标`}
          onChange={(event) => onAxisChange(axis, event.target.value)}
          className={`w-full rounded-ds-lg border tabular-nums outline-none transition-colors ${inputClassName} ${inputStateClassName} disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-slate-300 disabled:shadow-none`}
        />
        <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[10px] ${unitClassName} ${unitOffsetClassName}`}>
          {unit}
        </span>
        {stepper && !readOnly && (
          <span className={`absolute right-1 top-1/2 flex h-6 w-4 -translate-y-1/2 flex-col overflow-hidden rounded border border-ds-border-default bg-slate-50 text-ds-text-disabled ${stepperClassName}`}>
            <button
              type="button"
              aria-label={`增加 ${defaultAxisLabel(axis, valueMode)} 坐标`}
              disabled={disabled}
              className="flex h-3 items-center justify-center border-b border-ds-border-default transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled"
              onClick={(event) => {
                event.stopPropagation();
                onAxisChange(axis, formatSteppedPoseValue(value, step, 1));
              }}
            >
              <ChevronUp className="size-2.5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label={`减少 ${defaultAxisLabel(axis, valueMode)} 坐标`}
              disabled={disabled}
              className="flex h-3 items-center justify-center transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled"
              onClick={(event) => {
                event.stopPropagation();
                onAxisChange(axis, formatSteppedPoseValue(value, step, -1));
              }}
            >
              <ChevronDown className="size-2.5" strokeWidth={2.2} />
            </button>
          </span>
        )}
      </span>
    </label>
  );
}

export function PoseAxisFieldGroup({
  point,
  axes = processPosePointAxes,
  valueMode = 'absolute',
  readOnly = false,
  disabled = false,
  disabledAxes = [],
  stepper = false,
  step = 0.1,
  inputVariant = 'flat',
  inputClassName,
  axisGridClassName = 'grid-cols-[24px_minmax(0,1fr)]',
  axisLayout = 'inline',
  axisLabelClassName = 'text-[10px] uppercase text-ds-text-parameter-label',
  disabledAxisLabelClassName = 'text-[10px] uppercase text-slate-300',
  unitClassName = 'text-slate-300',
  stepperClassName = 'shadow-[0_1px_1px_rgba(15,23,42,0.04)]',
  gridGapClassName = 'gap-1.5',
  rowGridClassName = 'grid-cols-3',
  firstRowClassName = '',
  rowGapClassName = 'mt-ds-100',
  secondRowClassName = '',
  onAxisChange,
}: {
  point: ProcessPosePointValue;
  axes?: readonly ProcessPosePointAxis[];
  valueMode?: 'absolute' | 'delta';
  readOnly?: boolean;
  disabled?: boolean;
  disabledAxes?: readonly string[];
  stepper?: boolean;
  step?: number;
  inputVariant?: 'flat' | 'elevated';
  inputClassName?: string;
  axisGridClassName?: string;
  axisLayout?: 'inline' | 'stacked';
  axisLabelClassName?: string;
  disabledAxisLabelClassName?: string;
  unitClassName?: string;
  stepperClassName?: string;
  gridGapClassName?: string;
  rowGridClassName?: string;
  firstRowClassName?: string;
  rowGapClassName?: string;
  secondRowClassName?: string;
  onAxisChange: (axis: ProcessPosePointAxis, value: string) => void;
}) {
  const visiblePositionAxes = positionAxes.filter((axis) => axes.includes(axis));
  const visibleRotationAxes = rotationAxes.filter((axis) => axes.includes(axis));
  const resolvedInputClassName = inputClassName ?? (
    stepper
      ? 'h-8 px-2 pr-[3.25rem] text-right text-xs'
      : 'h-8 px-2 pr-8 text-right text-xs'
  );

  const renderAxis = (axis: ProcessPosePointAxis, unit: string) => (
    <PoseAxisField
      key={axis}
      axis={axis}
      unit={unit}
      value={point[axis]}
      valueMode={valueMode}
      readOnly={readOnly}
      disabled={disabled || disabledAxes.includes(axis)}
      stepper={stepper}
      step={step}
      axisLayout={axisLayout}
      axisGridClassName={axisGridClassName}
      axisLabelClassName={axisLabelClassName}
      disabledAxisLabelClassName={disabledAxisLabelClassName}
      inputClassName={resolvedInputClassName}
      inputVariant={inputVariant}
      unitClassName={unitClassName}
      stepperClassName={stepperClassName}
      onAxisChange={onAxisChange}
    />
  );

  return (
    <>
      {visiblePositionAxes.length > 0 && (
        <div className={`grid ${rowGridClassName} ${gridGapClassName} ${firstRowClassName}`}>
          {visiblePositionAxes.map((axis) => renderAxis(axis, 'mm'))}
        </div>
      )}
      {visibleRotationAxes.length > 0 && (
        <div className={`grid ${rowGridClassName} ${gridGapClassName} ${visiblePositionAxes.length > 0 ? rowGapClassName : ''} ${secondRowClassName}`}>
          {visibleRotationAxes.map((axis) => renderAxis(axis, '°'))}
        </div>
      )}
    </>
  );
}
