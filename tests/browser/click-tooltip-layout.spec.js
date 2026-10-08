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
  await expect(tooltip.getByRole("button", { name: "Close tooltip" })).toBeInViewport({ ratio: 1 });
  for (const button of await tooltip.locator(".tooltip-popup-footer button").all()) {
    await expect(button).toBeInViewport({ ratio: 1 });
  }
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
    await tooltip.getByRole("button", { name: "Close tooltip" }).click();
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

  await panel.getByRole("button", { name: "Close tooltip" }).click();
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
  await focusBar.getByRole("button", { name: "Previous", exact: true }).click();
  await expectLayoutFits(focusBar);
  await focusBar.getByRole("button", { name: "Hide details", exact: true }).click();
  await expect(tooltip).toHaveCount(0);
  await focusBar.getByRole("button", { name: "Details", exact: true }).click();
  await expectTooltipFits(tooltip);
  await expectLayoutFits(focusBar);
  await tooltip.getByRole("button", { name: "Close tooltip" }).click();
  await expect(tooltip).toHaveCount(0);
  await expect(focusBar).toBeVisible();
  await focusBar.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(focusBar).toHaveCount(0);
});
