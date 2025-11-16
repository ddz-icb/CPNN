import { useCallback, useMemo, useRef, useState } from "react";

import { useGraphState } from "../../state/graphState.js";
import { useTheme } from "../../state/themeState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";

const MAX_RESULTS = 20;

export function SearchSidebar() {
  const { graphState } = useGraphState();
  const { theme } = useTheme();
  const textareaRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");

  const nodes = graphState.originGraph?.data?.nodes ?? [];
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

  const { nodeResults, nodeTotal } = useMemo(() => {
    if (!normalizedQuery) {
      return {
        nodeResults: [],
        nodeTotal: 0,
      };
    }

    const filteredNodes = nodes
      .filter((node) => nodeMatchesQuery(node, normalizedQuery))
      .map((node) => ({
        primaryText: getNodeLabel(node),
        secondaryText: formatNodeSecondary(node),
      }));

    return {
      nodeResults: filteredNodes.slice(0, MAX_RESULTS),
      nodeTotal: filteredNodes.length,
    };
  }, [nodes, normalizedQuery]);

  const handleSearch = () => {
    setQuery(searchValue);
  };

  const showResults = Boolean(normalizedQuery);
  const nodeOverflow = nodeTotal > MAX_RESULTS;

  return (
    <>
      <CodeEditorBlock
        text={"Search Graph Data"}
        textareaRef={textareaRef}
        defaultValue={searchValue}
        onClick={handleSearch}
        infoHeading={"Search Graph Data"}
        infoDescription={"Search for nodes in the current graph by their name / ID."}
        buttonText={"Search"}
      />
      <>
        <TableList heading={`Node Matches (${nodeTotal})`} data={nodeResults} displayKey={"primaryText"} secondaryKey={"secondaryText"} />
        {nodeOverflow && <OverflowHint total={nodeTotal} />}
      </>
    </>
  );
}

function OverflowHint({ total }) {
  return <div className="text-secondary pad-top-05">Showing the first {MAX_RESULTS} of {total} matches.</div>;
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
