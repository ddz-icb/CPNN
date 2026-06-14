import {
  cloneLink,
  getDirectionsForIndices,
  getEndpointIdText,
  getLinkDirection,
  getUndirectedLinkKey,
  mergeLinkDirections,
  reverseLinkDirection,
} from "../graph_calculations/graphUtils.js";
import { OMNI_PATH_DEPHOSPHO_ATTRIB, OMNI_PATH_PHOSPHO_ATTRIB } from "./omniPathConfig.js";
import { STRING_DB_LINK_ATTRIBS } from "./stringDbConfig.js";

export const ADDITIONAL_LINK_ATTRIBS = [...STRING_DB_LINK_ATTRIBS, OMNI_PATH_PHOSPHO_ATTRIB, OMNI_PATH_DEPHOSPHO_ATTRIB];

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
        ...(Array.isArray(link.directions) ? { directions: getDirectionsForIndices(link, keepIndices) } : {}),
      };
    })
    .filter((link) => link.attribs.length > 0);
}

function ensureLinkAttrib(link, attrib, weight = 1, direction = "both") {
  const attribs = Array.isArray(link.attribs) ? [...link.attribs] : [];
  const weights = Array.isArray(link.weights) ? [...link.weights] : [];
  const directions = attribs.map((_, index) => getLinkDirection(link, index));
  const attribIndex = attribs.indexOf(attrib);

  if (attribIndex === -1) {
    attribs.push(attrib);
    weights.push(weight);
    directions.push(direction);
    return { ...link, attribs, weights, directions };
  }

  if (weights[attribIndex] == null) {
    weights[attribIndex] = weight;
  }
  const hasExplicitDirection = Array.isArray(link.directions) && link.directions[attribIndex] != null;
  directions[attribIndex] = hasExplicitDirection ? mergeLinkDirections(directions[attribIndex], direction) : direction;
  return { ...link, attribs, weights, directions };
}

function ensureLinkAttribs(link, attribs, weights, directions) {
  let nextLink = link;
  attribs.forEach((attrib, index) => {
    nextLink = ensureLinkAttrib(nextLink, attrib, weights[index] ?? 1, directions?.[index] ?? "both");
  });
  return nextLink;
}

function orientDirection(direction, incomingLink, storedLink) {
  const sameOrientation =
    getEndpointIdText(incomingLink.source) === getEndpointIdText(storedLink.source) &&
    getEndpointIdText(incomingLink.target) === getEndpointIdText(storedLink.target);
  return sameOrientation ? direction : reverseLinkDirection(direction);
}

export function applyAdditionalLinkRecords(graphData, additionalLinks) {
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

    const attribs = Array.isArray(link.attribs) ? link.attribs.map((attrib) => String(attrib ?? "").trim()).filter(Boolean) : [];
    if (attribs.length === 0) return;
    const weights = Array.isArray(link.weights) ? link.weights : [];
    const directions = Array.isArray(link.directions) ? link.directions : [];

    const existingLinkIndex = pairKeyToLinkIndex.get(pairKey);
    if (existingLinkIndex !== undefined) {
      const existingLink = mergedLinks[existingLinkIndex];
      const orientedDirections = attribs.map((_, index) =>
        orientDirection(directions[index] ?? "both", link, existingLink),
      );
      mergedLinks[existingLinkIndex] = ensureLinkAttribs(existingLink, attribs, weights, orientedDirections);
      return;
    }

    mergedLinks.push(
      ensureLinkAttribs(
        {
          source: sourceId,
          target: targetId,
          weights: [],
          attribs: [],
        },
        attribs,
        weights,
        directions,
      ),
    );
    pairKeyToLinkIndex.set(pairKey, mergedLinks.length - 1);
  });

  return {
    ...graphData,
    links: mergedLinks,
  };
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
    const direction = getLinkDirection(link, 0);
    if (existingLinkIndex !== undefined) {
      const existingLink = mergedLinks[existingLinkIndex];
      mergedLinks[existingLinkIndex] = ensureLinkAttrib(
        existingLink,
        attrib,
        weight,
        orientDirection(direction, link, existingLink),
      );
      return;
    }

    const newLink = ensureLinkAttrib(
      {
        source: sourceId,
        target: targetId,
        weights: [],
        attribs: [],
      },
      attrib,
      weight,
      direction,
    );
    mergedLinks.push(newLink);
    pairKeyToLinkIndex.set(pairKey, mergedLinks.length - 1);
  });

  return {
    ...graphData,
    links: mergedLinks,
  };
}
