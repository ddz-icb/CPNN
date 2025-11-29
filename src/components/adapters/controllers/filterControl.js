import { useEffect } from "react";
import log from "../logging/logger.js";

import {
  filterActiveNodesForPixi,
  filterLinkAttribs,
  filterNodeAttribs,
  filterNodeIds,
  filterThreshold,
  filterCompDensity,
  filterMaxCompSize,
  filterMinCompSize,
  filterMinNeighborhood,
  filterNodesExist,
  filterLasso,
} from "../../domain/service/graph_calculations/filterGraph.js";
import { useFilter } from "../state/filterState.js";
import { useAppearance } from "../state/appearanceState.js";
import { useGraphState } from "../state/graphState.js";
import { usePixiState } from "../state/pixiState.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { errorService } from "../../application/services/errorService.js";

export function FilterControl() {
  const { filter } = useFilter();
  const { appearance } = useAppearance();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { pixiState } = usePixiState();

  // filter nodes and links //
  useEffect(() => {
    if (
      !graphState.graph ||
      !graphState.originGraph ||
      !(pixiState?.circles?.children?.length > 0) ||
      !pixiState.nodeMap ||
      !graphFlags.isPreprocessed
    ) {
      return;
    }
    log.info(
      "Filtering nodes and links.\n    Threshold:  ",
      filter.linkThreshold,
      "\n    Link Attributes: ",
      filter.linkFilter,
      "\n    Node Attributes: ",
      filter.nodeFilter,
      "\n    Node ID Filters: ",
      filter.nodeIdFilters,
      "\n    Mininum component size: ",
      filter.minCompSize,
      "\n    Maximum component size: ",
      filter.maxCompSize,
      "\n    Minimum k-Core size: ",
      filter.minKCoreSize,
      "\n    Groups: ",
      filter.nodeFilter,
      "\n    Comp Density: ",
      filter.compDensity,
      "\n    Lasso: ",
      filter.lasso,
      filter.lassoSelection
    );

    try {
      let filteredGraphData = {
        ...graphState.graph.data,
        nodes: graphState.originGraph.data.nodes,
        links: graphState.originGraph.data.links,
      };

      filteredGraphData = filterLasso(filteredGraphData, filter.lassoSelection);
      filteredGraphData = filterNodeAttribs(filteredGraphData, filter.nodeFilter);
      filteredGraphData = filterNodeIds(filteredGraphData, filter.nodeIdFilters);
      filteredGraphData = filterNodesExist(filteredGraphData);

      filteredGraphData = filterThreshold(filteredGraphData, filter.linkThreshold);
      filteredGraphData = filterLinkAttribs(filteredGraphData, filter.linkFilter);

      filteredGraphData = filterCompDensity(filteredGraphData, filter.compDensity);
      filteredGraphData = filterMinNeighborhood(filteredGraphData, filter.minKCoreSize);
      filteredGraphData = filterNodesExist(filteredGraphData);

      filteredGraphData = filterMinCompSize(filteredGraphData, filter.minCompSize);
      filteredGraphData = filterMaxCompSize(filteredGraphData, filter.maxCompSize);
      filteredGraphData = filterNodesExist(filteredGraphData);

      const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };

      filterActiveNodesForPixi(appearance.showNodeLabels, filteredGraphData, pixiState.nodeMap);

      setGraphFlags("filteredAfterStart", true);
      setGraphState("graph", filteredGraph);
    } catch (error) {
      errorService.setError(error.message);
      log.error("Error while filtering graph:", error);
    }
  }, [
    graphFlags.isPreprocessed,
    filter.linkThreshold,
    filter.linkFilter,
    filter.nodeFilter,
    filter.nodeIdFilters,
    filter.minCompSize,
    filter.maxCompSize,
    filter.compDensity,
    filter.minKCoreSize,
    filter.lasso,
    filter.lassoSelection,
    graphState.originGraph,
    pixiState.circles,
    pixiState.nodeMap,
  ]);
}
