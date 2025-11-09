import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { FileSpreadsheet, FileText, Download, Loader2, CheckCircle, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface ReportTemplate {
 id: string
 name: string
 description: string
 icon: React.ReactNode
 formats: ('pdf' | 'excel' | 'word')[]
 parameters: {
 name: string
 type: 'date' | 'select' | 'multiselect'
 label: string
 options?: { value: string; label: string }[]
 }[]
}

export function ReportsPage() {
 const { t, i18n } = useTranslation()
 const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
 const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'word'>('pdf')
 const [parameters, setParameters] = useState<Record<string, any>>({})
 const [generatedReports, setGeneratedReports] = useState<any[]>([])
 const isRTL = i18n.language === 'ar'

 const reportTemplates: ReportTemplate[] = [
 {
 id: 'country-overview',
 name: t('reports.templates.countryOverview'),
 description: t('reports.templates.countryOverviewDesc'),
 icon: <FileText className="h-8 w-8" />,
 formats: ['pdf', 'excel'],
 parameters: [
 {
 name: 'country',
 type: 'select',
 label: t('reports.parameters.country'),
 options: [
 { value: 'all', label: t('common.all') },
 { value: 'sa', label: 'Saudi Arabia' },
 { value: 'ae', label: 'UAE' },
 { value: 'eg', label: 'Egypt' }
 ]
 },
 {
 name: 'dateRange',
 type: 'date',
 label: t('reports.parameters.dateRange')
 }
 ]
 },
 {
 id: 'mou-status',
 name: t('reports.templates.mouStatus'),
 description: t('reports.templates.mouStatusDesc'),
 icon: <FileSpreadsheet className="h-8 w-8" />,
 formats: ['excel', 'pdf'],
 parameters: [
 {
 name: 'status',
 type: 'multiselect',
 label: t('reports.parameters.status'),
 options: [
 { value: 'active', label: t('mous.statuses.active') },
 { value: 'expired', label: t('mous.statuses.expired') },
 { value: 'draft', label: t('mous.statuses.draft') }
 ]
 },
 {
 name: 'includeExpiring',
 type: 'select',
 label: t('reports.parameters.includeExpiring'),
 options: [
 { value: 'yes', label: t('common.yes') },
 { value: 'no', label: t('common.no') }
 ]
 }
 ]
 },
 {
 id: 'event-summary',
 name: t('reports.templates.eventSummary'),
 description: t('reports.templates.eventSummaryDesc'),
 icon: <Calendar className="h-8 w-8" />,
 formats: ['pdf', 'word'],
 parameters: [
 {
 name: 'period',
 type: 'select',
 label: t('reports.parameters.period'),
 options: [
 { value: 'month', label: t('reports.periods.thisMonth') },
 { value: 'quarter', label: t('reports.periods.thisQuarter') },
 { value: 'year', label: t('reports.periods.thisYear') }
 ]
 }
 ]
 },
 {
 id: 'intelligence-digest',
 name: t('reports.templates.intelligenceDigest'),
 description: t('reports.templates.intelligenceDigestDesc'),
 icon: <FileText className="h-8 w-8" />,
 formats: ['pdf'],
 parameters: [
 {
 name: 'confidenceLevel',
 type: 'select',
 label: t('reports.parameters.confidenceLevel'),
 options: [
 { value: 'all', label: t('common.all') },
 { value: 'high', label: t('intelligence.confidence.high') },
 { value: 'verified', label: t('intelligence.confidence.verified') }
 ]
 },
 {
 name: 'classification',
 type: 'select',
 label: t('reports.parameters.classification'),
 options: [
 { value: 'public', label: t('intelligence.classification.public') },
 { value: 'internal', label: t('intelligence.classification.internal') }
 ]
 }
 ]
 },
 {
 id: 'organization-profile',
 name: t('reports.templates.organizationProfile'),
 description: t('reports.templates.organizationProfileDesc'),
 icon: <FileSpreadsheet className="h-8 w-8" />,
 formats: ['pdf', 'excel'],
 parameters: [
 {
 name: 'organization',
 type: 'select',
 label: t('reports.parameters.organization'),
 options: [
 { value: 'all', label: t('common.all') },
 { value: 'gov', label: t('organizations.types.government') },
 { value: 'ngo', label: t('organizations.types.ngo') },
 { value: 'private', label: t('organizations.types.private') }
 ]
 }
 ]
 },
 {
 id: 'executive-dashboard',
 name: t('reports.templates.executiveDashboard'),
 description: t('reports.templates.executiveDashboardDesc'),
 icon: <FileText className="h-8 w-8" />,
 formats: ['pdf'],
 parameters: [
 {
 name: 'period',
 type: 'select',
 label: t('reports.parameters.reportPeriod'),
 options: [
 { value: 'weekly', label: t('reports.periods.weekly') },
 { value: 'monthly', label: t('reports.periods.monthly') },
 { value: 'quarterly', label: t('reports.periods.quarterly') }
 ]
 }
 ]
 }
 ]

 const generateReportMutation = useMutation({
 mutationFn: async ({ templateId, format, params }: any) => {
 const { data, error } = await supabase.functions.invoke('reports', {
 body: {
 template: templateId,
 format,
 parameters: params
 }
 })

 if (error) throw error
 return data
 },
 onSuccess: (data) => {
 setGeneratedReports(prev => [{
 id: crypto.randomUUID(),
 name: reportTemplates.find(t => t.id === selectedTemplate)?.name,
 format: selectedFormat,
 status: 'completed',
 url: data.url,
 createdAt: new Date()
 }, ...prev])
 }
 })

 const handleGenerateReport = () => {
 if (!selectedTemplate) return

 generateReportMutation.mutate({
 templateId: selectedTemplate,
 format: selectedFormat,
 params: parameters
 })
 }

 const template = reportTemplates.find(t => t.id === selectedTemplate)

 return (
 <div className="container mx-auto py-6">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold">{t('navigation.reports')}</h1>
 </div>

 <div className="grid gap-6 md:grid-cols-3">
 <div className="md:col-span-2">
 <Card>
 <CardHeader>
 <CardTitle>{t('reports.selectTemplate')}</CardTitle>
 <CardDescription>{t('reports.selectTemplateDesc')}</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid gap-4 md:grid-cols-2">
 {reportTemplates.map(template => (
 <Card
 key={template.id}
 className={`cursor-pointer transition-all hover:shadow-md ${
 selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
 }`}
 onClick={() => {
 setSelectedTemplate(template.id)
 setParameters({})
 }}
 >
 <CardContent className="p-4">
 <div className="flex items-start gap-4">
 <div className="text-primary">{template.icon}</div>
 <div className="flex-1">
 <h3 className="font-semibold">{template.name}</h3>
 <p className="text-sm text-muted-foreground mt-1">
 {template.description}
 </p>
 <div className="flex gap-2 mt-2">
 {template.formats.map(format => (
 <span
 key={format}
 className="inline-flex items-center px-2 py-1 bg-muted rounded text-xs"
 >
 {format.toUpperCase()}
 </span>
 ))}
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </CardContent>
 </Card>

 {selectedTemplate && template && (
 <Card className="mt-6">
 <CardHeader>
 <CardTitle>{t('reports.parameters')}</CardTitle>
 <CardDescription>{t('reports.parametersDesc')}</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div>
 <Label>{t('reports.format')}</Label>
 <div className="flex gap-2 mt-2">
 {template.formats.map(format => (
 <Button
 key={format}
 variant={selectedFormat === format ? 'default' : 'outline'}
 size="sm"
 onClick={() => setSelectedFormat(format)}
 >
 {format.toUpperCase()}
 </Button>
 ))}
 </div>
 </div>

 {template.parameters.map(param => (
 <div key={param.name}>
 <Label>{param.label}</Label>
 {param.type === 'date' ? (
 <Input
 type="date"
 value={parameters[param.name] || ''}
 onChange={(e) => setParameters(prev => ({
 ...prev,
 [param.name]: e.target.value
 }))}
 className="mt-2"
 />
 ) : param.type === 'select' ? (
 <select
 value={parameters[param.name] || ''}
 onChange={(e) => setParameters(prev => ({
 ...prev,
 [param.name]: e.target.value
 }))}
 className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2"
 >
 <option value="">{t('common.select')}</option>
 {param.options?.map(opt => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 </select>
 ) : (
 <div className="mt-2 space-y-2">
 {param.options?.map(opt => (
 <label key={opt.value} className="flex items-center gap-2">
 <input
 type="checkbox"
 checked={(parameters[param.name] || []).includes(opt.value)}
 onChange={(e) => {
 const current = parameters[param.name] || []
 if (e.target.checked) {
 setParameters(prev => ({
 ...prev,
 [param.name]: [...current, opt.value]
 }))
 } else {
 setParameters(prev => ({
 ...prev,
 [param.name]: current.filter((v: string) => v !== opt.value)
 }))
 }
 }}
 />
 {opt.label}
 </label>
 ))}
 </div>
 )}
 </div>
 ))}

 <Button
 className="w-full"
 onClick={handleGenerateReport}
 disabled={generateReportMutation.isPending}
 >
 {generateReportMutation.isPending ? (
 <>
 <Loader2 className="h-4 w-4 me-2 animate-spin" />
 {t('reports.generating')}
 </>
 ) : (
 <>
 <Download className="h-4 w-4 me-2" />
 {t('reports.generateReport')}
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}
 </div>

 <div>
 <Card>
 <CardHeader>
 <CardTitle>{t('reports.recentReports')}</CardTitle>
 </CardHeader>
 <CardContent>
 {generatedReports.length === 0 ? (
 <p className="text-sm text-muted-foreground">{t('reports.noRecentReports')}</p>
 ) : (
 <div className="space-y-3">
 {generatedReports.map(report => (
 <div key={report.id} className="flex items-center justify-between p-3 border rounded">
 <div className="flex-1">
 <div className="font-medium text-sm">{report.name}</div>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs text-muted-foreground">
 {format(report.createdAt, 'dd MMM HH:mm')}
 </span>
 <span className="text-xs px-2 py-0.5 bg-muted rounded">
 {report.format.toUpperCase()}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {report.status === 'completed' ? (
 <>
 <CheckCircle className="h-4 w-4 text-green-600" />
 <Button size="sm" variant="ghost" asChild>
 <a href={report.url} download>
 <Download className="h-4 w-4" />
 </a>
 </Button>
 </>
 ) : (
 <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 )
}