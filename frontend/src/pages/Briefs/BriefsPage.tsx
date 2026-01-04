import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Calendar, User, Eye, Download, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/Table/DataTable'
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
import { format } from 'date-fns'
import { BriefGenerationPanel } from '@/components/ai/BriefGenerationPanel'
import { BriefViewer } from '@/components/ai/BriefViewer'
import type { BriefContent } from '@/hooks/useGenerateBrief'
import { useToast } from '@/hooks/use-toast'

interface Brief {
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
  author: {
    full_name: string
  }
  related_country: {
    name_en: string
    name_ar: string
  } | null
  related_organization: {
    name_en: string
    name_ar: string
  } | null
  related_event: null
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
  author?: {
    full_name?: string | null
  } | null
  author_name?: string | null
  created_by?: string | null
}

export function BriefsPage() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedDossier, setSelectedDossier] = useState<string>('')
  const [briefViewerOpen, setBriefViewerOpen] = useState(false)
  const [generatedBrief, setGeneratedBrief] = useState<BriefContent | null>(null)
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch dossiers for selection
  const { data: dossiers } = useQuery({
    queryKey: ['dossiers-for-brief'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, name_en, name_ar')
        .eq('is_active', true)
        .order('name_en')
        .limit(100)
      if (error) throw error
      return data || []
    },
  })

  const { data: briefs, isLoading } = useQuery({
    queryKey: ['briefs', searchTerm, filterStatus],
    queryFn: async () => {
      // Fetch from both briefs and ai_briefs tables
      const [briefsResult, aiBriefsResult] = await Promise.all([
        supabase.from('briefs').select('*').order('created_at', { ascending: false }),
        supabase
          .from('ai_briefs')
          .select('*')
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
      ])

      if (briefsResult.error) {
        console.error('Failed to load briefs', briefsResult.error)
      }
      if (aiBriefsResult.error) {
        console.error('Failed to load AI briefs', aiBriefsResult.error)
      }

      // Normalize regular briefs
      const normalizedBriefs =
        (briefsResult.data as BriefRow[] | null)?.map((raw) => {
          const title = raw.title_en ?? raw.title ?? 'Untitled brief'
          const summary = raw.summary_en ?? raw.summary ?? ''
          const status: string = raw.status ?? (raw.is_published ? 'published' : 'draft')
          const isPublished = raw.is_published ?? status === 'published'
          const createdAt = raw.created_at ?? raw.createdAt ?? new Date().toISOString()
          const publishedDate =
            raw.published_date ?? raw.published_at ?? (isPublished ? createdAt : null)

          return {
            id: raw.id,
            reference_number: raw.reference_number
              ? String(raw.reference_number)
              : `BRF-${String(raw.id ?? '')
                  .replace(/-/g, '')
                  .slice(0, 8)
                  .toUpperCase()}`,
            title_en: title,
            title_ar: raw.title_ar ?? title,
            summary_en: summary,
            summary_ar: raw.summary_ar ?? summary,
            category: raw.category ?? 'other',
            tags: Array.isArray(raw.tags) ? raw.tags : [],
            is_published: Boolean(isPublished),
            published_date: publishedDate,
            created_at: createdAt,
            author: {
              full_name: raw.author?.full_name ?? raw.author_name ?? raw.created_by ?? '—',
            },
            related_country: null,
            related_organization: null,
            related_event: null,
            isAiBrief: false,
          } satisfies Brief & { isAiBrief: boolean }
        }) ?? []

      // Normalize AI briefs
      const normalizedAiBriefs =
        (
          aiBriefsResult.data as Array<{
            id: string
            title: string | null
            executive_summary: string | null
            status: string
            created_at: string
            completed_at: string | null
            created_by: string | null
          }> | null
        )?.map((raw) => ({
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
          author: {
            full_name: 'AI Assistant',
          },
          related_country: null,
          related_organization: null,
          related_event: null,
          isAiBrief: true,
        })) ?? []

      // Combine and sort by created_at
      const allBriefs = [...normalizedBriefs, ...normalizedAiBriefs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      return allBriefs.filter((brief) => {
        const matchesStatus =
          filterStatus === 'all'
            ? true
            : filterStatus === 'published'
              ? brief.is_published
              : !brief.is_published

        const matchesSearch = searchTerm
          ? [
              brief.reference_number,
              brief.title_en,
              brief.title_ar,
              brief.summary_en,
              brief.summary_ar,
            ]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
          : true

        return matchesStatus && matchesSearch
      })
    },
  })

  const columns = [
    {
      id: 'reference',
      accessorKey: 'reference_number',
      header: t('briefs.referenceNumber'),
      size: 110,
      cell: ({ row }: { row: { original: Brief & { isAiBrief?: boolean } } }) => {
        const brief = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs">{brief.reference_number}</span>
            {brief.isAiBrief && (
              <span className="inline-flex items-center gap-0.5 w-fit px-1 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'title',
      accessorKey: 'title_en',
      header: t('briefs.title'),
      size: 400,
      cell: ({ row }: { row: { original: Brief } }) => {
        const brief = row.original
        return (
          <div className={cn('w-full min-w-0 overflow-hidden', isRTL ? 'text-end' : 'text-start')}>
            <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {isRTL ? brief.title_ar : brief.title_en}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {isRTL ? brief.summary_ar : brief.summary_en}
            </div>
          </div>
        )
      },
    },
    {
      id: 'status',
      accessorKey: 'is_published',
      header: t('briefs.status'),
      size: 100,
      cell: ({ row }: { row: { original: Brief } }) => {
        const brief = row.original
        return (
          <div className="flex flex-col gap-0.5">
            {brief.is_published ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <Eye className="h-3 w-3" />
                  {t('briefs.published')}
                </span>
                {brief.published_date && (
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(brief.published_date), 'dd MMM yy')}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                {t('briefs.draft')}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      size: 70,
      cell: ({ row }: { row: { original: Brief & { isAiBrief?: boolean } } }) => {
        const brief = row.original
        return (
          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={async (e) => {
                e.stopPropagation()
                if (brief.isAiBrief) {
                  try {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession()
                    if (!session?.access_token) return
                    const API_BASE = import.meta.env.VITE_API_URL || '/api'
                    const response = await fetch(`${API_BASE}/ai/briefs/${brief.id}`, {
                      headers: { Authorization: `Bearer ${session.access_token}` },
                    })
                    if (response.ok) {
                      const data = await response.json()
                      setGeneratedBrief(data.data)
                      setBriefViewerOpen(true)
                    }
                  } catch (err) {
                    console.error('Failed to fetch brief:', err)
                  }
                }
              }}
              title={t('common.view')}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                const blob = new Blob([JSON.stringify(brief, null, 2)], {
                  type: 'application/json',
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `brief-${brief.reference_number}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              title={t('common.download')}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.briefs')}</h1>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('briefs.generateBrief')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('briefs.totalBriefs')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{briefs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('briefs.published')}</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {briefs?.filter((b) => b.is_published).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('briefs.drafts')}</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {briefs?.filter((b) => !b.is_published).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('briefs.thisMonth')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {briefs?.filter((b) => {
                const briefDate = new Date(b.published_date || b.created_at)
                const now = new Date()
                return (
                  briefDate.getMonth() === now.getMonth() &&
                  briefDate.getFullYear() === now.getFullYear()
                )
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground mt-2">{t('briefs.status')}:</span>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                {t('common.all')}
              </Button>
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('published')}
              >
                {t('briefs.published')}
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('draft')}
              >
                {t('briefs.draft')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">{t('common.loading')}</div>
          ) : briefs && briefs.length > 0 ? (
            <DataTable
              data={briefs}
              columns={columns}
              enableFiltering={false}
              enableColumnVisibility={false}
              pageSize={10}
              onRowClick={(_brief) => {
                /* TODO: Navigate to brief detail */
              }}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">{t('common.noData')}</div>
          )}
        </CardContent>
      </Card>

      {/* Generate Brief Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className={`h-5 w-5 text-primary ${isRTL ? 'rotate-180' : ''}`} />
              {t('briefs.generateBrief')}
            </DialogTitle>
            <DialogDescription>
              {t('briefs.generateDescription', 'Select a dossier to generate an AI-powered brief.')}
            </DialogDescription>
          </DialogHeader>

          {/* Dossier selection */}
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">
              {t('briefs.selectDossier', 'Select Dossier')}
            </label>
            <Select value={selectedDossier} onValueChange={setSelectedDossier}>
              <SelectTrigger>
                <SelectValue placeholder={t('briefs.chooseDossier', 'Choose a dossier...')} />
              </SelectTrigger>
              <SelectContent>
                {dossiers?.map((dossier) => (
                  <SelectItem key={dossier.id} value={dossier.id}>
                    {isRTL ? dossier.name_ar : dossier.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brief Generation Panel - only show when dossier is selected */}
          {selectedDossier && (
            <BriefGenerationPanel
              dossierId={selectedDossier}
              onBriefGenerated={async (briefId) => {
                // Fetch the generated brief
                try {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession()
                  if (!session?.access_token) return

                  const API_BASE = import.meta.env.VITE_API_URL || '/api'
                  const response = await fetch(`${API_BASE}/ai/briefs/${briefId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  })
                  if (response.ok) {
                    const data = await response.json()
                    setGeneratedBrief(data.data)
                    setShowGenerateDialog(false)
                    setBriefViewerOpen(true)
                    // Invalidate briefs query to refresh the list
                    queryClient.invalidateQueries({ queryKey: ['briefs'] })
                    toast({
                      title: t('briefs.generationComplete', 'Brief generated'),
                      description: t(
                        'briefs.generationCompleteDesc',
                        'Your brief is ready to view.',
                      ),
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

      {/* Brief Viewer Dialog */}
      <Dialog open={briefViewerOpen} onOpenChange={setBriefViewerOpen}>
        <DialogContent
          className="sm:max-w-4xl max-h-[90vh] overflow-hidden"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t('briefs.viewBrief', 'View Brief')}</DialogTitle>
            <DialogDescription>
              {t('briefs.viewBriefDescription', 'AI-generated brief content')}
            </DialogDescription>
          </DialogHeader>
          {generatedBrief && (
            <BriefViewer
              brief={generatedBrief}
              onCitationClick={(type, id) => {
                // Handle citation navigation
                console.log('Citation clicked:', type, id)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
