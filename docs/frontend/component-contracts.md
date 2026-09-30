# Component Contracts

组件契约是给 AI coding agent 使用的机器可读组件 API。它补充 Component Lab 的视觉示例，但不替代组件实现和产品规范。

## Source

当前 registry 位于 `src/design-system/registry/component-registry.ts`，`/component-system` 直接消费该 registry。新增或修改组件时，应同步更新 registry、Component Lab demo 和相关 product/domain 文档。

页面生成 Agent 额外消费：

- `src/design-system/registry/page-spec.ts`：页面意图、布局 slot、组件实例、状态机和异常情况的 `PageSpec` 协议。
- `src/design-system/registry/page-agent.ts`：协议校验、视觉/交互双维度评分，以及 demo 用的 prompt planner。
- `/page-agent`：将自然语言需求转为协议并展示评估结果的本地试验入口。

## Props schema

每个 `propsSchema` 描述公开 props，而不是内部 hook、CSS class 或实现状态：

- `required`：生成页面时必须提供的 props。
- `properties`：每个 prop 的类型、用途、允许值、默认值和示例。
- `rules`：跨 prop 约束，例如异常态必须关联错误说明。
- `invariants`：Agent 不得破坏的业务或组合规则。
- `inheritedProps`：来自 React/HTML 原生类型的可用属性。

回调不要放进 `properties` 的函数类型里，而应登记到 `events`，包括事件 prop、payload 和触发语义。

## Authoring rules

1. 数值编辑如果需要支持空值、负号或小数点中间态，schema 应使用 `string`。
2. 视觉状态必须显式列出 `default`、`invalid`、`disabled` 等状态，不通过任意 boolean 组合推断。
3. `implementation.status: pattern` 表示已有稳定样式模式但还没有统一可导入组件；Agent 不得伪造 import 路径。
4. `sourcePath` 使用仓库相对路径，方便 Agent 定位真实实现和 Component Lab 示例。
5. 组件 schema 只描述 UI 组合边界；领域判断放在 `domain/`，业务请求放在 `services/` 或 `api/`。

## Adding a contract

先确认实际 Props 和导出路径，再补 schema、事件、状态和不变量。完成后运行 `npm run build`，并检查 `/component-system` 的 registry 表格仍能渲染。

## PageSpec generation loop

生产环境中，LLM 只负责输出严格 JSON `PageSpec`（禁止直接输出 JSX）。运行时按以下顺序处理：

1. 根据 `intent` 选择已注册的 layout template。
2. 根据 `component` id 查找组件 props schema、实现状态和风险等级。
3. 运行 `validatePageSpec`，阻断未知组件、缺失必填属性、非法 slot 和断裂状态转移。
4. 运行 `evaluatePageSpec`，分别给视觉一致性和交互 workflow 评分；低于阈值时要求模型修订协议。
5. 通过后再由 renderer 将 PageSpec 映射到 feature 组件，业务请求仍走 service/api 层。
