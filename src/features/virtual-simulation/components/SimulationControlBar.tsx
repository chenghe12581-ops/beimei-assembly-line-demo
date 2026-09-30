import { FastForward, Pause, Play, Rewind, RotateCcw } from 'lucide-react';
import type { SimulationPlaybackScope, SimulationPlaybackStatus } from '../types';

export function SimulationControlBar({
  status,
  progress,
  speed,
  scope,
  disabled,
  onPlay,
  onPause,
  onSkip,
  onReset,
  onSpeedChange,
}: {
  status: SimulationPlaybackStatus;
  progress: number;
  speed: '0.5x' | '1.0x' | '2.0x';
  scope: SimulationPlaybackScope | null;
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: (seconds: number) => void;
  onReset: () => void;
  onSpeedChange: (speed: '0.5x' | '1.0x' | '2.0x') => void;
}) {
  const isPlaying = status === 'playing';
  const scopeText = scope
    ? `当前范围：${scope.label}`
    : '当前范围：请先生成并选择程序';
  const resetDisabled = disabled || status !== 'paused';
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex h-14 w-[min(620px,calc(100%-32px))] -translate-x-1/2 items-center gap-2 rounded-xl border border-white/70 bg-white/78 px-2.5 shadow-lg shadow-black/8 backdrop-blur-md">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-ds-text-control-muted transition-colors hover:bg-white hover:text-ds-text-control-strong disabled:cursor-not-allowed disabled:text-zinc-300"
          onClick={() => onSkip(-3)}
          disabled={disabled}
          title="快退 3 秒"
          aria-label="快退 3 秒"
        >
          <Rewind className="size-3.5 fill-current" />
        </button>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg bg-ds-brand-primary text-white shadow-sm transition-colors hover:bg-ds-brand-primary-hover disabled:cursor-not-allowed disabled:bg-zinc-300"
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled}
          title={isPlaying ? '暂停' : status === 'paused' ? '继续' : scope?.actionLabel ?? '仿真播放'}
          aria-label={isPlaying ? '暂停仿真' : status === 'paused' ? '继续仿真' : '播放仿真'}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
        </button>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-ds-text-control-muted transition-colors hover:bg-white hover:text-ds-text-control-strong disabled:cursor-not-allowed disabled:text-zinc-300"
          onClick={() => onSkip(3)}
          disabled={disabled}
          title="快进 3 秒"
          aria-label="快进 3 秒"
        >
          <FastForward className="size-3.5 fill-current" />
        </button>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-ds-text-control-muted transition-colors hover:bg-white hover:text-ds-text-control-strong disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
          onClick={onReset}
          disabled={resetDisabled}
          title="重置仿真"
          aria-label="重置仿真"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
      <div className="min-w-0 flex-1 px-2">
        <div className="mb-2.5 flex items-center justify-between text-xs text-ds-text-control-muted">
          <span className="min-w-0 truncate pr-3" title={scopeText}>{scopeText}</span>
          <span className="font-medium tabular-nums text-ds-text-control">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200/90">
          <div className="h-full rounded-full bg-ds-brand-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <label className="ml-2 flex shrink-0 items-center gap-1.5 text-xs text-ds-text-control-muted">
        速度
        <select
          value={speed}
          disabled={disabled}
          onChange={(event) => onSpeedChange(event.target.value as '0.5x' | '1.0x' | '2.0x')}
          className="h-7 rounded-md border border-ds-border-default bg-white/85 px-1.5 text-[11px] text-ds-text-control outline-none focus:border-ds-border-focus disabled:cursor-not-allowed disabled:text-zinc-300"
        >
          <option value="0.5x">0.5x</option>
          <option value="1.0x">1.0x</option>
          <option value="2.0x">2.0x</option>
        </select>
      </label>
    </div>
  );
}
