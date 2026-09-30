# Component Demo Animation Notes

`/component-demo` 是纯展示页面，不替代 `/component-lab` 的组件治理能力。该页面允许为了展示节奏加入轻量动效，但动效必须可暂停、可重启，并且不能破坏控件本身的交互。

## Global Motion Control

- 页面左下角按钮控制全局动效状态。
- `globalPlaying=false` 时，所有接入全局动效的 bento 必须暂停自动变化。
- `restartSignal` 变化时，接入全局动效的 bento 应回到初始演示状态。
- 页面根节点通过 `--component-demo-motion-play-state` 控制 CSS keyframe 的 `animation-play-state`。

## Intro Header And Language Toggle

- 页面顶部保留一块轻量 intro header，用于说明 `/component-demo` 的定位：它可以作为 component lab 展示界面风格探索，但主要 works as visual guideline / UI foundation，用来引导后续组件实现中的视觉语言、状态表达和交互秩序。
- 标题、说明文字和元信息标签支持中文与英文切换，默认中文。
- 中英切换只影响 intro header 文案，不影响下方 bento demo 的组件状态、自动动效或交互。
- 文案应强调 solo designer 语境下通过 lab 形式沉淀出的视觉方向和实现基线，避免写得过于项目具象，也不要承诺为完整 production-ready component library。

## Bento Layout Rules

- `/component-demo` 中每个 bento 默认是单控件展示容器，控件必须在 bento 内上下左右居中。
- 只有面板、列表、树、视窗等本身需要铺满阅读面积的组件，才可以偏离默认居中规则。
- 居中应由 bento 内部 wrapper 负责，避免靠控件自身尺寸或局部 padding 碰巧对齐。
- 第四行第 1/2 个与第五行第 1 个这类 6 栅格宽度的大控件 bento，统一使用 `CENTERED_BENTO_CONTENT_CLASS` + `WIDE_BENTO_CONTENT_CLASS`；内部有效宽度为 `max-w-[520px]`，保证左右留白一致。
- 点位类 bento 应优先复用 `ProcessPosePointInfoRow`，收起态做数值回显，展开态提供 `XYZ/RPY` 六个输入框。
- `ProcessPosePointInfoRow` 展开/收起必须使用缓动：外层位移、summary 退场和 caret 旋转约 `240–280ms`，下方六输入框完全展开约 `360ms`，内容进入延迟约 `75ms`，避免展开态和收起态瞬间换位。
- 点位类 demo bento 应接入页面自动动效：默认收起停留约 `1400ms` 后展开，展开停留约 `2600ms` 后收起；用户点击展开按钮或编辑任一输入框后停止该 bento 自动动效，左下角“重新开始”恢复。

## AnimatedGripperSliderBento

- 控件位置：`src/app/component-demo/AnimatedGripperSliderBento.tsx`
- 动画目标：抓手行程从 `0%` 到 `100%` 再回到 `0%` 往返展示。
- 关键帧：
  - `t=0ms`：行程 `0%`，轨道填充为 `0%`，手柄位于最左侧，整数回显 `0%`。
  - `t=900ms`：行程约 `50%`，轨道填充、手柄和整数回显同步过半。
  - `t=1200ms`：行程约 `75%`，作为页面内 tab / segmented 节奏参考。
  - `t=1800ms`：行程 `100%`，手柄到最右侧，整数回显 `100%`。
  - `t=2700ms`：行程约 `50%`，从右侧返回中点。
  - `t=3600ms`：行程回到 `0%`，下一轮循环开始。
- 关键帧间隔：完整往返周期为 `3600ms`；`0% → 100%` 为 `1800ms`，`100% → 0%` 为 `1800ms`。
- 曲线：使用 half-cosine 波形 `0.5 - cos(progress * 2π) / 2`，避免线性往返的机械突兀感。
- 回显：右侧百分比为同一数值的整数回显，必须与轨道、滑块同帧同步。
- 手动接管：用户 `pointerdown` 或拖拽隐藏 `range` 后，本 bento 停止自动动画，并保留用户设置值。
- 重启行为：点击页面左下角“重新开始”后，`restartSignal` 重置本 bento 的手动接管状态，重新进入自动往返。

