function round2(value) {
  const scaled = value * 100;
  const sign = scaled < 0 ? -1 : 1;
  const absolute = Math.abs(scaled);
  const floor = Math.floor(absolute);
  const difference = absolute - floor;
  const rounded = difference > 0.5 ? floor + 1 : difference < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1;
  return (rounded * sign) / 100;
}

export function computePearsonEdgesJs(matrix, rows, cols, minEdgeCorr, ignoreNegatives) {
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
      if (ignoreNegatives) {
        if (corr <= 0 || corr < minEdgeCorr) continue;
      } else if (Math.abs(corr) < minEdgeCorr) {
        continue;
      }

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
  const indices = Array.from({ length: values.length }, (_, index) => index);
  indices.sort((a, b) => values[a] - values[b] || a - b);

  const ranks = new Array(values.length);
  let i = 0;
  while (i < values.length) {
    let j = i;
    while (j + 1 < values.length && values[indices[j + 1]] === values[indices[i]]) {
      j += 1;
    }

    const rank = (i + j + 2) / 2;
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
    sumX += x[i];
    sumY += y[i];
    sumXX += x[i] * x[i];
    sumYY += y[i] * y[i];
    sumXY += x[i] * y[i];
  }

  const cov = sumXY - (sumX * sumY) / n;
  const varX = sumXX - (sumX * sumX) / n;
  const varY = sumYY - (sumY * sumY) / n;
  if (varX <= 0 || varY <= 0) return null;

  const corr = cov / Math.sqrt(varX * varY);
  return Number.isFinite(corr) ? corr : null;
}

export function computeSpearmanEdgesJs(matrix, rows, cols, minEdgeCorr, ignoreNegatives) {
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

      let corr = pearsonFromArrays(rankArray(x), rankArray(y));
      if (corr === null) continue;

      corr = round2(corr);
      if (ignoreNegatives) {
        if (corr <= 0 || corr < minEdgeCorr) continue;
      } else if (Math.abs(corr) < minEdgeCorr) {
        continue;
      }

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
