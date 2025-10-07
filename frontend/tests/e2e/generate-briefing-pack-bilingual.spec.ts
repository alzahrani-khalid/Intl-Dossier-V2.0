import { test, expect } from '@playwright/test';

test.describe('Generate Bilingual Briefing Pack', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');

    // Navigate to engagement with attached positions
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');
  });

  test('should display briefing pack generator', async ({ page }) => {
    // Scroll to briefing pack section
    const generatorSection = page.locator('[data-testid="briefing-pack-generator"]');
    await generatorSection.scrollIntoViewIfNeeded();

    await expect(generatorSection).toBeVisible();
    await expect(generatorSection).toContainText('Generate Briefing Pack');
  });

  test('should select language (English/Arabic)', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Verify language selector
    const languageSelect = generator.locator('[data-testid="language-selector"]');
    await expect(languageSelect).toBeVisible();

    // Open language dropdown
    await languageSelect.click();

    // Verify English and Arabic options
    await expect(page.locator('[data-value="en"]')).toBeVisible();
    await expect(page.locator('[data-value="ar"]')).toBeVisible();

    // Select Arabic
    await page.locator('[data-value="ar"]').click();

    // Verify selection
    await expect(languageSelect).toContainText('Arabic');
  });

  test('should generate English briefing pack', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Select English
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();

    // Click generate
    const generateButton = generator.locator('[data-testid="generate-button"]');
    await generateButton.click();

    // Wait for generation to initiate
    await page.waitForResponse((response) =>
      response.url().includes('/briefing-packs') && response.method() === 'POST' && response.status() === 202
    );

    // Verify progress indicator appears
    const progressIndicator = generator.locator('[data-testid="generation-progress"]');
    await expect(progressIndicator).toBeVisible();
    await expect(progressIndicator).toContainText('Generating');
  });

  test('should generate Arabic briefing pack with auto-translation', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Select Arabic
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="ar"]').click();

    // Click generate
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for generation
    await page.waitForResponse((response) => response.status() === 202);

    // Verify translation indicator if positions are in English
    const translationInfo = generator.locator('[data-testid="translation-info"]');
    if (await translationInfo.isVisible()) {
      await expect(translationInfo).toContainText('positions will be translated');
    }
  });

  test('should display generation progress', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Start generation
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Verify progress states
    await expect(generator).toContainText('Generating');

    // Wait for status updates (polling every 2s)
    await page.waitForTimeout(3000);

    // Progress should update
    const statusText = await generator.locator('[data-testid="generation-status"]').textContent();
    expect(statusText).toMatch(/Generating|Completed|Processing/);
  });

  test('should complete generation within timeout', async ({ page }) => {
    test.setTimeout(15000); // 15s test timeout for 5-10 positions

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Start generation
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();

    const startTime = Date.now();
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for completion
    await page.waitForSelector('[data-testid="download-button"]', { timeout: 12000 });

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    // Verify completion within reasonable time (10s for up to 100 positions)
    expect(generationTime).toBeLessThan(12000);
  });

  test('should display download button when ready', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Generate
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for completion
    const downloadButton = generator.locator('[data-testid="download-button"]');
    await downloadButton.waitFor({ state: 'visible', timeout: 12000 });

    // Verify download button enabled
    await expect(downloadButton).toBeEnabled();
    await expect(downloadButton).toContainText('Download');
  });

  test('should download PDF file', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Generate
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for download button
    const downloadButton = generator.locator('[data-testid="download-button"]');
    await downloadButton.waitFor({ state: 'visible', timeout: 12000 });

    // Set up download promise
    const downloadPromise = page.waitForEvent('download');

    // Click download
    await downloadButton.click();

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/briefing-pack.*\.pdf$/);
  });

  test('should list previously generated briefing packs', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Verify past generations section
    const pastGenerations = page.locator('[data-testid="past-briefing-packs"]');
    if (await pastGenerations.isVisible()) {
      const packItems = pastGenerations.locator('[data-testid="briefing-pack-item"]');
      const count = await packItems.count();

      if (count > 0) {
        // Verify first pack has download link
        const firstPack = packItems.first();
        await expect(firstPack).toContainText('Download');

        // Verify language displayed
        await expect(firstPack).toMatch(/English|Arabic/);
      }
    }
  });

  test('should handle generation failure gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Generation failed' }),
        });
      } else {
        route.continue();
      }
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Attempt generation
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Verify error message
    const errorMessage = generator.locator('[data-testid="generation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('failed');

    // Verify retry button
    const retryButton = generator.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
  });

  test('should prevent generation with no attached positions', async ({ page }) => {
    // Navigate to engagement with no positions
    // (Mock or use test data)

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    const generateButton = generator.locator('[data-testid="generate-button"]');

    // Verify button disabled
    await expect(generateButton).toBeDisabled();

    // Verify help text
    await expect(generator).toContainText('Attach at least one position');
  });

  test('should validate position count limit (100 max)', async ({ page }) => {
    // Mock 100 positions attached
    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'TOO_MANY_POSITIONS' }),
        });
      } else {
        route.continue();
      }
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Verify error
    const errorMessage = generator.locator('[data-testid="generation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('too many positions');
  });

  test('should display position selection count', async ({ page }) => {
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Verify position count displayed
    const positionCount = generator.locator('[data-testid="position-count"]');
    await expect(positionCount).toBeVisible();

    const countText = await positionCount.textContent();
    expect(countText).toMatch(/\d+ position/);
  });
});
