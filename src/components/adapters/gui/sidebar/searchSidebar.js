import { useCallback, useMemo, useRef } from "react";

import { useSearchState, searchStateInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, DetailRow, PopupTextField, SwitchBlock, ToggleList } from "../reusable_components/sidebarComponents.js";
import { useTheme } from "../../state/themeState.js";
import { handleEditorChange as handleEditorChangeHelper } from "../handlers/buttonHandlerFunctions.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { useGraphState } from "../../state/graphState.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";
import { formatWeight, getCentroid } from "../../../domain/service/graph_calculations/graphUtils.js";
import {
  formatSearchLinkLabel,
  getLinkEndpointIds,
  getSearchHighlightNodeIds,
  getSearchLinkEndpointIds,
  getSearchNodeIds,
} from "../../../domain/service/search/search.js";
import { useNodeDetails } from "../hooks/useNodeDetails.js";

const MAX_RESULTS = 30;
const DETAIL_LIST_LIMIT = 12;
const SEARCH_SELECTION_KEYS = ["selectedNodeId", "selectedLinkId", "selectedNodeAttribute", "selectedLinkAttribute"];
const searchGraphDataDescription = (
  <div>
    <div className="margin-0">
      You can search the current graph by formulating a query. Simple text queries are matched against node IDs, link IDs, link endpoints, attributes,
      and link weights. Attribute expressions use the same syntax as attribute filters: combine groups with <PopupTextField textInside={"and"} />,
      allow alternatives inside parentheses with <PopupTextField textInside={"or"} />, quote attributes with more than one word, and use{" "}
      <PopupTextField textInside={"not"} /> to exclude attributes. You can also group several attributes as a set, for example{" "}
      <PopupTextField textInside={'{mRNA splicing, signaling, "glucose metabolism"}'} />, or restrict the number of attributes with{" "}
      <PopupTextField textInside={">"} />, <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />,{" "}
      <PopupTextField textInside={"<="} /> or <PopupTextField textInside={"="} />.
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with node or link attributes such as <PopupTextField textInside={"mRNA splicing"} />,{" "}
      <PopupTextField textInside={"glucose metabolism"} />, <PopupTextField textInside={"VEGF signaling"} /> and{" "}
      <PopupTextField textInside={"MTOR signaling"} />, some valid searches could be:
    </div>
    <div className="pad-top-05" />
    <PopupTextField textInside={"AKT1"} /> <PopupTextField textInside={"signaling"} /> <PopupTextField textInside={"not signaling"} />{" "}
    <PopupTextField textInside={">= 2"} /> <PopupTextField textInside={"not {MTOR, VEGF, mRNA}"} />{" "}
    <PopupTextField textInside={'signaling and "mRNA splicing"'} /> <PopupTextField textInside={"(metabolism or signaling) and >= 2"} />{" "}
    <PopupTextField textInside={'("mRNA splicing" or VEGF) and ("glucose metabolism" or MTOR)'} />
  </div>
);

