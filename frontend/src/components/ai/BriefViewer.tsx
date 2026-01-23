/**
 * BriefViewer Component
 * Feature: 033-ai-brief-generation
 * Task: T025
 *
 * Component for viewing generated briefs with sections, citations, and export
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Users,
  Target,
  CheckCircle,
  History,
  MessageSquare,
  Lightbulb,
  ExternalLink,
  Printer,
  Download,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BriefContent } from '@/hooks/useGenerateBrief'

export interface BriefViewerProps {
  brief: BriefContent
  onCitationClick?: (type: string, id: string) => void
  className?: string
}

export function BriefViewer({ brief, onCitationClick, className }: BriefViewerProps) {
  const { t, i18n } = useTranslation('ai-brief')
  const isRTL = i18n.language === 'ar'

  // Safely access arrays with fallbacks
  const keyParticipants = brief.keyParticipants ?? []
  const relevantPositions = brief.relevantPositions ?? []
  const activeCommitments = brief.activeCommitments ?? []
  const talkingPoints = brief.talkingPoints ?? []
  const citations = brief.citations ?? []

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = async () => {
    const text = `
${brief.title || 'Untitled Brief'}

Executive Summary:
${brief.executiveSummary || ''}

Background:
${brief.background || ''}

Talking Points:
${talkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Recommendations:
${brief.recommendations || ''}
    `.trim()

    await navigator.clipboard.writeText(text)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brief-${brief.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusColors = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    generating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }

  return (
    <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{brief.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge className={statusColors[brief.status]}>
              {t(`status.${brief.status}`, brief.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {citations.length} {t('citations', 'citations')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="me-1 size-4" />
            {t('copy', 'Copy')}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="me-1 size-4" />
            {t('print', 'Print')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="me-1 size-4" />
            {t('export', 'Export')}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6 pe-4">
          {/* Executive Summary */}
          {brief.executiveSummary && (
            <Section
              icon={<FileText className="size-5" />}
              title={t('sections.executiveSummary', 'Executive Summary')}
            >
              <p className="whitespace-pre-wrap text-muted-foreground">{brief.executiveSummary}</p>
            </Section>
          )}

          {/* Background */}
          {brief.background && (
            <Section
              icon={<History className="size-5" />}
              title={t('sections.background', 'Background')}
            >
              <p className="whitespace-pre-wrap text-muted-foreground">{brief.background}</p>
            </Section>
          )}

          {/* Key Participants */}
          {keyParticipants.length > 0 && (
            <Section
              icon={<Users className="size-5" />}
              title={t('sections.keyParticipants', 'Key Participants')}
            >
              <div className="space-y-3">
                {keyParticipants.map((participant, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Users className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-sm text-muted-foreground">{participant.role}</p>
                      <p className="text-sm text-muted-foreground">{participant.relevance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Relevant Positions */}
          {relevantPositions.length > 0 && (
            <Section
              icon={<Target className="size-5" />}
              title={t('sections.positions', 'Relevant Positions')}
            >
              <div className="space-y-3">
                {relevantPositions.map((position, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{position.title}</p>
                          <p className="text-sm text-muted-foreground">{position.stance}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('source', 'Source')}: {position.source}
                          </p>
                        </div>
                        {onCitationClick && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCitationClick('position', position.sourceId)}
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {/* Active Commitments */}
          {activeCommitments.length > 0 && (
            <Section
              icon={<CheckCircle className="size-5" />}
              title={t('sections.commitments', 'Active Commitments')}
            >
              <div className="space-y-3">
                {activeCommitments.map((commitment, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm">{commitment.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">{commitment.status}</Badge>
                            {commitment.deadline && (
                              <span className="text-xs text-muted-foreground">
                                {t('deadline', 'Deadline')}: {commitment.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                        {onCitationClick && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCitationClick('commitment', commitment.sourceId)}
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {/* Historical Context */}
          {brief.historicalContext && (
            <Section
              icon={<History className="size-5" />}
              title={t('sections.historicalContext', 'Historical Context')}
            >
              <p className="whitespace-pre-wrap text-muted-foreground">{brief.historicalContext}</p>
            </Section>
          )}

          {/* Talking Points */}
          {talkingPoints.length > 0 && (
            <Section
              icon={<MessageSquare className="size-5" />}
              title={t('sections.talkingPoints', 'Talking Points')}
            >
              <ul className="space-y-2">
                {talkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Recommendations */}
          {brief.recommendations && (
            <Section
              icon={<Lightbulb className="size-5" />}
              title={t('sections.recommendations', 'Recommendations')}
            >
              <p className="whitespace-pre-wrap text-muted-foreground">{brief.recommendations}</p>
            </Section>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <Section
              icon={<ExternalLink className="size-5" />}
              title={t('sections.citations', 'Sources & Citations')}
            >
              <div className="space-y-2">
                {citations.map((citation, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted/50"
                    onClick={() => onCitationClick?.(citation.type, citation.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {citation.type}
                      </Badge>
                      <span className="text-sm">{citation.title}</span>
                    </div>
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default BriefViewer
