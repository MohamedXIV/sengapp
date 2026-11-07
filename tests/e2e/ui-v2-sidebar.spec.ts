import { expect, test } from "@playwright/test";

test("shadcn inset Sidebar collapses on desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop sidebar baseline");
  await page.goto("/ui-v2");
  const sidebar = page.locator('[data-variant="inset"][data-state]');
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await page.locator('[data-sidebar="trigger"]').click();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await page.locator('[data-sidebar="trigger"]').click();
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
});

test("shadcn Sidebar opens its mobile Sheet", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile sidebar baseline");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="trigger"]').click();
  const sheet = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: /Sara Ali/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("heading", { name: "Sara Ali" })).toBeVisible();
});
