import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ASSET_BASE } from '../../../asset-base';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowLeft, History, LayoutDashboard, MonitorUp, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';

const trayZoneMapImg = `${ASSET_BASE}tray-visualization/tray-zone-legend.svg`;

export type TrayTaskState = 'pending' | 'running' | 'done';

export type TraySlot = {
  id: string;
  area: string;
  trayType: '大托盘' | '中托盘';
  material: string;
  quantity: number;
  state: 'empty' | 'reserved' | 'empty-frame' | 'loaded' | 'moving' | 'full';
};

export type TrayTask = {
  id: string;
  workOrderNo?: string;
  archived?: boolean;
  type: '上料任务' | '空托任务' | '满托任务';
  mode: '自动' | '手动';
  material: string;
  quantity: number;
  pickup: string;
  dropoff: string;
  state: TrayTaskState;
};

export type TrayAllocationMaterial = {
  partName: string;
  partNo: string | null;
  count: number;
  detail?: string;
};

export type TrayAllocationArea = '上料区' | '装配区' | '下料区';

export type TrayAllocation = {
  id: string;
  area: TrayAllocationArea;
  code: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  partName: string | null;
  partNo: string | null;
  count: number;
  materials: TrayAllocationMaterial[];
  occupied: boolean;
  state?: TraySlot['state'];
};

export type TrayManagedTask = {
  id?: string;
  workOrderNo?: string;
  name?: string;
  drawingNo: string;
  quantity: number;
};

type TrayAreaTone = 'teal' | 'zinc' | 'rose';

const trayAllocationZones: Omit<TrayAllocation, 'partName' | 'partNo' | 'count' | 'materials' | 'occupied' | 'state'>[] = [
  { id: 'assembly-02', area: '装配区', code: '02', name: '02 号位', x: 64.68, y: 49.54, w: 6.17, h: 6.76 },
  { id: 'assembly-03', area: '装配区', code: '03', name: '03 号位', x: 54.71, y: 48.7, w: 6.17, h: 7.62 },
  { id: 'assembly-04', area: '装配区', code: '04', name: '04 号位', x: 47.87, y: 48.7, w: 6.17, h: 7.62 },
  { id: 'assembly-05', area: '装配区', code: '05', name: '05 号位', x: 40.32, y: 48.7, w: 6.17, h: 7.62 },
  { id: 'assembly-06', area: '装配区', code: '06', name: '06 号位', x: 33.48, y: 48.7, w: 6.17, h: 7.62 },
  { id: 'assembly-07', area: '装配区', code: '07', name: '07 号位', x: 24.83, y: 48.7, w: 6.17, h: 7.62 },
  { id: 'assembly-08', area: '装配区', code: '08', name: '08 号位', x: 18.0, y: 48.7, w: 6.17, h: 7.62 },
];

const trayPlanAllocationZones = [
  { id: 'supply-01', area: '上料区' as const, code: '01', name: '01 号位', x: 81.49, y: 44.91, w: 6.12, h: 11.33 },
  ...trayAllocationZones,
];

const trayMaterialCapacity = 5;

const trayLegendZones = [
  { code: '01', x: 81.49, y: 44.91, w: 6.12, h: 11.33, tone: 'teal' as const },
  ...trayAllocationZones.map((zone) => ({ ...zone, tone: 'zinc' as const })),
  { code: '09', x: 4.2, y: 43.91, w: 7.8, h: 12.33, tone: 'rose' as const },
];

const trayAreaZones = [
  { label: '下料区', codes: ['09'], tone: 'rose' as const, x: 4.28, y: 36.47, w: 10.35, h: 50.61 },
  { label: '上料区', codes: ['01'], tone: 'teal' as const, x: 79.13, y: 36.47, w: 10.35, h: 50.61 },
];

const trayTagToneClassNames: Record<TrayAreaTone, string> = {
  teal: 'bg-teal-600 text-white',
  zinc: 'bg-zinc-700 text-white',
  rose: 'bg-rose-600 text-white',
};

const trayDisabledTagToneClassNames: Record<TrayAreaTone, string> = {
  teal: 'bg-teal-100 text-teal-600',
  zinc: 'bg-zinc-200 text-zinc-600',
  rose: 'bg-rose-100 text-rose-600',
};

function getTrayTagToneClassName(tone: TrayAreaTone, active: boolean) {
  return active ? trayTagToneClassNames[tone] : trayDisabledTagToneClassNames[tone];
}

const trayOutlineToneClassNames: Record<TrayAreaTone, string> = {
  teal: 'border-teal-500/70 bg-teal-500/10',
  zinc: 'border-zinc-500/70 bg-zinc-500/10',
  rose: 'border-rose-500/70 bg-rose-500/10',
};

const trayOccupiedSurfaceToneClassNames: Record<TrayAreaTone, string> = {
  teal: 'border-teal-400/80 bg-teal-50/75 shadow-[0_0_0_1px_rgba(13,148,136,0.12)]',
  zinc: 'border-zinc-400/80 bg-zinc-50/75 shadow-[0_0_0_1px_rgba(63,63,70,0.12)]',
  rose: 'border-rose-400/80 bg-rose-50/75 shadow-[0_0_0_1px_rgba(225,29,72,0.12)]',
};

function getTrayToneByCode(code: string): TrayAreaTone {
  return trayLegendZones.find((zone) => zone.code === code)?.tone ?? 'zinc';
}

function getTrayAreaLabelCenterX(area: (typeof trayAreaZones)[number]) {
  const zones = trayLegendZones.filter((zone) => area.codes.includes(zone.code));
  const left = Math.min(...zones.map((zone) => zone.x));
  const right = Math.max(...zones.map((zone) => zone.x + zone.w));
  return (left + right) / 2;
}

const trayReferenceGroups = [
  { label: '下料区', codes: ['09'], widthClassName: 'w-[112px]' },
  { label: '装配区', codes: ['08', '07', '06', '05', '04', '03', '02'], widthClassName: 'w-[736px]' },
  { label: '上料区', codes: ['01'], widthClassName: 'w-[112px]' },
];

const trayReferenceCodeOrder = trayReferenceGroups.flatMap((group) => group.codes);

const dialogTraySpread = {
  centerX: 45,
  factor: 1.18,
  widthFactor: 1.24,
  areaPaddingX: 1.15,
  leftTrayGroupOffsetX: 1.47,
  rightTrayGroupOffsetX: 5.34,
};

const rightSidePlanTrayCodes = ['01', '02', '03', '04'];
const trayPlanTrayCodes = trayPlanAllocationZones.map((zone) => zone.code);

function normalizeTrayAllocationArea(area: string, fallback: TrayAllocationArea): TrayAllocationArea {
  return ['上料区', '装配区', '下料区'].includes(area)
    ? area as TrayAllocationArea
    : fallback;
}

type TrayReferenceItem = {
  code: string;
  area: string;
  name: string;
  tone: TrayAreaTone;
  materials: TrayAllocationMaterial[];
  occupied: boolean;
  occupiedByAgv: boolean;
  state?: TraySlot['state'];
};

function getWorkpiecePartNames(workpiece: Pick<TrayManagedTask, 'drawingNo'>) {
  return ['01', '02', '03', '04'].map((partNo) => `${workpiece.drawingNo}-${partNo}`);
}

export type TrayPlanSummary = {
  availableTrayCount: number;
  maximumQuantity: number;
  requiredTrayCount: number;
  usedTrayCount: number;
  fullTrayCount: number;
  hasOverflow: boolean;
};

export function getTrayPlanSummary(workpiece: Pick<TrayManagedTask, 'drawingNo'>, quantity: number): TrayPlanSummary {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const partCount = getWorkpiecePartNames(workpiece).length;
  const requiredTrayCount = safeQuantity === 0
    ? 0
    : safeQuantity <= 2
      ? 1
      : safeQuantity <= trayMaterialCapacity
        ? Math.min(safeQuantity, partCount)
        : partCount * Math.ceil(safeQuantity / trayMaterialCapacity);
  const availableTrayCount = trayPlanTrayCodes.length;
  const maximumQuantity = Math.floor(availableTrayCount / partCount) * trayMaterialCapacity;

  return {
    availableTrayCount,
    maximumQuantity,
    requiredTrayCount,
    usedTrayCount: Math.min(requiredTrayCount, availableTrayCount),
    fullTrayCount: Math.min(availableTrayCount, partCount * Math.floor(safeQuantity / trayMaterialCapacity)),
    hasOverflow: requiredTrayCount > availableTrayCount,
  };
}

