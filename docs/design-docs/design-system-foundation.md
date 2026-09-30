# Design System Foundation

## Goal

建立一个可维护的 Design System，让当前北煤机拼装产线 demo 的 UI 规则从“页面里散落的 Tailwind class”逐步迁移为“token + 基础组件 + 复合组件 + 组件库可视化管理”。

本设计文档只定义方案，不直接要求一次性重构所有代码。

## Current Findings

当前项目已经具备 Design System 的雏形：

- 有组件管理页：`src/app/ComponentLabPage.tsx`
- 有基础 UI：`src/app/components/ui/`
- 有 design token 原料：`design token/`
- 有初步前端规范文档：`docs/frontend/`

但当前仍存在几个断点：

- `design token/` 中的 token 仍是 zip 文件，未进入源码运行时。
- 主页面大量直接写 Tailwind class。
- `src/styles/theme.css` 的 shadcn token 与 RobimWeld / raw color tokens 没有语义映射。
- 组件库展示了样式，但很多组件还没有成为真实可复用组件。
- 主页面和组件库之间仍有重复实现。

## Source Token Inventory

现有 token 文件：

```txt
design token/
  DesignTokens.zip
    Pixels.tokens.json
    Rem.tokens.json

  RobimWeld _ Spacing & Radius.zip
    Default.tokens.json

  border radii.zip
    shadcn.tokens.json

  raw colors.zip
    New.tokens.json
    Old.tokens.json
```

已识别 token：

- Spacing：`0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`
- Radius：`4, 6, 8, 10, 12, 16, 9999`
- Brand：`brand-RoboticsAi.600 = #FA8C16`
- Raw colors：`slate / neutral / gray / orange / red / blue / emerald / teal / amber ...`

## Token Strategy

不要直接在业务组件中使用 raw token 名称。Design System 应分三层：

```txt
raw token
  -> semantic token
    -> component token
```

### Raw Tokens

Raw tokens 来自 Figma / zip 文件，保持原始色阶和数值。

示例：

```txt
raw.color.slate.400
raw.color.brandRoboticsAi.600
raw.space.150
raw.radius.8
```

### Semantic Tokens

Semantic tokens 描述 UI 意义。

建议第一批建立：

```txt
color.bg.page
color.bg.surface
color.bg.subtle
color.bg.glass

color.text.primary
color.text.secondary
color.text.muted
color.text.disabled
color.text.inverse

color.border.default
color.border.subtle
color.border.strong
color.border.glass
color.border.focus

color.brand.primary
color.brand.primaryHover
color.brand.primarySubtle
color.brand.primaryText

color.status.danger
color.status.dangerSubtle
color.status.success
color.status.successSubtle
color.status.warning
color.status.warningSubtle

color.feature.grind
color.feature.weld
color.feature.datum
```

### Component Tokens

Component tokens 描述具体组件内的规则。

示例：

```txt
input.height.sm
input.height.md
input.height.lg
input.paddingX.sm
input.unitGap.sm
input.border.default
input.border.invalid

panel.bg.default
panel.radius.default
panel.padding.default

modal.bg.glass
modal.border.glass
modal.radius.default
```

## Initial Token Mapping

建议先采用以下映射，不立即改变视觉：

```txt
color.brand.primary       -> brand-RoboticsAi.600 (#FA8C16)
color.brand.primarySubtle -> brand-RoboticsAi.50  (#FFF7ED)
color.brand.primaryText   -> orange.700 / brand-RoboticsAi.700

color.bg.page             -> slate.100 or slate.50
color.bg.surface          -> white
color.bg.subtle           -> slate.50
color.bg.glass            -> white with opacity

color.text.primary        -> slate.900
color.text.secondary      -> slate.700
color.text.muted          -> slate.400
color.text.disabled       -> slate.400

color.border.default      -> slate.200
color.border.subtle       -> slate.100
color.border.focus        -> brand-RoboticsAi.300 or orange.300
color.border.glass        -> white/50

color.status.danger       -> red.500
color.status.dangerSubtle -> red.50
color.status.success      -> emerald.500
color.status.successSubtle -> emerald.50
```

