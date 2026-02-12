export function applyNodeMapping(graphData, mappingData) {
  if (!mappingData) return graphData;

  const nodeMapping = mappingData;

  graphData.nodes.forEach((node) => {
    const entries = node.id.split(";");
    const protIdsForLookup = new Set(entries.map((entry) => entry.split("_")[0]));

    protIdsForLookup.forEach((protId) => {
      const isIsoform = protId.includes("-");
      if (isIsoform) {
        const protIdNoIsoform = protId.split("-")[0];
        protIdsForLookup.add(protIdNoIsoform);
      }
    });

    let attribsSet = new Set();
    protIdsForLookup.forEach((protId) => {
      const protIdStr = String(protId).trim();

      if (nodeMapping.hasOwnProperty(protIdStr)) {
        attribsSet = new Set([...attribsSet, ...nodeMapping[protIdStr].attrib]);
      }
    });
    node.attribs = Array.from(attribsSet);
  });

  return graphData;
}
