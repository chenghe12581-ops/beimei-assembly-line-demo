import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';
import { UnitNumberInputDemo } from './UnitNumberInputDemo';

export function FloatingPanelBento() {
  return (
    <BentoFrame className="md:col-span-6 xl:col-span-6 xl:min-h-[196px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <div className="overflow-hidden rounded-ds-lg border border-white/70 bg-white/75 shadow-ds-overlay backdrop-blur-md">
            <div className="flex h-10 items-center justify-between border-b border-white/60 bg-white/55 px-3">
              <div className="text-xs text-slate-700">工艺参数设置</div>
              <X className="size-3.5 text-slate-400" />
            </div>
            <div className="grid grid-cols-[96px_1fr]">
              <div className="space-y-1 bg-white/35 p-2">
                <div className="rounded-md bg-orange-50 px-2 py-1.5 text-[11px] text-ds-brand-primary-text">支撑点</div>
                <div className="rounded-md px-2 py-1.5 text-[11px] text-slate-400">压紧点</div>
              </div>
              <div className="space-y-2 bg-white/50 p-3">
                <UnitNumberInputDemo value="450" unit="mm" size="sm" />
                <UnitNumberInputDemo value="240" unit="mm" size="sm" align="right" />
              </div>
            </div>
            <div className="flex h-10 justify-end gap-2 border-t border-white/60 bg-white/55 px-3 py-2 shadow-ds-footer-up">
              <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]">
                重置
              </Button>
              <Button size="sm" className="h-6 px-2 text-[11px]">
                确认
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}
