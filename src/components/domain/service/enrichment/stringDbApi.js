import axios from "axios";

import log from "../../../adapters/logging/logger.js";
import {
  GROUP_ENRICHMENT_MAX_GROUPS,
  GROUP_ENRICHMENT_MIN_PROTEINS,
  IDENTIFIER_MAPPING_CHUNK_SIZE,
  STRING_DB_BASE_URL,
  STRING_DB_CALLER_ID,
  NETWORK_CHUNK_SIZE,
  DEFAULT_SPECIES_ID,
} from "./stringDbConfig.js";
import {
  clampGroupEnrichmentMaxFdr,
  clampConfidence,
  clampNodeAttributeMaxTerms,
  chunkArray,
  deduplicateInteractions,
  getStringDbCategoryAttributeLabel,
  matchesStringDbCategory,
  normalizeProteinId,
  normalizeStringDbCategory,
} from "./stringDbHelpers.js";

const MAX_NODE_ANNOTATION_LABEL_LENGTH = 52;
const MAX_COMMUNITY_ANNOTATION_LABEL_LENGTH = 48;

function logRequestIssue(source, identifier, error) {
  if (!axios.isAxiosError(error)) {
    log.warn(`${source} request failed for ${identifier}`);
    return;
  }

  if (error.code === "ERR_CANCELED") return;

  const status = error.response?.status;
  if (status === 404) {
    log.debug(`${source} entry not found for ${identifier}`);
    return;
  }

  log.warn(`${source} request failed for ${identifier}${status ? ` (HTTP ${status})` : ""}`);
}

function isHttpStatus(error, status) {
  return axios.isAxiosError(error) && error.response?.status === status;
}

