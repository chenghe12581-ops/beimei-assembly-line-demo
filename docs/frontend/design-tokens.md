# Design Tokens

## Purpose

本文档定义北煤机拼装产线 Design System 的 token 归档、命名和当前运行桥接规则。

当前整理结果做四件事：

1. 将现有 token 原料整理到 `source/`。
2. 建立 raw token 到 semantic token 的命名映射。
3. 将基础组件契约整理到 `component/`。
4. 输出静态 build 产物，方便后续接入工具链。

当前不做全量 UI 替换，不机械替换现有 Tailwind class，也暂不引入正式 token build pipeline。

第二阶段已在 `src/styles/theme.css` 中建立 semantic CSS variables，并通过 Tailwind v4 `@theme inline` 暴露语义 token utilities。现有 Tailwind class 暂时保留，新组件和后续迁移可以开始使用 `ds-*` 语义 class。

## File Locations

```txt
design-tokens/
  README.md
  source/
    colors.tokens.json
    spacing.tokens.json
    radius.tokens.json
    typography.tokens.json
  semantic/
    semantic-tokens.json
  component/
    button.tokens.json
    input.tokens.json
    checkbox.tokens.json
    panel.tokens.json
    tree.tokens.json
    modal.tokens.json
  build/
    semantic-tokens.css
    component-tokens.css
    tokens.json
```

原始 Figma 导出仍保留在：

```txt
design token/
```

`design-tokens/source/` 是项目内归档副本，视为 raw token source。后续如果重新从 Figma 导出，应先更新 `design token/`，再同步到 `design-tokens/source/`。

## Phase 2 Runtime Bridge

第二阶段在 `src/styles/theme.css` 中建立两层桥接：

1. `:root` 中定义 `--ds-*` semantic CSS variables。
2. `@theme inline` 中映射 Tailwind v4 token utilities。

Ant Design 组件通过应用层 `ConfigProvider` 接入同一品牌语义，`colorPrimary` 对齐 `color.brand.primary`，避免 Checkbox、Tabs、Radio、Switch 等控件回退到 Ant Design 默认蓝色。

示例：

