import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText, Calendar, User, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/Table/DataTable'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

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
  const isRTL = i18n.language === 'ar'

  const { data: briefs, isLoading } = useQuery({
    queryKey: ['briefs', searchTerm, filterStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('briefs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load briefs', error)
        throw error
      }

      const normalized = (data as BriefRow[] | null)?.map((raw) => {
        const title = raw.title_en ?? raw.title ?? 'Untitled brief'
        const summary = raw.summary_en ?? raw.summary ?? ''
        const status: string = raw.status ?? (raw.is_published ? 'published' : 'draft')
        const isPublished = raw.is_published ?? status === 'published'
        const createdAt = raw.created_at ?? raw.createdAt ?? new Date().toISOString()
        const publishedDate = raw.published_date ?? raw.published_at ?? (isPublished ? createdAt : null)

        return {
          id: raw.id,
          reference_number: raw.reference_number
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
          author: {
            full_name: raw.author?.full_name ?? raw.author_name ?? raw.created_by ?? '—'
          },
          related_country: null,
          related_organization: null,
          related_event: null
        } satisfies Brief
      }) ?? []

      return normalized.filter((brief) => {
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
              brief.summary_ar
            ]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
          : true

        return matchesStatus && matchesSearch
      })
    }
  })

  const columns = [
    {
      key: 'reference',
      header: t('briefs.referenceNumber'),
      cell: (brief: Brief) => (
        <div className="font-mono text-sm">{brief.reference_number}</div>
      )
    },
    {
      key: 'title',
      header: t('briefs.title'),
      cell: (brief: Brief) => (
        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="font-medium">
            {isRTL ? brief.title_ar : brief.title_en}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {isRTL ? brief.summary_ar : brief.summary_en}
          </div>
        </div>
      )
    },
    {
      key: 'related',
      header: t('briefs.relatedTo'),
      cell: (brief: Brief) => (
        <div className="text-sm">
          {brief.related_country && (
            <div>{isRTL ? brief.related_country.name_ar : brief.related_country.name_en}</div>
          )}
          {brief.related_organization && (
            <div>{isRTL ? brief.related_organization.name_ar : brief.related_organization.name_en}</div>
          )}
          {brief.related_event && (
            <div>{isRTL ? brief.related_event.title_ar : brief.related_event.title_en}</div>
          )}
          {!brief.related_country && !brief.related_organization && !brief.related_event && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      )
    },
    {
      key: 'author',
      header: t('briefs.author'),
      cell: (brief: Brief) => (
        <div className="flex items-center gap-1 text-sm">
          <User className="h-3 w-3" />
          {brief.author.full_name}
        </div>
      )
    },
    {
      key: 'status',
      header: t('briefs.status'),
      cell: (brief: Brief) => (
        <div className="flex items-center gap-2">
          {brief.is_published ? (
            <>
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">{t('briefs.published')}</span>
              {brief.published_date && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(brief.published_date), 'dd MMM')}
                </span>
              )}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{t('briefs.draft')}</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: () => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.briefs')}</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
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
              {briefs?.filter(b => b.is_published).length || 0}
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
              {briefs?.filter(b => !b.is_published).length || 0}
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
              {briefs?.filter(b => {
                const briefDate = new Date(b.published_date || b.created_at)
                const now = new Date()
                return briefDate.getMonth() === now.getMonth() && 
                       briefDate.getFullYear() === now.getFullYear()
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

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">{t('common.loading')}</div>
          ) : briefs && briefs.length > 0 ? (
            <DataTable
              data={briefs}
              columns={columns}
              onRowClick={(brief) => console.log('Brief clicked:', brief)}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
