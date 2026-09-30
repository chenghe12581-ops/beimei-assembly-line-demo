# 复合工位合并执行计划（2026-08-21）

## 背景

产品逻辑调整：主筋板装配工位与贴板打磨工位在现场是一个连续执行单元，右侧「工位详情」不再按单物理工位拆分展示。

- 复合工位1 = 主筋板装配工位1 + 贴板打磨工位1
- 复合工位2 = 主筋板装配工位2 + 贴板打磨工位2

四个物理工位在工作台保留卡片和状态高亮；点击其中任意一个都打开对应复合工位详情。翻面工位、主筋板打磨工位1 保持单工位详情。

## 决策记录

1. 零件 04 也在复合工位2 加工：复合工位2 工步列表在 03 零件段落后重复一遍 04 零件段落（贴板【0162-01-010101-04】取料 → 焊缝【04-03-02-01】定位焊接执行），「压紧位置执行、主筋板组件下料」作为全列表尾段，共 23 步。
2. 单步是调试功能：真实任务运行中选中任意工步（可跨工序段落）点击「执行工步」，允许打断自动顺序并跳转到选中工步；跳转后进入单步执行态，按钮切换为可点击的「暂停」，暂停后任务与工件停在当前工步，不做拒绝或告警。执行期间可切换查看自动 / 单步 / 手动页面，但只有当前执行模式和当前执行工位保留执行控制，其余执行按钮置灰。
3. 手动模式：面板顶部标题固定显示复合名称，下方用 tab 在两个物理工位间切换设备控制（装配 tab = 焊接机器人 + 支撑 + 压紧；打磨 tab = 三轴 + 打磨头）。

## 实现方案

合并只发生在展示层，任务推进引擎（`advanceProductionTask`、per-process `currentStepIndex`）不改。

- `src/app/components/production/production-station-worksteps.ts`
  - 新增 `productionCompositeStations` 复合工位定义（成员物理工位 + 有序工序段落）。
  - 新增段落模板：`main-assembly-feed`（支撑位置执行、主筋板抓取上料、二次定位/导入工件位置）、`plate-grind-side`（贴板取料、侧面打磨、正面打磨（如有））、`main-assembly-2-final`（装配段 + 压紧位置执行 + 主筋板组件下料）；`main-assembly-1` / `main-assembly-2` 更新为新装配段文案。
  - 新增复合 API：`getProductionCompositeStation`、`getProductionCompositeWorkstepSegments` / `...WorkstepNames`、`findProductionCompositeWorkstepLocation`（含 v1 子工序别名表）、`resolveProductionCompositeWorkstepIndex`（单步跳段反解）。
- `src/app/ProductionExecutionPage.tsx`
  - `selectedDebugStationSnapshot` 增加复合分支：`stationName` 用复合名称，`workstepNames` 用合并列表，`currentWorkstepIndex` = 段落起点 + 段内索引，快照携带 `compositeStation`（成员工位 + 点击的物理工位）。
  - `handleExecuteStep` 增加复合分支：暂停任务与当前 WP，跳转 `currentProcessId` / `currentStepIndex` 到选中工步，进度不回退；任务未运行时保持演示执行日志。
- `src/app/components/production/SingleStepDebugPanel.tsx`
  - 快照类型新增 `compositeStation`；手动模式目标扩展为 `station-group`。
- `src/app/components/production/ProductionManualControlPanel.tsx`
  - 目标类型新增 `station-group`；抽出 `StationManualControlSections` 子组件，组内 tab 切换物理工位，设备状态按 stationId 键隔离。
- `src/app/ComponentLabPage.tsx`
  - 单步调试 demo 快照支持复合工位；手动控制区新增复合工位 tab 形态示例。

## 验证

- `npm run build` 通过。
- 生产执行页：点击装配1/打磨1（或装配2/打磨2）卡片，详情标题显示加号相连的复合名称；自动/单步显示 13 步（复合1）/ 23 步（复合2）合并工步；运行任务时高亮跟随工序跨段落移动；单步模式选中任意工步执行后任务暂停并跳转；手动模式 tab 切换两套设备控制。
- 组件库分栏 / 平铺视图检查单步调试面板与手动面板新形态。

## 文档同步

- `docs/product-specs/production-execution.md`：工位详情入口、执行模式、手动控制、工步回显规则。
- `docs/domain/production-execution.md`：新增「复合工位」概念，更新聚合工步与执行模式规则。