```css
:root {
  --ds-color-bg-page: #f8fafc;
  --ds-color-bg-surface: #ffffff;
  --ds-color-bg-viewport: #e4e4e4;
  --ds-color-bg-process-planning-panel: rgba(255, 255, 255, 0.82);
  --ds-color-bg-process-planning-toolbar: rgba(255, 255, 255, 0.72);
  --ds-color-bg-process-planning-tree-group: rgba(244, 244, 245, 0.70);
  --ds-color-bg-process-planning-tree-group-hover: rgba(228, 228, 231, 0.50);
  --ds-color-bg-process-planning-task-surface: rgba(255, 255, 255, 0.82);
  --ds-color-bg-process-planning-task-detail: rgba(244, 244, 245, 0.55);
  --ds-color-bg-process-planning-separator: rgba(212, 212, 216, 0.70);
  --ds-color-bg-production-list: #f8fafc;
  --ds-color-bg-production-list-header: #ffffff;
  --ds-color-bg-control-neutral: #f4f4f5;
  --ds-color-bg-control-disabled: var(--ds-color-bg-control-neutral);
  --ds-color-bg-segmented: var(--ds-color-bg-control-neutral);
  --ds-color-bg-tree-group-header: #ffffff;
  --ds-color-bg-tree-group-body: #f8fafc;
  --ds-color-text-primary: #0f172a;
  --ds-color-text-parameter-label: #52525b;
  --ds-color-icon-drag-handle: #d4d4d8;
  --ds-color-text-control: #3f3f46;
  --ds-color-text-control-strong: #18181b;
  --ds-color-text-control-muted: #71717a;
  --ds-color-text-control-disabled: #a1a1aa;
  --ds-color-text-structure-hidden: #d4d4d8;
  --ds-color-text-part-object: rgba(100, 116, 139, 0.80);
  --ds-font-size-toolbar-action: 12px;
  --ds-line-height-toolbar-action: 16px;
  --ds-font-weight-toolbar-action: 500;
  --ds-font-size-production-process-task: 12px;
  --ds-line-height-production-process-task: 16px;
  --ds-font-weight-production-process-task: 500;
  --ds-font-size-tooltip: 12px;
  --ds-line-height-tooltip: 16px;
  --ds-font-weight-tooltip: 300;
  --ds-color-border-default: #e4e4e7;
  --ds-color-border-process-planning-structure: rgba(228, 228, 231, 0.80);
  --ds-color-border-production-list: rgba(228, 228, 231, 0.80);
  --ds-color-border-tree-divider: rgba(228, 228, 231, 0.75);
  --ds-color-brand-primary: #ff6900;
  --ds-color-brand-primary-hover: #e85d00;
  --ds-color-brand-primary-text: #c2410c;
}

@theme inline {
  --color-ds-bg-page: var(--ds-color-bg-page);
  --color-ds-bg-viewport: var(--ds-color-bg-viewport);
  --color-ds-bg-process-planning-panel: var(--ds-color-bg-process-planning-panel);
  --color-ds-bg-process-planning-toolbar: var(--ds-color-bg-process-planning-toolbar);
  --color-ds-bg-process-planning-tree-group: var(--ds-color-bg-process-planning-tree-group);
  --color-ds-bg-process-planning-tree-group-hover: var(--ds-color-bg-process-planning-tree-group-hover);
  --color-ds-bg-process-planning-task-surface: var(--ds-color-bg-process-planning-task-surface);
  --color-ds-bg-process-planning-task-detail: var(--ds-color-bg-process-planning-task-detail);
  --color-ds-bg-process-planning-separator: var(--ds-color-bg-process-planning-separator);
  --color-ds-bg-production-list: var(--ds-color-bg-production-list);
  --color-ds-bg-production-list-header: var(--ds-color-bg-production-list-header);
  --color-ds-bg-production-execution-toolbar: var(--ds-color-bg-production-execution-toolbar);
  --color-ds-bg-control-neutral: var(--ds-color-bg-control-neutral);
  --color-ds-bg-control-disabled: var(--ds-color-bg-control-disabled);
  --color-ds-bg-segmented: var(--ds-color-bg-segmented);
  --color-ds-bg-tree-group-header: var(--ds-color-bg-tree-group-header);
  --color-ds-bg-tree-group-body: var(--ds-color-bg-tree-group-body);
  --color-ds-text-primary: var(--ds-color-text-primary);
  --color-ds-text-parameter-label: var(--ds-color-text-parameter-label);
  --color-ds-icon-drag-handle: var(--ds-color-icon-drag-handle);
  --color-ds-text-control: var(--ds-color-text-control);
  --color-ds-text-control-strong: var(--ds-color-text-control-strong);
  --color-ds-text-control-muted: var(--ds-color-text-control-muted);
  --color-ds-text-control-disabled: var(--ds-color-text-control-disabled);
  --color-ds-text-structure-hidden: var(--ds-color-text-structure-hidden);
  --color-ds-text-part-object: var(--ds-color-text-part-object);
  --color-ds-border-default: var(--ds-color-border-default);
  --color-ds-border-process-planning-structure: var(--ds-color-border-process-planning-structure);
  --color-ds-border-production-list: var(--ds-color-border-production-list);
  --color-ds-border-tree-divider: var(--ds-color-border-tree-divider);
  --color-ds-brand-primary: var(--ds-color-brand-primary);
  --color-ds-brand-primary-hover: var(--ds-color-brand-primary-hover);
  --color-ds-brand-primary-text: var(--ds-color-brand-primary-text);
}
```

可用 class 示例：

