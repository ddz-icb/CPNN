import {
  DEFAULT_GROUP_ENRICHMENT_MAX_FDR,
  DEFAULT_MIN_CONFIDENCE,
  DEFAULT_MIN_EVIDENCE_SCORE,
  MAX_CONFIDENCE,
  MAX_EVIDENCE_SCORE,
  MAX_GROUP_ENRICHMENT_MAX_FDR,
  MIN_CONFIDENCE,
  MIN_EVIDENCE_SCORE,
  MIN_GROUP_ENRICHMENT_MAX_FDR,
} from "./stringDbConfig.js";
import { getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";

export function clampConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_CONFIDENCE;
  return Math.min(Math.max(parsed, MIN_CONFIDENCE), MAX_CONFIDENCE);
}

export function clampEvidenceScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_EVIDENCE_SCORE;
  return Math.min(Math.max(parsed, MIN_EVIDENCE_SCORE), MAX_EVIDENCE_SCORE);
}

export function clampGroupEnrichmentMaxFdr(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_GROUP_ENRICHMENT_MAX_FDR;
  return Math.min(Math.max(parsed, MIN_GROUP_ENRICHMENT_MAX_FDR), MAX_GROUP_ENRICHMENT_MAX_FDR);
}

export function normalizeProteinId(value) {
  return String(value ?? "")
    .trim()
    .split("-")[0]
    .trim();
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

    const key = getUndirectedLinkKey(source, target);
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
