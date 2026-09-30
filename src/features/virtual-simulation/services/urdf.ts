export type SimulationUrdfJointType = 'fixed' | 'revolute' | 'continuous' | 'prismatic';

export type SimulationUrdfVector3 = [number, number, number];

export type SimulationUrdfOrigin = {
  xyz: SimulationUrdfVector3;
  rpy: SimulationUrdfVector3;
};

export type SimulationUrdfVisual = {
  origin: SimulationUrdfOrigin;
  color: [number, number, number, number];
  meshUrl: string;
  scale: SimulationUrdfVector3;
};

export type SimulationUrdfLink = {
  name: string;
  visuals: SimulationUrdfVisual[];
};

export type SimulationUrdfJoint = {
  name: string;
  type: SimulationUrdfJointType;
  origin: SimulationUrdfOrigin;
  parent: string;
  child: string;
  axis: SimulationUrdfVector3;
  limit: { lower: number; upper: number } | null;
};

export type SimulationUrdfChildJoint = {
  jointName: string;
  childLink: string;
};

export type SimulationUrdfModel = {
  name: string;
  links: Record<string, SimulationUrdfLink>;
  joints: Record<string, SimulationUrdfJoint>;
  childrenByLink: Record<string, SimulationUrdfChildJoint[]>;
  roots: string[];
  meshUrls: string[];
  actuatedJointNames: string[];
};

const urdfUrl = `${import.meta.env.BASE_URL}beimeiji_weld_0623.urdf`;
const urdfMeshBaseUrl = `${import.meta.env.BASE_URL}urdf-stls/`;

function parseVector(value: string | null, fallback: SimulationUrdfVector3): SimulationUrdfVector3 {
  if (!value) return fallback;
  const values = value.trim().split(/\s+/).map(Number);
  return [
    Number.isFinite(values[0]) ? values[0] : fallback[0],
    Number.isFinite(values[1]) ? values[1] : fallback[1],
    Number.isFinite(values[2]) ? values[2] : fallback[2],
  ];
}

function parseOrigin(element: Element | null): SimulationUrdfOrigin {
  return {
    xyz: parseVector(element?.getAttribute('xyz') ?? null, [0, 0, 0]),
    rpy: parseVector(element?.getAttribute('rpy') ?? null, [0, 0, 0]),
  };
}

function getDirectChildren(element: Element, tagName: string) {
  return Array.from(element.children).filter((child) => child.tagName === tagName);
}

function resolveLocalMeshUrl(filename: string) {
  const normalizedFilename = filename.replace(/\\/g, '/');
  const basename = normalizedFilename.split('/').pop() ?? normalizedFilename;
  return `${urdfMeshBaseUrl}${encodeURIComponent(basename)}`;
}

