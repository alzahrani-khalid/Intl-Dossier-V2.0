// @covers TEST-07
import { test, expect } from './support/fixtures'
import CalendarPage from './support/pages/CalendarPage'

test.describe('TEST-07 calendar events', () => {
  test('creates a calendar event and views it @mobile', async ({ analystPage, uniqueId }) => {
    const calendar = new CalendarPage(analystPage)
    const title = uniqueId('cal')

    await calendar.goto()
    await calendar.createEvent({
      title,
      start: '2026-05-01T10:00',
      end: '2026-05-01T11:00',
    })

    const eventCard = analystPage.getByRole('button', { name: new RegExp(title, 'i') }).first()
    await expect(eventCard).toBeVisible()

    await calendar.viewEvent(title)
    const detailPanel = analystPage
      .getByRole('dialog', { name: new RegExp(title, 'i') })
      .or(analystPage.getByTestId('calendar-event-detail'))
    await expect(detailPanel).toBeVisible()
    await expect(detailPanel.getByText(new RegExp(title, 'i'))).toBeVisible()
  })

  test('shows lifecycle dates on engagement-linked event', async ({ analystPage }) => {
    const calendar = new CalendarPage(analystPage)
    await calendar.goto()
    // Filter / locate any engagement-linked event with lifecycle date badges.
    const linkedEvent = analystPage
      .getByTestId('calendar-event')
      .filter({ has: analystPage.getByTestId('lifecycle-date-badge') })
      .first()
    await expect(linkedEvent).toBeVisible()
    await expect(linkedEvent.getByTestId('lifecycle-date-badge').first()).toBeVisible()
  })
})
