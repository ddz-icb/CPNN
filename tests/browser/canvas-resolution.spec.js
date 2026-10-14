import { expect, test } from "@playwright/test";

test("settled graph does not keep rendering", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".canvas canvas")).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphFlags } = await import("/src/components/adapters/state/graphFlagsState.js");
    return useGraphFlags.getState().graphFlags.filteredAfterStart;
  })).toBe(true);
  await expect.poll(() => page.evaluate(async () => {
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    const simulation = useRenderState.getState().renderState.simulation;
    return simulation ? simulation.alpha() - simulation.alphaMin() : Infinity;
  }), { timeout: 10000 }).toBeLessThan(0);

  const initialState = await page.evaluate(async () => {
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    const { app } = useRenderState.getState().renderState;
    return { tickerRunning: app.ticker.started };
  });
  expect(initialState.tickerRunning).toBe(false);

  await page.waitForTimeout(100);
  await page.evaluate(async () => {
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    const app = useRenderState.getState().renderState.app;
    const render = app.renderer.render.bind(app.renderer);
    window.__idleRenderCount = 0;
    app.renderer.render = (...args) => {
      window.__idleRenderCount += 1;
      return render(...args);
    };
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__idleRenderCount)).toBeLessThanOrEqual(1);
});

test("appearance and highlights redraw after the graph settles", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".canvas canvas")).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphFlags } = await import("/src/components/adapters/state/graphFlagsState.js");
    return useGraphFlags.getState().graphFlags.filteredAfterStart;
  })).toBe(true);

  await page.evaluate(async () => {
    const { useRenderState } = await import("/src/components/adapters/state/canvasState.js");
    const app = useRenderState.getState().renderState.app;
    useRenderState.getState().renderState.simulation.stop();
    const render = app.renderer.render.bind(app.renderer);
    window.__userActionRenders = 0;
    app.renderer.render = (...args) => {
      window.__userActionRenders += 1;
      return render(...args);
    };
    const { useAppearance } = await import("/src/components/adapters/state/appearanceState.js");
    useAppearance.getState().setAppearance("showNodeLabels", false);
  });
  await expect.poll(() => page.evaluate(() => window.__userActionRenders)).toBeGreaterThan(0);

  const previousRenders = await page.evaluate(() => window.__userActionRenders);
  await page.evaluate(async () => {
    const [{ useGraphState }, { useSearchState }] = await Promise.all([
      import("/src/components/adapters/state/graphState.js"),
      import("/src/components/adapters/state/searchState.js"),
    ]);
    const nodeId = useGraphState.getState().graphState.graph.data.nodes[0].id;
    useSearchState.getState().setSearchState("highlightedNodeIds", [nodeId]);
  });
  await expect.poll(() => page.evaluate(() => window.__userActionRenders)).toBeGreaterThan(previousRenders);
});

test("lasso preview redraws without the automatic ticker", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator(".canvas canvas");
  await expect(canvas).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const { useGraphFlags } = await import("/src/components/adapters/state/graphFlagsState.js");
    return useGraphFlags.getState().graphFlags.filteredAfterStart;
  })).toBe(true);
  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();

  await page.evaluate(async () => {
    const [{ useRenderState }, { useFilter }] = await Promise.all([
      import("/src/components/adapters/state/canvasState.js"),
      import("/src/components/adapters/state/filterState.js"),
    ]);
    const { simulation, app } = useRenderState.getState().renderState;
    simulation.stop();
    useFilter.getState().setFilter("lasso", true);
    const render = app.renderer.render.bind(app.renderer);
    window.__lassoRenders = 0;
    app.renderer.render = (...args) => {
      window.__lassoRenders += 1;
      return render(...args);
    };
  });
  await expect.poll(() => canvas.evaluate((element) => element.style.cursor)).toBe("crosshair");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 60);
  await expect.poll(() => page.evaluate(() => window.__lassoRenders)).toBeGreaterThan(0);
  await page.mouse.up();
});

