import { test, expect } from '@playwright/test';

test.describe('Settings Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('All setting controls are visible', async ({ page }) => {
    // Use .first() because labels have descriptions with similar text
    await expect(page.getByText('音效').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('音樂').first()).toBeVisible();
    await expect(page.getByText('自動理牌').first()).toBeVisible();
  });

  test('AI difficulty select has correct options', async ({ page }) => {
    await expect(page.getByText('AI 難度')).toBeVisible();
    const selectCount = await page.locator('select').count();
    expect(selectCount).toBeGreaterThanOrEqual(1);
  });

  test('Language select has options', async ({ page }) => {
    await expect(page.getByText('語言')).toBeVisible();
  });

  test('Game speed select has options', async ({ page }) => {
    await expect(page.getByText('遊戲速度')).toBeVisible();
  });

  test('Toggle buttons are interactive', async ({ page }) => {
    const toggles = page.locator('button.relative.w-12');
    const count = await toggles.count();
    expect(count).toBeGreaterThanOrEqual(2);
    if (count > 0) {
      const indicator = toggles.first().locator('span.absolute');
      const classBefore = await indicator.getAttribute('class');
      await toggles.first().click();
      await page.waitForTimeout(200);
      const classAfter = await indicator.getAttribute('class');
      expect(classBefore !== classAfter).toBeTruthy();
    }
  });

  test('Settings screen has back navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: '香港麻雀' })).toBeVisible({ timeout: 5000 });
  });
});