需要决策：

- 中性色最终选 `slate` 还是 `neutral`。
- 主色最终使用 `brand-RoboticsAi` 色阶还是 Tailwind `orange` 色阶。
- 玻璃弹窗的半透明色是否纳入 token。

建议：

- 中性色继续用 `slate`，因为当前项目已大量使用 slate。
- 主色以 `brand-RoboticsAi.600 = #FA8C16` 为设计事实来源，Tailwind orange 只作为 fallback。
- 玻璃弹窗应抽成语义 token。

## Spacing Strategy

当前源码与 token 基本都遵循 4px 系。

建议采用：

```txt
space.0   = 0
space.025 = 2
space.050 = 4
space.075 = 6
space.100 = 8
space.150 = 12
space.200 = 16
space.250 = 20
space.300 = 24
space.400 = 32
space.500 = 40
space.600 = 48
space.800 = 64
```

语义化布局 token：

```txt
layout.page.maxWidth
layout.componentLab.maxWidth
layout.processPanel.demoWidth
layout.viewport.logCollapsedHeight
layout.viewport.logExpandedMinHeight
```

## Radius Strategy

当前高频：

- `rounded-lg`
- `rounded-xl`
- `rounded-md`
- `rounded-full`

建议映射：

```txt
radius.none = 0
radius.sm   = 4
radius.md   = 6
radius.lg   = 8
radius.xl   = 12
radius.2xl  = 16
radius.full = 9999
```

组件语义：

```txt
input.radius      = radius.lg   // 8px
button.radius     = radius.md   // 6px or 8px,待确认
badge.radius      = radius.full
panel.radius      = radius.xl   // 12px
modal.radius      = radius.2xl or radius.xl
treeRow.radius    = radius.md
```

## Typography Strategy

当前隐含层级：

```txt
pageTitle    -> text-base / font-semibold
sectionTitle -> text-sm / font-medium
body         -> text-sm / font-normal
label        -> text-xs / text-slate-400
helper       -> text-[11px]
badge        -> text-[10px] or text-[11px]
input.sm     -> text-xs
input.md     -> text-sm
```

建议 token：

```txt
typography.pageTitle
typography.panelTitle
typography.sectionTitle
typography.body
typography.label
typography.helper
typography.micro
typography.badge
typography.input.sm
typography.input.md
typography.input.lg
```

规则：

- 不要让 `text-[11px]` 继续散落，应由 helper/micro token 表达。
- 输入框字号由 `UnitNumberInput` 等基础组件决定。
- 业务面板标题使用 `sectionTitle`，不要随意使用 hero 级字号。

## Foundation Components

第一批基础组件建议：

```txt
Button
Badge
Panel
Card
UnitNumberInput
RangeInput
PercentSlider
MultiSelect
ObjectMultiSelect
AxisUnitInputRow
PointInfoRow
JointValueRow
StatusBadge
DirtyMark
Tooltip / WarningTip
ModalShell
Toast
Switch
SegmentedControl
TreeNodeRow
```

当前优先级最高：

1. `UnitNumberInput`
2. `ObjectMultiSelect`
3. `ProcessStepPanel`
4. `TreeNodeRow`
5. `ModalShell`

## Composite Components

复合组件应引用基础组件，不直接写底层视觉规则。

建议第二批复合组件：

```txt
ProcessStepPanel
PickProcessPanel
PlaceProcessPanel
GrindProcessPanel
AssemblyLocatePanel
TurnoverClampPanel
WeldScanPanel
WeldPanel
ProcessParameterSection
FeatureDetachedTree
ViewportToolbar
ViewportLogPanel
```

示例规则：

- 复合组件可以决定 `UnitNumberInput` 使用 `sm/md/lg` 和 `left/right`。
- 复合组件不应自己定义 input height、unit position、border color。
- 复合组件可以决定布局、label、业务状态、按钮文案。

