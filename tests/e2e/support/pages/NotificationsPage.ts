import type { Locator, Page } from '@playwright/test'

export type NotificationCategory = 'work_item' | 'mention' | 'system'
export type NotificationChannel = 'in_app' | 'email' | 'push'

export default class NotificationsPage {
  constructor(public readonly page: Page) {}

  get bellButton(): Locator {
    return this.page.getByRole('button', { name: /notifications|الإشعارات/i })
  }

  get unreadBadge(): Locator {
    return this.page.getByTestId('notification-unread-count')
  }

  async openBell(): Promise<void> {
    await this.bellButton.click()
  }

  async getUnreadCount(): Promise<number> {
    const text = (await this.unreadBadge.textContent())?.trim() ?? '0'
    const parsed = Number.parseInt(text, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }

  async markAllRead(): Promise<void> {
    await this.page.getByRole('button', { name: /mark all.*read|تحديد.*مقروء/i }).click()
  }

  async openPreferences(): Promise<void> {
    await this.page.goto('/settings/notifications')
  }

  async togglePreference(
    category: NotificationCategory,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<void> {
    const toggle = this.page.getByTestId(`notification-pref-${category}-${channel}`)
    const current = await toggle.getAttribute('aria-checked')
    const isOn = current === 'true'
    if (isOn !== enabled) {
      await toggle.click()
    }
  }
}
