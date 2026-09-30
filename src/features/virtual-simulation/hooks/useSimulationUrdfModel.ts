import { useEffect, useState } from 'react';
import { loadSimulationUrdfModel, type SimulationUrdfModel } from '../services/urdf';

export function useSimulationUrdfModel() {
  const [model, setModel] = useState<SimulationUrdfModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSimulationUrdfModel()
      .then((loadedModel) => {
        if (!cancelled) setModel(loadedModel);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'URDF 加载失败');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { model, error };
}