## CheckboxStatesBento

- 控件位置：`src/app/component-demo/CheckboxStatesBento.tsx`
- 动画目标：四个 checkbox 形成走马灯式状态轮转。
- 状态序列：初始为 `default → hover → checked → indeterminate`。
- 关键帧：
  - `t=0ms`：四个槽位状态为 `default / hover / checked / indeterminate`。
  - `t=1350ms`：状态向右传递一格，变为 `indeterminate / default / hover / checked`。
  - `t=2700ms`：继续向右传递，变为 `checked / indeterminate / default / hover`。
  - `t=4050ms`：继续向右传递，变为 `hover / checked / indeterminate / default`。
  - `t=5400ms`：回到初始状态，下一轮循环开始。
- 关键帧间隔：每 `1350ms` 触发一次状态传递；四步完整循环约 `5400ms`。
- 轮转规则：每个 checkbox 切换成左侧 checkbox 的状态，最左侧 checkbox 的状态传递给最右侧，形成向右传递。
- Smart animation：四个槽位固定不动，同一 checkbox 在 `default / hover / checked / indeterminate` 变体之间过渡；背景、边框、阴影、颜色和 icon 显隐使用 `700ms` 过渡。
- 手动接管：用户点击任意可点 checkbox 后，本 bento 停止自动轮转，并保留用户介入后的状态。
- 重启行为：点击页面左下角“重新开始”后，`restartSignal` 清除手动接管状态，并恢复初始状态序列继续轮转。

## TextInputStatesBento

- 控件位置：`src/app/component-demo/TextInputStatesBento.tsx`
- 动画目标：第一行第三个 bento 内的两个输入框轮流进入选中状态。
- 关键帧：
  - `t=0ms`：第一个输入框进入选中态，第二个输入框保持异常默认态。
  - `t=2400ms`：第二个输入框进入选中态，第一个输入框退回默认态。
  - `t=4800ms`：第一个输入框再次进入选中态，下一轮循环开始。
- 关键帧间隔：每 `2400ms` 切换一次，避免输入框选中态过快跳变。
- Smart animation：两个输入框槽位固定不动，选中态只在原控件样式内做变体过渡；边框、ring 和背景使用 `700ms` ease-out 过渡进入，不改变控件尺寸、不改变字体样式、不额外添加 halo。
- 选中态：普通输入框复用 `focus:border-ds-border-focus` 与品牌色 ring 的视觉语言；异常输入框复用 danger border、danger ring 和 danger subtle 背景。
- 手动接管：用户点按或聚焦任一输入框后，本 bento 停止自动轮换，并保留当前选中状态。
- 可编辑性：两个输入框均允许用户直接输入；用户输入不会改变原有选中态动画规则。
- 重启行为：点击页面左下角“重新开始”后，回到第一个输入框选中，并恢复自动轮换。

## UnitNumberInputsBento

- 控件位置：`src/app/component-demo/UnitNumberInputsBento.tsx`
- 动画目标：`96.0mm` 输入框进入真实 focus 状态后退出，`450.0mm` 输入框在默认态与禁用态之间切换。
- 关键帧：
  - `t=0ms`：`450.0mm` 为默认态，`96.0mm` 调用真实 `focus({ preventScroll: true })` 并显示 caret。
  - `t=900ms`：`450.0mm` 进入 disabled preview，形成与 `96.0mm` caret 错落的状态变化。
  - `t=1500ms`：`96.0mm` blur，caret 消失。
  - `t=3000ms`：`450.0mm` 退出 disabled preview，回到默认态。
  - `t=4200ms`：下一轮循环开始。
