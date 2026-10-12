import { test, expect } from "@playwright/test";
import { SIDEBAR_SECTIONS } from "../../src/components/adapters/config/sidebarConfig.js";
import { expectLayoutFits } from "./layout-checks.js";

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toBeVisible();
  const openMenu = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await openMenu.isVisible()) await openMenu.click();
  if (testInfo.project.use.colorScheme === "dark") {
    await page.locator(".nav-link").filter({ has: page.getByText("Appearance", { exact: true }) }).click();
    const darkMode = page.locator(".block-section").filter({ has: page.getByText("Dark Appearance", { exact: true }) });
    if (!(await darkMode.locator("input").isChecked())) await darkMode.locator(".switch").click();
    await expect(page.locator("body")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Back to tool list" }).click();
  }
});

// Exercise the real app, rather than a fixture for one particular component.
for (const { key: section } of SIDEBAR_SECTIONS) {
  test(`${section}: panel and text fit the screen`, async ({ page }) => {
    await page.locator(".nav-link").filter({ has: page.getByText(section, { exact: true }) }).click();
    const sidebar = page.locator("#app-sidebar");
    await expectLayoutFits(sidebar);
    await sidebar.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expectLayoutFits(sidebar);
  });
}

// Discover popup triggers in each section, including newly added help dialogs.
for (const { key: section } of SIDEBAR_SECTIONS) {
  test(`${section}: popups fit and close consistently`, async ({ page }) => {
    await page.locator(".nav-link").filter({ has: page.getByText(section, { exact: true }) }).click();
    const triggers = page.locator('#app-sidebar button[aria-haspopup="dialog"]');
    for (const trigger of await triggers.all()) {
      if (!(await trigger.isVisible()) || !(await trigger.isEnabled())) continue;
      const name = await trigger.getAttribute("aria-label") || await trigger.innerText();
      await test.step(name, async () => {
        const dialog = page.getByRole("dialog");
        for (const closeWith of ["button", "Escape", "backdrop"]) {
          await trigger.click();
          await expectLayoutFits(dialog);
          await dialog.evaluate((element) => { element.scrollTop = element.scrollHeight; });
          await expectLayoutFits(dialog);
          await dialog.locator(".popup-heading").click();
          await expect(dialog).toBeVisible();
          if (closeWith === "button") await dialog.getByRole("button", { name: "Close popup" }).click();
          if (closeWith === "Escape") await page.keyboard.press("Escape");
          if (closeWith === "backdrop") await page.locator(".popup-overlay").click({ position: { x: 2, y: 2 } });
          await expect(dialog).toHaveCount(0);
        }
      });
    }
  });
}

test("Insights sidebar views fit and close consistently", async ({ page }) => {
  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();
  await page.getByRole("button", { name: "Open insights sidebar" }).click();

  const mapping = page.getByRole("region", { name: "Color mapping" });
  await expectLayoutFits(mapping);
  await mapping.getByRole("button", { name: "Statistics" }).click();

  const statistics = page.getByRole("region", { name: "Graph statistics" });
  await expectLayoutFits(statistics);
  await page.keyboard.press("Escape");
  await expect(statistics).toHaveCount(0);

  await page.getByRole("button", { name: "Open insights sidebar" }).click();
  await mapping.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(mapping).toHaveCount(0);
});

