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

test("shadcn composer sends locally without chat-header setup actions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop composer");
  await page.goto("/ui-v2");
  await expect(page.getByTestId("conversation-header").getByRole("button")).toHaveCount(0);
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("A new local message");
  await input.press("Enter");
  await expect(page.getByText("A new local message")).toBeVisible();
  await expect(input).toHaveValue("");
});

test("scoped shadcn theme gives dropdown an opaque readable surface", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop theme");
  await page.goto("/ui-v2");
  await page.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]').click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const color = await menu.evaluate(element => getComputedStyle(element).backgroundColor);
  expect(color).not.toBe("rgba(0, 0, 0, 0)");
  expect(color).not.toBe("transparent");
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
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await page.getByRole("button", { name: "Companion", exact: true }).click();
  await page.getByRole("textbox", { name: "Display name" }).fill("Sparrow");
  await page.getByRole("textbox", { name: "Mention alias" }).fill("sparrow");
  await page.getByRole("button", { name: "Save companion" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="message-scroller-item"][data-message-id="t5"]')).toBeVisible();
  await expect(page.locator('[data-agent-activity="preview"] [data-slot="trace"]').first()).toBeVisible();
  await expect(page.locator('[data-agent-activity="preview"]')).toHaveCount(1);
  await expect(page.getByText("AI companion · mock")).toBeVisible();
  await page.getByRole("button", { name: "Approve preview" }).click();
  await expect(page.getByText("Approved locally · not executed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve preview" })).toHaveCount(0);
});

test("mentioning a companion produces a clearly mocked response only with sample consent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop companion mock");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await page.getByRole("button", { name: "Companion", exact: true }).click();
  await page.getByRole("textbox", { name: "Display name" }).fill("Sparrow");
  await page.getByRole("textbox", { name: "Mention alias" }).fill("sparrow");
  await page.getByRole("button", { name: "Save companion" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mention a companion" }).click();
  await page.getByRole("button", { name: /Mention @sparrow/ }).click();
  const draft = page.getByRole("textbox", { name: "Write a message" });
  await expect(draft).toHaveValue("@sparrow ");
  await draft.fill("@sparrow can you help with our design review?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/No AI model, memory, connected app or tool has been called/)).toBeVisible();
});

test("in another conversation a mention is blocked until participant consent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop consent mock");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await page.getByRole("button", { name: "Companion", exact: true }).click();
  await page.getByRole("textbox", { name: "Display name" }).fill("Sparrow");
  await page.getByRole("textbox", { name: "Mention alias" }).fill("sparrow");
  await page.getByRole("button", { name: "Save companion" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Sara Ali/ }).click();
  await page.getByRole("textbox", { name: "Write a message" }).fill("@sparrow please remember this");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/Companion request not activated/)).toBeVisible();
  await expect(page.locator('[data-agent-activity="preview"]')).toHaveCount(0);
});


test("no default Companion; owner can choose and edit name and alias", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop companion alias");
  await page.goto("/ui-v2");
  await expect(page.locator('[data-slot="message-scroller-item"][data-message-id="t5"]')).toHaveCount(0);
  await expect(page.getByTestId("conversation-header").getByRole("button")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Write a message" }).fill("@star is not configured");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator('[data-agent-activity="preview"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await page.getByRole("button", { name: "Companion", exact: true }).click();
  await page.getByRole("textbox", { name: "Display name" }).fill("فراشة");
  await page.getByRole("textbox", { name: "Mention alias" }).fill("farasha");
  await page.getByRole("button", { name: "Save companion" }).click();
  await expect(page.getByText("فراشة (@farasha)")).toBeVisible();
  await page.getByRole("textbox", { name: "Display name" }).fill("Little Star");
  await page.getByRole("textbox", { name: "Mention alias" }).fill("star");
  await page.getByRole("button", { name: "Save companion" }).click();
  await expect(page.getByText("Little Star (@star)")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Little Star", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Write a message" }).fill("@star hello");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/No AI model, memory, connected app or tool has been called/)).toBeVisible();
});
