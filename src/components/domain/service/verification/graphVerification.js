import { expectedPhysicTypes } from "../../../adapters/state/physicsState.js";

export function verifyGraph(graph) {
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

export function isCorrMatrix(fileData, tol = 1e-4) {
  const { header, firstColumn, data } = fileData;

  if (!header?.length || header.length !== data.length) return false;

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      if (Math.abs(data[i][j] - data[j][i]) > tol) return false;
    }
    if (Math.abs(data[i][i] - 1) > 1e-3) return false;
  }

  let mismatches = 0;
  header.forEach((val, i) => {
    if (val !== firstColumn[i]) mismatches++;
  });

  if (mismatches / header.length > 0.1) return false;

  return true;
}

export function isTableData(fileData) {
  const { header, data, firstColumn } = fileData;
  if (firstColumn.length < 1) return false;

  const columnCount = header.length;
  if (columnCount < 1 || !data.every((r) => r.length === columnCount)) {
    return false;
  }

  if (!header.every((col) => typeof col === "string" && col.trim() !== "")) {
    return false;
  }

  if (!firstColumn.every((rowName) => typeof rowName === "string" && rowName.trim() !== "")) {
    return false;
  }

  return true;
}
