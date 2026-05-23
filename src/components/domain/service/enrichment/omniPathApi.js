import log from "../../../adapters/logging/logger.js";
import {
  OMNI_PATH_API_BASE_URL,
  OMNI_PATH_DEFAULT_ORGANISM_ID,
  OMNI_PATH_ENZ_SUB_PATH,
  OMNI_PATH_MIN_REFERENCES_DEFAULT,
  OMNI_PATH_MIN_REFERENCES_MAX,
  OMNI_PATH_MIN_REFERENCES_MIN,
  OMNI_PATH_SUBSTRATE_CHUNK_SIZE,
} from "./omniPathConfig.js";
import { chunkArray, normalizeProteinId } from "./stringDbHelpers.js";

const PHOSPHORYLATION_MODIFICATION = "phosphorylation";
const ENZ_SUB_FIELDS = ["sources", "references", "curation_effort"];

function parseTsvRows(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split("\t");
  if (!headers.includes("enzyme") || !headers.includes("substrate")) {
    throw new Error(lines.slice(0, 3).join(" "));
  }

  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function isPhosphorylationRecord(record) {
  const modification = String(record?.modification ?? "").trim().toLowerCase();
  return !modification || modification === PHOSPHORYLATION_MODIFICATION;
}

export function clampMinReferences(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return OMNI_PATH_MIN_REFERENCES_DEFAULT;
  return Math.min(Math.max(Math.floor(parsed), OMNI_PATH_MIN_REFERENCES_MIN), OMNI_PATH_MIN_REFERENCES_MAX);
}

export function countUniqueReferences(record) {
  const references = String(record?.references ?? "")
    .split(";")
    .map((reference) => reference.trim())
    .filter(Boolean);

  const uniqueReferences = new Set();
  references.forEach((reference) => {
    const referenceId = reference.includes(":") ? reference.split(":").pop() : reference;
    const normalizedReferenceId = referenceId.trim();
    if (!normalizedReferenceId || normalizedReferenceId === "-") return;
    uniqueReferences.add(normalizedReferenceId);
  });

  return uniqueReferences.size;
}

function hasEnoughReferences(record, minReferences) {
  return countUniqueReferences(record) >= minReferences;
}

function buildEnzSubUrl(substrateIds, organismId) {
  const params = new URLSearchParams({
    genesymbols: "0",
    organisms: String(organismId),
    fields: ENZ_SUB_FIELDS.join(","),
    substrates: substrateIds.join(","),
    types: PHOSPHORYLATION_MODIFICATION,
  });

  return `${OMNI_PATH_API_BASE_URL}${OMNI_PATH_ENZ_SUB_PATH}?${params.toString()}`;
}

async function fetchKinaseSubstrateInteractionsChunk(substrateIds, organismId) {
  const url = buildEnzSubUrl(substrateIds, organismId);
  log.debug(`Fetching OmniPath enz_sub for ${substrateIds.length} substrate id(s), organism ${organismId}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath enz_sub request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text);
  log.debug(`OmniPath enz_sub returned ${rows.length} row(s) for ${substrateIds.length} substrate id(s)`);
  return rows;
}

export async function fetchKinaseSubstrateInteractions(substrateIds, options = {}) {
  const uniqueSubstrateIds = Array.from(new Set(substrateIds.map((id) => normalizeProteinId(id)).filter(Boolean)));
  if (uniqueSubstrateIds.length === 0) return [];

  const organismId = options.organismId ?? OMNI_PATH_DEFAULT_ORGANISM_ID;
  const minReferences = clampMinReferences(options.minReferences);
  const substrateChunks = chunkArray(uniqueSubstrateIds, OMNI_PATH_SUBSTRATE_CHUNK_SIZE);
  const rows = [];

  for (const substrateChunk of substrateChunks) {
    const chunkRows = await fetchKinaseSubstrateInteractionsChunk(substrateChunk, organismId);
    rows.push(...chunkRows);
  }

  return rows.filter((record) => isPhosphorylationRecord(record) && hasEnoughReferences(record, minReferences));
}