export function SearchSidebar() {
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const {
    searchValue,
    query,
    matchingNodes = [],
    matchingLinks = [],
    matchingNodeAttributes = [],
    matchingLinkAttributes = [],
    highlightedNodeIds,
    selectedNodeId,
    selectedLinkId,
    selectedNodeAttribute,
    selectedLinkAttribute,
  } = searchState;
  const { theme } = useTheme();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();
  const { graphState } = useGraphState();
  const { displayName, entries } = useNodeDetails(selectedNodeId);

  const textareaRef = useRef(null);
  const graphNodes = graphState.graph?.data?.nodes ?? [];
  const nodeById = useMemo(() => new Map(graphNodes.map((node) => [node.id, node])), [graphNodes]);

  const nodeResults = matchingNodes.slice(0, MAX_RESULTS).map((node) => ({
    nodeId: node.id,
    primaryText: node.id,
    secondaryText: formatAttributeCount(node.attribs?.length, "attribute"),
    node,
  }));
  const linkResults = matchingLinks.slice(0, MAX_RESULTS).map((entry) => ({
    ...entry,
    primaryText: formatSearchLinkLabel(entry),
    secondaryText: formatAttributeCount(entry.link?.attribs?.length, "attribute"),
  }));
  const nodeAttributeResults = matchingNodeAttributes.slice(0, MAX_RESULTS).map((entry) => ({
    ...entry,
    primaryText: entry.attribute,
    secondaryText: formatAttributeCount(entry.count, "node"),
  }));
  const linkAttributeResults = matchingLinkAttributes.slice(0, MAX_RESULTS).map((entry) => ({
    ...entry,
    primaryText: entry.attribute,
    secondaryText: formatAttributeCount(entry.count, "link"),
  }));

  const nodeTotal = matchingNodes.length;
  const linkTotal = matchingLinks.length;
  const nodeAttributeTotal = matchingNodeAttributes.length;
  const linkAttributeTotal = matchingLinkAttributes.length;
  const totalMatches = nodeTotal + linkTotal + nodeAttributeTotal + linkAttributeTotal;
  const hasActiveSearch = Boolean(query);
  const hasModifiedInput = hasActiveSearch && searchValue.trim().toLowerCase() !== query;
  const showClearButton = hasActiveSearch && !hasModifiedInput;
  const allMatchNodeIds = useMemo(() => getSearchHighlightNodeIds(matchingNodes, matchingLinks), [matchingNodes, matchingLinks]);

  const handleEditorChange = useCallback(
    (editor) => handleEditorChangeHelper(editor, (value) => setSearchState("searchValue", value)),
    [setSearchState],
  );

  const handleSearch = () => {
    const nextQuery = searchValue.trim().toLowerCase();
    if (!nextQuery) {
      handleClear();
      return;
    }

    setAllSearchState({
      ...searchStateInit,
      searchValue,
      query: nextQuery,
    });
  };

  const handleClear = () => {
    setAllSearchState(searchStateInit);
  };

  const handleClearAndSearch = () => {
    handleSearch();
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
    centerOnNode(node, {
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
    centerOnSearchNodes(getNodesByIds(endpointIds, nodeById), { appearance, renderState, container });
  };

  const handleNodeAttributeToggle = (item) => {
    const attribute = item?.attribute;
    if (!attribute) return;
    const nextSelection = selectedNodeAttribute === attribute ? null : attribute;
    clearOtherSelections("selectedNodeAttribute");
    setSearchState("selectedNodeAttribute", nextSelection);
    if (!nextSelection) return;

    const nodeIds = getSearchNodeIds(item.nodes);
    setSearchState("highlightedNodeIds", nodeIds);
    centerOnSearchNodes(item.nodes ?? [], { appearance, renderState, container });
  };

  const handleLinkAttributeToggle = (item) => {
    const attribute = item?.attribute;
    if (!attribute) return;
    const nextSelection = selectedLinkAttribute === attribute ? null : attribute;
    clearOtherSelections("selectedLinkAttribute");
    setSearchState("selectedLinkAttribute", nextSelection);
    if (!nextSelection) return;

    const endpointIds = getSearchLinkEndpointIds(item.links);
    setSearchState("highlightedNodeIds", endpointIds);
    centerOnSearchNodes(getNodesByIds(endpointIds, nodeById), { appearance, renderState, container });
  };

  const isHighlightAllActive = allMatchNodeIds.length > 0 && Array.isArray(highlightedNodeIds) && haveSameValues(highlightedNodeIds, allMatchNodeIds);

  const handleHighlightAllToggle = (event) => {
    if (allMatchNodeIds.length === 0) return;
    const shouldEnable = event?.target?.checked ?? !isHighlightAllActive;
    setSearchState("highlightedNodeIds", shouldEnable ? allMatchNodeIds : []);
  };

  const resultSections = [
    {
      total: nodeTotal,
      heading: `Node Matches (${nodeTotal})`,
      data: nodeResults,
      expandedId: selectedNodeId,
      getItemId: (item) => item?.nodeId,
      onItemToggle: handleNodeToggle,
      renderExpandedContent: (item) => (
        <div className="toggle-list-details">
          <DetailRow label={"Name"} value={formatDetailValue(displayName || item?.nodeId)} />
          <NodeEntriesBlock entries={entries} />
          <DetailRow label={"Annotations"} value={formatValues(item?.node?.attribs)} />
        </div>
      ),
    },
    {
      total: linkTotal,
      heading: `Link Matches (${linkTotal})`,
      data: linkResults,
      expandedId: selectedLinkId,
      getItemId: (item) => item?.linkId,
      onItemToggle: handleLinkToggle,
      renderExpandedContent: (item) => (
        <div className="toggle-list-details">
          <DetailRow label={"Source"} value={formatDetailValue(item.sourceId)} />
          <DetailRow label={"Target"} value={formatDetailValue(item.targetId)} />
          <DetailRow label={"Attributes"} value={formatValues(item.link?.attribs)} />
          <DetailRow label={"Weights"} value={formatValues(item.link?.weights, formatSearchWeight)} />
        </div>
      ),
    },
    {
      total: nodeAttributeTotal,
      heading: `Node Attribute Matches (${nodeAttributeTotal})`,
      data: nodeAttributeResults,
      expandedId: selectedNodeAttribute,
      getItemId: (item) => item?.attribute,
      onItemToggle: handleNodeAttributeToggle,
      renderExpandedContent: (item) => (
        <div className="toggle-list-details">
          <DetailRow label={"Attribute"} value={item.attribute} />
          <DetailRow label={"Matching Nodes"} value={formatLimitedValues((item.nodes ?? []).map((node) => node.id))} />
        </div>
      ),
    },
    {
      total: linkAttributeTotal,
      heading: `Link Attribute Matches (${linkAttributeTotal})`,
      data: linkAttributeResults,
      expandedId: selectedLinkAttribute,
      getItemId: (item) => item?.attribute,
      onItemToggle: handleLinkAttributeToggle,
      renderExpandedContent: (item) => (
        <div className="toggle-list-details">
          <DetailRow label={"Attribute"} value={item.attribute} />
          <DetailRow label={"Matching Links"} value={formatLimitedValues((item.links ?? []).map(formatSearchLinkLabel))} />
        </div>
      ),
    },
  ].filter((section) => section.total > 0);

  useSidebarCodeEditor({
    textareaRef,
    value: searchValue,
    onChange: handleEditorChange,
    themeName: theme.name,
    onSubmit: showClearButton ? handleClear : hasModifiedInput ? handleClearAndSearch : handleSearch,
  });

  return (
    <>
      <CodeEditorBlock
        text={"Search Graph Data"}
        textareaRef={textareaRef}
        defaultValue={searchValue}
        onClick={showClearButton ? handleClear : hasModifiedInput ? handleClearAndSearch : handleSearch}
        infoHeading={"Search Graph Data"}
        infoDescription={searchGraphDataDescription}
        buttonText={showClearButton ? "Clear" : "Search"}
        buttonVariant={showClearButton ? "secondary" : "default"}
      />
      <>
        {!hasActiveSearch ? (
          <div className="search-empty-hint text-secondary">Enter a query above to find nodes, links, or attributes.</div>
        ) : totalMatches === 0 ? (
          <div className="search-empty-hint text-secondary">No nodes, links, or attributes matched your query.</div>
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
            {resultSections.map((section) => (
              <SearchResultSection key={section.heading} {...section} />
            ))}
          </>
        )}
      </>
    </>
  );
}

function formatDetailValue(value) {
  if (value === undefined || value === null || value === "") return "None";
  return value;
}

function formatValues(values, formatter = stringifyValue) {
  const formattedValues = (values ?? []).map(formatter).filter(Boolean);
  return formattedValues.length ? formattedValues.join(", ") : "None";
}

function formatAttributeCount(count, singularLabel) {
  const numericCount = Number.isFinite(count) ? count : 0;
  const label = numericCount === 1 ? singularLabel : `${singularLabel}s`;
  return `${numericCount} ${label}`;
}

function formatLimitedValues(values, limit = DETAIL_LIST_LIMIT) {
  const formattedValues = (values ?? []).map(stringifyValue).filter(Boolean);
  if (formattedValues.length === 0) return "None";
  if (formattedValues.length <= limit) return formattedValues;
  return [...formattedValues.slice(0, limit), `${formattedValues.length - limit} more`];
}

function formatSearchWeight(weight) {
  return typeof weight === "number" && Number.isFinite(weight) ? formatWeight(weight) : stringifyValue(weight);
}

function getNodesByIds(nodeIds, nodeById) {
  return (nodeIds ?? []).map((nodeId) => nodeById.get(nodeId)).filter(Boolean);
}

function centerOnSearchNodes(nodes, viewState) {
  const positionedNodes = (nodes ?? []).filter((node) => Number.isFinite(node?.x) && Number.isFinite(node?.y));
  if (positionedNodes.length === 0) return;
  centerOnNode(positionedNodes.length === 1 ? positionedNodes[0] : getCentroid(positionedNodes), viewState);
}

function haveSameValues(left = [], right = []) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function stringifyValue(value) {
  if (value === undefined || value === null || value === "") return "";
  return value.toString();
}

function SearchResultSection({ total, heading, data, expandedId, getItemId, onItemToggle, renderExpandedContent }) {
  return (
    <>
      <ToggleList
        heading={heading}
        data={data}
        displayKey={"primaryText"}
        secondaryKey={"secondaryText"}
        expandedId={expandedId}
        getItemId={getItemId}
        onItemToggle={onItemToggle}
        renderExpandedContent={renderExpandedContent}
      />
      {total > MAX_RESULTS && <OverflowHint total={total} />}
    </>
  );
}

function NodeEntriesBlock({ entries }) {
  const hasEntries = Array.isArray(entries) && entries.length > 0;

  return (
    <div className="toggle-list-detail-item toggle-list-detail-block">
      {hasEntries ? (
        <table className="toggle-list-detail-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phosphosites</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ id, name, phosphosites }, index) => {
              const phosphositeText = formatValues(phosphosites);
              return (
                <tr key={`${id}-${name}-${index}`}>
                  <td title={stringifyValue(id) || undefined}>{formatDetailValue(id)}</td>
                  <td title={stringifyValue(name) || undefined}>{formatDetailValue(name)}</td>
                  <td title={phosphositeText === "None" ? undefined : phosphositeText}>{phosphositeText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <span className="text-secondary toggle-list-detail-value">None</span>
      )}
    </div>
  );
}

function OverflowHint({ total }) {
  return (
    <div className="overflow-hint">
      Showing the first {MAX_RESULTS} of {total} matches.
    </div>
  );
}
