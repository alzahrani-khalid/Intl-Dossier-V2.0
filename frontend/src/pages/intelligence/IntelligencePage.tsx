import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Brain, TrendingUp, AlertTriangle, Target, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/Table/DataTable'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface IntelligenceReport {
  id: string
  report_number: string
  title_en: string
  title_ar: string
  executive_summary_en: string
  executive_summary_ar: string
  confidence_level: 'low' | 'medium' | 'high' | 'verified'
  classification: 'public' | 'internal' | 'confidential' | 'restricted'
  analysis_type: string[]
  key_findings: any[]
  recommendations: any[]
  status: string
  author: {
    full_name: string
  }
  reviewed_by: {
    full_name: string
  } | null
  approved_by: {
    full_name: string
  } | null
  created_at: string
  published_at: string | null
}

export function IntelligencePage() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterConfidence, setFilterConfidence] = useState<string>('all')
  const [filterClassification, setFilterClassification] = useState<string>('all')
  const [similaritySearch, setSimilaritySearch] = useState('')
  const isRTL = i18n.language === 'ar'

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['intelligence', searchTerm, filterConfidence, filterClassification],
    queryFn: async () => {
      let query = supabase
        .from('intelligence_reports')
        .select(`
          *,
          author:users!author_id(full_name),
          reviewed_by:users!reviewed_by(full_name),
          approved_by:users!approved_by(full_name)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(
          `report_number.ilike.%${searchTerm}%,title_en.ilike.%${searchTerm}%,title_ar.ilike.%${searchTerm}%`
        )
      }

      if (filterConfidence !== 'all') {
        query = query.eq('confidence_level', filterConfidence)
      }

      if (filterClassification !== 'all') {
        query = query.eq('classification', filterClassification)
      }

      const { data, error } = await query

      if (error) throw error
      return data as IntelligenceReport[]
    }
  })

  const similaritySearchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data, error } = await supabase.rpc('search_intelligence_by_similarity', {
        query_text: searchQuery,
        match_threshold: 0.7,
        match_count: 10
      })

      if (error) throw error
      return data
    }
  })

  const ConfidenceIndicator = ({ level }: { level: string }) => {
    const configs = {
      low: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '25%' },
      medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '50%' },
      high: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '75%' },
      verified: { color: 'text-green-600', bgColor: 'bg-green-100', icon: '100%' }
    }
    const config = configs[level as keyof typeof configs]

    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
        <Shield className="h-3 w-3 mr-1" />
        {t(`intelligence.confidence.${level}`)} ({config.icon})
      </div>
    )
  }

  const ClassificationBadge = ({ classification }: { classification: string }) => {
    const configs = {
      public: { color: 'text-green-800', bgColor: 'bg-green-100' },
      internal: { color: 'text-blue-800', bgColor: 'bg-blue-100' },
      confidential: { color: 'text-orange-800', bgColor: 'bg-orange-100' },
      restricted: { color: 'text-red-800', bgColor: 'bg-red-100' }
    }
    const config = configs[classification as keyof typeof configs]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
        {t(`intelligence.classification.${classification}`)}
      </span>
    )
  }

  const AnalysisTypeBadges = ({ types }: { types: string[] }) => {
    const typeIcons = {
      trends: <TrendingUp className="h-3 w-3" />,
      patterns: <Brain className="h-3 w-3" />,
      predictions: <Target className="h-3 w-3" />,
      risks: <AlertTriangle className="h-3 w-3" />,
      opportunities: <Target className="h-3 w-3" />
    }

    return (
      <div className="flex flex-wrap gap-1">
        {types?.map((type, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
            {typeIcons[type as keyof typeof typeIcons]}
            {t(`intelligence.analysisTypes.${type}`)}
          </span>
        ))}
      </div>
    )
  }

  const columns = [
    {
      key: 'report',
      header: t('intelligence.report'),
      cell: (report: IntelligenceReport) => (
        <div>
          <div className="font-mono text-xs text-muted-foreground mb-1">
            {report.report_number}
          </div>
          <div className="font-medium">
            {isRTL ? report.title_ar : report.title_en}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {isRTL ? report.executive_summary_ar : report.executive_summary_en}
          </div>
        </div>
      )
    },
    {
      key: 'analysis',
      header: t('intelligence.analysisType'),
      cell: (report: IntelligenceReport) => (
        <AnalysisTypeBadges types={report.analysis_type} />
      )
    },
    {
      key: 'confidence',
      header: t('intelligence.confidence'),
      cell: (report: IntelligenceReport) => (
        <ConfidenceIndicator level={report.confidence_level} />
      )
    },
    {
      key: 'classification',
      header: t('intelligence.classification'),
      cell: (report: IntelligenceReport) => (
        <ClassificationBadge classification={report.classification} />
      )
    },
    {
      key: 'findings',
      header: t('intelligence.keyFindings'),
      cell: (report: IntelligenceReport) => (
        <div className="text-sm">
          <span className="font-medium">{report.key_findings?.length || 0}</span>
          <span className="text-muted-foreground"> findings</span>
        </div>
      )
    },
    {
      key: 'status',
      header: t('intelligence.status'),
      cell: (report: IntelligenceReport) => (
        <div className="space-y-1">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${report.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
            ${report.status === 'review' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${report.status === 'approved' ? 'bg-blue-100 text-blue-800' : ''}
            ${report.status === 'published' ? 'bg-green-100 text-green-800' : ''}
          `}>
            {t(`intelligence.statuses.${report.status}`)}
          </span>
          {report.published_at && (
            <div className="text-xs text-muted-foreground">
              {format(new Date(report.published_at), 'dd MMM yyyy')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'people',
      header: t('intelligence.people'),
      cell: (report: IntelligenceReport) => (
        <div className="text-sm space-y-1">
          <div>
            <span className="text-muted-foreground">{t('intelligence.author')}:</span> {report.author.full_name}
          </div>
          {report.reviewed_by && (
            <div>
              <span className="text-muted-foreground">{t('intelligence.reviewer')}:</span> {report.reviewed_by.full_name}
            </div>
          )}
          {report.approved_by && (
            <div>
              <span className="text-muted-foreground">{t('intelligence.approver')}:</span> {report.approved_by.full_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (report: IntelligenceReport) => (
        <Button size="sm" variant="ghost">
          <Download className="h-4 w-4" />
        </Button>
      )
    }
  ]

  const confidenceLevels = ['all', 'low', 'medium', 'high', 'verified']
  const classifications = ['all', 'public', 'internal', 'confidential', 'restricted']

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.intelligence')}</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('intelligence.createReport')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('intelligence.totalReports')}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('intelligence.verifiedReports')}</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.filter(r => r.confidence_level === 'verified').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('intelligence.pendingReview')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.filter(r => r.status === 'review').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('intelligence.published')}</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.filter(r => r.status === 'published').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('intelligence.search')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder={t('intelligence.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={t('intelligence.similaritySearchPlaceholder')}
                  value={similaritySearch}
                  onChange={(e) => setSimilaritySearch(e.target.value)}
                />
                <Button
                  onClick={() => similaritySearchMutation.mutate(similaritySearch)}
                  disabled={!similaritySearch || similaritySearchMutation.isPending}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t('intelligence.vectorSearch')}
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex gap-2">
                <span className="text-sm text-muted-foreground mt-2">{t('intelligence.confidence')}:</span>
                {confidenceLevels.map(level => (
                  <Button
                    key={level}
                    variant={filterConfidence === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterConfidence(level)}
                  >
                    {level === 'all' ? t('common.all') : t(`intelligence.confidence.${level}`)}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-muted-foreground mt-2">{t('intelligence.classification')}:</span>
                {classifications.map(cls => (
                  <Button
                    key={cls}
                    variant={filterClassification === cls ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterClassification(cls)}
                  >
                    {cls === 'all' ? t('common.all') : t(`intelligence.classification.${cls}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">{t('common.loading')}</div>
          ) : reports && reports.length > 0 ? (
            <DataTable
              data={reports}
              columns={columns}
              onRowClick={(report) => console.log('Report clicked:', report)}
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