# Quality Guidelines

## Required Verification

每次代码修改后至少运行：

```bash
npm run build
```

## Visual Checks

修改 UI 后检查：

- 主页面是否刷新到最新 dist。
- 组件库分栏视图是否正常。
- 组件库平铺视图是否正常。
- 默认、异常、置灰状态是否正常。
- 文本是否溢出。
- 输入框单位是否遮挡输入值。
- 点位 XYZ 和关节参数是否超出容器。

## Documentation Checks

以下情况需要更新文档：

- 新增业务规则：更新 `docs/domain/`。
- 新增或修改用户流程：更新 `docs/product-specs/`。
- 新增或修改组件规范：更新 `docs/frontend/`。
- 涉及架构变更：更新 `ARCHITECTURE.md` 或 `docs/design-docs/`。

## Generated Files

- `dist/` 是构建产物。
- 不要手改 dist 作为源码。
- 修改源码后重新构建。
