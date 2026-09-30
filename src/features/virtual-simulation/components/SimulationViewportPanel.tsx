import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Line, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Box } from 'lucide-react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type {
  SimulationAssemblyTransform,
  SimulationCoordinateFrame,
  SimulationPlaybackScope,
  SimulationPlaybackStatus,
  SimulationRobotCoordinateFrame,
  SimulationRobotId,
  SimulationSelectedPoint,
  SimulationSceneId,
  SimulationSourceTask,
} from '../types';
import type { SimulationUrdfModel } from '../services/urdf';
import { loadWeldFeaturePath, type WeldFeaturePath } from '../../../app/components/process/grind-feature-path';
import {
  ProcessPathPointMarkerModel,
  type ProcessPathPointMarkerItem,
} from '../../../app/components/process/GrindToolHeadPoseModel';
import { SimulationAssemblyPositionOverlay } from './SimulationAssemblyPositionOverlay';
import { SimulationControlBar } from './SimulationControlBar';
import { SimulationRobotPoseOverlay } from './SimulationRobotPoseOverlay';
import { SimulationUrdfStation } from './SimulationUrdfStation';
import {
  getSimulationRobotPoseReadout,
  simulationWorkpiecePlacementPositionMm,
  simulationWorkpiecePlacementRotationRad,
} from '../services/urdfKinematics';

const modelColors = ['#5069a8', '#55a68b', '#71a8b8', '#b67676'];
const stationCameraDirection = new THREE.Vector3(0.72, -0.72, 0.88).normalize();

type CameraPreset = 'weld-top' | 'station-overview';
type SceneGroupRef = React.MutableRefObject<THREE.Group | null>;

function getPosePosition(pose: { x: string; y: string; z: string }): [number, number, number] | null {
  const position: [number, number, number] = [Number(pose.x), Number(pose.y), Number(pose.z)];
  return position.every(Number.isFinite) ? position : null;
}

function SimulationWeldFeatureLines({ urls }: { urls: string[] }) {
  const [paths, setPaths] = useState<WeldFeaturePath[]>([]);
  const pathSignature = urls.join('|');

  useEffect(() => {
    let cancelled = false;
    void Promise.all(urls.map((url) => loadWeldFeaturePath(url).catch(() => null)))
      .then((loadedPaths) => {
        if (!cancelled) setPaths(loadedPaths.filter((path): path is WeldFeaturePath => Boolean(path)));
      });
    return () => {
      cancelled = true;
    };
  }, [pathSignature, urls]);

  return (
    <group renderOrder={18}>
      {paths.map((path, index) => (
        <Line
          key={`${pathSignature}-${index}`}
          points={path.points}
          color="#f59e0b"
          lineWidth={2}
          transparent
          opacity={0.3}
          depthTest={false}
        />
      ))}
    </group>
  );
}

function getTransformNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function AssemblyTransformGroup({
  transform,
  pivot,
  children,
}: {
  transform: SimulationAssemblyTransform;
  pivot: THREE.Vector3;
  children: ReactNode;
}) {
  const position: [number, number, number] = [
    pivot.x + getTransformNumber(transform.x),
    pivot.y + getTransformNumber(transform.y),
    pivot.z + getTransformNumber(transform.z),
  ];
  const rotation: [number, number, number] = [
    THREE.MathUtils.degToRad(getTransformNumber(transform.rx)),
    THREE.MathUtils.degToRad(getTransformNumber(transform.ry)),
    THREE.MathUtils.degToRad(getTransformNumber(transform.rz)),
  ];

  return (
    <group position={position} rotation={rotation}>
      <group position={[-pivot.x, -pivot.y, -pivot.z]}>{children}</group>
    </group>
  );
}

