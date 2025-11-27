import { useCallback, useEffect, useRef } from "react";

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

  const handleEditorChange = useCallback(
    (editor) => setSearchState("searchValue", editor.getValue()),
    [setSearchState]
  );

  useSidebarCodeEditor({
    textareaRef,
    value: searchValue,
    onChange: handleEditorChange,
    themeName: theme.name,
  });

  const clearSearchHighlights = () => {
    if (!nodeMap || highlightedNodeIds.length === 0) return;

    highlightedNodeIds.forEach((nodeId) => {
      const circle = nodeMap[nodeId]?.circle;
      if (circle) clearNodeHighlight(circle);
    });
    setSearchState("highlightedNodeIds", highlightedNodeIdsInit);
  };

  useEffect(() => {
    if (!query || !nodes) return;
    console.log("applying query")

    const matches = getMatchingNodes(nodes, query);
    setSearchState("matchingNodes", matches);
  }, [nodes, query, setSearchState]);

  useEffect(() => {
    if (!query) {
      clearSearchHighlights();
      return;
    }
    if (!nodeMap) return;
    console.log("applying search highlights")

    clearSearchHighlights();

    const newHighlightedIds = [];
    matchingNodes?.forEach((node) => {
      const circle = nodeMap[node.id]?.circle;
      if (!circle) return;
      highlightNode(circle, theme.highlightColor);
      newHighlightedIds.push(node.id);
    });

    setSearchState("highlightedNodeIds", newHighlightedIds);
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

  const handleEntryHighlight = (item) => {
    const node = matchingNodes?.find((n) => n.id === item?.nodeId);
    if (!node) return;

    if (!nodeMap || !nodeMap[node.id]?.circle) return;

    clearSearchHighlights();
    const circle = nodeMap[node.id].circle;
    highlightNode(circle, theme.highlightColor);
    setSearchState("highlightedNodeIds", [node.id]);
    if (app) renderStage(app);
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
        <TableList heading={`Node Matches (${nodeTotal})`} data={nodeResults} displayKey={"primaryText"} onItemClick={handleEntryHighlight} />
        {nodeOverflow && <OverflowHint total={nodeTotal} />}
      </>
    </>
  );
}

function OverflowHint({ total }) {
  return <div className="text-secondary pad-top-05">Showing the first {MAX_RESULTS} of {total} matches.</div>;
}
