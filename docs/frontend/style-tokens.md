# Style Tokens

## Neutral Colors

- `slate-900`：一级文字、强标题。
- `slate-800`：重要标题、参数组标题。
- `slate-700`：正文输入值、常规标题。
- `slate-600`：按钮文字、次级正文。
- `slate-500`：普通说明、弱按钮。
- `slate-400`：表单 label、辅助信息。
- `slate-300`：输入框内单位、弱图标、switch 关闭态。
- `zinc-200`：输入框边框与常规中性 stroke，避免表单控件出现 slate 蓝灰偏色。
- `slate-200`：弱背景、低强调分层和部分旧组件过渡色；新建输入框 stroke 不再使用它。
- `slate-100`：浅底按钮、页面细分层；禁用输入控件使用独立的 `zinc-100` token。
- `slate-50`：局部灰色区域背景。

分段控件未选中项使用独立的 `color.bg.segmented` / `zinc-100 / #F4F4F5`，避免 `slate-100` 的蓝灰感；它与禁用输入框共享同一个 `color.bg.control.neutral` 基础值，但保留独立语义 token。

百分比和关节角 Slider 的非激活视觉使用独立的 Zinc token：轨道为 `zinc-200 / #E4E4E7`，刻度线为 `zinc-300 / #D4D4D8`，刻度文字为 `zinc-400 / #A1A1AA`。switch 关闭态仍使用 `slate-300 / #CBD5E1`，不与 Slider 混用。

工序任务电池的拖拽抓手使用独立的 `text-ds-icon-drag-handle`，当前值为 `zinc-300 / #D4D4D8`。抓手是排序 affordance，不属于禁用文字，不复用 `text-ds-text-disabled`。

参数 label 统一使用 `text-ds-text-parameter-label`，当前值为 `zinc-600 / #52525B`。紧凑特征提取浮窗的 `ds-label-input-mini-label`、新增任务弹窗的工序类型和对象选择 label 同样使用该 token。该 token 只表达参数、点位和参数分组标题，不改变任务电池的业务文字色；后续只需调整 token 的值即可统一更新这些 label。

禁用输入控件统一使用 `bg-ds-bg-control-disabled`，当前值为 `zinc-100 / #F4F4F5`。它只表达控件不可编辑时的填充，不改变普通局部灰底的 `color.bg.subtle`。

selection 控件的 placeholder 使用 `font-normal / 400`，尺寸继续沿用控件自身的 `11px` 或 `12px`；已选值和下拉选项不跟随 placeholder 降重，保留各自的内容层级。

工具栏按钮与样式 C 工序任务电池的默认文字、icon 共用 `text-ds-text-control`，当前值为 `zinc-700 / #3F3F46`；icon 继承按钮的 `currentColor`，因此默认态与文字同色。hover / 激活使用 `text-ds-text-control-strong`（`zinc-900 / #18181B`），弱化入口使用 `text-ds-text-control-muted`（`zinc-500 / #71717A`），禁用使用 `text-ds-text-control-disabled`（`zinc-400 / #A1A1AA`）。选中任务、打开工具和异常操作仍使用各自的橙色或状态色，不并入中性控件 token。

生产执行视窗顶部的生产监控 / 模型视图 / 视觉监控、执行控制和托盘管理三组悬浮控件使用专用 `bg-ds-bg-production-execution-toolbar`，当前为白色 `36%`；它比 `bg-ds-bg-glass-float` 更透明，只服务于顶部控制，不改变焊缝特征提取等玻璃浮窗的既有层级。

工序电池编号使用 `12px / 400`，继续继承全局 UI 字体，通过 `.ds-process-index` 向左 `2px` 处理数字与中文工序名称的横向对齐，不单独切换为等宽字体。

工序电池标题文字使用 `.ds-process-title-text` 包裹，并保留 `1px` 底部 padding，用于修正思源黑体中文标题的视觉基线。

## Structure And Task Text

结构树、项目管理树和生产任务条目不按页面分别选色，而按文本语义复用同一组 `ds` token；样式 C 工序任务电池的主文字和工序 icon 使用上方控件文字 token：

- 主名称（项目、装配体、任务、工序）：`text-ds-text-secondary`；工艺规划结构树中的模型零件名称使用 `font-medium / 500`，特征对象名称保持 `font-normal / 400`。
- 样式 C 工序任务电池主名称与工序 icon：`text-ds-text-control`；选中态使用 `text-ds-brand-primary-text`。
- 辅助信息（数量、进度、说明）：`text-ds-text-muted`；生产执行 WP 条目的零件对象使用专用 `text-ds-text-part-object`，值为 Slate 500 的 80% 透明度，保留冷灰层次但压低蓝感。
- 样式 C 工序任务电池序号：`text-slate-400`，作为蓝灰辅助信息层，不复用控件禁用色。
- 展开控件、弱图标和禁用文字：`text-ds-text-disabled`（当前 `zinc-400 / #A1A1AA`）。
- 结构树隐藏项名称和隐藏态眼睛 icon 使用独立的 `text-ds-text-structure-hidden`，当前为 `zinc-300 / #D4D4D8`；它只表达“对象已隐藏”，不替代普通 disabled 控件的 `zinc-400`。
- 选中态：`text-ds-brand-primary-text`，不使用 zinc 或 neutral 文字色替代。
- `zinc` 主要用于工作面/分组的背景和分隔层，不能作为普通业务名称的局部主色。
- `neutral` 不用于普通任务文字；禁用项仍使用语义 disabled token，禁用背景可以继续使用中性灰底。

生产执行当前的 zinc/slate 视觉作为跨页面基线，页面实现必须引用上述语义 class，不直接新增 `text-slate-*`、`text-zinc-*` 或 `text-neutral-*` 的业务条目颜色；Slate 只通过已登记的语义 token 进入业务条目。

## Theme Colors

- `color.brand.primary / #FF6900`：主操作、开启态 switch、slider active 轨道和 tab 下划线。
- `color.brand.primaryText / #C2410C`：白底上的小字号选中项文字，保证可读性。
- `color.brand.primaryHover / #E85D00`：主操作 hover。
- `orange-50`：选中项浅底、主色弱反馈。
- `orange-700`：历史兼容色，不作为新的品牌文字 token。
- `orange-200`：选中 chip / 分段按钮 stroke。
- `red-500`：异常提示文字、危险操作。
- `red-300`：异常输入框、异常选项 stroke。
- `red-50`：异常输入框浅底。
- `emerald-500`：成功 toast、完成状态。

## Borders

- 默认输入框：`1px color.border.default`（当前 `zinc-200 / #E4E4E7`）。
- focus：`orange-300`。
- invalid：`red-300`。
- disabled：`color.border.default` border + `zinc-100` background（`bg-ds-bg-control-disabled`）。

## Radius

- 输入框：`8px`。
- 小型卡片/参数组：`12px`。
- 弹窗：使用磨砂背景与白色 stroke，避免重灰色 stroke。
