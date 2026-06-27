import { useAppearance } from "../../adapters/state/appearanceState.js";
import { useColorschemeState } from "../../adapters/state/colorschemeState.js";
import { useFilter } from "../../adapters/state/filterState.js";
import { useGraphMetrics } from "../../adapters/state/graphMetricsState.js";
import { usePhysics } from "../../adapters/state/physicsState.js";
import { darkTheme, lightTheme, useTheme } from "../../adapters/state/themeState.js";
import { getLinkWeightMinMax } from "../../domain/service/graph_calculations/graphUtils.js";
import {
  deserializeGraphSettingValue,
  graphSettingKeys,
  graphSettingsSchema,
  serializeGraphSettingValue,
} from "../../domain/service/graph_settings/graphSettingsSchema.js";
import {
  getLinkThresholdBounds,
  roundUpLinkThreshold,
} from "../../domain/service/graph_settings/linkThresholdRange.js";
import { reconcileAttribColorMappingsForGraph } from "./colorschemeService.js";

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

function isTextSettingKey(key) {
  return key.endsWith("Text");
}

function isScalarTextMirrorValue(value) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
}

function settingsEqual(left, right) {
  if (left === right) return true;
  if (left instanceof Set || right instanceof Set) {
    if (!(left instanceof Set) || !(right instanceof Set) || left.size !== right.size) return false;
    return Array.from(left).every((value) => right.has(value));
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => settingsEqual(value, right[index]));
  }
  if (isObject(left) || isObject(right)) {
    if (!isObject(left) || !isObject(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => Object.hasOwn(right, key) && settingsEqual(left[key], right[key]));
  }
  return false;
}

function pickKnownSettings(
  savedSettings,
  initSettings,
  { omittedKeys = new Set(), skipNull = false, omitTextKeys = false, omitDefaults = false } = {},
) {
  if (!isObject(savedSettings)) return {};

  const entries = [];
  for (const key of Object.keys(initSettings)) {
    if (omittedKeys.has(key)) continue;
    if (omitTextKeys && isTextSettingKey(key)) continue;
    if (!Object.hasOwn(savedSettings, key)) continue;
    if (savedSettings[key] === undefined) continue;
    if (skipNull && savedSettings[key] === null) continue;

    const value = deserializeGraphSettingValue(savedSettings[key]);
    if (omitDefaults && settingsEqual(value, initSettings[key])) continue;

    entries.push([key, value]);
  }

  return Object.fromEntries(entries);
}

function mergeKnownSettings(baseSettings, savedSettings, initSettings, options) {
  const mergedSettings = {
    ...baseSettings,
    ...pickKnownSettings(savedSettings, initSettings, options),
  };
  return options?.deriveMissingTextKeys ? deriveMissingTextSettings(mergedSettings, initSettings, savedSettings) : mergedSettings;
}

function deriveMissingTextSettings(settings, initSettings, savedSettings) {
  const nextSettings = { ...settings };
  const savedSettingsObject = isObject(savedSettings) ? savedSettings : {};

  Object.keys(initSettings).forEach((key) => {
    if (!isTextSettingKey(key) || Object.hasOwn(savedSettingsObject, key)) return;

    const valueKey = key.slice(0, -"Text".length);
    if (!Object.hasOwn(nextSettings, valueKey)) return;
    if (!isScalarTextMirrorValue(nextSettings[valueKey])) return;

    nextSettings[key] = nextSettings[valueKey];
  });

  return nextSettings;
}

