import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { PoseAxisFieldGroup } from '../../../app/components/process/PoseAxisFieldGroup';
import type {
  SimulationPosePoint,
  SimulationRobotCoordinateFrame,
  SimulationRobotId,
} from '../types';
import type { SimulationRobotJointReadout } from '../services/urdfKinematics';

const coordinateFrameOptions: { value: SimulationRobotCoordinateFrame; label: string }[] = [
  { value: 'world', label: '世界' },
  { value: 'parent', label: '父系' },
  { value: 'object', label: '物体' },
];

export type SimulationRobotPoseOverlayItem = {
  robotId: SimulationRobotId;
  coordinateFrame: SimulationRobotCoordinateFrame;
  pose: SimulationPosePoint;
  jointValues: SimulationRobotJointReadout[];
  focused?: boolean;
};

export function SimulationRobotPoseOverlay({
  robots,
  loading = false,
  onCoordinateFrameChange,
}: {
  robots: SimulationRobotPoseOverlayItem[];
  loading?: boolean;
  onCoordinateFrameChange: (
    robotId: SimulationRobotId,
    coordinateFrame: SimulationRobotCoordinateFrame,
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedRobots, setExpandedRobots] = useState<Record<SimulationRobotId, boolean>>({
    robot1: true,
    robot2: true,
  });

  return (
    <section
      className={`pointer-events-auto absolute right-3 top-3 z-20 flex w-[360px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 shadow-none backdrop-blur-xl ${
        collapsed ? 'h-8' : ''
      }`}
      aria-label="机器人位姿回显"
    >
      <div className="flex h-8 w-full shrink-0 items-center gap-2 border-b border-white/28 bg-white/10 px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">机器人位姿</span>
        {loading && <span className="text-[9px] text-slate-400">URDF 加载中</span>}
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/65 hover:text-slate-600"
          title={collapsed ? '展开机器人位姿' : '收起机器人位姿'}
          aria-label={collapsed ? '展开机器人位姿' : '收起机器人位姿'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2 p-2.5">
          {robots.map((robot, robotIndex) => (
            <section
              key={robot.robotId}
              className={robotIndex > 0 ? 'border-t border-white/35 pt-2.5' : ''}
              aria-label={`${robot.robotId === 'robot1' ? 'Robot1' : 'Robot2'} 位姿`}
            >
              <div className={`${expandedRobots[robot.robotId] ? 'mb-2' : ''} flex items-center justify-between gap-3 pr-2`}>
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-slate-600 transition-colors hover:text-ds-brand-primary-text"
                  aria-label={`${expandedRobots[robot.robotId] ? '收起' : '展开'}${robot.robotId === 'robot1' ? 'Robot1' : 'Robot2'}位姿`}
                  aria-expanded={expandedRobots[robot.robotId]}
                  onClick={() => setExpandedRobots((current) => ({
                    ...current,
                    [robot.robotId]: !current[robot.robotId],
                  }))}
                >
                  {expandedRobots[robot.robotId]
                    ? <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
                    : <ChevronRight className="size-3.5 shrink-0 text-slate-400" />}
                  <span>{robot.robotId === 'robot1' ? 'Robot1' : 'Robot2'}</span>
                  {robot.focused && <span className="rounded bg-orange-100/90 px-1.5 py-0.5 text-[9px] font-medium text-orange-700">当前点位</span>}
                </button>
                <div className="flex items-center gap-2.5">
                  {coordinateFrameOptions.map((option) => {
                    const selected = robot.coordinateFrame === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`group flex cursor-pointer items-center gap-1 text-[10px] font-medium transition-colors ${
                          selected ? 'text-ds-brand-primary-text' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`simulation-${robot.robotId}-coordinate-frame`}
                          className="sr-only"
                          checked={selected}
                          onChange={() => onCoordinateFrameChange(robot.robotId, option.value)}
                        />
                        <span
                          aria-hidden="true"
                          className={`grid size-3.5 place-items-center rounded-full border transition-colors ${
                            selected
                              ? 'border-ds-brand-primary bg-white shadow-ds-sm'
                              : 'border-zinc-300 bg-white group-hover:border-orange-300'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full bg-ds-brand-primary transition-transform ${selected ? 'scale-100' : 'scale-0'}`} />
                        </span>
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {expandedRobots[robot.robotId] && (
                <div className="px-2">
                  <PoseAxisFieldGroup
                    point={robot.pose}
                    readOnly
                    inputClassName="h-7 px-2 pr-8 text-right text-[10px]"
                    axisGridClassName="grid-cols-[16px_minmax(0,1fr)]"
                    axisLabelClassName="text-[9px] uppercase text-ds-text-parameter-label"
                    unitClassName="text-slate-300"
                    gridGapClassName="gap-1.5"
                    rowGapClassName="mt-1.5"
                    onAxisChange={() => undefined}
                  />

                  <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-white/30 pt-2">
                    {robot.jointValues.map((joint) => (
                      <div key={joint.axis} className="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] items-center gap-1">
                        <span className="text-[9px] font-medium text-ds-text-parameter-label">{joint.axis}</span>
                        <div className="flex h-7 min-w-0 items-center justify-between rounded-ds-lg border border-ds-border-default bg-slate-50/80 px-2 text-[10px] tabular-nums text-slate-500">
                          <span className="truncate">{joint.value}</span>
                          <span className="ml-1 shrink-0 text-[9px] text-slate-300">{joint.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