async function fetchStringDbData(method, params, requestLabel) {
  try {
    log.debug(`Fetching STRING-DB ${method} for ${requestLabel}`);
    const body = new URLSearchParams(params);
    const response = await axios.post(`${STRING_DB_BASE_URL}/${method}`, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const rows = Array.isArray(response.data) ? response.data : [];
    log.debug(`STRING-DB ${method} returned ${rows.length} record(s) for ${requestLabel}`);
    return rows;
  } catch (error) {
    if (isHttpStatus(error, 404)) {
      log.debug(`STRING-DB ${method}: no identifiers matched for ${requestLabel}`);
      return [];
    }
    logRequestIssue("STRING-DB", `${method} (${requestLabel})`, error);
    throw error;
  }
}

async function fetchNetworkInteractionsChunk(proteinIds, minConfidence, speciesId) {
  if (proteinIds.length < 2) return [];

  const requiredScore = clampConfidence(minConfidence);
  return fetchStringDbData(
    "network",
    {
      identifiers: proteinIds.join("\r"),
      species: speciesId,
      show_query_node_labels: "1",
      caller_identity: STRING_DB_CALLER_ID,
      required_score: String(requiredScore),
    },
    `${proteinIds.length} UniProt id(s), species ${speciesId}, min confidence ${requiredScore}`,
  );
}

async function fetchIdentifierMappingsChunk(proteinIds, speciesId) {
  if (proteinIds.length === 0) return [];

  return fetchStringDbData(
    "get_string_ids",
    {
      identifiers: proteinIds.join("\r"),
      species: speciesId,
      caller_identity: STRING_DB_CALLER_ID,
      echo_query: "1",
    },
    `${proteinIds.length} UniProt id(s), species ${speciesId}`,
  );
}

async function fetchFunctionalEnrichmentChunk(proteinIds, speciesId) {
  if (proteinIds.length < GROUP_ENRICHMENT_MIN_PROTEINS) return [];

  return fetchStringDbData(
    "enrichment",
    {
      identifiers: proteinIds.join("\r"),
      species: speciesId,
      caller_identity: STRING_DB_CALLER_ID,
    },
    `${proteinIds.length} UniProt id(s), species ${speciesId}`,
  );
}

function formatTermDescription(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenText(value, maxLength) {
  const description = formatTermDescription(value);
  if (!description || maxLength <= 0) return "";
  if (description.length <= maxLength) return description;
  const sliceLength = Math.max(1, maxLength - 3);
  return `${description.slice(0, sliceLength).trim()}...`;
}

function buildNodeAnnotationAttrib(category, description) {
  const prefix = category ? `${category}: ` : "";
  const shortDescription = shortenText(description, MAX_NODE_ANNOTATION_LABEL_LENGTH - prefix.length);
  return shortDescription ? `${prefix}${shortDescription}` : "";
}

function buildCommunityAttrib(description) {
  const prefix = "Community: ";
  const shortDescription = shortenText(description, MAX_COMMUNITY_ANNOTATION_LABEL_LENGTH - prefix.length);
  return shortDescription ? `${prefix}${shortDescription}` : "";
}

function buildIdentifierMappingLookups(proteinIds, mappings) {
  const proteinIdLookup = new Map();
  proteinIds.forEach((proteinId) => {
    const normalizedProteinId = normalizeProteinId(proteinId);
    if (!normalizedProteinId) return;
    proteinIdLookup.set(normalizedProteinId.toUpperCase(), normalizedProteinId);
  });

  const preferredNameToProteinIds = new Map();
  mappings.forEach((mapping) => {
    const proteinId = normalizeProteinId(mapping?.queryItem);
    const preferredName = String(mapping?.preferredName ?? "").trim();
    if (!proteinId || !preferredName) return;
    const key = preferredName.toUpperCase();
    if (!preferredNameToProteinIds.has(key)) {
      preferredNameToProteinIds.set(key, new Set());
    }
    preferredNameToProteinIds.get(key).add(proteinId);
  });

  return { proteinIdLookup, preferredNameToProteinIds };
}

function resolveAnnotationProteinIds(record, proteinIdLookup, preferredNameToProteinIds) {
  const proteinIds = new Set();
  const inputGenes = Array.isArray(record?.inputGenes) ? record.inputGenes : [];
  const preferredNames = Array.isArray(record?.preferredNames) ? record.preferredNames : [];

  inputGenes.forEach((inputGene) => {
    const normalized = normalizeProteinId(inputGene);
    const directProteinId = normalized ? proteinIdLookup.get(normalized.toUpperCase()) : null;
    if (directProteinId) {
      proteinIds.add(directProteinId);
      return;
    }

    const preferredMatches = preferredNameToProteinIds.get(String(inputGene ?? "").trim().toUpperCase());
    preferredMatches?.forEach((proteinId) => proteinIds.add(proteinId));
  });

  if (proteinIds.size > 0) return Array.from(proteinIds);

  preferredNames.forEach((preferredName) => {
    const preferredMatches = preferredNameToProteinIds.get(String(preferredName ?? "").trim().toUpperCase());
    preferredMatches?.forEach((proteinId) => proteinIds.add(proteinId));
  });

  return Array.from(proteinIds);
}

function mapFunctionalEnrichmentRowsToAnnotations(rows, proteinIds, mappings, options = {}) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean)));
  const { proteinIdLookup, preferredNameToProteinIds } = buildIdentifierMappingLookups(uniqueProteinIds, mappings);
  const maxTerms = clampNodeAttributeMaxTerms(options.maxTerms);
  const maxFdr = clampGroupEnrichmentMaxFdr(options.maxFdr);
  const category = normalizeStringDbCategory(options.category);
  const annotations = [];
  let selectedTermCount = 0;

  for (const record of rows) {
    if (selectedTermCount >= maxTerms) break;
    if (!matchesStringDbCategory(record?.category, category)) continue;

    const fdr = Number(record?.fdr);
    const description = formatTermDescription(record?.description);
    if (!Number.isFinite(fdr) || fdr > maxFdr || !description) continue;

    const resolvedProteinIds = new Set(resolveAnnotationProteinIds(record, proteinIdLookup, preferredNameToProteinIds));
    if (resolvedProteinIds.size === 0) continue;

    const attrib = buildNodeAnnotationAttrib(getStringDbCategoryAttributeLabel(record?.category), description);
    if (!attrib) continue;

    selectedTermCount += 1;
    annotations.push(...Array.from(resolvedProteinIds, (proteinId) => ({ proteinId, attrib })));
  }

  return annotations;
}