| Token | Tailwind utility examples |
| --- | --- |
| `--color-ds-bg-page` | `bg-ds-bg-page` |
| `--color-ds-bg-surface` | `bg-ds-bg-surface` |
| `--color-ds-bg-viewport` | `bg-ds-bg-viewport` |
| `--color-ds-bg-process-planning-panel` | `bg-ds-bg-process-planning-panel` |
| `--color-ds-bg-process-planning-toolbar` | `bg-ds-bg-process-planning-toolbar` |
| `--color-ds-bg-process-planning-tree-group` | `bg-ds-bg-process-planning-tree-group` |
| `--color-ds-bg-process-planning-tree-group-hover` | `bg-ds-bg-process-planning-tree-group-hover` |
| `--color-ds-bg-process-planning-task-surface` | `bg-ds-bg-process-planning-task-surface` |
| `--color-ds-bg-process-planning-task-detail` | `bg-ds-bg-process-planning-task-detail` |
| `--color-ds-bg-process-planning-separator` | `bg-ds-bg-process-planning-separator` |
| `--color-ds-bg-production-list` | `bg-ds-bg-production-list` |
| `--color-ds-bg-production-list-header` | `bg-ds-bg-production-list-header` |
| `--color-ds-bg-production-process-task` | `bg-ds-bg-production-process-task` |
| `--color-ds-bg-control-disabled` | `bg-ds-bg-control-disabled` |
| `--color-ds-bg-tree-group-header` | `bg-ds-bg-tree-group-header` |
| `--color-ds-bg-tree-group-body` | `bg-ds-bg-tree-group-body` |
| `--color-ds-text-primary` | `text-ds-text-primary` |
| `--color-ds-text-parameter-label` | `text-ds-text-parameter-label` |
| `--color-ds-icon-drag-handle` | `text-ds-icon-drag-handle` |
| `--color-ds-border-default` | `border-ds-border-default` |
| `--color-ds-border-process-planning-structure` | `border-ds-border-process-planning-structure` |
| `--color-ds-border-production-list` | `border-ds-border-production-list` |
| `--color-ds-border-tree-divider` | `border-ds-border-tree-divider` |
| `--color-ds-brand-primary` | `bg-ds-brand-primary`, `text-ds-brand-primary` |
| `--spacing-ds-150` | `p-ds-150`, `gap-ds-150` |
| `--spacing-ds-label-input-mini` | `gap-ds-label-input-mini` |
| `--radius-ds-lg` | `rounded-ds-lg` |
| `--text-ds-body` | `text-ds-body` |

第二阶段不要求立即替换旧 class。迁移原则是：

- 新建基础组件优先使用 `ds-*` class。
- 修改旧组件时，如果正在整理该组件，可以顺手替换同一组件内的底层颜色、spacing、radius。
- 不做全页面机械替换，避免视觉漂移。
- shadcn 原变量继续保留，直到基础组件迁移稳定后再决定是否合并。

`color.border.treeDivider` 专门表示树结构标题与其展开内容之间的分隔线，当前映射 `zinc.200 / 75%`。工艺规划零件结构标题和生产执行 WP 分组标题必须使用 `border-ds-border-tree-divider`，不要各自回退为 `border-zinc-200/75` 或白色边线。

`color.bg.productionList` 与 `color.bg.productionListHeader` 定义生产任务列表的实体中性底和白色标题层，避免透明背景叠加造成灰雾；`color.border.productionList` 与工艺参数详情外壳统一使用 `zinc.200 / 80%`，避免标题分隔线出现 slate 蓝灰偏色。`color.bg.treeGroupHeader` 与 `color.bg.treeGroupBody` 共同定义可展开树分组的表面层级：标题使用 `white`，内容使用 `slate.50`，外壳保持透明；生产执行 WP 工序行虽然复用工艺规划白色任务面，但不单独绘制 stroke。

生产执行 WP 工序条目使用半透明白色 `color.bg.productionProcessTask`，不叠加行级阴影和 stroke；视窗中的工位卡片和托盘卡片仍复用工艺规划任务条目的 `bg.processPlanningTaskSurface`、`border.processPlanningStructure`、`radius.md` 和 `shadow.sm`。状态颜色只用于左侧短条、状态圆点和 badge，避免状态边框与大面积阴影提高卡片在 3D 视窗中的视觉权重。

工艺规划样式 C 的结构灰统一使用 `zinc` 灰阶：`color.bg.processPlanningToolbar` 为白色 `72%`，`color.bg.processPlanningTreeGroup` 为 `zinc.100 / 70%`，hover 提升到 `90%`；右侧任务行使用白色 `82%`，详情区使用 `zinc.100 / 55%`。`color.bg.viewport` 固定为中性灰 `#E4E4E4`，工艺规划与生产执行的页面外壳和 3D 视窗都必须复用该 token，避免视窗出现蓝灰偏色。

## Naming Layers

Design System 使用三层命名：

```txt
raw token -> semantic token -> component token
```

### Raw Token

Raw token 保留设计工具导出的事实，不直接表达业务或 UI 语义。

示例：

```txt
raw.color.slate.900
raw.color.brand-RoboticsAi.600
raw.space.150
raw.radius.8
```

### Semantic Token

Semantic token 表达 UI 意义，是业务 UI 和基础组件应该优先引用的层。

示例：

```txt
color.bg.page
color.text.primary
color.border.default
color.brand.primary
color.status.danger
space.150
radius.lg
typography.body
```

### Component Token

Component token 表达具体组件规则，落在 `design-tokens/component/`。它们先作为组件契约和后续迁移依据，runtime CSS 汇总产物在 `design-tokens/build/component-tokens.css`。

