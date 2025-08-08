export const handleSliderChange = (event, valuePath, valueTextPath, min = 0, max = 1, setSettings) => {
  const value = event.target.value;

  if (value >= min && value <= max) {
    setSettings(valueTextPath, value);
    setSettings(valuePath, value);
  }
};

export const handleFieldChange = (event, valueTextPath, min = 0, max = 1) => {
  const value = event.target.value;

  if (value >= min && value <= max) {
    setSettings(valueTextPath, value);
  }
};

export const handleFieldBlur = (event, valuePath, valueTextPath, min = 0, max = 1) => {
  let value = event.target.value;

  if (value === "") {
    event.target.innerText = min;
    setSettings(valueTextPath, min);
    setSettings(valuePath, min);
  } else if (value >= min && value <= max) {
    event.target.innerText = value;
    setSettings(valueTextPath, value);
    setSettings(valuePath, value);
  }
};
