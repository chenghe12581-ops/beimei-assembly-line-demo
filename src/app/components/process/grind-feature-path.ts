import * as THREE from 'three';

export type GrindPosePoint = {
  x: string;
  y: string;
  z: string;
  rx: string;
  ry: string;
  rz: string;
};

export type GrindSafePoint = GrindPosePoint & { enabled: boolean };

export type GrindFeaturePathSample = {
  position: [number, number, number];
  tangent: [number, number, number];
};

export type GrindFeaturePath = {
  samples: GrindFeaturePathSample[];
  normal: [number, number, number];
  pathLength: number;
  closed: boolean;
  resultStandoff: number;
  safetyStandoffs: [number, number, number];
};

export type GeneratedGrindPath = {
  resultPoints: GrindPosePoint[];
  safePoints: GrindSafePoint[];
};

export type WeldFeaturePath = {
  points: [number, number, number][];
  length: number;
  closed: boolean;
};

const GRIND_RESULT_POINT_COUNT = 6;
const grindFeaturePathCache = new Map<string, Promise<GrindFeaturePath>>();
const grindFeaturePathResolvedCache = new Map<string, GrindFeaturePath>();
const weldFeaturePathCache = new Map<string, Promise<WeldFeaturePath>>();

function formatCoordinate(value: number) {
  return value.toFixed(1);
}

function vectorToTuple(vector: THREE.Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}

function parseRhinoGrindVertices(text: string) {
  const vertices: THREE.Vector3[] = [];
  const triangleIndices: number[][] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts[0] === 'v') {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        vertices.push(new THREE.Vector3(x, -z, y));
      }
      continue;
    }

    if (parts[0] === 'f') {
      const indices = parts
        .slice(1)
        .map((value) => Number.parseInt(value.split('/')[0], 10) - 1)
        .filter((value) => Number.isInteger(value) && value >= 0);
      for (let index = 1; index < indices.length - 1; index += 1) {
        triangleIndices.push([indices[0], indices[index], indices[index + 1]]);
      }
    }
  }

  return { vertices, triangleIndices };
}

type RhinoCurve = THREE.Vector3[];

function parseRhinoCurves(text: string): RhinoCurve[] {
  const vertices: THREE.Vector3[] = [];
  const curves: RhinoCurve[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts[0] === 'v') {
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        vertices.push(new THREE.Vector3(x, -z, y));
      }
      continue;
    }

    if (parts[0] !== 'curv') continue;
    const curvePointIndices = parts.slice(3)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0);
    const points = curvePointIndices
      .map((index) => vertices[index - 1])
      .filter((point): point is THREE.Vector3 => Boolean(point))
      .map((point) => point.clone());
    if (points.length >= 2) curves.push(points);
  }

  return curves;
}

function getPolylineLength(points: THREE.Vector3[], closed = false) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += points[index - 1].distanceTo(points[index]);
  }
  if (closed && points.length > 1) length += points[points.length - 1].distanceTo(points[0]);
  return length;
}

function getCurveEndpointDistance(curve: RhinoCurve, point: THREE.Vector3, fromEnd: boolean) {
  const endpoint = fromEnd ? curve[curve.length - 1] : curve[0];
  return endpoint?.distanceTo(point) ?? Number.POSITIVE_INFINITY;
}

