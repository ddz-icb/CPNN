let wasmReady = null;

async function initWasm() {
  if (wasmReady) return wasmReady;

  wasmReady = (async () => {
    if (!("WebAssembly" in self)) return null;
    try {
      const response = await fetch("/wasm/corr_matrix.wasm");
      if (!response.ok) throw new Error(`Failed to fetch wasm: ${response.status}`);

      let result;
      if (WebAssembly.instantiateStreaming) {
        try {
          result = await WebAssembly.instantiateStreaming(response, {});
        } catch (streamError) {
          const buffer = await response.clone().arrayBuffer();
          result = await WebAssembly.instantiate(buffer, {});
        }
      } else {
        result = await WebAssembly.instantiate(await response.arrayBuffer(), {});
      }

      return result.instance.exports;
    } catch (error) {
      console.warn("WASM correlation init failed, falling back to JS.", error);
      return null;
    }
  })();

  return wasmReady;
}

function round2(value) {
  const factor = 100;
  const scaled = value * factor;
  const sign = scaled < 0 ? -1 : 1;
  const abs = Math.abs(scaled);
  const floor = Math.floor(abs);
  const diff = abs - floor;
  let rounded;

  if (diff > 0.5) {
    rounded = floor + 1;
  } else if (diff < 0.5) {
    rounded = floor;
  } else {
    rounded = floor % 2 === 0 ? floor : floor + 1;
  }

  return (rounded * sign) / factor;
}

function computePearsonEdgesJs(matrix, rows, cols, minEdgeCorr, takeAbs) {
  const sources = [];
  const targets = [];
  const weights = [];

  for (let i = 0; i < rows; i++) {
    const baseI = i * cols;
    for (let j = 0; j < i; j++) {
      const baseJ = j * cols;
      let sumX = 0;
      let sumY = 0;
      let sumXX = 0;
      let sumYY = 0;
      let sumXY = 0;
      let n = 0;

      for (let k = 0; k < cols; k++) {
        const x = matrix[baseI + k];
        const y = matrix[baseJ + k];
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        n += 1;
        sumX += x;
        sumY += y;
        sumXX += x * x;
        sumYY += y * y;
        sumXY += x * y;
      }

      if (n < 2) continue;
      const cov = sumXY - (sumX * sumY) / n;
      const varX = sumXX - (sumX * sumX) / n;
      const varY = sumYY - (sumY * sumY) / n;
      if (varX <= 0 || varY <= 0) continue;

      let corr = cov / Math.sqrt(varX * varY);
      if (!Number.isFinite(corr)) continue;

      corr = round2(corr);
      if (takeAbs) corr = Math.abs(corr);
      if (!takeAbs && corr <= 0) continue;
      if (corr < minEdgeCorr) continue;

      sources.push(i);
      targets.push(j);
      weights.push(corr);
    }
  }

  return {
    sources: Uint32Array.from(sources),
    targets: Uint32Array.from(targets),
    weights: Float32Array.from(weights),
  };
}

function rankArray(values) {
  const n = values.length;
  const indices = new Array(n);
  for (let i = 0; i < n; i++) indices[i] = i;

  indices.sort((a, b) => {
    const diff = values[a] - values[b];
    return diff === 0 ? a - b : diff;
  });

  const ranks = new Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    const value = values[indices[i]];
    while (j + 1 < n && values[indices[j + 1]] === value) {
      j += 1;
    }

    const rank = (i + j + 2) / 2; // average rank, 1-based
    for (let k = i; k <= j; k++) {
      ranks[indices[k]] = rank;
    }
    i = j + 1;
  }

  return ranks;
}

function pearsonFromArrays(x, y) {
  const n = x.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    sumX += xi;
    sumY += yi;
    sumXX += xi * xi;
    sumYY += yi * yi;
    sumXY += xi * yi;
  }

  const cov = sumXY - (sumX * sumY) / n;
  const varX = sumXX - (sumX * sumX) / n;
  const varY = sumYY - (sumY * sumY) / n;
  if (varX <= 0 || varY <= 0) return null;

  const corr = cov / Math.sqrt(varX * varY);
  if (!Number.isFinite(corr)) return null;
  return corr;
}

