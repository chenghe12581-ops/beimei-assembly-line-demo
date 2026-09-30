import type { ProcessOption } from './ProductionTaskTreePanel1';
import type { HierarchicalWorkstepGroup } from './HierarchicalWorkstepList';

export type ProductionStationWorkstepTemplate =
  | 'main-grinding'
  | 'main-assembly-feed'
  | 'plate-grind-side'
  | 'plate-grinding'
  | 'turnover'
  | 'main-assembly-1'
  | 'main-assembly-2'
  | 'main-assembly-2-final';

type ProductionProcessWorkstepConfig = {
  stationId: string;
  template: ProductionStationWorkstepTemplate;
};

const processWorkstepConfigs: Record<string, ProductionProcessWorkstepConfig> = {
  'generated-grind-01': { stationId: 'area-main-grinding', template: 'main-grinding' },
  'generated-feed-front-01': { stationId: 'area-main-assembly-1', template: 'main-assembly-feed' },
  'generated-grind-02': { stationId: 'area-side-grind-1', template: 'plate-grind-side' },
  'generated-assemble-02': { stationId: 'area-main-assembly-1', template: 'main-assembly-1' },
  'generated-turnover-02-01': { stationId: 'area-turnover', template: 'turnover' },
  'generated-feed-back-02-01': { stationId: 'area-main-assembly-2', template: 'main-assembly-feed' },
  'generated-grind-03': { stationId: 'area-side-grind-2', template: 'plate-grind-side' },
  'generated-surface-grind-03': { stationId: 'area-turnover', template: 'plate-grinding' },
  'generated-assemble-03': { stationId: 'area-main-assembly-2', template: 'main-assembly-2' },
  'generated-grind-04': { stationId: 'area-main-assembly-2', template: 'plate-grind-side' },
  'generated-assemble-04': { stationId: 'area-main-assembly-2', template: 'main-assembly-2-final' },
};

const stationDemoProcesses: Record<string, ProcessOption> = {
  'area-main-grinding': {
    id: 'generated-grind-01',
    name: '打磨',
    partObject: '0162-01-010101-01',
    unit: '打磨',
  },
  'area-main-assembly-1': {
    id: 'generated-assemble-02',
    name: '装配',
    partObject: '0162-01-010101-02 + 0162-01-010101-01',
    unit: '装配',
  },
  'area-side-grind-1': {
    id: 'generated-grind-02',
    name: '侧面打磨',
    partObject: '0162-01-010101-02',
    unit: '打磨',
    batchGroup: 'side-plate-grind',
  },
  'area-turnover': {
    id: 'generated-turnover-02-01',
    name: '翻面',
    partObject: '0162-01-010101-02 + 0162-01-010101-01',
    unit: '翻面',
  },
  'area-side-grind-2': {
    id: 'generated-grind-03',
    name: '侧面打磨',
    partObject: '0162-01-010101-03',
    unit: '打磨',
    batchGroup: 'side-plate-grind',
  },
  'area-main-assembly-2': {
    id: 'generated-assemble-03',
    name: '装配',
    partObject: '0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01',
    unit: '装配',
  },
};

export type ProductionCompositeStation = {
  id: string;
  name: string;
  stationIds: string[];
  segmentProcessIds: string[];
};

// 复合执行单元：物理工位保留，但详情面板按复合工位聚合展示。
export const productionCompositeStations: ProductionCompositeStation[] = [
  {
    id: 'composite-assembly-grind-1',
    name: '主筋板装配工位1 + 贴板打磨工位1',
    stationIds: ['area-main-assembly-1', 'area-side-grind-1'],
    segmentProcessIds: ['generated-feed-front-01', 'generated-grind-02', 'generated-assemble-02'],
  },
  {
    id: 'composite-assembly-grind-2',
    name: '主筋板装配工位2 + 贴板打磨工位2',
    stationIds: ['area-main-assembly-2', 'area-side-grind-2'],
    segmentProcessIds: [
      'generated-feed-back-02-01',
      'generated-grind-03',
      'generated-assemble-03',
      'generated-grind-04',
      'generated-assemble-04',
    ],
  },
];

