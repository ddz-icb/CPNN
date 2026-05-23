import log from "../../../adapters/logging/logger.js";
import {
  OMNI_PATH_ANNOTATIONS_PATH,
  OMNI_PATH_API_BASE_URL,
  OMNI_PATH_DEFAULT_ORGANISM_ID,
  OMNI_PATH_ENZ_SUB_PATH,
  OMNI_PATH_INTERCELL_PATH,
  OMNI_PATH_INTERACTIONS_PATH,
  OMNI_PATH_MIN_CURATION_EFFORT_DEFAULT,
  OMNI_PATH_MIN_CURATION_EFFORT_MAX,
  OMNI_PATH_MIN_CURATION_EFFORT_MIN,
  OMNI_PATH_NODE_ANNOTATION_CHUNK_SIZE,
  OMNI_PATH_NODE_ANNOTATION_MODE_BOTH,
  OMNI_PATH_NODE_ANNOTATION_MODE_DEFAULT,
  OMNI_PATH_NODE_ANNOTATION_MODE_INTERCELL,
  OMNI_PATH_NODE_ANNOTATION_MODE_OPTIONS,
  OMNI_PATH_NODE_ANNOTATION_MODE_PATHWAYS,
  OMNI_PATH_PARTNER_CHUNK_SIZE,
  OMNI_PATH_SUBSTRATE_CHUNK_SIZE,
} from "./omniPathConfig.js";
import { chunkArray, normalizeProteinId } from "./stringDbHelpers.js";

const PHOSPHORYLATION_MODIFICATION = "phosphorylation";
const ENZ_SUB_FIELDS = ["sources", "references", "curation_effort"];
const PHOSPHATASE_INTERACTION_FIELDS = ["sources", "references", "curation_effort"];
const PHOSPHATASE_RESOURCE = "DEPOD";
const PATHWAY_ANNOTATION_DATABASES = ["SignaLink_pathway"];
const PATHWAY_ATTRIBUTE_PREFIX = "Pathway";
const INTERCELL_ATTRIBUTE_PREFIX = "Intercell";
const INTERCELL_SOURCE = "composite";
const INTERCELL_SCOPE = "generic";
const INTERCELL_ASPECT = "functional";
const NODE_ANNOTATION_MODE_VALUES = new Set(OMNI_PATH_NODE_ANNOTATION_MODE_OPTIONS.map((option) => option.value));

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

function isPhosphorylationRecord(record) {
  const modification = String(record?.modification ?? "").trim().toLowerCase();
  return !modification || modification === PHOSPHORYLATION_MODIFICATION;
}

export function normalizeNodeAnnotationMode(value) {
  return NODE_ANNOTATION_MODE_VALUES.has(value) ? value : OMNI_PATH_NODE_ANNOTATION_MODE_DEFAULT;
}

function shouldFetchPathwayAnnotations(mode) {
  return mode === OMNI_PATH_NODE_ANNOTATION_MODE_PATHWAYS || mode === OMNI_PATH_NODE_ANNOTATION_MODE_BOTH;
}

