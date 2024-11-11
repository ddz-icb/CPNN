import "./index.css";
import log from "./logger";
import React, { useState, useRef, useEffect } from "react";
import exampleGraphJSON from "./demographs/exampleGraphJSON";

import { ForceGraph } from "./components/GraphStuff/forceGraph";
import { Sidebar } from "./components/GUI/sidebar";
import { HeaderBar } from "./components/GUI/headerBar";
import { applyTheme } from "./components/Other/theme";
import { applyNodeMapping, getAttribToColorIndex, getGroupToColorIndex, joinGraphs } from "./components/GraphStuff/graphCalculations";
import { parseColorSchemeCSV, parseFile } from "./components/Other/parseFile";
import { IBMAntiBlindness, Okabe_ItoAntiBlindness, manyColors } from "./components/Other/colors";
import { parseMapping } from "./components/Other/parseMapping";
import { addUploadedFileDB, fromAllGetNameDB, getByNameDB, removeUploadedFileByNameDB } from "./components/Other/db";
import {
  borderHeightInit,
  borderWidthInit,
  centroidThresholdInit,
  chargeStrengthInit,
  checkBorderInit,
  circleLayoutInit,
  componentStrengthInit,
  linkAttribsInit,
  linkAttribsTextInit,
  linkForceInit,
  linkLengthInit,
  linkThresholdInit,
  minComponentSizeInit,
  nodeGroupsInit,
  nodeGroupsTextInit,
  xStrengthInit,
  yStrengthInit,
} from "./components/GraphStuff/graphInitValues";

