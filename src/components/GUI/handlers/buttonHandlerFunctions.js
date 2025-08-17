import log from "../../../logger.js";

export const handleSliderChange = (event, setValue, setValueText, min = 0, max = Infinity) => {
  const value = event.target.value;

  if (value >= min && value <= max) {
    setValue(value);
    setValueText(value);
  }
};

export const handleFieldChange = (event, setValueText, min = 0, max = Infinity) => {
  const value = event.target.value;

  if (value == "") {
    setValueText("");
  } else if (value >= min && value <= max) {
    setValueText(value);
  }
};

export const handleFieldBlur = (event, setValue, setValueText, min = 0, max = Infinity, fallbackValue) => {
  let value = event.target.value;

  if (value === "") {
    setValue(fallbackValue);
    setValueText(fallbackValue);
  } else if (value >= min && value <= max) {
    event.target.innerText = value;
    setValue(value);
    setValueText(value);
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
    setCompilerError(error);
    log.error("Invalid input:", error);
  }
};
