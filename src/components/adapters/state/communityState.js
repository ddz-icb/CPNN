import { create } from "zustand";

export const communityStateInit = {
  groups: [],
  idToGroup: null,
  groupToNodeIds: {},
  baseGraphData: null,
  baseSignature: null,
  sourceSignature: null,
  computedResolution: null,
  isStale: false,
  isGroupFiltered: false,
  selectedGroupId: null,
};

export const useCommunityState = create((set) => ({
  communityState: communityStateInit,
  setCommunityState: (key, value) =>
    set((state) => ({
      communityState: { ...state.communityState, [key]: value },
    })),
  setAllCommunityState: (value) =>
    set(() => ({
      communityState: value,
    })),
}));