// 复合工位空闲态演示时使用的段落工序，与 v2 聚合工序序列保持一致。
const compositeSegmentDemoProcesses: Record<string, ProcessOption> = {
  'generated-feed-front-01': {
    id: 'generated-feed-front-01',
    name: '上料',
    partObject: '0162-01-010101-01',
    unit: '上料',
  },
  'generated-grind-02': stationDemoProcesses['area-side-grind-1'],
  'generated-assemble-02': stationDemoProcesses['area-main-assembly-1'],
  'generated-feed-back-02-01': {
    id: 'generated-feed-back-02-01',
    name: '上料',
    partObject: '0162-01-010101-02 + 0162-01-010101-01',
    unit: '上料',
  },
  'generated-grind-03': stationDemoProcesses['area-side-grind-2'],
  'generated-assemble-03': stationDemoProcesses['area-main-assembly-2'],
  'generated-grind-04': {
    id: 'generated-grind-04',
    name: '侧面打磨',
    partObject: '0162-01-010101-04',
    unit: '打磨',
    batchGroup: 'side-plate-grind',
  },
  'generated-assemble-04': {
    id: 'generated-assemble-04',
    name: '装配',
    partObject: '0162-01-010101-04 + 0162-01-010101-03 + 0162-01-010101-02 + 0162-01-010101-01',
    unit: '装配',
  },
};

// v1 归档 24 步流程中的设备级子工序 → 复合工位段落映射，用于高亮当前工步。
const compositeProcessAliases: Record<string, { segmentProcessId: string; localWorkstepIndex: number }> = {
  'generated-place-02': { segmentProcessId: 'generated-grind-02', localWorkstepIndex: 0 },
  'generated-clamp-02-01': { segmentProcessId: 'generated-assemble-02', localWorkstepIndex: 0 },
  'generated-weld-scan-02-01': { segmentProcessId: 'generated-assemble-02', localWorkstepIndex: 0 },
  'generated-weld-02-01': { segmentProcessId: 'generated-assemble-02', localWorkstepIndex: 0 },
  'generated-place-03': { segmentProcessId: 'generated-grind-03', localWorkstepIndex: 0 },
  'generated-clamp-03-02-01': { segmentProcessId: 'generated-assemble-03', localWorkstepIndex: 0 },
  'generated-weld-scan-03-02-01': { segmentProcessId: 'generated-assemble-03', localWorkstepIndex: 0 },
  'generated-weld-03-02-01': { segmentProcessId: 'generated-assemble-03', localWorkstepIndex: 0 },
  'generated-place-04': { segmentProcessId: 'generated-grind-04', localWorkstepIndex: 0 },
  'generated-clamp-04-03-02-01': { segmentProcessId: 'generated-assemble-04', localWorkstepIndex: 0 },
  'generated-weld-scan-04-03-02-01': { segmentProcessId: 'generated-assemble-04', localWorkstepIndex: 0 },
  'generated-weld-04-03-02-01': { segmentProcessId: 'generated-assemble-04', localWorkstepIndex: 0 },
};

const assemblyWorkstepNames = ['装配', '翻面压紧', '焊接'];

function splitPartObject(partObject: string) {
  return partObject.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean);
}

function getPlatePartName(process: ProcessOption) {
  return splitPartObject(process.partObject)[0] ?? process.partObject;
}

function getTemplateWorkstepNames(template: ProductionStationWorkstepTemplate, process: ProcessOption) {
  const platePartName = getPlatePartName(process);

  switch (template) {
    case 'main-grinding':
      return [
        '支撑调整', '主筋板粗定位', '主筋板抓取', '主筋板放置', '精定位/导入工件位置',
        '正面打磨', '翻面', '反面打磨', '翻面',
      ];
    case 'main-assembly-feed':
      return [
        '支撑调整',
        splitPartObject(process.partObject).length > 1 ? '主筋板组件抓取' : '主筋板抓取',
        splitPartObject(process.partObject).length > 1 ? '主筋板组件放置' : '主筋板放置',
      ];
    case 'plate-grind-side':
      return [
        `贴板[${platePartName}]粗定位`,
        `贴板[${platePartName}]抓取`,
        `贴板[${platePartName}]侧面打磨`,
        `贴板[${platePartName}]正面打磨`,
        `贴板[${platePartName}]放置`,
        `贴板[${platePartName}]精定位/导入工件位置`,
        `贴板[${platePartName}]二次调整`,
      ];
    case 'plate-grinding':
      return ['二次定位/导入工件位置', '打磨执行'];
    case 'turnover':
      return ['支撑调整', '主筋板组件抓取', '主筋板组件放置', '翻面'];
    case 'main-assembly-1':
      return [`贴板[${platePartName}]焊接`];
    case 'main-assembly-2':
      return [`贴板[${platePartName}]焊接`];
    case 'main-assembly-2-final':
      return [
        `贴板[${platePartName}]焊接`,
        '主筋板组件下料抓取', '主筋板组件下料放置',
      ];
  }
}

