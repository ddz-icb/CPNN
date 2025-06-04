import log from "../../logger.js";
import Papa from "papaparse";
import * as math from "mathjs";
import { filterByThreshold, filterMinCompSize, filterNodesExist } from "../GraphStuff/graphCalculations.js";
import { expectedPhysicTypes } from "../../states.js";

export async function parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, takeSpearmanCoefficient) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await parseFileAsText(file);
    const graph = parseGraph(file.name, fileContent, takeAbs, minCorrForEdge, minCompSizeForNode, takeSpearmanCoefficient);
    verifyGraph(graph);

    return { name: file.name, content: JSON.stringify(graph) };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

export function parseGraph(name, content, takeAbs, minCorrForEdge, minCompSizeForNode, takeSpearmanCoefficient) {
  const fileExtension = name.split(".").pop();

  let graph = null;

  if (fileExtension === "json") {
    graph = JSON.parse(content);
  } else if (fileExtension === "csv" || fileExtension === "tsv") {
    var fileData = parseGraphCSVorTSV(content);

    fileData.header = fileData.header.map((value) => (typeof value === "string" ? value : String(value)));

    if (!fileData) return null;

    // if data is raw, convert to matrix
    if (!isSymmMatrix(content)) {
      log.info("Converting data into symmetrical matrix. Used correlation coefficient:", takeSpearmanCoefficient ? "Spearman" : "Pearson");
      fileData = { header: fileData.firstColumn, data: convertToCorrMatrix(fileData.data, takeSpearmanCoefficient) };
    }

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

  graph.links = graph.links
    .map((link) => {
      const filteredWeights = link.weights.filter((weight) => weight !== 0);
      const filteredAttribs = link.attribs.filter((_, index) => link.weights[index] !== 0);

      return {
        ...link,
        weights: filteredWeights,
        attribs: filteredAttribs,
      };
    })
    .filter((link) => link.weights.length > 0);

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

  let firstColumn = fileData.data.map((row) => row[0]);

  let updatedData = fileData.data.map((row) => row.slice(1));

  return {
    header: updatedData[0],
    data: updatedData.slice(1),
    firstColumn: firstColumn.slice(1),
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

function isSymmMatrix(content) {
  let fileData = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: "",
  });

  const firstColumn = fileData.data.map((row) => row[0]);
  const firstRow = fileData.data[0];

  if (firstColumn.length !== firstRow.length) return false;
  for (let i = 0; i < firstColumn.length; i++) {
    if (firstColumn[i] !== firstRow[i]) return false;
  }
  return true;
}

const rankData = (arr) => {
  if (arr.length === 0) return;

  const indexedArr = arr.map((value, index) => ({ value, originalIndex: index }));

  indexedArr.sort((a, b) => a.value - b.value);

  const ranks = new Array(arr.length);
  let currentRank = 1;

  for (let i = 0; i < indexedArr.length; ) {
    let j = i;
    while (j < indexedArr.length && indexedArr[j].value === indexedArr[i].value) {
      j++;
    }

    const count = j - i;
    const sumOfRanks = ((currentRank + (currentRank + count - 1)) * count) / 2;
    const averageRank = sumOfRanks / count;

    for (let k = i; k < j; k++) {
      ranks[indexedArr[k].originalIndex] = averageRank;
    }

    currentRank += count;
    i = j;
  }
  return ranks;
};

function convertToCorrMatrix(fileData, takeSpearmanCoefficient) {
  if (!Array.isArray(fileData) || fileData.length === 0 || !Array.isArray(fileData) || fileData.length === 0) {
    log.error("Input fileData must be a non-empty array of arrays.");
    return;
  }

  const numFeatures = fileData.length;
  const correlationMatrix = math.zeros(numFeatures, numFeatures).toArray();

  for (let i = 0; i < numFeatures; i++) {
    for (let j = i; j < numFeatures; j++) {
      let series1 = fileData[i];
      let series2 = fileData[j];

      const filteredPairs = series1
        .map((val, idx) => ({ x: val, y: series2[idx] }))
        .filter((pair) => typeof pair.x === "number" && !isNaN(pair.x) && typeof pair.y === "number" && !isNaN(pair.y));

      if (filteredPairs.length < 2) {
        correlationMatrix[i][j] = 0;
        correlationMatrix[j][i] = 0;
        continue;
      }

      let cleanSeries1 = filteredPairs.map((pair) => pair.x);
      let cleanSeries2 = filteredPairs.map((pair) => pair.y);

      if (takeSpearmanCoefficient) {
        cleanSeries1 = rankData(cleanSeries1);
        cleanSeries2 = rankData(cleanSeries2);
      }

      let correlationValue;
      try {
        correlationValue = math.corr(cleanSeries1, cleanSeries2);
      } catch (e) {
        correlationValue = 0;
      }

      const roundedCorrelation = math.round(correlationValue, 2);

      correlationMatrix[i][j] = roundedCorrelation;
      correlationMatrix[j][i] = roundedCorrelation;
    }
  }

  return correlationMatrix;
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
