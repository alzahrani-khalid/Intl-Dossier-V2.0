import { test } from '@playwright/test'

const FIXTURE_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe.serial('Phase 52 mid-drag overlay parity capture (NOT a regression spec)', () => {
  test('TasksTab mid-drag screenshot', async ({ page }): Promise<void> => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`/engagements/${FIXTURE_ID}`)
    await page.waitForLoadState('networkidle')

    // Engagement workspace defaults to Overview tab; click Tasks tab.
    const tasksTab = page.getByRole('tab', { name: /tasks|مهام/i }).first()
    await tasksTab.click()
    await page.waitForTimeout(300)

    const card = page.locator('[data-droppable-id="todo"] [data-card-id]').first()
    const target = page.locator('[data-droppable-id="in_progress"]').first()
    await card.waitFor({ state: 'visible', timeout: 15_000 })
    await target.waitFor({ state: 'visible', timeout: 15_000 })

    const cardBox = await card.boundingBox()
    const targetBox = await target.boundingBox()
    if (!cardBox || !targetBox) throw new Error('No card/target bounding box')

    const sx = cardBox.x + cardBox.width / 2
    const sy = cardBox.y + cardBox.height / 2
    const tx = targetBox.x + targetBox.width / 2
    const ty = targetBox.y + targetBox.height / 2

    await page.mouse.move(sx, sy)
    await page.mouse.down()
    await page.mouse.move(sx + 20, sy + 20, { steps: 5 })
    await page.mouse.move((sx + tx) / 2, (sy + ty) / 2, { steps: 10 })
    await page.waitForTimeout(150)

    await page.screenshot({
      path: 'tests/e2e/__phase52-mid-drag__/tasks-tab-mid-drag.png',
      fullPage: false,
    })
    await page.mouse.up()
  })

  test('EngagementKanbanDialog mid-drag screenshot', async ({ page }): Promise<void> => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'en')
      localStorage.setItem('intl-dossier-onboarding-seen', 'true')
      localStorage.setItem('intl-dossier-onboarding-completed', 'true')
      localStorage.setItem('intl-dossier-tours-enabled', 'false')
    })
    await page.goto(`/dossiers/engagements/${FIXTURE_ID}`)
    await page.waitForLoadState('networkidle')

    const trigger = page.getByRole('button', { name: /kanban|board|اللوحة|كانبان/i }).first()
    await trigger.waitFor({ state: 'visible', timeout: 15_000 })
    await trigger.click()
    await page.waitForTimeout(2000)

    // Debug screenshot — capture dialog state right after click.
    await page.screenshot({
      path: 'tests/e2e/__phase52-mid-drag__/engagement-kanban-dialog-after-click.png',
      fullPage: false,
    })

    // Wait for any kanban column to render in the dialog.
    await page.locator('[data-droppable-id]').first().waitFor({ state: 'visible', timeout: 15_000 })
    await page.waitForTimeout(800)

    const card = page.locator('[data-card-id]').first()
    const target = page
      .locator('[data-droppable-id="in_progress"], [data-droppable-id="done"]')
      .first()
    await card.waitFor({ state: 'visible', timeout: 15_000 })
    await target.waitFor({ state: 'visible', timeout: 15_000 })

    const cardBox = await card.boundingBox()
    const targetBox = await target.boundingBox()
    if (!cardBox || !targetBox) throw new Error('No card/target bounding box')

    const sx = cardBox.x + cardBox.width / 2
    const sy = cardBox.y + cardBox.height / 2
    const tx = targetBox.x + targetBox.width / 2
    const ty = targetBox.y + targetBox.height / 2

    await page.mouse.move(sx, sy)
    await page.mouse.down()
    await page.mouse.move(sx + 20, sy + 20, { steps: 5 })
    await page.mouse.move((sx + tx) / 2, (sy + ty) / 2, { steps: 10 })
    await page.waitForTimeout(150)

    await page.screenshot({
      path: 'tests/e2e/__phase52-mid-drag__/engagement-kanban-dialog-mid-drag.png',
      fullPage: false,
    })
    await page.mouse.up()
  })
})
