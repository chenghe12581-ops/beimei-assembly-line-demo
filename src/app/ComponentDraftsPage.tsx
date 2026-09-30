import { AlertTriangle, ArrowLeft, Boxes, Clock3, Layers3, ListTree, Move3D, PanelRight, Sparkles } from 'lucide-react';
import { ComponentDraftOriginalDemos } from './ComponentLabPage';

const draftGroups = [
  {
    title: '旧强调态点位 / 安全点',
    status: '迁出主 Lab',
    icon: Move3D,
    description: '旧白底橙色 stroke、ring、shadow 的点位选中态只作为历史对照留档，不再出现在交互组件当前态目录。',
    items: [
      '点位信息单行 xyz 旧强调态',
      '点位信息 xyz + rpy 旧强调态',
      '工艺安全点浮窗内旧强调态安全点卡片',
    ],
  },
  {
    title: '抓取参数旧过程稿',
    status: '迁出主 Lab',
    icon: PanelRight,
    description: '旧三列磁铁卡片和齿轮参数浮窗保留为过程稿；当前 Component Lab 只展示样式 C 行卡片。',
    items: [
      '抓具类型 + 三列磁铁校验区',
      '磁铁名称右侧齿轮入口',
      '3D 视窗内左磁铁参数设置浮窗',
    ],
  },
  {
    title: '样式 A/B 工艺任务卡片',
    status: '过程稿',
    icon: ListTree,
    description: '完整“任务卡片 + 卡片内展开配置”的 A/B 跑通形态不再在交互组件页完整铺开，只保留作交互路径追溯。',
    items: [
      '抓取 / 放置 / 打磨完整大卡片',
      '装配定位 / 翻面压紧完整大卡片',
      '定位焊扫描 / 定位焊完整大卡片',
    ],
  },
  {
    title: '样式 D 圆角玻璃浮层',
    status: '历史分支',
    icon: Layers3,
    description: '样式 D 继续作为圆角玻璃浮层探索留档；当前样式 C 主线使用更克制的直角侧栏和低强调细节。',
    items: [
      '旧圆角工艺规划左侧结构树',
      '旧圆角右侧任务列表面板',
      '旧视窗内圆角应用变体',
    ],
  },
];

const removalRows = [
  ['主 Component Lab', '移走旧橙色强调态完整组件', '只保留样式 C 当前组件，避免当前态与历史态混在一起。'],
  ['工艺执行 / 点位信息', '移走 xyz、xyz+rpy 旧强调态示例', '保留样式 C 路径点位单一卡片，减少同类点位重复。'],
  ['工艺执行 / 工艺安全点', '移走旧强调态安全点卡片', '保留当前浮窗里的低调卡片变体。'],
  ['工艺执行 / 抓取参数', '移走旧三列磁铁与齿轮浮窗', '保留样式 C 磁铁行卡片。'],
  ['工艺执行 / 工艺任务面板', '移走七套完整大面板平铺', '改为当前样式 C 参数示例 + 覆盖矩阵。'],
];

export function ComponentDraftsPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold">
              <Clock3 className="size-4 text-slate-500" />
              Component Lab 过程稿
            </div>
            <div className="mt-1 text-xs text-slate-400">/component-drafts</div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/component-lab" className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-ds-brand-primary-text hover:bg-orange-100">
              <ArrowLeft className="size-3.5" />
              返回当前组件库
            </a>
            <a href="/" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              返回主页面
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section className="rounded-xl bg-white p-5 shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Sparkles className="size-4 text-orange-500" />
                主 Lab 只保留样式 C 当前态
              </div>
              <div className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
                这里承接从交互组件页移出的旧强调态、A/B 完整卡片、样式 D 圆角浮层和重复过程稿。过程稿用于追溯设计演进，不作为当前组件实现依据。
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
              当前实现来源：样式 C 组件库 /component-lab
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {draftGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-100">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{group.title}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{group.description}</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-ds-brand-primary-text">
                    {group.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <Boxes className="size-3.5 text-slate-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <ComponentDraftOriginalDemos />

        <section className="rounded-xl bg-white p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-100">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle className="size-4 text-orange-500" />
            从主 Component Lab 移走的内容
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <div className="grid grid-cols-[160px_220px_minmax(0,1fr)] bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
              <div>位置</div>
              <div>处理</div>
              <div>原因</div>
            </div>
            {removalRows.map(([scope, action, reason]) => (
              <div key={`${scope}-${action}`} className="grid grid-cols-[160px_220px_minmax(0,1fr)] border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
                <div className="font-medium text-slate-700">{scope}</div>
                <div>{action}</div>
                <div className="text-slate-500">{reason}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
