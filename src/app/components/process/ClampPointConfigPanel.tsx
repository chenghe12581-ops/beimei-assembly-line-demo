import { ParameterSwitch } from '../ui/parameter-switch';
import { ProcessJointAngleRow } from './ProcessJointAngleRow';

export type ClampPointSegmentConfig = {
  /** 该焊缝段是否启用压紧 */
  enabled: boolean;
  /** 结果点位 J1-J6（J1 为 mm，其余为 °），字符串数值与既有工艺参数字段保持一致 */
  joints: string[];
};

export const CLAMP_POINT_JOINT_LABELS = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6'] as const;

/** 与翻面压紧任务“生成压紧位置”的 demo 结果点位同源，仅取 J1-J6 */
export const DEFAULT_CLAMP_POINT_JOINTS: readonly string[] = ['12.50', '-18.20', '36.80', '72.40', '-44.60', '28.30'];

export function createDefaultClampPointSegments(segmentCount = 6): ClampPointSegmentConfig[] {
  return Array.from({ length: segmentCount }, () => ({
    enabled: true,
    joints: [...DEFAULT_CLAMP_POINT_JOINTS],
  }));
}

/**
 * 压紧点配置面板（内嵌版）：展示单个焊缝段的压紧配置。
 * 焊缝段切换由所在面板承载，本组件只负责当前段的启用开关与 J1-J6 编辑。
 */
export function ClampPointConfigPanel({
  segment,
  onToggleEnabled,
  onJointChange,
}: {
  segment: ClampPointSegmentConfig | undefined;
  onToggleEnabled: (enabled: boolean) => void;
  onJointChange: (jointIndex: number, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-ds-border-default bg-zinc-50/80 px-2 py-1.5">
        <span className="text-xs font-medium text-slate-600">启用压紧</span>
        <ParameterSwitch
          checked={segment?.enabled ?? true}
          onChange={onToggleEnabled}
          ariaLabel="当前焊缝段启用压紧"
          enabledLabel="启用"
          disabledLabel="关闭"
          size="sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-2">
        {(segment?.joints ?? []).map((jointValue, jointIndex) => (
          <ProcessJointAngleRow
            key={`clamp-joint-${jointIndex}`}
            index={jointIndex}
            label={CLAMP_POINT_JOINT_LABELS[jointIndex]}
            value={jointValue}
            disabled={!segment?.enabled}
            onChange={(nextValue) => onJointChange(jointIndex, nextValue)}
          />
        ))}
      </div>
      {segment && !segment.enabled && (
        <div className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] leading-5 text-slate-400">
          该焊缝段已关闭压紧，关节角不参与回显与加工。
        </div>
      )}
    </div>
  );
}