test("canvas backing resolution follows browser pixel ratio changes", async ({ page, context }) => {
  await page.goto("/");
  const canvas = page.locator(".canvas canvas");
  await expect(canvas).toBeVisible();
  const initialPixelRatio = await page.evaluate(() => window.devicePixelRatio);
  const nextPixelRatio = initialPixelRatio === 2 ? 1.5 : 2;
  await expect.poll(() => canvas.evaluate((element) =>
    Math.abs(element.width / element.clientWidth - window.devicePixelRatio))).toBeLessThan(0.1);

  const session = await context.newCDPSession(page);
  const viewport = page.viewportSize();
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: nextPixelRatio,
    mobile: false,
  });

  await expect.poll(() => page.evaluate(() => window.devicePixelRatio)).toBe(nextPixelRatio);
  await expect.poll(() => canvas.evaluate((element) =>
    Math.abs(element.width / element.clientWidth - window.devicePixelRatio))).toBeLessThan(0.1);
});

test("canvas backing resolution follows pinch zoom", async ({ page, context }) => {
  await page.goto("/");
  const canvas = page.locator(".canvas canvas");
  await expect(canvas).toBeVisible();

  const session = await context.newCDPSession(page);
  await session.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1.5 });
  await expect.poll(() => page.evaluate(() => window.visualViewport?.scale)).toBeCloseTo(1.5, 1);
  await expect.poll(() => canvas.evaluate((element) =>
    Math.abs(element.width / element.getBoundingClientRect().width - window.devicePixelRatio * window.visualViewport.scale))).toBeLessThan(0.1);
});

