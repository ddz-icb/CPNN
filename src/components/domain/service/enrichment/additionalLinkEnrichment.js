import { cloneLink, getEndpointIdText, getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";
import { OMNI_PATH_DEPHOSPHO_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB } from "./omniPathConfig.js";
import { STRING_DB_LINK_ATTRIB } from "./stringDbConfig.js";

export const ADDITIONAL_LINK_ATTRIBS = [STRING_DB_LINK_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB, OMNI_PATH_DEPHOSPHO_ATTRIB];

export function isAdditionalLinkAttrib(attrib) {
  return ADDITIONAL_LINK_ATTRIBS.includes(attrib);
}

export function withoutAdditionalLinkAttribs(links) {
  if (!Array.isArray(links)) return [];

  return links
    .map((link) => {
      const attribs = link.attribs ?? [];
      const weights = link.weights ?? [];
      const keepIndices = attribs.map((attrib, index) => (isAdditionalLinkAttrib(attrib) ? null : index)).filter((index) => index !== null);
      if (keepIndices.length === attribs.length) return link;
      return {
        ...link,
        attribs: keepIndices.map((index) => attribs[index]),
        weights: keepIndices.map((index) => weights[index]),
      };
    })
    .filter((link) => link.attribs.length > 0);
}

function ensureLinkAttrib(link, attrib, weight = 1) {
  const attribs = Array.isArray(link.attribs) ? [...link.attribs] : [];
  const weights = Array.isArray(link.weights) ? [...link.weights] : [];
  const attribIndex = attribs.indexOf(attrib);

  if (attribIndex === -1) {
    attribs.push(attrib);
    weights.push(weight);
    return { ...link, attribs, weights };
  }

  if (weights[attribIndex] == null) {
    weights[attribIndex] = weight;
  }
  return { ...link, attribs, weights };
}

export function applyAdditionalLinks(graphData, additionalLinks, attrib, weight = 1) {
  if (!Array.isArray(additionalLinks) || additionalLinks.length === 0) return graphData;

  const mergedLinks = (graphData.links ?? []).map((link) => cloneLink(link));
  const pairKeyToLinkIndex = new Map();

  mergedLinks.forEach((link, index) => {
    const sourceId = getEndpointIdText(link.source);
    const targetId = getEndpointIdText(link.target);
    const pairKey = getUndirectedLinkKey(sourceId, targetId);
    if (!pairKey || pairKeyToLinkIndex.has(pairKey)) return;
    pairKeyToLinkIndex.set(pairKey, index);
  });

  additionalLinks.forEach((link) => {
    const sourceId = getEndpointIdText(link.source);
    const targetId = getEndpointIdText(link.target);
    const pairKey = getUndirectedLinkKey(sourceId, targetId);
    if (!pairKey) return;

    const existingLinkIndex = pairKeyToLinkIndex.get(pairKey);
    if (existingLinkIndex !== undefined) {
      mergedLinks[existingLinkIndex] = ensureLinkAttrib(mergedLinks[existingLinkIndex], attrib, weight);
      return;
    }

    const newLink = ensureLinkAttrib(
      {
        source: sourceId,
        target: targetId,
        weights: [weight],
        attribs: [attrib],
      },
      attrib,
      weight,
    );
    mergedLinks.push(newLink);
    pairKeyToLinkIndex.set(pairKey, mergedLinks.length - 1);
  });

  return {
    ...graphData,
    links: mergedLinks,
  };
}
