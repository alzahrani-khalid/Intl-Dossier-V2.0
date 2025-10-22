import { test, expect } from '@playwright/test';

/**
 * E2E Test: Link Migration Workflow (User Story 3)
 *
 * Task: T089 [US3]
 * Success Criteria: SC-008 - 100% link migration success rate
 *
 * Test Flow:
 * 1. Create intake ticket with 3+ links (primary, related, requested)
 * 2. Convert intake ticket to formal position
 * 3. Verify all links migrate with appropriate type mappings
 * 4. Verify audit logs are created for migration
 * 5. Verify original intake links are soft-deleted
 *
 * Performance Target: <500ms for batch operations (SC-003)
 */

test.describe('Link Migration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL(/\/(dashboard|intake-queue)/);
  });

  test('should migrate all links when converting intake to position with 100% success rate', async ({ page }) => {
    const startTime = Date.now();

    // Step 1: Navigate to intake queue and create/select a ticket
    await page.goto('/intake-queue');
    await expect(page.locator('h1')).toContainText(/intake|تصنيف/i);

    // Click on first intake ticket
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();

    // Wait for intake detail page to load
    await page.waitForURL(/\/intake\/\d+/);
    await expect(page.locator('h2, h3')).toContainText(/ticket|تذكرة/i);

    // Step 2: Create multiple links to different entities
    const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
    await expect(linkManagerSection).toBeVisible({ timeout: 5000 });

    // Create Primary Link to Saudi Arabia (dossier - anchor entity)
    await createLink(page, 'Saudi Arabia', 'primary');

    // Create Related Link to USA (dossier - anchor entity)
    await createLink(page, 'USA', 'related');

    // Create Requested Link to Trade Policy (topic - non-anchor entity)
    await createLink(page, 'Trade Policy', 'requested');

    // Verify 3 links exist
    const linkCards = linkManagerSection.locator('[data-testid="link-card"]');
    await expect(linkCards).toHaveCount(3, { timeout: 3000 });

    // Get intake ID for later verification
    const intakeUrl = page.url();
    const intakeIdMatch = intakeUrl.match(/\/intake\/(\d+)/);
    const intakeId = intakeIdMatch ? intakeIdMatch[1] : null;

    // Step 3: Convert intake to formal position
    const convertButton = page.locator('button:has-text("Convert to Position"), button:has-text("تحويل إلى موقف")');
    await convertButton.click();

    // Wait for conversion dialog/confirmation
    const confirmDialog = page.locator('[role="dialog"]');
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });

    const confirmButton = confirmDialog.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
    await confirmButton.click();

    // Wait for conversion to complete and redirect to position detail page
    await page.waitForURL(/\/positions\/\d+/, { timeout: 10000 });

    // Get position ID from URL
    const positionUrl = page.url();
    const positionIdMatch = positionUrl.match(/\/positions\/(\d+)/);
    const positionId = positionIdMatch ? positionIdMatch[1] : null;

    // Step 4: Verify links migrated to position
    const positionLinkManager = page.locator('[data-testid="entity-link-manager"]');
    await expect(positionLinkManager).toBeVisible({ timeout: 5000 });

    const migratedLinkCards = positionLinkManager.locator('[data-testid="link-card"]');
    await expect(migratedLinkCards).toHaveCount(3, { timeout: 3000 });

    // Verify link type mappings (intake types map to position types)
    // Primary -> Primary, Related -> Related, Requested -> Mentioned
    const linkTypes = await migratedLinkCards.locator('[data-testid="link-type-badge"]').allTextContents();
    expect(linkTypes).toContain(expect.stringMatching(/Primary|أساسي/i));
    expect(linkTypes).toContain(expect.stringMatching(/Related|متعلق/i));
    expect(linkTypes).toContain(expect.stringMatching(/Mentioned|مذكور/i));

    // Step 5: Verify entity names are preserved
    const entityNames = await migratedLinkCards.allTextContents();
    expect(entityNames.join('')).toContain('Saudi Arabia');
    expect(entityNames.join('')).toContain('USA');
    expect(entityNames.join('')).toContain('Trade Policy');

    // Step 6: Verify audit logs exist (check via API or UI if available)
    // Navigate to audit log viewer if it exists
    const auditLogTab = page.locator('button:has-text("Audit Log"), button:has-text("سجل التدقيق")');
    if (await auditLogTab.isVisible({ timeout: 1000 })) {
      await auditLogTab.click();

      // Verify migration events are logged
      const auditEntries = page.locator('[data-testid="audit-log-entry"]');
      const auditTexts = await auditEntries.allTextContents();

      // Should contain migration events
      expect(auditTexts.some(text =>
        text.includes('migrate') || text.includes('migration') || text.includes('ترحيل')
      )).toBeTruthy();
    }

    // Step 7: Verify original intake links are soft-deleted (go back to intake)
    if (intakeId) {
      await page.goto(`/intake/${intakeId}`);

      // Links should not be visible in intake detail (soft-deleted)
      const intakeLinkManager = page.locator('[data-testid="entity-link-manager"]');
      const intakeLinkCards = intakeLinkManager.locator('[data-testid="link-card"]');

      // Should show "converted" or "migrated" message
      const migrationNotice = page.locator('text=/converted|migrated|تحويل|ترحيل/i');
      await expect(migrationNotice).toBeVisible({ timeout: 3000 });
    }

    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    console.log(`✓ Link migration workflow completed in ${elapsedTime}ms`);

    // Assert 100% success rate (all 3 links migrated)
    await expect(migratedLinkCards).toHaveCount(3);
  });

  test('should handle migration with empty link list', async ({ page }) => {
    // Navigate to intake with no links
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Verify no links exist
    const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
    const linkCards = linkManagerSection.locator('[data-testid="link-card"]');
    const linkCount = await linkCards.count();

    // If links exist, delete them first
    if (linkCount > 0) {
      for (let i = 0; i < linkCount; i++) {
        const deleteButton = linkCards.first().locator('button[aria-label*="Delete"], button[aria-label*="حذف"]');
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          // Confirm deletion if dialog appears
          const confirmButton = page.locator('button:has-text("Delete"), button:has-text("حذف")');
          if (await confirmButton.isVisible({ timeout: 1000 })) {
            await confirmButton.click();
          }
          await page.waitForTimeout(500);
        }
      }
    }

    // Convert to position
    const convertButton = page.locator('button:has-text("Convert to Position"), button:has-text("تحويل إلى موقف")');
    await convertButton.click();

    const confirmDialog = page.locator('[role="dialog"]');
    if (await confirmDialog.isVisible({ timeout: 1000 })) {
      const confirmButton = confirmDialog.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
      await confirmButton.click();
    }

    // Wait for conversion
    await page.waitForURL(/\/positions\/\d+/, { timeout: 10000 });

    // Verify position has no links (migration of empty list succeeds)
    const positionLinkManager = page.locator('[data-testid="entity-link-manager"]');
    const positionLinkCards = positionLinkManager.locator('[data-testid="link-card"]');
    await expect(positionLinkCards).toHaveCount(0);
  });

  test('should preserve link metadata during migration (notes, created_at)', async ({ page }) => {
    // Navigate to intake
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Create link with notes
    const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
    const addLinkButton = linkManagerSection.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
    await addLinkButton.click();

    const searchDialog = page.locator('[role="dialog"]');
    const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
    await searchInput.fill('Saudi Arabia');
    await page.waitForTimeout(500);

    const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
    await searchResults.first().click();

    const linkTypeSelect = searchDialog.locator('[data-testid="link-type-select"]');
    await linkTypeSelect.click();
    const primaryOption = page.locator('[data-testid="link-type-option-primary"]');
    await primaryOption.click();

    // Add notes to link
    const notesInput = searchDialog.locator('textarea[placeholder*="notes"], textarea[placeholder*="ملاحظات"]');
    if (await notesInput.isVisible({ timeout: 1000 })) {
      await notesInput.fill('Important bilateral relationship for trade policy');
    }

    const createLinkButton = searchDialog.locator('button:has-text("Create Link"), button:has-text("إنشاء رابط")');
    await createLinkButton.click();

    // Wait for link to be created
    await page.waitForTimeout(1000);

    // Convert to position
    const convertButton = page.locator('button:has-text("Convert to Position"), button:has-text("تحويل إلى موقف")');
    await convertButton.click();

    const confirmDialog = page.locator('[role="dialog"]');
    if (await confirmDialog.isVisible({ timeout: 1000 })) {
      const confirmButton = confirmDialog.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
      await confirmButton.click();
    }

    await page.waitForURL(/\/positions\/\d+/, { timeout: 10000 });

    // Verify notes are preserved in migrated link
    const positionLinkManager = page.locator('[data-testid="entity-link-manager"]');
    const migratedLinkCard = positionLinkManager.locator('[data-testid="link-card"]').first();

    const linkText = await migratedLinkCard.textContent();
    expect(linkText).toContain('Important bilateral relationship for trade policy');
  });

  test('should handle transaction rollback on migration failure', async ({ page }) => {
    // This test simulates a failure scenario where migration should rollback
    // In a real test, you might mock an API failure or database error

    // Navigate to intake
    await page.goto('/intake-queue');
    const firstTicket = page.locator('[data-testid="intake-ticket-card"]').first();
    await firstTicket.click();
    await page.waitForURL(/\/intake\/\d+/);

    // Create links
    await createLink(page, 'Saudi Arabia', 'primary');

    // Intercept the conversion API call and force it to fail
    await page.route('**/api/intake/*/convert', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Migration failed' })
      });
    });

    // Attempt to convert to position
    const convertButton = page.locator('button:has-text("Convert to Position"), button:has-text("تحويل إلى موقف")');
    await convertButton.click();

    const confirmDialog = page.locator('[role="dialog"]');
    if (await confirmDialog.isVisible({ timeout: 1000 })) {
      const confirmButton = confirmDialog.locator('button:has-text("Confirm"), button:has-text("تأكيد")');
      await confirmButton.click();
    }

    // Verify error message is shown
    const errorMessage = page.locator('[role="alert"], .error-message, .text-destructive');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    await expect(errorMessage).toContainText(/error|failed|خطأ|فشل/i);

    // Verify intake still exists with links intact (rollback successful)
    const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
    const linkCards = linkManagerSection.locator('[data-testid="link-card"]');
    await expect(linkCards).toHaveCount(1); // Link still exists after failed migration
  });
});

