import type { ProductionStationCardVariant } from './production-station-card-variant';
import { formatCombinedPartObject } from './ProductionTaskTreePanel2';

export type ProductionStationStatus = 'idle' | 'default' | 'running' | 'paused' | 'abnormal';
export type ProductionStationDisplayStatus = 'idle' | 'running' | 'paused' | 'abnormal';
export type ProductionStationCardDensity = 'compact' | 'viewport';

export function getProductionStationDisplayStatus(status: ProductionStationStatus): ProductionStationDisplayStatus {
  if (status === 'running') return 'running';
  if (status === 'abnormal') return 'abnormal';
  if (status === 'paused') return 'paused';
  return 'idle';
}

export function getProductionStationStatusLabel(status: ProductionStationStatus) {
  const displayStatus = getProductionStationDisplayStatus(status);
  if (displayStatus === 'running') return '执行中';
  if (displayStatus === 'abnormal') return '异常';
  if (displayStatus === 'paused') return '已暂停';
  return '空闲';
}

type ProductionStationCardProps = {
  variant?: ProductionStationCardVariant;
  density?: ProductionStationCardDensity;
  name: string;
  status: ProductionStationStatus;
  partName?: string;
};

const activeProductionStationStatuses = new Set<ProductionStationStatus>(['running', 'paused', 'abnormal']);
const productionStationCardIsometricAngle = 25.4;
const productionStationCardHorizontalScale = 0.75;
const productionStationCardHorizontalBaseWidth = 252;
const productionStationCardHorizontalBaseHeight = 92;
export const productionStationCardHorizontalWidth = productionStationCardHorizontalBaseWidth * productionStationCardHorizontalScale;
export const productionStationCardHorizontalHeight = productionStationCardHorizontalBaseHeight * productionStationCardHorizontalScale;
export const productionStationCardSkewScale = 0.75;
export const productionStationCardIsometricAnchorRatio = 0.5;
export const productionStationCardSkewBaseWidth = 252;
export const productionStationCardSkewBaseHeight = 104;
export const productionStationCardSkewWidth = productionStationCardSkewBaseWidth * productionStationCardSkewScale;
export const productionStationCardSkewHeight = productionStationCardSkewBaseHeight * productionStationCardSkewScale;
const productionStationCardHorizontalIdleBaseHeight = 58;
const productionStationCardSkewIdleBaseHeight = 62;
const productionStationCardHorizontalScaleOffsetX = (productionStationCardHorizontalBaseWidth - productionStationCardHorizontalWidth) / 2;
const productionStationCardSkewScaleOffsetX = (productionStationCardSkewBaseWidth - productionStationCardSkewWidth) / 2;
const productionStationCardPartLineHeight = 20;
const productionStationCardPartLineCharacterCapacity = 31;

function getProductionStationCardPartLineCount(partName?: string) {
  if (!partName) return 1;
  return Math.max(1, Math.ceil((partName.length + 10) / productionStationCardPartLineCharacterCapacity));
}

function getProductionStationCardBaseHeight(variant: ProductionStationCardVariant, status: ProductionStationStatus, partName?: string) {
  const idle = getProductionStationDisplayStatus(status) === 'idle';
  const baseHeight = idle
    ? variant === 'skew' ? productionStationCardSkewIdleBaseHeight : productionStationCardHorizontalIdleBaseHeight
    : variant === 'skew' ? productionStationCardSkewBaseHeight : productionStationCardHorizontalBaseHeight;
  const extraLines = idle
    ? 0
    : Math.max(0, getProductionStationCardPartLineCount(partName ? formatCombinedPartObject(partName) : undefined) - 2);
  return baseHeight + extraLines * productionStationCardPartLineHeight;
}

export function getProductionStationCardHeight(
  variant: ProductionStationCardVariant,
  status: ProductionStationStatus,
  partName?: string,
) {
  const scale = variant === 'skew' ? productionStationCardSkewScale : productionStationCardHorizontalScale;
  return getProductionStationCardBaseHeight(variant, status, partName) * scale;
}

function getProductionStationCardTone(status: ProductionStationStatus) {
  const occupied = activeProductionStationStatuses.has(status);
  const paused = getProductionStationDisplayStatus(status) === 'paused';
  const abnormal = status === 'abnormal';
  const accentClassName = abnormal ? 'bg-red-500' : paused ? 'bg-amber-500' : occupied ? 'bg-emerald-500' : 'bg-slate-300/60';
  const borderClassName = occupied ? 'border-ds-border-process-planning-structure shadow-ds-sm' : 'border-white/60 shadow-none';
  const surfaceClassName = occupied
    ? 'bg-ds-bg-process-planning-task-surface'
    : 'bg-white/68 backdrop-blur-md transition-[background-color,border-color,box-shadow] group-hover:bg-white/82 group-hover:border-white/85 group-hover:shadow-ds-sm';
  const badgeClassName = abnormal
      ? 'bg-red-50 text-red-700'
      : paused
      ? 'bg-amber-50 text-amber-700'
      : occupied
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-slate-100/60 text-slate-400/80';
  const titleClassName = occupied ? 'text-ds-text-control' : 'text-ds-text-control-muted';
  const partClassName = occupied ? 'text-ds-text-control' : 'text-ds-text-disabled';
  const statusLabel = getProductionStationStatusLabel(status);
  return { occupied, abnormal, paused, accentClassName, borderClassName, surfaceClassName, badgeClassName, titleClassName, partClassName, statusLabel };
}

