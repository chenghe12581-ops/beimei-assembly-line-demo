import type { ReactNode } from 'react';
import { Button } from '../ui/button';

export function ProcessResultPointPanel({
  title = '结果点位',
  subtitle,
  dirty,
  onApplyUpdate,
  showDirtyIndicator = false,
  showUpdateButton = true,
  action,
  children,
  className = '',
  contentClassName = '',
  headerClassName = '',
  surfaceClassName = 'bg-ds-bg-subtle/80',
  variant = 'default',
}: {
  title?: string;
  subtitle?: string;
  dirty?: boolean;
  onApplyUpdate?: () => void;
  showDirtyIndicator?: boolean;
  showUpdateButton?: boolean;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  surfaceClassName?: string;
  variant?: 'default' | 'flush';
}) {
  const surfaceClasses = variant === 'flush' ? '' : `rounded-ds-xl ${surfaceClassName} p-ds-150`;
  const headerClasses =
    variant === 'flush'
      ? `${children ? 'mb-ds-100' : ''} flex items-center justify-between px-2 py-1.5 ${headerClassName}`
      : `${children ? 'mb-ds-100' : ''} flex items-center justify-between ${headerClassName}`;
  const contentClasses = contentClassName || (variant === 'flush' ? 'space-y-ds-100 px-2' : 'space-y-ds-100');

  return (
    <div className={`${surfaceClasses} ${className}`.trim()}>
      <div className={headerClasses}>
        <div className="flex items-center gap-ds-050 text-ds-label text-ds-text-parameter-label">
          <span>{title}</span>
          {subtitle && <span className="text-ds-helper text-ds-text-disabled">· {subtitle}</span>}
          {showDirtyIndicator && dirty && <span className="text-ds-label font-semibold text-ds-brand-primary-hover">*</span>}
        </div>
        {action ?? (showUpdateButton && onApplyUpdate && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px]"
            disabled={!dirty}
            onClick={onApplyUpdate}
          >
            更新
          </Button>
        ))}
      </div>
      {children && <div className={contentClasses.trim()}>{children}</div>}
    </div>
  );
}
