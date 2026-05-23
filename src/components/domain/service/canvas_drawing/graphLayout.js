const layoutAxes = [
  { coordinateKey: "x", fixedKey: "fx", targetKey: "width", targetFactor: 0.5 },
  { coordinateKey: "y", fixedKey: "fy", targetKey: "height", targetFactor: 0.5 },
  { coordinateKey: "z", fixedKey: "fz", targetValue: 0 },
];

function toFiniteNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function getLayoutCoordinate(node, coordinateKey, fixedKey) {
  const fixedValue = toFiniteNumber(node?.[fixedKey]);
  if (fixedValue !== null) return fixedValue;

  return toFiniteNumber(node?.[coordinateKey]);
}

function getAxisTarget(axis, container) {
  if (Number.isFinite(axis.targetValue)) return axis.targetValue;

  const containerSize = toFiniteNumber(container?.[axis.targetKey]) ?? 0;
  return containerSize * axis.targetFactor;
}

function getGraphBounds(nodes) {
  const bounds = Object.fromEntries(
    layoutAxes.map(({ coordinateKey }) => [
      coordinateKey,
      {
        min: Infinity,
        max: -Infinity,
      },
    ]),
  );

  for (const node of nodes) {
    for (const axis of layoutAxes) {
      const value = getLayoutCoordinate(node, axis.coordinateKey, axis.fixedKey);
      if (value === null) continue;

      const axisBounds = bounds[axis.coordinateKey];
      axisBounds.min = Math.min(axisBounds.min, value);
      axisBounds.max = Math.max(axisBounds.max, value);
    }
  }

  return bounds;
}

function applyAxisOffset(node, axis, offset) {
  if (!Number.isFinite(offset) || Math.abs(offset) < 1e-9) return;

  const coordinateValue = getLayoutCoordinate(node, axis.coordinateKey, axis.fixedKey);
  if (coordinateValue !== null) {
    node[axis.coordinateKey] = coordinateValue + offset;
  }

  const fixedValue = toFiniteNumber(node?.[axis.fixedKey]);
  if (fixedValue !== null) {
    node[axis.fixedKey] = fixedValue + offset;
  }
}

export function seedNodePositions(nodes, container) {
  const offsetSpawnValue = nodes.length * 10;

  for (const node of nodes) {
    const x = getLayoutCoordinate(node, "x", "fx");
    const y = getLayoutCoordinate(node, "y", "fy");
    const z = getLayoutCoordinate(node, "z", "fz");

    node.x = x ?? container.width / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
    node.y = y ?? container.height / 2 + Math.random() * offsetSpawnValue - offsetSpawnValue / 2;
    node.z = z ?? (Math.random() - 0.5) * offsetSpawnValue;
  }
}

export function centerGraphInContainer(nodes, container) {
  if (!Array.isArray(nodes) || nodes.length === 0) return;

  const bounds = getGraphBounds(nodes);

  for (const axis of layoutAxes) {
    const axisBounds = bounds[axis.coordinateKey];
    if (!Number.isFinite(axisBounds.min) || !Number.isFinite(axisBounds.max)) continue;

    const currentCenter = (axisBounds.min + axisBounds.max) / 2;
    const targetCenter = getAxisTarget(axis, container);
    const offset = targetCenter - currentCenter;

    for (const node of nodes) {
      applyAxisOffset(node, axis, offset);
    }
  }
}
