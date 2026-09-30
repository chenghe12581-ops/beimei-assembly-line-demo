import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useLoader, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box, Check, CircleDot, Hammer, Layers3, ScanLine, Sparkles, X } from 'lucide-react';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ProcessPathPointMarkerModel } from '../components/process/GrindToolHeadPoseModel';
import { BentoFrame } from './BentoFrame';
import { CENTERED_BENTO_CONTENT_CLASS, WIDE_PADDED_BENTO_CONTENT_CLASS } from './bentoLayout';

const demoModelParts = [
  { id: 'part-01', url: '/models/0162-01-010101-01.stl', color: '#9ca3af' },
  { id: 'part-02', url: '/models/0162-01-010101-02.stl', color: '#9ca3af' },
  { id: 'part-03', url: '/models/0162-01-010101-03.stl', color: '#9ca3af' },
  { id: 'part-04', url: '/models/0162-01-010101-04.stl', color: '#9ca3af' },
] as const;

const demoWeldLineUrls = [
  '/models/intersections/front-intersection.obj',
  '/models/intersections/back-intersection-1.obj',
  '/models/intersections/back-intersection-2.obj',
] as const;

const demoGrindFaceUrls = [
  '/models/features/01-grind-face-1.obj',
  '/models/features/01-grind-face-2.obj',
  '/models/features/03-grind-face-1.obj',
  '/models/features/03-grind-face-2.obj',
] as const;

type IntersectionSegment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
};

function parseRhinoObjCurves(source: string) {
  const vertices: THREE.Vector3[] = [];
  const segments: IntersectionSegment[] = [];

  source.split(/\r?\n/).forEach((line) => {
    const tokens = line.trim().split(/\s+/);
    if (tokens[0] === 'v' && tokens.length >= 4) {
      const [x, y, z] = tokens.slice(1, 4).map(Number);
      if ([x, y, z].every(Number.isFinite)) vertices.push(new THREE.Vector3(x, -z, y));
      return;
    }

    if (tokens[0] === 'curv' && tokens.length >= 5) {
      const indices = tokens.slice(3).map((token) => Number.parseInt(token, 10) - 1);
      for (let index = 0; index < indices.length - 1; index += 1) {
        const start = vertices[indices[index]];
        const end = vertices[indices[index + 1]];
        if (start && end) segments.push({ start: start.clone(), end: end.clone() });
      }
    }
  });

  return segments;
}

