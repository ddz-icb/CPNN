import {
  clearCameraOrbitCenter,
  conjugateQuaternion,
  createIdentityQuaternion,
  defaultCamera,
  getCameraOrientation,
  getCameraViewParams,
  getQuaternionAngle,
  multiplyQuaternions,
  projectPoint3D,
  quaternionFromAxisAngle,
  rotateVectorByQuaternion,
  scaleQuaternionRotation,
  setCameraOrientation,
} from "../canvas_drawing/camera3D.js";
import { createFrameScheduler } from "../utils/frameScheduler.js";

const DRAG_HIT_RADIUS = 20;
const DRAG_CLICK_THRESHOLD = 10;
const ROTATION_EPSILON = 0.0001;
const PAN_EPSILON = 0.01;
const FRAME_MS = 1000 / 60;

const DEFAULT_CONTROLS = {
  orbitSensitivity: 1,
  panSensitivity: 1,
  zoomSensitivity: 1,
  inertia: true,
  inertiaDamping: 0.9,
  invertVertical: false,
};

export function initDragAndZoom3D(app, simulation, setTooltipSettings, cameraRef, controlsRef) {
  const canvas = app.renderer.canvas;
  const pointers = new Map();
  const redrawScheduler = createFrameScheduler(() => cameraRef.current?.redraw?.());
  const previousTouchAction = canvas.style.touchAction;
  const previousCursor = canvas.style.cursor;

  const state = {
    mode: null,
    activePointerId: null,
    previousPoint: null,
    lastPinch: null,
    distanceDragged: 0,
    dragNode: null,
    rotationVelocity: createIdentityQuaternion(),
    orbitVelocity: { pitch: 0, yaw: 0 },
    orbitPivot: null,
    panVelocity: { x: 0, y: 0 },
    inertiaFrame: null,
    inertiaTimestamp: null,
  };

  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";

  function getControls() {
    return { ...DEFAULT_CONTROLS, ...(controlsRef?.current ?? {}) };
  }

  function getViewport() {
    const screen = app.renderer.screen;
    return {
      width: screen?.width ?? app.renderer.width,
      height: screen?.height ?? app.renderer.height,
    };
  }

  function getPointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const viewport = getViewport();
    return {
      x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * viewport.width,
      y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * viewport.height,
    };
  }

  function getSimulationNodes() {
    const nodes = typeof simulation.nodes === "function" ? simulation.nodes() : simulation.nodes;
    return Array.isArray(nodes) ? nodes : [];
  }

  function findNodeAtPoint(point) {
    const projections = cameraRef.current?.projections;
    if (!projections) return null;

    let closest = null;
    let closestDistance = Infinity;
    for (const node of getSimulationNodes()) {
      const projection = projections[node.id];
      if (!projection || projection.visible === false) continue;
      const distance = Math.hypot(point.x - projection.x, point.y - projection.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = node;
      }
    }

    return closestDistance <= DRAG_HIT_RADIUS ? closest : null;
  }

  function stopInertia() {
    if (state.inertiaFrame !== null) cancelAnimationFrame(state.inertiaFrame);
    state.inertiaFrame = null;
    state.inertiaTimestamp = null;
    state.rotationVelocity = createIdentityQuaternion();
    state.orbitVelocity = { pitch: 0, yaw: 0 };
    state.orbitPivot = null;
    state.panVelocity = { x: 0, y: 0 };
  }

  function getCameraNumber(camera, key, fallback) {
    const value = camera?.[key];
    return Number.isFinite(value) ? value : fallback;
  }

  function getPointPosition(point) {
    return {
      x: Number.isFinite(point?.x) ? point.x : 0,
      y: Number.isFinite(point?.y) ? point.y : 0,
      z: Number.isFinite(point?.z) ? point.z : 0,
    };
  }

  function getRotatedPoint(point, orientation, viewport) {
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const position = getPointPosition(point);
    return rotateVectorByQuaternion(
      {
        x: position.x - centerX,
        y: position.y - centerY,
        z: position.z,
      },
      orientation,
    );
  }

  function getOrbitCenterPivot() {
    const camera = cameraRef.current;
    if (!camera?.orbitCenter) return null;

    const viewport = getViewport();
    const projection = projectPoint3D(camera.orbitCenter, getCameraViewParams(camera, viewport.width, viewport.height));
    if (!projection || projection.visible === false) return null;

    return {
      point: getPointPosition(camera.orbitCenter),
      anchor: {
        x: projection.x,
        y: projection.y,
        depth: Math.max(projection.depth, 1),
      },
    };
  }

  function applyPivotAnchor(camera, pivot) {
    if (!pivot) return;

    const viewport = getViewport();
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const fov = Math.max(Math.abs(camera.fov ?? defaultCamera.fov), 1);
    const rotatedPoint = getRotatedPoint(pivot.point, getCameraOrientation(camera), viewport);

    camera.x = centerX + rotatedPoint.x - ((pivot.anchor.x - centerX) * pivot.anchor.depth) / fov;
    camera.y = centerY + rotatedPoint.y - ((pivot.anchor.y - centerY) * pivot.anchor.depth) / fov;
    camera.z = rotatedPoint.z - pivot.anchor.depth;
  }

  function applyRotation(delta, pivot = null) {
    const camera = cameraRef.current;
    if (!camera) return;
    setCameraOrientation(camera, multiplyQuaternions(delta, getCameraOrientation(camera)));
    applyPivotAnchor(camera, pivot);
    redrawScheduler.schedule();
  }

  function getPanScale() {
    const camera = cameraRef.current;
    const depth = Math.max(Math.abs(camera?.z ?? defaultCamera.z), 100);
    const fov = Math.max(Math.abs(camera?.fov ?? defaultCamera.fov), 1);
    return depth / fov;
  }

  function applyPan(dx, dy, { clearOrbitCenter = true } = {}) {
    const camera = cameraRef.current;
    if (!camera) return;

    const scale = getPanScale() * getControls().panSensitivity;
    const cameraDx = -dx * scale;
    const cameraDy = -dy * scale;
    camera.x = (camera.x ?? getViewport().width / 2) + cameraDx;
    camera.y = (camera.y ?? getViewport().height / 2) + cameraDy;
    if (clearOrbitCenter && (cameraDx !== 0 || cameraDy !== 0)) {
      clearCameraOrbitCenter(camera);
      state.orbitPivot = null;
    }
    state.panVelocity = { x: cameraDx, y: cameraDy };
    redrawScheduler.schedule();
  }

  function applyDolly(zoomAmount) {
    const camera = cameraRef.current;
    if (!camera || !Number.isFinite(zoomAmount)) return;

    const depthUnit = Math.max(Math.abs(camera.z ?? defaultCamera.z), Math.abs(defaultCamera.z));
    camera.z += zoomAmount * depthUnit * getControls().zoomSensitivity;
    redrawScheduler.schedule();
  }

  function applyOrbitRotation(pitch, yaw) {
    const pitchRotation = quaternionFromAxisAngle({ x: 1, y: 0, z: 0 }, pitch);
    const yawRotation = quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, -yaw);
    applyRotation(multiplyQuaternions(pitchRotation, yawRotation), state.orbitPivot);
  }

  function orbit(dx, dy) {
    const controls = getControls();
    const verticalDelta = controls.invertVertical ? -dy : dy;
    const speed = 0.006 * controls.orbitSensitivity;
    const yaw = dx * speed;
    const pitch = verticalDelta * speed;
    if (yaw === 0 && pitch === 0) return;

    applyOrbitRotation(pitch, yaw);
    state.rotationVelocity = createIdentityQuaternion();
    state.orbitVelocity = { pitch, yaw };
  }

  function roll(dx) {
    const delta = quaternionFromAxisAngle(
      { x: 0, y: 0, z: 1 },
      dx * 0.006 * getControls().orbitSensitivity,
    );
    state.orbitVelocity = { pitch: 0, yaw: 0 };
    state.rotationVelocity = delta;
    applyRotation(delta);
  }

  function dragNode(dx, dy) {
    const node = state.dragNode;
    const camera = cameraRef.current;
    if (!node || !camera) return;

    const projection = camera.projections?.[node.id];
    const scale = Math.max(projection?.scale ?? 1, 0.000001);
    const worldDelta = rotateVectorByQuaternion(
      { x: dx / scale, y: dy / scale, z: 0 },
      conjugateQuaternion(getCameraOrientation(camera)),
    );

    node.fx += worldDelta.x;
    node.fy += worldDelta.y;
    node.fz += worldDelta.z;
  }

  function releaseDraggedNode(event) {
    if (!state.dragNode) return;
    if (!event?.active) simulation.alphaTarget(0);
    state.dragNode.fx = null;
    state.dragNode.fy = null;
    state.dragNode.fz = null;
    state.dragNode = null;
  }

  function getPinchState(activePointers) {
    const [first, second] = activePointers;
    return {
      distance: Math.max(Math.hypot(second.x - first.x, second.y - first.y), 1),
      midpoint: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
    };
  }

  function beginPinch() {
    releaseDraggedNode();
    const activePointers = Array.from(pointers.values()).slice(0, 2);
    if (activePointers.length < 2) return;
    state.mode = "pinch";
    state.activePointerId = null;
    state.lastPinch = getPinchState(activePointers);
  }

  function updatePinch() {
    const activePointers = Array.from(pointers.values()).slice(0, 2);
    if (activePointers.length < 2 || !state.lastPinch) return;
    const nextPinch = getPinchState(activePointers);
    applyDolly(Math.log(nextPinch.distance / state.lastPinch.distance));
    applyPan(
      nextPinch.midpoint.x - state.lastPinch.midpoint.x,
      nextPinch.midpoint.y - state.lastPinch.midpoint.y,
      { clearOrbitCenter: false },
    );
    state.lastPinch = nextPinch;
  }

  function startInertia() {
    if (!getControls().inertia) return false;
    if (
      getQuaternionAngle(state.rotationVelocity) <= ROTATION_EPSILON &&
      Math.hypot(state.orbitVelocity.pitch, state.orbitVelocity.yaw) <= ROTATION_EPSILON &&
      Math.hypot(state.panVelocity.x, state.panVelocity.y) <= PAN_EPSILON
    ) return false;

    state.inertiaTimestamp = null;
    const animate = (timestamp) => {
      const camera = cameraRef.current;
      if (!camera) return;

      const elapsed = state.inertiaTimestamp === null ? FRAME_MS : Math.min(timestamp - state.inertiaTimestamp, 50);
      state.inertiaTimestamp = timestamp;
      const frameScale = elapsed / FRAME_MS;
      const damping = Math.pow(getControls().inertiaDamping, frameScale);

      if (Math.hypot(state.orbitVelocity.pitch, state.orbitVelocity.yaw) > ROTATION_EPSILON) {
        applyOrbitRotation(
          state.orbitVelocity.pitch * frameScale,
          state.orbitVelocity.yaw * frameScale,
        );
        state.orbitVelocity.pitch *= damping;
        state.orbitVelocity.yaw *= damping;
      }
      if (getQuaternionAngle(state.rotationVelocity) > ROTATION_EPSILON) {
        applyRotation(scaleQuaternionRotation(state.rotationVelocity, frameScale));
        state.rotationVelocity = scaleQuaternionRotation(state.rotationVelocity, damping);
      }
      if (Math.hypot(state.panVelocity.x, state.panVelocity.y) > PAN_EPSILON) {
        camera.x += state.panVelocity.x * frameScale;
        camera.y += state.panVelocity.y * frameScale;
        state.panVelocity.x *= damping;
        state.panVelocity.y *= damping;
        redrawScheduler.schedule();
      }

      if (
        getQuaternionAngle(state.rotationVelocity) <= ROTATION_EPSILON &&
        Math.hypot(state.orbitVelocity.pitch, state.orbitVelocity.yaw) <= ROTATION_EPSILON &&
        Math.hypot(state.panVelocity.x, state.panVelocity.y) <= PAN_EPSILON
      ) {
        stopInertia();
        return;
      }

      state.inertiaFrame = requestAnimationFrame(animate);
    };

    state.inertiaFrame = requestAnimationFrame(animate);
    return true;
  }

  function handlePointerDown(event) {
    const point = getPointerPoint(event);
    stopInertia();
    pointers.set(event.pointerId, point);
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = "grabbing";
    setTooltipSettings("isHoverTooltipActive", false);

    if (pointers.size >= 2) {
      beginPinch();
      event.preventDefault();
      return;
    }

    const isRoll = event.button === 2 || event.altKey;
    const isPan = event.button === 1 || event.shiftKey;
    const node = !isRoll && !isPan && event.button === 0 ? findNodeAtPoint(point) : null;

    state.mode = node ? "node" : isRoll ? "roll" : isPan ? "pan" : "orbit";
    state.activePointerId = event.pointerId;
    state.previousPoint = point;
    state.distanceDragged = 0;
    state.dragNode = node;
    state.orbitPivot = state.mode === "orbit" ? getOrbitCenterPivot() : null;

    if (node) {
      node.fx = Number.isFinite(node.x) ? node.x : 0;
      node.fy = Number.isFinite(node.y) ? node.y : 0;
      node.fz = Number.isFinite(node.z) ? node.z : 0;
      simulation.alphaTarget(0.3).restart();
    }

    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    const point = getPointerPoint(event);
    pointers.set(event.pointerId, point);

    if (state.mode === "pinch") {
      updatePinch();
      event.preventDefault();
      return;
    }
    if (event.pointerId !== state.activePointerId || !state.previousPoint) return;

    const dx = point.x - state.previousPoint.x;
    const dy = point.y - state.previousPoint.y;
    state.distanceDragged += Math.hypot(dx, dy);

    if (state.mode === "node") dragNode(dx, dy);
    if (state.mode === "orbit") orbit(dx, dy);
    if (state.mode === "pan") applyPan(dx, dy);
    if (state.mode === "roll") roll(dx);

    state.previousPoint = point;
    event.preventDefault();
  }

  function handlePointerEnd(event) {
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

    if (state.mode === "pinch" && pointers.size === 1) {
      const [pointerId, point] = pointers.entries().next().value;
      state.mode = "orbit";
      state.activePointerId = pointerId;
      state.previousPoint = point;
      state.lastPinch = null;
      state.orbitPivot = getOrbitCenterPivot();
      return;
    }

    if (event.pointerId !== state.activePointerId && state.mode !== "pinch") return;

    if (state.mode === "node") releaseDraggedNode(event);
    else if (!startInertia()) state.orbitPivot = null;

    if (state.distanceDragged > DRAG_CLICK_THRESHOLD) {
      setTooltipSettings("isClickTooltipActive", false);
    }
    setTooltipSettings("isHoverTooltipActive", false);
    state.mode = null;
    state.activePointerId = null;
    state.previousPoint = null;
    state.lastPinch = null;
    canvas.style.cursor = "grab";
  }

  function handleWheel(event) {
    stopInertia();
    const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1;
    applyDolly(-event.deltaY * deltaScale * 0.001);
    event.preventDefault();
  }

  function handleContextMenu(event) {
    event.preventDefault();
  }

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerEnd);
  canvas.addEventListener("pointercancel", handlePointerEnd);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("contextmenu", handleContextMenu);

  return () => {
    stopInertia();
    releaseDraggedNode();
    pointers.clear();
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerEnd);
    canvas.removeEventListener("pointercancel", handlePointerEnd);
    canvas.removeEventListener("wheel", handleWheel);
    canvas.removeEventListener("contextmenu", handleContextMenu);
    canvas.style.touchAction = previousTouchAction;
    canvas.style.cursor = previousCursor;
  };
}
