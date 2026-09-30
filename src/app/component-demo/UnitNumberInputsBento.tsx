import { useEffect, useRef, useState } from 'react';
import { BentoFrame } from './BentoFrame';
import { UnitNumberInputDemo } from './UnitNumberInputDemo';

const UNIT_INPUT_CYCLE_MS = 4200;
const FOCUS_VISIBLE_MS = 1500;
const DISABLED_TOGGLE_OFFSET_MS = 900;
const DISABLED_VISIBLE_MS = 2100;

export function UnitNumberInputsBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [isDisabledPreview, setIsDisabledPreview] = useState(false);
  const [userControlled, setUserControlled] = useState(false);
  const editableInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    editableInputRef.current?.blur();
    setIsDisabledPreview(false);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) {
      return undefined;
    }

    let blurTimeout = 0;
    let disableOnTimeout = 0;
    let disableOffTimeout = 0;

    const playCycle = () => {
      setIsDisabledPreview(false);
      editableInputRef.current?.focus({ preventScroll: true });

      blurTimeout = window.setTimeout(() => {
        editableInputRef.current?.blur();
      }, FOCUS_VISIBLE_MS);

      disableOnTimeout = window.setTimeout(() => {
        setIsDisabledPreview(true);
      }, DISABLED_TOGGLE_OFFSET_MS);

      disableOffTimeout = window.setTimeout(() => {
        setIsDisabledPreview(false);
      }, DISABLED_TOGGLE_OFFSET_MS + DISABLED_VISIBLE_MS);
    };

    playCycle();
    const intervalId = window.setInterval(playCycle, UNIT_INPUT_CYCLE_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(blurTimeout);
      window.clearTimeout(disableOnTimeout);
      window.clearTimeout(disableOffTimeout);
    };
  }, [globalPlaying, userControlled]);

  const stopAuto = () => {
    setUserControlled(true);
  };

  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full flex-col justify-center gap-2.5 px-5 md:px-8">
        <UnitNumberInputDemo value="450.0" unit="mm" disabled={isDisabledPreview} onUserInput={stopAuto} />
        <UnitNumberInputDemo ref={editableInputRef} value="96.0" unit="mm" size="sm" align="right" onUserInput={stopAuto} />
      </div>
    </BentoFrame>
  );
}
