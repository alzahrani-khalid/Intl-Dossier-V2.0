// @covers TEST-07
import { test, expect } from './support/fixtures'
import CalendarPage from './support/pages/CalendarPage'

test.describe('TEST-07 calendar events', () => {
  test('creates a calendar event and views it @mobile', async ({ analystPage, uniqueId }) => {
    test.fixme(true, 'P101-QUAR 31848669722: red - getByLabel(/title/) unresolved 30 s after the Create Event click (failure screenshot still on /calendar, empty state); the entry form carries two title labels (English, Arabic), so CalendarPage needs rework; log line 1133 of job 94920109119; owner Phase 103')
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
    test.fixme(true, 'P101-QUAR 31848669722: red - no calendar-event holding a lifecycle-date-badge (failure screenshot: analyst calendar empty); the lifecycle-date-badge testid has 0 hits in frontend/src; seed data plus app contract; log line 1066 of job 94920109119; owner Phase 103')
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
