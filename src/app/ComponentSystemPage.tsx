import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Eye,
  Gauge,
  GitCompareArrows,
  Grid3X3,
  Layers3,
  LayoutDashboard,
  Link2,
  ListChecks,
  Ruler,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Button } from './components/ui/button';
import {
  categories,
  componentRegistry,
  type ComponentCategory,
  type ComponentRegistryItem,
  type ComponentStateKey,
  type CoverageLevel,
} from '../design-system/registry/component-registry';

type RuleItem = {
  name: string;
  token: string;
  value: string;
  className: string;
  scope: string;
  risk: string;
};

const stateLabels: Record<ComponentStateKey, string> = {
  default: 'Default',
  hover: 'Hover',
  selected: 'Selected',
  open: 'Open',
  invalid: 'Invalid',
  disabled: 'Disabled',
  loading: 'Loading',
  dirty: 'Dirty',
};

const allStateKeys: ComponentStateKey[] = ['default', 'hover', 'selected', 'open', 'invalid', 'disabled', 'loading', 'dirty'];

const visualRules: RuleItem[] = [
  {
    name: 'label-input gap',
    token: 'space.075',
    value: '6px',
    className: 'ds-parameter-field',
    scope: '输入框、选择器、多选、Slider、只读回显',
    risk: '禁止用 mb-1 / mt-3 临时拼距离',
  },
  {
    name: 'label-input mini gap',
    token: 'space.050',
    value: '4px',
    className: 'ds-label-input-mini',
    scope: '3D 视窗内紧凑特征提取浮窗',
    risk: '不要套到常规工艺参数弹窗',
  },
  {
    name: 'title-content gap',
    token: 'space.200',
    value: '16px',
    className: 'ds-parameter-card-title-stack',
    scope: '抓取阈值卡片 + 安全点高度卡片',
    risk: '不要替代 label-input gap',
  },
  {
    name: 'task panel width',
    token: 'layout.sequenceWidth',
    value: '396px',
    className: 'w-[396px]',
    scope: '任务面板应用变体',
    risk: '不要为了平铺总览拉满整行',
  },
  {
    name: 'tree icon-title gap',
    token: 'space.treeIconTitleGap',
    value: '8px',
    className: 'ds-tree-icon-title-gap',
    scope: '装配体根节点、项目条目、特征分组 header',
    risk: '不要和普通 4px 行内 gap 混用',
  },
];

const riskItems = [
  {
    title: '业务复合组件容易跑在契约前面',
    detail: 'ProcessStepPanel、PickPathPoints、JointValueRow 的真实场景变化快，建议每次主页面改动后先检查新页风险队列，再补旧 Component Lab 详细 demo。',
    level: 'risk' as CoverageLevel,
  },
  {
    title: '契约数据和 demo 数据仍是两套来源',
    detail: '旧页的 componentSections 和 componentContracts 暂未合并。下一步应抽出 componentRegistry，驱动目录、契约、状态矩阵和总览。',
    level: 'watch' as CoverageLevel,
  },
  {
    title: '视觉标尺还集中在间距规则',
    detail: '当前已有 label-input 与 title-content 标尺，新页先补高度、圆角、宽度、缩进和阴影方向的管理入口。',
    level: 'watch' as CoverageLevel,
  },
  {
    title: 'Badge 与 Switch 的 demo 覆盖偏薄',
    detail: '它们在主页面出现频繁，但旧组件库里还不是第一等基础组件，建议后续补完整状态矩阵。',
    level: 'risk' as CoverageLevel,
  },
];

const heightRules = [
  { name: 'control.xs', value: '24px', use: 'tiny action' },
  { name: 'control.sm', value: '28px', use: '小工具按钮' },
  { name: 'control.md', value: '32px', use: '任务详情输入' },
  { name: 'control.lg', value: '36px', use: '常规表单输入' },
  { name: 'control.xl', value: '40px', use: '宽松输入 / J 行' },
];

