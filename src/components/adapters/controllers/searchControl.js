import { useEffect, useRef } from "react";
import log from "../logging/logger.js";

import { useGraphState } from "../state/graphState.js";
import { usePixiState } from "../state/pixiState.js";
import { useTheme } from "../state/themeState.js";
import { useSearchState } from "../state/searchState.js";
import { getMatchingNodes } from "../../domain/service/search/search.js";
import { clearNodeHighlight, highlightNode } from "../../domain/service/canvas_drawing/highlights.js";

export function SearchControl() {
  const { graphState } = useGraphState();
  const { pixiState } = usePixiState();
  const { theme } = useTheme();
  const { searchState, setSearchState } = useSearchState();

  const { query, highlightedNodeIds } = searchState;
  const nodes = graphState.graph?.data?.nodes ?? [];
  const nodeMap = pixiState?.nodeMap;
  const highlightedRef = useRef([]);

  const clearCanvasHighlights = () => {
    if (!nodeMap || highlightedRef.current.length === 0) return;

    highlightedRef.current.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (circle) clearNodeHighlight(circle);
    });
    highlightedRef.current = [];
  };

  useEffect(() => {    
    if (!query) return;
    log.info("SearchControl: recomputing matches", { query, nodeCount: nodes.length });
    
    const matches = getMatchingNodes(nodes, query);
    setSearchState("matchingNodes", matches);
    setSearchState("highlightedNodeIds", matches.map((node) => node.id));
  }, [nodes, query]);

  useEffect(() => {
    if (!query) {
      clearCanvasHighlights();
      return;
    }
    if (!nodeMap) return;
    log.info("Updating highlighted nodes", highlightedNodeIds);

    clearCanvasHighlights();

    const newHighlightedIds = [];
    highlightedNodeIds?.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (!circle) return;
      highlightNode(circle, theme.highlightColor);
      newHighlightedIds.push(nodeId);
    });

    highlightedRef.current = newHighlightedIds;
  }, [highlightedNodeIds, query, theme.highlightColor]);

  return null;
}
