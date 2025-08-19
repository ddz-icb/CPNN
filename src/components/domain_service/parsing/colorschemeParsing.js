import log from "../../adapters/logging/logger.js";
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
