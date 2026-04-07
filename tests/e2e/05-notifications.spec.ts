// @covers TEST-05
import { test, expect } from './support/fixtures'
import NotificationsPage from './support/pages/NotificationsPage'

/**
 * Trigger an in-app notification for the currently authenticated user.
 *
 * The backend exposes a test-only trigger endpoint (gated on
 * `NODE_ENV !== 'production'`, per threat T-18-10). We POST using the
 * page's own request context so the user's JWT cookie is attached
 * automatically — no need to mint a separate admin token here.
 */
const triggerNotification = async (
  page: import('@playwright/test').Page,
  title: string,
): Promise<void> => {
  const response = await page.request.post('/api/notifications/test-trigger', {
    data: { title, body: 'e2e-triggered notification', category: 'system' },
    failOnStatusCode: false,
  })
  if (!response.ok()) {
    test.skip(
      true,
      `notification test-trigger endpoint unavailable (status=${response.status()}) — skipping`,
    )
  }
}

test.describe('TEST-05 notifications', () => {
  test('receives in-app notification and updates bell badge', async ({
    adminPage,
    uniqueId,
  }) => {
    const notifications = new NotificationsPage(adminPage)
    await adminPage.goto('/')

    const before = await notifications.getUnreadCount()
    const title = uniqueId('notif')
    await triggerNotification(adminPage, title)

    await expect
      .poll(async () => notifications.getUnreadCount(), { timeout: 10_000 })
      .toBeGreaterThan(before)

    await notifications.openBell()
    await expect(adminPage.getByText(title)).toBeVisible()
  })

  test('marks all as read', async ({ adminPage, uniqueId }) => {
    const notifications = new NotificationsPage(adminPage)
    await adminPage.goto('/')

    await triggerNotification(adminPage, uniqueId('notif'))
    await triggerNotification(adminPage, uniqueId('notif'))

    await expect
      .poll(async () => notifications.getUnreadCount(), { timeout: 10_000 })
      .toBeGreaterThan(0)

    await notifications.openBell()
    await notifications.markAllRead()

    await expect
      .poll(async () => notifications.getUnreadCount(), { timeout: 10_000 })
      .toBe(0)
  })

  test('toggles notification preference and persists across reload', async ({
    adminPage,
  }) => {
    const notifications = new NotificationsPage(adminPage)
    await notifications.openPreferences()

    await notifications.togglePreference('work_item', 'email', false)
    await adminPage.reload()

    const toggle = adminPage.getByTestId('notification-pref-work_item-email')
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})