function HorizontalProductionStationCard({
  density,
  name,
  status,
  partName,
}: Omit<ProductionStationCardProps, 'variant'> & { density: ProductionStationCardDensity }) {
  const { occupied, abnormal, paused, accentClassName, borderClassName, surfaceClassName, badgeClassName, titleClassName, partClassName, statusLabel } = getProductionStationCardTone(status);
  const statusDotClassName = `${accentClassName} ${occupied && !abnormal && !paused ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`;
  const displayPartName = occupied && partName ? formatCombinedPartObject(partName) : '暂无';
  const contentPaddingClassName = occupied
    ? density === 'viewport' ? 'px-4 py-2.5' : 'px-3.5 py-2.5'
    : density === 'viewport' ? 'px-4 pb-2.5 pt-3.5' : 'px-3.5 pb-2.5 pt-3.5';
  const baseHeight = getProductionStationCardBaseHeight('horizontal', status, partName);
  const visualHeight = baseHeight * productionStationCardHorizontalScale;
  const scaleOffsetY = baseHeight - visualHeight;

  return (
    <div
      className="group relative overflow-visible transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        width: productionStationCardHorizontalWidth,
        height: visualHeight,
      }}
    >
      <div
        className="absolute"
        style={{
          left: -productionStationCardHorizontalScaleOffsetX,
          top: -scaleOffsetY,
          width: productionStationCardHorizontalBaseWidth,
          height: baseHeight,
          transform: `scale(${productionStationCardHorizontalScale})`,
          transformOrigin: `${productionStationCardIsometricAnchorRatio * 100}% 100%`,
        }}
      >
        <div className={`relative h-fit min-h-full overflow-hidden rounded-ds-md border ${surfaceClassName} ${borderClassName}`}>
          <div className={`absolute inset-y-0 left-0 w-0.5 ${accentClassName}`} />
          <div
            className={`relative z-10 flex h-fit flex-col justify-between ${contentPaddingClassName}`}
            style={{ minHeight: baseHeight - 2 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className={`min-w-0 truncate text-[18px] font-medium ${
                  titleClassName
                }`}
                title={name}
              >
                {name}
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[12px] font-medium ${badgeClassName}`}>
                <span className={`size-1.5 rounded-full ${statusDotClassName}`} />
                {statusLabel}
              </span>
            </div>
            {occupied && (
              <div
                className="min-w-0 whitespace-normal break-words text-[14px] leading-5"
                title={partName}
              >
                <span className="text-ds-text-disabled">加工零件：</span>
                <span className={`font-medium ${partClassName}`}>
                  {displayPartName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkewProductionStationCard({
  density,
  name,
  status,
  partName,
}: Omit<ProductionStationCardProps, 'variant'> & { density: ProductionStationCardDensity }) {
  const { occupied, abnormal, paused, accentClassName, borderClassName, surfaceClassName, badgeClassName, titleClassName, partClassName, statusLabel } = getProductionStationCardTone(status);
  const isometricTransform = `skewY(-${productionStationCardIsometricAngle}deg) scaleX(0.84)`;
  const isometricTransformOrigin = `${productionStationCardIsometricAnchorRatio * 100}% 100%`;
  const displayPartName = occupied && partName ? formatCombinedPartObject(partName) : '暂无';
  const contentPaddingClassName = occupied ? 'px-4 pb-2.5 pt-2.5' : 'px-4 pb-2.5 pt-3.5';
  const baseHeight = getProductionStationCardBaseHeight('skew', status, partName);
  const visualHeight = baseHeight * productionStationCardSkewScale;
  const scaleOffsetY = baseHeight - visualHeight;

  return (
    <div
      className="group relative overflow-visible transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        width: productionStationCardSkewWidth,
        height: visualHeight,
      }}
    >
      <div
        className="absolute"
        style={{
          left: -productionStationCardSkewScaleOffsetX,
          top: -scaleOffsetY,
          width: productionStationCardSkewBaseWidth,
          height: baseHeight,
          transform: `scale(${productionStationCardSkewScale})`,
          transformOrigin: `${productionStationCardIsometricAnchorRatio * 100}% 100%`,
        }}
      >
        <div
          className={`relative h-fit min-h-full overflow-hidden rounded-ds-md border ${surfaceClassName} ${borderClassName}`}
          style={{
            transform: isometricTransform,
            transformOrigin: isometricTransformOrigin,
          }}
        >
          <div className={`absolute inset-y-0 left-0 w-0.5 ${accentClassName}`} />
          <div
            className={`relative z-10 flex h-fit flex-col ${contentPaddingClassName}`}
            style={{ minHeight: baseHeight - 2 }}
          >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className={`truncate text-[18px] font-medium ${titleClassName}`}
                    title={name}
                  >
                    {name}
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[12px] font-medium ${badgeClassName}`}>
                  <span className={`size-1.5 rounded-full ${accentClassName} ${
                    occupied && !abnormal && !paused ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''
                  }`} />
                  {statusLabel}
                </span>
              </div>
              {occupied && (
                <div className={`flex min-h-8 items-start gap-2 ${
                  density === 'viewport' ? 'mt-1.5 pt-1.5' : 'mt-1.5 pt-1.5'
                }`}>
                  <div
                    className="min-w-0 flex-1 whitespace-normal break-words text-[14px] leading-5"
                    title={partName}
                  >
                    <span className="text-ds-text-disabled">加工零件：</span>
                    <span className={`font-medium ${partClassName}`}>
                      {displayPartName}
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductionStationCard({
  variant = 'horizontal',
  density = 'compact',
  ...props
}: ProductionStationCardProps) {
  if (variant === 'skew') {
    return <SkewProductionStationCard density={density} {...props} />;
  }

  return <HorizontalProductionStationCard density={density} {...props} />;
}
