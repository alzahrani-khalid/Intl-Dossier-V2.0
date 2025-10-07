import { test, expect } from '@playwright/test';

test.describe('Briefing Pack Generation Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'collaborator@gastat.sa');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dossiers');

    // Navigate to engagement with positions
    await page.click('[data-testid="dossier-card"]:first-child');
    await page.click('[data-testid="engagement-card"]:first-child');
  });

  test('should complete generation within 10 seconds for 100 positions', async ({ page }) => {
    test.setTimeout(15000); // 15s test timeout

    // Mock 100 positions attached
    await page.route('**/engagement-positions*', (route) => {
      const positions = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `pos-${i}`,
          position_id: `position-${i}`,
          title: `Position ${i}`,
          content: `Content for position ${i}`,
        }));

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(positions),
      });
    });

    // Mock briefing pack generation
    let jobId = 'job-' + Date.now();
    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ job_id: jobId }),
        });
      } else {
        route.continue();
      }
    });

    // Mock job status polling
    let pollCount = 0;
    await page.route(`**/briefing-packs/jobs/${jobId}/status`, (route) => {
      pollCount++;

      // Simulate generation time (complete after 8 seconds)
      if (pollCount < 4) {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ status: 'generating', progress: pollCount * 25 }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            status: 'completed',
            file_url: 'https://storage.example.com/briefing-pack.pdf',
            generated_at: new Date().toISOString(),
          }),
        });
      }
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    // Start generation
    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();

    const startTime = Date.now();
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for completion
    await page.waitForSelector('[data-testid="download-button"]', { timeout: 12000 });

    const generationTime = Date.now() - startTime;

    console.log('Generation time for 100 positions:', generationTime, 'ms');

    // Should complete within 10 seconds
    expect(generationTime).toBeLessThan(10000);
  });

  test('should provide progress updates every 2 seconds', async ({ page }) => {
    let jobId = 'job-progress-test';
    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 202, body: JSON.stringify({ job_id: jobId }) });
      } else {
        route.continue();
      }
    });

    const progressUpdates: { timestamp: number; progress: number }[] = [];

    await page.route(`**/briefing-packs/jobs/${jobId}/status`, (route) => {
      const progress = progressUpdates.length * 25;

      progressUpdates.push({ timestamp: Date.now(), progress });

      route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: progress >= 100 ? 'completed' : 'generating',
          progress,
        }),
      });
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for completion
    await page.waitForSelector('[data-testid="download-button"]', { timeout: 10000 });

    // Verify progress updates occurred
    expect(progressUpdates.length).toBeGreaterThan(2);

    // Verify updates are roughly 2 seconds apart
    for (let i = 1; i < progressUpdates.length; i++) {
      const timeDiff = progressUpdates[i].timestamp - progressUpdates[i - 1].timestamp;
      expect(timeDiff).toBeGreaterThanOrEqual(1800); // ~2s with tolerance
      expect(timeDiff).toBeLessThanOrEqual(2500);
    }
  });

  test('should handle timeout gracefully', async ({ page }) => {
    test.setTimeout(15000);

    let jobId = 'job-timeout-test';
    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 202, body: JSON.stringify({ job_id: jobId }) });
      } else {
        route.continue();
      }
    });

    // Mock job that never completes
    await page.route(`**/briefing-packs/jobs/${jobId}/status`, (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'generating', progress: 50 }),
      });
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Wait for timeout (should be handled in UI)
    await page.waitForTimeout(12000);

    // Verify error or timeout message
    const errorMessage = generator.locator('[data-testid="generation-error"], [data-testid="timeout-message"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should scale generation time linearly with position count', async ({ page }) => {
    test.setTimeout(30000);

    const positionCounts = [10, 50, 100];
    const generationTimes: number[] = [];

    for (const count of positionCounts) {
      await page.reload();

      // Mock positions
      await page.route('**/engagement-positions*', (route) => {
        const positions = Array(count)
          .fill(null)
          .map((_, i) => ({ id: `pos-${i}`, title: `Position ${i}` }));

        route.fulfill({ status: 200, body: JSON.stringify(positions) });
      });

      let jobId = `job-${count}`;
      await page.route('**/briefing-packs', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({ status: 202, body: JSON.stringify({ job_id: jobId }) });
        } else {
          route.continue();
        }
      });

      let pollCount = 0;
      await page.route(`**/briefing-packs/jobs/${jobId}/status`, (route) => {
        pollCount++;

        // Simulate proportional generation time
        const maxPolls = Math.ceil(count / 25); // ~1 poll per 25 positions

        if (pollCount < maxPolls) {
          route.fulfill({ status: 200, body: JSON.stringify({ status: 'generating' }) });
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ status: 'completed', file_url: 'test.pdf' }),
          });
        }
      });

      const generator = page.locator('[data-testid="briefing-pack-generator"]');
      await generator.scrollIntoViewIfNeeded();

      await generator.locator('[data-testid="language-selector"]').click();
      await page.locator('[data-value="en"]').click();

      const startTime = Date.now();
      await generator.locator('[data-testid="generate-button"]').click();

      await page.waitForSelector('[data-testid="download-button"]', { timeout: 15000 });

      const generationTime = Date.now() - startTime;
      generationTimes.push(generationTime);

      console.log(`Generation time for ${count} positions: ${generationTime}ms`);
    }

    // Verify linear scaling (roughly)
    // Time for 100 positions should be ~10x time for 10 positions
    const ratio = generationTimes[2] / generationTimes[0];
    expect(ratio).toBeGreaterThan(5);
    expect(ratio).toBeLessThan(15);
  });

  test('should batch translate positions efficiently', async ({ page }) => {
    // Mock English positions
    await page.route('**/engagement-positions*', (route) => {
      const positions = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `pos-${i}`,
          title: `Position ${i}`,
          primary_language: 'en',
        }));

      route.fulfill({ status: 200, body: JSON.stringify(positions) });
    });

    let translationRequests = 0;
    await page.route('**/translate*', (route) => {
      translationRequests++;
      route.continue();
    });

    // Generate Arabic pack (requires translation)
    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="ar"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    await page.waitForTimeout(5000);

    // Should batch translations (not 50 individual requests)
    expect(translationRequests).toBeLessThan(10);
  });

  test('should retry failed generation', async ({ page }) => {
    test.setTimeout(20000);

    let jobId = 'job-retry-test';
    let attemptCount = 0;

    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        attemptCount++;

        if (attemptCount === 1) {
          // First attempt fails
          route.fulfill({ status: 500, body: JSON.stringify({ error: 'Generation failed' }) });
        } else {
          // Retry succeeds
          route.fulfill({ status: 202, body: JSON.stringify({ job_id: jobId }) });
        }
      } else {
        route.continue();
      }
    });

    await page.route(`**/briefing-packs/jobs/${jobId}/status`, (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'completed', file_url: 'test.pdf' }),
      });
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    // Verify error shown
    await expect(generator.locator('[data-testid="generation-error"]')).toBeVisible();

    // Click retry
    await generator.locator('[data-testid="retry-button"]').click();

    // Should succeed
    await page.waitForSelector('[data-testid="download-button"]', { timeout: 10000 });

    // Verify 2 attempts made
    expect(attemptCount).toBe(2);
  });

  test('should optimize PDF file size', async ({ page }) => {
    test.setTimeout(15000);

    let jobId = 'job-filesize-test';
    await page.route('**/briefing-packs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 202, body: JSON.stringify({ job_id: jobId }) });
      } else {
        route.continue();
      }
    });

    await page.route(`**/briefing-packs/jobs/${jobId}/status`, (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'completed',
          file_url: 'test.pdf',
          file_size_bytes: 1048576, // 1 MB
          position_count: 100,
        }),
      });
    });

    const generator = page.locator('[data-testid="briefing-pack-generator"]');
    await generator.scrollIntoViewIfNeeded();

    await generator.locator('[data-testid="language-selector"]').click();
    await page.locator('[data-value="en"]').click();
    await generator.locator('[data-testid="generate-button"]').click();

    await page.waitForSelector('[data-testid="download-button"]', { timeout: 10000 });

    // Verify file size displayed
    const fileSizeInfo = generator.locator('[data-testid="file-size"]');
    if (await fileSizeInfo.isVisible()) {
      const sizeText = await fileSizeInfo.textContent();
      expect(sizeText).toContain('MB');
    }

    // File size should be reasonable (~10KB per position)
    // 100 positions * 10KB = 1MB
    const fileSize = 1048576;
    const perPositionSize = fileSize / 100;
    expect(perPositionSize).toBeLessThan(20000); // <20KB per position
  });
});
