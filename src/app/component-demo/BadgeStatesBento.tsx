import { Badge } from '../components/ui/badge';
import { BentoFrame } from './BentoFrame';

export function BadgeStatesBento() {
  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full flex-wrap items-center justify-center gap-2">
        <Badge className="border-orange-100 bg-orange-50 text-ds-brand-primary-text">选中</Badge>
        <Badge className="border-slate-200 bg-white text-slate-500" variant="outline">
          默认
        </Badge>
        <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">完成</Badge>
      </div>
    </BentoFrame>
  );
}
