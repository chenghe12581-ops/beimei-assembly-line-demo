export type PlanningTaskType =
  | 'pick'
  | 'place'
  | 'polish'
  | 'assemble'
  | 'turnover-clamp'
  | 'weld-combined'
  | 'weld'
  | 'weld-scan'
  | 'support-adjust'
  | 'rough-position'
  | 'fine-position'
  | 'adjust'
  | 'inspect';

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

// 工序模板与真实软件「工序规划」页面保持一致：共 12 道工序，装配体即最高层级。
// 工步（taskSlots）为对应工序下的默认任务序列；新增工步类型
// （支撑调整 / 粗定位 / 精定位 / 调整）在原型中暂不留参数与点位，后续再设计。
const fixedPlanningProcessTemplates: FixedPlanningProcessTemplate[] = [
  { id: 'proc-01-rib-feed', sequence: 1, name: '主筋板上料', partSuffixes: ['01'], station: '主筋板打磨平台', locationId: 'area-main-grinding', taskSummary: '支撑调整 + 主筋板粗定位 + 主筋板抓取 + 主筋板放置 + 精定位/导入工件位置', allowedTaskTypes: ['support-adjust', 'rough-position', 'pick', 'place', 'fine-position'], productionUnit: '上料' },
  { id: 'proc-02-rib-grind', sequence: 2, name: '主筋板打磨', partSuffixes: ['01'], station: '主筋板打磨平台', locationId: 'area-main-grinding', taskSummary: '正面打磨 + 翻面 + 反面打磨 + 翻面', allowedTaskTypes: ['polish', 'turnover-clamp'], productionUnit: '打磨', batchGroup: 'rib-grind' },
  { id: 'proc-03-rib-feed', sequence: 3, name: '主筋板上料', partSuffixes: ['01'], station: '多工位', locationId: 'area-main-assembly-1', taskSummary: '支撑调整 + 主筋板抓取 + 主筋板放置', allowedTaskTypes: ['support-adjust', 'pick', 'place'], productionUnit: '上料' },
  { id: 'proc-04-up-plate-1', sequence: 4, name: '上贴板1-1装配', partSuffixes: ['02', '01'], displayGroups: [['02', '01']], station: '正装拼焊台', locationId: 'area-main-assembly-1', simulationSide: 'front', taskSummary: '粗定位 + 抓取 + 侧面打磨 + 正面打磨 + 放置 + 精定位 + 调整 + 检验 + 焊接', allowedTaskTypes: ['rough-position', 'pick', 'polish', 'place', 'fine-position', 'adjust', 'inspect', 'weld-combined'], productionUnit: '装配', batchGroup: 'side-plate-grind' },
  { id: 'proc-05-up-plate-2', sequence: 5, name: '上贴板2-1装配', partSuffixes: ['03', '01'], displayGroups: [['03', '01']], station: '正装拼焊台', locationId: 'area-side-grind-1', simulationSide: 'front', taskSummary: '粗定位 + 抓取 + 侧面打磨 + 放置 + 精定位 + 调整 + 焊接', allowedTaskTypes: ['rough-position', 'pick', 'polish', 'place', 'fine-position', 'adjust', 'weld-combined'], productionUnit: '装配', batchGroup: 'side-plate-grind' },
  { id: 'proc-06-feed', sequence: 6, name: '上料', partSuffixes: ['01'], station: '多工位', locationId: 'area-turnover', taskSummary: '支撑调整 + 抓取 + 放置', allowedTaskTypes: ['support-adjust', 'pick', 'place'], productionUnit: '上料' },
  { id: 'proc-07-turnover', sequence: 7, name: '翻面', partSuffixes: ['01'], station: '翻面平台', locationId: 'area-turnover', taskSummary: '翻面', allowedTaskTypes: ['turnover-clamp'], productionUnit: '翻面' },
  { id: 'proc-08-feed', sequence: 8, name: '上料', partSuffixes: ['01'], station: '多工位', locationId: 'area-main-assembly-2', taskSummary: '支撑调整 + 抓取 + 放置', allowedTaskTypes: ['support-adjust', 'pick', 'place'], productionUnit: '上料' },
  { id: 'proc-09-down-plate-1', sequence: 9, name: '下贴板1-1装配', partSuffixes: ['04', '01'], displayGroups: [['04', '01']], station: '反装拼焊台', locationId: 'area-side-grind-2', simulationSide: 'back', taskSummary: '粗定位 + 抓取 + 侧面打磨 + 正面打磨 + 放置 + 精定位 + 调整 + 焊接', allowedTaskTypes: ['rough-position', 'pick', 'polish', 'place', 'fine-position', 'adjust', 'weld-combined'], productionUnit: '装配', batchGroup: 'side-plate-grind' },
  { id: 'proc-10-down-plate-2-1', sequence: 10, name: '下贴板2-1装配', partSuffixes: ['05A', '01'], displayGroups: [['05A', '01']], station: '反装拼焊台', locationId: 'area-main-assembly-2', simulationSide: 'back', taskSummary: '粗定位 + 抓取 + 侧面打磨 + 放置 + 精定位 + 调整 + 焊接', allowedTaskTypes: ['rough-position', 'pick', 'polish', 'place', 'fine-position', 'adjust', 'weld-combined'], productionUnit: '装配', batchGroup: 'side-plate-grind' },
  { id: 'proc-11-down-plate-2-2', sequence: 11, name: '下贴板2-2装配', partSuffixes: ['05B', '01'], displayGroups: [['05B', '01']], station: '反装拼焊台', locationId: 'area-side-grind-2', simulationSide: 'back', taskSummary: '粗定位 + 抓取 + 侧面打磨 + 放置 + 精定位 + 调整 + 焊接', allowedTaskTypes: ['rough-position', 'pick', 'polish', 'place', 'fine-position', 'adjust', 'weld-combined'], productionUnit: '装配', batchGroup: 'side-plate-grind' },
  { id: 'proc-12-unload', sequence: 12, name: '下料', partSuffixes: ['01'], station: '反装拼焊台', locationId: 'tray-09', taskSummary: '抓取 + 放置', allowedTaskTypes: ['pick', 'place'], productionUnit: '下料' },
];

