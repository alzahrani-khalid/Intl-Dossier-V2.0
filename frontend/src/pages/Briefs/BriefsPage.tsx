import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/signature-visuals'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { BriefGenerationPanel } from '@/components/ai/BriefGenerationPanel'
import { BriefViewer } from '@/components/ai/BriefViewer'
import type { BriefContent } from '@/hooks/useGenerateBrief'
import { useToast } from '@/hooks/useToast'
import { useDirection } from '@/hooks/useDirection'

interface MergedBrief {
  id: string
  reference_number: string
  title_en: string
  title_ar: string
  summary_en: string
  summary_ar: string
  category: string
  tags: string[]
  is_published: boolean
  published_date: string | null
  created_at: string
  author: { full_name: string }
  full_content_en?: string | null
  isAiBrief: boolean
}

type BriefRow = {
  id: string
  reference_number?: string | null
  title?: string | null
  title_en?: string | null
  title_ar?: string | null
  summary?: string | null
  summary_en?: string | null
  summary_ar?: string | null
  status?: string | null
  is_published?: boolean | null
  created_at?: string | null
  createdAt?: string | null
  published_date?: string | null
  published_at?: string | null
  category?: string | null
  tags?: string[] | null
  full_content_en?: string | null
  author?: { full_name?: string | null } | null
  author_name?: string | null
  created_by?: string | null
}

type AiBriefRow = {
  id: string
  title: string | null
  executive_summary: string | null
  status: string
  created_at: string
  completed_at: string | null
  created_by: string | null
}

const APPROX_CHARS_PER_PAGE = 2200