function shouldFetchIntercellAnnotations(mode) {
  return mode === OMNI_PATH_NODE_ANNOTATION_MODE_INTERCELL || mode === OMNI_PATH_NODE_ANNOTATION_MODE_BOTH;
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

function buildInteractionsUrl(partnerIds, organismId) {
  const params = new URLSearchParams({
    genesymbols: "0",
    organisms: String(organismId),
    resources: PHOSPHATASE_RESOURCE,
    partners: partnerIds.join(","),
    fields: PHOSPHATASE_INTERACTION_FIELDS.join(","),
  });

  return `${OMNI_PATH_API_BASE_URL}${OMNI_PATH_INTERACTIONS_PATH}?${params.toString()}`;
}

function buildAnnotationsUrl(proteinIds) {
  const params = new URLSearchParams({
    proteins: proteinIds.join(","),
    databases: PATHWAY_ANNOTATION_DATABASES.join(","),
  });

  return `${OMNI_PATH_API_BASE_URL}${OMNI_PATH_ANNOTATIONS_PATH}?${params.toString()}`;
}

function buildIntercellUrl(proteinIds) {
  const params = new URLSearchParams({
    proteins: proteinIds.join(","),
    source: INTERCELL_SOURCE,
    scope: INTERCELL_SCOPE,
    aspect: INTERCELL_ASPECT,
  });

  return `${OMNI_PATH_API_BASE_URL}${OMNI_PATH_INTERCELL_PATH}?${params.toString()}`;
}

function formatAnnotationValue(value) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNodeAnnotation(proteinId, attrib) {
  const normalizedProteinId = normalizeProteinId(proteinId);
  const normalizedAttrib = formatAnnotationValue(attrib);
  if (!normalizedProteinId || !normalizedAttrib || normalizedAttrib === "-") return null;
  return { proteinId: normalizedProteinId, attrib: normalizedAttrib };
}

function mapPathwayAnnotationRow(record) {
  const label = String(record?.label ?? "").trim().toLowerCase();
  if (label !== "pathway") return null;
  const pathway = formatAnnotationValue(record?.value);
  if (!pathway || pathway === "-") return null;
  return buildNodeAnnotation(record?.uniprot, `${PATHWAY_ATTRIBUTE_PREFIX}: ${pathway}`);
}

function mapIntercellAnnotationRow(record) {
  const aspect = String(record?.aspect ?? "").trim().toLowerCase();
  if (aspect && aspect !== INTERCELL_ASPECT) return null;
  const category = formatAnnotationValue(record?.category);
  if (!category || category === "-") return null;
  return buildNodeAnnotation(record?.uniprot, `${INTERCELL_ATTRIBUTE_PREFIX}: ${category}`);
}

function deduplicateNodeAnnotations(annotations) {
  const seen = new Set();
  const deduplicated = [];

  annotations.forEach((annotation) => {
    if (!annotation?.proteinId || !annotation?.attrib) return;
    const key = `${annotation.proteinId}::${annotation.attrib}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduplicated.push(annotation);
  });

  return deduplicated;
}

async function fetchKinaseSubstrateInteractionsChunk(substrateIds, organismId) {
  const url = buildEnzSubUrl(substrateIds, organismId);
  log.debug(`Fetching OmniPath enz_sub for ${substrateIds.length} substrate id(s), organism ${organismId}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath enz_sub request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text, ["enzyme", "substrate"]);
  log.debug(`OmniPath enz_sub returned ${rows.length} row(s) for ${substrateIds.length} substrate id(s)`);
  return rows;
}

async function fetchPhosphataseInteractionsChunk(partnerIds, organismId) {
  const url = buildInteractionsUrl(partnerIds, organismId);
  log.debug(`Fetching OmniPath DEPOD interactions for ${partnerIds.length} graph protein id(s), organism ${organismId}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath phosphatase interaction request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text, ["source", "target"]);
  log.debug(`OmniPath DEPOD interactions returned ${rows.length} row(s) for ${partnerIds.length} graph protein id(s)`);
  return rows;
}

async function fetchPathwayAnnotationsChunk(proteinIds) {
  const url = buildAnnotationsUrl(proteinIds);
  log.debug(`Fetching OmniPath pathway annotations for ${proteinIds.length} protein id(s)`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath annotation request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text, ["uniprot", "label", "value"]);
  log.debug(`OmniPath pathway annotations returned ${rows.length} row(s) for ${proteinIds.length} protein id(s)`);
  return rows.map(mapPathwayAnnotationRow).filter(Boolean);
}

async function fetchIntercellAnnotationsChunk(proteinIds) {
  const url = buildIntercellUrl(proteinIds);
  log.debug(`Fetching OmniPath intercell annotations for ${proteinIds.length} protein id(s)`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OmniPath intercell request failed (HTTP ${response.status})`);

  const text = await response.text();
  const rows = parseTsvRows(text, ["uniprot", "category", "aspect"]);
  log.debug(`OmniPath intercell annotations returned ${rows.length} row(s) for ${proteinIds.length} protein id(s)`);
  return rows.map(mapIntercellAnnotationRow).filter(Boolean);
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

  return rows.filter((record) => isPhosphorylationRecord(record) && hasEnoughCurationEffort(record, minCurationEffort));
}

export async function fetchPhosphataseSubstrateInteractions(proteinIds, options = {}) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((id) => normalizeProteinId(id)).filter(Boolean)));
  if (uniqueProteinIds.length === 0) return [];

  const organismId = options.organismId ?? OMNI_PATH_DEFAULT_ORGANISM_ID;
  const minCurationEffort = clampMinCurationEffort(options.minCurationEffort);
  const partnerChunks = chunkArray(uniqueProteinIds, OMNI_PATH_PARTNER_CHUNK_SIZE);
  const rows = [];

  for (const partnerChunk of partnerChunks) {
    const chunkRows = await fetchPhosphataseInteractionsChunk(partnerChunk, organismId);
    rows.push(...chunkRows);
  }

  return rows.filter((record) => hasEnoughCurationEffort(record, minCurationEffort));
}

export async function fetchOmniPathNodeAnnotations(proteinIds, options = {}) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((id) => normalizeProteinId(id)).filter(Boolean)));
  if (uniqueProteinIds.length === 0) return [];

  const mode = normalizeNodeAnnotationMode(options.mode);
  const proteinChunks = chunkArray(uniqueProteinIds, OMNI_PATH_NODE_ANNOTATION_CHUNK_SIZE);
  const annotations = [];

  for (const proteinChunk of proteinChunks) {
    if (shouldFetchPathwayAnnotations(mode)) {
      annotations.push(...(await fetchPathwayAnnotationsChunk(proteinChunk)));
    }

    if (shouldFetchIntercellAnnotations(mode)) {
      annotations.push(...(await fetchIntercellAnnotationsChunk(proteinChunk)));
    }
  }

  return deduplicateNodeAnnotations(annotations);
}
