export function verifyColorscheme(colorscheme) {
  if (!Array.isArray(colorscheme.data)) {
    throw new Error("The color scheme must be a list.");
  }

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  colorscheme.data.forEach((color, index) => {
    if (typeof color !== "string" || !hexColorRegex.test(color)) {
      throw new Error(`Invalid hex-color at index ${index}: ${color}`);
    }
  });
}
