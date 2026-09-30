import { Check, ChevronDown, CircleAlert, Trash2 } from 'lucide-react';
import { BentoFrame } from './BentoFrame';

const statusItems = [
  { icon: Check, value: '就绪', tone: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
  { icon: CircleAlert, value: '异常', tone: 'text-red-600 bg-red-50 ring-red-100' },
  { icon: ChevronDown, value: '展开', tone: 'text-sky-600 bg-sky-50 ring-sky-100' },
  { icon: Trash2, value: '删除', tone: 'text-slate-500 bg-slate-50 ring-slate-100' },
];

export function StatusPillGridBento() {
  return (
    <BentoFrame className="md:col-span-6 xl:col-span-12">
      <div className="grid gap-3 md:grid-cols-4">
        {statusItems.map(({ icon: Icon, value, tone }) => (
          <div key={value} className="flex h-16 items-center justify-center rounded-ds-xl bg-slate-50/80">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 ${tone}`}>
              <Icon className="size-3.5" />
              {value}
            </div>
          </div>
        ))}
      </div>
    </BentoFrame>
  );
}
