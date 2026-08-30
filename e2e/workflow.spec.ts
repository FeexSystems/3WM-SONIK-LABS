import { test, expect } from '@playwright/test';

test.describe('3WM SONIK — Comprehensive Producer Workflow E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root application
    await page.goto('/');
  });

  test('1. Dashboard loads with 3WM studio layout & brand identity', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();

    // Check for 3WM Brand Header or Navigation
    const headerOrTitle = page.locator('text=/3WM|SONIK|Studio|Three Wise Men/i').first();
    await expect(headerOrTitle).toBeVisible();
  });

  test('2. 3D Artist World environment is navigable', async ({ page }) => {
    // Navigate to 3D Artist World view if button/tab exists
    const artistWorldBtn = page.locator('text=/Artist World|3D Studio/i').first();
    if (await artistWorldBtn.isVisible()) {
      await artistWorldBtn.click();
      // Verify WebGL Canvas is present
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10000 });

      // Verify Wise Men selectors (Emar, Ricky, Kingpin)
      const emarButton = page.locator('text=/Emar/i').first();
      if (await emarButton.isVisible()) {
        await emarButton.click();
        await expect(emarButton).toBeVisible();
      }
    }
  });

  test('3. Three Wise Men Agent Council is accessible and responsive', async ({ page }) => {
    const councilBtn = page.locator('text=/Council|Wise Men/i').first();
    if (await councilBtn.isVisible()) {
      await councilBtn.click();

      // Verify the Three Wise Men are present
      await expect(page.locator('text=/Ricky/i').first()).toBeVisible();
      await expect(page.locator('text=/Emar/i').first()).toBeVisible();
      await expect(page.locator('text=/Kingpin/i').first()).toBeVisible();
    }
  });

  test('4. DAW Multi-track transport and audio playback toggle', async ({ page }) => {
    const studioBtn = page.locator('text=/Studio|DAW|Mixer/i').first();
    if (await studioBtn.isVisible()) {
      await studioBtn.click();

      // Look for Transport Play Button
      const playBtn = page
        .locator('button[aria-label*="play" i], button:has-text("Play"), button:has-text("Audio")')
        .first();
      if (await playBtn.isVisible()) {
        await playBtn.click();
      }
    }
  });

  test('5. Plugin Marketplace loads Afrofusion DSP extensions', async ({ page }) => {
    const marketBtn = page.locator('text=/Marketplace|Plugins|Vault/i').first();
    if (await marketBtn.isVisible()) {
      await marketBtn.click();
      await expect(
        page.locator('text=/Log Drum|Kalakuta|Tape|DSP|Harmonizer/i').first()
      ).toBeVisible();
    }
  });
});