示例：

```txt
input.height.sm
input.unitGap.md
panel.bg.default
modal.bg.glass
treeRow.radius.default
```

## Source Inventory

### Colors

来自：

```txt
design-tokens/source/colors.tokens.json
```

当前采用 `colors.tokens.json` 内的 `current` 作为主来源，`legacy` 作为历史兼容参考。

已识别色系：

```txt
white / black
brand-RoboticsAi
neutral / slate / gray / zinc / stone
red / amber / emerald / blue / teal
orange / green / yellow / cyan / sky / indigo / violet / purple / fuchsia / pink / rose
```

当前 UI 大量使用 `slate` 作为中性色，使用橙色作为主色。因此第一阶段做如下决策：

- 中性色主轴：`slate`
- 品牌主色：`color.brand.primary = #FF6900`
- 白底小字号品牌文字：`color.brand.primaryText = #C2410C`
- Tailwind `orange` 只作为历史兼容与 fallback，不作为主品牌命名来源
- 状态色使用 `red / amber / emerald / blue`
- 特征色暂时使用 `teal / red / blue` 表达打磨、焊接、装配基准

### Spacing

来自：

```txt
design-tokens/source/spacing.tokens.json
```

采用 4px scale，保留 2px 和 6px 作为细分值：

| Semantic | Raw | px | rem |
| --- | --- | ---: | ---: |
| `space.0` | `raw.space.0` | 0 | 0 |
| `space.025` | `raw.space.025` | 2 | 0.125 |
| `space.050` | `raw.space.050` | 4 | 0.25 |
| `space.075` | `raw.space.075` | 6 | 0.375 |
| `space.100` | `raw.space.100` | 8 | 0.5 |
| `space.treeIconTitleGap` | `raw.space.100` | 8 | 0.5 |
| `space.150` | `raw.space.150` | 12 | 0.75 |
| `space.200` | `raw.space.200` | 16 | 1 |
| `space.250` | `raw.space.250` | 20 | 1.25 |
| `space.300` | `raw.space.300` | 24 | 1.5 |
| `space.400` | `raw.space.400` | 32 | 2 |
| `space.500` | `raw.space.500` | 40 | 2.5 |
| `space.600` | `raw.space.600` | 48 | 3 |
| `space.800` | `raw.space.800` | 64 | 4 |
| `space.1000` | `raw.space.1000` | 80 | 5 |

`spacing.tokens.json` 中的 `aliases` 简写 spacing 映射如下：

| Default token | px | Semantic equivalent |
| --- | ---: | --- |
| `Spacing.xs` | 4 | `space.050` |
| `Spacing.sm` | 8 | `space.100` |
| `Spacing.md` | 12 | `space.150` |
| `Spacing.lg` | 16 | `space.200` |
| `Spacing.xl` | 20 | `space.250` |
| `Spacing.2xl` | 24 | `space.300` |
| `Spacing.3xl` | 32 | `space.400` |

### Radius

来自：

```txt
design-tokens/source/radius.tokens.json
```

第一阶段采用合并后的语义半径：

| Semantic | Raw source | px | Usage direction |
| --- | --- | ---: | --- |
| `radius.none` | `rounded-none` | 0 | 无圆角 |
| `radius.sm` | `Radius.sm` / `rounded-sm` | 4 | 小控件、树节点内层 |
| `radius.md` | `rounded-md` | 6 | 按钮、紧凑控件 |
| `radius.lg` | `Radius.md` / `rounded-lg` | 8 | 输入框、常规控件、密集玻璃弹窗外壳 |
| `radius.xl` | `Radius.lg` | 12 | 面板、灰底容器 |
| `radius.2xl` | `Radius.xl` | 16 | 宽松大面板、特殊展示弹窗 |
| `radius.full` | `rounded-full` | 9999 | badge、pill |

注意：`shadcn.tokens.json` 里还有 `radius = 10px`。当前 UI 高频使用 8px 和 12px，10px 暂不进入语义主 scale，保留为 raw token。

## Semantic Color Mapping

完整机器可读映射见：

```txt
design-tokens/semantic/semantic-tokens.json
```

核心映射如下。

### Background

