import { test, expect } from '@playwright/test';

test.describe('Error States & Edge Cases', () => {
  test('Rapid navigation between screens — no crash', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    const screens = ['/lobby', '/settings', '/tutorial', '/stats'];
    for (const screen of screens) {
      await page.goto(screen);
      await page.waitForTimeout(300);
    }
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '香港麻雀' })).toBeVisible({ timeout: 5000 });
  });

  test('Refresh on game page — recovers', async ({ page }) => {
    await page.goto('/game');
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Browser back/forward navigation works', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.goto('/tutorial');
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await expect(page).toHaveURL('/settings');
    await page.goForward();
    await expect(page).toHaveURL('/tutorial');
  });

  test('Direct URL access to game — canvas renders', async ({ page }) => {
    await page.goto('/game');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 15000 });
  });

  test('localStorage corruption — recovers gracefully', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.evaluate(() => localStorage.setItem('settings', '{invalid json'));
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
