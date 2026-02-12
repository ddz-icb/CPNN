import log from "../../../adapters/logging/logger.js";

let correlationWorker = null;
let requestId = 0;
const pendingRequests = new Map();

function getWorker() {
  if (correlationWorker) return correlationWorker;

  correlationWorker = new Worker(new URL("./correlationWorker.js", import.meta.url), { type: "module" });

  correlationWorker.onmessage = (event) => {
    const { id, type, payload, error } = event.data || {};
    if (!pendingRequests.has(id)) return;

    const { resolve, reject } = pendingRequests.get(id);
    pendingRequests.delete(id);

    if (type === "error") {
      reject(new Error(error || "Correlation worker error"));
      return;
    }

    resolve(payload);
  };

  correlationWorker.onerror = (event) => {
    const message = event?.message || "Correlation worker failed.";
    pendingRequests.forEach(({ reject }) => reject(new Error(message)));
    pendingRequests.clear();
  };

  return correlationWorker;
}

function requestWorker(payload, transfer) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pendingRequests.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...payload }, transfer || []);
  });
}

function toNumericMatrix(fileData) {
  const { data, firstColumn } = fileData;
  const rowCount = data?.length ?? 0;
  const colCount = rowCount > 0 ? data[0].length : 0;

  if (rowCount === 0 || colCount === 0) {
    return { matrix: new Float64Array(), rowNames: [], rows: 0, cols: 0 };
  }

  const keepRow = new Array(rowCount).fill(false);
  let keptRows = 0;

  for (let i = 0; i < rowCount; i++) {
    const row = data[i];
    let hasValue = false;
    for (let j = 0; j < colCount; j++) {
      const val = row[j];
      const num = typeof val === "number" ? val : Number(val);
      if (Number.isFinite(num)) {
        hasValue = true;
        break;
      }
    }
    if (hasValue) {
      keepRow[i] = true;
      keptRows += 1;
    }
  }

  const matrix = new Float64Array(keptRows * colCount);
  const rowNames = new Array(keptRows);
  let outRow = 0;

  for (let i = 0; i < rowCount; i++) {
    if (!keepRow[i]) continue;
    const row = data[i];
    rowNames[outRow] = String(firstColumn[i]);
    const base = outRow * colCount;
    for (let j = 0; j < colCount; j++) {
      const val = row[j];
      const num = typeof val === "number" ? val : Number(val);
      matrix[base + j] = Number.isFinite(num) ? num : Number.NaN;
    }
    outRow += 1;
  }

  return { matrix, rowNames, rows: keptRows, cols: colCount };
}

async function computeCorrelationEdges({ method, matrix, rows, cols, minEdgeCorr, takeAbs }) {
  const payload = await requestWorker(
    {
      type: method,
      matrix,
      rows,
      cols,
      minEdgeCorr,
      takeAbs,
    },
    [matrix.buffer]
  );

  return payload;
}

export async function buildGraphFromRawTable(fileData, { takeSpearman, takeAbs, minEdgeCorr, linkAttrib }) {
  const { matrix, rowNames, rows, cols } = toNumericMatrix(fileData);
  if (rows === 0 || cols === 0) {
    return { nodes: [], links: [] };
  }

  const minEdgeCorrValue = Number.isFinite(minEdgeCorr) ? minEdgeCorr : Number(minEdgeCorr) || 0;
  const method = takeSpearman ? "spearman" : "pearson";
  const { sources, targets, weights } = await computeCorrelationEdges({
    method,
    matrix,
    rows,
    cols,
    minEdgeCorr: minEdgeCorrValue,
    takeAbs: Boolean(takeAbs),
  });

  const nodes = rowNames.map((id) => ({ id, attribs: [] }));
  const links = new Array(weights.length);

  for (let i = 0; i < weights.length; i++) {
    const sourceIdx = sources[i];
    const targetIdx = targets[i];
    const weight = Math.round(weights[i] * 100) / 100;
    links[i] = {
      source: rowNames[sourceIdx],
      target: rowNames[targetIdx],
      weights: [weight],
      attribs: [linkAttrib],
    };
  }

  log.info(`Client-side correlation produced ${links.length} links.`);
  return { nodes, links };
}
