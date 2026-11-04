import { useCallback, useRef, useState } from "react";

import { handleEditorChange, runCodeEditor } from "../handlers/buttonHandlerFunctions.js";
import { useTheme } from "../../state/themeState.js";
import { CodeEditorBlock } from "./sidebarComponents.jsx";
import { useSidebarCodeEditor } from "./useSidebarCodeEditor.js";

export function ParsedFilterBlock({ text, infoHeading, infoDescription, valueText, setValueText, setValue, parse }) {
  const { theme } = useTheme();
  const textareaRef = useRef(null);
  const setValueTextRef = useRef(setValueText);
  const [compilerError, setCompilerError] = useState(null);
  setValueTextRef.current = setValueText;

  const handleEditorChangeCallback = useCallback(
    (editor) => handleEditorChange(editor, (value) => setValueTextRef.current(value)),
    [],
  );

  useSidebarCodeEditor({
    textareaRef,
    value: valueText,
    onChange: handleEditorChangeCallback,
    themeName: theme.name,
  });

  const handleRunFilter = () => {
    runCodeEditor(valueText, setValue, setValueText, parse, setCompilerError);
  };

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
