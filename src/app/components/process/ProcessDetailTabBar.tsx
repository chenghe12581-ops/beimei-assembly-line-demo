import type { ReactNode } from 'react';

type ProcessDetailTabBarItem<T extends string> = {
  key: T;
  label: ReactNode;
};

export function ProcessDetailTabBar<T extends string>({
  tabs,
  activeKey,
  onChange,
  action,
  className = '',
}: {
  tabs: ProcessDetailTabBarItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex h-10 shrink-0 items-center gap-3 border-b border-ds-border-process-planning-structure px-3.5 ${className}`.trim()}>
      <div className="flex h-full min-w-0 flex-1 items-center gap-3 overflow-x-auto">
        {tabs.map((tab) => {
          const selected = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`relative flex h-full shrink-0 items-center px-0.5 pt-1 text-xs leading-4 transition-colors ${
                selected ? 'font-medium text-zinc-700' : 'font-normal text-zinc-400 hover:text-zinc-600'
              }`}
              onClick={() => onChange(tab.key)}
            >
              {tab.label}
              <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${selected ? 'bg-ds-brand-primary' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
    </div>
  );
}
