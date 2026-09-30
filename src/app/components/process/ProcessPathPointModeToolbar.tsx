import type { ReactNode } from 'react';

type ModeOption<T extends string> = T | { value: T; label: ReactNode };

function getModeValue<T extends string>(option: ModeOption<T>) {
  return typeof option === 'string' ? option : option.value;
}

function getModeLabel<T extends string>(option: ModeOption<T>) {
  return typeof option === 'string' ? option : option.label;
}

function PathPointModeRadioGroup<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: readonly ModeOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {options.map((option) => {
        const optionValue = getModeValue(option);
        const selected = value === optionValue;
        return (
          <label
            key={optionValue}
              className={`group flex cursor-pointer items-center gap-1.5 text-[11px] font-medium transition-colors duration-300 ${
                selected ? 'text-ds-brand-primary-text' : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={selected}
              onChange={() => onChange(optionValue)}
            />
            <span
              aria-hidden="true"
              className={`grid size-3.5 place-items-center rounded-full border transition-colors ${
                selected
                  ? 'border-ds-brand-primary bg-white shadow-ds-sm'
                  : 'border-zinc-300 bg-white group-hover:border-orange-300'
              }`}
            >
              <span className={`size-1.5 rounded-full bg-ds-brand-primary transition-transform duration-300 ease-ds-standard ${selected ? 'scale-100' : 'scale-0'}`} />
            </span>
            <span>{getModeLabel(option)}</span>
          </label>
        );
      })}
    </div>
  );
}

export function ProcessPathPointModeToolbar<T extends string>({
  value,
  options,
  onChange,
  action,
  className = '',
  radioClassName = '',
  showRadioGroup = true,
}: {
  value: T;
  options: readonly ModeOption<T>[];
  onChange: (value: T) => void;
  action?: ReactNode;
  className?: string;
  radioClassName?: string;
  showRadioGroup?: boolean;
}) {
  return (
    <div className={`flex h-10 shrink-0 items-center justify-between gap-2 border-b border-zinc-100/80 pl-4 pr-3.5 ${className}`.trim()}>
      {showRadioGroup ? (
        <PathPointModeRadioGroup value={value} options={options} onChange={onChange} className={radioClassName} />
      ) : (
        <span aria-hidden="true" />
      )}
      {action}
    </div>
  );
}
