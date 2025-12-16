export function buildExportGridLines(graphData, container) {
  const centerX = (container?.width ?? 0) / 2;
  const centerY = (container?.height ?? 0) / 2;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const node of graphData?.nodes ?? []) {
    const x = node?.x;
    const z = node?.z ?? 0;
    if (Number.isFinite(x)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (Number.isFinite(z)) {
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  if (!Number.isFinite(minX)) {
    minX = centerX - (container?.width ?? 500) / 2;
    maxX = centerX + (container?.width ?? 500) / 2;
  }
  if (!Number.isFinite(minZ)) {
    minZ = -(container?.width ?? 500) / 2;
    maxZ = (container?.width ?? 500) / 2;
  }

  const halfX = Math.max(Math.abs(maxX - centerX), Math.abs(minX - centerX));
  const halfZ = Math.max(Math.abs(maxZ), Math.abs(minZ));
  const largestHalf = Math.max(halfX, halfZ, (container?.width ?? 500) * 0.15);
  const pad = Math.max(largestHalf * 0.1, 10);

  const extent = largestHalf + pad;
  const size = extent * 2;
  const targetStep = clamp(size / 16, 12, 220);
  const cells = Math.max(6, Math.round(size / targetStep));
  const step = size / cells;

  const lines = [];
  for (let i = 0; i <= cells; i++) {
    const x = centerX - extent + i * step;
    const axis = Math.abs(x - centerX) <= Math.max(step * 0.25, 1);
    lines.push({
      start: { x, y: centerY, z: -extent },
      end: { x, y: centerY, z: extent },
      axis,
    });
  }

  for (let i = 0; i <= cells; i++) {
    const z = -extent + i * step;
    const axis = Math.abs(z) <= Math.max(step * 0.25, 1);
    lines.push({
      start: { x: centerX - extent, y: centerY, z },
      end: { x: centerX + extent, y: centerY, z },
      axis,
    });
  }

  lines.push({
    start: { x: centerX, y: centerY - extent * 0.4, z: 0 },
    end: { x: centerX, y: centerY + extent * 0.4, z: 0 },
    axis: true,
  });

  return lines;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

