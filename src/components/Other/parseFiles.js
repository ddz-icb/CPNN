import log from "../../logger.js";
import Papa from "papaparse";

export function parseGraph(name, content, takeAbs) {
  const fileExtension = name.split(".").pop();

  let graph = null;

  if (fileExtension === "json") {
    graph = JSON.parse(content);
  } else if (fileExtension === "csv" || fileExtension === "tsv") {
    const fileData = parseGraphCSVorTSV(content);

    if (!fileData) return null;

    const linkAttribMatch = name.match(/dataset(\w+)/);
    const linkAttrib = linkAttribMatch ? linkAttribMatch[1] : name.substring(0, 5);

    graph = { nodes: [], links: [] };

    for (let i = 0; i < fileData.header.length; i++) {
      graph.nodes.push({
        id: fileData.header[i],
        groups: [],
      });
    }

    for (let i = 1; i < fileData.header.length; i++) {
      for (let j = 0; j < i; j++) {
        graph.links.push({
          source: fileData.header[i],
          target: fileData.header[j],
          weights: [fileData.data[i][j]],
          attribs: [linkAttrib] || [],
        });
      }
    }
  } else {
    throw new Error(`File format not recognized`);
  }

  if (takeAbs) {
    graph.links.forEach((link) => {
      link.weights = link.weights.map((weight) => Math.abs(parseFloat(weight)));
    });
  } else {
    graph.links.forEach((link) => {
      link.weights = link.weights.map((weight) => (weight < 0 ? 0 : weight));
    });
  }

  return graph;
}

function parseGraphCSVorTSV(content) {
  let fileData = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "",
  });

  if (!fileData.data || fileData.data.length === 0) return null;

  let updatedData = fileData.data.map((row) => {
    let newRow = Object.assign({}, row);
    delete newRow[Object.keys(newRow)[0]];
    return Object.values(newRow);
  });

  return {
    header: updatedData[0],
    data: updatedData.slice(1),
  };
}

export function parseColorScheme(content) {
  let fileData = Papa.parse(content, {
    skipEmptyLines: true,
  });

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

  let colorData = fileData.data;
  colorData = colorData.reduce((acc, row) => {
    const validColors = row.map((element) => element.toLowerCase())?.filter((element) => hexColorRegex.test(element) && element.length !== 0);
    return acc.concat(validColors);
  }, []);

  return colorData;
}

export async function parseGraphFile(file, takeAbs) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await parseFileAsText(file);
    const graph = parseGraph(file.name, fileContent, takeAbs);

    return { name: file.name, content: JSON.stringify(graph) };
  } catch (error) {
    throw new Error(`Unable to process file. ${error.message}`);
  }
}

export async function parseColorSchemeFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  const fileExtension = file.name.split(".").pop();
  if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);

  try {
    const fileContent = await parseFileAsText(file);
    const colorScheme = parseColorScheme(fileContent);

    if (!colorScheme) {
      throw new Error("Error parsing file");
    }

    return colorScheme;
  } catch (error) {
    log.error(error.message);
    throw new Error(`Unable to process file. ${error.message}`);
  }
}

function parseFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}

export async function parseAnnotationMappingFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  const fileExtension = file.name.split(".").pop();
  if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);

  try {
    const fileContent = await parseFileAsText(file);
    return parseAnnotationMapping(fileContent, file.name);
  } catch (error) {
    throw new Error(`Unable to process file. ${error.message}`);
  }
}

export async function parseAnnotationMapping(content, filename) {
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

    return {
      name: filename,
      content: JSON.stringify({
        name: filename,
        nodeMapping: nodeMapping,
        groupMapping: groupMapping,
      }),
    };
  } catch (error) {
    throw new Error(`Erorr parsing annotation mapping with name ${filename}.`);
  }
}

export const getFileNameWithoutExtension = (filename) => filename.replace(/\.[^/.]+$/, "");
