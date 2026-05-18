import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { useFilter } from "../../adapters/state/filterState.js";
import { useGraphMetrics } from "../../adapters/state/graphMetricsState.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { darkTheme, lightTheme, useTheme } from "../../adapters/state/themeState.js";
import {
  getLinkAttribsToColorIndices,
  getLinkWeightMinMax,
  getNodeAttribsToColorIndices,
} from "../../domain/service/graph_calculations/graphUtils.js";
import {
  deserializeGraphSettingValue,
  graphSettingKeys,
  graphSettingsSchema,
  serializeGraphSettingValue,
} from "../../domain/service/graph_settings/graphSettingsSchema.js";

const themesByName = {
  [lightTheme.name]: lightTheme,
  [darkTheme.name]: darkTheme,
};

function getStateInit(sectionKey) {
  const sectionConfig = graphSettingsSchema[sectionKey];
  return sectionConfig.stateInit ?? sectionConfig.init;
}

const appearanceInit = getStateInit("appearance");
const colorschemeStateInit = getStateInit("colorscheme");
const filterInit = getStateInit("filter");
const physicsInit = getStateInit("physics");

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
      .map((key) => [key, deserializeGraphSettingValue(savedSettings[key])]),
  );
}

function mergeKnownSettings(baseSettings, savedSettings, initSettings, options) {
  return {
    ...baseSettings,
    ...pickKnownSettings(savedSettings, initSettings, options),
  };
}

function buildKnownSettingsExport(settings, initSettings, options) {
  const knownSettings = pickKnownSettings(settings, initSettings, options);
  return Object.fromEntries(Object.entries(knownSettings).map(([key, value]) => [key, serializeGraphSettingValue(value)]));
}

export function buildAppearanceSettingsExport(appearance, theme) {
  return buildGraphSettingsExport({ appearance: { ...appearance, themeName: theme?.name } }).appearance ?? {};
}

export function buildColorschemeSettingsExport(colorschemeState) {
  return buildGraphSettingsExport({ colorschemeState }).colorscheme ?? {};
}

function getSettingsSource(sources, sectionKey, sectionConfig) {
  return sources?.[sectionConfig.sourceKey ?? sectionKey];
}

export function buildGraphSettingsExport(sources = {}) {
  const exportedSettings = {};

  for (const sectionKey of graphSettingKeys) {
    const sectionConfig = graphSettingsSchema[sectionKey];
    const sourceSettings = getSettingsSource(sources, sectionKey, sectionConfig);
    const sectionSettings = {
      ...buildKnownSettingsExport(sourceSettings, sectionConfig.init, { omittedKeys: sectionConfig.exportOmittedKeys }),
    };

    if (Object.keys(sectionSettings).length > 0) {
      exportedSettings[sectionKey] = sectionSettings;
    }
  }

  return exportedSettings;
}

export function buildCurrentGraphSettingsExport() {
  return buildGraphSettingsExport({
    physics: usePhysics.getState().physics,
    filter: useFilter.getState().filter,
    appearance: {
      ...useAppearance.getState().appearance,
      themeName: useTheme.getState().theme?.name,
    },
    colorschemeState: useColorschemeState.getState().colorschemeState,
  });
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
      omittedKeys: graphSettingsSchema.colorscheme.importOmittedKeys,
      skipNull: graphSettingsSchema.colorscheme.skipNullImport,
    }),
  );
}

function applyGraphAppearanceSettings(savedAppearance) {
  if (!isObject(savedAppearance)) return;

  const { appearance, setAllAppearance } = useAppearance.getState();
  const nextAppearance = mergeKnownSettings(appearance, savedAppearance, appearanceInit, {
    omittedKeys: graphSettingsSchema.appearance.importOmittedKeys,
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

const graphSettingsAppliers = {
  filter: (graphData, { graphMetrics }) => applyGraphFilterSettings(graphData.filter, graphMetrics),
  colorscheme: (graphData) => applyGraphColorschemeSettings(graphData),
  appearance: (graphData) => applyGraphAppearanceSettings(graphData.appearance),
  physics: (graphData) => applyGraphPhysicsSettings(graphData.physics),
};

export function applyGraphSettings(graph) {
  if (!graph?.data) return;

  const graphMetrics = applyGraphMetrics(graph.data);

  for (const sectionKey of graphSettingKeys) {
    graphSettingsAppliers[sectionKey]?.(graph.data, { graphMetrics });
  }
}
