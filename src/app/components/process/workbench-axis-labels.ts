/**
 * 各工作台支撑/压紧机构轴命名与工艺输出值定义。
 *
 * 口径来源：飞书文档《各工作台编号定义与工艺输出需求》。
 * 工艺输出为该机构支撑点在工件坐标系下的对应坐标值，
 * 无法移动的方向不生成工艺值（即不在下列列表中）。
 * 机构排列顺序与文档表格一致：先按 X 向、再 Y 向、再 Z 向列出。
 */

export type WorkbenchAxisWorkbench =
  | '主筋板打磨翻面平台'
  | '主筋板翻面平台'
  | '主筋板正面装配平台'
  | '主筋板背面装配平台';

/** 工作台机构轴标签（单位均为 mm，坐标值） */
export const WORKBENCH_AXIS_LABELS: Record<WorkbenchAxisWorkbench, string[]> = {
  // 主筋板打磨平台（原型内称“主筋板打磨翻面平台”）：4 个机构，X + Z，4 号无 Z
  主筋板打磨翻面平台: ['1-X', '1-Z', '2-X', '2-Z', '3-X', '3-Z', '4-X'],
  // 翻面平台：与打磨平台同构
  主筋板翻面平台: ['1-X', '1-Z', '2-X', '2-Z', '3-X', '3-Z', '4-X'],
  // 正面装配平台：1、2 号压紧，3、4 号支撑；X 向 4 个，Y 向仅 1、2 号，Z 向 4 个
  主筋板正面装配平台: ['1-X', '2-X', '3-X', '4-X', '1-Y', '2-Y', '1-Z', '2-Z', '3-Z', '4-Z'],
  // 反面装配平台：1、2 号压紧，其余支撑；X 向 7 个，Y 向 6 个（3_1/3_2/5_1/5_2/7_1/7_2），Z 向 10 个
  主筋板背面装配平台: [
    '1-X', '2-X', '3-X', '4-X', '5-X', '6-X', '7-X',
    '3_1-Y', '3_2-Y', '5_1-Y', '5_2-Y', '7_1-Y', '7_2-Y',
    '1-Z', '2-Z', '3_1-Z', '3_2-Z', '4-Z', '5_1-Z', '5_2-Z', '6-Z', '7_1-Z', '7_2-Z',
  ],
};

/** 取工作台全部工艺输出轴标签；未定义的工作台返回 null（调用方回退机器人 J 命名） */
export function getWorkbenchAxisLabels(workbenchType: string | null | undefined): string[] | null {
  if (!workbenchType) return null;
  return WORKBENCH_AXIS_LABELS[workbenchType as WorkbenchAxisWorkbench] ?? null;
}
