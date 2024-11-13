import "./index.css";
import log from "./logger.js";
import React, { useState, useRef, useEffect } from "react";
import exampleGraphJSON from "./demographs/exampleGraphJSON.js";

import { ForceGraph } from "./components/GraphStuff/forceGraph.js";
import { Sidebar } from "./components/GUI/sidebar.js";
import { HeaderBar } from "./components/GUI/headerBar.js";
import { applyTheme } from "./components/Other/theme.js";
import {
  applyNodeMapping,
  getLinkAttribsToColorIndices,
  getNodeAttribsToColorIndices,
  joinGraphs,
} from "./components/GraphStuff/graphCalculations.js";
import { parseColorSchemeCSV, parseFile } from "./components/Other/parseFile.js";
import { IBMAntiBlindness, Okabe_ItoAntiBlindness, manyColors } from "./components/Other/colors.js";
import { parseMapping } from "./components/Other/parseMapping.js";
import { addUploadedFileDB, fromAllGetNameDB, getByNameDB, removeUploadedFileByNameDB } from "./components/Other/db.js";
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
import { circleBorderColorInit, linkColorSchemeInit, nodeColorSchemeInit, themeInit } from "./components/Other/appearanceInitvalues.js";
import { resetFilterSettings, resetPhysicsSettings } from "./components/Other/reset.js";

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

  const graphAbsInputRef = useRef(null); // reference to newly selected graph (link weights should be interpreted as absolute values)
  const graphZeroInputRef = useRef(null); // reference to newly selected graph (negative link weights should be interpreted as 0)
  const colorSchemeInputRef = useRef(null); // reference to newly selected color scheme
  const mappingInputRef = useRef(null); // reference to newly selected mapping

  const [activeFiles, setActiveFiles] = useState(null); // currently active files
  const [uploadedFileNames, setUploadedFileNames] = useState([]); // names of all files in local storage
  const [colorSchemes, setColorSchemes] = useState(null); // all color schemes in local storage
  const [nodeAttribsToColorIndices, setNodeAttribsToColorIndices] = useState(null); // mapping of the node attributes to color indices
  const [linkAttribsToColorIndices, setLinkAttribsToColorIndices] = useState(null); // mapping of the link attributes to color indices

  const [download, setDownload] = useState({
    downloadJson: null, // on state change: indicates graph should be downloaded
    downloadPng: null, // on state change: indicates graph should be downloaded
    downloadSvg: null, // on state change: indicates graph should be downloaded
  });

  const [theme, setTheme] = useState(themeInit);
  const [circleBorderColor, setCircleBorderColor] = useState(circleBorderColorInit);

  const [nodeColorScheme, setNodeColorScheme] = useState(nodeColorSchemeInit);
  const [linkColorScheme, setLinkColorScheme] = useState(linkColorSchemeInit);

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
        simulationReset(); //the simulation has to be reloaded after
        log.info("Graph Loaded Successfully:", newGraph);
      } catch (error) {
        setError("Error loading graph");
        log.error("Error loading graph:", error);
        return;
      }
    }

    log.info("Replacing graph");
    fetchGraph();
  };

  const handleMappingSelect = (mapping) => {
    if (mapping !== activeMapping) {
      setActiveMapping(mapping);
      simulationReset();
    } else {
      log.error("Mapping is already the current mapping");
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
    resetPhysicsSettings(setPhysicsSettings);
  };

  const resetFilters = () => {
    resetFilterSettings(setFilterSettings);
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
          log.error("Error parsing file");
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
          log.error("Error parsing color scheme");
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
      log.error("Error parsing node mapping");
    }
  };

  const handleRemoveActiveMapping = () => {
    setActiveMapping(null);
    simulationReset();
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
    simulationReset(); //the simulation has to be reloaded after
    log.info("Graph loaded successfully:", graph);
  };

  const handleDownloadJSONClick = () => {
    setDownload((prev) => ({ ...prev, downloadJson: !download.downloadJson }));
  };

  const handleDownloadPNGClick = () => {
    setDownload((prev) => ({ ...prev, downloadPng: !download.downloadPng }));
  };

  const handleDownloadSVGClick = () => {
    setDownload((prev) => ({ ...prev, downloadSvg: !download.downloadSvg }));
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
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraphCurrent = structuredClone(graph);
    newGraphCurrent = applyNodeMapping(newGraphCurrent, activeMapping);

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraphCurrent);
    setNodeAttribsToColorIndices(nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraphCurrent);
    setLinkAttribsToColorIndices(linkAttribsToColorIndices);

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
        nodeAttribsToColorIndices={nodeAttribsToColorIndices}
        linkAttribsToColorIndices={linkAttribsToColorIndices}
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
        physicsSettings={physicsSettings}
        setPhysicsSettings={setPhysicsSettings}
        filterSettings={filterSettings}
        setFilterSettings={setFilterSettings}
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
          circleBorderColor={circleBorderColor}
          setReset={setReset}
          setError={setError}
          filterSettings={filterSettings}
          setGraphCurrent={setGraphCurrent}
          physicsSettings={physicsSettings}
          setPhysicsSettings={setPhysicsSettings}
          nodeColorScheme={nodeColorScheme}
          linkColorScheme={linkColorScheme}
          theme={theme}
          mapping={activeMapping}
          nodeAttribsToColorIndices={nodeAttribsToColorIndices}
          linkAttribsToColorIndices={linkAttribsToColorIndices}
        />
      </main>
    </div>
  );
}

export default App;
