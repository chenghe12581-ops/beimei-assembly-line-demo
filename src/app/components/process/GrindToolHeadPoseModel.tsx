import { Html } from '@react-three/drei';

export type GrindToolHeadPoseItem = {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  rx: string;
  ry: string;
  rz: string;
  active: boolean;
  opacity: number;
  showTarget: boolean;
  showToolHead?: boolean;
};

export type ProcessPathPointMarkerItem = {
  id: string;
  label: string;
  position: [number, number, number];
  color?: string;
  labelColor?: string;
  radius?: number;
  labelOffset?: [number, number];
};

function ProcessPathPointMarker({ item }: { item: ProcessPathPointMarkerItem }) {
  return (
    <group position={item.position} renderOrder={26}>
      <mesh>
        <sphereGeometry args={[item.radius ?? 5, 16, 16]} />
        <meshBasicMaterial color={item.color ?? '#f97316'} depthTest={false} />
      </mesh>
      <Html center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span
          className="whitespace-nowrap font-semibold leading-none"
          style={{
            color: item.labelColor ?? '#c2410c',
            display: 'inline-block',
            fontSize: '12px',
            textShadow: '0 1px 2px rgba(255,255,255,0.92)',
            transform: `translate(${item.labelOffset?.[0] ?? 7}px, ${item.labelOffset?.[1] ?? -8}px)`,
          }}
        >
          {item.label}
        </span>
      </Html>
    </group>
  );
}

export function ProcessPathPointMarkerModel({ items }: { items: ProcessPathPointMarkerItem[] }) {
  return (
    <group>
      {items.map((item) => <ProcessPathPointMarker key={item.id} item={item} />)}
    </group>
  );
}

export function GrindToolHeadPoseModel({ items }: { items: GrindToolHeadPoseItem[] }) {
  return (
    <ProcessPathPointMarkerModel
      items={items.filter((item) => item.showTarget).map((item) => ({
        id: item.id,
        label: item.label,
        position: item.target,
      }))}
    />
  );
}
