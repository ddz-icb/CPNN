export const handleSliderChange = (event, setValue, setValueText, min = 0, max = 1) => {
  const value = event.target.value;

  if (value >= min && value <= max) {
    setValue(value);
    setValueText(value);
  }
};

export const handleFieldChange = (event, setValueText, min = 0, max = 1) => {
  const value = event.target.value;

  if (value >= min && value <= max) {
    setValueText(value);
  }
};

export const handleFieldBlur = (event, setValue, setValueText, min = 0, max = 1, fallbackValue) => {
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
