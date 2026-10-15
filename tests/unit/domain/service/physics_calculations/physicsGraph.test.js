import assert from "node:assert/strict";
import { test } from "node:test";
import * as d3 from "d3";
import {
  borderCheck, circularForce, degreeElevationForce, getLinkDistance, gravityForce, groupRepulsionForce,
} from "../../../../../src/components/domain/service/physics_calculations/physicsGraph.js";
import { getNodeDegreeData } from "../../../../../src/components/domain/service/graph_calculations/graphUtils.js";
import { getSimulation } from "../../../../../src/components/domain/service/physics_calculations/simulation.js";

function applyForce(force, nodes) {
  force.initialize(nodes);
  force(1);
}

for (const threeD of [false, true]) {
  const dimensions = threeD ? "3D" : "2D";
  const node = (id, position) => ({
    id, x: position, y: position, vx: 0, vy: 0,
    ...(threeD ? { z: position, vz: 0 } : {}),
  });
  const velocities = (n) => threeD ? [n.vx, n.vy, n.vz] : [n.vx, n.vy];

  test(`${dimensions}: gravity pulls toward the center and can be disabled`, () => {
    const nodes = [node("A", -20), node("B", 20), node("C", 0)];
    applyForce(gravityForce(0, 0, 0), nodes);
    assert.ok(velocities(nodes[0]).every((v) => v > 0));
    assert.ok(velocities(nodes[1]).every((v) => v < 0));
    assert.ok(velocities(nodes[2]).every((v) => v === 0));

    const disabled = node("D", 20);
    applyForce(gravityForce(0, 0, 0).strength(0), [disabled]);
    assert.ok(velocities(disabled).every((v) => v === 0));
  });

  test(`${dimensions}: borders push outside nodes inward and leave inside nodes alone`, () => {
    const nodes = [node("A", -60), node("B", 60), node("C", 0)];
    applyForce(borderCheck(5, 100, 100, { x: 0, y: 0, z: 0 }, 100), nodes);
    assert.ok(velocities(nodes[0]).every((v) => v > 0));
    assert.ok(velocities(nodes[1]).every((v) => v < 0));
    assert.ok(velocities(nodes[2]).every((v) => v === 0));
  });

  test(`${dimensions}: different groups repel while a single group stays still`, () => {
    const nodes = [node("A", -20), node("B", 20)];
    applyForce(groupRepulsionForce({ A: 0, B: 1 }, 1), nodes);
    assert.ok(velocities(nodes[0]).every((v) => v < 0));
    assert.ok(velocities(nodes[1]).every((v) => v > 0));

    const sameGroup = [node("A", -20), node("B", 20)];
    applyForce(groupRepulsionForce({ A: 0, B: 0 }, 1), sameGroup);
    assert.ok(sameGroup.flatMap(velocities).every((v) => v === 0));
  });

  test(`${dimensions}: circular layout separates overlapping nodes but skips small groups`, () => {
    const nodes = Array.from({ length: 6 }, (_, i) => node(String(i), 0));
    const groups = Object.fromEntries(nodes.map((n) => [n.id, 0]));
    const neighbors = new Map(nodes.map((n) => [n.id, 2]));
    applyForce(circularForce(groups, neighbors, 6, threeD), nodes);
    assert.ok(nodes.flatMap(velocities).every(Number.isFinite));
    assert.ok(nodes.every((n) => velocities(n).some((v) => v !== 0)));
    assert.equal(new Set(nodes.map((n) => JSON.stringify(velocities(n)))).size, nodes.length);

    const smallGroup = [node("0", 0), node("1", 0)];
    applyForce(circularForce(groups, neighbors, 6, threeD), smallGroup);
    assert.ok(smallGroup.flatMap(velocities).every((v) => v === 0));
  });
}

