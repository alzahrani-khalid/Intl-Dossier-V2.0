import { describe, it, expect } from 'vitest'
import { detectArabicContent, isArabicDominant } from '../llm-router'

describe('Arabic Detection', () => {
  describe('detectArabicContent', () => {
    it('returns 0 for empty string', () => {
      expect(detectArabicContent('')).toBe(0)
    })

    it('returns 0 for pure English text', () => {
      const text = 'This is a test message in English.'
      expect(detectArabicContent(text)).toBe(0)
    })

    it('returns 1 for pure Arabic text', () => {
      const text = 'مرحبا بكم في النظام'
      const ratio = detectArabicContent(text)
      expect(ratio).toBeGreaterThan(0.9)
    })

    it('returns correct ratio for mixed content (50% Arabic)', () => {
      const text = 'Hello مرحبا World العالم'
      const ratio = detectArabicContent(text)
      expect(ratio).toBeGreaterThan(0.3)
      expect(ratio).toBeLessThan(0.7)
    })

    it('handles text with Arabic numbers', () => {
      const text = 'Report #123 تقرير'
      const ratio = detectArabicContent(text)
      expect(ratio).toBeGreaterThan(0)
    })

    it('handles text with punctuation and spaces', () => {
      const text = '!@#$% مرحبا !@#$%'
      const ratio = detectArabicContent(text)
      expect(ratio).toBeGreaterThan(0)
    })

    it('handles null/undefined gracefully', () => {
      expect(detectArabicContent(null as unknown as string)).toBe(0)
      expect(detectArabicContent(undefined as unknown as string)).toBe(0)
    })
  })

  describe('isArabicDominant', () => {
    it('returns false for pure English', () => {
      expect(isArabicDominant('Hello World')).toBe(false)
    })

    it('returns true for pure Arabic', () => {
      expect(isArabicDominant('مرحبا بكم')).toBe(true)
    })

    it('returns false when Arabic is below 30% threshold', () => {
      const text = 'Hello World مرحبا'
      expect(isArabicDominant(text)).toBe(false)
    })

    it('returns true when Arabic is above 30% threshold', () => {
      const text = 'مرحبا Hello بكم'
      expect(isArabicDominant(text)).toBe(true)
    })

    it('respects custom threshold', () => {
      const text = 'Hello مرحبا World'
      expect(isArabicDominant(text, 0.1)).toBe(true)
      expect(isArabicDominant(text, 0.5)).toBe(false)
    })

    it('handles edge case at exactly 30%', () => {
      expect(isArabicDominant('HHHمر', 0.3)).toBe(false)
      expect(isArabicDominant('HHمرح', 0.3)).toBe(true)
    })
  })

  describe('Real-world scenarios', () => {
    it('detects Arabic-dominant diplomatic correspondence', () => {
      const text =
        'بخصوص الاجتماع المقرر عقده يوم الثلاثاء القادم - RE: Meeting scheduled for Tuesday'
      expect(isArabicDominant(text)).toBe(true)
    })

    it('detects English-dominant with Arabic names', () => {
      const text =
        'Meeting with Mohammed Al-Rashid at the Saudi Embassy regarding bilateral agreements'
      expect(isArabicDominant(text)).toBe(false)
    })

    it('handles bilingual formal documents', () => {
      const text = `
        Subject: Quarterly Report / التقرير الربعي
        
        This document contains the quarterly report for Q4 2024.
        يحتوي هذا المستند على التقرير الربعي للربع الرابع من عام 2024.
      `
      const ratio = detectArabicContent(text)
      expect(ratio).toBeGreaterThan(0.2)
      expect(ratio).toBeLessThan(0.6)
    })
  })
})
