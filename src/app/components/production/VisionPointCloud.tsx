import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useLoader } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import solverRafflesUrl from '../../../solver_Raffles.stl?url';
import type { GantryVisionViewportState } from './GantryVisionScanPanel';
import { visionAssemblyDatumGroups } from './vision-assembly-demo';
import {
  parsePoseValue,
  resolveVisionAbsolutePose,
  type VisionCalibrationPose,
  type VisionCoordinateMode,
  type VisionScanStatus,
} from './VisionAbnormalCalibrationPanel';

export type WeldVisionViewportState = {
  resultPoint: VisionCalibrationPose;
  photoPose: VisionCalibrationPose;
  coordinateMode: VisionCoordinateMode;
  baselinePose: VisionCalibrationPose;
  scanStatus: VisionScanStatus;
};

type VisionPointCloudProps = {
  sourceUrl: string;
  cameraIndex: number;
  gantryViewport?: GantryVisionViewportState | null;
  assemblyDemoVisible?: boolean;
  weldViewport?: WeldVisionViewportState | null;
  className?: string;
};

type VisionWorldPoint = {
  x: number;
  y: number;
  z: number;
};

type PointCloudTransform = {
  center: VisionWorldPoint;
  scale: number;
};

type LoadedPointCloud = {
  geometry: THREE.BufferGeometry;
  pointCount: number;
  transform: PointCloudTransform;
};

type AssemblyDatumSegment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
};

type AssemblyDatumGroupView = {
  id: string;
  label: string;
  distance: string;
  segments: AssemblyDatumSegment[];
};

// 与工艺规划普通装配基准线的 3 个模型单位半径保持同等视觉粗细。
const assemblyDatumLineRadius = 0.002;
const assemblyDatumDistanceRadius = 0.001;
const assemblyDatumEndpointRadius = 0.012;

const assemblyModelUrls = [
  '/models/0162-01-010101-01.stl',
  '/models/0162-01-010101-02.stl',
] as const;

export const gantryDemoWeldSeam = {
  start: { x: 1450.9, y: -629.441, z: -230.882 },
  end: { x: 1798.31, y: -629.639, z: -233.726 },
} as const;

const viewRotations: [number, number, number][] = [
  [-0.16, -0.52, 0.02],
  [-0.08, 0.06, 0],
  [-0.22, 0.62, -0.02],
  [0.08, -1.02, 0.06],
  [-0.26, 1.22, 0],
  [0.16, Math.PI, -0.04],
  [-0.12, 2.02, 0.03],
  [0.04, -2.16, -0.03],
];

function buildPointCloudGeometry(buffer: ArrayBuffer) {
  if (buffer.byteLength % 12 !== 0) {
    throw new Error('点云数据长度不是 XYZ Float32 的整数倍');
  }

  const source = new Float32Array(buffer);
  const pointCount = source.length / 3;
  const min = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  const max = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  for (let index = 0; index < source.length; index += 3) {
    min.x = Math.min(min.x, source[index]);
    min.y = Math.min(min.y, source[index + 1]);
    min.z = Math.min(min.z, source[index + 2]);
    max.x = Math.max(max.x, source[index]);
    max.y = Math.max(max.y, source[index + 1]);
    max.z = Math.max(max.z, source[index + 2]);
  }

  const center = min.clone().add(max).multiplyScalar(0.5);
  const span = max.clone().sub(min);
  const scale = 3.2 / Math.max(span.x, span.y, span.z, 1);
  const positions = new Float32Array(source.length);
  const colors = new Float32Array(source.length);
  const lowColor = new THREE.Color('#475569');
  const highColor = new THREE.Color('#cbd5e1');
  const accentColor = new THREE.Color('#f59e0b');
  const pointColor = new THREE.Color();

  for (let index = 0; index < source.length; index += 3) {
    const sourceX = source[index];
    const sourceY = source[index + 1];
    const sourceZ = source[index + 2];
    const heightRatio = span.z > 0 ? (sourceZ - min.z) / span.z : 0.5;

    positions[index] = (sourceX - center.x) * scale;
    positions[index + 1] = (sourceZ - center.z) * scale;
    positions[index + 2] = -(sourceY - center.y) * scale;

    pointColor.copy(lowColor).lerp(highColor, 0.25 + heightRatio * 0.75);
    if (heightRatio > 0.82) {
      pointColor.lerp(accentColor, Math.min(0.45, (heightRatio - 0.82) * 2.5));
    }
    colors[index] = pointColor.r;
    colors[index + 1] = pointColor.g;
    colors[index + 2] = pointColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();

  return {
    geometry,
    pointCount,
    transform: {
      center: { x: center.x, y: center.y, z: center.z },
      scale,
    },
  };
}

function toScenePoint(point: VisionWorldPoint, transform: PointCloudTransform): [number, number, number] {
  return [
    (point.x - transform.center.x) * transform.scale,
    (point.z - transform.center.z) * transform.scale,
    -(point.y - transform.center.y) * transform.scale,
  ];
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRhinoObjCurves(text: string): AssemblyDatumSegment[] {
  const vertices: THREE.Vector3[] = [];
  const segments: AssemblyDatumSegment[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === 'v') {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        // 复用工艺规划的 Rhino OBJ 到 STL 场景坐标转换。
        vertices.push(new THREE.Vector3(x, -z, y));
      }
      continue;
    }
    if (parts[0] !== 'curv') continue;
    const pointIndices = parts.slice(3)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));
    for (let index = 0; index < pointIndices.length - 1; index += 1) {
      const start = vertices[pointIndices[index] - 1];
      const end = vertices[pointIndices[index + 1] - 1];
      if (start && end) segments.push({ start: start.clone(), end: end.clone() });
    }
  }
  return segments;
}

