import { test, expect } from "@playwright/test";

test("standalone welcome remains available, while / is the canonical public cozy world", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: "Sengapp" })).toBeVisible();
  await expect(page.getByText(/Anyone can join/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in or join" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Have a connection invitation?" })).toBeVisible();
  await expect(page.getByRole("list", { name: /conversations/i })).toHaveCount(0);
});

test("unauthenticated home is welcoming but never reveals private conversations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cottage-canvas").locator("canvas")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("link", { name: "Sign in or join" })).toBeVisible();
  await expect(page.getByTestId("cottage-live-chats").locator('input[id="displayName"]')).toHaveCount(0);
  await expect(page.getByText(/Good to see you/)).toHaveCount(0);
});

test("invite page is recoverable without a token", async ({ page }) => {
  await page.goto("/invite");
  await expect(page.getByText(/No invitation link|Sengapp needs its Clerk and Convex connection/)).toBeVisible();
});
