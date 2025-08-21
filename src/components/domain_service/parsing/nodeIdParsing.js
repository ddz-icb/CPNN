export function getNodeIdAndIsoformEntry(entry) {
  return entry.split("_")[0].trim();
}

export function getNodeIdEntries(nodeId) {
  return nodeId.split(";").map((entry) => entry.trim());
}

export function getPhosphositesNodeIdEntry(entry) {
  return entry
    .split("_")[2]
    .split(", ")
    .map((entry) => entry.trim());
}

export function getNodeIdAndNameEntry(entry) {
  const parts = entry.split("_");
  return parts.slice(0, 2).join("_");
}

export function getNodeIdsAndIsoform(nodeId) {
  return nodeId.split(";").map((id) => id.split("_")[0].trim());
}

export function getNodeIdNames(nodeId) {
  return nodeId.split(";").map((id) => id.split("_")[1].trim());
}

export function getNodeIdName(nodeId) {
  return nodeId.split("_")[1];
}

export function parseNodeIdEntries(entries) {
  if (!entries?.length) return {};

  const protIdNoIsoform = entries[0].split("_")[0]?.split("-")[0] || "";
  const gene = entries[0].split("_")[1] || "";
  const hasPhosphosites = !!entries[0].split("_")[2];

  const isoforms = entries
    .map((entry) => {
      const [pepId, , phosphosites] = entry.split("_");
      return pepId ? { pepId, phosphosites } : null;
    })
    .filter(Boolean);

  return { protIdNoIsoform, gene, hasPhosphosites, isoforms };
}
