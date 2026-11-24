import { create } from "zustand";

export const communityResolutionInit = 1;

export const communityStateInit = {
  communities: [],
  idToCommunity: null,
  communityToNodeIds: {},
  communityResolution: communityResolutionInit,
  communityResolutionText: communityResolutionInit,
  selectedCommunityId: null,
  isCommunityDetailsOpen: false,
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
          ? { isViewFocusActive: true, isCommunityDetailsOpen: true }
          : key === "selectedCommunityId" && value == null
            ? { isCommunityDetailsOpen: false }
            : {}),
      },
    })),
  setAllCommunityState: (value) =>
    set(() => ({
      communityState: { ...communityStateInit, ...value },
    })),
}));
