import { expect, test } from "@playwright/test";

test("UI v2 desktop shadcn composer supports sending, replies, reactions and edits in the demo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop keyboard/message flow");
  await page.goto("/ui-v2");
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("An original demo message");
  await input.press("Enter");
  await expect(page.getByText("An original demo message")).toBeVisible();
  await expect(input).toHaveValue("");

  await page.getByRole("button", { name: "Message actions: d1" }).click();
  await page.getByRole("menuitem", { name: "Reply" }).click();
  await expect(page.getByText("Replying to Aya")).toBeVisible();
  await input.fill("Reply with a small note 🌿");
  await page.getByRole("button", { name: "Add message to local demo" }).click();
  await expect(page.getByText("Reply with a small note 🌿")).toBeVisible();

  const reaction = page.getByRole("button", { name: "React ❤️ to Aya's message" });
  await reaction.click();
  await expect(reaction).toHaveAttribute("data-state", "on");

  await page.getByRole("button", { name: "Message actions: d5" }).click();
  await page.getByRole("menuitem", { name: "Edit local message" }).click();
  await expect(page.getByText("Editing your message")).toBeVisible();
  await input.fill("Edited for this local prototype");
  await page.getByRole("button", { name: "Add message to local demo" }).click();
  const editedMessage = page.locator('[data-message-id="d5"]');
  await expect(editedMessage).toContainText("Edited for this local prototype");
  await expect(editedMessage).not.toContainText("Pushed the updates! 🎉");
});

test("UI v2 composer uses the official emoji Popover and preserves Shift+Enter", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop keyboard behavior");
  await page.goto("/ui-v2");
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("Hello");
  await input.press("Shift+Enter");
  await expect(input).toHaveValue("Hello\n");
  await page.getByRole("button", { name: "Choose emoji" }).click();
  await page.getByRole("button", { name: "Insert 🌿" }).click();
  await expect(input).toHaveValue("Hello\n🌿");
});

test("UI v2 mobile thread retains an explicit Send action and shadcn Message and Bubble", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Mobile messenger layout");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: /Design Friends/ }).click();
  await expect(page.getByText(/تفتكر نخفف الحدود/)).toBeVisible();
  await expect(page.getByText(/A thoughtful design has to feel calm/)).toBeVisible();
  const input = page.getByRole("textbox", { name: "Write a message" });
  await input.fill("Mobile note");
  await input.press("Enter");
  await expect(input).toHaveValue("Mobile note\n");
  await page.getByRole("button", { name: "Add message to local demo" }).click();
  await expect(page.getByText("Mobile note")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});


test("UI v2 messages use native shadcn Message, Bubble and MessageScroller parts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop chat primitive composition");
  await page.goto("/ui-v2");
  await expect(page.locator('[data-slot="message-scroller-viewport"]')).toBeVisible();
  await expect(page.locator('[data-slot="message-scroller-content"]')).toBeVisible();
  await expect(page.locator('[data-slot="marker"][data-variant="separator"]')).toBeVisible();
  const row = page.locator('[data-slot="message-scroller-item"][data-message-id="d1"]');
  await expect(row.locator('[data-slot="message"]')).toHaveAttribute("data-align", "start");
  await expect(row.locator('[data-slot="message-content"]')).toBeVisible();
  await expect(row.locator('[data-slot="bubble"]')).toHaveAttribute("data-variant", "muted");
  const own = page.locator('[data-slot="message-scroller-item"][data-message-id="d5"]');
  await expect(own.locator('[data-slot="message"]')).toHaveAttribute("data-align", "end");
  await expect(own.locator('[data-slot="bubble"]')).toHaveAttribute("data-variant", "default");
  await expect(page.locator('[data-slot="message-scroller-button"]')).toHaveCount(1);
});
