export function verifyColorscheme(colorscheme) {
  if (!Array.isArray(colorscheme.data)) {
    throw new Error("The color scheme must be a list.");
  }
  if (colorscheme.data.length === 0) {
    throw new Error("Color scheme file must contain at least one hex color row.");
  }

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  colorscheme.data.forEach((color, index) => {
    if (typeof color !== "string" || !hexColorRegex.test(color)) {
      throw new Error(`Invalid hex color at row ${index + 2}: ${color}. Expected a 6-digit HEX value like #56b4e9.`);
    }
  });
}
