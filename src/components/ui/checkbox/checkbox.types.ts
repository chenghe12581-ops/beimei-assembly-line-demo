import type * as React from 'react';

export type CheckboxChangeEvent = {
  target: {
    checked: boolean;
    indeterminate: boolean;
  };
};

export type CheckboxProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onChange'> & {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  invalid?: boolean;
  size?: 'sm' | 'md';
  onChange?: (event: CheckboxChangeEvent) => void;
  onCheckedChange?: (checked: boolean) => void;
};
