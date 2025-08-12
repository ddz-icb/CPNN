import { create } from "zustand";
import { physicsInit } from "../../config/physicsInitValues.js";

export const usePhysics = create((set) => ({
  physics: physicsInit,
  setPhysics: (key, value) =>
    set((state) => ({
      physics: { ...state.physics, [key]: value },
    })),
  setAllPhysics: (value) =>
    set(() => ({
      physics: value,
    })),
}));
