import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { ProcessDetailTabBar } from '../components/process/ProcessDetailTabBar';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';
import { MiniSlider } from './MiniSlider';

export type ProcessDetailDemoTab = 'parameter' | 'point';

const PROCESS_TAB_INTERVAL_MS = 1200;
const PROCESS_TAB_VALUES: Record<ProcessDetailDemoTab, number> = {
  parameter: 64,
  point: 36,
};

const getNextTab = (tab: ProcessDetailDemoTab): ProcessDetailDemoTab => (tab === 'parameter' ? 'point' : 'parameter');

const easeInOut = (progress: number) => 0.5 - Math.cos(progress * Math.PI) / 2;

export function ProcessDetailTabsBento({
  activeTab,
  onActiveTabChange,
  globalPlaying,
  restartSignal,
}: {
  activeTab: ProcessDetailDemoTab;
  onActiveTabChange: (nextTab: ProcessDetailDemoTab) => void;
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [sliderValue, setSliderValue] = useState(PROCESS_TAB_VALUES.parameter);
  const [userControlled, setUserControlled] = useState(false);
  const sliderValueRef = useRef(PROCESS_TAB_VALUES.parameter);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    sliderValueRef.current = sliderValue;
  }, [sliderValue]);

  useEffect(() => {
    setUserControlled(false);
    onActiveTabChange('parameter');
    setSliderValue(PROCESS_TAB_VALUES.parameter);
  }, [onActiveTabChange, restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) {
      return undefined;
    }

    let frameId = 0;
    let timeoutId = 0;
    const animateTo = (nextTab: ProcessDetailDemoTab) => {
      const fromValue = sliderValueRef.current;
      const toValue = PROCESS_TAB_VALUES[nextTab];
      const startedAt = performance.now();

      onActiveTabChange(nextTab);

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / PROCESS_TAB_INTERVAL_MS, 1);
        const easedProgress = easeInOut(progress);
        const nextValue = fromValue + (toValue - fromValue) * easedProgress;

        sliderValueRef.current = nextValue;
        setSliderValue(nextValue);

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        } else {
          timeoutId = window.setTimeout(() => animateTo(getNextTab(nextTab)), PROCESS_TAB_INTERVAL_MS);
        }
      };

      frameId = requestAnimationFrame(tick);
    };

    timeoutId = window.setTimeout(() => animateTo(getNextTab(activeTabRef.current)), PROCESS_TAB_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);
    };
  }, [globalPlaying, onActiveTabChange, userControlled]);

  const stopAuto = () => {
    setUserControlled(true);
  };

  const handleTabChange = (nextTab: ProcessDetailDemoTab) => {
    stopAuto();
    onActiveTabChange(nextTab);
    setSliderValue(PROCESS_TAB_VALUES[nextTab]);
  };

  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <ProcessDetailTabBar
            tabs={[
              { key: 'parameter', label: '工艺参数' },
              { key: 'point', label: '路径点位' },
            ]}
            activeKey={activeTab}
            onChange={handleTabChange}
            action={
              <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]">
                更新
              </Button>
            }
            className="rounded-t-ds-lg border-x border-t bg-white/70"
          />
          <div className="rounded-b-ds-lg border-x border-b border-zinc-200/70 bg-white/45 p-3">
            <MiniSlider value={sliderValue} onChange={setSliderValue} onUserInput={stopAuto} />
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}
