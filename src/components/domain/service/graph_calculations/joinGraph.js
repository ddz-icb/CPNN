import UnionFind from "union-find";
import { getNodeIdEntries, getNodeIdNames } from "../parsing/nodeIdParsing.js";
import { getEndpointId, getUndirectedLinkKey } from "./graphUtils.js";

function normalizeNodeEntry(entry) {
  const [idPart = "", namePart = "", phosphositesPart = ""] = entry.split("_").map((part) => part.trim());
  if (!idPart || !namePart) return entry.trim();

  if (!phosphositesPart) return `${idPart}_${namePart}`;

  const normalizedPhosphosites = phosphositesPart
    .split(",")
    .map((site) => site.trim())
    .filter(Boolean)
    .join(", ");
  return normalizedPhosphosites ? `${idPart}_${namePart}_${normalizedPhosphosites}` : `${idPart}_${namePart}`;
}

function copyNodeLayout(targetNode, sourceNode) {
  if (!sourceNode) return targetNode;

  ["x", "y", "z", "vx", "vy", "vz", "fx", "fy", "fz"].forEach((key) => {
    if (sourceNode[key] !== undefined) {
      targetNode[key] = sourceNode[key];
    }
  });

  return targetNode;
}

function setMergeMetadata(node, representativeId, mergedFromIds) {
  Object.defineProperties(node, {
    __mergeRepresentativeId: {
      value: representativeId,
      enumerable: false,
      configurable: true,
    },
    __mergedFromIds: {
      value: mergedFromIds,
      enumerable: false,
      configurable: true,
    },
  });
  return node;
}

export function joinGraphs(graphData, newGraphData) {
  const nodeMap = new Map(graphData.nodes.map((node) => [node.id, { ...node }]));

  newGraphData.nodes.forEach((node) => {
    if (nodeMap.has(node.id)) {
      const baseNode = nodeMap.get(node.id);
      nodeMap.set(node.id, {
        ...baseNode,
        attribs: [...new Set([...baseNode.attribs, ...node.attribs])],
      });
    } else {
      nodeMap.set(node.id, { ...node });
    }
  });

  const joinedNodes = Array.from(nodeMap.values());

  const linkMap = new Map(
    graphData.links.map((link) => [getUndirectedLinkKey(getEndpointId(link.source), getEndpointId(link.target)), { ...link }]),
  );

  newGraphData.links.forEach((link) => {
    const key = getUndirectedLinkKey(getEndpointId(link.source), getEndpointId(link.target));
    const baseLink = linkMap.get(key);

    if (baseLink) {
      const newAttribs = [];
      const newWeights = [];
      for (let i = 0; i < link.attribs.length; i++) {
        if (!baseLink.attribs.includes(link.attribs[i])) {
          newAttribs.push(link.attribs[i]);
          newWeights.push(link.weights[i]);
        }
      }
      baseLink.attribs.push(...newAttribs);
      baseLink.weights.push(...newWeights);

      linkMap.set(key, baseLink);
    } else {
      linkMap.set(key, { ...link });
    }
  });

  const joinedLinks = Array.from(linkMap.values());

  const joinedGraphData = {
    nodes: joinedNodes,
    links: joinedLinks,
  };

  return joinedGraphData;
}

export function joinGraphNames(graphNames) {
  return graphNames.join("-");
}

