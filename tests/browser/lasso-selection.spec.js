import { expect, test } from "@playwright/test";

async function graphNodeCount(page) {
  return page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    return useGraphState.getState().graphState.graph.data.nodes.length;
  });
}

test("lasso selection filters the graph and can be cleared", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".canvas canvas");
  await expect(canvas).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphFlags } = await import("/src/components/adapters/state/graphFlagsState.js");
    return useGraphFlags.getState().graphFlags.filteredAfterStart;
  })).toBe(true);
  const originalNodeCount = await graphNodeCount(page);

  await page.locator("#app-sidebar").getByRole("button", { name: /Filter/ }).click();
  await page.getByRole("button", { name: "Draw Lasso" }).click();
  await expect.poll(() => canvas.evaluate((element) => element.style.cursor)).toBe("crosshair");
  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();
  await expect.poll(() => page.evaluate(async () => {
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    const simulation = useRenderState.getState().renderState.simulation;
    return simulation ? simulation.alpha() - simulation.alphaMin() : Infinity;
  }), { timeout: 10000 }).toBeLessThan(0);

  // Find a node in the clear part of the canvas, away from the sidebar tabs.
  const target = await page.evaluate(async () => {
    const [{ usePixiState }, { useRenderState }] = await Promise.all([
      import("/src/components/adapters/state/pixiState.js"),
      import("/src/components/adapters/state/canvasState.js"),
    ]);
    const app = useRenderState.getState().renderState.app;
    const rect = app.renderer.canvas.getBoundingClientRect();
    for (const { circle } of Object.values(usePixiState.getState().pixiState.nodeMap)) {
      if (!circle || circle.visible === false) continue;
      const position = circle.getGlobalPosition();
      const x = rect.left + position.x * rect.width / app.renderer.screen.width;
      const y = rect.top + position.y * rect.height / app.renderer.screen.height;
      if (x > rect.left + 70 && x < rect.right - 70 && y > rect.top + 70 && y < rect.bottom - 70) {
        return { x, y };
      }
    }
    return null;
  });
  expect(target).not.toBeNull();

  const size = 24;
  await page.mouse.move(target.x - size, target.y - size);
  await page.mouse.down();
  await page.mouse.move(target.x + size, target.y - size);
  await page.mouse.move(target.x + size, target.y + size);
  await page.mouse.move(target.x - size, target.y + size);
  await page.mouse.up();

  await page.getByRole("button", { name: "Open Filter sidebar" }).click();
  await expect(page.getByRole("button", { name: "Clear Lasso Selection" })).toBeVisible();
  await expect.poll(() => graphNodeCount(page)).toBeLessThan(originalNodeCount);

  await page.getByRole("button", { name: "Clear Lasso Selection" }).click();
  await expect.poll(() => graphNodeCount(page)).toBe(originalNodeCount);
});
