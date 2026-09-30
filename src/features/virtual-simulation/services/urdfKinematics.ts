import * as THREE from 'three';
import type {
  SimulationAssemblyTransform,
  SimulationPosePoint,
  SimulationRobotCoordinateFrame,
  SimulationRobotId,
} from '../types';
import {
  getUrdfJointNativeValue,
  type SimulationUrdfJoint,
  type SimulationUrdfModel,
  type SimulationUrdfOrigin,
} from './urdf';

export const simulationWorkpiecePlacementPositionMm: [number, number, number] = [1873, 6698, 801];
export const simulationWorkpiecePlacementRotationRad: [number, number, number] = [0, 0, Math.PI / 2];

const robotConfigurations: Record<SimulationRobotId, {
  baseLinkName: string;
  toolLinkName: string;
  slideJointName: string;
  jointNames: string[];
}> = {
  robot1: {
    baseLinkName: 'left_manipulator_base_link',
    toolLinkName: 'left_manipulator_tool0',
    slideJointName: 'uuid_left_joint',
    jointNames: Array.from({ length: 6 }, (_, index) => `left_manipulator_joint_${index + 1}`),
  },
  robot2: {
    baseLinkName: 'right_manipulator_base_link',
    toolLinkName: 'right_manipulator_tool0',
    slideJointName: 'uuid_right_joint',
    jointNames: Array.from({ length: 6 }, (_, index) => `right_manipulator_joint_${index + 1}`),
  },
};

export type SimulationRobotJointReadout = {
  axis: `J${number}`;
  value: string;
  unit: 'mm' | '°';
};

export type SimulationRobotPoseReadout = {
  pose: SimulationPosePoint;
  joints: SimulationRobotJointReadout[];
};

const emptyPose: SimulationPosePoint = {
  x: '0.0',
  y: '0.0',
  z: '0.0',
  rx: '0.0',
  ry: '0.0',
  rz: '0.0',
};

function getOriginMatrix(origin: SimulationUrdfOrigin) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(origin.xyz[0], origin.xyz[1], origin.xyz[2]),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(origin.rpy[0], origin.rpy[1], origin.rpy[2], 'ZYX'),
    ),
    new THREE.Vector3(1, 1, 1),
  );
}

function getJointMotionMatrix(joint: SimulationUrdfJoint, displayValue: string) {
  const nativeValue = getUrdfJointNativeValue(joint, displayValue);
  const axis = new THREE.Vector3(joint.axis[0], joint.axis[1], joint.axis[2]).normalize();
  if (joint.type === 'prismatic') {
    return new THREE.Matrix4().makeTranslation(
      axis.x * nativeValue,
      axis.y * nativeValue,
      axis.z * nativeValue,
    );
  }
  if (joint.type === 'revolute' || joint.type === 'continuous') {
    return new THREE.Matrix4().makeRotationAxis(axis, nativeValue);
  }
  return new THREE.Matrix4();
}

function resolveLinkWorldMatrices(
  model: SimulationUrdfModel,
  jointValues: Record<string, string>,
) {
  const matrices = new Map<string, THREE.Matrix4>();

  const visit = (linkName: string, parentWorldMatrix: THREE.Matrix4) => {
    matrices.set(linkName, parentWorldMatrix.clone());
    (model.childrenByLink[linkName] ?? []).forEach(({ jointName, childLink }) => {
      const joint = model.joints[jointName];
      if (!joint) return;
      const childWorldMatrix = parentWorldMatrix.clone()
        .multiply(getOriginMatrix(joint.origin))
        .multiply(getJointMotionMatrix(joint, jointValues[jointName] ?? '0.0'));
      visit(childLink, childWorldMatrix);
    });
  };

  model.roots.forEach((rootLinkName) => visit(rootLinkName, new THREE.Matrix4()));
  return matrices;
}

function getNumber(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getWorkpieceFrameMatrix(transform: SimulationAssemblyTransform) {
  const placementMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(
      simulationWorkpiecePlacementPositionMm[0] / 1000,
      simulationWorkpiecePlacementPositionMm[1] / 1000,
      simulationWorkpiecePlacementPositionMm[2] / 1000,
    ),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...simulationWorkpiecePlacementRotationRad, 'XYZ')),
    new THREE.Vector3(1, 1, 1),
  );
  const adjustmentMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(
      getNumber(transform.x) / 1000,
      getNumber(transform.y) / 1000,
      getNumber(transform.z) / 1000,
    ),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(getNumber(transform.rx)),
      THREE.MathUtils.degToRad(getNumber(transform.ry)),
      THREE.MathUtils.degToRad(getNumber(transform.rz)),
      'XYZ',
    )),
    new THREE.Vector3(1, 1, 1),
  );
  return placementMatrix.multiply(adjustmentMatrix);
}

function formatValue(value: number) {
  const roundedValue = Math.abs(value) < 0.05 ? 0 : value;
  return roundedValue.toFixed(1);
}

function getPoseFromMatrix(matrix: THREE.Matrix4): SimulationPosePoint {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);
  const rotation = new THREE.Euler().setFromQuaternion(quaternion, 'ZYX');
  return {
    x: formatValue(position.x * 1000),
    y: formatValue(position.y * 1000),
    z: formatValue(position.z * 1000),
    rx: formatValue(THREE.MathUtils.radToDeg(rotation.x)),
    ry: formatValue(THREE.MathUtils.radToDeg(rotation.y)),
    rz: formatValue(THREE.MathUtils.radToDeg(rotation.z)),
  };
}

export function getSimulationRobotPoseReadout({
  model,
  jointValues,
  robotId,
  coordinateFrame,
  assemblyTransform,
}: {
  model: SimulationUrdfModel | null;
  jointValues: Record<string, string>;
  robotId: SimulationRobotId;
  coordinateFrame: SimulationRobotCoordinateFrame;
  assemblyTransform: SimulationAssemblyTransform;
}): SimulationRobotPoseReadout {
  const configuration = robotConfigurations[robotId];
  const joints: SimulationRobotJointReadout[] = [
    ...configuration.jointNames.map((jointName, index) => ({
      axis: `J${index + 1}` as const,
      value: jointValues[jointName] ?? '0.0',
      unit: '°' as const,
    })),
    {
      axis: 'J7',
      value: jointValues[configuration.slideJointName] ?? '0.0',
      unit: 'mm',
    },
  ];
  if (!model) return { pose: emptyPose, joints };

  const linkWorldMatrices = resolveLinkWorldMatrices(model, jointValues);
  const toolWorldMatrix = linkWorldMatrices.get(configuration.toolLinkName);
  if (!toolWorldMatrix) return { pose: emptyPose, joints };

  const referenceWorldMatrix = coordinateFrame === 'parent'
    ? linkWorldMatrices.get(configuration.baseLinkName) ?? new THREE.Matrix4()
    : coordinateFrame === 'object'
      ? getWorkpieceFrameMatrix(assemblyTransform)
      : new THREE.Matrix4();
  const poseMatrix = referenceWorldMatrix.clone().invert().multiply(toolWorldMatrix);
  return { pose: getPoseFromMatrix(poseMatrix), joints };
}
