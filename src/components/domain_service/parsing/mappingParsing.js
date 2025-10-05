import log from "../../adapters/logging/logger.js";
import Papa from "papaparse";
import { getFileAsText, getFileNameWithoutExtension } from "./fileParsing.js";
import { verifyMapping } from "../verification/mappingVerification.js";

export async function parseMappingFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileExtension = file.name.split(".").pop();
    if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);
    const fileContent = await getFileAsText(file);
    const mappingData = parseMapping(fileContent);
    const mapping = { name: getFileNameWithoutExtension(file.name), data: mappingData };
    verifyMapping(mapping);
    return mapping;
  } catch (error) {
    log.error(error.message);
    throw new Error(`${error.message}`);
  }
}

export function parseMapping(content) {
  let fileData = Papa.parse(content, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "",
    transform: function (value, field) {
      if (field !== "UniProt-ID") {
        return value.split(";").map((item) => item.trim());
      }
      return value;
    },
  });

  const nodeMapping = {};

  for (let row of fileData.data) {
    const uniProtId = row["UniProt-ID"];
    const pathwayNames = row["Pathway Name"];

    nodeMapping[uniProtId] = {
      pathwayNames: pathwayNames,
    };
  }

  return nodeMapping;
}
