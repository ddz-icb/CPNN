import { computePearsonEdgesJs, computeSpearmanEdgesJs } from "./correlationMath.js";

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

function computePearsonEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, ignoreNegatives) {
  const { memory, alloc_f64, dealloc_f64, pearson_edges, free_edges } = exports;

  const length = rows * cols;
  const dataPtr = alloc_f64(length);
  const view = new Float64Array(memory.buffer, dataPtr, length);
  view.set(matrix);

  const resultPtr = pearson_edges(dataPtr, rows, cols, minEdgeCorr, ignoreNegatives ? 1 : 0);
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

function computeSpearmanEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, ignoreNegatives) {
  const { memory, alloc_f64, dealloc_f64, spearman_edges, free_edges } = exports;
  if (typeof spearman_edges !== "function") {
    return computeSpearmanEdgesJs(matrix, rows, cols, minEdgeCorr, ignoreNegatives);
  }

  const length = rows * cols;
  const dataPtr = alloc_f64(length);
  const view = new Float64Array(memory.buffer, dataPtr, length);
  view.set(matrix);

  const resultPtr = spearman_edges(dataPtr, rows, cols, minEdgeCorr, ignoreNegatives ? 1 : 0);
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
  const { id, type, matrix, rows, cols, minEdgeCorr, ignoreNegatives } = event.data || {};
  if (type !== "pearson" && type !== "spearman") {
    self.postMessage({ id, type: "error", error: "Unknown correlation type." });
    return;
  }

  try {
    const exports = await initWasm();
    let result;
    if (type === "pearson") {
      result = exports
        ? computePearsonEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, ignoreNegatives)
        : computePearsonEdgesJs(matrix, rows, cols, minEdgeCorr, ignoreNegatives);
    } else {
      result = exports
        ? computeSpearmanEdgesWasm(exports, matrix, rows, cols, minEdgeCorr, ignoreNegatives)
        : computeSpearmanEdgesJs(matrix, rows, cols, minEdgeCorr, ignoreNegatives);
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
