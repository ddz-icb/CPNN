import { useEffect } from "react";
import log from "../logging/logger.js";
import {
  filterActiveNodesForPixi,
  filterLinkAttribs,
  filterNodeAttribs,
  filterNodeIds,
  filterThreshold,
  filterCommunityDensity,
  filterCommunitySizeRange,
  filterComponentDensity,
  filterMinNeighborhood,
  filterComponentSizeRange,
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
import { withoutAdditionalLinkAttribs } from "../../domain/service/enrichment/stringDbEnrichment.js";

const FILTER_DEBOUNCE_MS = 90;

function getEndpointId(endpoint) {
  if (endpoint == null) return endpoint;
  if (typeof endpoint === "object") return endpoint.id ?? endpoint.data?.id;
  return endpoint;
}

function sameArrayValues(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function hasGraphStructureChanged(currentGraphData, nextGraphData) {
  if (!currentGraphData || !nextGraphData) return true;

  const currentNodes = currentGraphData.nodes ?? [];
  const nextNodes = nextGraphData.nodes ?? [];
  if (currentNodes.length !== nextNodes.length) return true;
  for (let i = 0; i < currentNodes.length; i++) {
    if (currentNodes[i]?.id !== nextNodes[i]?.id) return true;
  }

  const currentLinks = currentGraphData.links ?? [];
  const nextLinks = nextGraphData.links ?? [];
  if (currentLinks.length !== nextLinks.length) return true;

  for (let i = 0; i < currentLinks.length; i++) {
    const currentLink = currentLinks[i];
    const nextLink = nextLinks[i];

    if (getEndpointId(currentLink?.source) !== getEndpointId(nextLink?.source)) return true;
    if (getEndpointId(currentLink?.target) !== getEndpointId(nextLink?.target)) return true;
    if (!sameArrayValues(currentLink?.attribs ?? [], nextLink?.attribs ?? [])) return true;
    if (!sameArrayValues(currentLink?.weights ?? [], nextLink?.weights ?? [])) return true;
  }

  return false;
}

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
    const debounceTimeout = setTimeout(() => {
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
        "\n    Community Density: ",
        filter.communityDensity,
        "\n    Min Community Size: ",
        filter.minCommunitySize,
        "\n    Max Community Size: ",
        filter.maxCommunitySize,
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

        // STRING-DB links are excluded from structural filters (component/community/k-core)
        // prevents keeping nodes alive without regular connections.
        const linksBeforeStructural = filteredGraphData.links;
        filteredGraphData = { ...filteredGraphData, links: withoutAdditionalLinkAttribs(filteredGraphData.links) };

        filteredGraphData = filterComponentDensity(filteredGraphData, filter.componentDensity);
        filteredGraphData = filterCommunityDensity(filteredGraphData, filter.communityDensity, communityState.communityResolution);
        filteredGraphData = filterMinNeighborhood(filteredGraphData, filter.minKCoreSize);
        filteredGraphData = filterComponentSizeRange(filteredGraphData, filter.minCompSize, filter.maxCompSize);
        filteredGraphData = filterCommunitySizeRange(
          filteredGraphData,
          filter.minCommunitySize,
          filter.maxCommunitySize,
          communityState.communityResolution,
        );

        const communitySummary = buildCommunitySummary(filteredGraphData, { resolution: communityState.communityResolution });
        filteredGraphData = filterCommunityVisibility(filteredGraphData, communitySummary.idToCommunity, filter.communityHiddenIds);
        filteredGraphData = filterNodesExist(filteredGraphData);

        filteredGraphData = { ...filteredGraphData, links: filterNodesExist({ ...filteredGraphData, links: linksBeforeStructural }).links };

        const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };
        const graphChanged = hasGraphStructureChanged(graphState.graph.data, filteredGraphData);

        if (!graphChanged && graphFlags.filteredAfterStart) {
          log.info("Filtering produced no graph changes. Keeping current simulation temperature.");
          return;
        }

        setCommunityState("communities", communitySummary.communities);
        setCommunityState("idToCommunity", communitySummary.idToCommunity);
        setCommunityState("communityToNodeIds", communitySummary.communityToNodeIds);

        filterActiveNodesForPixi(appearance.showNodeLabels, filteredGraphData, pixiState.nodeMap);
        if (!graphFlags.filteredAfterStart) {
          setGraphFlags("filteredAfterStart", true);
        }
        if (graphChanged) {
          setGraphState("graph", filteredGraph);
        }
      } catch (error) {
        errorService.setError(error.message);
        log.error("Error while filtering graph:", error);
      }
    }, FILTER_DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [
    graphFlags.isPreprocessed,
    filter.linkThreshold,
    filter.linkFilter,
    filter.nodeFilter,
    filter.nodeIdFilters,
    filter.communityDensity,
    filter.minCommunitySize,
    filter.maxCommunitySize,
    filter.componentDensity,
    filter.minKCoreSize,
    filter.minCompSize,
    filter.maxCompSize,
    filter.lassoSelection,
    filter.communityHiddenIds,
    graphState.originGraph,
    pixiState.nodeContainers,
    pixiState.nodeMap,
    communityState.communityResolution,
  ]);

  useEffect(() => {
    if (
      !graphState.graph ||
      !(pixiState?.nodeContainers?.children?.length > 0) ||
      !pixiState.nodeMap
    ) {
      return;
    }
    filterActiveNodesForPixi(appearance.showNodeLabels, graphState.graph.data, pixiState.nodeMap);
  }, [appearance.showNodeLabels, graphState.graph, pixiState.nodeContainers, pixiState.nodeMap]);
}
