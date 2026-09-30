import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  getUrdfJointNativeValue,
  type SimulationUrdfJoint,
  type SimulationUrdfModel,
  type SimulationUrdfOrigin,
  type SimulationUrdfVisual,
} from '../services/urdf';

const urdfSceneUnitScale = 1000;

function getOriginQuaternion(origin: SimulationUrdfOrigin) {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(origin.rpy[0], origin.rpy[1], origin.rpy[2], 'ZYX'),
  );
}

function UrdfVisualMesh({
  visual,
  geometry,
}: {
  visual: SimulationUrdfVisual;
  geometry: THREE.BufferGeometry;
}) {
  const quaternion = useMemo(() => getOriginQuaternion(visual.origin), [visual.origin]);
  return (
    <mesh
      geometry={geometry}
      position={visual.origin.xyz}
      quaternion={quaternion}
      scale={visual.scale}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={new THREE.Color(visual.color[0], visual.color[1], visual.color[2])}
        roughness={0.58}
        metalness={0.12}
        transparent={visual.color[3] < 1}
        opacity={visual.color[3]}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function UrdfJointGroup({
  joint,
  displayValue,
  children,
}: {
  joint: SimulationUrdfJoint;
  displayValue: string;
  children: React.ReactNode;
}) {
  const originQuaternion = useMemo(() => getOriginQuaternion(joint.origin), [joint.origin]);
  const nativeValue = getUrdfJointNativeValue(joint, displayValue);
  const motionQuaternion = useMemo(() => {
    if (joint.type !== 'revolute' && joint.type !== 'continuous') return new THREE.Quaternion();
    return new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(joint.axis[0], joint.axis[1], joint.axis[2]).normalize(),
      nativeValue,
    );
  }, [joint.axis, joint.type, nativeValue]);
  const motionPosition: [number, number, number] = joint.type === 'prismatic'
    ? [joint.axis[0] * nativeValue, joint.axis[1] * nativeValue, joint.axis[2] * nativeValue]
    : [0, 0, 0];

  return (
    <group position={joint.origin.xyz} quaternion={originQuaternion}>
      <group position={motionPosition} quaternion={motionQuaternion}>{children}</group>
    </group>
  );
}

function UrdfLinkNode({
  model,
  linkName,
  geometriesByUrl,
  jointValues,
}: {
  model: SimulationUrdfModel;
  linkName: string;
  geometriesByUrl: Map<string, THREE.BufferGeometry>;
  jointValues: Record<string, string>;
}) {
  const link = model.links[linkName];
  if (!link) return null;

  return (
    <group name={linkName}>
      {link.visuals.map((visual, visualIndex) => {
        const geometry = geometriesByUrl.get(visual.meshUrl);
        return geometry
          ? <UrdfVisualMesh key={`${linkName}-visual-${visualIndex}`} visual={visual} geometry={geometry} />
          : null;
      })}
      {(model.childrenByLink[linkName] ?? []).map(({ jointName, childLink }) => {
        const joint = model.joints[jointName];
        if (!joint) return null;
        return (
          <UrdfJointGroup key={jointName} joint={joint} displayValue={jointValues[jointName] ?? '0.0'}>
            <UrdfLinkNode
              model={model}
              linkName={childLink}
              geometriesByUrl={geometriesByUrl}
              jointValues={jointValues}
            />
          </UrdfJointGroup>
        );
      })}
    </group>
  );
}

export function SimulationUrdfStation({
  model,
  jointValues,
}: {
  model: SimulationUrdfModel;
  jointValues: Record<string, string>;
}) {
  const loadedGeometries = useLoader(STLLoader, model.meshUrls);
  const geometries = Array.isArray(loadedGeometries) ? loadedGeometries : [loadedGeometries];
  const geometriesByUrl = useMemo(
    () => new Map(model.meshUrls.map((url, index) => [url, geometries[index]])),
    [geometries, model.meshUrls],
  );

  return (
    <group scale={urdfSceneUnitScale}>
      {model.roots.map((rootLinkName) => (
        <UrdfLinkNode
          key={rootLinkName}
          model={model}
          linkName={rootLinkName}
          geometriesByUrl={geometriesByUrl}
          jointValues={jointValues}
        />
      ))}
    </group>
  );
}
