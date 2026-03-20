import { test, expect } from "@playwright/test";

test.use({ locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".ant-layout", { timeout: 10_000 });
});

test.describe("Sidebar search and filters", () => {
  test("shows search input and Active / Archived filters", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Conversations" });
    await expect(nav).toBeVisible({ timeout: 10_000 });

    const searchInput = nav.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await expect(nav.getByRole("button", { name: "Active" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(nav.getByRole("button", { name: /Archived/ })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Header actions", () => {
  test("shows export button in header", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible({ timeout: 10_000 });
    await expect(
      header.getByRole("button", { name: "Export conversation" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows bookmark button in header", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByRole("button", { name: "Knowledge Base" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows template button in header", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByRole("button", { name: "Prompt Templates" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows sequence button in header", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByRole("button", { name: "Sequences" })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Dashboard (no session selected)", () => {
  test("shows title and quick actions", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("minion-active-session", "");
    });
    await page.reload();
    await page.waitForSelector(".ant-layout", { timeout: 10_000 });

    const dashboard = page.locator(".dashboard-root");
    await expect(dashboard).toBeVisible({ timeout: 10_000 });
    await expect(dashboard.getByText("Minion Chat").first()).toBeVisible({
      timeout: 10_000,
    });

    const quickBtns = dashboard.locator(".dashboard-quick-btn");
    await expect(quickBtns.first()).toBeVisible({ timeout: 10_000 });
    expect(await quickBtns.count()).toBeGreaterThan(0);
  });
});

test.describe("Slash commands", () => {
  test("opens slash popup when typing / in sender", async ({ page }) => {
    // Other tests may leave `minion-active-session` empty (dashboard); restore default selection.
    await page.evaluate(() => localStorage.removeItem("minion-active-session"));
    await page.reload();
    await page.waitForSelector(".ant-layout", { timeout: 10_000 });

    await expect(page.getByText("How can I help you?")).toBeVisible({
      timeout: 15_000,
    });

    const sender = page.locator(".ant-sender");
    await expect(sender).toBeVisible({ timeout: 15_000 });

    const senderInput = sender.locator("textarea");
    await expect(senderInput).toBeVisible({ timeout: 10_000 });
    await senderInput.click();
    await senderInput.fill("/");

    await expect(page.locator(".slash-popup")).toBeVisible({ timeout: 10_000 });
  });
});