function App() {
  const [linkThreshold, setLinkThreshold] = useState(linkThresholdInit);
  const [minComponentSize, setMinComponentSize] = useState(minComponentSizeInit);
  const [linkAttribs, setLinkAttribs] = useState(linkAttribsInit);
  const [nodeGroups, setNodeGroups] = useState(nodeGroupsInit);
  const [linkAttribsText, setLinkAttribsText] = useState(linkAttribsTextInit);
  const [nodeGroupsText, setNodeGroupsText] = useState(nodeGroupsTextInit);

  const [linkForce, setLinkForce] = useState(linkForceInit);
  const [linkLength, setLinkLength] = useState(linkLengthInit);
  const [xStrength, setXStrength] = useState(xStrengthInit);
  const [yStrength, setYStrength] = useState(yStrengthInit);
  const [componentStrength, setComponentStrength] = useState(componentStrengthInit);
  const [centroidThreshold, setCentroidThreshold] = useState(centroidThresholdInit);
  const [chargeStrength, setChargeStrength] = useState(chargeStrengthInit);
  const [circleLayout, setCircleLayout] = useState(circleLayoutInit);

  const [checkBorder, setCheckBorder] = useState(checkBorderInit);
  const [borderWidth, setBorderWidth] = useState(borderWidthInit);
  const [borderHeight, setBorderHeight] = useState(borderHeightInit);

  const [reset, setReset] = useState(false); // true indicates that the simulation has to be reloaded

  const [error, setError] = useState(null);

  const [graph, setGraph] = useState(null); // graph without modifications
  const [graphCurrent, setGraphCurrent] = useState(null); // graph with modifications (e.g. links filtered by threshold). it also contains the pixi node elements

  const graphAbsInputRef = useRef(null); // reference to newly selected file
  const graphZeroInputRef = useRef(null); // reference to newly selected file
  const colorSchemeInputRef = useRef(null); // reference to newly selected color scheme
  const mappingInputRef = useRef(null); // reference to newly selected mapping

  const [activeFiles, setActiveFiles] = useState(null); // currently active files
  const [uploadedFileNames, setUploadedFileNames] = useState([]); // all files in local storage
  const [colorSchemes, setColorSchemes] = useState(null); // all color schemes in local storage
  const [groupToColorIndex, setGroupToColorIndex] = useState(null);
  const [attribToColorIndex, setAttribToColorIndex] = useState(null);

  const [downloadJSON, setDownloadJSON] = useState(null); // on state change: indicates graph should be downloaded
  const [downloadPNG, setDownloadPNG] = useState(null); // on state change: indicates graph should be downloaded
  const [downloadSVG, setDownloadSVG] = useState(null); // on state change: indicates graph should be downloaded

  const [theme, setTheme] = useState("light");
  const [circleBorderColor, setCircleBorderColor] = useState("#0d3b66");

  const [nodeColorScheme, setNodeColorScheme] = useState(["Many Colors (18 colors)", manyColors]);
  const [linkColorScheme, setLinkColorScheme] = useState(["IBM (5 colors)", IBMAntiBlindness]);

  const [activeMapping, setActiveMapping] = useState(null);
  const [uploadedMappings, setUploadedMappings] = useState(null);

  // sets new graph on select (and also reformats it)
  const handleFileSelect = (filename) => {
    async function fetchGraph() {
      log.info("Fetching graph data");
      try {
        const file = await getByNameDB(filename);
        if (!file) throw new Error(`No file found with the name ${filename}.`);
        const newGraph = JSON.parse(file.content);
        if (!newGraph) throw new Error("File format not recognized");
        setGraph(newGraph);
        setActiveFiles([file]);
        handleReset(); //the simulation has to be reloaded after
        log.info("Graph loaded successfully:", newGraph);
      } catch (error) {
        setError("Error loading graph");
        console.error("Error loading graph:", error);
        return;
      }
    }

    log.info("Replacing graph");
    fetchGraph();
  };

  const handleMappingSelect = (mapping) => {
    if (mapping !== activeMapping) {
      setActiveMapping(mapping);
      handleReset();
    } else {
      console.error("Mapping is already the current mapping");
    }
  };

  // initates graph reset //
  const handleReset = () => {
    if (!activeFiles) return;
    log.info("Handle Reset");

    resetFilter();
    resetPhysics();

    setDownloadJSON(null);
    setDownloadPNG(null);
    setDownloadSVG(null);

    setError(null);
    setReset(true);
  };

  const resetPhysics = () => {
    setLinkForce(linkForceInit);
    setLinkLength(linkLengthInit);
    setXStrength(xStrengthInit);
    setYStrength(yStrengthInit);
    setComponentStrength(componentStrengthInit);
    setCentroidThreshold(centroidThresholdInit);
    setChargeStrength(chargeStrengthInit);
    setCircleLayout(circleLayoutInit);

    setCheckBorder(checkBorderInit);
    setBorderWidth(borderWidthInit);
    setBorderHeight(borderHeightInit);
  };

  const resetFilter = () => {
    setLinkThreshold(linkThresholdInit);
    setMinComponentSize(minComponentSizeInit);

    setLinkAttribs(linkAttribsInit);
    setLinkAttribsText(linkAttribsTextInit);

    setNodeGroups(nodeGroupsInit);
    setNodeGroupsText(nodeGroupsTextInit);
  };

  // adds new file //
  const handleNewFile = async (event, takeAbs) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;
        const graph = parseFile(file.name, fileContent, takeAbs);
        if (!graph) {
          setError("Error parsing file");
          console.error("Error parsing file");
          return;
        }
        const newFile = { name: file.name, content: JSON.stringify(graph) };
        addUploadedFileDB(newFile);
        setUploadedFileNames([...uploadedFileNames, newFile.name]);
        log.info("Added new file: ", newFile.name);
      };
      reader.readAsText(file);
    }
  };

  // user selected new color scheme from files
  const handleNewScheme = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;

        const newColorScheme = parseColorSchemeCSV(fileContent);
        if (!newColorScheme) {
          console.error("Error parsing color scheme");
          return;
        }
        setColorSchemes([...colorSchemes, [file.name, newColorScheme]]);
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Deleting color schemes with name", colorSchemeName);

    let updatedColorSchemes = colorSchemes.filter((colorScheme) => colorScheme[0] !== colorSchemeName);

    if (updatedColorSchemes.length === 0) {
      updatedColorSchemes = [
        ["IBM (5 colors, barrier-free)", IBMAntiBlindness],
        ["Okabe (7 colors, barrier-free)", Okabe_ItoAntiBlindness],
        ["Many Colors (18 colors)", manyColors],
      ];
    }

    if (nodeColorScheme[0] === colorSchemeName) {
      setNodeColorScheme(updatedColorSchemes[0]);
    }

    if (linkColorScheme[0] === colorSchemeName) {
      setLinkColorScheme(updatedColorSchemes[0]);
    }

    setColorSchemes(updatedColorSchemes);
  };

  const handleNewMapping = (event) => {
    log.info("Processing new Mapping");
    try {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target.result;

          const [nodeMapping, groupMapping] = parseMapping(fileContent);

          const newMapping = {
            name: file.name,
            nodeMapping: nodeMapping,
            groupMapping: groupMapping,
          };

          if (uploadedMappings === null) {
            setUploadedMappings([newMapping]);
          } else {
            setUploadedMappings([...uploadedMappings, newMapping]);
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Error parsing node mapping");
    }
  };

  const handleRemoveActiveMapping = () => {
    setActiveMapping(null);
    handleReset();
  };

  const handleDeleteMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Deleting mapping with name", mappingName);

    const updatedMappings = uploadedMappings.filter((mapping) => mapping.name !== mappingName);
    setUploadedMappings(updatedMappings);
  };

  // deletes uploaded files with filename //
  const handleDeleteFile = (filename) => {
    if (!filename) return;
    log.info("Deleting files with name", filename);

    const updatedFileNames = uploadedFileNames.filter((name) => {
      return name !== filename;
    });

    setUploadedFileNames(updatedFileNames);
    removeUploadedFileByNameDB(filename);
  };

  // removes file from currently active files //
  const handleRemoveActiveFile = (file) => {
    let stillActive = activeFiles.filter((f) => f !== file);
    if (stillActive.length === 0) stillActive = [{ name: "ExampleGraph.json", content: exampleGraphJSON }];

    // no error handling since these graphs were previously active already
    let graph = JSON.parse(stillActive[0].content);
    for (let i = 1; i < stillActive.length; i++) {
      const newGraph = JSON.parse(stillActive[i].content);
      graph = joinGraphs(graph, newGraph);
    }

    setGraph(graph);
    setActiveFiles(stillActive);
    handleReset(); //the simulation has to be reloaded after
    log.info("Graph loaded successfully:", graph);
  };

  const handleDownloadJSONClick = () => {
    setDownloadJSON(!downloadJSON);
  };

  const handleDownloadPNGClick = () => {
    setDownloadPNG(!downloadPNG);
  };

  const handleDownloadSVGClick = () => {
    setDownloadSVG(!downloadSVG);
  };

  const handleGraphAbsUploadClick = () => {
    graphAbsInputRef.current.click();
  };

  const handleGraphZeroUploadClick = () => {
    graphZeroInputRef.current.click();
  };

  const handleUploadSchemeClick = () => {
    colorSchemeInputRef.current.click();
  };

  const handleUploadMappingClick = () => {
    mappingInputRef.current.click();
  };

  const handleAddFileClick = (filename) => {
    async function fetchAndJoinGraph() {
      log.info("Fetching graph data");
      try {
        const file = await getByNameDB(filename);
        if (!file) throw new Error(`No file found with the name ${filename}.`);
        const newGraph = JSON.parse(file.content);
        if (!newGraph) throw new Error("File format not recognized");
        //add graph to other graph and then set graph
        const combinedGraph = joinGraphs(graph, newGraph);
        setGraph(combinedGraph);
        setActiveFiles([...activeFiles, file]);
        handleReset(); //the simulation has to be reloaded after
        log.info("Graph loaded successfully:", combinedGraph);
      } catch (error) {
        setError("Error loading graph");
        console.error("Error loading graph:", error);
        return;
      }
    }

    log.info("Adding data to current graph");
    if (activeFiles.includes(filename)) {
      console.error("graph already active");
      return;
    }
    fetchAndJoinGraph();
  };

  const changeTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // select example graph on startup
  useEffect(() => {
    async function setInitGraph() {
      log.info("Setting init graph data");
      try {
        let file = {
          name: "ExampleGraph.json",
          content: exampleGraphJSON,
        };
        const newGraph = JSON.parse(file.content);
        if (!newGraph) throw new Error("File format not recognized");
        setGraph(newGraph);
        setActiveFiles([file]);
        handleReset(); //the simulation has to be reloaded after
        log.info("Graph loaded successfully:", newGraph);
      } catch (error) {
        setError("Error loading graph");
        console.error("Error loading graph:", error);
        return;
      }
    }

    setInitGraph();
  }, []);

  // init uploadedFileNames
  useEffect(() => {
    async function load() {
      const filenames = await fromAllGetNameDB();
      setUploadedFileNames(filenames);
    }

    load();
  }, []);

  // load current theme
  useEffect(() => {
    log.info("Loading Theme");
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.body.className = storedTheme; // apply theme class
  }, []);

  // load mapping files
  useEffect(() => {
    log.info("Loading mapping files");
    let mappings = JSON.parse(localStorage.getItem("mappings")) || [];
    if (mappings.length === 0) mappings = null;
    log.info("mappings: ", mappings);
    setUploadedMappings(mappings);
  }, []);

  // storing uploaded mapping files //
  useEffect(() => {
    log.info("Storing mapping files", uploadedMappings);

    localStorage.setItem("mappings", JSON.stringify(uploadedMappings));
  }, [uploadedMappings]);

  // storing active mapping file //
  useEffect(() => {
    log.info("Storing active mapping", activeMapping);

    localStorage.setItem("activeMapping", JSON.stringify(activeMapping));
  }, [activeMapping]);

  // load locally stored color schemes //
  useEffect(() => {
    log.info("Loading color schemes");
    let storedSchemes = JSON.parse(localStorage.getItem("colorSchemes")) || [];
    if (storedSchemes.length === 0) {
      storedSchemes = [
        ["IBM (5 colors, barrier-free)", IBMAntiBlindness],
        ["Okabe (7 colors, barrier-free)", Okabe_ItoAntiBlindness],
        ["Many Colors (18 colors)", manyColors],
      ];
    }
    setColorSchemes(storedSchemes);
  }, []);

  // storing uploaded color schemes
  useEffect(() => {
    if (!colorSchemes) return;
    log.info("Storing uploaded color schemes");

    localStorage.setItem("colorSchemes", JSON.stringify(colorSchemes));
  }, [colorSchemes]);

  // apply theme //
  useEffect(() => {
    const circleBorderColor = applyTheme(document, theme);
    setCircleBorderColor(circleBorderColor);
  }, [theme]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graph || !activeFiles) {
      return;
    }

    let newGraphCurrent = structuredClone(graph);
    newGraphCurrent = applyNodeMapping(newGraphCurrent, activeMapping);

    const groupToColorIndex = getGroupToColorIndex(newGraphCurrent);
    setGroupToColorIndex(groupToColorIndex);

    const attribToColorIndex = getAttribToColorIndex(newGraphCurrent);
    setAttribToColorIndex(attribToColorIndex);

    log.info("Forwarding graph to forceGraph component");
    setGraphCurrent(newGraphCurrent);
  }, [graph, activeFiles, activeMapping]);

  return (
    <div className={theme}>
      <HeaderBar
        handleDownloadJSONClick={handleDownloadJSONClick}
        handleDownloadPNGClick={handleDownloadPNGClick}
        handleDownloadSVGClick={handleDownloadSVGClick}
        handleUploadSchemeClick={handleUploadSchemeClick}
        colorSchemeInputRef={colorSchemeInputRef}
        handleNewScheme={handleNewScheme}
        nodeColorScheme={nodeColorScheme}
        setNodeColorScheme={setNodeColorScheme}
        setLinkColorScheme={setLinkColorScheme}
        linkColorScheme={linkColorScheme}
        colorSchemes={colorSchemes}
        mapping={activeMapping}
        handleDeleteColorScheme={handleDeleteColorScheme}
        groupToColorIndex={groupToColorIndex}
        attribToColorIndex={attribToColorIndex}
      />
      <Sidebar
        changeTheme={changeTheme}
        theme={theme}
        uploadedFiles={uploadedFileNames}
        activeFiles={activeFiles}
        handleFileSelect={handleFileSelect}
        handleDeleteFile={handleDeleteFile}
        handleRemoveActiveFile={handleRemoveActiveFile}
        handleAddFile={handleAddFileClick}
        linkThreshold={linkThreshold}
        minComponentSize={minComponentSize}
        linkAttribs={linkAttribs}
        setLinkThreshold={setLinkThreshold}
        setMinComponentSize={setMinComponentSize}
        setLinkAttribs={setLinkAttribs}
        linkLength={linkLength}
        checkBorder={checkBorder}
        borderHeight={borderHeight}
        borderWidth={borderWidth}
        setLinkLength={setLinkLength}
        setCheckBorder={setCheckBorder}
        setBorderHeight={setBorderHeight}
        setBorderWidth={setBorderWidth}
        linkAttribsText={linkAttribsText}
        setLinkAttribsText={setLinkAttribsText}
        xStrength={xStrength}
        setXStrength={setXStrength}
        yStrength={yStrength}
        setYStrength={setYStrength}
        componentStrength={componentStrength}
        setComponentStrength={setComponentStrength}
        centroidThreshold={centroidThreshold}
        setCentroidThreshold={setCentroidThreshold}
        linkForce={linkForce}
        setLinkForce={setLinkForce}
        chargeStrength={chargeStrength}
        setChargeStrength={setChargeStrength}
        circleLayout={circleLayout}
        setCircleLayout={setCircleLayout}
        handleNewMapping={handleNewMapping}
        mappingInputRef={mappingInputRef}
        handleUploadMappingClick={handleUploadMappingClick}
        activeMapping={activeMapping}
        handleRemoveActiveMapping={handleRemoveActiveMapping}
        uploadedMappings={uploadedMappings}
        handleMappingSelect={handleMappingSelect}
        handleDeleteMapping={handleDeleteMapping}
        handleGraphAbsUploadClick={handleGraphAbsUploadClick}
        handleGraphZeroUploadClick={handleGraphZeroUploadClick}
        handleNewFile={handleNewFile}
        nodeGroupsText={nodeGroupsText}
        setNodeGroupsText={setNodeGroupsText}
        setNodeGroups={setNodeGroups}
        resetPhysics={resetPhysics}
        resetFilter={resetFilter}
        graphAbsInputRef={graphAbsInputRef}
        graphZeroInputRef={graphZeroInputRef}
      />
      <main>
        {error && <div className="errorStyle">{error}</div>}
        <ForceGraph
          reset={reset}
          graphCurrent={graphCurrent}
          downloadJSON={downloadJSON}
          downloadPNG={downloadPNG}
          downloadSVG={downloadSVG}
          circleBorderColor={circleBorderColor}
          setReset={setReset}
          setError={setError}
          linkThreshold={linkThreshold}
          setGraphCurrent={setGraphCurrent}
          minComponentSize={minComponentSize}
          linkAttribs={linkAttribs}
          checkBorder={checkBorder}
          borderWidth={borderWidth}
          borderHeight={borderHeight}
          linkLength={linkLength}
          xStrength={xStrength}
          yStrength={yStrength}
          componentStrength={componentStrength}
          centroidThreshold={centroidThreshold}
          linkForce={linkForce}
          setLinkForce={setLinkForce}
          chargeStrength={chargeStrength}
          circleLayout={circleLayout}
          nodeColorScheme={nodeColorScheme}
          linkColorScheme={linkColorScheme}
          theme={theme}
          mapping={activeMapping}
          nodeGroups={nodeGroups}
          groupToColorIndex={groupToColorIndex}
          attribToColorIndex={attribToColorIndex}
        />
      </main>
    </div>
  );
}

export default App;
