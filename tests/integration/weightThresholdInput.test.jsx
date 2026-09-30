import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { FilterSidebar } from "../../src/components/adapters/gui/sidebar/filterSidebar.jsx";
import { useFilter } from "../../src/components/adapters/state/filterState.js";
import { useGraphMetrics } from "../../src/components/adapters/state/graphMetricsState.js";

// Code editors are unrelated to threshold entry and require browser text layout.
vi.mock("../../src/components/adapters/gui/sidebar/attribFilterBlock.jsx", () => ({ LinkAttribFilterBlock: () => null, NodeAttribFilterBlock: () => null }));
vi.mock("../../src/components/adapters/gui/sidebar/nodeIdFilterBlock.jsx", () => ({ NodeIdFilterBlock: () => null }));

const modules = import.meta.glob("../../src/components/adapters/state/*.js", { eager: true });
const stores = Object.values(modules).flatMap(Object.values).filter((value) => value?.getInitialState);
let root, host;
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  stores.forEach((store) => store.setState(store.getInitialState(), true));
  useGraphMetrics.getState().setGraphMetrics("linkWeightAbsMax", 90);
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<FilterSidebar />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  stores.forEach((store) => store.setState(store.getInitialState(), true));
});
async function typeValue(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

test.each([['Min', 'minLinkThreshold'], ['Max', 'maxLinkThreshold']])("%s weight threshold accepts three digits and larger decimals above graph maximum", async (label, key) => {
  const block = [...host.querySelectorAll('.block-section')].find((el) => el.querySelector('label')?.textContent === `${label} Link Weight Threshold`);
  const input = block.querySelector('input[type="number"]');
  const slider = block.querySelector('input[type="range"]');
  await act(async () => input.focus());
  for (const value of ['', '1', '12', '123']) {
    await typeValue(input, value);
    expect(input.value).toBe(value);
  }
  await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(useFilter.getState().filter[key]).toBe(123);
  expect(Number(slider.max)).toBeGreaterThanOrEqual(123);
  expect(slider.value).toBe('123');

  await act(async () => input.focus());
  await typeValue(input, '1234.5');
  await act(async () => input.blur());
  expect(useFilter.getState().filter[key]).toBe(1234.5);
  expect(input.value).toBe('1234.5');
  expect(Number(slider.max)).toBeGreaterThanOrEqual(1234.5);

  await act(async () => [...host.querySelectorAll('button')].find((button) => button.textContent === 'Reset Filters').click());
  expect(useFilter.getState().filter.maxLinkThreshold).toBe(90);
  expect(Number(slider.max)).toBe(90);
});
