function roundNumber(value) {
  return Number(value.toPrecision(12));
}

function getNiceStep(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function getLinkThresholdBounds(dataMax, fallbackMax = 0.7) {
  const min = 0;
  const safeMax = Number.isFinite(dataMax) ? dataMax : fallbackMax;
  const unalignedMax = Math.max(1, Math.ceil(safeMax));
  const step = roundNumber(getNiceStep(unalignedMax / 100));
  const max = roundNumber(Math.ceil(unalignedMax / step) * step);

  return { min, max, step };
}

export function roundUpLinkThreshold(value, { min, max, step }) {
  const clampedValue = Math.min(max, Math.max(min, value));
  return roundNumber(min + Math.ceil((clampedValue - min) / step) * step);
}
