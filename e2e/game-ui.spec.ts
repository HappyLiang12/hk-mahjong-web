import { test, expect } from '@playwright/test';

test.describe('Game Screen — UI Rendering', () => {
  test('Game screen loads with 3D canvas', async ({ page }) => {
    await page.goto('/game');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('canvas')).toBeAttached({ timeout: 15000 });
  });

  test('Game screen — no page crash or white screen', async ({ page }) => {
    await page.goto('/game');
    await page.waitForTimeout(3000);
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);
  });

  test('EndGame screen loads without crash', async ({ page }) => {
    await page.goto('/game/result');
    await page.waitForLoadState('networkidle');
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('Scoring screen loads without crash', async ({ page }) => {
    await page.goto('/game/scoring');
    await page.waitForLoadState('networkidle');
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });
});
