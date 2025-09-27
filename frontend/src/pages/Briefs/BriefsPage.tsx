import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText, Tag, Calendar, User, Eye, Download } from 'lucide-react'
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
  related_event: {
    title_en: string
    title_ar: string
  } | null
}

export function BriefsPage() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const isRTL = i18n.language === 'ar'

  const { data: briefs, isLoading } = useQuery({
    queryKey: ['briefs', searchTerm, filterCategory, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('briefs')
        .select(`
          *,
          author:users!author_id(full_name),
          related_country:countries(name_en, name_ar),
          related_organization:organizations(name_en, name_ar),
          related_event:events(title_en, title_ar)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(
          `reference_number.ilike.%${searchTerm}%,title_en.ilike.%${searchTerm}%,title_ar.ilike.%${searchTerm}%`
        )
      }

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory)
      }

      if (filterStatus === 'published') {
        query = query.eq('is_published', true)
      } else if (filterStatus === 'draft') {
        query = query.eq('is_published', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Brief[]
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
      key: 'category',
      header: t('briefs.category'),
      cell: (brief: Brief) => (
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${brief.category === 'policy' ? 'bg-blue-100 text-blue-800' : ''}
          ${brief.category === 'analysis' ? 'bg-purple-100 text-purple-800' : ''}
          ${brief.category === 'news' ? 'bg-green-100 text-green-800' : ''}
          ${brief.category === 'report' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${brief.category === 'other' ? 'bg-gray-100 text-gray-800' : ''}
        `}>
          {t(`briefs.categories.${brief.category}`)}
        </span>
      )
    },
    {
      key: 'tags',
      header: t('briefs.tags'),
      cell: (brief: Brief) => (
        <div className="flex flex-wrap gap-1">
          {brief.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
          {brief.tags?.length > 3 && (
            <span className="text-xs text-muted-foreground">+{brief.tags.length - 3}</span>
          )}
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
      cell: (brief: Brief) => (
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

  const categories = ['all', 'policy', 'analysis', 'news', 'report', 'other']

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
            <div className="flex gap-4">
              <div className="flex gap-2">
                <span className="text-sm text-muted-foreground mt-2">{t('briefs.category')}:</span>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat === 'all' ? t('common.all') : t(`briefs.categories.${cat}`)}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 ml-4">
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