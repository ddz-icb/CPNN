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

export function getLinkThresholdBounds(dataMin, dataMax, fallbackMax = 0.7) {
  const min = Number.isFinite(dataMin) ? roundNumber(Math.floor(Math.max(0, dataMin) * 10 + 1e-10) / 10) : 0;
  const safeMax = Number.isFinite(dataMax) ? dataMax : fallbackMax;
  const roundedMax = roundNumber(Math.ceil(Math.max(0, safeMax) * 10 - 1e-10) / 10);
  const max = Math.max(fallbackMax, min, roundedMax);
  const step = roundNumber(getNiceStep(max / 100));

  return { min, max, step, defaultMax: max };
}

export function roundUpLinkThreshold(value, { min, max, step }) {
  const clampedValue = Math.min(max, Math.max(min, value));
  return roundNumber(min + Math.ceil((clampedValue - min) / step) * step);
}
