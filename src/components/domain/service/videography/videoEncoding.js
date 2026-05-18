import { buildWebMFile, WEBM_MIME_TYPE } from "./webmEbml.js";

const MAX_ENCODE_QUEUE_SIZE = 8;

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
      encoderError = error instanceof Error ? error : new Error(String(error));
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
      } finally {
        frame.close();
      }
    },
    async finalize() {
      if (encoderError) throw encoderError;

      await encoder.flush();

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
  while (encoder.encodeQueueSize > MAX_ENCODE_QUEUE_SIZE) {
    await wait(0);
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
