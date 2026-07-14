import {
  DEFAULT_GROUP_ENRICHMENT_MAX_FDR,
  DEFAULT_MIN_CONFIDENCE,
  DEFAULT_MIN_EVIDENCE_SCORE,
  DEFAULT_NODE_ATTRIBUTE_MAX_TERMS,
  MAX_CONFIDENCE,
  MAX_EVIDENCE_SCORE,
  MAX_GROUP_ENRICHMENT_MAX_FDR,
  MAX_NODE_ATTRIBUTE_MAX_TERMS,
  MIN_CONFIDENCE,
  MIN_EVIDENCE_SCORE,
  MIN_GROUP_ENRICHMENT_MAX_FDR,
  MIN_NODE_ATTRIBUTE_MAX_TERMS,
  STRING_DB_CATEGORY_ALL,
  STRING_DB_ENRICHMENT_CATEGORIES,
} from "./stringDbConfig.js";
import { getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";

const categoryById = new Map(STRING_DB_ENRICHMENT_CATEGORIES.map((category) => [normalizeCategoryKey(category.id), category]));
const categoryByLabel = new Map(STRING_DB_ENRICHMENT_CATEGORIES.map((category) => [normalizeCategoryKey(category.label), category]));

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

export function clampNodeAttributeMaxTerms(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_NODE_ATTRIBUTE_MAX_TERMS;
  return Math.min(Math.max(parsed, MIN_NODE_ATTRIBUTE_MAX_TERMS), MAX_NODE_ATTRIBUTE_MAX_TERMS);
}

export function normalizeProteinId(value) {
  return String(value ?? "")
    .trim()
    .split("-")[0]
    .trim();
}

export function normalizeStringDbCategory(value) {
  const categoryKey = normalizeCategoryKey(value);
  if (!categoryKey || categoryKey === STRING_DB_CATEGORY_ALL) return STRING_DB_CATEGORY_ALL;
  return categoryById.get(categoryKey)?.id ?? categoryByLabel.get(categoryKey)?.id ?? STRING_DB_CATEGORY_ALL;
}

export function getStringDbCategoryLabel(value) {
  const categoryKey = normalizeCategoryKey(value);
  if (!categoryKey) return "";
  return categoryById.get(categoryKey)?.label ?? categoryByLabel.get(categoryKey)?.label ?? String(value).trim();
}

export function getStringDbCategoryAttributeLabel(value) {
  const categoryKey = normalizeCategoryKey(value);
  if (!categoryKey) return "";
  const category = categoryById.get(categoryKey) ?? categoryByLabel.get(categoryKey);
  return category?.attributeLabel ?? category?.label ?? String(value).trim();
}

export function matchesStringDbCategory(rowCategory, selectedCategory) {
  const normalizedSelection = normalizeStringDbCategory(selectedCategory);
  if (normalizedSelection === STRING_DB_CATEGORY_ALL) return true;
  return normalizeCategoryKey(rowCategory) === normalizeCategoryKey(normalizedSelection);
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

function normalizeCategoryKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}
