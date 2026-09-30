import { type DragEvent, useEffect, useRef, useState } from 'react';
import { Ban, GripVertical, Move3D, Sparkles, Trash2 } from 'lucide-react';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

const processTypes = {
  pick: Move3D,
  polish: Sparkles,
};

type DropPosition = 'before' | 'after';

function TaskItemRow({
  id,
  index,
  title,
  type,
  selected,
  detailActive,
  hoverPreview,
  disabled,
  deletePopoverOpen,
  positionTop,
  onDisableToggle,
  onDeleteClick,
  onDetailClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  id: string;
  index: number;
  title: string;
  type: keyof typeof processTypes;
  selected?: boolean;
  detailActive?: boolean;
  hoverPreview?: boolean;
  disabled?: boolean;
  deletePopoverOpen?: boolean;
  positionTop: number;
  onDisableToggle: () => void;
  onDeleteClick: () => void;
  onDetailClick: () => void;
  onDragStart: (id: string, event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (id: string, position: DropPosition) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
}) {
  const Icon = processTypes[type];
  const actionsVisible = (!disabled && (selected || detailActive)) || deletePopoverOpen;

  return (
    <div
      className={`group absolute inset-x-0 h-8 rounded-ds-md py-0 pl-px pr-1 text-xs shadow-ds-sm backdrop-blur-sm transition-[top,background-color,box-shadow,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        disabled
          ? 'cursor-not-allowed bg-neutral-100 text-ds-text-control-disabled shadow-none'
          : selected
          ? 'bg-orange-50/75 text-ds-brand-primary-text ring-1 ring-inset ring-orange-200/90'
          : detailActive
            ? 'bg-transparent text-ds-brand-primary-text ring-1 ring-inset ring-orange-200/90'
            : hoverPreview
              ? 'bg-white/80 text-ds-text-control ring-1 ring-inset ring-slate-200/80'
              : 'bg-white/60 text-ds-text-control ring-1 ring-inset ring-slate-100/70 hover:bg-white/80 hover:ring-slate-200/80'
      }`}
      style={{ top: positionTop }}
      onDragEnter={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
        onDragOver(id, position);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
        onDragOver(id, position);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(id);
      }}
    >
      <div className="grid h-full min-w-0 grid-cols-[12px_16px_minmax(0,1fr)] items-center gap-0">
        <button
          type="button"
          className={`flex h-6 w-3 shrink-0 items-center justify-center rounded-ds-sm ${disabled ? 'cursor-not-allowed text-ds-icon-drag-handle' : 'cursor-grab text-ds-icon-drag-handle active:cursor-grabbing'}`}
          title="拖拽排序"
          draggable={!disabled}
          disabled={disabled}
          onDragStart={(event) => onDragStart(id, event)}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="size-3" />
        </button>
        <div className="flex h-6 w-4 shrink-0 items-center justify-center text-xs font-normal leading-none text-slate-400">
          <span className="ds-process-index">{index}</span>
        </div>
        <button type="button" className="min-w-0 pl-1 text-left text-xs font-normal leading-5 disabled:cursor-not-allowed" disabled={disabled} onClick={onDetailClick}>
          <div className="flex min-w-0 items-center gap-1">
            <Icon className={`size-4 shrink-0 text-current ${disabled ? 'opacity-35 grayscale' : ''}`} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium leading-5"><span className="ds-process-title-text">{title}</span></span>
          </div>
        </button>
        <div
          className={`absolute right-1 top-1/2 z-40 flex -translate-y-1/2 items-center gap-0.5 transition-opacity duration-200 ${
            actionsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
          }`}
        >
          <button
            type="button"
            className={`flex size-5 shrink-0 items-center justify-center rounded-ds-sm bg-white/90 shadow-sm ring-1 ring-inset transition-colors [&_svg]:size-3 ${
              disabled ? 'text-ds-brand-primary-text ring-orange-100 hover:bg-orange-50 hover:text-ds-brand-primary-text' : 'text-ds-text-disabled ring-slate-100 hover:bg-slate-100 hover:text-ds-text-muted'
            }`}
            title={disabled ? '解除禁用' : '禁用任务'}
            aria-pressed={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onDisableToggle();
            }}
          >
            <Ban className="size-3.5" />
          </button>
          <span className="relative flex size-5 shrink-0">
            <button
              type="button"
              className="flex size-5 shrink-0 items-center justify-center rounded-ds-sm bg-white/90 text-ds-text-disabled shadow-sm ring-1 ring-inset ring-slate-100 transition-colors hover:bg-red-50 hover:text-red-600 [&_svg]:size-3"
              title="删除任务"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteClick();
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
            {deletePopoverOpen ? (
              <div className="ds-dropdown-surface absolute right-0 top-[calc(100%+8px)] z-50 w-44 rounded-lg p-2.5">
                <div className="ds-dropdown-arrow absolute -top-1.5 right-2 size-3 rotate-45 border-l border-t" />
                <div className="text-xs font-medium text-slate-900">确认删除</div>
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    type="button"
                    className="h-6 rounded-ds-sm border border-slate-200 bg-white px-2 text-[11px] text-slate-500 hover:bg-slate-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteClick();
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="h-6 rounded-ds-sm bg-red-500 px-2 text-[11px] text-white hover:bg-red-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteClick();
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

const initialTasks = [
  { id: 'pick', type: 'pick' as const, title: '抓取0162-01-010101-01', selected: true },
  { id: 'polish', type: 'polish' as const, title: '打磨01 打磨线 1', hoverPreview: true },
];

type TaskItem = (typeof initialTasks)[number];

const SEQUENCE_ROW_HEIGHT_PX = 32;
const SEQUENCE_ROW_GAP_PX = 8;
const SEQUENCE_ROW_STEP_PX = 40;
const REORDER_BETWEEN_LINE_MS = 1300;
const REORDER_TOP_LINE_MS = 1300;
const REORDER_LINE_FADE_MS = 260;
const REORDER_MOVE_MS = 1100;
const REORDER_HOLD_MS = 1200;
const ORDER_INDEX_UPDATE_DELAY_MS = 60;

function getReorderedTasks(currentTasks: TaskItem[], draggingTaskId: string, targetId: string, position: DropPosition) {
  if (draggingTaskId === targetId) return currentTasks;
  const draggingIndex = currentTasks.findIndex((task) => task.id === draggingTaskId);
  const targetIndex = currentTasks.findIndex((task) => task.id === targetId);
  if (draggingIndex < 0 || targetIndex < 0) return currentTasks;
  const nextTasks = [...currentTasks];
  const [draggedTask] = nextTasks.splice(draggingIndex, 1);
  const nextTargetIndex = nextTasks.findIndex((task) => task.id === targetId);
  const insertIndex = position === 'before' ? nextTargetIndex : nextTargetIndex + 1;
  nextTasks.splice(insertIndex, 0, draggedTask);
  return nextTasks;
}

function getTaskOrderIndices(orderedTasks: TaskItem[]) {
  return Object.fromEntries(orderedTasks.map((task, index) => [task.id, index + 1])) as Record<string, number>;
}

function getDropIndicatorTop(orderedTasks: TaskItem[], targetId: string, position: DropPosition) {
  const targetIndex = orderedTasks.findIndex((task) => task.id === targetId);
  if (targetIndex < 0) return null;
  return position === 'before'
    ? targetIndex * SEQUENCE_ROW_STEP_PX - 7
    : targetIndex * SEQUENCE_ROW_STEP_PX + SEQUENCE_ROW_HEIGHT_PX + SEQUENCE_ROW_GAP_PX / 8;
}

export function ProcessSequenceBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const tasksRef = useRef<TaskItem[]>(initialTasks);
  const [visualOrder, setVisualOrder] = useState<string[]>(() => initialTasks.map((task) => task.id));
  const [disabledIds, setDisabledIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [userControlled, setUserControlled] = useState(false);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  const draggingIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<{ id: string; position: DropPosition } | null>(null);
  const [deletePopoverId, setDeletePopoverId] = useState<string | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string>('pick');
  const [isolatedTaskId, setIsolatedTaskId] = useState<string | null>('pick');
  const [displayIndices, setDisplayIndices] = useState<Record<string, number>>(() => getTaskOrderIndices(initialTasks));

  const reorderTasks = (draggingTaskId: string, targetId: string, position: DropPosition) => {
    setTasks((currentTasks) => {
      const nextTasks = getReorderedTasks(currentTasks, draggingTaskId, targetId, position);
      tasksRef.current = nextTasks;
      const nextOrder = nextTasks.map((task) => task.id);
      setVisualOrder(nextOrder);
      window.setTimeout(() => setDisplayIndices(getTaskOrderIndices(nextTasks)), ORDER_INDEX_UPDATE_DELAY_MS);
      return nextTasks;
    });
  };

  const handleDragStart = (id: string, event: DragEvent<HTMLButtonElement>) => {
    setUserControlled(true);
    draggingIdRef.current = id;
    dropTargetRef.current = null;
    setDraggingId(id);
    setIndicatorVisible(false);
    setIndicatorTop(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (id: string, position: DropPosition) => {
    const currentDraggingId = draggingIdRef.current;
    if (!currentDraggingId || currentDraggingId === id) {
      dropTargetRef.current = null;
      setIndicatorTop(null);
      return;
    }

    const draggingIndex = tasks.findIndex((task) => task.id === currentDraggingId);
    const targetIndex = tasks.findIndex((task) => task.id === id);
    let effectivePosition = position;

    if (draggingIndex + 1 === targetIndex && position === 'before') {
      effectivePosition = 'after';
    }
    if (draggingIndex - 1 === targetIndex && position === 'after') {
      effectivePosition = 'before';
    }

    const nextDropTarget = { id, position: effectivePosition };
    dropTargetRef.current = nextDropTarget;
    setIndicatorTop(getDropIndicatorTop(tasksRef.current, id, position));
  };

  const handleDrop = () => {
    const currentDraggingId = draggingIdRef.current;
    const currentDropTarget = dropTargetRef.current;
    if (currentDraggingId && currentDropTarget) {
      reorderTasks(currentDraggingId, currentDropTarget.id, currentDropTarget.position);
    }
    handleDragEnd();
  };

  const handleDragEnd = () => {
    draggingIdRef.current = null;
    dropTargetRef.current = null;
    setDraggingId(null);
    setIndicatorVisible(false);
    setIndicatorTop(null);
  };

  useEffect(() => {
    setUserControlled(false);
    setIndicatorVisible(false);
    setIndicatorTop(null);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled || draggingId || deletePopoverId || tasksRef.current.length < 2) return undefined;

    const timers: number[] = [];
    const queueTimer = (handler: () => void, delay: number) => {
      const timerId = window.setTimeout(handler, delay);
      timers.push(timerId);
    };

    const startCycle = () => {
      const currentTasks = tasksRef.current;
      if (currentTasks.length < 2) return;

      const targetId = currentTasks[0].id;
      const movingId = currentTasks[1].id;
      setIndicatorTop(getDropIndicatorTop(currentTasks, targetId, 'after'));
      setIndicatorVisible(true);

      queueTimer(() => {
        setIndicatorTop(getDropIndicatorTop(currentTasks, targetId, 'before'));
        setIndicatorVisible(true);
      }, REORDER_BETWEEN_LINE_MS);

      queueTimer(() => {
        const nextTasks = getReorderedTasks(tasksRef.current, movingId, targetId, 'before');
        const nextOrder = nextTasks.map((task) => task.id);

        setIndicatorVisible(false);

        queueTimer(() => {
          setVisualOrder(nextOrder);
        }, REORDER_LINE_FADE_MS);

        queueTimer(() => {
          tasksRef.current = nextTasks;
          setTasks(nextTasks);
          setIndicatorTop(getDropIndicatorTop(nextTasks, movingId, 'after'));
          setIndicatorVisible(true);
        }, REORDER_LINE_FADE_MS + REORDER_MOVE_MS);

        queueTimer(() => {
          setDisplayIndices(getTaskOrderIndices(nextTasks));
        }, REORDER_LINE_FADE_MS + REORDER_MOVE_MS + ORDER_INDEX_UPDATE_DELAY_MS);

        queueTimer(() => {
          if (nextTasks[1]) {
            setIsolatedTaskId(nextTasks[1].id);
            setDetailTaskId(nextTasks[1].id);
          }
        }, REORDER_LINE_FADE_MS + REORDER_MOVE_MS + ORDER_INDEX_UPDATE_DELAY_MS + 180);

        queueTimer(startCycle, REORDER_LINE_FADE_MS + REORDER_MOVE_MS + ORDER_INDEX_UPDATE_DELAY_MS + REORDER_HOLD_MS);
      }, REORDER_BETWEEN_LINE_MS + REORDER_TOP_LINE_MS);
    };

    startCycle();

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [deletePopoverId, draggingId, globalPlaying, restartSignal, userControlled]);

  return (
    <BentoFrame allowOverflow className="md:col-span-3 xl:col-span-6 xl:min-h-[196px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <div
            className="relative h-[72px]"
            onDragOver={(event) => {
              if (!draggingIdRef.current || !dropTargetRef.current) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop();
            }}
          >
            {indicatorTop !== null ? (
              <div
                className={`pointer-events-none absolute inset-x-9 z-30 flex h-1.5 items-center transition-opacity duration-[260ms] ease-out ${indicatorVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ top: indicatorTop }}
              >
                <div className="h-0.5 flex-1 rounded-full bg-ds-brand-primary shadow-[0_0_0_1px_rgba(255,105,0,0.15)]" />
              </div>
            ) : null}
            {tasks.map((task) => {
              const visualIndex = visualOrder.indexOf(task.id);
              return (
                <TaskItemRow
                  key={task.id}
                  id={task.id}
                  index={displayIndices[task.id] ?? visualIndex + 1}
                  type={task.type}
                  title={task.title}
                  selected={isolatedTaskId === task.id}
                  detailActive={detailTaskId === task.id && isolatedTaskId !== task.id}
                  hoverPreview={task.hoverPreview}
                  disabled={disabledIds.includes(task.id)}
                  deletePopoverOpen={deletePopoverId === task.id}
                  positionTop={(visualIndex < 0 ? 0 : visualIndex) * SEQUENCE_ROW_STEP_PX}
                  onDisableToggle={() => {
                    setDisabledIds((currentIds) =>
                      currentIds.includes(task.id) ? currentIds.filter((id) => id !== task.id) : [...currentIds, task.id],
                    );
                  }}
                  onDeleteClick={() => setDeletePopoverId((currentId) => (currentId === task.id ? null : task.id))}
                  onDetailClick={() => {
                    if (disabledIds.includes(task.id)) return;
                    setDetailTaskId(task.id);
                    setIsolatedTaskId((currentId) => (currentId === task.id ? null : task.id));
                  }}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}
