import { useState } from 'react';
import { ProcessResultPointPanel } from '../components/process/ProcessResultPointPanel';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

function PointRow({
  active = false,
  values,
  onChange,
}: {
  active?: boolean;
  values: { x: string; y: string; z: string };
  onChange: (axis: 'x' | 'y' | 'z', value: string) => void;
}) {
  const inputClass = 'h-7 min-w-0 rounded-md border border-slate-100 bg-white px-2 text-right text-[11px] tabular-nums text-slate-600 shadow-none outline-none transition-colors hover:border-slate-200 focus:border-orange-200 focus:ring-2 focus:ring-orange-100';

  return (
    <div className={`rounded-ds-lg border p-2 ${active ? 'border-orange-200 bg-orange-50/60' : 'border-slate-100 bg-slate-50/80'}`}>
      <div className="grid grid-cols-[22px_repeat(3,minmax(0,1fr))] gap-1.5">
        <span className="grid place-items-center rounded-md bg-white text-[10px] text-slate-400 ring-1 ring-slate-100">1</span>
        <input className={inputClass} value={values.x} onChange={(event) => onChange('x', event.target.value)} />
        <input className={inputClass} value={values.y} onChange={(event) => onChange('y', event.target.value)} />
        <input className={inputClass} value={values.z} onChange={(event) => onChange('z', event.target.value)} />
      </div>
    </div>
  );
}

export function ResultPointPanelBento() {
  const [dirty, setDirty] = useState(true);
  const [values, setValues] = useState({ x: '120.0', y: '80.0', z: '15.0' });

  const updateValue = (axis: 'x' | 'y' | 'z', value: string) => {
    setValues((currentValues) => ({ ...currentValues, [axis]: value }));
    setDirty(true);
  };

  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <ProcessResultPointPanel title="结果点位" subtitle="XYZ" dirty={dirty} showDirtyIndicator onApplyUpdate={() => setDirty(false)}>
            <PointRow active values={values} onChange={updateValue} />
          </ProcessResultPointPanel>
        </div>
      </div>
    </BentoFrame>
  );
}
