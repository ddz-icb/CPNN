import { expectedPhysicTypes } from "../../../adapters/state/physicsState.js";

function normalizeNodeIdEntry(entry, fullNodeId) {
  const parts = entry.split("_").map((part) => part.trim());

  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid node id '${fullNodeId}'. Expected 'ID_Name' (optional: '_Site1,Site2').`);
  }

  const [idPart, namePart, sitePart] = parts;
  if (!idPart || !namePart) {
    throw new Error(`Invalid node id '${fullNodeId}'. ID and name must not be empty.`);
  }

  if (parts.length === 2) {
    return `${idPart}_${namePart}`;
  }

  if (!sitePart) {
    throw new Error(`Invalid node id '${fullNodeId}'. Site information must not be empty.`);
  }

  const sites = sitePart.split(",").map((site) => site.trim());
  if (sites.some((site) => !site)) {
    throw new Error(`Invalid node id '${fullNodeId}'. Site list contains empty entries.`);
  }

  return `${idPart}_${namePart}_${sites.join(", ")}`;
}

function normalizeNodeId(nodeId) {
  if (typeof nodeId !== "string") {
    throw new Error("Node ids must be strings.");
  }

  const nodeIdText = nodeId.trim();
  if (!nodeIdText) {
    throw new Error("Node ids must not be empty.");
  }

  const rawEntries = nodeIdText
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (rawEntries.length === 0) {
    throw new Error(`Invalid node id '${nodeId}'.`);
  }

  const normalizedEntries = rawEntries.map((entry) => normalizeNodeIdEntry(entry, nodeIdText));
  return normalizedEntries.join("; ");
}

function getEndpointId(endpoint) {
  if (endpoint == null) return null;
  if (typeof endpoint === "object") {
    if (endpoint.id != null) return endpoint.id;
    if (endpoint.data?.id != null) return endpoint.data.id;
  }
  return endpoint;
}

function getNormalizedEndpointId(endpoint, fieldName, linkIndex) {
  const endpointId = getEndpointId(endpoint);
  if (endpointId === null || endpointId === undefined) {
    throw new Error(`Link at index ${linkIndex} has an invalid '${fieldName}' value.`);
  }
  return normalizeNodeId(String(endpointId));
}

export function verifyGraph(graph) {
  if (!graph || typeof graph !== "object") {
    throw new Error("Error while parsing the graph file. It does not have the right format.");
  }

  if (!graph.data || typeof graph.data !== "object") {
    throw new Error("Error while parsing the graph file. It does not have the right format.");
  }

  const { nodes, links } = graph.data;
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    throw new Error("Graph file must contain 'nodes' and 'links' arrays.");
  }

  const normalizedNodeIds = new Set();
  nodes.forEach((node, i) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      throw new Error(`Node at index ${i} has an invalid format.`);
    }
    if (node.id === undefined || node.id === null) {
      throw new Error(`Node at index ${i} is missing the 'id' property.`);
    }
    const normalizedNodeId = normalizeNodeId(node.id);
    if (normalizedNodeIds.has(normalizedNodeId.toLowerCase())) {
      throw new Error(`Duplicate node id '${normalizedNodeId}' detected.`);
    }
    normalizedNodeIds.add(normalizedNodeId.toLowerCase());

    if (node.attribs === undefined || node.attribs === null) {
      throw new Error(`Node at index ${i} is missing the 'attribs' property.`);
    }
    if (!Array.isArray(node.attribs)) {
      throw new Error(`Node '${normalizedNodeId}' has an invalid 'attribs' property. Expected an array.`);
    }
    node.attribs.forEach((attrib, attribIndex) => {
      if (attrib === undefined || attrib === null || String(attrib).trim() === "") {
        throw new Error(`Node '${normalizedNodeId}' has an empty attribute at index ${attribIndex}.`);
      }
    });
  });

  const normalizedLinkPairs = new Set();
  links.forEach((link, i) => {
    if (!link || typeof link !== "object" || Array.isArray(link)) {
      throw new Error(`Link at index ${i} has an invalid format.`);
    }
    if (link.source === undefined || link.source === null) {
      throw new Error(`Link at index ${i} is missing the 'source' property.`);
    }
    if (link.target === undefined || link.target === null) {
      throw new Error(`Link at index ${i} is missing the 'target' property.`);
    }
    if (link.weights === undefined || link.weights === null) {
      throw new Error(`Link at index ${i} is missing the 'weights' property.`);
    }
    if (link.attribs === undefined || link.attribs === null) {
      throw new Error(`Link at index ${i} is missing the 'attribs' property.`);
    }

    const sourceId = getNormalizedEndpointId(link.source, "source", i);
    const targetId = getNormalizedEndpointId(link.target, "target", i);

    if (!normalizedNodeIds.has(sourceId.toLowerCase())) {
      throw new Error(`Link at index ${i} references unknown source node '${sourceId}'.`);
    }
    if (!normalizedNodeIds.has(targetId.toLowerCase())) {
      throw new Error(`Link at index ${i} references unknown target node '${targetId}'.`);
    }
    if (sourceId === targetId) {
      throw new Error(`Link at index ${i} is a self-link ('${sourceId}').`);
    }

    if (!Array.isArray(link.weights) || link.weights.length === 0) {
      throw new Error(`Link '${sourceId}' -> '${targetId}' has an invalid 'weights' property. Expected a non-empty array.`);
    }
    if (!Array.isArray(link.attribs) || link.attribs.length === 0) {
      throw new Error(`Link '${sourceId}' -> '${targetId}' has an invalid 'attribs' property. Expected a non-empty array.`);
    }
    if (link.weights.length !== link.attribs.length) {
      throw new Error(`Link '${sourceId}' -> '${targetId}' has mismatching 'weights' and 'attribs' lengths.`);
    }

    link.weights.forEach((weight, weightIndex) => {
      if (typeof weight !== "number" || !Number.isFinite(weight)) {
        throw new Error(`Link '${sourceId}' -> '${targetId}' has an invalid weight at index ${weightIndex}.`);
      }
    });

    link.attribs.forEach((attrib, attribIndex) => {
      if (attrib === undefined || attrib === null || String(attrib).trim() === "") {
        throw new Error(`Link '${sourceId}' -> '${targetId}' has an empty attribute at index ${attribIndex}.`);
      }
    });

    const linkPairKey = sourceId < targetId ? `${sourceId}---${targetId}` : `${targetId}---${sourceId}`;
    if (normalizedLinkPairs.has(linkPairKey.toLowerCase())) {
      throw new Error(`Duplicate link between '${sourceId}' and '${targetId}'. Merge attributes into a single link.`);
    }
    normalizedLinkPairs.add(linkPairKey.toLowerCase());
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
    if (!Array.isArray(data[i]) || data[i].length !== header.length) return false;

    for (let j = i + 1; j < data.length; j++) {
      const a = Number(data[i][j]);
      const b = Number(data[j][i]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      if (Math.abs(a - b) > tol) return false;
    }

    const diagonal = Number(data[i][i]);
    if (!Number.isFinite(diagonal)) return false;
    if (Math.abs(diagonal - 1) > 1e-3) return false;
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
