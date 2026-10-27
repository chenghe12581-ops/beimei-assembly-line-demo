# 执行控制改造方案（评审稿）

> 目标：落实《production-execution-control.md》的互锁设计，修复现有执行控制逻辑的问题（互锁缺失、整线执行依赖查看工位、停止按钮可用性错位、锁泄漏、双份停止/初始化逻辑等）。本文件只描述改法，评审通过后再动代码。

## 1. 状态定义改造

### 1.1 新增执行会话（替代 activeExecutionMode + activeExecutionStationId）

```ts
type ExecutionSession = {
  /** 执行侧：line = 顶栏整线；station = 右侧面板单站/单步 */
  side: 'line' | 'station';
  /** 执行模式：line 恒为 'auto'；station 可为 'auto' | 'single-step' */
  mode: 'auto' | 'single-step';
  /** 会话占用工位：line 侧为 null（整线不限工位）；station 侧为建会话时的工位 */
  stationId: string | null;
} | null;
```

- 现状的 `activeExecutionMode` / `activeExecutionStationId` 两个独立 state 合并为单个 `executionSession`，避免两边漂移（如 mode 非空但 stationId 已被清）。
- 现有「执行模式切换 tab（自动/单步/手动）」仍是**查看/操作偏好**，与会话 mode 解耦：会话 mode 由触发按钮决定（顶栏执行 → line/auto；面板自动执行 → station/auto；面板执行工步 → station/single-step）。

### 1.2 任务状态机不变

`draft / ready / running / paused / stopped / done / abnormal` 保持不变；所有改动只围绕"按钮可用性"和"会话生命周期"。

### 1.3 会话生命周期（统一收口）

| 时机 | 动作 |
| --- | --- |
| 任务经任一路径成功进入 `running` | 建立/刷新会话（见 2.2 建会话时机） |
| 点击「停止 / 停止执行」确认后 | `stopTask(source)`：任务置 `stopped` + 清会话 |
| 任务进入 `done / abnormal` | useEffect 清会话（保留现有逻辑） |
| 暂停 | 不清会话（保留现有语义） |
| 切换选中工单 | 现有 `handleSelectTask` 拦截逻辑保留 |

## 2. 按钮可用性推导

### 2.1 互锁矩阵（单一数据源）

派生值（都放在 ProductionExecutionPage 顶部计算，传入子组件）：

```ts
const sessionActive = executionSession !== null;
const sessionSide = executionSession?.side ?? null;
const sessionStationId = executionSession?.stationId ?? null;
/** 顶栏整线组是否被互锁置灰 */
const lineLocked = sessionActive && sessionSide === 'station';
/** 右侧面板是否被互锁置灰（本会话工位允许查看状态，但控制按钮同样置灰） */
const stationLocked = sessionActive && sessionSide === 'line';
```

> 与现状差异：①顶栏接入互锁（现状无）；②单站执行中整线组整体置灰（现状可点）；③整线执行中右侧面板控制条置灰（现状只看工位、当前工位仍可操作）。

### 2.2 建会话时机（修复锁泄漏）

- 现状问题：`handleMainRunOrPause` 先建会话再调 `handleRunOrPause`，后者在「01 号托盘尚未就绪」等分支直接 return，锁已建但任务未运行 → 其他工位被锁死。
- 改法：**会话不在点击时建立，而在任务真正进入 running 时建立**。具体：
  - 删除 `handleMainRunOrPause` / 面板按钮 onClick 里的 `handleExecutionStart(...)` 前置调用；
  - 在 `startSelectedProductionTask` 和 `handleRunOrPause` 内所有成功把任务置为 `running` 的分支末尾，调用 `beginSession(side, mode, stationId)`（mode/side 由调用方以参数传入，或包一层：顶栏 → `startLine()`，面板自动 → `startStationAuto(stationId)`，面板单步 → `startStationSingleStep(stationId)`）；
  - 托盘等待分支（任务未 running）不建会话，自然无泄漏。

### 2.3 顶栏整线组（FloatingWorkspaceControls）

| 按钮 | 新可用条件 | 改动点 |
| --- | --- | --- |
| 初始化 | `canInitialize`（统一为 ready / stopped / draft 均可，见 2.5）且 `!lineLocked` | 现状已接近，仅需排除 draft 与否按统一规则 |
| 执行/暂停 | `canRun` **去掉 `stationStartUnavailable`**，且 `!lineLocked`；paused → 显示「执行」续跑 | canRun 重新定义：`selectedTask && !['stopped','done','abnormal'].includes(state)` |
| 停止 | `selectedTask && (running || paused)`（**不受 `lineLocked` 限制**，互锁豁免） | **去掉现状 `running 时置灰` 的限制**，停止随时可用；点击作用于整个执行动作 |

