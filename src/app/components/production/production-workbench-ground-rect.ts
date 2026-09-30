export type ProductionWorkbenchGroundRectStatus = 'idle' | 'running' | 'abnormal';

export type ProductionWorkbenchGroundRectStyle = {
  fill: string;
  fillOpacity: string;
  stroke: string;
  strokeOpacity: string;
};

export function getProductionWorkbenchGroundRectStyle(
  status: ProductionWorkbenchGroundRectStatus,
): ProductionWorkbenchGroundRectStyle {
  if (status === 'abnormal') {
    return {
      fill: '#FEF3C7',
      fillOpacity: '0.58',
      stroke: '#FCD34D',
      strokeOpacity: '0.78',
    };
  }

  if (status === 'running') {
    return {
      fill: '#DCFCE7',
      fillOpacity: '0.58',
      stroke: '#86EFAC',
      strokeOpacity: '0.78',
    };
  }

  return {
    fill: '#E2E8F0',
    fillOpacity: '0.34',
    stroke: '#CBD5E1',
    strokeOpacity: '0.72',
  };
}