## Component Lab Role

`src/app/ComponentLabPage.tsx` 是当前 Design System 的可视化管理入口。

要求：

- 所有基础组件必须在组件库中展示。
- 所有复合组件变体必须在组件库中可见。
- 交互组件页保留分栏和平铺两种视图。
- 平铺用于总览，分栏用于精调。
- 每个组件至少展示默认、异常、置灰状态。

## Proposed File Structure

不要立即一次性重构，但目标结构如下：

```txt
src/app/design-system/
  tokens/
    raw.ts
    semantic.ts
    component.ts
  components/
    UnitNumberInput.tsx
    ObjectMultiSelect.tsx
    StatusBadge.tsx
    Panel.tsx
    ModalShell.tsx
  composite/
    ProcessStepPanel.tsx
    TreeNodeRow.tsx
```

如果暂时不新建目录，也可以先放在：

```txt
src/app/components/
```

但必须避免继续只写在页面文件里。

## Migration Plan

### Phase 1: Token Documentation and CSS Variables

目标：

- 把 zip token 转为项目内可读源。
- 建立 semantic token 文档。
- 在 `src/styles/theme.css` 中增加最小 CSS variables。

不做：

- 不大规模替换页面 class。
- 不改变视觉。

### Phase 2: Foundation Inputs

目标：

- 将组件库中的 `UnitNumberInput` 提升为真实基础组件。
- 替换组件库中的复合组件输入框。
- 再逐步替换主页面中的输入框。

验收：

- 点位、关节、轴向、范围、slider 右侧输入都引用同一个基础输入框。
- 主页面视觉不明显漂移。

### Phase 3: Selection and Panels

目标：

- 抽 `ObjectMultiSelect`。
- 抽 `ProcessStepPanel` 母组件。
- 工序面板变体只传配置，不复制结构。

验收：

- 抓取、放置、打磨、装配定位、翻面压紧、定位焊扫描、定位焊都可用同一工序面板框架表达。

### Phase 4: Tree and Modal System

目标：

- 抽 `TreeNodeRow`。
- 抽 `ModalShell` / `ConfirmModal`。
- 抽 `StatusBadge` / `CountBadge`。

验收：

- 项目管理树、工艺规划树、独立特征树使用统一行组件。
- 弹窗视觉全部走同一个 shell。

### Phase 5: Style Debt Cleanup

目标：

- 清理硬编码 hex。
- 收敛任意宽高值。
- 收敛状态色和 feature 色。
- 给 layout 宽度建立语义 token。

验收：

- 新增 UI 不再直接写未登记的颜色。
- 组件库与主页面视觉一致。

## Risks

- 直接大规模替换 Tailwind class 可能造成视觉漂移。
- 主页面文件太大，直接拆分可能影响 demo 稳定性。
- token 文件来自 Figma zip，命名可能需要清洗。
- shadcn theme 与 RobimWeld token 需要明确映射，否则会出现双 token 系统。

## Non-goals

当前不做：

- 不建立完整 token build pipeline。
- 不一次性拆分 `BeimeiAssemblyLinePage.tsx`。
- 不引入新的状态管理方案。
- 不做暗色模式。
- 不做完整视觉回归测试。

## Acceptance Criteria

- [ ] 有明确 token 命名策略。
- [ ] 有基础组件清单。
- [ ] 有复合组件迁移计划。
- [ ] 有组件库治理规则。
- [ ] 有分阶段落地顺序。
- [ ] 不要求一次性重构当前 demo。

## First Recommended Implementation Task

建议第一项落地任务：

```txt
将 ComponentLab 中的 UnitNumberInput 提升为真实基础组件，
并只替换 ComponentLab 内的复合组件；
确认后再替换 BeimeiAssemblyLinePage 中的对应输入框。
```

原因：

- 范围小。
- 风险低。
- 当前不一致最明显。
- 能快速验证 Design System 的工作方式。
