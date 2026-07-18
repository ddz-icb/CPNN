import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { enableLasso } from "../../../../../src/components/domain/service/canvas_interaction/lasso.js";

function createEventTarget(initialValues = {}) {
  const listeners = new Map();

  return {
    ...initialValues,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type, event) {
      listeners.get(type)?.forEach((listener) => listener(event));
    },
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

function pointerEvent(clientX, clientY, { button = 0 } = {}) {
  return {
    button,
    clientX,
    clientY,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
    },
  };
}

function createAppHarness() {
  const canvas = createEventTarget({ style: { cursor: "default" } });
  const stageChildren = [];
  const app = {
    renderer: {
      canvas,
      events: {
        mapPositionToPoint(point, clientX, clientY) {
          point.x = clientX;
          point.y = clientY;
        },
      },
    },
    stage: {
      scale: { x: 1 },
      sortableChildren: false,
      addChild(child) {
        stageChildren.push(child);
      },
      toLocal(globalPoint, _from, worldPoint) {
        worldPoint.x = globalPoint.x;
        worldPoint.y = globalPoint.y;
      },
    },
  };

  return { app, canvas, stageChildren };
}

function withFakeWindow(runTest) {
  const previousWindow = globalThis.window;
  const fakeWindow = createEventTarget();
  globalThis.window = fakeWindow;

  try {
    runTest(fakeWindow);
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
}

function nodeEntry(id, x, y) {
  return {
    node: { id },
    circle: { x, y, visible: true },
  };
}

describe("enableLasso", () => {
  test("captures nodes inside the drawn lasso polygon", () => {
    withFakeWindow((fakeWindow) => {
      const { app, canvas } = createAppHarness();
      const selections = [];
      const nodeMap = {
        inside: nodeEntry("inside", 5, 5),
        outside: nodeEntry("outside", 20, 5),
      };

      const cleanup = enableLasso({
        app,
        nodeMap,
        onSelect: (selection) => selections.push(selection),
      });

      canvas.dispatch("pointerdown", pointerEvent(0, 0));
      canvas.dispatch("pointermove", pointerEvent(10, 0));
      canvas.dispatch("pointermove", pointerEvent(10, 10));
      fakeWindow.dispatch("pointerup", pointerEvent(0, 10));

      assert.deepEqual(selections, [
        {
          polygon: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          nodes: ["inside"],
        },
      ]);

      cleanup();
    });
  });

  test("does not select nodes when the drawn path has fewer than three points", () => {
    withFakeWindow((fakeWindow) => {
      const { app, canvas } = createAppHarness();
      const selections = [];

      const cleanup = enableLasso({
        app,
        nodeMap: { A: nodeEntry("A", 1, 1) },
        onSelect: (selection) => selections.push(selection),
      });

      canvas.dispatch("pointerdown", pointerEvent(0, 0));
      fakeWindow.dispatch("pointerup", pointerEvent(2, 0));

      assert.deepEqual(selections, []);

      cleanup();
    });
  });

  test("registers and removes pointer listeners during cleanup", () => {
    withFakeWindow((fakeWindow) => {
      const { app, canvas } = createAppHarness();

      const cleanup = enableLasso({ app, nodeMap: {} });

      assert.equal(canvas.style.cursor, "crosshair");
      assert.equal(canvas.listenerCount("pointerdown"), 1);
      assert.equal(canvas.listenerCount("pointermove"), 1);
      assert.equal(fakeWindow.listenerCount("pointerup"), 1);

      cleanup();

      assert.equal(canvas.style.cursor, "default");
      assert.equal(canvas.listenerCount("pointerdown"), 0);
      assert.equal(canvas.listenerCount("pointermove"), 0);
      assert.equal(fakeWindow.listenerCount("pointerup"), 0);
    });
  });
});
