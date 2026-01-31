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
  filterGroupVisibility,
} from "../../domain/service/graph_calculations/filterGraph.js";
import { useFilter } from "../state/filterState.js";
import { useAppearance } from "../state/appearanceState.js";
import { useGraphState } from "../state/graphState.js";
import { usePixiState } from "../state/pixiState.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { errorService } from "../../application/services/errorService.js";
import { useCommunityState } from "../state/communityState.js";

export function FilterControl() {
  const { filter } = useFilter();
  const { appearance } = useAppearance();
  const { graphState, setGraphState } = useGraphState();
  const { graphFlags, setGraphFlags } = useGraphFlags();
  const { pixiState } = usePixiState();
  const { communityState, setCommunityState } = useCommunityState();

  // base filters (exclude group visibility)
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
      "\n    Lasso Selection: ",
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

      const baseSignature = getGraphSignature(filteredGraphData);
      const shouldUpdateBaseGraph =
        baseSignature &&
        (baseSignature !== communityState.baseSignature || !communityState.baseGraphData);

      if (shouldUpdateBaseGraph) {
        setCommunityState("baseSignature", baseSignature);
        setCommunityState("baseGraphData", filteredGraphData);
      }

      const shouldFilterGroups =
        !communityState.isStale &&
        communityState.idToGroup &&
        Array.isArray(filter.communityHiddenIds) &&
        filter.communityHiddenIds.length > 0;

      if (shouldFilterGroups) {
        return;
      }

      const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };

      filterActiveNodesForPixi(appearance.showNodeLabels, filteredGraphData, pixiState.nodeMap);

      setGraphFlags("filteredAfterStart", true);
      setGraphState("graph", filteredGraph);

      if (communityState.isGroupFiltered) {
        setCommunityState("isGroupFiltered", false);
      }
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
    filter.lassoSelection,
    graphState.originGraph,
    pixiState.nodeContainers,
    pixiState.nodeMap,
    appearance.showNodeLabels,
    communityState.baseSignature,
    communityState.baseGraphData,
    communityState.isGroupFiltered,
  ]);

  // group visibility filter only
  useEffect(() => {
    if (!graphFlags.isPreprocessed || !pixiState.nodeMap) return;

    const baseGraphData = communityState.baseGraphData;
    const graphName = graphState.graph?.name;
    if (!baseGraphData || !graphName) return;

    const shouldFilterGroups =
      !communityState.isStale &&
      communityState.idToGroup &&
      Array.isArray(filter.communityHiddenIds) &&
      filter.communityHiddenIds.length > 0;

    if (!shouldFilterGroups) {
      if (!communityState.isGroupFiltered) return;

      const filteredGraph = { name: graphName, data: baseGraphData };
      filterActiveNodesForPixi(appearance.showNodeLabels, baseGraphData, pixiState.nodeMap);
      setGraphFlags("filteredAfterStart", true);
      setGraphState("graph", filteredGraph);
      setCommunityState("isGroupFiltered", false);
      return;
    }

    let filteredGraphData = filterGroupVisibility(baseGraphData, communityState.idToGroup, filter.communityHiddenIds);
    filteredGraphData = filterNodesExist(filteredGraphData);

    const filteredGraph = { name: graphName, data: filteredGraphData };
    filterActiveNodesForPixi(appearance.showNodeLabels, filteredGraphData, pixiState.nodeMap);
    setGraphFlags("filteredAfterStart", true);
    setGraphState("graph", filteredGraph);

    if (!communityState.isGroupFiltered) {
      setCommunityState("isGroupFiltered", true);
    }
  }, [
    graphFlags.isPreprocessed,
    pixiState.nodeMap,
    appearance.showNodeLabels,
    communityState.baseGraphData,
    communityState.idToGroup,
    communityState.isStale,
    communityState.isGroupFiltered,
    filter.communityHiddenIds,
    graphState.graph?.name,
    setCommunityState,
  ]);
}

function getEndpointId(endpoint) {
  if (endpoint == null) return null;
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return endpoint.id;
    if (endpoint.data?.id != null) return endpoint.data.id;
  }
  return endpoint;
}

function hashString(value) {
  if (value == null) return 0;
  const str = value.toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getGraphSignature(graphData) {
  if (!graphData) return null;
  let hash = 0;

  graphData.nodes?.forEach((node) => {
    hash = (hash * 33 + hashString(node?.id)) >>> 0;
  });

  graphData.links?.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    hash = (hash * 33 + hashString(sourceId)) >>> 0;
    hash = (hash * 33 + hashString(targetId)) >>> 0;
  });

  const nodeCount = graphData.nodes?.length ?? 0;
  const linkCount = graphData.links?.length ?? 0;
  return `${nodeCount}:${linkCount}:${hash.toString(16)}`;
}
