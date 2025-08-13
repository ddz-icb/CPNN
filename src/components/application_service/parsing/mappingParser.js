import log from "../../../logger.js";
import Papa from "papaparse";
import { parseFileAsText } from "../../other/fileFunctions.js";

export async function parseMappingFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  const fileExtension = file.name.split(".").pop();
  if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);

  try {
    const fileContent = await parseFileAsText(file);
    const mapping = parseMapping(fileContent, file.name);
    verifyMapping(mapping);
    return { name: file.name, data: JSON.stringify(mapping) };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

export function parseMapping(content, filename) {
  try {
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
    const groupMapping = {};

    for (let row of fileData.data) {
      const uniProtId = row["UniProt-ID"];
      const pathwayNames = row["Pathway Name"];
      const reactomeIds = row["Reactome-ID"] || [];

      nodeMapping[uniProtId] = {
        pathwayNames: pathwayNames,
        reactomeIds: reactomeIds,
      };

      for (let i = 0; i < pathwayNames.length; i++) {
        if (!groupMapping[pathwayNames[i]]) {
          groupMapping[pathwayNames[i]] = {
            name: pathwayNames[i],
            reactomeId: reactomeIds[i],
          };
        }
      }
    }

    return {
      name: filename,
      nodeMapping: nodeMapping,
      groupMapping: groupMapping,
    };
  } catch (error) {
    throw new Error(`Erorr parsing pathway mapping with name ${filename}.`);
  }
}

function verifyMapping(mapping) {
  if (!mapping || typeof mapping !== "object") {
    throw new Error("Error while parsing the mapping file. It does not have the right format.");
  }

  Object.entries(mapping.groupMapping).forEach(([key, node]) => {
    if (!node.hasOwnProperty("name")) {
      throw new Error(`${key} is missing the 'name' property.`);
    }
  });

  Object.entries(mapping.nodeMapping).forEach(([key, node]) => {
    if (!node.hasOwnProperty("pathwayNames")) {
      throw new Error(`${key} is missing the 'Pathway Name' property.`);
    }
  });
}
