import { useCallback, useMemo, useRef } from "react";

import { useSearchState, searchStateInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, SwitchBlock } from "../reusable_components/sidebarComponents.js";
import { useTheme } from "../../state/themeState.js";
import { handleEditorChange as handleEditorChangeHelper } from "../handlers/buttonHandlerFunctions.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { useGraphState } from "../../state/graphState.js";
import { centerOnNodes } from "../../../domain/service/canvas_interaction/centerView.js";
import {
  getLinkEndpointIds,
  getNodesByIds,
  getSearchHighlightNodeIds,
  getSearchLinkResults,
  getSearchNodeResults,
  hasSameValues,
} from "../../../domain/service/search/search.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";
import { linkSearchDescription, nodeSearchDescription } from "./descriptions/searchDescriptions.js";
import {
  SearchLinkDetails,
  SearchNodeDetails,
  SearchResultSection,
} from "./searchResultComponents.js";

const MAX_RESULTS = 30;
const SEARCH_SELECTION_KEYS = ["selectedNodeId", "selectedLinkId"];

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
  const allMatchNodeIds = useMemo(() => getSearchHighlightNodeIds(matchingNodes, matchingLinks), [matchingNodes, matchingLinks]);

  const handleNodeEditorChange = useCallback(
    (editor) => handleEditorChangeHelper(editor, (value) => setSearchState("nodeSearchValue", value)),
    [setSearchState],
  );
  const handleLinkEditorChange = useCallback(
    (editor) => handleEditorChangeHelper(editor, (value) => setSearchState("linkSearchValue", value)),
    [setSearchState],
  );

  const handleNodeSearch = () => {
    const nextQuery = nodeSearchValue.trim().toLowerCase();
    if (!nextQuery) {
      handleClearNodeSearch();
      return;
    }

    setAllSearchState({
      ...searchState,
      nodeSearchValue,
      nodeQuery: nextQuery,
      matchingNodes: [],
      selectedNodeId: null,
    });
  };

  const handleLinkSearch = () => {
    const nextQuery = linkSearchValue.trim().toLowerCase();
    if (!nextQuery) {
      handleClearLinkSearch();
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
    setAllSearchState({
      ...searchState,
      nodeSearchValue: searchStateInit.nodeSearchValue,
      nodeQuery: searchStateInit.nodeQuery,
      matchingNodes: searchStateInit.matchingNodes,
      selectedNodeId: null,
      highlightedNodeIds: getSearchHighlightNodeIds([], matchingLinks),
    });
  };

  const handleClearLinkSearch = () => {
    setAllSearchState({
      ...searchState,
      linkSearchValue: searchStateInit.linkSearchValue,
      linkQuery: searchStateInit.linkQuery,
      matchingLinks: searchStateInit.matchingLinks,
      selectedLinkId: null,
      highlightedNodeIds: getSearchHighlightNodeIds(matchingNodes, []),
    });
  };

  const clearOtherSelections = (activeKey) => {
    SEARCH_SELECTION_KEYS.forEach((key) => {
      if (key !== activeKey) setSearchState(key, null);
    });
  };

  const handleNodeToggle = (item) => {
    const nodeId = item?.nodeId;
    if (!nodeId) return;
    const node = item?.node ?? matchingNodes?.find((n) => n.id === nodeId);
    const nextSelection = selectedNodeId === nodeId ? null : nodeId;
    clearOtherSelections("selectedNodeId");
    setSearchState("selectedNodeId", nextSelection);
    if (!node || !nextSelection) return;

    setSearchState("highlightedNodeIds", [node.id]);
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
    clearOtherSelections("selectedLinkId");
    setSearchState("selectedLinkId", nextSelection);
    if (!nextSelection) return;

    const endpointIds = getLinkEndpointIds(item);
    setSearchState("highlightedNodeIds", endpointIds);
    centerOnNodes(getNodesByIds(endpointIds, nodeById), { appearance, renderState, container });
  };

  const isHighlightAllActive = allMatchNodeIds.length > 0 && Array.isArray(highlightedNodeIds) && hasSameValues(highlightedNodeIds, allMatchNodeIds);

  const handleHighlightAllToggle = (event) => {
    if (allMatchNodeIds.length === 0) return;
    const shouldEnable = event?.target?.checked ?? !isHighlightAllActive;
    setSearchState("highlightedNodeIds", shouldEnable ? allMatchNodeIds : []);
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
            {allMatchNodeIds.length > 0 && (
              <SwitchBlock
                value={isHighlightAllActive}
                setValue={handleHighlightAllToggle}
                text={"Highlight all Matches"}
                infoHeading={"Highlight all Matches"}
                infoDescription={"Toggle to highlight every node that matches the current search."}
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
