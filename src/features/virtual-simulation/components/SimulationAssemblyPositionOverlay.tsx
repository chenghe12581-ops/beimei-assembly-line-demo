import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import {
  PoseAxisFieldGroup,
  type ProcessPosePointAxis,
} from '../../../app/components/process/PoseAxisFieldGroup';
import type {
  SimulationAssemblyTransform,
  SimulationCoordinateFrame,
} from '../types';

const coordinateFrameOptions: { value: SimulationCoordinateFrame; label: string }[] = [
  { value: 'world', label: '世界坐标' },
  { value: 'parent', label: '父系坐标' },
];

export function SimulationAssemblyPositionOverlay({
  coordinateFrame,
  transform,
  onCoordinateFrameChange,
  onTransformChange,
}: {
  coordinateFrame: SimulationCoordinateFrame;
  transform: SimulationAssemblyTransform;
  onCoordinateFrameChange: (coordinateFrame: SimulationCoordinateFrame) => void;
  onTransformChange: (axis: ProcessPosePointAxis, value: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section
      className={`pointer-events-auto absolute left-3 top-[60px] z-20 flex w-[400px] flex-col overflow-hidden rounded-md bg-white/25 ring-1 ring-inset ring-white/28 shadow-none backdrop-blur-xl ${
        collapsed ? 'h-8' : ''
      }`}
      aria-label="调整装配体位置"
    >
      <div className="flex h-8 w-full shrink-0 items-center gap-1.5 border-b border-white/28 bg-white/10 px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">调整装配体位置</span>
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:bg-white/65 hover:text-slate-600"
          title={collapsed ? '展开调整装配体位置' : '收起调整装配体位置'}
          aria-label={collapsed ? '展开调整装配体位置' : '收起调整装配体位置'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-2 p-2.5">
          <div className="flex items-center justify-between gap-3 border-b border-white/30 pb-2">
            <span className="text-[11px] font-medium text-slate-500">坐标系</span>
            <div className="flex items-center gap-3">
              {coordinateFrameOptions.map((option) => {
                const selected = coordinateFrame === option.value;
                return (
                  <label
                    key={option.value}
                    className={`group flex cursor-pointer items-center gap-1.5 text-[11px] font-medium transition-colors ${
                      selected ? 'text-ds-brand-primary-text' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={selected}
                      onChange={() => onCoordinateFrameChange(option.value)}
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
          <PoseAxisFieldGroup
            point={transform}
            stepper
            inputVariant="flat"
            inputClassName="h-7 px-2 pr-[3.25rem] text-right text-[10px]"
            axisLayout="inline"
            axisGridClassName="grid-cols-[16px_minmax(0,1fr)]"
            axisLabelClassName="text-[9px] uppercase text-ds-text-parameter-label"
            unitClassName="text-slate-300"
            stepperClassName="shadow-none"
            gridGapClassName="gap-1.5"
            rowGapClassName="mt-1.5"
            onAxisChange={onTransformChange}
          />
        </div>
      )}
    </section>
  );
}
