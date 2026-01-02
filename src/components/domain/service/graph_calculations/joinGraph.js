import UnionFind from "union-find";
import { getNodeIdAndNameEntry, getNodeIdEntries, getNodeIdNames, getPhosphositesNodeIdEntry } from "../parsing/nodeIdParsing.js";

export function joinGraphs(graphData, newGraphData) {
  const nodeMap = new Map(graphData.nodes.map((node) => [node.id, { ...node }]));

  newGraphData.nodes.forEach((node) => {
    if (nodeMap.has(node.id)) {
      const baseNode = nodeMap.get(node.id);
      nodeMap.set(node.id, {
        ...baseNode,
        groups: [...new Set([...baseNode.groups, ...node.groups])],
      });
    } else {
      nodeMap.set(node.id, { ...node });
    }
  });

  const joinedNodes = Array.from(nodeMap.values());

  const linkMap = new Map(graphData.links.map((link) => [`${link.source}-${link.target}`, { ...link }]));

  newGraphData.links.forEach((link) => {
    const key1 = `${link.source}-${link.target}`;
    const key2 = `${link.target}-${link.source}`;
    const baseLink = linkMap.get(key1) || linkMap.get(key2);

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

      if (linkMap.has(key1)) {
        linkMap.set(key1, baseLink);
      } else {
        linkMap.set(key2, baseLink);
      }
    } else {
      linkMap.set(key1, { ...link });
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

export function filterMergeProteins(graphData, mergeProteins) {
  if (!mergeProteins) return graphData;

  const protIdToNodeMap = new Map();
  graphData.nodes.forEach((node) => {
    const protIds = getNodeIdNames(node.id);
    protIds.forEach((protId) => {
      if (!protIdToNodeMap.has(protId)) {
        protIdToNodeMap.set(protId, []);
      }
      protIdToNodeMap.get(protId).push(node.id);
    });
  });

  const nodeIndexMap = new Map(graphData.nodes.map((node, index) => [node.id, index]));
  const unionFind = new UnionFind(graphData.nodes.length);

  protIdToNodeMap.forEach((nodeIds) => {
    for (let i = 1; i < nodeIds.length; i++) {
      const index1 = nodeIndexMap.get(nodeIds[0]);
      const index2 = nodeIndexMap.get(nodeIds[i]);
      if (index1 !== undefined && index2 !== undefined) {
        unionFind.link(index1, index2);
      }
    }
  });
  const nodeIdToNodeObjectMap = new Map(graphData.nodes.map((node) => [node.id, node]));

  const groupsMap = new Map();
  graphData.nodes.forEach((node) => {
    const parentIndex = unionFind.find(nodeIndexMap.get(node.id));
    if (!groupsMap.has(parentIndex)) {
      groupsMap.set(parentIndex, []);
    }
    groupsMap.get(parentIndex).push(node.id);
  });

  const parentIndexToMergedNode = new Map();
  groupsMap.forEach((groupNodeIds, parentIndex) => {
    const protIdToPhosphositesMap = new Map();
    const combinedGroups = new Set();

    groupNodeIds.forEach((nodeId) => {
      const node = nodeIdToNodeObjectMap.get(nodeId);
      if (!node) return;

      node.groups.forEach((g) => combinedGroups.add(g));

      const entries = getNodeIdEntries(node.id);
      entries.forEach((entry) => {
        const protIdName = getNodeIdAndNameEntry(entry);
        const phosphosites = getPhosphositesNodeIdEntry(entry);

        if (!protIdToPhosphositesMap.has(protIdName)) {
          protIdToPhosphositesMap.set(protIdName, new Set());
        }
        phosphosites.forEach((site) => protIdToPhosphositesMap.get(protIdName).add(site));
      });
    });

    const newId = Array.from(protIdToPhosphositesMap.entries())
      .map(([protIdName, phosphoSet]) => {
        const phosphoArray = Array.from(phosphoSet);
        return phosphoArray.length > 0 ? `${protIdName}_${phosphoArray.join(", ")}` : protIdName;
      })
      .join("; ");

    parentIndexToMergedNode.set(parentIndex, {
      id: newId,
      groups: Array.from(combinedGroups),
    });
  });

  graphData.nodes = Array.from(parentIndexToMergedNode.values());

  const mergedLinksMap = new Map();

  graphData.links.forEach((link) => {
    const sourceParentIndex = unionFind.find(nodeIndexMap.get(link.source));
    const targetParentIndex = unionFind.find(nodeIndexMap.get(link.target));

    const sourceMergedNode = parentIndexToMergedNode.get(sourceParentIndex);
    const targetMergedNode = parentIndexToMergedNode.get(targetParentIndex);

    if (!sourceMergedNode || !targetMergedNode || sourceMergedNode.id === targetMergedNode.id) {
      return;
    }

    const sourceMergedId = sourceMergedNode.id;
    const targetMergedId = targetMergedNode.id;

    const key = sourceMergedId < targetMergedId ? `${sourceMergedId}---${targetMergedId}` : `${targetMergedId}---${sourceMergedId}`;

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
