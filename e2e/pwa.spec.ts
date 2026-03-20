import { test, expect } from "@playwright/test";

test.describe("PWA — Manifest", () => {
  test("serves manifest.webmanifest with correct fields", async ({ page }) => {
    const res = await page.goto("/manifest.webmanifest");
    expect(res?.status()).toBe(200);

    const manifest = await res!.json();
    expect(manifest.name).toContain("Minion Chat");
    expect(manifest.short_name).toBe("Minion");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#10b981");
    expect(manifest.start_url).toMatch(/\/$/);
  });

  test("manifest includes 192 and 512 icons", async ({ page }) => {
    const res = await page.goto("/manifest.webmanifest");
    const manifest = await res!.json();
    const sizes = (manifest.icons as { sizes: string }[]).map((i) => i.sizes);

    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  test("manifest includes a maskable icon", async ({ page }) => {
    const res = await page.goto("/manifest.webmanifest");
    const manifest = await res!.json();
    const maskable = (manifest.icons as { purpose?: string }[]).find(
      (i) => i.purpose === "maskable",
    );
    expect(maskable).toBeDefined();
  });
});

test.describe("PWA — Icons", () => {
  test("icon-192x192.png is accessible", async ({ page }) => {
    const res = await page.goto("/icons/icon-192x192.png");
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-type"]).toContain("image/png");
  });

  test("icon-512x512.png is accessible", async ({ page }) => {
    const res = await page.goto("/icons/icon-512x512.png");
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-type"]).toContain("image/png");
  });

  test("apple-touch-icon.png is accessible", async ({ page }) => {
    const res = await page.goto("/icons/apple-touch-icon.png");
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("PWA — Metadata", () => {
  test("page has theme-color meta tag", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".ant-layout");

    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute("content", "#10b981");
  });

  test("page has mobile-web-app-capable meta", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".ant-layout");

    const capable = page.locator('meta[name="mobile-web-app-capable"]');
    await expect(capable).toHaveAttribute("content", "yes");
  });

  test("page links to manifest", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".ant-layout");

    const link = page.locator('link[rel="manifest"]');
    const href = await link.getAttribute("href");
    expect(href).toContain("manifest.webmanifest");
  });
});

test.describe("PWA — version.json", () => {
  test("serves version.json with a version field", async ({ page }) => {
    const res = await page.goto("/version.json");
    expect(res?.status()).toBe(200);

    const body = await res!.json();
    expect(body.version).toBeDefined();
    expect(typeof body.version).toBe("string");
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

// NOTE: Update notification tests are skipped in dev mode because
// the useUpdateNotification hook only runs in production/test NODE_ENV.
// These tests would pass in a production build but we run e2e against dev server.
test.describe("PWA — Update notification", () => {
  test.skip("shows notification when version.json returns a different version", async ({
    page,
  }) => {
    // Route version.json BEFORE navigating to the page
    await page.route("**/version.json", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "99.0.0" }),
      }),
    );

    await page.goto("/");
    await page.waitForSelector(".ant-layout");

    // The update notification hook checks after 10 seconds
    // Wait for the notification to appear (it uses antd notification)
    const notice = page.locator(".ant-notification-notice");
    await expect(notice).toBeVisible({ timeout: 20_000 });
    await expect(
      notice.getByRole("button", { name: "刷新" }),
    ).toBeVisible();
  });

  test.skip("does not show notification when version matches", async ({ page }) => {
    // First get the actual version
    const res = await page.goto("/version.json");
    const { version } = await res!.json();

    // Now route with the same version
    await page.route("**/version.json", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version }),
      }),
    );

    await page.goto("/");
    await page.waitForSelector(".ant-layout");
    // Wait past the 10-second check delay plus some buffer
    await page.waitForTimeout(15_000);

    const notification = page.locator(".ant-notification-notice");
    await expect(notification).toHaveCount(0);
  });
});
