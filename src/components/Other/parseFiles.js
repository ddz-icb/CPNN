import log from "../../logger.js";
import Papa from "papaparse";
import { filterByThreshold, filterMinCompSize, filterNodesExist } from "../GraphStuff/graphCalculations.js";
import { expectedPhysicTypes } from "../../states.js";

export async function parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await parseFileAsText(file);
    const graph = parseGraph(file.name, fileContent, takeAbs, minCorrForEdge, minCompSizeForNode);
    verifyGraph(graph);

    return { name: file.name, content: JSON.stringify(graph) };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

export function parseGraph(name, content, takeAbs, minCorrForEdge, minCompSizeForNode) {
  const fileExtension = name.split(".").pop();

  let graph = null;

  if (fileExtension === "json") {
    graph = JSON.parse(content);
  } else if (fileExtension === "csv" || fileExtension === "tsv") {
    const fileData = parseGraphCSVorTSV(content);

    if (!fileData) return null;

    const linkAttribMatch = name.match(/dataset(\w+)/);
    const linkAttrib = linkAttribMatch ? linkAttribMatch[1] : name;

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
          attribs: [linkAttrib],
        });
      }
    }
  } else {
    throw new Error(`File format not recognized`);
  }

  graph = filterByThreshold(graph, minCorrForEdge);
  graph = filterMinCompSize(graph, minCompSizeForNode);
  graph = filterNodesExist(graph);

  if (takeAbs) {
    graph.links.forEach((link) => {
      link.weights = link.weights.map((weight) => Math.abs(parseFloat(weight)));
    });
  } else {
    graph.links.forEach((link) => {
      link.weights = link.weights.map((weight) => (weight < 0 ? 0 : weight));
    });
  }

  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graph.links.sort((a, b) => {
    const sourceComparison = a.source.localeCompare(b.source);
    if (sourceComparison !== 0) return sourceComparison;
    return a.target.localeCompare(b.target);
  });

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

function verifyGraph(graph) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Error while parsing the graph file. It does not have the right format.");
  }

  const { nodes, links } = graph;
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    throw new Error("Graph file must contain 'nodes' and 'links' arrays.");
  }

  nodes.forEach((node, i) => {
    if (node.id === undefined) {
      throw new Error(`Node at index ${i} is missing the 'id' property.`);
    }
    if (node.groups === undefined) {
      throw new Error(`Node at index ${i} is missing the 'groups' property.`);
    }
  });

  links.forEach((link, i) => {
    if (link.source === undefined) {
      throw new Error(`Link at index ${i} is missing the 'source' property.`);
    }
    if (link.target === undefined) {
      throw new Error(`Link at index ${i} is missing the 'target' property.`);
    }
    if (link.weights === undefined) {
      throw new Error(`Link at index ${i} is missing the 'weights' property.`);
    }
    if (link.attribs === undefined) {
      throw new Error(`Link at index ${i} is missing the 'attribs' property.`);
    }
  });

  if (graph.physics !== undefined) {
    if (typeof graph.physics !== "object" || Array.isArray(graph.physics)) {
      throw new Error("The 'physics' property must be an object.");
    }
    const expectedTypes = expectedPhysicTypes;

    for (const key in graph.physics) {
      if (expectedTypes.hasOwnProperty(key)) {
        if (typeof graph.physics[key] !== expectedTypes[key]) {
          throw new Error(`Invalid type for physics.${key}: expected ${expectedTypes[key]}, got ${typeof graph.physics[key]}.`);
        }
      }
    }
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
    verifyColorScheme(colorScheme);

    return colorScheme;
  } catch (error) {
    log.error(error.message);
    throw new Error(`${error.message}`);
  }
}

export function parseColorScheme(content) {
  let fileData = Papa.parse(content, {
    skipEmptyLines: true,
  });

  let colorData = fileData.data;
  colorData = colorData.reduce((acc, row) => {
    const validColors = row.map((element) => element.toLowerCase())?.filter((element) => element.length !== 0);
    return acc.concat(validColors);
  }, []);

  return colorData;
}

function verifyColorScheme(colorScheme) {
  if (!Array.isArray(colorScheme)) {
    throw new Error("The color scheme must be a list.");
  }

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  colorScheme.forEach((color, index) => {
    if (typeof color !== "string" || !hexColorRegex.test(color)) {
      throw new Error(`Invalid hex-color at index ${index}: ${color}`);
    }
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
    const mapping = parseAnnotationMapping(fileContent, file.name);
    log.info("LALALALLA", mapping);
    verifyAnnotationMapping(mapping);
    return { name: file.name, content: JSON.stringify(mapping) };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

export function parseAnnotationMapping(content, filename) {
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

function verifyAnnotationMapping(mapping) {
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

export const getFileNameWithoutExtension = (filename) => filename.replace(/\.[^/.]+$/, "");

function parseFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}
