import { useCallback, useMemo, useRef, useState } from "react";

import { useSearchState, searchStateInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, SwitchBlock } from "../reusable_components/sidebarComponents.jsx";
import { useTheme } from "../../state/themeState.js";
import { handleEditorChange as handleEditorChangeHelper } from "../handlers/buttonHandlerFunctions.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { useGraphState } from "../../state/graphState.js";
import { centerOnLink, centerOnNodes, clearViewOrbitCenter } from "../../../domain/service/canvas_interaction/centerView.js";
import {
  getSearchLinkIds,
  getSearchLinkResults,
  getSearchNodeIds,
  getSearchNodeResults,
  hasSameValues,
  parseSearchQuery,
} from "../../../domain/service/search/search.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";
import { linkSearchDescription, nodeSearchDescription } from "./descriptions/searchDescriptions.jsx";
import { SearchLinkDetails, SearchNodeDetails, SearchResultSection } from "../reusable_components/searchResultComponents.jsx";

const MAX_RESULTS = 30;

export function SearchSidebar() {
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const {
    nodeSearchValue,
    nodeQuery,
    linkSearchValue,
    linkQuery,
    matchingNodes = [],
    matchingLinks = [],
    highlightedNodeIds,
    highlightedLinkIds,
    selectedNodeId,
    selectedLinkId,
  } = searchState;
  const { theme } = useTheme();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { displayName, entries } = useNodeDetails(selectedNodeId);

  const nodeTextareaRef = useRef(null);
  const linkTextareaRef = useRef(null);
  const [nodeSearchError, setNodeSearchError] = useState(null);
  const [linkSearchError, setLinkSearchError] = useState(null);
  const graphNodes = graphState.graph?.data?.nodes ?? [];
  const nodeById = useMemo(() => new Map(graphNodes.map((node) => [node.id, node])), [graphNodes]);

  const nodeResults = getSearchNodeResults(matchingNodes, MAX_RESULTS);
  const linkResults = getSearchLinkResults(matchingLinks, MAX_RESULTS);

  const nodeTotal = matchingNodes.length;
  const linkTotal = matchingLinks.length;
  const hasActiveNodeSearch = Boolean(nodeQuery);
  const hasActiveLinkSearch = Boolean(linkQuery);
  const hasActiveSearch = hasActiveNodeSearch || hasActiveLinkSearch;
  const showNodeClearButton = hasActiveNodeSearch && nodeSearchValue.trim().toLowerCase() === nodeQuery;
  const showLinkClearButton = hasActiveLinkSearch && linkSearchValue.trim().toLowerCase() === linkQuery;
  const allMatchNodeIds = useMemo(() => getSearchNodeIds(matchingNodes), [matchingNodes]);
  const allMatchLinkIds = useMemo(() => getSearchLinkIds(matchingLinks), [matchingLinks]);
  const allMatchCount = allMatchNodeIds.length + allMatchLinkIds.length;

  const handleNodeEditorChange = useCallback(
    (editor) => {
      setNodeSearchError(null);
      handleEditorChangeHelper(editor, (value) => setSearchState("nodeSearchValue", value));
    },
    [setSearchState],
  );
  const handleLinkEditorChange = useCallback(
    (editor) => {
      setLinkSearchError(null);
      handleEditorChangeHelper(editor, (value) => setSearchState("linkSearchValue", value));
    },
    [setSearchState],
  );

  const handleNodeSearch = () => {
    const nextQuery = nodeSearchValue.trim().toLowerCase();
    if (!nextQuery) {
      handleClearNodeSearch();
      return;
    }

    try {
      parseSearchQuery(nextQuery);
      setNodeSearchError(null);
    } catch (error) {
      setNodeSearchError(error instanceof Error ? error.message : String(error));
      return;
    }

    setAllSearchState({
      ...searchState,
      nodeSearchValue,
      nodeQuery: nextQuery,
      matchingNodes: [],
      selectedNodeId: null,
    });
    if (selectedNodeId) {
      clearViewOrbitCenter({ appearance });
    }
  };

  const handleLinkSearch = () => {
    const nextQuery = linkSearchValue.trim().toLowerCase();
    if (!nextQuery) {
      handleClearLinkSearch();
      return;
    }

    try {
      parseSearchQuery(nextQuery);
      setLinkSearchError(null);
    } catch (error) {
      setLinkSearchError(error instanceof Error ? error.message : String(error));
      return;
    }

    setAllSearchState({
      ...searchState,
      linkSearchValue,
      linkQuery: nextQuery,
      matchingLinks: [],
      selectedLinkId: null,
    });
  };

  const handleClearNodeSearch = () => {
    setNodeSearchError(null);
    if (selectedNodeId) {
      clearViewOrbitCenter({ appearance });
    }
    setAllSearchState({
      ...searchState,
      nodeSearchValue: searchStateInit.nodeSearchValue,
      nodeQuery: searchStateInit.nodeQuery,
      matchingNodes: searchStateInit.matchingNodes,
      selectedNodeId: null,
      highlightedNodeIds: [],
      highlightedLinkIds: getSearchLinkIds(matchingLinks),
    });
  };

  const handleClearLinkSearch = () => {
    setLinkSearchError(null);
    setAllSearchState({
      ...searchState,
      linkSearchValue: searchStateInit.linkSearchValue,
      linkQuery: searchStateInit.linkQuery,
      matchingLinks: searchStateInit.matchingLinks,
      selectedLinkId: null,
      highlightedNodeIds: getSearchNodeIds(matchingNodes),
      highlightedLinkIds: [],
    });
  };

  const handleNodeToggle = (item) => {
    const nodeId = item?.nodeId;
    if (!nodeId) return;
    const node = item?.node ?? matchingNodes?.find((n) => n.id === nodeId);
    const nextSelection = selectedNodeId === nodeId ? null : nodeId;
    setAllSearchState({
      ...searchState,
      selectedNodeId: nextSelection,
      selectedLinkId: null,
      highlightedNodeIds: node && nextSelection ? [node.id] : [],
      highlightedLinkIds: [],
    });
    if (!node || !nextSelection) {
      clearViewOrbitCenter({ appearance });
      return;
    }

    centerOnNodes([node], {
      appearance,
      renderState,
      container,
    });
  };

  const handleLinkToggle = (item) => {
    const linkId = item?.linkId;
    if (!linkId) return;
    const nextSelection = selectedLinkId === linkId ? null : linkId;
    setAllSearchState({
      ...searchState,
      selectedNodeId: null,
      selectedLinkId: nextSelection,
      highlightedNodeIds: [],
      highlightedLinkIds: nextSelection ? [linkId] : [],
    });
    if (!nextSelection) {
      clearViewOrbitCenter({ appearance });
      return;
    }

    centerOnLink(item?.link, { appearance, renderState, container, nodeById });
  };

  const isHighlightAllActive =
    allMatchCount > 0 &&
    Array.isArray(highlightedNodeIds) &&
    Array.isArray(highlightedLinkIds) &&
    hasSameValues(highlightedNodeIds, allMatchNodeIds) &&
    hasSameValues(highlightedLinkIds, allMatchLinkIds);

  const handleHighlightAllToggle = (event) => {
    if (allMatchCount === 0) return;
    const shouldEnable = event?.target?.checked ?? !isHighlightAllActive;
    setAllSearchState({
      ...searchState,
      highlightedNodeIds: shouldEnable ? allMatchNodeIds : [],
      highlightedLinkIds: shouldEnable ? allMatchLinkIds : [],
    });
  };

  const nodeResultSections = [
    {
      total: nodeTotal,
      heading: `Node Matches (${nodeTotal})`,
      data: nodeResults,
      expandedId: selectedNodeId,
      getItemId: (item) => item?.nodeId,
      onItemToggle: handleNodeToggle,
      renderExpandedContent: (item) => <SearchNodeDetails item={item} displayName={displayName} entries={entries} />,
    },
  ].filter((section) => section.total > 0);

  const linkResultSections = [
    {
      total: linkTotal,
      heading: `Link Matches (${linkTotal})`,
      data: linkResults,
      expandedId: selectedLinkId,
      getItemId: (item) => item?.linkId,
      onItemToggle: handleLinkToggle,
      renderExpandedContent: (item) => <SearchLinkDetails item={item} />,
    },
  ].filter((section) => section.total > 0);

  useSidebarCodeEditor({
    textareaRef: nodeTextareaRef,
    value: nodeSearchValue,
    onChange: handleNodeEditorChange,
    themeName: theme.name,
    onSubmit: showNodeClearButton ? handleClearNodeSearch : handleNodeSearch,
  });

  useSidebarCodeEditor({
    textareaRef: linkTextareaRef,
    value: linkSearchValue,
    onChange: handleLinkEditorChange,
    themeName: theme.name,
    onSubmit: showLinkClearButton ? handleClearLinkSearch : handleLinkSearch,
  });

  return (
    <>
      <CodeEditorBlock
        text={"Search Nodes"}
        textareaRef={nodeTextareaRef}
        compilerError={nodeSearchError}
        defaultValue={nodeSearchValue}
        onClick={showNodeClearButton ? handleClearNodeSearch : handleNodeSearch}
        infoHeading={"Search Nodes"}
        infoDescription={nodeSearchDescription}
        buttonText={showNodeClearButton ? "Clear" : "Search"}
        buttonVariant={showNodeClearButton ? "secondary" : "default"}
      />
      <CodeEditorBlock
        text={"Search Links"}
        textareaRef={linkTextareaRef}
        compilerError={linkSearchError}
        defaultValue={linkSearchValue}
        onClick={showLinkClearButton ? handleClearLinkSearch : handleLinkSearch}
        infoHeading={"Search Links"}
        infoDescription={linkSearchDescription}
        buttonText={showLinkClearButton ? "Clear" : "Search"}
        buttonVariant={showLinkClearButton ? "secondary" : "default"}
      />
      <>
        {!hasActiveSearch ? (
          <div className="search-empty-hint text-secondary">Enter a node or link query above to search graph data.</div>
        ) : (
          <>
            {allMatchCount > 0 && (
              <SwitchBlock
                value={isHighlightAllActive}
                setValue={handleHighlightAllToggle}
                text={"Highlight all Matches"}
                infoHeading={"Highlight all Matches"}
                infoDescription={"Toggle to highlight every node or link that matches the current search."}
              />
            )}
            {hasActiveNodeSearch &&
              (nodeTotal === 0 ? (
                <div className="search-empty-hint text-secondary">No nodes matched your node query.</div>
              ) : (
                nodeResultSections.map((section) => <SearchResultSection key={section.heading} maxResults={MAX_RESULTS} {...section} />)
              ))}
            {hasActiveLinkSearch &&
              (linkTotal === 0 ? (
                <div className="search-empty-hint text-secondary">No links matched your link query.</div>
              ) : (
                linkResultSections.map((section) => <SearchResultSection key={section.heading} maxResults={MAX_RESULTS} {...section} />)
              ))}
          </>
        )}
      </>
    </>
  );
}
