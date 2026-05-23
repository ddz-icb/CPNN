import axios from "axios";

import log from "../../../adapters/logging/logger.js";
import {
  FUNCTIONAL_ANNOTATION_CHUNK_SIZE,
  GROUP_ENRICHMENT_MAX_GROUPS,
  GROUP_ENRICHMENT_MIN_PROTEINS,
  STRING_DB_NODE_ATTRIBUTE_TYPE_CATEGORIES,
  STRING_DB_NODE_ATTRIBUTE_TYPE_DEFAULT,
  STRING_DB_NODE_ATTRIBUTE_TYPE_OPTIONS,
  STRING_DB_BASE_URL,
  STRING_DB_CALLER_ID,
  NETWORK_CHUNK_SIZE,
  DEFAULT_SPECIES_ID,
} from "./stringDbConfig.js";
import {
  clampGroupEnrichmentMaxFdr,
  clampConfidence,
  chunkArray,
  deduplicateInteractions,
  normalizeProteinId,
} from "./stringDbHelpers.js";

const FUNCTIONAL_ANNOTATION_CATEGORY_CONFIG = [
  { category: "RCTM", label: "Reactome", shortLabel: "Reactome", priority: 10 },
  { category: "KEGG", label: "KEGG", shortLabel: "KEGG", priority: 15 },
  { category: "WikiPathways", label: "WikiPathways", priority: 20 },
  { category: "Pfam", label: "Pfam", shortLabel: "Pfam", priority: 30 },
  { category: "InterPro", label: "InterPro", shortLabel: "IPR", priority: 40 },
  { category: "SMART", label: "SMART", shortLabel: "SMART", priority: 50 },
  { category: "Keyword", label: "Keyword", priority: 60 },
  { category: "Function", label: "GO Function", shortLabel: "GO-F", priority: 70 },
  { category: "Process", label: "GO Process", shortLabel: "GO-P", priority: 80 },
  { category: "Component", label: "GO Component", shortLabel: "GO-C", priority: 90 },
  { category: "COMPARTMENTS", label: "Compartment", shortLabel: "Loc", priority: 100 },
  { category: "DISEASES", label: "Disease", shortLabel: "Disease", priority: 110 },
  { category: "TISSUES", label: "Tissue", shortLabel: "Tissue", priority: 120 },
  { category: "HPO", label: "Phenotype", shortLabel: "HPO", priority: 130 },
];
const FUNCTIONAL_ANNOTATION_CATEGORY_BY_NAME = new Map(FUNCTIONAL_ANNOTATION_CATEGORY_CONFIG.map((config) => [config.category, config]));
const NODE_ATTRIBUTE_TYPE_VALUES = new Set(STRING_DB_NODE_ATTRIBUTE_TYPE_OPTIONS.map((option) => option.value));
const NODE_ATTRIBUTE_TYPE_CATEGORIES = Object.fromEntries(
  Object.entries(STRING_DB_NODE_ATTRIBUTE_TYPE_CATEGORIES).map(([type, categories]) => [type, new Set(categories)]),
);
const MAX_NODE_ANNOTATION_LABEL_LENGTH = 52;
const MAX_COMMUNITY_ANNOTATION_LABEL_LENGTH = 48;
const ENRICHMENT_CATEGORY_PRIORITY = new Map(
  [
    "RCTM",
    "WikiPathways",
    "Process",
    "Function",
    "Keyword",
    "Pfam",
    "InterPro",
    "SMART",
    "Component",
    "COMPARTMENTS",
  ].map((category, index) => [category, index]),
);

export function normalizeNodeAttributeType(value) {
  return NODE_ATTRIBUTE_TYPE_VALUES.has(value) ? value : STRING_DB_NODE_ATTRIBUTE_TYPE_DEFAULT;
}

