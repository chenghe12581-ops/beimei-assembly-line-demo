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

export type AssemblyDatumStepKey = 'A1' | 'B1' | 'A2' | 'B2';

export type AssemblyDatumModalState = {
  open: boolean;
  minimized: boolean;
  partAId: string | null;
  partBId: string | null;
  partAFeatureId1: string | null;
  partAFeatureId2: string | null;
  partBFeatureId1: string | null;
  partBFeatureId2: string | null;
  selectedEdgeId: string | null;
  activeDatumPart: AssemblyDatumStepKey | null;
  error: string | null;
};

export type AssemblyDatumStepMeta = {
  partKey: 'A' | 'B';
  slot: 1 | 2;
  partLabel: string;
  shortLabel: string;
  actionLabel: string;
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
