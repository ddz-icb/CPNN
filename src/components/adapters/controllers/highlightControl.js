import { useEffect, useRef } from "react";

import { useSearchState } from "../state/searchState.js";
import { useCommunityState } from "../state/communityState.js";
import { usePixiState } from "../state/pixiState.js";
import { useTheme } from "../state/themeState.js";
import {
  clearCommunityHighlight,
  clearNodeHighlight,
  highlightCommunityNode,
  highlightNode,
} from "../../domain/service/canvas_drawing/highlights.js";

export function HighlightControl() {
  const { searchState } = useSearchState();
  const { communityState } = useCommunityState();
  const { pixiState } = usePixiState();
  const { theme } = useTheme();

  const highlightedRef = useRef([]);
  const communityHighlightedRef = useRef([]);

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

  useEffect(() => {
    const nodeMap = pixiState?.nodeMap;
    if (!nodeMap) return;

    communityHighlightedRef.current.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (circle) clearCommunityHighlight(circle);
    });
    communityHighlightedRef.current = [];

    const groupId = communityState.selectedGroupId;
    const nodeIds = communityState.groupToNodeIds?.[groupId];
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) return;

    nodeIds.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (!circle) return;
      const overlay = highlightCommunityNode(circle, theme.communityHighlightColor);
      if (overlay) {
        communityHighlightedRef.current.push(nodeId);
      }
    });
  }, [communityState.selectedGroupId, communityState.groupToNodeIds, pixiState.nodeMap, theme.communityHighlightColor]);

  return null;
}
