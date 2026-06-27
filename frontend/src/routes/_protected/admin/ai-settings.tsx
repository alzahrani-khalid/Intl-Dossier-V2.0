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
import { requireAdmin } from '@/lib/auth/require-admin'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Database } from '@/types/database.types'
import {
  Bot,
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
import { useToast } from '@/hooks/useToast'

export const Route = createFileRoute('/_protected/admin/ai-settings')({
  component: AISettingsPage,
  beforeLoad: requireAdmin,
})

/**
 * Local types are derived from the generated database schema so the page's
 * read/upsert payload can never drift from the real `organization_llm_policies`
 * columns again. The previous hand-written shape referenced several fields that
 * do not exist in the table (a fallback provider/model pair, per-request and
 * per-window rate limits, an un-suffixed spend cap, and a nested feature-flag
 * JSON object), so the page could neither read nor persist correctly.
 */
type LLMPolicy = Database['public']['Tables']['organization_llm_policies']['Row']
type AIProvider = Database['public']['Enums']['ai_provider']

interface AIModelPricing {
  model_id: string
  provider: string
  model_name: string
  input_cost_per_1k: number
  output_cost_per_1k: number
  context_window: number
  is_active: boolean
}

const PROVIDERS: Array<{ value: AIProvider; label: string }> = [
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

const NONE = '__none__'

/**
 * Resolve the caller's organization from a SERVER-TRUSTED source (N7 fix).
 *
 * Reads `public.users.default_organization_id` (service-role-written, never
 * client-writable) keyed on the authenticated user id — mirroring the signals
 * domain hooks (useSignalMutations / useDigests / useAlertRules). This replaces
 * the previous `session.user.user_metadata.organization_id`, which is
 * client-writable via `supabase.auth.updateUser()` and therefore spoofable.
 *
 * Tenant isolation is enforced independently at the DB layer by the
 * `organization_llm_policies` RLS policies (organization_members membership),
 * so even a tampered client value can never read or write another org's row.
 * The user's `default_organization_id` is expected to be an org they are an
 * active member of (admin/owner for writes) — the same assumption the signals
 * hooks rely on.
 */
async function resolveTrustedOrgId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('users')
    .select('default_organization_id')
    .eq('id', user.id)
    .single()
  if (error) throw error

  return (profile?.default_organization_id as string | null) ?? null
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
      const orgId = await resolveTrustedOrgId()

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
      const orgId = await resolveTrustedOrgId()

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
    onError: () => {
      toast({
        title: t('settings.error', 'Error'),
        description: t('settings.errorDesc', 'Failed to save AI settings. Please try again.'),
        variant: 'destructive',
      })
    },
  })

  // Initialize form state from policy
  const currentState: Partial<LLMPolicy> = formState ||
    policy || {
      default_provider: 'anthropic',
      default_model: 'claude-sonnet-4-20250514',
      arabic_provider: null,
      arabic_model: null,
      allow_cloud_for_confidential: false,
      private_provider: null,
      private_model: null,
      private_endpoint_url: null,
      monthly_spend_cap_usd: null,
      alert_threshold_percent: 80,
      brief_generation_enabled: true,
      chat_enabled: true,
      entity_linking_enabled: true,
    }

  const updateField = <K extends keyof LLMPolicy>(field: K, value: LLMPolicy[K]) => {
    setFormState((prev) => ({
      ...(prev || policy || {}),
      [field]: value,
    }))
    setHasChanges(true)
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

  const hasSpendCap = (currentState.monthly_spend_cap_usd ?? 0) > 0

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageHeader
        icon={<Bot className="h-6 w-6" />}
        title={t('settings.title', 'AI Settings')}
        subtitle={t('settings.description', 'Configure AI features, models, and spending limits')}
        actions={
          hasChanges ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 me-2" />
                {t('settings.reset', 'Reset')}
              </Button>
              <Button onClick={handleSave} disabled={updatePolicyMutation.isPending}>
                <Save className="h-4 w-4 me-2" />
                {t('settings.save', 'Save Changes')}
              </Button>
            </div>
          ) : undefined
        }
      />

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
                    checked={currentState.brief_generation_enabled ?? true}
                    onCheckedChange={(checked) => updateField('brief_generation_enabled', checked)}
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
                    checked={currentState.chat_enabled ?? true}
                    onCheckedChange={(checked) => updateField('chat_enabled', checked)}
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
                    checked={currentState.entity_linking_enabled ?? true}
                    onCheckedChange={(checked) => updateField('entity_linking_enabled', checked)}
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
              {t('settings.modelConfigDesc', 'Select default and Arabic-routing AI models')}
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
                      updateField('default_provider', v as AIProvider)
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
                  <Label>{t('settings.arabicProvider', 'Arabic Provider (Optional)')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.arabicRoutingDesc',
                      'Route Arabic-language requests to a dedicated provider.',
                    )}
                  </p>
                  <Select
                    value={currentState.arabic_provider || NONE}
                    onValueChange={(v) => {
                      const provider = v === NONE ? null : (v as AIProvider)
                      updateField('arabic_provider', provider)
                      updateField(
                        'arabic_model',
                        provider ? MODELS[provider]?.[0]?.value || null : null,
                      )
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.none', 'None')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('settings.none', 'None')}</SelectItem>
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

                {currentState.arabic_provider != null && (
                  <div className="space-y-2">
                    <Label>{t('settings.arabicModel', 'Arabic Model')}</Label>
                    <Select
                      value={currentState.arabic_model || ''}
                      onValueChange={(v) => updateField('arabic_model', v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS[currentState.arabic_provider]?.map((m) => (
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

        {/* Privacy & Routing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.privacyRouting', 'Privacy & Routing')}
            </CardTitle>
            <CardDescription>
              {t(
                'settings.privacyRoutingDesc',
                'Control how confidential content is routed to AI providers',
              )}
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
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {t('settings.allowCloudConfidential', 'Allow cloud for confidential')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          'settings.allowCloudConfidentialDesc',
                          'Permit confidential content to be sent to cloud providers.',
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={currentState.allow_cloud_for_confidential ?? false}
                    onCheckedChange={(checked) =>
                      updateField('allow_cloud_for_confidential', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t('settings.privateProvider', 'Private Provider (Optional)')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.privateRoutingDesc',
                      'Self-hosted provider for confidential content.',
                    )}
                  </p>
                  <Select
                    value={currentState.private_provider || NONE}
                    onValueChange={(v) => {
                      const provider = v === NONE ? null : (v as AIProvider)
                      updateField('private_provider', provider)
                      updateField(
                        'private_model',
                        provider ? MODELS[provider]?.[0]?.value || null : null,
                      )
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.none', 'None')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('settings.none', 'None')}</SelectItem>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentState.private_provider != null && (
                  <div className="space-y-2">
                    <Label>{t('settings.privateModel', 'Private Model')}</Label>
                    <Select
                      value={currentState.private_model || ''}
                      onValueChange={(v) => updateField('private_model', v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS[currentState.private_provider]?.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('settings.privateEndpoint', 'Private Endpoint URL')}</Label>
                  <Input
                    type="url"
                    value={currentState.private_endpoint_url ?? ''}
                    onChange={(e) =>
                      updateField('private_endpoint_url', e.target.value ? e.target.value : null)
                    }
                    placeholder="https://llm.internal.example.gov"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.privateEndpointDesc',
                      'Base URL of the self-hosted inference endpoint.',
                    )}
                  </p>
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
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t('settings.monthlyCap', 'Monthly Spend Cap (USD)')}</Label>
                  <Input
                    type="number"
                    value={currentState.monthly_spend_cap_usd ?? ''}
                    onChange={(e) =>
                      updateField(
                        'monthly_spend_cap_usd',
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

                <div className="space-y-2">
                  <Label>{t('settings.alertThreshold', 'Alert Threshold (%)')}</Label>
                  <Input
                    type="number"
                    value={currentState.alert_threshold_percent ?? ''}
                    onChange={(e) =>
                      updateField(
                        'alert_threshold_percent',
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    min={1}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.alertThresholdDesc',
                      'Send an alert when spending reaches this percentage of the monthly cap.',
                    )}
                  </p>
                </div>

                {hasSpendCap && (
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
            <CheckCircle2 className="h-5 w-5 text-success" />
            {t('settings.status', 'Configuration Status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant={currentState.brief_generation_enabled ? 'default' : 'secondary'}>
              <FileText className="h-3 w-3 me-1" />
              {t('settings.briefGeneration', 'Brief Generation')}:{' '}
              {currentState.brief_generation_enabled
                ? t('settings.enabled', 'Enabled')
                : t('settings.disabled', 'Disabled')}
            </Badge>
            <Badge variant={currentState.chat_enabled ? 'default' : 'secondary'}>
              <MessageSquare className="h-3 w-3 me-1" />
              {t('settings.chat', 'Chat')}:{' '}
              {currentState.chat_enabled
                ? t('settings.enabled', 'Enabled')
                : t('settings.disabled', 'Disabled')}
            </Badge>
            <Badge variant={currentState.entity_linking_enabled ? 'default' : 'secondary'}>
              <Link2 className="h-3 w-3 me-1" />
              {t('settings.entityLinking', 'Entity Linking')}:{' '}
              {currentState.entity_linking_enabled
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
