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

test("Community Force stays in sync between Communities and Physics", async ({ page }) => {
  await page.goto("/");
  const openMenu = page.getByRole("button", { name: "Open Menu sidebar" });
  if (await openMenu.isVisible()) await openMenu.click();

  const communityForce = page.locator("#app-sidebar .block-section").filter({
    has: page.locator(".label", { hasText: "Community Force" }),
  });
  const openPanel = async (name) => {
    if (await page.getByRole("button", { name: "Back to tool list" }).isVisible()) {
      await page.getByRole("button", { name: "Back to tool list" }).click();
    }
    await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await expect(communityForce).toBeVisible();
  };
  const setForce = async (value) => {
    await communityForce.locator('input[type="number"]').fill(value);
    await communityForce.locator('input[type="number"]').press("Tab");
    await expect(communityForce.locator('input[type="range"]')).toHaveValue(value);
  };

  await openPanel("Communities");
  await expect(communityForce.locator('input[type="range"]')).toHaveAttribute("max", "10");
  await setForce("3.4");

  await openPanel("Physics");
  await expect(communityForce.locator('input[type="number"]')).toHaveValue("3.4");
  await setForce("6.2");

  await openPanel("Communities");
  await expect(communityForce.locator('input[type="number"]')).toHaveValue("6.2");

  await openPanel("Physics");
  await page.getByRole("button", { name: "Set Phyiscs to Default" }).click();
  await openPanel("Communities");
  await expect(communityForce.locator('input[type="number"]')).toHaveValue("0");
});
