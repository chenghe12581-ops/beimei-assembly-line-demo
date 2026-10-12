import { Html } from '@react-three/drei';
import type { WeldTimelineSegment } from './weld-robot-timeline';

/** 机器人对应的焊缝回显颜色（与面板色一致）。 */
const WELD_ECHO_COLORS: Record<string, string> = {
  Robot1: '#f97316',
  Robot2: '#3b82f6',
};

type WeldCircleEchoProps = {
  segments: WeldTimelineSegment[];
  selectedSegmentIndex: number | null;
  onSelectSegment: (segmentIndex: number) => void;
};

/**
 * 焊缝圆周回显：按段序把全部焊缝等分成圆弧，沿圆周排布在工件上，
 * 颜色区分作业机器人，点击可选中对应焊缝（与左侧列表、甘特联动）。
 */
export function WeldCircleEcho({ segments, selectedSegmentIndex, onSelectSegment }: WeldCircleEchoProps) {
  const count = segments.length;
  if (count === 0) return null;

  const arc = (Math.PI * 2) / count;
  const radius = 60;

  return (
    <group position={[0, 15, 0]}>
      {segments.map((segment, segmentIndex) => {
        const color = WELD_ECHO_COLORS[segment.robotName] ?? '#a1a1aa';
        const selected = selectedSegmentIndex === segmentIndex;
        const angle = segmentIndex * arc;
        const labelAngle = angle + arc / 2;
        const labelX = Math.cos(labelAngle) * radius;
        const labelZ = Math.sin(labelAngle) * radius;
        return (
          <group key={segment.id} rotation={[0, angle, 0]}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(event) => {
                event.stopPropagation();
                onSelectSegment(segmentIndex);
              }}
            >
              <torusGeometry args={[radius, selected ? 4.5 : 3, 12, 48, arc * 0.86]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={selected ? 0.65 : 0.3}
                transparent
                opacity={selected ? 1 : 0.8}
              />
            </mesh>
            <group position={[labelX, 0, labelZ]}>
              <Html center distanceFactor={520} zIndexRange={[10, 0]}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.94)',
                    border: `2px solid ${color}`,
                    color: '#334155',
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {segmentIndex + 1}
                </div>
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
}