const fixedPlanningTaskSlotTemplates: Record<string, FixedPlanningTaskSlotTemplate[]> = {
  'proc-01-rib-feed': [
    { id: 'proc-01-support', label: '支撑调整', type: 'support-adjust' },
    { id: 'proc-01-rough-pos', label: '主筋板粗定位', type: 'rough-position' },
    { id: 'proc-01-pick', label: '主筋板抓取', type: 'pick' },
    { id: 'proc-01-place', label: '主筋板放置', type: 'place' },
    { id: 'proc-01-fine-pos', label: '精定位/导入工件位置', type: 'fine-position' },
  ],
  'proc-02-rib-grind': [
    { id: 'proc-02-grind-front', label: '正面打磨', type: 'polish', featureIdSuffixes: ['01-grind-1'] },
    { id: 'proc-02-turnover-1', label: '翻面', type: 'turnover-clamp' },
    { id: 'proc-02-grind-back', label: '反面打磨', type: 'polish', featureIdSuffixes: ['01-grind-2'] },
    { id: 'proc-02-turnover-2', label: '翻面', type: 'turnover-clamp' },
  ],
  'proc-03-rib-feed': [
    { id: 'proc-03-support', label: '支撑调整', type: 'support-adjust' },
    { id: 'proc-03-pick', label: '主筋板抓取', type: 'pick' },
    { id: 'proc-03-place', label: '主筋板放置', type: 'place' },
  ],
  'proc-04-up-plate-1': [
    { id: 'proc-04-rough-pos', label: '粗定位', type: 'rough-position' },
    { id: 'proc-04-pick', label: '抓取', type: 'pick' },
    { id: 'proc-04-side-grind', label: '侧面打磨', type: 'polish', featureIdSuffixes: ['02-grind'] },
    { id: 'proc-04-front-grind', label: '正面打磨', type: 'polish', featureIdSuffixes: ['02-grind'] },
    { id: 'proc-04-place', label: '放置', type: 'place' },
    { id: 'proc-04-fine-pos', label: '精定位', type: 'fine-position' },
    { id: 'proc-04-adjust', label: '调整', type: 'adjust' },
    { id: 'proc-04-inspect', label: '检验', type: 'inspect' },
    { id: 'proc-04-weld', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['02-weld-front'] },
  ],
  'proc-05-up-plate-2': [
    { id: 'proc-05-rough-pos', label: '粗定位', type: 'rough-position' },
    { id: 'proc-05-pick', label: '抓取', type: 'pick' },
    { id: 'proc-05-side-grind', label: '侧面打磨', type: 'polish', featureIdSuffixes: ['03-grind-1'] },
    { id: 'proc-05-place', label: '放置', type: 'place' },
    { id: 'proc-05-fine-pos', label: '精定位', type: 'fine-position' },
    { id: 'proc-05-adjust', label: '调整', type: 'adjust' },
    { id: 'proc-05-weld', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['03-weld-back-1'] },
  ],
  'proc-06-feed': [
    { id: 'proc-06-support', label: '支撑调整', type: 'support-adjust' },
    { id: 'proc-06-pick', label: '抓取', type: 'pick' },
    { id: 'proc-06-place', label: '放置', type: 'place' },
  ],
  'proc-07-turnover': [
    { id: 'proc-07-turnover', label: '翻面', type: 'turnover-clamp' },
  ],
  'proc-08-feed': [
    { id: 'proc-08-support', label: '支撑调整', type: 'support-adjust' },
    { id: 'proc-08-pick', label: '抓取', type: 'pick' },
    { id: 'proc-08-place', label: '放置', type: 'place' },
  ],
  'proc-09-down-plate-1': [
    { id: 'proc-09-rough-pos', label: '粗定位', type: 'rough-position' },
    { id: 'proc-09-pick', label: '抓取', type: 'pick' },
    { id: 'proc-09-side-grind', label: '侧面打磨', type: 'polish', featureIdSuffixes: ['04-grind'] },
    { id: 'proc-09-front-grind', label: '正面打磨', type: 'polish', featureIdSuffixes: ['02-grind'] },
    { id: 'proc-09-place', label: '放置', type: 'place' },
    { id: 'proc-09-fine-pos', label: '精定位', type: 'fine-position' },
    { id: 'proc-09-adjust', label: '调整', type: 'adjust' },
    { id: 'proc-09-weld', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['04-weld-back-2'] },
  ],
  'proc-10-down-plate-2-1': [
    { id: 'proc-10-rough-pos', label: '粗定位', type: 'rough-position' },
    { id: 'proc-10-pick', label: '抓取', type: 'pick' },
    { id: 'proc-10-side-grind', label: '侧面打磨', type: 'polish', featureIdSuffixes: ['03-grind-1'] },
    { id: 'proc-10-place', label: '放置', type: 'place' },
    { id: 'proc-10-fine-pos', label: '精定位', type: 'fine-position' },
    { id: 'proc-10-adjust', label: '调整', type: 'adjust' },
    { id: 'proc-10-weld', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['03-weld-back-1'] },
  ],
  'proc-11-down-plate-2-2': [
    { id: 'proc-11-rough-pos', label: '粗定位', type: 'rough-position' },
    { id: 'proc-11-pick', label: '抓取', type: 'pick' },
    { id: 'proc-11-side-grind', label: '侧面打磨', type: 'polish', featureIdSuffixes: ['04-grind'] },
    { id: 'proc-11-place', label: '放置', type: 'place' },
    { id: 'proc-11-fine-pos', label: '精定位', type: 'fine-position' },
    { id: 'proc-11-adjust', label: '调整', type: 'adjust' },
    { id: 'proc-11-weld', label: '焊接', type: 'weld-combined', featureIdSuffixes: ['04-weld-back-2'] },
  ],
  'proc-12-unload': [
    { id: 'proc-12-pick', label: '抓取', type: 'pick' },
    { id: 'proc-12-place', label: '放置', type: 'place' },
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
  'proc-01-support': 'proc-01-rib-feed',
  'proc-01-rough-pos': 'proc-01-rib-feed',
  'proc-01-pick': 'proc-01-rib-feed',
  'proc-01-place': 'proc-01-rib-feed',
  'proc-01-fine-pos': 'proc-01-rib-feed',
  'proc-02-grind-front': 'proc-02-rib-grind',
  'proc-02-turnover-1': 'proc-02-rib-grind',
  'proc-02-grind-back': 'proc-02-rib-grind',
  'proc-02-turnover-2': 'proc-02-rib-grind',
  'proc-03-support': 'proc-03-rib-feed',
  'proc-03-pick': 'proc-03-rib-feed',
  'proc-03-place': 'proc-03-rib-feed',
  'proc-04-rough-pos': 'proc-04-up-plate-1',
  'proc-04-pick': 'proc-04-up-plate-1',
  'proc-04-side-grind': 'proc-04-up-plate-1',
  'proc-04-front-grind': 'proc-04-up-plate-1',
  'proc-04-place': 'proc-04-up-plate-1',
  'proc-04-fine-pos': 'proc-04-up-plate-1',
  'proc-04-adjust': 'proc-04-up-plate-1',
  'proc-04-inspect': 'proc-04-up-plate-1',
  'proc-04-weld': 'proc-04-up-plate-1',
  'proc-05-rough-pos': 'proc-05-up-plate-2',
  'proc-05-pick': 'proc-05-up-plate-2',
  'proc-05-side-grind': 'proc-05-up-plate-2',
  'proc-05-place': 'proc-05-up-plate-2',
  'proc-05-fine-pos': 'proc-05-up-plate-2',
  'proc-05-adjust': 'proc-05-up-plate-2',
  'proc-05-weld': 'proc-05-up-plate-2',
  'proc-06-support': 'proc-06-feed',
  'proc-06-pick': 'proc-06-feed',
  'proc-06-place': 'proc-06-feed',
  'proc-07-turnover': 'proc-07-turnover',
  'proc-08-support': 'proc-08-feed',
  'proc-08-pick': 'proc-08-feed',
  'proc-08-place': 'proc-08-feed',
  'proc-09-rough-pos': 'proc-09-down-plate-1',
  'proc-09-pick': 'proc-09-down-plate-1',
  'proc-09-side-grind': 'proc-09-down-plate-1',
  'proc-09-front-grind': 'proc-09-down-plate-1',
  'proc-09-place': 'proc-09-down-plate-1',
  'proc-09-fine-pos': 'proc-09-down-plate-1',
  'proc-09-adjust': 'proc-09-down-plate-1',
  'proc-09-weld': 'proc-09-down-plate-1',
  'proc-10-rough-pos': 'proc-10-down-plate-2-1',
  'proc-10-pick': 'proc-10-down-plate-2-1',
  'proc-10-side-grind': 'proc-10-down-plate-2-1',
  'proc-10-place': 'proc-10-down-plate-2-1',
  'proc-10-fine-pos': 'proc-10-down-plate-2-1',
  'proc-10-adjust': 'proc-10-down-plate-2-1',
  'proc-10-weld': 'proc-10-down-plate-2-1',
  'proc-11-rough-pos': 'proc-11-down-plate-2-2',
  'proc-11-pick': 'proc-11-down-plate-2-2',
  'proc-11-side-grind': 'proc-11-down-plate-2-2',
  'proc-11-place': 'proc-11-down-plate-2-2',
  'proc-11-fine-pos': 'proc-11-down-plate-2-2',
  'proc-11-adjust': 'proc-11-down-plate-2-2',
  'proc-11-weld': 'proc-11-down-plate-2-2',
  'proc-12-pick': 'proc-12-unload',
  'proc-12-place': 'proc-12-unload',
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
