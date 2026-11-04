import { expect, test } from "@playwright/test";

test("video preview keeps its sidebar controls available for cancellation", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    return Boolean(useGraphState.getState().graphState.graph && useRenderState.getState().renderState.app);
  })).toBe(true);

  const menu = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menu.isVisible()) await menu.click();
  await page.locator(".nav-link").filter({ has: page.getByText("Videography", { exact: true }) }).click();

  const sidebar = page.locator("#app-sidebar");
  const add = sidebar.getByRole("button", { name: "Add Keyframe" });
  await expect(add).toBeEnabled();
  await add.click();
  await add.click();
  await sidebar.getByRole("button", { name: "Preview", exact: true }).click();

  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Cancel Preview" })).toBeVisible();
  await expect(page.locator('canvas[data-video-preview-graph="true"]')).toBeVisible();
  await sidebar.getByRole("button", { name: "Cancel Preview" }).click();
  await expect(page.locator('canvas[data-video-preview-graph="true"]')).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: "Preview", exact: true })).toBeEnabled();
});

test("captured node information uses the right panel without its top navigation", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => page.evaluate(async () => {
    const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
    return Object.keys(usePixiState.getState().pixiState.nodeMap ?? {}).length;
  })).toBeGreaterThan(0);
  await page.waitForTimeout(500);

  await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    const nodeIds = new Set(useGraphState.getState().graphState.graph.data.nodes.map((node) => node.id));
    const node = Object.values(usePixiState.getState().pixiState.nodeMap).find((entry) => nodeIds.has(entry.node.id)).node;
    useTooltipSettings.getState().setAllTooltipSettings({
      isClickTooltipActive: true,
      clickTooltipData: { node: node.id, nodeAttribs: node.attribs ?? [], x: 100, y: 100 },
    });
  });

  const panel = page.locator(".tooltip-popup.node-details-side-panel");
  await expect(panel).toBeVisible();
  const regularWidth = (await panel.boundingBox()).width;
  await panel.evaluate((element) => {
    element.classList.add("tooltip-popup--videography-capture");
    element.style.left = "0px";
  });
  await expect(panel.locator(".tooltip-popup-navigation")).toBeHidden();
  const capturedBox = await panel.boundingBox();
  expect(Math.abs(capturedBox.width - regularWidth)).toBeLessThanOrEqual(1);
  expect(Math.abs(capturedBox.height - page.viewportSize().height)).toBeLessThanOrEqual(1);
});

test("preview starts promptly and shows the real node information sidebar", async ({ page }) => {
  await page.route("https://rest.uniprot.org/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route("https://files.rcsb.org/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/");
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
    const graph = useGraphState.getState().graphState.graph?.data;
    const nodeMap = usePixiState.getState().pixiState.nodeMap;
    return graph?.nodes?.some((node) => nodeMap?.[node.id]?.circle);
  })).toBe(true);
  await page.waitForTimeout(500);

  const menu = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await menu.isVisible()) await menu.click();
  await page.locator(".nav-link").filter({ has: page.getByText("Videography", { exact: true }) }).click();
  const sidebar = page.locator("#app-sidebar");
  await page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { usePixiState } = await import("/src/components/adapters/state/pixiState.js");
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    const nodeMap = usePixiState.getState().pixiState.nodeMap;
    const node = useGraphState.getState().graphState.graph.data.nodes.find((entry) => nodeMap?.[entry.id]?.circle);
    useTooltipSettings.getState().setAllTooltipSettings({
      isClickTooltipActive: true,
      clickTooltipData: { node: node.id, nodeAttribs: node.attribs ?? [], x: 100, y: 100 },
    });
  });
  await expect(page.locator(".tooltip-popup.node-details-side-panel")).toBeVisible();
  await sidebar.getByRole("button", { name: "Add Keyframe" }).click();
  await page.evaluate(async () => {
    const { tooltipInit, useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    useTooltipSettings.getState().setAllTooltipSettings({ ...tooltipInit });
  });
  await sidebar.getByRole("button", { name: "Add Keyframe" }).click();
  await sidebar.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator('canvas[data-video-preview-graph="true"]')).toBeVisible({ timeout: 4000 });
  const panel = page.locator(".tooltip-popup.node-details-side-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".tooltip-popup-navigation")).toBeHidden();
  await expect(page.locator('canvas[data-video-preview-panel="true"]')).toHaveCount(0);
  await sidebar.getByRole("button", { name: "Cancel Preview" }).click();
  await expect(panel).toHaveCount(0);
});
