import log from "../../adapters/logging/logger.js";
import Papa from "papaparse";
import { getFileAsText } from "./fileParsing.js";

export async function parseColorschemeFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  const fileExtension = file.name.split(".").pop();
  if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);

  try {
    const fileContent = await getFileAsText(file);
    const colorschemeData = parseColorscheme(fileContent);
    const colorscheme = { name: file.name, data: colorschemeData };
    verifyColorscheme(colorscheme);
    return colorscheme;
  } catch (error) {
    log.error(error.message);
    throw new Error(`${error.message}`);
  }
}

export function parseColorscheme(content) {
  let fileData = Papa.parse(content, {
    skipEmptyLines: true,
  });

  let colorschemeData = fileData.data;
  colorschemeData = colorschemeData.reduce((acc, row) => {
    const validColors = row.map((element) => element.toLowerCase())?.filter((element) => element.length !== 0);
    return acc.concat(validColors);
  }, []);

  return colorschemeData;
}

function verifyColorscheme(colorscheme) {
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
