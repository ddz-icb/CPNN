// ==== Constants ====
export const accuracyBarnesHut = 0.1;
export const maxDistanceChargeForce = 300;
export const nodeRepulsionMultiplier = -300;
export const borderMultiplier = 10;

// ==== Shared Utilities ====
function groupBy(nodes, keyFn) {
  const map = new Map();
  for (const node of nodes) {
    const key = keyFn(node);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(node);
  }
  return map;
}

function calculateCentroid(nodes) {
  if (!nodes.length) return { x: 0, y: 0, size: 0 };
  let x = 0,
    y = 0;
  for (const n of nodes) {
    x += n.x;
    y += n.y;
  }
  return { x: x / nodes.length, y: y / nodes.length, size: nodes.length };
}

// ==== Forces ====
export function borderCheck(radius, borderHeight, borderWidth, center) {
  let nodes;
  let strength = 1;

  const leftBorder = center.x - (borderWidth * strength) / 2;
  const rightBorder = center.x + (borderWidth * strength) / 2;
  const topBorder = center.y - (borderHeight * strength) / 2;
  const bottomBorder = center.y + (borderHeight * strength) / 2;

  function force(alpha) {
    for (const node of nodes) {
      let dx = 0,
        dy = 0;
      if (node.x < leftBorder + radius) dx += (leftBorder + radius - node.x) * strength;
      else if (node.x > rightBorder - radius) dx += (rightBorder - radius - node.x) * strength;

      if (node.y < topBorder + radius) dy += (topBorder + radius - node.y) * strength;
      else if (node.y > bottomBorder - radius) dy += (bottomBorder - radius - node.y) * strength;

      node.vx += dx * alpha;
      node.vy += dy * alpha;
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  force.strength = (_) => (_ === undefined ? strength : ((strength = _), force));
  return force;
}

// ==== Component Force ====
export function componentForce(componentArray, centroidThreshold) {
  let nodes;
  let strength = 0.1; // adjustable by user

  function force(alpha) {
    const groups = groupBy(nodes, (node) => componentArray[node.id]);
    const centroids = new Map();
    for (const [id, group] of groups) {
      if (group.length >= centroidThreshold) {
        centroids.set(id, calculateCentroid(group));
      }
    }

    for (const node of nodes) {
      const nodeComp = componentArray[node.id];
      for (const [otherComp, centroid] of centroids) {
        if (nodeComp !== otherComp) {
          const dx = centroid.x - node.x;
          const dy = centroid.y - node.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0) {
            const dist = Math.sqrt(distSq);
            const f = (strength * centroidThreshold * alpha) / dist;
            node.vx -= dx * f;
            node.vy -= dy * f;
          }
        }
      }
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  force.strength = (_) => (_ === undefined ? strength : ((strength = _), force));
  return force;
}

// ==== Community Force ====
export function communityForce(communityMap) {
  let nodes;
  let strength = 0.1; // adjustable
  const baseStrength = 0.3;

  function force(alpha) {
    const groups = groupBy(nodes, (node) => communityMap.get(node.id));
    const centroids = new Map();
    for (const [id, group] of groups) {
      centroids.set(id, calculateCentroid(group));
    }

    for (const node of nodes) {
      const nodeComm = communityMap.get(node.id);
      for (const [otherComm, centroid] of centroids) {
        if (nodeComm !== otherComm) {
          const dx = centroid.x - node.x;
          const dy = centroid.y - node.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0) {
            const dist = Math.sqrt(distSq);
            const f = (strength * baseStrength * alpha * Math.sqrt(centroid.size)) / dist;
            node.vx -= dx * f;
            node.vy -= dy * f;
          }
        }
      }
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  force.strength = (_) => (_ === undefined ? strength : ((strength = _), force));
  return force;
}

// ==== Circular Layout ====
export function circularForce(componentArray, adjacentCountMap, minCircleSize) {
  let nodes;
  let strength = 1;

  function force(alpha) {
    const groups = groupBy(nodes, (node) => componentArray[node.id]);
    const centroids = new Map();
    const circleGroups = new Map();

    for (const [id, group] of groups) {
      const centroid = calculateCentroid(group);
      centroids.set(id, centroid);
      if (group.length >= minCircleSize) circleGroups.set(id, centroid);
    }

    // Circular arrangement for large groups
    for (const [id, centroid] of circleGroups) {
      const group = groups.get(id);
      const radius = 50 * Math.sqrt(group.length);
      group.sort((a, b) => adjacentCountMap.get(b.id) - adjacentCountMap.get(a.id));
      for (let i = 0; i < group.length; i++) {
        const angle = (2 * Math.PI * i) / group.length;
        const targetX = centroid.x + radius * Math.cos(angle - Math.PI / 2);
        const targetY = centroid.y + radius * Math.sin(angle - Math.PI / 2);
        const dx = targetX - group[i].x;
        const dy = targetY - group[i].y;
        group[i].vx += dx * alpha * strength;
        group[i].vy += dy * alpha * strength;
      }
    }

    // Cluster repulsion
    const keys = [...centroids.keys()];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const c1 = centroids.get(keys[i]);
        const c2 = centroids.get(keys[j]);
        const size1 = groups.get(keys[i]).length;
        const size2 = groups.get(keys[j]).length;
        const radius1 = 50 * Math.sqrt(size1);
        const radius2 = 50 * Math.sqrt(size2);

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = radius1 + radius2 + 10;
        if (dist < minDist && dist > 0) {
          const repulse = ((minDist - dist) / dist) * alpha * strength;
          for (const n of groups.get(keys[i])) {
            n.vx -= dx * repulse;
            n.vy -= dy * repulse;
          }
          for (const n of groups.get(keys[j])) {
            n.vx += dx * repulse;
            n.vy += dy * repulse;
          }
        }
      }
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  return force;
}

// ==== Gravity Force ====
export function gravityForce(x, y) {
  let nodes;
  let strength = 0.1;

  function force(alpha) {
    for (const node of nodes) {
      node.vx += (x - node.x) * strength * alpha;
      node.vy += (y - node.y) * strength * alpha;
    }
  }

  force.initialize = (_) => {
    nodes = _;
  };
  force.strength = (_) => (_ === undefined ? strength : ((strength = _), force));
  return force;
}
