# Architecture

## Current Shape

本项目当前是单页前端原型，核心页面仍集中在一个较大的页面文件中。现阶段的架构目标不是立即拆成很多目录，而是先建立稳定边界，避免后续 AI 或人工修改时把业务规则、组件样式和 demo 数据继续混在一起。

关键文件：

- `src/app/BeimeiAssemblyLinePage.tsx`：主原型页面，包含项目管理、结构树、3D 视窗、工序序列、工艺参数设置等流程。
- `src/app/ComponentLabPage.tsx`：组件管理页，记录交互组件、树结构条目、弹窗、Toast、文字样式、中性色和主题色。
- `src/app/components/ui/`：旧页面仍在使用的基础 UI 组件，保持兼容。
- `src/components/ui/`：新的 token 驱动基础组件，按组件目录组织。
- `public/models/`：demo 模型资源。
- `dist/`：构建产物，不作为源码编辑入口。

## Intended Layers

当前项目尚未完全拆分，但新代码应逐步朝以下分层靠拢：

- `pages/`：路由页面，只负责页面组合。
- `features/`：业务功能模块，每个模块包含 UI、hooks、services、types。
- `components/`：跨业务复用的纯 UI 组件。
- `services/`：业务服务，封装业务用例。
- `api/`：后端接口客户端，不包含页面逻辑。
- `domain/`：业务类型、规则、状态机、领域判断。
- `utils/`：无业务含义的通用工具。

## Dependency Rules

允许：

```txt
pages -> features -> services -> api
features -> components
features -> domain
services -> domain
services -> api
```

禁止：

```txt
components -> services
components -> api
api -> pages
domain -> pages
domain -> components
```

## Where to Put New Code

当前阶段：

- 主流程小改：优先在 `src/app/BeimeiAssemblyLinePage.tsx` 内就地修改。
- 组件样式和变体：同步更新 `src/app/ComponentLabPage.tsx`。
- 旧页面局部复用的基础 UI 原语：放入 `src/app/components/ui/`。
- 新 token 驱动基础组件：放入 `src/components/ui/<component-name>/`，包含组件实现、类型和出口文件。
- 业务规则说明：写入 `docs/domain/`。
- 产品交互说明：写入 `docs/product-specs/`。

未来拆分时：

- 新页面：放到 `pages/`。
- 新业务功能：放到 `features/<feature-name>/`。
- 纯展示组件：放到 `components/`。
- 业务规则：放到 `domain/`。
- 接口调用：放到 `api/`。
- 跨页面业务流程：放到 `services/`。

## Common Change Paths

### 修改组件样式

1. 先看 `docs/frontend/component-lab.md`。
2. 修改组件库展示。
3. 再决定是否应用到主页面。
4. 构建并验证组件库的分栏和平铺视图。

### 修改工序面板

1. 先看 `docs/domain/process-sequence.md`。
2. 再看 `docs/frontend/component-guidelines.md`。
3. 更新 `ComponentLabPage.tsx` 中的工序面板变体。
4. 再更新主页面对应工序条目。

### 修改工序生成逻辑

1. 先看 `docs/domain/process-sequence.md`。
2. 看 `docs/product-specs/process-planning.md`。
3. 确认焊缝、打磨、装配基准特征的前置条件。
4. 修改主页面。
5. 更新 Toast 和组件库枚举。

## Current Technical Debt

- 主页面文件较大，业务规则、UI 和 demo state 混合较多。
- `ComponentLabPage.tsx` 已成为样式事实来源，但还没有拆成独立组件包。
- 主页面与组件库之间仍有部分重复实现，后续应逐步抽公共组件。
- 旧 `src/app/components/ui/` 与新 `src/components/ui/` 会短期并存；新组件稳定后再逐步替换旧引用。
- API 层尚未建立，当前为 demo fake data 和本地 state。