- 顶栏「执行」的起点：整线起点 = 工单首个启用工序，即 `resolveStationStartProcessId(null, ...)`（现状 `handleRunOrPause()` 不传 stationId 本来就是这个语义，保持不变即可）；**查看工位只影响右侧面板的单站起点，不再影响顶栏**（`stationStartUnavailable` 从 canRun 中移除，仅供面板使用）。

### 2.4 右侧面板组（SingleStepDebugPanel）

props 改为接收 `lineLocked / stationLocked / sessionStationId`，面板内部不再自己拼 `isLockedOut`。控制条（非手动模式）：

| 模式 | 按钮 | 可用条件（stationLocked 时全部置灰） |
| --- | --- | --- |
| 自动 | 初始化 | canInitialize（统一） |
| 自动 | 自动执行/暂停/继续 | idle → 自动执行（起点=当前工位，无启用工序时置灰+tooltip）；running → 暂停；**paused → 继续（新增）** |
| 自动 | 停止执行 | running 或 paused（**去掉"必须 paused"限制**） |
| 单步 | 初始化 | 同自动 |
| 单步 | 执行工步/暂停 | idle → 执行选中工步；running 且本会话 mode=single-step → 暂停 |
| 单步 | 停止执行 | running 或 paused |
| 手动 | （无控制条，现状保留） | — |

- `controlPhase` 补 `abnormal` 分支：异常**不再作为按钮置灰的中间态**——异常出现即触发异常弹窗（标题区分「整线执行中检测到视觉异常」「单站执行中检测到视觉异常」），确认后自动停止（复用 `stopTask`，进入 `stopped`、清会话）；弹窗期间两侧所有执行类按钮与初始化均不可点。`abnormal` 仅保留为数据态用于视觉监控跟踪，处理完成后任务为已停止态，需初始化后再执行。
- 面板 tooltip 文案按互锁矩阵更新：stationLocked → 「整线正在执行，请停止整线后操作」；单站会话占用其他工位 → 「当前工位正在执行，请先停止」。

### 2.4.1 补充规则（评审新增）

1. **停止全局同步**：任一侧「停止 / 停止执行」作用于整个执行动作（不区分会话侧），两侧停止按钮复用同一个 `stopTask(source)`；互锁置灰时，停止按钮作为本区域内唯一豁免项保持可用（安全优先）。
2. **停止后必须初始化**：任务 `stopped` 后，整线执行、自动执行、单步执行全部置灰，初始化是恢复执行的唯一入口；执行会话存在期间（running / paused）初始化始终禁点。
3. **模式内互斥**：执行模式 tab 随时可切换、工序状态实时同步（tab 只换按钮组，不换数据）；会话 `mode = auto` 时单步 tab 的「单步执行」与「初始化」置灰，`mode = single-step` 时自动 tab 的「自动执行」与「初始化」置灰——由 `session.mode !== 当前 tab 对应模式` 推导。
4. **按钮组随 tab 切换**：自动 tab → 初始化 / 自动执行 / 停止执行；单步 tab → 初始化 / 单步执行（执行工步）/ 停止执行；手动 tab 不显示控制条。
5. **异常流程（弹窗 + 自动停止）**：执行中检测到视觉异常 → 异常弹窗（标题按会话 side 区分整线/单站，回显工位、工件、异常工序）→ 确认后自动停止（`stopTask('abnormal')`，无取消按钮，弹窗独占）→ 任务 `stopped`、会话清除；此后「初始化」才可点。视觉监控中的异常数据处理后任务保持已停止态，需初始化再执行。现有 `abnormal` 数据态与视觉处理面板保留，仅终态由 `paused` 改为 `stopped`。

### 2.5 初始化统一

- `canInitialize`（页面级唯一）：`selectedTask && ['draft','ready','stopped'].includes(state)`。
- 面板 `canInitControl` 不再只认 stopped，直接使用 `canInitialize`。
- `handleInitialize` 行为不变（stopped 时清零工件进度，其余仅复位状态文案与日志）。

### 2.6 停止统一

- 合并 `handleStop` 与 `handleExecutionStop` 为 `stopTask(source: 'line' | 'station')`：
  - 任务置 `stopped`、`currentProcess: '已停止，需初始化后重新执行'`、`currentProcessId: null`、工件 `currentStepIndex: 0`（取两者并集）；
  - 清会话；
  - 顶栏停止保留确认弹窗（现有 `stopConfirmOpen`）；面板「停止执行」**补同样的确认弹窗**（复用同一弹窗组件，文案区分来源）。

## 3. 调用链改法清单

