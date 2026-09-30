type CapacitySegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: readonly CapacitySegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
};

export function CapacitySegmentedControl<T extends string>({ value, options, onChange, ariaLabel }: Props<T>) {
  return (
    <div className="inline-flex rounded-lg bg-ds-bg-segmented p-0.5" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors ${selected ? 'bg-ds-bg-surface text-ds-brand-primary-text shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:bg-ds-bg-surface/60 hover:text-slate-700'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
