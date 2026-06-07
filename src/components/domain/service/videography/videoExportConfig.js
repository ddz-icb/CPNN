export const VIEW_MODE_2D = "2d";
export const VIEW_MODE_3D = "3d";

export const DEFAULT_EASING = "cinematic";

export const EASING_OPTIONS = [
  { value: DEFAULT_EASING, label: "Cinematic" },
  { value: "smooth", label: "Smooth" },
  { value: "easeInOut", label: "Ease in-out" },
  { value: "linear", label: "Linear" },
];

export const CAMERA_PATH_LIMITS = {
  transitionSeconds: { min: 0.05, max: 20, step: 0.25 },
  holdSeconds: { min: 0, max: 10, step: 0.05 },
};

export const VIDEO_EXPORT_FPS = 60;
export const VIDEO_EXPORT_QUALITY_LEGACY_DEFAULT = "default";
export const VIDEO_EXPORT_QUALITY_1080P = "1080p";
export const VIDEO_EXPORT_QUALITY_MEDIUM = "medium";
export const VIDEO_EXPORT_QUALITY_HIGH = "high";
export const VIDEO_EXPORT_QUALITY_DEFAULT = VIDEO_EXPORT_QUALITY_HIGH;
export const VIDEO_EXPORT_FORMAT_MP4 = "mp4";
export const VIDEO_EXPORT_FORMAT_WEBM = "webm";

export const VIDEO_EXPORT_QUALITY_OPTIONS = [
  { value: VIDEO_EXPORT_QUALITY_1080P, label: "1080p" },
  { value: VIDEO_EXPORT_QUALITY_MEDIUM, label: "Medium (1440p)" },
  { value: VIDEO_EXPORT_QUALITY_HIGH, label: "High Quality (4K)" },
];

export const VIDEO_EXPORT_FORMAT_DEFAULT = VIDEO_EXPORT_FORMAT_WEBM;

export const VIDEO_EXPORT_FORMAT_OPTIONS = [
  { value: VIDEO_EXPORT_FORMAT_MP4, label: "MP4 (H.264)" },
  { value: VIDEO_EXPORT_FORMAT_WEBM, label: "WebM (VP9/VP8)" },
];

export const VIDEO_EXPORT_PRESETS = {
  [VIDEO_EXPORT_QUALITY_1080P]: {
    targetArea: 1920 * 1080,
    maxEdge: 1920,
    bitrateMbps: 10,
  },
  [VIDEO_EXPORT_QUALITY_MEDIUM]: {
    targetArea: 2560 * 1440,
    maxEdge: 2560,
    bitrateMbps: 16,
  },
  [VIDEO_EXPORT_QUALITY_HIGH]: {
    targetArea: 3840 * 2160,
    maxEdge: 3840,
    bitrateMbps: 32,
  },
};

export const VIDEO_KEYFRAME_INTERVAL_SECONDS = 2;
export const TRANSITION_FILTER_FADE_OUT_END = 0.6;
export const TRANSITION_FILTER_FADE_OUT_POWER = 3;
export const TRANSITION_FILTER_ALPHA_CUTOFF = 0.08;

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 50;
export const MIN_FOV = 120;
export const MAX_FOV = 2400;

export const RECORDER_MP4_MIME_TYPES = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=h264", "video/mp4"];
export const RECORDER_WEBM_MIME_TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

export function getVideoExportQualityPreset(value) {
  if (value === VIDEO_EXPORT_QUALITY_LEGACY_DEFAULT) return VIDEO_EXPORT_QUALITY_MEDIUM;
  return VIDEO_EXPORT_PRESETS[value] ? value : VIDEO_EXPORT_QUALITY_DEFAULT;
}

export function getVideoExportFormat(value) {
  return VIDEO_EXPORT_FORMAT_OPTIONS.some((option) => option.value === value) ? value : VIDEO_EXPORT_FORMAT_DEFAULT;
}

export function getVideoExportConfig(preset) {
  return VIDEO_EXPORT_PRESETS[getVideoExportQualityPreset(preset)];
}
