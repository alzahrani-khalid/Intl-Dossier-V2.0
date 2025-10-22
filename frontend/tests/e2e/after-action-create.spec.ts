/**
 * E2E Test: After-Action Create Flow (T047)
 * User Story 1: Quick After-Action Creation
 *
 * Test Flow:
 * 1. Navigate to after-action create page
 * 2. Fill multi-step form (basic info, attendance, decisions, commitments, risks, review)
 * 3. Save draft
 * 4. Publish
 * 5. Verify tasks created from commitments
 *
 * Expected: After-action created, published, and tasks auto-created
 */

import { test, expect } from '@playwright/test';

test.describe('After-Action Create Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', 'kazahrani@stats.gov.sa');
    await page.fill('input[name="password"]', 'itisme');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create after-action with draft → publish → verify tasks created', async ({ page }) => {
    // Navigate to dossier page
    await page.goto('/dossiers');
    await page.waitForLoadState('networkidle');

    // Select first dossier
    await page.click('text=View Dossier >> nth=0');
    await page.waitForURL(/\/dossiers\//);

    // Click "Create After-Action" button
    await page.click('button:has-text("Create After-Action")');
    await page.waitForURL(/\/after-action\/create/);

    // Step 1: Basic Info
    await expect(page.locator('h2:has-text("Basic Information")')).toBeVisible();

    await page.fill('input[name="title"]', 'Test Meeting Summary');
    await page.fill('textarea[name="purpose"]', 'Discuss project milestones and coordination');
    await page.fill('input[name="meeting_date"]', '2025-01-15');
    await page.fill('input[name="location"]', 'Conference Room A');

    await page.click('button:has-text("Next")');

    // Step 2: Attendance
    await expect(page.locator('h2:has-text("Attendance")')).toBeVisible();

    // Add internal participants
    await page.click('button:has-text("Add Internal Participant")');
    await page.fill('input[placeholder="Search staff..."]', 'John');
    await page.click('text=John Doe >> nth=0');

    await page.click('button:has-text("Add Internal Participant")');
    await page.fill('input[placeholder="Search staff..."]', 'Jane');
    await page.click('text=Jane Smith >> nth=0');

    await page.click('button:has-text("Next")');

    // Step 3: Decisions
    await expect(page.locator('h2:has-text("Decisions")')).toBeVisible();

    await page.click('button:has-text("Add Decision")');
    await page.fill('textarea[name="decisions[0].description_en"]', 'Approved budget increase for Q2');
    await page.fill('textarea[name="decisions[0].description_ar"]', 'تمت الموافقة على زيادة الميزانية للربع الثاني');
    await page.selectOption('select[name="decisions[0].category"]', 'financial');

    await page.click('button:has-text("Add Decision")');
    await page.fill('textarea[name="decisions[1].description_en"]', 'Decided to postpone Phase 3 timeline');
    await page.fill('textarea[name="decisions[1].description_ar"]', 'تقرر تأجيل الجدول الزمني للمرحلة الثالثة');
    await page.selectOption('select[name="decisions[1].category"]', 'strategic');

    await page.click('button:has-text("Next")');

    // Step 4: Commitments
    await expect(page.locator('h2:has-text("Commitments")')).toBeVisible();

    // Add commitment 1
    await page.click('button:has-text("Add Commitment")');
    await page.fill('textarea[name="commitments[0].description_en"]', 'Prepare revised budget proposal');
    await page.fill('textarea[name="commitments[0].description_ar"]', 'إعداد مقترح الميزانية المعدل');
    await page.selectOption('select[name="commitments[0].owner_type"]', 'internal');
    await page.fill('input[name="commitments[0].internal_owner"]', 'John');
    await page.click('text=John Doe >> nth=0');
    await page.fill('input[name="commitments[0].due_date"]', '2025-01-30');

    // Add commitment 2
    await page.click('button:has-text("Add Commitment")');
    await page.fill('textarea[name="commitments[1].description_en"]', 'Update project timeline document');
    await page.fill('textarea[name="commitments[1].description_ar"]', 'تحديث وثيقة الجدول الزمني للمشروع');
    await page.selectOption('select[name="commitments[1].owner_type"]', 'internal');
    await page.fill('input[name="commitments[1].internal_owner"]', 'Jane');
    await page.click('text=Jane Smith >> nth=0');
    await page.fill('input[name="commitments[1].due_date"]', '2025-02-05');

    // Add commitment 3
    await page.click('button:has-text("Add Commitment")');
    await page.fill('textarea[name="commitments[2].description_en"]', 'Coordinate with finance department');
    await page.fill('textarea[name="commitments[2].description_ar"]', 'التنسيق مع قسم المالية');
    await page.selectOption('select[name="commitments[2].owner_type"]', 'internal');
    await page.fill('input[name="commitments[2].internal_owner"]', 'John');
    await page.click('text=John Doe >> nth=0');
    await page.fill('input[name="commitments[2].due_date"]', '2025-01-25');

    await page.click('button:has-text("Next")');

    // Step 5: Risks & Follow-ups
    await expect(page.locator('h2:has-text("Risks & Follow-ups")')).toBeVisible();

    // Add risk
    await page.click('button:has-text("Add Risk")');
    await page.fill('textarea[name="risks[0].description_en"]', 'Budget approval may be delayed');
    await page.fill('textarea[name="risks[0].description_ar"]', 'قد يتأخر الموافقة على الميزانية');
    await page.selectOption('select[name="risks[0].severity"]', 'medium');
    await page.selectOption('select[name="risks[0].likelihood"]', 'high');
    await page.fill('textarea[name="risks[0].mitigation_en"]', 'Prepare alternative funding sources');
    await page.fill('textarea[name="risks[0].mitigation_ar"]', 'إعداد مصادر تمويل بديلة');

    // Add follow-up action
    await page.click('button:has-text("Add Follow-up")');
    await page.fill('textarea[name="follow_ups[0].description_en"]', 'Schedule follow-up meeting in 2 weeks');
    await page.fill('textarea[name="follow_ups[0].description_ar"]', 'جدولة اجتماع متابعة خلال أسبوعين');

    await page.click('button:has-text("Next")');

    // Step 6: Review & Submit
    await expect(page.locator('h2:has-text("Review")')).toBeVisible();

    // Verify all entered data is displayed
    await expect(page.locator('text=Test Meeting Summary')).toBeVisible();
    await expect(page.locator('text=2 decisions')).toBeVisible();
    await expect(page.locator('text=3 commitments')).toBeVisible();
    await expect(page.locator('text=1 risk')).toBeVisible();
    await expect(page.locator('text=1 follow-up')).toBeVisible();

    // Save as draft first
    await page.click('button:has-text("Save Draft")');
    await page.waitForResponse(response =>
      response.url().includes('/after-action/create') && response.status() === 201
    );

    // Verify draft saved toast
    await expect(page.locator('text=Draft saved successfully')).toBeVisible();

    // Verify we're on the edit page
    await page.waitForURL(/\/after-action\/edit\//);

    // Get the after-action ID from URL
    const afterActionId = page.url().split('/edit/')[1];

    // Publish the after-action
    await page.click('button:has-text("Publish")');

    // Wait for publish confirmation dialog
    await expect(page.locator('text=Are you sure you want to publish?')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Wait for publish API call
    await page.waitForResponse(response =>
      response.url().includes(`/after-action/publish/${afterActionId}`) && response.status() === 200
    );

    // Verify publish success toast
    await expect(page.locator('text=After-action published successfully')).toBeVisible();

    // Verify status changed to published
    await expect(page.locator('span:has-text("Published")')).toBeVisible();

    // Navigate to tasks page to verify tasks were created
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Verify 3 tasks created (one for each commitment)
    await expect(page.locator('text=Prepare revised budget proposal')).toBeVisible();
    await expect(page.locator('text=Update project timeline document')).toBeVisible();
    await expect(page.locator('text=Coordinate with finance department')).toBeVisible();

    // Verify task metadata
    const task1 = page.locator('text=Prepare revised budget proposal >> xpath=ancestor::div[@role="row"]');
    await expect(task1.locator('text=John Doe')).toBeVisible();
    await expect(task1.locator('text=2025-01-30')).toBeVisible();

    const task2 = page.locator('text=Update project timeline document >> xpath=ancestor::div[@role="row"]');
    await expect(task2.locator('text=Jane Smith')).toBeVisible();
    await expect(task2.locator('text=2025-02-05')).toBeVisible();

    const task3 = page.locator('text=Coordinate with finance department >> xpath=ancestor::div[@role="row"]');
    await expect(task3.locator('text=John Doe')).toBeVisible();
    await expect(task3.locator('text=2025-01-25')).toBeVisible();

    // Verify tasks are linked to dossier (check task detail page)
    await page.click('text=Prepare revised budget proposal');
    await page.waitForURL(/\/tasks\//);
    await expect(page.locator('text=Related Dossier')).toBeVisible();
    await expect(page.locator('text=Related After-Action')).toBeVisible();
  });

  test('should validate required fields and show error messages', async ({ page }) => {
    await page.goto('/after-action/create');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Verify validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Purpose is required')).toBeVisible();
    await expect(page.locator('text=Meeting date is required')).toBeVisible();
  });

  test('should support auto-save draft every 30 seconds', async ({ page }) => {
    await page.goto('/after-action/create');

    // Fill some fields
    await page.fill('input[name="title"]', 'Auto-save Test');
    await page.fill('textarea[name="purpose"]', 'Testing auto-save functionality');

    // Wait for auto-save (30s + buffer)
    await page.waitForResponse(
      response => response.url().includes('/after-action/create') && response.status() === 201,
      { timeout: 35000 }
    );

    // Verify auto-save indicator
    await expect(page.locator('text=Draft saved')).toBeVisible();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data persisted
    await expect(page.locator('input[name="title"]')).toHaveValue('Auto-save Test');
    await expect(page.locator('textarea[name="purpose"]')).toHaveValue('Testing auto-save functionality');
  });

  test('should warn about unsaved changes on navigation', async ({ page }) => {
    await page.goto('/after-action/create');

    // Fill some fields
    await page.fill('input[name="title"]', 'Unsaved Test');

    // Try to navigate away
    await page.click('a:has-text("Dashboard")');

    // Verify warning dialog
    await expect(page.locator('text=You have unsaved changes')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to leave?')).toBeVisible();

    // Cancel navigation
    await page.click('button:has-text("Cancel")');

    // Verify still on create page
    await expect(page).toHaveURL(/\/after-action\/create/);
  });

  test('should handle RTL layout for Arabic content', async ({ page }) => {
    // Switch to Arabic
    await page.click('[aria-label="Language selector"]');
    await page.click('text=العربية');
    await page.waitForLoadState('networkidle');

    await page.goto('/after-action/create');

    // Verify RTL layout
    const formContainer = page.locator('form >> xpath=ancestor::div[@dir="rtl"]');
    await expect(formContainer).toBeVisible();

    // Verify logical properties (text should be aligned to start)
    const title = page.locator('label:has-text("العنوان")');
    await expect(title).toHaveCSS('text-align', /(start|right)/);

    // Fill Arabic content
    await page.fill('input[name="title"]', 'ملخص الاجتماع');
    await page.fill('textarea[name="purpose"]', 'مناقشة المعالم الرئيسية للمشروع');

    // Verify content displays correctly
    await expect(page.locator('input[name="title"]')).toHaveValue('ملخص الاجتماع');
  });

  test('should be mobile-responsive with touch-friendly targets', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/after-action/create');

    // Verify form is responsive
    const formContainer = page.locator('form');
    const boundingBox = await formContainer.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);

    // Verify touch targets are at least 44x44px
    const nextButton = page.locator('button:has-text("Next")');
    const buttonBox = await nextButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);

    // Verify adequate spacing between interactive elements
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count - 1; i++) {
      const box1 = await buttons.nth(i).boundingBox();
      const box2 = await buttons.nth(i + 1).boundingBox();

      if (box1 && box2) {
        const gap = Math.abs((box2.y - (box1.y + box1.height)));
        if (gap < 100) { // Only check vertically adjacent buttons
          expect(gap).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });
});
