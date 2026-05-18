import { appearanceInit } from "../../../adapters/state/appearanceState.js";
import { colorschemeStateInit } from "../../../adapters/state/colorschemeState.js";
import { filterInit } from "../../../adapters/state/filterState.js";
import { physicsInit } from "../../../adapters/state/physicsState.js";

const SERIALIZED_SET_TYPE = "Set";
const appearanceGraphSettingsInit = { ...appearanceInit, themeName: "" };

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNumericString(value) {
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value));
}

function isSerializedSet(value) {
  return isObject(value) && value.__graphSettingType === SERIALIZED_SET_TYPE && Array.isArray(value.values);
}

function isValidSettingValue(value, defaultValue, key) {
  if (value === undefined) return false;
  if (key.endsWith("Text")) return typeof value === "string" || isFiniteNumber(value);

  if (typeof defaultValue === "number") return isFiniteNumber(value) || isNumericString(value);
  if (typeof defaultValue === "boolean") return typeof value === "boolean" || Array.isArray(value);
  if (typeof defaultValue === "string") return typeof value === "string" || isFiniteNumber(value);
  if (Array.isArray(defaultValue)) return Array.isArray(value);
  if (defaultValue === null) return value === null || isObject(value);
  if (isObject(defaultValue)) return isObject(value);

  return typeof value === typeof defaultValue;
}

function getExpectedSettingType(defaultValue, key) {
  if (key.endsWith("Text")) return "string or finite number";
  if (typeof defaultValue === "number") return "finite number or numeric string";
  if (typeof defaultValue === "boolean") return "boolean or parsed filter array";
  if (typeof defaultValue === "string") return "string or finite number";
  if (Array.isArray(defaultValue)) return "array";
  if (defaultValue === null) return "null or object";
  if (isObject(defaultValue)) return "object";
  return typeof defaultValue;
}

function serializeGraphSettingValue(value) {
  if (value instanceof Set) {
    return {
      __graphSettingType: SERIALIZED_SET_TYPE,
      values: Array.from(value).map(serializeGraphSettingValue),
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeGraphSettingValue);
  }

  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, serializeGraphSettingValue(entryValue)]));
  }

  return value;
}

function deserializeGraphSettingValue(value) {
  if (value instanceof Set) {
    return new Set(Array.from(value).map(deserializeGraphSettingValue));
  }

  if (isSerializedSet(value)) {
    return new Set(value.values.map(deserializeGraphSettingValue));
  }

  if (Array.isArray(value)) {
    return value.map(deserializeGraphSettingValue);
  }

  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, deserializeGraphSettingValue(entryValue)]));
  }

  return value;
}

function validateGraphSettingsSection(sectionKey, sectionValue, initSettings) {
  if (!isObject(sectionValue)) {
    throw new Error(`The '${sectionKey}' graph settings must be an object.`);
  }

  for (const [key, value] of Object.entries(sectionValue)) {
    if (!Object.hasOwn(initSettings, key)) continue;

    const defaultValue = initSettings[key];
    if (!isValidSettingValue(value, defaultValue, key)) {
      throw new Error(
        `Invalid type for ${sectionKey}.${key}: expected ${getExpectedSettingType(defaultValue, key)}, got ${
          Array.isArray(value) ? "array" : typeof value
        }.`,
      );
    }
  }
}

export const graphSettingsSchema = {
  physics: {
    init: physicsInit,
  },
  filter: {
    init: filterInit,
  },
  appearance: {
    init: appearanceGraphSettingsInit,
    stateInit: appearanceInit,
    exportOmittedKeys: new Set(["cameraRef"]),
    importOmittedKeys: new Set(["cameraRef", "themeName"]),
  },
  colorscheme: {
    init: colorschemeStateInit,
    sourceKey: "colorschemeState",
    exportOmittedKeys: new Set(["uploadedColorschemeNames"]),
    importOmittedKeys: new Set(["uploadedColorschemeNames"]),
    skipNullImport: true,
  },
};

export const graphSettingKeys = Object.keys(graphSettingsSchema);
export { deserializeGraphSettingValue, serializeGraphSettingValue };

export function verifyGraphSettings(graphData) {
  for (const sectionKey of graphSettingKeys) {
    if (!Object.hasOwn(graphData, sectionKey) || graphData[sectionKey] === undefined) continue;
    validateGraphSettingsSection(sectionKey, graphData[sectionKey], graphSettingsSchema[sectionKey].init);
  }
}
