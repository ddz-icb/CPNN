const integerFormatter = new Intl.NumberFormat();
const decimalFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export function formatStatisticInteger(value) {
  return integerFormatter.format(value);
}

export function formatStatisticDecimal(value) {
  return decimalFormatter.format(value);
}

export function formatStatisticPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  const digits = value > 0 && value < 0.01 ? 2 : 1;
  return `${(value * 100).toFixed(digits)}%`;
}
