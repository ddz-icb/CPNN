import log from "../../adapters/logging/logger.js";

export const handleSliderChange = (event, setValue, setValueText, min = 0, max = Infinity) => {
  const stringValue = event.target.value;
  const value = Number(stringValue);

  if (!isNaN(value) && value >= min && value <= max) {
    setValue(value);
    setValueText(stringValue);
  }
};

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
