import { useEffect } from "react";

import { useFilter } from "../state/filterState.js";
import { useGraphState } from "../state/graphState.js";
import { useCommunityState, communityStateInit } from "../state/communityState.js";
import { buildGroupSummary, isCommunityMode } from "../../domain/service/graph_calculations/communityGrouping.js";

export function CommunityControl() {
  const { filter } = useFilter();
  const { graphState } = useGraphState();
  const { communityState, setCommunityState, setAllCommunityState } = useCommunityState();

  const graphData = graphState.graph?.data;
  const baseGraphData = communityState.baseGraphData ?? graphData;
  const baseSignature = communityState.baseSignature;

  useEffect(() => {
    if (filter.communityComputeKey === 0 && communityState.lastComputeKey !== 0) {
      setAllCommunityState({
        ...communityStateInit,
        baseGraphData: communityState.baseGraphData,
        baseSignature: communityState.baseSignature,
      });
    }
  }, [
    filter.communityComputeKey,
    communityState.lastComputeKey,
    communityState.baseGraphData,
    communityState.baseSignature,
    setAllCommunityState,
  ]);

  useEffect(() => {
    if (!baseGraphData) return;
    if (filter.communityComputeKey === 0) return;
    if (filter.communityComputeKey === communityState.lastComputeKey) return;

    const summary = buildGroupSummary(baseGraphData, {
      mode: filter.communityMode,
      resolution: filter.communityResolution,
    });

    setCommunityState("groups", summary.groups);
    setCommunityState("idToGroup", summary.idToGroup);
    setCommunityState("groupToNodeIds", summary.groupToNodeIds);
    setCommunityState("sourceSignature", baseSignature);
    setCommunityState("lastComputeKey", filter.communityComputeKey);
    setCommunityState("computedMode", filter.communityMode);
    setCommunityState("computedResolution", filter.communityResolution);
    setCommunityState("isStale", false);
    setCommunityState("selectedGroupId", null);
  }, [
    baseGraphData,
    baseSignature,
    filter.communityComputeKey,
    filter.communityMode,
    filter.communityResolution,
    communityState.lastComputeKey,
    setCommunityState,
  ]);

  useEffect(() => {
    if (communityState.lastComputeKey === 0) return;

    let isStale = false;

    if (baseSignature && communityState.sourceSignature && baseSignature !== communityState.sourceSignature) {
      isStale = true;
    }

    if (communityState.computedMode && communityState.computedMode !== filter.communityMode) {
      isStale = true;
    }

    if (
      isCommunityMode(filter.communityMode) &&
      communityState.computedResolution !== null &&
      communityState.computedResolution !== filter.communityResolution
    ) {
      isStale = true;
    }

    if (isStale !== communityState.isStale) {
      setCommunityState("isStale", isStale);
    }
  }, [
    baseSignature,
    filter.communityMode,
    filter.communityResolution,
    communityState.lastComputeKey,
    communityState.sourceSignature,
    communityState.computedMode,
    communityState.computedResolution,
    communityState.isStale,
    setCommunityState,
  ]);

  return null;
}