function getConnectedWeldCurve(curves: RhinoCurve[]) {
  const joinTolerance = 0.5;
  const remaining = curves
    .filter((curve) => getPolylineLength(curve) > 0.001)
    .map((points) => ({ points, length: getPolylineLength(points) }));
  const components: { points: THREE.Vector3[]; length: number; closed: boolean }[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift();
    if (!seed) break;
    const points = seed.points.map((point) => point.clone());
    let length = seed.length;

    while (remaining.length > 0) {
      const head = points[0];
      const tail = points[points.length - 1];
      const tailCandidate = remaining
        .map((curve, index) => ({ index, distance: Math.min(getCurveEndpointDistance(curve.points, tail, false), getCurveEndpointDistance(curve.points, tail, true)) }))
        .filter((candidate) => candidate.distance <= joinTolerance)
        .sort((left, right) => left.distance - right.distance)[0];
      const headCandidate = remaining
        .map((curve, index) => ({ index, distance: Math.min(getCurveEndpointDistance(curve.points, head, false), getCurveEndpointDistance(curve.points, head, true)) }))
        .filter((candidate) => candidate.distance <= joinTolerance)
        .sort((left, right) => left.distance - right.distance)[0];

      if (tailCandidate) {
        const curve = remaining.splice(tailCandidate.index, 1)[0];
        const startsAtTail = getCurveEndpointDistance(curve.points, tail, false) <= getCurveEndpointDistance(curve.points, tail, true);
        const nextPoints = startsAtTail ? curve.points : [...curve.points].reverse();
        points.push(...nextPoints.slice(1).map((point) => point.clone()));
        length += curve.length;
        continue;
      }

      if (headCandidate) {
        const curve = remaining.splice(headCandidate.index, 1)[0];
        const startsAtHead = getCurveEndpointDistance(curve.points, head, false) <= getCurveEndpointDistance(curve.points, head, true);
        const nextPoints = startsAtHead ? [...curve.points].reverse() : curve.points;
        points.unshift(...nextPoints.slice(0, -1).map((point) => point.clone()));
        length += curve.length;
        continue;
      }

      break;
    }

    const closed = points.length > 2 && points[0].distanceTo(points[points.length - 1]) <= joinTolerance;
    components.push({
      points: closed ? points.slice(0, -1) : points,
      length: closed ? getPolylineLength(points.slice(0, -1), true) : length,
      closed,
    });
  }

  return components.sort((left, right) => right.length - left.length)[0] ?? null;
}

function getSurfaceNormal(vertices: THREE.Vector3[], triangleIndices: number[][]) {
  const normal = new THREE.Vector3();
  triangleIndices.forEach(([aIndex, bIndex, cIndex]) => {
    const a = vertices[aIndex];
    const b = vertices[bIndex];
    const c = vertices[cIndex];
    if (!a || !b || !c) return;
    normal.add(new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)));
  });

  if (normal.lengthSq() === 0) return new THREE.Vector3(0, 0, 1);
  normal.normalize();
  // The current Rhino feature exports are on the upward-facing side of the assembly.
  if (normal.z < 0) normal.negate();
  return normal;
}

function getCenterLineVertices(vertices: THREE.Vector3[]) {
  const bounds = new THREE.Box3().setFromPoints(vertices);
  const span = bounds.max.clone().sub(bounds.min);
  const primaryAxis = span.x >= span.y ? 'x' : 'y';
  const secondaryAxis = primaryAxis === 'x' ? 'y' : 'x';
  const secondarySpan = primaryAxis === 'x' ? span.y : span.x;
  const secondaryCenter = primaryAxis === 'x'
    ? (bounds.min.y + bounds.max.y) / 2
    : (bounds.min.x + bounds.max.x) / 2;
  const centerTolerance = Math.max(secondarySpan * 0.3, 1);
  const centerLineVertices = vertices.filter((vertex) => Math.abs(vertex[secondaryAxis] - secondaryCenter) <= centerTolerance);

  return {
    vertices: centerLineVertices.length >= GRIND_RESULT_POINT_COUNT ? centerLineVertices : vertices,
    bounds,
    primaryAxis,
  };
}

function sampleCenterLine(vertices: THREE.Vector3[], primaryAxis: 'x' | 'y') {
  const sorted = [...vertices]
    .sort((left, right) => left[primaryAxis] - right[primaryAxis])
    .filter((vertex, index, all) => index === 0 || vertex.distanceToSquared(all[index - 1]) > 0.001);
  const lengths = [0];
  for (let index = 1; index < sorted.length; index += 1) {
    lengths.push(lengths[index - 1] + sorted[index - 1].distanceTo(sorted[index]));
  }
  const totalLength = lengths[lengths.length - 1] ?? 0;
  if (sorted.length < 2 || totalLength <= 0.001) {
    return Array.from({ length: GRIND_RESULT_POINT_COUNT }, () => sorted[0]?.clone() ?? new THREE.Vector3());
  }

  return Array.from({ length: GRIND_RESULT_POINT_COUNT }, (_, index) => {
    const ratio = index / (GRIND_RESULT_POINT_COUNT - 1);
    const targetLength = totalLength * ratio;
    let upperIndex = lengths.findIndex((length) => length >= targetLength);
    if (upperIndex < 0) upperIndex = sorted.length - 1;
    const lowerIndex = Math.max(0, upperIndex - 1);
    const lower = sorted[lowerIndex] ?? sorted[0];
    const upper = sorted[upperIndex] ?? lower;
    const distance = lengths[upperIndex] - lengths[lowerIndex];
    const interpolation = distance > 0.001
      ? THREE.MathUtils.clamp((targetLength - lengths[lowerIndex]) / distance, 0, 1)
      : 0;
    return lower.clone().lerp(upper, interpolation);
  });
}

