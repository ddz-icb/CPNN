import * as d3 from "d3";
import { defaultCamera } from "../canvas_drawing/render3D.js";
import {
  getCameraOrientation,
  quaternionFromEuler,
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
    return {
      x: lerp(from.x, to.x, amount),
      y: lerp(from.y, to.y, amount),
      z: lerp(from.z, to.z, amount),
      fov: lerp(from.fov, to.fov, amount),
      orientation: slerpQuaternions(getViewOrientation(from), getViewOrientation(to), amount),
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
