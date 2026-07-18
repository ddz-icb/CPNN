export function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function collectNodesWithinPolygon(nodeMap, polygon) {
  if (!nodeMap || !polygon || polygon.length < 3) {
    return [];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  polygon.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  const nodes = [];

  Object.values(nodeMap).forEach((entry) => {
    if (!entry || !entry.node || !entry.circle || entry.circle.visible === false) {
      return;
    }

    const { x, y } = entry.circle;

    if (x < minX || x > maxX || y < minY || y > maxY) {
      return;
    }

    if (isPointInPolygon({ x, y }, polygon)) {
      nodes.push(entry.node.id);
    }
  });

  return nodes;
}
