export type CapacityPeriod = 'day' | 'week' | 'month' | 'year';

export type WorkOrderStatus = '待生产' | '加工中' | '已完成' | '异常中断';
export type WorkpieceStatus = '加工中' | '已完成' | '异常中断';
export type ProcessKind = 'load' | 'grind' | 'assemble' | 'weld' | 'flip' | 'unload' | 'wait';

export type ProductionPoint = {
  id: string;
  label: string;
  onSeconds: number;
  runtimeSeconds: number;
  faultSeconds: number;
  output: number;
};

export type ProcessSegment = {
  id: string;
  laneId: string;
  label: string;
  kind: ProcessKind;
  startSeconds: number;
  endSeconds: number;
};

export type ProcessLane = {
  id: string;
  label: string;
  type: 'main' | 'front' | 'back';
};

export type Workpiece = {
  id: string;
  code: string;
  frontPlates: string[];
  backPlates: string[];
  startTime: string;
  endTime?: string;
  faultWaitSeconds: number;
  totalSeconds: number;
  currentSeconds?: number;
  status: WorkpieceStatus;
  lanes: ProcessLane[];
  segments: ProcessSegment[];
};

export type WorkOrder = {
  id: string;
  orderNo: string;
  productType: string;
  planCount: number;
  completedCount: number;
  runningCount: number;
  startTime?: string;
  endTime?: string;
  status: WorkOrderStatus;
  totalSeconds: number;
  workpieces: Workpiece[];
};

export type CapacityDataset = {
  points: ProductionPoint[];
  orders: WorkOrder[];
};

export type CapacityMetric = {
  label: string;
  value: string;
  unit?: string;
  color: string;
};
