import { create } from "zustand";

export const minLinkThresholdInit = 0.7;
export const maxLinkThresholdInit = "";
export const maxLinkThresholdTextInit = "";
export const nodeFilterInit = true;
export const linkFilterInit = true;
export const linkFilterTextInit = "";
export const nodeFilterTextInit = "";
export const nodeIdFiltersInit = [];
export const nodeIdFilterTextInit = "";
export const minKCoreSizeInit = 0;
export const communityDensityInit = 0;
export const minCommunitySizeInit = 0;
export const minCommunitySizeTextInit = 0;
export const maxCommunitySizeInit = "";
export const maxCommunitySizeTextInit = "";
export const componentDensityInit = 0;
export const maxComponentDensityInit = "";
export const maxComponentDensityTextInit = "";
export const minCompSizeInit = 2;
export const minCompSizeTextInit = 2;
export const maxCompSizeInit = "";
export const maxCompSizeTextInit = "";
export const lassoInit = false;
export const lassoSelectionInit = [];
export const communityHiddenIdsInit = [];

export const filterInit = {
  minLinkThreshold: minLinkThresholdInit,
  minLinkThresholdText: minLinkThresholdInit,
  maxLinkThreshold: maxLinkThresholdInit,
  maxLinkThresholdText: maxLinkThresholdTextInit,
  linkFilter: linkFilterInit,
  linkFilterText: linkFilterTextInit,
  nodeFilter: nodeFilterInit,
  nodeFilterText: nodeFilterTextInit,
  nodeIdFilters: nodeIdFiltersInit,
  nodeIdFilterText: nodeIdFilterTextInit,
  communityDensity: communityDensityInit,
  communityDensityText: communityDensityInit,
  minCommunitySize: minCommunitySizeInit,
  minCommunitySizeText: minCommunitySizeTextInit,
  maxCommunitySize: maxCommunitySizeInit,
  maxCommunitySizeText: maxCommunitySizeTextInit,
  componentDensity: componentDensityInit,
  componentDensityText: componentDensityInit,
  maxComponentDensity: maxComponentDensityInit,
  maxComponentDensityText: maxComponentDensityTextInit,
  minCompSize: minCompSizeInit,
  minCompSizeText: minCompSizeTextInit,
  maxCompSize: maxCompSizeInit,
  maxCompSizeText: maxCompSizeTextInit,
  minKCoreSize: minKCoreSizeInit,
  minKCoreSizeText: minKCoreSizeInit,
  lasso: lassoInit,
  lassoSelection: lassoSelectionInit,
  communityHiddenIds: communityHiddenIdsInit,
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
