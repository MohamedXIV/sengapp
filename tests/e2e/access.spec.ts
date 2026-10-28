import { test, expect } from "@playwright/test";

test("landing page introduces Sengapp without public chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sengapp" })).toBeVisible();
  await expect(page.getByText(/Anyone can join/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in or join" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Have a connection invitation?" })).toBeVisible();
  await expect(page.getByRole("list", { name: /conversations/i })).toHaveCount(0);
});

test("unauthenticated visitor never sees a member workspace", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByText(/Your space is private|Sengapp needs its Clerk and Convex connection/)).toBeVisible();
  await expect(page.getByText(/Good to see you/)).toHaveCount(0);
});

test("invite page is recoverable without a token", async ({ page }) => {
  await page.goto("/invite");
  await expect(page.getByText(/No invitation link|Sengapp needs its Clerk and Convex connection/)).toBeVisible();
});
