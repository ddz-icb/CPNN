import { clamp } from "./cameraPathMath.js";
import { VIDEO_EXPORT_FPS } from "./videoExportConfig.js";
import { createVideoFrameSchedule, wait } from "./videoCanvas.js";
import { throwIfAborted } from "./cameraPathTiming.js";

export function playRenderedCameraPathPreview({ context, timeline, totalMs, frameRenderer, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const frameIntervalMs = 1000 / VIDEO_EXPORT_FPS;
    let lastRenderedAt = Number.NEGATIVE_INFINITY;
    let finished = false;

    const renderAt = (timeMs) => {
      frameRenderer.drawFrameAtTime(context, timeline, timeMs);
      onProgress?.(totalMs > 0 ? clamp(timeMs / totalMs, 0, 1) : 1);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        renderAt(totalMs);
        requestAnimationFrame(() => resolve());
      } catch (error) {
        reject(error);
      }
    };

    const tick = (now) => {
      try {
        throwIfAborted(signal);
        const elapsedMs = totalMs > 0 ? clamp(now - startedAt, 0, totalMs) : 0;
        if (now - lastRenderedAt >= frameIntervalMs || elapsedMs >= totalMs) {
          renderAt(elapsedMs);
          lastRenderedAt = now;
        }

        if (elapsedMs >= totalMs) {
          finish();
          return;
        }

        requestAnimationFrame(tick);
      } catch (error) {
        reject(error);
      }
    };

    try {
      renderAt(0);
      lastRenderedAt = startedAt;
      if (totalMs <= 0) {
        finish();
        return;
      }
      requestAnimationFrame(tick);
    } catch (error) {
      reject(error);
    }
  });
}

export async function playRenderedCameraPathRecording({ context, timeline, totalMs, frameSchedule, frameRenderer, requestFrame, onProgress }) {
  const startedAt = performance.now();
  const frames = Array.isArray(frameSchedule) && frameSchedule.length > 0 ? frameSchedule : createVideoFrameSchedule(totalMs, VIDEO_EXPORT_FPS);

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const frame = frames[frameIndex];
    const delayMs = frame.timeMs - (performance.now() - startedAt);
    if (delayMs > 0) {
      await wait(delayMs);
    }

    frameRenderer.drawFrameAtTime(context, timeline, frame.timeMs);
    requestFrame();
    onProgress?.(frames.length <= 1 ? 1 : frameIndex / (frames.length - 1));

    // MediaRecorder events run asynchronously. Yield even when rendering has
    // fallen behind so start/data events are not starved by a tight frame loop.
    if (delayMs <= 0) {
      await wait(0);
    }
  }
}
