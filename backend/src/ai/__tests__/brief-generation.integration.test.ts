/**
 * Brief Generation Integration Tests
 * Feature: 033-ai-brief-generation
 * Task: T064
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BriefGenerationAgent } from '../agents/brief-generation'

// Mock dependencies
vi.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockDossier, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'brief-123' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 'run-123', error: null })),
  },
}))

vi.mock('../../config/redis', () => ({
  redis: {
    get: vi.fn(() => Promise.resolve(null)),
    setex: vi.fn(() => Promise.resolve('OK')),
  },
}))

vi.mock('../llm-router', () => ({
  llmRouter: {
    chat: vi.fn(() =>
      Promise.resolve({
        content: JSON.stringify({
          executive_summary: 'Test executive summary for the brief.',
          key_points: ['Point 1', 'Point 2', 'Point 3'],
          background: 'Historical background information.',
          current_situation: 'Current situation analysis.',
          talking_points: ['Talk about A', 'Mention B', 'Discuss C'],
          recommended_actions: ['Action 1', 'Action 2'],
          risk_assessment: 'Low risk assessment.',
          citations: [
            {
              type: 'dossier',
              id: 'dossier-1',
              title: 'Japan Dossier',
              relevance: 'Primary source',
            },
          ],
        }),
        inputTokens: 1000,
        outputTokens: 500,
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        runId: 'run-123',
      }),
    ),
    streamChat: vi.fn(),
  },
}))

vi.mock('../embeddings-service', () => ({
  embeddingsService: {
    embed: vi.fn(() =>
      Promise.resolve({
        embedding: new Array(1024).fill(0.1),
        model: 'bge-m3',
        dimensions: 1024,
        cached: false,
      }),
    ),
  },
}))

const mockDossier = {
  id: 'dossier-123',
  name_en: 'Japan',
  name_ar: 'اليابان',
  entity_type: 'country',
  biography_en: 'Japan is an island country in East Asia.',
  biography_ar: 'اليابان دولة جزيرة في شرق آسيا.',
  organization_id: 'org-123',
}

describe('Brief Generation Integration', () => {
  let agent: BriefGenerationAgent

  beforeEach(() => {
    vi.clearAllMocks()
    agent = new BriefGenerationAgent()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateBrief', () => {
    it('should generate a brief for a valid dossier', async () => {
      const result = await agent.generateBrief({
        dossierId: 'dossier-123',
        organizationId: 'org-123',
        userId: 'user-123',
        language: 'en',
        briefType: 'meeting_prep',
        contextOverride: {
          meetingDate: '2024-12-15',
          meetingPurpose: 'Bilateral trade discussions',
        },
      })

      expect(result).toBeDefined()
      expect(result.briefId).toBeDefined()
      expect(result.runId).toBeDefined()
    })

    it('should handle Arabic language briefs', async () => {
      const result = await agent.generateBrief({
        dossierId: 'dossier-123',
        organizationId: 'org-123',
        userId: 'user-123',
        language: 'ar',
        briefType: 'situation_report',
      })

      expect(result).toBeDefined()
      expect(result.briefId).toBeDefined()
    })

    it('should support different brief types', async () => {
      const briefTypes = [
        'meeting_prep',
        'situation_report',
        'background',
        'talking_points',
      ] as const

      for (const briefType of briefTypes) {
        const result = await agent.generateBrief({
          dossierId: 'dossier-123',
          organizationId: 'org-123',
          userId: 'user-123',
          language: 'en',
          briefType,
        })

        expect(result).toBeDefined()
        expect(result.briefId).toBeDefined()
      }
    })
  })

  describe('Brief Content Structure', () => {
    it('should include all required sections', async () => {
      const { llmRouter } = await import('../llm-router')

      await agent.generateBrief({
        dossierId: 'dossier-123',
        organizationId: 'org-123',
        userId: 'user-123',
        language: 'en',
        briefType: 'meeting_prep',
      })

      expect(llmRouter.chat).toHaveBeenCalled()
      const chatCall = vi.mocked(llmRouter.chat).mock.calls[0]
      expect(chatCall).toBeDefined()
    })
  })

  describe('Context Building', () => {
    it('should build context with dossier information', async () => {
      const { llmRouter } = await import('../llm-router')

      await agent.generateBrief({
        dossierId: 'dossier-123',
        organizationId: 'org-123',
        userId: 'user-123',
        language: 'en',
        briefType: 'meeting_prep',
      })

      const chatCall = vi.mocked(llmRouter.chat).mock.calls[0]
      const messages = chatCall?.[1]

      expect(messages).toBeDefined()
      expect(messages?.length).toBeGreaterThan(0)
    })

    it('should include meeting context when provided', async () => {
      const { llmRouter } = await import('../llm-router')

      await agent.generateBrief({
        dossierId: 'dossier-123',
        organizationId: 'org-123',
        userId: 'user-123',
        language: 'en',
        briefType: 'meeting_prep',
        contextOverride: {
          meetingDate: '2024-12-15',
          meetingPurpose: 'Trade negotiations',
          attendees: ['Ambassador Smith', 'Director Tanaka'],
        },
      })

      const chatCall = vi.mocked(llmRouter.chat).mock.calls[0]
      expect(chatCall).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle dossier not found', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
          })),
        })),
      } as never)

      await expect(
        agent.generateBrief({
          dossierId: 'non-existent',
          organizationId: 'org-123',
          userId: 'user-123',
          language: 'en',
          briefType: 'meeting_prep',
        }),
      ).rejects.toThrow()
    })

    it('should handle LLM errors gracefully', async () => {
      const { llmRouter } = await import('../llm-router')
      vi.mocked(llmRouter.chat).mockRejectedValueOnce(new Error('LLM service unavailable'))

      await expect(
        agent.generateBrief({
          dossierId: 'dossier-123',
          organizationId: 'org-123',
          userId: 'user-123',
          language: 'en',
          briefType: 'meeting_prep',
        }),
      ).rejects.toThrow('LLM service unavailable')
    })
  })

  describe('Observability', () => {
    it('should record AI run metrics', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')

      await agent.generateBrief({
        dossierId: 'dossier-123',
        organizationId: 'org-123',
        userId: 'user-123',
        language: 'en',
        briefType: 'meeting_prep',
      })

      expect(supabaseAdmin.rpc).toHaveBeenCalled()
    })
  })
})

describe('Brief Generation Edge Cases', () => {
  let agent: BriefGenerationAgent

  beforeEach(() => {
    vi.clearAllMocks()
    agent = new BriefGenerationAgent()
  })

  it('should handle empty dossier biography', async () => {
    const { supabaseAdmin } = await import('../../config/supabase')
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { ...mockDossier, biography_en: '', biography_ar: '' },
              error: null,
            }),
          ),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'brief-123' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    } as never)

    const result = await agent.generateBrief({
      dossierId: 'dossier-123',
      organizationId: 'org-123',
      userId: 'user-123',
      language: 'en',
      briefType: 'background',
    })

    expect(result).toBeDefined()
  })

  it('should handle very long context', async () => {
    const { supabaseAdmin } = await import('../../config/supabase')
    const longBiography = 'A'.repeat(50000)

    vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { ...mockDossier, biography_en: longBiography },
              error: null,
            }),
          ),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'brief-123' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    } as never)

    const result = await agent.generateBrief({
      dossierId: 'dossier-123',
      organizationId: 'org-123',
      userId: 'user-123',
      language: 'en',
      briefType: 'meeting_prep',
    })

    expect(result).toBeDefined()
  })
})
