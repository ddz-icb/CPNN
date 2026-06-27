const EPSILON = 1e-10;
const DEFAULT_TARGET_DEPTH = 600;

export const CAMERA_PRESETS = {
  front: { rotX: 0, rotY: 0, rotZ: 0 },
  top: { rotX: Math.PI / 2, rotY: 0, rotZ: 0 },
  side: { rotX: 0, rotY: -Math.PI / 2, rotZ: 0 },
  isometric: { rotX: 0.5, rotY: -0.7, rotZ: 0 },
};

export const defaultCamera = {
  x: null,
  y: null,
  z: -DEFAULT_TARGET_DEPTH,
  fov: 600,
  rotX: 0.5,
  rotY: -0.2,
  rotZ: 0,
};

defaultCamera.orientation = quaternionFromEuler(defaultCamera);

export function createIdentityQuaternion() {
  return { x: 0, y: 0, z: 0, w: 1 };
}

export function normalizeQuaternion(quaternion) {
  const x = Number.isFinite(quaternion?.x) ? quaternion.x : 0;
  const y = Number.isFinite(quaternion?.y) ? quaternion.y : 0;
  const z = Number.isFinite(quaternion?.z) ? quaternion.z : 0;
  const w = Number.isFinite(quaternion?.w) ? quaternion.w : 1;
  const length = Math.hypot(x, y, z, w);

  if (length <= EPSILON) return createIdentityQuaternion();
  return { x: x / length, y: y / length, z: z / length, w: w / length };
}

export function multiplyQuaternions(left, right) {
  return normalizeQuaternion({
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
  });
}

export function conjugateQuaternion(quaternion) {
  const normalized = normalizeQuaternion(quaternion);
  return { x: -normalized.x, y: -normalized.y, z: -normalized.z, w: normalized.w };
}

export function quaternionFromAxisAngle(axis, angle) {
  const length = Math.hypot(axis?.x ?? 0, axis?.y ?? 0, axis?.z ?? 0);
  if (!Number.isFinite(angle) || length <= EPSILON) return createIdentityQuaternion();

  const halfAngle = angle / 2;
  const scale = Math.sin(halfAngle) / length;
  return normalizeQuaternion({
    x: axis.x * scale,
    y: axis.y * scale,
    z: axis.z * scale,
    w: Math.cos(halfAngle),
  });
}

export function quaternionFromEuler({ rotX = 0, rotY = 0, rotZ = 0 } = {}) {
  const pitch = quaternionFromAxisAngle({ x: 1, y: 0, z: 0 }, rotX);
  const yaw = quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, -rotY);
  const roll = quaternionFromAxisAngle({ x: 0, y: 0, z: 1 }, rotZ);
  return multiplyQuaternions(roll, multiplyQuaternions(pitch, yaw));
}

export function quaternionToEuler(quaternion) {
  const matrix = quaternionToMatrix(quaternion);
  const sinX = clamp(matrix.m21, -1, 1);
  const rotX = Math.asin(sinX);
  const cosX = Math.cos(rotX);

  if (Math.abs(cosX) <= 1e-6) {
    return {
      rotX,
      rotY: Math.atan2(-matrix.m02, matrix.m00),
      rotZ: 0,
    };
  }

  return {
    rotX,
    rotY: Math.atan2(matrix.m20, matrix.m22),
    rotZ: Math.atan2(-matrix.m01, matrix.m11),
  };
}

