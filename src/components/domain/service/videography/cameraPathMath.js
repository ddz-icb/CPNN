import { DEFAULT_EASING, MAX_ZOOM, MIN_ZOOM } from "./videoExportConfig.js";

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "0";
  return Number.parseFloat(value.toFixed(digits)).toString();
}

export function radToDeg(value) {
  if (!Number.isFinite(value)) return 0;
  return (value * 180) / Math.PI;
}

export function sanitizeNumber(value, fallback, min, max) {
  const parsed = Number.parseFloat(value);
  const safeValue = Number.isFinite(parsed) ? parsed : fallback;
  return clamp(safeValue, min, max);
}

export function finiteNumberOr(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed)) return parsed;
  const fallbackParsed = Number.parseFloat(fallback);
  return Number.isFinite(fallbackParsed) ? fallbackParsed : 0;
}

export function interpolateFiniteNumber(fromValue, toValue, t, fallback = 0) {
  const from = finiteNumberOr(fromValue, fallback);
  const to = finiteNumberOr(toValue, from);
  return from + (to - from) * clamp(Number.isFinite(t) ? t : 0, 0, 1);
}

export function ease(name = DEFAULT_EASING, t) {
  const value = clamp(t, 0, 1);

  if (name === "linear") return value;
  if (name === "easeInOut") {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }
  if (name === "smooth") {
    return value * value * (3 - 2 * value);
  }

  return value * value * value * (value * (value * 6 - 15) + 10);
}

export function lerp(a, b, t) {
  return finiteOr(a, 0) + (finiteOr(b, 0) - finiteOr(a, 0)) * t;
}

export function lerpAngle(a, b, t) {
  const start = finiteOr(a, 0);
  const end = finiteOr(b, 0);
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * t;
}

export function interpolateZoom(a, b, t) {
  const start = clamp(finiteOr(a, 1), MIN_ZOOM, MAX_ZOOM);
  const end = clamp(finiteOr(b, 1), MIN_ZOOM, MAX_ZOOM);
  return start * Math.pow(end / start, t);
}

export function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
