import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, FileCode2, GitBranch } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ProcessDetailTabBar } from '../../../app/components/process/ProcessDetailTabBar';
import { ProcessJointAngleRow } from '../../../app/components/process/ProcessJointAngleRow';
import { ProcessResultPointPanel } from '../../../app/components/process/ProcessResultPointPanel';

import type {
  SimulationAxisValue,
  SimulationDetailTab,
  SimulationInstruction,
  SimulationJointTargetPose,
  SimulationProgramNode,
  SimulationRobotProgram,
  SimulationSourceTask,
} from '../types';

function ProgramTreeNode({
  node,
  level,
  selectedNodeId,
  expandedNodeIds,
  detailOnly,
  hasSelectedAncestor,
  onToggle,
  onSelect,
}: {
  node: SimulationProgramNode;
  level: number;
  selectedNodeId: string | null;
  expandedNodeIds: Set<string>;
  detailOnly: boolean;
  hasSelectedAncestor: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}) {
  const hasLeadingIcon = node.type === 'subprogram' || node.type === 'instruction';
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedNodeIds.has(node.id);
  const selected = selectedNodeId === node.id;
  const associated = hasSelectedAncestor && !selected;
  const displayName = node.name;
  return (
    <div>
      <div
        className={`group grid min-h-8 items-center gap-1.5 rounded-md pr-2 text-[11px] transition-colors ${
          hasLeadingIcon ? 'grid-cols-[18px_18px_minmax(0,1fr)_auto]' : 'grid-cols-[18px_minmax(0,1fr)_auto]'
        } ${
          selected
            ? detailOnly
              ? 'bg-transparent text-ds-brand-primary-text ring-1 ring-inset ring-orange-200'
              : 'bg-orange-50 text-ds-brand-primary-text'
            : associated
              ? 'bg-transparent text-ds-brand-primary-text'
            : 'text-ds-text-control hover:bg-ds-bg-process-planning-tree-group-hover'
        }`}
        style={{ marginLeft: `${hasLeadingIcon ? Math.max(0, level - 1) * 14 : level * 14}px`, paddingLeft: '6px' }}
      >
        <button
          type="button"
          aria-label={expanded ? `收起${displayName}` : `展开${displayName}`}
          className={`flex size-4 items-center justify-center text-ds-text-control-disabled ${hasChildren ? '' : 'invisible'}`}
          onClick={() => onToggle(node.id)}
        >
          {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
        {hasLeadingIcon && (
          <FileCode2 className={`size-3.5 ${node.kind === 'scan' ? 'text-sky-600' : node.kind === 'weld' ? 'text-orange-500' : selected ? 'text-ds-brand-primary' : 'text-ds-text-control-muted'}`} />
        )}
        <button
          type="button"
          className={`min-w-0 truncate text-left ${
            node.type === 'robot'
              ? selected
                ? 'text-[11px] font-medium leading-4 text-ds-brand-primary-text'
                : associated
                  ? 'text-[11px] font-normal leading-4 text-ds-brand-primary-text'
                  : 'text-[11px] font-normal leading-4 text-ds-text-control-muted'
              : hasLeadingIcon
              ? selected
                ? 'text-xs font-medium leading-4 text-ds-brand-primary-text'
                : associated
                  ? 'text-xs font-normal leading-4 text-ds-brand-primary-text'
                  : 'text-xs font-normal leading-4 text-ds-text-control'
              : 'text-xs font-medium leading-4'
          }`}
          onClick={() => onSelect(node.id)}
        >
          {displayName}
        </button>
        {node.type === 'program' ? (
          <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] text-ds-brand-primary-text">双机并行</span>
        ) : null}
      </div>
      {expanded && node.children?.map((child) => (
        <ProgramTreeNode
          key={child.id}
          node={child}
          level={level + 1}
          selectedNodeId={selectedNodeId}
          expandedNodeIds={expandedNodeIds}
          detailOnly={detailOnly}
          hasSelectedAncestor={hasSelectedAncestor || selected}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function ProgramInfoField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="ds-label-input-compact min-w-0">
      <div className="ds-label-input-compact-label truncate">{label}</div>
      <div
        className="flex h-8 min-w-0 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-100"
        title={value}
      >
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function RobotProgramParams({
  supportAxisValues,
  clampAxisValues,
  onAxisValueChange,
}: {
  supportAxisValues: SimulationAxisValue[];
  clampAxisValues: SimulationAxisValue[];
  onAxisValueChange: (axisGroup: 'support' | 'clamp', axisName: string, value: string) => void;
}) {
  return (
    <div className="ds-task-parameter-detail-top pb-2">
      <div className="space-y-ds-300">
        <ProcessResultPointPanel
          title="支撑机构轴值"
          variant="flush"
          headerClassName="px-ds-150"
          showUpdateButton={false}
        >
          <div className="grid gap-2">
            {supportAxisValues.map((axis, index) => (
              <ProcessJointAngleRow
                key={axis.axis}
                index={index}
                value={axis.value}
                onChange={(nextValue) => onAxisValueChange('support', axis.axis, nextValue)}
              />
            ))}
          </div>
        </ProcessResultPointPanel>
        <ProcessResultPointPanel
          title="压紧机构轴值"
          variant="flush"
          headerClassName="px-ds-150"
          showUpdateButton={false}
        >
          <div className="grid gap-2">
            {clampAxisValues.map((axis, index) => (
              <ProcessJointAngleRow
                key={axis.axis}
                index={index}
                value={axis.value}
                onChange={(nextValue) => onAxisValueChange('clamp', axis.axis, nextValue)}
              />
            ))}
          </div>
        </ProcessResultPointPanel>
      </div>
    </div>
  );
}

function RobotNodeParams({
  node,
}: {
  node: SimulationProgramNode;
}) {
  const robotName = node.robotName === 'Robot2' ? 'Robot2' : 'Robot1';
  return (
    <div className="ds-task-parameter-detail-top pb-2">
      <div className="grid gap-ds-150 px-ds-150 sm:grid-cols-2">
        <ProgramInfoField label="机器人编号" value={robotName} />
      </div>
    </div>
  );
}

function SubprogramParams({ node }: { node: SimulationProgramNode }) {
  const commandRows = (node.instructions ?? []).filter((instruction) => instruction.processCommand);
  const programTypeLabel = node.kind === 'scan' ? '定位焊扫描程序' : '定位焊焊接程序';
  return (
    <div className="ds-task-parameter-detail-top px-ds-150 pb-2">
      <div className="mb-ds-150 flex items-center gap-2">
        <span className="text-xs font-medium text-ds-text-control">{node.name}</span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{programTypeLabel}</span>
      </div>
      <div className="grid gap-ds-150 sm:grid-cols-2">
        <ProgramInfoField label="机器人编号" value={node.robotName} />
      </div>
      {commandRows.length > 0 && (
        <section className="mt-ds-300">
          <div className="mb-ds-150 text-xs font-medium text-zinc-700">{node.name}</div>
          <div className="mb-ds-150 border-b border-zinc-200/80 pb-2 text-xs font-medium text-zinc-700">指令点位</div>
          <div className="grid gap-ds-150 sm:grid-cols-2">
            {commandRows.map((instruction) => (
              <ProgramInfoField
                key={instruction.id}
                label={instruction.processCommand ?? '工艺指令'}
                value={instruction.name}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function isJointTargetPose(
  pose: SimulationInstruction['targetPose'],
): pose is SimulationJointTargetPose {
  return 'J1' in pose;
}

function ProgramPointField({
  label,
  value,
  unit,
  warning,
  title,
}: {
  label: string;
  value: string;
  unit?: string;
  warning?: boolean;
  title?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-1">
      <span className={`text-[10px] ${warning ? 'font-medium text-red-600' : 'text-zinc-400'}`}>{label}</span>
      <div
        className={`flex h-7 min-w-0 items-center justify-between rounded-md border px-2 ${warning ? 'border-red-200 bg-red-50 text-red-700' : 'border-zinc-200 bg-ds-bg-process-planning-task-detail text-ds-text-control'}`}
        title={title}
      >
        <span className="truncate tabular-nums text-[11px]">{value}</span>
        {unit && <span className={`ml-1 shrink-0 text-[9px] ${warning ? 'text-red-400' : 'text-zinc-400'}`}>{unit}</span>}
      </div>
    </div>
  );
}

function PointData({
  node,
  selectedInstructionId,
  onSelectInstruction,
}: {
  node: SimulationProgramNode;
  selectedInstructionId: string | null;
  onSelectInstruction: (instructionId: string) => void;
}) {
  const instructions = node.instructions ?? [];
  if (instructions.length === 0) {
    return <div className="p-4 text-center text-[10px] text-zinc-400">当前程序没有点位数据</div>;
  }
  return (
    <div className="w-full space-y-2 py-3">
      {instructions.map((instruction: SimulationInstruction) => {
        const pose = instruction.targetPose;
        const jointPose = isJointTargetPose(pose);
        const fields = jointPose
          ? [
              ['J1', pose.J1, '°'], ['J2', pose.J2, '°'], ['J3', pose.J3, '°'],
              ['J4', pose.J4, '°'], ['J5', pose.J5, '°'], ['J6', pose.J6, '°'],
            ]
          : [
              ['X', pose.X, 'mm'], ['Y', pose.Y, 'mm'], ['Z', pose.Z, 'mm'],
              ['RX', pose.RX, '°'], ['RY', pose.RY, '°'], ['RZ', pose.RZ, '°'],
            ];
        const selected = selectedInstructionId === instruction.id;
        const robotName = node.robotName ?? 'Robot1';
        return (
          <button
            key={instruction.id}
            type="button"
            aria-pressed={selected}
            aria-label={`${instruction.name}，${robotName}，${instruction.moveType}点位`}
            className={`block w-full rounded-ds-md border bg-white text-left shadow-ds-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
              selected
                ? 'border-orange-300 bg-orange-50/70 ring-1 ring-inset ring-orange-200'
                : instruction.externalAxisExceeded
                  ? 'border-red-200 hover:border-orange-200'
                  : 'border-ds-border-process-planning-structure hover:border-orange-200'
            }`}
            onClick={() => onSelectInstruction(instruction.id)}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-2.5 py-2 text-[11px] font-normal">
              <span className={`font-normal ${selected ? 'text-ds-brand-primary-text' : 'text-ds-text-control'}`}>{instruction.name}</span>
              <div className="flex items-center gap-1.5">
                <span className={`rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal ${selected ? 'text-ds-brand-primary-text' : 'text-slate-500'}`}>
                  {robotName}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-normal ${instruction.moveType === 'PTP' ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                  {instruction.moveType}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-2.5 py-2.5 sm:grid-cols-3">
              {fields.map(([axis, value, unit]) => (
                <ProgramPointField key={axis} label={axis} value={value} unit={unit} />
              ))}
              <ProgramPointField
                label="E1"
                value={pose.E1}
                unit="mm"
                warning={instruction.externalAxisExceeded}
                title={`Demo 允许范围 ${instruction.externalAxisLimit}`}
              />
              <ProgramPointField label="S" value={instruction.speed} unit={instruction.moveType === 'PTP' ? '%' : 'mm/s'} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function SimulationProgramPanel({
  task,
  programs,
  selectedProgram,
  selectedNode,
  selectedNodeId,
  selectedInstructionId,
  expandedNodeIds,
  detailTab,
  detailOnly,
  onToggleNode,
  onSelectNode,
  onSelectInstruction,
  onDetailTabChange,
  onAxisValueChange,
  onResetProgramParams,
  onGenerate,
}: {
  task: SimulationSourceTask | null;
  programs: SimulationRobotProgram[];
  selectedProgram: SimulationRobotProgram | null;
  selectedNode: SimulationProgramNode | null;
  selectedNodeId: string | null;
  selectedInstructionId: string | null;
  expandedNodeIds: Set<string>;
  detailTab: SimulationDetailTab;
  detailOnly: boolean;
  onToggleNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onSelectInstruction: (instructionId: string) => void;
  onDetailTabChange: (tab: SimulationDetailTab) => void;
  onAxisValueChange: (axisGroup: 'support' | 'clamp', axisName: string, value: string) => void;
  onResetProgramParams: () => void;
  onGenerate: () => void;
}) {
  const [programListHeight, setProgramListHeight] = useState<number | null>(null);
  const [isProgramSplitDragging, setIsProgramSplitDragging] = useState(false);
  const detailNode = selectedNode ?? selectedProgram?.root ?? null;
  const totalLimitExceededCount = programs.reduce((total, program) => total + program.limitExceededCount, 0);
  const supportsPointData = detailNode?.type === 'subprogram' && Boolean(detailNode.kind);
  const visibleTabs: SimulationDetailTab[] = supportsPointData ? ['params', 'points'] : ['params'];
  const activeDetailTab = supportsPointData ? detailTab : 'params';
  const detailTabs = visibleTabs.map((tab) => ({
    key: tab,
    label: tab === 'params' ? '程序参数' : '点位数据',
  }));

  const handleProgramSplitDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsProgramSplitDragging(true);
    const startY = event.clientY;
    const programList = event.currentTarget.previousElementSibling as HTMLElement | null;
    const startHeight = programList?.getBoundingClientRect().height ?? programListHeight ?? 128;
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextHeight = Math.min(260, Math.max(72, startHeight + moveEvent.clientY - startY));
      setProgramListHeight(nextHeight);
    };

    const finishDragging = () => {
      setIsProgramSplitDragging(false);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDragging);
      window.removeEventListener('pointercancel', finishDragging);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDragging);
    window.addEventListener('pointercancel', finishDragging);
  };

  return (
    <aside className="flex min-h-0 min-w-0 flex-col border-l border-zinc-200 bg-ds-bg-process-planning-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-200/75 px-3">
        <div className="text-xs font-medium text-ds-text-control">程序列表</div>
        {programs.length > 0 && (
          <div className={`flex items-center gap-1.5 text-[10px] ${totalLimitExceededCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalLimitExceededCount > 0 ? <CircleAlert className="size-3" /> : <CircleCheck className="size-3" />}
            {totalLimitExceededCount > 0 ? `${totalLimitExceededCount} 项外部轴超限` : '外部轴校验通过'}
          </div>
        )}
      </div>

      {programs.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
          <div>
            <GitBranch className="mx-auto size-10 text-zinc-300" />
            <div className="mt-3 text-xs font-medium text-zinc-500">尚未生成加工程序</div>
            <div className="mt-1 text-[10px] leading-5 text-zinc-400">将使用当前副本的压紧轴值与扫描/焊接点位生成</div>
            <button
              type="button"
              disabled={!task}
              className="mt-3 h-8 rounded-md bg-ds-brand-primary px-3 text-[11px] font-medium text-white transition-colors hover:bg-ds-brand-primary-hover disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={onGenerate}
            >
              程序生成
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col rounded-ds-xl bg-transparent px-ds-150 pb-ds-150 pt-ds-050">
          <div
            className="relative min-h-0 overflow-hidden"
            style={{ height: programListHeight ?? 220 }}
          >
            <div className="h-full overflow-y-auto px-2 pb-2 pr-1 pt-0">
              {programs.map((program) => (
                <ProgramTreeNode
                  key={program.id}
                  node={program.root}
                  level={0}
                  selectedNodeId={selectedNodeId}
                  expandedNodeIds={expandedNodeIds}
                  detailOnly={detailOnly}
                  hasSelectedAncestor={false}
                  onToggle={onToggleNode}
                  onSelect={onSelectNode}
                />
              ))}
            </div>
            <div className="ds-scroll-edge-bottom z-10" />
          </div>
          <div
            className="group my-1 flex h-3 shrink-0 cursor-row-resize items-center px-2"
            role="separator"
            aria-orientation="horizontal"
            title="拖动调整程序列表与下方详情区域高度"
            onPointerDown={handleProgramSplitDragStart}
          >
            <div className={`h-0.5 flex-1 rounded-full transition-[background-color,box-shadow] group-hover:bg-[#FFD591] group-hover:shadow-[0_0_4px_#FFEDD5] ${
              isProgramSplitDragging ? 'bg-[#FFD591] shadow-[0_0_1px_#FFEDD5]' : 'bg-zinc-100 shadow-none'
            }`} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-ds-md border border-ds-border-process-planning-structure bg-ds-bg-process-planning-task-detail">
            <ProcessDetailTabBar
              tabs={detailTabs}
              activeKey={activeDetailTab}
              onChange={onDetailTabChange}
              action={
                detailNode?.type === 'program' && activeDetailTab === 'params' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!font-normal h-6 px-1.5 text-[11px] text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text disabled:text-slate-300 disabled:hover:bg-transparent"
                    disabled={!selectedProgram}
                    onClick={onResetProgramParams}
                  >
                    重置
                  </Button>
                ) : null
              }
            />
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {detailNode && activeDetailTab === 'points' ? (
                <PointData
                  node={detailNode}
                  selectedInstructionId={selectedInstructionId}
                  onSelectInstruction={onSelectInstruction}
                />
              ) : detailNode?.type === 'program' ? (
                <RobotProgramParams
                  supportAxisValues={selectedProgram?.supportAxisValues ?? []}
                  clampAxisValues={selectedProgram?.clampAxisValues ?? []}
                  onAxisValueChange={onAxisValueChange}
                />
              ) : detailNode?.type === 'robot' ? (
                <RobotNodeParams node={detailNode} />
              ) : detailNode ? (
                <SubprogramParams node={detailNode} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
