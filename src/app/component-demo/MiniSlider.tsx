import { useEffect, useState } from 'react';

export function MiniSlider({
  value = 68,
  onChange,
  onUserInput,
}: {
  value?: number;
  onChange?: (nextValue: number) => void;
  onUserInput?: () => void;
}) {
  const [currentValue, setCurrentValue] = useState(value);
  const displayValue = Math.round(currentValue);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const updateValue = (nextValue: number, userInitiated = false) => {
    setCurrentValue(nextValue);
    onChange?.(nextValue);
    if (userInitiated) {
      onUserInput?.();
    }
  };

  return (
    <div className="flex h-9 items-center gap-3">
      <div className="relative h-1.5 flex-1 rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 rounded-full bg-ds-brand-primary" style={{ width: `${displayValue}%` }} />
        <div className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-ds-brand-primary shadow-ds-sm" style={{ left: `calc(${displayValue}% - 8px)` }} />
        <input
          type="range"
          min={0}
          max={100}
          value={displayValue}
          aria-label="工艺参数比例"
          className="absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 cursor-pointer opacity-0"
          onPointerDown={onUserInput}
          onChange={(event) => updateValue(Number(event.target.value), true)}
        />
      </div>
      <div className="w-10 text-right text-xs tabular-nums text-slate-500">{displayValue}%</div>
    </div>
  );
}
