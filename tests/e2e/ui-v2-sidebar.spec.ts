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


test("UI v2 desktop profile uses an opaque shadcn popover surface", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop popover placement");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]').click();
  const menu = page.locator("[data-sengapp-v2-profile-menu]");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("background-color", "rgb(255, 253, 250)");
  await expect(menu.getByRole("menuitem", { name: "Appearance" })).toBeVisible();
  const rect = await menu.boundingBox();
  const viewport = page.viewportSize();
  expect(rect).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport!.width);
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport!.height);
});

test("UI v2 mobile Sheet and account menu share the desktop color palette", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile portal theme");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="trigger"]').click();
  const sheet = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS("background-color", "rgb(247, 241, 235)");
  const profile = sheet.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]');
  await profile.scrollIntoViewIfNeeded();
  await expect(profile).toBeVisible();
  await profile.click();
  const menu = page.locator("[data-sengapp-v2-profile-menu]");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("background-color", "rgb(255, 253, 250)");
  const bounds = await menu.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height);
  await menu.getByRole("menuitem", { name: "Appearance" }).click();
  await expect(page.getByRole("dialog", { name: "Appearance" })).toBeVisible();
});

test("UI v2 portal theme follows the selected appearance accent and dark mode", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile portal appearance");
  await page.addInitScript(() => {
    localStorage.setItem("sengapp-v2-clean-room-appearance", JSON.stringify({
      accent: "plum", corners: "soft", elevation: "soft", density: "comfortable", mode: "dark",
    }));
  });
  await page.goto("/ui-v2");
  await expect(page.locator(".s2-root")).toHaveAttribute("data-mode", "dark");
  await page.locator('[data-sidebar="trigger"]').click();
  const sheet = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS("background-color", "rgb(32, 32, 29)");
  await sheet.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]').click();
  const menu = page.locator("[data-sengapp-v2-profile-menu]");
  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(menu).toHaveCSS("color", "rgb(238, 234, 226)");
});
