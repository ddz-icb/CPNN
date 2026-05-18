import {
  VIDEO_EXPORT_FPS,
  VIDEO_EXPORT_PRESETS,
  VIDEO_EXPORT_QUALITY_DEFAULT,
  VIDEO_KEYFRAME_INTERVAL_SECONDS,
  MAX_ZOOM,
  MIN_ZOOM,
} from "./videoExportConfig.js";
import { clamp, finiteOr } from "./cameraPathMath.js";
import { getVideoExportConfig } from "./videoExportConfig.js";

export function getPixiCanvas(app) {
  return app?.canvas ?? app?.renderer?.canvas ?? null;
}

export function getVideoExportScale(container, preset = VIDEO_EXPORT_QUALITY_DEFAULT) {
  const outputContainer = getVideoExportContainer(container, getVideoExportConfig(preset));
  return getVideoViewportTransform(container, outputContainer).k;
}

export function getVideoExportContainer(container, exportConfig = VIDEO_EXPORT_PRESETS[VIDEO_EXPORT_QUALITY_DEFAULT]) {
  const safeWidth = Math.max(1, finiteOr(container?.width, 1));
  const safeHeight = Math.max(1, finiteOr(container?.height, 1));
  const aspectRatio = safeWidth / safeHeight;
  const fallbackPreset = VIDEO_EXPORT_PRESETS[VIDEO_EXPORT_QUALITY_DEFAULT];
  const targetArea = Math.max(1, finiteOr(exportConfig?.targetArea, fallbackPreset.targetArea));
  const maxEdge = Math.max(2, finiteOr(exportConfig?.maxEdge, fallbackPreset.maxEdge));

  let width;
  let height;

  if (aspectRatio >= 1) {
    width = Math.min(maxEdge, Math.round(Math.sqrt(targetArea * aspectRatio)));
    height = Math.round(width / aspectRatio);
  } else {
    height = Math.min(maxEdge, Math.round(Math.sqrt(targetArea / aspectRatio)));
    width = Math.round(height * aspectRatio);
  }

  return {
    width: toEven(Math.max(2, width)),
    height: toEven(Math.max(2, height)),
  };
}

export function getVideoPreviewContainer(container) {
  const pixelRatio = typeof window === "undefined" ? 1 : clamp(window.devicePixelRatio || 1, 1, 2);
  return {
    width: toEven(Math.max(2, Math.round(finiteOr(container?.width, 1) * pixelRatio))),
    height: toEven(Math.max(2, Math.round(finiteOr(container?.height, 1) * pixelRatio))),
  };
}

export function createVideoPreviewCanvas(sourceCanvas, outputContainer) {
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = outputContainer.width;
  previewCanvas.height = outputContainer.height;
  previewCanvas.setAttribute("aria-hidden", "true");
  Object.assign(previewCanvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: "30",
    pointerEvents: "none",
  });

  const parent = sourceCanvas?.parentElement;
  if (!parent) {
    throw new Error("The graph canvas is not attached to the page.");
  }

  parent.appendChild(previewCanvas);
  return previewCanvas;
}

export function createCanvasCaptureStream(canvas) {
  let stream = canvas.captureStream(0);
  let tracks = stream.getVideoTracks();
  const canRequestFrames = tracks.length > 0 && tracks.every((track) => typeof track.requestFrame === "function");

  if (!canRequestFrames) {
    stream.getTracks().forEach((track) => track.stop());
    stream = canvas.captureStream(VIDEO_EXPORT_FPS);
    tracks = stream.getVideoTracks();
  }

  return {
    stream,
    requestFrame() {
      tracks.forEach((track) => track.requestFrame?.());
    },
  };
}

export function get2DFrameTransform(view, container) {
  const zoom = clamp(finiteOr(view?.zoom, 1), MIN_ZOOM, MAX_ZOOM);

  return {
    x: container.width / 2 - finiteOr(view?.centerX, 0) * zoom,
    y: container.height / 2 - finiteOr(view?.centerY, 0) * zoom,
    k: zoom,
  };
}

export function getVideoViewportTransform(sourceContainer, targetContainer) {
  const sourceWidth = Math.max(1, finiteOr(sourceContainer?.width, 1));
  const sourceHeight = Math.max(1, finiteOr(sourceContainer?.height, 1));
  const targetWidth = Math.max(1, finiteOr(targetContainer?.width, 1));
  const targetHeight = Math.max(1, finiteOr(targetContainer?.height, 1));
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

  return {
    x: (targetWidth - sourceWidth * scale) / 2,
    y: (targetHeight - sourceHeight * scale) / 2,
    k: scale,
  };
}

export function resolveCanvasBackground(canvas) {
  if (typeof window === "undefined") return "#ffffff";
  const candidates = [canvas, canvas?.parentElement, document.body, document.documentElement].filter(Boolean);

  for (const element of candidates) {
    const color = window.getComputedStyle(element).backgroundColor;
    if (color && !isTransparentCssColor(color)) {
      return color;
    }
  }

  return "#ffffff";
}

export function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createVideoFrameSchedule(totalMs, fps) {
  const totalFrames = Math.max(2, Math.ceil((totalMs / 1000) * fps) + 1);
  const keyFrameInterval = Math.max(1, Math.round(fps * VIDEO_KEYFRAME_INTERVAL_SECONDS));
  const fallbackDurationUs = Math.max(1, Math.round(1000000 / fps));
  const frameTimesMs = Array.from({ length: totalFrames }, (_, frameIndex) =>
    totalFrames <= 1 ? 0 : Math.min((frameIndex / (totalFrames - 1)) * totalMs, totalMs),
  );

  return frameTimesMs.map((timeMs, frameIndex) => {
    const nextTimeMs = frameTimesMs[frameIndex + 1] ?? timeMs + 1000 / fps;
    return {
      timeMs,
      timestampUs: Math.max(0, Math.round(timeMs * 1000)),
      durationUs: Math.max(1, Math.round((nextTimeMs - timeMs) * 1000) || fallbackDurationUs),
      keyFrame: frameIndex === 0 || frameIndex === totalFrames - 1 || frameIndex % keyFrameInterval === 0,
    };
  });
}

export function getFrameScheduleDurationMs(frameSchedule) {
  const lastFrame = frameSchedule?.[frameSchedule.length - 1];
  if (!lastFrame) return 0;
  return (lastFrame.timestampUs + lastFrame.durationUs) / 1000;
}

function isTransparentCssColor(color) {
  return color === "transparent" || color === "rgba(0, 0, 0, 0)" || color.endsWith(", 0)") || color.endsWith(" 0)");
}

function toEven(value) {
  return value % 2 === 0 ? value : value - 1;
}