function DatumSegment({
  segment,
  color,
}: {
  segment: AssemblyDatumSegment;
  color: string;
}) {
  const transform = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(segment.end, segment.start);
    const length = direction.length();
    const position = new THREE.Vector3().addVectors(segment.start, segment.end).multiplyScalar(0.5);
    const quaternion = length > 0
      ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
      : new THREE.Quaternion();
    return { length, position, quaternion };
  }, [segment]);

  if (transform.length <= 0) return null;
  return (
    <mesh position={transform.position} quaternion={transform.quaternion} renderOrder={40}>
      <cylinderGeometry args={[assemblyDatumLineRadius, assemblyDatumLineRadius, transform.length, 12]} />
      <meshBasicMaterial color={color} depthTest={false} depthWrite={false} transparent opacity={1} toneMapped={false} />
    </mesh>
  );
}

function DatumDistanceGuide({
  group,
  color,
}: {
  group: AssemblyDatumGroupView;
  color: string;
}) {
  const first = group.segments[0];
  const second = group.segments[1];
  if (!first || !second) return null;

  const start = first.start.clone().lerp(first.end, 0.5);
  const end = second.start.clone().lerp(second.end, 0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quaternion = length > 0
    ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
    : new THREE.Quaternion();

  return (
    <group>
      {length > 0 ? (
        <mesh position={position} quaternion={quaternion} renderOrder={41}>
          <cylinderGeometry args={[assemblyDatumDistanceRadius, assemblyDatumDistanceRadius, length, 10]} />
          <meshBasicMaterial color={color} depthTest={false} depthWrite={false} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      ) : null}
      <mesh position={start} renderOrder={42}>
        <sphereGeometry args={[assemblyDatumEndpointRadius, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={end} renderOrder={42}>
        <sphereGeometry args={[assemblyDatumEndpointRadius, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <Html center position={position} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <span
          className="whitespace-nowrap font-semibold leading-none"
          style={{
            display: 'inline-block',
            color,
            fontSize: '3px',
            transform: 'translate(4px, -3px)',
          }}
        >
          {group.label} · {group.distance} mm
        </span>
      </Html>
    </group>
  );
}

function AssemblyModel({ geometry, color, edgeColor }: { geometry: THREE.BufferGeometry; color: string; edgeColor: string }) {
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 30), [geometry]);
  useEffect(() => () => edgesGeometry.dispose(), [edgesGeometry]);

  return (
    <>
      <mesh geometry={geometry} renderOrder={12}>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.72} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edgesGeometry} renderOrder={13}>
        <lineBasicMaterial color={edgeColor} transparent opacity={0.7} />
      </lineSegments>
    </>
  );
}

function VisionAssemblyOverlay() {
  const loadedGeometries = useLoader(STLLoader, [...assemblyModelUrls]);
  const [lineGroups, setLineGroups] = useState<AssemblyDatumGroupView[]>([]);

  const assemblyTransform = useMemo(() => {
    const bounds = new THREE.Box3();
    loadedGeometries.forEach((geometry) => {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) bounds.union(geometry.boundingBox);
    });
    const size = bounds.getSize(new THREE.Vector3());
    return {
      center: bounds.getCenter(new THREE.Vector3()),
      scale: 3.05 / Math.max(size.x, size.y, size.z, 1),
    };
  }, [loadedGeometries]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      visionAssemblyDatumGroups.flatMap((group) => group.lineUrls.map((url) => fetch(url).then((response) => response.ok ? response.text() : '')))
    )
      .then((texts) => {
        if (cancelled) return;
        let textIndex = 0;
        setLineGroups(visionAssemblyDatumGroups.map((group) => ({
          id: group.id,
          label: group.label,
          distance: group.distance,
          segments: group.lineUrls.flatMap(() => parseRhinoObjCurves(texts[textIndex++] ?? '')),
        })));
      })
      .catch(() => {
        if (!cancelled) setLineGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const transformedLineGroups = useMemo(() => lineGroups.map((group) => ({
    ...group,
    segments: group.segments.map((segment) => ({
      start: segment.start.clone().sub(assemblyTransform.center).multiplyScalar(assemblyTransform.scale),
      end: segment.end.clone().sub(assemblyTransform.center).multiplyScalar(assemblyTransform.scale),
    })),
  })), [assemblyTransform, lineGroups]);

  return (
    <group position={[0, 0.04, 0]}>
      <group position={assemblyTransform.center.clone().multiplyScalar(-assemblyTransform.scale)} scale={assemblyTransform.scale}>
        {loadedGeometries.map((geometry, index) => (
          <AssemblyModel
            key={assemblyModelUrls[index]}
            geometry={geometry}
            color={index === 0 ? '#94a3b8' : '#f0a15a'}
            edgeColor={index === 0 ? '#475569' : '#9a3412'}
          />
        ))}
      </group>
      {transformedLineGroups.map((group) => (
        <group key={group.id}>
          {group.segments.map((segment, index) => (
            <DatumSegment key={`${group.id}-${index}`} segment={segment} color={group.id === 'datum-group-1' ? '#2563eb' : '#16a34a'} />
          ))}
          <DatumDistanceGuide group={group} color={group.id === 'datum-group-1' ? '#2563eb' : '#16a34a'} />
        </group>
      ))}
    </group>
  );
}

function GantrySeamGuide({
  transform,
  resultPoints,
}: {
  transform: PointCloudTransform;
  resultPoints: GantryVisionViewportState['resultPoints'];
}) {
  const start = useMemo(() => toScenePoint(gantryDemoWeldSeam.start, transform), [transform]);
  const end = useMemo(() => toScenePoint(gantryDemoWeldSeam.end, transform), [transform]);
  const segment = useMemo(() => {
    const startPoint = new THREE.Vector3(...start);
    const endPoint = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    const position = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
    const quaternion = length > 0
      ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
      : new THREE.Quaternion();

    return { length, position, quaternion };
  }, [end, start]);

  return (
    <>
      {segment.length > 0 ? (
        <mesh position={segment.position} quaternion={segment.quaternion} renderOrder={20}>
          <cylinderGeometry args={[0.007, 0.007, segment.length, 12]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.82} />
        </mesh>
      ) : null}
      {([
        ['p1', 'P1', start],
        ['p2', 'P2', end],
      ] as const).map(([id, label, position]) => {
        const enabled = resultPoints[id];
        const color = enabled ? '#f97316' : '#94a3b8';
        return (
          <group key={id} position={position}>
            <mesh renderOrder={21}>
              <sphereGeometry args={[0.013, 18, 18]} />
              <meshBasicMaterial color={color} transparent opacity={enabled ? 1 : 0.16} />
            </mesh>
            <Html center position={[0, 0, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <span
                className={`whitespace-nowrap font-semibold leading-none ${enabled ? 'text-orange-600' : 'text-slate-300'}`}
                style={{
                  display: 'inline-block',
                  fontSize: '3px',
                  transform: `translate(${id === 'p1' ? '-4px' : '4px'}, -3px)`,
                }}
              >
                {label}
              </span>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function GantryToolHeads({
  transform,
  viewport,
}: {
  transform: PointCloudTransform;
  viewport: GantryVisionViewportState;
}) {
  const loadedGeometry = useLoader(STLLoader, solverRafflesUrl);
  const geometry = useMemo(() => {
    const nextGeometry = loadedGeometry.clone();
    nextGeometry.computeVertexNormals();
    nextGeometry.computeBoundingBox();
    const bounds = nextGeometry.boundingBox;
    if (bounds) {
      nextGeometry.translate(
        -(bounds.min.x + bounds.max.x) / 2,
        -(bounds.min.y + bounds.max.y) / 2,
        -bounds.min.z,
      );
    }
    return nextGeometry;
  }, [loadedGeometry]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      {viewport.scanPoints.slice(0, 2).map((scanPoint, index) => {
        const pointId = index === 0 ? 'p1' : 'p2';
        const anchor = pointId === 'p1' ? gantryDemoWeldSeam.start : gantryDemoWeldSeam.end;
        const enabled = viewport.resultPoints[pointId] && scanPoint.enabled;
        const active = viewport.activeScanPoint === index;
        const pose = scanPoint.pose;
        const position = toScenePoint({
          x: anchor.x + toNumber(pose.offsetX),
          y: anchor.y + toNumber(pose.offsetY),
          z: anchor.z + toNumber(pose.distance) + toNumber(pose.offsetZ),
        }, transform);
        const rotation: [number, number, number] = [
          Math.PI / 2 + THREE.MathUtils.degToRad(toNumber(pose.pitch)),
          THREE.MathUtils.degToRad(toNumber(pose.workAngle)),
          THREE.MathUtils.degToRad(toNumber(pose.roll)),
        ];

        return (
          <group key={pointId} position={position} rotation={rotation} scale={transform.scale}>
            <mesh geometry={geometry} castShadow receiveShadow>
              <meshStandardMaterial
                color={enabled ? '#64748b' : '#94a3b8'}
                metalness={0.58}
                roughness={0.36}
                transparent
                opacity={enabled ? 0.94 : 0.25}
              />
            </mesh>
            {active ? (
              <mesh geometry={geometry} renderOrder={20}>
                <meshBasicMaterial
                  color="#FACC15"
                  transparent
                  opacity={0.62}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-2}
                  polygonOffsetUnits={-2}
                  side={THREE.DoubleSide}
                  toneMapped={false}
                />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </>
  );
}

function PointCloudObject({
  cloud,
  cameraIndex,
  gantryViewport,
  assemblyDemoVisible,
}: {
  cloud: LoadedPointCloud;
  cameraIndex: number;
  gantryViewport?: GantryVisionViewportState | null;
  assemblyDemoVisible?: boolean;
}) {
  const rotation = viewRotations[cameraIndex % viewRotations.length] ?? viewRotations[0];

  return (
    <group rotation={rotation}>
      <points geometry={cloud.geometry} frustumCulled={false}>
        <pointsMaterial
          vertexColors
          size={0.012}
          sizeAttenuation
          transparent
          opacity={0.94}
          depthWrite={false}
        />
      </points>
      {gantryViewport ? (
        <GantrySeamGuide transform={cloud.transform} resultPoints={gantryViewport.resultPoints} />
      ) : null}
      {gantryViewport?.screen === 'parameters' ? (
        <Suspense fallback={null}>
          <GantryToolHeads transform={cloud.transform} viewport={gantryViewport} />
        </Suspense>
      ) : null}
      {assemblyDemoVisible ? (
        <Suspense fallback={null}>
          <VisionAssemblyOverlay />
        </Suspense>
      ) : null}
    </group>
  );
}

export function VisionPointCloud({
  sourceUrl,
  cameraIndex,
  gantryViewport,
  assemblyDemoVisible = false,
  className = '',
}: VisionPointCloudProps) {
  const [cloud, setCloud] = useState<LoadedPointCloud | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedGeometry: THREE.BufferGeometry | null = null;

    setCloud(null);
    setError(null);
    fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`点云加载失败：${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const loadedCloud = buildPointCloudGeometry(buffer);
        loadedGeometry = loadedCloud.geometry;
        if (cancelled) {
          loadedGeometry.dispose();
          return;
        }
        setCloud(loadedCloud);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : '点云加载失败');
      });

    return () => {
      cancelled = true;
      loadedGeometry?.dispose();
    };
  }, [sourceUrl]);

  const statusText = useMemo(() => {
    if (error) return error;
    if (!cloud) return '正在加载点云';
    return `${cloud.pointCount.toLocaleString('zh-CN')} 点`;
  }, [cloud, error]);

  return (
    <div className={`absolute inset-0 ${className}`.trim()} aria-label="视觉监控点云三维视图">
      <Canvas
        shadows
        camera={{ position: [3.9, 2.35, 4.2], fov: 38, near: 0.01, far: 100 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true }}
      >
        {cloud ? <PointCloudObject cloud={cloud} cameraIndex={cameraIndex} gantryViewport={gantryViewport} assemblyDemoVisible={assemblyDemoVisible} /> : null}
        <ambientLight intensity={1.35} />
        <directionalLight position={[2.4, 3.6, 4.2]} intensity={2.4} />
        <gridHelper args={[4.5, 30, '#cbd5e1', '#e2e8f0']} position={[0, -0.52, 0]} />
        <OrbitControls
          makeDefault
          enableDamping={false}
          enablePan={false}
          minDistance={2.2}
          maxDistance={8}
          maxPolarAngle={Math.PI * 0.88}
        />
      </Canvas>
      {!cloud || error ? (
        <div className={`pointer-events-none absolute inset-0 grid place-items-center text-xs ${error ? 'text-red-500' : 'text-slate-400'}`}>
          <span className="rounded-full border border-white/70 bg-white/76 px-3 py-1.5 shadow-sm backdrop-blur-md">
            {statusText}
          </span>
        </div>
      ) : null}
    </div>
  );
}