const radiusRules = [
  { name: 'radius.sm', value: '4px', use: '小控件内层' },
  { name: 'radius.md', value: '6px', use: '紧凑按钮 / 树节点' },
  { name: 'radius.lg', value: '8px', use: '输入框 / 弹窗外壳' },
  { name: 'radius.xl', value: '12px', use: '灰底容器 / 特殊面板' },
];

const treeIndentRules = [
  { label: '装配体根', value: '8px' },
  { label: '主零件', value: '8px' },
  { label: '工作面', value: '36px' },
  { label: '子零件', value: '36px' },
  { label: '更深零件', value: '48px' },
];

function getCoverageLevelClass(level: CoverageLevel) {
  if (level === 'good') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (level === 'watch') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function getRiskLabel(level: CoverageLevel) {
  if (level === 'good') return '稳定';
  if (level === 'watch') return '关注';
  return '风险';
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-ds-brand-primary-text">{icon}</div>
      </div>
      <div className="mt-3 text-xs leading-5 text-slate-500">{helper}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ds-brand-primary-text">
        <ScanLine className="size-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function StateMatrix() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[960px]">
        <div className="grid grid-cols-[190px_120px_repeat(8,minmax(74px,1fr))] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
          <div>组件</div>
          <div>风险</div>
          {allStateKeys.map((state) => (
            <div key={state}>{stateLabels[state]}</div>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {componentRegistry.map((item) => (
            <div key={item.name} className="grid grid-cols-[190px_120px_repeat(8,minmax(74px,1fr))] items-center px-3 py-3 text-xs">
              <div>
                <div className="font-medium text-slate-800">{item.name}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{item.category}</div>
              </div>
              <div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${getCoverageLevelClass(item.risk)}`}>
                  {getRiskLabel(item.risk)}
                </span>
              </div>
              {allStateKeys.map((state) => {
                const covered = item.states.includes(state);
                return (
                  <div key={state}>
                    {covered ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <CircleDashed className="size-4 text-slate-300" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenCoverageBar({ value }: { value: number }) {
  const level = value >= 80 ? 'bg-emerald-500' : value >= 68 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${level}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right font-mono text-[11px] text-slate-500">{value}%</span>
    </div>
  );
}

function ComponentRegistryTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[1080px]">
        <div className="grid grid-cols-[190px_100px_90px_90px_180px_minmax(220px,1fr)_120px] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-400">
          <div>组件</div>
          <div>分类</div>
          <div>契约</div>
          <div>Demo</div>
          <div>Token 覆盖</div>
          <div>应用位置</div>
          <div>风险</div>
        </div>
        <div className="divide-y divide-slate-100">
          {componentRegistry.map((item) => (
            <div key={item.name} className="grid grid-cols-[190px_100px_90px_90px_180px_minmax(220px,1fr)_120px] items-center px-3 py-3 text-xs">
              <div>
                <div className="font-semibold text-slate-800">{item.name}</div>
                <div className="mt-0.5 truncate text-[11px] text-slate-400">{item.purpose}</div>
              </div>
              <div className="text-slate-500">{item.category}</div>
              <div className="text-slate-600">{item.contract}</div>
              <div className="text-slate-600">{item.demo}</div>
              <TokenCoverageBar value={item.tokenCoverage} />
              <div className="flex flex-wrap gap-1.5">
                {item.usedIn.map((usage) => (
                  <span key={usage} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    {usage}
                  </span>
                ))}
              </div>
              <div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${getCoverageLevelClass(item.risk)}`}>
                  {getRiskLabel(item.risk)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: RuleItem }) {
  return (
    <div className="grid gap-3 border-b border-slate-100 px-3 py-3 text-xs last:border-b-0 md:grid-cols-[160px_120px_110px_220px_minmax(0,1fr)] md:items-center">
      <div className="font-semibold text-slate-800">{rule.name}</div>
      <div className="font-mono text-slate-500">{rule.token}</div>
      <div className="font-mono text-ds-brand-primary-text">{rule.value}</div>
      <div className="font-mono text-[11px] text-slate-500">{rule.className}</div>
      <div>
        <div className="text-slate-600">{rule.scope}</div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
          <TriangleAlert className="size-3" />
          {rule.risk}
        </div>
      </div>
    </div>
  );
}

function GapRulerDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4">
        <div className="text-xs font-semibold text-ds-brand-primary-text">label-input gap / 6px</div>
        <div className="mt-4 flex items-start gap-4">
          <div className="ds-parameter-field w-full max-w-xs">
            <div className="ds-parameter-label">支撑宽度</div>
            <div className="relative h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs leading-9 text-slate-500">
              input surface
              <div className="absolute left-3 top-[-6px] h-[6px] w-16 bg-orange-300/50" />
            </div>
          </div>
          <div className="pt-[22px] font-mono text-[11px] text-ds-brand-primary-text">6px</div>
        </div>
      </div>
      <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
        <div className="text-xs font-semibold text-teal-700">mini label gap / 4px</div>
        <div className="mt-4 flex items-start gap-4">
          <div className="ds-label-input-mini w-full max-w-xs">
            <div className="ds-label-input-mini-label">焊缝特征</div>
            <div className="relative h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] leading-7 text-slate-500">
              compact select
              <div className="absolute left-2 top-[-4px] h-[4px] w-14 bg-teal-300/50" />
            </div>
          </div>
          <div className="pt-[20px] font-mono text-[11px] text-teal-700">4px</div>
        </div>
      </div>
    </div>
  );
}

function HeightRulerDemo() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {heightRules.map((item) => (
        <div key={item.name} className="grid grid-cols-[130px_80px_minmax(0,1fr)_140px] items-center border-b border-slate-100 px-3 py-3 text-xs last:border-b-0">
          <div className="font-mono text-slate-700">{item.name}</div>
          <div className="font-mono text-slate-500">{item.value}</div>
          <div className="flex items-center gap-2">
            <div className="w-32 rounded-lg border border-orange-200 bg-orange-50" style={{ height: item.value }} />
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="text-slate-500">{item.use}</div>
        </div>
      ))}
    </div>
  );
}

function RadiusRulerDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {radiusRules.map((item) => (
        <div key={item.name} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs text-slate-700">{item.name}</div>
              <div className="mt-1 font-mono text-[11px] text-ds-brand-primary-text">{item.value}</div>
            </div>
            <div className="size-12 border border-orange-300 bg-orange-50" style={{ borderRadius: item.value }} />
          </div>
          <div className="mt-3 text-xs text-slate-500">{item.use}</div>
        </div>
      ))}
    </div>
  );
}

