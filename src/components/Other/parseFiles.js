import log from "../../logger.js";
import Papa from "papaparse";

export function parseFile(name, content, takeAbs) {
  const fileExtension = name.split(".").pop();

  let graph = null;

  if (fileExtension === "json") {
    graph = JSON.parse(content);
  } else if (fileExtension === "csv") {
    const fileData = parseGraphCSV(content);
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
    log.error("File format not recognized");
    return null;
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

function parseGraphCSV(content) {
  let fileData = Papa.parse(content, {
    header: false,
    delimiter: ",",
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

export function parseColorSchemeCSV(content) {
  let fileData = Papa.parse(content, {
    skipEmptyLines: true,
  });

  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

  let colorData = fileData.data;
  colorData = colorData.reduce((acc, row) => {
    const validColors = row.map((element) => element.toLowerCase()).filter((element) => hexColorRegex.test(element) && element.length !== 0);
    return acc.concat(validColors);
  }, []);

  return colorData;
}

export async function readGraphFile(file, takeAbs) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await readFileAsText(file);
    const graph = parseFile(file.name, fileContent, takeAbs);

    if (!graph) {
      throw new Error("Error parsing file");
    }

    return { name: file.name, content: JSON.stringify(graph) };
  } catch (error) {
    log.error(error.message);
    throw new Error(`Unable to process file: ${error.message}`);
  }
}

export async function readColorScheme(file) {
  if (!file) {
    throw new Error(`No file found with the name ${file}.`);
  }

  try {
    const fileContent = await readFileAsText(file);
    const colorScheme = parseColorSchemeCSV(fileContent);

    if (!colorScheme) {
      throw new Error("Error parsing file");
    }

    return colorScheme;
  } catch (error) {
    log.error(error.message);
    throw new Error(`Unable to process file: ${error.message}`);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}
