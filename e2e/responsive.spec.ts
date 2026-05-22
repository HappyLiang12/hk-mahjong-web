import { test, expect } from '@playwright/test';

async function bypassOnboarding(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Responsive Layout', () => {
  test.describe('Desktop — 1920×1080', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('Menu renders correctly at desktop', async ({ page }) => {
      await bypassOnboarding(page);
      await expect(page.getByRole('heading', { name: '香港麻雀' })).toBeVisible({ timeout: 5000 });
    });

    test('Settings renders correctly at desktop', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('音效').first()).toBeVisible({ timeout: 5000 });
    });

    test('Game screen canvas renders at desktop', async ({ page }) => {
      await page.goto('/game');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('canvas')).toBeAttached({ timeout: 15000 });
    });
  });

  test.describe('Tablet — 1024×768', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('Menu renders correctly at tablet', async ({ page }) => {
      await bypassOnboarding(page);
      await expect(page.getByRole('heading', { name: '香港麻雀' })).toBeVisible({ timeout: 5000 });
    });

    test('Game screen canvas renders at tablet', async ({ page }) => {
      await page.goto('/game');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('canvas')).toBeAttached({ timeout: 15000 });
    });

    test('No horizontal overflow on menu', async ({ page }) => {
      await bypassOnboarding(page);
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });
  });

  test.describe('Mobile-ish — 390×844', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('Menu does not crash at mobile size', async ({ page }) => {
      await bypassOnboarding(page);
      await expect(page.getByRole('heading', { name: '香港麻雀' })).toBeVisible({ timeout: 5000 });
    });
  });
});