function hasExplicitAssemblyWorksteps(process: ProcessOption, taskProcesses: ProcessOption[]) {
  if (process.name !== '装配') return false;
  const processIndex = taskProcesses.findIndex((item) => item.id === process.id);
  return ['翻面压紧', '定位焊扫描', '定位焊'].every((stepName, index) => (
    taskProcesses[processIndex + index + 1]?.name === stepName
  ));
}

export function getProductionStationWorkstepConfig(processId: string | null | undefined) {
  return processId ? processWorkstepConfigs[processId] : undefined;
}

export function getProductionStationDemoProcess(stationId: string) {
  return stationDemoProcesses[stationId];
}

export function getProductionStationWorkstepNames(
  process: ProcessOption | undefined,
  taskProcesses: ProcessOption[] = [],
) {
  if (!process) return [];

  // Keep the archived 24-step task tree's explicit assembly sequence intact.
  if (hasExplicitAssemblyWorksteps(process, taskProcesses)) return [process.name];

  const config = processWorkstepConfigs[process.id];
  if (config) return getTemplateWorkstepNames(config.template, process);
  if (process.name !== '装配') return [process.name];
  return assemblyWorkstepNames;
}

export function getProductionCompositeStation(stationId: string | null | undefined) {
  if (!stationId) return null;
  return productionCompositeStations.find((composite) => composite.stationIds.includes(stationId)) ?? null;
}

export type ProductionCompositeWorkstepSegment = {
  processId: string;
  startIndex: number;
  workstepNames: string[];
};

// 复合工位段落必须展示完整模板，跳过 v1 归档流程的单工序折叠逻辑。
function getCompositeSegmentWorkstepNames(process: ProcessOption) {
  const config = processWorkstepConfigs[process.id];
  if (config) return getTemplateWorkstepNames(config.template, process);
  return getProductionStationWorkstepNames(process);
}

export function getProductionCompositeWorkstepSegments(
  composite: ProductionCompositeStation,
  taskProcesses: ProcessOption[] = [],
): ProductionCompositeWorkstepSegment[] {
  let startIndex = 0;
  return composite.segmentProcessIds.map((processId) => {
    const process = taskProcesses.find((item) => item.id === processId)
      ?? compositeSegmentDemoProcesses[processId];
    const workstepNames = process ? getCompositeSegmentWorkstepNames(process) : [];
    const segment = { processId, startIndex, workstepNames };
    startIndex += workstepNames.length;
    return segment;
  });
}

export function getProductionCompositeWorkstepNames(
  composite: ProductionCompositeStation,
  taskProcesses: ProcessOption[] = [],
) {
  return getProductionCompositeWorkstepSegments(composite, taskProcesses)
    .flatMap((segment) => segment.workstepNames);
}

export type ProductionCompositeWorkstepLocation = {
  segmentProcessId: string;
  startIndex: number;
  workstepNames: string[];
  aliasLocalWorkstepIndex: number | null;
};

// 按当前活动工序定位它在复合工步列表中的段落；v1 子工序通过别名表归入对应段落。
export function findProductionCompositeWorkstepLocation(
  composite: ProductionCompositeStation,
  taskProcesses: ProcessOption[],
  processId: string | null | undefined,
): ProductionCompositeWorkstepLocation | null {
  if (!processId) return null;
  const alias = compositeProcessAliases[processId];
  const segmentProcessId = alias?.segmentProcessId ?? processId;
  const segment = getProductionCompositeWorkstepSegments(composite, taskProcesses)
    .find((item) => item.processId === segmentProcessId);
  if (!segment) return null;
  return {
    segmentProcessId,
    startIndex: segment.startIndex,
    workstepNames: segment.workstepNames,
    aliasLocalWorkstepIndex: alias?.localWorkstepIndex ?? null,
  };
}

