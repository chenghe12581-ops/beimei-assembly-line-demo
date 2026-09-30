export type VisionAssemblyDatumGroup = {
  id: string;
  label: string;
  panelLabel: string;
  lineUrls: [string, string];
  distance: string;
};

// 复用工艺规划中 0162-01-010101 的 01 / 02 装配基准棱边资源。
export const visionAssemblyDatumGroups: VisionAssemblyDatumGroup[] = [
  {
    id: 'datum-group-1',
    label: '第一组基准距离',
    panelLabel: '第一组装配基准',
    lineUrls: [
      '/models/datum-edges/01-datum-edge-02.obj',
      '/models/datum-edges/02-datum-edge-01.obj',
    ],
    distance: '20.00',
  },
  {
    id: 'datum-group-2',
    label: '第二组基准距离',
    panelLabel: '第二组装配基准',
    lineUrls: [
      '/models/datum-edges/01-datum-edge-02-2.obj',
      '/models/datum-edges/02-datum-edge-01-2.obj',
    ],
    distance: '2250.63',
  },
];

export const visionAssemblyWorkpieceCode = '0162-01-010101-02 + 0162-01-010101-01';
