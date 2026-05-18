import { appearanceInit, useAppearance } from "../../adapters/state/appearanceState.js";
import { colorschemeStateInit, useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { filterInit, useFilter } from "../../adapters/state/filterState.js";
import { useGraphMetrics } from "../../adapters/state/graphMetricsState.js";
import { physicsInit, usePhysics } from "../../adapters/state/physicsState.js";
import { darkTheme, lightTheme, useTheme } from "../../adapters/state/themeState.js";
import {
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
} from "../../domain/service/graph_calculations/graphUtils.js";

const appearanceExportOmittedKeys = new Set(["cameraRef"]);
const colorschemeExportOmittedKeys = new Set(["uploadedColorschemeNames"]);
const themesByName = {
  [lightTheme.name]: lightTheme,
  [darkTheme.name]: darkTheme,
};

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function pickKnownSettings(savedSettings, initSettings, { omittedKeys = new Set(), skipNull = false } = {}) {
  if (!isObject(savedSettings)) return {};

  return Object.fromEntries(
    Object.keys(initSettings)
      .filter((key) => !omittedKeys.has(key))
      .filter((key) => Object.hasOwn(savedSettings, key))
      .filter((key) => savedSettings[key] !== undefined)
      .filter((key) => !(skipNull && savedSettings[key] === null))
      .map((key) => [key, savedSettings[key]]),
  );
}

function mergeKnownSettings(baseSettings, savedSettings, initSettings, options) {
  return {
    ...baseSettings,
    ...pickKnownSettings(savedSettings, initSettings, options),
  };
}

function toSerializableValue(value) {
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value));
}

function buildKnownSettingsExport(settings, initSettings, options) {
  const knownSettings = pickKnownSettings(settings, initSettings, options);
  return Object.fromEntries(Object.entries(knownSettings).map(([key, value]) => [key, toSerializableValue(value)]));
}

export function buildAppearanceSettingsExport(appearance, theme) {
  return {
    ...buildKnownSettingsExport(appearance, appearanceInit, { omittedKeys: appearanceExportOmittedKeys }),
    themeName: theme?.name,
  };
}

export function buildColorschemeSettingsExport(colorschemeState) {
  return buildKnownSettingsExport(colorschemeState, colorschemeStateInit, { omittedKeys: colorschemeExportOmittedKeys });
}

function applyGraphMetrics(graphData) {
  const { setGraphMetrics } = useGraphMetrics.getState();
  const { minWeight, maxWeight, minAbsWeight, maxAbsWeight } = getLinkWeightMinMax(graphData);

  if (minWeight !== Infinity) {
    setGraphMetrics("linkWeightMin", minWeight);
  }
  if (maxWeight !== -Infinity) {
    setGraphMetrics("linkWeightMax", maxWeight);
  }
  if (minAbsWeight !== Infinity) {
    setGraphMetrics("linkWeightAbsMin", minAbsWeight);
  }
  if (maxAbsWeight !== -Infinity) {
    setGraphMetrics("linkWeightAbsMax", maxAbsWeight);
  }

  return { minWeight, maxWeight, minAbsWeight, maxAbsWeight };
}

function getFiniteFilterNumber(value) {
  if (value === "" || value === null || value === undefined) return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function toFilterControlNumber(value) {
  return Number(value.toPrecision(12));
}

function applyGraphFilterSettings(savedFilter, { minAbsWeight, maxAbsWeight }) {
  const { filter, setAllFilter } = useFilter.getState();
  let nextFilter = { ...filter };
  const hasSavedFilter = isObject(savedFilter);

  if (hasSavedFilter) {
    nextFilter = mergeKnownSettings(filterInit, savedFilter, filterInit);
  }

  if (Number.isFinite(minAbsWeight) && Number.isFinite(maxAbsWeight)) {
    const currentMinThreshold = getFiniteFilterNumber(nextFilter.linkThreshold);
    const currentMaxThreshold = getFiniteFilterNumber(nextFilter.maxLinkThreshold);

    if (currentMinThreshold === null || currentMinThreshold < minAbsWeight || currentMinThreshold > maxAbsWeight) {
      const roundedMinWeight = toFilterControlNumber(minAbsWeight);
      nextFilter = {
        ...nextFilter,
        linkThreshold: roundedMinWeight,
        linkThresholdText: roundedMinWeight,
      };
    }

    if (currentMaxThreshold === null || currentMaxThreshold < minAbsWeight || currentMaxThreshold > maxAbsWeight) {
      const roundedMaxWeight = toFilterControlNumber(maxAbsWeight);
      nextFilter = {
        ...nextFilter,
        maxLinkThreshold: roundedMaxWeight,
        maxLinkThresholdText: roundedMaxWeight,
      };
    }

    const nextMinThreshold = getFiniteFilterNumber(nextFilter.linkThreshold);
    const nextMaxThreshold = getFiniteFilterNumber(nextFilter.maxLinkThreshold);
    if (nextMinThreshold !== null && nextMaxThreshold !== null && nextMaxThreshold < nextMinThreshold) {
      nextFilter = {
        ...nextFilter,
        maxLinkThreshold: nextMinThreshold,
        maxLinkThresholdText: nextMinThreshold,
      };
    }
  }

  setAllFilter(nextFilter);
}

function applyGraphColorschemeSettings(graphData) {
  const { colorschemeState, setAllColorschemeState } = useColorschemeState.getState();
  const graphColorschemeState = {
    ...colorschemeState,
    nodeAttribsToColorIndices: getNodeAttribsToColorIndices(graphData),
    linkAttribsToColorIndices: getLinkAttribsToColorIndices(graphData),
  };

  setAllColorschemeState(
    mergeKnownSettings(graphColorschemeState, graphData.colorscheme, colorschemeStateInit, {
      omittedKeys: colorschemeExportOmittedKeys,
      skipNull: true,
    }),
  );
}

function applyGraphAppearanceSettings(savedAppearance) {
  if (!isObject(savedAppearance)) return;

  const { appearance, setAllAppearance } = useAppearance.getState();
  const nextAppearance = mergeKnownSettings(appearance, savedAppearance, appearanceInit, {
    omittedKeys: appearanceExportOmittedKeys,
  });

  setAllAppearance(nextAppearance);

  const savedTheme = themesByName[savedAppearance?.themeName];
  if (savedTheme) {
    useTheme.getState().setTheme(savedTheme);
  }
}

function applyGraphPhysicsSettings(savedPhysics) {
  if (!isObject(savedPhysics)) return;

  usePhysics.getState().setAllPhysics(mergeKnownSettings(physicsInit, savedPhysics, physicsInit));
}

export function applyGraphSettings(graph) {
  if (!graph?.data) return;

  const graphMetrics = applyGraphMetrics(graph.data);
  applyGraphFilterSettings(graph.data.filter, graphMetrics);
  applyGraphColorschemeSettings(graph.data);
  applyGraphAppearanceSettings(graph.data.appearance);
  applyGraphPhysicsSettings(graph.data.physics);
}