- 关键帧间隔：完整循环为 `4200ms`；`96.0mm` 聚焦保持 `1500ms`；`450.0mm` 在 `t=900ms` 进入禁用态并保持 `2100ms`。
- 光标：`96.0mm` 使用真实输入框 caret，颜色为橙红色，不使用额外绘制的假光标。
- 错落关系：`450.0mm` 在 `96.0mm` 聚焦后 `900ms` 再进入禁用态，并保持 `2100ms`，避免两个输入状态同时抢焦点。
- Smart animation：禁用态切换只使用原输入框的背景、边框、文字色和阴影过渡，不改变尺寸，不添加额外 halo。
- 手动接管：用户点击或输入任一单位输入框后，本 bento 停止自动动效，并保留用户当前输入。
- 重启行为：点击页面左下角“重新开始”后，恢复默认态并重新播放错落动效。

## SegmentedControlBento

- 控件位置：`src/app/component-demo/SegmentedControlBento.tsx`
- 动画目标：`世界 → 父系 → 物体 → 父系 → 世界` 循环往返切换。
- 关键帧：
  - `t=0ms`：选中 `世界`。
  - `t=1200ms`：选中 `父系`。
  - `t=2400ms`：选中 `物体`。
  - `t=3600ms`：回到 `父系`。
  - `t=4800ms`：回到 `世界`，下一轮循环开始。
- 关键帧间隔：每 `1200ms` 切换一次；完整往返为 `4800ms`。
- 节奏来源：`1200ms` 对齐抓手 slider 从 `0%` 到达 `75%` 的时间；在 `3600ms` half-cosine 往返周期中，`75%` 出现在周期的 `1/3` 处。
- 高亮动效：白色选中块使用 `500ms` transform 过渡，文字颜色使用 `300ms` 过渡。
- 布局约束：灰底容器使用 `p-1` 和 `gap-1`，选中高亮宽度用 `calc((100% - 16px) / 3)`，避免选中“物体”时溢出右侧灰框。
- 手动接管：用户点击任意 tab 后切到对应状态，并停止本 bento 的自动切换。
- 重启行为：点击页面左下角“重新开始”后，`restartSignal` 清除手动接管状态，回到 `世界` 并重新按节奏切换。

## StepperNumberInputBento

- 控件位置：`src/app/component-demo/StepperNumberInputBento.tsx`
- 动画目标：自动模拟点击 `+`，数值向上步进。
- 关键帧：
  - `t=0ms`：初始值 `450.0`，`+` 按钮未按压。
  - `t=1250ms`：触发一次自动 `+`，数值变为 `450.1`，`+` 按钮进入按压态。
  - `t=1430ms`：`+` 按压态结束。
  - `t=2500ms`：再次自动 `+`，数值变为 `450.2`，继续循环。
- 关键帧间隔：每 `1250ms` 自动增加 `0.1`；每次按钮按压反馈持续 `180ms`。
- 初始值：`450.0`。
- 回显：输入框数值始终保留一位小数。
- 点击反馈：自动 bump 与手动点击 `+/-` 都必须触发按钮按压态。
- 按压态：持续 `180ms`，表现为轻微下压、白底、橙色图标和内阴影。
- 布局：stepper 控件在 bento 内水平居中，使用稳定最大宽度避免贴边。
- 手动接管：用户点击 `+/-` 后执行对应步进，并停止本 bento 的自动 bump。
- 可编辑性：输入框允许用户直接输入数值；清空、`-`、`.` 等编辑中间态不会被强制解析成 `0`。
- 重启行为：点击页面左下角“重新开始”后，数值重置为 `450.0`，清除手动接管状态，并重新开始自动步进。

## ProcessDetailTabsBento

- 控件位置：`src/app/component-demo/ProcessDetailTabsBento.tsx`
- 动画目标：`工艺参数` 与 `路径点位` 互相切换，tab 状态和下方 slider 数值同步变化。
- 关键帧：
  - `t=0ms`：停留在 `工艺参数`，slider 值为 `64%`。
  - `t=1200ms`：启动切换到 `路径点位`，tab 立即切换，slider 从 `64%` 开始缓动到 `36%`。
  - `t=2400ms`：slider 到达 `36%`，并在 `路径点位` 停留。
  - `t=3600ms`：启动切回 `工艺参数`，tab 立即切换，slider 从 `36%` 缓动到 `64%`。
  - `t=4800ms`：slider 回到 `64%`，下一轮循环继续。
