import { describe, it, expect } from 'vitest'
import {
  renderAlertEmailTemplate,
  mapNotificationTypeToTemplate,
} from '@/services/email-template.service'

describe('renderAlertEmailTemplate', () => {
  const enData = {
    title: 'New Assignment',
    message: 'You were assigned a new work item.',
    actionUrl: '/work-items/123',
  }

  const arData = {
    title: '\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629',
    message: '\u062A\u0645 \u062A\u0639\u064A\u064A\u0646\u0643 \u0639\u0644\u0649 \u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629.',
    actionUrl: '/work-items/123',
  }

  describe('English templates', () => {
    it('returns subject with [Action Required] prefix', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.subject).toBe('[Action Required] New Assignment')
    })

    it('returns HTML body with CTA button text in English', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('View in Intl Dossier')
    })

    it('returns HTML body with dir="ltr"', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('dir="ltr"')
    })

    it('returns HTML body with lang="en"', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('lang="en"')
    })

    it('includes unsubscribe link to /settings?section=notifications', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('/settings?section=notifications')
      expect(result.bodyHtml).toContain('Unsubscribe from these emails')
    })

    it('uses inline styles with CTA button color #166534', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('#166534')
    })

    it('uses table-based layout with max-width 600px', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('max-width')
      expect(result.bodyHtml).toContain('600')
    })

    it('returns a plain text body without HTML tags', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyText).not.toContain('<')
      expect(result.bodyText).toContain('New Assignment')
      expect(result.bodyText).toContain('View in Intl Dossier')
    })

    it('includes the action URL in the body', () => {
      const result = renderAlertEmailTemplate('en', enData)
      expect(result.bodyHtml).toContain('/work-items/123')
      expect(result.bodyText).toContain('/work-items/123')
    })
  })

  describe('Arabic templates', () => {
    it('returns subject with Arabic [Action Required] prefix', () => {
      const result = renderAlertEmailTemplate('ar', arData)
      expect(result.subject).toBe('[\u0627\u062C\u0631\u0627\u0621 \u0645\u0637\u0644\u0648\u0628] \u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629')
    })

    it('returns HTML body with dir="rtl" for Arabic', () => {
      const result = renderAlertEmailTemplate('ar', arData)
      expect(result.bodyHtml).toContain('dir="rtl"')
    })

    it('returns HTML body with lang="ar"', () => {
      const result = renderAlertEmailTemplate('ar', arData)
      expect(result.bodyHtml).toContain('lang="ar"')
    })

    it('returns HTML body with Arabic CTA button text', () => {
      const result = renderAlertEmailTemplate('ar', arData)
      expect(result.bodyHtml).toContain('\u0639\u0631\u0636 \u0641\u064A \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062F\u0648\u0644\u064A')
    })

    it('includes Arabic unsubscribe text', () => {
      const result = renderAlertEmailTemplate('ar', arData)
      expect(result.bodyHtml).toContain('\u0627\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0626\u0644')
    })

    it('returns a plain text body without HTML tags', () => {
      const result = renderAlertEmailTemplate('ar', arData)
      expect(result.bodyText).not.toContain('<')
      expect(result.bodyText).toContain('\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629')
    })
  })

  describe('HTML injection prevention (T-16-01)', () => {
    it('escapes HTML entities in title', () => {
      const result = renderAlertEmailTemplate('en', {
        title: '<script>alert("xss")</script>',
        message: 'Test',
        actionUrl: '/test',
      })
      expect(result.bodyHtml).not.toContain('<script>')
      expect(result.bodyHtml).toContain('&lt;script&gt;')
    })

    it('escapes HTML entities in message', () => {
      const result = renderAlertEmailTemplate('en', {
        title: 'Test',
        message: '<img onerror="alert(1)" src="x">',
        actionUrl: '/test',
      })
      expect(result.bodyHtml).not.toContain('<img')
      expect(result.bodyHtml).toContain('&lt;img')
    })
  })
})

describe('mapNotificationTypeToTemplate', () => {
  it('returns notification_alert for assignment type', () => {
    expect(mapNotificationTypeToTemplate('assignment')).toBe('notification_alert')
  })

  it('returns notification_alert for deadline type', () => {
    expect(mapNotificationTypeToTemplate('deadline')).toBe('notification_alert')
  })

  it('returns notification_alert for lifecycle type', () => {
    expect(mapNotificationTypeToTemplate('lifecycle')).toBe('notification_alert')
  })

  it('returns notification_alert for unknown types (default)', () => {
    expect(mapNotificationTypeToTemplate('unknown_type')).toBe('notification_alert')
  })
})