// 把复合工步列表中的索引反解为「段落工序 + 段内工步索引」，供单步调试跳段执行。
export function resolveProductionCompositeWorkstepIndex(
  composite: ProductionCompositeStation,
  taskProcesses: ProcessOption[],
  workstepIndex: number,
): { processId: string; localWorkstepIndex: number } | null {
  const segments = getProductionCompositeWorkstepSegments(composite, taskProcesses);
  const segment = segments.find((item) => (
    workstepIndex >= item.startIndex && workstepIndex < item.startIndex + item.workstepNames.length
  ));
  if (!segment) return null;
  return {
    processId: segment.processId,
    localWorkstepIndex: workstepIndex - segment.startIndex,
  };
}
function getTemplateGroupLabel(template: ProductionStationWorkstepTemplate, process: ProcessOption) {
  const platePartName = getPlatePartName(process);
  if (template === 'main-grinding') return ['主筋板上料', '主筋板打磨'];
  if (template === 'main-assembly-feed') {
    return [process.id === 'generated-feed-front-01' ? '主筋板装配工位1上料' : '主筋板组件装配工位2上料'];
  }
  if (template === 'plate-grind-side') return [`贴板[${platePartName}]装配`];
  if (template === 'plate-grinding') return ['主筋板表面打磨'];
  if (template === 'turnover') return ['主筋板组件翻面工位上料', '主筋板组件翻面'];
  if (template === 'main-assembly-2-final') return [`贴板[${platePartName}]装配`, '主筋板组件下料'];
  return [`贴板[${platePartName}]装配`];
}

/** 将扁平工步按工步类分组，供三级工步树展示。 */
export function getProductionStationWorkstepGroups(
  process: ProcessOption | undefined,
  taskProcesses: ProcessOption[] = [],
): HierarchicalWorkstepGroup[] {
  if (!process) return [];
  const config = processWorkstepConfigs[process.id];
  const names = getProductionStationWorkstepNames(process, taskProcesses);
  if (!config) return [{ id: process.id, label: process.name, objectLabel: process.partObject, steps: names.map((name, index) => ({ name, index })) }];
  const labels = getTemplateGroupLabel(config.template, process);
  if (config.template === 'main-grinding') {
    const split = 5;
    return labels.map((label, groupIndex) => ({ id: process.id + '-' + groupIndex, label, objectLabel: process.partObject, steps: names.slice(groupIndex === 0 ? 0 : split, groupIndex === 0 ? split : undefined).map((name, index) => ({ name, index: index + (groupIndex === 0 ? 0 : split) })) }));
  }
  if (config.template === 'turnover') {
    const split = 3;
    return labels.map((label, groupIndex) => ({ id: process.id + '-' + groupIndex, label, objectLabel: process.partObject, steps: names.slice(groupIndex === 0 ? 0 : split, groupIndex === 0 ? split : undefined).map((name, index) => ({ name, index: index + (groupIndex === 0 ? 0 : split) })) }));
  }
  if (config.template === 'main-assembly-2-final') {
    const split = 1;
    return labels.map((label, groupIndex) => ({
      id: process.id + '-' + groupIndex,
      label,
      objectLabel: process.partObject,
      steps: names.slice(groupIndex === 0 ? 0 : split, groupIndex === 0 ? split : undefined)
        .map((name, index) => ({ name, index: index + (groupIndex === 0 ? 0 : split) })),
    }));
  }
  return [{ id: process.id, label: labels[0] ?? process.name, objectLabel: process.partObject, steps: names.map((name, index) => ({ name, index })) }];
}

export function getProductionCompositeWorkstepGroups(
  composite: ProductionCompositeStation,
  taskProcesses: ProcessOption[] = [],
): HierarchicalWorkstepGroup[] {
  const groups = getProductionCompositeWorkstepSegments(composite, taskProcesses).flatMap((segment) => {
    const process = taskProcesses.find((item) => item.id === segment.processId) ?? compositeSegmentDemoProcesses[segment.processId];
    if (!process) return [];
    const groups = getProductionStationWorkstepGroups(process, taskProcesses);
    return groups.map((group) => ({ ...group, id: segment.processId + '-' + group.id, steps: group.steps.map((step) => ({ ...step, index: step.index + segment.startIndex })) }));
  });
  return groups.reduce<HierarchicalWorkstepGroup[]>((merged, group) => {
    const previous = merged.at(-1);
    if (previous && previous.label === group.label) {
      previous.steps.push(...group.steps);
    } else {
      merged.push({ ...group, steps: [...group.steps] });
    }
    return merged;
  }, []);
}
