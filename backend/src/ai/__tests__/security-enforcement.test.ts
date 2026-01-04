import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LLMRouter } from '../llm-router'
import { aiConfig, DataClassification } from '../config'

vi.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}))

describe('Security Enforcement', () => {
  let router: LLMRouter

  beforeEach(() => {
    router = new LLMRouter()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Data Classification Routing', () => {
    it('routes secret data to private provider only', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'openai',
            default_model: 'gpt-4o',
            private_provider: 'vllm',
            private_model: 'llama-3.1-70b',
            private_endpoint_url: 'http://localhost:8000',
            allow_cloud_for_confidential: false,
          },
        ],
        error: null,
      })

      const provider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'brief_generation',
          dataClassification: 'secret' as DataClassification,
        },
        'Test input',
      )

      expect(provider.provider).toBe('vllm')
      expect(provider.model).toBe('llama-3.1-70b')
    })

    it('throws error for secret data without private provider', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'openai',
            default_model: 'gpt-4o',
            private_provider: null,
            allow_cloud_for_confidential: false,
          },
        ],
        error: null,
      })

      const originalPrivateProvider = aiConfig.routing.privateProvider
      aiConfig.routing.privateProvider = null

      await expect(
        router.selectProvider(
          {
            organizationId: 'test-org',
            userId: 'test-user',
            feature: 'chat',
            dataClassification: 'secret' as DataClassification,
          },
          'Classified information',
        ),
      ).rejects.toThrow('Secret data requires private LLM')

      aiConfig.routing.privateProvider = originalPrivateProvider
    })

    it('routes confidential data to private when cloud not allowed', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'openai',
            default_model: 'gpt-4o',
            private_provider: 'ollama',
            private_model: 'llama3.1',
            allow_cloud_for_confidential: false,
          },
        ],
        error: null,
      })

      const originalPrivateProvider = aiConfig.routing.privateProvider
      aiConfig.routing.privateProvider = 'ollama'

      const provider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'entity_linking',
          dataClassification: 'confidential' as DataClassification,
        },
        'Internal document',
      )

      expect(provider.provider).toBe('ollama')

      aiConfig.routing.privateProvider = originalPrivateProvider
    })

    it('allows cloud for confidential when org policy permits', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'openai',
            default_model: 'gpt-4o',
            allow_cloud_for_confidential: true,
          },
        ],
        error: null,
      })

      const provider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'brief_generation',
          dataClassification: 'confidential' as DataClassification,
        },
        'Confidential memo',
      )

      expect(provider.provider).toBe('openai')
    })

    it('allows cloud for public and internal data', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'anthropic',
            default_model: 'claude-3-5-sonnet-20241022',
            allow_cloud_for_confidential: false,
          },
        ],
        error: null,
      })

      const publicProvider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'chat',
          dataClassification: 'public' as DataClassification,
        },
        'Public announcement',
      )

      expect(publicProvider.provider).toBe('anthropic')

      const internalProvider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'chat',
          dataClassification: 'internal' as DataClassification,
        },
        'Internal memo',
      )

      expect(internalProvider.provider).toBe('anthropic')
    })
  })

  describe('Spend Cap Enforcement', () => {
    it('allows requests when under spend cap', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            current_spend: 100,
            monthly_cap: 500,
            cap_reached: false,
            alert_threshold_reached: false,
          },
        ],
        error: null,
      })

      const result = await router.checkSpendCap('test-org')
      expect(result.allowed).toBe(true)
    })

    it('blocks requests when spend cap reached', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            current_spend: 500,
            monthly_cap: 500,
            cap_reached: true,
            alert_threshold_reached: true,
          },
        ],
        error: null,
      })

      const result = await router.checkSpendCap('test-org')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Monthly spend cap')
    })

    it('logs warning when alert threshold reached', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            current_spend: 400,
            monthly_cap: 500,
            cap_reached: false,
            alert_threshold_reached: true,
          },
        ],
        error: null,
      })

      const result = await router.checkSpendCap('test-org')
      expect(result.allowed).toBe(true)
    })

    it('allows requests when no cap is set', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await router.checkSpendCap('test-org')
      expect(result.allowed).toBe(true)
    })
  })

  describe('Arabic Content Routing', () => {
    it('routes Arabic-dominant content to Arabic provider', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'openai',
            default_model: 'gpt-4o',
            arabic_provider: 'google',
            arabic_model: 'gemini-1.5-pro',
          },
        ],
        error: null,
      })

      const provider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'chat',
        },
        'مرحبا بكم في النظام الجديد للدبلوماسية',
      )

      expect(provider.provider).toBe('google')
      expect(provider.model).toBe('gemini-1.5-pro')
    })

    it('uses default provider for English content', async () => {
      const { supabaseAdmin } = await import('../../config/supabase')
      ;(supabaseAdmin.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          {
            default_provider: 'openai',
            default_model: 'gpt-4o',
            arabic_provider: 'google',
            arabic_model: 'gemini-1.5-pro',
          },
        ],
        error: null,
      })

      const provider = await router.selectProvider(
        {
          organizationId: 'test-org',
          userId: 'test-user',
          feature: 'brief_generation',
        },
        'Generate a brief for the upcoming diplomatic meeting',
      )

      expect(provider.provider).toBe('openai')
    })
  })
})
