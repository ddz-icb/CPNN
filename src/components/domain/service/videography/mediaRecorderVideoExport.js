import { playRenderedCameraPathRecording } from "./cameraPathFramePlayback.js";
import { VIDEO_EXPORT_FPS } from "./videoExportConfig.js";
import {
  buildTrackingShotFilename,
  getVideoExtension,
  triggerDownload,
} from "./videoOutput.js";
import {
  createCanvasCaptureStream,
  wait,
} from "./videoCanvas.js";

export async function recordRenderedFramesWithMediaRecorder({
  captureCanvas,
  context,
  timeline,
  frameSchedule,
  frameRenderer,
  mimeType,
  bitrate,
  graphName,
  onProgress,
}) {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support MediaRecorder video export.");
  }
  if (typeof captureCanvas?.captureStream !== "function") {
    throw new Error("This browser does not support canvas video capture.");
  }

  const { stream, requestFrame } = createCanvasCaptureStream(captureCanvas);
  const recorder = createMediaRecorder(stream, mimeType, bitrate);
  const { recorderStopped, stopTracks } = createRecorderLifecycle(recorder, stream, mimeType);
  const renderError = await renderFramesToRecorder({
    recorder,
    context,
    timeline,
    frameSchedule,
    frameRenderer,
    requestFrame,
    onProgress,
  });

  try {
    const blob = await recorderStopped;
    if (renderError) throw renderError;

    const extension = getVideoExtension(blob.type || recorder.mimeType || mimeType);
    const filename = buildTrackingShotFilename(graphName, extension);
    triggerDownload(blob, filename);
    onProgress?.(1);
    return { blob, filename };
  } finally {
    stopTracks();
  }
}

async function renderFramesToRecorder({ recorder, context, timeline, frameSchedule, frameRenderer, requestFrame, onProgress }) {
  try {
    const recorderStarted = waitForRecorderStart(recorder);
    recorder.start(250);
    await recorderStarted;
    await playRenderedCameraPathRecording({
      context,
      timeline,
      totalMs: timeline.totalMs,
      frameSchedule,
      frameRenderer,
      requestFrame,
      onProgress,
    });
    await wait(Math.max(50, Math.round(1000 / VIDEO_EXPORT_FPS) * 2));
    return null;
  } catch (error) {
    return error;
  } finally {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  }
}

function waitForRecorderStart(recorder) {
  if (recorder.state === "recording") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const handleStart = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(recorder.error ?? new Error("Video recording failed to start."));
    };
    const cleanup = () => {
      recorder.removeEventListener("start", handleStart);
      recorder.removeEventListener("error", handleError);
    };

    recorder.addEventListener("start", handleStart, { once: true });
    recorder.addEventListener("error", handleError, { once: true });
  });
}

function createMediaRecorder(stream, mimeType, bitrate) {
  const recorderOptions = {};
  if (mimeType) recorderOptions.mimeType = mimeType;
  if (Number.isFinite(bitrate) && bitrate > 0) recorderOptions.videoBitsPerSecond = bitrate;

  try {
    return new MediaRecorder(stream, recorderOptions);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }
}

function createRecorderLifecycle(recorder, stream, mimeType) {
  const chunks = [];
  const recorderStopped = new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(recorder.error ?? new Error("Video recording failed."));
    recorder.onstop = () => {
      if (chunks.length === 0) {
        reject(new Error("No video frames were recorded."));
        return;
      }
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" }));
    };
  });

  return {
    recorderStopped,
    stopTracks: () => stream.getTracks().forEach((track) => track.stop()),
  };
}
