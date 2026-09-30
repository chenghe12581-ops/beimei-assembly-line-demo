# Exec Plans

复杂任务需要在这里创建执行计划。

适合创建 exec plan 的任务：

- 跨多个页面或大型组件。
- 需要拆分 `BeimeiAssemblyLinePage.tsx`。
- 需要将组件库中的基础组件迁移到主页面。
- 需要引入 API/service/domain 层。
- 需要改变工序生成逻辑。

建议格式：

```md
# Task Name

## Goal

## Context

## Scope

## Non-goals

## Steps

## Verification

## Risks
```
