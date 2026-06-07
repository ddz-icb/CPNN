import { VIDEO_KEYFRAME_INTERVAL_SECONDS } from "./videoExportConfig.js";

export async function createMp4CanvasEncoder({ canvas, width, height, fps, bitrate }) {
  if (!canvas || typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    return null;
  }

  const {
    BufferTarget,
    CanvasSource,
    Mp4OutputFormat,
    Output,
    canEncodeVideo,
  } = await import("mediabunny");

  const canEncodeAvc = await canEncodeVideo("avc", {
    width,
    height,
    bitrate,
    hardwareAcceleration: "no-preference",
  });
  if (!canEncodeAvc) return null;

  const target = new BufferTarget();
  const format = new Mp4OutputFormat({ fastStart: false });
  const output = new Output({ format, target });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    bitrate,
    keyFrameInterval: VIDEO_KEYFRAME_INTERVAL_SECONDS,
    latencyMode: "quality",
    hardwareAcceleration: "no-preference",
  });
  output.addVideoTrack(source);

  try {
    await output.start();
  } catch {
    await output.cancel();
    return null;
  }

  let finished = false;

  return {
    extension: "mp4",
    async encodeCanvasFrame(_canvas, { timestampUs, durationUs, keyFrame = false } = {}) {
      await source.add(
        Math.max(0, timestampUs ?? 0) / 1000000,
        Math.max(1, durationUs ?? Math.round(1000000 / fps)) / 1000000,
        { keyFrame },
      );
    },
    async finalize() {
      source.close();
      await output.finalize();
      finished = true;

      if (!target.buffer?.byteLength) {
        throw new Error("No MP4 video frames were encoded.");
      }

      return new Blob([target.buffer], { type: await output.getMimeType() });
    },
    close() {
      if (finished) return;
      source.close();
      void output.cancel().catch(() => {});
      finished = true;
    },
  };
}
