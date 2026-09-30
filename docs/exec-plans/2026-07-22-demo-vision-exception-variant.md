# Demo 视觉异常处理变体

## Goal

- 生产 Demo 在第 06 道装配异常时，通过视觉监控底部 Tab 演示 8 个视觉的异常处理面板。
- Component Lab 保留重构结果异常和第二种异常处理原始样式，并展示第二种异常处理的 Demo 变体。

## Scope

- 从生产执行页移除 `GantryVisionScanPanel` 的异常流程、状态切换和右栏挂载，保留 Component Lab 展示。
- 将 Demo 初始视觉异常绑定到 `weld-1`，并允许在异常状态下切换全部 8 个视觉 Tab。
- 新增 `VisionExceptionDemoPanel`：按视觉类型展示六轴姿态、搬运抓取 / 直线 / 圆弧定位或焊接测量交点 XYZ，支持编辑结果、重新扫描、跳过和确定。
- 视觉监控底部使用 `VisionFeedBar` 作为 Tab，一次只渲染当前 Tab 的点云和右侧异常面板，不平铺 8 个面板。
- Component Lab 原始第二种异常处理继续使用默认变体，并补充 Demo 变体示例。
- 同步生产执行领域规则、产品规格和组件库指南。

## Verification

- Demo 视觉异常右栏按底部 Tab 切换 8 种异常处理，页面源码不再挂载重构结果异常面板。
- Component Lab 仍能分别看到重构结果原组件、第二种异常处理原始样式和 Demo 变体。
- 8 个视觉面板均可编辑对应结果数据、触发重新扫描，扫描中按钮进入 loading，扫描成功后更新结果；未重新扫描时确定保持禁用。
- `npm run build` 通过。
