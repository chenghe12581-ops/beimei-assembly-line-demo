import { Cog, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BentoFrame } from './BentoFrame';

export function ActionButtonsBento() {
  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center justify-center gap-2">
        <Button size="sm" className="h-8 px-3 text-xs">
          <Sparkles className="size-3.5" />
          生成
        </Button>
        <Button size="sm" variant="brandOutline" className="h-8 px-3 text-xs">
          预览
        </Button>
        <Button size="icon" variant="ghost" className="size-8">
          <Cog className="size-4" />
        </Button>
      </div>
    </BentoFrame>
  );
}
