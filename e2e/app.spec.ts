import { test, expect } from "@playwright/test";

const TEST_BASE_PATH = process.env.TEST_BASE_PATH || "/";
const TEST_ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || "test-token-for-development";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  const basePath = TEST_BASE_PATH || "/";
  await page.goto(basePath);
  await page.waitForSelector(".ant-layout", { timeout: 10_000 });

  const activeSessionId = await page.evaluate(() =>
    localStorage.getItem("minion-active-session"),
  );

  await page.evaluate(({ accessToken, baseUrl, sid }) => {
    localStorage.clear();
    localStorage.setItem("minion-chat-locale", "en-US");
    localStorage.setItem("minion-demo-access-token", accessToken);
    localStorage.setItem("minion-demo-base-url", baseUrl);
    if (sid) localStorage.setItem("minion-active-session", sid);
  }, {
    accessToken: TEST_ACCESS_TOKEN,
    baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
    sid: activeSessionId,
  });

  await page.reload();
  await page.waitForSelector(".ant-layout", { timeout: 10_000 });
});

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test.describe("Page load", () => {
  test("loads without blank flash", async ({ page }) => {
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const bg = await body.evaluate((el) =>
      getComputedStyle(el).backgroundColor,
    );
    expect(bg).not.toBe("");
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("creates a default session on first load", async ({ page }) => {
    const conversations = page.locator(".ant-conversations");
    await expect(conversations).toBeVisible({ timeout: 10_000 });
    // Check that at least one conversation item exists (the default session)
    const items = page.locator("li[class*='ant-conversations-item']");
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Sidebar", () => {
  test("creates a new session via button", async ({ page }) => {
    const creationBtn = page.locator(".ant-conversations-creation");
    await expect(creationBtn).toBeVisible({ timeout: 10_000 });
    
    // Get initial count
    const items = page.locator("li[class*='ant-conversations-item']");
    const initialCount = await items.count();
    
    await creationBtn.click();
    await page.waitForTimeout(500);
    
    // Should have one more session
    await expect(items).toHaveCount(initialCount + 1, { timeout: 10_000 });
  });

  test("switches between sessions", async ({ page }) => {
    const creationBtn = page.locator(".ant-conversations-creation");
    await expect(creationBtn).toBeVisible({ timeout: 10_000 });

    await creationBtn.click();
    await page.waitForTimeout(500);

    const items = page.locator("li[class*='ant-conversations-item']");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("collapses and expands sidebar", async ({ page }) => {
    const sider = page.locator(".ant-layout-sider");
    // Use the custom collapse button with aria-label (English: Collapse sidebar / Expand sidebar)
    const collapseBtn = page.locator('button[aria-label="Collapse sidebar"]');
    const expandBtn = page.locator('button[aria-label="Expand sidebar"]');

    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
    await expect(collapseBtn).toBeVisible({ timeout: 10_000 });
    await collapseBtn.click();
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
    
    await expect(expandBtn).toBeVisible({ timeout: 10_000 });
    await expandBtn.click();
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
  });
});

test.describe("Chat", () => {
  test("shows welcome screen for empty session", async ({ page }) => {
    // The welcome title in English: "How can I help you?"
    await expect(page.getByText("How can I help you?")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows prompt cards", async ({ page }) => {
    // Check for actual prompt labels from en_US.json
    // Use getByRole to be more specific and avoid matching multiple elements
    await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { name: "Query data" })).toBeVisible();
  });

  test("displays sender input", async ({ page }) => {
    const sender = page.locator(".ant-sender");
    await expect(sender).toBeVisible({ timeout: 10_000 });
    // The actual hint text from en_US.json: "Enter to send · Shift+Enter for new line · Changes require confirmation"
    await expect(page.getByText("Enter to send")).toBeVisible();
  });
});

test.describe("Settings", () => {
  test("opens and closes settings modal", async ({ page }) => {
    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
    await settingsBtn.click();

    const modal = page.locator(".ant-modal-wrap");
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByText("Point the base URL to your running Minion server."),
    ).toBeVisible();

    await page.locator(".ant-modal-close").click();
    await expect(modal).toBeHidden({ timeout: 10_000 });
  });

  test("saves base URL", async ({ page }) => {
    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
    await settingsBtn.click();

    const modal = page.locator(".ant-modal-wrap");
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const baseUrlInput = page.locator('input[aria-label="API Base URL"]');
    await expect(baseUrlInput).toBeVisible({ timeout: 10_000 });
    await baseUrlInput.fill("http://localhost:9090");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(modal).toBeHidden({ timeout: 10_000 });

    await settingsBtn.click();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const reopenedInput = page.locator('input[aria-label="API Base URL"]');
    await expect(reopenedInput).toBeVisible({ timeout: 10_000 });
    await expect(reopenedInput).toHaveValue("http://localhost:9090");
  });
});

test.describe("Activity Feed", () => {
  test("opens and closes activity drawer", async ({ page }) => {
    // Use data-testid selector for better stability
    const activityBtn = page.locator('[data-testid="activity-button"]');
    await expect(activityBtn).toBeVisible({ timeout: 10_000 });
    await activityBtn.click();

    const drawer = page.locator('[data-testid="activity-feed-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    // English: "Activity Feed" - use a more specific selector
    // Try to find the text within the drawer only
    await expect(drawer.getByText("Activity Feed")).toBeVisible();
    // English: "No events yet"
    await expect(drawer.getByText("No events yet")).toBeVisible();

    await page.locator(".ant-drawer-close").click();
    await expect(drawer).toBeHidden({ timeout: 10_000 });
  });
});

test.describe("Theme", () => {
  test("toggles between themes via settings", async ({ page }) => {
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");

    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
    await settingsBtn.click();

    const modal = page.locator(".ant-modal-wrap");
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const allThemeBtns = page.locator('[data-testid^="theme-button-"]');
    const themeBtnCount = await allThemeBtns.count();

    let themeBtnToClick = null;
    for (let i = 0; i < themeBtnCount; i++) {
      const btn = allThemeBtns.nth(i);
      const testId = await btn.getAttribute("data-testid");
      if (testId && initialTheme) {
        const themeName = testId.replace("theme-button-", "").toLowerCase();
        if (themeName !== initialTheme.toLowerCase()) {
          themeBtnToClick = btn;
          break;
        }
      }
    }

    if (!themeBtnToClick && themeBtnCount > 0) {
      themeBtnToClick = allThemeBtns.nth(1);
    }

    if (themeBtnToClick) {
      await expect(themeBtnToClick).toBeVisible({ timeout: 10_000 });
      await themeBtnToClick.click();
    }

    await page.locator(".ant-modal-close").click();
    await expect(modal).toBeHidden({ timeout: 10_000 });

    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
  });

  test("persists theme after reload", async ({ page }) => {
    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
    await settingsBtn.click();

    const modal = page.locator(".ant-modal-wrap");
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const themeBtns = page.locator('[data-testid^="theme-button-"]');
    await expect(themeBtns.first()).toBeVisible({ timeout: 10_000 });
    await themeBtns.nth(1).click();

    await page.locator(".ant-modal-close").click();
    await expect(modal).toBeHidden({ timeout: 10_000 });

    const themeAfterToggle = await page
      .locator("html")
      .getAttribute("data-theme");

    await page.reload();
    await page.waitForSelector(".ant-layout", { timeout: 10_000 });

    const themeAfterReload = await page
      .locator("html")
      .getAttribute("data-theme");
    expect(themeAfterReload).toBe(themeAfterToggle);
  });
});
