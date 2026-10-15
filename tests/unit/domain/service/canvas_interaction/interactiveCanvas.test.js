import assert from "node:assert/strict";
import { test } from "node:test";

import { getCanvasResolution, initTooltips, keepCanvasCentered, resizeCanvas } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas.js";
import { initDragAndZoom3D } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas3D.js";
import {
  applyCameraPreset,
  getCameraOrientation,
  getCameraOrbitAngles,
  getCameraViewParams,
  projectPoint3D,
  rotateVectorByQuaternion,
  setCameraOrbit,
} from "../../../../../src/components/domain/service/canvas_drawing/camera3D.js";

function createCircle() {
  const handlers = {};
  return {
    handlers,
    on(event, handler) {
      handlers[event] = handler;
    },
  };
}

function clickNode({ detailsOpen }) {
  const circle = createCircle();
  const settings = { isClickTooltipActive: detailsOpen, isNodeFocusOnly: false };
  const setTooltipSettings = (key, value) => {
    settings[key] = value;
  };

  initTooltips(circle, { id: "next", attribs: ["type"] }, setTooltipSettings, () => settings);
  circle.handlers.click({ originalEvent: { clientX: 25, clientY: 40 } });
  return settings;
}

test("clicking another node keeps an open details rail open", () => {
  const settings = clickNode({ detailsOpen: true });
  assert.equal(settings.isClickTooltipActive, true);
  assert.equal(settings.isNodeFocusOnly, false);
  assert.deepEqual(settings.clickTooltipData, {
    node: "next",
    nodeAttribs: ["type"],
    x: 25,
    y: 40,
  });
});

test("clicking a node with details closed retains compact focus", () => {
  const settings = clickNode({ detailsOpen: false });
  assert.equal(settings.isClickTooltipActive, false);
  assert.equal(settings.isNodeFocusOnly, true);
});

test("browser pixel ratio changes resize and redraw the canvas without changing its CSS size", () => {
  const container = { clientWidth: 800, clientHeight: 600 };
  const resizeCalls = [];
  let redraws = 0;
  const app = {
    renderer: {
      screen: { width: 800, height: 600 },
      resolution: 1,
      resize(width, height, resolution) {
        resizeCalls.push([width, height, resolution]);
        this.screen.width = width;
        this.screen.height = height;
        this.resolution = resolution;
      },
    },
    __redrawGraph: () => { redraws += 1; },
  };

  resizeCanvas(container, app, 1);
  resizeCanvas(container, app, 2);
  resizeCanvas(container, app, 2);
  container.clientWidth = 900;
  resizeCanvas(container, app, 2);

  assert.deepEqual(resizeCalls, [[800, 600, 2], [900, 600, 2]]);
  assert.equal(redraws, 2);
});

test("page pinch scale contributes to the backing resolution", () => {
  assert.equal(getCanvasResolution({ devicePixelRatio: 2, visualViewport: { scale: 1.5 } }), 3);
  assert.equal(getCanvasResolution({ devicePixelRatio: 2, visualViewport: { scale: 1 } }), 2);
});

test("resizing preserves the point at the center of a rotated 3D view", () => {
  const camera = { x: 470, y: 310, z: -500, fov: 600, rotX: 0.5, rotY: -0.3, rotZ: 0.2 };
  const point = { x: 520, y: 270, z: 40 };
  const before = projectPoint3D(point, getCameraViewParams(camera, 800, 600));

  keepCanvasCentered(null, camera, 800, 600, 600, 700, true);

  const after = projectPoint3D(point, getCameraViewParams(camera, 600, 700));
  assert.ok(Math.abs(after.x - (before.x - 100)) < 1e-6);
  assert.ok(Math.abs(after.y - (before.y + 50)) < 1e-6);
  assert.ok(Math.abs(after.scale - before.scale) < 1e-9);
});