| Semantic | Raw | Resolved | Use |
| --- | --- | --- | --- |
| `color.bg.page` | `slate.50` | `#F8FAFC` | 页面背景 |
| `color.bg.surface` | `white` | `#FFFFFF` | 普通表面、输入框 |
| `color.bg.subtle` | `slate.100` | `#F1F5F9` | 次级灰底区域 |
| `color.bg.controlNeutral` | `zinc.100` | `#F4F4F5` | 控件中性基础值，供禁用输入和分段未选中态派生 |
| `color.bg.controlDisabled` | `zinc.100` | `#F4F4F5` | 禁用输入控件填充 |
| `color.bg.segmented` | `zinc.100` | `#F4F4F5` | 分段控件未选中底色 |
| `color.bg.muted` | `slate.200` | `#E2E8F0` | 弱背景、低强调分层 |
| `color.bg.viewport` | custom neutral gray | `#E4E4E4` | 工艺规划、生产工作台、模型视图和视觉监控的统一视窗底色 |
| `color.bg.glass` | custom rgba | `rgba(255,255,255,0.72)` | 3D 视窗工具条、通用玻璃背景 |
| `color.bg.glass-modal` | `white` alpha 0.75 | `rgba(255,255,255,0.75)` | 全屏玻璃弹窗底色 |
| `color.bg.glass-modal-sidebar` | `white` alpha 0.45 | `rgba(255,255,255,0.45)` | 弹窗内左侧边栏/列表分区 |
| `color.bg.glass-float` | `white` alpha 0.80 | `rgba(255,255,255,0.80)` | 3D 视窗内玻璃浮层 |
| `color.bg.productionExecutionToolbar` | `white` alpha 0.36 | `rgba(255,255,255,0.36)` | 生产执行视窗顶部三组悬浮控制，独立于玻璃浮层 |
| `color.bg.sticky-overlap` | `neutral` alpha 0.50 | `rgba(250,250,250,0.50)` | 数据密集面板 sticky 标题遮挡内容时的半透明底色 |

### Text

| Semantic | Raw | Resolved | Use |
| --- | --- | --- | --- |
| `color.text.primary` | `slate.900` | `#0F172A` | 主标题、正文重点 |
| `color.text.secondary` | `slate.700` | `#334155` | 常规正文 |
| `color.text.muted` | `slate.500` | `#64748B` | 辅助说明 |
| `color.text.disabled` | `zinc.400` | `#A1A1AA` | 禁用文字、弱控件图标；工序电池序号单独使用 `slate.400` |
| `color.text.inverse` | `white` | `#FFFFFF` | 深色/品牌底文字 |

### Border

| Semantic | Raw | Resolved | Use |
| --- | --- | --- | --- |
| `color.border.subtle` | `zinc.100` | `#F4F4F5` | 极弱分割线 |
| `color.border.default` | `zinc.200` | `#E4E4E7` | 常规 stroke |
| `color.border.strong` | `zinc.300` | `#D4D4D8` | 强 stroke |
| `color.border.focus` | `brand-RoboticsAi.300` | `#FFD591` | focus / active stroke |
| `color.border.glass` | custom rgba | `rgba(255,255,255,0.68)` | 玻璃弹窗、浮层与 3D 工具条 stroke |

### Brand

| Semantic | Raw | Resolved | Use |
| --- | --- | --- | --- |
| `color.brand.primary` | `custom.brand.primary` | `#FF6900` | 主按钮、主操作 |
| `color.brand.primaryHover` | `custom.brand.primaryHover` | `#E85D00` | hover / active |
| `color.brand.primarySubtle` | `brand-RoboticsAi.50` | `#FFF7ED` | 品牌浅底 |
| `color.brand.primaryText` | `custom.brand.primaryText` | `#C2410C` | 白底小字号品牌文字 |

### Status

| Semantic | Raw | Resolved | Use |
| --- | --- | --- | --- |
| `color.status.danger` | `red.500` | `#EF4444` | 错误、异常 stroke |
| `color.status.dangerText` | `red.700` | `#B91C1C` | 错误文字 |
| `color.status.dangerSubtle` | `red.50` | `#FEF2F2` | 错误浅底 |
| `color.status.warning` | `amber.500` | `#F59E0B` | warning、脏状态 |
| `color.status.warningText` | `amber.700` | `#B45309` | warning 文字 |
| `color.status.warningSubtle` | `amber.50` | `#FFFBEB` | warning 浅底 |
| `color.status.success` | `emerald.500` | `#10B981` | 成功状态 |
| `color.status.successText` | `emerald.700` | `#047857` | 成功文字 |
| `color.status.successSubtle` | `emerald.50` | `#ECFDF5` | 成功浅底 |
| `color.status.info` | `blue.500` | `#3B82F6` | 信息状态 |
| `color.status.infoSubtle` | `blue.50` | `#EFF6FF` | 信息浅底 |

