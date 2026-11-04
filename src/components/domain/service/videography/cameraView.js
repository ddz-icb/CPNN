import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import {
  getCameraOrientation,
  quaternionFromEuler,
  rotateVectorByQuaternion,
  setCameraOrientation,
  slerpQuaternions,
} from "../canvas_drawing/camera3D.js";
import {
  MAX_FOV,
  MAX_ZOOM,
  MIN_FOV,
  MIN_ZOOM,
  VIEW_MODE_2D,
  VIEW_MODE_3D,
} from "./videoExportConfig.js";
import { clamp, finiteOr, interpolateZoom, lerp } from "./cameraPathMath.js";

export function getViewMode(appearance) {
  return appearance?.threeD ? VIEW_MODE_3D : VIEW_MODE_2D;
}

export function getViewModeLabel(mode) {
  return mode === VIEW_MODE_3D ? "3D" : "2D";
}

export function captureCurrentView({ app, appearance, container }) {
  if (!app || !container?.width || !container?.height) {
    return null;
  }

  const mode = getViewMode(appearance);

  if (mode === VIEW_MODE_3D) {
    const camera = appearance?.cameraRef?.current ?? defaultCamera;
    return {
      mode,
      view: {
        x: finiteOr(camera?.x, container.width / 2),
        y: finiteOr(camera?.y, container.height / 2),
        z: finiteOr(camera?.z, defaultCamera.z),
        fov: clamp(finiteOr(camera?.fov, defaultCamera.fov), MIN_FOV, MAX_FOV),
        orientation: { ...getCameraOrientation(camera) },
        rotX: finiteOr(camera?.rotX, defaultCamera.rotX),
        rotY: finiteOr(camera?.rotY, defaultCamera.rotY),
        rotZ: finiteOr(camera?.rotZ, defaultCamera.rotZ),
        orbitCenter: copyOrbitCenter(camera?.orbitCenter),
        viewport: { width: container.width, height: container.height },
      },
    };
  }

  const stage = app.stage;
  const zoom = clamp(finiteOr(stage?.scale?.x, 1), MIN_ZOOM, MAX_ZOOM);

  return {
    mode,
    view: {
      centerX: (container.width / 2 - finiteOr(stage?.x, 0)) / zoom,
      centerY: (container.height / 2 - finiteOr(stage?.y, 0)) / zoom,
      zoom,
    },
  };
}

export function applyKeyframe(keyframe, params = {}) {
  if (!keyframe?.mode || !keyframe?.view) return;
  applyCameraView(keyframe.mode, keyframe.view, params);
}

export function applyCameraView(mode, view, { app, appearance, container, syncZoom = false } = {}) {
  if (!app || !container?.width || !container?.height || !view) return;

  if (mode === VIEW_MODE_3D) {
    apply3DCameraView(view, { app, appearance, container });
    return;
  }

  apply2DCameraView(view, { app, container, syncZoom });
}

export function interpolateCameraView(fromKeyframe, toKeyframe, t) {
  if (!fromKeyframe || !toKeyframe || fromKeyframe.mode !== toKeyframe.mode) {
    return null;
  }

  const amount = clamp(t, 0, 1);
  const mode = fromKeyframe.mode;
  const from = fromKeyframe.view;
  const to = toKeyframe.view;

  if (mode === VIEW_MODE_3D) {
    const orientation = slerpQuaternions(getViewOrientation(from), getViewOrientation(to), amount);
    const orbitView = interpolateOrbitView(fromKeyframe, toKeyframe, orientation, amount);
    return {
      x: orbitView?.x ?? lerp(from.x, to.x, amount),
      y: orbitView?.y ?? lerp(from.y, to.y, amount),
      z: orbitView?.z ?? lerp(from.z, to.z, amount),
      fov: lerp(from.fov, to.fov, amount),
      orientation,
      ...(orbitView && { orbitCenter: orbitView.orbitCenter, viewport: orbitView.viewport }),
    };
  }

  return {
    centerX: lerp(from.centerX, to.centerX, amount),
    centerY: lerp(from.centerY, to.centerY, amount),
    zoom: interpolateZoom(from.zoom, to.zoom, amount),
  };
}

