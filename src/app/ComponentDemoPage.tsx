import { useMemo, useState, type CSSProperties } from 'react';
import { ASSET_BASE } from '../asset-base';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { ActionButtonsBento } from './component-demo/ActionButtonsBento';
import { AnimatedGripperSliderBento } from './component-demo/AnimatedGripperSliderBento';
import { CheckboxStatesBento } from './component-demo/CheckboxStatesBento';
import { CoordinateFieldGroupBento } from './component-demo/CoordinateFieldGroupBento';
import { FloatingPanelBento } from './component-demo/FloatingPanelBento';
import { ObjectSelectionBento } from './component-demo/ObjectSelectionBento';
import { PathPointToolbarBento, type PathPointDemoMode } from './component-demo/PathPointToolbarBento';
import { ProcessDetailTabsBento, type ProcessDetailDemoTab } from './component-demo/ProcessDetailTabsBento';
import { ProcessBatchOperationBento } from './component-demo/ProcessBatchOperationBento';
import { ProcessSequenceBento } from './component-demo/ProcessSequenceBento';
import { ResultPointPanelBento } from './component-demo/ResultPointPanelBento';
import { SegmentedControlBento } from './component-demo/SegmentedControlBento';
import { SingleSelectBento } from './component-demo/SingleSelectBento';
import { StepperNumberInputBento } from './component-demo/StepperNumberInputBento';
import { TextInputStatesBento } from './component-demo/TextInputStatesBento';
import { ToastBento } from './component-demo/ToastBento';
import { ToolStripBento } from './component-demo/ToolStripBento';
import { TreeRowsBento } from './component-demo/TreeRowsBento';
import { UnitNumberInputsBento } from './component-demo/UnitNumberInputsBento';
import { ViewportGlassPanelBento, ViewportWeldModelBento } from './component-demo/ViewportShowcaseBento';
import robimLogoTextImg from '../pics/RoBIM云平台LOGO 2.png';

type DemoIntroLanguage = 'zh' | 'en';

const demoIntroCopy = {
  zh: {
    eyebrow: 'Component Visual Guideline',
    description:
      '一个用于探索和沉淀界面风格的 component lab，作为 visual guideline 和 UI foundation，持续引导后续组件实现中的视觉语言、状态表达与交互秩序。',
  },
  en: {
    eyebrow: 'Component Visual Guideline',
    description:
      'A component lab for exploring and refining interface style, working as a visual guideline and UI foundation to guide future component implementation, visual language, states, and interaction patterns.',
  },
} satisfies Record<
  DemoIntroLanguage,
  {
    eyebrow: string;
    description: string;
  }
>;

