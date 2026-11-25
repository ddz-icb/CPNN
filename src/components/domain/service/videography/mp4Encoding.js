import { VIDEO_KEYFRAME_INTERVAL_SECONDS } from "./videoExportConfig.js";

const MP4_CODEC_CANDIDATES = ["hevc", "avc"];
const HARDWARE_PREFERENCES = ["prefer-software", "no-preference"];

export async function createMp4CanvasEncoder({ canvas, width, height, fps, bitrate }) {
  if (!canvas || typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    return null;
  }

  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, canEncodeVideo } = await import("mediabunny");

  for (const codec of MP4_CODEC_CANDIDATES) {
    for (const hardwareAcceleration of HARDWARE_PREFERENCES) {
      const canEncode = await canEncodeVideo(codec, {
        width,
        height,
        bitrate,
        hardwareAcceleration,
      });
      if (!canEncode) continue;

      const target = new BufferTarget();
      const output = new Output({
        format: new Mp4OutputFormat({ fastStart: false }),
        target,
      });
      const source = new CanvasSource(canvas, {
        codec,
        bitrate,
        bitrateMode: "variable",
        contentHint: "text",
        keyFrameInterval: VIDEO_KEYFRAME_INTERVAL_SECONDS,
        latencyMode: "quality",
        hardwareAcceleration,
      });
      output.addVideoTrack(source);

      try {
        await output.start();
        return createEncoderHandle({ output, source, target, fps });
      } catch {
        source.close();
        await output.cancel();
      }
    }
  }

  return null;
}

function createEncoderHandle({ output, source, target, fps }) {
  let finished = false;

  return {
    extension: "mp4",
    async encodeCanvasFrame(_canvas, { timestampUs, durationUs, keyFrame = false } = {}) {
      await source.add(
        Math.max(0, timestampUs ?? 0) / 1_000_000,
        Math.max(1, durationUs ?? Math.round(1_000_000 / fps)) / 1_000_000,
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