test("canvas and node centering follow both sidebar widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Desktop sidebar layout");
  await page.goto("/");
  await expect(page.locator(".canvas canvas")).toBeVisible();

  const readView = () => page.evaluate(async () => {
    const [{ useContainer }, { useRenderState }, { useGraphState }, { useGraphFlags }, { useAppearance }, { centerOnNode }] = await Promise.all([
      import("/src/components/adapters/state/containerState.js"),
      import("/src/components/adapters/state/canvasState.js"),
      import("/src/components/adapters/state/graphState.js"),
      import("/src/components/adapters/state/graphFlagsState.js"),
      import("/src/components/adapters/state/appearanceState.js"),
      import("/src/components/domain/service/canvas_interaction/centerView.js"),
    ]);
    const container = useContainer.getState().container;
    const renderState = useRenderState.getState().renderState;
    const graph = useGraphState.getState().graphState.graph;
    const ready = useGraphFlags.getState().graphFlags.filteredAfterStart;
    const appearance = useAppearance.getState().appearance;
    const node = graph?.data?.nodes?.[0];
    if (ready) renderState.simulation?.stop();
    if (ready && node && renderState.app && !window.__canvasCenterTestStarted) {
      centerOnNode(node, { appearance, renderState, container });
      window.__canvasCenterTestStarted = true;
    }
    const canvas = document.querySelector(".canvas").getBoundingClientRect();
    const sidebar = document.querySelector("#app-sidebar")?.getBoundingClientRect();
    const rightSidebar = document.querySelector(".right-sidebar")?.getBoundingClientRect();
    return {
      canvasLeft: canvas.left, canvasWidth: canvas.width, sidebarRight: sidebar?.right ?? 0,
      canvasRight: canvas.right, rightSidebarLeft: rightSidebar?.left ?? null,
      storedWidth: container.width,
      nodeOffset: ready && node && renderState.app
        ? node.x * renderState.app.stage.scale.x + renderState.app.stage.x - canvas.width / 2
        : null,
    };
  });

  await expect.poll(async () => (await readView()).nodeOffset).not.toBeNull();
  await expect.poll(async () => Math.abs((await readView()).nodeOffset)).toBeLessThan(2);
  await expect.poll(async () => {
    const view = await readView();
    return Math.abs(view.canvasLeft - view.sidebarRight) + Math.abs(view.canvasWidth - view.storedWidth);
  }).toBeLessThan(2);

  await page.locator(".nav-link").filter({ has: page.getByText("Filter", { exact: true }) }).click();
  const handle = page.getByRole("separator", { name: "Resize left sidebar" });
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 50, handleBox.y + handleBox.height / 2);
  await page.mouse.up();

  await expect.poll(async () => {
    const view = await readView();
    return Math.abs(view.canvasLeft - view.sidebarRight) + Math.abs(view.canvasWidth - view.storedWidth);
  }).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await readView()).nodeOffset)).toBeLessThan(2);

  await page.getByRole("button", { name: "Open insights sidebar" }).click();
  await expect.poll(async () => {
    const view = await readView();
    return Math.abs(view.canvasRight - view.rightSidebarLeft) + Math.abs(view.canvasWidth - view.storedWidth);
  }).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await readView()).nodeOffset)).toBeLessThan(2);

  const rightHandle = page.getByRole("separator", { name: "Resize right sidebar" });
  const rightBox = await rightHandle.boundingBox();
  await page.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rightBox.x - 40, rightBox.y + rightBox.height / 2);
  await page.mouse.up();
  await expect.poll(async () => {
    const view = await readView();
    return Math.abs(view.canvasRight - view.rightSidebarLeft) + Math.abs(view.canvasWidth - view.storedWidth);
  }).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await readView()).nodeOffset)).toBeLessThan(2);

  await page.evaluate(async () => {
    const { useAppearance } = await import("/src/components/adapters/state/appearanceState.js");
    useAppearance.getState().setAppearance("threeD", true);
  });
  const read3D = () => page.evaluate(async () => {
    const [{ useContainer }, { useRenderState }, { useGraphState }, { useAppearance }, { centerOnNode }] = await Promise.all([
      import("/src/components/adapters/state/containerState.js"),
      import("/src/components/adapters/state/canvasState.js"),
      import("/src/components/adapters/state/graphState.js"),
      import("/src/components/adapters/state/appearanceState.js"),
      import("/src/components/domain/service/canvas_interaction/centerView.js"),
    ]);
    const container = useContainer.getState().container;
    const renderState = useRenderState.getState().renderState;
    const appearance = useAppearance.getState().appearance;
    const node = useGraphState.getState().graphState.graph?.data?.nodes?.[0];
    if (!appearance.threeD || !appearance.cameraRef?.current?.redraw || !node) return null;
    renderState.simulation?.stop();
    if (!window.__canvas3DCenterTestStarted) {
      centerOnNode(node, { appearance, renderState, container });
      window.__canvas3DCenterTestStarted = true;
    }
    return {
      offset: appearance.cameraRef.current.projections?.[node.id]?.x - container.width / 2,
      width: container.width,
    };
  });
  await expect.poll(async () => Math.abs((await read3D())?.offset ?? Infinity)).toBeLessThan(2);

  const nextRightBox = await rightHandle.boundingBox();
  await page.mouse.move(nextRightBox.x + nextRightBox.width / 2, nextRightBox.y + nextRightBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(nextRightBox.x - 30, nextRightBox.y + nextRightBox.height / 2);
  await page.mouse.up();
  await expect.poll(async () => Math.abs((await read3D())?.offset ?? Infinity)).toBeLessThan(2);

  await page.getByRole("region", { name: "Color mapping" }).getByRole("button", { name: "Collapse sidebar" }).click();
  await expect.poll(async () => Math.abs((await readView()).canvasRight - page.viewportSize().width)).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await read3D())?.offset ?? Infinity)).toBeLessThan(2);

  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();
  await expect.poll(async () => Math.abs((await readView()).canvasLeft)).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await read3D())?.offset ?? Infinity)).toBeLessThan(2);
});
