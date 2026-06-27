import { getEndpointId } from "../graph_calculations/graphUtils.js";
import { verifyGraphSettings } from "../graph_settings/graphSettingsSchema.js";

const PHOSPHOSITE_PATTERN = /^[STY]+\d*$/i;

function formatValueForMessage(value) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function getDataRowNumber(fileData, rowIndex) {
  return fileData?.rowNumbers?.[rowIndex] ?? rowIndex + 2;
}

function getColumnLabel(fileData, columnIndex) {
  const header = fileData?.header?.[columnIndex];
  return header ? `'${header}'` : `column ${columnIndex + 2}`;
}

function normalizeNodeIdEntry(entry, fullNodeId) {
  const parts = entry.split("_").map((part) => part.trim());

  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid node id '${fullNodeId}'. Expected 'ID_Name' (optional: '_Phosphosite1,Phosphosite2').`);
  }

  const [idPart, namePart, phosphositesPart] = parts;
  if (!idPart || !namePart) {
    throw new Error(`Invalid node id '${fullNodeId}'. ID and name must not be empty.`);
  }

  if (parts.length === 2) {
    return `${idPart}_${namePart}`;
  }

  if (!phosphositesPart) {
    throw new Error(`Invalid node id '${fullNodeId}'. Phosphosite information must not be empty.`);
  }

  const phosphosites = phosphositesPart.split(",").map((site) => site.trim());
  if (phosphosites.some((site) => !site)) {
    throw new Error(`Invalid node id '${fullNodeId}'. Phosphosite list contains empty entries.`);
  }

  const invalidSite = phosphosites.find((site) => !PHOSPHOSITE_PATTERN.test(site));
  if (invalidSite) {
    throw new Error(
      `Invalid phosphosite '${invalidSite}' in node id '${fullNodeId}'. Expected residues from S/T/Y, optionally with positions (for example 'S123' or 'TSY').`,
    );
  }

  return `${idPart}_${namePart}_${phosphosites.join(", ")}`;
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

function getNormalizedEndpointId(endpoint, fieldName, linkIndex) {
  const endpointId = getEndpointId(endpoint);
  if (endpointId === null || endpointId === undefined) {
    throw new Error(`Link at index ${linkIndex} has an invalid '${fieldName}' value.`);
  }
  return normalizeNodeId(String(endpointId));
}

function normalizeNodeAttribs(node, nodeIndex) {
  if (node.attribs === undefined || node.attribs === null) {
    node.attribs = [];
    return node.attribs;
  }

  if (!Array.isArray(node.attribs)) {
    node.attribs = [node.attribs];
  }

  return node.attribs;
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

    normalizeNodeAttribs(node, i).forEach((attrib, attribIndex) => {
      if (attrib === undefined || attrib === null || String(attrib).trim() === "") {
        throw new Error(`Node '${normalizedNodeId}' has an empty attribute at index ${attribIndex}.`);
      }
    });
  });

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
    if (link.weight === undefined || link.weight === null) {
      throw new Error(`Link at index ${i} is missing the 'weight' property.`);
    }
    if (link.attrib === undefined || link.attrib === null) {
      throw new Error(`Link at index ${i} is missing the 'attrib' property.`);
    }
    if (link.attribs !== undefined || link.weights !== undefined || link.directions !== undefined) {
      throw new Error(`Link at index ${i} uses the old multilink format. Use scalar 'attrib', scalar 'weight', and optional boolean 'directed'.`);
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

    if (typeof link.weight !== "number" || !Number.isFinite(link.weight)) {
      throw new Error(`Link '${sourceId}' -> '${targetId}' has an invalid 'weight' property. Expected a finite number.`);
    }
    if (link.attrib === undefined || link.attrib === null || String(link.attrib).trim() === "") {
      throw new Error(`Link '${sourceId}' -> '${targetId}' has an empty 'attrib' property.`);
    }
    if (link.directed !== undefined && typeof link.directed !== "boolean") {
      throw new Error(`Link '${sourceId}' -> '${targetId}' has an invalid 'directed' property. Expected a boolean.`);
    }
  });

  verifyGraphSettings(graph.data);
}

export function isCorrMatrix(fileData, tol = 1e-4) {
  return getCorrelationMatrixIssue(fileData, tol) === null;
}

export function getCorrelationMatrixIssue(fileData, tol = 1e-4) {
  const { header = [], firstColumn = [], data = [] } = fileData || {};

  if (!header.length) {
    return "The header row has no matrix columns after the required 'id' column.";
  }
  if (header.length !== data.length) {
    return `The matrix must be square, but it has ${header.length} column ID(s) and ${data.length} data row(s).`;
  }
  if (firstColumn.length !== data.length) {
    return `The matrix has ${data.length} data row(s), but ${firstColumn.length} row ID(s) were parsed.`;
  }

  for (let i = 0; i < data.length; i++) {
    const rowNumber = getDataRowNumber(fileData, i);
    if (!Array.isArray(data[i])) {
      return `Row ${rowNumber} is not a valid CSV/TSV row.`;
    }
    if (data[i].length !== header.length) {
      return `Row ${rowNumber} has ${data[i].length} matrix value(s), but the header defines ${header.length} matrix column(s). Check for missing or extra delimiters.`;
    }
    for (let j = 0; j < data[i].length; j++) {
      const value = data[i][j];
      if (!Number.isFinite(getCorrelationMatrixWeight(value))) {
        return `Cell at row ${rowNumber}, ${getColumnLabel(fileData, j)} contains '${formatValueForMessage(value)}'. Expected a number, blank, NA, N/A, or NaN.`;
      }
    }
    for (let j = i + 1; j < data.length; j++) {
      const aIsMissing = isMissingCorrelationValue(data[i][j]);
      const bIsMissing = isMissingCorrelationValue(data[j][i]);
      const a = getCorrelationMatrixWeight(data[i][j]);
      const b = getCorrelationMatrixWeight(data[j][i]);
      if (!aIsMissing && !bIsMissing && Math.abs(a - b) > tol) {
        return `Matrix is not symmetric: row ${getDataRowNumber(fileData, i)}, ${getColumnLabel(fileData, j)} is ${a}, but row ${getDataRowNumber(
          fileData,
          j,
        )}, ${getColumnLabel(fileData, i)} is ${b}.`;
      }
    }

    const diagonal = getCorrelationMatrixWeight(data[i][i]);
    if (!isMissingCorrelationValue(data[i][i]) && Math.abs(diagonal - 1) > 1e-3) {
      return `Diagonal cell at row ${rowNumber}, ${getColumnLabel(fileData, i)} is ${diagonal}. Correlation matrix diagonal values must be 1 or blank.`;
    }
  }

  let mismatches = 0;
  let firstMismatch = null;
  header.forEach((val, i) => {
    if (val !== firstColumn[i]) {
      mismatches++;
      if (!firstMismatch) {
        firstMismatch = { rowIndex: i, rowId: firstColumn[i], columnId: val };
      }
    }
  });

  if (mismatches / header.length > 0.1) {
    return `More than 10% of row IDs do not match the column IDs. First mismatch: row ${getDataRowNumber(fileData, firstMismatch.rowIndex)} has row ID '${
      firstMismatch.rowId
    }' but column ${firstMismatch.rowIndex + 2} is '${firstMismatch.columnId}'.`;
  }

  return null;
}

