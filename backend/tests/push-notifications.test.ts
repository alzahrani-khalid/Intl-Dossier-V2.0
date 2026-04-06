import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock web-push before importing the service
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}))

// Mock supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
    })),
  })),
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

import webpush from 'web-push'
import {
  sendPushNotification,
  isValidPushEndpoint,
  initializeVapid,
} from '@/services/push.service'

describe('Push Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidPushEndpoint', () => {
    it('accepts valid Mozilla push endpoint', () => {
      expect(
        isValidPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc123'),
      ).toBe(true)
    })

    it('accepts valid FCM push endpoint', () => {
      expect(
        isValidPushEndpoint('https://fcm.googleapis.com/fcm/send/abc123'),
      ).toBe(true)
    })

    it('accepts valid Windows push endpoint', () => {
      expect(
        isValidPushEndpoint('https://db5p.notify.windows.com/w/?token=abc'),
      ).toBe(true)
    })

    it('rejects non-HTTPS endpoints', () => {
      expect(
        isValidPushEndpoint('http://fcm.googleapis.com/fcm/send/abc123'),
      ).toBe(false)
    })

    it('rejects endpoints from unknown domains', () => {
      expect(
        isValidPushEndpoint('https://evil.example.com/push'),
      ).toBe(false)
    })

    it('rejects invalid URLs', () => {
      expect(isValidPushEndpoint('not-a-url')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidPushEndpoint('')).toBe(false)
    })
  })

  describe('sendPushNotification', () => {
    const validSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
      keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' },
    }

    const payload = {
      title: 'Test Notification',
      body: 'This is a test',
      url: '/dashboard',
    }

    it('sends notification successfully and returns true', async () => {
      vi.mocked(webpush.sendNotification).mockResolvedValueOnce({} as never)

      const result = await sendPushNotification(validSubscription, payload)
      expect(result).toBe(true)
      expect(webpush.sendNotification).toHaveBeenCalledOnce()
    })

    it('handles 410 Gone by deactivating subscription and returning false', async () => {
      const error = new Error('Gone') as Error & { statusCode: number }
      error.statusCode = 410
      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(error)

      const result = await sendPushNotification(validSubscription, payload)
      expect(result).toBe(false)
    })

    it('handles 404 Not Found by deactivating subscription and returning false', async () => {
      const error = new Error('Not Found') as Error & { statusCode: number }
      error.statusCode = 404
      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(error)

      const result = await sendPushNotification(validSubscription, payload)
      expect(result).toBe(false)
    })

    it('returns false on other errors without deactivating', async () => {
      const error = new Error('Network error') as Error & { statusCode: number }
      error.statusCode = 500
      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(error)

      const result = await sendPushNotification(validSubscription, payload)
      expect(result).toBe(false)
    })

    it('rejects untrusted endpoints without sending', async () => {
      const untrustedSubscription = {
        endpoint: 'https://evil.example.com/push',
        keys: { p256dh: 'key', auth: 'auth' },
      }

      const result = await sendPushNotification(untrustedSubscription, payload)
      expect(result).toBe(false)
      expect(webpush.sendNotification).not.toHaveBeenCalled()
    })
  })

  describe('initializeVapid', () => {
    it('calls setVapidDetails when env vars are set', () => {
      const originalEnv = { ...process.env }
      process.env.VAPID_CONTACT_EMAIL = 'mailto:test@example.com'
      process.env.VAPID_PUBLIC_KEY = 'test-public-key'
      process.env.VAPID_PRIVATE_KEY = 'test-private-key'

      initializeVapid()

      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:test@example.com',
        'test-public-key',
        'test-private-key',
      )

      process.env = originalEnv
    })

    it('does not crash when env vars are missing', () => {
      const originalEnv = { ...process.env }
      delete process.env.VAPID_CONTACT_EMAIL
      delete process.env.VAPID_PUBLIC_KEY
      delete process.env.VAPID_PRIVATE_KEY

      expect(() => initializeVapid()).not.toThrow()

      process.env = originalEnv
    })
  })
})
