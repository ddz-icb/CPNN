import { DEFAULT_MIN_CONFIDENCE, MIN_CONFIDENCE, MAX_CONFIDENCE } from "./stringDbConfig.js";

export function clampConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_CONFIDENCE;
  return Math.min(Math.max(parsed, MIN_CONFIDENCE), MAX_CONFIDENCE);
}

export function normalizeProteinId(value) {
  return String(value ?? "")
    .trim()
    .split("-")[0]
    .trim();
}

export function cloneLink(link) {
  return {
    ...link,
    weights: Array.isArray(link.weights) ? [...link.weights] : [],
    attribs: Array.isArray(link.attribs) ? [...link.attribs] : [],
  };
}

export function getEdgeKey(source, target) {
  return source < target ? `${source}---${target}` : `${target}---${source}`;
}

export function chunkArray(items, chunkSize) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length <= chunkSize) return [items];

  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function deduplicateInteractions(interactions) {
  const byPair = new Map();

  interactions.forEach((interaction) => {
    const source = String(interaction?.stringId_A ?? "").trim();
    const target = String(interaction?.stringId_B ?? "").trim();
    if (!source || !target || source === target) return;

    const key = getEdgeKey(source, target);
    const existing = byPair.get(key);
    if (!existing) {
      byPair.set(key, interaction);
      return;
    }

    const currentScore = Number(existing?.score);
    const nextScore = Number(interaction?.score);
    if (Number.isFinite(nextScore) && (!Number.isFinite(currentScore) || nextScore > currentScore)) {
      byPair.set(key, interaction);
    }
  });

  return Array.from(byPair.values());
}

export function buildCacheKey(proteinIds, minConfidence, speciesId) {
  return `${speciesId}::${minConfidence.toFixed(3)}::${proteinIds.sort((a, b) => a.localeCompare(b)).join("|")}`;
}