export function getCorrelationMatrixWeight(value) {
  if (isMissingCorrelationValue(value)) return 0;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
}

function isMissingCorrelationValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return true;
  if (typeof value !== "string") return false;

  return ["", "na", "n/a", "nan"].includes(value.trim().toLowerCase());
}

export function isTableData(fileData) {
  return getTableDataIssue(fileData) === null;
}

export function getTableDataIssue(fileData) {
  const { header = [], data = [], firstColumn = [] } = fileData || {};
  if (firstColumn.length < 1) {
    return "Tabular data must contain at least one data row after the header.";
  }

  const columnCount = header.length;
  if (columnCount < 1) {
    return "Tabular data must contain at least one measurement column after the required 'id' column.";
  }

  for (let i = 0; i < data.length; i++) {
    const rowNumber = getDataRowNumber(fileData, i);
    const row = data[i];
    if (!Array.isArray(row)) {
      return `Row ${rowNumber} is not a valid CSV/TSV row.`;
    }
    if (row.length !== columnCount) {
      return `Row ${rowNumber} has ${row.length} measurement value(s), but the header defines ${columnCount} measurement column(s). Check for missing or extra delimiters.`;
    }
  }

  const emptyHeaderIndex = header.findIndex((col) => typeof col !== "string" || col.trim() === "");
  if (emptyHeaderIndex !== -1) {
    return `Measurement column ${emptyHeaderIndex + 2} has an empty header.`;
  }

  const emptyRowIdIndex = firstColumn.findIndex((rowName) => typeof rowName !== "string" || rowName.trim() === "");
  if (emptyRowIdIndex !== -1) {
    return `Row ${getDataRowNumber(fileData, emptyRowIdIndex)} has an empty node ID in the first column.`;
  }

  let numericValueCount = 0;
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < columnCount; j++) {
      const value = data[i][j];
      if (isMissingCorrelationValue(value)) continue;
      const numericValue = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numericValue)) {
        return `Cell at row ${getDataRowNumber(fileData, i)}, ${getColumnLabel(fileData, j)} contains '${formatValueForMessage(
          value,
        )}'. Tabular data measurement values must be numeric, blank, NA, N/A, or NaN.`;
      }
      numericValueCount++;
    }
  }

  if (numericValueCount === 0) {
    return "Tabular data must contain at least one numeric measurement value.";
  }

  return null;
}
