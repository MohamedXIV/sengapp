import { expect, test } from "@playwright/test";

test("vanilla shadcn Message/Bubble/Scroller render directly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop baseline");
  await page.goto("/ui-v2");
  await expect(page.getByRole("heading", { name: "Dev Team" })).toBeVisible();
  await expect(page.locator('[data-slot="message-scroller-viewport"]')).toBeVisible();
  await expect(page.locator('[data-slot="marker"][data-variant="separator"]')).toBeVisible();
  const incoming = page.locator('[data-slot="message-scroller-item"][data-message-id="t1"]');
  await expect(incoming.locator('[data-slot="message"]')).toHaveAttribute("data-align", "start");
  await expect(incoming.locator('[data-slot="bubble"]')).toHaveAttribute("data-variant", "secondary");
  const outgoing = page.locator('[data-slot="message-scroller-item"][data-message-id="t3"]');
  await expect(outgoing.locator('[data-slot="message"]')).toHaveAttribute("data-align", "end");
  await expect(outgoing.locator('[data-slot="bubble"]')).toHaveAttribute("data-variant", "default");
});

test("vanilla composer sends only to local demo state", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop local composer");
  await page.goto("/ui-v2");
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("Plain vanilla message");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Plain vanilla message")).toBeVisible();
  await expect(input).toHaveValue("");
});

test("mobile baseline handles Arabic text and local send without overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile baseline");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="trigger"]').click();
  const sheet = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: /Design Friends/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText(/هل الرسائل العربية/)).toBeVisible();
  await page.getByRole("textbox", { name: "Write a message" }).fill("رسالة تجريبية");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("رسالة تجريبية")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
