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
  PopUpTextFieldCompact,
  SidebarButtonRect,
  SidebarCodeEditorBlock,
  SidebarFieldBlock,
  SidebarSwitchBlock,
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
  linkThresholdDescription,
  maxCompSizeDescription,
  mergeProteinsDescription,
  minCompSizeDescription,
  minNeighborhoodSizeDescription,
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

  const handleMinComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      setFilter("minCompSizeText", "");
    } else if (!isNaN(intValue)) {
      setFilter("minCompSizeText", intValue);
    }
  };

  const handleMinComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      event.target.innerText = 1;
      setFilter("minCompSizeText", 1);
      setFilter("minCompSize", 1);
    } else if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setFilter("minCompSizeText", intValue);
      setFilter("minCompSize", intValue);
    }
  };

  const handleMaxComponentFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 1) {
      setFilter("maxCompSizeText", intValue);
    } else {
      setFilter("maxCompSizeText", maxCompSizeInit);
    }
  };

  const handleMaxComponentFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 1) {
      event.target.innerText = intValue;
      setFilter("maxCompSizeText", intValue);
      setFilter("maxCompSize", intValue);
    } else {
      event.target.innerText = maxCompSizeInit;
      setFilter("maxCompSizeText", maxCompSizeInit);
      setFilter("maxCompSize", maxCompSizeInit);
    }
  };

  const handleMinNeighborhoodFieldChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 0) {
      setFilter("minNeighborhoodSizeText", intValue);
    } else {
      setFilter("minNeighborhoodSizeText", "");
    }
  };

  const handleMinNeighborhoodFieldBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setFilter("minNeighborhoodSizeText", intValue);
      setFilter("minNeighborhoodSize", intValue);
    } else {
      event.target.innerText = minNeighborhoodSizeInit;
      setFilter("minNeighborhoodSizeText", minNeighborhoodSizeInit);
      setFilter("minNeighborhoodSize", minNeighborhoodSizeInit);
    }
  };

  const handleCompDensityFieldChange = (event) => {
    const value = event.target.value;
    const floatValue = parseFloat(value);

    if (value === "") {
      setFilter("compDensityText", "");
    } else if (!isNaN(floatValue)) {
      setFilter("compDensityText", floatValue);
    }
  };

  const handleCompDensityFieldBlur = (event) => {
    const value = event.target.value;
    const floatValue = parseFloat(value);

    if (value === "") {
      event.target.innerText = 1;
      setFilter("compDensityText", compDensityInit);
      setFilter("compDensity", compDensityInit);
    } else if (!isNaN(floatValue) && floatValue >= 0) {
      event.target.innerText = floatValue;
      setFilter("compDensityText", floatValue);
      setFilter("compDensity", floatValue);
    }
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
        defaultValue={filter.nodeFilterText}
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
