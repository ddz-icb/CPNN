import { useEffect } from "react";
import log from "../logging/logger.js";

import { useGraphState } from "../state/graphState.js";
import { useSearchState } from "../state/searchState.js";
import {
  getMatchingLinks,
  getMatchingNodes,
  getSearchLinkIds,
  getSearchNodeIds,
} from "../../domain/service/search/search.js";

const EMPTY_GRAPH_ITEMS = [];

export function SearchControl() {
  const { graphState } = useGraphState();
  const { searchState } = useSearchState();

  const { nodeQuery, linkQuery } = searchState;
  const graphData = graphState.graph?.data;
  const nodes = graphData?.nodes ?? EMPTY_GRAPH_ITEMS;
  const links = graphData?.links ?? EMPTY_GRAPH_ITEMS;

  useEffect(() => {
    if (nodeQuery || linkQuery) {
      log.info("SearchControl: recomputing matches", { nodeQuery, linkQuery, nodeCount: nodes.length, linkCount: links.length });
    }

    const matchingNodes = nodeQuery ? getMatchingNodes(nodes, nodeQuery, links) : [];
    const matchingLinks = linkQuery ? getMatchingLinks(links, linkQuery) : [];
    const currentSearchState = useSearchState.getState().searchState;

    useSearchState.getState().setAllSearchState({
      ...currentSearchState,
      matchingNodes,
      matchingLinks,
      highlightedNodeIds: getSearchNodeIds(matchingNodes),
      highlightedLinkIds: getSearchLinkIds(matchingLinks),
      selectedNodeId: null,
      selectedLinkId: null,
    });
  }, [graphData, nodeQuery, linkQuery]);

  return null;
}
