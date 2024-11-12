import "../../index.css";
import log from "../../logger.js";
import { useEffect, useState, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple.js";
import "codemirror/theme/material.css";
import "../Other/syntaxHighlighting.js";

import { parseAttributesFilter } from "../Other/parser.js";
import { parseGroupsFilter } from "../Other/parserNodeFilter.js";

import { linkThresholdInit, minCompSizeInit } from "../GraphStuff/graphInitValues.js";

import { SidebarButtonRect, SidebarCodeEditorBlock, SidebarFieldBlock, SidebarSliderBlock } from "./sidebar.js";

export function FilterSidebar({ linkThreshold, minCompSize, filterSettings, setFilterSettings, theme, resetFilters }) {
  const linkFilterEditorRef = useRef(null);
  const nodeFilterEditorRef = useRef(null);

  const linkFilterTextAreaRef = useRef(null);
  const nodeFilterTextAreaRef = useRef(null);

  const [linkThresholdText, setLinkThresholdText] = useState(linkThreshold);
  const [minCompSizeText, setMinCompSizeText] = useState(minCompSize);
  const [compilerErrorLinkFilter, setCompilerErrorLinkFilter] = useState(null);
  const [compilerErrorNodeFilter, setCompilerErrorNodeFilter] = useState(null);

  const handleResetFilters = () => {
    resetFilters();

    setLinkThresholdText(linkThresholdInit);
    setMinCompSizeText(minCompSizeInit);
    setCompilerErrorLinkFilter(null);
    setCompilerErrorNodeFilter(null);
  };

  const handleLinkThresholdSliderChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setLinkThresholdText(value);
      setFilterSettings((prev) => ({ ...prev, linkThreshold: value }));
    }
  };

  const handleLinkThresholdFieldChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setLinkThresholdText(value);
    }
  };

  const handleLinkThresholdFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      event.target.innerText = 0;
      setLinkThresholdText(0);
      setFilterSettings((prev) => ({ ...prev, linkThreshold: 0 }));
    } else if (value >= 0 && value <= 1) {
      event.target.innerText = value;
      setLinkThresholdText(value);
      setFilterSettings((prev) => ({ ...prev, linkThreshold: value }));
    }
  };

  const handleMinComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      setMinCompSizeText("");
    } else if (!isNaN(intValue)) {
      setMinCompSizeText(intValue);
    }
  };

  const handleMinComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      event.target.innerText = 1;
      setMinCompSizeText(1);
      setFilterSettings((prev) => ({ ...prev, minCompSize: 1 }));
    } else if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setMinCompSizeText(intValue);
      setFilterSettings((prev) => ({ ...prev, minCompSize: intValue }));
    }
  };

  const handleLinkAttribsChange = (editor) => {
    const value = editor.getValue();

    setFilterSettings((prev) => ({ ...prev, linkFilterText: value }));
  };

  const handleNodeFilterChange = (editor) => {
    const value = editor.getValue();

    setFilterSettings((prev) => ({ ...prev, nodeFilterText: value }));
  };

  const runCodeButtonFilterAttribs = (event) => {
    const value = filterSettings.linkFilterText;

    const parsedValue = parseAttributesFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorLinkFilter(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorLinkFilter(null);
      setFilterSettings((prev) => ({ ...prev, linkFilterText: value }));
      setFilterSettings((prev) => ({ ...prev, linkFilter: parsedValue }));
    }
  };

  const runCodeButtonFilterGroups = (event) => {
    const value = filterSettings.nodeFilterText;

    const parsedValue = parseGroupsFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorNodeFilter(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorNodeFilter(null);
      setFilterSettings((prev) => ({ ...prev, nodeFilterText: value }));
      setFilterSettings((prev) => ({ ...prev, nodeFilter: parsedValue }));
    }
  };

  // initialize link attribs filter editor //
  useEffect(() => {
    if (linkFilterTextAreaRef.current) {
      linkFilterEditorRef.current = CodeMirror.fromTextArea(linkFilterTextAreaRef.current, {
        mode: "customMode",
        theme: theme === "light" ? "default" : "material",
        linewrapping: false,
        bracketMatching: true,
        scrollbarStyle: "null",
      });
      linkFilterEditorRef.current.setSize("100%", "100%");
      linkFilterEditorRef.current.on("change", (editor) => handleLinkAttribsChange(editor));
    }
  }, []);

  // initialize node group filter editor //
  useEffect(() => {
    if (nodeFilterTextAreaRef.current) {
      nodeFilterEditorRef.current = CodeMirror.fromTextArea(nodeFilterTextAreaRef.current, {
        mode: "customMode",
        theme: theme === "light" ? "default" : "material",
        linewrapping: false,
        bracketMatching: true,
        scrollbarStyle: "null",
      });
      nodeFilterEditorRef.current.setSize("100%", "100%");
      nodeFilterEditorRef.current.on("change", (editor) => handleNodeFilterChange(editor));
    }
  }, []);

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <SidebarSliderBlock
        text={"Filter Links by Threshold"}
        min={0}
        max={1}
        stepSlider={0.05}
        stepField={0.01}
        value={linkThreshold}
        valueText={linkThresholdText}
        onChangeSlider={handleLinkThresholdSliderChange}
        onChangeField={handleLinkThresholdFieldChange}
        onChangeBlur={handleLinkThresholdFieldBlur}
      />
      <SidebarCodeEditorBlock
        text={"Filter Links by Attributes"}
        textareaRef={linkFilterTextAreaRef}
        compilerError={compilerErrorLinkFilter}
        onClick={runCodeButtonFilterAttribs}
        defaultValue={filterSettings.linkFilterText}
      />
      <SidebarCodeEditorBlock
        text={"Filter Nodes by Attributes"}
        textareaRef={nodeFilterTextAreaRef}
        compilerError={compilerErrorNodeFilter}
        onClick={runCodeButtonFilterGroups}
        defaultValue={filterSettings.nodeFilterText}
      />
      <SidebarFieldBlock
        text={"Set Minimum Component Size"}
        min={1}
        step={1}
        value={minCompSizeText}
        onChange={handleMinComponentFieldChange}
        onBlur={handleMinComponentFieldBlur}
      />
    </>
  );
}
