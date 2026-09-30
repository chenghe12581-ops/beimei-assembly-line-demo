export type CoverageLevel = 'good' | 'watch' | 'risk';

export type ComponentCategory = '基础控件' | '参数表单' | '业务复合' | '反馈与浮层' | '结构导航';

export type ComponentStateKey =
  | 'default'
  | 'hover'
  | 'selected'
  | 'open'
  | 'invalid'
  | 'disabled'
  | 'loading'
  | 'dirty';

export type ComponentPropType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'react-node';

export type ComponentPropDefinition = {
  type: ComponentPropType;
  description: string;
  enum?: readonly (string | number | boolean)[];
  default?: unknown;
  examples?: readonly unknown[];
  minimum?: number;
  maximum?: number;
  items?: ComponentPropDefinition;
  properties?: Record<string, ComponentPropDefinition>;
};

export type ComponentPropRule = {
  when: Record<string, unknown>;
  require?: readonly string[];
  forbid?: readonly string[];
  description: string;
};

export type ComponentPropsSchema = {
  type: 'object';
  description: string;
  required?: readonly string[];
  properties: Record<string, ComponentPropDefinition>;
  rules?: readonly ComponentPropRule[];
  invariants?: readonly string[];
  inheritedProps?: readonly string[];
};

export type ComponentEventContract = {
  name: string;
  prop: string;
  payload: string;
  description: string;
};

export type ComponentImplementation = {
  status: 'implemented' | 'pattern';
  sourcePath: string | null;
  exportName: string | null;
};

export type ComponentRegistryItem = {
  id: string;
  name: string;
  category: ComponentCategory;
  purpose: string;
  contract: string;
  demo: string;
  usedIn: string[];
  tokenCoverage: number;
  states: ComponentStateKey[];
  risk: CoverageLevel;
  riskNote: string;
  implementation?: ComponentImplementation;
  propsSchema?: ComponentPropsSchema;
  events?: readonly ComponentEventContract[];
};

export const buttonPropsSchema = {
  type: 'object',
  description: '项目命令按钮。优先通过 variant 和 size 选择既有视觉，不在调用处重写颜色与高度。',
  required: ['children'],
  inheritedProps: ['React.ComponentProps<\'button\'>'],
  properties: {
    children: { type: 'react-node', description: '按钮标签或 icon。中文命令使用简短动宾结构。' },
    variant: {
      type: 'string',
      description: '按钮的语义和视觉层级。',
      enum: ['primary', 'secondary', 'brandOutline', 'subtle', 'ghost', 'danger', 'link'],
      default: 'primary',
    },
    size: {
      type: 'string',
      description: '控件尺寸；纯图标命令使用 icon。',
      enum: ['sm', 'md', 'lg', 'icon'],
      default: 'md',
    },
    asChild: { type: 'boolean', description: '是否通过 Radix Slot 将样式转交给子元素。', default: false },
    disabled: { type: 'boolean', description: '是否禁止操作。', default: false },
    type: {
      type: 'string',
      description: '原生 button 类型。表单内非提交命令应显式使用 button。',
      enum: ['button', 'submit', 'reset'],
      default: 'button',
    },
    'aria-label': { type: 'string', description: '纯图标按钮的无障碍名称。', examples: ['关闭', '刷新'] },
  },
  rules: [
    {
      when: { size: 'icon' },
      require: ['aria-label'],
      description: '纯图标按钮必须提供可理解的无障碍名称。',
    },
  ],
  invariants: ['危险且不可逆的操作使用 danger，并由上层流程提供确认。', '调用处不得覆盖品牌主色或控件高度。'],
} as const satisfies ComponentPropsSchema;

