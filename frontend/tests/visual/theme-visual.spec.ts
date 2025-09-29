import { test, expect } from '@playwright/test';

const themes = ['gastat', 'blue-sky'] as const;
const colorModes = ['light', 'dark'] as const;
const languages = ['en', 'ar'] as const;

test.describe('Theme Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Test all theme and color mode combinations
  for (const theme of themes) {
    for (const colorMode of colorModes) {
      test(`Theme: ${theme} - Mode: ${colorMode}`, async ({ page }) => {
        // Apply theme
        await page.click('[aria-label*="Select theme"]');
        await page.click(`text=${theme === 'gastat' ? 'GASTAT' : 'Blue Sky'}`);
        
        // Apply color mode
        const colorModeButton = colorMode === 'dark' 
          ? '[aria-label*="Switch to dark mode"]' 
          : '[aria-label*="Switch to light mode"]';
        
        const currentMode = await page.getAttribute('html', 'data-color-mode');
        if (currentMode !== colorMode) {
          await page.click(colorModeButton);
        }

        // Wait for theme to apply
        await page.waitForTimeout(500);

        // Take screenshot
        await expect(page).toHaveScreenshot(`${theme}-${colorMode}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }

  // Test RTL/LTR layouts with different themes
  for (const language of languages) {
    for (const theme of themes) {
      test(`Language: ${language} - Theme: ${theme}`, async ({ page }) => {
        // Apply language
        await page.click('[aria-label*="Select language"]');
        await page.click(`text=${language === 'en' ? 'English' : 'العربية'}`);
        
        // Apply theme
        await page.click('[aria-label*="Select theme"]');
        await page.click(`text=${theme === 'gastat' ? 'GASTAT' : 'Blue Sky'}`);

        // Wait for language and theme to apply
        await page.waitForTimeout(500);

        // Verify RTL/LTR
        const dir = await page.getAttribute('html', 'dir');
        expect(dir).toBe(language === 'ar' ? 'rtl' : 'ltr');

        // Take screenshot
        await expect(page).toHaveScreenshot(`${language}-${theme}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }

  // Test theme selector dropdown
  test('Theme selector dropdown visual', async ({ page }) => {
    await page.click('[aria-label*="Select theme"]');
    await page.waitForSelector('[role="menu"]');
    
    await expect(page.locator('[role="menu"]')).toHaveScreenshot('theme-dropdown.png');
  });

  // Test language switcher dropdown
  test('Language switcher dropdown visual', async ({ page }) => {
    await page.click('[aria-label*="Select language"]');
    await page.waitForSelector('[role="menu"]');
    
    await expect(page.locator('[role="menu"]')).toHaveScreenshot('language-dropdown.png');
  });

  // Test focus states
  test('Focus states visual', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-theme-selector.png');
    
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-language-switcher.png');
    
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-color-mode.png');
  });

  // Test hover states
  test('Hover states visual', async ({ page }) => {
    // Hover on theme selector
    await page.hover('[aria-label*="Select theme"]');
    await expect(page.locator('[aria-label*="Select theme"]')).toHaveScreenshot('hover-theme-selector.png');
    
    // Hover on language switcher
    await page.hover('[aria-label*="Select language"]');
    await expect(page.locator('[aria-label*="Select language"]')).toHaveScreenshot('hover-language-switcher.png');
    
    // Hover on color mode toggle
    await page.hover('[aria-label*="Switch to"]');
    await expect(page.locator('[aria-label*="Switch to"]')).toHaveScreenshot('hover-color-mode.png');
  });

  // Test responsive layouts
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ];

  for (const viewport of viewports) {
    test(`Responsive: ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Apply GASTAT theme for consistency
      await page.click('[aria-label*="Select theme"]');
      await page.click('text=GASTAT');
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Theme Animation Tests', () => {
  test('Theme transition smoothness', async ({ page }) => {
    await page.goto('/');
    
    // Start recording video
    const videoPath = await page.video()?.path();
    
    // Switch themes multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('[aria-label*="Select theme"]');
      await page.click('text=GASTAT');
      await page.waitForTimeout(300);
      
      await page.click('[aria-label*="Select theme"]');
      await page.click('text=Blue Sky');
      await page.waitForTimeout(300);
    }
    
    // Switch color modes
    for (let i = 0; i < 3; i++) {
      await page.click('[aria-label*="Switch to"]');
      await page.waitForTimeout(300);
    }
    
    expect(videoPath).toBeTruthy();
  });
});