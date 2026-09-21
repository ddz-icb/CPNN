import assert from "node:assert/strict";
import { test } from "node:test";
import {
  borderCheck, circularForce, getLinkDistance, gravityForce, groupRepulsionForce,
} from "../../../../../src/components/domain/service/physics_calculations/physicsGraph.js";

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
