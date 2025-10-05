export function verifyMapping(mapping) {
  if (!mapping || typeof mapping !== "object") {
    throw new Error("Error while parsing the mapping file. It does not have the right format.");
  }

  Object.entries(mapping.data).forEach(([key, node]) => {
    if (!node.hasOwnProperty("pathwayNames")) {
      throw new Error(`${key} is missing the 'Pathway Name' property.`);
    }
  });
}