function TaskWidthRulerDemo() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="w-[396px] rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex h-9 items-center justify-between border-b border-slate-100 px-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Layers3 className="size-3.5 text-orange-500" />
            抓取任务面板
          </div>
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] text-ds-brand-primary-text">396px</span>
        </div>
        <div className="space-y-3 p-3">
          <div className="ds-label-input-compact">
            <div className="ds-label-input-compact-label">工件模型选择</div>
            <div className="flex h-8 items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600">
              0162-01-010101-01
              <ArrowRight className="size-3.5 text-slate-300" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['覆盖率', '安全系数', '偏心距'].map((item, index) => (
              <div key={item} className="rounded-lg bg-slate-50 px-2 py-2 text-[11px] text-slate-500">
                <div>{item}</div>
                <div className="mt-1 font-mono text-xs text-slate-800">{index === 0 ? '78.9%' : index === 1 ? '0.84' : '188mm'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeIndentRulerDemo() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-2">
        {treeIndentRules.map((item, index) => (
          <div key={item.label} className="relative flex h-8 items-center rounded-md bg-slate-50 text-xs text-slate-600">
            <div className="absolute inset-y-0 left-0 bg-orange-100" style={{ width: item.value }} />
            <div className="relative flex items-center gap-2" style={{ marginLeft: item.value }}>
              <span className="flex size-4 items-center justify-center rounded bg-white text-[10px] text-slate-400 ring-1 ring-slate-200">
                {index + 1}
              </span>
              <span>{item.label}</span>
              <span className="font-mono text-[11px] text-ds-brand-primary-text">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowDirectionDemo() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="relative h-32 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          <div className="space-y-2 p-3">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-3 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-end bg-white/90 px-3 shadow-ds-footer-up">
            <div className="h-6 w-14 rounded-md bg-ds-brand-primary" />
          </div>
        </div>
        <div className="mt-3 font-mono text-[11px] text-slate-700">footer upward shadow</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="relative h-32 overflow-hidden rounded-lg border border-slate-100 bg-white">
          <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center bg-white/90 px-3 shadow-ds-sticky-overlap">
            <div className="h-3 w-24 rounded bg-slate-300" />
          </div>
          <div className="space-y-2 p-3 pt-12">
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-3 font-mono text-[11px] text-slate-700">sticky overlap shadow</div>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
        <div className="relative h-32 overflow-hidden rounded-lg border border-red-100 bg-white">
          <div className="space-y-2 p-3">
            <div className="h-3 w-24 rounded bg-red-100" />
            <div className="h-3 rounded bg-red-100" />
            <div className="h-3 w-2/3 rounded bg-red-100" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-end bg-white/90 px-3 shadow-[inset_0_8px_16px_-16px_rgba(15,23,42,0.42)]">
            <div className="h-6 w-14 rounded-md bg-red-300" />
          </div>
        </div>
        <div className="mt-3 font-mono text-[11px] text-red-700">avoid inset footer shadow</div>
      </div>
    </div>
  );
}

export function ComponentSystemPage() {
  const totalComponents = componentRegistry.length;
  const completeContracts = componentRegistry.filter((item) => item.contract === '完整').length;
  const completeDemos = componentRegistry.filter((item) => item.demo === '完整').length;
  const riskCount = componentRegistry.filter((item) => item.risk === 'risk').length;
  const averageTokenCoverage = Math.round(
    componentRegistry.reduce((total, item) => total + item.tokenCoverage, 0) / componentRegistry.length,
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <LayoutDashboard className="size-4 text-orange-500" />
              组件系统一致性控制台
            </div>
            <div className="mt-1 font-mono text-xs text-slate-400">/component-system</div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/page-agent">
              <Button size="sm" className="h-8 px-3 text-xs">
                <Sparkles className="size-3.5" />
                页面生成 Agent
              </Button>
            </a>
            <a href="/component-lab">
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                <Grid3X3 className="size-3.5" />
                原 Component Lab
              </Button>
            </a>
            <a href="/primitive-lab">
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                <SlidersHorizontal className="size-3.5" />
                基础组件试验页
              </Button>
            </a>
            <a href="/">
              <Button size="sm" className="h-8 px-3 text-xs">
                返回主页面
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-ds-brand-primary-text">
                <Sparkles className="size-3.5" />
                Code-first design system
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">从展示页升级成一致性管理页</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                旧 Component Lab 保留详细示例；这个新入口聚合组件契约、状态覆盖、token 覆盖、风险队列和视觉标尺，用来决定下一步该整理哪里。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span key={category} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck className="size-4 text-emerald-500" />
                当前治理原则
              </div>
              <div className="mt-4 space-y-3 text-xs leading-5 text-slate-500">
                <div className="flex gap-2">
                  <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                  <span>原 `/component-lab` 是详细样例事实源，新页先做管理层。</span>
                </div>
                <div className="flex gap-2">
                  <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                  <span>视觉规则必须有 token、唯一 class、像素值、应用边界和反例。</span>
                </div>
                <div className="flex gap-2">
                  <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                  <span>主页面新增样式后，同步检查契约、状态矩阵和真实宽度标尺。</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Layers3 className="size-4" />}
            label="组件清单"
            value={`${totalComponents}`}
            helper="来自旧组件库现有分类和契约项的 code-first registry 草案。"
          />
          <MetricCard
            icon={<ClipboardList className="size-4" />}
            label="契约完整"
            value={`${completeContracts}/${totalComponents}`}
            helper="已声明 variants、sizes、states、token source 的组件数量。"
          />
          <MetricCard
            icon={<Eye className="size-4" />}
            label="Demo 完整"
            value={`${completeDemos}/${totalComponents}`}
            helper="详细视觉样例在旧 Component Lab 中已覆盖的组件数量。"
          />
          <MetricCard
            icon={<Gauge className="size-4" />}
            label="Token 覆盖"
            value={`${averageTokenCoverage}%`}
            helper="根据当前 token source、ds class 和硬编码残留估算。"
          />
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Radar"
            title="一致性雷达"
            description="把分散在旧组件库、前端规范和主页面里的组件状态收拢成一个可扫视的管理视图。"
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">分类覆盖</div>
                  <div className="mt-1 text-xs text-slate-400">按组件职责分组查看治理压力。</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">{riskCount} 个高风险</span>
              </div>
              <div className="space-y-3">
                {categories.map((category) => {
                  const items = componentRegistry.filter((item) => item.category === category);
                  const riskItemsInCategory = items.filter((item) => item.risk === 'risk').length;
                  const watchItems = items.filter((item) => item.risk === 'watch').length;
                  const stableItems = items.filter((item) => item.risk === 'good').length;
                  return (
                    <div key={category} className="grid gap-3 rounded-lg bg-slate-50 px-3 py-3 text-xs md:grid-cols-[120px_minmax(0,1fr)_120px] md:items-center">
                      <div className="font-semibold text-slate-700">{category}</div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-white">
                        <div className="bg-emerald-500" style={{ width: `${(stableItems / items.length) * 100}%` }} />
                        <div className="bg-amber-500" style={{ width: `${(watchItems / items.length) * 100}%` }} />
                        <div className="bg-red-500" style={{ width: `${(riskItemsInCategory / items.length) * 100}%` }} />
                      </div>
                      <div className="text-slate-500">
                        {items.length} 项 / {riskItemsInCategory} 风险
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="size-4 text-amber-500" />
                风险队列
              </div>
              <div className="mt-4 space-y-3">
                {riskItems.map((item) => (
                  <div key={item.title} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-800">{item.title}</div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${getCoverageLevelClass(item.level)}`}>
                        {getRiskLabel(item.level)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Registry"
            title="组件 Registry 草案"
            description="先在新页面建立统一元数据形状，后续可以把旧 Component Lab 的目录、契约、平铺视图都迁移到同一份 registry。"
          />
          <ComponentRegistryTable />
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="State Matrix"
            title="状态覆盖矩阵"
            description="用矩阵方式看哪些组件缺少 open、selected、dirty、loading 等关键状态，比全局切换默认/异常/置灰更容易发现盲区。"
          />
          <StateMatrix />
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow="Rules"
            title="视觉标尺规则库"
            description="延续旧 Component Lab 中视觉标尺的好模式，把间距、高度、圆角、真实宽度、树缩进和阴影方向都变成可检查对象。"
          />
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            {visualRules.map((rule) => (
              <RuleRow key={rule.name} rule={rule} />
            ))}
          </div>
          <GapRulerDemo />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Ruler className="size-4 text-orange-500" />
                Control Height Scale
              </div>
              <HeightRulerDemo />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <GitCompareArrows className="size-4 text-orange-500" />
                Radius Scale
              </div>
              <RadiusRulerDemo />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ListChecks className="size-4 text-orange-500" />
                Task Panel Width
              </div>
              <TaskWidthRulerDemo />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Link2 className="size-4 text-orange-500" />
                Tree Indentation
              </div>
              <TreeIndentRulerDemo />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Ruler className="size-4 text-orange-500" />
              Directional Shadow
            </div>
            <ShadowDirectionDemo />
          </div>
        </section>
      </main>
    </div>
  );
}
