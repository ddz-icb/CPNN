import { create } from "zustand";

export const linkThresholdInit = 0.7;
export const nodeFilterInit = true;
export const linkFilterInit = true;
export const linkFilterTextInit = "";
export const nodeFilterTextInit = "";
export const nodeIdFiltersInit = [];
export const nodeIdFilterTextInit = "";
export const minKCoreSizeInit = 0;
export const communityDensityInit = 0;
export const componentDensityInit = 0;
export const minCompSizeInit = 2;
export const minCompSizeTextInit = 2;
export const maxCompSizeInit = "";
export const maxCompSizeTextInit = "";
export const lassoInit = false;
export const lassoSelectionInit = [];

export const filterInit = {
  linkThreshold: linkThresholdInit,
  linkThresholdText: linkThresholdInit,
  linkFilter: linkFilterInit,
  linkFilterText: linkFilterTextInit,
  nodeFilter: nodeFilterInit,
  nodeFilterText: nodeFilterTextInit,
  nodeIdFilters: nodeIdFiltersInit,
  nodeIdFilterText: nodeIdFilterTextInit,
  communityDensity: communityDensityInit,
  communityDensityText: communityDensityInit,
  componentDensity: componentDensityInit,
  componentDensityText: componentDensityInit,
  minCompSize: minCompSizeInit,
  minCompSizeText: minCompSizeTextInit,
  maxCompSize: maxCompSizeInit,
  maxCompSizeText: maxCompSizeTextInit,
  minKCoreSize: minKCoreSizeInit,
  minKCoreSizeText: minKCoreSizeInit,
  lasso: lassoInit,
  lassoSelection: lassoSelectionInit,
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
