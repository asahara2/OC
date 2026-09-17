import { test, expect, devices } from "@playwright/test";

const environments = [
  { name: "desktop", viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 },
  { name: "laptop", viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  { name: "tablet", ...devices["iPad Mini"] },
  { name: "iphone", ...devices["iPhone 13"] },
  { name: "android", ...devices["Pixel 7"] },
];

test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54329/__scenario", { data: { scenario: "empty" } });
});

for (const device of environments) {
  test(`${device.name}: composition, navigation, console and hydration`, async ({ browser }) => {
    const context = await browser.newContext({ ...device, reducedMotion: "reduce" });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 12 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/");
    await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
    await expect(page.locator(".oc-scene")).toHaveAttribute("data-quality", device.name === "desktop" || device.name === "laptop" ? "high" : "medium");
    await expect(page.locator("h1")).toContainText("おっぱい共同体");
    await expect(page.locator(".oc-hero-description")).toHaveText("おっぱいの起源を探り自由に進行する次世代宗教");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (device.viewport.width <= 900) {
      const titleLines = await page.locator("h1").evaluate((title) => title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight));
      expect(titleLines).toBeLessThan(1.2);
    }
    await page.screenshot({ path: `test-results/${device.name}-hero.png` });
    await page.locator("#charter").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/${device.name}-charter.png` });
    await page.locator(".oc-footer").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/${device.name}-footer.png` });
    await expect(page.getByText("OC新興宗教団体", { exact: true })).toBeAttached();
    await expect(page.getByRole("link", { name: "OC2026@proton.me" })).toHaveAttribute("href", "mailto:OC2026@proton.me");
    await expect(page.getByText("素晴らしい尊師", { exact: true })).toBeAttached();
    if (device.viewport.width <= 900) {
      await page.getByRole("button", { name: "メニューを開く" }).click();
      await expect(page.locator("#public-navigation")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("#public-navigation")).toBeHidden();
      await page.getByRole("button", { name: "メニューを開く" }).click();
    }
    await page.locator("#public-navigation").getByRole("link", { name: /ニュース/ }).click();
    await expect(page).toHaveURL(/\/news$/);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("WebGL disabled: complete CSS fallback and accessible links", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null;
      return original.call(this, type as "2d", ...args);
    } as typeof original;
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "共同体を知る" })).toBeVisible();
  await page.screenshot({ path: "test-results/fallback-mobile.png" });
  await context.close();
});

test("live settings, content, detail routes and admin isolation", async ({ page, request }) => {
  await request.post("http://127.0.0.1:54329/__scenario", { data: { scenario: "custom" } });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("管理画面で設定した共同体名");
  await expect(page.locator(".oc-hero-description")).toHaveText("管理画面で設定したキャッチコピー");
  await expect(page.getByRole("heading", { name: "検証用 指導者" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "検証用条文" })).toBeVisible();
  await page.goto("/constitution");
  await expect(page.getByRole("heading", { name: "前文", exact: true })).toBeVisible();
  await expect(page.locator(".oc-constitution-preamble")).toContainText("自由な探究を尊重します。");
  await page.goto("/");
  await page.getByRole("link", { name: /検証用ニュース/ }).click();
  await expect(page).toHaveURL(/\/news\/ui-verification$/);
  await expect(page.locator(".oc-reading-body")).toContainText("<script>");
  expect(await page.evaluate(() => "unwanted" in window)).toBe(false);
  const unauthorized = await request.get("/admin");
  expect(unauthorized.status()).toBe(401);
  const admin = await page.context().browser()!.newContext({ httpCredentials: { username: "ui-test", password: "ui-test-password" } });
  const adminPage = await admin.newPage();
  const scripts: string[] = [];
  adminPage.on("request", (req) => { if (req.resourceType() === "script") scripts.push(req.url()); });
  await adminPage.goto("/admin");
  await expect(adminPage.getByRole("heading", { name: "概要", exact: true })).toBeVisible();
  await expect(adminPage.locator("canvas, .oc-scene, .public-site")).toHaveCount(0);
  expect(scripts.some((url) => /origin-canvas/.test(url))).toBe(false);
  await admin.close();
});

