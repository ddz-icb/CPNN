import { useEffect } from "react";
import log from "../../adapters/logging/logger.js";

import {
  filterActiveNodesForPixi,
  filterByLinkAttribs,
  filterByNodeAttribs,
  filterByThreshold,
  filterCompDensity,
  filterMaxCompSize,
  filterMinCompSize,
  filterMinNeighborhood,
  filterNodesExist,
} from "../../domain_service/graph_calculations/filterGraph.js";
import { useFilter } from "../../adapters/state/filterState.js";
import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useGraphState } from "../../adapters/state/graphState.js";
import { usePixiState } from "../../adapters/state/pixiState.js";

export function FilterStateControl() {
  const { filter, setFilter } = useFilter();
  const { appearance, setAppearance } = useAppearance();
  const { graphState, setGraphState } = useGraphState();
  const { pixiState, setPixiState } = usePixiState();

  // filter nodes and links //
  useEffect(() => {
    if (
      !graphState.graph ||
      !graphState.originGraph ||
      !pixiState?.circles?.children?.length > 0 ||
      !pixiState.nodeMap ||
      !graphState.isPreprocessed
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
      "\n    Mininum component size: ",
      filter.minCompSize,
      "\n    Maximum component size: ",
      filter.maxCompSize,
      "\n    Minimum neighborhood size: ",
      filter.minNeighborhoodSize,
      "\n    Groups: ",
      filter.nodeFilter,
      "\n    Comp Density: ",
      filter.compDensity
    );

    let filteredGraphData = {
      ...graphState.graph.data,
      nodes: graphState.originGraph.data.nodes,
      links: graphState.originGraph.data.links,
    };

    filteredGraphData = filterByNodeAttribs(filteredGraphData, filter.nodeFilter);
    filteredGraphData = filterNodesExist(filteredGraphData);

    filteredGraphData = filterByThreshold(filteredGraphData, filter.linkThreshold);
    filteredGraphData = filterByLinkAttribs(filteredGraphData, filter.linkFilter);

    filteredGraphData = filterCompDensity(filteredGraphData, filter.compDensity);
    filteredGraphData = filterMinNeighborhood(filteredGraphData, filter.minNeighborhoodSize);
    filteredGraphData = filterNodesExist(filteredGraphData);

    filteredGraphData = filterMinCompSize(filteredGraphData, filter.minCompSize);
    filteredGraphData = filterMaxCompSize(filteredGraphData, filter.maxCompSize);
    filteredGraphData = filterNodesExist(filteredGraphData);

    const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };

    filterActiveNodesForPixi(pixiState.circles, pixiState.nodeLabels, appearance.showNodeLabels, filteredGraphData, pixiState.nodeMap);
    setGraphState("filteredAfterStart", true);
    setGraphState("graph", filteredGraph);
  }, [
    filter.linkThreshold,
    filter.linkFilter,
    filter.nodeFilter,
    filter.minCompSize,
    filter.maxCompSize,
    filter.compDensity,
    filter.minNeighborhoodSize,
    graphState.originGraph,
    pixiState.circles,
  ]);
}
