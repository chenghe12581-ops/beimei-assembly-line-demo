import type {
  CapacityDataset,
  CapacityPeriod,
  ProcessKind,
  ProcessLane,
  ProcessSegment,
  ProductionPoint,
  WorkOrder,
  WorkOrderStatus,
  Workpiece,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '2026-08-11';
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const formatDateTime = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;

const addSeconds = (value: Date, seconds: number) => new Date(value.getTime() + seconds * 1000);

const hashText = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const variation = (seed: string, base: number, spread: number) =>
  base + (hashText(seed) % (spread * 2 + 1)) - spread;

const periodPoints = (period: CapacityPeriod, dateKey: string): Array<{ id: string; label: string; seed: string }> => {
  const date = new Date(`${dateKey}T08:00:00`);
  if (period === 'day') {
    return Array.from({ length: 24 }, (_, index) => ({
      id: `hour-${index}`,
      label: `${pad(index)}:00`,
      seed: `${dateKey}-hour-${index}`,
    }));
  }
  if (period === 'week') {
    const start = new Date(date.getTime() - ((date.getDay() + 6) % 7) * DAY_MS);
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(start.getTime() + index * DAY_MS);
      return { id: `day-${index}`, label: `${pad(current.getMonth() + 1)}/${pad(current.getDate())}`, seed: toDateKey(current.toISOString()) };
    });
  }
  if (period === 'month') {
    const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => ({
      id: `day-${index}`,
      label: `${index + 1}日`,
      seed: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(index + 1)}`,
    }));
  }
  return Array.from({ length: 12 }, (_, index) => ({
    id: `month-${index}`,
    label: `${index + 1}月`,
    seed: `${date.getFullYear()}-${pad(index + 1)}`,
  }));
};

const createProductionPoints = (period: CapacityPeriod, dateKey: string): ProductionPoint[] =>
  periodPoints(period, dateKey).map(({ id, label, seed }, index) => {
    const activeRatio = period === 'day' ? (index >= 6 && index <= 22 ? 1 : 0.1) : 0.8;
    const runtimeSeconds = Math.round(variation(`${seed}-runtime`, period === 'day' ? 2600 : 3500, 420) * activeRatio);
    const faultSeconds = Math.round(variation(`${seed}-fault`, period === 'day' ? 180 : 260, 80) * activeRatio);
    const onSeconds = Math.max(runtimeSeconds + faultSeconds + 120, Math.round(variation(`${seed}-on`, period === 'day' ? 3200 : 4300, 420) * activeRatio));
    return {
      id,
      label,
      onSeconds,
      runtimeSeconds: Math.min(runtimeSeconds, onSeconds),
      faultSeconds: Math.min(faultSeconds, Math.max(0, onSeconds - runtimeSeconds)),
      output: Math.max(0, Math.round(runtimeSeconds / 3600 * (period === 'day' ? 0.55 : 0.8))),
    };
  });

const pushSegment = (
  segments: ProcessSegment[],
  id: string,
  laneId: string,
  label: string,
  kind: ProcessKind,
  startSeconds: number,
  durationSeconds: number,
) => {
  segments.push({ id, laneId, label, kind, startSeconds, endSeconds: startSeconds + durationSeconds });
  return startSeconds + durationSeconds;
};

const createSchedule = (seed: string, frontPlates: string[], backPlates: string[]) => {
  const mainLane = 'main';
  const segments: ProcessSegment[] = [];
  const lanes: ProcessLane[] = [{ id: mainLane, label: '主筋板 / 组件', type: 'main' }];
  let mainCursor = 0;
  mainCursor = pushSegment(segments, `${seed}-main-load`, mainLane, '主筋板打磨工位上料', 'load', mainCursor, variation(`${seed}-main-load`, 120, 15));
  const mainGrindStart = mainCursor;
  mainCursor = pushSegment(segments, `${seed}-main-grind`, mainLane, '主筋板打磨', 'grind', mainCursor, variation(`${seed}-main-grind`, 580, 60));
  mainCursor = pushSegment(segments, `${seed}-main-a1`, mainLane, '主筋板装配工位1上料', 'load', mainCursor, variation(`${seed}-main-a1`, 120, 12));

  let stationFree = mainCursor;
  let previousFrontWeldStart = mainGrindStart;
  for (let index = 0; index < frontPlates.length; index += 1) {
    const plateId = `front-${index + 1}`;
    lanes.push({ id: plateId, label: frontPlates[index], type: 'front' });
    const grindStart = index === 0 ? mainGrindStart : previousFrontWeldStart;
    const grindEnd = pushSegment(segments, `${seed}-${plateId}-grind`, plateId, '打磨', 'grind', grindStart, variation(`${seed}-${plateId}-grind`, 300, 35));
    const assembleStart = Math.max(grindEnd, stationFree);
    if (assembleStart > grindEnd) pushSegment(segments, `${seed}-${plateId}-wait`, plateId, '等待主体到位', 'wait', grindEnd, assembleStart - grindEnd);
    const assembleEnd = pushSegment(segments, `${seed}-${plateId}-assemble`, plateId, '装配', 'assemble', assembleStart, variation(`${seed}-${plateId}-assemble`, 260, 30));
    previousFrontWeldStart = assembleEnd;
    stationFree = pushSegment(segments, `${seed}-${plateId}-weld`, plateId, '定位焊', 'weld', assembleEnd, variation(`${seed}-${plateId}-weld`, 320, 35));
  }

  let endCursor = stationFree;
  if (backPlates.length > 0) {
    endCursor = pushSegment(segments, `${seed}-flip`, mainLane, '组件翻面', 'flip', endCursor, variation(`${seed}-flip`, 240, 20));
    endCursor = pushSegment(segments, `${seed}-main-a2`, mainLane, '主筋板装配工位2上料', 'load', endCursor, variation(`${seed}-main-a2`, 120, 12));
    let backStationFree = endCursor;
    let previousBackWeldStart = endCursor;
    for (let index = 0; index < backPlates.length; index += 1) {
      const plateId = `back-${index + 1}`;
      lanes.push({ id: plateId, label: backPlates[index], type: 'back' });
      const grindStart = index === 0 ? endCursor - 120 : previousBackWeldStart;
      const grindEnd = pushSegment(segments, `${seed}-${plateId}-grind`, plateId, '打磨', 'grind', grindStart, variation(`${seed}-${plateId}-grind`, 300, 35));
      const assembleStart = Math.max(grindEnd, backStationFree);
      if (assembleStart > grindEnd) pushSegment(segments, `${seed}-${plateId}-wait`, plateId, '等待主体到位', 'wait', grindEnd, assembleStart - grindEnd);
      const assembleEnd = pushSegment(segments, `${seed}-${plateId}-assemble`, plateId, '装配', 'assemble', assembleStart, variation(`${seed}-${plateId}-assemble`, 250, 30));
      previousBackWeldStart = assembleEnd;
      backStationFree = pushSegment(segments, `${seed}-${plateId}-weld`, plateId, '定位焊', 'weld', assembleEnd, variation(`${seed}-${plateId}-weld`, 310, 35));
    }
    endCursor = backStationFree;
  }

  endCursor = pushSegment(segments, `${seed}-unload`, mainLane, '下料', 'unload', endCursor, variation(`${seed}-unload`, 180, 20));
  return { lanes, segments, totalSeconds: endCursor };
};

const createWorkpiece = (
  orderIndex: number,
  workpieceIndex: number,
  dateKey: string,
  startAt: string,
  status: Workpiece['status'],
  frontCount: number,
  backCount: number,
): Workpiece => {
  const orderPrefix = orderIndex + 1;
  const code = `掩护梁主筋-${String(workpieceIndex + 1).padStart(3, '0')}`;
  const start = new Date(`${dateKey}T${startAt}`);
  start.setMinutes(start.getMinutes() + orderIndex * 18 + workpieceIndex * 78);
  const frontPlates = Array.from({ length: frontCount }, (_, index) => `0162-01-0101${String(workpieceIndex + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`);
  const backPlates = Array.from({ length: backCount }, (_, index) => `0162-01-0101${String(workpieceIndex + 1).padStart(2, '0')}-${String(index + frontCount + 2).padStart(2, '0')}`);
  const schedule = createSchedule(`${dateKey}-${orderPrefix}-${workpieceIndex}`, frontPlates, backPlates);
  const currentSeconds = status === '加工中' ? Math.round(schedule.totalSeconds * 0.56) : undefined;
  const end = status === '加工中' ? undefined : addSeconds(start, schedule.totalSeconds);
  return {
    id: `wp-${dateKey}-${orderPrefix}-${workpieceIndex}`,
    code,
    frontPlates,
    backPlates,
    startTime: formatDateTime(start),
    endTime: end ? formatDateTime(end) : undefined,
    faultWaitSeconds: status === '异常中断' ? variation(`${dateKey}-${orderPrefix}-${workpieceIndex}-fault`, 420, 80) : variation(`${dateKey}-${orderPrefix}-${workpieceIndex}-wait`, 100, 30),
    totalSeconds: schedule.totalSeconds,
    currentSeconds,
    status,
    lanes: schedule.lanes,
    segments: schedule.segments,
  };
};

const createWorkOrders = (dateKey: string): WorkOrder[] => {
  const definitions: Array<{ productType: string; status: WorkOrderStatus; plan: number; done: number; running: number; startAt: string }> = [
    { productType: '掩护梁主筋', status: '加工中', plan: 10, done: 7, running: 1, startAt: '08:05:00' },
    { productType: '底座主筋', status: '已完成', plan: 6, done: 6, running: 0, startAt: '10:05:00' },
    { productType: '顶梁主筋', status: '异常中断', plan: 6, done: 4, running: 0, startAt: '14:05:00' },
    { productType: '底座主筋', status: '待生产', plan: 8, done: 0, running: 0, startAt: '16:05:00' },
  ];
  return definitions
    .map((definition, orderIndex) => {
      const workpieceCount = definition.status === '待生产' ? 0 : Math.max(1, definition.done + definition.running);
      const workpieces = Array.from({ length: workpieceCount }, (_, index) => {
        const status: Workpiece['status'] = definition.status === '加工中' && index === workpieceCount - 1
          ? '加工中'
          : definition.status === '异常中断' && index === workpieceCount - 1
            ? '异常中断'
            : '已完成';
        const frontCount = index % 3 === 0 ? 2 : 1;
        const backCount = index % 4 === 0 ? 0 : 2;
        return createWorkpiece(orderIndex, index, dateKey, definition.startAt, status, frontCount, backCount);
      });
      const first = workpieces[0];
      const finished = workpieces.filter((item) => item.status !== '加工中');
      const lastFinished = finished[finished.length - 1];
      const totalSeconds = finished.reduce((sum, item) => sum + item.totalSeconds, 0);
      return {
        id: `wo-${dateKey}-${orderIndex}`,
        orderNo: `WO-${dateKey.replaceAll('-', '')}-${String(orderIndex + 1).padStart(3, '0')}`,
        productType: definition.productType,
        planCount: definition.plan,
        completedCount: definition.done,
        runningCount: definition.running,
        startTime: first?.startTime,
        endTime: definition.status === '加工中' ? undefined : lastFinished?.endTime,
        status: definition.status,
        totalSeconds,
        workpieces,
      } satisfies WorkOrder;
    });
};

export const createCapacityDataset = (period: CapacityPeriod, date: string): CapacityDataset => {
  const dateKey = toDateKey(date);
  return {
    points: createProductionPoints(period, dateKey),
    orders: createWorkOrders(dateKey),
  };
};

export const formatDuration = (totalSeconds: number | undefined) => {
  if (totalSeconds === undefined || totalSeconds === null) return '--';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const totalProduction = (points: ProductionPoint[]) => points.reduce((sum, point) => sum + point.output, 0);
