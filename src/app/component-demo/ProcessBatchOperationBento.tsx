import { useEffect, useMemo, useState } from 'react';
import { Ban, Filter, Move3D, ScanLine, Sparkles, Trash2, type LucideIcon } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

const batchDemoTasks = [
  { id: 'pick-01', title: '抓取', Icon: Move3D },
  { id: 'grind-01', title: '打磨', Icon: Sparkles },
  { id: 'scan-01', title: '定位焊扫描', Icon: ScanLine },
  { id: 'pick-02', title: '抓取', Icon: Move3D },
  { id: 'grind-02', title: '打磨', Icon: Sparkles },
  { id: 'scan-02', title: '定位焊', Icon: ScanLine },
] as const;

type BatchDemoStage = 'idle' | 'batch' | 'all-selected' | 'all-cleared';

const batchStageOrder: BatchDemoStage[] = ['idle', 'batch', 'all-selected', 'all-cleared'];

function CompactBatchCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      size="sm"
      checked={checked}
      onCheckedChange={onChange}
      className="transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)]"
      onClick={(event) => event.stopPropagation()}
    />
  );
}

function CompactProcessTaskCell({
  index,
  title,
  Icon,
  batchMode,
  checkboxVisible,
  checked,
  onCheckedChange,
}: {
  index: number;
  title: string;
  Icon: LucideIcon;
  batchMode: boolean;
  checkboxVisible: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className="relative grid h-8 min-w-0 grid-cols-[12px_16px_minmax(0,1fr)] items-center gap-0 rounded-ds-md bg-ds-bg-glass-float py-0 pl-px pr-1 text-left text-ds-text-secondary shadow-ds-sm backdrop-blur-sm transition-colors hover:bg-orange-50/60 hover:text-ds-brand-primary-text [&_svg]:size-3.5"
    >
      <button
        type="button"
        className="flex h-6 w-3 shrink-0 cursor-grab items-center justify-center rounded-ds-sm text-zinc-300 active:cursor-grabbing"
        title="拖拽排序"
      >
        <span aria-hidden className="flex h-4 w-1 flex-col items-center justify-center gap-0.5">
          <span className="size-0.5 rounded-full bg-current" />
          <span className="size-0.5 rounded-full bg-current" />
          <span className="size-0.5 rounded-full bg-current" />
        </span>
      </button>
      <span className="grid h-6 w-4 shrink-0 place-items-center text-xs font-normal leading-none text-zinc-400">
        <span
          className={`col-start-1 row-start-1 transition-all duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)] ${
            checkboxVisible ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <span className="ds-process-index">{index + 1}</span>
        </span>
        <span
          className={`col-start-1 row-start-1 transition-all duration-[520ms] ease-[cubic-bezier(0.22,1.18,0.36,1)] ${
            checkboxVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
          style={{ transitionDelay: checkboxVisible ? `${index * 42}ms` : '0ms' }}
        >
          {batchMode ? <CompactBatchCheckbox checked={checked} onChange={onCheckedChange} /> : null}
        </span>
      </span>
      <button type="button" className="flex min-w-0 items-center gap-1 pl-1.5 text-left">
        <Icon className="size-3.5 shrink-0 text-current" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium leading-5 text-ds-text-secondary"><span className="ds-process-title-text">{title}</span></span>
      </button>
    </div>
  );
}

export function ProcessBatchOperationBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [stage, setStage] = useState<BatchDemoStage>('idle');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [checkboxesVisible, setCheckboxesVisible] = useState(false);
  const [userControlled, setUserControlled] = useState(false);

  const batchMode = stage !== 'idle';
  const allSelected = checkedIds.size === batchDemoTasks.length;

  const selectableIds = useMemo(() => batchDemoTasks.map((task) => task.id), []);

  useEffect(() => {
    setStage('idle');
    setCheckedIds(new Set());
    setCheckboxesVisible(false);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return undefined;

    let timeoutId = 0;

    const advance = () => {
      setStage((currentStage) => {
        const currentIndex = batchStageOrder.indexOf(currentStage);
        const nextStage = batchStageOrder[(currentIndex + 1) % batchStageOrder.length];
        const enteringBatch = currentStage === 'idle' && nextStage === 'batch';

        if (enteringBatch) {
          setCheckboxesVisible(false);
          window.setTimeout(() => setCheckboxesVisible(true), 360);
        } else {
          setCheckboxesVisible(nextStage !== 'idle');
        }

        setCheckedIds(nextStage === 'all-selected' ? new Set(selectableIds) : new Set());
        timeoutId = window.setTimeout(advance, enteringBatch ? 1850 : 1600);
        return nextStage;
      });
    };

    timeoutId = window.setTimeout(advance, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [globalPlaying, selectableIds, userControlled]);

  const handleBatchClick = () => {
    setUserControlled(true);
    setStage((currentStage) => {
      const nextStage = currentStage === 'idle' ? 'batch' : 'idle';
      if (nextStage === 'batch') {
        setCheckboxesVisible(false);
        window.setTimeout(() => setCheckboxesVisible(true), 360);
      } else {
        setCheckboxesVisible(false);
      }
      return nextStage;
    });
    setCheckedIds(new Set());
  };

  const handleSelectAllClick = () => {
    setUserControlled(true);
    setCheckboxesVisible(true);
    setCheckedIds((currentIds) => (currentIds.size === selectableIds.length ? new Set() : new Set(selectableIds)));
    setStage((currentStage) => (currentStage === 'idle' ? 'batch' : currentStage === 'all-selected' ? 'all-cleared' : 'all-selected'));
  };

  const handleTaskCheckedChange = (taskId: string, checked: boolean) => {
    setUserControlled(true);
    setStage('batch');
    setCheckboxesVisible(true);
    setCheckedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (checked) nextIds.add(taskId);
      else nextIds.delete(taskId);
      return nextIds;
    });
  };

  return (
    <BentoFrame className="md:col-span-6 xl:col-span-6 xl:min-h-[252px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-ds-xl border border-white/45 bg-white/24 px-3 pb-3 pt-0.5 shadow-[0_18px_56px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/25 backdrop-blur-xl">
            <div className="mb-2 flex h-9 items-center rounded-none border-0 border-b border-zinc-200/75 bg-transparent px-3 text-xs font-medium text-slate-500">
              <span>任务列表</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  className={`h-7 px-1.5 text-[11px] font-normal transition-[opacity,transform,color] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-transparent ${
                    batchMode
                      ? `translate-x-0 opacity-100 ${allSelected ? 'text-ds-brand-primary-text hover:text-ds-brand-primary-text' : 'text-slate-500 hover:text-ds-brand-primary-text'}`
                      : 'pointer-events-none translate-x-4 opacity-0 text-slate-500'
                  }`}
                  onClick={handleSelectAllClick}
                >
                  全选
                </button>
                <button
                  type="button"
                  className="h-7 px-1.5 text-[11px] font-normal text-slate-500 transition-[transform,color] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-transparent hover:text-ds-brand-primary-text"
                  onClick={handleBatchClick}
                >
                  批量操作
                </button>
                <button type="button" className="grid size-7 place-items-center p-0 text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text" aria-label="筛选">
                  <Filter className="size-3.5" />
                </button>
                <button type="button" className="grid size-7 place-items-center p-0 text-slate-500 hover:bg-transparent hover:text-ds-brand-primary-text" aria-label="禁用选中任务">
                  <Ban className="size-3.5" />
                </button>
                <button type="button" className="grid size-7 place-items-center p-0 text-slate-500 hover:bg-transparent hover:text-red-600" aria-label="删除选中任务">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {batchDemoTasks.map((task, index) => (
                <CompactProcessTaskCell
                  key={task.id}
                  index={index}
                  title={task.title}
                  Icon={task.Icon}
                  batchMode={batchMode}
                  checkboxVisible={checkboxesVisible}
                  checked={checkedIds.has(task.id)}
                  onCheckedChange={(checked) => handleTaskCheckedChange(task.id, checked)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}
