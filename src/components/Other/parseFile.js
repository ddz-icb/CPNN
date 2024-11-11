import log from "../../logger";
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
