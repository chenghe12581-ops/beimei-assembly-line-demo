import { getWeldSegmentPartitionName } from '../process/ClampPointConfigPanel';

/** 单个焊缝段的时序条目：分区沿用任务分区规则（奇偶段交替 Robot1/Robot2）。 */
export type WeldTimelineSegment = {
  id: string;
  /** 展示名：焊缝段 N */
  name: string;
  /** 所属任务分区（以机器人命名） */
  robotName: string;
  /** 在本分区队列内的开始时间（s） */
  start: number;
  /** 单段焊接工时（s） */
  duration: number;
};

export type WeldRobotTimelineRow = {
  robotName: string;
  segments: WeldTimelineSegment[];
};

export type WeldRobotTimeline = {
  segments: WeldTimelineSegment[];
  rows: WeldRobotTimelineRow[];
  /** 双机并行完工取两分区队列的较大总时长 */
  totalDuration: number;
};

/** demo 单段工时（s）：按段序 8 / 10 / 12 循环，保证双机节拍略有差异。 */
function getWeldSegmentDemoDuration(segmentIndex: number): number {
  return 8 + (segmentIndex % 3) * 2;
}

/** 由焊缝段数生成双机焊接时序：每个分区内部严格串行，两个分区并行作业。 */
export function createWeldRobotTimeline(segmentCount = 6): WeldRobotTimeline {
  const segments: WeldTimelineSegment[] = [];
  const cursorByRobot = new Map<string, number>();

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const robotName = getWeldSegmentPartitionName(segmentIndex);
    const duration = getWeldSegmentDemoDuration(segmentIndex);
    const start = cursorByRobot.get(robotName) ?? 0;
    cursorByRobot.set(robotName, start + duration);
    segments.push({
      id: `weld-segment-${segmentIndex + 1}`,
      name: `焊缝段 ${segmentIndex + 1}`,
      robotName,
      start,
      duration,
    });
  }

  const robotNames = Array.from(new Set(segments.map((segment) => segment.robotName)));
  const rows = robotNames.map((robotName) => ({
    robotName,
    segments: segments.filter((segment) => segment.robotName === robotName),
  }));
  const totalDuration = rows.reduce(
    (max, row) => Math.max(max, row.segments.reduce((sum, segment) => Math.max(sum, segment.start + segment.duration), 0)),
    0,
  );

  return { segments, rows, totalDuration };
}

/** 某时间点焊缝段的进行状态。 */
export function getWeldSegmentPlayState(segment: WeldTimelineSegment, time: number): 'pending' | 'running' | 'done' {
  if (time < segment.start) return 'pending';
  if (time >= segment.start + segment.duration) return 'done';
  return 'running';
}

/** 某时间点某分区的进行状态：空闲 / 焊接中（含当前段） / 全部完成。 */
export function getWeldRobotPlayState(
  row: WeldRobotTimelineRow,
  time: number,
): { status: 'idle' | 'running' | 'done'; currentSegment: WeldTimelineSegment | null } {
  const current = row.segments.find((segment) => getWeldSegmentPlayState(segment, time) === 'running') ?? null;
  if (current) return { status: 'running', currentSegment: current };
  const allDone = row.segments.every((segment) => getWeldSegmentPlayState(segment, time) === 'done');
  return { status: allDone ? 'done' : 'idle', currentSegment: null };
}