### Feature Colors

| Semantic | Raw | Resolved | Use |
| --- | --- | --- | --- |
| `color.feature.grind` | `teal.600` | `#0D9488` | 打磨相关标记 |
| `color.feature.weld` | `red.600` | `#DC2626` | 焊接相关标记 |
| `color.feature.datum` | `blue.600` | `#2563EB` | 装配基准相关标记 |

特征树条目文字不应直接使用 feature color。feature color 只用于必要图例、选中强调、可视化对象，不用于普通树节点标题。

## Semantic Typography Mapping

当前 UI 隐含文字层级如下，第一阶段将其命名固化：

全局中文字体优先使用 `Source Han Sans SC` / `Source Han Sans CN`（思源黑体），通过 `--font-family-ui` 统一继承到页面、按钮、输入框和组件库；未安装字体的环境按 `Noto Sans CJK SC`、`Microsoft YaHei`、系统无衬线字体顺序回退。模型视图零件编号和材质 / 重量摘要沿用思源黑体；等宽字体仅用于打印日志、坐标和技术 token。

| Semantic | Size | Line height | Weight | Use |
| --- | ---: | ---: | ---: | --- |
| `typography.pageTitle` | 16px | 24px | 600 | 页面标题 |
| `typography.panelTitle` | 14px | 20px | 600 | 面板标题 |
| `typography.sectionTitle` | 14px | 20px | 500 | 区块标题 |
| `typography.body` | 14px | 20px | 400 | 正文 |
| `typography.label` | 12px | 16px | 500 | 表单 label |
| `typography.toolbarAction` | 12px | 16px | 500 | 工艺规划工具栏按钮文字 |
| `typography.productionProcessTask` | 12px | 16px | 500 | 生产任务栏与新建任务预览的工序名称 |
| `typography.helper` | 11px | 16px | 400 | 辅助说明 |
| `typography.tooltip` | 12px | 16px | 300 | Ant Design Tooltip 悬停说明文字 |
| `typography.micro` | 10px | 14px | 500 | badge、极小标签 |
| `typography.inputSm` | 12px | 16px | 400 | 小输入框 |
| `typography.inputMd` | 14px | 20px | 400 | 常规输入框 |

后续规则：

- 不继续散落新增 `text-[11px]`，先判断是否属于 `helper`。
- 不在紧凑面板里使用 hero 级字号。
- 输入框字号由 `UnitNumberInput` 等基础组件决定。

## Component Token Candidates

组件 token 已落在 `design-tokens/component/`，当前先作为基础组件契约和后续样式收敛依据。

### Button

```txt
button.height.sm = height.control.sm
button.height.md = height.control.lg
button.radius.default = radius.lg
button.bg.primary = color.brand.primary
button.bg.primaryHover = color.brand.primaryHover
button.bg.primaryDisabled = neutral.100
button.text.primary = color.text.inverse
button.text.primaryDisabled = neutral.400
button.border.primaryDisabled = neutral.200
button.border.secondary = color.border.default
button.border.brandOutline = stroke.strong + color.brand.primary
button.text.brandOutline = color.brand.primary
button.icon.brandOutline = color.brand.primary
```

### UnitNumberInput

```txt
input.height.sm = 28px
input.height.md = 32px
input.height.lg = 36px
input.radius = radius.lg
input.border.default = color.border.default
input.border.focus = color.border.focus
input.border.invalid = color.status.danger
input.unitGap.sm = space.050
input.unitGap.md = space.075
```

### Checkbox

```txt
checkbox.size.sm = 16px
checkbox.size.md = 20px
checkbox.radius.default = radius.sm
checkbox.bg.unchecked = color.bg.surface
checkbox.bg.checked = color.brand.primary
checkbox.bg.indeterminate = color.brand.primary
checkbox.bg.disabled = color.bg.subtle
checkbox.bg.invalid = color.status.dangerSubtle
checkbox.border.unchecked = color.border.default
checkbox.border.checked = color.brand.primary
checkbox.border.focus = color.border.focus
checkbox.border.invalid = color.status.danger
checkbox.icon.checked = color.text.inverse
checkbox.shadow.checked = shadow.sm
```

### Panel

