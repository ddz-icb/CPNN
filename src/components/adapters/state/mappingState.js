import { create } from "zustand";

export const mappingInit = null;
export const uploadedMappingNamesInit = null;

export const mappingDataInit = {
  mapping: null,
  uploadedMappingNames: null,
};

export const useMappingState = create((set) => ({
  mappingState: mappingDataInit,
  setMappingState: (key, value) =>
    set((state) => ({
      mappingState: { ...state.mappingState, [key]: value },
    })),
  setAllMappingState: (value) =>
    set(() => ({
      mappingState: value,
    })),
}));