- 关键帧间隔：切换启动间隔为 `1200ms`；每次 slider 插值动画持续 `1200ms`；到达目标后再停留 `1200ms`。
- 对称值：`工艺参数=64%`，`路径点位=36%`，两组数值关于 `50%` 对称。
- Smart animation：slider 使用同一个 requestAnimationFrame 时钟做 ease-in-out 插值，数值回显、轨道填充和手柄位置必须来自同一个状态值。
- 手动接管：用户点击 tab 或拖拽 slider 后，本 bento 停止自动切换，并保留用户状态。
- 重启行为：点击页面左下角“重新开始”后，回到 `工艺参数=64%`，清除手动接管状态，并重新开始互相切换。

## PathPointToolbarBento

- 控件位置：`src/app/component-demo/PathPointToolbarBento.tsx`
- 动画目标：编辑/回显 radio 与安全点 caret 形成错落切换。
- 关键帧：
  - `t=0ms`：radio 为 `编辑`，安全点为展开态，caret 向下。
  - `t=1300ms`：radio 切到 `回显`。
  - `t=1650ms`：安全点折叠，caret 转为向左。
  - `t=2600ms`：radio 切回 `编辑`。
  - `t=3300ms`：安全点展开，caret 转为向下。
  - 后续 radio 每 `1300ms` 循环，caret 每 `1650ms` 循环，两者自然错拍。
- Radio 节奏：每 `1300ms` 在 `编辑` 与 `回显` 之间切换一次。
- Radio 动效：文字颜色使用 `300ms` 过渡，圆点使用 `300ms` scale 过渡。
- Caret 方向：安全点 caret 展开态为向下，收起态为向左，不使用向右收起态。
- Caret 节奏：每 `1650ms` 展开/收起一次，比 radio 略慢，形成错落感。
- Caret 动效：使用 `500ms` transform 过渡。
- 手动接管：用户点击 radio 或安全点 header 后，本 bento 停止自动切换，并保留用户状态。
- 重启行为：点击页面左下角“重新开始”后，回到 `编辑` + 展开态，并恢复自动错落切换。

## CoordinateFieldGroupBento

- 控件位置：`src/app/component-demo/CoordinateFieldGroupBento.tsx`
- 复用组件：`src/app/components/process/ProcessPosePointInfoRow.tsx`
- 动画目标：点位行在收起态数值回显与展开态 `XYZ/RPY` 六输入框之间循环。
- 关键帧：
  - `t=0ms`：点位行处于收起态，只显示 `X/Y/Z/RX/RY/RZ` 数值回显。
  - `t=1400ms`：切换到展开态，summary 退场，caret 旋转，下方六输入框展开。
  - `t=1760ms`：展开容器完成 `grid-template-rows / opacity / margin-top` 过渡。
  - `t=1840ms`：六输入框内容完成延迟进入。
  - `t=4000ms`：切回收起态，六输入框退场，summary 恢复。
  - `t=4360ms`：收起过渡完成，下一轮等待开始。
- 关键帧间隔：收起态停留 `1400ms`；展开态停留 `2600ms`；外层展开/收起为 `360ms`，summary 退场为 `240ms`，caret 旋转为 `260ms`，展开内容进入为 `320ms` 并延迟 `75ms`。
- Smart animation：行外层背景、边框、阴影使用 `280ms` 过渡；展开区域使用 CSS grid 行高从 `0fr` 到 `1fr`，避免内容瞬间跳变。
- 手动接管：用户点击展开按钮或编辑任一输入框后，本 bento 停止自动展开/收起。
- 重启行为：点击页面左下角“重新开始”后，回到收起态并重新播放。

## TreeRowsBento