```txt
panel.bg.default = color.bg.surface
panel.bg.subtle = color.bg.subtle
panel.radius.default = radius.xl
panel.border.default = color.border.default
panel.padding.default = space.150
```

### Modal

```txt
modal.bg.default = color.bg.glass-modal
modal.bg.sidebar = color.bg.glass-modal-sidebar
modal.bg.float = color.bg.glass-float
modal.border.default = color.border.glass
modal.radius.default = radius.lg
modal.shadow.default = shadow.overlay
```

图纸管理、工艺参数设置等信息密集的玻璃弹窗外壳统一使用 `radius.lg`（8px）。`radius.xl` / `radius.2xl` 只用于更宽松的大面板或特殊展示弹窗，不作为默认弹窗半径。

### Tree Node Row

```txt
treeRow.height.default = 32px
treeRow.radius.default = radius.md
treeRow.text.default = color.text.secondary
treeRow.text.active = color.text.primary
treeRow.bg.hover = color.bg.subtle
treeRow.bg.active = color.brand.primarySubtle
```

## Rules For New UI

从下一阶段开始，新 UI 应遵守：

- 新颜色先查 semantic token，不直接新增 hex。
- 新 spacing 优先使用 `space.*` scale。
- 输入框、badge、modal、tree row 不应在复合组件里重新定义底层视觉规则。
- 业务组件可以决定布局和状态，不直接决定基础控件 stroke、height、radius。
- Component Lab 是组件视觉事实来源；新增基础组件必须先在组件库展示。

## Open Decisions

当前暂不解决以下问题：

- 是否建立正式 token 自动构建脚本。
- shadcn token 与 RobimWeld token 的长期主从关系。
- 暗色模式。

建议第二阶段先解决：

```txt
UnitNumberInput 基础组件化 + Component Lab 内复合组件替换
```

不要先大面积替换主页面。

## Global Interaction Tokens

以下 token 在基础组件收敛前先作为全局约束使用。它们已经写入：

```txt
design-tokens/semantic/semantic-tokens.json
design-tokens/build/semantic-tokens.css
src/styles/theme.css
src/app/ComponentLabPage.tsx
```

### Control Height

| Semantic | Value | Recommended use |
| --- | ---: | --- |
| `height.control.xs` | 24px | Toolbar tiny action / compact controls |
| `height.control.sm` | 28px | Button sm / compact toolbar button |
| `height.control.md` | 32px | Input md / TreeRow / default compact form control |
| `height.control.lg` | 36px | Button md-lg / prominent form control |
| `height.control.xl` | 40px | Large input / primary action in spacious layouts |

当前约定：

- `Button sm` 优先使用 `height.control.sm`。
- 常规 `Input md` 优先使用 `height.control.md`。
- 3D 视窗工具栏按钮在 `height.control.xs` 和 `height.control.sm` 中选择。
- `TreeNodeRow` 默认使用 `height.control.md`。

### Shadow

| Semantic | Value | Use |
| --- | --- | --- |
| `shadow.none` | `none` | 扁平控件、无浮层 |
| `shadow.sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` | 轻量按钮、chip、输入浮起 |
| `shadow.md` | `0 8px 24px rgba(15, 23, 42, 0.08)` | Card / Panel |
| `shadow.overlay` | `0 20px 60px rgba(15, 23, 42, 0.18)` | Modal / Dropdown / Overlay |
| `shadow.mainNav` | `0 8px 24px rgba(15, 23, 42, 0.07)` | 主导航容器 |
| `shadow.mainNavImmersive` | `0px 2px 8px 0px rgba(0, 0, 0, 0.12)` | 样式 C 深色主导航轻投影 |
| `shadow.processToolbar` | `none` | 样式 C 工艺规划顶部工具栏 |
| `shadow.mainNavActive` | `0 1px 2px rgba(15, 23, 42, 0.08)` | 主导航选中项 |
| `shadow.selected` | `0 0 0 2px rgba(250, 140, 22, 0.05), 0 0 12px rgba(250, 140, 22, 0.10)` | 点位、候选几何、工序展开内容中的当前选中行 |
| `shadow.scrollEdgeBottom` | `inset 0 -2px 3px -1px rgba(0, 0, 0, 0.04)` | 滚动容器底部结束/裁切提示 |
| `shadow.footerUp` | `0 -8px 20px rgba(15, 23, 42, 0.08)` | 任务列表下端遮挡条、工艺参数设置 footer |
| `shadow.stickyOverlap` | `0 2px 4px rgba(0, 0, 0, 0.06)` | sticky 标题行遮挡内容时的浮层阴影 |

