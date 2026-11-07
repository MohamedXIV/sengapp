import { expect, test } from "@playwright/test";

test("UI v2 uses the real shadcn desktop inset/offcanvas sidebar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop-specific sidebar behavior");
  await page.goto("/ui-v2");
  await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();
  const sidebar = page.locator('[data-variant="inset"][data-state]');
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  const trigger = page.locator('[data-sidebar="trigger"]');
  await trigger.click();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await trigger.click();
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await page.getByRole("button", { name: "Toggle chat filters" }).click();
  await expect(page.getByRole("button", { name: "All chats" })).toBeHidden();
  await page.getByRole("button", { name: "Toggle chat filters" }).click();
  await expect(page.getByRole("button", { name: "All chats" })).toBeVisible();
});

test("UI v2 mobile navigation uses the shadcn Sheet instead of custom tabs", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile-specific Sheet behavior");
  await page.goto("/ui-v2");
  await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  const sheet = page.getByRole("dialog", { name: "Sengapp navigation" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "People" }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("heading", { name: "Good people, close by." })).toBeVisible();
});
