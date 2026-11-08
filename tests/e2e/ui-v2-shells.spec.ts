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

test("Appearance tokens persist when switching from Classic to Cozy", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Desktop Appearance controls");
  await page.goto("/ui-v2");
  const chat = page.getByTestId("shared-conversation-panel");
  const before = await chat.boundingBox();
  await expect(page.getByTestId("appearance-right-sidebar")).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle appearance sidebar" }).click();
  await expect(page.getByTestId("appearance-right-sidebar")).toBeVisible();
  const after = await chat.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(before!.width - after!.width).toBeGreaterThan(240);
  await page.getByRole("button", { name: "Rose accent" }).click();
  await page.getByRole("button", { name: "Round" }).click();
  await page.getByRole("button", { name: "Deep" }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-accent", "rose");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-corners", "round");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-shadow", "deep");

  await page.getByRole("button", { name: "Switch to Cozy" }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-accent", "rose");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-corners", "round");
  await expect(page.getByTestId("appearance-right-sidebar")).toBeVisible();
  await page.getByRole("button", { name: "Close appearance sidebar" }).click();
  await expect(page.getByTestId("appearance-right-sidebar")).toHaveCount(0);
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
  await expect(page.getByRole("button", { name: "Rose accent" })).toBeVisible();
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
  await page.getByRole("button", { name: "Toggle appearance sidebar" }).click();
  await expect(page.getByTestId("appearance-right-sidebar")).toBeVisible();
  const reducedWidth = (await stage.boundingBox())!.width;
  expect(originalWidth - reducedWidth).toBeGreaterThan(240);
  await page.getByRole("button", { name: "Close appearance sidebar" }).click();

  await expect(page.getByTestId("cottage-canvas").locator("canvas")).toBeVisible();
  await expect(page.getByTestId("cozy-room-fallback")).toHaveCount(0);
});
