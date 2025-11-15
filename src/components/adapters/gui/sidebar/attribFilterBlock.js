import { useCallback, useRef, useState } from "react";

import { CodeEditorBlock } from "../reusable_components/sidebarComponents.js";
import { handleEditorChange, runCodeEditor } from "../handlers/buttonHandlerFunctions.js";
import { useFilter } from "../../state/filterState.js";
import { parseAttribsFilter } from "../../../domain/service/parsing/attribsFilterParsing.js";
import { useTheme } from "../../state/themeState.js";
import { useSidebarCodeEditor } from "../reusable_components/useSidebarCodeEditor.js";
import { linkFilterDescription, nodeFilterDescription } from "./descriptions/filterDescriptions.js";

export function LinkAttribFilterBlock() {
  return (
    <AttribFilterBlock
      text={"Filter Links by Attributes"}
      infoHeading={"Filtering Links by Attributes"}
      infoDescription={linkFilterDescription}
      filterKey={"linkFilter"}
      filterTextKey={"linkFilterText"}
    />
  );
}

export function NodeAttribFilterBlock() {
  return (
    <AttribFilterBlock
      text={"Filter Nodes by Attributes"}
      infoHeading={"Filter Nodes by Attributes"}
      infoDescription={nodeFilterDescription}
      filterKey={"nodeFilter"}
      filterTextKey={"nodeFilterText"}
    />
  );
}

function AttribFilterBlock({ text, infoHeading, infoDescription, filterKey, filterTextKey }) {
  const { filter, setFilter } = useFilter();
  const { theme } = useTheme();
  const textareaRef = useRef(null);
  const [compilerError, setCompilerError] = useState(null);

  const valueText = filter[filterTextKey] ?? "";

  const handleEditorChangeCallback = useCallback(
    (editor) => handleEditorChange(editor, (value) => setFilter(filterTextKey, value)),
    [setFilter, filterTextKey]
  );

  useSidebarCodeEditor({
    textareaRef,
    value: valueText,
    onChange: handleEditorChangeCallback,
    themeName: theme.name,
  });

  const handleRunFilter = useCallback(() => {
    runCodeEditor(
      valueText,
      (value) => setFilter(filterKey, value),
      (value) => setFilter(filterTextKey, value),
      parseAttribsFilter,
      (error) => setCompilerError(error)
    );
  }, [valueText, filterKey, filterTextKey, setFilter]);

  return (
    <CodeEditorBlock
      text={text}
      textareaRef={textareaRef}
      compilerError={compilerError}
      onClick={handleRunFilter}
      defaultValue={valueText}
      infoHeading={infoHeading}
      infoDescription={infoDescription}
    />
  );
}
