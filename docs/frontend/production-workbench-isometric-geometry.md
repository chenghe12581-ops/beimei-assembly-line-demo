# Production Workbench Isometric Geometry Spec

## Purpose

本规范定义生产执行工作台中轴测工位立方体、垂直连接线和工位卡片之间的几何契约。后续调整工位位置、卡片尺寸、轴测角度或响应式缩放时，必须先满足这里的锚点规则，避免在 100%、110% 或其它浏览器显示比例下出现偶然对齐。

## Coordinate Systems

- 生产工作台 SVG 使用固定 `viewBox="0 0 1180 680"`。
- 工位立方体和连接线绘制在 SVG 内部 `<g transform="translate(78 -52)">` 中。
- HTML 工位卡片层必须复刻 SVG 的 `preserveAspectRatio="xMidYMid meet"` 缩放，不得使用固定 CSS 像素直接覆盖。
- SVG viewBox 到 HTML 屏幕坐标的转换规则：

```ts
scale = Math.min(containerWidth / 1180, containerHeight / 680)
left = (containerWidth - 1180 * scale) / 2
top = (containerHeight - 680 * scale) / 2
screenX = left + viewBoxX * scale
screenY = top + viewBoxY * scale
```

- 当前实现通过 `getProductionViewportFrame` 和 `ResizeObserver` 测量容器尺寸，再把 HTML overlay 以 `left/top + scale(...)` 对齐到 SVG 实际渲染框。

## Cuboid Geometry

每个工位立方体由 `ProductionWorkbenchArea` 定义：

- `cx`, `cy`：工位前侧左下方向基准点。
- `topWidth`, `topDepth`：上表面轴测平行四边形的基础宽度和深度。
- `frontScale`：沿厂房正面轴测边线方向的长度缩放。
- `depthScale`：沿纵深轴测边线方向的长度缩放。
- `height`：立方体向下侧面高度。

上表面四点按如下方式计算：

```ts
halfWidth = topWidth / 2
halfDepth = topDepth / 2
frontVector = [halfWidth * frontScale, halfDepth * frontScale]
depthVector = [halfWidth * depthScale, -halfDepth * depthScale]

frontStart = [cx - frontVector[0], cy]
frontEnd = [frontStart[0] + frontVector[0], frontStart[1] + frontVector[1]]
backStart = [frontStart[0] + depthVector[0], frontStart[1] + depthVector[1]]
backEnd = [frontEnd[0] + depthVector[0], frontEnd[1] + depthVector[1]]

top = [backStart, backEnd, frontEnd, frontStart]
topCenter = average(top)
```

轴测方向规定：

- 厂房正面边线方向使用 `frontVector`，视觉上向右下延伸。
- 纵深边线方向使用 `depthVector`，视觉上向右上延伸。
- 左数第二个工位可通过 `frontScale = 2` 延长正面边线，但 `depthScale` 仍保持一致，使后侧面继续平行。

## Connector Line Rules

连接线语义为“垂直指示线”，因此横向锚点不可漂移。

- 线下端必须落在对应工位立方体上表面中心：`lineBottom = topCenter`。
- 线上端必须落在工位卡片底边中点：`lineTop = cardBottomCenter`。
- 连接线必须垂直：`lineTop.x === lineBottom.x === topCenter.x`。
- 如果卡片需要横向避让，不能在保持竖线语义时单独移动卡片锚点；应改用以下方案之一：
  - 调整工位立方体几何位置。
  - 调整卡片尺寸或卡片内部排版。
  - 明确改为斜线或折线连接，并同步更新产品 spec。

工位卡片当前线长规则：

```ts
referenceArea = area-turnover
referenceAnchor = getWorkbenchCuboidGeometry(referenceArea).topCenter
connectorLength = referenceAnchor.y - (referenceArea.cy - 48)
connectorStartY = topCenter.y - connectorLength + optionalYOffset
```

其中：

- 六个工位默认使用同一个 `connectorLength`。
- `optionalYOffset` 只允许调整线起点和卡片底边的纵向位置，不得改变 `lineBottom`。
- 当前不使用单工位 `optionalYOffset`，六个工位的线下端均固定在各自立方体 `topCenter`。

