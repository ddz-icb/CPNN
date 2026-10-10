import assert from "node:assert/strict";
import { test } from "node:test";

import { initTooltips, resizeCanvas } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas.js";

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
