import { useCallback, useRef } from "react";

import { useSearchState, searchStateInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, DetailRow, SwitchBlock, ToggleList } from "../reusable_components/sidebarComponents.js";
import { useTheme } from "../../state/themeState.js";
import { handleEditorChange as handleEditorChangeHelper } from "../handlers/buttonHandlerFunctions.js";
import { useAppearance } from "../../state/appearanceState.js";
import { useRenderState } from "../../state/canvasState.js";
import { useContainer } from "../../state/containerState.js";
import { centerOnNode } from "../../../domain/service/canvas_interaction/centerView.js";
import { useProteinDetails } from "../hooks/useProteinDetails.js";

const MAX_RESULTS = 30;

export function SearchSidebar() {
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const { searchValue, query, matchingNodes, highlightedNodeIds, selectedNodeId } = searchState;
  const { theme } = useTheme();
  const { appearance } = useAppearance();
  const { renderState } = useRenderState();
  const { container } = useContainer();
  const { gene, isoforms } = useProteinDetails(selectedNodeId);

  const textareaRef = useRef(null);

  const handleEditorChange = useCallback(
    (editor) => handleEditorChangeHelper(editor, (value) => setSearchState("searchValue", value)),
    [setSearchState],
  );

  const handleSearch = () => {
    setSearchState("query", searchValue.trim().toLowerCase());
  };

  const handleClear = () => {
    setAllSearchState(searchStateInit);
  };

  const handleNodeToggle = (item) => {
    const nodeId = item?.nodeId;
    if (!nodeId) return;
    const node = item?.node ?? matchingNodes?.find((n) => n.id === nodeId);
    const nextSelection = selectedNodeId === nodeId ? null : nodeId;
    setSearchState("selectedNodeId", nextSelection);
    if (!node || !nextSelection) return;

    setSearchState("highlightedNodeIds", [node.id]);
    centerOnNode(node, {
      appearance,
      renderState,
      container,
    });
  };

  const matchIds = matchingNodes ? matchingNodes.map((node) => node.id) : [];
  const isHighlightAllActive =
    matchIds.length > 0 &&
    Array.isArray(highlightedNodeIds) &&
    highlightedNodeIds.length === matchIds.length &&
    highlightedNodeIds.every((id) => matchIds.includes(id));

  const handleHighlightAllToggle = (event) => {
    if (matchIds.length === 0) return;
    const shouldEnable = event?.target?.checked ?? !isHighlightAllActive;
    setSearchState("highlightedNodeIds", shouldEnable ? matchIds : []);
  };

  useSidebarCodeEditor({
    textareaRef,
    value: searchValue,
    onChange: handleEditorChange,
    themeName: theme.name,
  });

  const nodeResults = (matchingNodes ?? []).slice(0, MAX_RESULTS).map((node) => ({
    nodeId: node.id,
    primaryText: node.id,
    node,
  }));
  const nodeTotal = matchingNodes?.length ?? 0;
  const nodeOverflow = nodeTotal > MAX_RESULTS;
  const hasActiveSearch = Boolean(query);

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
        {hasActiveSearch && nodeTotal > 0 && (
          <SwitchBlock
            value={isHighlightAllActive}
            setValue={handleHighlightAllToggle}
            text={"Highlight all Matches"}
            infoHeading={"Highlight all Matches"}
            infoDescription={"Toggle to highlight every node that matches the current search."}
          />
        )}
        <ToggleList
          heading={`Node Matches (${nodeTotal})`}
          data={nodeResults}
          displayKey={"primaryText"}
          expandedId={selectedNodeId}
          getItemId={(item) => item?.nodeId}
          onItemToggle={handleNodeToggle}
          renderExpandedContent={(item) => (
            <div className="toggle-list-details">
              <DetailRow label={"Name"} value={formatDetailValue(gene || item?.nodeId)} />
              <ProteinIdsBlock isoforms={isoforms} />
              <DetailRow label={"Annotations"} value={formatAnnotations(item?.node?.attribs)} />
            </div>
          )}
        />
        {nodeOverflow && <OverflowHint total={nodeTotal} />}
      </>
    </>
  );
}

function formatDetailValue(value) {
  if (value === undefined || value === null || value === "") return "None";
  return value;
}

function formatAnnotations(attribs) {
  if (!Array.isArray(attribs) || attribs.length === 0) return "None";
  return attribs
    .map((attrib) => attrib?.toString())
    .filter(Boolean)
    .join(", ");
}

function ProteinIdsBlock({ isoforms }) {
  const hasEntries = Array.isArray(isoforms) && isoforms.length > 0;

  return (
    <div className="toggle-list-detail-item toggle-list-detail-block">
      {hasEntries ? (
        <table className="toggle-list-detail-table">
          <thead>
            <tr>
              <th>Protein-ID</th>
              <th>Phosphosites</th>
            </tr>
          </thead>
          <tbody>
            {isoforms.map(({ pepId, phosphosites }, index) => (
              <tr key={`${pepId}-${index}`}>
                <td>{pepId}</td>
                <td>{Array.isArray(phosphosites) && phosphosites.length > 0 ? phosphosites.join(", ") : "—"}</td>
              </tr>
            ))}
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
    <div className="text-secondary pad-top-05">
      Showing the first {MAX_RESULTS} of {total} matches.
    </div>
  );
}