## Station Card Rules

skew 方案工位卡片几何：

- 设计基础尺寸：`252px × 104px`，作为内容区不超过两行时的最小高度；加工零件名称继续使用正常换行，超过两行后按换行行数向上增加卡片高度。
- 整体视觉缩放：`0.75`。
- 主视图最小定位尺寸：`189px × 78px`；动态增高时仍以缩放后的实际高度参与定位。
- 卡片定位点：缩放后外层盒子的底边中点。
- HTML 外层锚点容器为 `0×0`，放在 `cardBottomCenter`。
- 卡片盒子挂载方式：

```ts
left = -cardWidth / 2
top = -cardHeight
width = cardWidth
height = cardHeight
```

skew 方案卡片轴测面规则：

- 轴测角度：`25.4deg`。
- 卡片表面变换：`skewY(-25.4deg) scaleX(0.84)`。
- 变换原点：`50% 100%`，即底边中点。
- 外层盒子必须等于缩放后的真实视觉尺寸，内部再放置 `252px × 104px` 基础层并做 `scale(0.75)`，避免 CSS transform 让布局底边和视觉底边分离。
- 卡片内容、badge 和加工零件信息继承同一个轴测面变换，看起来像贴附在卡片面上一样。

水平方案工位卡片规则：

- 保持平面显示，不应用轴测变形。
- 设计基础尺寸：`252px × 92px`，作为内容区不超过两行时的最小高度；加工零件名称继续使用正常换行，超过两行后按换行行数向上增加卡片高度。
- 整体视觉缩放：`0.75`。
- 主视图最小定位尺寸：`189px × 69px`；动态增高时仍以缩放后的实际高度参与定位。
- 仍通过 `getProductionStationCardPlacement` 取得卡片底边中点。
- 缩放原点为 `50% 100%`，即底边中点。缩小卡片时只改变卡片本体大小，连接线下端仍必须锚定工位 `topCenter`，线上端仍必须落在卡片底边中点。

工位地面矩形规则：

- `主筋板装配工位2 + 贴板打磨工位2`、`贴板打磨工位1 + 主筋板装配工位1` 各绘制一个粗描边轴测矩形。矩形由对应工位上表面四点的实际几何范围计算，不能改变工位、连接线或卡片锚点。
- 矩形沿轴测长轴两端各外扩 `16` 个 SVG 单位；短轴两端外扩值由原来的 `12` 调整为 `36`，即宽轴两侧各增加 `12` 个 SVG 单位。
- 矩形是地面层：绘制在区域文字之后、托盘和工位立方体、连接线之前，使实体自然遮挡矩形边线，不覆盖已有对象。填充和描边使用浅中性灰，不承担工位状态颜色语义。
- 矩形使用轴测圆角路径，整体定位相对原几何位置向左 `12`、向下 `24` 个 SVG 单位；该位移只作用于矩形，不改变工位及其连接线。
- 矩形状态样式统一复用 `production-workbench-ground-rect`：未选中使用 `slate-200` 浅灰；组内有执行中 / 暂停工位时使用浅绿色；组内有异常工位时使用浅黄色，异常优先级高于执行中。Component Lab 必须展示三种状态。
- 矩形长轴右侧额外延长 `12` 个 SVG 单位，左侧边界保持不变。

## Tray Card Rules

生产工作台中的 01-09 托盘卡片复用同一套轴测锚点方法，不能使用独立的手调定位。

托盘立方体几何：

- 01 和 09 使用大托盘立方体：`topWidth = 88`，`topDepth = 40`，`height = 8`。
- 02-08 使用中托盘立方体：`topWidth = 44`，`topDepth = 20`，`height = 8`。
- 托盘立方体同样通过 `getWorkbenchCuboidGeometry` 计算 `topCenter`。

托盘卡片字段：

