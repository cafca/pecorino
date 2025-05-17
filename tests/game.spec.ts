import { test, expect } from "@playwright/test";

test("game canvas is visible", async ({ page }) => {
  await page.goto("/");
  const canvas = await page.locator("canvas");
  await expect(canvas).toBeVisible();
});
