import { expect, test } from "@playwright/test";

test("shadcn chat panel renders official Message/Bubble/Scroller composition", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop panel");
  await page.goto("/ui-v2");
  await expect(page.getByRole("heading", { name: "Dev Team" })).toBeVisible();
  await expect(page.locator('[data-slot="message-scroller-viewport"]')).toBeVisible();
  const incoming = page.locator('[data-slot="message-scroller-item"][data-message-id="t1"]');
  await expect(incoming.locator('[data-slot="message"]')).toHaveAttribute("data-align", "start");
  await expect(incoming.locator('[data-slot="bubble"]')).toHaveAttribute("data-variant", "secondary");
  const own = page.locator('[data-slot="message-scroller-item"][data-message-id="t3"]');
  await expect(own.locator('[data-slot="bubble"]')).toHaveAttribute("data-variant", "muted");
  await expect(page.locator('[data-slot="input-group"]')).toBeVisible();
});

test("shadcn Chat Demo empty state and composer work locally", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop empty state");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "New conversation" }).click();
  await expect(page.locator('[data-slot="empty"]')).toBeVisible();
  await expect(page.getByText("Start a conversation")).toBeVisible();
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("A new local conversation");
  await input.press("Enter");
  await expect(page.getByText("A new local conversation")).toBeVisible();
  await expect(input).toHaveValue("");
});

test("scoped stock shadcn theme gives dropdown a solid white surface", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop theme");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]').click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("mobile sidebar-08 and human group chat work without horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile blocks");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="trigger"]').click();
  const sheet = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: /Design Friends/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText(/هل الرسائل العربية/)).toBeVisible();
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("رسالة تجريبية");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("رسالة تجريبية")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});


test("AI companion and human messages share one native scroller with Trace and approval", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop shared AI-human conversation");
  await page.goto("/ui-v2");
  await expect(page.locator('[data-slot="message-scroller-item"][data-message-id="t5"]')).toBeVisible();
  await expect(page.locator('[data-slot="trace"]')).toBeVisible();
  await expect(page.locator('[data-agent-activity="preview"]')).toHaveCount(1);
  await expect(page.getByText("AI companion · mock")).toBeVisible();
  await page.getByRole("button", { name: "Approve preview" }).click();
  await expect(page.getByText("Approved locally · not executed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve preview" })).toHaveCount(0);
});

test("mentioning a companion produces a clearly mocked response only with sample consent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop companion mock");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "Mention a companion" }).click();
  await page.getByRole("button", { name: /Mention @Milo/ }).click();
  const draft = page.getByRole("textbox", { name: "Write a message" });
  await expect(draft).toHaveValue("@Milo ");
  await draft.fill("@Milo can you help with our design review?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/No AI model, memory, connected app or tool has been called/)).toBeVisible();
});

test("in another conversation a mention is blocked until participant consent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop consent mock");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: /Sara Ali/ }).click();
  await page.getByRole("textbox", { name: "Write a message" }).fill("@Milo please remember this");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/Companion request not activated/)).toBeVisible();
  await expect(page.locator('[data-agent-activity="preview"]')).toHaveCount(0);
});