export const inputPropsSchema = {
  type: 'object',
  description: 'Token 驱动的基础文本或数值输入框。业务校验由上层 feature/domain 提供。',
  inheritedProps: ['React.InputHTMLAttributes<HTMLInputElement>（不含原生 size）'],
  properties: {
    value: { type: 'string', description: '受控输入值。数值编辑建议保留 string 中间态。', examples: ['120.0', '-30.5', ''] },
    defaultValue: { type: 'string', description: '非受控输入的初始值。' },
    size: { type: 'string', description: '输入框视觉尺寸。', enum: ['sm', 'md', 'lg'], default: 'md' },
    type: {
      type: 'string',
      description: '原生输入类型。工程数值需要保留编辑中间态时优先使用 text。',
      enum: ['text', 'number', 'search', 'password'],
      default: 'text',
    },
    placeholder: { type: 'string', description: '未输入时的短提示，不替代表单 label。' },
    invalid: { type: 'boolean', description: '是否进入异常视觉状态。', default: false },
    disabled: { type: 'boolean', description: '是否禁止编辑和聚焦。', default: false },
    readOnly: { type: 'boolean', description: '是否只读但仍允许聚焦与复制。', default: false },
    'aria-describedby': { type: 'string', description: '关联帮助文本或错误信息元素 id。' },
  },
  rules: [
    {
      when: { invalid: true },
      require: ['aria-describedby'],
      description: '异常输入应关联可读的错误原因，而不是只改变边框颜色。',
    },
  ],
  invariants: ['value 与 defaultValue 不得同时使用。', '通用 Input 不直接执行领域校验或请求。'],
} as const satisfies ComponentPropsSchema;

export const checkboxPropsSchema = {
  type: 'object',
  description: '支持选中、半选、异常和禁用状态的基础 Checkbox。',
  inheritedProps: ['React.ButtonHTMLAttributes<HTMLButtonElement>（不含 type 和 onChange）'],
  properties: {
    checked: { type: 'boolean', description: '受控选中状态。' },
    defaultChecked: { type: 'boolean', description: '非受控初始选中状态。', default: false },
    indeterminate: { type: 'boolean', description: '是否显示半选状态。', default: false },
    invalid: { type: 'boolean', description: '是否显示异常状态。', default: false },
    disabled: { type: 'boolean', description: '是否禁止切换。', default: false },
    size: { type: 'string', description: 'Checkbox 尺寸。', enum: ['sm', 'md'], default: 'md' },
    'aria-label': { type: 'string', description: '无可见 label 时使用的无障碍名称。' },
  },
  invariants: ['checked 与 defaultChecked 不得同时使用。', '批量选择场景使用 indeterminate 表达部分选中。'],
} as const satisfies ComponentPropsSchema;

export const objectMultiSelectPropsSchema = {
  type: 'object',
  description: '工件、焊缝、打磨面和装配基准等对象的受控多选组件。',
  required: ['items', 'selectedIds'],
  properties: {
    items: {
      type: 'array',
      description: '可选对象列表。',
      items: {
        type: 'object',
        description: '对象选项。',
        properties: {
          id: { type: 'string', description: '稳定且唯一的对象 id。' },
          name: { type: 'string', description: '用户可见名称。' },
        },
      },
    },
    selectedIds: {
      type: 'array',
      description: '当前已选对象 id。',
      items: { type: 'string', description: '对象 id。' },
      default: [],
    },
    invalid: { type: 'boolean', description: '是否显示选择异常。', default: false },
    placeholder: { type: 'string', description: '空选择时显示的提示。', default: '请选择对象' },
    size: { type: 'string', description: '触发器和选项密度。', enum: ['sm', 'md'], default: 'md' },
    showSelectAll: { type: 'boolean', description: '是否提供全选入口。', default: false },
    selectAllLabel: { type: 'string', description: '全选入口文案。', default: '全选' },
  },
  invariants: [
    'selectedIds 必须是 items 中 id 的子集。',
    'items 的 id 必须唯一且在重新排序后保持稳定。',
    '组件只负责选择，不在内部解释对象之间的领域关系。',
  ],
} as const satisfies ComponentPropsSchema;

