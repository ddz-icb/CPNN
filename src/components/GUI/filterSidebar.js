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

import {
  SidebarSliderBlock,
  SidebarFieldBlock,
  SidebarSwitchBlock,
  SidebarButtonRect,
  SidebarCodeEditorBlock,
} from "./reusableComponents/sidebarComponents.js";
import { useAppearance, useFilter, useGraphData } from "../../states.js";
import {
  filterInit,
  linkThresholdInit,
  maxCompSizeInit,
  minNeighborhoodSizeInit,
  compDensityInit,
  minCompSizeInit,
} from "../initValues/filterInitValues.js";
import {
  compDensityDescription,
  linkFilterDescription,
  linkThresholdDescription,
  maxCompSizeDescription,
  mergeProteinsDescription,
  minCompSizeDescription,
  minNeighborhoodSizeDescription,
  nodeFilterDescription,
} from "./descriptions/filterDescriptions.js";

export function FilterSidebar({}) {
  const { filter, setFilter, setAllFilter } = useFilter();
  const { appearance } = useAppearance();
  const { graphData, setGraphData } = useGraphData();

  const linkFilterEditorRef = useRef(null);
  const nodeFilterEditorRef = useRef(null);

  const linkFilterTextAreaRef = useRef(null);
  const nodeFilterTextAreaRef = useRef(null);

  const [compilerErrorLinkFilter, setCompilerErrorLinkFilter] = useState(null);
  const [compilerErrorNodeFilter, setCompilerErrorNodeFilter] = useState(null);

  const handleResetFilters = () => {
    setAllFilter(filterInit);
    setGraphData("mergeProteins", false);
    setCompilerErrorLinkFilter(null);
    setCompilerErrorNodeFilter(null);
  };

  const handleLinkAttribsChange = (editor) => {
    const value = editor.getValue();

    setFilter("linkFilterText", value);
  };

  const handleNodeFilterChange = (editor) => {
    const value = editor.getValue();

    setFilter("nodeFilterText", value);
  };

  const runCodeButtonFilterAttribs = (event) => {
    const value = filter.linkFilterText;

    const parsedValue = parseAttributesFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorLinkFilter(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorLinkFilter(null);
      setFilter("linkFilterText", value);
      setFilter("linkFilter", parsedValue);
    }
  };

  const runCodeButtonFilterGroups = (event) => {
    const value = filter.nodeFilterText;

    const parsedValue = parseGroupsFilter(value);
    if (String(parsedValue).split(" ")[0] === "Error:") {
      setCompilerErrorNodeFilter(parsedValue);
      log.error("invalid input on attribs filter");
    } else {
      setCompilerErrorNodeFilter(null);
      setFilter("nodeFilterText", value);
      setFilter("nodeFilter", parsedValue);
    }
  };

  // initialize link attribs filter editor //
  useEffect(() => {
    if (linkFilterTextAreaRef.current) {
      linkFilterEditorRef.current = CodeMirror.fromTextArea(linkFilterTextAreaRef.current, {
        mode: "customMode",
        theme: appearance.theme.name === "light" ? "default" : "material",
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
        theme: appearance.theme.name === "light" ? "default" : "material",
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
    if (currentValue !== filter.nodeFilterText) {
      nodeFilterEditorRef.current.setValue(filter.nodeFilterText);
    }
  }, [filter.nodeFilterText]);

  useEffect(() => {
    if (!linkFilterEditorRef.current) return;

    const currentValue = linkFilterEditorRef.current.getValue();
    if (currentValue !== filter.linkFilterText) {
      linkFilterEditorRef.current.setValue(filter.linkFilterText);
    }
  }, [filter.linkFilterText]);

  useEffect(() => {
    log.info("changing code editor theme");

    nodeFilterEditorRef.current.setOption("theme", appearance.theme.name === "light" ? "default" : "material");
    linkFilterEditorRef.current.setOption("theme", appearance.theme.name === "light" ? "default" : "material");
  }, [appearance.theme]);

  return (
    <>
      <div className="inline pad-top-1 pad-bottom-1">
        <SidebarButtonRect text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <SidebarSwitchBlock
        value={graphData.mergeProteins}
        setValue={() => setGraphData("mergeProteins", !graphData.mergeProteins)}
        text={"Merge Proteins"}
        infoHeading={"Merge nodes of same protein"}
        infoDescription={mergeProteinsDescription}
      />
      <SidebarSliderBlock
        value={filter.linkThreshold}
        valueText={filter.linkThresholdText}
        setValue={(value) => setFilter("linkThreshold", value)}
        setValueText={(value) => setFilter("linkThresholdText", value)}
        fallbackValue={linkThresholdInit}
        min={Math.floor((graphData.linkWeightMin / 0.05) * 0.05) - 0.05}
        max={Math.ceil(graphData.linkWeightMax / 0.05) * 0.05}
        step={0.05}
        text={"Link Weight Threshold"}
        infoHeading={"Filtering Links by Threshold"}
        infoDescription={linkThresholdDescription}
      />
      <SidebarCodeEditorBlock
        text={"Filter Links by Attributes"}
        textareaRef={linkFilterTextAreaRef}
        compilerError={compilerErrorLinkFilter}
        onClick={runCodeButtonFilterAttribs}
        defaultValue={filter.linkFilterText}
        infoHeading={"Filtering Links by Attributes"}
        infoDescription={linkFilterDescription}
      />
      <SidebarCodeEditorBlock
        text={"Filter Nodes by Attributes"}
        textareaRef={nodeFilterTextAreaRef}
        compilerError={compilerErrorNodeFilter}
        onClick={runCodeButtonFilterGroups}
        defaultValue={filter.nodeFilterText}
        infoHeading={"Filter Nodes by Attributes"}
        infoDescription={nodeFilterDescription}
      />
      <SidebarFieldBlock
        valueText={filter.minCompSizeText}
        setValue={(value) => setFilter("minCompSize", value)}
        setValueText={(value) => setFilter("minCompSizeText", value)}
        fallbackValue={minCompSizeInit}
        min={1}
        step={1}
        text={"Min Component Size"}
        infoHeading={"Filter by Component Size"}
        infoDescription={minCompSizeDescription}
      />
      <SidebarFieldBlock
        valueText={filter.maxCompSizeText}
        setValue={(value) => setFilter("maxCompSize", value)}
        setValueText={(value) => setFilter("maxCompSizeText", value)}
        fallbackValue={maxCompSizeInit}
        min={1}
        step={1}
        text={"Max Component Size"}
        infoHeading={"Filter by Component Size"}
        infoDescription={maxCompSizeDescription}
      />
      <SidebarFieldBlock
        valueText={filter.minNeighborhoodSizeText}
        setValue={(value) => setFilter("minNeighborhoodSize", value)}
        setValueText={(value) => setFilter("minNeighborhoodSizeText", value)}
        fallbackValue={minNeighborhoodSizeInit}
        min={1}
        step={1}
        text={"Min Neighborhood Size"}
        infoHeading={"Filter by Neighborhood Size"}
        infoDescription={minNeighborhoodSizeDescription}
      />
      <SidebarFieldBlock
        valueText={filter.compDensityText}
        setValue={(value) => setFilter("compDensity", value)}
        setValueText={(value) => setFilter("compDensityText", value)}
        fallbackValue={compDensityInit}
        min={0}
        step={1}
        text={"Component Density"}
        infoHeading={"Filter by Component Density"}
        infoDescription={compDensityDescription}
      />
    </>
  );
}
