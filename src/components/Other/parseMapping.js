import Papa from "papaparse";

export function parseMapping(content) {
  let fileData = Papa.parse(content, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transform: function (value, field) {
      if (field !== "UniProt ID") {
        return value.split(";").map((item) => item.trim());
      }
      return value;
    },
  });

  const nodeMapping = {};
  const groupMapping = {};

  for (let row of fileData.data) {
    const uniProtId = row["UniProt ID"];
    const pathwayNames = row["Pathway Name"];
    const reactomeIds = row["Reactome-ID"];

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

  return [nodeMapping, groupMapping];
}
