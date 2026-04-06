import { describe, it, expect } from 'vitest'
import {
  renderDailyDigestTemplate,
  renderWeeklyDigestTemplate,
} from '../services/digest-template.service'
import type { DigestContent } from '../services/digest-template.service'

const sampleContent: DigestContent = {
  watchlist_items: [
    { name: 'Saudi Arabia', type: 'country' },
    { name: 'OPEC Summit', type: 'forum' },
  ],
  upcoming_deadlines: [
    { title: 'Submit briefing', deadline: '2026-04-10' },
  ],
  pending_assignments: [
    { title: 'Review MOU draft', assignee: 'Khalid' },
  ],
  active_commitments: [
    { title: 'Follow up with embassy', status: 'in_progress' },
  ],
  recent_notifications: [
    { title: 'New engagement created', created_at: '2026-04-05T10:00:00Z' },
  ],
}

const emptyContent: DigestContent = {
  watchlist_items: [],
  upcoming_deadlines: [],
  pending_assignments: [],
  active_commitments: [],
  recent_notifications: [],
}

describe('Digest Template Service', () => {
  describe('renderDailyDigestTemplate', () => {
    it('renders English daily digest with correct subject', () => {
      const result = renderDailyDigestTemplate('en', '2026-04-06', sampleContent)
      expect(result.subject).toBe('Your Daily Briefing -- 2026-04-06')
    })

    it('renders Arabic daily digest with correct subject', () => {
      const result = renderDailyDigestTemplate('ar', '2026-04-06', sampleContent)
      expect(result.subject).toBe('ملخصك اليومي -- 2026-04-06')
    })

    it('renders English daily digest with HTML body containing sections', () => {
      const result = renderDailyDigestTemplate('en', '2026-04-06', sampleContent)
      expect(result.bodyHtml).toContain('Saudi Arabia')
      expect(result.bodyHtml).toContain('Submit briefing')
      expect(result.bodyHtml).toContain('Review MOU draft')
      expect(result.bodyHtml).toContain('Follow up with embassy')
      expect(result.bodyHtml).toContain('New engagement created')
    })

    it('renders Arabic daily digest with dir="rtl"', () => {
      const result = renderDailyDigestTemplate('ar', '2026-04-06', sampleContent)
      expect(result.bodyHtml).toContain('dir="rtl"')
    })

    it('renders plain text body', () => {
      const result = renderDailyDigestTemplate('en', '2026-04-06', sampleContent)
      expect(result.bodyText).toContain('Saudi Arabia')
      expect(result.bodyText.length).toBeGreaterThan(0)
    })

    it('renders empty state for English when no content', () => {
      const result = renderDailyDigestTemplate('en', '2026-04-06', emptyContent)
      expect(result.bodyHtml).toContain('No pending items this period')
      expect(result.bodyHtml).toContain("You're all caught up!")
    })

    it('renders empty state for Arabic when no content', () => {
      const result = renderDailyDigestTemplate('ar', '2026-04-06', emptyContent)
      expect(result.bodyHtml).toContain('لا توجد عناصر معلقة في هذه الفترة')
      expect(result.bodyHtml).toContain('انت على اطلاع بكل شيء!')
    })

    it('includes unsubscribe footer with settings link', () => {
      const result = renderDailyDigestTemplate('en', '2026-04-06', sampleContent)
      expect(result.bodyHtml).toContain('/settings?section=notifications')
    })

    it('includes CTA link to dashboard', () => {
      const result = renderDailyDigestTemplate('en', '2026-04-06', sampleContent)
      expect(result.bodyHtml).toContain('/dashboard')
      expect(result.bodyHtml).toContain('View in Intl Dossier')
    })

    it('includes Arabic CTA for Arabic locale', () => {
      const result = renderDailyDigestTemplate('ar', '2026-04-06', sampleContent)
      expect(result.bodyHtml).toContain('عرض في الملف الدولي')
    })

    it('escapes HTML entities in user content', () => {
      const maliciousContent: DigestContent = {
        ...emptyContent,
        watchlist_items: [{ name: '<script>alert("xss")</script>', type: 'country' }],
      }
      const result = renderDailyDigestTemplate('en', '2026-04-06', maliciousContent)
      expect(result.bodyHtml).not.toContain('<script>')
      expect(result.bodyHtml).toContain('&lt;script&gt;')
    })
  })

  describe('renderWeeklyDigestTemplate', () => {
    it('renders English weekly digest with correct subject', () => {
      const result = renderWeeklyDigestTemplate('en', 'Mar 31 - Apr 6', sampleContent)
      expect(result.subject).toBe('Weekly Summary -- Mar 31 - Apr 6')
    })

    it('renders Arabic weekly digest with correct subject', () => {
      const result = renderWeeklyDigestTemplate('ar', 'Mar 31 - Apr 6', sampleContent)
      expect(result.subject).toBe('الملخص الاسبوعي -- Mar 31 - Apr 6')
    })

    it('renders Arabic weekly digest with dir="rtl"', () => {
      const result = renderWeeklyDigestTemplate('ar', 'Mar 31 - Apr 6', sampleContent)
      expect(result.bodyHtml).toContain('dir="rtl"')
    })

    it('renders empty state for weekly digest', () => {
      const result = renderWeeklyDigestTemplate('en', 'Mar 31 - Apr 6', emptyContent)
      expect(result.bodyHtml).toContain('No pending items this period')
    })

    it('includes unsubscribe footer', () => {
      const result = renderWeeklyDigestTemplate('en', 'Mar 31 - Apr 6', sampleContent)
      expect(result.bodyHtml).toContain('/settings?section=notifications')
    })

    it('renders plain text body for weekly', () => {
      const result = renderWeeklyDigestTemplate('en', 'Mar 31 - Apr 6', sampleContent)
      expect(result.bodyText.length).toBeGreaterThan(0)
    })
  })
})
