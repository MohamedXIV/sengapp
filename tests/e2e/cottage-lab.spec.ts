import { test, expect } from "@playwright/test";

test("isolated cottage lab renders a room and provides reachable workspace controls", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".cottage-toolbar").getByText("Sengapp", { exact: true })).toBeVisible();
  await expect(page.getByText("Cottage Lab")).toHaveCount(0);
  await expect(page.getByTestId("workspace-utilities").locator("summary")).toHaveAttribute("aria-label", "Open tools and settings");
  await expect(page.locator(".cottage-toolbar").getByRole("button")).toHaveCount(2);
  await expect(page.getByTestId("workspace-utilities").locator("summary")).toBeVisible();
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
  await page.getByTestId("workspace-utilities").locator("summary").click();
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
    // The responsive toolbar overlays the world; windows must not open
    // beneath it or allow their title bar to be dragged under it.
    await expect.poll(async () => {
      const [header, win] = await Promise.all([
        page.locator(".cottage-toolbar").boundingBox(), chatWindow.boundingBox(),
      ]);
      return header && win ? win.y - (header.y + header.height) : null;
    }).toBeGreaterThanOrEqual(0);
    await page.getByRole("button", { name: "Close Chats window" }).click();
    await expect(chatWindow).toHaveCount(0);
    await page.getByRole("button", { name: "Connections", exact: true }).click();
    await expect(page.getByTestId("cottage-mobile-window-connections")).toBeVisible();
    await page.getByRole("button", { name: "Close Connections window" }).click();
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
    await page.getByTestId("workspace-utilities").locator("summary").click();
    await page.getByRole("button", { name: "Notes", exact: true }).click();
    await expect(page.getByLabel("A little note to yourself")).toHaveValue("Private lab note");
    await expect(page.getByTestId("cottage-mobile-window-notes")).toBeVisible();
  } else {
    await expect(page.getByTestId("cottage-live-chats")).toBeVisible();
    // No real credentials are configured in CI; the member gate must not
    // render fabricated chat history or silently authorize the lab visitor.
    await expect(page.getByTestId("cottage-live-chats").getByText("Private conversations")).toHaveCount(0);
    await expect(page.getByText("Your focus moment")).toBeVisible();
    await expect(page.locator(".cottage-dock-layer .dv-resize-container").first()).toHaveCSS("border-radius", "17px");
  }
});

test("desktop Dockview titlebar has visible native drag and resize grips", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chrome", "Dockview handles apply on desktop only");
  await page.goto("/");
  const win = page.locator(".cottage-dock-layer .dv-resize-container").first();
  await expect(win).toBeVisible();
  const drag = win.locator(".dv-floating-titlebar.dv-draggable");
  await expect(drag).toHaveCSS("height", "32px");
  await expect(drag).toHaveCSS("cursor", "grab");
  const grip = drag;
  expect(await grip.evaluate(el => getComputedStyle(el, "::before").backgroundImage)).toContain("radial-gradient");

  const handle = win.locator(".dv-resize-handle-bottomright");
  await expect(handle).toHaveCSS("width", "27px");
  await expect(handle).toHaveCSS("cursor", "nwse-resize");
  expect(await handle.evaluate(el => getComputedStyle(el, "::after").backgroundImage)).toContain("radial-gradient");
  const before = await win.boundingBox();
  const gripBounds = await handle.boundingBox();
  expect(before && gripBounds).toBeTruthy();
  if (before && gripBounds) {
    await page.mouse.move(gripBounds.x + gripBounds.width / 2, gripBounds.y + gripBounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(gripBounds.x + gripBounds.width / 2 + 36, gripBounds.y + gripBounds.height / 2 + 25, { steps: 8 });
    await page.mouse.up();
    const after = await win.boundingBox();
    expect(after && after.width).toBeGreaterThan(before.width);
  }
});