function selectFirstEnrichmentTerm(rows, maxFdr) {
  for (const record of rows) {
    const fdr = Number(record?.fdr);
    const description = formatTermDescription(record?.description);
    if (!Number.isFinite(fdr) || fdr > maxFdr || !description) continue;

    return {
      category: record.category,
      term: record.term,
      description,
      fdr,
      attrib: buildCommunityAttrib(description),
    };
  }

  return null;
}

export async function fetchNetworkInteractions(proteinIds, minConfidence, speciesId = DEFAULT_SPECIES_ID) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean)));
  if (uniqueProteinIds.length < 2) return [];

  try {
    return await fetchNetworkInteractionsChunk(uniqueProteinIds, minConfidence, speciesId);
  } catch (error) {
    if (!isHttpStatus(error, 400) || uniqueProteinIds.length <= NETWORK_CHUNK_SIZE) {
      throw error;
    }

    const idChunks = chunkArray(uniqueProteinIds, NETWORK_CHUNK_SIZE);
    log.info(`STRING-DB network request too large. Retrying in ${idChunks.length} chunk(s) for species ${speciesId}.`);

    const combinedInteractions = [];
    for (let i = 0; i < idChunks.length; i++) {
      for (let j = i; j < idChunks.length; j++) {
        const requestIds = i === j ? idChunks[i] : [...idChunks[i], ...idChunks[j]];
        const interactions = await fetchNetworkInteractionsChunk(requestIds, minConfidence, speciesId);
        combinedInteractions.push(...interactions);
      }
    }

    return deduplicateInteractions(combinedInteractions);
  }
}

export async function fetchFunctionalEnrichmentAnnotations(proteinIds, options = {}) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean)));
  if (uniqueProteinIds.length < GROUP_ENRICHMENT_MIN_PROTEINS) return [];

  const speciesId = options.speciesId ?? DEFAULT_SPECIES_ID;
  const maxTerms = clampNodeAttributeMaxTerms(options.maxTerms);
  const maxFdr = clampGroupEnrichmentMaxFdr(options.maxFdr);
  const category = normalizeStringDbCategory(options.category);
  const mappingChunks = chunkArray(uniqueProteinIds, IDENTIFIER_MAPPING_CHUNK_SIZE);
  const rows = await fetchFunctionalEnrichmentChunk(uniqueProteinIds, speciesId);
  const mappings = [];

  for (const mappingChunk of mappingChunks) {
    mappings.push(...(await fetchIdentifierMappingsChunk(mappingChunk, speciesId)));
  }

  return mapFunctionalEnrichmentRowsToAnnotations(rows, uniqueProteinIds, mappings, { maxTerms, maxFdr, category });
}

export async function fetchFunctionalEnrichmentLabels(groups, options = {}) {
  const speciesId = options.speciesId ?? DEFAULT_SPECIES_ID;
  const maxFdr = clampGroupEnrichmentMaxFdr(options.maxFdr);
  const eligibleGroups = groups
    .map((group) => ({
      ...group,
      proteinIds: Array.from(new Set((group.proteinIds ?? []).map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean))),
    }))
    .filter((group) => group.groupId != null && group.proteinIds.length >= GROUP_ENRICHMENT_MIN_PROTEINS)
    .sort((a, b) => {
      if (b.proteinIds.length !== a.proteinIds.length) return b.proteinIds.length - a.proteinIds.length;
      return String(a.groupId).localeCompare(String(b.groupId));
    })
    .slice(0, GROUP_ENRICHMENT_MAX_GROUPS);

  const labels = [];
  for (const group of eligibleGroups) {
    const rows = await fetchFunctionalEnrichmentChunk(group.proteinIds, speciesId);
    const topTerm = selectFirstEnrichmentTerm(rows, maxFdr);
    if (!topTerm) continue;
    labels.push({
      groupId: group.groupId,
      attrib: topTerm.attrib,
      term: topTerm.term,
      category: topTerm.category,
      description: topTerm.description,
      fdr: topTerm.fdr,
    });
  }

  return labels;
}
