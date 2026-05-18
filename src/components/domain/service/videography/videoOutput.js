import { getFileNameWithoutExtension } from "../parsing/fileParsing.js";
import {
  RECORDER_MP4_MIME_TYPES,
  RECORDER_WEBM_MIME_TYPES,
  VIDEO_EXPORT_FORMAT_MP4,
  VIDEO_EXPORT_FORMAT_WEBM,
} from "./videoExportConfig.js";

export function getSupportedRecorderMimeType(format = VIDEO_EXPORT_FORMAT_WEBM) {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  return getRecorderMimeTypeCandidates(format).find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function getVideoExtension(mimeType) {
  return mimeType?.includes("mp4") ? "mp4" : "webm";
}

export function buildTrackingShotFilename(graphName, extension) {
  return `${getFileNameWithoutExtension(graphName ?? "graph")}_tracking_shot.${extension}`;
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getRecorderMimeTypeCandidates(format) {
  if (format === VIDEO_EXPORT_FORMAT_MP4) return RECORDER_MP4_MIME_TYPES;
  return RECORDER_WEBM_MIME_TYPES;
}