test("degree elevation only changes depth and strength scales the height", () => {
  const graph = {
    nodes: ["hub", "a", "b", "c", "d", "isolated"].map((id) => ({ id, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })),
    links: ["a", "b", "c", "d"].map((id) => ({ source: "hub", target: id })),
  };
  const force = degreeElevationForce(getNodeDegreeData(graph));
  graph.nodes.at(-1).z = -40;
  graph.nodes.at(-1).fz = -20;
  applyForce(force, graph.nodes);
  const byId = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  assert.ok(byId.hub.vz > byId.a.vz && byId.a.vz > byId.isolated.vz);
  assert.ok(graph.nodes.every((node) => node.z > 0 && node.vz >= 0));
  assert.equal(byId.isolated.fz, 20);
  assert.ok(graph.nodes.every((node) => node.vx === 0 && node.vy === 0));
  const initialHeight = byId.hub.vz;
  graph.nodes.forEach((node) => { node.vz = 0; });
  force.strength(2);
  force(1);
  assert.equal(byId.hub.vz, initialHeight * 2);
});

test("3D elevation preserves the ordinary 2D layout while adding height", () => {
  const ids = ["hub", "a", "b", "c", "d"];
  const buildGraph = (threeD) => ({
    nodes: ids.map((id, index) => ({ id, x: 300 + index * 4, y: 250 + index * 3, ...(threeD ? { z: 0 } : {}) })),
    links: ids.slice(1).map((id) => ({ source: "hub", target: id })),
  });
  const flat = buildGraph(false);
  const elevated = buildGraph(true);
  const flatSimulation = getSimulation(100, false, true, flat).stop();
  const elevatedSimulation = getSimulation(100, true, true, elevated, true).stop();
  for (const simulation of [flatSimulation, elevatedSimulation]) {
    simulation.force("charge", d3.forceManyBody().distanceMax(300).strength(-300));
    simulation.force("gravity", gravityForce(400, 300, simulation === flatSimulation ? 0 : null).strength(0.05));
  }
  elevatedSimulation.force("elevationForce", degreeElevationForce(getNodeDegreeData(elevated)));
  flatSimulation.tick(180);
  elevatedSimulation.tick(180);

  for (let index = 0; index < ids.length; index++) {
    assert.ok(Math.abs(flat.nodes[index].x - elevated.nodes[index].x) < 1e-6);
    assert.ok(Math.abs(flat.nodes[index].y - elevated.nodes[index].y) < 1e-6);
  }
  assert.ok(elevated.nodes[0].z > elevated.nodes[1].z);
  assert.ok(elevated.nodes.every((node) => node.z > 0));
});

test("planar gravity, component repulsion, border and circle leave depth untouched", () => {
  const nodes = [
    { id: "a", x: -20, y: 0, z: 100, vx: 0, vy: 0, vz: 0 },
    { id: "b", x: 20, y: 0, z: -100, vx: 0, vy: 0, vz: 0 },
  ];
  applyForce(gravityForce(0, 0, null), nodes);
  applyForce(groupRepulsionForce({ a: 0, b: 1 }, 1, false), nodes);
  applyForce(borderCheck(5, 100, 100, { x: 0, y: 0, z: 0 }, 10, false), nodes);
  applyForce(circularForce({ a: 0, b: 1 }, new Map([["a", 1], ["b", 1]]), 6, false), nodes);
  assert.ok(nodes.every((node) => node.vz === 0));
});

test("overlapping group centers do not produce invalid velocities", () => {
  const nodes = ["A", "B"].map((id) => ({ id, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }));
  applyForce(groupRepulsionForce({ A: 0, B: 1 }, 1), nodes);
  assert.ok(nodes.every((n) => [n.vx, n.vy, n.vz].every((v) => v === 0)));
});

test("stronger link weights shorten links, irrespective of sign", () => {
  const extent = { min: 0, max: 1 };
  const distance = (weight) => getLinkDistance(100, { weight }, extent);
  assert.ok(distance(0) > distance(0.5));
  assert.ok(distance(0.5) > distance(1));
  assert.ok(distance(1) > 0);
  assert.equal(distance(-0.5), distance(0.5));
  assert.equal(distance(2), distance(1));
});

test("equal weights and all-zero weights produce finite positive link lengths", () => {
  for (const weight of [0, 0.7]) {
    const distance = getLinkDistance(100, { weight }, { min: weight, max: weight });
    assert.ok(Number.isFinite(distance) && distance > 0 && distance <= 100);
  }
});
