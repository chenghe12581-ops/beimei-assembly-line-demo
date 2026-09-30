import { ProcessSingleSelect } from '../components/process/ProcessSingleSelect';
import { BentoFrame } from './BentoFrame';

export function SingleSelectBento({
  singleId,
  onSingleIdChange,
}: {
  singleId: string;
  onSingleIdChange: (nextId: string) => void;
}) {
  return (
    <BentoFrame allowOverflow className="relative z-30 md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-[260px]">
          <ProcessSingleSelect
            items={[
              { id: 'gantry', name: '桁架机械臂' },
              { id: 'robot', name: '六轴机器人' },
              { id: 'turnover', name: '翻面平台' },
            ]}
            selectedId={singleId}
            onChange={(nextId) => onSingleIdChange(nextId ?? 'gantry')}
          />
        </div>
      </div>
    </BentoFrame>
  );
}