export function normalizeNodeAttributeTermFilter(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNodeAttributeTermFilter(value) {
  const normalizedFilter = normalizeNodeAttributeTermFilter(value);
  if (!normalizedFilter) return [];
  return normalizedFilter
    .split(/[,\n;]/)
    .map((group) => group.trim().toLowerCase().split(/\s+/).filter(Boolean))
    .filter((group) => group.length > 0);
}

function getEnabledAnnotationCategories(attributeType) {
  return NODE_ATTRIBUTE_TYPE_CATEGORIES[attributeType] ?? NODE_ATTRIBUTE_TYPE_CATEGORIES[STRING_DB_NODE_ATTRIBUTE_TYPE_DEFAULT];
}

function matchesNodeAttributeTermFilter(record, categoryConfig, termId, description, filterGroups) {
  if (filterGroups.length === 0) return true;

  const haystack = [
    record?.category,
    categoryConfig.label,
    categoryConfig.shortLabel,
    termId,
    description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return filterGroups.some((tokens) => tokens.every((token) => haystack.includes(token)));
}

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

async function fetchFunctionalAnnotationsChunk(proteinIds, speciesId) {
  if (proteinIds.length === 0) return [];

  return fetchStringDbData(
    "functional_annotation",
    {
      identifiers: proteinIds.join("\r"),
      species: speciesId,
      caller_identity: STRING_DB_CALLER_ID,
      allow_pubmed: "0",
      echo_query: "1",
    },
    `${proteinIds.length} UniProt id(s), species ${speciesId}`,
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

function buildNodeAnnotationAttrib(categoryConfig, description) {
  const prefix = `${categoryConfig.shortLabel ?? categoryConfig.label}: `;
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

function mapFunctionalAnnotationRows(rows, proteinIds, mappings, attributeType, termFilter) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean)));
  const { proteinIdLookup, preferredNameToProteinIds } = buildIdentifierMappingLookups(uniqueProteinIds, mappings);
  const termCandidates = new Map();
  const enabledCategories = getEnabledAnnotationCategories(attributeType);
  const filterGroups = parseNodeAttributeTermFilter(termFilter);

  rows.forEach((record, rowIndex) => {
    const categoryConfig = FUNCTIONAL_ANNOTATION_CATEGORY_BY_NAME.get(record?.category);
    if (!categoryConfig) return;
    if (!enabledCategories.has(record.category)) return;

    const description = formatTermDescription(record?.description);
    if (!description) return;

    const termId = String(record?.term ?? description).trim() || description;
    if (!matchesNodeAttributeTermFilter(record, categoryConfig, termId, description, filterGroups)) return;

    const resolvedProteinIds = new Set(resolveAnnotationProteinIds(record, proteinIdLookup, preferredNameToProteinIds));
    if (resolvedProteinIds.size === 0) return;

    const attrib = buildNodeAnnotationAttrib(categoryConfig, description);
    if (!attrib) return;

    const termKey = `${record.category}::${termId}::${description}`.toLowerCase();
    if (!termCandidates.has(termKey)) {
      termCandidates.set(termKey, {
        attrib,
        proteinIds: new Set(),
        priority: categoryConfig.priority,
        rowIndex,
      });
    }

    const candidate = termCandidates.get(termKey);
    resolvedProteinIds.forEach((proteinId) => candidate.proteinIds.add(proteinId));
  });

  const candidatesByProteinId = new Map();
  termCandidates.forEach((candidate) => {
    candidate.proteinIds.forEach((proteinId) => {
      if (!candidatesByProteinId.has(proteinId)) {
        candidatesByProteinId.set(proteinId, new Map());
      }

      const candidateKey = candidate.attrib.toLowerCase();
      if (!candidatesByProteinId.get(proteinId).has(candidateKey)) {
        candidatesByProteinId.get(proteinId).set(candidateKey, {
          proteinId,
          attrib: candidate.attrib,
          priority: candidate.priority,
          rowIndex: candidate.rowIndex,
        });
      }
    });
  });

  const annotations = [];
  candidatesByProteinId.forEach((candidateMap) => {
    const candidates = Array.from(candidateMap.values()).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.rowIndex - b.rowIndex;
    });

    annotations.push(...candidates.map(({ proteinId, attrib }) => ({ proteinId, attrib })));
  });

  return annotations;
}

function selectTopEnrichmentTerms(rows, maxFdr) {
  return rows
    .map((record) => {
      const categoryPriority = ENRICHMENT_CATEGORY_PRIORITY.get(record?.category);
      const fdr = Number(record?.fdr);
      const description = formatTermDescription(record?.description);
      if (categoryPriority === undefined || !Number.isFinite(fdr) || fdr > maxFdr || !description) return null;
      return {
        category: record.category,
        term: record.term,
        description,
        fdr,
        geneCount: Number(record?.number_of_genes) || 0,
        attrib: buildCommunityAttrib(description),
        categoryPriority,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.categoryPriority !== b.categoryPriority) return a.categoryPriority - b.categoryPriority;
      if (a.fdr !== b.fdr) return a.fdr - b.fdr;
      if (b.geneCount !== a.geneCount) return b.geneCount - a.geneCount;
      return a.description.localeCompare(b.description);
    });
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

export async function fetchFunctionalAnnotations(proteinIds, options = {}) {
  const uniqueProteinIds = Array.from(new Set(proteinIds.map((proteinId) => normalizeProteinId(proteinId)).filter(Boolean)));
  if (uniqueProteinIds.length === 0) return [];

  const speciesId = options.speciesId ?? DEFAULT_SPECIES_ID;
  const attributeType = normalizeNodeAttributeType(options.attributeType);
  const termFilter = normalizeNodeAttributeTermFilter(options.termFilter);
  const proteinChunks = chunkArray(uniqueProteinIds, FUNCTIONAL_ANNOTATION_CHUNK_SIZE);
  const rows = [];
  const mappings = [];

  for (const proteinChunk of proteinChunks) {
    rows.push(...(await fetchFunctionalAnnotationsChunk(proteinChunk, speciesId)));
    mappings.push(...(await fetchIdentifierMappingsChunk(proteinChunk, speciesId)));
  }

  return mapFunctionalAnnotationRows(rows, uniqueProteinIds, mappings, attributeType, termFilter);
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
    const topTerm = selectTopEnrichmentTerms(rows, maxFdr)[0];
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
