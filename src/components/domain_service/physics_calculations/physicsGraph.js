import { getCentroid, groupBy } from "../graph_calculations/graphUtils.js";

// ==== Constants ====
export const accuracyBarnesHut = 0.1;
export const maxDistanceChargeForce = 300;
export const nodeRepulsionMultiplier = -300;
export const borderMultiplier = 10;

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

export function componentForce(nodeIdToCompMap, centroidThreshold) {
  let nodes;
  let strength = 0.1;

  function force(alpha) {
    const groups = groupBy(nodes, (n) => nodeIdToCompMap[n.id]);
    const centroids = new Map([...groups].filter(([_, g]) => g.length >= centroidThreshold).map(([id, g]) => [id, getCentroid(g)]));

    for (const node of nodes) {
      for (const [compId, centroid] of centroids) {
        if (nodeIdToCompMap[node.id] === compId) continue;

        const dx = centroid.x - node.x;
        const dy = centroid.y - node.y;
        const distSq = dx * dx + dy * dy;
        if (!distSq) continue;

        const f = (strength * centroidThreshold * alpha) / Math.sqrt(distSq);
        node.vx -= dx * f;
        node.vy -= dy * f;
      }
    }
  }

  force.initialize = (n) => (nodes = n);
  force.strength = (s) => (s === undefined ? strength : ((strength = s), force));
  return force;
}

export function communityForce(communityMap) {
  let nodes;
  let strength = 0.1;
  const baseStrength = 0.3;

  function force(alpha) {
    const groups = groupBy(nodes, (node) => communityMap.get(node.id));
    const centroids = new Map();
    for (const [id, group] of groups) {
      centroids.set(id, getCentroid(group));
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

export function circularForce(nodeIdToCompMap, adjacentCountMap, minCircleSize) {
  let nodes;
  let strength = 1;

  function force(alpha) {
    const groups = groupBy(nodes, (node) => nodeIdToCompMap[node.id]);
    const centroids = new Map();
    const circleGroups = new Map();

    for (const [id, group] of groups) {
      const centroid = getCentroid(group);
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
