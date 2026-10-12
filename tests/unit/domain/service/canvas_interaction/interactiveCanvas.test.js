import assert from "node:assert/strict";
import { test } from "node:test";

import { getCanvasResolution, initTooltips, keepCanvasCentered, resizeCanvas } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas.js";
import { getCameraViewParams, projectPoint3D } from "../../../../../src/components/domain/service/canvas_drawing/camera3D.js";

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
