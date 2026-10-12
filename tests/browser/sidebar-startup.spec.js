import { test, expect } from "@playwright/test";

test("Left menu opens on startup even after a previous collapsed setting", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("cpnn.sidebarCollapsed", "true"));
  await page.goto("/");

  const menu = page.locator("#app-sidebar");
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Menu sidebar" })).toBeVisible();

  await page.reload();
  await expect(menu).toBeVisible();
});
