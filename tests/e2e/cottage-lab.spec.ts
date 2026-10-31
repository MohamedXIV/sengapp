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
    await page.getByRole("button", { name: "Notes", exact: true }).click();
    const mobileNotes = page.getByTestId("cottage-mobile-window-notes");
    await expect(mobileNotes).toBeVisible();
    const moveHandle = page.getByRole("button", { name: "Move Notes window" });
    const before = await mobileNotes.boundingBox();
    const handleBounds = await moveHandle.boundingBox();
    expect(before).toBeTruthy();
    expect(handleBounds).toBeTruthy();
    if (before && handleBounds) {
      const centerX = handleBounds.x + handleBounds.width / 2;
      const centerY = handleBounds.y + handleBounds.height / 2;
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 26, centerY + 32, { steps: 6 });
      await page.mouse.up();
      const after = await mobileNotes.boundingBox();
      expect(after).toBeTruthy();
      expect(after!.y).toBeGreaterThan(before.y + 10);
    }
    const sizeBefore = await mobileNotes.boundingBox();
    const sizeHandle = await page.getByRole("button", { name: "Resize Notes window" }).boundingBox();
    if (sizeBefore && sizeHandle) {
      await page.mouse.move(sizeHandle.x + sizeHandle.width / 2, sizeHandle.y + sizeHandle.height / 2);
      await page.mouse.down();
      await page.mouse.move(sizeHandle.x + sizeHandle.width / 2 + 18, sizeHandle.y + sizeHandle.height / 2 + 25, { steps: 5 });
      await page.mouse.up();
      const sizeAfter = await mobileNotes.boundingBox();
      expect(sizeAfter).toBeTruthy();
      expect(sizeAfter!.height).toBeGreaterThan(sizeBefore.height);
    }
    await expect(page.getByLabel("A little note to yourself")).toBeVisible();
    await page.getByLabel("A little note to yourself").fill("Private lab note");
    await page.reload();
    await page.getByRole("button", { name: "Notes", exact: true }).click();
    await expect(page.getByLabel("A little note to yourself")).toHaveValue("Private lab note");
    await expect(page.getByTestId("cottage-mobile-window-notes")).toBeVisible();
  } else {
    await expect(page.getByText("Private conversations")).toBeVisible();
    await expect(page.getByText("Your focus moment")).toBeVisible();
    await expect(page.locator(".cottage-dock-layer .dv-resize-container").first()).toHaveCSS("border-radius", "18px");
  }
});
