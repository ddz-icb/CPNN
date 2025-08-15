export function getProtIdsWithIsoformEntry(entry) {
  return entry.split("_")[0].trim();
}

export function getIdsSeparateEntries(nodeId) {
  return nodeId.split(";").map((entry) => entry.trim());
}

export function getPhosphositesProtIdEntry(entry) {
  return entry
    .split("_")[2]
    .split(", ")
    .map((entry) => entry.trim());
}

export function getProtIdAndNameEntry(entry) {
  const parts = entry.split("_");
  return parts.slice(0, 2).join("_");
}

export function getProtIdsWithIsoform(nodeId) {
  return nodeId.split(";").map((id) => id.split("_")[0].trim());
}

export function getNodeIdName(nodeId) {
  return nodeId.split("_")[1];
}