- 控件位置：`src/app/component-demo/TreeRowsBento.tsx`
- 动画目标：反面工作面从默认收起态进入展开，随后其子级打磨面进入主选中，反面工作面同步进入次选中；选中态停留后先带着选中关系收起，收起完成后再清回默认态并重新 loop。
- 关键帧：
  - `t=0ms`：默认态，反面工作面收起，打磨面未选中。
  - `t=1100ms`：反面工作面展开，caret 转向下。
  - `t=2450ms`：进入选中关系，打磨面主选中，反面工作面关联选中，打磨面 checkbox 显示为 checked。
  - `t=5550ms`：进入 collapsing，反面工作面收起，但选中关系仍保留到收起过渡期间。
  - `t=6170ms`：回到默认态，清除选中关系，下一轮 loop 开始。
- 关键帧间隔：默认收起态停留 `1100ms`；展开后停留 `1350ms`；选中关系停留 `3100ms`；收起复位约 `620ms`。
- Smart animation：行底色、描边、checkbox 显隐、眼睛按钮显隐与 caret 方向使用 `520ms` 过渡，并采用 `cubic-bezier(0.22,1.18,0.36,1)` 提供轻微弹性。
- 布局约束：折叠打磨面时只改变透明度和可交互性，不移除行高，避免 bento 内部上下位置跳动。
- 手动接管：用户点击任一 checkbox、尾部眼睛或反面工作面 caret 后，本 bento 停止自动动画，并保留用户介入后的状态。
- 重启行为：点击页面左下角“重新开始”后，清除手动接管状态，回到反面工作面收起且打磨面未选中的默认态，再从默认态重新播放。

## ProcessSequenceBento

- 控件位置：`src/app/component-demo/ProcessSequenceBento.tsx`
- 动画目标：用两条任务行演示工序拖拽排序的插入预示线、条目换位、编号刷新和选中态转移。
- 关键帧：
  - `t=0ms`：橙色插入线显示在两个条目之间，当前第一项保持选中态。
  - `t=1300ms`：橙色插入线切到最顶端，表示第二项将插入到第一项之前。
  - `t=2600ms`：顶部橙色插入线开始淡出。
  - `t=2860ms`：插入线淡出完成，两个条目开始交换视觉位置。
  - `t=3960ms`：条目交换完成，真实排序数据同步更新，橙色插入线在新顺序的两个条目之间淡入。
  - `t=4020ms`：编号更新为新顺序。
  - `t=4200ms`：选中态切换到当前下面那个条目。
  - `t=5220ms`：进入下一轮 loop。
- 关键帧间隔：中间线停留 `1300ms`；顶部线停留 `1300ms`；顶部线淡出 `260ms`；条目换位 `1100ms`；编号在换位完成后 `60ms` 更新；选中态在编号后约 `180ms` 更新；每轮末尾停留约 `1200ms`。
- 视觉解耦：`indicatorTop / indicatorVisible` 控制橙色插入线；`visualOrder` 控制行位置；`tasks` 控制真实排序；`displayIndices` 控制编号。四者按关键帧分阶段更新，避免横线、换位、编号同时跳动。
- 行动效：条目 `top / background-color / box-shadow / color` 使用 `1100ms` ease-out 过渡；橙色插入线只做 `260ms` opacity 过渡，不做 top 位置过渡。
- 手动接管：用户开始拖拽排序时，本 bento 立即停止自动 loop，清空自动插入线，保留用户排序结果。
- 重启行为：点击页面左下角“重新开始”后，清除手动接管状态，允许自动 loop 从当前任务顺序继续播放。

## Viewport Glass And Weld Model Bentos