function parseRhinoObjFaces(source: string) {
  const vertices: THREE.Vector3[] = [];
  const positions: number[] = [];

  source.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const tokens = line.split(/\s+/);
    if (tokens[0] === 'v' && tokens.length >= 4) {
      const [x, y, z] = tokens.slice(1, 4).map(Number);
      if ([x, y, z].every(Number.isFinite)) vertices.push(new THREE.Vector3(x, -z, y));
      return;
    }

    if (tokens[0] === 'f' && tokens.length >= 4) {
      const indices = tokens.slice(1)
        .map((token) => Number.parseInt(token.split('/')[0], 10))
        .filter(Number.isFinite);

      for (let index = 1; index < indices.length - 1; index += 1) {
        const triangle = [indices[0], indices[index], indices[index + 1]];
        triangle.forEach((vertexIndex) => {
          const point = vertices[vertexIndex - 1];
          if (point) positions.push(point.x, point.y, point.z);
        });
      }
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const weldLineStyle = {
  normal: { radius: 2.5, color: '#f59e0b', opacity: 0.7, depthTest: true },
  selected: { radius: 5, color: '#fb923c', opacity: 1, depthTest: false },
};

const grindFaceSelectedStyle = {
  color: '#22d3ee',
  opacity: 0.82,
  depthTest: false,
};

const partHighlightOverlayStyle = {
  color: '#FACC15',
  opacity: 0.58,
  edgeColor: '#F59E0B',
  edgeWidth: 1.2,
};

const demoGrindPathMarkers = [
  { id: 'demo-grind-p1', label: 'P1', position: [-360, -72, 34] as [number, number, number] },
  { id: 'demo-grind-p2', label: 'P2', position: [-220, -58, 38] as [number, number, number] },
  { id: 'demo-grind-p3', label: 'P3', position: [-80, -44, 42] as [number, number, number] },
  { id: 'demo-grind-p4', label: 'P4', position: [80, 44, 42] as [number, number, number] },
  { id: 'demo-grind-p5', label: 'P5', position: [220, 58, 38] as [number, number, number] },
  { id: 'demo-grind-p6', label: 'P6', position: [360, 72, 34] as [number, number, number] },
];

function createWideEdgeGeometry(edgeGeometry: THREE.BufferGeometry) {
  const positionAttribute = edgeGeometry.getAttribute('position');
  const positions: number[] = [];

  for (let index = 0; index < positionAttribute.count - 1; index += 2) {
    const start = new THREE.Vector3().fromBufferAttribute(positionAttribute, index);
    const end = new THREE.Vector3().fromBufferAttribute(positionAttribute, index + 1);
    if (start.distanceToSquared(end) <= 0.000001) continue;
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  }

  const wideEdgeGeometry = new LineSegmentsGeometry();
  wideEdgeGeometry.setPositions(positions);
  return wideEdgeGeometry;
}

function SelectedPartEdges({ geometry }: { geometry: LineSegmentsGeometry }) {
  const line = useMemo(() => {
    const material = new LineMaterial({
      color: new THREE.Color(partHighlightOverlayStyle.edgeColor).getHex(),
      transparent: true,
      opacity: partHighlightOverlayStyle.opacity,
      linewidth: partHighlightOverlayStyle.edgeWidth,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      resolution: new THREE.Vector2(548, 252),
    });
    const object = new LineSegments2(geometry, material);
    object.computeLineDistances();
    object.renderOrder = 19;
    return object;
  }, [geometry]);

  useEffect(
    () => () => {
      line.material.dispose();
    },
    [line],
  );

  return <primitive object={line} />;
}

function ThickIntersectionSegment({
  segment,
  modelCenter,
  selected,
}: {
  segment: IntersectionSegment;
  modelCenter: THREE.Vector3;
  selected: boolean;
}) {
  const transform = useMemo(() => {
    const start = segment.start.clone().sub(modelCenter);
    const end = segment.end.clone().sub(modelCenter);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quaternion = length > 0
      ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
      : new THREE.Quaternion();
    return { length, position, quaternion };
  }, [modelCenter, segment]);

  if (transform.length <= 0) return null;

  const style = selected ? weldLineStyle.selected : weldLineStyle.normal;

  return (
    <mesh position={transform.position} quaternion={transform.quaternion} renderOrder={20}>
      <cylinderGeometry args={[style.radius, style.radius, transform.length, 12]} />
      <meshBasicMaterial color={style.color} depthTest={style.depthTest} transparent opacity={style.opacity} />
    </mesh>
  );
}

function DemoAssemblyModel({
  selectedPartId,
  onPartSelect,
  weldSelected,
  grindSelected,
}: {
  selectedPartId: string | null;
  onPartSelect: (partId: string) => void;
  weldSelected: boolean;
  grindSelected: boolean;
}) {
  const loadedGeometries = useLoader(STLLoader, demoModelParts.map((part) => part.url));

  const { geometries, edgeGeometries, modelCenter } = useMemo(() => {
    const sourceGeometries = Array.isArray(loadedGeometries) ? loadedGeometries : [loadedGeometries];
    const unionBox = new THREE.Box3();

    sourceGeometries.forEach((loadedGeometry) => {
      loadedGeometry.computeBoundingBox();
      if (loadedGeometry.boundingBox) unionBox.union(loadedGeometry.boundingBox);
    });

    if (unionBox.isEmpty()) unionBox.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));

    const center = unionBox.getCenter(new THREE.Vector3());
    const centeredGeometries = sourceGeometries.map((loadedGeometry) => {
        const geometry = loadedGeometry.clone();
        geometry.translate(-center.x, -center.y, -center.z);
        geometry.computeVertexNormals();
        return geometry;
    });

    const centeredEdgeGeometries = centeredGeometries.map((geometry) => {
      const edgeGeometry = new THREE.EdgesGeometry(geometry, 24);
      const wideEdgeGeometry = createWideEdgeGeometry(edgeGeometry);
      edgeGeometry.dispose();
      return wideEdgeGeometry;
    });

    return { geometries: centeredGeometries, edgeGeometries: centeredEdgeGeometries, modelCenter: center };
  }, [loadedGeometries]);

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
      edgeGeometries.forEach((geometry) => geometry.dispose());
    },
    [edgeGeometries, geometries],
  );

  return (
    <group rotation={[-Math.PI / 2.25, 0, -Math.PI / 7]} scale={0.55}>
      {geometries.map((geometry, index) => {
        const part = demoModelParts[index];
        const selected = selectedPartId === part.id;

        return (
          <group key={part.url}>
            <mesh
              geometry={geometry}
              castShadow
              receiveShadow
              onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                onPartSelect(part.id);
              }}
            >
              <meshStandardMaterial
                color={part.color}
                emissive="#000000"
                emissiveIntensity={0}
                metalness={0.18}
                roughness={0.58}
                side={THREE.DoubleSide}
              />
            </mesh>
            {selected ? (
              <>
                <mesh geometry={geometry} renderOrder={18}>
                  <meshBasicMaterial
                    color={partHighlightOverlayStyle.color}
                    transparent
                    opacity={partHighlightOverlayStyle.opacity}
                    depthWrite={false}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                  />
                </mesh>
                <SelectedPartEdges geometry={edgeGeometries[index]} />
              </>
            ) : null}
          </group>
        );
      })}
      <DemoWeldLine modelCenter={modelCenter} selected={weldSelected} />
      <DemoGrindFaces modelCenter={modelCenter} selected={grindSelected} />
      {grindSelected && <ProcessPathPointMarkerModel items={demoGrindPathMarkers} />}
    </group>
  );
}

