# 焊接机器人视觉异常点云回显

## Goal

让第二个视觉异常处理（焊接机器人1视觉标定）像第一个异常处理（桁架1视觉扫描）一样，在点云模型中回显：

- 结果点位置
- 工具头位置
- 调整拍照位置时，点云中的工具头实时联动

## Scope

- 复用现有 `VisionPointCloud` 点云组件，新增焊接机器人视觉 viewport 数据流。
- 调整 `VisionAbnormalCalibrationPanel` 的演示默认值，使结果点、粗定位点、拍照位置落在点云可见区域。
- 不改变焊接机器人视觉异常的状态机、跳过/确定/重新扫描语义。

## Non-goals

- 不新增 STL 模型，工具头继续复用 `solver_Raffles.stl`。
- 不修改桁架1视觉的点云渲染逻辑。
- 不新增后端协议或真实视觉接口。

## Steps

1. 在 `VisionAbnormalCalibrationPanel.tsx` 中把 `defaultVisionResultPoint`、`defaultVisionCoarseResultPoint`、`defaultVisionPhotoPose`、`visionRescanResultFixtures` 调整到桁架焊缝附近的合理世界坐标，并导出 `parsePoseValue` 供点云组件使用。
2. 在 `VisionPointCloud.tsx` 中：
   - 定义 `WeldVisionViewportState` 类型；
   - 新增 `weldViewport` prop；
   - 新增 `WeldResultPoint` 组件：把 `VisionCalibrationPose` 解析为场景坐标，渲染结果点球 + Html 标签，扫描中变灰/降低透明度；
   - 新增 `WeldToolHead` 组件：把拍照位置解析为绝对坐标，加载 `solver_Raffles.stl`，按 `Math.PI/2 + rx` 基准旋转，扫描中降低透明度；
   - 在 `PointCloudObject` 中按 `weldViewport` 存在性渲染上述组件。
3. 在 `ProductionExecutionPage.tsx` 中：
   - 由 `visionResultPoint`、`visionPhotoPose`、`visionCoordinateMode`、`visionPhotoPoseBaseline`、`visionScanStatus` 组装 `weldViewport`；
   - 通过 `VisionMonitorView` 传给 `VisionPointCloud`。
4. 构建并验证浏览器中焊接机器人视觉异常的结果点、工具头显示及拍照位置联动。

## Verification

- `npm run build` 通过。
- 进入焊接机器人1视觉异常后，点云中可见橙色结果点球和标签。
- 点云中可见 `solver_Raffles.stl` 工具头模型。
- 修改“拍照位置”任一坐标，工具头位置/姿态实时更新。
- 点击“重新扫描”时，结果点和工具头变灰/变透明；扫描完成后结果点更新为新值。
