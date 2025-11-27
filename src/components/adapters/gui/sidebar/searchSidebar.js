import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGraphState } from "../../state/graphState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useTheme } from "../../state/themeState.js";
import { usePixiState } from "../../state/pixiState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { clearNodeHighlight, highlightNode, render as renderStage } from "../../../domain/service/canvas_drawing/draw.js";

const MAX_RESULTS = 20;

export function SearchSidebar() {
  const { graphState } = useGraphState();
  const { theme } = useTheme();
  const { pixiState } = usePixiState();
  const { renderState } = useRenderState();
  const textareaRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");
  const highlightedNodesRef = useRef([]);

  const nodes = graphState.graph?.data?.nodes ?? [];
  const normalizedQuery = query.trim().toLowerCase();

  const handleEditorChange = useCallback((editor) => {
    setSearchValue(editor.getValue());
  }, []);

  useSidebarCodeEditor({
    textareaRef,
    value: searchValue,
    onChange: handleEditorChange,
    themeName: theme.name,
  });

  const clearSearchHighlights = useCallback(() => {
    if (!pixiState?.nodeMap || highlightedNodesRef.current.length === 0) return;

    highlightedNodesRef.current.forEach((nodeId) => {
      const {circle} = pixiState.nodeMap[nodeId];
      clearNodeHighlight(circle);
    });
    highlightedNodesRef.current = [];

    if (renderState?.app) {
      renderStage(renderState.app);
    }
  }, [pixiState?.nodeMap, renderState?.app]);

  useEffect(() => {
    return () => clearSearchHighlights();
  }, [clearSearchHighlights]);

  const applySearchHighlights = useCallback(
    (matchingNodes) => {
      clearSearchHighlights();

      if (!pixiState?.nodeMap || !matchingNodes?.length) return;

      matchingNodes.forEach((node) => {
        const {circle} = pixiState.nodeMap[node.id];
        highlightNode(circle, theme.circleBorderColor, theme.name);
        highlightedNodesRef.current.push(node.id);
      });

      if (renderState?.app) {
        renderStage(renderState.app);
      }
    },
    [clearSearchHighlights, pixiState?.nodeMap, renderState?.app, theme.circleBorderColor, theme.name]
  );

  const matchingNodes = useMemo(() => getMatchingNodes(nodes, normalizedQuery), [nodes, normalizedQuery]);
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

    setQuery(searchValue);
    applySearchHighlights(matches);
  }, [applySearchHighlights, nodes, searchValue]);

  const handleClear = useCallback(() => {
    clearSearchHighlights();
    setQuery("");
    setSearchValue("");
  }, [clearSearchHighlights]);

  const showResults = Boolean(normalizedQuery);
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

function getMatchingNodes(nodes, normalizedQuery) {
  if (!normalizedQuery) {
    return [];
  }

  return nodes.filter((node) => nodeMatchesQuery(node, normalizedQuery));
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
