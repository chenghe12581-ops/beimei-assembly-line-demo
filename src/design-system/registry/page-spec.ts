import { componentRegistry, type ComponentRegistryItem } from './component-registry';

export type PageDensity = 'compact' | 'comfortable';
export type PageSlotKind = 'navigation' | 'workspace' | 'inspector' | 'toolbar' | 'footer' | 'overlay';

export type PageIntent = {
  id: string;
  title: string;
  summary: string;
  domain: string;
  primaryGoal: string;
  persona?: string;
  density?: PageDensity;
};

export type LayoutSlot = {
  id: string;
  label: string;
  kind: PageSlotKind;
  required?: boolean;
  minWidth?: number;
  scroll?: 'independent' | 'page' | 'none';
};

export type LayoutTemplate = {
  id: string;
  name: string;
  description: string;
  grid: string;
  slots: readonly LayoutSlot[];
  rules: readonly string[];
};

export type PageComponentInstance = {
  id: string;
  component: string;
  slot: string;
  purpose: string;
  props?: Record<string, unknown>;
  states?: readonly string[];
  dataBinding?: string;
  actions?: readonly string[];
};

export type PageState = {
  id: string;
  label: string;
  initial?: boolean;
  terminal?: boolean;
};

export type PageTransition = {
  id: string;
  from: string;
  event: string;
  to: string;
  guard?: string;
  effect?: string;
};

export type PageWorkflow = {
  states: readonly PageState[];
  transitions: readonly PageTransition[];
  entryState: string;
};

export type PageEdgeCase = {
  id: string;
  trigger: string;
  expected: string;
  severity: 'info' | 'warning' | 'error';
};

export type PageSpec = {
  version: '1.0';
  intent: PageIntent;
  layout: string;
  components: readonly PageComponentInstance[];
  workflow: PageWorkflow;
  edgeCases: readonly PageEdgeCase[];
};

export const layoutTemplateRegistry: readonly LayoutTemplate[] = [
  {
    id: 'workbench-3-column',
    name: '三栏工作台',
    description: '适用于结构树 + 主工作区 + 任务/参数检查器。',
    grid: '320px minmax(0, 1fr) 420px',
    slots: [
      { id: 'navigation', label: '结构导航', kind: 'navigation', required: true, minWidth: 320, scroll: 'independent' },
      { id: 'workspace', label: '主工作区', kind: 'workspace', required: true, scroll: 'none' },
      { id: 'inspector', label: '任务检查器', kind: 'inspector', required: true, minWidth: 420, scroll: 'independent' },
      { id: 'toolbar', label: '工作区工具栏', kind: 'toolbar', scroll: 'none' },
      { id: 'overlay', label: '浮层反馈', kind: 'overlay', scroll: 'none' },
    ],
    rules: ['左右侧栏固定宽度，主工作区使用 minmax(0, 1fr)。', '导航、检查器和弹窗内部滚动互不影响。'],
  },
  {
    id: 'list-detail',
    name: '列表 + 详情',
    description: '适用于项目、图纸、物料和生产任务管理。',
    grid: 'minmax(280px, 360px) minmax(0, 1fr)',
    slots: [
      { id: 'navigation', label: '列表', kind: 'navigation', required: true, scroll: 'independent' },
      { id: 'workspace', label: '详情', kind: 'workspace', required: true, scroll: 'page' },
      { id: 'toolbar', label: '列表工具栏', kind: 'toolbar', scroll: 'none' },
      { id: 'overlay', label: '浮层反馈', kind: 'overlay', scroll: 'none' },
    ],
    rules: ['列表标题和筛选固定，列表项单独滚动。', '详情区需要有空态、加载态和异常态。'],
  },
  {
    id: 'form-modal',
    name: '表单弹窗',
    description: '适用于创建、编辑和确认类短流程。',
    grid: 'minmax(0, 560px)',
    slots: [
      { id: 'workspace', label: '表单主体', kind: 'workspace', required: true, scroll: 'page' },
      { id: 'footer', label: '操作区', kind: 'footer', required: true, scroll: 'none' },
      { id: 'overlay', label: '错误提示', kind: 'overlay', scroll: 'none' },
    ],
    rules: ['提交操作固定在 footer，禁止随表单内容滚动。', '脏数据关闭必须经过确认。'],
  },
  {
    id: 'dashboard',
    name: '指标看板',
    description: '适用于容量、产能和状态监控。',
    grid: 'repeat(12, minmax(0, 1fr))',
    slots: [
      { id: 'toolbar', label: '筛选工具栏', kind: 'toolbar', required: true, scroll: 'none' },
      { id: 'workspace', label: '指标区', kind: 'workspace', required: true, scroll: 'page' },
      { id: 'overlay', label: '异常反馈', kind: 'overlay', scroll: 'none' },
    ],
    rules: ['指标卡必须说明时间范围和数据更新时间。', '图表加载失败时保留筛选条件并提供重试。'],
  },
];

export function getLayoutTemplate(id: string) {
  return layoutTemplateRegistry.find((template) => template.id === id);
}

export function getComponentContract(id: string): ComponentRegistryItem | undefined {
  return componentRegistry.find((component) => component.id === id);
}
