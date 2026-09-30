export type PlanningTaskType =
  | 'pick'
  | 'place'
  | 'polish'
  | 'assemble'
  | 'turnover-clamp'
  | 'weld-combined'
  | 'weld'
  | 'weld-scan';

export type PlanningProcessLocationId =
  | 'tray-01'
  | 'tray-03'
  | 'tray-05'
  | 'tray-07'
  | 'tray-09'
  | 'area-main-grinding'
  | 'area-main-assembly-1'
  | 'area-side-grind-1'
  | 'area-turnover'
  | 'area-side-grind-2'
  | 'area-main-assembly-2';

export type FixedPlanningTaskSlot = {
  id: string;
  label: string;
  type: PlanningTaskType;
  workpieceIds: string[];
  featureIds: string[];
};

export type FixedPlanningProcess = {
  id: string;
  sequence: number;
  name: string;
  object: string;
  displayObject: string;
  displayObjects: string[];
  workpieceIds: string[];
  station: string;
  locationId: PlanningProcessLocationId;
  simulationSide?: 'front' | 'back';
  taskSummary: string;
  taskSlots: FixedPlanningTaskSlot[];
  allowedTaskTypes: PlanningTaskType[];
  productionUnit: string;
  batchGroup?: string;
};

type FixedPlanningProcessTemplate = Omit<FixedPlanningProcess, 'object' | 'displayObject' | 'displayObjects' | 'workpieceIds' | 'taskSlots'> & {
  partSuffixes: string[];
  displayGroups?: string[][];
};

type FixedPlanningTaskSlotTemplate = Omit<FixedPlanningTaskSlot, 'workpieceIds' | 'featureIds'> & {
  featureIdSuffixes?: string[];
  datumPartPairs?: Array<[string, string]>;
};

const fixedPlanningProcessTemplates: FixedPlanningProcessTemplate[] = [
  { id: 'generated-load-01', sequence: 1, name: '上料', partSuffixes: ['01'], station: '托盘01', locationId: 'tray-01', taskSummary: '抓取 + 放置', allowedTaskTypes: ['pick', 'place'], productionUnit: '上料' },
  { id: 'generated-grind-01', sequence: 2, name: '打磨', partSuffixes: ['01'], station: '主筋板打磨工位1', locationId: 'area-main-grinding', taskSummary: '正面打磨 + 反面打磨', allowedTaskTypes: ['polish'], productionUnit: '打磨' },
  { id: 'generated-feed-front-01', sequence: 3, name: '上料', partSuffixes: ['01'], station: '主筋板装配工位1', locationId: 'area-main-assembly-1', taskSummary: '抓取 + 放置', allowedTaskTypes: ['pick', 'place'], productionUnit: '上料' },
  { id: 'generated-pick-02', sequence: 4, name: '抓取', partSuffixes: ['02'], station: '托盘03', locationId: 'tray-03', taskSummary: '抓取', allowedTaskTypes: ['pick'], productionUnit: '上料' },
  { id: 'generated-grind-02', sequence: 5, name: '侧面打磨', partSuffixes: ['02'], station: '贴板打磨工位1', locationId: 'area-side-grind-1', taskSummary: '打磨', allowedTaskTypes: ['polish'], productionUnit: '打磨', batchGroup: 'side-plate-grind' },
  { id: 'generated-assemble-02', sequence: 6, name: '装配', partSuffixes: ['02', '01'], station: '主筋板装配工位1', locationId: 'area-main-assembly-1', simulationSide: 'front', taskSummary: '装配 + 翻面压紧 + 焊接', allowedTaskTypes: ['assemble', 'turnover-clamp', 'weld-combined'], productionUnit: '装配' },
  { id: 'generated-turnover-02-01', sequence: 7, name: '翻面', partSuffixes: ['02', '01'], displayGroups: [['02', '01']], station: '翻面工位', locationId: 'area-turnover', taskSummary: '翻面压紧', allowedTaskTypes: ['turnover-clamp'], productionUnit: '翻面' },
  { id: 'generated-feed-back-02-01', sequence: 8, name: '上料', partSuffixes: ['02', '01'], displayGroups: [['02', '01']], station: '主筋板装配工位2', locationId: 'area-main-assembly-2', taskSummary: '抓取 + 放置', allowedTaskTypes: ['pick', 'place'], productionUnit: '上料' },
  { id: 'generated-pick-03', sequence: 9, name: '抓取', partSuffixes: ['03'], station: '托盘05', locationId: 'tray-05', taskSummary: '抓取', allowedTaskTypes: ['pick'], productionUnit: '上料' },
  { id: 'generated-grind-03', sequence: 10, name: '侧面打磨', partSuffixes: ['03'], station: '贴板打磨工位2', locationId: 'area-side-grind-2', taskSummary: '打磨', allowedTaskTypes: ['polish'], productionUnit: '打磨', batchGroup: 'side-plate-grind' },
  { id: 'generated-surface-grind-03', sequence: 11, name: '表面打磨', partSuffixes: ['03'], station: '翻面工位', locationId: 'area-turnover', taskSummary: '打磨', allowedTaskTypes: ['polish'], productionUnit: '打磨' },
  { id: 'generated-assemble-03', sequence: 12, name: '装配', partSuffixes: ['03', '02', '01'], displayGroups: [['03'], ['02', '01']], station: '主筋板装配工位2', locationId: 'area-main-assembly-2', simulationSide: 'back', taskSummary: '装配 + 翻面压紧 + 焊接', allowedTaskTypes: ['assemble', 'turnover-clamp', 'weld-combined'], productionUnit: '装配' },
  { id: 'generated-pick-04', sequence: 13, name: '抓取', partSuffixes: ['04'], station: '托盘07', locationId: 'tray-07', taskSummary: '抓取', allowedTaskTypes: ['pick'], productionUnit: '上料' },
  { id: 'generated-grind-04', sequence: 14, name: '侧面打磨', partSuffixes: ['04'], station: '主筋板装配工位2', locationId: 'area-main-assembly-2', taskSummary: '打磨', allowedTaskTypes: ['polish'], productionUnit: '打磨', batchGroup: 'side-plate-grind' },
  { id: 'generated-assemble-04', sequence: 15, name: '装配', partSuffixes: ['04', '03', '02', '01'], displayGroups: [['04'], ['03', '02', '01']], station: '主筋板装配工位2', locationId: 'area-main-assembly-2', simulationSide: 'back', taskSummary: '装配 + 翻面压紧 + 焊接', allowedTaskTypes: ['assemble', 'turnover-clamp', 'weld-combined'], productionUnit: '装配' },
  { id: 'generated-unload-04-03-02-01', sequence: 16, name: '下料', partSuffixes: ['04', '03', '02', '01'], displayGroups: [['04', '03', '02', '01']], station: '托盘09', locationId: 'tray-09', taskSummary: '抓取 + 放置', allowedTaskTypes: ['pick', 'place'], productionUnit: '下料' },
];

