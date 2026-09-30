import { forwardRef, useEffect, useState } from 'react';

export const UnitNumberInputDemo = forwardRef<HTMLInputElement, {
  value: string;
  unit: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  invalid?: boolean;
  disabled?: boolean;
  onUserInput?: () => void;
}>(
  (
    {
      value,
      unit,
      size = 'md',
      align = 'left',
      invalid = false,
      disabled = false,
      onUserInput,
    },
    ref,
  ) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const sizeClass = {
    sm: 'h-8 px-2 pr-9 text-xs',
    md: 'h-9 px-3 pr-11 text-sm',
    lg: 'h-10 px-3.5 pr-12 text-sm',
  }[size];

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        value={currentValue}
        onChange={(event) => {
          onUserInput?.();
          setCurrentValue(event.target.value);
        }}
        onFocus={onUserInput}
        onPointerDown={onUserInput}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={`w-full rounded-ds-lg border caret-orange-600 outline-none transition-[background-color,border-color,box-shadow,color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed ${sizeClass} ${
          align === 'right' ? 'text-right' : 'text-left'
        } ${
          disabled
            ? 'border-ds-border-default bg-ds-bg-subtle text-ds-text-disabled shadow-none'
            : invalid
              ? 'border-ds-status-danger bg-ds-status-danger-subtle text-ds-status-danger-text'
              : 'border-ds-border-default bg-white text-ds-text-secondary shadow-ds-sm'
        }`}
      />
      <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] ${invalid && !disabled ? 'text-red-300' : 'text-ds-text-disabled'}`}>
        {unit}
      </span>
    </div>
  );
  },
);

UnitNumberInputDemo.displayName = 'UnitNumberInputDemo';
