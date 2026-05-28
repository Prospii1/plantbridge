import { test, expect } from '@playwright/test';

test.describe('Intake flow', () => {
  test.skip('authenticated user can reach onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test.skip('completing intake generates a care plan', async ({ page }) => {
    await page.goto('/onboarding');
    // Answer questions — requires knowledge of current question IDs from questions.v1.json
    // Stubbed: wire up when E2E fixtures are in place
    await page.getByRole('button', { name: /next/i }).first().click();
    await expect(page).toHaveURL(/care-plan/);
  });
});
