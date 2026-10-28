import { test, expect } from "@playwright/test";
import { expectLayoutFits } from "./layout-checks.js";

// Use the real app and graph. Set the click position explicitly so layout tests
// don't depend on where the moving canvas happens to draw a node.
async function openTooltip(page, position) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
        return Object.keys(usePixiState.getState().pixiState.nodeMap ?? {}).length;
      }),
    )
    .toBeGreaterThan(0);
  // The initial node map is replaced once the startup filters finish.
  await page.waitForTimeout(500);
  await page.evaluate(async (position) => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    const currentNodeIds = new Set(useGraphState.getState().graphState.graph.data.nodes.map((node) => node.id));
    const node = Object.values(usePixiState.getState().pixiState.nodeMap).find((entry) => currentNodeIds.has(entry.node.id)).node;
    const { setTooltipSettings } = useTooltipSettings.getState();
    setTooltipSettings("clickTooltipData", {
      node: node.id,
      nodeAttribs: [...(node.attribs ?? []), "Long annotation ".repeat(30)],
      ...position,
    });
    setTooltipSettings("isClickTooltipActive", true);
  }, position);
  return page.getByRole("dialog", { name: /Node details:/ });
}

async function expectTooltipFits(tooltip) {
  await expectLayoutFits(tooltip);
  const body = tooltip.locator(".tooltip-popup-body");
  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expectLayoutFits(tooltip);
  // The footer and close button must stay visible, even with a scrolling body.
  await expect(tooltip.getByRole("button", { name: "Collapse sidebar" })).toBeInViewport({ ratio: 1 });
  for (const button of await tooltip.locator(".tooltip-popup-footer button").all()) {
    await expect(button).toBeInViewport({ ratio: 1 });
  }
}

async function getStageView(page) {
  return page.evaluate(async () => {
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    const { useContainer } = await import("/src/components/adapters/state/containerState.js");
    const stage = useRenderState.getState().renderState.app?.stage;
    const { width, height } = useContainer.getState().container;
    return stage ? { x: stage.x, y: stage.y, scale: stage.scale.x, width, height } : null;
  });
}

async function expectStageView(page, expected) {
  await expect.poll(async () => {
    const current = await getStageView(page);
    return current && Math.max(
      Math.abs((current.width / 2 - current.x) / current.scale - (expected.width / 2 - expected.x) / expected.scale),
      Math.abs((current.height / 2 - current.y) / current.scale - (expected.height / 2 - expected.y) / expected.scale),
      Math.abs(current.scale - expected.scale),
    );
  }).toBeLessThan(0.01);
}

test.beforeEach(async ({ page }, testInfo) => {
  // Layout checks must not depend on external protein services.
  await page.route("https://rest.uniprot.org/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/");
  await expect(page.locator(".app-shell")).toBeVisible();
  await page.evaluate(async (dark) => {
    const { useTheme, darkTheme, lightTheme } = await import("/src/components/adapters/state/themeState.js");
    useTheme.getState().setTheme(dark ? darkTheme : lightTheme);
  }, testInfo.project.use.colorScheme === "dark");
});

test("Node info shows the RCSB reference when UniProt supplies a PDB ID", async ({ page }) => {
  await page.route("https://rest.uniprot.org/**", (route) => route.fulfill({
    json: { comments: [], uniProtKBCrossReferences: [{ database: "PDB", id: "1ABC" }] },
  }));
  await page.route("https://files.rcsb.org/download/**", (route) => route.fulfill({ status: 404, body: "" }));

  const tooltip = await openTooltip(page, { x: 100, y: 100 });
  const references = tooltip.locator(".tooltip-popup-footer-links");
  await expect(references.getByRole("link", { name: "UniProt" })).toBeVisible();
  await expect(references.getByRole("link", { name: "RCSB PDB" })).toHaveAttribute(
    "href",
    "https://www.rcsb.org/structure/1ABC/",
  );
  await expect(tooltip.locator(".pdb-viewer-status")).toHaveText("3D preview unavailable");
});

