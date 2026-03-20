import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".ant-layout");
});

test.describe("Token Report", () => {
  test("opens and closes the token report modal", async ({ page }) => {
    const reportBtn = page.locator(
      'button[aria-label="tokenReport.openReport"]',
    );
    await expect(reportBtn).toBeVisible({ timeout: 10_000 });
    await reportBtn.click();

    const modal = page.locator(".ant-modal");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await page.locator(".ant-modal-close").click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  });

  test("shows empty state when no usage data", async ({ page }) => {
    const reportBtn = page.locator(
      'button[aria-label="tokenReport.openReport"]',
    );
    await reportBtn.click();

    const modal = page.locator(".ant-modal");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const emptyImage = modal.locator(".ant-empty");
    await expect(emptyImage).toBeVisible({ timeout: 5_000 });
  });

  test("navigates between months", async ({ page }) => {
    const reportBtn = page.locator(
      'button[aria-label="tokenReport.openReport"]',
    );
    await reportBtn.click();

    const modal = page.locator(".ant-modal");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const nextBtn = modal.locator('button[aria-label="Next month"]');
    await expect(nextBtn).toBeDisabled();

    const prevBtn = modal.locator('button[aria-label="Previous month"]');
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();

    await expect(nextBtn).toBeEnabled();
  });

  test("displays month label in header", async ({ page }) => {
    const reportBtn = page.locator(
      'button[aria-label="tokenReport.openReport"]',
    );
    await reportBtn.click();

    const modal = page.locator(".ant-modal");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const year = new Date().getFullYear().toString();
    await expect(modal.getByText(year, { exact: false })).toBeVisible();
  });
});
