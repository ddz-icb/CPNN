import { create } from "zustand";

export const communityResolutionInit = 0;

export const communityStateInit = {
  groups: [],
  idToGroup: null,
  groupToNodeIds: {},
  communityResolution: communityResolutionInit,
  communityResolutionText: communityResolutionInit,
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
