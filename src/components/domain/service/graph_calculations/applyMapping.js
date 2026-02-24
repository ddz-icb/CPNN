export function applyNodeMapping(graphData, mappingData) {
  if (!mappingData) return graphData;

  const nodeMapping = mappingData;
  const mappingEntries = Object.entries(nodeMapping);

  graphData.nodes.forEach((node) => {
    const nodeId = String(node.id);
    const attribsSet = new Set();

    mappingEntries.forEach(([mappingId, mappingNode]) => {
      const mappingIdStr = String(mappingId).trim();
      if (!mappingIdStr || !nodeId.includes(mappingIdStr)) return;

      const mappedAttribs = Array.isArray(mappingNode?.attribs) ? mappingNode.attribs : [];
      mappedAttribs.forEach((attrib) => attribsSet.add(attrib));
    });

    node.attribs = Array.from(attribsSet);
  });

  return graphData;
}
