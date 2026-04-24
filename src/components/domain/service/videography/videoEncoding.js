const WEBM_MIME_TYPE = "video/webm";
const WEBM_TIMECODE_SCALE_NS = 1000000;
const APP_NAME = "CPNN Videography";
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

const textEncoder = new TextEncoder();

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

function buildWebMFile({ width, height, fps, codecId, durationMs, chunks }) {
  const header = buildEbmlHeader();
  const info = buildSegmentInfo(durationMs);
  const tracks = buildVideoTracks({ width, height, fps, codecId });
  const clusters = buildClusters(chunks);
  const segment = createMasterElement("18538067", [info, tracks, ...clusters]);

  return concatBytes([header, segment]);
}

function buildEbmlHeader() {
  return createMasterElement("1A45DFA3", [
    createUnsignedIntElement("4286", 1),
    createUnsignedIntElement("42F7", 1),
    createUnsignedIntElement("42F2", 4),
    createUnsignedIntElement("42F3", 8),
    createStringElement("4282", "webm"),
    createUnsignedIntElement("4287", 4),
    createUnsignedIntElement("4285", 2),
  ]);
}

function buildSegmentInfo(durationMs) {
  return createMasterElement("1549A966", [
    createUnsignedIntElement("2AD7B1", WEBM_TIMECODE_SCALE_NS),
    createFloatElement("4489", Math.max(0, durationMs)),
    createStringElement("4D80", APP_NAME),
    createStringElement("5741", APP_NAME),
  ]);
}

function buildVideoTracks({ width, height, fps, codecId }) {
  const defaultDurationNs = Math.max(1, Math.round(1000000000 / fps));

  return createMasterElement("1654AE6B", [
    createMasterElement("AE", [
      createUnsignedIntElement("D7", 1),
      createUnsignedIntElement("73C5", 1),
      createUnsignedIntElement("83", 1),
      createUnsignedIntElement("9C", 0),
      createUnsignedIntElement("23E383", defaultDurationNs),
      createStringElement("86", codecId),
      createMasterElement("E0", [
        createUnsignedIntElement("B0", width),
        createUnsignedIntElement("BA", height),
      ]),
    ]),
  ]);
}

function buildClusters(chunks) {
  const clusters = [];
  let currentClusterStartMs = null;
  let currentBlocks = [];

  const flushCluster = () => {
    if (currentClusterStartMs === null || currentBlocks.length === 0) return;
    clusters.push(
      createMasterElement("1F43B675", [
        createUnsignedIntElement("E7", currentClusterStartMs),
        ...currentBlocks,
      ]),
    );
    currentClusterStartMs = null;
    currentBlocks = [];
  };

  for (const chunk of chunks) {
    const timestampMs = Math.round((chunk.timestamp ?? 0) / 1000);
    const shouldStartCluster =
      currentClusterStartMs === null ||
      chunk.type === "key" ||
      timestampMs - currentClusterStartMs > 30000;

    if (shouldStartCluster) {
      flushCluster();
      currentClusterStartMs = timestampMs;
    }

    const relativeTimecode = timestampMs - currentClusterStartMs;
    currentBlocks.push(createSimpleBlock(chunk, relativeTimecode));
  }

  flushCluster();
  return clusters;
}

function createSimpleBlock(chunk, timecode) {
  const flags = chunk.type === "key" ? 0x80 : 0x00;
  const blockData = concatBytes([
    encodeVintValue(1),
    encodeSignedInt16(timecode),
    Uint8Array.of(flags),
    chunk.data,
  ]);

  return createBinaryElement("A3", blockData);
}

function createMasterElement(idHex, children) {
  return createElement(idHex, concatBytes(children));
}

function createUnsignedIntElement(idHex, value) {
  return createElement(idHex, encodeUnsignedInt(value));
}

function createFloatElement(idHex, value) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  return createElement(idHex, new Uint8Array(buffer));
}

function createStringElement(idHex, value) {
  return createElement(idHex, textEncoder.encode(value));
}

function createBinaryElement(idHex, value) {
  return createElement(idHex, value);
}

function createElement(idHex, payload) {
  return concatBytes([hexToBytes(idHex), encodeVintSize(payload.length), payload]);
}

function encodeUnsignedInt(value) {
  let remaining = BigInt(Math.max(0, Math.round(value)));
  const bytes = [];

  do {
    bytes.unshift(Number(remaining & 0xffn));
    remaining >>= 8n;
  } while (remaining > 0n);

  return Uint8Array.from(bytes);
}

function encodeSignedInt16(value) {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setInt16(0, clamp(value, -32768, 32767), false);
  return new Uint8Array(buffer);
}

function encodeVintSize(value) {
  return encodeVintValue(value, true);
}

function encodeVintValue(value, reserveAllOnes = false) {
  const numericValue = BigInt(Math.max(0, Math.round(value)));

  for (let width = 1; width <= 8; width += 1) {
    const maxValue = (1n << BigInt(width * 7)) - (reserveAllOnes ? 2n : 1n);
    if (numericValue > maxValue) continue;

    const bytes = new Uint8Array(width);
    let remaining = numericValue;

    for (let index = width - 1; index >= 0; index -= 1) {
      bytes[index] = Number(remaining & 0xffn);
      remaining >>= 8n;
    }

    bytes[0] |= 1 << (8 - width);
    return bytes;
  }

  throw new Error("EBML integer is too large.");
}

function hexToBytes(value) {
  const pairs = value.match(/.{1,2}/g) ?? [];
  return Uint8Array.from(pairs.map((pair) => Number.parseInt(pair, 16)));
}

function concatBytes(parts) {
  const totalLength = parts.reduce((sum, part) => sum + (part?.length ?? 0), 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    if (!part?.length) continue;
    merged.set(part, offset);
    offset += part.length;
  }

  return merged;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