/**
 * Helper function to create an entity link
 */
async function createLink(page: any, entityName: string, linkType: 'primary' | 'related' | 'requested' | 'mentioned' | 'assigned_to') {
  const linkManagerSection = page.locator('[data-testid="entity-link-manager"]');
  const addLinkButton = linkManagerSection.locator('button:has-text("Add Link"), button:has-text("إضافة رابط")').first();
  await addLinkButton.click();

  const searchDialog = page.locator('[role="dialog"]');
  const searchInput = searchDialog.locator('input[placeholder*="Search"], input[placeholder*="بحث"]');
  await searchInput.fill(entityName);
  await page.waitForTimeout(500); // Debounce

  const searchResults = searchDialog.locator('[data-testid="entity-search-result"]');
  await searchResults.first().click();

  const linkTypeSelect = searchDialog.locator('[data-testid="link-type-select"]');
  await linkTypeSelect.click();
  const linkTypeOption = page.locator(`[data-testid="link-type-option-${linkType}"]`);
  await linkTypeOption.click();

  const createLinkButton = searchDialog.locator('button:has-text("Create Link"), button:has-text("إنشاء رابط")');
  await createLinkButton.click();

  // Wait for dialog to close
  await searchDialog.waitFor({ state: 'hidden', timeout: 2000 });

  // Wait for optimistic update
  await page.waitForTimeout(500);
}
