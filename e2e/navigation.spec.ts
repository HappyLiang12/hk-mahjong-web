import { test, expect } from '@playwright/test';

async function bypassOnboarding(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Screen Navigation', () => {
  test('Menu screen — title and menu items visible', async ({ page }) => {
    await bypassOnboarding(page);
    // Use getByRole to avoid strict mode (two elements have "香港麻雀")
    await expect(page.getByRole('heading', { name: '香港麻雀' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('新遊戲').first()).toBeVisible();
    await expect(page.getByText('設定').first()).toBeVisible();
    await expect(page.getByText('教學').first()).toBeVisible();
    await expect(page.getByText('統計').first()).toBeVisible();
  });

  test('Navigate: Menu → Settings → back to Menu', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('設定').first().click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByText('音效').first()).toBeVisible({ timeout: 5000 });
    // Click the brand link to go home
    await page.getByRole('link', { name: '香港麻雀' }).click();
    await expect(page).toHaveURL('/');
  });

  test('Navigate: Menu → Lobby → back', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('新遊戲').first().click();
    await expect(page).toHaveURL('/lobby');
    await expect(page.getByText('標準模式')).toBeVisible();
    await expect(page.getByText('休閒模式')).toBeVisible();
    await expect(page.getByText('競技模式')).toBeVisible();
  });

  test('Navigate: Menu → Tutorial', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('教學').first().click();
    await expect(page).toHaveURL('/tutorial');
  });

  test('Navigate: Menu → Stats', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('統計').first().click();
    await expect(page).toHaveURL('/stats');
  });

  test('Navigate: Menu → Achievements', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('成就').first().click();
    await expect(page).toHaveURL('/achievements');
  });

  test('Navigate: Menu → Leaderboard', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('排行榜').first().click();
    await expect(page).toHaveURL('/leaderboard');
  });

  test('Navigate: Menu → Practice', async ({ page }) => {
    await bypassOnboarding(page);
    await page.getByText('練習模式').first().click();
    await expect(page).toHaveURL('/practice');
  });

  test('Onboarding redirect on first visit', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('onboarding-complete'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/onboarding');
  });

  test('404 page for unknown route', async ({ page }) => {
    await bypassOnboarding(page);
    await page.goto('/nonexistent-route');
    await expect(page.getByText('404')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('呢頁唔存在')).toBeVisible();
  });
});