test("Closed sidebars expose centered screen-edge tabs", async ({ page }) => {
  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();

  const leftTab = page.getByRole("button", { name: "Open Menu sidebar" });
  const rightTab = page.getByRole("button", { name: "Open insights sidebar" });
  await expect(leftTab.getByText("Menu", { exact: true })).toBeVisible();
  await expect(rightTab.getByText("Insights", { exact: true })).toBeVisible();
  const [leftBox, rightBox] = await Promise.all([leftTab.boundingBox(), rightTab.boundingBox()]);
  const [leftArrowBox, leftLabelBox, rightArrowBox, rightLabelBox] = await Promise.all([
    leftTab.locator(".sidebar-edge-tab-arrow").boundingBox(),
    leftTab.locator(".sidebar-edge-tab-label").boundingBox(),
    rightTab.locator(".sidebar-edge-tab-arrow").boundingBox(),
    rightTab.locator(".sidebar-edge-tab-label").boundingBox(),
  ]);
  const viewport = page.viewportSize();

  expect(leftArrowBox.x).toBeGreaterThanOrEqual(leftLabelBox.x + leftLabelBox.width - 2);
  expect(rightArrowBox.x + rightArrowBox.width).toBeLessThanOrEqual(rightLabelBox.x + 2);
  expect(Math.abs(leftArrowBox.y + leftArrowBox.height / 2 - (leftLabelBox.y + leftLabelBox.height / 2))).toBeLessThanOrEqual(1);
  expect(Math.abs(rightArrowBox.y + rightArrowBox.height / 2 - (rightLabelBox.y + rightLabelBox.height / 2))).toBeLessThanOrEqual(1);
  expect(Math.abs(leftBox.width - rightBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(leftBox.height - rightBox.height)).toBeLessThanOrEqual(1);
  expect(leftBox.x).toBeLessThanOrEqual(1);
  expect(Math.abs(rightBox.x + rightBox.width - viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(leftBox.y + leftBox.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(rightBox.y + rightBox.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);

  await page.addStyleTag({ content: ".sidebar-edge-tab svg { transition: none !important; }" });
  for (const tab of [leftTab, rightTab]) {
    const arrow = tab.locator(".sidebar-edge-tab-arrow");
    const svg = arrow.locator("svg");
    const [background, fill] = await Promise.all([
      arrow.evaluate((element) => getComputedStyle(element).backgroundColor),
      svg.evaluate((element) => getComputedStyle(element).fill),
    ]);
    await tab.hover();
    await expect(arrow).toHaveCSS("background-color", background);
    await expect(svg).toHaveCSS("fill", fill);
  }

  await leftTab.click();
  await expect(page.locator("#app-sidebar")).toBeVisible();
  await rightTab.click();
  await expect(page.getByRole("region", { name: "Color mapping" })).toBeVisible();
});

test("Closed sidebar tab fits longer section names", async ({ page }) => {
  for (const name of ["Additional Data", "Communities", "Cite & Imprint"]) {
    await page.locator(".nav-link").filter({ has: page.getByText(name, { exact: true }) }).click();
    await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();

    const tab = page.getByRole("button", { name: `Open ${name} sidebar` });
    await expect(tab).toBeVisible();
    const textFits = await tab.locator(".sidebar-edge-tab-label").evaluate((label) => {
      const textRange = document.createRange();
      textRange.selectNodeContents(label);
      const text = textRange.getBoundingClientRect();
      const bounds = label.getBoundingClientRect();
      return text.top >= bounds.top - 1 && text.bottom <= bounds.bottom + 1;
    });
    expect(textFits, `${name} should fit inside its tab`).toBe(true);

    await tab.click();
    await page.getByRole("button", { name: "Back to tool list" }).click();
  }
});

test("Left sidebar shortcuts close and reopen the active section", async ({ page }) => {
  await page.keyboard.press("d");
  await expect(page.locator("#app-sidebar .sidebar-panel-heading")).toHaveText("Data");

  await page.keyboard.press("d");
  await expect(page.locator("#app-sidebar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Data sidebar" })).toBeVisible();

  await page.keyboard.press("d");
  await expect(page.locator("#app-sidebar .sidebar-panel-heading")).toHaveText("Data");

  await page.keyboard.press("f");
  await expect(page.locator("#app-sidebar .sidebar-panel-heading")).toHaveText("Filter");
  await page.keyboard.press("f");
  await expect(page.getByRole("button", { name: "Open Filter sidebar" })).toBeVisible();
});

test("Modified keys leave browser commands and sidebar state alone", async ({ page }) => {
  for (const shortcut of [
    { key: "c", ctrlKey: true },
    { key: "c", metaKey: true },
    { key: "b", ctrlKey: true },
    { key: "f", altKey: true },
    { key: "D", shiftKey: true },
    { key: "m", ctrlKey: true },
    { key: "i", metaKey: true },
    { key: "n", altKey: true },
    { key: "d", repeat: true },
    { key: "m", isComposing: true },
  ]) {
    const prevented = await page.evaluate((options) => {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...options });
      document.dispatchEvent(event);
      return event.defaultPrevented;
    }, shortcut);
    expect(prevented, `${shortcut.key} should not be intercepted`).toBe(false);
  }

  await expect(page.locator("#app-sidebar .nav-link")).toHaveCount(SIDEBAR_SECTIONS.length);
  await expect(page.getByRole("button", { name: "Open insights sidebar" })).toBeVisible();

  await page.keyboard.press("d");
  await expect(page.locator("#app-sidebar .sidebar-panel-heading")).toHaveText("Data");
  await page.keyboard.press("m");
  await expect(page.getByRole("region", { name: "Color mapping" })).toBeVisible();
});

test("Sidebar resize handles highlight the full edge on hover", async ({ page }) => {
  const expectFullEdgeHighlight = async (panel, handle, side) => {
    const edgeStyle = () => panel.evaluate((element, edge) => {
      const style = getComputedStyle(element);
      return edge === "left"
        ? { color: style.borderRightColor, width: style.borderRightWidth }
        : { color: style.borderLeftColor, width: style.borderLeftWidth };
    }, side);
    const original = await edgeStyle();
    const box = await handle.boundingBox();
    for (const y of [box.y + 16, box.y + box.height - 16]) {
      await page.mouse.move(box.x + box.width / 2, y);
      const highlighted = await edgeStyle();
      expect(highlighted.color).not.toBe(original.color);
      expect(highlighted.width).toBe(original.width);
    }
  };

  await expectFullEdgeHighlight(
    page.locator("#app-sidebar"),
    page.getByRole("separator", { name: "Resize left sidebar" }),
    "left",
  );
  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();
  await page.getByRole("button", { name: "Open insights sidebar" }).click();
  await expectFullEdgeHighlight(
    page.getByRole("region", { name: "Color mapping" }),
    page.getByRole("separator", { name: "Resize right sidebar" }),
    "right",
  );
});

test("Sidebars resize and collapse from their drag handles", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-light", "Pointer resizing only needs one desktop layout pass");

  const leftSidebar = page.locator("#app-sidebar");
  const leftHandle = page.getByRole("separator", { name: "Resize left sidebar" });
  const initialSelectionWidth = (await leftSidebar.boundingBox()).width;
  let handleBox = await leftHandle.boundingBox();

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 60, handleBox.y + handleBox.height / 2);
  await page.mouse.up();
  await expect.poll(async () => (await leftSidebar.boundingBox()).width).toBeCloseTo(initialSelectionWidth, 0);

  handleBox = await leftHandle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(20, handleBox.y + handleBox.height / 2);
  await expect.poll(async () => (await leftSidebar.boundingBox()).width).toBeLessThan(2);
  await page.mouse.up();
  await expect(leftSidebar).toHaveCount(0);
  await page.getByRole("button", { name: "Open Menu sidebar" }).click();
  await expect.poll(async () => (await leftSidebar.boundingBox()).width).toBeCloseTo(initialSelectionWidth, 0);

  await page.locator(".nav-link").filter({ has: page.getByText("Filter", { exact: true }) }).click();
  const initialLeftWidth = (await leftSidebar.boundingBox()).width;
  handleBox = await leftHandle.boundingBox();

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 60, handleBox.y + handleBox.height / 2);
  await page.mouse.up();
  await expect.poll(async () => (await leftSidebar.boundingBox()).width).toBeGreaterThan(initialLeftWidth + 40);

  handleBox = await leftHandle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(20, handleBox.y + handleBox.height / 2);
  await expect.poll(async () => (await leftSidebar.boundingBox()).width).toBeLessThan(2);
  await page.mouse.up();
  await expect(leftSidebar).toHaveCount(0);
  await page.getByRole("button", { name: "Open Filter sidebar" }).click();
  await expect.poll(async () => (await leftSidebar.boundingBox()).width).toBeGreaterThan(initialLeftWidth + 40);
  await leftSidebar.getByRole("button", { name: "Collapse sidebar" }).click();

  await page.getByRole("button", { name: "Open insights sidebar" }).click();
  const rightSidebar = page.getByRole("region", { name: "Color mapping" });
  const rightHandle = page.getByRole("separator", { name: "Resize right sidebar" });
  const initialRightWidth = (await rightSidebar.boundingBox()).width;
  handleBox = await rightHandle.boundingBox();

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 60, handleBox.y + handleBox.height / 2);
  await page.mouse.up();
  await expect.poll(async () => (await rightSidebar.boundingBox()).width).toBeGreaterThan(initialRightWidth + 40);

  handleBox = await rightHandle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(page.viewportSize().width - 20, handleBox.y + handleBox.height / 2);
  await expect.poll(async () => (await rightSidebar.boundingBox()).width).toBeLessThan(2);
  await page.mouse.up();
  await expect(rightSidebar).toHaveCount(0);
  await page.getByRole("button", { name: "Open insights sidebar" }).click();
  await expect.poll(async () => (await rightSidebar.boundingBox()).width).toBeGreaterThan(initialRightWidth + 40);
});
