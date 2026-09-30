import { useEffect, useState } from 'react';
import { BentoFrame } from './BentoFrame';

const coordinateFrames = ['世界', '父系', '物体'] as const;
type CoordinateFrame = (typeof coordinateFrames)[number];
const coordinateFrameSequence = ['世界', '父系', '物体', '父系'] as const;
const segmentedStepMs = 1200;

function SegmentedControl({
  value,
  onChange,
}: {
  value: CoordinateFrame;
  onChange: (value: CoordinateFrame) => void;
}) {
  const selectedIndex = coordinateFrames.indexOf(value);

  return (
    <div className="relative grid w-full grid-cols-3 gap-1 overflow-hidden rounded-md bg-slate-100 p-1 text-[9px] leading-none text-slate-500">
      <span
        className="pointer-events-none absolute bottom-1 top-1 z-0 rounded-[5px] bg-white shadow-ds-sm transition-transform duration-500 ease-ds-standard"
        style={{
          left: '4px',
          width: 'calc((100% - 16px) / 3)',
          transform: `translateX(calc(${selectedIndex} * (100% + 4px)))`,
        }}
      />
      {coordinateFrames.map((frame) => {
        const selected = value === frame;
        return (
          <button
            key={frame}
            type="button"
            className={`relative z-10 h-6 rounded-[5px] px-1 text-center text-[12px] font-normal leading-none transition-colors duration-300 ${
              selected ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => onChange(frame)}
          >
            {frame}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControlBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [userControlled, setUserControlled] = useState(false);
  const activeFrame = coordinateFrameSequence[sequenceIndex];

  useEffect(() => {
    setSequenceIndex(0);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return;

    const intervalId = window.setInterval(() => {
      setSequenceIndex((currentIndex) => (currentIndex + 1) % coordinateFrameSequence.length);
    }, segmentedStepMs);

    return () => window.clearInterval(intervalId);
  }, [globalPlaying, restartSignal, userControlled]);

  const setActiveFrame = (nextFrame: CoordinateFrame) => {
    setUserControlled(true);
    setSequenceIndex((currentIndex) => {
      if (nextFrame === '世界') return 0;
      if (nextFrame === '物体') return 2;
      return currentIndex >= 2 ? 3 : 1;
    });
  };

  return (
    <BentoFrame className="md:col-span-2 xl:col-span-4">
      <div className="flex h-full items-center px-6 md:px-9">
        <SegmentedControl value={activeFrame} onChange={setActiveFrame} />
      </div>
    </BentoFrame>
  );
}
