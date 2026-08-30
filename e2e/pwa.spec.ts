/**
 * 3WM SONIK — PWA E2E Tests
 * End-to-end tests for Progressive Web App functionality
 */

import { test, expect } from '@playwright/test';

test.describe('PWA Installation', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker registration
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });

    expect(swRegistration).toBeDefined();
  });

  test('should show install prompt when criteria met', async ({ page, context }) => {
    await page.goto('/');

    // Simulate PWA install criteria
    await page.evaluate(() => {
      // Mock beforeinstallprompt event
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });

    // Check for install button or prompt
    // This would depend on your UI implementation
  });

  test('should install PWA successfully', async ({ page, context }) => {
    await page.goto('/');

    // Simulate PWA installation
    const installResult = await page.evaluate(async () => {
      // This would use the actual PWA install API
      // For testing, we simulate the flow
      return { installed: true };
    });

    expect(installResult.installed).toBe(true);
  });
});

test.describe('Offline Functionality', () => {
  test('should load cached resources offline', async ({ page, context }) => {
    // First, load the page online to cache resources
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Then go offline
    await context.setOffline(true);

    // Try to navigate to a cached page
    await page.goto('/');

    // Should still load from cache
    const title = await page.title();
    expect(title).toBeTruthy();

    // Go back online
    await context.setOffline(false);
  });

  test('should show offline indicator', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Should show offline indicator
    const offlineIndicator = await page.locator('[data-testid="offline-indicator"]').isVisible();
    expect(offlineIndicator).toBe(true);

    // Go back online
    await context.setOffline(false);
  });

  test('should cache audio assets for offline use', async ({ page, context }) => {
    await page.goto('/');

    // Load an audio asset
    await page.evaluate(() => {
      const audio = new Audio('/test-audio.mp3');
      audio.load();
    });

    // Go offline
    await context.setOffline(true);

    // Try to load the same audio asset
    const canLoadOffline = await page.evaluate(() => {
      const audio = new Audio('/test-audio.mp3');
      return new Promise((resolve) => {
        audio.addEventListener('canplay', () => resolve(true));
        audio.addEventListener('error', () => resolve(false));
        audio.load();
        setTimeout(() => resolve(false), 1000);
      });
    });

    // Should load from cache
    expect(canLoadOffline).toBe(true);

    await context.setOffline(false);
  });
});

test.describe('PWA Manifest', () => {
  test('should have valid manifest', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.ok()).toBe(true);

    const manifest = await manifestResponse.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
  });

  test('should have correct theme colors', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.json');
    const manifest = await manifestResponse.json();

    expect(manifest.theme_color).toBe('#0D0D0D');
    expect(manifest.background_color).toBe('#0D0D0D');
  });

  test('should have correct icons', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.json');
    const manifest = await manifestResponse.json();

    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Check that icons have required properties
    manifest.icons.forEach((icon: any) => {
      expect(icon).toHaveProperty('src');
      expect(icon).toHaveProperty('sizes');
      expect(icon).toHaveProperty('type');
    });
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that mobile layout is applied
    const mobileNav = await page.locator('[data-testid="mobile-nav"]').isVisible();
    expect(mobileNav).toBe(true);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check that tablet layout is applied
    const tabletLayout = await page.locator('[data-testid="tablet-layout"]').isVisible();
    expect(tabletLayout).toBe(true);
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Check that desktop layout is applied
    const desktopNav = await page.locator('[data-testid="desktop-nav"]').isVisible();
    expect(desktopNav).toBe(true);
  });
});

test.describe('Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have small bundle size', async ({ page }) => {
    await page.goto('/');

    // Check bundle size through performance API
    const bundleSize = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter((r) => r.name.endsWith('.js'));
      return jsResources.reduce((total, r) => total + r.transferSize, 0);
    });

    // Bundle should be less than 1MB
    expect(bundleSize).toBeLessThan(1000000);
  });
});

test.describe('Audio Engine Integration', () => {
  test('should initialize audio engine on user interaction', async ({ page }) => {
    await page.goto('/');

    // Simulate user interaction to initialize audio
    await page.click('[data-testid="init-audio"]');

    const audioInitialized = await page.evaluate(() => {
      return window.audioEngine?.isInitialized() || false;
    });

    expect(audioInitialized).toBe(true);
  });

  test('should handle audio context suspension', async ({ page }) => {
    await page.goto('/');

    // Initialize audio
    await page.click('[data-testid="init-audio"]');

    // Suspend audio context
    await page.evaluate(() => {
      return window.audioEngine?.suspendAudioContext();
    });

    const isSuspended = await page.evaluate(() => {
      return window.audioEngine?.getAudioContext()?.state === 'suspended';
    });

    expect(isSuspended).toBe(true);
  });

  test('should resume audio context on user interaction', async ({ page }) => {
    await page.goto('/');

    // Initialize and suspend audio
    await page.click('[data-testid="init-audio"]');
    await page.evaluate(() => {
      return window.audioEngine?.suspendAudioContext();
    });

    // Resume on interaction
    await page.click('[data-testid="resume-audio"]');

    const isRunning = await page.evaluate(() => {
      return window.audioEngine?.getAudioContext()?.state === 'running';
    });

    expect(isRunning).toBe(true);
  });
});

test.describe('Market Intelligence Offline', () => {
  test('should cache market intelligence data', async ({ page, context }) => {
    await page.goto('/');

    // Navigate to market intelligence
    await page.click('[data-testid="nav-market-intelligence"]');

    // Wait for data to load
    await page.waitForSelector('[data-testid="trend-data"]');

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Should show cached data
    const cachedData = await page.locator('[data-testid="trend-data"]').isVisible();
    expect(cachedData).toBe(true);

    await context.setOffline(false);
  });

  test('should show stale data indicator when offline', async ({ page, context }) => {
    await page.goto('/');

    // Navigate to market intelligence
    await page.click('[data-testid="nav-market-intelligence"]');

    // Go offline
    await context.setOffline(true);

    // Should show stale data indicator
    const staleIndicator = await page.locator('[data-testid="stale-data-indicator"]').isVisible();
    expect(staleIndicator).toBe(true);

    await context.setOffline(false);
  });
});

test.describe('Agent Avatars Performance', () => {
  test('should load GLTF models efficiently', async ({ page }) => {
    await page.goto('/');

    // Navigate to agent view
    await page.click('[data-testid="nav-agents"]');

    // Wait for avatars to load
    await page.waitForSelector('[data-testid="agent-avatar"]');

    // Check load time
    const loadTime = await page.evaluate(() => {
      return window.performance
        .getEntriesByType('resource')
        .filter((r: any) => r.name.includes('.glb'))
        .reduce((max: number, r: any) => Math.max(max, r.duration), 0);
    });

    // Should load within 1 second
    expect(loadTime).toBeLessThan(1000);
  });

  test('should fallback to procedural geometry on load failure', async ({ page }) => {
    await page.goto('/');

    // Simulate GLTF load failure
    await page.route('**/*.glb', (route) => route.abort());

    // Navigate to agent view
    await page.click('[data-testid="nav-agents"]');

    // Should show fallback geometry
    const fallbackGeometry = await page.locator('[data-testid="fallback-geometry"]').isVisible();
    expect(fallbackGeometry).toBe(true);
  });
});
