import { test, expect } from "@playwright/test";

test("isolated cottage lab renders a room and provides reachable workspace controls", async ({ page }, testInfo) => {
  await page.goto("/lab/cottage");
  await expect(page.getByText("Sengapp • Cottage Lab")).toBeVisible();
  const renderer = page.getByTestId("cottage-canvas");
  const canvas = renderer.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 20000 });
  // The Phaser render target must fill the stage instead of leaving an opaque
  // 900×620 canvas rectangle sitting on a different background.
  const stage = page.locator(".cottage-stage");
  await expect.poll(async () => {
    const [stageRect, canvasRect] = await Promise.all([stage.boundingBox(), canvas.boundingBox()]);
    return stageRect && canvasRect ? {
      width: Math.round(canvasRect.width - stageRect.width),
      height: Math.round(canvasRect.height - stageRect.height),
    } : null;
  }).toEqual({ width: 0, height: 0 });
  await expect.poll(async () => {
    const bounds = await canvas.boundingBox();
    const viewport = page.viewportSize();
    return bounds && viewport ? Math.round(bounds.height - viewport.height) : null;
  }).toBe(0);
  await expect(renderer).toHaveCSS("filter", "none");
  await expect(renderer).toHaveAttribute("data-world-aspect", "16:10");
  await expect(canvas).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const shell = await page.request.get("/lab/cottage/forest-room.svg");
  expect(shell.ok()).toBeTruthy();
  expect(await shell.text()).toContain('viewBox="0 -64 900 684"');

  const zoom = page.getByTestId("room-zoom-indicator");
  // The world is 16:10 on every device. Portrait mobile starts zoomed to
  // the room for legibility, rather than showing tiny furniture.
  if (testInfo.project.name === "mobile-chrome") {
    await expect.poll(async () => Number((await zoom.textContent())?.replace("×", ""))).toBeGreaterThan(1);
  } else {
    await expect(zoom).toHaveText("1.0×");
  }
  await page.getByRole("button", { name: "Fit world" }).click();
  await expect(zoom).toHaveText("1.0×");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(zoom).toHaveText("1.4×");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(zoom).toHaveText("1.8×");
  const beforeX = Number(await zoom.getAttribute("data-camera-x"));
  const canvasBounds = await canvas.boundingBox();
  expect(canvasBounds).toBeTruthy();
  if (canvasBounds) {
    const x = canvasBounds.x + canvasBounds.width / 2;
    const y = canvasBounds.y + canvasBounds.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 65, y + 30, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => Number(await zoom.getAttribute("data-camera-x"))).not.toBe(beforeX);
  }
  await page.getByRole("button", { name: "Fit room" }).click();
  await expect.poll(async () => Number((await zoom.textContent())?.replace("×", ""))).toBeGreaterThan(1);
  await expect(zoom).toHaveAttribute("data-camera-x", "450.00");
  await page.getByRole("button", { name: "Fit world" }).click();
  await expect(zoom).toHaveText("1.0×");
  await expect(zoom).toHaveAttribute("data-camera-x", "450.00");
  await page.getByRole("button", { name: /Edit room/ }).click();
  await expect(page.getByRole("button", { name: /Done/ })).toBeVisible();
  await page.getByRole("button", { name: /Evening/ }).click({ force: true });
  await expect(page.getByRole("button", { name: /Day/ })).toBeVisible();
  await page.getByRole("button", { name: /Done/ }).click();

  if (testInfo.project.name === "mobile-chrome") {
    await page.getByRole("button", { name: "Chats", exact: true }).click();
    await expect(page.getByTestId("cottage-mobile-window-chats")).toBeVisible();
    const chatWindow = page.getByTestId("cottage-mobile-window-chats");
    await expect(chatWindow.getByTestId("cottage-live-chats")).toBeVisible();
    await expect(chatWindow.getByRole("link", { name: "Messages" })).toHaveAttribute("href", "/chats");
    await page.getByRole("button", { name: "Close Chats window" }).click();
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
    await expect(page.getByTestId("cottage-live-chats")).toBeVisible();
    // No real credentials are configured in CI; the member gate must not
    // render fabricated chat history or silently authorize the lab visitor.
    await expect(page.getByTestId("cottage-live-chats").getByText("Private conversations")).toHaveCount(0);
    await expect(page.getByText("Your focus moment")).toBeVisible();
    await expect(page.locator(".cottage-dock-layer .dv-resize-container").first()).toHaveCSS("border-radius", "18px");
  }
});
