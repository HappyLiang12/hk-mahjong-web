import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('Menu: Tab navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeAttached();
  });

  test('Settings: Tab through toggle buttons', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.locator(':focus')).toBeAttached();
  });

  test('Settings: Space toggles interaction', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page.getByText('音效').first()).toBeVisible({ timeout: 5000 });
  });

  test('Lobby: Keyboard interaction does not crash', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/lobby');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByText('標準模式')).toBeVisible({ timeout: 5000 });
  });
});
