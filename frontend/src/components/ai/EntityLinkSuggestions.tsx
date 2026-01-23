/**
 * EntityLinkSuggestions Component
 * Feature: 033-ai-brief-generation
 * Task: T048
 *
 * Component for displaying and managing AI-suggested entity links:
 * - Shows proposals with confidence scores
 * - Approve/reject workflow
 * - Displays approved links
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Check,
  X,
  Link2,
  FileText,
  User,
  Calendar,
  Target,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '@/store/authStore'

export interface LinkProposal {
  id: string
  entity_type: string
  entity_id: string
  confidence_score: number
  justification: string
  status: string
  created_at: string
}

export interface EntityLink {
  id: string
  entity_type: string
  entity_id: string
  entity_name?: string
  is_ai_suggested: boolean
  created_at: string
}

export interface EntityLinkSuggestionsProps {
  ticketId: string
  onLinkClick?: (entityType: string, entityId: string) => void
  className?: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const ENTITY_ICONS: Record<string, typeof FileText> = {
  dossier: FileText,
  position: Target,
  person: User,
  engagement: Calendar,
  commitment: Check,
}

export function EntityLinkSuggestions({
  ticketId,
  onLinkClick,
  className,
}: EntityLinkSuggestionsProps) {
  const { t, i18n } = useTranslation('entity-linking')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch proposals
  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['entity-proposals', ticketId],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(
        `${API_BASE}/ai/intake/${ticketId}/proposals?status=pending_approval`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      )
      if (!response.ok) throw new Error('Failed to fetch proposals')
      const result = await response.json()
      return result.data as LinkProposal[]
    },
  })

  // Fetch approved links
  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: ['entity-links', ticketId],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/ai/intake/${ticketId}/links`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch links')
      const result = await response.json()
      return result.data as EntityLink[]
    },
  })

  // Generate proposals mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/ai/intake/${ticketId}/propose-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ language: i18n.language }),
      })
      if (!response.ok) throw new Error('Failed to generate proposals')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-proposals', ticketId] })
    },
  })

  // Approve proposal mutation
  const approveMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/ai/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!response.ok) throw new Error('Failed to approve proposal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-proposals', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['entity-links', ticketId] })
    },
  })

  // Reject proposal mutation
  const rejectMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/ai/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error('Failed to reject proposal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-proposals', ticketId] })
    },
  })

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/ai/intake/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!response.ok) throw new Error('Failed to delete link')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-links', ticketId] })
    },
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateMutation.mutateAsync()
    } finally {
      setIsGenerating(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return t('confidence.high', 'High')
    if (score >= 70) return t('confidence.medium', 'Medium')
    return t('confidence.low', 'Low')
  }

  const isLoading = proposalsLoading || linksLoading
  const pendingProposals = proposals?.filter((p) => p.status === 'pending_approval') || []
  const hasProposals = pendingProposals.length > 0
  const hasLinks = (links?.length || 0) > 0

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            <CardTitle className="text-lg">{t('title', 'Entity Links')}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || generateMutation.isPending}
          >
            {isGenerating || generateMutation.isPending ? (
              <Loader2 className="me-1 size-4 animate-spin" />
            ) : (
              <Sparkles className={cn('h-4 w-4 me-1', isRTL && 'rotate-180')} />
            )}
            {t('suggestLinks', 'Suggest Links')}
          </Button>
        </div>
        <CardDescription>
          {t('description', 'AI-suggested and manually linked entities')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Pending Proposals */}
            {hasProposals && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="size-4" />
                  {t('pendingProposals', 'AI Suggestions')} ({pendingProposals.length})
                </h4>
                {pendingProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isRTL={isRTL}
                    onApprove={() => approveMutation.mutate(proposal.id)}
                    onReject={() => rejectMutation.mutate(proposal.id)}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                    getConfidenceColor={getConfidenceColor}
                    getConfidenceLabel={getConfidenceLabel}
                    t={t}
                  />
                ))}
              </div>
            )}

            {/* Approved Links */}
            {hasLinks && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Check className="size-4" />
                  {t('linkedEntities', 'Linked Entities')} ({links?.length})
                </h4>
                {links?.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onDelete={() => deleteLinkMutation.mutate(link.id)}
                    onClick={() => onLinkClick?.(link.entity_type, link.entity_id)}
                    isDeleting={deleteLinkMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!hasProposals && !hasLinks && (
              <div className="py-8 text-center text-muted-foreground">
                <Link2 className="mx-auto mb-3 size-12 opacity-50" />
                <p className="text-sm">{t('noLinks', 'No linked entities yet')}</p>
                <p className="mt-1 text-xs">
                  {t('noLinksHint', 'Click "Suggest Links" to get AI recommendations')}
                </p>
              </div>
            )}

            {/* Generation Error */}
            {generateMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{t('errors.generateFailed', 'Failed to generate suggestions')}</span>
                  <Button variant="ghost" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="me-1 size-4" />
                    {t('retry', 'Retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

type TFunc = ReturnType<typeof useTranslation>['t']

interface ProposalCardProps {
  proposal: LinkProposal
  isRTL: boolean
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
  getConfidenceColor: (score: number) => string
  getConfidenceLabel: (score: number) => string
  t: TFunc
}

function ProposalCard({
  proposal,
  isRTL,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  getConfidenceColor,
  getConfidenceLabel,
  t,
}: ProposalCardProps) {
  const Icon = ENTITY_ICONS[proposal.entity_type] || FileText

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 items-start gap-2">
          <div className="rounded bg-primary/10 p-1.5">
            <Icon className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {proposal.entity_type}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Progress
                        value={proposal.confidence_score}
                        className={cn('h-2 w-16', getConfidenceColor(proposal.confidence_score))}
                      />
                      <span className="text-xs text-muted-foreground">
                        {proposal.confidence_score}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getConfidenceLabel(proposal.confidence_score)}{' '}
                    {t('confidence.label', 'confidence')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {proposal.justification}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-green-600 hover:bg-green-100 hover:text-green-700"
            onClick={onApprove}
            disabled={isApproving || isRejecting}
          >
            {isApproving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-600 hover:bg-red-100 hover:text-red-700"
            onClick={onReject}
            disabled={isApproving || isRejecting}
          >
            {isRejecting ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface LinkCardProps {
  link: EntityLink
  onDelete: () => void
  onClick?: () => void
  isDeleting: boolean
}

function LinkCard({ link, onDelete, onClick, isDeleting }: LinkCardProps) {
  const Icon = ENTITY_ICONS[link.entity_type] || FileText

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      <div className="flex flex-1 cursor-pointer items-center gap-2" onClick={onClick}>
        <div className="rounded bg-primary/10 p-1.5">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {link.entity_name || link.entity_id.substring(0, 8)}
            </span>
            <Badge variant="outline" className="text-xs capitalize">
              {link.entity_type}
            </Badge>
            {link.is_ai_suggested && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="me-1 size-3" />
                AI
              </Badge>
            )}
          </div>
        </div>
        {onClick && <ExternalLink className="size-4 text-muted-foreground" />}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>
    </div>
  )
}

export default EntityLinkSuggestions