实现约定：A/B 及默认强调型点位选中表面使用 `border-orange-200 bg-white shadow-selected ring-1 ring-inset ring-orange-200`。适用范围包括结果点位行、安全点卡片、焊缝段/候选几何行、J 轴输入行；树节点、主导航、Tab、按钮等非点位选中态不复用该阴影，避免层级过重。

样式 C 的右侧详情区使用更轻的点位选中表面：`border-ds-border-default bg-white`，不叠加橙色 ring/shadow。当前适用范围为样式 C 的结果点位行、路径点位中的安全点/结果点位行和 J 轴输入行；独立安全点配置浮窗里的安全点卡片不复用该变体，除非单独创建样式 C 安全点卡片变体。

实现约定：滚动容器底部统一通过 `ScrollPanelEdge` 组件输出 `.ds-scroll-edge-bottom` helper。该 helper 只提供 `position:absolute`、`height:3px` 与 `shadow.scrollEdgeBottom`，不携带背景色，不应作为遮挡条使用。

主导航统一使用 `.ds-main-nav`、`.ds-main-nav-tabs`、`.ds-main-nav-tab-active`，样式 C 深色主导航使用 `.ds-main-nav-immersive` 承接轻量下投影；样式 C 工艺规划顶部工具栏使用 `.ds-process-toolbar`，不叠加阴影。不要在页面内继续手写导航或工具栏阴影。

当前页面 chrome 高度方案：

| Layer | Height | Notes |
| --- | ---: | --- |
| 主导航外层占位 | 84px | 页面顶层留白与导航垂直居中 |
| 主导航 pill 容器 | 56px | 产品级主控，视觉高度应高于内容 context row |
| 主导航 tab 容器 padding/gap | 6px / 6px | 灰色 pill 内部呼吸感 |
| 主导航 tab | 36px | pill 内选项高度 |
| 主导航 tab 字号 | 15px | 比内容面板标题略轻，但不低于普通正文感知 |
| 内容区面包屑/context row | 44px | 轻量上下文条，低于主导航，避免与主导航等重 |
| 内容面板 heading | 48px | 三列面板标题行 |

上一版可回退高度方案：

| Layer | Height |
| --- | ---: |
| 主导航外层占位 | 76px |
| 主导航 pill 容器 | 48px |
| 主导航 tab 容器 padding/gap | 4px / 4px |
| 主导航 tab | 32px |
| 主导航 tab 字号 | 14px |
| 内容区面包屑/context row | 56px |
| 内容面板 heading | 48px |

工艺参数弹窗内容卡片统一使用 `.ds-parameter-card`。该卡片使用白色半透明背景、12px 圆角、上下 12px / 左右 16px padding，不使用 stroke 和浮起阴影；需要更紧凑时叠加 `.ds-parameter-card-sm`。灰色弱底只用于卡片内部的二级分区，使用 `.ds-parameter-card-surface`。参数卡片标题到主要内容控件的 `title-content gap` 使用 `.ds-parameter-card-title-stack`，`gap = ds-200 / 16px`。样式 C 的工艺参数设置弹窗右侧内容滚动区使用 `bg-white/50`，降低卡片间负形透出的灰底对比，保留卡片结构和内容区 padding。

### Blur

| Semantic | Value | Use |
| --- | --- | --- |
| `blur.stickyOverlap` | `24px` | sticky 标题行遮挡内容时的背景模糊 |

### Stroke

| Semantic | Value | Use |
| --- | ---: | --- |
| `stroke.default` | 1px | 默认 border / control stroke |
| `stroke.strong` | 2px | 强调描边、图形选中态、可视化线条 |

### Motion

Motion 当前不是重点，但需要先约束，不让组件各自发挥。

| Semantic | Value | Source | Use |
| --- | --- | --- | --- |
| `motion.duration.fast` | 100ms | global | 按钮 hover、短反馈 |
| `motion.duration.normal` | 200ms | global | 下拉、弹窗、折叠展开 |
| `motion.easing.standard` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | Ant Design ease-in-out family | 常规状态切换 |
| `motion.easing.emphasized` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Ant Design ease-out family | 弹窗/浮层出现 |

后续如果要做更完整的 motion system，再单独补 design doc；目前只允许基础组件引用以上四个 motion token。
