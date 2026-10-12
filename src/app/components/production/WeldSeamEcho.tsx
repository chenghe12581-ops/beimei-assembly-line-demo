import { useEffect, useMemo, useRef, useState } from 'react';
import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WeldTimelineSegment } from './weld-robot-timeline';
import { ProcessPathPointMarkerModel, type ProcessPathPointMarkerItem } from '../process/GrindToolHeadPoseModel';

/** 机器人对应的焊缝回显颜色（与面板色一致）。 */
const WELD_ECHO_COLORS: Record<string, string> = {
  Robot1: '#f97316',
  Robot2: '#3b82f6',
};

const WELD_ECHO_LABEL_COLORS: Record<string, string> = {
  Robot1: '#c2410c',
  Robot2: '#1d4ed8',
};

type WeldSeam = {
  points: [number, number, number][];
  labelPosition: [number, number, number];
  labelOffset: [number, number];
};

type WeldSeamEchoLayout = {
  seams: WeldSeam[];
  markerRadius: number;
};

/**
 * 由贴板包围盒计算 4 条焊缝的回显位置（贴板四周，位于主板正面之上）。
 * 每条焊缝为各边中点处约 5mm 的短段，不超过模型边长。
 * 正视视角约定：+Z 方向观察、+Y 朝上，即屏幕左 = -X、上 = +Y、右 = +X、下 = -Y，
 * 因此焊缝 1/2/3/4 依次排布在贴板的左 / 上 / 右 / 下四条边（1/3 为两侧短边，2/4 为上下长边）。
 */
function computeWeldSeamLayout(patchBox: THREE.Box3): WeldSeamEchoLayout {
  const size = patchBox.getSize(new THREE.Vector3());
  const center = patchBox.getCenter(new THREE.Vector3());
  const z = patchBox.max.z + Math.max(size.z * 0.5, 2);
  const x0 = center.x - size.x / 2;
  const x1 = center.x + size.x / 2;
  const y0 = center.y - size.y / 2;
  const y1 = center.y + size.y / 2;
  const half = 2.5;

  return {
    markerRadius: Math.max(Math.min(Math.max(size.x, size.y) * 0.03, 8), 4),
    seams: [
      { points: [[x0, center.y - half, z], [x0, center.y + half, z]], labelPosition: [x0, center.y, z], labelOffset: [-12, 0] },
      { points: [[center.x - half, y1, z], [center.x + half, y1, z]], labelPosition: [center.x, y1, z], labelOffset: [0, -14] },
      { points: [[x1, center.y - half, z], [x1, center.y + half, z]], labelPosition: [x1, center.y, z], labelOffset: [12, 0] },
      { points: [[center.x - half, y0, z], [center.x + half, y0, z]], labelPosition: [center.x, y0, z], labelOffset: [0, 14] },
    ],
  };
}

/**
 * 焊缝工件回显：在贴板四周按 1-4 顺序绘制 4 条焊缝（按机器人着色），
 * 点击焊缝线可选中（与焊缝列表、甘特色块联动高亮），序号标复用路径点标记组件。
 */
export function WeldSeamEcho({
  partGroupRefs,
  patchPartIndex,
  segments,
  selectedSegmentIndex,
  onSelectSegment,
}: {
  partGroupRefs: React.MutableRefObject<(THREE.Group | null)[]>;
  patchPartIndex: number;
  segments: WeldTimelineSegment[];
  selectedSegmentIndex: number | null;
  onSelectSegment: (segmentIndex: number) => void;
}) {
  const [layout, setLayout] = useState<WeldSeamEchoLayout | null>(null);

  useEffect(() => {
    const patchGroup = partGroupRefs.current[patchPartIndex];
    if (!patchGroup) return;
    const patchBox = new THREE.Box3().setFromObject(patchGroup);
    if (patchBox.isEmpty()) return;
    setLayout(computeWeldSeamLayout(patchBox));
  }, [partGroupRefs, patchPartIndex]);

  const markerItems = useMemo<ProcessPathPointMarkerItem[]>(() => {
    if (!layout) return [];
    return segments.flatMap((segment, segmentIndex) => {
      const seam = layout.seams[segmentIndex];
      if (!seam) return [];
      return [{
        id: `${segment.id}-marker`,
        label: String(segmentIndex + 1),
        position: seam.labelPosition,
        color: WELD_ECHO_COLORS[segment.robotName] ?? '#a1a1aa',
        labelColor: WELD_ECHO_LABEL_COLORS[segment.robotName] ?? '#52525b',
        radius: layout.markerRadius,
        labelOffset: seam.labelOffset,
      }];
    });
  }, [layout, segments]);

  if (!layout) return null;

  return (
    <group>
      {segments.map((segment, segmentIndex) => {
        const seam = layout.seams[segmentIndex];
        if (!seam) return null;
        const color = WELD_ECHO_COLORS[segment.robotName] ?? '#a1a1aa';
        const selected = selectedSegmentIndex === segmentIndex;
        return (
          <Line
            key={segment.id}
            points={seam.points}
            color={color}
            lineWidth={selected ? 7 : 4}
            transparent
            opacity={selected ? 1 : 0.62}
            depthTest={false}
            renderOrder={22}
            onClick={(event) => {
              event.stopPropagation();
              onSelectSegment(segmentIndex);
            }}
          />
        );
      })}
      {markerItems.length > 0 && <ProcessPathPointMarkerModel items={markerItems} />}
    </group>
  );
}

/**
 * 正视相机控制：点选焊缝时把视角平滑切换到正视工件（+Z 方向、+Y 朝上，
 * 屏幕左 = -X、上 = +Y，主板长轴水平展示），并同步调整 near/far 避免裁剪。
 */
export function WeldFaceOnCameraController({
  focusKey,
  plateGroupRef,
  controlsRef,
}: {
  focusKey: number;
  plateGroupRef: React.RefObject<THREE.Group | null>;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const pendingRef = useRef(false);
  const transitionRef = useRef<{
    elapsed: number;
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    goalPosition: THREE.Vector3;
    goalTarget: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    if (focusKey > 0) {
      pendingRef.current = true;
      transitionRef.current = null;
    }
  }, [focusKey]);

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (pendingRef.current) {
      const group = plateGroupRef.current;
      if (!group) return;
      group.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(group);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const verticalFov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * perspectiveCamera.aspect);
      const distance = Math.max(
        size.y / (2 * Math.tan(verticalFov / 2)),
        size.x / (2 * Math.tan(horizontalFov / 2)),
      ) * 1.16 + size.z;

      camera.up.set(0, 1, 0);
      const goalPosition = center.clone().add(new THREE.Vector3(0, 0, distance));
      const goalTarget = center.clone();
      const margin = Math.max(size.x, size.y, size.z);
      perspectiveCamera.near = Math.max(distance - margin * 1.5, 1);
      perspectiveCamera.far = distance + margin * 3;
      perspectiveCamera.updateProjectionMatrix();

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
