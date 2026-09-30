# 工艺规划弹窗 Feature 说明

## 目标

工艺规划页面的弹窗和 3D 视窗浮窗按用户动作拆分为独立 TSX 组件。页面组件只持有项目状态、领域校验和回调，不在 JSX 中重新实现选择规则或弹窗壳层。

## 组件边界

| 组件 | Feature | 状态归属 |
| --- | --- | --- |
| `CoordinateTransformPanel` | 选择零件、重选 pivot、XYZ/RPY 偏移、应用/取消 | 页面负责坐标转换临时状态和 3D 回显 |
| `ManualFeatureExtractionPanel` | 手动焊缝/打磨提取、候选状态、清空/确认 | 页面负责面选择、交线计算、相接校验和特征写入 |
| `AssemblyDatumExtractionPanel` | 子板/父板选择、四步基准指配、确认 | 页面负责基准线点选、步骤顺序和装配基准写入 |
| `MagnetParameterPanel` | 当前抓取工序的磁铁参数编辑和重置 | 页面负责工序配置重算、dirty state 和预览 |
| `ProcessParameterModal` | 全局工艺参数设置的固定遮罩、header、footer | 页面负责参数分页内容和未保存拦截 |
| `AddProcessTaskDialog` | 新增任务的固定遮罩、标题、footer | 页面负责工序类型、对象选择和任务创建 |

## 交互约束

- 坐标转换、手动焊缝、手动打磨和装配基准浮窗互斥；打开新浮窗时由页面清理其它临时选择。
- 装配基准的子板和父板选择器必须纵向排列，两个控件占满浮窗内容宽度；长名称允许换行，不以并列布局牺牲可读性。
- 浮窗内部只消费 props 和回调，不直接访问 `projects`、Three.js 场景或未来 API。
- 纯 UI 组件不决定“是否相接”“是否存在焊缝”“是否允许写入特征”等领域规则。

## 文件约定

新增工艺规划浮窗放在 `src/app/components/process-planning/`。页面文件可以继续保留状态和业务 helper，但新增弹窗不能再以内联大块 JSX 作为唯一实现。
