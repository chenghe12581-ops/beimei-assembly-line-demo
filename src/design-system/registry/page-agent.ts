import { componentRegistry } from './component-registry';
import { getLayoutTemplate, type PageSpec } from './page-spec';

export type PageFinding = { level: 'error' | 'warning' | 'info'; area: 'visual' | 'workflow'; message: string };
export type PageValidation = { valid: boolean; findings: PageFinding[] };
export type PageEvaluation = PageValidation & { visualScore: number; workflowScore: number; totalScore: number };

const hasWord = (prompt: string, words: string[]) => words.some((word) => prompt.includes(word));

export function validatePageSpec(spec: PageSpec): PageValidation {
  const findings: PageFinding[] = [];
  const layout = getLayoutTemplate(spec.layout);
  if (!layout) findings.push({ level: 'error', area: 'visual', message: `未注册的布局模板: ${spec.layout}` });

  const slotIds = new Set(layout?.slots.map((slot) => slot.id) ?? []);
  const requiredSlots = new Set(layout?.slots.filter((slot) => slot.required).map((slot) => slot.id) ?? []);
  const usedSlots = new Set(spec.components.map((component) => component.slot));
  requiredSlots.forEach((slot) => {
    if (!usedSlots.has(slot)) findings.push({ level: 'error', area: 'visual', message: `缺少必需布局区: ${slot}` });
  });

  const ids = new Set<string>();
  spec.components.forEach((instance) => {
    if (ids.has(instance.id)) findings.push({ level: 'error', area: 'visual', message: `组件实例 id 重复: ${instance.id}` });
    ids.add(instance.id);
    if (!slotIds.has(instance.slot)) findings.push({ level: 'error', area: 'visual', message: `${instance.id} 使用了不存在的 slot: ${instance.slot}` });
    const contract = componentRegistry.find((item) => item.id === instance.component);
    if (!contract) {
      findings.push({ level: 'error', area: 'visual', message: `${instance.id} 引用了未知组件: ${instance.component}` });
      return;
    }
    const props = instance.props ?? {};
    (contract.propsSchema?.required ?? []).forEach((prop) => {
      if (!(prop in props)) findings.push({ level: 'error', area: 'visual', message: `${instance.id} 缺少必填 prop: ${prop}` });
    });
    contract.propsSchema?.rules?.forEach((rule) => {
      const matched = Object.entries(rule.when).every(([key, value]) => props[key] === value);
      if (!matched) return;
      rule.require?.forEach((prop) => {
        if (!(prop in props)) findings.push({ level: 'error', area: 'visual', message: `${instance.id}: ${rule.description}（缺少 ${prop}）` });
      });
      rule.forbid?.forEach((prop) => {
        if (prop in props) findings.push({ level: 'error', area: 'visual', message: `${instance.id}: ${rule.description}（不应提供 ${prop}）` });
      });
    });
  });

  const workflowStateIds = new Set(spec.workflow.states.map((state) => state.id));
  if (!workflowStateIds.has(spec.workflow.entryState)) findings.push({ level: 'error', area: 'workflow', message: `入口状态不存在: ${spec.workflow.entryState}` });
  spec.workflow.transitions.forEach((transition) => {
    if (!workflowStateIds.has(transition.from) || !workflowStateIds.has(transition.to)) {
      findings.push({ level: 'error', area: 'workflow', message: `状态转移引用了不存在的状态: ${transition.id}` });
    }
  });
  if (spec.workflow.states.length > 1 && spec.workflow.transitions.length === 0) {
    findings.push({ level: 'warning', area: 'workflow', message: '页面声明了多个状态，但没有任何用户事件转移。' });
  }
  if (spec.edgeCases.length === 0) findings.push({ level: 'warning', area: 'workflow', message: '没有声明异常情况，生成前至少补充空态、校验失败和请求失败。' });
  return { valid: findings.every((finding) => finding.level !== 'error'), findings };
}

export function evaluatePageSpec(spec: PageSpec): PageEvaluation {
  const validation = validatePageSpec(spec);
  let visualScore = 100;
  let workflowScore = 100;
  spec.components.forEach((instance) => {
    const contract = componentRegistry.find((item) => item.id === instance.component);
    if (!contract) visualScore -= 20;
    else {
      visualScore -= Math.round((100 - contract.tokenCoverage) / 20);
      if (contract.risk === 'risk') visualScore -= 5;
      if (contract.implementation?.status !== 'implemented') visualScore -= 4;
    }
  });
  validation.findings.forEach((finding) => {
    const penalty = finding.level === 'error' ? 15 : finding.level === 'warning' ? 6 : 0;
    if (finding.area === 'visual') visualScore -= penalty;
    else workflowScore -= penalty;
  });
  const edgeCaseIds = new Set(spec.edgeCases.map((edgeCase) => edgeCase.id));
  if (edgeCaseIds.size < 3) workflowScore -= 8;
  return { ...validation, visualScore: Math.max(0, visualScore), workflowScore: Math.max(0, workflowScore), totalScore: Math.max(0, Math.round((visualScore + workflowScore) / 2)) };
}

