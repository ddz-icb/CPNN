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

test("Header overlays fit and close consistently", async ({ page }) => {
  await page.locator("#app-sidebar").getByRole("button", { name: "Collapse sidebar" }).click();
  const triggers = page.locator(".headerbar-actions button[aria-controls]");
  expect(await triggers.count()).toBeGreaterThan(0);
  for (const trigger of await triggers.all()) {
    const panelId = await trigger.getAttribute("aria-controls");
    await test.step(panelId, async () => {
      const overlay = page.locator(`[id="${panelId}"]`);
      await trigger.click();
      // The region wrapper has no box; its child is the positioned panel.
      await expectLayoutFits(overlay.locator(":scope > div"));
      await page.keyboard.press("Escape");
      await expect(overlay).toHaveCount(0);
      await trigger.click();
      await trigger.click();
      await expect(overlay).toHaveCount(0);
    });
  }
});
