import { useEffect, useRef, useState, type ButtonHTMLAttributes, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  CircleStop,
  Home,
  Minus,
  Pause,
  Play,
  Plus,
  Power,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';

export type ProductionManualControlTarget =
  | {
      kind: 'station';
      stationId: string;
      stationName: string;
    }
  | {
      kind: 'station-group';
      groupName: string;
      stations: Array<{ stationId: string; stationName: string }>;
      activeStationId?: string;
    }
  | {
      kind: 'tray';
      trayCode: string;
      stationName: string;
      material: string | null;
      quantity: number;
      stateLabel: string;
    };

type ManualDeviceState = 'ready' | 'running' | 'paused' | 'home';
type ManualDeviceCommand = 'start' | 'pause' | 'reset' | 'home';

type JointControlGroupConfig = {
  title: string;
  start: number;
  end: number;
  home?: boolean;
};

type StationManualControlConfig = {
  robotTitle?: string;
  robots?: string[];
  jointGroups?: JointControlGroupConfig[];
  toolTitle?: string;
};

export type ProductionManualControlPanelProps = {
  target: ProductionManualControlTarget;
  disabled?: boolean;
  disabledReason?: string;
  onEditTrayMaterial?: (trayCode: string) => void;
  onDispatchAgv?: (trayCode: string, pickupPoint: string) => void;
  onCommand?: (message: string) => void;
};

const stationManualControlConfigs: Record<string, StationManualControlConfig> = {
  'area-main-grinding': {
    robotTitle: '打磨机器人控制',
    robots: ['打磨机器人1', '打磨机器人2'],
    toolTitle: '打磨头',
  },
  'area-main-assembly-1': {
    robotTitle: '焊接机器人控制',
    robots: ['焊接机器人1', '焊接机器人2'],
    jointGroups: [
      { title: '支撑装置控制', start: 1, end: 4 },
      { title: '压紧装置控制', start: 5, end: 10 },
    ],
  },
  'area-side-grind-1': {
    jointGroups: [{ title: '三轴控制', start: 1, end: 3, home: true }],
    toolTitle: '打磨头',
  },
  'area-turnover': {
    jointGroups: [
      { title: '支撑装置控制', start: 1, end: 3 },
      { title: '压紧装置控制', start: 4, end: 7 },
    ],
  },
  'area-side-grind-2': {
    jointGroups: [{ title: '三轴控制', start: 1, end: 3, home: true }],
    toolTitle: '打磨头',
  },
  'area-main-assembly-2': {
    robotTitle: '焊接机器人控制',
    robots: ['焊接机器人1', '焊接机器人2'],
    jointGroups: [
      { title: '支撑装置控制', start: 1, end: 10 },
      { title: '压紧装置控制', start: 11, end: 16 },
    ],
  },
};

const trayPointOptions = Array.from({ length: 11 }, (_, index) => {
  const value = String(index).padStart(2, '0');
  return { id: value, name: value };
});

const hardwareButtonClassName = 'inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-[2px] border border-zinc-400 bg-transparent px-2 text-[11px] font-medium text-zinc-600 transition-[border-color,color,transform] hover:border-zinc-600 hover:text-zinc-800 active:translate-y-px disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300';

export function HardwareControlButton({
  children,
  className = '',
  executing = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; executing?: boolean }) {
  return (
    <button
      type="button"
      className={`${hardwareButtonClassName} ${executing ? 'animate-pulse border-zinc-600 text-zinc-900' : ''} ${className}`}
      aria-busy={executing || undefined}
      data-executing={executing ? 'true' : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

function getDeviceStateLabel(state: ManualDeviceState) {
  if (state === 'running') return '运行中';
  if (state === 'paused') return '已暂停';
  if (state === 'home') return 'HOME 位';
  return '已就绪';
}

function getDeviceStateDot(state: ManualDeviceState) {
  if (state === 'running') return 'bg-emerald-500';
  if (state === 'paused') return 'bg-amber-500';
  return 'bg-zinc-400';
}

export function JogControlRow({
  joint,
  value,
  unit = 'mm',
  onJog,
}: {
  joint: string;
  value: number;
  unit?: string;
  onJog: (direction: -1 | 1) => void;
}) {
  const delayRef = useRef<number | null>(null);
  const repeatRef = useRef<number | null>(null);
  const [activeDirection, setActiveDirection] = useState<-1 | 1 | null>(null);

  const stopJog = () => {
    if (delayRef.current !== null) window.clearTimeout(delayRef.current);
    if (repeatRef.current !== null) window.clearInterval(repeatRef.current);
    delayRef.current = null;
    repeatRef.current = null;
    setActiveDirection(null);
  };

  useEffect(() => stopJog, []);

  const startJog = (direction: -1 | 1) => {
    stopJog();
    setActiveDirection(direction);
    onJog(direction);
    delayRef.current = window.setTimeout(() => {
      repeatRef.current = window.setInterval(() => onJog(direction), 100);
    }, 320);
  };

  const renderJogButton = (direction: -1 | 1) => (
    <HardwareControlButton
      className="size-8 px-0"
      executing={activeDirection === direction}
      aria-label={`${joint}${direction < 0 ? '负向' : '正向'}点动`}
      title={`${direction < 0 ? '负向' : '正向'}点动`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        startJog(direction);
      }}
      onPointerUp={stopJog}
      onPointerCancel={stopJog}
      onLostPointerCapture={stopJog}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startJog(direction);
      }}
      onKeyUp={(event) => {
        if (event.key === 'Enter' || event.key === ' ') stopJog();
      }}
    >
      {direction < 0 ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
    </HardwareControlButton>
  );

  return (
    <div className="grid grid-cols-[32px_32px_minmax(0,1fr)_32px] items-center gap-2">
      <span className="text-xs font-medium text-ds-text-control">{joint}</span>
      {renderJogButton(1)}
      <div className="flex h-8 min-w-0 items-center justify-end rounded-[2px] border border-zinc-300 bg-transparent px-2 text-xs tabular-nums text-zinc-700" aria-label={`${joint}当前位置`}>
        {value.toFixed(1)} <span className="ml-1 text-[10px] text-zinc-400">{unit}</span>
      </div>
      {renderJogButton(-1)}
    </div>
  );
}

function ManualSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-zinc-200/85 pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex min-h-8 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-ds-text-control">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function RobotControlGroup({
  title,
  targetKey,
  robots,
  deviceStates,
  executingControls,
  onCommand,
}: {
  title: string;
  targetKey: string;
  robots: string[];
  deviceStates: Record<string, ManualDeviceState>;
  executingControls: Set<string>;
  onCommand: (device: string, command: ManualDeviceCommand) => void;
}) {
  const commands: Array<{ id: ManualDeviceCommand; label: string; icon: ReactNode }> = [
    { id: 'start', label: '启动', icon: <Play className="size-3.5" /> },
    { id: 'pause', label: '暂停', icon: <Pause className="size-3.5" /> },
    { id: 'reset', label: '报警复位', icon: <RotateCcw className="size-3.5" /> },
    { id: 'home', label: '回HOME位', icon: <Home className="size-3.5" /> },
  ];

  return (
    <ManualSection title={title}>
      <div className="space-y-3">
        {robots.map((robot) => {
          const state = deviceStates[`${targetKey}:${robot}`] ?? 'ready';
          return (
            <div key={robot}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-700">{robot}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                  <span className={`size-1.5 rounded-full ${getDeviceStateDot(state)}`} />
                  {getDeviceStateLabel(state)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {commands.map((command) => (
                  <HardwareControlButton
                    key={command.id}
                    executing={executingControls.has(`${targetKey}:${robot}:${command.id}`)}
                    onClick={() => onCommand(robot, command.id)}
                  >
                    {command.icon}
                    {command.label}
                  </HardwareControlButton>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ManualSection>
  );
}

export function ProductionManualControlPanel({
  target,
  disabled = false,
  disabledReason,
  onEditTrayMaterial,
  onDispatchAgv,
  onCommand,
}: ProductionManualControlPanelProps) {
  const [deviceStates, setDeviceStates] = useState<Record<string, ManualDeviceState>>({});
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({});
  const [jointPositions, setJointPositions] = useState<Record<string, number>>({});
  const [trayPickupPoints, setTrayPickupPoints] = useState<Record<string, string>>({});
  const [executingControls, setExecutingControls] = useState<Set<string>>(new Set());
  const [activeGroupStationId, setActiveGroupStationId] = useState<string | null>(null);
  const commandTimersRef = useRef<Set<number>>(new Set());
  const targetKey = target.kind === 'tray'
    ? `tray-${target.trayCode}`
    : target.kind === 'station'
      ? target.stationId
      : 'station-group';

  useEffect(() => () => {
    commandTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    commandTimersRef.current.clear();
  }, []);

  const runControlCommand = (controlKey: string, onComplete: () => void) => {
    if (executingControls.has(controlKey)) return;
    setExecutingControls((current) => new Set(current).add(controlKey));
    const timer = window.setTimeout(() => {
      onComplete();
      setExecutingControls((current) => {
        const next = new Set(current);
        next.delete(controlKey);
        return next;
      });
      commandTimersRef.current.delete(timer);
    }, 900);
    commandTimersRef.current.add(timer);
  };

  const handleDeviceCommand = (device: string, command: ManualDeviceCommand) => {
    runControlCommand(`${targetKey}:${device}:${command}`, () => {
      const nextState: ManualDeviceState = command === 'start'
        ? 'running'
        : command === 'pause'
          ? 'paused'
          : command === 'home'
            ? 'home'
            : 'ready';
      setDeviceStates((current) => ({ ...current, [`${targetKey}:${device}`]: nextState }));
      const commandLabel = command === 'start' ? '启动' : command === 'pause' ? '暂停' : command === 'reset' ? '报警复位' : '回 HOME 位';
      onCommand?.(`${target.kind === 'station-group' ? target.groupName : target.stationName} · ${device}已${commandLabel}`);
    });
  };

  if (target.kind === 'tray') {
    const controllable = target.trayCode !== '09';
    const pickupPoint = trayPickupPoints[target.trayCode] ?? '00';
    return (
      <div className="space-y-3" data-testid={`production-manual-tray-${target.trayCode}`}>
        <ManualSection
          title="托盘物料"
          action={controllable ? (
            <HardwareControlButton onClick={() => onEditTrayMaterial?.(target.trayCode)}>
              修改物料
            </HardwareControlButton>
          ) : undefined}
        >
          <div className="space-y-2 border-l-2 border-zinc-300 pl-2.5">
            <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2 text-xs">
              <span className="text-ds-text-muted">当前物料</span>
              <span className="truncate text-zinc-700" title={target.material ?? undefined}>{target.material ?? '空'}</span>
            </div>
            <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2 text-xs">
              <span className="text-ds-text-muted">当前数量</span>
              <span className="tabular-nums text-zinc-700">{target.quantity} 件</span>
            </div>
          </div>
        </ManualSection>

        {controllable ? (
          <>
            <RobotControlGroup
              title="搬运机器人控制"
              targetKey={targetKey}
              robots={['搬运机器人']}
              deviceStates={deviceStates}
              executingControls={executingControls}
              onCommand={handleDeviceCommand}
            />
            <ManualSection title="AGV调度">
              <div className="grid grid-cols-[72px_minmax(0,1fr)] items-end gap-2">
                <label className="ds-label-input-mini min-w-0">
                  <span className="ds-parameter-label">取货点</span>
                  <ProcessSingleSelect
                    items={trayPointOptions}
                    selectedId={pickupPoint}
                    size="task"
                    elevation="none"
                    dropdownMode="portal"
                    onChange={(nextPoint) => {
                      if (nextPoint) setTrayPickupPoints((current) => ({ ...current, [target.trayCode]: nextPoint }));
                    }}
                  />
                </label>
                <HardwareControlButton
                  className="w-full"
                  disabled={pickupPoint === target.trayCode}
                  executing={executingControls.has(`${targetKey}:agv-dispatch`)}
                  onClick={() => runControlCommand(`${targetKey}:agv-dispatch`, () => onDispatchAgv?.(target.trayCode, pickupPoint))}
                >
                  <Truck className="size-3.5" />
                  发起调度
                </HardwareControlButton>
              </div>
              <div className="mt-1.5 text-[10px] text-zinc-400">卸货点固定为 {target.trayCode}</div>
            </ManualSection>
          </>
        ) : (
          <div className="border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-400">
            09 号托盘工位暂无手动设备控制
          </div>
        )}
      </div>
    );
  }

  const stationControlSectionsProps = {
    deviceStates,
    setDeviceStates,
    toolStates,
    setToolStates,
    jointPositions,
    setJointPositions,
    executingControls,
    runControlCommand,
    onCommand,
  };

  if (target.kind === 'station-group') {
    const fallbackStationId = target.activeStationId ?? target.stations[0]?.stationId;
    const activeStation = target.stations.find((station) => station.stationId === activeGroupStationId)
      ?? target.stations.find((station) => station.stationId === fallbackStationId)
      ?? target.stations[0];
    if (!activeStation) {
      return (
        <div className="border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-400">
          当前工位暂无手动设备控制
        </div>
      );
    }
    return (
      <div className={`relative space-y-3 ${disabled ? 'opacity-60' : ''}`} data-testid="production-manual-station-group">
        {disabled && disabledReason ? (
          <div className="pointer-events-auto absolute inset-0 z-10 cursor-not-allowed" title={disabledReason} aria-label={disabledReason} role="presentation" />
        ) : null}
        <div
          className="grid gap-1 rounded-lg bg-ds-bg-segmented p-0.5"
          style={{ gridTemplateColumns: `repeat(${target.stations.length}, minmax(0, 1fr))` }}
          role="group"
          aria-label={`${target.groupName}手动控制工位切换`}
        >
          {target.stations.map((station) => {
            const selected = station.stationId === activeStation.stationId;
            return (
              <button
                key={station.stationId}
                type="button"
                className={`flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${selected ? 'bg-white text-ds-brand-primary-text shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}
                aria-pressed={selected}
                onClick={() => setActiveGroupStationId(station.stationId)}
              >
                {station.stationName}
              </button>
            );
          })}
        </div>
        <StationManualControlSections
          stationId={activeStation.stationId}
          stationName={activeStation.stationName}
          {...stationControlSectionsProps}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${disabled ? 'opacity-60' : ''}`} data-testid={`production-manual-station-${target.stationId}`}>
      {disabled && disabledReason ? (
        <div className="pointer-events-auto absolute inset-0 z-10 cursor-not-allowed" title={disabledReason} aria-label={disabledReason} role="presentation" />
      ) : null}
      <StationManualControlSections
        stationId={target.stationId}
        stationName={target.stationName}
        {...stationControlSectionsProps}
      />
    </div>
  );
}

type StationManualControlSectionsProps = {
  stationId: string;
  stationName: string;
  deviceStates: Record<string, ManualDeviceState>;
  setDeviceStates: Dispatch<SetStateAction<Record<string, ManualDeviceState>>>;
  toolStates: Record<string, boolean>;
  setToolStates: Dispatch<SetStateAction<Record<string, boolean>>>;
  jointPositions: Record<string, number>;
  setJointPositions: Dispatch<SetStateAction<Record<string, number>>>;
  executingControls: Set<string>;
  runControlCommand: (controlKey: string, onComplete: () => void) => void;
  onCommand?: (message: string) => void;
};

function StationManualControlSections({
  stationId,
  stationName,
  deviceStates,
  setDeviceStates,
  toolStates,
  setToolStates,
  jointPositions,
  setJointPositions,
  executingControls,
  runControlCommand,
  onCommand,
}: StationManualControlSectionsProps) {
  const targetKey = stationId;
  const config = stationManualControlConfigs[stationId];
  if (!config) {
    return (
      <div className="border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-400">
        当前工位暂无手动设备控制
      </div>
    );
  }

  const handleDeviceCommand = (device: string, command: ManualDeviceCommand) => {
    runControlCommand(`${targetKey}:${device}:${command}`, () => {
      const nextState: ManualDeviceState = command === 'start'
        ? 'running'
        : command === 'pause'
          ? 'paused'
          : command === 'home'
            ? 'home'
            : 'ready';
      setDeviceStates((current) => ({ ...current, [`${targetKey}:${device}`]: nextState }));
      const commandLabel = command === 'start' ? '启动' : command === 'pause' ? '暂停' : command === 'reset' ? '报警复位' : '回 HOME 位';
      onCommand?.(`${stationName} · ${device}已${commandLabel}`);
    });
  };

  return (
    <div className="space-y-3" data-testid={`production-manual-station-${stationId}`}>
      {config.robots && config.robotTitle ? (
        <RobotControlGroup
          title={config.robotTitle}
          targetKey={targetKey}
          robots={config.robots}
          deviceStates={deviceStates}
          executingControls={executingControls}
          onCommand={handleDeviceCommand}
        />
      ) : null}

      {config.jointGroups?.map((group) => {
        const joints = Array.from({ length: group.end - group.start + 1 }, (_, index) => `J${group.start + index}`);
        return (
          <ManualSection
            key={`${stationId}-${group.title}`}
            title={group.title}
            action={group.home ? (
              <HardwareControlButton
                executing={executingControls.has(`${targetKey}:${group.title}:home`)}
                onClick={() => runControlCommand(`${targetKey}:${group.title}:home`, () => {
                    setJointPositions((current) => {
                      const next = { ...current };
                      joints.forEach((joint) => { next[`${targetKey}:${joint}`] = 0; });
                      return next;
                    });
                    onCommand?.(`${stationName} · ${group.title}已回原位`);
                  })}
              >
                <CircleStop className="size-3.5" />
                回原位
              </HardwareControlButton>
            ) : undefined}
          >
            <div className="space-y-2">
              {joints.map((joint) => {
                const positionKey = `${targetKey}:${joint}`;
                return (
                  <JogControlRow
                    key={joint}
                    joint={joint}
                    value={jointPositions[positionKey] ?? 0}
                    onJog={(direction) => setJointPositions((current) => ({
                      ...current,
                      [positionKey]: Math.round(((current[positionKey] ?? 0) + direction) * 10) / 10,
                    }))}
                  />
                );
              })}
            </div>
          </ManualSection>
        );
      })}

      {config.toolTitle ? (
        <ManualSection title={config.toolTitle}>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <span className={`size-1.5 rounded-full ${toolStates[targetKey] ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
              {toolStates[targetKey] ? '已开启' : '已关闭'}
            </span>
            <div className="grid w-[176px] grid-cols-2 gap-2">
              <HardwareControlButton
                aria-pressed={toolStates[targetKey] === true}
                executing={executingControls.has(`${targetKey}:tool:on`)}
                onClick={() => runControlCommand(`${targetKey}:tool:on`, () => {
                  setToolStates((current) => ({ ...current, [targetKey]: true }));
                  onCommand?.(`${stationName} · ${config.toolTitle}已开启`);
                })}
              >
                <Power className="size-3.5" />
                开启
              </HardwareControlButton>
              <HardwareControlButton
                aria-pressed={toolStates[targetKey] !== true}
                executing={executingControls.has(`${targetKey}:tool:off`)}
                onClick={() => runControlCommand(`${targetKey}:tool:off`, () => {
                  setToolStates((current) => ({ ...current, [targetKey]: false }));
                  onCommand?.(`${stationName} · ${config.toolTitle}已关闭`);
                })}
              >
                <Power className="size-3.5" />
                关闭
              </HardwareControlButton>
            </div>
          </div>
        </ManualSection>
      ) : null}
    </div>
  );
}
