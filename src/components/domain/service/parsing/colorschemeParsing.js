import log from "../../../adapters/logging/logger.js";
import Papa from "papaparse";
import { getFileAsText } from "./fileParsing.js";
import { verifyColorscheme } from "../verification/colorschemeVerification.js";

export async function parseColorschemeFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileExtension = file.name.split(".").pop();
    if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);
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
  const fileData = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    delimiter: "",
    transformHeader: function (header) {
      return header.trim().toLowerCase();
    },
  });

  const fields = fileData.meta?.fields ?? [];
  if (fields.length !== 1 || fields[0] !== "hex") {
    throw new Error("Color scheme file must contain exactly one column named 'hex'.");
  }

  return fileData.data.map((row, index) => {
    const hex = row?.hex;
    if (hex === null || hex === undefined || String(hex).trim().length === 0) {
      throw new Error(`Missing hex color value at row ${index + 2}.`);
    }
    return String(hex).trim().toLowerCase();
  });
}