function SimulationAssembly({
  task,
  selectedWeldNodeId,
  assemblyTransform,
  groupRef,
}: {
  task: SimulationSourceTask;
  selectedWeldNodeId: string | null;
  assemblyTransform: SimulationAssemblyTransform;
  groupRef: SceneGroupRef;
}) {
  const loadedGeometries = useLoader(STLLoader, task.modelParts.map((part) => part.url));
  const geometries = useMemo(
    () => (Array.isArray(loadedGeometries) ? loadedGeometries : [loadedGeometries]).map((geometry) => geometry.clone()),
    [loadedGeometries],
  );
  const edges = useMemo(() => geometries.map((geometry) => new THREE.EdgesGeometry(geometry, 28)), [geometries]);
  const bounds = useMemo(() => {
    const box = new THREE.Box3();
    geometries.forEach((geometry) => {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) box.union(geometry.boundingBox);
    });
    if (box.isEmpty()) box.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1000, 500, 80));
    return {
      center: box.getCenter(new THREE.Vector3()),
      size: box.getSize(new THREE.Vector3()),
    };
  }, [geometries]);
  const pathPointRadius = Math.max(Math.min(Math.max(bounds.size.x, bounds.size.y, bounds.size.z) * 0.006, 8), 5);
  const selectedWeldTask = useMemo(() => {
    if (!selectedWeldNodeId) return null;
    return task.weldTasks.find((weldTask) => (
      weldTask.id === selectedWeldNodeId
      || weldTask.weldSegments.some((segment) => segment.id === selectedWeldNodeId)
    )) ?? null;
  }, [selectedWeldNodeId, task.weldTasks]);
  const displayedSegments = useMemo(() => {
    if (!selectedWeldNodeId || !selectedWeldTask) return [];
    if (selectedWeldNodeId === selectedWeldTask.id) return selectedWeldTask.weldSegments;
    return selectedWeldTask.weldSegments.filter((segment) => segment.id === selectedWeldNodeId);
  }, [selectedWeldNodeId, selectedWeldTask]);
  const displayPaths = useMemo(() => displayedSegments.map((segment) => ({
    segment,
    scanPoints: segment.scanPosePoints
      .map(getPosePosition)
      .filter((position): position is [number, number, number] => position !== null),
    weldPoints: segment.weldPosePoints
      .map(getPosePosition)
      .filter((position): position is [number, number, number] => position !== null),
  })), [displayedSegments]);
  const markerItems = useMemo<ProcessPathPointMarkerItem[]>(() => displayPaths.flatMap(({ segment, scanPoints, weldPoints }) => [
    ...scanPoints.map((position, pointIndex) => ({
      id: `${segment.id}-scan-${pointIndex + 1}`,
      label: `S${segment.index}-${pointIndex + 1}`,
      position,
      color: '#0284c7',
      labelColor: '#0369a1',
      radius: pathPointRadius * 1.25,
      labelOffset: pointIndex === 0 ? [-40, -18] : [7, -18],
    })),
    ...weldPoints.map((position, pointIndex) => ({
      id: `${segment.id}-weld-${pointIndex + 1}`,
      label: `W${segment.index}-${pointIndex + 1}`,
      position,
      color: '#f97316',
      labelColor: '#c2410c',
      radius: pathPointRadius * 0.78,
      labelOffset: pointIndex === 0 ? [-40, 2] : [7, 2],
    })),
  ]), [displayPaths, pathPointRadius]);

  useEffect(() => () => {
    geometries.forEach((geometry) => geometry.dispose());
    edges.forEach((edge) => edge.dispose());
  }, [edges, geometries]);

  return (
    <group
      ref={groupRef}
      position={simulationWorkpiecePlacementPositionMm}
      rotation={simulationWorkpiecePlacementRotationRad}
    >
      <AssemblyTransformGroup transform={assemblyTransform} pivot={bounds.center}>
        {geometries.map((geometry, index) => (
          <group key={task.modelParts[index]?.id ?? index}>
            <mesh geometry={geometry} castShadow receiveShadow>
              <meshStandardMaterial
                color={modelColors[index % modelColors.length]}
                roughness={0.7}
                metalness={0.08}
                side={THREE.DoubleSide}
              />
            </mesh>
            <lineSegments geometry={edges[index]} renderOrder={8}>
              <lineBasicMaterial color="#475569" transparent opacity={0.28} />
            </lineSegments>
          </group>
        ))}
        {selectedWeldNodeId && (
          <>
            <SimulationWeldFeatureLines urls={selectedWeldTask?.weldFeatureUrls ?? []} />
            {displayPaths.map(({ segment, scanPoints, weldPoints }) => (
              <group key={segment.id}>
                {scanPoints.length > 1 && <Line points={scanPoints} color="#0284c7" lineWidth={3} renderOrder={20} depthTest={false} />}
                {weldPoints.length > 1 && <Line points={weldPoints} color="#f97316" lineWidth={3} renderOrder={21} depthTest={false} />}
              </group>
            ))}
            {markerItems.length > 0 && <ProcessPathPointMarkerModel items={markerItems} />}
          </>
        )}
      </AssemblyTransformGroup>
    </group>
  );
}

