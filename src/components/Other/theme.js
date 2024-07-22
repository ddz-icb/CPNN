export function applyTheme(document, theme) {
  document.body.className = theme;

  const rootStyles = getComputedStyle(document.body);
  const circleBorderColor = rootStyles
    .getPropertyValue("--circle-border-color")
    .trim();
  return circleBorderColor;
}
