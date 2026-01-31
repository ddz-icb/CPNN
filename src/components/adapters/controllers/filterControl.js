import { useEffect } from "react";
import log from "../logging/logger.js";

import {
  filterActiveNodesForPixi,
  filterLinkAttribs,
  filterNodeAttribs,
  filterNodeIds,
  filterThreshold,
  filterCommunityDensity,
  filterComponentDensity,
  filterMaxCompSize,
  filterMinNeighborhood,
  filterMinCompSize,
  filterNodesExist,
  filterLasso,
  filterCommunityVisibility,
} from "../../domain/service/graph_calculations/filterGraph.js";
import { useFilter } from "../state/filterState.js";
import { useAppearance } from "../state/appearanceState.js";
import { useGraphState } from "../state/graphState.js";
import { usePixiState } from "../state/pixiState.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { errorService } from "../../application/services/errorService.js";
import { useCommunityState } from "../state/communityState.js";
import { buildCommunitySummary } from "../../domain/service/graph_calculations/communityGrouping.js";

export function FilterControl() {
  const { filter } = useFilter();
  const { appearance } = useAppearance();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { pixiState } = usePixiState();
  const { communityState, setCommunityState } = useCommunityState();

  useEffect(() => {
    if (
      !graphState.graph ||
      !graphState.originGraph ||
      !(pixiState?.nodeContainers?.children?.length > 0) ||
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
      "\n    Minimum k-Core size: ",
      filter.minKCoreSize,
      "\n    Groups: ",
      filter.nodeFilter,
      "\n    Community Density: ",
      filter.communityDensity,
      "\n    Component Density: ",
      filter.componentDensity,
      "\n    Lasso Selection: ",
      filter.lassoSelection,
      "\n    Min Component Size: ",
      filter.minCompSize,
      "\n    Max Component Size: ",
      filter.maxCompSize,
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

      filteredGraphData = filterComponentDensity(filteredGraphData, filter.componentDensity);
      filteredGraphData = filterCommunityDensity(filteredGraphData, filter.communityDensity);
      filteredGraphData = filterMinNeighborhood(filteredGraphData, filter.minKCoreSize);
      filteredGraphData = filterMinCompSize(filteredGraphData, filter.minCompSize);
      filteredGraphData = filterMaxCompSize(filteredGraphData, filter.maxCompSize);
      filteredGraphData = filterNodesExist(filteredGraphData);

      const summary = buildCommunitySummary(filteredGraphData, { resolution: communityState.communityResolution });
      filteredGraphData = filterCommunityVisibility(filteredGraphData, summary.idToGroup, filter.communityHiddenIds);

      const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };

      setCommunityState("groups", summary.groups);
      setCommunityState("idToGroup", summary.idToGroup);
      setCommunityState("groupToNodeIds", summary.groupToNodeIds);

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
    filter.communityDensity,
    filter.componentDensity,
    filter.minKCoreSize,
    filter.minCompSize,
    filter.maxCompSize,
    filter.lassoSelection,
    filter.communityHiddenIds,
    filter.communityMinSize,
    filter.communityMaxSize,
    graphState.originGraph,
    pixiState.nodeContainers,
    pixiState.nodeMap,
    appearance.showNodeLabels,
    communityState.communityResolution,
  ]);
}
