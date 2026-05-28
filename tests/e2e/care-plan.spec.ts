import { test, expect } from '@playwright/test';

// Requires authenticated session — set via storageState or test.use({ storageState })
// Skipped until auth state helpers are wired in CI

test.describe('Care plan view', () => {
  test.skip('care plan page shows disclaimer', async ({ page }) => {
    await page.goto('/care-plan');
    await expect(page.getByText(/educational/i)).toBeVisible();
    await expect(page.getByText(/not medical advice/i)).toBeVisible();
  });

  test.skip('care plan items are displayed', async ({ page }) => {
    await page.goto('/care-plan');
    await expect(page.locator('[data-testid="care-plan-item"]').first()).toBeVisible();
  });
});
