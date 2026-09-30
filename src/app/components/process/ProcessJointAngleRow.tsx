import { ProcessNumberField } from './ProcessNumberField';

export function ProcessJointAngleRow({
  index,
  label,
  value,
  onChange,
  unit: unitProp,
  min,
  max,
  step = 0.1,
  disabled = false,
  selected,
  onSelect,
  selectedVariant = 'emphasis',
}: {
  index: number;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  selectedVariant?: 'emphasis' | 'subtle';
}) {
  const unit = unitProp ?? (index === 0 ? 'mm' : '°');
  const fallbackRange = index === 0 ? { min: 0, max: 200 } : { min: -180, max: 180 };
  const range = {
    min: Number.isFinite(min) ? min! : fallbackRange.min,
    max: Number.isFinite(max) ? max! : fallbackRange.max,
  };
  const numericValue = Number(value);
  const sliderValue = Number.isFinite(numericValue)
    ? Math.min(range.max, Math.max(range.min, numericValue))
    : range.min;
  const sliderPercent = ((sliderValue - range.min) / (range.max - range.min)) * 100;

  return (
    <div
      className={`grid min-w-0 grid-cols-[40px_minmax(0,7fr)_minmax(0,5fr)] items-center gap-ds-150 rounded-lg border px-2 py-1.5 transition-all ${
        selected
          ? selectedVariant === 'subtle'
            ? 'border-ds-border-default bg-white'
            : 'border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200'
          : 'border-transparent hover:bg-white/70'
      } ${disabled ? 'cursor-not-allowed' : onSelect ? 'cursor-pointer' : ''}`}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="text-xs font-medium text-slate-600">{label ?? `J${index + 1}`}</div>
      <div className="relative h-8 min-w-0">
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={step}
          value={sliderValue}
          disabled={disabled}
          aria-label={`${label ?? `J${index + 1}`}${unit}滑杆`}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-x-0 top-0 z-10 h-8 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center">
          <div className="relative h-1.5 flex-1 rounded-full bg-ds-bg-slider-track">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${disabled ? 'bg-slate-300' : 'bg-ds-brand-primary'}`}
              style={{ width: `${sliderPercent}%` }}
            />
            <div
              className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm ${
                disabled ? 'border-slate-300' : 'border-ds-brand-primary'
              }`}
              style={{ left: `${sliderPercent}%` }}
            />
          </div>
        </div>
      </div>
      <ProcessNumberField
        value={value}
        invalid={false}
        unit={unit}
        disabled={disabled}
        inputClassName="h-8 px-2 pr-[3.25rem] text-right text-xs"
        stepper
        step={step}
        onChange={onChange}
      />
    </div>
  );
}
