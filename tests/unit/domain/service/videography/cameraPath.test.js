import assert from "node:assert/strict";
import { test } from "node:test";
import { createCameraKeyframe, moveKeyframeById, removeKeyframeById, updateKeyframeById } from "../../../../../src/components/domain/service/videography/cameraPathKeyframes.js";
import { createCameraPathTimeline, sampleCameraPathAtMs, validateCameraPath } from "../../../../../src/components/domain/service/videography/cameraPathTimeline.js";
import { renderCameraPathFrameSchedule } from "../../../../../src/components/domain/service/videography/cameraPathPlayback.js";
import { captureCurrentView } from "../../../../../src/components/domain/service/videography/cameraView.js";

function keyframe(view, mode = "2d", options = {}) {
  return { ...createCameraKeyframe({ captured: { mode, view }, index: 0, transitionSeconds: 2 }), easing: "linear", ...options };
}
const startView = { centerX: 0, centerY: 0, zoom: 1 };
const endView = { centerX: 100, centerY: 200, zoom: 4 };

test("keyframes can be edited, reordered and removed without changing the original list", () => {
  const first = keyframe(startView);
  const second = keyframe(endView);
  const frames = [first, second];
  const edited = updateKeyframeById(frames, first.id, { label: "Start", holdSeconds: 1 });
  assert.equal(edited[0].label, "Start");
  assert.equal(edited[0].holdSeconds, 1);
  assert.equal(first.holdSeconds, 0);
  assert.deepEqual(moveKeyframeById(frames, second.id, -1), [second, first]);
  assert.deepEqual(moveKeyframeById(frames, first.id, -1), frames);
  assert.deepEqual(removeKeyframeById(frames, first.id), [second]);
  assert.deepEqual(frames, [first, second]);
});

test("paths require at least two keyframes and a consistent active view mode", () => {
  const frames = [keyframe(startView), keyframe(endView)];
  assert.throws(() => validateCameraPath([frames[0]], "2d"), /at least two/);
  assert.throws(() => validateCameraPath([frames[0], { ...frames[1], mode: "3d" }]), /same graph mode/);
  assert.throws(() => validateCameraPath(frames, "3d"), /Switch back/);
  assert.doesNotThrow(() => validateCameraPath(frames, "2d"));
});

test("timeline includes holds and transitions, with smooth 2D zoom between views", () => {
  const timeline = createCameraPathTimeline([
    keyframe(startView, "2d", { holdSeconds: 1 }),
    keyframe(endView, "2d", { holdSeconds: 0.5 }),
  ]);
  assert.equal(timeline.totalMs, 3500);
  assert.deepEqual(sampleCameraPathAtMs(timeline, -100).view, startView);
  assert.deepEqual(sampleCameraPathAtMs(timeline, 500).view, startView);
  assert.deepEqual(sampleCameraPathAtMs(timeline, 2000).view, { centerX: 50, centerY: 100, zoom: 2 });
  assert.deepEqual(sampleCameraPathAtMs(timeline, 4000).view, endView);
});

test("empty paths and instant transitions have predictable results", () => {
  assert.equal(sampleCameraPathAtMs(createCameraPathTimeline([]), 0), null);
  const timeline = createCameraPathTimeline([keyframe(startView), keyframe(endView, "2d", { transitionSeconds: 0 })]);
  assert.equal(timeline.totalMs, 0);
  assert.deepEqual(sampleCameraPathAtMs(timeline, 0).view, endView);
});

for (const mode of ["2d", "3d"]) {
  test(`${mode}: frame playback visits the start, midpoint and final view`, async () => {
    const views = mode === "2d" ? [startView, endView] : [
      { x: 0, y: 0, z: 100, fov: 400, rotX: 0, rotY: 0, rotZ: 0 },
      { x: 100, y: 200, z: 300, fov: 800, rotX: 0, rotY: Math.PI / 2, rotZ: 0 },
    ];
    const scale = { x: 1, set(value) { this.x = value; } };
    const params = {
      app: { stage: { x: 0, y: 0, scale } },
      appearance: { threeD: mode === "3d", cameraRef: { current: {} } },
      container: { width: 800, height: 600 },
    };
    const captured = [], progress = [];
    await renderCameraPathFrameSchedule({
      ...params,
      keyframes: views.map((view) => keyframe(view, mode)),
      frameSchedule: [0, 1000, 2000].map((timeMs) => ({ timeMs })),
      onFrame: () => captured.push(captureCurrentView(params).view),
      onProgress: (value) => progress.push(value),
    });
    assert.equal(captured.length, 3);
    if (mode === "2d") {
      assert.deepEqual(captured, [startView, { centerX: 50, centerY: 100, zoom: 2 }, endView]);
    } else {
      assert.deepEqual(captured.map(({ x, y, z, fov }) => ({ x, y, z, fov })), [
        { x: 0, y: 0, z: 100, fov: 400 },
        { x: 50, y: 100, z: 200, fov: 600 },
        { x: 100, y: 200, z: 300, fov: 800 },
      ]);
      assert.ok(Math.abs(captured[1].rotY - Math.PI / 4) < 1e-6);
    }
    assert.equal(progress.at(-1), 1);
    assert.ok(progress.every((value, i) => value >= 0 && value <= 1 && (i === 0 || value >= progress[i - 1])));
  });
}

test("cancelling playback prevents subsequent frames", async () => {
  const controller = new AbortController();
  let frameCount = 0;
  await assert.rejects(() => renderCameraPathFrameSchedule({
    keyframes: [keyframe(startView), keyframe(endView)],
    frameSchedule: [{ timeMs: 0 }, { timeMs: 1000 }, { timeMs: 2000 }],
    signal: controller.signal,
    onFrame: () => { frameCount++; controller.abort(); },
  }), { name: "AbortError" });
  assert.equal(frameCount, 1);
});
