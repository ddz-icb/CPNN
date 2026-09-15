import { useEffect } from "react";
import log from "../logging/logger.js";
import { applyGraphFilters } from "../../domain/service/graph_calculations/filterGraphPipeline.js";
import { hasGraphStructureChanged } from "../../domain/service/graph_calculations/graphUtils.js";
import { useFilter } from "../state/filterState.js";
import { useAppearance } from "../state/appearanceState.js";
import { useGraphState } from "../state/graphState.js";
import { usePixiState } from "../state/pixiState.js";
import { useGraphFlags } from "../state/graphFlagsState.js";
import { errorService } from "../../application/services/errorService.js";
import { useCommunityState } from "../state/communityState.js";
import { useColorschemeState } from "../state/colorschemeState.js";
import { useTheme } from "../state/themeState.js";
import { filterActiveNodesForPixi, syncNodeMapWithGraphData } from "../../domain/service/canvas_drawing/nodes.js";

const FILTER_DEBOUNCE_MS = 90;

export function FilterControl() {
  const { filter } = useFilter();
  const { appearance } = useAppearance();
  const { colorschemeState } = useColorschemeState();
  const { theme } = useTheme();
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
        "Filtering nodes and links.\n    Min Threshold:  ",
        filter.minLinkThreshold,
        "\n    Max Threshold: ",
        filter.maxLinkThreshold,
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
        "\n    Min Component Density: ",
        filter.componentDensity,
        "\n    Max Component Density: ",
        filter.maxComponentDensity,
        "\n    Lasso Selection: ",
        filter.lassoSelection,
        "\n    Min Component Size: ",
        filter.minCompSize,
        "\n    Max Component Size: ",
        filter.maxCompSize,
      );

      try {
        const { graphData: filteredGraphData, communitySummary } = applyGraphFilters({
          graphData: graphState.graph.data,
          originGraphData: graphState.originGraph.data,
          filter,
          mergeByName: graphFlags.mergeByName,
          mergeOptions: {
            preserveRepresentativeNodes: true,
            previousGraphData: graphState.graph.data,
          },
          communityResolution: communityState.communityResolution,
        });

        const filteredGraph = { name: graphState.graph.name, data: filteredGraphData };
        const graphChanged = hasGraphStructureChanged(graphState.graph.data, filteredGraphData);

        setCommunityState("communities", communitySummary.communities);
        setCommunityState("idToCommunity", communitySummary.idToCommunity);
        setCommunityState("communityToNodeIds", communitySummary.communityToNodeIds);

        if (!graphChanged && graphFlags.filteredAfterStart) {
          log.info("Filtering produced no graph changes. Keeping current simulation temperature.");
          return;
        }

        syncNodeMapWithGraphData(filteredGraphData, pixiState.nodeMap, theme, colorschemeState);
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
    graphFlags.mergeByName,
    filter.minLinkThreshold,
    filter.maxLinkThreshold,
    filter.linkFilter,
    filter.nodeFilter,
    filter.nodeIdFilters,
    filter.communityDensity,
    filter.minCommunitySize,
    filter.maxCommunitySize,
    filter.componentDensity,
    filter.maxComponentDensity,
    filter.minKCoreSize,
    filter.minCompSize,
    filter.maxCompSize,
    filter.lassoSelection,
    filter.communityHiddenIds,
    graphState.originGraph,
    pixiState.nodeContainers,
    pixiState.nodeMap,
    communityState.communityResolution,
    theme,
    colorschemeState,
  ]);

  useEffect(() => {
    if (
      !graphState.graph ||
      !(pixiState?.nodeContainers?.children?.length > 0) ||
      !pixiState.nodeMap
    ) {
      return;
    }
    syncNodeMapWithGraphData(graphState.graph.data, pixiState.nodeMap, theme, colorschemeState);
    filterActiveNodesForPixi(appearance.showNodeLabels, graphState.graph.data, pixiState.nodeMap);
  }, [appearance.showNodeLabels, graphState.graph, pixiState.nodeContainers, pixiState.nodeMap, theme, colorschemeState]);
}
