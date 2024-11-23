import "./index.css";
import log from "./logger.js";
import React, { useState, useRef, useEffect } from "react";
import exampleGraphJSON from "./demographs/exampleGraphJSON.js";

import { ForceGraph } from "./components/GraphStuff/forceGraph.js";
import { Sidebar } from "./components/GUI/sidebar.js";
import { HeaderBar } from "./components/GUI/headerBar.js";
import { applyTheme, defaultColorSchemes } from "./components/Other/appearance.js";
import {
  applyNodeMapping,
  getLinkAttribsToColorIndices,
  getNodeAttribsToColorIndices,
  joinGraphs,
} from "./components/GraphStuff/graphCalculations.js";
import { readColorScheme, readGraphFile } from "./components/Other/parseFiles.js";
import { parseMapping } from "./components/Other/parseMapping.js";
import { addFileDB, fromAllGetNameDB, getByNameDB, removeFileByNameDB } from "./components/Other/db.js";
import {
  borderHeightInit,
  borderWidthInit,
  nodeRepulsionStrengthInit,
  checkBorderInit,
  circleLayoutInit,
  componentStrengthInit,
  linkFilterInit,
  linkFilterTextInit,
  linkForceInit,
  linkLengthInit,
  linkThresholdInit,
  minCompSizeInit,
  nodeFilterInit,
  nodeFilterTextInit,
  xStrengthInit,
  yStrengthInit,
} from "./components/GraphStuff/graphInitValues.js";
import { lightTheme, linkColorSchemeInit, nodeColorSchemeInit, themeInit } from "./components/Other/appearance.js";
import { resetFilterSettings, resetPhysicsSettings } from "./components/Other/reset.js";
import { addNewGraphFile, removeColorScheme, selectGraph, selectMapping } from "./components/Other/handleFunctions.js";

