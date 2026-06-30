import log from "../../../adapters/logging/logger.js";
import {
  OMNI_PATH_API_BASE_URL,
  OMNI_PATH_DEFAULT_ORGANISM_ID,
  OMNI_PATH_ENZ_SUB_PATH,
  OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT,
  OMNI_PATH_MIN_CURATION_EFFORT_MAX,
  OMNI_PATH_MIN_CURATION_EFFORT_MIN,
  OMNI_PATH_SUBSTRATE_CHUNK_SIZE,
} from "./omniPathConfig.js";
import { chunkArray, normalizeProteinId } from "./stringDbHelpers.js";

const PHOSPHORYLATION_MODIFICATION = "phosphorylation";
const DEPHOSPHORYLATION_MODIFICATION = "dephosphorylation";
const ENZ_SUB_FIELDS = ["sources", "references", "curation_effort"];
const PHOSPHATASE_RESOURCE = "DEPOD";

function parseTsvRows(text, requiredHeaders = []) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split("\t");
  if (requiredHeaders.some((header) => !headers.includes(header))) {
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

function hasModification(record, expectedModification) {
  const recordModification = String(record?.modification ?? "").trim().toLowerCase();
  return !recordModification || recordModification === expectedModification;
}

export function clampMinCurationEffort(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT;
  return Math.min(Math.max(Math.floor(parsed), OMNI_PATH_MIN_CURATION_EFFORT_MIN), OMNI_PATH_MIN_CURATION_EFFORT_MAX);
}

function hasEnoughCurationEffort(record, minCurationEffort) {
  const curationEffort = Number(record?.curation_effort);
  return Number.isFinite(curationEffort) ? curationEffort >= minCurationEffort : minCurationEffort <= 0;
}

function buildEnzSubUrl(substrateIds, organismId, options = {}) {
  const params = new URLSearchParams({
    genesymbols: "0",
    organisms: String(organismId),
    fields: ENZ_SUB_FIELDS.join(","),
    substrates: substrateIds.join(","),
    types: options.modification,
  });

  if (options.resources) {
    params.set("resources", options.resources);
  }

  return `${OMNI_PATH_API_BASE_URL}${OMNI_PATH_ENZ_SUB_PATH}?${params.toString()}`;
}

async function fetchKinaseSubstrateInteractionsChunk(substrateIds, organismId) {
  const url = buildEnzSubUrl(substrateIds, organismId, { modification: PHOSPHORYLATION_MODIFICATION });
  log.debug(`Fetching OmniPath enz_sub for ${substrateIds.length} substrate id(s), organism ${organismId}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath enz_sub request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text, ["enzyme", "substrate"]);
  log.debug(`OmniPath enz_sub returned ${rows.length} row(s) for ${substrateIds.length} substrate id(s)`);
  return rows;
}

async function fetchPhosphataseSubstrateInteractionsChunk(substrateIds, organismId) {
  const url = buildEnzSubUrl(substrateIds, organismId, {
    modification: DEPHOSPHORYLATION_MODIFICATION,
    resources: PHOSPHATASE_RESOURCE,
  });
  log.debug(`Fetching OmniPath DEPOD enz_sub for ${substrateIds.length} substrate id(s), organism ${organismId}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath phosphatase enz_sub request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text, ["enzyme", "substrate"]);
  log.debug(`OmniPath DEPOD enz_sub returned ${rows.length} row(s) for ${substrateIds.length} substrate id(s)`);
  return rows;
}

export async function fetchKinaseSubstrateInteractions(substrateIds, options = {}) {
  const uniqueSubstrateIds = Array.from(new Set(substrateIds.map((id) => normalizeProteinId(id)).filter(Boolean)));
  if (uniqueSubstrateIds.length === 0) return [];

  const organismId = options.organismId ?? OMNI_PATH_DEFAULT_ORGANISM_ID;
  const minCurationEffort = clampMinCurationEffort(options.minCurationEffort);
  const substrateChunks = chunkArray(uniqueSubstrateIds, OMNI_PATH_SUBSTRATE_CHUNK_SIZE);
  const rows = [];

  for (const substrateChunk of substrateChunks) {
    const chunkRows = await fetchKinaseSubstrateInteractionsChunk(substrateChunk, organismId);
    rows.push(...chunkRows);
  }

  return rows.filter(
    (record) => hasModification(record, PHOSPHORYLATION_MODIFICATION) && hasEnoughCurationEffort(record, minCurationEffort),
  );
}

export async function fetchPhosphataseSubstrateInteractions(substrateIds, options = {}) {
  const uniqueSubstrateIds = Array.from(new Set(substrateIds.map((id) => normalizeProteinId(id)).filter(Boolean)));
  if (uniqueSubstrateIds.length === 0) return [];

  const organismId = options.organismId ?? OMNI_PATH_DEFAULT_ORGANISM_ID;
  const minCurationEffort = clampMinCurationEffort(options.minCurationEffort);
  const substrateChunks = chunkArray(uniqueSubstrateIds, OMNI_PATH_SUBSTRATE_CHUNK_SIZE);
  const rows = [];

  for (const substrateChunk of substrateChunks) {
    const chunkRows = await fetchPhosphataseSubstrateInteractionsChunk(substrateChunk, organismId);
    rows.push(...chunkRows);
  }

  return rows.filter(
    (record) => hasModification(record, DEPHOSPHORYLATION_MODIFICATION) && hasEnoughCurationEffort(record, minCurationEffort),
  );
}
