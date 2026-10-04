import assert from "node:assert/strict";
import { test } from "node:test";

import { initTooltips } from "../../../../../src/components/domain/service/canvas_interaction/interactiveCanvas.js";

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
