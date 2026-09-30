import * as React from 'react';
import { Check, Minus } from 'lucide-react';

import { cn } from '../utils';
import type { CheckboxProps } from './checkbox.types';

const sizeClasses = {
  sm: 'size-4',
  md: 'size-5',
} as const;

const iconSizeClasses = {
  sm: 'size-3',
  md: 'size-3.5',
} as const;

const stateClasses = {
  unchecked: 'border-ds-border-default bg-ds-bg-surface text-transparent hover:border-ds-border-strong hover:bg-ds-bg-subtle',
  checked:
    'border-ds-brand-primary bg-ds-brand-primary text-ds-text-inverse shadow-ds-sm hover:border-ds-brand-primary-hover hover:bg-ds-brand-primary-hover',
  indeterminate:
    'border-ds-brand-primary bg-ds-brand-primary text-ds-text-inverse shadow-ds-sm hover:border-ds-brand-primary-hover hover:bg-ds-brand-primary-hover',
  invalid:
    'border-ds-status-danger bg-ds-status-danger-subtle text-ds-status-danger hover:bg-[#fee2e2]',
  disabled: 'border-ds-border-default bg-ds-bg-subtle text-ds-text-disabled',
} as const;

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      indeterminate = false,
      invalid = false,
      disabled = false,
      size = 'md',
      onChange,
      onCheckedChange,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked));
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : internalChecked;
    const currentState = disabled
      ? 'disabled'
      : indeterminate
        ? 'indeterminate'
        : currentChecked
          ? 'checked'
          : invalid
            ? 'invalid'
            : 'unchecked';

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) return;

      const nextChecked = indeterminate ? true : !currentChecked;
      if (!isControlled) {
        setInternalChecked(nextChecked);
      }

      onCheckedChange?.(nextChecked);
      onChange?.({ target: { checked: nextChecked, indeterminate: false } });
    };

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : currentChecked}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        data-slot="checkbox"
        data-state={currentState}
        onClick={handleClick}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-ds-sm border outline-none transition-[background-color,border-color,box-shadow,color] duration-100 ease-ds-standard focus-visible:ring-2 focus-visible:ring-ds-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses[size],
          stateClasses[currentState],
          className,
        )}
        {...props}
      >
        {indeterminate ? (
          <Minus className={iconSizeClasses[size]} />
        ) : (
          <Check className={`${iconSizeClasses[size]} transition-opacity ${currentChecked ? 'opacity-100' : 'opacity-0'}`} />
        )}
      </button>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
