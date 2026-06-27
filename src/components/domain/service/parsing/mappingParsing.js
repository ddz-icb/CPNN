import log from "../../../adapters/logging/logger.js";
import Papa from "papaparse";
import { formatDelimitedParseError, getFatalDelimitedParseError, getFileAsText, getFileNameWithoutExtension } from "./fileParsing.js";
import { verifyMapping } from "../verification/mappingVerification.js";

const REQUIRED_MAPPING_HEADERS = ["id", "attribs"];

export async function parseMappingFile(file) {
  if (!file) {
    throw new Error("No mapping file was provided.");
  }

  try {
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error("Wrong file extension. Only .csv and .tsv are allowed.");
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
  const fileData = Papa.parse(content, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "",
    transformHeader: function (header) {
      return header.trim().toLowerCase();
    },
    transform: function (value, field) {
      if (field === "attribs") {
        if (value === null || value === undefined) return [];
        if (typeof value !== "string") return [value];
        if (value.trim().length === 0) return [];
        return value
          .split(";")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
      return value;
    },
  });

  const fatalParseError = getFatalDelimitedParseError(fileData.errors);
  if (fatalParseError) {
    throw new Error(formatDelimitedParseError(fatalParseError));
  }

  const fields = fileData.meta?.fields ?? [];
  const missingHeaders = REQUIRED_MAPPING_HEADERS.filter((header) => !fields.includes(header));
  if (missingHeaders.length > 0) {
    const foundHeaders = fields.length ? fields.map((field) => `'${field}'`).join(", ") : "no headers";
    throw new Error(`Mapping file must contain columns 'id' and 'attribs'. Missing ${missingHeaders.map((header) => `'${header}'`).join(", ")}. Found ${foundHeaders}.`);
  }

  if (!fileData.data?.length) {
    throw new Error("Mapping file must contain at least one data row.");
  }

  const nodeMapping = {};
  const seenIds = new Map();

  fileData.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const id = String(row?.id ?? "").trim();
    const attribs = row?.attribs;

    if (!id) {
      throw new Error(`Mapping row ${rowNumber} is missing a node ID in the 'id' column.`);
    }
    const idKey = id.toLowerCase();
    if (seenIds.has(idKey)) {
      throw new Error(`Duplicate mapping ID '${id}' at row ${rowNumber}. First occurrence is at row ${seenIds.get(idKey)}.`);
    }
    seenIds.set(idKey, rowNumber);
    if (!Array.isArray(attribs) || attribs.length === 0) {
      throw new Error(`Mapping row ${rowNumber} for '${id}' has no attributes. Add one or more semicolon-separated values in the 'attribs' column.`);
    }

    nodeMapping[id] = {
      attribs: attribs,
    };
  });

  return nodeMapping;
}
