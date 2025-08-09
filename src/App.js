import "./index.css";
import log from "./logger.js";
import { useState, useEffect } from "react";

import { ForceGraph } from "./components/graph_domain/forceGraph.js";
import { Sidebar } from "./components/gui/sidebar/sidebar.js";
import { HeaderBar } from "./components/gui/headerbar/headerBar.js";
import {
  applyNodeMapping,
  getDifferenceGraph,
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
  joinGraphs,
  mergeSameProteins,
} from "./components/graph_domain/graphCalculations.js";
import {
  addActiveGraphFile,
  addNewAnnotationMappingFile,
  addNewColorScheme,
  addNewGraphFile,
  deleteAnnotationMapping,
  deleteColorScheme,
  deleteGraphFile,
  loadAnnotationMappings,
  loadColorSchemeNames,
  loadGraphFileNames,
  loadTheme,
  removeActiveGraphFile,
  selectGraph,
  selectLinkColorScheme,
  selectMapping,
  selectNodeColorScheme,
  setInitColorSchemes,
  setInitGraph,
  storeTheme,
} from "./components/application/applicationFunctions.js";
import { useAppearance, useDownload, useFilter, useGraphData, usePhysics } from "./states.js";
import { Erorr } from "./components/other/error.js";
import { defaultColorSchemes } from "./components/init_values/appearanceInitValues.js";
import { getFileNameWithoutExtension } from "./components/other/parseFiles.js";
import { getGraphDB } from "./components/database/dbGraphs.js";
import { downloadInit } from "./components/init_values/downloadInitValues.js";
import { physicsInit } from "./components/init_values/physicsInitValues.js";
import { filterInit, linkThresholdInit } from "./components/init_values/filterInitValues.js";

