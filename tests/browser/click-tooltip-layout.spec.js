import { test, expect } from "@playwright/test";
import { expectLayoutFits } from "./layout-checks.js";

// Use the real app and graph. Set the click position explicitly so layout tests
// don't depend on where the moving canvas happens to draw a node.
async function openTooltip(page, position) {
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    return useGraphState.getState().graphState.graph?.data?.nodes?.length ?? 0;
  })).toBeGreaterThan(0);
  await page.evaluate(async (position) => {
    const { useGraphState } = await import("/src/components/adapters/state/graphState.js");
    const { useTooltipSettings } = await import("/src/components/adapters/state/tooltipState.js");
    const node = useGraphState.getState().graphState.graph.data.nodes[0];
    const { setTooltipSettings } = useTooltipSettings.getState();
    setTooltipSettings("clickTooltipData", {
      node: node.id,
      nodeAttribs: [...(node.attribs ?? []), "Long annotation ".repeat(30)],
      ...position,
    });
    setTooltipSettings("isClickTooltipActive", true);
  }, position);
  return page.locator(".tooltip-popup");
}

async function expectTooltipFits(tooltip) {
  await expectLayoutFits(tooltip);
  const body = tooltip.locator(".tooltip-popup-body");
  await body.evaluate((element) => { element.scrollTop = element.scrollHeight; });
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
    // It should open beside the click, flipping to the left near the right edge.
    const box = await tooltip.boundingBox();
    if (corner.endsWith("right")) expect(box.x + box.width).toBeLessThan(position.x);
    else if (position.x + box.width + 14 <= width - 8) expect(box.x).toBeGreaterThan(position.x);
    if (corner.startsWith("bottom")) expect(box.y + box.height).toBeLessThanOrEqual(position.y + 1);
    else expect(Math.abs(box.y - position.y)).toBeLessThanOrEqual(1);

    const views = await tooltip.locator("[data-tooltip-view]").evaluateAll(
      (buttons) => buttons.map((button) => button.dataset.tooltipView),
    );
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
