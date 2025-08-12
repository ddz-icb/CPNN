import log from "../../logger.js";
import Papa from "papaparse";
import axios from "axios";
import {
  filterByThreshold,
  filterMaxCompSize,
  filterMinCompSize,
  filterNodesExist,
  mergeSameProteins,
} from "../application_service/graphCalculations.js";
import { expectedPhysicTypes } from "../adapters/state/physicsState.js";

export async function parseGraphFile(
  file,
  takeAbs,
  minCorrForEdge,
  minCompSizeForNode,
  maxCompSizeForNode,
  takeSpearmanCoefficient,
  mergeSameProtein
) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await parseFileAsText(file);
    const graph = await parseGraph(
      file.name,
      fileContent,
      takeAbs,
      minCorrForEdge,
      minCompSizeForNode,
      maxCompSizeForNode,
      takeSpearmanCoefficient,
      mergeSameProtein
    );
    verifyGraph(graph);

    return { name: file.name, content: JSON.stringify(graph) };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

async function parseGraph(name, content, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeSameProtein) {
  const fileExtension = name.split(".").pop();

  let graph = null;

  if (fileExtension === "json") {
    graph = JSON.parse(content);
  } else if (fileExtension === "csv" || fileExtension === "tsv") {
    var fileData = parseGraphCSVorTSV(content);
    if (!fileData || !fileData.header) return null;

    fileData.header = fileData.header.map((value) => (typeof value === "string" ? value : String(value)));

    // if data is raw, convert to matrix
    if (!isSymmMatrix(content)) {
      if (!isValidRawTableData(content)) return null;
      log.info("Converting data into symmetrical matrix. Used correlation coefficient:", takeSpearmanCoefficient ? "Spearman" : "Pearson");

      // add fileData.firstColumn as the first column of fileData.data; up until this point fileData.data is only numbers
      fileData.data = fileData.data.map((row, index) => {
        return [fileData.firstColumn[index], ...row];
      });

      const corrMatrix = await convertToCorrMatrix(fileData.data, takeSpearmanCoefficient);

      fileData = { header: corrMatrix.index, data: corrMatrix.data };
    }

    const linkAttrib = name.split(".")[0];

    graph = { nodes: [], links: [] };

    for (let i = 0; i < fileData.header.length; i++) {
      graph.nodes.push({
        id: fileData.header[i],
        groups: [],
      });
    }

    for (let i = 0; i < fileData.header.length; i++) {
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
  graph = filterMaxCompSize(graph, maxCompSizeForNode);
  graph = filterNodesExist(graph);

  if (takeAbs) {
    graph.links.forEach((link) => {
      link.weights = link.weights.map((weight) => Math.abs(parseFloat(weight)));
    });
  } else {
    graph.links.forEach((link) => {
      link.weights = link.weights.filter((weight) => weight > 0);
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

  if (mergeSameProtein) {
    graph = mergeSameProteins(graph);
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

function isValidRawTableData(content) {
  const fileData = Papa.parse(content, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const rows = fileData.data;

  if (rows.length < 2) return false;

  const columnCount = rows[0].length;
  if (columnCount < 2) return false;

  if (!rows.every((row) => row.length === columnCount)) {
    log.error("row length varies");
    return false;
  }

  const [headerRow, ...dataRows] = rows;

  if (typeof headerRow[0] !== "string" || headerRow[0].trim() === "") {
    return false;
  }

  for (let i = 1; i < headerRow.length; i++) {
    if (typeof headerRow[i] !== "string" || headerRow[i].trim() === "") {
      log.error("incorrect header row");
      return false;
    }
  }

  for (const row of dataRows) {
    const [rowName, ...values] = row;
    if (typeof rowName !== "string" || rowName.trim() === "") {
      log.error("incorrect first column");
      return false;
    }
  }

  return true;
}

async function convertToCorrMatrix(data, takeSpearmanCoefficient) {
  const method = takeSpearmanCoefficient ? "spearman" : "pearson";

  try {
    const formData = new FormData();

    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: "application/json" });

    formData.append("file", blob);
    formData.append("method", method);

    const response = await axios.post("http://localhost:3001/correlationMatrix", formData, {
      // const response = await axios.post("https://cpnn.ddz.de/api/correlationMatrix", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const corrMatrix = response.data;

    return corrMatrix;
  } catch (error) {
    console.error("Error fetching correlation matrix:", error.message);
    throw error;
  }
}

export async function parseColorschemeFile(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  const fileExtension = file.name.split(".").pop();
  if (fileExtension !== "csv" && fileExtension !== "tsv") throw new Error(`Wrong file extension. Only .csv and .tsv is allowed.`);

  try {
    const fileContent = await parseFileAsText(file);
    const colorscheme = parseColorscheme(fileContent, file.name);
    verifyColorscheme(colorscheme);

    return { name: file.name, content: JSON.stringify(colorscheme) };
  } catch (error) {
    log.error(error.message);
    throw new Error(`${error.message}`);
  }
}

export function parseColorscheme(content, filename) {
  let fileData = Papa.parse(content, {
    skipEmptyLines: true,
  });

  let colorData = fileData.data;
  colorData = colorData.reduce((acc, row) => {
    const validColors = row.map((element) => element.toLowerCase())?.filter((element) => element.length !== 0);
    return acc.concat(validColors);
  }, []);

  return {
    name: filename,
    content: colorData,
  };
}

function verifyColorscheme(colorscheme) {
  if (!Array.isArray(colorscheme.content)) {
    throw new Error("The color scheme must be a list.");
  }

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  colorscheme.content.forEach((color, index) => {
    if (typeof color !== "string" || !hexColorRegex.test(color)) {
      throw new Error(`Invalid hex-color at index ${index}: ${color}`);
    }
  });
}

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
    return { name: file.name, content: JSON.stringify(mapping) };
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

export const getFileNameWithoutExtension = (filename) => filename.replace(/\.[^/.]+$/, "");

function parseFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}
