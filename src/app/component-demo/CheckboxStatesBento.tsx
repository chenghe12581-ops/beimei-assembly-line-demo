import { useEffect, useState } from 'react';
import { Checkbox } from '../../components/ui/checkbox';
import { BentoFrame } from './BentoFrame';

type CheckboxDemoState = 'default' | 'hover' | 'checked' | 'indeterminate';

const initialCheckboxStates: CheckboxDemoState[] = ['default', 'hover', 'checked', 'indeterminate'];
const checkboxStepMs = 1350;

function getCheckboxProps(state: CheckboxDemoState) {
  return {
    checked: state === 'checked',
    indeterminate: state === 'indeterminate',
  };
}

function getCheckboxClassName(state: CheckboxDemoState) {
  if (state === 'hover') {
    return 'border-ds-border-strong bg-ds-bg-subtle text-transparent';
  }

  return '';
}

export function CheckboxStatesBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [checkboxOrder, setCheckboxOrder] = useState<CheckboxDemoState[]>(initialCheckboxStates);
  const [userControlled, setUserControlled] = useState(false);

  useEffect(() => {
    setCheckboxOrder(initialCheckboxStates);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return;

    const intervalId = window.setInterval(() => {
      setCheckboxOrder((currentOrder) => [currentOrder[currentOrder.length - 1], ...currentOrder.slice(0, -1)]);
    }, checkboxStepMs);

    return () => window.clearInterval(intervalId);
  }, [globalPlaying, restartSignal, userControlled]);

  const handleUserToggle = (state: CheckboxDemoState) => {
    setUserControlled(true);
    setCheckboxOrder((currentOrder) =>
      currentOrder.map((item) => {
        if (item !== state) return item;
        return item === 'checked' ? 'default' : 'checked';
      }),
    );
  };

  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center justify-center gap-4">
        {checkboxOrder.map((state, index) => (
          <Checkbox
            key={index}
            {...getCheckboxProps(state)}
            className={`transition-[background-color,border-color,box-shadow,color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${getCheckboxClassName(state)}`}
            onCheckedChange={() => handleUserToggle(state)}
          />
        ))}
      </div>
    </BentoFrame>
  );
}
