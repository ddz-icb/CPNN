import {
  formatWeight,
  getDirectionalLinkEndpoints,
  getEndpointIdText,
  getLinkIdText,
  getUniqueNeighborCountData,
} from "../graph_calculations/graphUtils.js";
import { matchesAttribsFilter } from "../graph_calculations/attribFilterMatching.js";
import { parseAttribsFilter } from "../parsing/attribsFilterParsing.js";

export function getMatchingNodes(nodes, query, links = []) {
  const search = parseSearchQuery(query);
  if (!search.query) return [];
  const neighborCounts = getUniqueNeighborCountData({ nodes, links });
  return (nodes ?? []).filter((node) =>
    matchesSearchRequest(node, search, {
      neighbors: neighborCounts.get(node.id) ?? 0,
      name: uniqueValues([node.id, node.name, node.label]),
    }),
  );
}

export function getMatchingLinks(links, query) {
  const search = parseSearchQuery(query);
  if (!search.query) return [];
  return (links ?? [])
    .map((link, index) => buildLinkSearchResult(link, index))
    .filter((entry) => {
      const directionalEndpoints = getDirectionalLinkEndpoints(entry.link);
      return matchesSearchRequest(entry.link, search, {
        name: uniqueValues([entry.linkId, entry.link?.name, entry.link?.label]),
        source: directionalEndpoints.sources,
        target: directionalEndpoints.targets,
      });
    });
}

export function getSearchNodeIds(nodes = []) {
  return uniqueValues((nodes ?? []).map((node) => node?.id));
}

export function getSearchLinkIds(entries = []) {
  return uniqueValues((entries ?? []).map((entry) => entry?.linkId ?? (entry?.link ? getLinkIdText(entry.link, entry.linkIndex) : null)));
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
    secondaryText: entry.link?.attrib === undefined || entry.link?.attrib === null ? "0 attributes" : "1 attribute",
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
    linkId: getLinkIdText(link, index, sourceId, targetId),
    linkIndex: index,
    sourceId,
    targetId,
  };
}

function formatSearchAttributeCount(count, singularLabel) {
  const numericCount = Number.isFinite(count) ? count : 0;
  const label = numericCount === 1 ? singularLabel : `${singularLabel}s`;
  return `${numericCount} ${label}`;
}

function matchesSearchRequest(item, search, metrics) {
  const attribs = Array.isArray(item?.attribs) ? item.attribs : item?.attrib !== undefined && item?.attrib !== null ? [item.attrib] : [];
  return matchesAttribsFilter(attribs, search.attributeFilter, metrics);
}

export function parseSearchQuery(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return { query: "", attributeFilter: null };

  const parsedFilter = parseAttribsFilter(normalizedQuery);
  return {
    query: normalizedQuery,
    attributeFilter: parsedFilter === true ? null : parsedFilter,
  };
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

export function applySearch(query, nodes, links = []) {
  if (!query) return;

  const matches = getMatchingNodes(nodes ?? [], query, links);

  return matches;
}