export function buildTrayPlanAllocations(workpiece: Pick<TrayManagedTask, 'drawingNo'>, quantity: number): TrayAllocation[] {
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const workpiecePartNames = getWorkpiecePartNames(workpiece);
  const planParts = safeQuantity > 0 ? workpiecePartNames.slice(0, 4) : [];
  const materialsByTrayCode = new Map<string, TrayAllocationMaterial[]>();

  if (safeQuantity > 0 && safeQuantity <= trayMaterialCapacity) {
    const activePlanTrayCodes = safeQuantity <= 2
      ? rightSidePlanTrayCodes.slice(0, 1)
      : rightSidePlanTrayCodes.slice(0, Math.min(safeQuantity, 4));
    planParts.forEach((partName, index) => {
      const targetCode = activePlanTrayCodes.length === 1
        ? activePlanTrayCodes[0]
        : activePlanTrayCodes[Math.min(index, activePlanTrayCodes.length - 1)];
      if (!targetCode) return;
      const material: TrayAllocationMaterial = {
        partName,
        partNo: partName.match(/-(\d{2})$/)?.[1] ?? null,
        count: safeQuantity,
      };
      materialsByTrayCode.set(targetCode, [...(materialsByTrayCode.get(targetCode) ?? []), material]);
    });
  } else if (safeQuantity > trayMaterialCapacity) {
    let trayIndex = 0;
    planParts.forEach((partName) => {
      let remaining = safeQuantity;
      while (remaining > 0) {
        const targetCode = trayPlanTrayCodes[trayIndex];
        trayIndex += 1;
        if (!targetCode) break;
        const count = Math.min(remaining, trayMaterialCapacity);
        const material: TrayAllocationMaterial = {
          partName,
          partNo: partName.match(/-(\d{2})$/)?.[1] ?? null,
          count,
        };
        materialsByTrayCode.set(targetCode, [material]);
        remaining -= count;
      }
    });
  }

  return trayPlanAllocationZones.map((zone) => {
    const materials = materialsByTrayCode.get(zone.code) ?? [];
    const primaryMaterial = materials[0] ?? null;
    return {
      ...zone,
      partName: primaryMaterial?.partName ?? null,
      partNo: primaryMaterial?.partNo ?? null,
      count: materials.reduce((sum, material) => sum + material.count, 0),
      materials,
      occupied: materials.length > 0,
    };
  });
}

function buildTrayPlanAllocationsForTask(task: TrayManagedTask | null): TrayAllocation[] {
  if (!task) return buildTrayPlanAllocations({ drawingNo: '0162-01-010101' }, 0);
  return buildTrayPlanAllocations({ drawingNo: task.drawingNo }, task.quantity);
}

function buildTrayActualAllocations(traySlots: TraySlot[]): TrayAllocation[] {
  return trayLegendZones.map((zone) => {
    const slot = traySlots.find((item) => item.id.padStart(2, '0') === zone.code) ?? null;
    const occupied = Boolean(slot && slot.state !== 'empty' && slot.material !== '空');
    return {
      id: `actual-${zone.code}`,
      area: normalizeTrayAllocationArea(slot?.area ?? getTrayReferenceArea(zone.code), '装配区'),
      code: zone.code,
      name: `${zone.code} 号位`,
      x: zone.x,
      y: zone.y,
      w: zone.w,
      h: zone.h,
      partName: occupied ? slot.material : null,
      partNo: null,
      count: occupied ? slot.quantity : 0,
      materials: occupied ? [{ partName: slot.material, partNo: null, count: slot.quantity }] : [],
      occupied,
      state: slot?.state ?? 'empty',
    };
  });
}

function getTrayReferenceArea(code: string) {
  const group = trayReferenceGroups.find((item) => item.codes.includes(code));
  return group?.label ?? '托盘区';
}

function buildActualReferenceItems(allocations: TrayAllocation[], trayTasks: TrayTask[]): TrayReferenceItem[] {
  const allocationByCode = new Map(allocations.map((slot) => [slot.code, slot]));

  return trayLegendZones.map((zone) => {
    const slot = allocationByCode.get(zone.code);
    const inboundTask = trayTasks.find((task) => task.state === 'running' && task.dropoff === zone.code);
    const emptyFramePickupTask = trayTasks.find((task) => (
      task.state === 'running' && task.type === '空托任务' && task.pickup === zone.code
    ));
    const state = inboundTask && slot?.state === 'empty'
      ? 'reserved'
      : emptyFramePickupTask && slot?.state === 'empty-frame'
        ? 'moving'
        : slot?.state ?? 'empty';
    const materials = state === 'reserved' || state === 'moving' ? [] : slot?.materials ?? [];

    return {
      code: zone.code,
      area: slot?.area ?? getTrayReferenceArea(zone.code),
      name: slot?.name ?? `${zone.code} 号位`,
      tone: zone.tone,
      materials,
      occupied: state !== 'empty',
      occupiedByAgv: Boolean(inboundTask || emptyFramePickupTask),
      state,
    };
  });
}

function getTrayStateLabel(state: TraySlot['state']) {
  const labels: Record<TraySlot['state'], string> = {
    empty: '空闲',
    reserved: '已预约',
    'empty-frame': '空托在位',
    loaded: '已配盘',
    moving: '空托取货中',
    full: '已占用',
  };
  return labels[state];
}

function getTrayTaskStateLabel(state: TrayTaskState) {
  const labels: Record<TrayTaskState, string> = {
    pending: '待执行',
    running: '执行中',
    done: '已完成',
  };
  return labels[state];
}

function getTrayVisibleMaterials(slot: TrayAllocation): TrayAllocationMaterial[] {
  return slot.materials.length > 0
    ? slot.materials
    : slot.partName
      ? [{ partName: slot.partName, partNo: slot.partNo, count: slot.count }]
      : [];
}

function isTrayMaterialsFull(materials: TrayAllocationMaterial[]) {
  return materials.some((material) => material.count >= trayMaterialCapacity);
}

const trayPartTopViewSources: Record<string, string> = {
  '0162-01-010101-01': `${ASSET_BASE}part-topviews/0162-01-010101-01.png`,
  '0162-01-010101-02': `${ASSET_BASE}part-topviews/0162-01-010101-02.png`,
  '0162-01-010101-03': `${ASSET_BASE}part-topviews/0162-01-010101-03.png`,
  '0162-01-010101-04': `${ASSET_BASE}part-topviews/0162-01-010101-04.png`,
};

const trayPartPreviewWidth = 240;
const trayPartPreviewHeight = 184;
const trayPartPreviewGap = 10;
const trayPartPreviewMargin = 12;

function getTrayMaterialModelName(material: TrayAllocationMaterial) {
  return [material.partName, material.detail].find((value) => value && trayPartTopViewSources[value]) ?? null;
}

