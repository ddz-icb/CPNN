import log from "../../logging/logger.js";

export const handleSliderChange = (event, setValue, setValueText, min = 0, max = Infinity) => {
  const stringValue = event.target.value;
  const value = Number(stringValue);

  if (!isNaN(value) && value >= min && value <= max) {
    setValue(value);
    setValueText(stringValue);
  }
};

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function getNumericControlValue(value, fallbackValue) {
  if (value === "" || value === null || value === undefined) return fallbackValue;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallbackValue;
}

function getNiceNumber(value, fallbackStep) {
  if (!Number.isFinite(value) || value <= 0) return fallbackStep;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function roundSliderNumber(value) {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}

function roundDown(value, step) {
  return roundSliderNumber(Math.floor(value / step) * step);
}

function roundUp(value, step) {
  return roundSliderNumber(Math.ceil(value / step) * step);
}

export function getSliderBoundsForDataRange({ dataMin, dataMax, fallbackMax, minLimit = 0, fallbackStep = 0.05, steps = 100 }) {
  const safeFallbackMax = isFiniteNumber(fallbackMax) ? fallbackMax : minLimit;
  const safeFallbackStep = isFiniteNumber(fallbackStep) && fallbackStep > 0 ? fallbackStep : 0.05;
  const safeSteps = isFiniteNumber(steps) && steps > 0 ? steps : 100;
  const rangeMin = isFiniteNumber(dataMin) ? Math.max(minLimit, dataMin) : minLimit;
  const rangeMax = isFiniteNumber(dataMax) ? Math.max(rangeMin, dataMax) : Math.max(rangeMin, safeFallbackMax);
  const range = rangeMax - rangeMin;
  const reference = range > 0 ? range / safeSteps : Math.max(Math.abs(rangeMin), Math.abs(rangeMax), safeFallbackMax, 1) / safeSteps;
  const step = roundSliderNumber(getNiceNumber(reference, safeFallbackStep));
  const min = Math.max(minLimit, roundDown(rangeMin, step));
  const max = roundSliderNumber(Math.max(min + step, roundUp(rangeMax, step)));

  return { min, max, step };
}

export const handleFieldChange = (event, setValueText, min = 0, max = Infinity) => {
  const stringValue = event.target.value;

  if (stringValue === "") {
    setValueText("");
  } else {
    const value = Number(stringValue);
    if (!isNaN(value) && value >= min && value <= max) {
      setValueText(stringValue);
    }
  }
};

export const handleFieldBlur = (event, setValue, setValueText, min = 0, max = Infinity, fallbackValue) => {
  const stringValue = event.target.value;

  if (stringValue === "") {
    setValue(fallbackValue);
    setValueText(String(fallbackValue));
  } else {
    const value = Number(stringValue);
    if (!isNaN(value) && value >= min && value <= max) {
      setValue(value);
      setValueText(stringValue);
    }
  }
};

export const handleEditorChange = (editor, setValueText) => {
  setValueText(editor.getValue());
};

export const runCodeEditor = (valueText, setValue, setValueText, parse, setCompilerError) => {
  try {
    const parsedValue = parse(valueText);
    setCompilerError(null);
    setValueText(valueText);
    setValue(parsedValue);
  } catch (error) {
    setCompilerError(error.message);
    log.warn("Invalid input:", error);
  }
};
