export function verifyMapping(mapping) {
  if (!mapping || typeof mapping !== "object") {
    throw new Error("Error while parsing the mapping file. It does not have the right format.");
  }
  if (!mapping.data || typeof mapping.data !== "object" || Array.isArray(mapping.data)) {
    throw new Error("Mapping file must contain data rows keyed by node ID.");
  }
  if (Object.keys(mapping.data).length === 0) {
    throw new Error("Mapping file must contain at least one data row.");
  }

  Object.entries(mapping.data).forEach(([key, node]) => {
    if (!key || key === "undefined") {
      throw new Error("Mapping file contains a row with an empty node ID.");
    }
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      throw new Error(`Mapping entry '${key}' has an invalid row format.`);
    }
    if (!node.hasOwnProperty("attribs")) {
      throw new Error(`${key} is missing the 'attribs' property.`);
    }
    if (!Array.isArray(node.attribs) || node.attribs.length === 0) {
      throw new Error(`Mapping entry '${key}' must contain at least one attribute.`);
    }
    node.attribs.forEach((attrib, index) => {
      if (attrib === undefined || attrib === null || String(attrib).trim() === "") {
        throw new Error(`Mapping entry '${key}' has an empty attribute at index ${index}.`);
      }
    });
  });
}
