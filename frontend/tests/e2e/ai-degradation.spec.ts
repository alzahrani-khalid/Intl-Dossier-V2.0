import { test, expect } from '@playwright/test';

/**
 * E2E Test: AI Degradation Scenario
 * Tests system behavior when AI services are unavailable or degraded
 *
 * Validates:
 * - Visual degradation indicators
 * - Fallback to cached suggestions
 * - Manual triage availability
 * - Keyword-based duplicate search
 * - Rule-based priority assignment
 * - Service recovery handling
 * - User experience during outage
 */

test.describe('AI Degradation Scenario', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as supervisor
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'supervisor@gastat.gov.sa');
    await page.fill('[data-testid="password-input"]', 'SupervisorPass123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should display visual indicators when AI is unavailable', async ({ page, context }) => {
    // Step 1: Simulate AI service unavailability
    // Intercept AI health check endpoint
    await page.route('**/api/intake/ai/health', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({
          status: 'unavailable',
          message: 'AI service temporarily unavailable'
        })
      });
    });

    // Intercept triage endpoint
    await page.route('**/api/intake/tickets/*/triage', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({
          error: 'AI service unavailable',
          fallback: 'cached'
        })
      });
    });

    // Step 2: Navigate to queue and select a ticket
    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Step 3: Verify prominent banner appears
    const degradationBanner = page.locator('[data-testid="ai-unavailable-banner"]');
    await expect(degradationBanner).toBeVisible({ timeout: 3000 });
    await expect(degradationBanner).toContainText(/AI temporarily unavailable|الذكاء الاصطناعي غير متاح مؤقتًا/);

    // Step 4: Verify banner styling indicates warning/error
    await expect(degradationBanner).toHaveClass(/warning|error|alert/);

    // Step 5: Verify timestamp of last successful AI operation
    const lastSuccessTime = page.locator('[data-testid="ai-last-success-time"]');
    if (await lastSuccessTime.isVisible()) {
      const timeText = await lastSuccessTime.textContent();
      expect(timeText).toMatch(/\d+ (minutes?|hours?|days?) ago|منذ \d+/);
    }

    // Step 6: Verify status indicator in navigation/header
    const globalAiStatus = page.locator('[data-testid="global-ai-status"]');
    await expect(globalAiStatus).toBeVisible();
    await expect(globalAiStatus).toHaveClass(/degraded|offline/);

    // Step 7: Verify tooltip or help text explains situation
    await globalAiStatus.hover();
    const tooltip = page.locator('[data-testid="ai-status-tooltip"]');
    await expect(tooltip).toContainText(/AI suggestions may be limited|قد تكون اقتراحات الذكاء الاصطناعي محدودة/);
  });

  test('should show cached suggestions with staleness indicator', async ({ page }) => {
    // Simulate cached response (< 24 hours old)
    await page.route('**/api/intake/tickets/*/triage', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          source: 'cached',
          cached_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          suggestions: {
            type: 'engagement',
            sensitivity: 'internal',
            urgency: 'medium',
            confidence: 0.85
          }
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Wait for suggestions to load
    await expect(page.locator('[data-testid="ai-suggestions-panel"]')).toBeVisible({ timeout: 3000 });

    // Verify "Cached" badge is present
    const cachedBadge = page.locator('[data-testid="cached-suggestions-badge"]');
    await expect(cachedBadge).toBeVisible();
    await expect(cachedBadge).toContainText(/Cached|مخزن مؤقتًا/);

    // Verify cache age is displayed
    const cacheAge = page.locator('[data-testid="cache-age"]');
    await expect(cacheAge).toBeVisible();
    await expect(cacheAge).toContainText(/2 hours? ago|منذ ساعتين/);

    // Verify stale warning for old cache (> 12 hours)
    const staleWarning = page.locator('[data-testid="stale-cache-warning"]');
    // Should not be visible for 2-hour-old cache
    await expect(staleWarning).not.toBeVisible();

    // Verify suggestions are still usable
    await page.click('[data-testid="accept-ai-triage-button"]');
    await expect(page.locator('[data-testid="triage-success-message"]')).toBeVisible();
  });

  test('should show stale warning for old cached suggestions', async ({ page }) => {
    // Simulate very old cached response (> 12 hours)
    await page.route('**/api/intake/tickets/*/triage', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          source: 'cached',
          cached_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
          suggestions: {
            type: 'position',
            sensitivity: 'public',
            urgency: 'low',
            confidence: 0.75
          }
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    await expect(page.locator('[data-testid="ai-suggestions-panel"]')).toBeVisible({ timeout: 3000 });

    // Verify stale warning is prominent
    const staleWarning = page.locator('[data-testid="stale-cache-warning"]');
    await expect(staleWarning).toBeVisible();
    await expect(staleWarning).toContainText(/Suggestions may be outdated|قد تكون الاقتراحات قديمة/);

    // Verify manual review is recommended
    await expect(staleWarning).toContainText(/Manual review recommended|يوصى بالمراجعة اليدوية/);

    // Verify cache age shows "stale" indicator
    const cacheAge = page.locator('[data-testid="cache-age"]');
    await expect(cacheAge).toContainText(/20 hours? ago|منذ 20 ساعة/);
    await expect(cacheAge).toHaveClass(/stale|outdated/);
  });

  test('should enable manual triage when AI is unavailable', async ({ page }) => {
    // Simulate AI completely unavailable with no cache
    await page.route('**/api/intake/tickets/*/triage', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({
          error: 'AI service unavailable',
          cache: 'none'
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Verify AI suggestions panel shows error state
    await expect(page.locator('[data-testid="ai-suggestions-error"]')).toBeVisible();

    // Verify manual triage button is prominently displayed
    const manualTriageButton = page.locator('[data-testid="manual-triage-button"]');
    await expect(manualTriageButton).toBeVisible();
    await expect(manualTriageButton).toBeEnabled();
    await expect(manualTriageButton).toContainText(/Manual Triage|الفرز اليدوي/);

    // Click manual triage
    await manualTriageButton.click();

    // Verify manual triage form appears
    await expect(page.locator('[data-testid="manual-triage-form"]')).toBeVisible();

    // Verify all classification fields are available
    await expect(page.locator('[data-testid="manual-type-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-sensitivity-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-urgency-select"]')).toBeVisible();

    // Complete manual triage
    await page.selectOption('[data-testid="manual-type-select"]', 'engagement');
    await page.selectOption('[data-testid="manual-sensitivity-select"]', 'internal');
    await page.selectOption('[data-testid="manual-urgency-select"]', 'high');
    await page.fill('[data-testid="manual-triage-notes"]', 'Manually triaged due to AI unavailability');

    // Submit manual triage
    await page.click('[data-testid="submit-manual-triage-button"]');

    // Verify success
    await expect(page.locator('[data-testid="manual-triage-success"]')).toBeVisible();

    // Verify ticket is triaged with proper audit trail
    await page.click('[data-testid="audit-trail-tab"]');
    const manualTriageEntry = page.locator('[data-testid="audit-entry-manual-triage"]');
    await expect(manualTriageEntry).toBeVisible();
    await expect(manualTriageEntry).toContainText('manual');
    await expect(manualTriageEntry).toContainText('AI unavailable');
  });

  test('should provide keyword-based duplicate search as fallback', async ({ page }) => {
    // Simulate AI-powered semantic search unavailable
    await page.route('**/api/intake/tickets/*/duplicates', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          method: 'keyword',
          fallback: true,
          candidates: [
            {
              id: 'TKT-2025-000123',
              title: 'Statistical Analysis Request',
              similarity: 0.65,
              method: 'keyword_match'
            }
          ]
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Check duplicate detection section
    const duplicateSection = page.locator('[data-testid="duplicate-detection-section"]');
    if (await duplicateSection.isVisible()) {
      // Verify fallback method indicator
      const fallbackIndicator = page.locator('[data-testid="duplicate-method-fallback"]');
      await expect(fallbackIndicator).toBeVisible();
      await expect(fallbackIndicator).toContainText(/Keyword-based search|بحث قائم على الكلمات الرئيسية/);

      // Verify lower confidence warning
      const confidenceWarning = page.locator('[data-testid="duplicate-confidence-warning"]');
      await expect(confidenceWarning).toContainText(/Limited accuracy without AI|دقة محدودة بدون الذكاء الاصطناعي/);

      // Verify manual review emphasized
      await expect(duplicateSection).toContainText(/Manual review required|المراجعة اليدوية مطلوبة/);
    }
  });

  test('should use rule-based priority assignment as fallback', async ({ page }) => {
    // Simulate AI unavailable, system uses rules
    await page.route('**/api/intake/tickets/*/assign-priority', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          method: 'rule_based',
          priority: 'high',
          reason: 'Urgency=high AND Sensitivity=confidential',
          confidence: null
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Check priority assignment
    const prioritySection = page.locator('[data-testid="priority-section"]');
    await expect(prioritySection).toBeVisible();

    // Verify rule-based indicator
    const ruleBasedBadge = page.locator('[data-testid="priority-method-rule-based"]');
    await expect(ruleBasedBadge).toBeVisible();
    await expect(ruleBasedBadge).toContainText(/Rule-based|قائم على القواعد/);

    // Verify explanation of rule logic
    const ruleExplanation = page.locator('[data-testid="priority-rule-explanation"]');
    await expect(ruleExplanation).toContainText(/Urgency=high/);
    await expect(ruleExplanation).toContainText(/Sensitivity=confidential/);

    // Verify no confidence score shown for rule-based
    const confidenceScore = page.locator('[data-testid="priority-confidence-score"]');
    await expect(confidenceScore).not.toBeVisible();
  });

  test('should handle background service recovery gracefully', async ({ page }) => {
    let requestCount = 0;

    // First 3 requests fail, then succeed (simulating recovery)
    await page.route('**/api/intake/ai/health', route => {
      requestCount++;
      if (requestCount <= 3) {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ status: 'unavailable' })
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ status: 'healthy', latency_ms: 250 })
        });
      }
    });

    await page.goto('/intake/queue');

    // Verify degradation banner initially
    await expect(page.locator('[data-testid="ai-unavailable-banner"]')).toBeVisible({ timeout: 3000 });

    // Wait for background retry (simulated 5-minute intervals, accelerated in test)
    // In real scenario, this would wait longer
    await page.waitForTimeout(2000);

    // After recovery, banner should update
    const recoveryBanner = page.locator('[data-testid="ai-recovered-banner"]');
    if (await recoveryBanner.isVisible()) {
      await expect(recoveryBanner).toContainText(/AI service restored|تم استعادة خدمة الذكاء الاصطناعي/);

      // Banner should auto-dismiss after a few seconds
      await page.waitForTimeout(5000);
      await expect(recoveryBanner).not.toBeVisible();
    }

    // Open a ticket and verify fresh AI suggestions are now available
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Should get real-time suggestions (no cached badge)
    await expect(page.locator('[data-testid="ai-suggestions-panel"]')).toBeVisible({ timeout: 3000 });
    const cachedBadge = page.locator('[data-testid="cached-suggestions-badge"]');
    await expect(cachedBadge).not.toBeVisible();

    // Verify status indicator shows healthy
    const globalAiStatus = page.locator('[data-testid="global-ai-status"]');
    await expect(globalAiStatus).toHaveClass(/healthy|online/);
  });

  test('should queue pending AI operations during outage', async ({ page }) => {
    // Simulate AI unavailable
    await page.route('**/api/intake/tickets/*/triage', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({
          error: 'AI unavailable',
          queued: true,
          queue_position: 5
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Try to get AI suggestions
    await expect(page.locator('[data-testid="ai-suggestions-error"]')).toBeVisible();

    // Verify queuing indicator
    const queueIndicator = page.locator('[data-testid="ai-request-queued"]');
    if (await queueIndicator.isVisible()) {
      await expect(queueIndicator).toContainText(/Request queued|تم إضافة الطلب إلى قائمة الانتظار/);
      await expect(queueIndicator).toContainText(/Position: 5|الموضع: 5/);

      // Verify explanation
      await expect(queueIndicator).toContainText(/Will be processed when service is restored|سيتم المعالجة عند استعادة الخدمة/);
    }

    // Verify user can still proceed with manual triage
    await expect(page.locator('[data-testid="manual-triage-button"]')).toBeEnabled();
  });

  test('should maintain system responsiveness during AI outage', async ({ page }) => {
    // Intercept AI endpoints with slow timeout
    await page.route('**/api/intake/ai/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({ error: 'timeout' })
        });
      }, 5000); // 5 second delay
    });

    await page.goto('/intake/queue');

    // Measure time to load queue (should not be blocked by AI)
    const startTime = Date.now();
    await expect(page.locator('[data-testid="queue-container"]')).toBeVisible({ timeout: 3000 });
    const loadTime = Date.now() - startTime;

    // Queue should load quickly despite AI issues
    expect(loadTime).toBeLessThan(3000);

    // Click ticket
    const ticketLoadStart = Date.now();
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Ticket detail should load without waiting for AI
    await expect(page.locator('[data-testid="ticket-detail-panel"]')).toBeVisible({ timeout: 2000 });
    const ticketLoadTime = Date.now() - ticketLoadStart;

    expect(ticketLoadTime).toBeLessThan(2500);

    // AI section can load/error independently
    // Other ticket operations should remain functional
    await expect(page.locator('[data-testid="ticket-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-triage-button"]')).toBeEnabled();
  });

  test('should display helpful guidance during AI outage', async ({ page }) => {
    await page.route('**/api/intake/ai/health', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({
          status: 'unavailable',
          estimated_recovery: '15 minutes'
        })
      });
    });

    await page.goto('/intake/queue');
    const firstTicket = page.locator('[data-testid^="queue-ticket-"]').first();
    await firstTicket.click();

    // Verify help section is displayed
    const helpSection = page.locator('[data-testid="ai-outage-help"]');
    await expect(helpSection).toBeVisible();

    // Verify guidance includes:
    // 1. What happened
    await expect(helpSection).toContainText(/AI service is temporarily unavailable|خدمة الذكاء الاصطناعي غير متاحة مؤقتًا/);

    // 2. Impact on features
    await expect(helpSection).toContainText(/Some features may be limited|قد تكون بعض الميزات محدودة/);

    // 3. What users can do
    await expect(helpSection).toContainText(/You can still proceed|لا يزال بإمكانك المتابعة/);
    await expect(helpSection).toContainText(/manual triage|الفرز اليدوي/);

    // 4. Expected recovery time (if available)
    const recoveryEstimate = page.locator('[data-testid="ai-recovery-estimate"]');
    if (await recoveryEstimate.isVisible()) {
      await expect(recoveryEstimate).toContainText(/15 minutes|15 دقيقة/);
    }

    // 5. Link to help documentation
    const helpLink = page.locator('[data-testid="ai-outage-help-link"]');
    await expect(helpLink).toBeVisible();
    await expect(helpLink).toHaveAttribute('href', /\/help|\/docs/);
  });
});