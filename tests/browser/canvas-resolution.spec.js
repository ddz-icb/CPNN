import { expect, test } from "@playwright/test";

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
