# 工序点位脏状态（Dirty State）逻辑文档

## 概述

工序序列中有两类可编辑参数，各自有独立的脏状态管理。当前样式 C 抓取工艺参数区不展示电磁铁位置区域，但磁铁启用、左/右磁铁 Z 值和磁力档位修改会触发未保存状态。

- **电磁铁位置**（Pick 工序）：修改 Y/Z 坐标，或修改左/右磁铁 Z 值、左中右磁力档位后派生 Y/Z → 影响覆盖率/安全系数/偏心距回显，并触发当前装配体未保存状态。
- **点位信息**（各工序的点位坐标、关节角度等）

修改电磁铁位置，或修改会派生电磁铁位置的抓取磁铁参数，会**同时**触发电磁铁脏状态和点位信息脏状态（因为电磁铁改动影响点位计算结果）。
修改点位信息**只**触发点位信息脏状态（点位改动不影响电磁铁位置）。

## 核心数据结构

```
processPointDirtyStepIds: Set<string>   // 点位信息脏状态
magnetDirtyStepIds: Set<string>         // 电磁铁位置脏状态
```

- 两者都是 `Set<string>`，存储**根工序 ID**
- 初始值均为 `new Set()`
- 粒度：根工序级别（同一根工序下的子工序共享）

## 核心函数

### `getRootProcessStepId(stepId?: string): string`

```ts
function getRootProcessStepId(stepId?: string) {
  if (!stepId) return '';
  return stepId.replace(/-(place|assemble|turnover-clamp)$/, '');
}
```

剥离工序 ID 后缀（`-place`、`-assemble`、`-turnover-clamp`），得到根工序 ID。

### `markProcessPointDirty(stepId: string)`

将根工序 ID 加入 `processPointDirtyStepIds`。

**调用时机**：点位坐标/关节角度被修改时。

### `clearProcessPointDirty(stepId: string)`

将根工序 ID 从 `processPointDirtyStepIds` 移除，Toast："已应用点位位置更新"。

**调用时机**：点位信息区域的"更新"按钮被点击时。

### `markMagnetDirty(stepId: string)`

将根工序 ID 加入 `magnetDirtyStepIds`。

**调用时机**：电磁铁 Y/Z 位置、抓取左/右磁铁 Z 值、抓取磁铁启用状态或抓取磁铁磁力档位被修改时调用。中磁铁 Z 固定回显 `--`，不可编辑，不触发脏状态。

### `clearMagnetDirty(stepId: string)`

将根工序 ID 从 `magnetDirtyStepIds` 和 `processPointDirtyStepIds` 移除，Toast："已应用电磁铁位置更新"。

**调用时机**：当前抓取工艺参数区隐藏电磁铁位置区域的"更新"按钮，暂不调用。后续恢复按钮时再启用。

## 脏状态派生逻辑

在工序渲染循环中：

```ts
const rootStepId = getRootProcessStepId(step.id) || stepKey;
const isProcessPointDirty = processPointDirtyStepIds.has(rootStepId);
const isMagnetDirty = magnetDirtyStepIds.has(rootStepId);
const isAnyDirty = isProcessPointDirty || isMagnetDirty;
```

## 脏状态联动规则

| 操作 | 电磁铁脏状态 | 点位信息脏状态 |
|------|:---:|:---:|
| 修改电磁铁位置 Y/Z | ✅ 变脏 | ✅ 变脏 |
| 修改抓取磁铁启用、左/右磁铁 Z 值或磁力档位 | ✅ 变脏 | ✅ 变脏 |
| 修改点位坐标/关节角度 | ❌ 不变 | ✅ 变脏 |
| 点击电磁铁"更新" | ✅ 清除 | ✅ 清除 |
| 点击点位"更新" | 不变 | ✅ 清除 |

**关键实现**（电磁铁 onAxisChange 回调）：

```ts
onAxisChange={(axis, nextValue) => {
  markMagnetDirty(step.id!);         // 电磁铁自身变脏
  markProcessPointDirty(step.id!);   // 联动：点位信息也变脏
  // ... 更新数据
}}
```

## UI 表现

### 1. 工序标题栏 `*` 号

```tsx
{isAnyDirty && (
  <span className="shrink-0 text-sm font-semibold text-orange-600">*</span>
)}
```

任一脏状态为 true 时显示。即电磁铁或点位信息任一有未确认修改都显示。

### 2. 点位信息折叠标题栏 `*` 号 + 更新按钮

