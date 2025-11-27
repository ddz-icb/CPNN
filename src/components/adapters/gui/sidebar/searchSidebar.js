import { useRef } from "react";

import { useSearchState, searchStateInit } from "../../state/searchState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { useTheme } from "../../state/themeState.js";

const MAX_RESULTS = 30;

export function SearchSidebar() {
  const { searchState, setSearchState, setAllSearchState } = useSearchState();
  const { searchValue, query, matchingNodes } = searchState;
  const { theme } = useTheme();

  const textareaRef = useRef(null);

  const handleEditorChange = (editor) => setSearchState("searchValue", editor.getValue());

  const handleSearch = () => {
    setSearchState("query", searchValue.trim().toLowerCase());
  };

  const handleClear = () => {
    setAllSearchState(searchStateInit);
  };

  const handleEntryHighlight = (item) => {
    const node = matchingNodes?.find((n) => n.id === item?.nodeId);
    if (!node) return;

    setSearchState("highlightedNodeIds", [node.id]);
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
        <TableList heading={`Node Matches (${nodeTotal})`} data={nodeResults} displayKey={"primaryText"} onItemClick={handleEntryHighlight} />
        {nodeOverflow && <OverflowHint total={nodeTotal} />}
      </>
    </>
  );
}

function OverflowHint({ total }) {
  return <div className="text-secondary pad-top-05">Showing the first {MAX_RESULTS} of {total} matches.</div>;
}
