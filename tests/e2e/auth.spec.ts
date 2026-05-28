import { test, expect } from '@playwright/test';

// Requires: local Supabase running, pnpm dev running, seeded test user
// Run: pnpm test:e2e

test.describe('Auth flow', () => {
  test('signup page renders', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('unauthenticated user is redirected from /care-plan to /login', async ({ page }) => {
    await page.goto('/care-plan');
    await expect(page).toHaveURL(/login/);
  });
});
