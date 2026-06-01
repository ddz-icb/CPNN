import { create } from "zustand";

export const nodeSearchValueInit = "";
export const nodeQueryInit = "";
export const linkSearchValueInit = "";
export const linkQueryInit = "";
export const highlightedNodeIdsInit = [];
export const matchingNodesInit = [];
export const matchingLinksInit = [];
export const matchingNodeAttributesInit = [];
export const matchingLinkAttributesInit = [];

export const searchStateInit = {
  nodeSearchValue: nodeSearchValueInit,
  nodeQuery: nodeQueryInit,
  linkSearchValue: linkSearchValueInit,
  linkQuery: linkQueryInit,
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
      searchState: normalizeSearchState(value),
    })),
}));

function normalizeSearchState(value) {
  const { searchValue: legacySearchValue = "", query: legacyQuery = "", ...state } = value ?? {};

  return {
    ...searchStateInit,
    ...state,
    nodeSearchValue: state.nodeSearchValue ?? legacySearchValue,
    nodeQuery: state.nodeQuery ?? legacyQuery,
    linkSearchValue: state.linkSearchValue ?? legacySearchValue,
    linkQuery: state.linkQuery ?? legacyQuery,
  };
}