- 托盘标号：使用两位编号 `01` 到 `09`。
- 占用状态：
  - 当前工序映射到该托盘且任务处于 `abnormal` 时，badge 显示 `异常`。
  - 当前工序映射到该托盘且任务处于 `running` 或 `paused` 时，badge 显示 `已占用`。
  - 无当前工序映射但从 `TraySlot` 推导有物料时（`state !== "empty"` 且 `material !== "空"`），badge 显示 `已占用`。
  - 其余情况显示 `未占用`。
  - 生产监控视图中默认所有托盘均为空，托盘是否“已占用”主要由当前执行工序是否映射到该托盘决定；物料占用仅作为辅助判定。
- 标号和占用状态必须在同一行展示，不在卡片内重复显示“托盘”或区域归属。
- 托盘卡片主视觉语义只表达物流现场状态：`abnormal` 使用红色、`paused` 使用琥珀色、`running` / 有物料占用使用绿色状态竖条和 badge，未占用时左侧竖条、状态点和 badge 置灰。
- 托盘卡片不与工位卡片共用标签。托盘继续按 `TraySlot` / `TrayTask` 显示 `空闲`、`已预约`、`空托`、`已占用`、`取货中` 或 AGV 行的 `执行中`；工位卡片和右侧工位按钮统一显示 `空闲`、`执行中`、`已暂停`、`异常`，异常处理完成后显示 `已暂停`。

托盘地面区域标注：

- 01 绘制 `上料区`，09 绘制 `下料区`；02-08 统一作为装配托盘位，不绘制区域名称或区域 tag。
- 保留区域只绘制一次文字，放在对应托盘中心的地面前侧，不在每个托盘下重复绘制。
- 文字横轴必须平行于托盘立方体前表面的上边线。当前轴向水平单位向量 `U = normalize([44, 20])`，角度约为 `24.44deg`；与其对应的轴测地面垂直轴为 `V = normalize([-44, 20])`。`V` 表达世界坐标中的垂直轴投影，不得用屏幕 90 度法线 `[-U.y, U.x]` 代替。
- 区域轴向中点必须由该区域全部托盘上表面顶点的实际几何范围计算：把顶点投影到 `U` 和屏幕法线 `S = [-U.y, U.x]`，分别取投影最小值与最大值的中点并重建区域中心 `P`。`S` 只用于重建屏幕几何中心，不作为文字位移方向；不得使用托盘编号位置的简单平均代替实际占地范围。
- 地面文字的视觉引导方向使用屏幕法线 `S` 与轴测垂直轴 `V` 的单位角平分线 `D = normalize(S + V)`，当前约为 `[-0.707, 0.707]`。这使标注保持左下轴测语义，同时避免单独使用 `S` 时偏右下、单独使用 `V` 时偏左上。
- 文字中点使用 `labelCenter = P + D * distance`，当前距离为 `48` SVG 单位，对应约向左 `34`、向下 `34`。不得再增加独立屏幕 `x/y` 偏移或视觉补偿。
- SVG 使用外层锚点 `<g>` 定位 `labelCenter`，内层只负责文字轴测变形；文字使用 `textAnchor="middle"` 和 `dominantBaseline="central"`，保证文字中点落在几何锚点上。
- 文字使用中性灰低强调样式，不承担占用状态或其它业务状态的颜色编码。
- 地面文字必须绘制在托盘立方体之前，使遮挡关系保持“文字贴在地面、托盘位于文字之上”的空间语义。

区域文字定位的标准实现：

```ts
U = normalize([44, 20])       // 托盘前表面横轴
S = [-U.y, U.x]               // 横轴的屏幕 90 度法线
V = [-U.x, U.y]               // 轴测地面的垂直轴投影
D = normalize(S + V)          // 最终左下视觉引导方向，约 [-0.707, 0.707]

axisRange = project(allTrayTopVertices, U)
normalRange = project(allTrayTopVertices, S)
axisCenter = midpoint(axisRange.min, axisRange.max)
normalCenter = midpoint(normalRange.min, normalRange.max)
P = U * axisCenter + S * normalCenter

labelCenter = P + D * 48      // 约向左 34、向下 34
```

其中：

