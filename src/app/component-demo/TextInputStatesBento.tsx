import { useEffect, useState } from 'react';
import { Input } from '../../components/ui/input';
import { BentoFrame } from './BentoFrame';

const INPUT_ROTATION_INTERVAL_MS = 2400;

const inputFieldConfigs = [
  {
    value: '0162-01-010101-01',
    selectedClassName: 'border-ds-border-focus bg-ds-bg-surface ring-2 ring-ds-brand-primary/20',
  },
  {
    value: '工件名称',
    invalid: true,
    selectedClassName: 'border-ds-status-danger bg-ds-status-danger-subtle ring-2 ring-ds-status-danger/15',
  },
];

export function TextInputStatesBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [inputValues, setInputValues] = useState(() => inputFieldConfigs.map((field) => field.value));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userControlled, setUserControlled] = useState(false);

  useEffect(() => {
    setSelectedIndex(0);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSelectedIndex((currentIndex) => (currentIndex + 1) % 2);
    }, INPUT_ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [globalPlaying, userControlled]);

  const handleUserInput = (nextIndex: number) => {
    setSelectedIndex(nextIndex);
    setUserControlled(true);
  };

  const handleValueChange = (nextIndex: number, nextValue: string) => {
    handleUserInput(nextIndex);
    setInputValues((currentValues) => currentValues.map((currentValue, index) => (index === nextIndex ? nextValue : currentValue)));
  };

  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full flex-col justify-center gap-2.5 px-5 md:px-8">
        {inputFieldConfigs.map((field, index) => {
          const isSelected = selectedIndex === index;

          return (
            <div key={field.value} className="rounded-ds-lg">
              <Input
                value={inputValues[index]}
                size="md"
                invalid={field.invalid}
                className={`transition-[background-color,border-color,box-shadow,color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isSelected ? field.selectedClassName : 'ring-0'
                }`}
                onChange={(event) => handleValueChange(index, event.target.value)}
                onFocus={() => handleUserInput(index)}
                onPointerDown={() => handleUserInput(index)}
              />
            </div>
          );
        })}
      </div>
    </BentoFrame>
  );
}
