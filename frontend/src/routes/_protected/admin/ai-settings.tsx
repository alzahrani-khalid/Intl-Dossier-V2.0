/**
 * Route: /admin/ai-settings
 * AI Settings & LLM Policy Configuration
 * Feature: 033-ai-brief-generation
 * Tasks: T053, T054
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// cn utility available if needed for conditional classes
import { supabase } from '@/lib/supabase'
import {
  Settings,
  Brain,
  DollarSign,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  FileText,
  MessageSquare,
  Link2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/_protected/admin/ai-settings')({
  component: AISettingsPage,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
  },
})

interface LLMPolicy {
  id: string
  organization_id: string
  default_provider: string
  default_model: string
  fallback_provider: string | null
  fallback_model: string | null
  max_tokens_per_request: number
  max_requests_per_minute: number
  max_requests_per_day: number
  monthly_spend_cap: number | null
  features_enabled: {
    brief_generation: boolean
    chat: boolean
    entity_linking: boolean
  }
  created_at: string
  updated_at: string
}

interface AIModelPricing {
  model_id: string
  provider: string
  model_name: string
  input_cost_per_1k: number
  output_cost_per_1k: number
  context_window: number
  is_active: boolean
}

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google' },
]

const MODELS: Record<string, Array<{ value: string; label: string }>> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  google: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
}

function AISettingsPage() {
  const { t, i18n } = useTranslation('ai-admin')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [formState, setFormState] = useState<Partial<LLMPolicy> | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch current organization's LLM policy
  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ['llm-policy'],
    queryFn: async (): Promise<LLMPolicy | null> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const orgId = session?.user?.user_metadata?.organization_id

      if (!orgId) return null

      const { data, error } = await supabase
        .from('organization_llm_policies')
        .select('*')
        .eq('organization_id', orgId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    staleTime: 60 * 1000,
  })

  // Fetch model pricing for reference
  const { data: modelPricing } = useQuery({
    queryKey: ['ai-model-pricing'],
    queryFn: async (): Promise<AIModelPricing[]> => {
      const { data, error } = await supabase
        .from('ai_model_pricing')
        .select('*')
        .eq('is_active', true)
        .order('provider')

      if (error) throw error
      return data || []
    },
  })

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (updates: Partial<LLMPolicy>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const orgId = session?.user?.user_metadata?.organization_id

      if (!orgId) throw new Error('No organization')

      const { data, error } = await supabase
        .from('organization_llm_policies')
        .upsert({
          organization_id: orgId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-policy'] })
      setHasChanges(false)
      toast({
        title: t('settings.saved', 'Settings saved'),
        description: t('settings.savedDesc', 'AI settings have been updated successfully.'),
      })
    },
    onError: (error) => {
      toast({
        title: t('settings.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Initialize form state from policy
  const currentState = formState ||
    policy || {
      default_provider: 'anthropic',
      default_model: 'claude-sonnet-4-20250514',
      fallback_provider: null,
      fallback_model: null,
      max_tokens_per_request: 8192,
      max_requests_per_minute: 10,
      max_requests_per_day: 500,
      monthly_spend_cap: null,
      features_enabled: {
        brief_generation: true,
        chat: true,
        entity_linking: true,
      },
    }

  const updateField = <K extends keyof LLMPolicy>(field: K, value: LLMPolicy[K]) => {
    setFormState((prev) => ({
      ...(prev || policy || {}),
      [field]: value,
    }))
    setHasChanges(true)
  }

  const updateFeature = (feature: keyof LLMPolicy['features_enabled'], enabled: boolean) => {
    const defaultFeatures: LLMPolicy['features_enabled'] = {
      brief_generation: true,
      chat: true,
      entity_linking: true,
    }
    const features: LLMPolicy['features_enabled'] = {
      ...defaultFeatures,
      ...currentState.features_enabled,
      [feature]: enabled,
    }
    updateField('features_enabled', features)
  }

  const handleSave = () => {
    if (formState) {
      updatePolicyMutation.mutate(formState)
    }
  }

  const handleReset = () => {
    setFormState(null)
    setHasChanges(false)
  }

  const getModelPricingInfo = (modelId: string) => {
    return modelPricing?.find((m) => m.model_id === modelId)
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            {t('settings.title', 'AI Settings')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.description', 'Configure AI features, models, and spending limits')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 me-2" />
                {t('settings.reset', 'Reset')}
              </Button>
              <Button onClick={handleSave} disabled={updatePolicyMutation.isPending}>
                <Save className="h-4 w-4 me-2" />
                {t('settings.save', 'Save Changes')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('settings.unsaved', 'Unsaved Changes')}</AlertTitle>
          <AlertDescription>
            {t(
              'settings.unsavedDesc',
              'You have unsaved changes. Click "Save Changes" to apply them.',
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('settings.features', 'AI Features')}
            </CardTitle>
            <CardDescription>
              {t('settings.featuresDesc', 'Enable or disable AI features for your organization')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {policyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {t('settings.briefGeneration', 'Brief Generation')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.briefGenerationDesc', 'AI-generated briefing documents')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={currentState.features_enabled?.brief_generation ?? true}
                    onCheckedChange={(checked) => updateFeature('brief_generation', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('settings.chat', 'AI Chat')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.chatDesc', 'Natural language Q&A interface')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={currentState.features_enabled?.chat ?? true}
                    onCheckedChange={(checked) => updateFeature('chat', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('settings.entityLinking', 'Entity Linking')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.entityLinkingDesc', 'AI-suggested entity links for intake')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={currentState.features_enabled?.entity_linking ?? true}
                    onCheckedChange={(checked) => updateFeature('entity_linking', checked)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('settings.modelConfig', 'Model Configuration')}
            </CardTitle>
            <CardDescription>
              {t('settings.modelConfigDesc', 'Select default and fallback AI models')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {policyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t('settings.defaultProvider', 'Default Provider')}</Label>
                  <Select
                    value={currentState.default_provider}
                    onValueChange={(v) => {
                      updateField('default_provider', v)
                      updateField('default_model', MODELS[v]?.[0]?.value || '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.defaultModel', 'Default Model')}</Label>
                  <Select
                    value={currentState.default_model}
                    onValueChange={(v) => updateField('default_model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS[currentState.default_provider || 'anthropic']?.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentState.default_model && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {getModelPricingInfo(currentState.default_model) && (
                        <>
                          Input: $
                          {getModelPricingInfo(currentState.default_model)?.input_cost_per_1k}/1K
                          tokens, Output: $
                          {getModelPricingInfo(currentState.default_model)?.output_cost_per_1k}/1K
                          tokens
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t('settings.fallbackProvider', 'Fallback Provider (Optional)')}</Label>
                  <Select
                    value={currentState.fallback_provider || '__none__'}
                    onValueChange={(v) => {
                      const provider = v === '__none__' ? null : v
                      updateField('fallback_provider', provider)
                      updateField(
                        'fallback_model',
                        provider ? MODELS[provider]?.[0]?.value || null : null,
                      )
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.none', 'None')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('settings.none', 'None')}</SelectItem>
                      {PROVIDERS.filter((p) => p.value !== currentState.default_provider).map(
                        (p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {currentState.fallback_provider && (
                  <div className="space-y-2">
                    <Label>{t('settings.fallbackModel', 'Fallback Model')}</Label>
                    <Select
                      value={currentState.fallback_model || ''}
                      onValueChange={(v) => updateField('fallback_model', v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS[currentState.fallback_provider]?.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.rateLimits', 'Rate Limits')}
            </CardTitle>
            <CardDescription>
              {t('settings.rateLimitsDesc', 'Control API usage limits')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {policyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t('settings.maxTokens', 'Max Tokens per Request')}</Label>
                  <Input
                    type="number"
                    value={currentState.max_tokens_per_request}
                    onChange={(e) =>
                      updateField('max_tokens_per_request', parseInt(e.target.value) || 0)
                    }
                    min={1000}
                    max={128000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.maxTokensDesc', 'Maximum tokens allowed in a single AI request')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.maxPerMinute', 'Max Requests per Minute')}</Label>
                  <Input
                    type="number"
                    value={currentState.max_requests_per_minute}
                    onChange={(e) =>
                      updateField('max_requests_per_minute', parseInt(e.target.value) || 0)
                    }
                    min={1}
                    max={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.maxPerDay', 'Max Requests per Day')}</Label>
                  <Input
                    type="number"
                    value={currentState.max_requests_per_day}
                    onChange={(e) =>
                      updateField('max_requests_per_day', parseInt(e.target.value) || 0)
                    }
                    min={1}
                    max={10000}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Spending Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('settings.spendingLimits', 'Spending Limits')}
            </CardTitle>
            <CardDescription>
              {t('settings.spendingLimitsDesc', 'Set monthly budget caps for AI usage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {policyLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t('settings.monthlyCap', 'Monthly Spend Cap (USD)')}</Label>
                  <Input
                    type="number"
                    value={currentState.monthly_spend_cap || ''}
                    onChange={(e) =>
                      updateField(
                        'monthly_spend_cap',
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    placeholder={t('settings.noLimit', 'No limit')}
                    min={0}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.monthlyCapDesc',
                      'Leave empty for no spending limit. AI features will be disabled when cap is reached.',
                    )}
                  </p>
                </div>

                {currentState.monthly_spend_cap && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {t(
                        'settings.capWarning',
                        'When the monthly cap is reached, all AI features will be temporarily disabled until the next billing cycle.',
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {t('settings.status', 'Configuration Status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge
              variant={currentState.features_enabled?.brief_generation ? 'default' : 'secondary'}
            >
              <FileText className="h-3 w-3 me-1" />
              {t('settings.briefGeneration', 'Brief Generation')}:{' '}
              {currentState.features_enabled?.brief_generation
                ? t('settings.enabled', 'Enabled')
                : t('settings.disabled', 'Disabled')}
            </Badge>
            <Badge variant={currentState.features_enabled?.chat ? 'default' : 'secondary'}>
              <MessageSquare className="h-3 w-3 me-1" />
              {t('settings.chat', 'Chat')}:{' '}
              {currentState.features_enabled?.chat
                ? t('settings.enabled', 'Enabled')
                : t('settings.disabled', 'Disabled')}
            </Badge>
            <Badge
              variant={currentState.features_enabled?.entity_linking ? 'default' : 'secondary'}
            >
              <Link2 className="h-3 w-3 me-1" />
              {t('settings.entityLinking', 'Entity Linking')}:{' '}
              {currentState.features_enabled?.entity_linking
                ? t('settings.enabled', 'Enabled')
                : t('settings.disabled', 'Disabled')}
            </Badge>
            <Badge variant="outline">
              <Brain className="h-3 w-3 me-1" />
              {currentState.default_provider}/
              {currentState.default_model?.split('-').slice(0, 2).join('-')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AISettingsPage