test("unified Appearance offers readable glass, paper and atmospheric effects", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByTestId("workspace-utilities").locator("summary").click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  const panel = page.getByTestId("window-style-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByTestId("workspace-utilities").getByRole("button", { name: "Window style" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Glass" }).click();
  await expect(page.locator(".cottage-lab")).toHaveAttribute("data-window-material", "glass");
  await expect(page.getByTestId("window-style-fields").getByRole("button", { name: "Cozy" })).toHaveCount(0);
  const targetWindow = testInfo.project.name === "mobile-chrome"
    ? page.getByTestId("cottage-mobile-window-appearance")
    : page.locator(".cottage-dock-layer .dv-resize-container").first();
  await expect(targetWindow).toHaveCSS("backdrop-filter", /blur/);
  await expect(targetWindow).toHaveCSS("background-image", /linear-gradient/);
  await expect(targetWindow).toHaveCSS("box-shadow", /inset/);
  await expect(page.getByTestId("window-material-preview").locator(".appearance-window-preview-card"))
    .toHaveCSS("backdrop-filter", /blur/);
  const setRange = async (label: string, value: string) => {
    await panel.getByLabel(label).evaluate((el, next) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(el, next);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  };
  await setRange("Opacity", "77");
  await setRange("Glass blur", "20");
  await expect(page.locator(".cottage-lab")).toHaveAttribute("style", /--window-opacity: 77%/);
  await expect(page.locator(".cottage-lab")).toHaveAttribute("style", /--window-blur: 20px/);
  await panel.getByRole("button", { name: "Rain" }).click();
  await expect(page.locator(".cottage-lab")).toHaveAttribute("data-window-atmosphere", "rain");
  await page.reload();
  if (testInfo.project.name === "mobile-chrome") {
    await page.getByTestId("workspace-utilities").locator("summary").click();
    await page.getByRole("button", { name: "Appearance", exact: true }).click();
  }
  await expect(page.locator(".cottage-lab")).toHaveAttribute("data-window-material", "glass");
  await expect(page.locator(".cottage-lab")).toHaveAttribute("data-window-atmosphere", "rain");
  await page.getByTestId("window-style-panel").getByRole("button", { name: "Paper" }).click();
  await expect(page.locator(".cottage-lab")).toHaveAttribute("data-window-material", "paper");
  await expect(panel.getByLabel("Glass blur")).toHaveCount(0);
  await expect(targetWindow).toHaveCSS("background-image", /data:image/);
  await expect(targetWindow).toHaveCSS("box-shadow", /3px 4px/);
  await expect(page.getByTestId("window-material-preview").locator(".appearance-window-preview-card"))
    .toHaveCSS("backdrop-filter", "none");
});

test("Profile and Appearance open as real protected windows, with direct fallback routes", async ({ page }) => {
  await page.goto("/?panel=profile");
  const profile = page.getByTestId("cottage-live-profile");
  await expect(profile).toBeVisible();
  // Guest users must never see identity/presence data or editable profile controls.
  await expect(profile.locator('a[href="/"], a[href="/login"]').first()).toBeVisible();
  await expect(profile.locator('input[id="displayName"]')).toHaveCount(0);

  await page.getByTestId("workspace-utilities").locator("summary").click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  const appearance = page.getByTestId("cottage-live-appearance");
  await expect(appearance).toBeVisible();
  await expect(appearance.getByRole("link", { name: "Sign in to save all appearance" })).toBeVisible();
  await expect(appearance.getByTestId("window-style-fields")).toBeVisible();
  // The original routes remain usable when Phaser or window management is disabled.
  await page.goto("/settings/profile");
  await expect(page.locator('input[id="displayName"]')).toHaveCount(0);
  await expect(page.locator('a[href="/"], a[href="/login"]').first()).toBeVisible();
  await page.goto("/settings/appearance");
  await expect(page.locator('select[id="appearance-font"]')).toHaveCount(0);
  await expect(page.locator('a[href="/"], a[href="/login"]').first()).toBeVisible();
});

test("old room bookmarks redirect to the canonical home without losing panel selection", async ({ page }) => {
  await page.goto("/lab/cottage?panel=connections");
  await expect(page).toHaveURL(/\/?\?panel=connections$/);
  await expect(page.getByTestId("cottage-live-connections")).toBeVisible();
  await page.goto("/home");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".cottage-toolbar").getByText("Sengapp", { exact: true })).toBeVisible();
  await page.goto("/?panel=appearance");
  await expect(page.getByTestId("cottage-live-appearance")).toBeVisible();
});
