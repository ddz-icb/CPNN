import "../../../index.css";
import log from "../../../logger.js";
import { useEffect, useState, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/mode/simple.js";
import "codemirror/theme/material.css";
import "../../config/editorSyntaxHighlighting.js";

import { Button, CodeEditorBlock, FieldBlock, SliderBlock, SwitchBlock } from "../reusable_components/sidebarComponents.js";
import {
  filterInit,
  linkThresholdInit,
  maxCompSizeInit,
  minNeighborhoodSizeInit,
  compDensityInit,
  minCompSizeInit,
} from "../../adapters/state/filterState.js";
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
import { handleEditorChange, runCodeEditor } from "../handlers/buttonHandlerFunctions.js";
import { useFilter } from "../../adapters/state/filterState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { parseAttribsFilter } from "../../domain_service/parsing/attribsFilterParsing.js";

export function FilterSidebar() {
  const { filter, setFilter, setAllFilter } = useFilter();
  const { appearance } = useAppearance();
  const { graphState, setGraphState } = useGraphState();

  const linkFilterEditorRef = useRef(null);
  const nodeFilterEditorRef = useRef(null);

  const linkFilterTextAreaRef = useRef(null);
  const nodeFilterTextAreaRef = useRef(null);

  const [compilerErrorLinkFilter, setCompilerErrorLinkFilter] = useState(null);
  const [compilerErrorNodeFilter, setCompilerErrorNodeFilter] = useState(null);

  const handleResetFilters = () => {
    setAllFilter(filterInit);
    setGraphState("mergeProteins", false);
    setCompilerErrorLinkFilter(null);
    setCompilerErrorNodeFilter(null);
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
      linkFilterEditorRef.current.on("change", (editor) => handleEditorChange(editor, (value) => setFilter("linkFilterText", value)));
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
      nodeFilterEditorRef.current.on("change", (editor) => handleEditorChange(editor, (value) => setFilter("nodeFilterText", value)));
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
      <div className="inline pad-top-05 pad-bottom-05">
        <Button text={"Reset Filters"} onClick={handleResetFilters} />
      </div>
      <SwitchBlock
        value={graphState.mergeProteins}
        setValue={() => setGraphState("mergeProteins", !graphState.mergeProteins)}
        text={"Merge Proteins"}
        infoHeading={"Merge nodes of same protein"}
        infoDescription={mergeProteinsDescription}
      />
      <SliderBlock
        value={filter.linkThreshold}
        valueText={filter.linkThresholdText}
        setValue={(value) => setFilter("linkThreshold", value)}
        setValueText={(value) => setFilter("linkThresholdText", value)}
        fallbackValue={linkThresholdInit}
        min={Math.floor((graphState.linkWeightMin / 0.05) * 0.05) - 0.05}
        max={Math.ceil(graphState.linkWeightMax / 0.05) * 0.05}
        step={0.05}
        text={"Link Weight Threshold"}
        infoHeading={"Filtering Links by Threshold"}
        infoDescription={linkThresholdDescription}
      />
      <CodeEditorBlock
        text={"Filter Links by Attributes"}
        textareaRef={linkFilterTextAreaRef}
        compilerError={compilerErrorLinkFilter}
        onClick={() =>
          runCodeEditor(
            filter.linkFilterText,
            (value) => setFilter("linkFilter", value),
            (value) => setFilter("linkFilterText", value),
            () => parseAttribsFilter(),
            () => setCompilerErrorLinkFilter()
          )
        }
        defaultValue={filter.linkFilterText}
        infoHeading={"Filtering Links by Attributes"}
        infoDescription={linkFilterDescription}
      />
      <CodeEditorBlock
        text={"Filter Nodes by Attributes"}
        textareaRef={nodeFilterTextAreaRef}
        compilerError={compilerErrorNodeFilter}
        onClick={() =>
          runCodeEditor(
            filter.nodeFilterText,
            (value) => setFilter("nodeFilter", value),
            (value) => setFilter("nodeFilterText", value),
            () => parseAttribsFilter(),
            () => setCompilerErrorLinkFilter()
          )
        }
        defaultValue={filter.nodeFilterText}
        infoHeading={"Filter Nodes by Attributes"}
        infoDescription={nodeFilterDescription}
      />
      <FieldBlock
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
      <FieldBlock
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
      <FieldBlock
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
      <FieldBlock
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
