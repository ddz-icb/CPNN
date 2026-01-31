import { create } from "zustand";

export const linkThresholdInit = 0.7;
export const minCompSizeInit = 2;
export const maxCompSizeInit = ""; // typically int but can be empty if no maxSize
export const nodeFilterInit = true;
export const linkFilterInit = true;
export const linkFilterTextInit = "";
export const nodeFilterTextInit = "";
export const nodeIdFiltersInit = [];
export const nodeIdFilterTextInit = "";
export const minKCoreSizeInit = 0;
export const compDensityInit = 0;
export const lassoInit = false;
export const lassoSelectionInit = [];
export const communityModeInit = "communities";
export const communityResolutionInit = 1;
export const communityHiddenIdsInit = [];
export const communityComputeKeyInit = 0;

export const filterInit = {
  linkThreshold: linkThresholdInit,
  linkThresholdText: linkThresholdInit,
  linkFilter: linkFilterInit,
  linkFilterText: linkFilterTextInit,
  nodeFilter: nodeFilterInit,
  nodeFilterText: nodeFilterTextInit,
  nodeIdFilters: nodeIdFiltersInit,
  nodeIdFilterText: nodeIdFilterTextInit,
  minCompSize: minCompSizeInit,
  minCompSizeText: minCompSizeInit,
  maxCompSize: maxCompSizeInit,
  maxCompSizeText: maxCompSizeInit,
  compDensity: compDensityInit,
  compDensityText: compDensityInit,
  minKCoreSize: minKCoreSizeInit,
  minKCoreSizeText: minKCoreSizeInit,
  lasso: lassoInit,
  lassoSelection: lassoSelectionInit,
  communityMode: communityModeInit,
  communityResolution: communityResolutionInit,
  communityResolutionText: communityResolutionInit,
  communityHiddenIds: communityHiddenIdsInit,
  communityComputeKey: communityComputeKeyInit,
};

export const useFilter = create((set) => ({
  filter: filterInit,
  setFilter: (key, value) =>
    set((state) => ({
      filter: { ...state.filter, [key]: value },
    })),
  setAllFilter: (value) =>
    set(() => ({
      filter: value,
    })),
}));