function buildKnownSettingsExport(settings, initSettings, options) {
  const knownSettings = pickKnownSettings(settings, initSettings, { ...options, omitTextKeys: true, omitDefaults: true });
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

function getSettingsDefaults(sources, sectionKey, sectionConfig) {
  const sourceKey = sectionConfig.sourceKey ?? sectionKey;
  const defaultOverrides = sources?.[`${sourceKey}Defaults`] ?? sources?.[`${sectionKey}Defaults`];
  return isObject(defaultOverrides) ? { ...sectionConfig.init, ...defaultOverrides } : sectionConfig.init;
}

function getFilterDefaultsForGraphMetrics(graphMetrics) {
  const { linkWeightAbsMin, linkWeightAbsMax } = graphMetrics ?? {};
  if (!Number.isFinite(linkWeightAbsMin) || !Number.isFinite(linkWeightAbsMax)) return filterInit;

  const thresholdBounds = getLinkThresholdBounds(linkWeightAbsMax, filterInit.linkThreshold);
  const initialMinThreshold =
    linkWeightAbsMin > filterInit.linkThreshold
      ? roundUpLinkThreshold(linkWeightAbsMin, thresholdBounds)
      : filterInit.linkThreshold;

  return {
    ...filterInit,
    linkThreshold: initialMinThreshold,
    linkThresholdText: initialMinThreshold,
    maxLinkThreshold: thresholdBounds.max,
    maxLinkThresholdText: thresholdBounds.max,
  };
}

export function buildGraphSettingsExport(sources = {}) {
  const exportedSettings = {};

  for (const sectionKey of graphSettingKeys) {
    const sectionConfig = graphSettingsSchema[sectionKey];
    const sourceSettings = getSettingsSource(sources, sectionKey, sectionConfig);
    const defaultSettings = getSettingsDefaults(sources, sectionKey, sectionConfig);
    const sectionSettings = {
      ...buildKnownSettingsExport(sourceSettings, defaultSettings, { omittedKeys: sectionConfig.exportOmittedKeys }),
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
    filterDefaults: getFilterDefaultsForGraphMetrics(useGraphMetrics.getState().graphMetrics),
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

function applyGraphFilterSettings(savedFilter, { minAbsWeight, maxAbsWeight }) {
  const { filter, setAllFilter } = useFilter.getState();
  let nextFilter = { ...filter };
  const hasSavedFilter = isObject(savedFilter);

  if (hasSavedFilter) {
    nextFilter = mergeKnownSettings(filterInit, savedFilter, filterInit, { deriveMissingTextKeys: true });
  }

  if (Number.isFinite(minAbsWeight) && Number.isFinite(maxAbsWeight)) {
    const thresholdBounds = getLinkThresholdBounds(maxAbsWeight, filterInit.linkThreshold);
    const initialMinThreshold =
      minAbsWeight > filterInit.linkThreshold
        ? roundUpLinkThreshold(minAbsWeight, thresholdBounds)
        : filterInit.linkThreshold;
    const currentMinThreshold = getFiniteFilterNumber(nextFilter.linkThreshold);
    const currentMaxThreshold = getFiniteFilterNumber(nextFilter.maxLinkThreshold);

    if (
      currentMinThreshold === null ||
      currentMinThreshold < thresholdBounds.min ||
      currentMinThreshold > thresholdBounds.max ||
      (!hasSavedFilter && currentMinThreshold < minAbsWeight)
    ) {
      nextFilter = {
        ...nextFilter,
        linkThreshold: initialMinThreshold,
        linkThresholdText: initialMinThreshold,
      };
    }

    if (
      (!hasSavedFilter && currentMaxThreshold === null) ||
      currentMaxThreshold < thresholdBounds.min ||
      currentMaxThreshold > thresholdBounds.max ||
      (!hasSavedFilter && currentMaxThreshold < minAbsWeight)
    ) {
      nextFilter = {
        ...nextFilter,
        maxLinkThreshold: thresholdBounds.max,
        maxLinkThresholdText: thresholdBounds.max,
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
  const graphColorschemeState = mergeKnownSettings(colorschemeState, graphData.colorscheme, colorschemeStateInit, {
    omittedKeys: graphSettingsSchema.colorscheme.importOmittedKeys,
    skipNull: graphSettingsSchema.colorscheme.skipNullImport,
  });

  setAllColorschemeState(reconcileAttribColorMappingsForGraph(graphData, graphColorschemeState));
}

function applyGraphAppearanceSettings(savedAppearance) {
  if (!isObject(savedAppearance)) return;

  const { appearance, setAllAppearance } = useAppearance.getState();
  const nextAppearance = mergeKnownSettings(appearance, savedAppearance, appearanceInit, {
    omittedKeys: graphSettingsSchema.appearance.importOmittedKeys,
    deriveMissingTextKeys: true,
  });

  setAllAppearance(nextAppearance);

  const savedTheme = themesByName[savedAppearance?.themeName];
  if (savedTheme) {
    useTheme.getState().setTheme(savedTheme);
  }
}

function applyGraphPhysicsSettings(savedPhysics) {
  if (!isObject(savedPhysics)) return;

  usePhysics.getState().setAllPhysics(mergeKnownSettings(physicsInit, savedPhysics, physicsInit, { deriveMissingTextKeys: true }));
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
