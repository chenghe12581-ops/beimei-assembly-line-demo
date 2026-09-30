import { useState } from 'react';
import { Eye, Filter, PanelLeft, ScanFace, Settings2 } from 'lucide-react';

const toolStripItems = [
  { id: 'panel', label: '面板', icon: PanelLeft },
  { id: 'visible', label: '显示', icon: Eye },
  { id: 'scan', label: '扫描', icon: ScanFace },
  { id: 'filter', label: '筛选', icon: Filter },
  { id: 'settings', label: '设置', icon: Settings2 },
] as const;

type ToolStripItemId = (typeof toolStripItems)[number]['id'];

export function ToolStripDemo() {
  const [activeTool, setActiveTool] = useState<ToolStripItemId>('scan');

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 p-1 shadow-ds-main-nav backdrop-blur-md">
      {toolStripItems.map(({ id, label, icon: Icon }) => {
        const active = activeTool === id;

        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            className={`grid size-8 place-items-center rounded-full transition-[background-color,color,box-shadow,transform] duration-200 active:scale-95 ${
              active ? 'bg-ds-brand-primary text-white shadow-ds-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            onClick={() => setActiveTool(id)}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
