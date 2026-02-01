import { useEffect } from "react";
import log from "../logging/logger.js";

import { useGraphState } from "../state/graphState.js";
import { useSearchState } from "../state/searchState.js";
import { getMatchingNodes } from "../../domain/service/search/search.js";

export function SearchControl() {
  const { graphState } = useGraphState();
  const { searchState, setSearchState } = useSearchState();

  const { query } = searchState;
  const nodes = graphState.graph?.data?.nodes ?? [];

  useEffect(() => {    
    if (!query) return;
    log.info("SearchControl: recomputing matches", { query, nodeCount: nodes.length });
    
    const matches = getMatchingNodes(nodes, query);
    setSearchState("matchingNodes", matches);
    setSearchState("highlightedNodeIds", matches.map((node) => node.id));
    setSearchState("selectedNodeId", null);
  }, [nodes, query]);

  return null;
}
