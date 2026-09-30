# AGENTS.md

## Project Overview

本项目是北煤机拼装产线前端原型，用于演示项目管理、图纸管理、工艺规划、特征提取、工艺参数设置、工序序列生成与 3D 视窗回显等核心流程。

主要技术栈：

- React
- Vite
- TypeScript
- Ant Design
- Tailwind CSS
- Three.js / React Three Fiber
- shadcn 风格基础 UI 组件

当前真实运行项目路径是：

```txt
/Users/roboticplus/Downloads/北煤机拼装产线
```

不要把 `/Users/roboticplus/Downloads/坡切配置工具助手原型` 当成当前页面的真实运行项目，除非用户明确要求。

## How to Navigate This Repo

- 系统架构：见 `ARCHITECTURE.md`
- 产品需求：见 `docs/product-specs/`
- 业务领域规则：见 `docs/domain/`
- 前端与组件规范：见 `docs/frontend/`
- API 约定：见 `docs/api/`
- 复杂任务计划：见 `docs/exec-plans/`
- 测试与质量标准：见 `docs/quality/`
- 参考资料：见 `docs/references/`
- 生成物说明：见 `docs/generated/`

关键源码：

- 主页面：`src/app/BeimeiAssemblyLinePage.tsx`
- 组件管理页：`src/app/ComponentLabPage.tsx`
- 基础 UI：`src/app/components/ui/`
- 入口：`src/main.tsx`
- 构建产物：`dist/`

## Required Workflow

开发前：

1. 先确认真实工作目录是 `/Users/roboticplus/Downloads/北煤机拼装产线`。
2. 阅读与任务相关的 product spec。
3. 阅读对应 domain 文档。
4. 如果涉及组件样式、布局、组件库，阅读 `docs/frontend/`。
5. 如果涉及架构变更，阅读 `ARCHITECTURE.md` 和相关 design doc。
6. 如果任务复杂或跨多个区域，先创建或更新 `docs/exec-plans/`。

开发中：

1. 优先复用已有组件、hooks、helpers 和 demo 数据结构。
2. 组件样式变化必须同步到 `src/app/ComponentLabPage.tsx`。
3. 不允许绕过既有领域边界。
4. 不允许临时硬编码业务规则；demo fake data 可以存在，但要能从领域文档解释。
5. 新增业务规则必须更新 `docs/domain/`。
6. 新增复杂交互必须更新 `docs/product-specs/` 或 `docs/frontend/`。
7. 不要直接编辑 `dist/assets/*.js` 作为源码。应修改 `src/` 后重新构建。

完成后：

1. 运行 `npm run build`。
2. 如果修改组件样式，检查组件库分栏视图和平铺视图。
3. 如果修改主页面交互，检查对应 product spec 和 domain 文档是否需要更新。
4. 在最终回复中说明修改范围、验证方式和新构建产物。

## Hard Rules

- 不要修改错误目录；当前真实项目是 `/Users/roboticplus/Downloads/北煤机拼装产线`。
- 不要手动引入新的状态管理方案，除非有 design doc。
- 不要在纯 UI 组件中直接写复杂业务规则。
- 不要在页面组件中直接请求未来后端；应统一走 API/client/service 层，当前 demo 可使用本地状态。
- 不要修改 generated 文件，除非重新生成。
- 不要删除已有测试或验证文档，除非说明原因并补充替代验证。
- 不要只改主页面而忘记组件库；组件库是当前 UI 样式事实来源。
- 不要只改源码不构建；用户通常会刷新页面验证结果。
