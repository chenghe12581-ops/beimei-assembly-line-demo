import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

export type GlobalAlertConfig = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionText?: React.ReactNode;
  onAction?: () => void;
  /** 同一 key 不会重复弹出，默认用 title + description 生成。 */
  key?: string;
  /** 是否自动关闭，默认 0 表示不自动关闭（异常类需要人工确认）。 */
  duration?: number | null;
};

export type GlobalAlertApi = {
  notifyException: (config: GlobalAlertConfig) => void;
  close: (key: string) => void;
  destroy: () => void;
};

type GlobalAlertEntry = GlobalAlertConfig & { key: string };

const GlobalAlertContext = React.createContext<GlobalAlertApi | null>(null);

function GlobalAlertItem({
  alert,
  onClose,
}: {
  alert: GlobalAlertEntry;
  onClose: (key: string) => void;
}) {
  React.useEffect(() => {
    if (alert.duration === null || alert.duration === undefined || alert.duration <= 0) return;
    const timer = window.setTimeout(() => onClose(alert.key), alert.duration * 1000);
    return () => window.clearTimeout(timer);
  }, [alert.duration, alert.key, onClose]);

  const handleAction = () => {
    alert.onAction?.();
    onClose(alert.key);
  };

  return (
    <div className="pointer-events-auto w-full overflow-hidden rounded-lg border border-ds-border-glass bg-white shadow-lg shadow-slate-900/10">
      <div className="flex gap-3 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-900">{alert.title ?? '运行异常'}</div>
          {alert.description ? <div className="mt-1 text-xs leading-5 text-slate-600">{alert.description}</div> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            className="grid size-5 place-items-center text-slate-400 transition-colors hover:text-slate-700"
            aria-label="关闭异常提示"
            onClick={() => onClose(alert.key)}
          >
            <X className="size-4" />
          </button>
          {alert.onAction ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={handleAction}
            >
              {alert.actionText ?? '查看详情'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GlobalAlertStack({
  alerts,
  onClose,
}: {
  alerts: GlobalAlertEntry[];
  onClose: (key: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[200] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-3" aria-live="assertive">
      {alerts.map((alert) => <GlobalAlertItem key={alert.key} alert={alert} onClose={onClose} />)}
    </div>
  );
}

function useGlobalAlertController(): {
  api: GlobalAlertApi;
  contextHolder: React.ReactElement;
} {
  const [alerts, setAlerts] = React.useState<GlobalAlertEntry[]>([]);

  const close = React.useCallback((key: string) => {
    setAlerts((current) => current.filter((alert) => alert.key !== key));
  }, []);

  const destroy = React.useCallback(() => {
    setAlerts([]);
  }, []);

  const notifyException = React.useCallback((config: GlobalAlertConfig) => {
    const key = config.key ?? `global-alert:${String(config.title)}:${String(config.description)}`;
    const nextAlert: GlobalAlertEntry = { ...config, key };
    setAlerts((current) => {
      const index = current.findIndex((alert) => alert.key === key);
      if (index < 0) return [...current, nextAlert];
      const nextAlerts = [...current];
      nextAlerts[index] = nextAlert;
      return nextAlerts;
    });
  }, []);

  const api = React.useMemo<GlobalAlertApi>(
    () => ({ notifyException, close, destroy }),
    [notifyException, close, destroy],
  );
  const contextHolder = <GlobalAlertStack alerts={alerts} onClose={close} />;

  return { api, contextHolder };
}

export function useGlobalAlert(): GlobalAlertApi {
  const api = React.useContext(GlobalAlertContext);
  if (!api) {
    throw new Error('useGlobalAlert must be used within <GlobalAlertProvider>');
  }
  return api;
}

export function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
  const { api, contextHolder } = useGlobalAlertController();

  return (
    <GlobalAlertContext.Provider value={api}>
      {contextHolder}
      {children}
    </GlobalAlertContext.Provider>
  );
}

/** 不依赖 Provider 的轻量 hook，适合自包含页面直接使用。 */
export function useGlobalAlertHolder(): {
  contextHolder: React.ReactElement;
  notifyException: (config: GlobalAlertConfig) => void;
  close: (key: string) => void;
  destroy: () => void;
} {
  const { api, contextHolder } = useGlobalAlertController();
  return { contextHolder, ...api };
}