export function ComponentDemoPage() {
  const [globalPlaying, setGlobalPlaying] = useState(true);
  const [introLanguage, setIntroLanguage] = useState<DemoIntroLanguage>('zh');
  const [restartSignal, setRestartSignal] = useState(0);
  const [selectedIds, setSelectedIds] = useState(['0162-01-010101-01', '01-grind']);
  const [singleId, setSingleId] = useState('gantry');
  const [activeTab, setActiveTab] = useState<ProcessDetailDemoTab>('parameter');
  const [mode, setMode] = useState<PathPointDemoMode>('edit');
  const [collapsed, setCollapsed] = useState(false);
  const motionStyle = useMemo(
    () =>
      ({
        '--component-demo-motion-play-state': globalPlaying ? 'running' : 'paused',
      }) as CSSProperties,
    [globalPlaying],
  );
  const introCopy = demoIntroCopy[introLanguage];

  const toggleGlobalMotion = () => {
    if (globalPlaying) {
      setGlobalPlaying(false);
      return;
    }
    setGlobalPlaying(true);
    setRestartSignal((value) => value + 1);
  };

  return (
    <main
      className="component-demo-motion min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(255,105,0,0.13),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_52%,#f8fafc_100%)] px-8 py-8 text-ds-text-primary md:px-10 md:py-10 xl:px-16 xl:py-12"
      style={motionStyle}
    >
      <section className="mx-auto mb-6 flex max-w-[1480px] flex-col gap-9 rounded-[28px] border border-white/70 bg-white/58 px-8 py-6 shadow-[0_24px_90px_rgba(15,23,42,0.11)] backdrop-blur-xl md:gap-10 md:px-10 md:py-7 xl:mb-7 xl:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="inline-flex items-center gap-2.5">
              <img
                src={`${ASSET_BASE}brand/dajie-rplus-filled-orange-256.png`}
                alt="robotics.ai"
                className="size-6 object-contain"
              />
              <img src={robimLogoTextImg} alt="robotics.ai" className="h-[17px] w-auto object-contain" />
            </div>
            <span className="hidden h-4 w-px bg-slate-200 md:block" />
            <span className="text-base font-normal leading-6 tracking-normal text-slate-500 md:text-lg">
              {introCopy.eyebrow}
            </span>
          </div>

          <div className="relative grid w-[112px] shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-md bg-slate-100 p-1 text-[9px] leading-none text-slate-500">
            <span
              className="pointer-events-none absolute bottom-1 top-1 z-0 rounded-[5px] bg-white shadow-ds-sm transition-transform duration-500 ease-ds-standard"
              style={{
                left: '4px',
                width: 'calc((100% - 12px) / 2)',
                transform: `translateX(calc(${introLanguage === 'zh' ? 0 : 1} * (100% + 4px)))`,
              }}
            />
            {(['zh', 'en'] as const).map((language) => (
              <button
                key={language}
                type="button"
                className={`relative z-10 h-6 rounded-[5px] px-1 text-center text-[12px] font-normal leading-none transition-colors duration-300 ${
                  introLanguage === language ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setIntroLanguage(language)}
                aria-pressed={introLanguage === language}
              >
                {language === 'zh' ? '中文' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[820px]">
          <p className="max-w-[800px] text-sm font-light leading-6 text-slate-500 md:text-base md:leading-7">
            {introCopy.description}
          </p>
        </div>
      </section>

      <div className="component-demo-bento-grid mx-auto grid max-w-[1480px] auto-rows-[minmax(156px,auto)] grid-cols-1 gap-5 md:grid-cols-6 xl:grid-cols-12 xl:gap-6">
        <ActionButtonsBento />
        <CheckboxStatesBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <TextInputStatesBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <UnitNumberInputsBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <StepperNumberInputBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <AnimatedGripperSliderBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <SegmentedControlBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <SingleSelectBento singleId={singleId} onSingleIdChange={setSingleId} />
        <ObjectSelectionBento selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} />
        <ProcessDetailTabsBento
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          globalPlaying={globalPlaying}
          restartSignal={restartSignal}
        />
        <ResultPointPanelBento />
        <PathPointToolbarBento
          mode={mode}
          collapsed={collapsed}
          onModeChange={setMode}
          onCollapsedChange={setCollapsed}
          globalPlaying={globalPlaying}
          restartSignal={restartSignal}
        />
        <CoordinateFieldGroupBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <TreeRowsBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <ProcessSequenceBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <ProcessBatchOperationBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <ToastBento />
        <ToolStripBento />
        <FloatingPanelBento />
        <ViewportGlassPanelBento globalPlaying={globalPlaying} restartSignal={restartSignal} />
        <ViewportWeldModelBento globalPlaying={globalPlaying} />
      </div>

      <section className="mx-auto mt-6 max-w-[1480px] xl:mt-7">
        <a
          href="/component-lab"
          className="group flex min-h-[96px] w-full items-center justify-between gap-5 rounded-[28px] border border-white/75 bg-white/64 px-7 py-6 text-left shadow-[0_24px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:bg-white/82 hover:shadow-[0_28px_100px_rgba(15,23,42,0.14)] md:px-9"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-500">完整规格、状态矩阵与业务组件归档</span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-3">
            <span className="text-sm font-medium tracking-normal text-slate-700 md:text-base">
              查看 Component Lab
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ds-brand-primary text-white shadow-[0_14px_36px_rgba(255,105,0,0.28)] transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight className="size-5" />
            </span>
          </span>
        </a>
      </section>

      <button
        type="button"
        className="fixed bottom-5 left-5 z-50 flex h-11 items-center gap-2 rounded-full border border-white/70 bg-white/62 px-4 text-xs text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-colors hover:bg-white/82"
        onClick={toggleGlobalMotion}
      >
        {globalPlaying ? <Pause className="size-4 text-slate-500" /> : <Play className="size-4 text-ds-brand-primary-text" />}
        <span>{globalPlaying ? '暂停动效' : '重新开始'}</span>
      </button>
    </main>
  );
}
