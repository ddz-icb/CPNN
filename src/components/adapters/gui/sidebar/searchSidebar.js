import { useCallback, useEffect, useMemo, useRef } from "react";

import { useGraphState } from "../../state/graphState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useTheme } from "../../state/themeState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useSearchState, searchStateInit, highlightedNodeIdsInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { clearNodeHighlight, highlightNode, render as renderStage } from "../../../domain/service/canvas_drawing/draw.js";

const MAX_RESULTS = 30;

export function SearchSidebar() {
  const { graphState } = useGraphState();
  const { theme } = useTheme();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const { searchValue, query, highlightedNodeIds } = searchState;

  const textareaRef = useRef(null);
  const highlightedNodesRef = useRef(highlightedNodeIds ?? []);

  const nodes = graphState.graph?.data?.nodes ?? [];

  useEffect(() => {
    highlightedNodesRef.current = highlightedNodeIds ?? [];
  }, [highlightedNodeIds]);

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
    if (!pixiState?.nodeMap || highlightedNodesRef.current.length === 0) return;

    highlightedNodesRef.current.forEach((nodeId) => {
      const {circle} = pixiState?.nodeMap[nodeId];
      clearNodeHighlight(circle);
    });
    highlightedNodesRef.current = [];
    setSearchState("highlightedNodeIds", highlightedNodeIdsInit);

    if (renderState?.app) {
      renderStage(renderState.app);
    }
  }, [renderState?.app, pixiState?.nodeMap, setSearchState]);

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
      highlightedNodesRef.current = newHighlightedIds;
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
        primaryText: getNodeLabel(node),
        secondaryText: formatNodeSecondary(node),
      })),
      nodeTotal: matchingNodes.length,
    };
  }, [matchingNodes]);

  const handleSearch = useCallback(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const matches = getMatchingNodes(nodes, normalizedSearch);

    setSearchState("query", searchValue.trim().toLowerCase());
    applySearchHighlights(matches);
  }, [applySearchHighlights, nodes, searchValue, setSearchState]);

  const handleClear = useCallback(() => {
    clearSearchHighlights();
    setAllSearchState(searchStateInit);
  }, [clearSearchHighlights, setAllSearchState]);

  const showResults = Boolean(query);
  const nodeOverflow = nodeTotal > MAX_RESULTS;
  const hasActiveSearch = showResults;

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
          secondaryKey={"secondaryText"}
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

function getMatchingNodes(nodes, query) {
  if (!query) {
    return [];
  }

  return nodes.filter((node) => nodeMatchesQuery(node, query));
}

function nodeMatchesQuery(node, query) {
  return matchesQuery([node?.label, node?.id, node?.group, node?.type], query);
}

function matchesQuery(values, query) {
  return values.some((value) => {
    if (value === undefined || value === null) return false;
    return value.toString().toLowerCase().includes(query);
  });
}

function getNodeLabel(node) {
  return (node?.label ?? node?.id ?? "Unnamed node").toString();
}

function formatNodeSecondary(node) {
  const id = node?.id?.toString();
  const label = node?.label?.toString();

  if (id && label && label !== id) {
    return `ID: ${id}`;
  }

  if (node?.group !== undefined) {
    return `Group: ${node.group}`;
  }

  if (node?.type) {
    return node.type.toString();
  }

  return "";
}