test("animation pause, preference change, context loss and repeated navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  await page.getByRole("button", { name: "空間の動きを止める" }).click();
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-motion", "still");
  await page.getByRole("button", { name: "空間の動きを再開" }).click();
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-motion", "full");
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-motion", "still");
  for (let i = 0; i < 3; i++) {
    await page.locator("#public-navigation").getByRole("link", { name: /ニュース/ }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.locator(".oc-wordmark").click();
    await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
    await expect(page.locator("canvas")).toHaveCount(1);
  }
  await page.locator("canvas").evaluate((canvas) => (canvas as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext());
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("low-powered mobile limits quality and resolution", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"], reducedMotion: "reduce" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 2 });
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-quality", "low");
  const ratio = await page.locator("canvas").evaluate((node) => (node as HTMLCanvasElement).width / node.clientWidth);
  expect(ratio).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/low-mobile.png" });
  await context.close();
});

test("GPU objects and animation frames are released on route unmount", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const live = { texture: 0, buffer: 0, program: 0, framebuffer: 0, draw: 0 };
    const probes: Record<string, () => number> = {};
    (window as unknown as { gpuSnapshot: () => typeof live }).gpuSnapshot = () => ({
      texture: probes.texture(), buffer: probes.buffer(), program: probes.program(), framebuffer: probes.framebuffer(), draw: live.draw,
    });
    const prototype = WebGL2RenderingContext.prototype as unknown as Record<string, (...args: unknown[]) => unknown>;
    const pairs = [["createTexture", "deleteTexture", "texture"], ["createBuffer", "deleteBuffer", "buffer"], ["createProgram", "deleteProgram", "program"], ["createFramebuffer", "deleteFramebuffer", "framebuffer"]] as const;
    for (const [create, remove, key] of pairs) {
      const allocated = new Map<object, WebGL2RenderingContext>();
      // Three retains internal scratch targets until context loss. Verify actual
      // WebGL validity, including forceContextLoss, rather than JS handle counts.
      probes[key] = () => Array.from(allocated.values()).filter((context) => !context.isContextLost()).length;
      const make = prototype[create], dispose = prototype[remove];
      prototype[create] = function (this: WebGL2RenderingContext, ...args: unknown[]) {
        const resource = make.apply(this, args);
        if (resource && typeof resource === "object") { allocated.set(resource, this); live[key]++; }
        return resource;
      };
      prototype[remove] = function (this: WebGL2RenderingContext, ...args: unknown[]) {
        if (allocated.delete(args[0] as object)) live[key]--;
        return dispose.apply(this, args);
      };
    }
    const draw = prototype.drawElements;
    prototype.drawElements = function (this: WebGL2RenderingContext, ...args: unknown[]) { live.draw++; return draw.apply(this, args); };
  });
  await page.goto("/");
  await expect(page.locator(".oc-scene")).toHaveAttribute("data-renderer", "webgl", { timeout: 30000 });
  const sample = () => page.evaluate(() => (window as unknown as { gpuSnapshot: () => { texture: number; buffer: number; program: number; framebuffer: number; draw: number } }).gpuSnapshot());
  expect((await sample()).buffer).toBeGreaterThan(0);
  const before = (await sample()).draw;
  // Wait for several display frames: reduced motion must not render continuously.
  await page.evaluate(() => new Promise<void>((resolve) => { let frames = 0; const tick = () => { if (++frames >= 12) resolve(); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); }));
  expect((await sample()).draw).toBe(before);
  await page.locator("#public-navigation").getByRole("link", { name: /ニュース/ }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect.poll(async () => { const { draw: _draw, ...resources } = await sample(); void _draw; return resources; }).toEqual({ texture: 0, buffer: 0, program: 0, framebuffer: 0 });
});