function samplePolylineAtRatios(points: THREE.Vector3[], ratios: number[], closed: boolean) {
  const segments: { start: THREE.Vector3; end: THREE.Vector3; length: number }[] = [];
  const segmentCount = closed ? points.length : points.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    if (!start || !end) continue;
    const length = start.distanceTo(end);
    if (length > 0.001) segments.push({ start, end, length });
  }
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (segments.length === 0 || totalLength <= 0.001) {
    return { points: ratios.map(() => points[0]?.clone() ?? new THREE.Vector3()), length: totalLength };
  }

  const sampled = ratios.map((ratio) => {
    let remainingLength = totalLength * ratio;
    for (const segment of segments) {
      if (remainingLength <= segment.length) {
        return segment.start.clone().lerp(segment.end, remainingLength / segment.length);
      }
      remainingLength -= segment.length;
    }
    return segments[segments.length - 1].end.clone();
  });
  return { points: sampled, length: totalLength };
}

function samplePolyline(points: THREE.Vector3[], count: number, closed: boolean) {
  const ratios = Array.from({ length: count }, (_, index) => (
    closed ? index / count : index / Math.max(count - 1, 1)
  ));
  return samplePolylineAtRatios(points, ratios, closed);
}

function createPathSamples(points: THREE.Vector3[], normal: THREE.Vector3, closed: boolean): GrindFeaturePathSample[] {
  return points.map((point, index) => {
    const previous = points[closed ? (index - 1 + points.length) % points.length : Math.max(index - 1, 0)] ?? point;
    const next = points[closed ? (index + 1) % points.length : Math.min(index + 1, points.length - 1)] ?? point;
    const tangent = new THREE.Vector3().subVectors(next, previous);
    if (tangent.lengthSq() === 0) tangent.set(1, 0, 0);
    tangent.normalize();
    return { position: vectorToTuple(point), tangent: vectorToTuple(tangent) };
  });
}

function parseGrindFeaturePath(text: string, weldText?: string): GrindFeaturePath {
  const { vertices, triangleIndices } = parseRhinoGrindVertices(text);
  if (vertices.length < GRIND_RESULT_POINT_COUNT) {
    throw new Error('打磨特征几何点不足，无法生成六个结果点');
  }

  const normal = getSurfaceNormal(vertices, triangleIndices);
  const weldCurve = weldText ? getConnectedWeldCurve(parseRhinoCurves(weldText)) : null;
  const { vertices: centerLineVertices, primaryAxis } = getCenterLineVertices(vertices);
  const fallback = samplePolyline(centerLineVertices, GRIND_RESULT_POINT_COUNT, false);
  const sampledPath = weldCurve
    ? samplePolyline(weldCurve.points, GRIND_RESULT_POINT_COUNT, weldCurve.closed)
    : fallback;
  const featureLength = sampledPath.length;
  const resultStandoff = THREE.MathUtils.clamp(featureLength * 0.12, 280, 480);
  const farStandoff = THREE.MathUtils.clamp(featureLength * 0.24, 500, 760);

  return {
    samples: createPathSamples(sampledPath.points, normal, weldCurve?.closed ?? false),
    normal: vectorToTuple(normal),
    pathLength: featureLength,
    closed: weldCurve?.closed ?? false,
    resultStandoff,
    safetyStandoffs: [farStandoff, farStandoff * 0.55, farStandoff * 0.24],
  };
}

export function loadGrindFeaturePath(url: string, weldUrl?: string) {
  const cacheKey = `${url}|${weldUrl ?? ''}`;
  const cached = grindFeaturePathCache.get(cacheKey);
  if (cached) return cached;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`打磨特征加载失败：${response.status}`);
      return response.text();
    })
    .then(async (text) => {
      let weldText: string | undefined;
      if (weldUrl) {
        try {
          const response = await fetch(weldUrl);
          if (response.ok) weldText = await response.text();
        } catch {
          weldText = undefined;
        }
      }
      const path = parseGrindFeaturePath(text, weldText);
      grindFeaturePathResolvedCache.set(cacheKey, path);
      return path;
    });
  grindFeaturePathCache.set(cacheKey, request);
  return request;
}

export function getCachedGrindFeaturePath(url?: string, weldUrl?: string) {
  return url ? grindFeaturePathResolvedCache.get(`${url}|${weldUrl ?? ''}`) ?? null : null;
}

