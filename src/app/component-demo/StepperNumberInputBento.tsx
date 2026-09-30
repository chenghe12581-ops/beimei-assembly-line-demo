import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { BentoFrame } from './BentoFrame';

function StepperNumberInput({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [value, setValue] = useState(450);
  const [inputValue, setInputValue] = useState('450.0');
  const [pressedControl, setPressedControl] = useState<'plus' | 'minus' | null>(null);
  const [userControlled, setUserControlled] = useState(false);
  const pressTimeoutRef = useRef<number | null>(null);

  const pulseControl = (control: 'plus' | 'minus') => {
    if (pressTimeoutRef.current) {
      window.clearTimeout(pressTimeoutRef.current);
    }

    setPressedControl(control);
    pressTimeoutRef.current = window.setTimeout(() => {
      setPressedControl(null);
      pressTimeoutRef.current = null;
    }, 180);
  };

  const stepValue = (direction: 1 | -1, source: 'auto' | 'manual' = 'manual') => {
    if (source === 'manual') {
      setUserControlled(true);
    }
    setValue((currentValue) => {
      const nextValue = Number((currentValue + direction * 0.1).toFixed(1));
      setInputValue(nextValue.toFixed(1));
      return nextValue;
    });
    pulseControl(direction === 1 ? 'plus' : 'minus');
  };

  const updateInputValue = (nextValue: string) => {
    setUserControlled(true);
    setInputValue(nextValue);

    const normalizedValue = nextValue.trim();
    if (normalizedValue === '' || normalizedValue === '-' || normalizedValue === '.' || normalizedValue === '-.') {
      return;
    }

    const parsedValue = Number(nextValue);
    if (!Number.isNaN(parsedValue)) {
      setValue(parsedValue);
    }
  };

  useEffect(() => {
    setValue(450);
    setInputValue('450.0');
    setPressedControl(null);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!globalPlaying || userControlled) return;

    const intervalId = window.setInterval(() => {
      stepValue(1, 'auto');
    }, 1250);

    return () => window.clearInterval(intervalId);
  }, [globalPlaying, restartSignal, userControlled]);

  return (
    <div className="relative w-full max-w-[260px]">
      <input
        value={inputValue}
        onChange={(event) => updateInputValue(event.target.value)}
        onFocus={() => setUserControlled(true)}
        onPointerDown={() => setUserControlled(true)}
        className="h-9 w-full rounded-ds-lg border border-ds-border-default bg-white px-3 pr-16 text-right text-sm text-ds-text-secondary shadow-ds-sm outline-none"
      />
      <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 text-[11px] text-ds-text-disabled">mm</span>
      <div className="absolute bottom-1 right-1 top-1 grid w-6 grid-rows-2 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
        <button
          type="button"
          className={`grid place-items-center text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-white ${
            pressedControl === 'plus' ? 'translate-y-px bg-white text-ds-brand-primary-text shadow-inner' : ''
          }`}
          onClick={() => stepValue(1)}
        >
          <Plus className="size-3" />
        </button>
        <button
          type="button"
          className={`grid place-items-center border-t border-slate-100 text-slate-400 transition-[background-color,color,transform] duration-150 hover:bg-white ${
            pressedControl === 'minus' ? 'translate-y-px bg-white text-ds-brand-primary-text shadow-inner' : ''
          }`}
          onClick={() => stepValue(-1)}
        >
          <Minus className="size-3" />
        </button>
      </div>
    </div>
  );
}

export function StepperNumberInputBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center justify-center">
        <StepperNumberInput globalPlaying={globalPlaying} restartSignal={restartSignal} />
      </div>
    </BentoFrame>
  );
}