- `allTrayTopVertices` 必须包含区域内所有托盘立方体的四个上表面顶点，确保大托盘尺寸或组内间距变化时仍按实际占地范围居中。
- `P` 是区域几何中心；`D` 和距离 `48` 是所有保留区域共享的定位参数。
- `getProductionTrayZoneLabelPlacement` 是区域几何中心与文字锚点的唯一计算入口。
- 视觉调整只能修改共享方向构造或共享距离，禁止添加区域级偏移表、浏览器缩放分支或独立 `x/y` 魔法数字。

托盘卡片几何：

- 设计基础尺寸：`128px × 40px`。
- 水平方案和 skew 方案均整体视觉缩放为 `0.75`。
- 主视图定位尺寸：`96px × 30px`。
- 卡片定位点：缩放后外层盒子的底边中点。
- 水平方案保持平面显示；skew 方案卡片表面变换为 `skewY(-25.4deg) scaleX(0.84)`。
- 变换原点：`50% 100%`。
- 空闲托盘卡片的可见面使用 `h-9` 并贴齐固定定位外框的底边；有载荷或任务内容时卡片占满固定高度。两种状态共用同一底边锚点，因此内容增高只能向上延展，不得在卡片与竖线之间留下间隙。

托盘连接线规则：

- 线下端必须落在对应托盘立方体上表面中心：`lineBottom = trayTopCenter`。
- 线上端必须落在托盘卡片底边中点：`lineTop = trayCardBottomCenter`。
- 连接线必须垂直：`lineTop.x === lineBottom.x === trayTopCenter.x`。
- 连接线颜色跟随占用状态：已占用使用绿色，未占用使用中性灰；不得用所属装配区区分颜色。
- 当前基础线长为 `58px`；可使用 `workbenchTrayConnectorOffsetY` 只调整线上端和卡片底边的纵向位置，不得改变线下端。
- 不允许对托盘卡片使用横向锚点偏移；如果托盘卡片排布拥挤，应调整线长、纵向偏移、卡片尺寸或改用非竖直连接线。

## Implementation Contract

`getProductionStationCardPlacement` 是唯一允许合并工位几何、连接线和卡片锚点的位置计算函数。它必须返回：

```ts
{
  connectorAnchor,      // 工位立方体 topCenter
  connectorX,           // 必须等于 connectorAnchor.x
  connectorStartY,      // 线的上端 y
  cardBottomCenterX,    // connectorAnchor.x + productionViewportBox.translateX
  cardBottomCenterY,    // connectorStartY + productionViewportBox.translateY
}
```

实现注意事项：

- SVG 线条绘制在已平移的 `<g>` 中，使用未加 `productionViewportBox.translateX/Y` 的坐标。
- HTML 卡片层绘制在完整 viewBox overlay 中，必须加上 `productionViewportBox.translateX/Y`。
- 不允许对 `connectorX` 或 `cardBottomCenterX` 使用单工位横向偏移表。
- 不允许针对浏览器显示比例写条件分支或魔法数字。
- 卡片和竖线不能各自独立计算位置；任何新的卡片方案都必须复用同一个锚点模型。
- 托盘卡片使用 `getProductionTrayCardPlacement`，返回结构和工位卡片 placement 保持一致：`connectorAnchor`、`connectorX`、`connectorStartY`、`cardBottomCenterX`、`cardBottomCenterY`。

## Verification

视觉或代码调整后至少验证以下条件：

- `lineBottom.x === cuboidTopCenter.x`
- `lineBottom.y === cuboidTopCenter.y`
- `lineTop.x === cardBottomCenter.x`
- `lineTop.y === cardBottomCenter.y`
- 对 01-09 托盘重复验证同一组线端点和卡片底边中点关系。
- 对四个托盘区域验证 `labelCenter - regionCenter` 的归一化结果等于共享方向 `D`。
- 对四个托盘区域验证 `distance(labelCenter, regionCenter) === 48`，允许浮点误差但不允许区域间使用不同距离。
- 验证区域文字 SVG 外层 `<g>` 位于 `labelCenter`，文字包围盒中心与该锚点重合；内层轴测变换不得参与区域位置计算。
- 在 100%、110% 和至少一个非默认视窗宽度下重复验证。
- 运行 `npm run build`。