export const modalShellPropsSchema = {
  type: 'object',
  description: '弹窗外壳治理契约。当前是样式与组合模式，还没有可直接导入的统一 ModalShell 实现。',
  required: ['open', 'title', 'children'],
  properties: {
    open: { type: 'boolean', description: '是否挂载并显示弹窗。' },
    title: { type: 'string', description: '弹窗标题，使用具体业务对象或动作。' },
    children: { type: 'react-node', description: '弹窗主体内容。' },
    footer: { type: 'react-node', description: '底部操作区；主操作位于最右侧。' },
    size: {
      type: 'string',
      description: '弹窗宽度与信息密度模板。',
      enum: ['sm', 'md', 'lg', 'workspace'],
      default: 'md',
    },
    loading: { type: 'boolean', description: '是否处于提交或加载状态。', default: false },
    closeOnBackdrop: { type: 'boolean', description: '点击遮罩是否允许关闭。', default: false },
  },
  invariants: [
    '涉及未保存数据时不得通过遮罩静默关闭。',
    '密集业务弹窗使用 8px 外壳圆角和项目玻璃背景 token。',
    '在统一组件实现完成前，Agent 必须复用现有业务弹窗或显式创建 feature 级外壳。',
  ],
} as const satisfies ComponentPropsSchema;

export const categories: ComponentCategory[] = ['基础控件', '参数表单', '业务复合', '反馈与浮层', '结构导航'];

