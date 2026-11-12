import { test, expect } from "@playwright/test";

test("maximum filters stay out of the primary filter views", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Filter\b/ }).click();

  const advanced = page.locator("details.filter-advanced");
  await expect(advanced.locator("summary")).toHaveText("Advanced filters");
  await expect(advanced.locator("summary")).toHaveClass(/table-list-heading/);
  await expect(advanced).not.toHaveAttribute("open");
  await expect(advanced.getByText("Max Component Size")).toBeHidden();
  await expect(page.getByText("Max Component Density")).toHaveCount(0);
  await advanced.locator("summary").click();
  await expect(advanced.getByText("Max Component Size")).toBeVisible();

  await page.getByRole("button", { name: "Back to tool list" }).click();
  await page.getByRole("button", { name: /^Communities\b/ }).click();
  const communityAdvanced = page.locator("details.filter-advanced");
  await expect(communityAdvanced.getByText("Max Community Size")).toBeHidden();
  await communityAdvanced.locator("summary").click();
  await expect(communityAdvanced.getByText("Max Community Size")).toBeVisible();
});