export function draftPageSpecFromPrompt(prompt: string): PageSpec {
  const isForm = hasWord(prompt, ['表单', '创建', '编辑', '配置']);
  const isMonitor = hasWord(prompt, ['监控', '统计', '产能', '看板']);
  const layout = isForm ? 'form-modal' : isMonitor ? 'dashboard' : 'workbench-3-column';
  const components = isForm
    ? [
        { id: 'form-fields', component: 'process-field-group', slot: 'workspace', purpose: '承载核心参数编辑', states: ['default', 'invalid', 'dirty'], actions: ['change-value', 'validate'] },
        { id: 'submit', component: 'button', slot: 'footer', purpose: '提交配置', props: { children: '保存', variant: 'primary', type: 'submit' }, actions: ['submit'] },
        { id: 'cancel', component: 'button', slot: 'footer', purpose: '取消编辑', props: { children: '取消', variant: 'secondary', type: 'button' }, actions: ['cancel'] },
      ]
    : isMonitor
      ? [
          { id: 'filters', component: 'segmented-control', slot: 'toolbar', purpose: '切换统计时间范围', states: ['default', 'selected'] },
          { id: 'status', component: 'badge', slot: 'workspace', purpose: '展示关键状态', states: ['default'] },
          { id: 'refresh', component: 'button', slot: 'toolbar', purpose: '刷新数据', props: { children: '刷新', variant: 'secondary' }, actions: ['refresh'] },
        ]
      : [
          { id: 'tree', component: 'tree-node-row', slot: 'navigation', purpose: '选择项目或工件', states: ['default', 'selected', 'disabled'], actions: ['select-node'] },
          { id: 'viewport', component: 'pick-path-points', slot: 'workspace', purpose: '在主工作区查看和编辑点位', states: ['default', 'selected', 'dirty'] },
          { id: 'task-panel', component: 'process-step-panel', slot: 'inspector', purpose: '配置当前任务', states: ['default', 'selected', 'invalid', 'dirty'], actions: ['change-task', 'generate'] },
          { id: 'generate', component: 'button', slot: 'toolbar', purpose: '生成工序序列', props: { children: '生成工序序列', variant: 'primary' }, actions: ['generate'] },
          { id: 'feedback', component: 'toast', slot: 'overlay', purpose: '反馈生成结果', states: ['default', 'loading'] },
        ];
  return {
    version: '1.0',
    intent: { id: 'generated-page', title: prompt.slice(0, 32) || '未命名页面', summary: prompt, domain: isMonitor ? 'capacity-statistics' : 'assembly-line', primaryGoal: isForm ? '完成配置并提交' : isMonitor ? '快速发现状态变化' : '完成工艺规划任务', density: 'compact' },
    layout,
    components,
    workflow: {
      entryState: isForm ? 'editing' : 'ready',
      states: isForm ? [{ id: 'editing', label: '编辑中', initial: true }, { id: 'invalid', label: '校验失败' }, { id: 'saving', label: '保存中' }, { id: 'saved', label: '已保存', terminal: true }] : [{ id: 'ready', label: '可操作', initial: true }, { id: 'loading', label: '处理中' }, { id: 'success', label: '完成', terminal: true }, { id: 'error', label: '异常' }],
      transitions: isForm ? [{ id: 'validate-fail', from: 'editing', event: 'submit-invalid', to: 'invalid' }, { id: 'save', from: 'editing', event: 'submit-valid', to: 'saving' }, { id: 'save-success', from: 'saving', event: 'request-success', to: 'saved' }, { id: 'save-error', from: 'saving', event: 'request-failed', to: 'invalid' }] : [{ id: 'start', from: 'ready', event: 'execute', to: 'loading' }, { id: 'done', from: 'loading', event: 'request-success', to: 'success' }, { id: 'failed', from: 'loading', event: 'request-failed', to: 'error' }],
    },
    edgeCases: [
      { id: 'empty', trigger: '没有可用数据或对象', expected: '展示空态，并保留下一步入口的禁用原因', severity: 'warning' },
      { id: 'invalid', trigger: '必填参数缺失或格式错误', expected: '字段进入 invalid，聚焦首个错误并阻止提交', severity: 'error' },
      { id: 'request-failed', trigger: '生成或保存请求失败', expected: '保留用户输入，允许重试并展示可读错误', severity: 'error' },
    ],
  };
}