const fixedPlanningTaskSlotTemplates: Record<string, FixedPlanningTaskSlotTemplate[]> = {
  'generated-load-01': [
    { id: 'generated-pick-01', label: '抓取', type: 'pick' },
    { id: 'generated-place-01', label: '放置', type: 'place' },
  ],
  'generated-grind-01': [
    { id: 'generated-grind-01', label: '正面打磨', type: 'polish', featureIdSuffixes: ['01-grind-1'] },
    { id: 'generated-grind-01-back', label: '反面打磨', type: 'polish', featureIdSuffixes: ['01-grind-2'] },
  ],
  'generated-feed-front-01': [
    { id: 'generated-feed-front-pick-01', label: '抓取', type: 'pick' },
    { id: 'generated-feed-front-place-01', label: '放置', type: 'place' },
  ],
  'generated-pick-02': [
    { id: 'generated-pick-02', label: '抓取', type: 'pick' },
  ],
  'generated-grind-02': [
    { id: 'generated-grind-02', label: '打磨', type: 'polish', featureIdSuffixes: ['02-grind'] },
  ],
  'generated-assemble-02': [
    { id: 'generated-assemble-02', label: '装配', type: 'assemble', datumPartPairs: [['01', '02']] },
    { id: 'generated-clamp-02-01', label: '翻面压紧', type: 'turnover-clamp' },
    { id: 'generated-weld-combined-02-01', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['02-weld-front'] },
  ],
  'generated-turnover-02-01': [
    { id: 'generated-turnover-clamp-02-01', label: '翻面压紧', type: 'turnover-clamp' },
  ],
  'generated-feed-back-02-01': [
    { id: 'generated-feed-back-pick-02-01', label: '抓取', type: 'pick' },
    { id: 'generated-feed-back-place-02-01', label: '放置', type: 'place' },
  ],
  'generated-pick-03': [
    { id: 'generated-pick-03', label: '抓取', type: 'pick' },
  ],
  'generated-grind-03': [
    { id: 'generated-grind-03', label: '打磨', type: 'polish', featureIdSuffixes: ['03-grind-1'] },
  ],
  'generated-surface-grind-03': [
    { id: 'generated-surface-grind-03-task', label: '打磨', type: 'polish', featureIdSuffixes: ['03-grind-2'] },
  ],
  'generated-assemble-03': [
    { id: 'generated-assemble-03', label: '装配', type: 'assemble', datumPartPairs: [['01', '03']] },
    { id: 'generated-clamp-03-02-01', label: '翻面压紧', type: 'turnover-clamp' },
    { id: 'generated-weld-combined-03-02-01', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['03-weld-back-1'] },
  ],
  'generated-pick-04': [
    { id: 'generated-pick-04', label: '抓取', type: 'pick' },
  ],
  'generated-grind-04': [
    { id: 'generated-grind-04', label: '打磨', type: 'polish', featureIdSuffixes: ['04-grind'] },
  ],
  'generated-assemble-04': [
    { id: 'generated-assemble-04', label: '装配', type: 'assemble', datumPartPairs: [['03', '04']] },
    { id: 'generated-clamp-04-03-02-01', label: '翻面压紧', type: 'turnover-clamp' },
    { id: 'generated-weld-combined-04-03-02-01', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['04-weld-back-2'] },
  ],
  'generated-unload-04-03-02-01': [
    { id: 'generated-unload-pick-04-03-02-01', label: '抓取', type: 'pick' },
    { id: 'generated-unload-place-04-03-02-01', label: '放置', type: 'place' },
  ],
};

