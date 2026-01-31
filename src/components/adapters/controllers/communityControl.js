import { useEffect, useRef } from "react";

import { useFilter } from "../state/filterState.js";
import { useCommunityState } from "../state/communityState.js";
import { buildGroupSummary, isCommunityMode } from "../../domain/service/graph_calculations/communityGrouping.js";

export function CommunityControl() {
  const { filter, setFilter } = useFilter();
  const { communityState, setCommunityState } = useCommunityState();
  const lastComputeKeyRef = useRef(0);

  const baseGraphData = communityState.baseGraphData;
  const baseSignature = communityState.baseSignature;

  useEffect(() => {
    if (filter.communityComputeKey !== 0) return;
    if (lastComputeKeyRef.current !== 0) {
      lastComputeKeyRef.current = 0;
    }
    if (!baseGraphData || !baseSignature) return;
    setFilter("communityComputeKey", 1);
  }, [baseGraphData, baseSignature, filter.communityComputeKey, setFilter]);

  useEffect(() => {
    if (!baseGraphData || !baseSignature) return;
    if (filter.communityComputeKey === 0) return;
    if (filter.communityComputeKey === lastComputeKeyRef.current) return;

    const summary = buildGroupSummary(baseGraphData, {
      mode: filter.communityMode,
      resolution: filter.communityResolution,
    });

    setCommunityState("groups", summary.groups);
    setCommunityState("idToGroup", summary.idToGroup);
    setCommunityState("groupToNodeIds", summary.groupToNodeIds);
    setCommunityState("sourceSignature", baseSignature);
    setCommunityState("computedResolution", filter.communityResolution);
    setCommunityState("isStale", false);
    setCommunityState("selectedGroupId", null);
    lastComputeKeyRef.current = filter.communityComputeKey;
  }, [
    baseGraphData,
    baseSignature,
    filter.communityComputeKey,
    filter.communityMode,
    filter.communityResolution,
    setCommunityState,
  ]);

  useEffect(() => {
    if (!communityState.sourceSignature) return;

    let isStale = false;

    if (baseSignature && communityState.sourceSignature && baseSignature !== communityState.sourceSignature) {
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
    communityState.sourceSignature,
    communityState.computedResolution,
    communityState.isStale,
    setCommunityState,
  ]);

  return null;
}