function formatDayFirst(date: string | null | undefined): string {
  if (date == null || date === '') return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

function pageCountFor(b: MergedBrief): string {
  const content = b.full_content_en ?? b.summary_en ?? ''
  if (content.length === 0) return '—'
  return String(Math.max(1, Math.ceil(content.length / APPROX_CHARS_PER_PAGE)))
}

function statusKeyFor(b: MergedBrief): 'ready' | 'draft' {
  return b.is_published === true ? 'ready' : 'draft'
}

function chipModifierFor(b: MergedBrief): string {
  return b.is_published === true ? 'chip-ok' : ''
}

export function BriefsPage(): React.JSX.Element {
  const { t, i18n } = useTranslation('briefs-page')
  const locale = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
  const { isRTL } = useDirection()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedDossier, setSelectedDossier] = useState<string>('')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [briefViewerOpen, setBriefViewerOpen] = useState(false)
  const [generatedBrief, setGeneratedBrief] = useState<BriefContent | null>(null)

  // Dossier picker for the generation modal (preserved from prior implementation).
  const { data: dossiers } = useQuery({
    queryKey: ['dossiers-for-brief'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, name_en, name_ar')
        .eq('is_active', true)
        .order('name_en')
        .limit(100)
      if (error != null) throw error
      return data ?? []
    },
  })

  // Dual-table fetch + merge (preserved verbatim per RESEARCH §Pitfall 5).
  const {
    data: briefs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['briefs'],
    queryFn: async (): Promise<MergedBrief[]> => {
      const [briefsResult, aiBriefsResult] = await Promise.all([
        supabase.from('briefs').select('*').order('created_at', { ascending: false }),
        supabase
          .from('ai_briefs')
          .select('*')
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
      ])

      if (briefsResult.error != null) {
        console.error('Failed to load briefs', briefsResult.error)
      }
      if (aiBriefsResult.error != null) {
        console.error('Failed to load AI briefs', aiBriefsResult.error)
      }

      const normalizedBriefs: MergedBrief[] =
        (briefsResult.data as BriefRow[] | null)?.map((raw) => {
          const title = raw.title_en ?? raw.title ?? 'Untitled brief'
          const summary = raw.summary_en ?? raw.summary ?? ''
          const status: string = raw.status ?? (raw.is_published === true ? 'published' : 'draft')
          const isPublished = raw.is_published ?? status === 'published'
          const createdAt = raw.created_at ?? raw.createdAt ?? new Date().toISOString()
          const publishedDate =
            raw.published_date ?? raw.published_at ?? (isPublished === true ? createdAt : null)
          return {
            id: raw.id,
            reference_number:
              raw.reference_number != null && raw.reference_number !== ''
                ? String(raw.reference_number)
                : `BRF-${String(raw.id ?? '').replace(/-/g, '').slice(0, 8).toUpperCase()}`,
            title_en: title,
            title_ar: raw.title_ar ?? title,
            summary_en: summary,
            summary_ar: raw.summary_ar ?? summary,
            category: raw.category ?? 'other',
            tags: Array.isArray(raw.tags) ? raw.tags : [],
            is_published: Boolean(isPublished),
            published_date: publishedDate,
            created_at: createdAt,
            full_content_en: raw.full_content_en ?? null,
            author: {
              full_name: raw.author?.full_name ?? raw.author_name ?? raw.created_by ?? '—',
            },
            isAiBrief: false,
          }
        }) ?? []

      const normalizedAiBriefs: MergedBrief[] =
        (aiBriefsResult.data as AiBriefRow[] | null)?.map((raw) => ({
          id: raw.id,
          reference_number: `AI-${String(raw.id).replace(/-/g, '').slice(0, 8).toUpperCase()}`,
          title_en: raw.title ?? 'AI Generated Brief',
          title_ar: raw.title ?? 'AI Generated Brief',
          summary_en: raw.executive_summary?.slice(0, 200) ?? '',
          summary_ar: raw.executive_summary?.slice(0, 200) ?? '',
          category: 'ai-generated',
          tags: ['AI'] as string[],
          is_published: raw.status === 'completed',
          published_date: raw.completed_at,
          created_at: raw.created_at,
          full_content_en: raw.executive_summary,
          author: { full_name: 'AI Assistant' },
          isAiBrief: true,
        })) ?? []

      return [...normalizedBriefs, ...normalizedAiBriefs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    },
  })

  const briefList: MergedBrief[] = briefs ?? []
  const isEmpty = !isLoading && briefList.length === 0

  // For AI briefs we fetch the full BriefContent on click; for non-AI rows we build a
  // minimal BriefContent so the existing BriefViewer keeps rendering without further
  // back-end work.
  async function openCard(brief: MergedBrief): Promise<void> {
    if (brief.isAiBrief) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.access_token == null) return
        const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
        const response = await fetch(`${API_BASE}/ai/briefs/${brief.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setGeneratedBrief(data.data as BriefContent)
          setBriefViewerOpen(true)
        }
      } catch (err) {
        console.error('Failed to fetch brief:', err)
      }
      return
    }
    // Build a minimal BriefContent for non-AI briefs so BriefViewer renders.
    const title = locale === 'ar' ? (brief.title_ar ?? brief.title_en) : brief.title_en
    const summary = locale === 'ar' ? brief.summary_ar : brief.summary_en
    setGeneratedBrief({
      id: brief.id,
      title,
      executiveSummary: summary,
      background: '',
      keyParticipants: [],
      relevantPositions: [],
      activeCommitments: [],
      historicalContext: '',
      talkingPoints: [],
      recommendations: '',
      citations: [],
      status: 'completed',
    } as unknown as BriefContent)
    setBriefViewerOpen(true)
  }

  return (
    <section
      role="region"
      aria-label={t('title')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={isLoading ? 'true' : 'false'}
      className="page flex min-w-0 flex-col gap-[var(--gap)]"
    >
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: 44, minWidth: 44 }}
            onClick={() => setShowGenerateDialog(true)}
          >
            <Icon name="plus" size={14} aria-hidden />
            <span className="ms-2">{t('cta.newBrief')}</span>
          </button>
        }
      />

      {error != null && (
        <div className="card" role="alert">
          <Icon name="alert" size={16} style={{ color: 'var(--danger)' }} />
          <span className="ms-2">{t('error.list')}</span>
        </div>
      )}

      {isLoading && (
        <ul
          className="briefs-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--gap)',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
          data-testid="briefs-loading"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="card"
              style={{ minHeight: 120 }}
              data-testid="brief-skeleton"
            >
              <div
                className="rounded"
                style={{ height: 12, width: '25%', background: 'var(--line-soft)' }}
              />
              <div
                className="rounded"
                style={{
                  height: 16,
                  width: '75%',
                  marginBlockStart: 12,
                  background: 'var(--line-soft)',
                }}
              />
              <div
                className="rounded"
                style={{
                  height: 12,
                  width: '50%',
                  marginBlockStart: 12,
                  background: 'var(--line-soft)',
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {isEmpty && (
        <div
          className="text-center"
          style={{ paddingBlock: 48, color: 'var(--ink-mute)' }}
        >
          <h2
            className="text-start"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              textAlign: 'center',
            }}
          >
            {t('empty.heading')}
          </h2>
        </div>
      )}

      {!isLoading && briefList.length > 0 && (
        <ul
          className="briefs-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--gap)',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
          data-testid="briefs-card-grid"
        >
          {briefList.map((b) => {
            const title = locale === 'ar' ? (b.title_ar || b.title_en) : (b.title_en || b.title_ar)
            const dateStr = formatDayFirst(b.published_date ?? b.created_at)
            return (
              <li
                key={b.id}
                className="card"
                data-testid="brief-card"
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer', minHeight: 44 }}
                onClick={() => {
                  void openCard(b)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    void openCard(b)
                  }
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ marginBlockEnd: 8 }}
                >
                  <span className={cn('chip', chipModifierFor(b))}>
                    {t(`status.${statusKeyFor(b)}`)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-faint)',
                    }}
                    dir="ltr"
                  >
                    {toArDigits(`${pageCountFor(b)} pp`, locale)}
                  </span>
                </div>
                <h3
                  className="text-start"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                    marginBlockEnd: 10,
                  }}
                >
                  {title}
                </h3>
                <div
                  className="flex items-center justify-between"
                  style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}
                >
                  <span>{b.author?.full_name ?? '—'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }} dir="ltr">
                    {toArDigits(dateStr, locale)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Brief Viewer dialog (D-05 — Radix Dialog token-bound; HeroUI v3 Modal API
          is unstable and not used elsewhere in this codebase) */}
      <Dialog open={briefViewerOpen} onOpenChange={setBriefViewerOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('subtitle')}</DialogDescription>
          </DialogHeader>
          {generatedBrief && (
            <BriefViewer
              brief={generatedBrief}
              onCitationClick={(type, id) => {
                console.warn('Citation clicked:', type, id)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Brief Generation dialog (CTA target). Dossier selector is preserved
          because BriefGenerationPanel needs a dossierId to fire. */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('cta.newBrief')}</DialogTitle>
            <DialogDescription>{t('subtitle')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Select value={selectedDossier} onValueChange={setSelectedDossier}>
              <SelectTrigger>
                <SelectValue placeholder={t('cta.newBrief')} />
              </SelectTrigger>
              <SelectContent>
                {dossiers?.map((dossier) => (
                  <SelectItem key={dossier.id} value={dossier.id}>
                    {locale === 'ar' ? dossier.name_ar : dossier.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDossier !== '' && (
            <BriefGenerationPanel
              dossierId={selectedDossier}
              onBriefGenerated={async (briefId) => {
                try {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession()
                  if (session?.access_token == null) return
                  const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
                  const response = await fetch(`${API_BASE}/ai/briefs/${briefId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  })
                  if (response.ok) {
                    const data = await response.json()
                    setGeneratedBrief(data.data as BriefContent)
                    setShowGenerateDialog(false)
                    setBriefViewerOpen(true)
                    queryClient.invalidateQueries({ queryKey: ['briefs'] })
                    toast({
                      title: t('cta.newBrief'),
                    })
                  }
                } catch (err) {
                  console.error('Failed to fetch brief:', err)
                }
              }}
              onClose={() => {
                setShowGenerateDialog(false)
                setSelectedDossier('')
              }}
              className="border-0 shadow-none p-0"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