function App() {
  const [filterSettings, setFilterSettings] = useState({
    linkThreshold: linkThresholdInit,
    linkFilter: linkFilterInit,
    linkFilterText: linkFilterTextInit,
    nodeFilter: nodeFilterInit,
    nodeFilterText: nodeFilterTextInit,
    minCompSize: minCompSizeInit,
  });

  const [physicsSettings, setPhysicsSettings] = useState({
    circleLayout: circleLayoutInit,
    xStrength: xStrengthInit,
    yStrength: yStrengthInit,
    componentStrength: componentStrengthInit,
    nodeRepulsionStrength: nodeRepulsionStrengthInit,
    linkForce: linkForceInit,
    linkLength: linkLengthInit,
    checkBorder: checkBorderInit,
    borderWidth: borderWidthInit,
    borderHeight: borderHeightInit,
  });

  const [reset, setReset] = useState(false); // true indicates that the simulation has to be reloaded

  const [error, setError] = useState(null);

  const [graph, setGraph] = useState(null); // graph without modifications
  const [graphCurrent, setGraphCurrent] = useState(null); // graph with modifications e.g. links filtered by threshold, it also contains the pixi node elements

  const [activeAnnotationMapping, setActiveAnnotationMapping] = useState(null); // active node annotation mapping
  const [uploadedAnnotationMappings, setUploadedAnnotationMappings] = useState(null); // uploaded node attribute mappings

  const graphAbsInputRef = useRef(null); // reference to newly selected graph (link weights should be interpreted as absolute values)
  const graphZeroInputRef = useRef(null); // reference to newly selected graph (negative link weights should be interpreted as 0)
  const colorSchemeInputRef = useRef(null); // reference to newly selected color scheme
  const mappingInputRef = useRef(null); // reference to newly selected mapping

  const [activeFiles, setActiveFiles] = useState(null); // currently active files
  const [uploadedGraphNames, setUploadedGraphNames] = useState([]); // names of all files in local storage
  const [colorSchemes, setColorSchemes] = useState(null); // all color schemes in local storage

  const [nodeAttribsToColorIndices, setNodeAttribsToColorIndices] = useState(null); // mapping of the node attributes to color indices
  const [linkAttribsToColorIndices, setLinkAttribsToColorIndices] = useState(null); // mapping of the link attributes to color indices

  const [download, setDownload] = useState({
    // on state change: indicates graph should be downloaded
    downloadJson: null,
    downloadPng: null,
    downloadSvg: null,
  });

  const [theme, setTheme] = useState(themeInit);

  const [nodeColorScheme, setNodeColorScheme] = useState(nodeColorSchemeInit);
  const [linkColorScheme, setLinkColorScheme] = useState(linkColorSchemeInit);

  // sets corresponding graph after file selection
  const handleSelectGraph = (filename) => {
    if (!filename) return;
    log.info("Replacing graph");

    try {
      selectGraph(filename, setGraph, setActiveFiles);
      simulationReset();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  };

  // sets corresponding mapping after selection
  const handleAnnotationMappingSelect = (mapping) => {
    if (!mapping) return;
    log.info("Replacing annotation mapping");

    try {
      selectMapping(mapping, activeAnnotationMapping, setActiveAnnotationMapping);
      simulationReset();
    } catch (error) {
      setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  };

  // adds new graph file //
  const handleNewGraphFile = async (event, takeAbs) => {
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Adding new file");

    const file = event.target.files[0];
    try {
      addNewGraphFile(file, setUploadedGraphNames, takeAbs);
    } catch (error) {
      setError("Error adding graph file");
      log.error("Error adding graph file:", error);
    }
  };

  // user selected new color scheme from files
  const handleNewScheme = async (event) => {
    console.log("Adding new color scheme");
    const file = event.target.files[0];
    try {
      const colorScheme = await readColorScheme(file);
      setColorSchemes([...colorSchemes, { name: file.name, colorScheme: colorScheme }]);
    } catch (error) {
      setError("Error adding color scheme");
      log.error("Error adding color scheme:", error);
    }
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Deleting color schemes with name", colorSchemeName);

    removeColorScheme(colorSchemes, colorSchemeName, setNodeColorScheme, setLinkColorScheme, setColorSchemes, nodeColorScheme, linkColorScheme);
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

          if (uploadedAnnotationMappings === null) {
            setUploadedAnnotationMappings([newMapping]);
          } else {
            setUploadedAnnotationMappings([...uploadedAnnotationMappings, newMapping]);
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      log.error("Error parsing node mapping");
    }
  };

  const handleRemoveActiveAnnotationMapping = () => {
    setActiveAnnotationMapping(null);
    simulationReset();
  };

  const handleDeleteMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Deleting mapping with name", mappingName);

    const updatedMappings = uploadedAnnotationMappings.filter((mapping) => mapping.name !== mappingName);
    setUploadedAnnotationMappings(updatedMappings);
  };

  // deletes uploaded files with filename //
  const handleDeleteFile = (filename) => {
    if (!filename) return;
    log.info("Deleting files with name", filename);

    const updatedFileNames = uploadedGraphNames.filter((name) => {
      return name !== filename;
    });

    setUploadedGraphNames(updatedFileNames);
    removeFileByNameDB(filename);
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
    simulationReset(); //the simulation has to be reloaded after
    log.info("Graph loaded successfully:", graph);
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
        simulationReset(); //the simulation has to be reloaded after
        log.info("Graph loaded successfully:", combinedGraph);
      } catch (error) {
        setError("Error loading graph");
        log.error("Error loading graph:", error);
        return;
      }
    }

    log.info("Adding data to current graph");
    if (activeFiles.includes(filename)) {
      log.error("graph already active");
      return;
    }
    fetchAndJoinGraph();
  };

  // initates reset //
  const simulationReset = () => {
    if (!activeFiles) return;
    log.info("Handle Simulation Reset");

    resetFilters();
    resetPhysics();
    setDownload((prev) => ({ ...prev, downloadJson: null, downloadPng: null, downloadSvg: null }));
    setError(null);
    setReset(true);
  };

  const resetPhysics = () => {
    resetPhysicsSettings(setPhysicsSettings);
  };

  const resetFilters = () => {
    resetFilterSettings(setFilterSettings);
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
        simulationReset(); //the simulation has to be reloaded after
        log.info("Graph loaded successfully:", newGraph);
      } catch (error) {
        setError("Error loading graph");
        log.error("Error loading graph:", error);
        return;
      }
    }

    setInitGraph();
  }, []);

  // init uploadedFileNames
  useEffect(() => {
    async function load() {
      const filenames = await fromAllGetNameDB();
      setUploadedGraphNames(filenames);
    }

    load();
  }, []);

  // load current theme
  useEffect(() => {
    log.info("Loading Theme");
    const storedTheme = JSON.parse(localStorage.getItem("theme")) || lightTheme;
    applyTheme(document, storedTheme.theme);
    setTheme(storedTheme);
  }, []);

  // load mapping files
  useEffect(() => {
    log.info("Loading mapping files");
    let mappings = JSON.parse(localStorage.getItem("mappings")) || [];
    if (mappings.length === 0) mappings = null;
    log.info("mappings: ", mappings);
    setUploadedAnnotationMappings(mappings);
  }, []);

  // storing uploaded mapping files //
  useEffect(() => {
    log.info("Storing mapping files", uploadedAnnotationMappings);

    localStorage.setItem("mappings", JSON.stringify(uploadedAnnotationMappings));
  }, [uploadedAnnotationMappings]);

  // storing active mapping file //
  useEffect(() => {
    log.info("Storing active annotation mapping", activeAnnotationMapping);

    localStorage.setItem("activeMapping", JSON.stringify(activeAnnotationMapping));
  }, [activeAnnotationMapping]);

  // load locally stored color schemes //
  useEffect(() => {
    log.info("Loading color schemes");
    let storedSchemes = JSON.parse(localStorage.getItem("colorSchemes")) || [];
    if (storedSchemes.length === 0) {
      storedSchemes = defaultColorSchemes;
    }
    setColorSchemes(storedSchemes);
  }, []);

  // storing uploaded color schemes
  useEffect(() => {
    if (!colorSchemes) return;
    log.info("Storing uploaded color schemes");

    localStorage.setItem("colorSchemes", JSON.stringify(colorSchemes));
  }, [colorSchemes]);

  // store theme //
  useEffect(() => {
    if (!theme) return;
    log.info("Storing theme");

    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graph || !activeFiles) {
      return;
    }
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraphCurrent = structuredClone(graph);
    newGraphCurrent = applyNodeMapping(newGraphCurrent, activeAnnotationMapping);

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraphCurrent);
    setNodeAttribsToColorIndices(nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraphCurrent);
    setLinkAttribsToColorIndices(linkAttribsToColorIndices);

    setGraphCurrent(newGraphCurrent);
  }, [graph, activeFiles, activeAnnotationMapping]);

  return (
    <div className={theme.theme}>
      <HeaderBar
        download={download}
        setDownload={setDownload}
        handleUploadSchemeClick={handleUploadSchemeClick}
        colorSchemeInputRef={colorSchemeInputRef}
        handleNewScheme={handleNewScheme}
        nodeColorScheme={nodeColorScheme}
        setNodeColorScheme={setNodeColorScheme}
        setLinkColorScheme={setLinkColorScheme}
        linkColorScheme={linkColorScheme}
        colorSchemes={colorSchemes}
        activeAnnotationMapping={activeAnnotationMapping}
        handleDeleteColorScheme={handleDeleteColorScheme}
        nodeAttribsToColorIndices={nodeAttribsToColorIndices}
        linkAttribsToColorIndices={linkAttribsToColorIndices}
      />
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        uploadedFiles={uploadedGraphNames}
        activeFiles={activeFiles}
        handleSelectGraph={handleSelectGraph}
        handleDeleteFile={handleDeleteFile}
        handleRemoveActiveFile={handleRemoveActiveFile}
        handleAddFile={handleAddFileClick}
        physicsSettings={physicsSettings}
        setPhysicsSettings={setPhysicsSettings}
        filterSettings={filterSettings}
        setFilterSettings={setFilterSettings}
        handleNewMapping={handleNewMapping}
        mappingInputRef={mappingInputRef}
        handleUploadMappingClick={handleUploadMappingClick}
        activeAnnotationMapping={activeAnnotationMapping}
        handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
        uploadedMappings={uploadedAnnotationMappings}
        handleAnnotationMappingSelect={handleAnnotationMappingSelect}
        handleDeleteMapping={handleDeleteMapping}
        handleGraphAbsUploadClick={handleGraphAbsUploadClick}
        handleGraphZeroUploadClick={handleGraphZeroUploadClick}
        handleNewGraphFile={handleNewGraphFile}
        resetPhysics={resetPhysics}
        resetFilters={resetFilters}
        graphAbsInputRef={graphAbsInputRef}
        graphZeroInputRef={graphZeroInputRef}
      />
      <main>
        {error && <div className="errorStyle">{error}</div>}
        <ForceGraph
          reset={reset}
          graphCurrent={graphCurrent}
          download={download}
          setReset={setReset}
          setError={setError}
          filterSettings={filterSettings}
          setGraphCurrent={setGraphCurrent}
          physicsSettings={physicsSettings}
          setPhysicsSettings={setPhysicsSettings}
          nodeColorScheme={nodeColorScheme}
          linkColorScheme={linkColorScheme}
          theme={theme}
          activeAnnotationMapping={activeAnnotationMapping}
          nodeAttribsToColorIndices={nodeAttribsToColorIndices}
          linkAttribsToColorIndices={linkAttribsToColorIndices}
        />
      </main>
    </div>
  );
}

export default App;
