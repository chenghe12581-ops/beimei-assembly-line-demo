# API Notes

当前项目是前端 demo 原型，尚未接入真实后端 API。

当前约定：

- 允许使用本地 state 和 fake data 表达 demo 流程。
- 允许使用遮罩表示 3D 视窗回显。
- 不要在 UI 组件中直接写未来后端请求。
- 后续接入 API 时，应先定义 API/client/service 层，再替换 demo state。

未来 API 文档应记录：

- 接口名称。
- 请求参数。
- 响应结构。
- 错误状态。
- loading 和重试策略。
- 与领域对象的映射关系。
