export type ProcessPlanningPart = {
  id: string;
  name: string;
};

export type ProcessPoseOffset = {
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
};

export type ProcessPivotSnapPoint = {
  id: string;
  label: string;
  partId: string;
  sourcePartIds?: string[];
};

export type AssemblyDatumModalState = {
  open: boolean;
  minimized: boolean;
  partAId: string | null;
  partBId: string | null;
  selectedEdgeId: string | null;
  datumName: string;
  error: string | null;
};

export type ManualFeaturePanelType = 'weld' | 'grind';

export type PickPathPoint = {
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
  enabled?: boolean;
};
