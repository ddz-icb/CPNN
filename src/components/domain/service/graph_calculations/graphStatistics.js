import { getComponentSizes, getEndpointId, getNodeDegreeData } from "./graphUtils.js";

function getAttributeCounts(items) {
  const counts = new Map();

  items.forEach((item) => {
    const attributes = Array.isArray(item?.attribs) ? item.attribs : item?.attrib !== undefined && item?.attrib !== null ? [item.attrib] : [];
    new Set(attributes.map((attribute) => String(attribute ?? "").trim()).filter(Boolean)).forEach((attribute) => {
      counts.set(attribute, (counts.get(attribute) ?? 0) + 1);
    });
  });

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function calculateGraphStatistics(graphData) {
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const links = Array.isArray(graphData?.links) ? graphData.links : [];
  const normalizedGraph = { nodes, links };
  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const degrees = getNodeDegreeData(normalizedGraph);
  const uniqueEdges = new Set();
  let selfLoopCount = 0;

  links.forEach((link) => {
    const source = getEndpointId(link.source);
    const target = getEndpointId(link.target);
    if (!nodeIdSet.has(source) || !nodeIdSet.has(target)) return;
    if (source === target) {
      selfLoopCount += 1;
      return;
    }
    const edgeKey = JSON.stringify(String(source) < String(target) ? [source, target] : [target, source]);
    uniqueEdges.add(edgeKey);
  });

  const degreeValues = Array.from(degrees.values());
  const degreeSum = degreeValues.reduce((sum, degree) => sum + degree, 0);
  let minDegree = degreeValues.length === 0 ? 0 : Infinity;
  let maxDegree = 0;
  degreeValues.forEach((degree) => {
    minDegree = Math.min(minDegree, degree);
    maxDegree = Math.max(maxDegree, degree);
  });

  const nodeCount = nodes.length;
  const linkCount = links.length;
  const directedLinkCount = links.filter((link) => link?.directed).length;
  const weightedLinks = links.filter((link) => Number.isFinite(link?.weight));
  const weightedLinkCount = weightedLinks.length;
  const possibleEdges = (nodeCount * (nodeCount - 1)) / 2;
  const componentSizes = getComponentSizes(normalizedGraph);

  return {
    nodeCount,
    linkCount,
    averageDegree: nodeCount === 0 ? 0 : degreeSum / nodeCount,
    density: possibleEdges === 0 ? 0 : uniqueEdges.size / possibleEdges,
    componentCount: componentSizes.length,
    isolatedNodeCount: degreeValues.filter((degree) => degree === 0).length,
    minDegree,
    maxDegree,
    directedLinkCount,
    directedLinkShare: linkCount === 0 ? 0 : directedLinkCount / linkCount,
    meanWeight: weightedLinkCount === 0
      ? null
      : weightedLinks.reduce((sum, link) => sum + link.weight, 0) / weightedLinkCount,
    selfLoopCount,
    nodeAttributes: getAttributeCounts(nodes),
    linkAttributes: getAttributeCounts(links),
  };
}
