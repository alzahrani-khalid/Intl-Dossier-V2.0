/**
 * ToolResultCard Component
 * Feature: 033-ai-brief-generation
 * Task: T037
 *
 * Component for displaying tool execution results:
 * - Shows tool name and input
 * - Displays formatted results
 * - Collapsible for long results
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Search,
  FileText,
  ListChecks,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
} from 'lucide-react'

export interface ToolResultCardProps {
  toolName: string
  input: Record<string, unknown>
  result?: unknown
  isLoading?: boolean
  className?: string
}

const TOOL_ICONS: Record<string, typeof Search> = {
  search_entities: Search,
  get_dossier: FileText,
  query_commitments: ListChecks,
  get_engagement_history: Calendar,
}

const TOOL_LABELS: Record<string, { en: string; ar: string }> = {
  search_entities: { en: 'Searching...', ar: 'جاري البحث...' },
  get_dossier: { en: 'Loading dossier...', ar: 'جاري تحميل الملف...' },
  query_commitments: { en: 'Finding commitments...', ar: 'جاري البحث عن الالتزامات...' },
  get_engagement_history: { en: 'Loading engagements...', ar: 'جاري تحميل الاجتماعات...' },
}

export function ToolResultCard({
  toolName,
  input,
  result,
  isLoading = false,
  className,
}: ToolResultCardProps) {
  const { i18n } = useTranslation('ai-chat')
  const isRTL = i18n.language === 'ar'
  const [isExpanded, setIsExpanded] = useState(false)

  const Icon = TOOL_ICONS[toolName] || Search
  const label = TOOL_LABELS[toolName]?.[isRTL ? 'ar' : 'en'] || toolName

  // Format result for display
  const formatResult = (data: unknown): string => {
    if (!data) return ''

    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>

      // Handle search results
      if (Array.isArray(obj.results)) {
        return `Found ${obj.results.length} result(s)`
      }

      // Handle dossier
      if (obj.dossier && typeof obj.dossier === 'object') {
        const dossier = obj.dossier as Record<string, unknown>
        return `${dossier.name_en || dossier.name_ar || 'Dossier'}`
      }

      // Handle commitments
      if (Array.isArray(obj.commitments)) {
        return `Found ${obj.commitments.length} commitment(s)`
      }

      // Handle engagements
      if (Array.isArray(obj.engagements)) {
        return `Found ${obj.engagements.length} engagement(s)`
      }
    }

    return JSON.stringify(data).substring(0, 100)
  }

  // Get detailed results
  const getDetailedResults = (
    data: unknown,
  ): Array<{ id: string; title: string; type?: string }> => {
    if (!data || typeof data !== 'object') return []

    const obj = data as Record<string, unknown>

    if (Array.isArray(obj.results)) {
      return obj.results.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        title: (r.title || r.name_en || r.name_ar) as string,
        type: r.type as string,
      }))
    }

    if (Array.isArray(obj.commitments)) {
      return obj.commitments.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        title: (c.description_en || c.description_ar || 'Commitment') as string,
        type: 'commitment',
      }))
    }

    if (Array.isArray(obj.engagements)) {
      return obj.engagements.map((e: Record<string, unknown>) => ({
        id: e.id as string,
        title: (e.name_en || e.name_ar || 'Engagement') as string,
        type: 'engagement',
      }))
    }

    return []
  }

  const detailedResults = getDetailedResults(result)
  const hasDetails = detailedResults.length > 0

  return (
    <Card
      className={cn('bg-muted/30 border-muted', 'transition-all duration-200', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isLoading ? label : formatResult(result)}
            </span>
          </div>
          {!isLoading && hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Expanded results */}
      {isExpanded && hasDetails && (
        <CardContent className="py-2 px-3 pt-0">
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {detailedResults.slice(0, 5).map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-2 text-xs">
                {item.type && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {item.type}
                  </Badge>
                )}
                <span className="truncate text-muted-foreground">{item.title}</span>
              </div>
            ))}
            {detailedResults.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{detailedResults.length - 5} more
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default ToolResultCard
