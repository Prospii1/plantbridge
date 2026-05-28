import { test, expect } from '@playwright/test';

test.describe('Outcome tracking', () => {
  test.skip('user can log an outcome and see it in history', async ({ page }) => {
    await page.goto('/tracking');
    await page.getByRole('button', { name: /log outcome/i }).click();
    await page.getByLabel(/rating/i).selectOption('4');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/logged/i)).toBeVisible();
  });
});
