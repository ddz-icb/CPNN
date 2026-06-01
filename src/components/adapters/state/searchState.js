import { create } from "zustand";

export const searchValueInit = "";
export const queryInit = "";
export const highlightedNodeIdsInit = [];
export const matchingNodesInit = [];
export const matchingLinksInit = [];
export const matchingNodeAttributesInit = [];
export const matchingLinkAttributesInit = [];

export const searchStateInit = {
  searchValue: searchValueInit,
  query: queryInit,
  highlightedNodeIds: highlightedNodeIdsInit,
  matchingNodes: matchingNodesInit,
  matchingLinks: matchingLinksInit,
  matchingNodeAttributes: matchingNodeAttributesInit,
  matchingLinkAttributes: matchingLinkAttributesInit,
  selectedNodeId: null,
  selectedLinkId: null,
  selectedNodeAttribute: null,
  selectedLinkAttribute: null,
};

export const useSearchState = create((set) => ({
  searchState: searchStateInit,
  setSearchState: (key, value) =>
    set((state) => ({
      searchState: { ...state.searchState, [key]: value },
    })),
  setAllSearchState: (value) =>
    set(() => ({
      searchState: value,
    })),
}));
