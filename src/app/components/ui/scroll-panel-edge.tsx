export function ScrollPanelEdge({
  className = '',
  as = 'div',
}: {
  className?: string;
  as?: 'div' | 'span';
}) {
  const resolvedClassName = `ds-scroll-edge-bottom ${className}`.trim();
  if (as === 'span') {
    return <span className={resolvedClassName} />;
  }
  return <div className={resolvedClassName} />;
}