| # | 位置 | 改法 |
| --- | --- | --- |
| 1 | `ProductionExecutionPage` 状态区 | `activeExecutionMode/activeExecutionStationId` → `executionSession`；新增 `beginSession/clearSession` |
| 2 | `canRun` | 移除 `stationStartUnavailable`；`stationStartUnavailable` 仅作为面板 `startDisabledReason` 使用 |
| 3 | `canInitialize` | 改为 ready/stopped/draft 统一 |
| 4 | `handleMainRunOrPause` | 删掉前置 `handleExecutionStart`；暂停分支不变；启动分支走 `startLine()`（内部成功 running 后建 line/auto 会话） |
| 5 | `handleRunOrPause` | 所有成功置 running 的分支末尾按调用方传入的 side/mode/stationId 建会话；托盘等待分支不建 |
| 6 | `handleInitialize` | 不变；确认对 draft 语义无副作用 |
| 7 | `handleStop` / `handleExecutionStop` | 合并为 `stopTask(source)`，行为取并集；面板停止接确认弹窗 |
| 8 | `useEffect`（会话释放） | 触发条件不变（done/abnormal/draft 终态），对象改为 executionSession |
| 9 | `SingleStepDebugPanel` props | `activeExecutionMode/activeExecutionStationId` → `stationLocked/sessionStationId/taskState` 组合推导；内部 `isLockedOut` 删除 |
| 10 | `FloatingWorkspaceControls` props | 新增 `locked: boolean` + `stopDisabled` 条件更新；初始化可用条件用统一 canInitialize |
| 11 | `controlPhase` | 新增 abnormal 分支；paused 增加「继续」按钮态 |
| 12 | tooltip 文案 | 全部按互锁矩阵重写（见 2.3 / 2.4） |

## 4. 行为变化对照（用户可见）

1. 整线执行中：右侧面板控制条置灰（仅「停止执行」可用），tooltip「整线正在执行，请停止整线后操作」。
2. 单站/单步执行中：顶栏初始化 / 执行置灰，仅「停止」可用；点击即停掉单站会话。
3. 运行中顶栏「停止」可直接点（不再必须先暂停）。
4. 面板任务暂停后，面板内可直接「继续」或「停止执行」。
5. 选中一个无启用工序的工位，不再影响顶栏「执行」。
6. 「01 号托盘尚未就绪」时不再发生工位锁死。
7. 面板「停止执行」增加确认弹窗（与顶栏停止复用）。
8. 新建工单仍是 ready，ready/stopped/draft 均可初始化；执行会话存在期间（running/paused）初始化始终置灰。
9. 执行中切换 自动/单步 tab：按钮组随之切换，工序状态实时同步；但非会话模式的执行按钮与初始化保持置灰（模式内互斥）。
10. 停止后：所有执行按钮置灰，必须先初始化才能再次执行。

## 5. 回归验证清单

- [ ] 顶栏：ready→执行→暂停→继续→停止（每步按钮可用性与 tooltip 正确）
- [ ] 面板自动执行：起点对齐当前工位；当前工位无启用工序时置灰并提示
- [ ] 整线执行中查看其他工位/当前工位：面板控制条置灰，仅停止执行可用
- [ ] 单站执行中切到顶栏：初始化/执行置灰，停止可用且点击即停掉单站会话
- [ ] 单站自动执行中切到单步 tab：状态同步显示，单步执行与初始化置灰，停止执行可用
- [ ] 单步执行中切到自动 tab：自动执行与初始化置灰，停止执行可用
- [ ] 单步：选中工步→执行工步→暂停→继续→停止；复合工位跨段打断仍可用
- [ ] 停止后：两侧执行按钮全灰 → 初始化 → 恢复可执行
- [ ] 单步选中「精定位/导入工件位置」：定位弹窗照常
- [ ] 托盘未就绪时执行：日志提示等待，且无任何工位被锁
- [ ] 视觉异常：整线执行中触发 → 弹窗标题为「整线执行中检测到视觉异常」；单站/单步执行中触发 → 「单站执行中检测到视觉异常」；确认后任务自动停止、会话清除；弹窗期间所有执行类按钮与初始化不可点；视觉处理完成后任务为已停止态，初始化后才能重新执行
- [ ] 任务 done/abnormal 后会话自动释放，两侧恢复可操作
- [ ] 单步打断自动顺序（复合工位跳段）后，会话归属与按钮状态正确

## 6. 不做的事（本期）

- 确认类弹窗暂不做，互锁落地后再加，避免一次改两层语义：整线执行中进入单步的冲突弹窗、单步执行确认弹窗、单步执行结束弹窗（见说明文档 4.1 / 4.3 / 4.4）。
- 异常弹窗本期**只做逻辑**：异常出现 → 自动停止 + 日志提示；带执行侧区分的异常弹窗 UI 下期补（先复用日志/现有异常通道提示）。
- 手动模式设备控制不动。
- 任务状态机、AGV 演示定时器不动；视觉异常通道仅改终态（处理完成后由 `paused` 改为 `stopped`），检测与处理面板内部不动。