- 控件位置：`src/app/component-demo/ViewportShowcaseBento.tsx`
- CSS 位置：`src/styles/index.css`
- 展示拆分：原视窗展示拆成两个 bento，一个专注手动提取特征的玻璃弹窗形式，一个专注模型与焊缝线 demo 语义。
- `ViewportGlassPanelBento`：展示手动提取 `焊接 / 打磨 / 装配` 特征的半透明玻璃弹窗；内部保留弹窗标题、类型切换、选择结果、预览对象与 `取消 / 提取` 操作，不承载真实 3D 模型展示。
- 动画目标：`ViewportGlassPanelBento` 自动按 `焊接 → 打磨 → 装配` 循环切换，切换间隔约 `2400ms`；每轮末端轻触 `提取` 按钮，形成“选择特征类型 → 确认提取”的弹窗节奏。
- 手动接管：用户点击任一特征 tab、关闭、取消或提取按钮后，本 bento 停止自动切换；点击页面左下角“重新开始”后清除手动接管并回到 `焊接` 起始态。
- `ViewportWeldModelBento`：使用项目已上传的真实模型资源，加载 `/models/0162-01-010101-01..04.stl` 零件、`/models/intersections/front-intersection.obj`、`back-intersection-1.obj`、`back-intersection-2.obj` 多条焊缝曲线，以及相接侧的打磨面 OBJ，不再使用 CSS 绘制假模型。
- 模型配色：零件默认态统一使用灰色 `#9ca3af`，降低 demo 视窗内的色彩噪音；零件选中态保留原材质，叠加 `#FACC15 / opacity 0.58` 黄色遮罩和约 `1.2px / #F59E0B` 的 Amber 轮廓，避免整面发黄覆盖模型细节；普通选中时其它零件叠加 `#475569 / opacity 0.58` Slate 灰遮罩，隔离目标复用同一轮廓参数，隔离背景继续叠加 Slate 灰遮罩。
- 焊缝配色：焊缝普通态复用主界面 `weldFeatureStyle.normal` 的 `radius=2.5 / #f59e0b / opacity=0.7 / depthTest=true`；选中态复用主界面 selected 语义的更粗橙色线、满 opacity 和关闭 depthTest。
- 打磨面配色：打磨面默认不额外显示；点击“打磨面”条目后，复用主界面 `grindFeatureStyle.selected` 的 `#22d3ee / opacity=0.82 / depthTest=false` 蓝色高亮相接侧面片；不展示 02 和 04 外侧无相接关系的表面。
- 视窗布局：模型 bento 使用更高容器、更近镜头和独立小左右 padding，背景保持灰底，不使用渐变底；焊缝线和打磨面条目移到左下角零件名称下方，零件对象、焊缝线对象和打磨面对象分别使用同尺寸的小型半透明 pill wrap，特征条目作为子项缩进，树状竖线放在子项缩进区内表达从属关系。
- 联动交互：点击左下角“焊缝线”条目时，条目与模型中的焊缝曲线同步进入选中高亮；点击“打磨面”条目时，条目与主页面原型中的蓝色打磨面高亮同步；再次点击对应条目取消选中；点击视窗空白处清除零件、焊缝和打磨面高亮。
- 视窗实现：复用 React Three Fiber、`STLLoader` 和 `OrbitControls`，模型使用固定默认相机距离，不再用 `Bounds observe` 持续接管相机；Rhino OBJ 焊缝曲线通过 `v/curv` 顶点索引手动解析成 Three.js 线段，打磨面通过 `v/f` 面索引解析成 Three.js 面片，两者均使用 `new THREE.Vector3(x, -z, y)` 对齐主页面的 Rhino OBJ 坐标变换，避免特征脱离模型。
- 全局控制：模型视窗的 `OrbitControls.autoRotate` 跟随页面左下角全局动效按钮暂停或继续。
- 视窗交互：模型视窗允许鼠标滚轮双向缩放相机距离，禁用 pan，缩放范围由 `OrbitControls` 管理，并给足远距离上限以允许完整查看工件，避免自动 fit 或距离上限干扰用户把相机推远。

## Motion Rules

- 动效只用于展示页面，不要反向要求主页面必须自动播放。
- 输入、slider、stepper 等控件即使有自动演示，也必须保留用户可操作性。
- `/component-demo` 中除显式 `disabled` 的输入框外，输入框都应允许用户直接编辑。
- 自动动效被用户手动接管时，不应抢回控制权，除非用户点击全局“重新开始”。
- 自动数值和视觉位置必须来自同一个状态值，不能再额外叠加位置 transition 造成回显错位。
- 动效间隔调整时，应优先维护页面整体节奏，而不是让每个 bento 独立使用任意时长。