```tsx
<ProcessPointInfoSection
  dirty={isProcessPointDirty}     // 只看点位信息脏状态
  onApplyUpdate={() => step.id && clearProcessPointDirty(step.id)}
  ...
/>
```

- `*` 号和更新按钮的 disabled 取决于 `isProcessPointDirty`
- 点击更新只清除点位信息脏状态，不影响电磁铁脏状态

### 3. 电磁铁位置标签栏 `*` 号 + 更新按钮

```tsx
{isMagnetDirty && <span className="text-xs font-semibold text-orange-600">*</span>}
<Button disabled={!isMagnetDirty} onClick={() => clearMagnetDirty(step.id)}>
  更新
</Button>
```

- `*` 号和更新按钮的 disabled 取决于 `isMagnetDirty`
- 点击更新清除电磁铁脏状态，并同步清除该抓取工序的点位信息脏状态

## 脏状态重置场景

### 1. 点击"更新"按钮

- 电磁铁更新 → 清除 `magnetDirtyStepIds` 和 `processPointDirtyStepIds` 中对应 ID
- 点位更新 → 仅清除 `processPointDirtyStepIds` 中对应 ID

### 2. 返回项目管理页（有脏状态时）

```ts
if (currentProjectHasUnsavedChanges) {
  setBackUnsavedNoticeOpen(true);
}
```

确认后只返回项目管理，不清除脏状态：

```ts
setBackUnsavedNoticeOpen(false);
setCurrentProjectId(null);
```

未保存状态继续保留在装配体工艺规划任务上，顶部“工艺规划”下拉对应装配体名称后显示橙红色 `*`。用户稍后可从下拉任务重新进入继续编辑。

如果用户在工艺规划下拉中点击该任务尾部 `X`，且任务存在未保存状态，则弹窗提示关闭将丢弃所有未保存的工艺规划更改；确认丢弃后才清除该装配体对应的脏状态并关闭任务。

### 3. 一键生成完整工序序列

```ts
setProcessPointDirtyStepIds(new Set());
setMagnetDirtyStepIds(new Set());
```

## 状态流转图

```
电磁铁位置修改:
  magnetDirtyStepIds.add(rootId)  ──→ 电磁铁 * 显示
  processPointDirtyStepIds.add(rootId) ──→ 点位 * 显示 + 工序标题 * 显示

点位信息修改:
  processPointDirtyStepIds.add(rootId) ──→ 点位 * 显示 + 工序标题 * 显示
  （不影响 magnetDirtyStepIds）

清除:
  电磁铁"更新" → clearMagnetDirty → 清除电磁铁 * 和点位 *
  点位"更新"   → clearProcessPointDirty → 仅清除点位 *
  返回项目管理 → 保留脏状态，下拉任务显示 *
  下拉任务 X 确认丢弃 / 保存 → 清除对应装配体脏状态
```

## 新增功能时的参考指南

### 场景 A：新增一个影响点位的参数（修改它会让点位变脏，但自身不需要独立脏状态）

```ts
onChange={(value) => {
  markProcessPointDirty(step.id!);
  // ... 更新数据
}}
```

### 场景 B：新增一个影响点位、且自身需要独立脏状态的参数（如电磁铁位置）

**步骤 1**：新增 dirty state 和相关函数

```ts
const [myNewDirtyStepIds, setMyNewDirtyStepIds] = useState<Set<string>>(new Set());

const markMyNewDirty = (stepId: string) => { /* add rootStepId */ };
const clearMyNewDirty = (stepId: string) => { /* delete rootStepId, show toast */ };
```

**步骤 2**：在渲染循环中派生

```ts
const isMyNewDirty = myNewDirtyStepIds.has(rootStepId);
const isAnyDirty = isProcessPointDirty || isMagnetDirty || isMyNewDirty;
```

**步骤 3**：UI 中显示 `*` + 更新按钮

```tsx
{isMyNewDirty && <span className="text-xs font-semibold text-orange-600">*</span>}
<Button disabled={!isMyNewDirty} onClick={() => clearMyNewDirty(step.id)}>更新</Button>
```

**步骤 4**：onChange 中同时标记自身和点位

```ts
onChange={(value) => {
  markMyNewDirty(step.id!);
  markProcessPointDirty(step.id!);
  // ... 更新数据
}}
```

**步骤 5**：返回保护 + 一键生成中清除

```ts
if (processPointDirtyStepIds.size > 0 || magnetDirtyStepIds.size > 0 || myNewDirtyStepIds.size > 0) { ... }
setMyNewDirtyStepIds(new Set());
```
