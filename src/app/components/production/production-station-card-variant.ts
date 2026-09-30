import { useCallback, useEffect, useState } from 'react';

export type ProductionStationCardVariant = 'horizontal' | 'skew';

type StoredProductionStationCardVariant = ProductionStationCardVariant | 'legacy' | 'occupancy';

const productionStationCardVariantStorageKey = 'beimei.production.station-card-variant';
const productionStationCardVariantEventName = 'beimei:production-station-card-variant';

function normalizeProductionStationCardVariant(value: unknown): ProductionStationCardVariant | null {
  if (value === 'horizontal' || value === 'legacy') return 'horizontal';
  if (value === 'skew' || value === 'occupancy') return 'skew';
  return null;
}

export function getProductionStationCardVariant(): ProductionStationCardVariant {
  if (typeof window === 'undefined') return 'horizontal';

  try {
    const storedVariant = window.localStorage.getItem(productionStationCardVariantStorageKey);
    return normalizeProductionStationCardVariant(storedVariant) ?? 'horizontal';
  } catch {
    return 'horizontal';
  }
}

export function setProductionStationCardVariant(variant: ProductionStationCardVariant) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(productionStationCardVariantStorageKey, variant);
  } catch {
    // The in-memory event below still keeps the current page synchronized.
  }

  window.dispatchEvent(new CustomEvent<ProductionStationCardVariant>(
    productionStationCardVariantEventName,
    { detail: variant },
  ));
}

export function useProductionStationCardVariant() {
  const [variant, setVariantState] = useState<ProductionStationCardVariant>(getProductionStationCardVariant);

  useEffect(() => {
    const handleVariantChange = (event: Event) => {
      const nextVariant = (event as CustomEvent<StoredProductionStationCardVariant>).detail;
      setVariantState(normalizeProductionStationCardVariant(nextVariant) ?? getProductionStationCardVariant());
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== productionStationCardVariantStorageKey) return;
      setVariantState(normalizeProductionStationCardVariant(event.newValue) ?? 'horizontal');
    };

    window.addEventListener(productionStationCardVariantEventName, handleVariantChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(productionStationCardVariantEventName, handleVariantChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setVariant = useCallback((nextVariant: ProductionStationCardVariant) => {
    setProductionStationCardVariant(nextVariant);
  }, []);

  return [variant, setVariant] as const;
}
