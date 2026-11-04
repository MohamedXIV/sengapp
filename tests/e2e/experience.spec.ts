import { expect, test } from "@playwright/test";

test("visitor can switch permanently between Classic and Cozy on this device", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cottage-canvas").locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.getByTestId("workspace-utilities").locator("summary").click();
  await page.getByTestId("switch-to-classic").click();
  await expect(page).toHaveURL(/\/classic$/);
  await expect(page.getByTestId("cottage-canvas")).toHaveCount(0);
  await expect(page.getByTestId("switch-to-cozy")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Cottage Lab");

  await page.goto("/");
  await expect(page).toHaveURL(/\/classic$/);
  await page.getByTestId("switch-to-cozy").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("cottage-canvas").locator("canvas")).toBeVisible({ timeout: 20000 });
});

test("explicit Cozy bookmarks work even when Classic is preferred", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("workspace-utilities").locator("summary").click();
  await page.getByTestId("switch-to-classic").click();
  await page.goto("/?panel=connections");
  await expect(page.getByTestId("cottage-live-connections")).toBeVisible();
  await page.getByTestId("workspace-utilities").locator("summary").click();
  await page.getByTestId("switch-to-classic").click();
  await expect(page).toHaveURL(/\/connections$/);
  await expect(page.getByTestId("cottage-canvas")).toHaveCount(0);
});