function App() {
  const { setFilter, setAllFilter } = useFilter();
  const { setAllPhysics } = usePhysics();
  const { appearance, setAppearance } = useAppearance();
  const { download, setDownload } = useDownload();
  const { graphData, setGraphData } = useGraphData();

  const [reset, setReset] = useState(false); // true indicates that the simulation (in forceGraph.js) has to be reloaded
  const [error, setError] = useState(null); // error gets printed on screen

  // sets corresponding graph after file selection
  const handleSelectGraph = (filename) => {
    if (!filename) return;
    log.info("Replacing graph");

    try {
      simulationReset();
      selectGraph(filename, setGraphData);
      setGraphData("graphIsPreprocessed", false);
      setGraphData("mergeProteins", false);
      setGraphData("", {
        ...graphData,
        graphIsPreprocessed: false,
        mergeProteins: false,
      });
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  };

  // sets corresponding mapping after selection
  const handleSelectAnnotationMapping = (mappingName) => {
    if (!mappingName) return;
    log.info("Replacing annotation mapping");

    try {
      simulationReset();
      setGraphData("graphIsPreprocessed", false);
      selectMapping(mappingName, setGraphData);
    } catch (error) {
      setError("Mapping is already the current mapping");
      log.error("Mapping is already the current mapping");
    }
  };

  // adds new graph file //
  const handleNewGraphFile = async (
    event,
    takeAbs,
    minCorrForEdge,
    minCompSizeForNode,
    maxCompSizeForNode,
    takeSpearmanCoefficient,
    mergeSameProtein
  ) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    log.info("Adding new graph file");

    addNewGraphFile(
      file,
      graphData.uploadedGraphFileNames,
      setGraphData,
      takeAbs,
      minCorrForEdge,
      minCompSizeForNode,
      maxCompSizeForNode,
      takeSpearmanCoefficient,
      mergeSameProtein
    )
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding graph file:", error);
      });
  };

  const handleSelectLinkColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Replacing link color scheme");

    try {
      selectLinkColorScheme(colorSchemeName, setAppearance);
    } catch (error) {
      setError("Color scheme is already the current link color scheme");
      log.error("Color scheme is already the current link color scheme");
    }
  };

  const handleSelectNodeColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    log.info("Replacing node color scheme");

    try {
      selectNodeColorScheme(colorSchemeName, setAppearance);
    } catch (error) {
      setError("Color scheme is already the current node color scheme");
      log.error("Color scheme is already the current node color scheme");
    }
  };

  // adds new color scheme
  const handleNewColorScheme = async (event) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (appearance.uploadedColorSchemeNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Color scheme with this name already exists");
      setError("Color scheme with this name already exists");
      return;
    }
    log.info("Adding new color scheme");

    addNewColorScheme(file, appearance.uploadedColorSchemeNames, setAppearance)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding color scheme:", error);
      });
  };

  const handleDeleteColorScheme = (colorSchemeName) => {
    if (!colorSchemeName) return;
    if (defaultColorSchemes.some((scheme) => scheme.name === colorSchemeName)) {
      log.warn("Cannot remove default color schemes");
      setError("Cannot remove default color schemes");
      return;
    }
    if (appearance.nodeColorScheme?.name == colorSchemeName || appearance.linkColorScheme?.name == colorSchemeName) {
      log.warn("Cannot remove selected color scheme as it's still active");
      setError("Cannot remove selected color scheme as it's still active");
      return;
    }
    log.info("Deleting color schemes with name", colorSchemeName);

    deleteColorScheme(appearance.uploadedColorSchemeNames, colorSchemeName, setAppearance);
  };

  // processes new annotation mapping
  const handleNewAnnotationMapping = (event) => {
    const file = event.target.files[0];
    if (!event || !event.target || !file) return;
    if (graphData.uploadedAnnotationMappingNames.some((name) => getFileNameWithoutExtension(name) === getFileNameWithoutExtension(file.name))) {
      log.warn("Mapping with this name already exists");
      setError("Mapping with this name already exists");
      return;
    }
    log.info("Adding new mapping file");

    addNewAnnotationMappingFile(file, graphData.uploadedAnnotationMappingNames, setGraphData)
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding mapping file:", error);
      });
  };

  // disables currently active annotation mapping
  const handleRemoveActiveAnnotationMapping = () => {
    log.info("Removing currently active annotation mapping");

    setGraphData("activeAnnotationMapping", null);
    setGraphData("graphIsPreprocessed", false);
    simulationReset();
  };

  // deletes annotation mapping files
  const handleDeleteAnnotationMapping = (mappingName) => {
    if (!mappingName) return;
    if (graphData?.activeAnnotationMapping?.name == mappingName) {
      log.warn("Cannot remove selected mapping as it's still active");
      setError("Cannot remove selected mapping as it's still active");
      return;
    }
    log.info("Deleting mapping with name", mappingName);

    deleteAnnotationMapping(graphData.uploadedAnnotationMappingNames, mappingName, setGraphData);
  };

  // deletes uploaded files with filename //
  const handleDeleteGraphFile = (filename) => {
    if (!filename) return;
    if (graphData?.activeGraphFileNames?.includes(filename)) {
      log.warn("Cannot remove selected graph as it's still active");
      setError("Cannot remove selected graph as it's still active");
      return;
    }
    log.info("Deleting files with name", filename);

    deleteGraphFile(graphData.uploadedGraphFileNames, filename, setGraphData);
  };

  // removes graph file from currently active files //
  const handleRemoveActiveGraphFile = (filename) => {
    if (!filename) return;
    log.info("removing graph file with name:", filename);

    simulationReset();
    setGraphData("graphIsPreprocessed", false);
    removeActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData);
  };

  const handleAddActiveGraphFile = (filename) => {
    if (!filename) return;
    if (graphData.activeGraphFileNames.some((name) => name === filename)) {
      setError("Graph already active");
      log.error("Graph already active");
      return;
    }
    log.info("Adding file with name: ", filename);

    try {
      simulationReset();
      setGraphData("graphIsPreprocessed", false);
      addActiveGraphFile(filename, graphData.activeGraphFileNames, setGraphData, graphData.originGraph);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
      return;
    }
  };

  async function handleCreateDifferenceGraph(selectedGraphName1, selectedGraphName2, graphData, setGraphData, takeAbs) {
    if (!selectedGraphName1 || !selectedGraphName2) {
      setError("Please select two graphs");
      return;
    }
    if (selectedGraphName1 === selectedGraphName2) {
      setError("Please select two different graphs");
      return;
    }
    log.info("Creating difference graph with following graphs:", selectedGraphName1, selectedGraphName2);

    let obj1 = await getGraphDB(selectedGraphName1);
    let obj2 = await getGraphDB(selectedGraphName2);

    const diffGraph = getDifferenceGraph(obj1.graph, obj2.graph);
    const diffGraphName = "DifferenceGraph" + ".json";

    const file = new File([JSON.stringify(diffGraph)], diffGraphName, {
      type: "application/json",
    });

    const minCorrForEdge = 0;
    const minCompSizeForNode = 0;
    const maxCompSizeForNode = "";
    const takeSpearmanCoefficient = false;

    addNewGraphFile(
      file,
      graphData.uploadedGraphFileNames,
      setGraphData,
      takeAbs,
      minCorrForEdge,
      minCompSizeForNode,
      maxCompSizeForNode,
      takeSpearmanCoefficient
    )
      .then(() => {})
      .catch((error) => {
        setError(`${error.message}`);
        log.error("Error adding graph file:", error);
      });
  }

  // initates reset //
  const simulationReset = () => {
    if (!graphData.activeGraphFileNames) return;
    log.info("Handle Simulation Reset");

    setAllFilter(filterInit);
    setAllPhysics(physicsInit);
    setDownload(downloadInit);
    setError(null);
    setReset(true);
  };

  // select example graph on startup
  useEffect(() => {
    log.info("Setting init graph data");
    setInitGraph(setGraphData);
    setGraphData("graphIsPreprocessed", false);
  }, []);

  // select default color schemes on startup
  useEffect(() => {
    log.info("Setting init color schemes");
    setInitColorSchemes(appearance, setAppearance);
  }, []);

  // init uploadedGraphFileNames
  useEffect(() => {
    log.info("Loading uploaded graph files");
    try {
      loadGraphFileNames(setGraphData);
    } catch (error) {
      setError("Error loading graph files from database");
      log.error("Error loading graph files from database");
    }
  }, []);

  // load current theme
  useEffect(() => {
    log.info("Loading Theme");
    loadTheme(setAppearance);
  }, []);

  // store current theme //
  useEffect(() => {
    if (!appearance.theme) return;
    log.info("Storing current theme if needed");

    storeTheme(appearance.theme);
  }, [appearance.theme]);

  // init uploadedMappingFileNames
  useEffect(() => {
    log.info("Loading uploaded mapping files");
    try {
      loadAnnotationMappings(setGraphData);
    } catch (error) {
      setError("Error loading mapping files form database");
      log.error("Error loading mapping files form database");
    }
  }, []);

  // init uploadedColorSchemeNames //
  useEffect(() => {
    log.info("Loading uploaded color schemes");
    try {
      loadColorSchemeNames(setAppearance);
    } catch (error) {
      setError("Error loading color schemes files from database");
      log.error("Error loading color schemes files from database");
    }
  }, []);

  useEffect(() => {
    async function mergedGraph(graphData) {
      const { graph, file } = await getGraphDB(graphData.activeGraphFileNames[0]);

      let combinedGraph = graph;
      for (let i = 1; i < graphData.activeGraphFileNames.length; i++) {
        let { graph, file } = await getGraphDB(graphData.activeGraphFileNames[i]);
        combinedGraph = joinGraphs(combinedGraph, graph);
      }

      if (graphData.mergeProteins) {
        combinedGraph = mergeSameProteins(combinedGraph);
      }

      setGraphData("originGraph", combinedGraph);
      setGraphData("activeGraphFileNames", graphData.activeGraphFileNames);
    }

    if (graphData.mergeProteins == null || !graphData.graphIsPreprocessed || !graphData.activeGraphFileNames || !graphData.activeGraphFileNames[0])
      return;

    log.info("Merging Proteins: ", graphData.mergeProteins);

    try {
      simulationReset();
      setGraphData("graphIsPreprocessed", false);
      mergedGraph(graphData);
    } catch (error) {
      setError("Error loading graph");
      log.error("Error loading graph:", error);
    }
  }, [graphData.mergeProteins]);

  // forwards graph to forceGraph component //
  useEffect(() => {
    if (!graphData.originGraph || !graphData.activeGraphFileNames || graphData.graphIsPreprocessed) return;
    log.info("Modifying graph and forwarding it to the simulation component");

    let newGraph = structuredClone(graphData.originGraph);
    newGraph = applyNodeMapping(newGraph, graphData.activeAnnotationMapping);

    const { minWeight, maxWeight } = getLinkWeightMinMax(newGraph);
    if (minWeight != Infinity) {
      setGraphData("linkWeightMin", minWeight);
    }
    if (maxWeight != -Infinity) {
      setGraphData("linkWeightMax", maxWeight);
    }

    if (minWeight != Infinity && minWeight > linkThresholdInit) {
      setFilter("linkThreshold", minWeight);
      setFilter("linkThresholdText", minWeight);
    }

    // set max comp size = amount of nodes

    const nodeAttribsToColorIndices = getNodeAttribsToColorIndices(newGraph);
    setAppearance("nodeAttribsToColorIndices", nodeAttribsToColorIndices);

    const linkAttribsToColorIndices = getLinkAttribsToColorIndices(newGraph);
    setAppearance("linkAttribsToColorIndices", linkAttribsToColorIndices);

    setGraphData("originGraph", newGraph);
    setGraphData("graph", newGraph);
    setGraphData("graphIsPreprocessed", true);
  }, [graphData.originGraph, graphData.activeGraphFileNames, graphData.activeAnnotationMapping]);

  return (
    <div className={appearance.theme.name}>
      <HeaderBar />
      <Sidebar
        handleSelectGraph={handleSelectGraph}
        handleDeleteGraphFile={handleDeleteGraphFile}
        handleRemoveActiveGraphFile={handleRemoveActiveGraphFile}
        handleAddFile={handleAddActiveGraphFile}
        handleNewAnnotationMapping={handleNewAnnotationMapping}
        handleRemoveActiveAnnotationMapping={handleRemoveActiveAnnotationMapping}
        handleAnnotationMappingSelect={handleSelectAnnotationMapping}
        handleDeleteAnnotationMapping={handleDeleteAnnotationMapping}
        handleNewGraphFile={handleNewGraphFile}
        handleNewColorScheme={handleNewColorScheme}
        handleDeleteColorScheme={handleDeleteColorScheme}
        handleCreateDifferenceGraph={handleCreateDifferenceGraph}
        handleSelectLinkColorScheme={handleSelectLinkColorScheme}
        handleSelectNodeColorScheme={handleSelectNodeColorScheme}
      />
      <main>
        {error && <Erorr error={error} setError={setError} />}
        <ForceGraph reset={reset} setReset={setReset} setError={setError} />
      </main>
    </div>
  );
}
export default App;
