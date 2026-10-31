import { test, expect } from "@playwright/test";

test("isolated cottage lab renders a room and provides reachable workspace controls", async ({ page }, testInfo) => {
  await page.goto("/lab/cottage");
  await expect(page.getByText("Sengapp • Cottage Lab")).toBeVisible();
  await expect(page.getByTestId("cottage-canvas").locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /Edit room/ }).click();
  await expect(page.getByRole("button", { name: /Done/ })).toBeVisible();
  await page.getByRole("button", { name: /Evening/ }).click({ force: true });
  await expect(page.getByRole("button", { name: /Day/ })).toBeVisible();
  await page.getByRole("button", { name: /Done/ }).click();

  if (testInfo.project.name === "mobile-chrome") {
    await page.getByRole("button", { name: /Notes/ }).click();
    await expect(page.getByLabel("A little note to yourself")).toBeVisible();
    await page.getByLabel("A little note to yourself").fill("Private lab note");
    await page.reload();
    await page.getByRole("button", { name: /Notes/ }).click();
    await expect(page.getByLabel("A little note to yourself")).toHaveValue("Private lab note");
  } else {
    await expect(page.getByText("Private conversations")).toBeVisible();
    await expect(page.getByText("Your focus moment")).toBeVisible();
  }
});
