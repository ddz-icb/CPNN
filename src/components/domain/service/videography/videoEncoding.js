import { buildWebMFile, WEBM_MIME_TYPE } from "./webmEbml.js";

const MAX_ENCODE_QUEUE_SIZE = 3;
const ENCODER_QUEUE_TIMEOUT_MS = 30000;
const ENCODER_FLUSH_TIMEOUT_MS = 60000;
export const VIDEO_ENCODER_ERROR_CODE = "VIDEO_ENCODER_FAILED";

const VIDEO_CODEC_CANDIDATES = [
  {
    codec: "vp09.00.10.08",
    codecId: "V_VP9",
    mimeType: "video/webm;codecs=vp9",
  },
  {
    codec: "vp8",
    codecId: "V_VP8",
    mimeType: "video/webm;codecs=vp8",
  },
];

export async function createWebMCanvasEncoder({
  width,
  height,
  fps,
  bitrate,
  durationMs,
}) {
  if (
    typeof VideoEncoder === "undefined" ||
    typeof VideoFrame === "undefined" ||
    typeof VideoEncoder.isConfigSupported !== "function"
  ) {
    return null;
  }

  const codecCandidate = await getSupportedCodecCandidate({
    width,
    height,
    fps,
    bitrate,
  });

  if (!codecCandidate) {
    return null;
  }

  const chunks = [];
  let encoderError = null;

  const encoder = new VideoEncoder({
    output: (chunk) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunks.push({
        type: chunk.type,
        timestamp: chunk.timestamp,
        duration: chunk.duration,
        data,
      });
    },
    error: (error) => {
      encoderError = toVideoEncoderError(error, "Video encoding failed.");
    },
  });

  try {
    encoder.configure(codecCandidate.config);
  } catch {
    encoder.close();
    return null;
  }

  return {
    mimeType: codecCandidate.mimeType,
    extension: "webm",
    async encodeCanvasFrame(canvas, { timestampUs, durationUs, keyFrame = false } = {}) {
      if (encoderError) throw encoderError;
      await waitForEncoderCapacity(encoder);

      const frame = new VideoFrame(canvas, {
        timestamp: Math.max(0, Math.round(timestampUs ?? 0)),
        duration: Math.max(1, Math.round(durationUs ?? 0)),
      });

      try {
        encoder.encode(frame, { keyFrame });
      } catch (error) {
        throw toVideoEncoderError(error, "Could not encode a video frame.");
      } finally {
        frame.close();
      }
    },
    async finalize() {
      if (encoderError) throw encoderError;

      try {
        await withTimeout(
          encoder.flush(),
          ENCODER_FLUSH_TIMEOUT_MS,
          "The video encoder did not finish.",
        );
      } catch (error) {
        throw toVideoEncoderError(error, "The video encoder did not finish.");
      }

      if (encoderError) throw encoderError;
      if (chunks.length === 0) {
        throw new Error("No video frames were encoded.");
      }

      try {
        const sortedChunks = [...chunks].sort((a, b) => a.timestamp - b.timestamp);
        return new Blob(
          [
            buildWebMFile({
              width,
              height,
              fps,
              codecId: codecCandidate.codecId,
              durationMs,
              chunks: sortedChunks,
            }),
          ],
          { type: WEBM_MIME_TYPE },
        );
      } finally {
        encoder.close();
      }
    },
    close() {
      if (encoder.state !== "closed") {
        encoder.close();
      }
    },
  };
}

async function getSupportedCodecCandidate({ width, height, fps, bitrate }) {
  for (const candidate of VIDEO_CODEC_CANDIDATES) {
    const config = {
      codec: candidate.codec,
      width,
      height,
      bitrate,
      framerate: fps,
    };

    try {
      const support = await VideoEncoder.isConfigSupported(config);
      if (support?.supported) {
        return {
          ...candidate,
          config: support.config ?? config,
        };
      }
    } catch {
      // Ignore and keep trying the next codec candidate.
    }
  }

  return null;
}

async function waitForEncoderCapacity(encoder) {
  const startedAt = performance.now();
  while (encoder.encodeQueueSize > MAX_ENCODE_QUEUE_SIZE) {
    if (performance.now() - startedAt > ENCODER_QUEUE_TIMEOUT_MS) {
      throw toVideoEncoderError(null, "The video encoder stopped accepting frames.");
    }
    await wait(4);
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(toVideoEncoderError(null, message)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function toVideoEncoderError(error, fallbackMessage) {
  if (error?.code === VIDEO_ENCODER_ERROR_CODE) return error;
  const result = new Error(error?.message || fallbackMessage);
  result.name = "VideoEncoderError";
  result.code = VIDEO_ENCODER_ERROR_CODE;
  if (error) result.cause = error;
  return result;
}
