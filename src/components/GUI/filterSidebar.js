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

export function FilterSidebar({
  linkThreshold,
  minCompSize,
  linkAttribs,
  setLinkThreshold,
  setMinCompSize,
  setLinkAttribs,
  linkAttribsText,
  setLinkAttribsText,
  theme: activeTheme,
  nodeFilterText,
  setNodeFilterText,
  setNodeFilter,
  resetFilters,
}) {
  const attribsEditorRef = useRef(null);
  const groupsEditorRef = useRef(null);

  const attribsRef = useRef(null);
  const groupsRef = useRef(null);

  const [linkThresholdText, setLinkThresholdText] = useState(linkThreshold);
  const [minCompSizeText, setMinCompSizeText] = useState(minCompSize);
  const [compilerErrorAttribs, setCompilerErrorAttribs] = useState(null);
  const [compilerErrorGroups, setCompilerErrorGroups] = useState(null);

  const handleResetFilters = () => {
    resetFilters();

    setLinkThresholdText(linkThresholdInit);
    setMinCompSizeText(minCompSizeInit);
    setCompilerErrorAttribs(null);
    setCompilerErrorGroups(null);
  };

  const handleLinkThresholdSliderChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setLinkThresholdText(value);
      setLinkThreshold(value);
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
      setLinkThreshold(0);
    } else if (value >= 0 && value <= 1) {
      event.target.innerText = value;
      setLinkThresholdText(value);
      setLinkThreshold(value);
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
      setMinCompSize(1);
    } else if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setMinCompSizeText(intValue);
      setMinCompSize(intValue);
    }
  };

  const handleLinkAttribsChange = (editor) => {
    const value = editor.getValue();

    setLinkAttribsText(value);
  };

  const handleNodeFilterChange = (editor) => {
    const value = editor.getValue();

    setNodeFilterText(value);
  };

  const runCodeButtonFilterAttribs = (event) => {
    const value = linkAttribsText;

    const parsedValue = parseAttributesFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorAttribs(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorAttribs(null);
      setLinkAttribsText(value);
      setLinkAttribs(parsedValue);
    }
  };

  const runCodeButtonFilterGroups = (event) => {
    const value = nodeFilterText;

    const parsedValue = parseGroupsFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorGroups(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorGroups(null);
      setNodeFilterText(value);
      setNodeFilter(parsedValue);
    }
  };

  // initialize link attribs filter editor //
  useEffect(() => {
    if (attribsRef.current) {
      attribsEditorRef.current = CodeMirror.fromTextArea(attribsRef.current, {
        mode: "customMode",
        theme: activeTheme === "light" ? "default" : "material",
        linewrapping: false,
        bracketMatching: true,
        scrollbarStyle: "null",
      });
      attribsEditorRef.current.setSize("100%", "100%");
      attribsEditorRef.current.on("change", (editor) => handleLinkAttribsChange(editor));
    }
  }, []);

  // initialize node group filter editor //
  useEffect(() => {
    if (groupsRef.current) {
      groupsEditorRef.current = CodeMirror.fromTextArea(groupsRef.current, {
        mode: "customMode",
        theme: activeTheme === "light" ? "default" : "material",
        linewrapping: false,
        bracketMatching: true,
        scrollbarStyle: "null",
      });
      groupsEditorRef.current.setSize("100%", "100%");
      groupsEditorRef.current.on("change", (editor) => handleNodeFilterChange(editor));
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
        textareaRef={attribsRef}
        compilerError={compilerErrorAttribs}
        onClick={runCodeButtonFilterAttribs}
        defaultValue={linkAttribsText}
      />
      <SidebarCodeEditorBlock
        text={"Filter Nodes by Attributes"}
        textareaRef={groupsRef}
        compilerError={compilerErrorGroups}
        onClick={runCodeButtonFilterGroups}
        defaultValue={nodeFilterText}
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
