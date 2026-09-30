import type { ReactNode } from 'react';

/**
 * 工艺参数表单中复合输入框的统排布局组件。
 *
 * 设计规范：
 * - 多个相关输入框并排时，统一使用 gap-ds-250（16px）
 * - 不直接在业务代码里写 grid-cols-* gap-*，避免 magic number
 */
export function ProcessFieldGroup({
  cols,
  children,
  className = '',
}: {
  cols: 2 | 3 | 5;
  children: ReactNode;
  className?: string;
}) {
  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    5: 'grid-cols-5',
  }[cols];

  return <div className={`grid ${colsClass} gap-ds-250 ${className}`}>{children}</div>;
}