export function slerpQuaternions(from, to, amount) {
  const start = normalizeQuaternion(from);
  let end = normalizeQuaternion(to);
  let dot = start.x * end.x + start.y * end.y + start.z * end.z + start.w * end.w;

  if (dot < 0) {
    dot = -dot;
    end = { x: -end.x, y: -end.y, z: -end.z, w: -end.w };
  }

  if (dot > 0.9995) {
    return normalizeQuaternion({
      x: start.x + (end.x - start.x) * amount,
      y: start.y + (end.y - start.y) * amount,
      z: start.z + (end.z - start.z) * amount,
      w: start.w + (end.w - start.w) * amount,
    });
  }

  const theta = Math.acos(clamp(dot, -1, 1));
  const sinTheta = Math.sin(theta);
  const startScale = Math.sin((1 - amount) * theta) / sinTheta;
  const endScale = Math.sin(amount * theta) / sinTheta;

  return normalizeQuaternion({
    x: start.x * startScale + end.x * endScale,
    y: start.y * startScale + end.y * endScale,
    z: start.z * startScale + end.z * endScale,
    w: start.w * startScale + end.w * endScale,
  });
}

export function scaleQuaternionRotation(quaternion, factor) {
  return slerpQuaternions(createIdentityQuaternion(), quaternion, factor);
}

export function getQuaternionAngle(quaternion) {
  const normalized = normalizeQuaternion(quaternion);
  return 2 * Math.acos(clamp(Math.abs(normalized.w), -1, 1));
}

export function rotateVectorByQuaternion(vector, quaternion) {
  const matrix = quaternionToMatrix(quaternion);
  return {
    x: matrix.m00 * vector.x + matrix.m01 * vector.y + matrix.m02 * vector.z,
    y: matrix.m10 * vector.x + matrix.m11 * vector.y + matrix.m12 * vector.z,
    z: matrix.m20 * vector.x + matrix.m21 * vector.y + matrix.m22 * vector.z,
  };
}

export function getCameraOrientation(camera) {
  if (camera?.orientation) return normalizeQuaternion(camera.orientation);
  return quaternionFromEuler({
    rotX: camera?.rotX ?? defaultCamera.rotX,
    rotY: camera?.rotY ?? defaultCamera.rotY,
    rotZ: camera?.rotZ ?? defaultCamera.rotZ,
  });
}

export function setCameraOrientation(camera, orientation) {
  if (!camera) return;
  camera.orientation = normalizeQuaternion(orientation);
  Object.assign(camera, quaternionToEuler(camera.orientation));
}

export function setCameraEuler(camera, euler) {
  if (!camera) return;
  const { rotX = 0, rotY = 0, rotZ = 0 } = euler ?? {};
  camera.orientation = quaternionFromEuler({ rotX, rotY, rotZ });
  camera.rotX = rotX;
  camera.rotY = rotY;
  camera.rotZ = rotZ;
}

export function applyCameraPreset(camera, presetName) {
  const preset = CAMERA_PRESETS[presetName];
  if (!camera || !preset) return false;
  setCameraEuler(camera, preset);
  camera.redraw?.();
  return true;
}

function normalizeOrbitCenter(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return {
    x: point.x,
    y: point.y,
    z: Number.isFinite(point.z) ? point.z : 0,
  };
}

export function setCameraOrbitCenter(camera, point) {
  if (!camera) return false;

  const orbitCenter = normalizeOrbitCenter(point);
  if (!orbitCenter) return false;

  camera.orbitCenter = orbitCenter;
  return true;
}

export function clearCameraOrbitCenter(camera) {
  if (!camera) return;
  camera.orbitCenter = null;
}

export function resetCamera3D(camera, container) {
  if (!camera) return;
  camera.x = container?.width ? container.width / 2 : defaultCamera.x;
  camera.y = container?.height ? container.height / 2 : defaultCamera.y;
  camera.z = defaultCamera.z;
  camera.fov = defaultCamera.fov;
  clearCameraOrbitCenter(camera);
  setCameraEuler(camera, defaultCamera);
  camera.redraw?.();
}

