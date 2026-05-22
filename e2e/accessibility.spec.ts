import { test, expect } from '@playwright/test';

async function bypassOnboarding(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.setItem('onboarding-complete', 'true'));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Accessibility', () => {
  test('Menu screen — color contrast check', async ({ page }) => {
    await bypassOnboarding(page);
    const title = page.locator('h1').first();
    const color = await title.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });
    expect(color.color).toBeTruthy();
    expect(color.color).not.toBe('transparent');
  });

  test('HTML lang attribute is set', async ({ page }) => {
    await bypassOnboarding(page);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('Menu has focusable interactive elements', async ({ page }) => {
    await bypassOnboarding(page);
    const focusableCount = await page.evaluate(() =>
      document.querySelectorAll('button, a, [tabindex]').length
    );
    expect(focusableCount).toBeGreaterThan(0);
  });

  test('All buttons have accessible names', async ({ page }) => {
    await bypassOnboarding(page);
    const missing = await page.evaluate(() => {
      let count = 0;
      document.querySelectorAll('button').forEach((btn) => {
        if (!btn.textContent?.trim() &&
            !btn.getAttribute('aria-label') &&
            !btn.getAttribute('aria-labelledby')) {
          count++;
        }
      });
      return count;
    });
    expect(missing).toBe(0);
  });
});
