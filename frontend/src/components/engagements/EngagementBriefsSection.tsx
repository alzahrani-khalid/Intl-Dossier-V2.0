/**
 * Engagement Briefs Section Component
 * Feature: engagement-brief-linking
 *
 * Displays briefs linked to an engagement dossier with:
 * - List of linked briefs (AI and legacy)
 * - Generate new brief with AI
 * - Link existing briefs
 * - Brief context preview
 *
 * Mobile-first, RTL-compatible.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Sparkles,
  Plus,
  Link,
  Unlink,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Quote,
  Users,
  Target,
  Calendar,
  MessageSquare,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useEngagementBriefs,
  useEngagementBriefContext,
  useGenerateEngagementBrief,
  useUnlinkBriefFromEngagement,
  type EngagementBrief,
  type BriefType,
} from '@/hooks/useEngagementBriefs'

interface EngagementBriefsSectionProps {
  engagementId: string
  engagementName: string
}

export function EngagementBriefsSection({
  engagementId,
  engagementName,
}: EngagementBriefsSectionProps) {
  const { t, i18n } = useTranslation('engagement-briefs')
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState('briefs')
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [generateLanguage, setGenerateLanguage] = useState<'en' | 'ar'>('en')
  const [customPrompt, setCustomPrompt] = useState('')

  // Fetch briefs and context
  const { data: briefsData, isLoading: briefsLoading } = useEngagementBriefs(engagementId)
  const {
    data: contextData,
    isLoading: contextLoading,
    refetch: refetchContext,
  } = useEngagementBriefContext(engagementId)

  // Mutations
  const generateBrief = useGenerateEngagementBrief()
  const unlinkBrief = useUnlinkBriefFromEngagement()

  const briefs = briefsData?.data || []

  // Handle generate brief
  const handleGenerateBrief = async () => {
    await generateBrief.mutateAsync({
      engagementId,
      language: generateLanguage,
      custom_prompt: customPrompt || undefined,
    })
    setIsGenerateDialogOpen(false)
    setCustomPrompt('')
  }

  // Handle unlink brief
  const handleUnlinkBrief = async (briefId: string, briefType: BriefType) => {
    await unlinkBrief.mutateAsync({
      engagementId,
      briefId,
      brief_type: briefType,
    })
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-200'
      case 'generating':
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-200'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="size-3" />
      case 'generating':
        return <Loader2 className="size-3 animate-spin" />
      case 'failed':
        return <AlertCircle className="size-3" />
      default:
        return <Clock className="size-3" />
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5 text-primary" />
              {t('title')}
              {briefs.length > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {briefs.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{t('description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Sparkles className="size-4" />
                  <span className="hidden sm:inline">{t('actions.generateWithAI')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    {t('generateDialog.title')}
                  </DialogTitle>
                  <DialogDescription>{t('generateDialog.description')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Context Info */}
                  {contextData && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      {t('generateDialog.contextInfo', {
                        participantCount: contextData.participants?.length || 0,
                        positionCount: contextData.positions?.length || 0,
                        commitmentCount: contextData.commitments?.length || 0,
                      })}
                    </div>
                  )}

                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label>{t('labels.language')}</Label>
                    <Select
                      value={generateLanguage}
                      onValueChange={(v) => setGenerateLanguage(v as 'en' | 'ar')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('generateDialog.languageEn')}</SelectItem>
                        <SelectItem value="ar">{t('generateDialog.languageAr')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Prompt */}
                  <div className="space-y-2">
                    <Label>{t('labels.customPrompt')}</Label>
                    <Textarea
                      placeholder={t('generateDialog.customPromptPlaceholder')}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    onClick={handleGenerateBrief}
                    disabled={generateBrief.isPending}
                    className="gap-2"
                  >
                    {generateBrief.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t('generateDialog.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        {t('actions.generate')}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto mb-4">
            <TabsTrigger value="briefs" className="flex-1 sm:flex-none gap-2">
              <FileText className="size-4" />
              {t('tabs.briefs')}
            </TabsTrigger>
            <TabsTrigger value="context" className="flex-1 sm:flex-none gap-2">
              <MessageSquare className="size-4" />
              {t('tabs.context')}
            </TabsTrigger>
          </TabsList>

          {/* Briefs Tab */}
          <TabsContent value="briefs" className="space-y-4">
            {briefsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : briefs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t('empty.title')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('empty.description')}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {briefs.map((brief) => (
                  <BriefCard
                    key={brief.id}
                    brief={brief}
                    onUnlink={(briefType) => handleUnlinkBrief(brief.id, briefType)}
                    isUnlinking={unlinkBrief.isPending}
                    isRTL={isRTL}
                    t={t}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Context Tab */}
          <TabsContent value="context" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{t('sections.context')}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchContext()}
                disabled={contextLoading}
                className="gap-2"
              >
                <RefreshCw className={`size-4 ${contextLoading ? 'animate-spin' : ''}`} />
                {t('actions.refresh')}
              </Button>
            </div>

            {contextLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : contextData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Participants */}
                <ContextCard
                  icon={Users}
                  title={t('sections.participants')}
                  count={contextData.participants?.length || 0}
                  items={contextData.participants?.slice(0, 3).map((p) => ({
                    label: p.name_en || p.name_ar || 'Unknown',
                    sublabel: p.role,
                  }))}
                  isRTL={isRTL}
                />

                {/* Positions */}
                <ContextCard
                  icon={Target}
                  title={t('sections.positions')}
                  count={contextData.positions?.length || 0}
                  items={contextData.positions?.slice(0, 3).map((p) => ({
                    label: p.title_en || p.title_ar || 'Position',
                    sublabel: p.stance,
                  }))}
                  isRTL={isRTL}
                />

                {/* Commitments */}
                <ContextCard
                  icon={CheckCircle2}
                  title={t('sections.commitments')}
                  count={contextData.commitments?.length || 0}
                  items={contextData.commitments?.slice(0, 3).map((c) => ({
                    label: c.title_en || c.title_ar || 'Commitment',
                    sublabel: c.status,
                  }))}
                  isRTL={isRTL}
                />

                {/* Recent Interactions */}
                <ContextCard
                  icon={Calendar}
                  title={t('sections.recentInteractions')}
                  count={contextData.recent_interactions?.length || 0}
                  items={contextData.recent_interactions?.slice(0, 3).map((r) => ({
                    label: r.event_title_en || 'Event',
                    sublabel: new Date(r.event_date).toLocaleDateString(),
                  }))}
                  isRTL={isRTL}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t('empty.contextTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('empty.contextDescription')}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Brief Card Component
interface BriefCardProps {
  brief: EngagementBrief
  onUnlink: (briefType: BriefType) => void
  isUnlinking: boolean
  isRTL: boolean
  t: (key: string, options?: Record<string, unknown>) => string
  formatDate: (date: string) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}

function BriefCard({
  brief,
  onUnlink,
  isUnlinking,
  isRTL,
  t,
  formatDate,
  getStatusColor,
  getStatusIcon,
}: BriefCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h4 className="font-medium truncate">{brief.title || t('card.viewDetails')}</h4>
            <Badge variant="outline" className={getStatusColor(brief.status)}>
              <span className="me-1">{getStatusIcon(brief.status)}</span>
              {t(`statuses.${brief.status}`)}
            </Badge>
            {brief.brief_type === 'ai' && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3" />
                {t('briefTypes.ai')}
              </Badge>
            )}
            {brief.has_citations && (
              <Badge variant="outline" className="gap-1">
                <Quote className="size-3" />
              </Badge>
            )}
          </div>

          {brief.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">{brief.summary}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDate(brief.created_at)}
            </span>
            <span>{t(`sources.${brief.source}`)}</span>
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col">
          <Button variant="outline" size="sm" className="gap-1 flex-1 sm:flex-none">
            <ChevronRight className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('actions.view')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnlink(brief.brief_type)}
            disabled={isUnlinking}
            className="gap-1 text-destructive hover:text-destructive"
          >
            {isUnlinking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Unlink className="size-4" />
            )}
            <span className="sr-only sm:not-sr-only">{t('actions.unlink')}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Context Card Component
interface ContextCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  count: number
  items?: Array<{ label: string; sublabel?: string }>
  isRTL: boolean
}

function ContextCard({ icon: Icon, title, count, items, isRTL }: ContextCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm">
              <span className="font-medium">{item.label}</span>
              {item.sublabel && (
                <span className="text-muted-foreground text-xs ms-2">({item.sublabel})</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No items</p>
      )}
    </div>
  )
}

export default EngagementBriefsSection
