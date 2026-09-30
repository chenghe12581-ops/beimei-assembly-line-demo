import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../utils';
import type { InputProps } from './input.types';

const inputVariants = cva(
  [
    'flex w-full rounded-ds-lg border bg-ds-bg-surface text-ds-text-secondary outline-none',
    'transition-[background-color,border-color,box-shadow,color] duration-100 ease-ds-standard',
    'placeholder:text-ds-text-disabled',
    'focus:border-ds-border-focus focus:ring-2 focus:ring-ds-brand-primary/20',
    'disabled:cursor-not-allowed disabled:border-ds-border-default disabled:bg-ds-bg-control-disabled disabled:text-ds-text-disabled',
    'aria-invalid:border-ds-status-danger aria-invalid:bg-ds-status-danger-subtle aria-invalid:text-ds-text-secondary aria-invalid:focus:ring-ds-status-danger/15',
  ],
  {
    variants: {
      size: {
        sm: 'h-ds-control-sm px-ds-100 text-ds-input-sm',
        md: 'h-ds-control-md px-ds-150 text-ds-input-md',
        lg: 'h-ds-control-lg px-ds-150 text-ds-input-md',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = invalid ?? (ariaInvalid === true || ariaInvalid === 'true');

    return (
      <input
        ref={ref}
        data-slot="input"
        aria-invalid={isInvalid || undefined}
        className={cn(inputVariants({ size, className }))}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export { Input, inputVariants };
