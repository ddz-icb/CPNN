import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { PhysicsSidebar } from "../../src/components/adapters/gui/sidebar/physicsSidebar.jsx";
import { useAppearance } from "../../src/components/adapters/state/appearanceState.js";
import { usePhysics } from "../../src/components/adapters/state/physicsState.js";

let root;
let host;

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  usePhysics.setState(usePhysics.getInitialState(), true);
  useAppearance.setState(useAppearance.getInitialState(), true);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<PhysicsSidebar />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

test("elevation is available in 2D, opens 3D when enabled, and has a strength range through 10", async () => {
  const control = [...host.querySelectorAll(".block-section")]
    .find((element) => element.querySelector(".label")?.textContent === "Elevation Force");
  expect(control).toBeDefined();
  expect(useAppearance.getState().appearance.threeD).toBe(false);

  await act(async () => control.querySelector('input[type="checkbox"]').click());
  expect(usePhysics.getState().physics.elevationForce).toBe(true);
  expect(useAppearance.getState().appearance.threeD).toBe(true);

  const strength = [...host.querySelectorAll(".block-section")]
    .find((element) => element.querySelector(".label")?.textContent === "Elevation Strength");
  expect(strength.querySelector('input[type="range"]').max).toBe("10");

  await act(async () => useAppearance.getState().setAppearance("threeD", false));
  expect(host.contains(control)).toBe(true);
  expect(host.contains(strength)).toBe(true);
});
