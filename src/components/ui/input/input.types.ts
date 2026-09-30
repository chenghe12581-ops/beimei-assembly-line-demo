import type * as React from 'react';
import type { VariantProps } from 'class-variance-authority';

import type { inputVariants } from './Input';

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  VariantProps<typeof inputVariants> & {
    invalid?: boolean;
  };