function apply3DCameraView(view, { app, appearance, container }) {
  const camera = appearance?.cameraRef?.current;
  if (!camera) return;

  camera.x = finiteOr(view.x, container.width / 2);
  camera.y = finiteOr(view.y, container.height / 2);
  camera.z = finiteOr(view.z, defaultCamera.z);
  camera.fov = clamp(finiteOr(view.fov, defaultCamera.fov), MIN_FOV, MAX_FOV);
  setCameraOrientation(camera, getViewOrientation(view));
  if (Object.hasOwn(view, "orbitCenter")) {
    camera.orbitCenter = copyOrbitCenter(view.orbitCenter);
  }

  if (typeof camera.redraw === "function") {
    camera.redraw();
  } else {
    app.renderer?.render?.(app.stage);
  }
}

function getViewOrientation(view) {
  if (view?.orientation) return view.orientation;
  return quaternionFromEuler({
    rotX: finiteOr(view?.rotX, defaultCamera.rotX),
    rotY: finiteOr(view?.rotY, defaultCamera.rotY),
    rotZ: finiteOr(view?.rotZ, defaultCamera.rotZ),
  });
}

function copyOrbitCenter(point) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
  return { x: point.x, y: point.y, z: finiteOr(point.z, 0) };
}

function interpolateOrbitView(fromKeyframe, toKeyframe, orientation, amount) {
  const from = fromKeyframe.view;
  const to = toKeyframe.view;
  if (!Object.hasOwn(from, "orbitCenter") && !Object.hasOwn(to, "orbitCenter")) return null;
  const fromViewport = from.viewport ?? fromKeyframe.scene?.viewportSnapshot;
  const toViewport = to.viewport ?? toKeyframe.scene?.viewportSnapshot;
  if (!isValidViewport(fromViewport) || !isValidViewport(toViewport)) return null;

  const fromCenter = copyOrbitCenter(from.orbitCenter) ?? defaultOrbitCenter(fromViewport);
  const toCenter = copyOrbitCenter(to.orbitCenter) ?? defaultOrbitCenter(toViewport);
  const viewport = {
    width: lerp(fromViewport.width, toViewport.width, amount),
    height: lerp(fromViewport.height, toViewport.height, amount),
  };
  const center = {
    x: lerp(fromCenter.x, toCenter.x, amount),
    y: lerp(fromCenter.y, toCenter.y, amount),
    z: lerp(fromCenter.z, toCenter.z, amount),
  };
  const fromOffset = cameraOrbitOffset(from, fromCenter, fromViewport);
  const toOffset = cameraOrbitOffset(to, toCenter, toViewport);
  const rotatedCenter = rotateOrbitCenter(center, viewport, orientation);

  return {
    x: viewport.width / 2 + rotatedCenter.x + lerp(fromOffset.x, toOffset.x, amount),
    y: viewport.height / 2 + rotatedCenter.y + lerp(fromOffset.y, toOffset.y, amount),
    z: rotatedCenter.z + lerp(fromOffset.z, toOffset.z, amount),
    orbitCenter: amount >= 1 && !to.orbitCenter ? null : center,
    viewport,
  };
}

function cameraOrbitOffset(view, center, viewport) {
  const rotatedCenter = rotateOrbitCenter(center, viewport, getViewOrientation(view));
  return {
    x: view.x - viewport.width / 2 - rotatedCenter.x,
    y: view.y - viewport.height / 2 - rotatedCenter.y,
    z: view.z - rotatedCenter.z,
  };
}

function rotateOrbitCenter(center, viewport, orientation) {
  return rotateVectorByQuaternion({
    x: center.x - viewport.width / 2,
    y: center.y - viewport.height / 2,
    z: center.z,
  }, orientation);
}

function defaultOrbitCenter(viewport) {
  return { x: viewport.width / 2, y: viewport.height / 2, z: 0 };
}

function isValidViewport(viewport) {
  return Number.isFinite(viewport?.width) && viewport.width > 0
    && Number.isFinite(viewport?.height) && viewport.height > 0;
}

function apply2DCameraView(view, { app, container, syncZoom }) {
  const zoom = clamp(finiteOr(view.zoom, 1), MIN_ZOOM, MAX_ZOOM);
  const x = container.width / 2 - finiteOr(view.centerX, 0) * zoom;
  const y = container.height / 2 - finiteOr(view.centerY, 0) * zoom;

  if (syncZoom && app.__zoomBehavior && app.__zoomSelection) {
    const transform = d3.zoomIdentity.translate(x, y).scale(zoom);
    app.__zoomSelection.call(app.__zoomBehavior.transform, transform);
    return;
  }

  app.stage.x = x;
  app.stage.y = y;
  app.stage.scale?.set?.(zoom, zoom);
  app.renderer?.render?.(app.stage);
}
