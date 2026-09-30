import { ChevronDown, CircleAlert, Cog, Minus, X } from 'lucide-react';
import { Tooltip } from 'antd';
import { Button } from '../ui/button';
import { ParameterSwitch } from '../ui/parameter-switch';
import { ProcessNumberField } from '../process/ProcessNumberField';
import { ProcessSingleSelect } from '../process/ProcessSingleSelect';

export type MagnetPanelSetting = {
  enabled: boolean;
  length: string;
  width: string;
  forceLevel: string;
  load: string;
  travel: string;
};

export function MagnetParameterPanel({
  magnetName,
  gripperType,
  setting,
  minimized,
  immersive,
  top,
  onToggleMinimized,
  onClose,
  onSettingChange,
  onReset,
}: {
  magnetName: string;
  gripperType: string;
  setting: MagnetPanelSetting;
  minimized: boolean;
  immersive: boolean;
  top: number;
  onToggleMinimized: () => void;
  onClose: () => void;
  onSettingChange: (updater: (setting: MagnetPanelSetting) => MagnetPanelSetting) => void;
  onReset: () => void;
}) {
  const disabled = !setting.enabled;
  return (
    <div className={`absolute flex w-[300px] flex-col overflow-hidden rounded-lg border border-white/60 bg-ds-bg-glass-float shadow-lg shadow-black/5 backdrop-blur-md ${immersive ? 'left-[336px] z-50' : 'left-3 z-20'}`} style={{ top }}>
      <div className="flex items-center justify-between border-b border-slate-100/80 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Cog className="size-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-800">{magnetName}磁铁参数设置</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={onToggleMinimized} title={minimized ? '展开' : '最小化'}>
            {minimized ? <ChevronDown className="size-3.5" /> : <Minus className="size-3.5" />}
          </button>
          <button type="button" className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={onClose} aria-label="关闭磁铁参数设置">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="min-h-0 flex-1 space-y-3 p-3">
            <div className="ds-parameter-card-inset-sm rounded-lg border border-slate-200/80 bg-white/70">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium text-slate-600">{magnetName}磁铁</div>
                <ParameterSwitch checked={setting.enabled} ariaLabel={`${magnetName}磁铁任务启用状态`} size="sm" onChange={(enabled) => onSettingChange((value) => ({ ...value, enabled }))} />
              </div>
              <div className={`space-y-3 ${disabled ? 'opacity-60' : ''}`}>
                <div className="grid grid-cols-2 gap-2">
                  <div><div className="mb-1 text-[10px] text-slate-400">磁铁尺寸 - 长</div><ProcessNumberField value={setting.length} unit="mm" disabled={disabled} inputClassName="h-8 px-2 pr-8 text-right text-xs" onChange={(value) => onSettingChange((current) => ({ ...current, length: value }))} /></div>
                  <div><div className="mb-1 text-[10px] text-slate-400">磁铁尺寸 - 宽</div><ProcessNumberField value={setting.width} unit="mm" disabled={disabled} inputClassName="h-8 px-2 pr-8 text-right text-xs" onChange={(value) => onSettingChange((current) => ({ ...current, width: value }))} /></div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-400"><span>磁力档位配置</span><Tooltip title="用户调整磁力以避免抓取粘连"><CircleAlert className="size-3 text-slate-300" /></Tooltip></div>
                  <ProcessSingleSelect items={['大', '中', '小'].map((value) => ({ id: value, name: value }))} selectedId={setting.forceLevel} disabled={disabled} size="sm" elevation="none" onChange={(value) => value && onSettingChange((current) => ({ ...current, forceLevel: value }))} />
                </div>
                <div className={`grid gap-2 ${magnetName === '中' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div><div className="mb-1 text-[10px] text-slate-400">额定负载</div><ProcessNumberField value={setting.load} unit="kg" disabled={disabled} inputClassName="h-8 px-2 pr-8 text-right text-xs" onChange={(value) => onSettingChange((current) => ({ ...current, load: value }))} /></div>
                  {magnetName !== '中' && <div><div className="mb-1 text-[10px] text-slate-400">升降行程</div><ProcessNumberField value={setting.travel} unit="mm" disabled={disabled} inputClassName="h-8 px-2 pr-8 text-right text-xs" onChange={(value) => onSettingChange((current) => ({ ...current, travel: value }))} /></div>}
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50/80 px-2.5 py-2 text-[11px] leading-5 text-slate-500">当前工序使用 {gripperType}；这里的磁铁参数仅覆盖当前任务，不会改写全局工艺参数设置。</div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={onReset}>重置</Button>
            <Button size="sm" className="h-7 bg-ds-brand-primary px-2 text-[11px] text-white hover:bg-ds-brand-primary-hover" onClick={onClose}>确认</Button>
          </div>
        </>
      )}
    </div>
  );
}