function DemoWeldLine({ modelCenter, selected }: { modelCenter: THREE.Vector3; selected: boolean }) {
  const [segments, setSegments] = useState<IntersectionSegment[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      demoWeldLineUrls.map((url) =>
        fetch(url)
          .then((response) => response.text())
          .then((source) => parseRhinoObjCurves(source))
          .catch(() => [] as IntersectionSegment[]),
      ),
    )
      .then((lineSegments) => {
        if (!cancelled) setSegments(lineSegments.flat());
      })
      .catch(() => {
        if (!cancelled) setSegments([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <group>
      {segments.map((segment, index) => (
        <ThickIntersectionSegment key={index} segment={segment} modelCenter={modelCenter} selected={selected} />
      ))}
    </group>
  );
}

function DemoGrindFaces({ modelCenter, selected }: { modelCenter: THREE.Vector3; selected: boolean }) {
  const [geometries, setGeometries] = useState<THREE.BufferGeometry[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      demoGrindFaceUrls.map((url) =>
        fetch(url)
          .then((response) => response.text())
          .then((source) => {
            const geometry = parseRhinoObjFaces(source);
            geometry.translate(-modelCenter.x, -modelCenter.y, -modelCenter.z);
            geometry.computeVertexNormals();
            return geometry;
          })
          .catch(() => null),
      ),
    )
      .then((loadedGeometries) => {
        if (cancelled) {
          loadedGeometries.forEach((geometry) => geometry?.dispose());
          return;
        }
        setGeometries((current) => {
          current.forEach((geometry) => geometry.dispose());
          return loadedGeometries.filter((geometry): geometry is THREE.BufferGeometry => geometry != null);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setGeometries((current) => {
            current.forEach((geometry) => geometry.dispose());
            return [];
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modelCenter]);

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
    },
    [geometries],
  );

  if (!selected || geometries.length === 0) return null;

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={demoGrindFaceUrls[index]} geometry={geometry} renderOrder={19}>
          <meshBasicMaterial
            color={grindFaceSelectedStyle.color}
            depthTest={grindFaceSelectedStyle.depthTest}
            transparent
            opacity={grindFaceSelectedStyle.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function DemoViewportScene({
  globalPlaying,
  selectedPartId,
  onPartSelect,
  weldSelected,
  grindSelected,
}: {
  globalPlaying: boolean;
  selectedPartId: string | null;
  onPartSelect: (partId: string) => void;
  weldSelected: boolean;
  grindSelected: boolean;
}) {
  return (
    <>
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 5, 5]} intensity={1.35} />
      <directionalLight position={[-4, -2, 3]} intensity={0.45} />
      <DemoAssemblyModel
        selectedPartId={selectedPartId}
        onPartSelect={onPartSelect}
        weldSelected={weldSelected}
        grindSelected={grindSelected}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={90}
        maxDistance={5000}
        zoomSpeed={1.05}
        autoRotate={globalPlaying}
        autoRotateSpeed={0.75}
      />
    </>
  );
}

type ManualFeatureMode = 'weld' | 'grind' | 'assembly';

const manualFeatureModes: {
  id: ManualFeatureMode;
  label: string;
  Icon: typeof ScanLine;
  selectedCopy: string;
  outputCopy: string;
  detailCopy: string;
  accentClass: string;
  ringClass: string;
}[] = [
  {
    id: 'weld',
    label: '焊接',
    Icon: ScanLine,
    selectedCopy: '已选 2 个工作面',
    outputCopy: '生成焊缝线',
    detailCopy: '交线 03-030303-01',
    accentClass: 'bg-ds-brand-primary text-white shadow-[0_10px_24px_rgba(255,105,0,0.28)]',
    ringClass: 'ring-orange-200/80',
  },
  {
    id: 'grind',
    label: '打磨',
    Icon: Hammer,
    selectedCopy: '已选 1 个打磨面',
    outputCopy: '生成打磨特征',
    detailCopy: '曲面 03-030303-03',
    accentClass: 'bg-cyan-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.22)]',
    ringClass: 'ring-cyan-200/80',
  },
  {
    id: 'assembly',
    label: '装配',
    Icon: Layers3,
    selectedCopy: '已选 2 条基准边',
    outputCopy: '生成装配基准',
    detailCopy: '基准 03-030303-05',
    accentClass: 'bg-slate-800 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]',
    ringClass: 'ring-slate-200/90',
  },
];

export function ViewportGlassPanelBento({
  globalPlaying,
  restartSignal,
}: {
  globalPlaying: boolean;
  restartSignal: number;
}) {
  const [activeMode, setActiveMode] = useState<ManualFeatureMode>('weld');
  const [extractPressed, setExtractPressed] = useState(false);
  const [userControlled, setUserControlled] = useState(false);

  const activeIndex = manualFeatureModes.findIndex((mode) => mode.id === activeMode);
  const activeFeature = manualFeatureModes[activeIndex] ?? manualFeatureModes[0];

  useEffect(() => {
    setActiveMode('weld');
    setExtractPressed(false);
    setUserControlled(false);
  }, [restartSignal]);

  useEffect(() => {
    if (!globalPlaying || userControlled) return undefined;

    const switchTimer = window.setInterval(() => {
      setActiveMode((currentMode) => {
        const currentIndex = manualFeatureModes.findIndex((mode) => mode.id === currentMode);
        return manualFeatureModes[(currentIndex + 1) % manualFeatureModes.length].id;
      });
      setExtractPressed(false);
    }, 2400);

    const pressTimer = window.setInterval(() => {
      setExtractPressed(true);
      window.setTimeout(() => setExtractPressed(false), 210);
    }, 2400);

    return () => {
      window.clearInterval(switchTimer);
      window.clearInterval(pressTimer);
    };
  }, [globalPlaying, userControlled]);

  const handleManualModeChange = (mode: ManualFeatureMode) => {
    setUserControlled(true);
    setActiveMode(mode);
    setExtractPressed(false);
  };

  return (
    <BentoFrame className="min-h-[282px] md:col-span-6 xl:col-span-6">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className={WIDE_PADDED_BENTO_CONTENT_CLASS}>
          <div className="relative h-[236px] overflow-hidden rounded-ds-xl border border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(226,232,240,0.42)_52%,rgba(255,255,255,0.68))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-8 -top-10 h-24 rounded-full bg-white/34 blur-2xl" />
            <div className="relative flex h-full flex-col rounded-ds-lg border border-white/70 bg-white/54 p-3.5 shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className={`grid size-6 place-items-center rounded-full transition-all duration-500 ease-out ${activeFeature.accentClass}`}>
                    <activeFeature.Icon className="size-3.5" />
                  </span>
                  <span>手动提取特征</span>
                </div>
                <button
                  type="button"
                  className="grid size-6 place-items-center rounded-full text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-600"
                  onClick={() => setUserControlled(true)}
                  aria-label="关闭弹窗"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-3 rounded-full border border-white/72 bg-slate-100/64 p-1 text-slate-500 shadow-inner">
                {manualFeatureModes.map((mode, index) => {
                  const isActive = mode.id === activeMode;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      className={`relative z-10 rounded-full px-2 py-0.5 transition-all duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive ? 'bg-white text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.10)]' : 'hover:text-slate-700'
                      }`}
                      onClick={() => handleManualModeChange(mode.id)}
                    >
                      <span className="block text-xs leading-4">{mode.label}</span>
                      {isActive ? (
                        <span
                          className={`absolute inset-0 -z-10 rounded-full ring-1 ${activeFeature.ringClass}`}
                          style={{ transform: `translateX(${index * 0}px)` }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 grid min-h-0 flex-1 grid-cols-[1fr_auto] gap-2.5">
                <div className="grid content-center gap-1.5">
                  <div className="flex items-center gap-2 rounded-ds-md border border-white/65 bg-white/52 px-2.5 py-1 text-[11px] text-slate-600 transition-all duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
                    <CircleDot className="size-3.5 text-slate-400" />
                    <span>{activeFeature.selectedCopy}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-ds-md border border-white/65 bg-white/52 px-2.5 py-1 text-[11px] text-slate-600 transition-all duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
                    <Sparkles className="size-3.5 text-orange-400" />
                    <span>{activeFeature.outputCopy}</span>
                  </div>
                </div>
                <div className="grid min-w-[112px] place-items-center rounded-ds-md border border-white/65 bg-white/48 px-2.5 py-1 text-center text-[11px] text-slate-500 tabular-nums">
                  <div>
                    <div className="text-[10px] text-slate-400">预览对象</div>
                    <div className="mt-0.5 text-slate-700">{activeFeature.detailCopy}</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex shrink-0 justify-end gap-1.5">
                <button
                  type="button"
                  className="h-6 rounded-ds-md border border-white/70 bg-white/42 px-2.5 text-[11px] text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-700"
                  onClick={() => setUserControlled(true)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className={`flex h-6 items-center gap-1 rounded-ds-md px-2.5 text-[11px] font-medium transition-all duration-200 ${activeFeature.accentClass} ${
                    extractPressed ? 'translate-y-px scale-[0.98] brightness-95' : ''
                  }`}
                  onClick={() => {
                    setUserControlled(true);
                    setExtractPressed(true);
                    window.setTimeout(() => setExtractPressed(false), 210);
                  }}
                >
                  <Check className="size-3.5" />
                  <span>提取</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}

export function ViewportWeldModelBento({ globalPlaying }: { globalPlaying: boolean }) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [weldSelected, setWeldSelected] = useState(false);
  const [grindSelected, setGrindSelected] = useState(false);

  return (
    <BentoFrame className="md:col-span-6 xl:col-span-6 xl:min-h-[300px]">
      <div className={CENTERED_BENTO_CONTENT_CLASS}>
        <div className="w-full max-w-[548px] px-2 md:px-3">
          <div className="relative h-[252px] overflow-hidden rounded-ds-xl border border-slate-200/80 bg-slate-100 shadow-inner">
            <Canvas
              className="absolute inset-0"
              camera={{ position: [0, 0, 980], fov: 42, near: 0.1, far: 10000 }}
              gl={{ antialias: true, alpha: true }}
              onPointerMissed={() => {
                setSelectedPartId(null);
                setWeldSelected(false);
                setGrindSelected(false);
              }}
            >
              <Suspense
                fallback={
                  <mesh>
                    <boxGeometry args={[64, 24, 18]} />
                    <meshBasicMaterial color="#CBD5E1" wireframe />
                  </mesh>
                }
              >
                <DemoViewportScene
                  globalPlaying={globalPlaying}
                  selectedPartId={selectedPartId}
                  onPartSelect={setSelectedPartId}
                  weldSelected={weldSelected}
                  grindSelected={grindSelected}
                />
              </Suspense>
            </Canvas>
            <div className="absolute bottom-4 left-4 text-slate-700">
              <div className="space-y-1.5">
                <div className="relative flex items-center gap-1.5 rounded-full border border-white/55 bg-white/58 px-2.5 py-1 text-[10px] text-slate-700 backdrop-blur-md">
                  <Box className="size-3 text-slate-500" />
                  <span>0162-01-010101</span>
                </div>
                <div className="relative ml-3 pl-3">
                  <div className="absolute bottom-2 left-0 top-[-2px] w-px bg-slate-300/80" aria-hidden />
                  <button
                    type="button"
                    className={`relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] backdrop-blur-md transition-colors duration-300 ${
                      weldSelected
                        ? 'border-orange-100/80 bg-orange-50/72 text-ds-brand-primary-text'
                        : 'border-white/55 bg-white/58 text-slate-500 hover:border-orange-100/80 hover:bg-orange-50/72 hover:text-ds-brand-primary-text'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setWeldSelected((current) => !current);
                    }}
                  >
                    <ScanLine className="size-3" />
                    <span>焊缝线</span>
                  </button>
                  <button
                    type="button"
                    className={`relative mt-1.5 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] backdrop-blur-md transition-colors duration-300 ${
                      grindSelected
                        ? 'border-cyan-100/80 bg-cyan-50/72 text-cyan-700'
                        : 'border-white/55 bg-white/58 text-slate-500 hover:border-cyan-100/80 hover:bg-cyan-50/72 hover:text-cyan-700'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setGrindSelected((current) => !current);
                    }}
                  >
                    <Layers3 className="size-3" />
                    <span>打磨面</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoFrame>
  );
}