export function filterMergeByName(graphData, mergeByName, options = {}) {
  if (!mergeByName) return graphData;

  const previousNodeById = Array.isArray(options.previousGraphData?.nodes)
    ? new Map(options.previousGraphData.nodes.map((node) => [node.id, node]))
    : null;

  const nameToNodeMap = new Map();
  graphData.nodes.forEach((node) => {
    const names = getNodeIdNames(node.id);
    names.forEach((name) => {
      if (!nameToNodeMap.has(name)) {
        nameToNodeMap.set(name, []);
      }
      nameToNodeMap.get(name).push(node.id);
    });
  });

  const nodeIndexMap = new Map(graphData.nodes.map((node, index) => [node.id, index]));
  const unionFind = new UnionFind(graphData.nodes.length);

  nameToNodeMap.forEach((nodeIds) => {
    for (let i = 1; i < nodeIds.length; i++) {
      const index1 = nodeIndexMap.get(nodeIds[0]);
      const index2 = nodeIndexMap.get(nodeIds[i]);
      if (index1 !== undefined && index2 !== undefined) {
        unionFind.link(index1, index2);
      }
    }
  });
  const nodeIdToNodeObjectMap = new Map(graphData.nodes.map((node) => [node.id, node]));

  const attribsMap = new Map();
  graphData.nodes.forEach((node) => {
    const parentIndex = unionFind.find(nodeIndexMap.get(node.id));
    if (!attribsMap.has(parentIndex)) {
      attribsMap.set(parentIndex, []);
    }
    attribsMap.get(parentIndex).push(node.id);
  });

  const parentIndexToMergedNode = new Map();
  attribsMap.forEach((attribNodeIds, parentIndex) => {
    const mergedEntries = [];
    const seenEntries = new Set();
    const combinedAttribs = new Set();
    const representativeNode = nodeIdToNodeObjectMap.get(attribNodeIds[0]);

    attribNodeIds.forEach((nodeId) => {
      const node = nodeIdToNodeObjectMap.get(nodeId);
      if (!node) return;

      node.attribs.forEach((g) => combinedAttribs.add(g));

      const entries = getNodeIdEntries(node.id);
      entries.forEach((entry) => {
        const normalizedEntry = normalizeNodeEntry(entry);
        const key = normalizedEntry.toLowerCase();
        if (seenEntries.has(key)) {
          return;
        }
        seenEntries.add(key);
        mergedEntries.push(normalizedEntry);
      });
    });

    const newId = mergedEntries.sort((a, b) => a.localeCompare(b)).join("; ");
    const mergedNode = {
      ...(options.preserveRepresentativeNodes && representativeNode ? representativeNode : {}),
      id: newId,
      attribs: Array.from(combinedAttribs),
    };

    copyNodeLayout(mergedNode, previousNodeById?.get(newId));

    if (options.preserveRepresentativeNodes && representativeNode) {
      setMergeMetadata(mergedNode, representativeNode.id, attribNodeIds);
    }

    parentIndexToMergedNode.set(parentIndex, mergedNode);
  });

  graphData.nodes = Array.from(parentIndexToMergedNode.values());

  const mergedLinksMap = new Map();

  graphData.links.forEach((link) => {
    const sourceParentIndex = unionFind.find(nodeIndexMap.get(getEndpointId(link.source)));
    const targetParentIndex = unionFind.find(nodeIndexMap.get(getEndpointId(link.target)));

    const sourceMergedNode = parentIndexToMergedNode.get(sourceParentIndex);
    const targetMergedNode = parentIndexToMergedNode.get(targetParentIndex);

    if (!sourceMergedNode || !targetMergedNode || sourceMergedNode.id === targetMergedNode.id) {
      return;
    }

    const sourceMergedId = sourceMergedNode.id;
    const targetMergedId = targetMergedNode.id;

    const key = getUndirectedLinkKey(sourceMergedId, targetMergedId);

    const existingLink = mergedLinksMap.get(key);

    if (existingLink) {
      link.attribs.forEach((attrib, idx) => {
        const existingAttribIndex = existingLink.attribs.indexOf(attrib);
        if (existingAttribIndex !== -1) {
          const currentWeight = existingLink.weights[existingAttribIndex];
          const newWeight = link.weights[idx];
          existingLink.weights[existingAttribIndex] = Math.max(Math.abs(currentWeight), Math.abs(newWeight));
        } else {
          existingLink.attribs.push(attrib);
          existingLink.weights.push(link.weights[idx]);
        }
      });
    } else {
      mergedLinksMap.set(key, {
        source: sourceMergedId,
        target: targetMergedId,
        weights: [...link.weights],
        attribs: [...link.attribs],
      });
    }
  });

  graphData.links = Array.from(mergedLinksMap.values());

  return graphData;
}
