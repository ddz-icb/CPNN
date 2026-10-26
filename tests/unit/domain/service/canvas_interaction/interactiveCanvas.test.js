import assert from "node:assert/strict";
import { test } from "node:test";

import { getCanvasResolution, initTooltips, keepCanvasCentered, resizeCanvas } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas.js";
import { initDragAndZoom3D } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas3D.js";
import { captureViewState, centerOnNode, clearViewOrbitCenter, restoreViewState } from "../../../../../src/components/domain/service/canvas_interaction/centerView.js";
import {
  applyCameraPreset,
  conjugateQuaternion,
  getCameraOrientation,
  getCameraOrbitAngles,
  getCameraViewParams,
  projectPoint3D,
  resetCamera3D,
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
  circle.handlers.pointerdown({ originalEvent: { clientX: 25, clientY: 40 } });
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

test("a drag-generated node click does not focus, but the next click does", () => {
  const circle = createCircle();
  const settings = { isClickTooltipActive: false, isNodeFocusOnly: false };
  initTooltips(circle, { id: "focused", attribs: [] }, (key, value) => { settings[key] = value; }, () => settings);

  circle.handlers.pointerdown({ originalEvent: { clientX: 25, clientY: 40 } });
  circle.handlers.pointermove({ originalEvent: { clientX: 31, clientY: 40 } });
  circle.handlers.click({ originalEvent: { clientX: 25, clientY: 40 } });
  assert.equal(settings.clickTooltipData, undefined);
  assert.equal(settings.isNodeFocusOnly, false);

  circle.handlers.pointerdown({ originalEvent: { clientX: 25, clientY: 40 } });
  circle.handlers.click({ originalEvent: { clientX: 30, clientY: 40 } });
  assert.equal(settings.clickTooltipData, undefined);

  circle.handlers.pointerdown({ originalEvent: { clientX: 25, clientY: 40 } });
  circle.handlers.click({ originalEvent: { clientX: 29, clientY: 40 } });
  assert.equal(settings.clickTooltipData.node, "focused");
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

test("closing view focuses restores the previous orbit center", () => {
  const previous = { x: 20, y: 30, z: 40 };
  const camera = { orbitCenter: previous, x: 400, y: 300, z: -600, fov: 600, rotX: 0, rotY: 0, rotZ: 0, redraw() {} };
  const appearance = { threeD: true, cameraRef: { current: camera } };
  const view = { appearance, container: { width: 800, height: 600 } };
  const community = { x: 100, y: 150, z: 10 };
  const node = { x: 200, y: 250, z: 20 };

  centerOnNode(community, { ...view, orbitOwner: "community" });
  const previousView = captureViewState(view);
  centerOnNode(node, { ...view, orbitOwner: "node" });
  camera.rotX = 0.5;
  clearViewOrbitCenter({ appearance, owner: "node" });
  restoreViewState(previousView);
  assert.deepEqual(camera.orbitCenter, community);
  assert.deepEqual([camera.x, camera.y, camera.z, camera.rotX], [previousView.x, previousView.y, previousView.z, previousView.rotX]);
  clearViewOrbitCenter({ appearance, owner: "community" });
  assert.deepEqual(camera.orbitCenter, previous);

  centerOnNode(community, { ...view, orbitOwner: "community" });
  centerOnNode(node, { ...view, orbitOwner: "node" });
  clearViewOrbitCenter({ appearance, owner: "community" });
  assert.deepEqual(camera.orbitCenter, node);
  clearViewOrbitCenter({ appearance, owner: "node" });
  assert.deepEqual(camera.orbitCenter, previous);
});

test("closing a 2D focus restores the previous pan and zoom", () => {
  const stage = { x: 20, y: 30, scale: { x: 1.25, set(x, y) { this.x = x; this.y = y; } } };
  const app = { stage, renderer: { render() {} } };
  const view = { appearance: { threeD: false }, renderState: { app }, container: { width: 800, height: 600 } };
  const previousView = captureViewState(view);

  centerOnNode({ x: 100, y: 150 }, view);
  restoreViewState(previousView);

  assert.deepEqual([stage.x, stage.y, stage.scale.x], [20, 30, 1.25]);
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

  const fromBelow = dragCamera([[100, 100], [100, -200]], { upAxis: "z" });
  assert.ok(Math.abs(getCameraOrbitAngles(fromBelow, "z").pitch) < 1e-10);
});

test("horizontal drag turns the graph the same way from above and below", () => {
  for (const pitch of [0.5, Math.PI - 0.5]) {
    for (const yaw of [-1.2, 0, 1.2]) {
      const initial = {};
      setCameraOrbit(initial, pitch, yaw, "z");
      const worldRight = rotateVectorByQuaternion(
        { x: 1, y: 0, z: 0 },
        conjugateQuaternion(getCameraOrientation(initial)),
      );
      const screenBottom = rotateVectorByQuaternion(
        { x: 0, y: 1, z: 0 },
        conjugateQuaternion(getCameraOrientation(initial)),
      );
      const camera = dragCamera([[100, 100], [130, 100]], { upAxis: "z", start: { pitch, yaw } });
      const rightOfCenter = rotateVectorByQuaternion(worldRight, getCameraOrientation(camera));
      const bottomOfGraph = rotateVectorByQuaternion(
        { x: screenBottom.x, y: screenBottom.y, z: 0 },
        getCameraOrientation(camera),
      );
      const height = rotateVectorByQuaternion({ x: 0, y: 0, z: 1 }, getCameraOrientation(camera));
      assert.ok(rightOfCenter.y < 0);
      assert.ok(bottomOfGraph.x > 0);
      assert.ok(Math.abs(height.x) < 1e-10);
    }
  }
});

test("dragging right moves the near side right in the default elevation Front view", () => {
  const camera = dragCamera([[100, 100], [130, 100]], {
    upAxis: "z",
    start: { pitch: Math.PI / 2, yaw: 0 },
  });
  const nearSide = rotateVectorByQuaternion({ x: 0, y: -1, z: 0 }, getCameraOrientation(camera));
  assert.ok(nearSide.x > 0);
});

test("elevation pitch reaches the view from above without rolling the height axis", () => {
  const start = { pitch: Math.PI / 2, yaw: 0 };
  const fromAbove = dragCamera([[100, 100], [130, 250], [160, 400]], { upAxis: "z", start });
  const direct = dragCamera([[100, 100], [160, 400]], { upAxis: "z", start });
  const angles = getCameraOrbitAngles(fromAbove, "z");
  const height = rotateVectorByQuaternion({ x: 0, y: 0, z: 1 }, getCameraOrientation(fromAbove));
  assert.ok(Math.abs(angles.pitch - Math.PI) < 1e-10);
  assert.ok(Math.abs(angles.yaw + 0.36) < 1e-10);
  assert.ok(Math.abs(height.x) < 1e-10);
  assert.ok(Math.abs(height.z + 1) < 1e-10);
  assert.deepEqual(fromAbove.orientation, direct.orientation);
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

test("resetting an elevation view opens at the front", () => {
  const camera = {};
  resetCamera3D(camera, { width: 800, height: 600 }, "z");
  const angles = getCameraOrbitAngles(camera, "z");
  assert.ok(Math.abs(angles.pitch - Math.PI / 2) < 1e-10);
  assert.ok(Math.abs(angles.yaw) < 1e-10);
  const heightAxis = rotateVectorByQuaternion({ x: 0, y: 0, z: 1 }, getCameraOrientation(camera));
  assert.ok(Math.abs(heightAxis.z) < 1e-10);
  assert.ok(Math.abs(heightAxis.y + 1) < 1e-10);
});

test("elevation Top preset looks down on the graph", () => {
  const camera = {};
  applyCameraPreset(camera, "top", "z");
  assert.ok(Math.abs(getCameraOrbitAngles(camera, "z").pitch - Math.PI) < 1e-10);
  const heightAxis = rotateVectorByQuaternion({ x: 0, y: 0, z: 1 }, getCameraOrientation(camera));
  assert.ok(Math.abs(heightAxis.z + 1) < 1e-10);
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
