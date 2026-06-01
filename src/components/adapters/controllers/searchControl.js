import { useEffect } from "react";
import log from "../logging/logger.js";

import { useGraphState } from "../state/graphState.js";
import { useSearchState } from "../state/searchState.js";
import {
  getMatchingLinkAttributes,
  getMatchingLinks,
  getMatchingNodeAttributes,
  getMatchingNodes,
  getSearchHighlightNodeIds,
} from "../../domain/service/search/search.js";

export function SearchControl() {
  const { graphState } = useGraphState();
  const { searchState, setSearchState } = useSearchState();

  const { query } = searchState;
  const nodes = graphState.graph?.data?.nodes ?? [];
  const links = graphState.graph?.data?.links ?? [];

  useEffect(() => {
    if (!query) return;
    log.info("SearchControl: recomputing matches", { query, nodeCount: nodes.length, linkCount: links.length });

    const matchingNodes = getMatchingNodes(nodes, query);
    const matchingLinks = getMatchingLinks(links, query);
    setSearchState("matchingNodes", matchingNodes);
    setSearchState("matchingLinks", matchingLinks);
    setSearchState("matchingNodeAttributes", getMatchingNodeAttributes(nodes, query));
    setSearchState("matchingLinkAttributes", getMatchingLinkAttributes(links, query));
    setSearchState("highlightedNodeIds", getSearchHighlightNodeIds(matchingNodes, matchingLinks));
    setSearchState("selectedNodeId", null);
    setSearchState("selectedLinkId", null);
    setSearchState("selectedNodeAttribute", null);
    setSearchState("selectedLinkAttribute", null);
  }, [nodes, links, query]);

  return null;
}
