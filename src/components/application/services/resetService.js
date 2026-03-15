import log from "../../adapters/logging/logger.js";
import { graphService } from "./graphService.js";
import { errorService } from "./errorService.js";
import { downloadInit, useDownload } from "../../adapters/state/downloadState.js";
import { useReset } from "../../adapters/state/resetState.js";
import { filteredAfterStartInit, isPreprocessedInit, useGraphFlags } from "../../adapters/state/graphFlagsState.js";
import { graphMetricsInit, useGraphMetrics } from "../../adapters/state/graphMetricsState.js";
import { searchStateInit, useSearchState } from "../../adapters/state/searchState.js";
import { communityStateInit, useCommunityState } from "../../adapters/state/communityState.js";

export const resetService = {
  resetSimulation(options = {}) {
    if (!graphService.getActiveGraphNames()) return;
    log.info("Resetting the simulation");
    const preserveSearch = Boolean(options.preserveSearch);

    useDownload.getState().setAllDownload(downloadInit);

    useGraphMetrics.getState().setAllGraphMetrics(graphMetricsInit);

    useGraphFlags.getState().setGraphFlags("isPreprocessed", isPreprocessedInit);
    useGraphFlags.getState().setGraphFlags("filteredAfterStart", filteredAfterStartInit);

    if (preserveSearch) {
      const currentSearchState = useSearchState.getState().searchState;
      useSearchState.getState().setAllSearchState({
        ...searchStateInit,
        searchValue: currentSearchState.searchValue,
        query: currentSearchState.query,
      });
    } else {
      useSearchState.getState().setAllSearchState(searchStateInit);
    }

    useCommunityState.getState().setAllCommunityState(communityStateInit);

    errorService.clearError();
    this.setReset(true);
  },
  getReset() {
    return useReset.getState().reset;
  },
  setReset(value) {
    useReset.getState().setReset(value);
  },
};
