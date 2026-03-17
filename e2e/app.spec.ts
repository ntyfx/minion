import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".ant-layout");
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
    const groupTitle = page.locator(".ant-conversations-group-title");
    await expect(groupTitle.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Sidebar", () => {
  test("creates a new session via button", async ({ page }) => {
    const creationBtn = page.locator(".ant-conversations-creation");
    await expect(creationBtn).toBeVisible({ timeout: 10_000 });
    await creationBtn.click();
    await expect(
      page.locator(".ant-conversations-group-title"),
    ).toHaveCount(1, { timeout: 10_000 });
  });

  test("switches between sessions", async ({ page }) => {
    const creationBtn = page.locator(".ant-conversations-creation");
    await expect(creationBtn).toBeVisible({ timeout: 10_000 });

    const groupTrigger = page.locator(
      ".ant-conversations-group-collapse-trigger",
    );
    if ((await groupTrigger.count()) > 0) {
      await groupTrigger.first().click();
    }

    await creationBtn.click();
    await page.waitForTimeout(500);

    const items = page.locator("li[class*='ant-conversations-item']");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("collapses and expands sidebar", async ({ page }) => {
    const sider = page.locator(".ant-layout-sider");
    const trigger = page.locator(".ant-layout-sider-trigger");

    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
    await trigger.click({ force: true });
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
    await trigger.click({ force: true });
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
  });
});

test.describe("Chat", () => {
  test("shows welcome screen for empty session", async ({ page }) => {
    await expect(page.getByText("How can I help you?")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows prompt cards", async ({ page }) => {
    await expect(page.getByText("What can you do?")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Query player info")).toBeVisible();
  });

  test("displays sender input", async ({ page }) => {
    const sender = page.locator(".ant-sender");
    await expect(sender).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Press Enter to send")).toBeVisible();
  });
});

test.describe("Settings", () => {
  test("opens and closes settings drawer", async ({ page }) => {
    await page
      .locator('button[aria-label="Open settings"]')
      .first()
      .click({ force: true });

    const drawer = page.locator(".ant-drawer-content-wrapper");
    await expect(drawer).toBeVisible();
    await expect(
      page.getByText("Point the base URL to your running minion server."),
    ).toBeVisible();

    await page.locator(".ant-drawer-close").click();
    await expect(drawer).toBeHidden({ timeout: 10_000 });
  });

  test("saves base URL", async ({ page }) => {
    await page
      .locator('button[aria-label="Open settings"]')
      .first()
      .click({ force: true });

    const baseUrlInput = page.locator('input[aria-label="API Base URL"]');
    await expect(baseUrlInput).toBeVisible({ timeout: 10_000 });
    await baseUrlInput.fill("http://localhost:9090");

    await page.getByRole("button", { name: "Save" }).click();

    await page.locator(".ant-drawer-close").click();
    await page.locator(".ant-drawer-content-wrapper").waitFor({ state: "hidden", timeout: 10_000 });

    await page
      .locator('button[aria-label="Open settings"]')
      .first()
      .click({ force: true });
    const reopenedInput = page.locator('input[aria-label="API Base URL"]');
    await expect(reopenedInput).toBeVisible({ timeout: 10_000 });
    await expect(reopenedInput).toHaveValue("http://localhost:9090");
  });
});

test.describe("Activity Feed", () => {
  test("opens and closes activity drawer", async ({ page }) => {
    await page
      .locator('button[aria-label="Open activity feed"]')
      .first()
      .click({ force: true });

    const drawer = page.locator(".ant-drawer-content-wrapper");
    await expect(drawer).toBeVisible();
    await expect(page.getByText("Activity Feed")).toBeVisible();
    await expect(page.getByText("No events yet")).toBeVisible();

    await page.locator(".ant-drawer-close").click();
    await expect(drawer).toBeHidden({ timeout: 10_000 });
  });
});

test.describe("Theme", () => {
  test("toggles between dark and light mode", async ({ page }) => {
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");

    const themeBtn = page
      .locator('button[aria-label*="Switch to"]')
      .first();
    await themeBtn.click({ force: true });

    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);

    await themeBtn.click({ force: true });
    const restoredTheme = await html.getAttribute("data-theme");
    expect(restoredTheme).toBe(initialTheme);
  });

  test("persists theme after reload", async ({ page }) => {
    const themeBtn = page
      .locator('button[aria-label*="Switch to"]')
      .first();
    await themeBtn.click({ force: true });

    const themeAfterToggle = await page
      .locator("html")
      .getAttribute("data-theme");

    await page.reload();
    await page.waitForSelector(".ant-layout");

    const themeAfterReload = await page
      .locator("html")
      .getAttribute("data-theme");
    expect(themeAfterReload).toBe(themeAfterToggle);
  });
});
