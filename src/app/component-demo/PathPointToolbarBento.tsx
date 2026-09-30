import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { ProcessPathPointGroupHeader } from '../components/process/ProcessPathPointGroupHeader';
import { ProcessPathPointModeToolbar } from '../components/process/ProcessPathPointModeToolbar';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

export type PathPointDemoMode = 'edit' | 'preview';

export function PathPointToolbarBento({
  mode,
  collapsed,
  onModeChange,
  onCollapsedChange,
  globalPlaying,
  restartSignal,
}: {
  mode: PathPointDemoMode;
  collapsed: boolean;
  onModeChange: (nextMode: PathPointDemoMode) => void;
  onCollapsedChange: (nextCollapsed: boolean) => void;
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [userControlled, setUserControlled] = useState(false);

  useEffect(() => {
    setUserControlled(false);
    onModeChange('edit');
    onCollapsedChange(false);
  }, [onCollapsedChange, onModeChange, restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return;

    const intervalId = window.setInterval(() => {
      onModeChange(mode === 'edit' ? 'preview' : 'edit');
    }, 1300);

    return () => window.clearInterval(intervalId);
  }, [globalPlaying, mode, onModeChange, restartSignal, userControlled]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return;

    const intervalId = window.setInterval(() => {
      onCollapsedChange(!collapsed);
    }, 1650);

    return () => window.clearInterval(intervalId);
  }, [collapsed, globalPlaying, onCollapsedChange, restartSignal, userControlled]);

  const handleModeChange = (nextMode: PathPointDemoMode) => {
    setUserControlled(true);
    onModeChange(nextMode);
  };

  const handleCollapsedChange = () => {
    setUserControlled(true);
    onCollapsedChange(!collapsed);
  };

  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={`${WIDE_PADDED_BENTO_CONTENT_CLASS} flex flex-col gap-2`}>
          <ProcessPathPointModeToolbar
            value={mode}
            options={[
              { value: 'edit', label: '编辑' },
              { value: 'preview', label: '回显' },
            ]}
            onChange={handleModeChange}
            action={
              <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]">
                添加
              </Button>
            }
            className="rounded-ds-lg border bg-white/60"
          />
          <ProcessPathPointGroupHeader title="安全点" collapsed={collapsed} onToggle={handleCollapsedChange} />
        </div>
      </div>
    </BentoFrame>
  );
}
