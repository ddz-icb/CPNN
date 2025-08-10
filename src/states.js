import { create } from "zustand";

import { appearanceInit } from "./components/config/appearanceInitValues.js";
import { downloadInit } from "./components/config/downloadInitValues.js";
import { physicsInit } from "./components/config/physicsInitValues.js";
import { filterInit } from "./components/config/filterInitValues.js";
import { graphDataInit } from "./components/config/graphDataInitValues.js";
import { tooltipInit } from "./components/config/tooltipInitValues.js";
import { containerInit } from "./components/config/containerInitValues.js";

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

export const useAppearance = create((set) => ({
  appearance: appearanceInit,
  setAppearance: (key, value) =>
    set((state) => ({
      appearance: { ...state.appearance, [key]: value },
    })),
  setAllAppearance: (value) =>
    set(() => ({
      appearance: value,
    })),
}));

export const useDownload = create((set) => ({
  download: downloadInit,
  setDownload: (key, value) =>
    set((state) => ({
      download: { ...state.download, [key]: value },
    })),
  setAllDownload: (value) =>
    set(() => ({
      download: value,
    })),
}));

export const useContainer = create((set) => ({
  container: containerInit,
  setContainer: (key, value) =>
    set((state) => ({
      container: { ...state.container, [key]: value },
    })),
  setAllContainer: (value) =>
    set(() => ({
      container: value,
    })),
}));

export const useTooltipSettings = create((set) => ({
  tooltipSettings: tooltipInit,
  setTooltipSettings: (key, value) =>
    set((state) => ({
      tooltipSettings: { ...state.tooltipSettings, [key]: value },
    })),
  setAllTooltipSettings: (value) =>
    set(() => ({
      tooltipSettings: value,
    })),
}));

export const useGraphData = create((set) => ({
  graphData: graphDataInit,
  setGraphData: (key, value) =>
    set((state) => {
      if (typeof value === "function") {
        return { graphData: value(state.graphData) };
      }
      return { graphData: { ...state.graphData, [key]: value } };
    }),
  setAllGraphData: (value) =>
    set(() => ({
      graphData: value,
    })),
}));
