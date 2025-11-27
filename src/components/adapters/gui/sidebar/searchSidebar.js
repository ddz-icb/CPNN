import { useCallback, useEffect, useMemo, useRef } from "react";

import { useGraphState } from "../../state/graphState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useTheme } from "../../state/themeState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useSearchState, searchStateInit, highlightedNodeIdsInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { clearNodeHighlight, highlightNode, render as renderStage } from "../../../domain/service/canvas_drawing/draw.js";
import { getMatchingNodes} from "../../../domain/service/search/search.js";
import { getNodeIdName } from "../../../domain/service/parsing/nodeIdParsing.js";

const MAX_RESULTS = 30;

export function SearchSidebar() {
  const { graphState } = useGraphState();
  const { theme } = useTheme();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const { searchValue, query, highlightedNodeIds } = searchState;

  const textareaRef = useRef(null);

  const nodes = graphState.graph?.data?.nodes ?? [];

  const handleEditorChange = useCallback((editor) => {
    setSearchState("searchValue", editor.getValue());
  }, [setSearchState]);

  useSidebarCodeEditor({
    textareaRef,
    value: searchValue,
    onChange: handleEditorChange,
    themeName: theme.name,
  });

  const clearSearchHighlights = useCallback(() => {
    if (!pixiState?.nodeMap || highlightedNodeIds.length === 0) return;

    highlightedNodeIds.forEach((nodeId) => {
      const {circle} = pixiState?.nodeMap[nodeId];
      clearNodeHighlight(circle);
    });
    setSearchState("highlightedNodeIds", highlightedNodeIdsInit);

    if (renderState?.app) {
      renderStage(renderState.app);
    }
  }, [renderState?.app, pixiState?.nodeMap, highlightedNodeIds]);

  const applySearchHighlights = useCallback(
    (matchingNodes) => {
      clearSearchHighlights();

      if (!pixiState?.nodeMap || !matchingNodes?.length) return;

      const newHighlightedIds = [];
      matchingNodes.forEach((node) => {
        const {circle} = pixiState?.nodeMap[node.id];
        highlightNode(circle, theme.highlightColor);
        newHighlightedIds.push(node.id);
      });
      setSearchState("highlightedNodeIds", newHighlightedIds);

      if (renderState?.app) {
        renderStage(renderState.app);
      }
    },
    [renderState?.app, clearSearchHighlights, pixiState?.nodeMap, setSearchState, theme.highlightColor, graphState.graph]
  );

  const matchingNodes = useMemo(() => getMatchingNodes(nodes, query), [nodes, query]);
  const { nodeResults, nodeTotal } = useMemo(() => {
    return {
      nodeResults: matchingNodes.slice(0, MAX_RESULTS).map((node) => ({
        nodeId: node.id,
        primaryText: node.id,
      })),
      nodeTotal: matchingNodes.length,
    };
  }, [matchingNodes]);
  const showResults = Boolean(query);
  const nodeOverflow = nodeTotal > MAX_RESULTS;
  const hasActiveSearch = showResults;

  const handleSearch = useCallback(() => {
    console.log("HHEE?", nodes)
    const normalizedSearch = searchValue.trim().toLowerCase();
    const matches = getMatchingNodes(nodes, normalizedSearch);

    setSearchState("query", searchValue.trim().toLowerCase());
    applySearchHighlights(matches);
  }, [applySearchHighlights, nodes, searchValue, setSearchState]);

  const handleClear = useCallback(() => {
    clearSearchHighlights();
    setAllSearchState(searchStateInit);
  }, [clearSearchHighlights, setAllSearchState]);

  const handleResultClick = useCallback(
    (item) => {
      const node = matchingNodes.find((n) => n.id === item?.nodeId);
      if (!node) return;
      applySearchHighlights([node]);
    },
    [applySearchHighlights, matchingNodes]
  );

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
        <TableList
          heading={`Node Matches (${nodeTotal})`}
          data={nodeResults}
          displayKey={"primaryText"}
          onItemClick={handleResultClick}
        />
        {nodeOverflow && <OverflowHint total={nodeTotal} />}
      </>
    </>
  );
}

function OverflowHint({ total }) {
  return <div className="text-secondary pad-top-05">Showing the first {MAX_RESULTS} of {total} matches.</div>;
}
