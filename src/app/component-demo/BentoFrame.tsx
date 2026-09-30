import type { ReactNode } from 'react';

export function BentoFrame({
  children,
  className = '',
  allowOverflow = false,
}: {
  children: ReactNode;
  className?: string;
  allowOverflow?: boolean;
}) {
  return (
    <section
      className={`group/bento relative min-h-[156px] ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} rounded-[22px] border border-white/80 bg-white/78 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] backdrop-blur-xl md:p-7 ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="component-demo-bento-index pointer-events-none absolute bottom-3 right-4 z-20 text-[10px] font-medium tabular-nums tracking-[0.16em] text-slate-400/75 opacity-0 transition-opacity duration-200 group-hover/bento:opacity-100"
      />
    </section>
  );
}