function createDatumFeatureId(assemblyId: string, partA: string, partB: string) {
  return `${assemblyId}-${assemblyId}-${partA}-${assemblyId}-${partB}-datum`;
}

export function createFixedPlanningProcesses(assemblyId: string): FixedPlanningProcess[] {
  return fixedPlanningProcessTemplates.map(({ partSuffixes, displayGroups, ...process }) => {
    const workpieceIds = partSuffixes.map((suffix) => `${assemblyId}-${suffix}`);
    const objectGroups = displayGroups ?? partSuffixes.map((suffix) => [suffix]);
    const displayObjects = objectGroups.map((group) => group.length === 1
        ? `${assemblyId}-${group[0]}`
        : `${assemblyId}-(${group.join('+')})`);
    const displayObject = displayObjects.join(' + ');
    const taskSlots = (fixedPlanningTaskSlotTemplates[process.id] ?? []).map((slot) => ({
      id: slot.id,
      label: slot.label,
      type: slot.type,
      workpieceIds: [...workpieceIds],
      featureIds: [
        ...(slot.featureIdSuffixes ?? []).map((suffix) => `${assemblyId}-${suffix}`),
        ...(slot.datumPartPairs ?? []).map(([partA, partB]) => createDatumFeatureId(assemblyId, partA, partB)),
      ],
    }));
    return {
      ...process,
      object: workpieceIds.join(' + '),
      displayObject,
      displayObjects,
      workpieceIds,
      taskSlots,
    };
  });
}

const legacyTaskProcessIds: Record<string, string> = {
  'generated-pick-01': 'generated-load-01',
  'generated-place-01': 'generated-load-01',
  'generated-grind-01': 'generated-grind-01',
  'generated-pick-02': 'generated-pick-02',
  'generated-grind-02': 'generated-grind-02',
  'generated-assemble-02': 'generated-assemble-02',
  'generated-clamp-02-01': 'generated-assemble-02',
  'generated-weld-scan-02-01': 'generated-assemble-02',
  'generated-weld-02-01': 'generated-assemble-02',
  'generated-weld-combined-02-01': 'generated-assemble-02',
  'generated-feed-back-pick-02-01': 'generated-feed-back-02-01',
  'generated-feed-back-place-02-01': 'generated-feed-back-02-01',
  'generated-pick-03': 'generated-pick-03',
  'generated-grind-03': 'generated-grind-03',
  'generated-assemble-03': 'generated-assemble-03',
  'generated-clamp-03-02-01': 'generated-assemble-03',
  'generated-weld-scan-03-02-01': 'generated-assemble-03',
  'generated-weld-03-02-01': 'generated-assemble-03',
  'generated-weld-combined-03-02-01': 'generated-assemble-03',
  'generated-pick-04': 'generated-pick-04',
  'generated-grind-04': 'generated-grind-04',
  'generated-assemble-04': 'generated-assemble-04',
  'generated-clamp-04-03-02-01': 'generated-assemble-04',
  'generated-weld-scan-04-03-02-01': 'generated-assemble-04',
  'generated-weld-04-03-02-01': 'generated-assemble-04',
  'generated-weld-combined-04-03-02-01': 'generated-assemble-04',
};

export function getPlanningProcessIdForTask(task: { id?: string; processId?: string }) {
  if (task.processId) return task.processId;
  return task.id ? legacyTaskProcessIds[task.id] : undefined;
}