function computeSpearmanEdgesJs(matrix, rows, cols, minEdgeCorr, takeAbs) {
  const sources = [];
  const targets = [];
  const weights = [];

  for (let i = 0; i < rows; i++) {
    const baseI = i * cols;
    for (let j = 0; j < i; j++) {
      const baseJ = j * cols;
      const x = [];
      const y = [];

      for (let k = 0; k < cols; k++) {
        const xi = matrix[baseI + k];
        const yi = matrix[baseJ + k];
        if (!Number.isFinite(xi) || !Number.isFinite(yi)) continue;
        x.push(xi);
        y.push(yi);
      }

      if (x.length < 2) continue;

      const rankX = rankArray(x);
      const rankY = rankArray(y);
      let corr = pearsonFromArrays(rankX, rankY);
      if (corr === null) continue;

      corr = round2(corr);
      if (takeAbs) corr = Math.abs(corr);
      if (!takeAbs && corr <= 0) continue;
      if (corr < minEdgeCorr) continue;

      sources.push(i);
      targets.push(j);
      weights.push(corr);
    }
  }

  return {
    sources: Uint32Array.from(sources),
    targets: Uint32Array.from(targets),
    weights: Float32Array.from(weights),
  };
}

function readEdgeResult(memory, resultPtr) {
  const view = new DataView(memory.buffer, resultPtr, 28);
  const sourcesPtr = view.getUint32(0, true);
  const targetsPtr = view.getUint32(4, true);
  const weightsPtr = view.getUint32(8, true);
  const length = view.getUint32(12, true);
  const sourcesCap = view.getUint32(16, true);
  const targetsCap = view.getUint32(20, true);
  const weightsCap = view.getUint32(24, true);

  return { sourcesPtr, targetsPtr, weightsPtr, length, sourcesCap, targetsCap, weightsCap };
}

function computePearsonEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, takeAbs) {
  const { memory, alloc_f64, dealloc_f64, pearson_edges, free_edges } = exports;

  const length = rows * cols;
  const dataPtr = alloc_f64(length);
  const view = new Float64Array(memory.buffer, dataPtr, length);
  view.set(matrix);

  const resultPtr = pearson_edges(dataPtr, rows, cols, minEdgeCorr, takeAbs ? 1 : 0);
  if (!resultPtr) {
    dealloc_f64(dataPtr, length);
    return { sources: new Uint32Array(), targets: new Uint32Array(), weights: new Float32Array() };
  }
  const { sourcesPtr, targetsPtr, weightsPtr, length: edgeCount } = readEdgeResult(memory, resultPtr);

  const sources = new Uint32Array(memory.buffer, sourcesPtr, edgeCount).slice();
  const targets = new Uint32Array(memory.buffer, targetsPtr, edgeCount).slice();
  const weights = new Float32Array(memory.buffer, weightsPtr, edgeCount).slice();

  free_edges(resultPtr);
  dealloc_f64(dataPtr, length);

  return { sources, targets, weights };
}

function computeSpearmanEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, takeAbs) {
  const { memory, alloc_f64, dealloc_f64, spearman_edges, free_edges } = exports;
  if (typeof spearman_edges !== "function") {
    return computeSpearmanEdgesJs(matrix, rows, cols, minEdgeCorr, takeAbs);
  }

  const length = rows * cols;
  const dataPtr = alloc_f64(length);
  const view = new Float64Array(memory.buffer, dataPtr, length);
  view.set(matrix);

  const resultPtr = spearman_edges(dataPtr, rows, cols, minEdgeCorr, takeAbs ? 1 : 0);
  if (!resultPtr) {
    dealloc_f64(dataPtr, length);
    return { sources: new Uint32Array(), targets: new Uint32Array(), weights: new Float32Array() };
  }
  const { sourcesPtr, targetsPtr, weightsPtr, length: edgeCount } = readEdgeResult(memory, resultPtr);

  const sources = new Uint32Array(memory.buffer, sourcesPtr, edgeCount).slice();
  const targets = new Uint32Array(memory.buffer, targetsPtr, edgeCount).slice();
  const weights = new Float32Array(memory.buffer, weightsPtr, edgeCount).slice();

  free_edges(resultPtr);
  dealloc_f64(dataPtr, length);

  return { sources, targets, weights };
}

self.onmessage = async (event) => {
  const { id, type, matrix, rows, cols, minEdgeCorr, takeAbs } = event.data || {};
  if (type !== "pearson" && type !== "spearman") {
    self.postMessage({ id, type: "error", error: "Unknown correlation type." });
    return;
  }

  try {
    const exports = await initWasm();
    let result;
    if (type === "pearson") {
      result = exports
        ? computePearsonEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, takeAbs)
        : computePearsonEdgesJs(matrix, rows, cols, minEdgeCorr, takeAbs);
    } else {
      result = exports
        ? computeSpearmanEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, takeAbs)
        : computeSpearmanEdgesJs(matrix, rows, cols, minEdgeCorr, takeAbs);
    }

    self.postMessage(
      {
        id,
        type: "result",
        payload: result,
      },
      [result.sources.buffer, result.targets.buffer, result.weights.buffer]
    );
  } catch (error) {
    self.postMessage({ id, type: "error", error: error?.message || "Correlation worker failed." });
  }
};
