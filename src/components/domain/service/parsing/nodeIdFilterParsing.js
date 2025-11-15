export function parseNodeIdFilters(input) {
  if (!input) return [];

  const entries = input
    .split(/\r?\n/)
    .flatMap((line) => line.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) return [];

  const seen = new Set();
  const parsedFilters = [];

  entries.forEach((value) => {
    const normalizedValue = value.toLowerCase();
    if (seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    parsedFilters.push({ value, normalizedValue });
  });

  return parsedFilters;
}
