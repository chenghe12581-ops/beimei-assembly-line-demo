import { CircleCheck, X } from 'lucide-react';
import { BentoFrame } from './BentoFrame';

export function ToastBento() {
  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className="flex h-full items-center">
        <div className="mx-auto flex w-full max-w-[320px] items-start gap-2 rounded-ds-xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-ds-md">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          <div className="min-w-0 flex-1 text-xs text-slate-700">工序序列已更新</div>
          <X className="size-3.5 shrink-0 text-slate-300" />
        </div>
      </div>
    </BentoFrame>
  );
}
