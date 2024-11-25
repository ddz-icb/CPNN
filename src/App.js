import "./index.css";
import log from "./logger.js";
import React, { useState, useRef, useEffect } from "react";

import { ForceGraph } from "./components/GraphStuff/forceGraph.js";
import { Sidebar } from "./components/GUI/sidebar.js";
import { HeaderBar } from "./components/GUI/headerBar.js";
import { applyNodeMapping, getLinkAttribsToColorIndices, getNodeAttribsToColorIndices } from "./components/GraphStuff/graphCalculations.js";
import { resetFilterSettings, resetPhysicsSettings } from "./components/Other/reset.js";
import {
  addActiveGraphFile,
  addAnnotationMapping,
  addNewColorScheme,
  addNewGraphFile,
  deleteAnnotationMapping,
  deleteGraphFile,
  loadAnnotationMappings,
  loadColorSchemes,
  loadFileNames,
  loadTheme,
  removeActiveGraphFile,
  removeColorScheme,
  selectGraph,
  selectMapping,
  setInitGraph,
  storeAnnotationMappings,
  storeColorSchemes,
  storeTheme,
} from "./components/Other/handleFunctions.js";
import { useSettings } from "./states.js";

function App() {
  const { settings, setSettings } = useSettings();

  const [reset, setReset] = useState(false); // true indicates that the simulation has to be reloaded

  const [error, setError] = useState(null); // error gets printed on screen

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
    addNewGraphFile(file, setUploadedGraphNames, takeAbs)
      .then(() => {})
      .catch((error) => {
        setError("Error adding graph file");
        log.error("Error adding graph file:", error);
      });
  };

  // adds new color scheme
  const handleNewScheme = async (event) => {
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Adding new color scheme");

    const file = event.target.files[0];
    try {
      addNewColorScheme(file, setColorSchemes);
    } catch (error) {
      setError("Error adding color scheme");
      log.error("Error adding color scheme:", error);
    }
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Deleting color schemes with name", colorSchemeName);

    removeColorScheme(
      colorSchemes,
      setColorSchemes,
      colorSchemeName,
      settings.appearance.nodeColorScheme,
      settings.appearance.linkColorScheme,
      setSettings
    );
  };

  // processes new annotation mapping
  const handleNewAnnotationMapping = (event) => {
    if (!event || !event.target || !event.target.files[0]) return;
    log.info("Processing new Mapping");

    const file = event.target.files[0];
    try {
      addAnnotationMapping(file, setUploadedAnnotationMappings);
    } catch (error) {
      setError("Error adding annotation mapping");
      log.error("Error adding annotation mapping:", error);
    }
  };

  // disables currently active annotation mapping
  const handleRemoveActiveAnnotationMapping = () => {
    log.info("Removing currently active annotation mapping");

    setActiveAnnotationMapping(null);
    simulationReset();
  };

  // deletes annotation mapping files
  const handleDeleteAnnotationMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Deleting mapping with name", mappingName);

    deleteAnnotationMapping(uploadedAnnotationMappings, mappingName, setUploadedAnnotationMappings);
  };

  // deletes uploaded files with filename //
  const handleDeleteGraphFile = (filename) => {
    if (!filename) return;
    log.info("Deleting files with name", filename);

    deleteGraphFile(uploadedGraphNames, filename, setUploadedGraphNames);
  };

  // removes graph file from currently active files //
  const handleRemoveActiveGraphFile = (file) => {
    if (!file || !file.name) return;
    log.info("removing graph file with name:", file.name);

    removeActiveGraphFile(file, activeFiles, setGraph, setActiveFiles);
    simulationReset();
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

  const handleAddActiveGraphFileClick = (filename) => {
    if (!filename) return;
    if (activeFiles.some((file) => file.name === filename)) {
      setError("Graph already active");
      log.error("Graph already active");
      return;
    }
    log.info("Adding file with name: ", filename);

    try {
      addActiveGraphFile(filename, setGraph, setActiveFiles, graph);
      simulationReset();
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
      return;
    }
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
    resetPhysicsSettings(setSettings);
  };

  const resetFilters = () => {
    resetFilterSettings(setSettings);
  };

  // select example graph on startup
  useEffect(() => {
    log.info("Setting init graph data");
    setInitGraph(setGraph, setActiveFiles);
    simulationReset();
  }, []);

  // init uploadedFileNames
  useEffect(() => {
    log.info("Loading uploaded files");
    try {
      loadFileNames(setUploadedGraphNames);
    } catch (error) {
      setError("Error loading files form database");
      log.error("Error loading files form database");
    }
  }, []);

  // load current theme
  useEffect(() => {
    log.info("Loading Theme");
    loadTheme(setSettings);
  }, []);

  // store current theme //
  useEffect(() => {
    if (!settings.appearance.theme) return;
    log.info("Storing theme");

    storeTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  // load uploaded annotation mapping files
  useEffect(() => {
    log.info("Loading annotation mapping files");
    loadAnnotationMappings(setUploadedAnnotationMappings);
  }, []);

  // store uploaded annotation mapping files //
  useEffect(() => {
    if (!uploadedAnnotationMappings) return;
    log.info("Storing mapping files");

    storeAnnotationMappings(uploadedAnnotationMappings);
  }, [uploadedAnnotationMappings]);

  // load uploaded color schemes //
  useEffect(() => {
    log.info("Loading color schemes");
    loadColorSchemes(setColorSchemes);
  }, []);

  // storing uploaded color schemes
  useEffect(() => {
    if (!colorSchemes) return;
    log.info("Storing uploaded color schemes");

    storeColorSchemes(colorSchemes);
  }, [colorSchemes]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graph || !activeFiles) return;
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
    <div className={settings.appearance.theme.name}>
      <HeaderBar
        download={download}
        setDownload={setDownload}
        handleUploadSchemeClick={handleUploadSchemeClick}
        colorSchemeInputRef={colorSchemeInputRef}
        handleNewScheme={handleNewScheme}
        colorSchemes={colorSchemes}
        activeAnnotationMapping={activeAnnotationMapping}
        handleDeleteColorScheme={handleDeleteColorScheme}
        nodeAttribsToColorIndices={nodeAttribsToColorIndices}
        linkAttribsToColorIndices={linkAttribsToColorIndices}
      />
      <Sidebar
        uploadedFiles={uploadedGraphNames}
        activeFiles={activeFiles}
        handleSelectGraph={handleSelectGraph}
        handleDeleteGraphFile={handleDeleteGraphFile}
        handleRemoveActiveGraphFile={handleRemoveActiveGraphFile}
        handleAddFile={handleAddActiveGraphFileClick}
        handleNewAnnotationMapping={handleNewAnnotationMapping}
        mappingInputRef={mappingInputRef}
        handleUploadMappingClick={handleUploadMappingClick}
        activeAnnotationMapping={activeAnnotationMapping}
        handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
        uploadedMappings={uploadedAnnotationMappings}
        handleAnnotationMappingSelect={handleAnnotationMappingSelect}
        handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
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
          setGraphCurrent={setGraphCurrent}
          activeAnnotationMapping={activeAnnotationMapping}
          nodeAttribsToColorIndices={nodeAttribsToColorIndices}
          linkAttribsToColorIndices={linkAttribsToColorIndices}
        />
      </main>
    </div>
  );
}
export default App;