function CameraPresetController({
  preset,
  viewKey,
  stationGroupRef,
  workpieceGroupRef,
  controlsRef,
}: {
  preset: CameraPreset;
  viewKey: string;
  stationGroupRef: SceneGroupRef;
  workpieceGroupRef: SceneGroupRef;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera, size: viewportSize } = useThree();
  const pendingRef = useRef(true);
  const transitionRef = useRef<{
    elapsed: number;
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    goalPosition: THREE.Vector3;
    goalTarget: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    pendingRef.current = true;
    transitionRef.current = null;
  }, [preset, viewKey]);

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (pendingRef.current) {
      const targetGroup = preset === 'weld-top' ? workpieceGroupRef.current : stationGroupRef.current;
      if (!targetGroup) return;
      targetGroup.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(targetGroup);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const verticalFov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
      let distance: number;
      let direction: THREE.Vector3;
      let up: THREE.Vector3;

      if (preset === 'weld-top') {
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * perspectiveCamera.aspect);
        distance = Math.max(
          size.y / (2 * Math.tan(verticalFov / 2)),
          size.x / (2 * Math.tan(horizontalFov / 2)),
        ) * 1.16 + size.z;
        direction = new THREE.Vector3(0, 0, 1);
        up = new THREE.Vector3(-1, 0, 0);
      } else {
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        distance = sphere.radius / Math.sin(verticalFov / 2) * 1.08;
        direction = stationCameraDirection;
        up = new THREE.Vector3(0, 0, 1);
      }

      camera.up.copy(up);
      const goalPosition = center.clone().addScaledVector(direction, distance);
      const goalTarget = center.clone();
      if (preset === 'station-overview' && viewportSize.height > 0) {
        const forward = goalTarget.clone().sub(goalPosition).normalize();
        const screenRight = new THREE.Vector3().crossVectors(forward, up).normalize();
        const screenUp = new THREE.Vector3().crossVectors(screenRight, forward).normalize();
        const visibleWorldHeight = 2 * distance * Math.tan(verticalFov / 2);
        const screenOffset = screenUp.multiplyScalar(-48 * visibleWorldHeight / viewportSize.height);
        goalPosition.add(screenOffset);
        goalTarget.add(screenOffset);
      }
      transitionRef.current = {
        elapsed: 0,
        startPosition: camera.position.clone(),
        startTarget: controls.target.clone(),
        goalPosition,
        goalTarget,
      };
      pendingRef.current = false;
    }

    const transition = transitionRef.current;
    if (!transition) return;
    transition.elapsed += delta;
    const progress = Math.min(1, transition.elapsed / 0.42);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(transition.startPosition, transition.goalPosition, easedProgress);
    controls.target.lerpVectors(transition.startTarget, transition.goalTarget, easedProgress);
    camera.lookAt(controls.target);
    controls.update();
    if (progress >= 1) transitionRef.current = null;
  });

  return null;
}

