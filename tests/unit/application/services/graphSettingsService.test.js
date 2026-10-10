import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  applyGraphSettings,
  buildAppearanceSettingsExport,
  buildGraphSettingsExport,
} from "../../../../src/components/application/services/graphSettingsService.js";
import { appearanceInit, useAppearance } from "../../../../src/components/adapters/state/appearanceState.js";
import { lightTheme, useTheme } from "../../../../src/components/adapters/state/themeState.js";
import { graphMetricsInit, useGraphMetrics } from "../../../../src/components/adapters/state/graphMetricsState.js";
import { filterInit, useFilter } from "../../../../src/components/adapters/state/filterState.js";
import { physicsInit, usePhysics } from "../../../../src/components/adapters/state/physicsState.js";

function createGraphData(settings = {}) {
  return {
    nodes: [{ id: "A" }, { id: "B" }],
    links: [{ source: "A", target: "B", attrib: "connected", weight: 1 }],
    ...settings,
  };
}

afterEach(() => {
  useAppearance.getState().setAllAppearance(appearanceInit);
  useTheme.getState().setTheme(lightTheme);
  useGraphMetrics.getState().setAllGraphMetrics(graphMetricsInit);
  useFilter.getState().setAllFilter(filterInit);
  usePhysics.getState().setAllPhysics(physicsInit);
});

describe("applyGraphSettings", () => {
  test("clears weight statistics when switching to an unweighted graph", () => {
    applyGraphSettings({ name: "weighted", data: createGraphData() });
    assert.equal(useGraphMetrics.getState().graphMetrics.linkWeightMax, 1);
    applyGraphSettings({ name: "unweighted", data: createGraphData({ links: [{ source: "A", target: "B", attrib: "connected" }] }) });
    assert.deepEqual(useGraphMetrics.getState().graphMetrics, graphMetricsInit);
  });

  test("restores saved 3D appearance settings from graph data without changing the theme", () => {
    const cameraRef = { current: { redraw: null } };
    useAppearance.getState().setAllAppearance({
      ...appearanceInit,
      cameraRef,
      threeD: false,
      enable3DShading: true,
      show3DGrid: true,
    });

    applyGraphSettings({
      name: "GloBISpeciesInteractions",
      data: createGraphData({
        appearance: {
          linkWidth: 2.5,
          threeD: true,
          enable3DShading: false,
          show3DGrid: false,
          themeName: "dark",
        },
      }),
    });

    const appearance = useAppearance.getState().appearance;
    assert.equal(appearance.threeD, true);
    assert.equal(appearance.enable3DShading, false);
    assert.equal(appearance.show3DGrid, false);
    assert.equal(appearance.linkWidth, 2.5);
    assert.equal(appearance.cameraRef, cameraRef);
    assert.equal(useTheme.getState().theme.name, "light");
  });

  test("same-source updates keep current controls and refresh metrics when links change", () => {
    const original = { name: "A", data: createGraphData({ physics: { linkLength: 300 } }) };
    applyGraphSettings(original);
    usePhysics.getState().setPhysics("linkLength", 250);
    useFilter.getState().setFilter("minLinkThreshold", 0.2);

    const mapped = { name: "A", data: { ...original.data, nodes: [{ id: "A", attribs: ["Mapped"] }, { id: "B" }] } };
    applyGraphSettings(mapped, original);
    assert.equal(usePhysics.getState().physics.linkLength, 250);
    assert.equal(useFilter.getState().filter.minLinkThreshold, 0.2);

    const changedLinks = { name: "A", data: { ...mapped.data, links: [{ source: "A", target: "B", weight: 0.8 }] } };
    applyGraphSettings(changedLinks, mapped);
    assert.equal(usePhysics.getState().physics.linkLength, 250);
    assert.equal(useGraphMetrics.getState().graphMetrics.linkWeightMax, 0.8);
    assert.equal(useFilter.getState().filter.minLinkThreshold, 0.8);
  });
});
