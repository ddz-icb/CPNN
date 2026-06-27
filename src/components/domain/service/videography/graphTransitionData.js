import { getEndpointId, getUndirectedLinkKey } from "../graph_calculations/graphUtils.js";
import { clamp, interpolateFiniteNumber } from "./cameraPathMath.js";
import {
  TRANSITION_FILTER_ALPHA_CUTOFF,
  TRANSITION_FILTER_FADE_OUT_END,
  TRANSITION_FILTER_FADE_OUT_POWER,
} from "./videoExportConfig.js";

const transitionTopologyCache = new WeakMap();

export function buildTransitionGraphData(fromGraph, toGraph, t) {
  if (!hasGraphData(fromGraph) || !hasGraphData(toGraph)) return null;
  if (fromGraph === toGraph) return toGraph;

  const amount = clamp(Number.isFinite(t) ? t : 0, 0, 1);
  const topology = getTransitionTopology(fromGraph, toGraph);
  const { nodes, nodeAlpha } = buildTransitionNodes(topology.nodes, amount);
  const links = buildTransitionLinks(topology.links, nodeAlpha, amount);

  return {
    ...toGraph,
    nodes,
    links,
  };
}

export function hasGraphData(graphData) {
  return Array.isArray(graphData?.nodes) && Array.isArray(graphData?.links);
}

function getTransitionTopology(fromGraph, toGraph) {
  let targets = transitionTopologyCache.get(fromGraph);
  if (!targets) {
    targets = new WeakMap();
    transitionTopologyCache.set(fromGraph, targets);
  }

  let topology = targets.get(toGraph);
  if (!topology) {
    topology = createTransitionTopology(fromGraph, toGraph);
    targets.set(toGraph, topology);
  }
  return topology;
}

function createTransitionTopology(fromGraph, toGraph) {
  const fromNodes = new Map(fromGraph.nodes.map((node) => [String(node.id), node]));
  const toNodes = new Map(toGraph.nodes.map((node) => [String(node.id), node]));
  const nodeIds = new Set([...fromNodes.keys(), ...toNodes.keys()]);
  const nodes = Array.from(nodeIds, (nodeId) => ({
    nodeId,
    fromNode: fromNodes.get(nodeId),
    toNode: toNodes.get(nodeId),
  }));

  const fromLinksByKey = new Map(fromGraph.links.map((link) => [getTransitionLinkKey(link), link]));
  const toLinksByKey = new Map(toGraph.links.map((link) => [getTransitionLinkKey(link), link]));
  const linkKeys = new Set([...fromLinksByKey.keys(), ...toLinksByKey.keys()]);
  const links = [];

  for (const linkKey of linkKeys) {
    if (!linkKey) continue;
    const fromLink = fromLinksByKey.get(linkKey);
    const toLink = toLinksByKey.get(linkKey);
    const source = getEndpointId(toLink?.source ?? fromLink?.source);
    const target = getEndpointId(toLink?.target ?? fromLink?.target);
    if (!nodeIds.has(String(source)) || !nodeIds.has(String(target))) continue;
    links.push({ fromLink, toLink, source, target });
  }

  return { nodes, links };
}

function buildTransitionNodes(nodeEntries, amount) {
  const nodes = [];
  const nodeAlpha = new Map();

  for (const { nodeId, fromNode, toNode } of nodeEntries) {
    const alpha = getPresenceTransitionAlpha(Boolean(fromNode), Boolean(toNode), amount);
    nodes.push(interpolateGraphNode(fromNode, toNode, amount, alpha));
    nodeAlpha.set(nodeId, alpha);
  }

  return { nodes, nodeAlpha };
}

function buildTransitionLinks(linkEntries, nodeAlpha, amount) {
  const links = [];

  for (const { fromLink, toLink, source, target } of linkEntries) {
    const linkAlpha = getPresenceTransitionAlpha(Boolean(fromLink), Boolean(toLink), amount);
    const endpointAlpha = Math.min(nodeAlpha.get(String(source)) ?? 1, nodeAlpha.get(String(target)) ?? 1);
    links.push({
      ...(toLink ?? fromLink),
      source,
      target,
      __alpha: clamp(Math.min(linkAlpha, endpointAlpha), 0, 1),
    });
  }

  return links;
}

function getPresenceTransitionAlpha(wasPresent, isPresent, t) {
  if (wasPresent && isPresent) return 1;
  const amount = clamp(Number.isFinite(t) ? t : 0, 0, 1);
  if (wasPresent) {
    if (amount >= TRANSITION_FILTER_FADE_OUT_END) return 0;
    const fadeProgress = clamp(amount / TRANSITION_FILTER_FADE_OUT_END, 0, 1);
    const alpha = Math.pow(1 - fadeProgress, TRANSITION_FILTER_FADE_OUT_POWER);
    return alpha <= TRANSITION_FILTER_ALPHA_CUTOFF ? 0 : alpha;
  }
  if (isPresent) {
    return amount * amount * (3 - 2 * amount);
  }
  return 0;
}

function interpolateGraphNode(fromNode, toNode, t, alpha) {
  const source = toNode ?? fromNode ?? {};
  const target = toNode ?? fromNode ?? {};
  const origin = fromNode ?? toNode ?? {};

  return {
    ...source,
    x: interpolateFiniteNumber(origin.x, target.x, t, source.x ?? 0),
    y: interpolateFiniteNumber(origin.y, target.y, t, source.y ?? 0),
    z: interpolateFiniteNumber(origin.z, target.z, t, source.z ?? 0),
    labelX: interpolateFiniteNumber(origin.labelX, target.labelX, t, source.labelX ?? source.x ?? 0),
    labelY: interpolateFiniteNumber(origin.labelY, target.labelY, t, source.labelY ?? source.y ?? 0),
    labelVisible: Boolean(origin.labelVisible || target.labelVisible),
    __alpha: clamp(alpha, 0, 1),
  };
}

function getTransitionLinkKey(link) {
  if (!link) return "";
  const source = String(getEndpointId(link.source) ?? "");
  const target = String(getEndpointId(link.target) ?? "");
  const endpoints = getUndirectedLinkKey(source, target, "\u001f");
  if (!endpoints) return "";
  const directionKey = link.directed ? `${source}\u001f${target}` : endpoints;
  return `${directionKey}\u001e${String(link.attrib ?? "")}`;
}
