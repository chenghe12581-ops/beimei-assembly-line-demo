import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../utils';
import type { ButtonProps } from './button.types';

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-ds-lg text-ds-label font-medium outline-none',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-100 ease-ds-standard',
    'focus-visible:border-ds-border-focus focus-visible:ring-2 focus-visible:ring-ds-brand-primary/20',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'border border-ds-brand-primary bg-ds-brand-primary text-ds-text-inverse shadow-ds-sm hover:border-ds-brand-primary-hover hover:bg-ds-brand-primary-hover active:translate-y-px disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-100 disabled:shadow-none',
        secondary:
          'border border-ds-border-default bg-ds-bg-surface text-ds-text-secondary shadow-ds-sm hover:border-ds-border-strong hover:bg-ds-bg-subtle active:translate-y-px',
        brandOutline:
          'border-2 border-ds-brand-primary bg-transparent text-ds-brand-primary hover:border-ds-brand-primary-hover hover:bg-transparent hover:text-ds-brand-primary-hover active:translate-y-px',
        subtle:
          'border border-ds-brand-primary/20 bg-ds-brand-primary-subtle text-ds-brand-primary-text hover:border-ds-brand-primary/40 hover:bg-[#ffedd5]',
        ghost:
          'border border-transparent bg-transparent text-ds-text-secondary hover:bg-ds-bg-subtle hover:text-ds-text-primary',
        danger:
          'border border-ds-status-danger bg-ds-status-danger text-ds-text-inverse shadow-ds-sm hover:bg-[#dc2626] active:translate-y-px',
        link:
          'h-auto border border-transparent bg-transparent px-0 text-ds-brand-primary-text underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-ds-control-sm px-ds-150 text-ds-label',
        md: 'h-ds-control-lg px-ds-200 text-ds-label',
        lg: 'h-ds-control-xl px-ds-250 text-ds-body',
        icon: 'size-ds-control-sm p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

const cjkTextPattern = /[\u3400-\u9fff\uf900-\ufaff]/u;

function wrapButtonChineseText(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return cjkTextPattern.test(child) ? (
        <span data-slot="button-label" className="inline-block pb-px">
          {child}
        </span>
      ) : child;
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
      return React.cloneElement(child, undefined, wrapButtonChineseText(child.props.children));
    }

    return child;
  });
}

function Button({ className, variant, size, asChild = false, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {wrapButtonChineseText(children)}
    </Comp>
  );
}

export { Button, buttonVariants };
