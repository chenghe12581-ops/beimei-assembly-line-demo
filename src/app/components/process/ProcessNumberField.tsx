import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function isInvalidProcessNumberText(value: string) {
  const text = value.trim();
  if (!text) return true;
  const numericValue = Number(text);
  return !Number.isFinite(numericValue) || Number.isNaN(numericValue) || numericValue < 0;
}

export function ProcessNumberField({
  value,
  defaultValue,
  onChange,
  unit,
  inputClassName = 'pr-12',
  placeholder,
  invalid,
  disabled = false,
  stepper = false,
  step = 0.1,
}: {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  unit?: string;
  inputClassName?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  stepper?: boolean;
  step?: number;
}) {
  const [internalValue, setInternalValue] = useState(String(value ?? defaultValue ?? ''));
  const textValue = value === undefined ? internalValue : String(value);
  const isInvalid = invalid ?? isInvalidProcessNumberText(textValue);
  const setNextValue = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };
  const changeByStep = (direction: 1 | -1) => {
    if (disabled) return;
    const numericValue = Number(textValue);
    const nextValue = Number.isFinite(numericValue) ? numericValue + direction * step : direction * step;
    setNextValue(nextValue.toFixed(1));
  };

  return (
    <div className="relative min-w-0">
      <input
        value={textValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setNextValue(event.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-orange-300 disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-slate-400 ${
          isInvalid && !disabled ? 'border-red-300 bg-red-50/60' : 'border-ds-border-default'
        } ${inputClassName}`}
      />
      {unit && (
        <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[11px] ${stepper ? 'right-7' : 'right-3'} ${isInvalid && !disabled ? 'text-red-300' : 'text-slate-300'}`}>
          {unit}
        </span>
      )}
      {stepper && (
        <div className="absolute right-1 top-1/2 flex h-6 w-4 -translate-y-1/2 flex-col overflow-hidden rounded border border-ds-border-default bg-slate-50 text-ds-text-disabled shadow-[0_1px_1px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            aria-label="增加数值"
            disabled={disabled}
            className="flex h-3 items-center justify-center border-b border-ds-border-default transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled"
            onClick={(event) => {
              event.stopPropagation();
              changeByStep(1);
            }}
          >
            <ChevronUp className="size-2.5" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="减少数值"
            disabled={disabled}
            className="flex h-3 items-center justify-center transition-colors hover:bg-white hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-ds-text-disabled"
            onClick={(event) => {
              event.stopPropagation();
              changeByStep(-1);
            }}
          >
            <ChevronDown className="size-2.5" strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}
