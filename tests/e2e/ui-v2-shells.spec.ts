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
  await page.getByRole("button", { name: "Rose accent" }).click();
  await page.getByRole("button", { name: "Round" }).click();
  await page.getByRole("button", { name: "Deep" }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-accent", "rose");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-corners", "round");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-shadow", "deep");

  await page.getByRole("button", { name: "Switch to Cozy" }).click();
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-accent", "rose");
  await expect(page.locator("[data-sengapp-shadcn-blocks]")).toHaveAttribute("data-corners", "round");
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
