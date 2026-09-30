import { GizmoHelper, useGizmoContext } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

const viewCubeFaces = ['右', '左', '上', '下', '前', '后'];
const viewCubeCorners = [
  [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
  [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
].map(([x, y, z]) => [x * 0.38, y * 0.38, z * 0.38] as [number, number, number]);
const viewCubeEdges = [
  [1, 1, 0], [1, 0, 1], [1, 0, -1], [1, -1, 0],
  [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
  [-1, 1, 0], [-1, 0, 1], [-1, 0, -1], [-1, -1, 0],
].map(([x, y, z]) => [x * 0.38, y * 0.38, z * 0.38] as [number, number, number]);
const viewCubeEdgeDimensions = viewCubeEdges.map((position) => (
  position.map((axis) => (axis === 0 ? 0.5 : 0.25)) as [number, number, number]
));

function SharpViewCubeFaceMaterial({
  index,
  hovered,
}: {
  index: number;
  hovered: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const label = viewCubeFaces[index];
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.fillStyle = '#FAFAFA';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#A1A1AA';
    context.lineWidth = 5;
    context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    context.font = '600 144px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#18181B';
    context.fillText(label, canvas.width / 2, canvas.height / 2 + 6);

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.anisotropy = gl.capabilities.getMaxAnisotropy() || 1;
    nextTexture.minFilter = THREE.LinearMipmapLinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.generateMipmaps = true;
    nextTexture.needsUpdate = true;
    return nextTexture;
  }, [gl, label]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return (
    <meshBasicMaterial
      attach={`material-${index}`}
      map={texture ?? undefined}
      color={hovered ? '#FF6900' : '#FFFFFF'}
      toneMapped={false}
    />
  );
}

function SharpViewCubeFaces() {
  const { tweenCamera } = useGizmoContext();
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);

  return (
    <mesh
      onPointerOut={(event) => {
        event.stopPropagation();
        setHoveredFace(null);
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        setHoveredFace(Math.floor((event.faceIndex ?? 0) / 2));
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (event.face) tweenCamera(event.face.normal.clone());
      }}
    >
      {viewCubeFaces.map((label, index) => (
        <SharpViewCubeFaceMaterial key={label} index={index} hovered={hoveredFace === index} />
      ))}
      <boxGeometry />
    </mesh>
  );
}

function ViewCubeDirectionHitArea({
  position,
  dimensions,
}: {
  position: [number, number, number];
  dimensions: [number, number, number];
}) {
  const { tweenCamera } = useGizmoContext();
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      scale={1.012}
      position={position}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(false);
      }}
      onClick={(event) => {
        event.stopPropagation();
        tweenCamera(new THREE.Vector3(...position));
      }}
    >
      <boxGeometry args={dimensions} />
      <meshBasicMaterial
        color="#FF6900"
        transparent
        opacity={hovered ? 0.68 : 0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function BrandViewCube() {
  return (
    <group scale={[60, 60, 60]}>
      <SharpViewCubeFaces />
      {viewCubeEdges.map((position, index) => (
        <ViewCubeDirectionHitArea
          key={`edge-${position.join('-')}`}
          position={position}
          dimensions={viewCubeEdgeDimensions[index]}
        />
      ))}
      {viewCubeCorners.map((position) => (
        <ViewCubeDirectionHitArea
          key={`corner-${position.join('-')}`}
          position={position}
          dimensions={[0.25, 0.25, 0.25]}
        />
      ))}
    </group>
  );
}

export function ViewCube({ margin = [52, 52] }: { margin?: [number, number] }) {
  return (
    <GizmoHelper alignment="bottom-right" margin={margin}>
      <BrandViewCube />
    </GizmoHelper>
  );
}
