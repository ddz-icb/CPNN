import { formatWeight, getEndpointIdText } from "../graph_calculations/graphUtils.js";
import { matchesAttribsFilter } from "../graph_calculations/attribFilterMatching.js";
import { parseAttribsFilter } from "../parsing/attribsFilterParsing.js";

export function getMatchingNodes(nodes, query) {
  const search = createSearchRequest(query);
  if (!search.query) return [];
  return (nodes ?? []).filter((node) => matchesSearchRequest(node, search, getNodeSearchValues));
}

export function getMatchingLinks(links, query) {
  const search = createSearchRequest(query);
  if (!search.query) return [];
  return (links ?? [])
    .map((link, index) => buildLinkSearchResult(link, index))
    .filter((entry) => matchesSearchRequest(entry.link, search, () => getLinkSearchValues(entry)));
}

export function getSearchHighlightNodeIds(matchingNodes = [], matchingLinks = []) {
  return uniqueValues([...getSearchNodeIds(matchingNodes), ...getSearchLinkEndpointIds(matchingLinks)]);
}

function getSearchNodeIds(nodes = []) {
  return uniqueValues((nodes ?? []).map((node) => node?.id));
}

function getSearchLinkEndpointIds(entries = []) {
  return uniqueValues((entries ?? []).flatMap(getLinkEndpointIds));
}

export function getLinkEndpointIds(entry) {
  const sourceId = entry?.sourceId ?? getEndpointIdText(entry?.link?.source);
  const targetId = entry?.targetId ?? getEndpointIdText(entry?.link?.target);
  return [sourceId, targetId].filter(hasValue);
}

export function formatSearchLinkLabel(entry) {
  const sourceId = entry?.sourceId || getEndpointIdText(entry?.link?.source) || "Unknown";
  const targetId = entry?.targetId || getEndpointIdText(entry?.link?.target) || "Unknown";
  return `${sourceId} -> ${targetId}`;
}

export function getSearchNodeResults(nodes = [], limit = Infinity) {
  return nodes.slice(0, limit).map((node) => ({
    nodeId: node.id,
    primaryText: node.id,
    secondaryText: formatSearchAttributeCount(node.attribs?.length, "attribute"),
    node,
  }));
}

export function getSearchLinkResults(entries = [], limit = Infinity) {
  return entries.slice(0, limit).map((entry) => ({
    ...entry,
    primaryText: formatSearchLinkLabel(entry),
    secondaryText: formatSearchAttributeCount(entry.link?.attribs?.length, "attribute"),
  }));
}

export function getNodesByIds(nodeIds, nodeById) {
  return (nodeIds ?? []).map((nodeId) => nodeById.get(nodeId)).filter(Boolean);
}

export function hasSameValues(left = [], right = []) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

export function formatSearchDetailValue(value) {
  if (value === undefined || value === null || value === "") return "None";
  return value;
}

export function formatSearchValues(values, formatter = stringifySearchValue) {
  const formattedValues = (values ?? []).map(formatter).filter(Boolean);
  return formattedValues.length ? formattedValues.join(", ") : "None";
}

export function formatSearchWeight(weight) {
  return typeof weight === "number" && Number.isFinite(weight) ? formatWeight(weight) : stringifySearchValue(weight);
}

export function stringifySearchValue(value) {
  if (value === undefined || value === null || value === "") return "";
  return value.toString();
}

function buildLinkSearchResult(link, index) {
  const sourceId = getEndpointIdText(link?.source);
  const targetId = getEndpointIdText(link?.target);
  return {
    link,
    linkId: getLinkSearchId(link, index, sourceId, targetId),
    sourceId,
    targetId,
  };
}

function getLinkSearchId(link, index, sourceId, targetId) {
  if (link?.id !== undefined && link?.id !== null && link.id !== "") return link.id.toString();
  return `${sourceId || "unknown"}::${targetId || "unknown"}::${index}`;
}

function formatSearchAttributeCount(count, singularLabel) {
  const numericCount = Number.isFinite(count) ? count : 0;
  const label = numericCount === 1 ? singularLabel : `${singularLabel}s`;
  return `${numericCount} ${label}`;
}

function getNodeSearchValues(node) {
  return [node?.label, node?.id, node?.attrib, node?.attribs, node?.type];
}

function getLinkSearchValues(entry) {
  return [entry?.link?.id, entry?.link?.label, entry?.link?.type, entry?.sourceId, entry?.targetId, entry?.link?.attrib, entry?.link?.attribs, entry?.link?.weights];
}

function matchesSearchRequest(item, search, getSearchValues) {
  return matchesQuery(getSearchValues(item), search.query) || matchesAttribsFilter(item?.attribs, search.attributeFilter);
}

function matchesQuery(values, query) {
  return values.some((value) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return matchesQuery(value, query);
    return value.toString().toLowerCase().includes(query);
  });
}

function createSearchRequest(query) {
  const normalizedQuery = normalizeSearchText(query);
  return {
    query: normalizedQuery,
    attributeFilter: parseAttributeSearch(normalizedQuery),
  };
}

function parseAttributeSearch(query) {
  try {
    const parsedFilter = parseAttribsFilter(query);
    return parsedFilter === true ? null : parsedFilter;
  } catch {
    return null;
  }
}

function normalizeSearchText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function uniqueValues(values) {
  return Array.from(new Set((values ?? []).filter(hasValue)));
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

export function applySearch(query, nodes) {
  if (!query) return;

  const matches = getMatchingNodes(nodes ?? [], query);

  return matches;
}
