/** 单个焊缝的时序条目：按机器人分配与双机并行队列排列。 */
export type WeldTimelineSegment = {
  id: string;
  /** 展示名：焊缝 WN（如 焊缝 W1） */
  name: string;
  /** 所属作业机器人 */
  robotName: string;
  /** 在本机器人队列内的开始节拍（等长节拍，不显示时间） */
  start: number;
  /** 单条焊缝节拍数（统一为 1，仅表达顺序） */
  duration: number;
  /** 全局焊接顺序：开局并行的焊缝同号，之后按开工先后递增 */
  sequence: number;
};

export type WeldRobotTimelineRow = {
  robotName: string;
  segments: WeldTimelineSegment[];
};

export type WeldRobotTimeline = {
  segments: WeldTimelineSegment[];
  rows: WeldRobotTimelineRow[];
  /** 双机并行完工取两机器人队列的较大节拍数 */
  totalDuration: number;
};

/**
 * demo 焊缝分配场景：共 4 条焊缝，开局 Robot1（焊缝 W1，贴板左侧）与 Robot2（焊缝 W2，贴板右侧）
 * 双机并行，之后 Robot1 单独续焊 W3（贴板上侧）和 W4（贴板下侧）。
 * 编号按加工轮次编排：第 1 轮 Robot1→W1、Robot2→W2，第 2 轮→W3，第 3 轮→W4。
 * 数组顺序对应 3D 回显位置（左/上/右/下），与编号无关。
 */
export const WELD_DEMO_ROBOT_ASSIGNMENTS: { segmentName: string; robotName: string }[] = [
  { segmentName: '焊缝 W1', robotName: 'Robot1' },
  { segmentName: '焊缝 W3', robotName: 'Robot1' },
  { segmentName: '焊缝 W2', robotName: 'Robot2' },
  { segmentName: '焊缝 W4', robotName: 'Robot1' },
];

/** 每条焊缝占 1 个等长节拍，仅表达焊接先后顺序，不显示时间。 */
const WELD_DEMO_BEAT = 1;

/** 生成双机焊接时序：每个机器人内部严格串行，两个机器人并行作业，节拍等长。 */
export function createWeldRobotTimeline(): WeldRobotTimeline {
  const segments: WeldTimelineSegment[] = [];
  const cursorByRobot = new Map<string, number>();

  WELD_DEMO_ROBOT_ASSIGNMENTS.forEach((assignment, segmentIndex) => {
    const start = cursorByRobot.get(assignment.robotName) ?? 0;
    cursorByRobot.set(assignment.robotName, start + WELD_DEMO_BEAT);
    segments.push({
      id: `weld-segment-${segmentIndex + 1}`,
      name: assignment.segmentName,
      robotName: assignment.robotName,
      start,
      duration: WELD_DEMO_BEAT,
      sequence: start + 1,
    });
  });

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
