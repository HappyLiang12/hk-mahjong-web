import { test, expect } from '@playwright/test';

async function bypassOnboarding(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Visual Regression — Screenshot Snapshots', () => {
  test('Menu screen snapshot', async ({ page }) => {
    await bypassOnboarding(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('menu-desktop.png', {
      fullPage: true, maxDiffPixels: 5000,
    });
  });

  test('Settings screen snapshot', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('settings-desktop.png', {
      fullPage: true, maxDiffPixels: 5000,
    });
  });

  test('Lobby screen snapshot', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/lobby');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('lobby-desktop.png', {
      fullPage: true, maxDiffPixels: 5000,
    });
  });

  test('Game screen — 3D table snapshot', async ({ page }) => {
    await page.goto('/game');
    await page.waitForTimeout(4000);
    await expect(page).toHaveScreenshot('game-table-desktop.png', {
      fullPage: true, maxDiffPixels: 10000,
    });
  });

  test('Stats screen snapshot', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('stats-desktop.png', {
      fullPage: true, maxDiffPixels: 5000,
    });
  });
});
