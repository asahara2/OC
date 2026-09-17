import { test, expect, devices } from "@playwright/test";

test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:54329/__scenario", { data: { scenario: "journey" } }); });

test("continuous camera journey, native anchors, truthful assembly and final void", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 12 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.locator(".oc-entry")).toBeHidden();
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  const canvas = page.locator("canvas");
  const positions: number[][] = [];
  const stops = ["origin", "philosophy", "leadership", "charter", "latest", "assembly", "final-void"];
  for (const [i, stop] of stops.entries()) {
    await page.locator(`.oc-journey-map a[href="#${stop}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${stop}$`));
    await expect.poll(async () => Number(await canvas.getAttribute("data-progress"))).toBeGreaterThanOrEqual(Math.max(0, i / 6 - 0.02));
    positions.push((await canvas.getAttribute("data-camera"))!.split(",").map(Number));
    await page.getByRole("button", { name: "空間の動きを止める" }).click();
    await page.screenshot({ path: `test-results/journey-desktop-${stop}.png` });
    await page.getByRole("button", { name: "空間の動きを再開" }).click();
  }
  expect(Math.max(...positions.map((p) => p[0])) - Math.min(...positions.map((p) => p[0]))).toBeGreaterThan(4);
  expect(Math.max(...positions.map((p) => p[1])) - Math.min(...positions.map((p) => p[1]))).toBeGreaterThan(4);
  expect(positions[6][2]).toBeLessThan(-195);
  await expect(canvas).toHaveAttribute("data-visible-chambers", "0");
  await expect(page.locator(".oc-real-stats dd")).toHaveText(["01", "03", "01"]);
  await expect(page.locator(".oc-assembly-exhibit")).toHaveAttribute("data-voting-connected", "false");
  await expect(page.locator(".oc-vote-display dd")).toHaveText(["—未接続", "—未接続"]);
  expect(await page.locator("audio").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("core can be inspected with keyboard and raycast without scroll capture", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  // Read the projected center of the real mesh; do not guess screen coordinates.
  const coords = (await page.locator("canvas").getAttribute("data-core-screen"))!.split(",").map(Number);
  await page.mouse.move(coords[0], coords[1]);
  await expect(page.locator("canvas")).toHaveAttribute("data-core-hover", "true");
  await page.mouse.click(coords[0], coords[1]);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  const trigger = page.getByRole("button", { name: "Origin Coreをひらく" });
  await trigger.scrollIntoViewIfNeeded(); await trigger.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Origin Coreの説明を閉じる" }).click();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
});

test("reduced motion uses discrete still scenes; documents remain selectable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#charter");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  await expect(page.locator(".oc-entry")).toBeHidden();
  await expect(page.locator("canvas")).toHaveAttribute("data-progress", "0.5000");
  await expect(page.locator(".oc-archive-panel")).toHaveCount(3);
  const selection = await page.locator(".oc-archive-panel .prose").nth(1).evaluate((element) => {
    const range = document.createRange(); range.selectNodeContents(element);
    const selected = window.getSelection(); selected?.removeAllRanges(); selected?.addRange(range);
    return selected?.toString();
  });
  expect(selection).toContain("検索・選択できるHTML");
  await expect(page.locator(".oc-archive-panel").nth(1)).toContainText("HTMLとして保持します。");
  await page.locator('.oc-journey-map a[href="#final-void"]').click();
  await expect(page.locator("canvas")).toHaveAttribute("data-progress", "1.0000");
  await expect(page.locator("canvas")).toHaveAttribute("data-visible-chambers", "0");
});

test("mobile journey, actual portrait and long archive content never overflow", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  for (const stop of ["origin", "philosophy", "leadership", "charter", "latest", "assembly", "final-void"]) {
    await page.locator(`.oc-journey-map a[href="#${stop}"]`).click();
    await expect(page.locator(".oc-home")).toHaveAttribute("data-journey-scene", stop);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/journey-mobile-${stop}.png` });
  }
  await expect(page.locator(".oc-exhibition-portrait img")).toHaveAttribute("alt", "検証用 指導者の肖像");
  expect(await page.locator(".oc-exhibition-portrait img").evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await context.close();
});

test("manual pause freezes current camera, scroll and navigation still work", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  await page.locator('.oc-journey-map a[href="#leadership"]').click();
  await expect.poll(async () => Number(await page.locator("canvas").getAttribute("data-progress"))).toBeGreaterThan(0.3);
  await page.getByRole("button", { name: "空間の動きを止める" }).click();
  const before = await page.locator("canvas").getAttribute("data-camera");
  await page.locator('.oc-journey-map a[href="#assembly"]').click();
  await expect(page.locator(".oc-home")).toHaveAttribute("data-journey-scene", "assembly");
  expect(await page.locator("canvas").getAttribute("data-camera")).toBe(before);
  await page.getByRole("button", { name: "空間の動きを再開" }).click();
  await expect.poll(async () => Number(await page.locator("canvas").getAttribute("data-progress"))).toBeGreaterThan(0.8);
});

test("no JavaScript still serves complete readable content and native navigation", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "おっぱい共同体", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "共同体を知る" }).click();
  await expect(page).toHaveURL(/#philosophy$/);
  await expect(page.locator(".oc-archive-panel")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "OC2026@proton.me" })).toHaveAttribute("href", "mailto:OC2026@proton.me");
  await context.close();
});