export const componentRegistry: ComponentRegistryItem[] = [
  {
    id: 'button',
    name: 'Button',
    category: '基础控件',
    purpose: '页面命令、工具按钮和弹窗操作',
    contract: '完整',
    demo: '完整',
    usedIn: ['项目管理', '图纸管理', '工艺规划'],
    tokenCoverage: 92,
    states: ['default', 'hover', 'disabled', 'loading'],
    risk: 'good',
    riskNote: '基础变体稳定，后续补 loading 真实用例即可。',
    implementation: { status: 'implemented', sourcePath: 'src/components/ui/button', exportName: 'Button' },
    propsSchema: buttonPropsSchema,
    events: [{ name: 'click', prop: 'onClick', payload: 'React.MouseEvent<HTMLButtonElement>', description: '用户执行按钮命令。' }],
  },
  {
    id: 'input',
    name: 'Input',
    category: '基础控件',
    purpose: '文本、搜索和基础数值编辑',
    contract: '完整',
    demo: '部分',
    usedIn: ['搜索', '基础表单', '参数编辑'],
    tokenCoverage: 88,
    states: ['default', 'hover', 'invalid', 'disabled'],
    risk: 'good',
    riskNote: '基础实现已 token 化；工程单位场景仍应使用专门的带单位输入模式。',
    implementation: { status: 'implemented', sourcePath: 'src/components/ui/input', exportName: 'Input' },
    propsSchema: inputPropsSchema,
    events: [
      { name: 'change', prop: 'onChange', payload: 'React.ChangeEvent<HTMLInputElement>', description: '用户编辑输入值。' },
      { name: 'blur', prop: 'onBlur', payload: 'React.FocusEvent<HTMLInputElement>', description: '失焦后触发上层格式化或校验。' },
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: '基础控件',
    purpose: '单项选择、批量选择和半选状态',
    contract: '完整',
    demo: '完整',
    usedIn: ['树节点', '批量操作', '工单选择'],
    tokenCoverage: 90,
    states: ['default', 'hover', 'selected', 'invalid', 'disabled'],
    risk: 'good',
    riskNote: '受控、非受控和半选事件已形成稳定基础契约。',
    implementation: { status: 'implemented', sourcePath: 'src/components/ui/checkbox', exportName: 'Checkbox' },
    propsSchema: checkboxPropsSchema,
    events: [
      { name: 'checked-change', prop: 'onCheckedChange', payload: 'boolean', description: '选中状态变化后的简化事件。' },
      { name: 'change', prop: 'onChange', payload: 'CheckboxChangeEvent', description: '兼容包含 checked 与 indeterminate 的事件结构。' },
    ],
  },
  {
    id: 'unit-number-input',
    name: 'UnitNumberInput',
    category: '基础控件',
    purpose: '所有带单位数字输入的统一视觉源',
    contract: '完整',
    demo: '完整',
    usedIn: ['工艺参数设置', '点位编辑', '关节角'],
    tokenCoverage: 78,
    states: ['default', 'hover', 'invalid', 'disabled', 'dirty'],
    risk: 'watch',
    riskNote: '当前仍是跨场景模式，尚未收敛为单一可导入组件。',
  },
  {
    id: 'object-multi-select',
    name: 'ObjectMultiSelect',
    category: '参数表单',
    purpose: '工件模型、焊缝、打磨、装配基准多选',
    contract: '完整',
    demo: '完整',
    usedIn: ['任务配置', '特征提取', '坐标转换'],
    tokenCoverage: 74,
    states: ['default', 'hover', 'open', 'invalid', 'disabled'],
    risk: 'watch',
    riskNote: '菜单打开态需要和主页面同步做一次截图核对。',
    implementation: {
      status: 'implemented',
      sourcePath: 'src/app/components/process/ObjectMultiSelect.tsx',
      exportName: 'ObjectMultiSelect',
    },
    propsSchema: objectMultiSelectPropsSchema,
    events: [{ name: 'change', prop: 'onChange', payload: 'string[]', description: '已选对象 id 集合发生变化。' }],
  },
  {
    id: 'object-single-select',
    name: 'ObjectSingleSelect',
    category: '参数表单',
    purpose: '特征提取里的零件 A/B 单选',
    contract: '完整',
    demo: '部分',
    usedIn: ['手动焊缝提取', '手动打磨提取', '装配基准提取'],
    tokenCoverage: 70,
    states: ['default', 'open', 'invalid', 'disabled'],
    risk: 'watch',
    riskNote: '单选和多选应共享触发器、浮层、异常态规则。',
  },
  {
    id: 'percent-slider',
    name: 'PercentSlider',
    category: '基础控件',
    purpose: '覆盖率、阈值等百分比参数',
    contract: '完整',
    demo: '完整',
    usedIn: ['抓取阈值', '工作台覆盖率', '参数设置弹窗'],
    tokenCoverage: 68,
    states: ['default', 'hover', 'invalid', 'disabled'],
    risk: 'watch',
    riskNote: '刻度、输入框和滑块颜色应作为一组规则展示。',
  },
  {
    id: 'process-field-group',
    name: 'ProcessFieldGroup',
    category: '参数表单',
    purpose: '复合输入组的横向列宽与间距',
    contract: '部分',
    demo: '完整',
    usedIn: ['工作台参数', '软限位', '姿态角'],
    tokenCoverage: 84,
    states: ['default', 'invalid', 'disabled'],
    risk: 'good',
    riskNote: '适合作为复合字段布局的唯一入口。',
  },
  {
    id: 'process-step-panel',
    name: 'ProcessStepPanel',
    category: '业务复合',
    purpose: '七类任务面板展开内容',
    contract: '完整',
    demo: '完整',
    usedIn: ['工序序列生成', '样式 C 任务详情'],
    tokenCoverage: 62,
    states: ['default', 'selected', 'invalid', 'disabled', 'dirty'],
    risk: 'risk',
    riskNote: '业务变体多，必须保留真实任务列表宽度标尺。',
  },
  {
    id: 'pick-path-points',
    name: 'PickPathPoints',
    category: '业务复合',
    purpose: '安全点浮窗、图例折叠、XYZ/RPY 编辑',
    contract: '完整',
    demo: '完整',
    usedIn: ['打磨', '装配定位', '定位焊扫描', '定位焊'],
    tokenCoverage: 66,
    states: ['default', 'selected', 'invalid', 'disabled', 'dirty'],
    risk: 'watch',
    riskNote: '旧强调态和样式 C 低调态需并行展示。',
  },
  {
    id: 'point-info-row',
    name: 'PointInfoRow',
    category: '业务复合',
    purpose: '点位名称 + XYZ/RPY 单行或折叠编辑',
    contract: '完整',
    demo: '完整',
    usedIn: ['结果点位', '路径点位', '焊缝段'],
    tokenCoverage: 72,
    states: ['default', 'hover', 'selected', 'invalid', 'disabled', 'dirty'],
    risk: 'good',
    riskNote: '选中态已在主页面和组件库同步。',
  },
  {
    id: 'joint-value-row',
    name: 'JointValueRow',
    category: '业务复合',
    purpose: 'J1-J8 slider + stepper 数值输入',
    contract: '完整',
    demo: '完整',
    usedIn: ['放置', '翻面压紧'],
    tokenCoverage: 64,
    states: ['default', 'hover', 'invalid', 'disabled', 'dirty'],
    risk: 'watch',
    riskNote: '需要在真实右侧任务列表宽度中检查列比例。',
  },
  {
    id: 'tree-node-row',
    name: 'TreeNodeRow',
    category: '结构导航',
    purpose: '项目管理树与工艺规划模型树',
    contract: '完整',
    demo: '完整',
    usedIn: ['项目管理', '工艺规划结构树'],
    tokenCoverage: 76,
    states: ['default', 'hover', 'selected', 'disabled'],
    risk: 'watch',
    riskNote: '缩进、icon-title gap、checkbox 显隐需要继续用标尺管理。',
  },
  {
    id: 'modal-shell',
    name: 'ModalShell',
    category: '反馈与浮层',
    purpose: '图纸管理、参数设置、确认弹窗外壳',
    contract: '完整',
    demo: '完整',
    usedIn: ['图纸管理', '工艺参数设置', '删除确认'],
    tokenCoverage: 82,
    states: ['default', 'loading'],
    risk: 'watch',
    riskNote: '已有稳定样式模式，但尚未形成可直接导入的统一组件。',
    implementation: { status: 'pattern', sourcePath: null, exportName: null },
    propsSchema: modalShellPropsSchema,
    events: [{ name: 'close', prop: 'onClose', payload: 'void', description: '用户请求关闭弹窗，由上层处理脏数据确认。' }],
  },
  {
    id: 'toast',
    name: 'Toast',
    category: '反馈与浮层',
    purpose: '全局成功、异常、warning、info 反馈',
    contract: '完整',
    demo: '完整',
    usedIn: ['特征提取', '导入解析', '任务生成'],
    tokenCoverage: 80,
    states: ['default', 'loading'],
    risk: 'good',
    riskNote: '定位规则已经有组件库场景化展示。',
  },
  {
    id: 'badge',
    name: 'Badge',
    category: '基础控件',
    purpose: '阈值、数量和状态标记',
    contract: '部分',
    demo: '部分',
    usedIn: ['阈值回显', '数量标记', '状态提示'],
    tokenCoverage: 58,
    states: ['default', 'disabled'],
    risk: 'risk',
    riskNote: 'success/warning/danger token 已声明，但 demo 覆盖不完整。',
  },
  {
    id: 'switch',
    name: 'Switch',
    category: '基础控件',
    purpose: '磁铁启用、路径自动合并等二值设置',
    contract: '完整',
    demo: '部分',
    usedIn: ['抓取参数', '安全点启用'],
    tokenCoverage: 70,
    states: ['default', 'selected', 'disabled'],
    risk: 'watch',
    riskNote: 'checked/unchecked 文案和位置应固定。',
  },
  {
    id: 'segmented-control',
    name: 'SegmentedControl',
    category: '基础控件',
    purpose: '少量互斥选项切换',
    contract: '完整',
    demo: '部分',
    usedIn: ['抓具类型', '工作台类型', '参数模式'],
    tokenCoverage: 72,
    states: ['default', 'selected', 'disabled'],
    risk: 'watch',
    riskNote: '样式 C 下划线 tab 和胶囊切换要严格分开。',
  },
];
