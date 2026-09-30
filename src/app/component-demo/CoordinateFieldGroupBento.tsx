import { useEffect, useState } from 'react';
import { ProcessPosePointInfoRow, type ProcessPosePointAxis, type ProcessPosePointValue } from '../components/process/ProcessPosePointInfoRow';
import { BentoFrame } from './BentoFrame';
import { WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

const POINT_ROW_COLLAPSED_HOLD_MS = 1400;
const POINT_ROW_EXPANDED_HOLD_MS = 2600;

export function CoordinateFieldGroupBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [point, setPoint] = useState<ProcessPosePointValue>({
    x: '120.0',
    y: '80.0',
    z: '15.0',
    rx: '0.0',
    ry: '0.0',
    rz: '0.0',
  });
  const [collapsed, setCollapsed] = useState(true);
  const [userControlled, setUserControlled] = useState(false);

  const updatePoint = (axis: ProcessPosePointAxis, value: string) => {
    setPoint((currentPoint) => ({ ...currentPoint, [axis]: value }));
    setUserControlled(true);
  };

  const handleCollapsedChange = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed);
    setUserControlled(true);
  };

  useEffect(() => {
    setCollapsed(true);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) {
      return undefined;
    }

    let timeoutId = 0;
    const scheduleExpand = () => {
      timeoutId = window.setTimeout(() => {
        setCollapsed(false);
        scheduleCollapse();
      }, POINT_ROW_COLLAPSED_HOLD_MS);
    };
    const scheduleCollapse = () => {
      timeoutId = window.setTimeout(() => {
        setCollapsed(true);
        scheduleExpand();
      }, POINT_ROW_EXPANDED_HOLD_MS);
    };

    scheduleExpand();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [globalPlaying, userControlled]);

  return (
    <BentoFrame className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className="flex h-full items-center justify-center">
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <ProcessPosePointInfoRow
            label="点位 1"
            point={point}
            selected
            collapsed={collapsed}
            onCollapsedChange={handleCollapsedChange}
            onAxisChange={updatePoint}
          />
        </div>
      </div>
    </BentoFrame>
  );
}
