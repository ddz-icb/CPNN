import { create } from "zustand";

export const activeMappingInit = null;
export const uploadedMappingNamesInit = null;

export const mappingDataInit = {
  activeMapping: null,
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
