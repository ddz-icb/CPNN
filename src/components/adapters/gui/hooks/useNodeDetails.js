import { useMemo } from "react";

import { getNodeIdEntries, getNodeIdName } from "../../../domain/service/parsing/nodeIdParsing.js";

function parseNodeEntry(entry) {
  const [id = "", name = "", phosphosites = ""] = entry.split("_").map((part) => part.trim());
  return {
    id,
    name,
    phosphosites: phosphosites
      ? phosphosites
          .split(",")
          .map((site) => site.trim())
          .filter(Boolean)
      : [],
  };
}

export function useNodeDetails(nodeId) {
  return useMemo(() => {
    const entries = getNodeIdEntries(nodeId).map(parseNodeEntry).filter((entry) => entry.id);
    return {
      displayName: getNodeIdName(nodeId) || nodeId || "",
      entries,
      hasPhosphosites: entries.some((entry) => entry.phosphosites.length > 0),
    };
  }, [nodeId]);
}
