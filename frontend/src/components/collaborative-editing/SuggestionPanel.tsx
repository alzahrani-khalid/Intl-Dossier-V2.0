/**
 * SuggestionPanel Component
 *
 * Displays document suggestions with accept/reject workflow.
 * Shows who made each suggestion, their changes, and allows
 * document authors to approve or reject them.
 * Mobile-first with RTL support.
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Check, X, MessageSquare, ChevronDown, ChevronUp, Filter, User, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  SuggestionWithAuthor,
  SuggestionStatus,
  TrackChangeType,
} from '@/types/collaborative-editing.types'

export interface SuggestionPanelProps {
  suggestions: SuggestionWithAuthor[]
  onAccept: (suggestionId: string, comment?: string) => void
  onReject: (suggestionId: string, comment?: string) => void
  canResolve?: boolean
  isLoading?: boolean
  className?: string
}

type FilterStatus = 'all' | SuggestionStatus

export function SuggestionPanel({
  suggestions,
  onAccept,
  onReject,
  canResolve = true,
  isLoading = false,
  className,
}: SuggestionPanelProps) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const filteredSuggestions = suggestions.filter((s) =>
    filter === 'all' ? true : s.status === filter,
  )

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length

  const getChangeTypeColor = (type: TrackChangeType) => {
    switch (type) {
      case 'insertion':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'deletion':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'replacement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'formatting':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            {t('suggestions.status.pending')}
          </Badge>
        )
      case 'accepted':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            {t('suggestions.status.accepted')}
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            {t('suggestions.status.rejected')}
          </Badge>
        )
      case 'resolved':
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-600">
            {t('suggestions.status.resolved')}
          </Badge>
        )
    }
  }

  const handleAccept = (id: string) => {
    onAccept(id, replyContent || undefined)
    setReplyingTo(null)
    setReplyContent('')
  }

  const handleReject = (id: string) => {
    onReject(id, replyContent || undefined)
    setReplyingTo(null)
    setReplyContent('')
  }

  const dateLocale = i18n.language === 'ar' ? ar : enUS

  return (
    <Card className={cn('flex flex-col', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">{t('suggestions.title')}</CardTitle>
            <CardDescription className="text-sm">
              {pendingCount > 0
                ? t('suggestions.pendingCount', { count: pendingCount })
                : t('suggestions.noPending')}
            </CardDescription>
          </div>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {filter === 'all'
                    ? t('suggestions.filter.all')
                    : t(`suggestions.status.${filter}`)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              <DropdownMenuItem onClick={() => setFilter('all')}>
                {t('suggestions.filter.all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('pending')}>
                {t('suggestions.status.pending')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('accepted')}>
                {t('suggestions.status.accepted')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('rejected')}>
                {t('suggestions.status.rejected')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {filteredSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
              <p>{t('suggestions.empty')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSuggestions.map((suggestion) => (
                <Collapsible
                  key={suggestion.id}
                  open={expandedId === suggestion.id}
                  onOpenChange={(open) => setExpandedId(open ? suggestion.id : null)}
                >
                  <div className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={suggestion.author.avatarUrl}
                          alt={suggestion.author.name}
                        />
                        <AvatarFallback>
                          {suggestion.author.name?.slice(0, 2).toUpperCase() ||
                            suggestion.author.email?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {suggestion.author.name || suggestion.author.email}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', getChangeTypeColor(suggestion.changeType))}
                          >
                            {t(`suggestions.changeType.${suggestion.changeType}`)}
                          </Badge>
                          {getStatusBadge(suggestion.status)}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(suggestion.createdAt), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </div>

                        {/* Change preview */}
                        <div className="mt-2 p-2 rounded bg-muted text-sm">
                          {suggestion.changeType === 'deletion' ? (
                            <span className="line-through text-red-600 dark:text-red-400">
                              {suggestion.originalText}
                            </span>
                          ) : suggestion.changeType === 'insertion' ? (
                            <span className="text-green-600 dark:text-green-400">
                              {suggestion.suggestedText}
                            </span>
                          ) : (
                            <>
                              <span className="line-through text-red-600 dark:text-red-400">
                                {suggestion.originalText}
                              </span>
                              <span className="mx-1">&rarr;</span>
                              <span className="text-green-600 dark:text-green-400">
                                {suggestion.suggestedText}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Comment if exists */}
                        {suggestion.comment && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            &ldquo;{suggestion.comment}&rdquo;
                          </p>
                        )}
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {expandedId === suggestion.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    {/* Expanded content */}
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Resolution info if resolved */}
                        {suggestion.resolvedByUser && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>
                              {t('suggestions.resolvedBy', {
                                name:
                                  suggestion.resolvedByUser.name || suggestion.resolvedByUser.email,
                              })}
                            </span>
                            {suggestion.resolvedAt && (
                              <span>
                                {formatDistanceToNow(new Date(suggestion.resolvedAt), {
                                  addSuffix: true,
                                  locale: dateLocale,
                                })}
                              </span>
                            )}
                          </div>
                        )}

                        {suggestion.resolutionComment && (
                          <p className="text-sm p-2 bg-muted rounded">
                            {suggestion.resolutionComment}
                          </p>
                        )}

                        {/* Actions for pending suggestions */}
                        {suggestion.status === 'pending' && canResolve && (
                          <>
                            {replyingTo === suggestion.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder={t('suggestions.addComment')}
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  className="min-h-[60px] text-sm"
                                />
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleAccept(suggestion.id)}
                                    disabled={isLoading}
                                    className="flex-1 sm:flex-none gap-1"
                                  >
                                    <Check className="h-4 w-4" />
                                    {t('suggestions.accept')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(suggestion.id)}
                                    disabled={isLoading}
                                    className="flex-1 sm:flex-none gap-1"
                                  >
                                    <X className="h-4 w-4" />
                                    {t('suggestions.reject')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setReplyingTo(null)
                                      setReplyContent('')
                                    }}
                                    className="flex-1 sm:flex-none"
                                  >
                                    {t('common.cancel')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAccept(suggestion.id)}
                                  disabled={isLoading}
                                  className="flex-1 sm:flex-none gap-1"
                                >
                                  <Check className="h-4 w-4" />
                                  {t('suggestions.accept')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(suggestion.id)}
                                  disabled={isLoading}
                                  className="flex-1 sm:flex-none gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  {t('suggestions.reject')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReplyingTo(suggestion.id)}
                                  className="flex-1 sm:flex-none gap-1"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  {t('suggestions.addComment')}
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default SuggestionPanel
