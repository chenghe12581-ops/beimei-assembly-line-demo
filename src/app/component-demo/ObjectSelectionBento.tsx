import { ProcessSelectionPanel } from '../components/process/ProcessSelectionPanel';
import { BentoFrame } from './BentoFrame';

const demoItems = [
  { id: '0162-01-010101-01', name: '0162-01-010101-01' },
  { id: '0162-01-010101-02', name: '0162-01-010101-02' },
  { id: '01-grind', name: '01 打磨线 1' },
  { id: '01-02-weld', name: '01-02 焊缝' },
];

export function ObjectSelectionBento({
  selectedIds,
  onSelectedIdsChange,
}: {
  selectedIds: string[];
  onSelectedIdsChange: (nextIds: string[]) => void;
}) {
  return (
    <BentoFrame allowOverflow className="relative z-30 md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-[260px]">
          <ProcessSelectionPanel
            label="关联对象"
            items={demoItems}
            selectedIds={selectedIds}
            placeholder="请选择对象"
            actionLabel="点选"
            variant="flush"
            onAction={() => undefined}
            onChange={onSelectedIdsChange}
          />
        </div>
      </div>
    </BentoFrame>
  );
}