function TrayPartTopView({
  material,
  disabled,
  className,
}: {
  material: TrayAllocationMaterial;
  disabled: boolean;
  className: string;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<{ left: number; top: number } | null>(null);
  const modelName = getTrayMaterialModelName(material);
  const source = modelName ? trayPartTopViewSources[modelName] : null;

  useLayoutEffect(() => {
    if (!previewOpen) {
      setPreviewPosition(null);
      return undefined;
    }

    const updatePreviewPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredRight = triggerRect.right + trayPartPreviewGap;
      const fallbackLeft = triggerRect.left - trayPartPreviewWidth - trayPartPreviewGap;
      const availableRight = preferredRight + trayPartPreviewWidth + trayPartPreviewMargin <= viewportWidth;
      const rawLeft = availableRight ? preferredRight : fallbackLeft;
      const left = Math.max(
        trayPartPreviewMargin,
        Math.min(rawLeft, viewportWidth - trayPartPreviewWidth - trayPartPreviewMargin),
      );
      const top = Math.max(
        trayPartPreviewMargin,
        Math.min(
          triggerRect.top + triggerRect.height / 2 - trayPartPreviewHeight / 2,
          viewportHeight - trayPartPreviewHeight - trayPartPreviewMargin,
        ),
      );

      setPreviewPosition({ left, top });
    };

    updatePreviewPosition();
    window.addEventListener('resize', updatePreviewPosition);
    window.addEventListener('scroll', updatePreviewPosition, true);

    return () => {
      window.removeEventListener('resize', updatePreviewPosition);
      window.removeEventListener('scroll', updatePreviewPosition, true);
    };
  }, [previewOpen]);

  if (!source) {
    return (
      <div className={`flex items-center justify-center rounded-sm bg-zinc-100/80 text-center text-[10px] font-medium leading-3 ${disabled ? 'text-zinc-300' : 'text-zinc-400'} ${className}`} aria-hidden="true">
        <span>—</span>
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`flex cursor-zoom-in items-center justify-center rounded-sm border-0 bg-zinc-100/80 p-0 outline-none transition-colors hover:bg-zinc-50/90 focus-visible:ring-2 focus-visible:ring-orange-200 ${className}`}
        aria-label={`查看 ${modelName} 零件俯视图大图`}
        title=""
        onPointerEnter={() => setPreviewOpen(true)}
        onPointerLeave={() => setPreviewOpen(false)}
        onMouseEnter={() => setPreviewOpen(true)}
        onMouseLeave={() => setPreviewOpen(false)}
        onFocus={() => setPreviewOpen(true)}
        onBlur={() => setPreviewOpen(false)}
      >
        <img
          src={source}
          alt={`${modelName} 零件俯视图`}
          className={`size-full object-contain ${disabled ? 'opacity-45 grayscale' : 'opacity-95'}`}
          loading="lazy"
        />
      </button>
      {previewOpen && previewPosition && typeof document !== 'undefined' && createPortal(
        <div
          className="ds-popover-glass-surface pointer-events-none fixed z-[1000] rounded-lg p-2"
          style={{
            left: previewPosition.left,
            top: previewPosition.top,
            width: trayPartPreviewWidth,
            background: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          <div className="flex h-[142px] items-center justify-center rounded-md bg-white/18 shadow-inner shadow-slate-900/5">
            <img
              src={source}
              alt={`${modelName} 零件俯视图大图`}
              className={`max-h-full max-w-full object-contain ${disabled ? 'opacity-60 grayscale' : 'opacity-100'}`}
              loading="lazy"
            />
          </div>
          <div className="mt-1.5 truncate text-center text-[10px] font-semibold leading-4 text-slate-600">
            {modelName}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function TrayOverviewMap({
  referenceItems,
  showOccupancyStatusTag = true,
  showAreaLabels = true,
  onReleaseOccupiedTray,
  screenMode = false,
  mapOnly = false,
}: {
  referenceItems: TrayReferenceItem[];
  showOccupancyStatusTag?: boolean;
  showAreaLabels?: boolean;
  onReleaseOccupiedTray?: (trayCode: string) => void;
  screenMode?: boolean;
  mapOnly?: boolean;
}) {
  const referenceItemByCode = new Map(referenceItems.map((item) => [item.code, item]));

  return (
    <div className={`relative overflow-hidden border border-zinc-200 bg-zinc-200 shadow-inner shadow-slate-900/5 ${screenMode ? 'h-[280px] shrink-0 rounded-xl' : mapOnly ? 'min-h-[184px] flex-1 rounded-lg' : 'h-[184px] shrink-0 rounded-md'}`}>
      <div
        className="absolute left-0 top-1/2 aspect-[18573/7426] w-full"
        style={{ transform: 'translateY(-48.7%)' }}
      >
        <img
          src={trayZoneMapImg}
          alt="北煤机托盘区位"
          className="absolute inset-0 size-full object-contain opacity-70 grayscale"
        />
        <div className="pointer-events-none absolute inset-0 bg-zinc-300/35" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[size:5%_12%] opacity-25" />
        {showAreaLabels && trayAreaZones.map((area) => {
          const areaActive = area.codes.some((code) => referenceItemByCode.get(code)?.occupied);
          return (
            <span
              key={area.label}
              className={`pointer-events-none absolute -translate-x-1/2 rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none shadow-sm ${getTrayTagToneClassName(area.tone, areaActive)}`}
              style={{ left: `${getTrayAreaLabelCenterX(area)}%`, top: `calc(${area.y}% + 20px)` }}
            >
              {area.label}
            </span>
          );
        })}
        {trayLegendZones.map((zone) => {
          const item = referenceItemByCode.get(zone.code);
          const occupied = Boolean(item?.occupied);
          const occupiedByAgv = Boolean(item?.occupiedByAgv);
          const materialCount = item?.materials.length ?? 0;
          const full = isTrayMaterialsFull(item?.materials ?? []);
          const stateLabel = item?.state ? getTrayStateLabel(item.state) : '已占用';
          const materialName = item?.materials[0]?.partName;
          const canReleaseOccupiedTray = Boolean(onReleaseOccupiedTray && materialName && item?.state !== 'reserved' && item?.state !== 'moving');
          return (
            <div
              key={`${zone.code}-${item?.state ?? 'empty'}`}
              className={`absolute z-10 rounded-[6px] border backdrop-blur-[1px] ${
                occupied
                  ? trayOccupiedSurfaceToneClassNames[zone.tone]
                  : 'border-dashed border-zinc-300/80 bg-white/60'
              } ${canReleaseOccupiedTray ? 'cursor-pointer transition-shadow hover:ring-2 hover:ring-emerald-300/75 focus:outline-none focus:ring-2 focus:ring-emerald-400' : ''}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
              aria-label={`${zone.code} 号托盘${occupied ? `已占用${materialName ? `，${materialName}` : ''}${canReleaseOccupiedTray ? '，可点击转为空托' : ''}` : '空位'}`}
              title={canReleaseOccupiedTray ? `${materialName}已占用，点击转为空托` : materialName}
              role={canReleaseOccupiedTray ? 'button' : undefined}
              tabIndex={canReleaseOccupiedTray ? 0 : undefined}
              onClick={canReleaseOccupiedTray ? () => onReleaseOccupiedTray?.(zone.code) : undefined}
              onKeyDown={canReleaseOccupiedTray ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onReleaseOccupiedTray?.(zone.code);
                }
              } : undefined}
            >
              <span className={`absolute left-1 top-1 min-w-7 rounded px-2 py-1 text-center text-[11px] font-semibold leading-none shadow-sm ${getTrayTagToneClassName(zone.tone, occupied)}`}>
                {zone.code}
              </span>
              {materialName && onReleaseOccupiedTray && (
                <span className="absolute inset-x-1 top-8 truncate text-center text-[8px] font-semibold leading-none text-zinc-700" title={materialName}>
                  {materialName}
                </span>
              )}
              {occupied && (full || showOccupancyStatusTag) && (
                <span className={`absolute bottom-1 right-1 rounded bg-white/90 px-1 py-0.5 text-[8px] font-semibold leading-none ${
                  occupiedByAgv ? 'text-ds-brand-primary-text' : onReleaseOccupiedTray ? 'text-emerald-700' : full ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {item?.state === 'reserved' ? '已预约' : item?.state === 'empty-frame' ? '空托' : item?.state === 'moving' ? '取货中' : occupiedByAgv ? 'AGV执行中' : onReleaseOccupiedTray ? '已占用' : full ? '满盘' : materialCount > 1 ? `${materialCount}种料` : stateLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDialogTrayGroupOffsetX(item: { code?: string; label?: string }) {
  if (['05', '06', '07', '08'].includes(item.code ?? '')) {
    return dialogTraySpread.leftTrayGroupOffsetX;
  }
  if (item.label === '上料区' || ['01', '02', '03', '04'].includes(item.code ?? '')) {
    return dialogTraySpread.rightTrayGroupOffsetX;
  }
  return 0;
}

function getTrayMapGeometry<T extends { x: number; w: number; code?: string; label?: string }>(item: T, mapFit: 'preview' | 'dialog') {
  if (mapFit !== 'dialog') return item;

  const center = item.x + item.w / 2;
  const visualCenter = dialogTraySpread.centerX + (center - dialogTraySpread.centerX) * dialogTraySpread.factor;
  const visualWidth = item.w * dialogTraySpread.widthFactor;
  const groupOffsetX = getDialogTrayGroupOffsetX(item);
  return {
    ...item,
    x: visualCenter - visualWidth / 2 + groupOffsetX,
    w: visualWidth,
  };
}

function getTrayAreaMapGeometry<T extends { x: number; w: number; label?: string }>(item: T, mapFit: 'preview' | 'dialog') {
  const geometry = getTrayMapGeometry(item, mapFit);
  if (mapFit !== 'dialog') return geometry;

  return {
    ...geometry,
    x: geometry.x - dialogTraySpread.areaPaddingX,
    w: geometry.w + dialogTraySpread.areaPaddingX * 2,
  };
}

export function TrayAllocationCard({
  slot,
  quantityReady,
  showState,
  layout,
  collapsed = false,
  disabled = false,
  compact = false,
  fillContainer = false,
  autoHeight = false,
  taskState,
  executeDisabled = false,
  onExecute,
  onConfirmArrival,
}: {
  slot: TrayAllocation;
  quantityReady: boolean;
  showState: boolean;
  layout: 'stack' | 'side';
  collapsed?: boolean;
  disabled?: boolean;
  compact?: boolean;
  fillContainer?: boolean;
  autoHeight?: boolean;
  taskState?: TrayTaskState;
  executeDisabled?: boolean;
  onExecute?: () => void;
  onConfirmArrival?: () => void;
}) {
  const visibleMaterials = getTrayVisibleMaterials(slot);
  const visibleLimit = compact ? 4 : layout === 'side' ? 3 : 4;
  const displayedMaterials = compact ? visibleMaterials : visibleMaterials.slice(0, visibleLimit);
  const trayTone = getTrayToneByCode(slot.code);
  const full = !disabled && isTrayMaterialsFull(visibleMaterials);
  const showTaskActions = Boolean(onExecute || onConfirmArrival);
  const executeActionDisabled = disabled || executeDisabled || taskState === 'running' || taskState === 'done';
  const confirmActionDisabled = disabled || taskState !== 'running';
  const trayCodeBadgeClassName = `${compact ? 'min-w-6 rounded px-2 py-0.5 text-[10px]' : 'min-w-6 rounded px-2 py-1 text-[11px]'} text-center font-semibold leading-none ${disabled ? trayDisabledTagToneClassNames[trayTone] : trayTagToneClassNames[trayTone]}`;

  if (collapsed) {
    return (
      <div
        className={`flex shrink-0 items-start justify-center rounded-lg border border-dashed px-1.5 py-2 transition-all ${
          layout === 'side' ? 'h-12 w-11 self-end' : 'min-h-[92px] w-10'
        } ${disabled ? 'border-zinc-200 bg-zinc-100/70 opacity-75' : 'border-zinc-200 bg-white/45'}`}
        aria-disabled={disabled || undefined}
        aria-label={`${slot.name} 折叠托盘位`}
      >
        <span className={trayCodeBadgeClassName}>
          {slot.code}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`min-w-0 rounded-lg border ${
        compact
          ? fillContainer
            ? 'flex h-full min-h-0 flex-1 basis-0 flex-col px-4 pb-2 pt-2.5'
            : 'flex min-h-[288px] flex-1 basis-0 flex-col px-4 pb-2 pt-2.5'
          : `px-2.5 py-2 ${layout === 'side' ? 'min-h-[64px] w-full' : autoHeight ? 'min-h-[92px] flex-none self-start' : 'min-h-[92px] flex-1'}`
      } ${
        disabled
          ? 'border-zinc-200 bg-zinc-100/80 text-zinc-400 opacity-80'
          : slot.occupied
          ? trayOccupiedSurfaceToneClassNames[trayTone]
          : 'border-dashed border-zinc-200 bg-white/45'
      }`}
      aria-disabled={disabled || undefined}
      aria-label={`${slot.code} 号托盘卡片${slot.occupied ? '已占用' : '空位'}`}
    >
      <div className="flex h-5 items-center justify-between gap-1.5 px-0.5">
        <span className={trayCodeBadgeClassName}>
          {slot.code}
        </span>
        <div className="flex min-w-0 items-center justify-end gap-1">
          {full && (
            <span className="inline-flex h-5 shrink-0 items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-1 text-[9px] font-semibold leading-none text-amber-700">
              <AlertTriangle className="size-2.5" />
              满盘 5/5
            </span>
          )}
          {showTaskActions && (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className="h-5 whitespace-nowrap px-1 text-[10px] font-medium leading-5 text-ds-brand-primary-text transition-colors hover:text-ds-brand-primary-hover disabled:cursor-not-allowed disabled:text-zinc-300"
                disabled={executeActionDisabled}
                aria-label={`${slot.code} 号托盘执行上料任务`}
                onClick={onExecute}
              >
                执行
              </button>
              <button
                type="button"
                className="h-5 whitespace-nowrap px-1 text-[10px] font-medium leading-5 text-emerald-700 transition-colors hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-zinc-300"
                disabled={confirmActionDisabled}
                aria-label={`${slot.code} 号托盘确认到达`}
                onClick={onConfirmArrival}
              >
                确认到达
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={`${compact ? fillContainer ? 'mt-2 min-h-0 flex-1 overflow-y-auto' : 'mt-2 min-h-[240px] flex-none overflow-hidden' : autoHeight ? 'mt-2 overflow-visible' : layout === 'side' ? 'mt-2 min-h-[44px] overflow-hidden' : 'mt-2 min-h-[64px] overflow-hidden'} rounded-md bg-white/52 px-1.5 pb-1.5 pt-2.5 shadow-inner shadow-slate-900/5`}>
        {displayedMaterials.length > 0 ? (
          <div className={`flex flex-col gap-4 ${autoHeight && !compact ? '' : 'h-full min-h-0'}`}>
            {displayedMaterials.map((material) => {
              const materialTitle = material.partName;
              const materialSubtitle = material.detail && material.detail !== materialTitle
                ? material.detail
                : material.count > 0
                  ? quantityReady ? `×${material.count}` : '待定'
                  : null;
              return (
                <div
                  key={`${material.partName}-${material.detail ?? ''}`}
                  className="relative flex h-11 shrink-0 items-center gap-3.5 px-2 after:pointer-events-none after:absolute after:-bottom-2 after:left-2 after:right-2 after:h-px after:bg-zinc-200/70 after:content-[''] last:after:hidden"
                  title={[materialTitle, materialSubtitle].filter(Boolean).join(' ')}
                >
                  <TrayPartTopView material={material} disabled={disabled} className="h-11 w-18 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className={`truncate text-[12px] font-semibold leading-4 ${disabled ? 'text-zinc-400' : 'text-zinc-700'}`}>
                      {materialTitle}
                    </div>
                    {materialSubtitle && (
                      <div className="mt-0.5 truncate text-[12px] font-medium leading-4 text-zinc-500">
                        {materialSubtitle}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`flex ${autoHeight && !compact ? 'min-h-[64px]' : 'h-full'} items-center justify-center truncate ${compact ? 'text-[10px]' : 'text-[11px]'} font-semibold leading-4 ${disabled ? 'text-zinc-400' : 'text-zinc-700'}`}>
            {disabled ? '暂无零件' : slot.state && slot.state !== 'empty' ? getTrayStateLabel(slot.state) : '备用托盘位'}
          </div>
        )}
        {!compact && visibleMaterials.length > visibleLimit && (
          <div className={`${compact ? 'px-1 text-[9px]' : 'px-1.5 text-[10px]'} font-medium leading-3 text-zinc-400`}>
            +{visibleMaterials.length - visibleLimit} 种料
          </div>
        )}
      </div>
      {showState && slot.state && slot.state !== 'empty' && (
        <div className={compact ? 'mt-1 shrink-0' : 'mt-1.5'}>
          <span className={`rounded bg-white/80 px-1.5 py-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold leading-none text-zinc-500`}>
            {getTrayStateLabel(slot.state)}
          </span>
        </div>
      )}
    </div>
  );
}

const trayTaskTypeOptions: TrayTask['type'][] = ['上料任务', '空托任务', '满托任务'];
const trayPointOptions = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
const trayTaskStateOptions: TrayTaskState[] = ['pending', 'running', 'done'];

function TrayTableSelect<T extends string | number>({
  value,
  options,
  formatOption = (option) => String(option),
  invalid = false,
  onChange,
}: {
  value: T;
  options: T[];
  formatOption?: (option: T) => string;
  invalid?: boolean;
  onChange: (value: T) => void;
}) {
  const selectItems = options.map((option) => ({
    id: String(option),
    name: formatOption(option),
  }));

  return (
    <ProcessSingleSelect
      items={selectItems}
      selectedId={String(value)}
      invalid={invalid}
      size="sm"
      elevation="none"
      dropdownMode="portal"
      onChange={(nextId) => {
        if (!nextId) return;
        const nextValue = options.find((option) => String(option) === nextId);
        if (nextValue != null) onChange(nextValue);
      }}
    />
  );
}

export function TrayMapPreview({
  allocations,
  showState = false,
  quantityReady = true,
  layout = 'stack',
  showLegend = true,
  persistentPopovers = false,
  mapFit = 'preview',
}: {
  allocations: TrayAllocation[];
  showState?: boolean;
  quantityReady?: boolean;
  layout?: 'stack' | 'side';
  showLegend?: boolean;
  persistentPopovers?: boolean;
  mapFit?: 'preview' | 'dialog';
}) {
  const allocationsByMapPosition = [...allocations].sort((left, right) => left.x - right.x);
  const mapTransformClassName =
    mapFit === 'dialog'
      ? 'absolute inset-0 origin-center translate-x-0 translate-y-[-2%] scale-[0.82]'
      : 'absolute inset-0 origin-center translate-x-[-23%] scale-[0.58]';
  const mapContainerClassName =
    mapFit === 'dialog'
      ? 'relative mx-auto aspect-[18573/7426] h-full max-h-full w-full max-w-[1380px] overflow-hidden bg-zinc-300/80'
      : 'relative mx-auto aspect-[18573/7426] h-full max-h-full w-full overflow-hidden bg-zinc-300/80';
  const mapPane = (
    <div className="relative flex min-h-0 flex-1 items-center justify-center">
      <div className={mapContainerClassName}>
        <div className={mapTransformClassName}>
          <img
            src={trayZoneMapImg}
            alt="北煤机托盘区位"
            className="absolute inset-0 size-full object-contain opacity-20 brightness-75 grayscale"
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(24,24,27,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.08)_1px,transparent_1px)] bg-[size:5%_12%] opacity-30" />
          {trayAreaZones.map((area) => {
            const areaActive = area.codes.some((code) => allocations.some((slot) => slot.code === code && slot.occupied));
            const visualArea = getTrayAreaMapGeometry(area, mapFit);
            return (
              <div
                key={area.label}
                className="pointer-events-none absolute rounded-[6px] border border-zinc-500/35 bg-white/5"
                style={{ left: `${visualArea.x}%`, top: `${area.y}%`, width: `${visualArea.w}%`, height: `${area.h}%` }}
              >
                <span className={`absolute left-2 top-2 rounded px-2 py-1 text-[12px] font-semibold leading-none shadow-sm ${getTrayTagToneClassName(area.tone, areaActive)}`}>
                  {area.label}
                </span>
              </div>
            );
          })}
          {trayLegendZones.filter((zone) => !allocations.some((slot) => slot.code === zone.code)).map((zone) => (
            <div
              key={`${zone.code}-outline`}
              className={`absolute rounded-[6px] border ${trayOutlineToneClassNames[zone.tone]}`}
              style={{
                left: `${getTrayMapGeometry(zone, mapFit).x}%`,
                top: `${zone.y}%`,
                width: `${getTrayMapGeometry(zone, mapFit).w}%`,
                height: `${zone.h}%`,
              }}
            />
          ))}
          {trayLegendZones.map((zone) => {
            const zoneActive = allocations.some((slot) => slot.code === zone.code && slot.occupied);
            const visualZone = getTrayMapGeometry(zone, mapFit);
            return (
              <span
                key={zone.code}
                className={`pointer-events-none absolute z-10 min-w-9 -translate-x-1/2 -translate-y-1/2 rounded-md px-3 py-2 text-center text-sm font-semibold leading-none shadow-sm ${getTrayTagToneClassName(zone.tone, zoneActive)}`}
                style={{ left: `${visualZone.x + visualZone.w / 2}%`, top: `${zone.y + zone.h / 2}%` }}
              >
                {zone.code}
              </span>
            );
          })}
          {allocations.map((slot) => {
            const trayTone = getTrayToneByCode(slot.code);
            const visibleMaterials = getTrayVisibleMaterials(slot);
            const visualSlot = getTrayMapGeometry(slot, mapFit);
            return (
              <div key={slot.id} className="group">
                {slot.occupied && (
                  <div
                    className={`pointer-events-none absolute z-20 max-w-[18%] -translate-x-1/2 rounded-lg border px-2.5 py-2 shadow-lg backdrop-blur-md ${
                      persistentPopovers ? 'opacity-100' : 'opacity-0 transition-opacity duration-150 group-hover:opacity-100'
                    } border-zinc-200 bg-white/95 text-zinc-700 shadow-zinc-900/10`}
                    style={{ left: `${visualSlot.x + visualSlot.w / 2}%`, top: `${slot.y + slot.h + 1.8}%` }}
                  >
                    <div className="space-y-1.5">
                      {visibleMaterials.slice(0, 3).map((material) => (
                        <div key={material.partName} className="min-w-0">
                          <div className="truncate text-xs font-semibold leading-4">{material.partName}</div>
                          <div className="text-[11px] font-medium leading-4 opacity-70">
                            {quantityReady ? `${material.count} 件` : '待输入数量'}
                          </div>
                        </div>
                      ))}
                      {visibleMaterials.length > 3 && (
                        <div className="text-[11px] font-semibold leading-4 opacity-70">+{visibleMaterials.length - 3} 种料</div>
                      )}
                    </div>
                  </div>
                )}
                <div
                  className={`absolute rounded-[6px] border backdrop-blur-[1px] transition-colors ${
                    slot.occupied
                      ? trayOccupiedSurfaceToneClassNames[trayTone]
                      : 'border-dashed border-zinc-300/80 bg-white/18'
                  }`}
                  style={{ left: `${visualSlot.x}%`, top: `${slot.y}%`, width: `${visualSlot.w}%`, height: `${slot.h}%` }}
                >
                  <div className="flex h-full items-start justify-end gap-1 p-1.5">
                    {showState && slot.state && slot.state !== 'empty' && (
                      <span className="rounded bg-white/82 px-1 py-0.5 text-[8px] font-semibold leading-none text-zinc-600">
                        {getTrayStateLabel(slot.state)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  const legendPane = (
    <div className="shrink-0">
      <div className="flex items-stretch gap-1.5 overflow-hidden">
        {allocationsByMapPosition.map((slot) => (
          <TrayAllocationCard
            key={slot.id}
            slot={slot}
            quantityReady={quantityReady}
            showState={showState}
            layout="stack"
            compact
          />
        ))}
      </div>
    </div>
  );

  if (!showLegend) {
    return (
      <div className="absolute inset-0 flex min-h-0 p-3">
        {mapPane}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-3">
      {mapPane}
      {legendPane}
    </div>
  );
}

export function TrayReferenceStrip({
  allocations,
  showState = false,
  quantityReady = true,
  referenceItems,
  overviewReferenceItems,
  showOccupancyStatusTag = true,
  showAreaLabels = true,
  cardSectionLabel,
  onReleaseOccupiedTray,
  screenMode = false,
  showPlanCards = true,
  fitOverview = false,
  planTaskStates,
  planTaskExecutionDisabled,
  onExecutePlanTray,
  onConfirmPlanTrayArrival,
}: {
  allocations: TrayAllocation[];
  showState?: boolean;
  quantityReady?: boolean;
  referenceItems?: TrayReferenceItem[];
  overviewReferenceItems?: TrayReferenceItem[];
  showOccupancyStatusTag?: boolean;
  showAreaLabels?: boolean;
  cardSectionLabel?: string;
  onReleaseOccupiedTray?: (trayCode: string) => void;
  screenMode?: boolean;
  showPlanCards?: boolean;
  fitOverview?: boolean;
  planTaskStates?: Partial<Record<string, TrayTaskState>>;
  planTaskExecutionDisabled?: Partial<Record<string, boolean>>;
  onExecutePlanTray?: (slot: TrayAllocation) => void;
  onConfirmPlanTrayArrival?: (slot: TrayAllocation) => void;
}) {
  const defaultReferenceItems = trayLegendZones.map((zone) => {
    const slot = allocations.find((item) => item.code === zone.code);
    const materials = slot ? getTrayVisibleMaterials(slot) : [];
    return {
      code: zone.code,
      area: slot?.area ?? getTrayReferenceArea(zone.code),
      name: slot?.name ?? `${zone.code} 号位`,
      tone: zone.tone,
      materials,
      occupied: Boolean(slot?.occupied),
      occupiedByAgv: false,
      state: slot?.state,
    } satisfies TrayReferenceItem;
  });
  const displayReferenceItems = referenceItems ?? defaultReferenceItems;
  const displayOverviewReferenceItems = overviewReferenceItems ?? displayReferenceItems;
  const allocationByCode = new Map(allocations.map((slot) => [slot.code, slot]));
  const allocationsByMapPosition = [...allocations].sort((left, right) => left.x - right.x);
  const referenceItemByCode = new Map(displayReferenceItems.map((item) => [item.code, item]));
  const overviewReferenceItemByCode = new Map(displayOverviewReferenceItems.map((item) => [item.code, item]));
  const orderedDisplayReferenceItems = trayReferenceCodeOrder
    .map((code) => referenceItemByCode.get(code))
    .filter((item): item is TrayReferenceItem => Boolean(item));
  const orderedOverviewReferenceItems = trayReferenceCodeOrder
    .map((code) => overviewReferenceItemByCode.get(code))
    .filter((item): item is TrayReferenceItem => Boolean(item));
  const visibleReferenceItems = orderedDisplayReferenceItems.filter((item) => item.occupied || item.materials.length > 0);

  return (
    <div className={`h-full min-h-0 bg-white ${screenMode ? 'overflow-auto' : fitOverview ? 'overflow-hidden' : 'overflow-x-auto overflow-y-hidden'} ${screenMode ? 'px-6 py-5' : 'px-4 py-3'}`}>
      <div className={`flex flex-col ${screenMode ? 'min-h-[700px] min-w-[1600px] gap-5' : fitOverview ? 'h-full min-w-0' : 'h-full min-w-[1440px] gap-3'}`}>
        <TrayOverviewMap
          referenceItems={orderedOverviewReferenceItems}
          showOccupancyStatusTag={showOccupancyStatusTag}
          showAreaLabels={showAreaLabels}
          onReleaseOccupiedTray={onReleaseOccupiedTray}
          screenMode={screenMode}
          mapOnly={!showPlanCards}
        />
        {showPlanCards && (
          <div className={`min-h-0 flex-1 pr-1 ${cardSectionLabel ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            <div className={`flex min-h-0 flex-col ${cardSectionLabel ? `${screenMode ? 'min-h-[390px]' : 'min-h-[332px]'} rounded-md border border-zinc-200 bg-zinc-50/45 p-2.5` : 'h-full'}`}>
              {cardSectionLabel && (
                <div className="mb-2 shrink-0 text-[11px] font-semibold leading-4 text-zinc-700">
                  {cardSectionLabel}
                </div>
              )}
              <div
                className={`grid items-stretch gap-4 pb-1 ${cardSectionLabel ? `${screenMode ? 'min-h-[330px]' : 'min-h-[276px]'}` : 'min-h-0 flex-1'}`}
                style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }}
              >
                {visibleReferenceItems.map((item) => {
                  const allocation = allocationByCode.get(item.code) ?? allocationsByMapPosition.find((slot) => slot.code === item.code);
                  const slot: TrayAllocation = allocation
                    ? {
                      ...allocation,
                      area: normalizeTrayAllocationArea(item.area, allocation.area),
                      partName: item.materials[0]?.partName ?? null,
                      partNo: item.materials[0]?.partNo ?? null,
                      count: item.materials.reduce((sum, material) => sum + material.count, 0),
                      materials: item.materials,
                      occupied: item.occupied,
                    }
                    : {
                      id: `reference-${item.code}`,
                      area: normalizeTrayAllocationArea(item.area, '装配区'),
                      code: item.code,
                      name: item.name,
                      x: 0,
                      y: 0,
                      w: 0,
                      h: 0,
                      partName: item.materials[0]?.partName ?? null,
                      partNo: item.materials[0]?.partNo ?? null,
                      count: item.materials.reduce((sum, material) => sum + material.count, 0),
                      materials: item.materials,
                      occupied: item.occupied,
                      state: item.state,
                    };

                  return (
                    <div key={item.code} className="min-w-0">
                      <TrayAllocationCard
                        slot={slot}
                        quantityReady={quantityReady}
                        showState={showState}
                        layout="stack"
                        compact
                        fillContainer
                        taskState={planTaskStates?.[item.code]}
                        executeDisabled={planTaskExecutionDisabled?.[item.code]}
                        onExecute={onExecutePlanTray ? () => onExecutePlanTray(slot) : undefined}
                        onConfirmArrival={onConfirmPlanTrayArrival ? () => onConfirmPlanTrayArrival(slot) : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TrayManagementView({
  traySlots,
  trayTasks,
  selectedTask,
  onCreateTask,
  onUpdateTrayTask,
  onRunTrayTask,
  onCompleteTrayTask,
  onArchiveTrayTask,
  onRestoreTrayTask,
  onDeleteTrayTask,
  onReleaseOccupiedTray,
}: {
  traySlots: TraySlot[];
  trayTasks: TrayTask[];
  selectedTask: TrayManagedTask | null;
  onCreateTask: () => void;
  onUpdateTrayTask: (taskId: string, updates: Partial<TrayTask>) => void;
  onRunTrayTask: (taskId: string) => void;
  onCompleteTrayTask: (taskId: string) => void;
  onArchiveTrayTask: (taskId: string) => void;
  onRestoreTrayTask: (taskId: string) => void;
  onDeleteTrayTask: (taskId: string) => void;
  onReleaseOccupiedTray: (trayCode: string) => void;
}) {
  const [deletePopoverTaskId, setDeletePopoverTaskId] = useState<string | null>(null);
  const [deletePopoverRect, setDeletePopoverRect] = useState<{ right: number; top: number } | null>(null);
  const [executionConflict, setExecutionConflict] = useState<{ taskId: string; fields: Array<'pickup' | 'dropoff'> } | null>(null);
  const deleteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const activeTrayTasks = trayTasks.filter((task) => !task.archived);
  const archivedTrayTasks = trayTasks.filter((task) => task.archived);
  const visibleTrayTasks = showArchivedTasks ? archivedTrayTasks : activeTrayTasks;
  const trayMaterialSelectOptions = getWorkpiecePartNames({ drawingNo: selectedTask?.drawingNo ?? '0162-01-010101' });
  const actualAllocations = buildTrayActualAllocations(traySlots);
  const actualReferenceItems = buildActualReferenceItems(actualAllocations, activeTrayTasks);
  const [agvTableScrolled, setAgvTableScrolled] = useState(false);

  useLayoutEffect(() => {
    if (!deletePopoverTaskId) {
      setDeletePopoverRect(null);
      return;
    }

    const updateDeletePopoverRect = () => {
      const triggerRect = deleteButtonRefs.current[deletePopoverTaskId]?.getBoundingClientRect();
      if (!triggerRect) return;
      setDeletePopoverRect({
        right: window.innerWidth - triggerRect.right,
        top: triggerRect.bottom + 6,
      });
    };

    updateDeletePopoverRect();
    window.addEventListener('resize', updateDeletePopoverRect);
    window.addEventListener('scroll', updateDeletePopoverRect, true);
    return () => {
      window.removeEventListener('resize', updateDeletePopoverRect);
      window.removeEventListener('scroll', updateDeletePopoverRect, true);
    };
  }, [deletePopoverTaskId]);

  const clearExecutionConflict = (taskId?: string) => {
    setExecutionConflict((current) => {
      if (!current) return null;
      if (!taskId || current.taskId !== taskId) return null;
      return current;
    });
  };

  const runTrayTaskWithConflictFeedback = (task: TrayTask) => {
    const occupiedPoints = new Set(
      activeTrayTasks
        .filter((item) => item.state === 'running' && item.id !== task.id)
        .flatMap((item) => [item.pickup, item.dropoff]),
    );
    const fields: Array<'pickup' | 'dropoff'> = [];
    if (occupiedPoints.has(task.pickup)) fields.push('pickup');
    if (occupiedPoints.has(task.dropoff)) fields.push('dropoff');

    if (fields.length > 0) {
      setExecutionConflict({ taskId: task.id, fields });
      return;
    }

    setExecutionConflict(null);
    onRunTrayTask(task.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-zinc-100/60 p-5">
      <section className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/60 bg-white/30 shadow-inner shadow-slate-900/5 ${showArchivedTasks ? '' : 'min-h-[300px]'}`}>
        <div
          className={`relative z-10 flex h-12 shrink-0 flex-row items-center justify-between border-b border-white/60 bg-white px-5 backdrop-blur-[var(--ds-blur-sticky-overlap)] transition-shadow duration-200 ${
            agvTableScrolled ? 'shadow-ds-sticky-overlap' : 'shadow-none'
          }`}
        >
          <div className="text-[11px] font-semibold leading-4 text-zinc-800">{showArchivedTasks ? 'AGV 历史任务' : 'AGV 任务调度'}</div>
          <div className="flex items-center gap-1.5">
            {showArchivedTasks ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-1.5 text-xs text-slate-500 hover:bg-transparent hover:text-slate-800"
                onClick={() => setShowArchivedTasks(false)}
              >
                <ArrowLeft className="size-3.5" />
                返回任务调度
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-1.5 text-xs text-slate-500 hover:bg-transparent hover:text-slate-800"
                  onClick={() => {
                    setDeletePopoverTaskId(null);
                    setExecutionConflict(null);
                    setShowArchivedTasks(true);
                  }}
                >
                  <History className="size-3.5" />
                  历史任务
                  {archivedTrayTasks.length > 0 && (
                    <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-slate-100 px-1 text-[9px] font-semibold leading-4 text-slate-500">
                      {archivedTrayTasks.length}
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1 px-2.5 text-xs"
                  onClick={onCreateTask}
                >
                  <Plus className="size-3.5" />
                  新建任务
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-0">
          <div
            className="h-full overflow-auto overscroll-contain"
            onScroll={(event) => {
              setAgvTableScrolled(event.currentTarget.scrollTop > 0);
            }}
          >
            <div className="overflow-x-auto p-3">
              <div className="min-w-[980px] overflow-hidden rounded-lg border border-white/70 bg-white/38">
                <div className="grid rounded-t-lg grid-cols-[minmax(108px,0.95fr)_minmax(140px,1.2fr)_minmax(108px,1fr)_minmax(108px,1fr)_90px_196px] items-center gap-4 border-b border-white/70 bg-slate-100/70 px-3 py-2 text-[11px] font-semibold text-slate-500">
                  <div>任务类型</div>
                  <div>执行零件</div>
                  <div>取货点</div>
                  <div>卸货点</div>
                  <div>状态</div>
                  <div>操作</div>
                </div>
                <div className="divide-y divide-white/65">
                  {visibleTrayTasks.map((task) => {
                    const running = task.state === 'running';
                    const done = task.state === 'done';
                    const taskMaterialSelectOptions = task.material && !trayMaterialSelectOptions.includes(task.material)
                      ? [task.material, ...trayMaterialSelectOptions]
                      : trayMaterialSelectOptions;
                    const deletePopoverOpen = deletePopoverTaskId === task.id;
                    const conflictFields = executionConflict?.taskId === task.id ? executionConflict.fields : [];
                    return (
                      <div
                        key={task.id}
                        onPointerDown={() => clearExecutionConflict(task.id)}
                        className={`relative grid grid-cols-[minmax(108px,0.95fr)_minmax(140px,1.2fr)_minmax(108px,1fr)_minmax(108px,1fr)_90px_196px] items-center gap-4 overflow-visible px-3 py-2 transition-colors ${
                          running
                            ? 'bg-orange-50/88 text-ds-brand-primary-text shadow-[inset_3px_0_0_rgba(255,105,0,0.85)]'
                            : done
                              ? 'bg-white/40 text-slate-500 hover:bg-white/70'
                              : 'bg-white/40 text-slate-500 hover:bg-white/70'
                        } ${deletePopoverOpen ? 'z-50' : 'z-0 focus-within:z-40 hover:z-10'}`}
                      >
                        {showArchivedTasks ? (
                          <>
                            <div className="h-7 truncate rounded-md px-2 py-1 text-[11px] leading-5 text-slate-500" title={task.type}>{task.type}</div>
                            <div className={`h-7 truncate rounded-md px-2 py-1 text-[11px] leading-5 ${task.material ? 'text-slate-500' : 'text-slate-300'}`} title={task.material || undefined}>{task.material || '—'}</div>
                            <div className="h-7 truncate rounded-md px-2 py-1 text-[11px] leading-5 text-slate-500">{task.pickup}</div>
                            <div className="h-7 truncate rounded-md px-2 py-1 text-[11px] leading-5 text-slate-500">{task.dropoff}</div>
                          </>
                        ) : (
                          <>
                            <TrayTableSelect
                              value={task.type}
                              options={trayTaskTypeOptions}
                              onChange={(type) => {
                                clearExecutionConflict();
                                onUpdateTrayTask(task.id, {
                                  type,
                                  material: type === '空托任务' ? '' : (task.material || trayMaterialSelectOptions[0]),
                                });
                              }}
                            />
                            {task.type !== '空托任务' ? (
                              <TrayTableSelect
                                value={task.material || taskMaterialSelectOptions[0]}
                                options={taskMaterialSelectOptions}
                                onChange={(material) => {
                                  clearExecutionConflict();
                                  onUpdateTrayTask(task.id, { material });
                                }}
                              />
                            ) : (
                              <div className="h-7 rounded-md px-2 py-1 text-[11px] leading-5 text-slate-300">—</div>
                            )}
                            <TrayTableSelect
                              value={task.pickup}
                              options={trayPointOptions}
                              invalid={conflictFields.includes('pickup')}
                              onChange={(pickup) => {
                                clearExecutionConflict();
                                onUpdateTrayTask(task.id, { pickup });
                              }}
                            />
                            <TrayTableSelect
                              value={task.dropoff}
                              options={trayPointOptions}
                              invalid={conflictFields.includes('dropoff')}
                              onChange={(dropoff) => {
                                clearExecutionConflict();
                                onUpdateTrayTask(task.id, { dropoff });
                              }}
                            />
                          </>
                        )}
                        <div className="flex h-7 items-center">
                          {running ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-ds-brand-primary-text">
                              <span className="size-1.5 animate-pulse rounded-full bg-ds-brand-primary" />
                              {getTrayTaskStateLabel(task.state)}
                            </span>
                          ) : done ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {getTrayTaskStateLabel(task.state)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              {getTrayTaskStateLabel(task.state)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-start gap-1 whitespace-nowrap">
                          {showArchivedTasks ? (
                            <button
                              type="button"
                              className="h-7 shrink-0 whitespace-nowrap px-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-ds-brand-primary-text"
                              onClick={() => onRestoreTrayTask(task.id)}
                            >
                              恢复
                            </button>
                          ) : (
                            <>
                          <button
                            type="button"
                            className={`h-7 shrink-0 whitespace-nowrap px-1.5 text-[11px] font-medium transition-colors ${
                              running || done ? 'text-slate-300' : 'text-zinc-500 hover:text-ds-brand-primary-text'
                            } disabled:cursor-not-allowed`}
                            disabled={running || done}
                            onClick={() => runTrayTaskWithConflictFeedback(task)}
                          >
                            执行
                          </button>
                          <button
                            type="button"
                            className="h-7 shrink-0 whitespace-nowrap px-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-300"
                            disabled={!running}
                            onClick={() => onCompleteTrayTask(task.id)}
                          >
                            确认到达
                          </button>
                          <button
                            type="button"
                            className="h-7 shrink-0 whitespace-nowrap px-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:text-ds-brand-primary-text disabled:cursor-not-allowed disabled:text-slate-300"
                            disabled={!done}
                            title={done ? '归档到历史任务' : '任务完成后可归档'}
                            onClick={() => onArchiveTrayTask(task.id)}
                          >
                            归档
                          </button>
                          <div className="relative">
                            <button
                              ref={(element) => {
                                deleteButtonRefs.current[task.id] = element;
                              }}
                              type="button"
                              className="h-7 shrink-0 whitespace-nowrap px-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:text-red-600"
                              aria-label={`删除 ${task.id}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeletePopoverTaskId((currentId) => (currentId === task.id ? null : task.id));
                              }}
                            >
                              删除
                            </button>
                            {deletePopoverOpen && deletePopoverRect && typeof document !== 'undefined' && createPortal(
                              <div
                                className="ds-popover-glass-surface fixed z-[1000] w-52 rounded-lg p-3"
                                style={{ right: deletePopoverRect.right, top: deletePopoverRect.top }}
                                onPointerDown={(event) => event.stopPropagation()}
                                onMouseDown={(event) => event.stopPropagation()}
                              >
                                <div className="ds-popover-glass-arrow absolute -top-1.5 right-2 size-3 rotate-45 border-l border-t" />
                                <div className="text-sm font-medium text-slate-900">确认删除AGV任务行？</div>
                                <div className="mt-3 flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-xs"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setDeletePopoverTaskId(null);
                                    }}
                                  >
                                    取消
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 bg-red-500 px-2.5 text-xs text-white hover:bg-red-600"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setDeletePopoverTaskId(null);
                                      onDeleteTrayTask(task.id);
                                    }}
                                  >
                                    删除
                                  </Button>
                                </div>
                              </div>,
                              document.body,
                            )}
                          </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {visibleTrayTasks.length === 0 && (
                    <div className="px-3 py-8 text-center text-xs text-slate-400">
                      {showArchivedTasks ? '暂无历史任务。' : '暂无 AGV 任务，点击新建任务添加一行。'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {!showArchivedTasks && <section className="flex min-h-[248px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/60 bg-white shadow-inner shadow-slate-900/5">
        <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-zinc-200/70 bg-white px-4">
          <div className="text-[11px] font-semibold leading-4 text-zinc-800">托盘整体视图</div>
          <div className="text-[10px] font-medium text-slate-400">现场状态回显 · 点击已占用点位转为空托</div>
        </div>
        <div className="relative min-h-0 flex-1 bg-white">
          <TrayReferenceStrip
            allocations={actualAllocations}
            showState
            quantityReady
            overviewReferenceItems={actualReferenceItems}
            onReleaseOccupiedTray={onReleaseOccupiedTray}
            showPlanCards={false}
          />
        </div>
      </section>}
    </div>
  );
}

type TrayManagementPageProps = {
  traySlots: TraySlot[];
  trayTasks: TrayTask[];
  selectedTask: TrayManagedTask | null;
  pendingWorkOrders: TrayManagedTask[];
  onCreateTask: () => void;
  onUpdateTrayTask: (taskId: string, updates: Partial<TrayTask>) => void;
  onClose: () => void;
  onRunTrayTask: (taskId: string) => void;
  onRunPlanTrayTask: (slot: TrayAllocation, workOrderNo?: string) => void;
  onCompleteTrayTask: (taskId: string) => void;
  onArchiveTrayTask: (taskId: string) => void;
  onRestoreTrayTask: (taskId: string) => void;
  onDeleteTrayTask: (taskId: string) => void;
  onReleaseOccupiedTray: (trayCode: string) => void;
};

function TrayManagementHeader({
  activeView,
  onClose,
  onChangeView,
}: {
  activeView: 'management' | 'sorting-area';
  onClose: () => void;
  onChangeView: (view: 'management' | 'sorting-area') => void;
}) {
  const sortingAreaView = activeView === 'sorting-area';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          onClick={onClose}
          aria-label="返回生产执行"
          title="返回生产执行"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{sortingAreaView ? '理料区视图' : '托盘管理'}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-400">{sortingAreaView ? '现场托盘位置与计划摆盘回显' : 'AGV 任务调度与托盘现场管理'}</div>
        </div>
      </div>
      {sortingAreaView ? (
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-zinc-300 hover:bg-slate-50 hover:text-slate-900"
          onClick={() => onChangeView('management')}
          aria-label="返回托盘管理"
        >
          <LayoutDashboard className="size-3.5" />
          返回托盘管理
        </button>
      ) : (
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-ds-brand-primary px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-ds-brand-primary-hover"
          onClick={() => onChangeView('sorting-area')}
          aria-label="进入理料区视图"
        >
          <MonitorUp className="size-3.5" />
          理料区视图
        </button>
      )}
    </header>
  );
}

function PendingWorkOrderSelector({
  workOrders,
  selectedWorkOrderId,
  onSelect,
}: {
  workOrders: TrayManagedTask[];
  selectedWorkOrderId: string | null;
  onSelect: (workOrderId: string) => void;
}) {
  return (
    <div className="shrink-0 border-b border-zinc-200/80 bg-white px-5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[11px] font-medium text-slate-400">待下发工单</span>
        {workOrders.length > 0 ? (
          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex w-max min-w-full items-center gap-1.5 pr-1">
              {workOrders.map((workOrder) => {
                const selected = workOrder.id === selectedWorkOrderId;
                const workOrderLabel = workOrder.workOrderNo ?? workOrder.name ?? workOrder.drawingNo;
                return (
                  <button
                    key={workOrder.id}
                    type="button"
                    className={`max-w-[210px] shrink-0 rounded-md border px-2.5 py-1 text-left transition-colors ${
                      selected
                        ? 'border-orange-200 bg-orange-50 text-ds-brand-primary-text ring-1 ring-inset ring-orange-100'
                        : 'border-zinc-200 bg-zinc-50 text-slate-500 hover:border-orange-200 hover:bg-orange-50/60 hover:text-slate-700'
                    }`}
                    title={`${workOrderLabel} · ${workOrder.name ?? workOrder.drawingNo}`}
                    aria-pressed={selected}
                    onClick={() => workOrder.id && onSelect(workOrder.id)}
                  >
                    <span className="block truncate font-mono text-[10px] font-semibold leading-4">{workOrderLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <span className="truncate text-[11px] text-slate-400">暂无配置完成工单</span>
        )}
      </div>
    </div>
  );
}

export function TrayManagementPage({
  traySlots,
  trayTasks,
  selectedTask,
  pendingWorkOrders,
  onCreateTask,
  onUpdateTrayTask,
  onClose,
  onRunTrayTask,
  onRunPlanTrayTask,
  onCompleteTrayTask,
  onArchiveTrayTask,
  onRestoreTrayTask,
  onDeleteTrayTask,
  onReleaseOccupiedTray,
}: TrayManagementPageProps) {
  const isSortingAreaPath = decodeURI(window.location.pathname) === '/生产执行/理料区视图';
  const [activeView, setActiveView] = useState<'management' | 'sorting-area'>(isSortingAreaPath ? 'sorting-area' : 'management');
  const [selectedPendingWorkOrderId, setSelectedPendingWorkOrderId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedPendingWorkOrderId((current) => {
      if (current && pendingWorkOrders.some((workOrder) => workOrder.id === current)) return current;
      return pendingWorkOrders[0]?.id ?? null;
    });
  }, [pendingWorkOrders]);
  const selectedPendingWorkOrder = pendingWorkOrders.find((workOrder) => workOrder.id === selectedPendingWorkOrderId) ?? null;
  const planTask = activeView === 'sorting-area' ? selectedPendingWorkOrder : selectedTask;
  const activeTrayTasks = trayTasks.filter((task) => !task.archived);
  const planAllocations = buildTrayPlanAllocationsForTask(planTask);
  const actualAllocations = buildTrayActualAllocations(traySlots);
  const actualReferenceItems = buildActualReferenceItems(actualAllocations, activeTrayTasks);
  const planTaskByCode = new Map(planAllocations.map((slot) => {
    const materialNames = getTrayVisibleMaterials(slot).map((material) => material.partName);
    const matchingTasks = trayTasks.filter((task) => (
      task.type === '上料任务'
      && task.dropoff === slot.code
      && !task.archived
      && materialNames.length > 0
      && (materialNames.includes(task.material) || materialNames.every((materialName) => task.material.includes(materialName)))
      && (!planTask?.workOrderNo || task.workOrderNo === planTask.workOrderNo)
    ));
    const task = matchingTasks.find((item) => item.state === 'running')
      ?? matchingTasks.find((item) => item.state === 'pending')
      ?? matchingTasks.find((item) => item.state === 'done');
    return [slot.code, task] as const;
  }));
  const planTaskStates = Object.fromEntries(
    [...planTaskByCode].flatMap(([code, task]) => task ? [[code, task.state]] : []),
  ) as Partial<Record<string, TrayTaskState>>;
  const runningTaskLockedPoints = new Set(
    activeTrayTasks.filter((task) => task.state === 'running').flatMap((task) => [task.pickup, task.dropoff]),
  );
  const planTaskExecutionDisabled = Object.fromEntries(planAllocations.map((slot) => {
    const taskState = planTaskByCode.get(slot.code)?.state;
    const blockedByRunningTask = taskState !== 'running'
      && (runningTaskLockedPoints.has('00') || runningTaskLockedPoints.has(slot.code));
    return [slot.code, blockedByRunningTask];
  })) as Partial<Record<string, boolean>>;

  const updateTrayRoute = (view: 'management' | 'sorting-area') => {
    const nextPath = view === 'sorting-area' ? '/生产执行/理料区视图' : '/生产执行';
    if (decodeURI(window.location.pathname) !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleClose = () => {
    updateTrayRoute('management');
    onClose();
  };

  const handleChangeView = (view: 'management' | 'sorting-area') => {
    setActiveView(view);
    updateTrayRoute(view);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-100">
      <TrayManagementHeader activeView={activeView} onClose={handleClose} onChangeView={handleChangeView} />
      <div className="min-h-0 flex-1">
        {activeView === 'management' ? (
          <TrayManagementView
            traySlots={traySlots}
            trayTasks={trayTasks}
            selectedTask={selectedTask}
            onCreateTask={onCreateTask}
            onUpdateTrayTask={onUpdateTrayTask}
            onRunTrayTask={onRunTrayTask}
            onCompleteTrayTask={onCompleteTrayTask}
            onArchiveTrayTask={onArchiveTrayTask}
            onRestoreTrayTask={onRestoreTrayTask}
            onDeleteTrayTask={onDeleteTrayTask}
            onReleaseOccupiedTray={onReleaseOccupiedTray}
          />
        ) : (
          <div className="flex h-full min-h-0 flex-col bg-zinc-100/60">
            <PendingWorkOrderSelector
              workOrders={pendingWorkOrders}
              selectedWorkOrderId={selectedPendingWorkOrderId}
              onSelect={setSelectedPendingWorkOrderId}
            />
            <div className="min-h-0 flex-1 p-5 pt-4">
              <div className="h-full min-h-0 overflow-hidden rounded-lg border border-white/70 bg-white shadow-inner shadow-slate-900/5">
              <TrayReferenceStrip
                allocations={planAllocations}
                showState={false}
                quantityReady={Boolean(planTask && planTask.quantity > 0)}
                overviewReferenceItems={actualReferenceItems}
                cardSectionLabel={planTask ? '计划上料摆盘' : undefined}
                onReleaseOccupiedTray={onReleaseOccupiedTray}
                screenMode
                showPlanCards={Boolean(planTask)}
                planTaskStates={planTaskStates}
                planTaskExecutionDisabled={planTaskExecutionDisabled}
                onExecutePlanTray={(slot) => onRunPlanTrayTask(slot, planTask?.workOrderNo)}
                onConfirmPlanTrayArrival={(slot) => {
                  const task = planTaskByCode.get(slot.code);
                  if (task?.state === 'running') onCompleteTrayTask(task.id);
                }}
              />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
