import { BentoFrame } from './BentoFrame';
import { ToolStripDemo } from './ToolStripDemo';

export function ToolStripBento() {
  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className="flex h-full items-center justify-center">
        <ToolStripDemo />
      </div>
    </BentoFrame>
  );
}
