import { cloneLink, getEndpointIdText, getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";
import { OMNI_PATH_DEPHOSPHO_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB } from "./omniPathConfig.js";
import { STRING_DB_LINK_ATTRIBS } from "./stringDbConfig.js";

export const ADDITIONAL_LINK_ATTRIBS = [...STRING_DB_LINK_ATTRIBS, OMNI_PATH_PHOSPHO_ATTRIB, OMNI_PATH_DEPHOSPHO_ATTRIB];

export function isAdditionalLinkAttrib(attrib) {
  return ADDITIONAL_LINK_ATTRIBS.includes(attrib);
}

export function withoutAdditionalLinkAttribs(links) {
  if (!Array.isArray(links)) return [];
  return links.filter((link) => !isAdditionalLinkAttrib(link.attrib));
}

function getSemanticLinkKey(link) {
  const sourceId = getEndpointIdText(link.source);
  const targetId = getEndpointIdText(link.target);
  const endpointKey = link.directed ? `${sourceId}->${targetId}` : getUndirectedLinkKey(sourceId, targetId);
  if (!endpointKey) return null;
  return `${endpointKey}::${String(link.attrib ?? "")}::${Boolean(link.directed)}`;
}

function dedupeLinks(links) {
  const result = [];
  const seen = new Set();

  links.forEach((link) => {
    const key = getSemanticLinkKey(link);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(cloneLink(link));
  });

  return result;
}

export function applyAdditionalLinkRecords(graphData, additionalLinks) {
  if (!Array.isArray(additionalLinks) || additionalLinks.length === 0) return graphData;

  return {
    ...graphData,
    links: dedupeLinks([...(graphData.links ?? []), ...additionalLinks]),
  };
}

export function applyAdditionalLinks(graphData, additionalLinks, attrib, weight = 1) {
  if (!Array.isArray(additionalLinks) || additionalLinks.length === 0) return graphData;

  const normalizedLinks = additionalLinks.map((link) => ({
    source: getEndpointIdText(link.source),
    target: getEndpointIdText(link.target),
    attrib,
    weight,
    ...(link.directed ? { directed: true } : {}),
  }));

  return applyAdditionalLinkRecords(graphData, normalizedLinks);
}