test("3D orbit limits tilt and keeps the vertical axis upright", () => {
  const camera = {};
  setCameraOrbit(camera, 100, 1.08);
  assert.equal(camera.rotZ, 0);
  const vertical = rotateVectorByQuaternion({ x: 0, y: 1, z: 0 }, getCameraOrientation(camera));
  assert.ok(Math.abs(vertical.x) < 1e-10);
  assert.ok(camera.rotX < Math.PI / 2);
  setCameraOrbit(camera, -200, 0);
  assert.ok(camera.rotX > -Math.PI / 2);
});

function dragCamera(points, { upAxis = "y", start = { pitch: 0.5, yaw: -0.2 } } = {}) {
  const handlers = new Map();
  const canvas = {
    style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    addEventListener: (name, handler) => handlers.set(name, handler),
    removeEventListener: (name) => handlers.delete(name),
  };
  const app = { renderer: { canvas, screen: { width: 800, height: 600 } } };
  const camera = { x: 400, y: 300, z: -600, redraw() {} };
  setCameraOrbit(camera, start.pitch, start.yaw, upAxis);
  const cleanup = initDragAndZoom3D(app, { nodes: () => [] }, () => {}, { current: camera }, { current: { upAxis } });
  const pointer = (name, x, y) => handlers.get(name)({
    pointerId: 1, button: 0, clientX: x, clientY: y, altKey: false, shiftKey: false, preventDefault() {},
  });

  pointer("pointerdown", ...points[0]);
  for (const point of points.slice(1)) pointer("pointermove", ...point);
  pointer("pointerup", ...points.at(-1));
  cleanup();
  return camera;
}

test("ordinary 3D pointer rotation is determined by total drag distance", () => {
  const segmented = dragCamera([[100, 100], [130, 120], [160, 140]]);
  const direct = dragCamera([[100, 100], [160, 140]]);
  assert.equal(segmented.rotZ, 0);
  assert.ok(Math.abs(segmented.rotX - 0.74) < 1e-10);
  assert.ok(Math.abs(segmented.rotY - 0.16) < 1e-10);
  assert.deepEqual(segmented.orientation, direct.orientation);
});

test("elevation orbit keeps Z upright and is independent of pointer event count", () => {
  const segmented = dragCamera([[100, 100], [125, 90], [145, 110], [160, 140]], { upAxis: "z" });
  const direct = dragCamera([[100, 100], [160, 140]], { upAxis: "z" });
  const height = rotateVectorByQuaternion({ x: 0, y: 0, z: 1 }, getCameraOrientation(segmented));
  assert.ok(Math.abs(height.x) < 1e-10);
  assert.ok(height.y < 0);
  assert.deepEqual(segmented.orientation, direct.orientation);
  const angles = getCameraOrbitAngles(segmented, "z");
  assert.ok(Math.abs(angles.pitch - 0.74) < 1e-10);
  assert.ok(Math.abs(angles.yaw - 0.16) < 1e-10);

  const fromAbove = dragCamera([[100, 100], [100, -200]], { upAxis: "z" });
  assert.ok(Math.abs(getCameraOrbitAngles(fromAbove, "z").pitch) < 1e-10);
});

test("elevation view presets stay on the same orbit when dragging resumes", () => {
  const camera = {};
  applyCameraPreset(camera, "side", "z");
  const orientation = getCameraOrientation(camera);
  const angles = getCameraOrbitAngles(camera, "z");
  setCameraOrbit(camera, angles.pitch, angles.yaw, "z");
  for (const key of ["x", "y", "z", "w"]) {
    assert.ok(Math.abs(camera.orientation[key] - orientation[key]) < 1e-10);
  }
});

test("resizing reports the new logical viewport once", () => {
  const changes = [];
  const container = { getBoundingClientRect: () => ({ width: 640.5, height: 480.25 }) };
  const app = {
    renderer: {
      screen: { width: 800, height: 600 }, resolution: 1,
      resize(width, height, resolution) {
        this.screen = { width, height };
        this.resolution = resolution;
      },
    },
  };
  resizeCanvas(container, app, 2, (...args) => changes.push(args));
  resizeCanvas(container, app, 2, (...args) => changes.push(args));
  assert.deepEqual(changes, [[641, 480, 800, 600]]);
});
