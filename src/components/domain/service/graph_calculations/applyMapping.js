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

    let groupsSet = new Set();
    protIdsForLookup.forEach((protId) => {
      const protIdStr = String(protId).trim();

      if (nodeMapping.hasOwnProperty(protIdStr)) {
        groupsSet = new Set([...groupsSet, ...nodeMapping[protIdStr].pathwayNames]);
      }
    });
    node.groups = Array.from(groupsSet);
  });

  return graphData;
}