export function fitCameraToNodes(camera, nodes, container) {
  const positionedNodes = (nodes ?? []).filter(
    (node) => Number.isFinite(node?.x) && Number.isFinite(node?.y),
  );
  if (!camera || positionedNodes.length === 0 || !container?.width || !container?.height) return false;

  const center = positionedNodes.reduce(
    (result, node) => ({
      x: result.x + node.x / positionedNodes.length,
      y: result.y + node.y / positionedNodes.length,
      z: result.z + (Number.isFinite(node.z) ? node.z : 0) / positionedNodes.length,
    }),
    { x: 0, y: 0, z: 0 },
  );
  const radius = positionedNodes.reduce((largest, node) => {
    const distance = Math.hypot(
      node.x - center.x,
      node.y - center.y,
      (Number.isFinite(node.z) ? node.z : 0) - center.z,
    );
    return Math.max(largest, distance);
  }, 1);

  const viewportCenterX = container.width / 2;
  const viewportCenterY = container.height / 2;
  const rotatedCenter = rotateVectorByQuaternion(
    {
      x: center.x - viewportCenterX,
      y: center.y - viewportCenterY,
      z: center.z,
    },
    getCameraOrientation(camera),
  );
  const usableHalfSize = Math.max(1, Math.min(container.width, container.height) * 0.42);
  const targetDepth = Math.max(DEFAULT_TARGET_DEPTH * 0.25, (radius * camera.fov) / usableHalfSize);

  camera.x = viewportCenterX + rotatedCenter.x;
  camera.y = viewportCenterY + rotatedCenter.y;
  camera.z = rotatedCenter.z - targetDepth;
  clearCameraOrbitCenter(camera);
  camera.redraw?.();
  return true;
}

export function focusCameraOnPoint(camera, point, container, targetDepth = DEFAULT_TARGET_DEPTH / 2) {
  if (!camera || !point || !container?.width || !container?.height) return false;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;

  const centerX = container.width / 2;
  const centerY = container.height / 2;
  const rotatedPoint = rotateVectorByQuaternion(
    {
      x: point.x - centerX,
      y: point.y - centerY,
      z: Number.isFinite(point.z) ? point.z : 0,
    },
    getCameraOrientation(camera),
  );

  camera.x = centerX + rotatedPoint.x;
  camera.y = centerY + rotatedPoint.y;
  camera.z = rotatedPoint.z - Math.max(targetDepth, 1);
  camera.redraw?.();
  return true;
}

export function getCameraViewParams(camera, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const orientation = getCameraOrientation(camera);

  return {
    orientation,
    cameraX: camera?.x ?? centerX,
    cameraY: camera?.y ?? centerY,
    cameraZ: camera?.z ?? defaultCamera.z,
    fov: camera?.fov ?? defaultCamera.fov,
    centerX,
    centerY,
  };
}

export function projectPoint3D(point, view, out) {
  const rotated = rotateVectorByQuaternion(
    {
      x: (Number.parseFloat(point?.x) || 0) - view.centerX,
      y: (Number.parseFloat(point?.y) || 0) - view.centerY,
      z: Number.parseFloat(point?.z) || 0,
    },
    view.orientation,
  );
  const dx = rotated.x + view.centerX - view.cameraX;
  const dy = rotated.y + view.centerY - view.cameraY;
  const dz = rotated.z - view.cameraZ;
  const target = out || {};

  if (dz <= 0.000001) {
    if (!out) return null;
    target.visible = false;
    return target;
  }

  const depth = Math.abs(dz);
  const scale = view.fov / depth;
  target.x = view.centerX + dx * scale;
  target.y = view.centerY + dy * scale;
  target.scale = scale;
  target.depth = depth;
  target.visible = true;
  return target;
}

function quaternionToMatrix(quaternion) {
  const { x, y, z, w } = normalizeQuaternion(quaternion);
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;

  return {
    m00: 1 - 2 * (yy + zz),
    m01: 2 * (xy - wz),
    m02: 2 * (xz + wy),
    m10: 2 * (xy + wz),
    m11: 1 - 2 * (xx + zz),
    m12: 2 * (yz - wx),
    m20: 2 * (xz - wy),
    m21: 2 * (yz + wx),
    m22: 1 - 2 * (xx + yy),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
