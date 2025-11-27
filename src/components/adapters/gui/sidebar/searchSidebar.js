import { useEffect, useRef } from "react";

import { useGraphState } from "../../state/graphState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useTheme } from "../../state/themeState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useSearchState, searchStateInit, highlightedNodeIdsInit, matchingNodesInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { clearNodeHighlight, highlightNode, render as renderStage } from "../../../domain/service/canvas_drawing/draw.js";
import { getMatchingNodes } from "../../../domain/service/search/search.js";

const MAX_RESULTS = 30;

export function SearchSidebar() {
  const { graphState } = useGraphState();
  const { theme } = useTheme();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const { searchValue, query, highlightedNodeIds, matchingNodes } = searchState;

  const textareaRef = useRef(null);

  const nodes = graphState.graph?.data?.nodes ?? [];
  const nodeMap = pixiState?.nodeMap;
  const app = renderState?.app;

  useSidebarCodeEditor({
    textareaRef,
    value: searchValue,
    onChange: (editor) => setSearchState("searchValue", editor.getValue()),
    themeName: theme.name,
  });

  const clearSearchHighlights = () => {
    if (!nodeMap || highlightedNodeIds.length === 0) return;

    highlightedNodeIds.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (circle) clearNodeHighlight(circle);
    });
    setSearchState("highlightedNodeIds", highlightedNodeIdsInit);

    if (app) renderStage(app);
  };

  useEffect(() => {
    const normalizedQuery = query?.trim().toLowerCase();
    const matches = normalizedQuery ? getMatchingNodes(nodes, normalizedQuery) : matchingNodesInit;

    const sameLength = matches.length === (matchingNodes?.length ?? 0);
    const sameOrder = sameLength && matches.every((m, idx) => m.id === matchingNodes?.[idx]?.id);
    if (!sameOrder) {
      setSearchState("matchingNodes", matches);
    }

    if (!normalizedQuery) {
      clearSearchHighlights();
    }
  }, [nodes, query, matchingNodes, setSearchState]);

  useEffect(() => {
    if (!query) {
      clearSearchHighlights();
      return;
    }
    if (!nodeMap) return;

    clearSearchHighlights();

    const newHighlightedIds = [];
    matchingNodes?.forEach((node) => {
      const circle = nodeMap[node.id]?.circle;
      if (!circle) return;
      highlightNode(circle, theme.highlightColor);
      newHighlightedIds.push(node.id);
    });

    setSearchState("highlightedNodeIds", newHighlightedIds);

    if (app) renderStage(app);
  }, [matchingNodes, nodeMap, query, setSearchState, theme.highlightColor]);

  const nodeResults = (matchingNodes ?? []).slice(0, MAX_RESULTS).map((node) => ({
    nodeId: node.id,
    primaryText: node.id,
  }));
  const nodeTotal = matchingNodes?.length ?? 0;
  const nodeOverflow = nodeTotal > MAX_RESULTS;
  const hasActiveSearch = Boolean(query);

  const handleSearch = () => {
    setSearchState("query", searchValue.trim().toLowerCase());
  };

  const handleClear = () => {
    clearSearchHighlights();
    setAllSearchState(searchStateInit);
  };

  const handleResultClick = (item) => {
    const node = matchingNodes?.find((n) => n.id === item?.nodeId);
    if (!node) return;
    setSearchState("matchingNodes", [node]);
  };

  return (
    <>
      <CodeEditorBlock
        text={"Search Graph Data"}
        textareaRef={textareaRef}
        defaultValue={searchValue}
        onClick={hasActiveSearch ? handleClear : handleSearch}
        infoHeading={"Search Graph Data"}
        infoDescription={"Search for nodes in the current graph by their name / ID."}
        buttonText={hasActiveSearch ? "Clear" : "Search"}
      />
      <>
        <TableList heading={`Node Matches (${nodeTotal})`} data={nodeResults} displayKey={"primaryText"} onItemClick={handleResultClick} />
        {nodeOverflow && <OverflowHint total={nodeTotal} />}
      </>
    </>
  );
}

function OverflowHint({ total }) {
  return <div className="text-secondary pad-top-05">Showing the first {MAX_RESULTS} of {total} matches.</div>;
}