for (const corner of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
  test(`Click tooltip: fits at ${corner} in every view`, async ({ page }) => {
    const { width, height } = page.viewportSize();
    const position = { x: corner.endsWith("right") ? width - 20 : 20, y: corner.startsWith("bottom") ? height - 20 : 20 };
    const tooltip = await openTooltip(page, position);
    await expectTooltipFits(tooltip);
    // Node details are docked to the right instead of following the click.
    const box = await tooltip.boundingBox();
    expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.height - height)).toBeLessThanOrEqual(1);

    const views = await tooltip.locator("[data-tooltip-view]").evaluateAll((buttons) => buttons.map((button) => button.dataset.tooltipView));
    expect(views.length).toBeGreaterThan(0);
    for (const view of views) {
      await tooltip.locator(`[data-tooltip-view="${view}"]`).click();
      await expectTooltipFits(tooltip);
      await tooltip.locator('[data-tooltip-view="details"]').click();
      await expectTooltipFits(tooltip);
    }
    await tooltip.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(tooltip).toHaveCount(0);
  });
}

test("Click tooltip: remains on screen when the window shrinks", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const tooltip = await openTooltip(page, { x: 1200, y: 700 });
  await expectTooltipFits(tooltip);
  await page.setViewportSize({ width: 360, height: 600 });
  await expectTooltipFits(tooltip);
});

test("Right rail switches cleanly between mapping, graph statistics, and node details", async ({ page }) => {
  const { width, height } = page.viewportSize();

  await page.getByRole("button", { name: "Open insights sidebar" }).click();
  const mapping = page.getByRole("region", { name: "Color mapping" });
  await expectLayoutFits(mapping);
  await expect(page.locator(".tooltip-popup")).toHaveCount(1);
  await expect(mapping.getByRole("button", { name: "Node info", exact: true })).toBeDisabled();
  await mapping.evaluate((element) => { element.dataset.railInstance = "shared"; });

  await mapping.getByRole("button", { name: "Statistics", exact: true }).click();
  const statistics = page.getByRole("region", { name: "Graph statistics" });
  await expect(mapping).toHaveCount(0);
  await expectLayoutFits(statistics);
  await expect(statistics).toHaveAttribute("data-rail-instance", "shared");
  await statistics.getByRole("button", { name: "Statistics", exact: true }).click();
  await expect(statistics).toBeVisible();

  const statisticsBox = await statistics.boundingBox();
  expect(Math.abs(statisticsBox.x + statisticsBox.width - width)).toBeLessThanOrEqual(1);
  expect(Math.abs(statisticsBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(statisticsBox.height - height)).toBeLessThanOrEqual(1);

  const nodeDetails = await openTooltip(page, { x: 100, y: 100 });
  await expect(statistics).toHaveCount(0);
  await expectTooltipFits(nodeDetails);
  await expect(page.locator(".tooltip-popup")).toHaveCount(1);

  await nodeDetails.getByRole("button", { name: "Mapping", exact: true }).click();
  await expect(nodeDetails).toHaveCount(0);
  await expectLayoutFits(mapping);
  await expect(page.locator(".tooltip-popup")).toHaveCount(1);

  await mapping.getByRole("button", { name: "Node info", exact: true }).click();
  await expect(mapping).toHaveCount(0);
  await expectTooltipFits(nodeDetails);
  await expect(nodeDetails.getByRole("button", { name: "Node info", exact: true })).toHaveAttribute("aria-current", "page");

  await nodeDetails.getByRole("button", { name: "Statistics", exact: true }).click();
  await expectLayoutFits(statistics);
  await page.getByRole("region", { name: "Focused node" }).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(nodeDetails).toHaveCount(0);
  await expectLayoutFits(statistics);
  await expect(statistics.getByRole("button", { name: "Node info", exact: true })).toBeDisabled();
});

test("Community rows open ordered details in the shared right rail", async ({ page }) => {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { useCommunityState } = await import("/src/components/adapters/state/communityState.js");
        return useCommunityState.getState().communityState.communities.length;
      }),
    )
    .toBeGreaterThan(0);

  const menuButton = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("button", { name: /^Communities/ }).click();

  const communityRow = page.locator('.item-table-text[role="button"]').filter({ hasText: "Community" }).first();
  await expect(communityRow).toBeVisible();
  await communityRow.click();

  const panel = page.getByRole("region", { name: /Community \d+ details/ });
  await expectLayoutFits(panel);
  await expect(page.locator(".tooltip-popup")).toHaveCount(1);
  await expect(page.locator(".item-table-details-cell")).toHaveCount(0);
  await expect(panel.locator(".community-details-summary")).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Top node attributes" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Top link attributes" })).toBeVisible();

  await panel.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(panel).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { useCommunityState } = await import("/src/components/adapters/state/communityState.js");
        return useCommunityState.getState().communityState.selectedCommunityId;
      }),
    )
    .toBeNull();
});

