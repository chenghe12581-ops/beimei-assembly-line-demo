import { useEffect, useState } from 'react';
import { BentoFrame } from './BentoFrame';

function AnimatedGripperSlider({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [value, setValue] = useState(64);
  const [userControlled, setUserControlled] = useState(false);
  const displayValue = Math.round(value);

  useEffect(() => {
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return;

    let frameId = 0;
    const startedAt = performance.now();
    const duration = 3600;

    const tick = (now: number) => {
      const progress = ((now - startedAt) % duration) / duration;
      const wave = 0.5 - Math.cos(progress * Math.PI * 2) / 2;
      setValue(wave * 100);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [globalPlaying, restartSignal, userControlled]);

  const handleManualChange = (nextValue: string) => {
    setUserControlled(true);
    setValue(Number(nextValue));
  };

  return (
    <div className="flex h-9 w-full items-center gap-3">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-100" />
        <div className="pointer-events-none absolute inset-y-0 left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ds-brand-primary" style={{ width: `${displayValue}%` }} />
        <div
          className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-ds-brand-primary shadow-ds-sm"
          style={{ left: `calc(${displayValue}% - 8px)` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={displayValue}
          aria-label="抓手行程"
          className="relative z-20 h-7 w-full cursor-pointer opacity-0"
          onPointerDown={() => setUserControlled(true)}
          onChange={(event) => handleManualChange(event.target.value)}
        />
      </div>
      <div className="w-10 text-right text-xs tabular-nums text-slate-500">{displayValue}%</div>
    </div>
  );
}

export function AnimatedGripperSliderBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center px-6 md:px-9">
        <AnimatedGripperSlider globalPlaying={globalPlaying} restartSignal={restartSignal} />
      </div>
    </BentoFrame>
  );
}
