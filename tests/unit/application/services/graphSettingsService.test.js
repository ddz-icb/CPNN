import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import {
  applyGraphSettings,
  buildAppearanceSettingsExport,
  buildGraphSettingsExport,
} from "../../../../src/components/application/services/graphSettingsService.js";
import { appearanceInit, useAppearance } from "../../../../src/components/adapters/state/appearanceState.js";
import { lightTheme, useTheme } from "../../../../src/components/adapters/state/themeState.js";

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
});

describe("applyGraphSettings", () => {
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
});
