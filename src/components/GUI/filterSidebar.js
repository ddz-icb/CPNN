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
  PopUpTextField,
  PopUpTextFieldCompact,
  SidebarButtonRect,
  SidebarCodeEditorBlock,
  SidebarFieldBlock,
  SidebarSliderBlock,
  SidebarSwitchBlock,
} from "./sidebar.js";
import { useGraphData, useSettings } from "../../states.js";
import { maxCompSizeInit, minNeighborhoodSizeInit } from "../GraphStuff/graphInitValues.js";

export function FilterSidebar({ resetFilters }) {
  const { settings, setSettings } = useSettings();
  const { graphData, setGraphData } = useGraphData();

  const linkFilterEditorRef = useRef(null);
  const nodeFilterEditorRef = useRef(null);

  const linkFilterTextAreaRef = useRef(null);
  const nodeFilterTextAreaRef = useRef(null);

  const [compilerErrorLinkFilter, setCompilerErrorLinkFilter] = useState(null);
  const [compilerErrorNodeFilter, setCompilerErrorNodeFilter] = useState(null);

  const handleResetFilters = () => {
    resetFilters();
    setSettings("filter.mergeProteins", false);
    setCompilerErrorLinkFilter(null);
    setCompilerErrorNodeFilter(null);
  };

  const handleMergeProteins = () => {
    setSettings("filter.mergeProteins", !settings.filter.mergeProteins);
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

  const handleMaxComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 1) {
      setSettings("filter.maxCompSizeText", intValue);
    } else {
      setSettings("filter.maxCompSizeText", maxCompSizeInit);
    }
  };

  const handleMaxComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 1) {
      event.target.innerText = intValue;
      setSettings("filter.maxCompSizeText", intValue);
      setSettings("filter.maxCompSize", intValue);
    } else {
      event.target.innerText = maxCompSizeInit;
      setSettings("filter.maxCompSizeText", maxCompSizeInit);
      setSettings("filter.maxCompSize", maxCompSizeInit);
    }
  };

  const handleMinNeighborhoodFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 0) {
      setSettings("filter.minNeighborhoodSizeText", intValue);
    } else {
      setSettings("filter.minNeighborhoodSizeText", "");
    }
  };

  const handleMinNeighborhoodFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setSettings("filter.minNeighborhoodSizeText", intValue);
      setSettings("filter.minNeighborhoodSize", intValue);
    } else {
      event.target.innerText = minNeighborhoodSizeInit;
      setSettings("filter.minNeighborhoodSizeText", minNeighborhoodSizeInit);
      setSettings("filter.minNeighborhoodSize", minNeighborhoodSizeInit);
    }
  };

  const handleCompDensityFieldChange = (event) => {
    const value = event.target.value;
    const floatValue = parseFloat(value);

    if (value === "") {
      setSettings("filter.compDensityText", "");
    } else if (!isNaN(floatValue)) {
      setSettings("filter.compDensityText", floatValue);
    }
  };

  const handleCompDensityFieldBlur = (event) => {
    const value = event.target.value;
    const floatValue = parseFloat(value);

    if (value === "") {
      event.target.innerText = 1;
      setSettings("filter.compDensityText", 1);
      setSettings("filter.compDensity", 1);
    } else if (!isNaN(floatValue) && floatValue >= 0) {
      event.target.innerText = floatValue;
      setSettings("filter.compDensityText", floatValue);
      setSettings("filter.compDensity", floatValue);
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
        theme: settings.appearance.theme.name === "light" ? "default" : "material",
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
      <SidebarSwitchBlock
        text={"Merge Proteins"}
        value={settings.filter.mergeProteins}
        onChange={handleMergeProteins}
        infoHeading={"Merge nodes of same protein"}
        infoDescription={
          "Nodes with the same UniprotID and Name will be merged into a single node, along with their respective links. When multiple links to the same node are merged, the maximum absolute weight is used as the new link weight. Enabling this setting can significantly enhance performance by reducing the graph size."
        }
      />
      <SidebarSliderBlock
        text={"Link Weight Threshold"}
        min={Math.floor(graphData.linkWeightMin / 0.05) * 0.05}
        max={Math.ceil(graphData.linkWeightMax / 0.05) * 0.05}
        stepSlider={0.05}
        stepField={0.01}
        value={settings.filter.linkThreshold}
        valueText={settings.filter.linkThresholdText}
        onChangeSlider={handleLinkThresholdSliderChange}
        onChangeField={handleLinkThresholdFieldChange}
        onChangeBlur={handleLinkThresholdFieldBlur}
        infoHeading={"Filtering Links by Threshold"}
        infoDescription={
          <div>
            <p className="margin-0">
              You can filter the links by adjusting their threshold. Links will only be drawn, if their link weight is larger or equal to the set
              threshold. For example, if the weight of a link is 0.75 and the threshold is set to 0.8, the link will not be drawn. Increasing this
              value can significantly enhance performance by reducing the graph size.
            </p>
          </div>
        }
      />
      <SidebarCodeEditorBlock
        text={"Filter Links by Attributes"}
        textareaRef={linkFilterTextAreaRef}
        compilerError={compilerErrorLinkFilter}
        onClick={runCodeButtonFilterAttribs}
        defaultValue={settings.filter.linkFilterText}
        infoHeading={"Filtering Links by Attributes"}
        infoDescription={
          <div>
            <div className="margin-0">
              You can filter the links by formulating a query. These queries must follow the Conjunctive Normal Form (CNF), meaning that conditions
              grouped with <PopUpTextFieldCompact textInside={"or"} /> (e.g., <PopUpTextFieldCompact textInside={"(A or B)"} /> ) are combined using{" "}
              <PopUpTextFieldCompact textInside={"and"} />. To address one (or multiple) attributes, parts of the attribute name can be used (e.g.{" "}
              <PopUpTextFieldCompact textInside={"lean"} /> includes all attributes that contain the word "lean"). If the attribute consists of more
              than one word, quotation marks can be used (e.g. <PopUpTextFieldCompact textInside={'"lean group"'} /> ). To forbid an attribute from
              occuring the <PopUpTextFieldCompact textInside={"not"} /> operator can be applied. To address multiple attributes simultaneously, you
              can group them as a set, for example: <PopUpTextFieldCompact textInside={"{lean, obese, t2d}"} />. To restrict the number of links, you
              can use the <PopUpTextFieldCompact textInside={">"} />, <PopUpTextFieldCompact textInside={">="} />,{" "}
              <PopUpTextFieldCompact textInside={"<"} />, <PopUpTextFieldCompact textInside={"<="} /> or <PopUpTextFieldCompact textInside={"="} />{" "}
              operators (e.g., <PopUpTextFieldCompact textInside={">= 2"} /> filters for multilinks of size at least 2).
            </div>
            <div className="pad-top-1" />
            <div>
              For example, with the link attributes <PopUpTextFieldCompact textInside={"lean group"} />,{" "}
              <PopUpTextFieldCompact textInside={"obese group"} />, and <PopUpTextFieldCompact textInside={"t2d group"} />, some valid queries could
              be:
            </div>
            <div className="pad-top-05" />
            <PopUpTextFieldCompact textInside={"t2d"} /> <PopUpTextFieldCompact textInside={"not lean"} />{" "}
            <PopUpTextFieldCompact textInside={"> 2"} /> <PopUpTextFieldCompact textInside={"not {lean, obese}"} />{" "}
            <PopUpTextFieldCompact textInside={'"t2d group" and lean'} /> <PopUpTextFieldCompact textInside={"(obese or lean) and >= 2"} />{" "}
            <PopUpTextFieldCompact textInside={"(obese or lean) and t2d"} /> <PopUpTextFieldCompact textInside={"(not t2d or not obese) and lean"} />
          </div>
        }
      />
      <SidebarCodeEditorBlock
        text={"Filter Nodes by Attributes"}
        textareaRef={nodeFilterTextAreaRef}
        compilerError={compilerErrorNodeFilter}
        onClick={runCodeButtonFilterGroups}
        defaultValue={settings.filter.nodeFilterText}
        infoHeading={"Filter Nodes by Attributes"}
        infoDescription={
          <div>
            <div className="margin-0">
              You can filter the nodes by formulating a query. These queries must follow the Conjunctive Normal Form (CNF), meaning that conditions
              grouped with <PopUpTextFieldCompact textInside={"or"} /> (e.g., <PopUpTextFieldCompact textInside={"(A or B)"} /> ) are combined using{" "}
              <PopUpTextFieldCompact textInside={"and"} />. To address one (or multiple) attributes, parts of the attribute name can be used (e.g.{" "}
              <PopUpTextFieldCompact textInside={"signaling"} /> includes all attributes that contain the word "signaling"). If the attribute consists
              of more than one word, quotation marks can be used (e.g. <PopUpTextFieldCompact textInside={'"mRNA splicing"'} /> ). To forbid an
              attribute from occuring the <PopUpTextFieldCompact textInside={"not"} /> operator can be applied. To address multiple attributes
              simultaneously, you can group them as a set, for example:{" "}
              <PopUpTextFieldCompact textInside={'{mRNA splicing, signaling, "glucose metabolism"}'} />. To restrict the number of attributes of a
              node, you can use the <PopUpTextFieldCompact textInside={">"} />, <PopUpTextFieldCompact textInside={">="} />,{" "}
              <PopUpTextFieldCompact textInside={"<"} />, <PopUpTextFieldCompact textInside={"<="} /> or <PopUpTextFieldCompact textInside={"="} />{" "}
              operators (e.g., <PopUpTextFieldCompact textInside={">= 2"} /> filters for nodes with at least 2 attributes).
            </div>
            <div className="pad-top-1" />
            <div>
              For example, with the link attributes <PopUpTextFieldCompact textInside={"mRNA splicing"} />,{" "}
              <PopUpTextFieldCompact textInside={"glucose metabolism"} />, <PopUpTextFieldCompact textInside={"VEGF signaling"} /> and{" "}
              <PopUpTextFieldCompact textInside={"MTOR signaling"} />, some valid queries could be:
            </div>
            <div className="pad-top-05" />
            <PopUpTextFieldCompact textInside={"signaling"} /> <PopUpTextFieldCompact textInside={"not signaling"} />{" "}
            <PopUpTextFieldCompact textInside={"> 2"} /> <PopUpTextFieldCompact textInside={"not {MTOR, VEGF, mRNA}"} />{" "}
            <PopUpTextFieldCompact textInside={'signaling and "mRNA splicing"'} />{" "}
            <PopUpTextFieldCompact textInside={"(metabolism or signaling) and >= 2"} />{" "}
            <PopUpTextFieldCompact textInside={'("mRNA splicing" or VEGF) and ("glucose metabolism" or MTOR)'} />
            <PopUpTextFieldCompact textInside={'(not "mRNA splicing" or not VEGF)'} />
          </div>
        }
      />
      <SidebarFieldBlock
        text={"Min Component Size"}
        min={1}
        step={1}
        value={settings.filter.minCompSizeText}
        onChange={handleMinComponentFieldChange}
        onBlur={handleMinComponentFieldBlur}
        infoHeading={"Filter by Component Size"}
        infoDescription={
          <div>
            <p className="margin-0">
              You can filter the components/clusters by setting a minimum size. If a given component is smaller than the applied threshold, the whole
              component will not be drawn. Increasing this value can significantly enhance performance by reducing the graph size.
            </p>
          </div>
        }
      />
      <SidebarFieldBlock
        text={"Max Component Size"}
        min={1}
        step={1}
        value={settings.filter.maxCompSizeText}
        onChange={handleMaxComponentFieldChange}
        onBlur={handleMaxComponentFieldBlur}
        infoHeading={"Filter by Component Size"}
        infoDescription={
          <div>
            <p className="margin-0">
              You can filter the components/clusters by setting a maximum size. If a given component is greater than the applied threshold, the whole
              component will not be drawn. Decreasing this value can significantly enhance performance by reducing the graph size.
            </p>
          </div>
        }
      />
      <SidebarFieldBlock
        text={"Min Neighborhood Size"}
        min={1}
        step={1}
        value={settings.filter.minNeighborhoodSizeText}
        onChange={handleMinNeighborhoodFieldChange}
        onBlur={handleMinNeighborhoodFieldBlur}
        infoHeading={"Filter by Neighborhood Size"}
        infoDescription={
          <div>
            <p className="margin-0">
              You can filter the graph by setting a minimum neighborhood size. If a given node has less neighbors than the applied threshold, the node
              will not be drawn. Increasing this value can significantly enhance performance by reducing the graph size.
            </p>
          </div>
        }
      />
      <SidebarFieldBlock
        text={"Component Density"}
        min={0}
        step={1}
        value={settings.filter.compDensityText}
        onChange={handleCompDensityFieldChange}
        onBlur={handleCompDensityFieldBlur}
        infoHeading={"Filter by Component Density"}
        infoDescription={
          <div>
            <p className="margin-0">
              You can filter the components/clusters based on their density. The density is measured as the average amount of neighbors per node. If a
              given component has a smaller density than the applied threshold, the component will not be drawn. Increasing this value can
              significantly enhance performance by reducing the graph size.
            </p>
          </div>
        }
      />
    </>
  );
}