test("Node statistics links to a separate community view", async ({ page }) => {
  const tooltip = await openTooltip(page, { x: 100, y: 100 });
  await tooltip.locator('[data-tooltip-view="statistics"]').click();

  await expect(tooltip.locator(".community-details")).toHaveCount(0);
  const communityReference = tooltip.locator(".node-statistics-community");
  await expect(communityReference).toBeVisible();
  await expect(communityReference.getByRole("button")).toHaveCount(0);
  await tooltip.locator(".tooltip-popup-footer").getByRole("button", { name: "community" }).click();

  await expect(tooltip.locator(".node-statistics")).toHaveCount(0);
  await expect(tooltip.locator(".community-details")).toBeVisible();
  await expect(tooltip.locator(".community-attribute-bar")).toHaveCount(0);
  await expectTooltipFits(tooltip);
  await tooltip.locator('[data-tooltip-view="statistics"]').click();
  await expect(communityReference).toBeVisible();
});

test("Selecting a node search result focuses it and opens node details", async ({ page }) => {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
        return Object.keys(usePixiState.getState().pixiState.nodeMap ?? {}).length;
      }),
    )
    .toBeGreaterThan(0);
  await page.waitForTimeout(500);

  const menuButton = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("button", { name: /^Search/ }).click();

  const nodeId = await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useSearchState } = await import("/src/components/adapters/state/searchState.js");
    const node = useGraphState.getState().graphState.graph.data.nodes[0];
    const query = node.id.toLowerCase();
    const current = useSearchState.getState().searchState;
    useSearchState.getState().setAllSearchState({
      ...current,
      nodeSearchValue: query,
      nodeQuery: query,
      linkSearchValue: "",
      linkQuery: "",
    });
    return node.id;
  });

  const result = page.locator('.item-table-text[role="button"]').filter({ hasText: nodeId }).first();
  await expect(result).toBeVisible();
  const previousView = await getStageView(page);
  await result.click();

  await expect(page.getByRole("dialog", { name: /Node details:/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Focused node" })).toBeVisible();
  await expect(page.locator(".item-table-details-cell")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
        const settings = useTooltipSettings.getState().tooltipSettings;
        return { active: settings.isClickTooltipActive, node: settings.clickTooltipData?.node };
      }),
    )
    .toEqual({ active: true, node: nodeId });
  await expect.poll(() => page.evaluate(async () => {
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    return useTooltipSettings.getState().tooltipSettings.isViewFocusActive;
  })).toBe(true);
  await (page.viewportSize().width <= 520
    ? page.getByRole("region", { name: "Focused node" }).getByRole("button", { name: "Clear" }).click()
    : result.click());
  await expect(page.getByRole("region", { name: "Focused node" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: /Node details:/ })).toHaveCount(0);
  await expectStageView(page, previousView);
});

test("Selecting a link search result focuses it and a second click restores the view", async ({ page }) => {
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    return useGraphState.getState().graphState.graph?.data?.links?.length ?? 0;
  })).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  const menuButton = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("button", { name: /^Search/ }).click();
  await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useSearchState } = await import("/src/components/adapters/state/searchState.js");
    const query = useGraphState.getState().graphState.graph.data.links[0].attrib.toLowerCase();
    const current = useSearchState.getState().searchState;
    useSearchState.getState().setAllSearchState({ ...current, linkSearchValue: query, linkQuery: query });
  });
  const result = page.locator('.item-table-text[role="button"]').first();
  await expect(result).toBeVisible();
  const previousView = await getStageView(page);
  await result.click();
  const focusBar = page.getByRole("region", { name: "Focused link" });
  await expect(focusBar).toBeVisible();
  const expectedNames = await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useSearchState } = await import("/src/components/adapters/state/searchState.js");
    const { getNodeIdName } = await import("/src/components/domain/service/parsing/nodeIdParsing.js");
    const { getEndpointIdText } = await import("/src/components/domain/service/graph_calculations/graphUtils.js");
    const { matchingLinks, selectedLinkId } = useSearchState.getState().searchState;
    const entry = matchingLinks.find(({ linkId }) => linkId === selectedLinkId);
    const nodeById = new Map(useGraphState.getState().graphState.graph.data.nodes.map((node) => [String(node.id), node]));
    const name = (id) => nodeById.get(String(id))?.name || nodeById.get(String(id))?.label || getNodeIdName(id) || id || "Unknown";
    return `${name(entry.sourceId ?? getEndpointIdText(entry.link.source))} ↔ ${name(entry.targetId ?? getEndpointIdText(entry.link.target))}`;
  });
  await expect(focusBar.locator(".node-focus-name")).toHaveText(expectedNames);
  await expect(page.getByRole("button", { name: "Focus view" })).toHaveCount(0);
  await expect.poll(() => page.evaluate(async () => {
    const { useSearchState } = await import("/src/components/adapters/state/searchState.js");
    return useSearchState.getState().searchState.selectedLinkId;
  })).not.toBeNull();
  await focusBar.getByRole("button", { name: "Focus: on" }).click();
  await expect(focusBar.getByRole("button", { name: "Focus: off" })).toBeVisible();
  await expectStageView(page, previousView);
  await focusBar.getByRole("button", { name: "Focus: off" }).click();
  await expect(focusBar.getByRole("button", { name: "Focus: on" })).toBeVisible();
  await result.click();
  await expect(page.getByRole("region", { name: "Focused link" })).toHaveCount(0);
  await expectStageView(page, previousView);
  await result.click();
  await focusBar.getByRole("button", { name: "Clear" }).click();
  await expect(focusBar).toHaveCount(0);
  await expectStageView(page, previousView);
});

