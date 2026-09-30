# Design System Consistency Audit

日期：2026-06-23

## 结论

当前项目的 Design System 已经建立了 token 分层和第一批 token-driven 组件，但北煤机 demo 主页面尚未完全迁移到这套 token 与组件体系。

因此，当前状态应描述为：

```txt
Design System foundation ready.
Main demo UI is partially aligned, not fully tokenized.
```

不建议对外表述为“主页面组件样式已经完全和 design token 一致”。

## 已完成

- `design-tokens/` 已整理为 `source / semantic / component / build` 四层。
- `src/styles/theme.css` 已建立 `--ds-*` CSS variables 和 Tailwind v4 bridge。
- `src/components/ui/button/` 已实现 token-driven Button。
- `src/components/ui/input/` 已实现 token-driven Input。
- `/primitive-lab` 已建立基础组件试验页，目前包含 Button 和 Input，后续组件按顺序继续补。
- `/component-lab` 已展示 Raw / Semantic / Component 三层 token。

## 主页面当前一致性

主页面 `src/app/BeimeiAssemblyLinePage.tsx` 已经有少量 token 化痕迹，例如：

- `rounded-ds-lg`
- `bg-ds-bg-surface`
- `bg-ds-bg-glass-modal`
- `text-ds-text-muted`
- `border-ds-border-subtle`
- `p-ds-150`
- `gap-ds-100`
- `ds-parameter-card`

但主页面仍大量使用旧 Tailwind 直写样式。扫描结果中出现频率较高的示例：

| 类型 | 示例 | 状态 |
| --- | --- | --- |
| neutral color | `slate-400`, `slate-800`, `slate-500`, `slate-200` | 可映射到 semantic token，但未统一替换 |
| brand color | `orange-500`, `orange-700`, `orange-50`, `orange-300` | 可映射到 brand / focus token，但未统一替换 |
| status color | `red-50`, `red-500`, `emerald-50`, `amber-500` | 可映射到 status token，但未统一替换 |
| typography | `text-[11px]`, `text-[10px]`, `text-[13px]`, `text-[15px]` | 部分可映射到 typography token，仍有未归类值 |
| radius | `rounded-lg`, `rounded-xl`, `rounded-md`, `rounded-full` | 可映射到 radius token，但未统一替换 |
| shadow | `shadow-sm`, `shadow-lg`, `shadow-xl` | 部分可映射到 shadow token，仍有自定义浮层阴影 |
| fixed size | `w-[420px]`, `w-[800px]`, `h-[800px]`, `h-[52px]` | 多数属于布局/业务容器，不应直接强行 token 化 |

## 现有样式与 token 的关系

主页面不是完全脱离 token 的旧样式，而是 token 体系的重要来源之一。

已被 token 吸收的样式规律：

- slate 中性色轴。
- orange 主品牌色。
- red / amber / emerald / blue 状态色。
- 8px 输入框圆角。
- 12px 面板圆角。
- 玻璃浮层背景。
- 28 / 32 / 36 / 40px control height。
- 100 / 200ms 基础 motion。

尚未完全吸收或未迁移的部分：

- ObjectMultiSelect 的完整 component token。
- Toast 的完整 component token。
- 主页面中的多种业务浮层尺寸。
- 主页面中的大量 `text-[11px]` 和 `text-[10px]` 是否全部归入 `helper / micro`。
- 一些 feature color 的扩展色阶，例如 teal/orange/blue 的 100/200/300/800/950 使用。

## 对同事的交付说明建议

可以随 design system 包附带以下说明：

```txt
这份 Design System 包包含当前项目正在沉淀的 token、语义 token、组件 token、样式桥接，以及第一批 token-driven Button/Input 组件。

需要注意：北煤机 demo 主页面目前还没有完全迁移到这套 token 和组件。主页面现有样式是 token 的来源之一，但仍有大量旧 Tailwind class 直写。后续计划是先完善基础组件，再逐步替换主页面 UI，最后达成全站一致。
```

## 迁移优先级

建议不要直接全局替换主页面 class。更稳的顺序是：

1. 完成基础组件：Button、Input、Panel、TreeNodeRow、ModalShell、ObjectMultiSelect、Toast。
2. 为缺失组件补 component token：ObjectMultiSelect、Toast。
3. 在 `/primitive-lab` 和 `/component-lab` 验证组件状态、尺寸、异常和禁用态。
4. 按主页面风险从低到高迁移：Toast、Button、Input、TreeNodeRow、ModalShell、ProcessStepPanel。
5. 每迁移一类组件后保留原 userflow 行为，只替换视觉和结构。

## 风险

- 主页面已经跑通的 userflow 不应在当前阶段被批量重构。
- 直接替换 Tailwind class 可能导致弹窗、3D 视窗浮层、工序面板宽度和滚动区域出现视觉回归。
- 需要先用组件试验页稳定基础组件，再倒推主页面替换。

## 当前缺口

- `object-multi-select.tokens.json` 未创建。
- `toast.tokens.json` 未创建。
- Panel、TreeNodeRow、ModalShell 尚未实现为 `src/components/ui/` 下的新 token-driven 组件。
- 主页面旧实现尚未统一导入新 Button/Input。
