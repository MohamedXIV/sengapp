import { expect, test } from "@playwright/test";

test("Classic and Cozy share the same message history and shadcn UI", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Desktop shared shell test");
  await page.goto("/ui-v2");
  await expect(page.getByTestId("classic-shell")).toBeVisible();
  await page.getByRole("textbox", { name: "Write a message" }).fill("Same chat in two places");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Same chat in two places")).toBeVisible();

  await page.getByRole("button", { name: "Switch to Cozy" }).click();
  await expect(page.getByTestId("cozy-shell")).toBeVisible();
  await expect(page.getByTestId("cozy-dockview")).toBeVisible();
  await expect(page.getByTestId("shared-conversation-panel")).toBeVisible();
  await expect(page.getByText("Same chat in two places")).toBeVisible();

  await page.getByRole("button", { name: "Switch to Classic" }).click();
  await expect(page.getByTestId("classic-shell")).toBeVisible();
  await expect(page.getByText("Same chat in two places")).toBeVisible();
});

test("Right preferences Sheet overlays Classic and Cozy without pushing layout, and owns companion identity", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Desktop shared utility drawer");
  await page.goto("/ui-v2");
  const chat = page.getByTestId("shared-conversation-panel");
  const before = await chat.boundingBox();
  await expect(page.getByTestId("conversation-header").getByRole("button")).toHaveCount(0);
  await expect(page.getByTestId("utility-right-drawer")).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await expect(page.getByTestId("utility-right-drawer")).toBeVisible();
  const after = await chat.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(2);

  const primaryBefore = await page.locator("[data-sengapp-shadcn-blocks]").evaluate(element => getComputedStyle(element).getPropertyValue("--primary"));
  await page.getByRole("textbox", { name: "Primary hex" }).fill("#1987A6");
  await page.getByRole("textbox", { name: "Primary hex" }).press("Tab");
  await expect.poll(() => page.locator("[data-sengapp-shadcn-blocks]").evaluate(element => getComputedStyle(element).getPropertyValue("--primary"))).not.toBe(primaryBefore);
  await page.getByRole("button", { name: "Round" }).click();
  await page.getByRole("button", { name: "Deep" }).click();
  await expect(page.getByTestId("utility-right-drawer").getByRole("textbox", { name: "Primary hex" })).toHaveValue("#1987A6");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-corners", "round");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-shadow", "deep");

  await page.getByRole("button", { name: "Companion", exact: true }).click();
  await page.getByLabel("Display name").fill("Layla");
  await page.getByLabel("Mention alias").fill("layla");
  await page.getByRole("button", { name: "Save companion" }).click();
  await expect(page.getByText("Layla (@layla)")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("utility-right-drawer")).toHaveCount(0);

  await page.getByRole("textbox", { name: "Write a message" }).fill("Hi @layla");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Hi @layla")).toBeVisible();
  await expect(page.getByText(/Local UI example: I can be addressed/)).toBeVisible();

  await page.getByRole("button", { name: "Switch to Cozy" }).click();
  await expect(page.getByText("Hi @layla")).toBeVisible();
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await expect(page.getByRole("textbox", { name: "Primary hex" })).toHaveValue("#1987A6");
  await page.getByRole("button", { name: "Companion", exact: true }).click();
  await expect(page.getByText("Layla (@layla)")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("mobile Cozy window is draggable/resizable and chats remain accessible", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile-chrome", "Mobile cozy layout");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "Switch to Cozy" }).click();
  await expect(page.getByTestId("cozy-mobile-windows")).toBeVisible();
  await expect(page.getByTestId("cozy-mobile-window")).toBeVisible();
  await expect(page.getByRole("button", { name: "Drag chat window" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resize chat window" })).toBeVisible();
  await page.getByRole("button", { name: "Open chats" }).click();
  await page.getByTestId("cozy-conversations-panel").getByRole("button", { name: /Sara Ali/ }).click();
  await expect(page.getByRole("heading", { name: "Sara Ali" })).toBeVisible();
  await page.getByRole("button", { name: "Open appearance" }).click();
  await expect(page.getByRole("textbox", { name: "Primary hex" })).toBeVisible();
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});


test("Desktop Cozy floating tabs, chat buttons and composer really accept clicks", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Desktop Dockview hit-testing regression");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "Switch to Cozy" }).click();
  const dock = page.getByTestId("cozy-dockview");
  await expect(dock).toBeVisible();
  await expect(dock.locator(".dv-resize-container")).toHaveCount(2);
  await expect(page.getByTestId("cozy-conversations-panel")).toBeVisible();
  await expect(page.getByTestId("shared-conversation-panel")).toBeVisible();

  // These clicks used to be swallowed by an inherited pointer-events:none.
  await page.getByTestId("cozy-conversations-panel").getByRole("button", { name: /Sara Ali/ }).click();
  await expect(page.getByRole("heading", { name: "Sara Ali" })).toBeVisible();
  await page.getByRole("textbox", { name: "Write a message" }).fill("Desktop window clicks work");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Desktop window clicks work")).toBeVisible();

  const stage = page.getByTestId("cozy-world-stage");
  const originalWidth = (await stage.boundingBox())!.width;
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await expect(page.getByTestId("utility-right-drawer")).toBeVisible();
  const overlayWidth = (await stage.boundingBox())!.width;
  expect(Math.abs(originalWidth - overlayWidth)).toBeLessThan(2);
  await page.keyboard.press("Escape");

  await expect(page.getByTestId("cottage-canvas").locator("canvas")).toBeVisible();
  await expect(page.getByTestId("cozy-room-fallback")).toHaveCount(0);
});

test("UI v2 switches English/Arabic and RTL without losing a draft across shells", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Desktop bilingual shell test");
  await page.goto("/ui-v2");
  await page.getByRole("textbox", { name: "Write a message" }).fill("Hello / مرحبًا");
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("lang", "ar");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('[data-variant="inset"][data-side="right"]')).toBeVisible();
  const rtlSidebar = await page.locator('[data-variant="inset"][data-side="right"] [data-sidebar="sidebar"]').boundingBox();
  expect(rtlSidebar).not.toBeNull();
  expect(rtlSidebar!.x).toBeGreaterThan(650);
  await expect(page.getByTestId("shared-appearance-panel").getByText("المظهر", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("textbox", { name: "اكتب رسالة" })).toHaveValue("Hello / مرحبًا");
  await expect(page.getByTestId("utility-right-drawer")).toHaveCount(0);
  await page.getByRole("button", { name: "الانتقال إلى كوزي" }).click();
  await expect(page.getByTestId("cozy-shell")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "اكتب رسالة" })).toHaveValue("Hello / مرحبًا");
  await page.getByRole("button", { name: "الانتقال إلى كلاسيك" }).click();
  await page.getByRole("button", { name: "فتح إعدادات المظهر" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("dir", "ltr");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("textbox", { name: "Write a message" })).toHaveValue("Hello / مرحبًا");
});

test("Light, Dark and System preserve arbitrary per-mode palettes across reload", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Desktop theme palette checks");
  await page.goto("/ui-v2");
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  const primary = page.getByRole("textbox", { name: "Primary hex" });
  await primary.fill("#A1357B");
  await primary.press("Tab");
  await expect(primary).toHaveValue("#A1357B");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-mode", "dark");
  await page.getByRole("textbox", { name: "Primary hex" }).fill("#58AFC2");
  await page.getByRole("textbox", { name: "Primary hex" }).press("Tab");
  await expect(page.getByRole("textbox", { name: "Primary hex" })).toHaveValue("#58AFC2");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-mode", "light");
  await expect(page.getByRole("textbox", { name: "Primary hex" })).toHaveValue("#A1357B");
  await page.reload();
  await page.getByRole("button", { name: "Toggle preferences drawer" }).click();
  await expect(page.getByRole("textbox", { name: "Primary hex" })).toHaveValue("#A1357B");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Primary hex" })).toHaveValue("#58AFC2");
  await page.getByRole("button", { name: "System", exact: true }).click();
  await expect(page.getByRole("button", { name: "System", exact: true })).toHaveAttribute("aria-pressed", "true");
});