test("Only one compact bar appears when node, link, and community selections coexist", async ({ page }) => {
  await expect.poll(() => page.evaluate(async () => {
    const { useCommunityState } = await import("/src/components/adapters/state/communityState.js");
    return useCommunityState.getState().communityState.communities.length;
  })).toBeGreaterThan(0);
  await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useSearchState } = await import("/src/components/adapters/state/searchState.js");
    const { useCommunityState } = await import("/src/components/adapters/state/communityState.js");
    const { getEndpointIdText, getLinkIdText } = await import("/src/components/domain/service/graph_calculations/graphUtils.js");
    const link = useGraphState.getState().graphState.graph.data.links[0];
    const entry = {
      link,
      linkId: getLinkIdText(link, 0),
      sourceId: getEndpointIdText(link.source),
      targetId: getEndpointIdText(link.target),
    };
    const search = useSearchState.getState().searchState;
    useSearchState.getState().setAllSearchState({ ...search, matchingLinks: [entry], selectedLinkId: entry.linkId });
    const community = useCommunityState.getState().communityState.communities[0];
    useCommunityState.getState().setCommunityState("selectedCommunityId", String(community.id));
  });
  await expect(page.locator(".node-focus-bar")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Focused link" })).toBeVisible();

  await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    const node = useGraphState.getState().graphState.graph.data.nodes[0];
    useTooltipSettings.getState().setTooltipSettings("clickTooltipData", { node: node.id, nodeAttribs: node.attribs ?? [] });
    useTooltipSettings.getState().setTooltipSettings("isNodeFocusOnly", true);
  });
  await expect(page.locator(".node-focus-bar")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Focused node" })).toBeVisible();

  await page.getByRole("region", { name: "Focused node" }).getByRole("button", { name: "Clear" }).click();
  await expect(page.locator(".node-focus-bar")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Focused link" })).toBeVisible();

  await page.getByRole("region", { name: "Focused link" }).getByRole("button", { name: "Clear" }).click();
  await expect(page.locator(".node-focus-bar")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Focused community" })).toBeVisible();
  await page.getByRole("region", { name: "Focused community" }).getByRole("button", { name: "Clear" }).click();
  await expect(page.locator(".node-focus-bar")).toHaveCount(0);
});

test("Selecting a community focuses it and a second click restores the view", async ({ page }) => {
  await expect.poll(() => page.evaluate(async () => {
    const { useCommunityState } = await import("/src/components/adapters/state/communityState.js");
    return useCommunityState.getState().communityState.communities.length;
  })).toBeGreaterThan(0);
  const menuButton = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("button", { name: /^Communities/ }).click();
  const result = page.locator('.item-table-text[role="button"]').filter({ hasText: "Community" }).first();
  await expect(result).toBeVisible();
  const previousView = await getStageView(page);
  await result.click();
  const focusBar = page.getByRole("region", { name: "Focused community" });
  await expect(focusBar).toBeVisible();
  await focusBar.getByRole("button", { name: "Focus: on" }).click();
  await expect(focusBar.getByRole("button", { name: "Focus: off" })).toBeVisible();
  await expectStageView(page, previousView);
  await focusBar.getByRole("button", { name: "Focus: off" }).click();
  await expect(focusBar.getByRole("button", { name: "Focus: on" })).toBeVisible();
  if (page.viewportSize().width <= 520) await page.keyboard.press("Escape");
  else await result.click();
  await expect(page.getByRole("region", { name: "Focused community" })).toHaveCount(0);
  await expectStageView(page, previousView);
  await result.click();
  await focusBar.getByRole("button", { name: "Clear" }).click();
  await expect(focusBar).toHaveCount(0);
  await expectStageView(page, previousView);
});

test("Switching from a focused link to a community restores the original view when cleared", async ({ page }) => {
  await expect.poll(() => page.evaluate(async () => {
    const { useCommunityState } = await import("/src/components/adapters/state/communityState.js");
    return useCommunityState.getState().communityState.communities.length;
  })).toBeGreaterThan(0);
  const menuButton = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("button", { name: /^Search/ }).click();
  await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useSearchState } = await import("/src/components/adapters/state/searchState.js");
    const query = useGraphState.getState().graphState.graph.data.links[0].attrib.toLowerCase();
    const current = useSearchState.getState().searchState;
    useSearchState.getState().setAllSearchState({ ...current, linkSearchValue: query, linkQuery: query });
  });
  const linkResult = page.locator('.item-table-text[role="button"]').first();
  await expect(linkResult).toBeVisible();
  const previousView = await getStageView(page);
  await linkResult.click();
  await expect(page.getByRole("region", { name: "Focused link" })).toBeVisible();

  await page.getByRole("button", { name: "Back to tool list" }).click();
  await page.getByRole("button", { name: /^Communities/ }).click();
  const communityResult = page.locator('.item-table-text[role="button"]').filter({ hasText: "Community" }).first();
  await communityResult.click();
  await expect(page.getByRole("region", { name: "Focused link" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Focused community" })).toBeVisible();
  if (page.viewportSize().width <= 520) await page.keyboard.press("Escape");
  else await communityResult.click();
  await expectStageView(page, previousView);
});

test("Node clicks preserve open details and previous-node navigation", async ({ page }) => {
  const tooltip = await openTooltip(page, { x: 100, y: 100 });
  const clickedNodeId = await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
    const currentNodeIds = new Set(useGraphState.getState().graphState.graph.data.nodes.map((node) => node.id));
    const circles = Object.values(usePixiState.getState().pixiState.nodeMap)
      .filter((entry) => currentNodeIds.has(entry.node.id))
      .map((entry) => entry.circle);
    const circle = circles[1] ?? circles[0];
    circle.emit("click", { originalEvent: { clientX: 100, clientY: 100 } });
    return Object.values(usePixiState.getState().pixiState.nodeMap).find((entry) => entry.circle === circle).node.id;
  });
  await expect(tooltip).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    const settings = useTooltipSettings.getState().tooltipSettings;
    return { active: settings.isClickTooltipActive, node: settings.clickTooltipData?.node };
  })).toEqual({ active: true, node: clickedNodeId });

  const focusBar = page.getByRole("region", { name: "Focused node" });
  await expectLayoutFits(focusBar);
  await expect.poll(async () => {
    const focusButton = await focusBar.locator(".sidebar-footer-action").first().boundingBox();
    const sidebarButton = await tooltip.locator(".sidebar-footer-action").first().boundingBox();
    return Math.abs(focusButton.height - sidebarButton.height);
  }).toBeLessThan(0.5);
  const compactBarBox = await focusBar.boundingBox();
  const compactButtonBox = await focusBar.locator(".sidebar-footer-action").first().boundingBox();
  expect(compactBarBox.height - compactButtonBox.height).toBeLessThan(10);
  expect(Math.abs(compactBarBox.y + compactBarBox.height - page.viewportSize().height)).toBeLessThanOrEqual(1);
  const focusName = focusBar.locator(".node-focus-name");
  await focusName.evaluate((element) => { element.textContent = "A"; });
  const shortNameWidth = (await focusBar.boundingBox()).width;
  await focusName.evaluate((element) => { element.textContent = "A much longer focused node display name that expands the compact bar"; });
  const longNameWidth = (await focusBar.boundingBox()).width;
  expect(longNameWidth).toBeGreaterThan(shortNameWidth);
  expect(longNameWidth).toBeLessThanOrEqual(page.viewportSize().width - 8);
  await focusBar.getByRole("button", { name: "Previous", exact: true }).click();
  await expectLayoutFits(focusBar);
  await focusBar.getByRole("button", { name: "Hide details", exact: true }).click();
  await expect(tooltip).toHaveCount(0);
  await focusBar.getByRole("button", { name: "Details", exact: true }).click();
  await expectTooltipFits(tooltip);
  await expectLayoutFits(focusBar);
  await tooltip.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(tooltip).toHaveCount(0);
  await expect(focusBar).toBeVisible();
  await focusBar.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(focusBar).toHaveCount(0);
});
