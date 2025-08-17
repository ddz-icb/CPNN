import log from "../../adapters/logging/logger.js";
import Papa from "papaparse";
import axios from "axios";
import { expectedPhysicTypes } from "../../adapters/state/physicsState.js";
import { getFileAsText } from "./fileParsing.js";
import { filterByThreshold, filterMaxCompSize, filterMinCompSize, filterNodesExist } from "../graph_calculations/filterGraph.js";

export async function parseGraphFile(file, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeProteins) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await getFileAsText(file);
    const graphData = await parseGraph(
      file.name,
      fileContent,
      takeAbs,
      minCorrForEdge,
      minCompSizeForNode,
      maxCompSizeForNode,
      takeSpearmanCoefficient,
      mergeProteins
    );
    const graph = { name: file.name, data: graphData };
    verifyGraph(graph);
    return graph;
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

async function parseGraph(name, content, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeProteins) {
  const fileExtension = name.split(".").pop();

  let graphData = null;

  if (fileExtension === "json") {
    graphData = JSON.parse(content);
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

    graphData = { nodes: [], links: [] };

    for (let i = 0; i < fileData.header.length; i++) {
      graphData.nodes.push({
        id: fileData.header[i],
        groups: [],
      });
    }

    for (let i = 0; i < fileData.header.length; i++) {
      for (let j = 0; j < i; j++) {
        graphData.links.push({
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

  graphData = filterByThreshold(graphData, minCorrForEdge);
  graphData = filterMinCompSize(graphData, minCompSizeForNode);
  graphData = filterMaxCompSize(graphData, maxCompSizeForNode);
  graphData = filterNodesExist(graphData);

  if (takeAbs) {
    graphData.links.forEach((link) => {
      link.weights = link.weights.map((weight) => Math.abs(parseFloat(weight)));
    });
  } else {
    graphData.links.forEach((link) => {
      link.weights = link.weights.filter((weight) => weight > 0);
    });
  }

  graphData.links = graphData.links
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

  if (mergeProteins) {
    graphData = mergeProteins(graphData);
  }

  graphData.nodes.sort((a, b) => a.id.localeCompare(b.id));
  graphData.links.sort((a, b) => {
    const sourceComparison = a.source.localeCompare(b.source);
    if (sourceComparison !== 0) return sourceComparison;
    return a.target.localeCompare(b.target);
  });

  return graphData;
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
  if (!graph.data || typeof graph.data !== "object") {
    throw new Error("Error while parsing the graph file. It does not have the right format.");
  }

  const { nodes, links } = graph.data;
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

  if (graph.data.physics !== undefined) {
    const physics = graph.data.physics;
    if (typeof physics !== "object" || Array.isArray(physics)) {
      throw new Error("The 'physics' property must be an object.");
    }
    const expectedTypes = expectedPhysicTypes;

    for (const key in physics) {
      if (expectedTypes.hasOwnProperty(key)) {
        if (typeof physics[key] !== expectedTypes[key]) {
          throw new Error(`Invalid type for physics.${key}: expected ${expectedTypes[key]}, got ${typeof physics[key]}.`);
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
