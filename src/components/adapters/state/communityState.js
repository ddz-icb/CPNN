import { create } from "zustand";

export const communityResolutionInit = 1;

export const communityStateInit = {
  communities: [],
  idToCommunity: null,
  communityToNodeIds: {},
  communityResolution: communityResolutionInit,
  communityResolutionText: communityResolutionInit,
  selectedCommunityId: null,
  isViewFocusActive: true,
};

export const useCommunityState = create((set) => ({
  communityState: communityStateInit,
  setCommunityState: (key, value) =>
    set((state) => ({
      communityState: {
        ...state.communityState,
        [key]: value,
        ...(key === "selectedCommunityId" && value != null && value !== state.communityState.selectedCommunityId
          ? { isViewFocusActive: true }
          : {}),
      },
    })),
  setAllCommunityState: (value) =>
    set(() => ({
      communityState: value,
    })),
}));
