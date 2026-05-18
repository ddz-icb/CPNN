import { clamp } from "./cameraPathMath.js";

export function runTimedStep({ durationMs, elapsedBeforeStep, totalMs, render, onProgress, onFrame, signal }) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    const tick = (now) => {
      try {
        throwIfAborted(signal);
        const rawT = durationMs <= 0 ? 1 : clamp((now - startTime) / durationMs, 0, 1);
        render(rawT);
        onFrame?.();
        if (totalMs > 0) {
          onProgress?.(clamp((elapsedBeforeStep + rawT * durationMs) / totalMs, 0, 1));
        }

        if (rawT < 1) {
          requestAnimationFrame(tick);
          return;
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    requestAnimationFrame(tick);
  });
}

export function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  throw new DOMException("Camera path rendering was cancelled.", "AbortError");
}