export function loadWeldFeaturePath(url: string) {
  const cached = weldFeaturePathCache.get(url);
  if (cached) return cached;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`焊缝特征加载失败：${response.status}`);
      return response.text();
    })
    .then((text) => {
      const curve = getConnectedWeldCurve(parseRhinoCurves(text));
      if (!curve) throw new Error('焊缝特征几何不足，无法生成路径点位');
      return {
        points: curve.points.map((point) => vectorToTuple(point)),
        length: curve.length,
        closed: curve.closed,
      };
    });
  weldFeaturePathCache.set(url, request);
  return request;
}

function createPosePoint(position: THREE.Vector3, tangent: THREE.Vector3): GrindPosePoint {
  const tangentAngle = THREE.MathUtils.radToDeg(Math.atan2(tangent.y, tangent.x));
  return {
    x: formatCoordinate(position.x),
    y: formatCoordinate(position.y),
    z: formatCoordinate(position.z),
    rx: '0.0',
    ry: '0.0',
    rz: formatCoordinate(tangentAngle),
  };
}

function createSafePoint(position: THREE.Vector3, tangent: THREE.Vector3): GrindSafePoint {
  return { ...createPosePoint(position, tangent), enabled: true };
}

export function createWeldFeaturePosePoints(path: WeldFeaturePath, count: number): GrindPosePoint[] {
  const sourcePoints = path.points.map((point) => new THREE.Vector3(...point));
  const sampled = samplePolyline(sourcePoints, Math.max(count, 2), path.closed);
  const samples = createPathSamples(sampled.points, new THREE.Vector3(0, 0, 1), path.closed);
  return samples.map((sample) => createPosePoint(
    new THREE.Vector3(...sample.position),
    new THREE.Vector3(...sample.tangent),
  ));
}

export function createWeldFeatureSegmentPosePoints(
  path: WeldFeaturePath,
  segmentCount: number,
): GrindPosePoint[] {
  const sourcePoints = path.points.map((point) => new THREE.Vector3(...point));
  const resolvedSegmentCount = Math.max(segmentCount, 1);
  const segmentRatio = Math.min(0.08, 0.45 / resolvedSegmentCount);
  const centerRatios = Array.from({ length: resolvedSegmentCount }, (_, index) => (
    path.closed
      ? index / resolvedSegmentCount
      : 0.08 + (0.84 * index) / Math.max(resolvedSegmentCount - 1, 1)
  ));
  const endpointRatios = centerRatios.flatMap((centerRatio) => [
    THREE.MathUtils.clamp(centerRatio - segmentRatio / 2, 0, 1),
    THREE.MathUtils.clamp(centerRatio + segmentRatio / 2, 0, 1),
  ]);
  const sampled = samplePolylineAtRatios(sourcePoints, endpointRatios, path.closed);
  return Array.from({ length: resolvedSegmentCount }, (_, segmentIndex) => {
    const start = sampled.points[segmentIndex * 2] ?? new THREE.Vector3();
    const end = sampled.points[segmentIndex * 2 + 1] ?? start;
    const tangent = end.clone().sub(start);
    if (tangent.lengthSq() === 0) tangent.set(1, 0, 0);
    tangent.normalize();
    return [createPosePoint(start, tangent), createPosePoint(end, tangent)];
  }).flat();
}

export function createGeneratedGrindPath(path: GrindFeaturePath): GeneratedGrindPath {
  const normal = new THREE.Vector3(...path.normal);
  const start = new THREE.Vector3(...path.samples[0].position);
  const end = new THREE.Vector3(...path.samples[path.samples.length - 1].position);
  const startTangent = new THREE.Vector3(...path.samples[0].tangent);
  const endTangent = new THREE.Vector3(...path.samples[path.samples.length - 1].tangent);
  const [far, middle, near] = path.safetyStandoffs;

  return {
    resultPoints: path.samples.map((sample) => createPosePoint(new THREE.Vector3(...sample.position), new THREE.Vector3(...sample.tangent))),
    safePoints: [
      createSafePoint(start.clone().addScaledVector(normal, far), startTangent),
      createSafePoint(start.clone().addScaledVector(normal, middle), startTangent),
      createSafePoint(start.clone().addScaledVector(normal, near), startTangent),
      createSafePoint(end.clone().addScaledVector(normal, near), endTangent),
      createSafePoint(end.clone().addScaledVector(normal, middle), endTangent),
      createSafePoint(end.clone().addScaledVector(normal, far), endTangent),
    ],
  };
}
