import { useEffect, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { SimulationProgramGenerateDialog } from '../features/virtual-simulation/components/SimulationProgramGenerateDialog';
import { SimulationProgramPanel } from '../features/virtual-simulation/components/SimulationProgramPanel';
import { SimulationTaskPanel } from '../features/virtual-simulation/components/SimulationTaskPanel';
import { SimulationToolbar } from '../features/virtual-simulation/components/SimulationToolbar';
import { SimulationViewportPanel } from '../features/virtual-simulation/components/SimulationViewportPanel';
import { useSimulationWorkspace } from '../features/virtual-simulation/hooks/useSimulationWorkspace';
import type { SimulationRobotId, SimulationSourceTask } from '../features/virtual-simulation/types';

type SimulationTaskRobotAssignments = Record<string, Record<string, SimulationRobotId>>;

type ToastTone = 'success' | 'warning';

type ToastState = {
  message: string;
  tone: ToastTone;
};

const toastToneClasses: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-orange-200 bg-orange-50 text-orange-700',
};

export function VirtualSimulationPage({
  tasks,
  entryTaskId,
  onBackToPlanning,
  onImportFile,
  onDeleteTask,
}: {
  tasks: SimulationSourceTask[];
  entryTaskId?: string | null;
  onBackToPlanning: (task: SimulationSourceTask | null) => void;
  onImportFile: () => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const workspace = useSimulationWorkspace(tasks, entryTaskId);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [resetViewKey, setResetViewKey] = useState(0);
  const [programGenerateDialogOpen, setProgramGenerateDialogOpen] = useState(false);
  const hasGeneratedProgram = workspace.selectedPrograms.some((program) => program.instructionCount > 0);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setProgramGenerateDialogOpen(false);
  }, [workspace.selectedTask?.id]);

  const showToast = (message: string, tone: ToastTone) => setToast({ message, tone });

  const handleGenerate = () => {
    if (!workspace.selectedTask) {
      showToast('请先从工艺规划发送装配任务，或导入本地文件。', 'warning');
      return;
    }
    setProgramGenerateDialogOpen(true);
  };

  const handleConfirmGenerate = (robotAssignments: SimulationTaskRobotAssignments) => {
    const programs = workspace.generatePrograms(robotAssignments);
    if (programs.length === 0) return;
    const instructionCount = programs.reduce((total, program) => total + program.instructionCount, 0);
    const limitExceededCount = programs.reduce((total, program) => total + program.limitExceededCount, 0);
    if (instructionCount === 0) {
      showToast('当前焊接任务还没有可用于后处理的扫描或焊接点位。', 'warning');
      return;
    }
    setProgramGenerateDialogOpen(false);
    showToast(
      limitExceededCount > 0
        ? `已生成 ${programs.length} 组程序、${instructionCount} 条指令，Demo 检出 ${limitExceededCount} 项外部轴超限。`
        : `已生成 ${programs.length} 组加工程序、${instructionCount} 条指令。`,
      limitExceededCount > 0 ? 'warning' : 'success',
    );
  };

  const handleExport = () => {
    const programs = workspace.selectedPrograms;
    const task = workspace.selectedTask;
    if (programs.length === 0 || !task) {
      showToast('请先生成加工程序。', 'warning');
      return;
    }
    const payload = {
      simulationTaskId: task.id,
      source: task.sourceKind,
      createdAt: task.createdAt,
      assemblyId: task.assemblyId,
      processId: task.processId,
      processSequence: task.processSequence,
      station: task.station,
      side: task.side,
      programs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${task.assemblyId}-${String(task.processSequence).padStart(2, '0')}-simulation-${task.copyIndex}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('后处理指令文件已导出。', 'success');
  };

  const handleResetProgramParams = () => {
    workspace.resetProgramParams();
    showToast('已重置，请保存任务', 'success');
  };

  const handleDeleteTask = (taskId: string) => {
    onDeleteTask(taskId);
    showToast('装配任务及其内部焊接任务已删除。', 'success');
  };

  const handlePlay = () => {
    const started = workspace.startPlayback();
    if (started) return;
    if (!workspace.selectedProgram) {
      showToast('请先生成加工程序。', 'warning');
      return;
    }
    if (!workspace.playbackScope || workspace.playbackScope.instructionCount === 0) {
      showToast('当前选择没有可播放的程序点位。', 'warning');
      return;
    }
    if (workspace.selectedWeldNodeId) {
      showToast('请先从右侧选择程序，恢复工位全景后再播放。', 'warning');
      return;
    }
    if (workspace.activeScene !== workspace.selectedTask?.side) {
      showToast(`当前任务只适用于${workspace.selectedTask?.side === 'front' ? '正面' : '背面'}工位。`, 'warning');
      return;
    }
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-ds-bg-viewport text-ds-text-primary">
      <SimulationToolbar
        task={workspace.selectedTask}
        hasProgram={hasGeneratedProgram}
        onBackToPlanning={() => onBackToPlanning(workspace.selectedTask)}
        onImport={onImportFile}
        onGenerate={handleGenerate}
        onExport={handleExport}
      />

      <main className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_420px] overflow-hidden">
        <SimulationTaskPanel
          tasks={tasks}
          selectedTaskId={workspace.selectedTaskId}
          selectedWeldNodeId={workspace.selectedWeldNodeId}
          associatedWeldSegmentIds={workspace.selectedWeldNodeId ? [] : workspace.associatedWeldSegmentIds}
          onSelectTask={workspace.selectTask}
          onSelectWeldTask={workspace.selectWeldTask}
          onSelectWeldSegment={workspace.selectWeldSegment}
          onDeleteTask={handleDeleteTask}
          onImport={onImportFile}
        />
        <SimulationViewportPanel
          task={workspace.selectedTask}
          hasProgram={hasGeneratedProgram}
          activeScene={workspace.activeScene}
          selectedWeldNodeId={workspace.selectedWeldNodeId}
          selectedPoint={workspace.selectedPoint}
          playbackStatus={workspace.playbackStatus}
          progress={workspace.progress}
          speed={workspace.speed}
          playbackScope={workspace.playbackScope}
          resetViewKey={resetViewKey}
          programViewRequestKey={workspace.programViewRequestKey}
          assemblyTransform={workspace.selectedAssemblyTransform}
          assemblyCoordinateFrame={workspace.selectedAssemblyCoordinateFrame}
          urdfModel={workspace.urdfModel}
          urdfError={workspace.urdfError}
          urdfJointValues={workspace.playbackUrdfJointValues}
          onSceneChange={workspace.changeScene}
          onResetView={() => setResetViewKey((value) => value + 1)}
          onAssemblyTransformChange={workspace.updateAssemblyTransform}
          onAssemblyCoordinateFrameChange={workspace.setAssemblyCoordinateFrame}
          onPlay={handlePlay}
          onPause={workspace.pausePlayback}
          onSkip={workspace.skipPlayback}
          onResetPlayback={workspace.resetPlayback}
          onSpeedChange={workspace.setSpeed}
        />
        <SimulationProgramPanel
          task={workspace.selectedTask}
          programs={workspace.selectedPrograms}
          selectedProgram={workspace.selectedProgram}
          selectedNode={workspace.selectedProgramNode}
          selectedNodeId={workspace.selectedProgramNodeId}
          selectedInstructionId={workspace.selectedInstructionId}
          expandedNodeIds={workspace.expandedProgramNodeIds}
          detailTab={workspace.detailTab}
          detailOnly={false}
          onToggleNode={workspace.toggleProgramNode}
          onSelectNode={workspace.selectProgramNode}
          onSelectInstruction={workspace.selectInstruction}
          onDetailTabChange={workspace.setDetailTab}
          onAxisValueChange={workspace.updateProgramAxisValue}
          onResetProgramParams={handleResetProgramParams}
          onGenerate={handleGenerate}
        />
      </main>

      {toast && (
        <div className={`fixed right-5 top-20 z-[120] flex max-w-[380px] items-start gap-2 rounded-lg border px-3 py-2.5 text-xs shadow-lg shadow-slate-900/10 ${toastToneClasses[toast.tone]}`} role="status">
          {toast.tone === 'success'
            ? <Check className="mt-0.5 size-3.5 shrink-0" />
            : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />}
          <span className="leading-5">{toast.message}</span>
          <button type="button" className="ml-1 shrink-0 text-current/50 hover:text-current" aria-label="关闭提示" onClick={() => setToast(null)}>
            <X className="size-3.5" />
          </button>
        </div>
      )}
      {programGenerateDialogOpen && workspace.selectedTask && (
        <SimulationProgramGenerateDialog
          task={workspace.selectedTask}
          assignments={workspace.selectedRobotAssignments}
          hasExistingProgram={workspace.selectedPrograms.length > 0}
          onClose={() => setProgramGenerateDialogOpen(false)}
          onConfirm={handleConfirmGenerate}
        />
      )}
    </div>
  );
}
