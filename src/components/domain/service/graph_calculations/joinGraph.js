import UnionFind from "union-find";
import { getNodeIdEntries, getNodeIdNames } from "../parsing/nodeIdParsing.js";
import { cloneLink, getEndpointId, getUndirectedLinkKey } from "./graphUtils.js";

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

function getSemanticLinkKey(link) {
  const sourceId = String(getEndpointId(link.source) ?? "");
  const targetId = String(getEndpointId(link.target) ?? "");
  const endpointKey = link.directed ? `${sourceId}->${targetId}` : getUndirectedLinkKey(sourceId, targetId);
  if (!endpointKey) return null;
  return `${endpointKey}::${String(link.attrib ?? "")}::${Boolean(link.directed)}`;
}

function mergeDuplicateSemanticLinks(links) {
  const merged = new Map();

  links.forEach((link) => {
    const key = getSemanticLinkKey(link);
    if (!key) return;

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, cloneLink(link));
      return;
    }

    if (Math.abs(link.weight) > Math.abs(existing.weight)) {
      existing.weight = link.weight;
    }
  });

  return Array.from(merged.values());
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

  return {
    nodes: Array.from(nodeMap.values()),
    links: mergeDuplicateSemanticLinks([...(graphData.links ?? []), ...(newGraphData.links ?? [])]),
  };
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

  const remappedLinks = graphData.links.flatMap((link) => {
    const sourceParentIndex = unionFind.find(nodeIndexMap.get(getEndpointId(link.source)));
    const targetParentIndex = unionFind.find(nodeIndexMap.get(getEndpointId(link.target)));

    const sourceMergedNode = parentIndexToMergedNode.get(sourceParentIndex);
    const targetMergedNode = parentIndexToMergedNode.get(targetParentIndex);

    if (!sourceMergedNode || !targetMergedNode || sourceMergedNode.id === targetMergedNode.id) {
      return [];
    }

    return [
      {
        ...link,
        source: sourceMergedNode.id,
        target: targetMergedNode.id,
      },
    ];
  });

  graphData.links = mergeDuplicateSemanticLinks(remappedLinks);

  return graphData;
}
