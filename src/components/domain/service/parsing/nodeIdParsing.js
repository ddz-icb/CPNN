export function getNodeIdAndIsoformEntry(entry) {
  return entry.split("_")[0]?.trim();
}

export function getNodeIdEntries(nodeId) {
  if (!nodeId) return [];
  return nodeId
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getPhosphositesNodeIdEntry(entry) {
  const phosphositePart = entry.split("_")[2];
  if (!phosphositePart) return [];

  return phosphositePart
    .split(",")
    .map((site) => site.trim())
    .filter(Boolean);
}

export function getNodeIdAndNameEntry(entry) {
  const parts = entry.split("_");
  return parts
    .slice(0, 2)
    .map((part) => part.trim())
    .join("_");
}

export function getNodeIdsAndIsoform(nodeId) {
  return getNodeIdEntries(nodeId).map((id) => id.split("_")[0]?.trim());
}

export function getNodeIdNames(nodeId) {
  return getNodeIdEntries(nodeId)
    .map((id) => id.split("_")[1]?.trim())
    .filter(Boolean);
}

export function getNodeIdName(nodeId) {
  return getNodeIdNames(nodeId)[0] || "";
}

export function parseNodeIdEntries(entries) {
  if (!entries?.length) return {};

  const protIdNoIsoform = entries[0].split("_")[0]?.split("-")[0] || "";
  const gene = entries[0].split("_")[1] || "";
  const hasPhosphosites = !!entries[0].split("_")[2];

  const isoforms = entries
    .map((entry) => {
      const [pepId, , phosphosites] = entry.split("_");
      return pepId
        ? {
            pepId,
            phosphosites: phosphosites
              ? phosphosites
                  .split(",")
                  .map((site) => site.trim())
                  .filter(Boolean)
              : [],
          }
        : null;
    })
    .filter(Boolean);

  return { protIdNoIsoform, gene, hasPhosphosites, isoforms };
}