function SimulationScene({
  task,
  selectedWeldNodeId,
  assemblyTransform,
  urdfModel,
  urdfJointValues,
  resetViewKey,
  programViewRequestKey,
}: {
  task: SimulationSourceTask;
  selectedWeldNodeId: string | null;
  assemblyTransform: SimulationAssemblyTransform;
  urdfModel: SimulationUrdfModel | null;
  urdfJointValues: Record<string, string>;
  resetViewKey: number;
  programViewRequestKey: number;
}) {
  const stationGroupRef = useRef<THREE.Group | null>(null);
  const workpieceGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<any>(null);
  const cameraPreset: CameraPreset = selectedWeldNodeId ? 'weld-top' : 'station-overview';

  return (
    <>
      <color attach="background" args={['#e4e4e4']} />
      <ambientLight intensity={0.92} />
      <hemisphereLight intensity={0.58} color="#ffffff" groundColor="#94a3b8" />
      <directionalLight position={[5000, -3200, 9000]} intensity={1.45} castShadow />
      <directionalLight position={[-3000, 7000, 4500]} intensity={0.42} />
      <group ref={stationGroupRef}>
        {urdfModel && <SimulationUrdfStation model={urdfModel} jointValues={urdfJointValues} />}
        {task.modelParts.length > 0 && (
          <SimulationAssembly
            task={task}
            selectedWeldNodeId={selectedWeldNodeId}
            assemblyTransform={assemblyTransform}
            groupRef={workpieceGroupRef}
          />
        )}
      </group>
      <gridHelper
        args={[12000, 60, '#a1a1aa', '#cbd5e1']}
        position={[2200, 4600, -8]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        screenSpacePanning
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
      <CameraPresetController
        preset={cameraPreset}
        viewKey={`${task.id}:${urdfModel?.name ?? 'loading'}:${resetViewKey}:${programViewRequestKey}`}
        stationGroupRef={stationGroupRef}
        workpieceGroupRef={workpieceGroupRef}
        controlsRef={controlsRef}
      />
    </>
  );
}

function SceneTabs({
  task,
  activeScene,
  onSceneChange,
}: {
  task: SimulationSourceTask;
  activeScene: SimulationSceneId;
  onSceneChange: (scene: SimulationSceneId) => void;
}) {
  const tabs: { id: SimulationSceneId; label: string; disabled: boolean }[] = [
    { id: 'front', label: '正面工位', disabled: task.side !== 'front' },
    { id: 'back', label: '背面工位', disabled: task.side !== 'back' },
  ];

  return (
    <div className="absolute left-3 top-3 z-20 flex h-10 items-center gap-1 rounded-xl border border-white/70 bg-ds-bg-production-execution-toolbar p-1 shadow-lg shadow-slate-900/8 backdrop-blur-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={tab.disabled}
          title={tab.disabled ? `${tab.label}暂不可用` : undefined}
          className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
            activeScene === tab.id
              ? 'bg-slate-900 text-white shadow-sm'
              : tab.disabled
                ? 'cursor-not-allowed text-slate-300'
                : 'text-slate-500 hover:bg-white hover:text-slate-900'
          }`}
          onClick={() => onSceneChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SimulationViewportPanel({
  task,
  hasProgram,
  activeScene,
  selectedWeldNodeId,
  selectedPoint,
  playbackStatus,
  progress,
  speed,
  playbackScope,
  resetViewKey,
  programViewRequestKey,
  assemblyTransform,
  assemblyCoordinateFrame,
  urdfModel,
  urdfError,
  urdfJointValues,
  onSceneChange,
  onResetView,
  onAssemblyTransformChange,
  onAssemblyCoordinateFrameChange,
  onPlay,
  onPause,
  onSkip,
  onResetPlayback,
  onSpeedChange,
}: {
  task: SimulationSourceTask | null;
  hasProgram: boolean;
  activeScene: SimulationSceneId;
  selectedWeldNodeId: string | null;
  selectedPoint: SimulationSelectedPoint | null;
  playbackStatus: SimulationPlaybackStatus;
  progress: number;
  speed: '0.5x' | '1.0x' | '2.0x';
  playbackScope: SimulationPlaybackScope | null;
  resetViewKey: number;
  programViewRequestKey: number;
  assemblyTransform: SimulationAssemblyTransform;
  assemblyCoordinateFrame: SimulationCoordinateFrame;
  urdfModel: SimulationUrdfModel | null;
  urdfError: string | null;
  urdfJointValues: Record<string, string>;
  onSceneChange: (scene: SimulationSceneId) => void;
  onResetView: () => void;
  onAssemblyTransformChange: (axis: keyof SimulationAssemblyTransform, value: string) => void;
  onAssemblyCoordinateFrameChange: (coordinateFrame: SimulationCoordinateFrame) => void;
  onPlay: () => void;
  onPause: () => void;
  onSkip: (seconds: number) => void;
  onResetPlayback: () => void;
  onSpeedChange: (speed: '0.5x' | '1.0x' | '2.0x') => void;
}) {
  const [robotCoordinateFrames, setRobotCoordinateFrames] = useState<Record<SimulationRobotId, SimulationRobotCoordinateFrame>>({
    robot1: 'world',
    robot2: 'world',
  });
  const robotPoseReadouts = useMemo(() => (['robot1', 'robot2'] as const).map((robotId) => {
    const coordinateFrame = robotCoordinateFrames[robotId];
    const readout = getSimulationRobotPoseReadout({
      model: urdfModel,
      jointValues: urdfJointValues,
      robotId,
      coordinateFrame,
      assemblyTransform,
    });
    return {
      robotId,
      coordinateFrame,
      pose: readout.pose,
      jointValues: readout.joints,
      focused: selectedPoint?.robotId === robotId,
    };
  }), [assemblyTransform, robotCoordinateFrames, selectedPoint?.robotId, urdfJointValues, urdfModel]);

  return (
    <section className="relative min-h-0 min-w-0 overflow-hidden bg-ds-bg-viewport">
      {task ? (
        <>
          <Canvas
            key={task.id}
            camera={{ position: [11000, -9000, 11000], fov: 34, near: 1, far: 100000 }}
            dpr={[1, 1.5]}
            shadows
          >
            <Suspense fallback={null}>
              <SimulationScene
                task={task}
                selectedWeldNodeId={selectedWeldNodeId}
                assemblyTransform={assemblyTransform}
                urdfModel={urdfModel}
                urdfJointValues={urdfJointValues}
                resetViewKey={resetViewKey}
                programViewRequestKey={programViewRequestKey}
              />
            </Suspense>
          </Canvas>
          <SceneTabs task={task} activeScene={activeScene} onSceneChange={onSceneChange} />
          <SimulationAssemblyPositionOverlay
            coordinateFrame={assemblyCoordinateFrame}
            transform={assemblyTransform}
            onCoordinateFrameChange={onAssemblyCoordinateFrameChange}
            onTransformChange={onAssemblyTransformChange}
          />
          {hasProgram && (
            <SimulationRobotPoseOverlay
              robots={robotPoseReadouts}
              loading={!urdfModel && !urdfError}
              onCoordinateFrameChange={(robotId, coordinateFrame) => {
                setRobotCoordinateFrames((current) => ({ ...current, [robotId]: coordinateFrame }));
              }}
            />
          )}

          {urdfError && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-md border border-red-200 bg-red-50/95 px-3 py-1.5 text-[10px] text-red-600 shadow-sm">
              {urdfError}
            </div>
          )}

          {playbackStatus !== 'ready' && playbackStatus !== 'completed' && (
            <div className="absolute left-1/2 top-3 z-20 flex max-w-[min(480px,calc(100%-320px))] -translate-x-1/2 items-start gap-2 rounded-lg border border-orange-200 bg-orange-50/95 px-3 py-2 text-orange-700 shadow-sm backdrop-blur-sm">
              <span className={`size-1.5 rounded-full ${playbackStatus === 'playing' ? 'animate-pulse bg-orange-500' : 'bg-orange-400'}`} />
              <div className="min-w-0">
                <div className="truncate text-[11px] font-medium">
                  {playbackStatus === 'playing' ? '仿真播放中' : '仿真已暂停'}
                  {playbackScope ? ` · ${playbackScope.label}` : ''}
                </div>
                <div className="mt-0.5 truncate text-[9px] text-orange-600/80">
                  {playbackScope?.modeLabel ?? '当前为播放进度动画演示'}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center pb-14 text-center">
          <div>
            <Box className="mx-auto size-11 text-zinc-300" />
            <div className="mt-3 text-xs font-medium text-zinc-500">暂无仿真任务</div>
            <div className="mt-1 text-[10px] text-zinc-400">选中装配任务后，模型和适用工位将在此回显</div>
          </div>
        </div>
      )}
      <SimulationControlBar
        status={playbackStatus}
        progress={progress}
        speed={speed}
        scope={playbackScope}
        disabled={!task || Boolean(selectedWeldNodeId) || !playbackScope || playbackScope.instructionCount === 0}
        onPlay={onPlay}
        onPause={onPause}
        onSkip={onSkip}
        onReset={onResetPlayback}
        onSpeedChange={onSpeedChange}
      />
    </section>
  );
}
