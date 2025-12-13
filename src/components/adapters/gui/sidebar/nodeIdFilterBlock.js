import { useCallback, useEffect, useRef, useState } from "react";
import { SvgIcon } from "../reusable_components/SvgIcon.jsx";
import deleteSvg from "../../../../assets/icons/delete.svg?raw";

const DeleteIcon = (props) => <SvgIcon svg={deleteSvg} {...props} />;

import { CodeEditorBlock, TableList } from "../reusable_components/sidebarComponents.js";
import { handleEditorChange, runCodeEditor } from "../handlers/buttonHandlerFunctions.js";
import { parseNodeIdFilters } from "../../../domain/service/parsing/nodeIdFilterParsing.js";
import { useFilter } from "../../state/filterState.js";
import { useGraphState } from "../../state/graphState.js";
import { useTheme } from "../../state/themeState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { nodeIdFilterDescription } from "./descriptions/filterDescriptions.js";

export function NodeIdFilterBlock() {
  const { filter, setFilter } = useFilter();
  const { graphState } = useGraphState();
  const { theme } = useTheme();
  const [compilerError, setCompilerError] = useState(null);
  const textareaRef = useRef(null);

  const nodeIdFilters = filter.nodeIdFilters ?? [];
  const nodeIdFilterText = filter.nodeIdFilterText ?? "";
  const nodes = graphState.originGraph?.data?.nodes ?? [];

  const handleEditorChangeCallback = useCallback(
    (editor) => handleEditorChange(editor, (value) => setFilter("nodeIdFilterText", value)),
    [setFilter]
  );

  useSidebarCodeEditor({
    textareaRef,
    value: nodeIdFilterText,
    onChange: handleEditorChangeCallback,
    themeName: theme.name,
  });

  useEffect(() => {
    if (!nodeIdFilters.length) {
      setCompilerError(null);
      return;
    }

    const updatedFilters = mapFiltersWithCounts(nodeIdFilters, nodes);
    const hasChanges = nodeIdFilters.some((entry, index) => {
      const updatedEntry = updatedFilters[index];
      return entry.count !== updatedEntry.count || entry.label !== updatedEntry.label;
    });

    if (hasChanges) {
      setFilter("nodeIdFilters", updatedFilters);
    }
  }, [nodeIdFilters, nodes, setFilter]);

  const handleRunNodeIdFilter = () => {
    runCodeEditor(
      nodeIdFilterText,
      (parsedFilters) => {
        if (!parsedFilters.length) {
          setFilter("nodeIdFilters", []);
          return;
        }

        const mergedFilters = mergeNodeIdFilters(nodeIdFilters, parsedFilters);
        setFilter("nodeIdFilters", mapFiltersWithCounts(mergedFilters, nodes));
      },
      (value) => setFilter("nodeIdFilterText", value),
      parseNodeIdFilters,
      (error) => setCompilerError(error)
    );
  };

  const handleRemoveNodeIdFilter = (item) => {
    const updatedFilters = nodeIdFilters.filter((entry) => entry.normalizedValue !== item.normalizedValue);
    setFilter("nodeIdFilters", updatedFilters);
  };

  return (
    <>
      <CodeEditorBlock
        text={"Exclude Nodes by Name / ID"}
        textareaRef={textareaRef}
        compilerError={compilerError}
        onClick={handleRunNodeIdFilter}
        defaultValue={nodeIdFilterText}
        infoHeading={"Exclude Nodes by Name / ID"}
        infoDescription={nodeIdFilterDescription}
      />
      {nodeIdFilters.length > 0 && (
        <TableList
          heading={"Applied Node ID Filters"}
          data={nodeIdFilters}
          displayKey={"label"}
          secondaryKey={"countLabel"}
          ActionIcon={DeleteIcon}
          onActionIconClick={handleRemoveNodeIdFilter}
          actionIconTooltipContent={() => "Remove node id filter"}
          dark={true}
        />
      )}
    </>
  );
}

function mapFiltersWithCounts(filters, nodes) {
  return filters.map((entry) => {
    const value = typeof entry === "string" ? entry : entry.value ?? entry.normalizedValue ?? "";
    const normalizedValue = (entry.normalizedValue ?? value ?? "").toString().toLowerCase();
    const count = computeNodeIdFilterCount(normalizedValue, nodes);
    return {
      value,
      normalizedValue,
      count,
      label: value.toString().toUpperCase(),
      countLabel: formatNodeIdFilterLabel(count),
    };
  });
}

function computeNodeIdFilterCount(normalizedValue, nodes) {
  if (!normalizedValue) return 0;
  return nodes.reduce((count, node) => {
    const nodeId = node?.id?.toString().toLowerCase() || "";
    return nodeId.includes(normalizedValue) ? count + 1 : count;
  }, 0);
}

function formatNodeIdFilterLabel(count) {
  return `Removed nodes: ${count}`;
}

function mergeNodeIdFilters(existingFilters = [], newFilters = []) {
  const mergedMap = new Map();

  const addEntry = (entry) => {
    if (!entry) return;
    const normalizedValue = (entry.normalizedValue ?? entry.value ?? entry.label ?? "").toString().toLowerCase();
    if (!normalizedValue || mergedMap.has(normalizedValue)) return;
    const value = entry.value ?? entry.label ?? entry.normalizedValue ?? normalizedValue;
    mergedMap.set(normalizedValue, { value, normalizedValue });
  };

  existingFilters.forEach(addEntry);
  newFilters.forEach(addEntry);

  return Array.from(mergedMap.values());
}