export function parseSimulationUrdf(xmlText: string): SimulationUrdfModel {
  const documentNode = new DOMParser().parseFromString(xmlText, 'text/xml');
  const parseError = documentNode.querySelector('parsererror');
  if (parseError) throw new Error(`URDF 解析失败：${parseError.textContent ?? 'XML 格式错误'}`);

  const robot = documentNode.querySelector('robot');
  if (!robot) throw new Error('URDF 解析失败：缺少 robot 根节点');

  const links: Record<string, SimulationUrdfLink> = {};
  getDirectChildren(robot, 'link').forEach((linkElement) => {
    const name = linkElement.getAttribute('name');
    if (!name) return;
    const visuals = getDirectChildren(linkElement, 'visual').flatMap<SimulationUrdfVisual>((visualElement) => {
      const mesh = visualElement.querySelector('geometry > mesh');
      const filename = mesh?.getAttribute('filename');
      if (!mesh || !filename) return [];
      const color = parseVector(
        visualElement.querySelector('material > color')?.getAttribute('rgba') ?? null,
        [0.7, 0.7, 0.7],
      );
      const alpha = Number(visualElement.querySelector('material > color')?.getAttribute('rgba')?.trim().split(/\s+/)[3]);
      return [{
        origin: parseOrigin(visualElement.querySelector('origin')),
        color: [color[0], color[1], color[2], Number.isFinite(alpha) ? alpha : 1],
        meshUrl: resolveLocalMeshUrl(filename),
        scale: parseVector(mesh.getAttribute('scale'), [1, 1, 1]),
      }];
    });
    links[name] = { name, visuals };
  });

  const joints: Record<string, SimulationUrdfJoint> = {};
  const childrenByLink: Record<string, SimulationUrdfChildJoint[]> = {};
  getDirectChildren(robot, 'joint').forEach((jointElement) => {
    const name = jointElement.getAttribute('name');
    if (!name) return;
    const parent = jointElement.querySelector('parent')?.getAttribute('link') ?? '';
    const child = jointElement.querySelector('child')?.getAttribute('link') ?? '';
    const typeValue = jointElement.getAttribute('type') ?? 'fixed';
    const type: SimulationUrdfJointType = typeValue === 'revolute'
      || typeValue === 'continuous'
      || typeValue === 'prismatic'
      ? typeValue
      : 'fixed';
    const limitElement = jointElement.querySelector('limit');
    const lower = Number(limitElement?.getAttribute('lower'));
    const upper = Number(limitElement?.getAttribute('upper'));
    joints[name] = {
      name,
      type,
      origin: parseOrigin(jointElement.querySelector('origin')),
      parent,
      child,
      axis: parseVector(jointElement.querySelector('axis')?.getAttribute('xyz') ?? null, [1, 0, 0]),
      limit: Number.isFinite(lower) && Number.isFinite(upper) ? { lower, upper } : null,
    };
    childrenByLink[parent] = [...(childrenByLink[parent] ?? []), { jointName: name, childLink: child }];
  });

  const childLinks = new Set(Object.values(joints).map((joint) => joint.child));
  const roots = Object.keys(links).filter((linkName) => !childLinks.has(linkName));
  const meshUrls = Array.from(new Set(Object.values(links).flatMap((link) => link.visuals.map((visual) => visual.meshUrl))));
  const actuatedJointNames = Object.values(joints)
    .filter((joint) => joint.type !== 'fixed')
    .map((joint) => joint.name);

  return {
    name: robot.getAttribute('name') ?? 'beimeiji-weld-station',
    links,
    joints,
    childrenByLink,
    roots: roots.length > 0 ? roots : ['base_link'],
    meshUrls,
    actuatedJointNames,
  };
}

let simulationUrdfModelPromise: Promise<SimulationUrdfModel> | null = null;

export function loadSimulationUrdfModel() {
  if (!simulationUrdfModelPromise) {
    simulationUrdfModelPromise = fetch(urdfUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`URDF 加载失败：HTTP ${response.status}`);
        return response.text();
      })
      .then(parseSimulationUrdf);
  }
  return simulationUrdfModelPromise;
}

export function getUrdfJointDisplayUnit(joint: SimulationUrdfJoint): 'mm' | '°' {
  return joint.type === 'prismatic' ? 'mm' : '°';
}

export function getUrdfJointDisplayRange(joint: SimulationUrdfJoint) {
  const fallback = joint.type === 'prismatic' ? { min: -1000, max: 1000 } : { min: -180, max: 180 };
  if (!joint.limit) return fallback;
  if (joint.type === 'prismatic') {
    return { min: joint.limit.lower * 1000, max: joint.limit.upper * 1000 };
  }
  // Keep the UI's 0.1-degree step aligned with the range so neutral 0 remains selectable.
  const lower = joint.limit.lower * 180 / Math.PI;
  const upper = joint.limit.upper * 180 / Math.PI;
  return {
    min: Number((Math.ceil(lower * 10) / 10).toFixed(1)),
    max: Number((Math.floor(upper * 10) / 10).toFixed(1)),
  };
}

export function getUrdfJointNativeValue(joint: SimulationUrdfJoint, displayValue: string | number) {
  const numericValue = Number(displayValue);
  if (!Number.isFinite(numericValue)) return 0;
  const nativeValue = joint.type === 'prismatic' ? numericValue / 1000 : numericValue * Math.PI / 180;
  if (!joint.limit) return nativeValue;
  return Math.min(joint.limit.upper, Math.max(joint.limit.lower, nativeValue));
}

export function createDefaultUrdfJointValues(model: SimulationUrdfModel) {
  return Object.fromEntries(model.actuatedJointNames.map((jointName) => [jointName, '0.0']));
}
