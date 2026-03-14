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
