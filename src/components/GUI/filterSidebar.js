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

import { SidebarButtonRect, SidebarCodeEditorBlock, SidebarFieldBlock, SidebarSliderBlock } from "./sidebar.js";
import { useSettings } from "../../states.js";

export function FilterSidebar({ resetFilters }) {
  const { settings, setSettings } = useSettings();

  const linkFilterEditorRef = useRef(null);
  const nodeFilterEditorRef = useRef(null);

  const linkFilterTextAreaRef = useRef(null);
  const nodeFilterTextAreaRef = useRef(null);

  const [compilerErrorLinkFilter, setCompilerErrorLinkFilter] = useState(null);
  const [compilerErrorNodeFilter, setCompilerErrorNodeFilter] = useState(null);

  const handleResetFilters = () => {
    resetFilters();
    setCompilerErrorLinkFilter(null);
    setCompilerErrorNodeFilter(null);
  };

  const handleLinkThresholdSliderChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setSettings("filter.linkThresholdText", value);
      setSettings("filter.linkThreshold", value);
    }
  };

  const handleLinkThresholdFieldChange = (event) => {
    const value = event.target.value;

    if (value >= 0 && value <= 1) {
      setSettings("filter.linkThresholdText", value);
    }
  };

  const handleLinkThresholdFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      event.target.innerText = 0;
      setSettings("filter.linkThresholdText", 0);
      setSettings("filter.linkThreshold", 0);
    } else if (value >= 0 && value <= 1) {
      event.target.innerText = value;
      setSettings("filter.linkThresholdText", value);
      setSettings("filter.linkThreshold", value);
    }
  };

  const handleMinComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      setSettings("filter.minCompSizeText", "");
    } else if (!isNaN(intValue)) {
      setSettings("filter.minCompSizeText", intValue);
    }
  };

  const handleMinComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      event.target.innerText = 1;
      setSettings("filter.minCompSizeText", 1);
      setSettings("filter.minCompSize", 1);
    } else if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setSettings("filter.minCompSizeText", intValue);
      setSettings("filter.minCompSize", intValue);
    }
  };

  const handleLinkAttribsChange = (editor) => {
    const value = editor.getValue();

    setSettings("filter.linkFilterText", value);
  };

  const handleNodeFilterChange = (editor) => {
    const value = editor.getValue();

    setSettings("filter.nodeFilterText", value);
  };

  const runCodeButtonFilterAttribs = (event) => {
    const value = settings.filter.linkFilterText;

    const parsedValue = parseAttributesFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorLinkFilter(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorLinkFilter(null);
      setSettings("filter.linkFilterText", value);
      setSettings("filter.linkFilter", parsedValue);
    }
  };

  const runCodeButtonFilterGroups = (event) => {
    const value = settings.filter.nodeFilterText;

    const parsedValue = parseGroupsFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorNodeFilter(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorNodeFilter(null);
      setSettings("filter.nodeFilterText", value);
      setSettings("filter.nodeFilter", parsedValue);
    }
  };

  // initialize link attribs filter editor //
  useEffect(() => {
    if (linkFilterTextAreaRef.current) {
      linkFilterEditorRef.current = CodeMirror.fromTextArea(linkFilterTextAreaRef.current, {
        mode: "customMode",
        theme: settings.appearance.theme.name === "light" ? "default" : "material",
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
        theme: settings.appearance.theme.mame === "light" ? "default" : "material",
        linewrapping: false,
        bracketMatching: true,
        scrollbarStyle: "null",
      });
      nodeFilterEditorRef.current.setSize("100%", "100%");
      nodeFilterEditorRef.current.on("change", (editor) => handleNodeFilterChange(editor));
    }
  }, []);

  useEffect(() => {
    if (!nodeFilterEditorRef.current) return;

    const currentValue = nodeFilterEditorRef.current.getValue();
    if (currentValue !== settings.filter.nodeFilterText) {
      nodeFilterEditorRef.current.setValue(settings.filter.nodeFilterText);
    }
  }, [settings.filter.nodeFilterText]);

  useEffect(() => {
    if (!linkFilterEditorRef.current) return;

    const currentValue = linkFilterEditorRef.current.getValue();
    if (currentValue !== settings.filter.linkFilterText) {
      linkFilterEditorRef.current.setValue(settings.filter.linkFilterText);
    }
  }, [settings.filter.linkFilterText]);

  useEffect(() => {
    log.info("changing code editor theme");

    nodeFilterEditorRef.current.setOption("theme", settings.appearance.theme.name === "light" ? "default" : "material");
    linkFilterEditorRef.current.setOption("theme", settings.appearance.theme.name === "light" ? "default" : "material");
  }, [settings.appearance.theme]);

  return (
    <>
      <div className="inline pad-top-1 pad-bottom-1">
        <SidebarButtonRect text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <SidebarSliderBlock
        text={"Filter Links by Threshold"}
        min={0}
        max={1}
        stepSlider={0.05}
        stepField={0.01}
        value={settings.filter.linkThreshold}
        valueText={settings.filter.linkThresholdText}
        onChangeSlider={handleLinkThresholdSliderChange}
        onChangeField={handleLinkThresholdFieldChange}
        onChangeBlur={handleLinkThresholdFieldBlur}
      />
      <SidebarCodeEditorBlock
        text={"Filter Links by Attributes"}
        textareaRef={linkFilterTextAreaRef}
        compilerError={compilerErrorLinkFilter}
        onClick={runCodeButtonFilterAttribs}
        defaultValue={settings.filter.linkFilterText}
      />
      <SidebarCodeEditorBlock
        text={"Filter Nodes by Attributes"}
        textareaRef={nodeFilterTextAreaRef}
        compilerError={compilerErrorNodeFilter}
        onClick={runCodeButtonFilterGroups}
        defaultValue={settings.filter.nodeFilterText}
      />
      <SidebarFieldBlock
        text={"Set Minimum Component Size"}
        min={1}
        step={1}
        value={settings.filter.minCompSizeText}
        onChange={handleMinComponentFieldChange}
        onBlur={handleMinComponentFieldBlur}
      />
    </>
  );
}
