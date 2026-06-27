import log from "../../../adapters/logging/logger.js";
import Papa from "papaparse";
import { formatDelimitedParseError, getFatalDelimitedParseError, getFileAsText } from "./fileParsing.js";
import { verifyColorscheme } from "../verification/colorschemeVerification.js";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export async function parseColorschemeFile(file) {
  if (!file) {
    throw new Error("No color scheme file was provided.");
  }

  try {
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error("Wrong file extension. Only .csv and .tsv are allowed.");
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

  const fatalParseError = getFatalDelimitedParseError(fileData.errors);
  if (fatalParseError) {
    throw new Error(formatDelimitedParseError(fatalParseError));
  }

  const fields = fileData.meta?.fields ?? [];
  if (fields.length !== 1 || fields[0] !== "hex") {
    const foundHeaders = fields.length ? fields.map((field) => `'${field}'`).join(", ") : "no headers";
    throw new Error(`Color scheme file must contain exactly one column named 'hex'. Found ${foundHeaders}.`);
  }

  if (!fileData.data?.length) {
    throw new Error("Color scheme file must contain at least one hex color row.");
  }

  return fileData.data.map((row, index) => {
    const rowNumber = index + 2;
    const hex = row?.hex;
    if (hex === null || hex === undefined || String(hex).trim().length === 0) {
      throw new Error(`Missing hex color value at row ${rowNumber}.`);
    }
    const normalizedHex = String(hex).trim().toLowerCase();
    if (!HEX_COLOR_REGEX.test(normalizedHex)) {
      throw new Error(`Invalid hex color value at row ${rowNumber}: '${hex}'. Expected a 6-digit HEX value like #56b4e9.`);
    }
    return normalizedHex;
  });
}
