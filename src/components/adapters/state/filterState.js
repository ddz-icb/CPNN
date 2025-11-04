import { create } from "zustand";

export const linkThresholdInit = 0.7;
export const minCompSizeInit = 2;
export const maxCompSizeInit = ""; // typically int but can be empty if no maxSize
export const nodeFilterInit = true;
export const linkFilterInit = true;
export const linkFilterTextInit = "";
export const nodeFilterTextInit = "";
export const minKCoreSizeInit = 0;
export const compDensityInit = 0;
export const lassoInit = false;

export const filterInit = {
  linkThreshold: linkThresholdInit,
  linkThresholdText: linkThresholdInit,
  linkFilter: linkFilterInit,
  linkFilterText: linkFilterTextInit,
  nodeFilter: nodeFilterInit,
  nodeFilterText: nodeFilterTextInit,
  minCompSize: minCompSizeInit,
  minCompSizeText: minCompSizeInit,
  maxCompSize: maxCompSizeInit,
  maxCompSizeText: maxCompSizeInit,
  compDensity: compDensityInit,
  compDensityText: compDensityInit,
  minKCoreSize: minKCoreSizeInit,
  minKCoreSizeText: minKCoreSizeInit,
  lasso: lassoInit,
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
