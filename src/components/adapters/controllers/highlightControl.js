import { useEffect, useRef } from "react";

import { useSearchState } from "../state/searchState.js";
import { usePixiState } from "../state/pixiState.js";
import { useTheme } from "../state/themeState.js";
import { clearNodeHighlight, highlightNode } from "../../domain/service/canvas_drawing/highlights.js";

export function HighlightControl() {
  const { searchState } = useSearchState();
  const { pixiState } = usePixiState();
  const { theme } = useTheme();

  const highlightedRef = useRef([]);

  useEffect(() => {
    const nodeMap = pixiState?.nodeMap;
    if (!nodeMap) return;

    highlightedRef.current.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (circle) clearNodeHighlight(circle);
    });
    highlightedRef.current = [];

    const searchIds = Array.isArray(searchState.highlightedNodeIds) ? searchState.highlightedNodeIds : [];
    searchIds.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (!circle) return;
      highlightNode(circle, theme.highlightColor);
      highlightedRef.current.push(nodeId);
    });
  }, [searchState.highlightedNodeIds, pixiState.nodeMap, theme.highlightColor]);

  return null;
}
