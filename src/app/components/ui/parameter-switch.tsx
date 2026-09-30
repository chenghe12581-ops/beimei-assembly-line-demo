export function ParameterSwitch({
  checked,
  onChange,
  ariaLabel,
  enabledLabel = '启用',
  disabledLabel = '关闭',
  disabled = false,
  size = 'md',
  showStateLabel = true,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  enabledLabel?: string;
  disabledLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  showStateLabel?: boolean;
}) {
  const switchSizeClassName = size === 'sm' ? 'h-5 w-9' : 'h-6 w-10';
  const knobSizeClassName = size === 'sm' ? 'size-3.5' : 'size-4';
  const knobTranslateClassName = checked
    ? size === 'sm' ? 'translate-x-[18px]' : 'translate-x-5'
    : 'translate-x-1';

  return (
    <div className={`inline-flex items-center gap-2 ${disabled ? 'opacity-60' : ''}`}>
      {showStateLabel && (
        <span className={`ds-switch-state-label ${checked ? 'ds-switch-state-label-on' : 'ds-switch-state-label-off'}`}>
          {checked ? enabledLabel : disabledLabel}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
          checked ? 'bg-ds-brand-primary' : 'bg-slate-300'
        } ${switchSizeClassName}`}
        onClick={() => onChange(!checked)}
      >
        <span className={`inline-block rounded-full bg-white shadow-sm transition-transform ${knobSizeClassName} ${knobTranslateClassName}`} />
      </button>
    </div>
  );
}
