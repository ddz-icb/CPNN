import { getNodeIdEntries, getNodeIdsAndIsoform, getNodeIdNames, getNodeIdName, getNodeIdAndNameEntry } from "../parsing/nodeIdParsing.js";
import { getPhosphositesNodeIdEntry } from "../parsing/nodeIdBioParsing.js";

const normalizeMatch = (value) => value.trim().toLowerCase();

export function applyNodeMapping(graphData, mappingData) {
  if (!mappingData) return graphData;

  const mappingEntries = Object.entries(mappingData)
    .filter(([id]) => id.trim())
    .map(([id, node]) => ({
      id: normalizeMatch(id),
      attribs: Array.isArray(node?.attribs) ? node.attribs : [],
    }));

  graphData.nodes.forEach((node) => {
    const nodeId = String(node.id);
    const entries = getNodeIdEntries(nodeId);
    const matchValues = new Set([
      nodeId,
      ...entries,
      ...getNodeIdsAndIsoform(nodeId),
      ...getNodeIdNames(nodeId),
      ...entries.flatMap(getPhosphositesNodeIdEntry),
      ...entries.flatMap((entry) => {
        const idAndName = getNodeIdAndNameEntry(entry);
        const name = getNodeIdName(entry);
        return [idAndName, ...getPhosphositesNodeIdEntry(entry).flatMap((site) => [
          `${name}_${site}`, `${idAndName}_${site}`,
        ])];
      }),
    ].map(normalizeMatch));
    const attribsSet = new Set(node.attribs ?? []);

    mappingEntries.forEach(({ id, attribs }) => {
      if (!matchValues.has(id)) return;
      attribs.forEach((attrib) => attribsSet.add(attrib));
    });

    node.attribs = Array.from(attribsSet);
  });

  return graphData;
}
