import { create } from "zustand";

export const searchValueInit = ""
export const queryInit = ""
export const highlightedNodeIdsInit = []

export const searchStateInit = {
  value: "",
  query: "",
  highlightedNodeIds: [],
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
