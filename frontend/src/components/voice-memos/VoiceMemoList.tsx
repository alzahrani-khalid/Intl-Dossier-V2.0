import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Volume2, Trash2, Download, FileText, Clock, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { VoiceMemo, TranscriptionSegment } from '@/types/voice-memo.types'

interface VoiceMemoListProps {
  voiceMemos: VoiceMemo[]
  onDelete?: (id: string) => void
  onDownload?: (voiceMemo: VoiceMemo) => void
  isLoading?: boolean
  className?: string
}

/**
 * VoiceMemoList - Component for displaying a list of voice memos with playback
 * Features:
 * - Audio playback with progress
 * - Transcription display with segment highlighting
 * - Status badges
 * - Delete and download actions
 * - RTL-aware layout
 * - Mobile-first responsive design
 */
export function VoiceMemoList({
  voiceMemos,
  onDelete,
  onDownload,
  isLoading,
  className,
}: VoiceMemoListProps) {
  const { t, i18n } = useTranslation('voice-memos')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (voiceMemos.length === 0) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-8 sm:py-12">
          <Volume2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('empty.noVoiceMemos')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {voiceMemos.map((memo) => (
        <VoiceMemoCard
          key={memo.id}
          voiceMemo={memo}
          onDelete={onDelete}
          onDownload={onDownload}
          isRTL={isRTL}
        />
      ))}
    </div>
  )
}

interface VoiceMemoCardProps {
  voiceMemo: VoiceMemo
  onDelete?: (id: string) => void
  onDownload?: (voiceMemo: VoiceMemo) => void
  isRTL: boolean
}

function VoiceMemoCard({ voiceMemo, onDelete, onDownload, isRTL }: VoiceMemoCardProps) {
  const { t } = useTranslation('voice-memos')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [showTranscription, setShowTranscription] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1)

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get status badge variant
  const getStatusVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'transcribing':
      case 'processing':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Handle play/pause
  const togglePlayback = async () => {
    if (!audioElement) {
      // Create audio element on first play
      const audio = new Audio()

      // Use playback URL if available
      if (voiceMemo.playbackUrl) {
        audio.src = voiceMemo.playbackUrl
      } else if (voiceMemo.localUri) {
        audio.src = voiceMemo.localUri
      } else {
        return
      }

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)

        // Update active segment
        if (voiceMemo.transcriptionSegments) {
          const segmentIndex = voiceMemo.transcriptionSegments.findIndex(
            (seg) => audio.currentTime >= seg.start && audio.currentTime < seg.end,
          )
          setActiveSegmentIndex(segmentIndex)
        }
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
        setActiveSegmentIndex(-1)
      })

      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    }
  }

  // Seek to segment
  const seekToSegment = (segment: TranscriptionSegment) => {
    if (audioElement) {
      audioElement.currentTime = segment.start
    }
  }

  const progress =
    voiceMemo.durationSeconds > 0 ? (currentTime / voiceMemo.durationSeconds) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className={cn('flex items-start gap-3', isRTL && 'flex-row-reverse')}>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base truncate">
              {voiceMemo.title || t('untitledMemo')}
            </CardTitle>
            <div
              className={cn(
                'flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap',
                isRTL && 'flex-row-reverse',
              )}
            >
              <span className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                <User className="h-3 w-3" />
                {voiceMemo.recordedByName || t('unknownUser')}
              </span>
              <span className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                <Clock className="h-3 w-3" />
                {formatDate(voiceMemo.recordedAt)}
              </span>
            </div>
          </div>
          <Badge variant={getStatusVariant(voiceMemo.status)} className="text-xs shrink-0">
            {t(`status.${voiceMemo.status}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 space-y-3">
        {/* Player Controls */}
        <div className={cn('flex items-center gap-2 sm:gap-3', isRTL && 'flex-row-reverse')}>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-11 sm:w-11 shrink-0"
            onClick={togglePlayback}
            disabled={voiceMemo.status !== 'completed' && voiceMemo.status !== 'failed'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          <div className="flex-1 space-y-1">
            <Progress value={progress} className="h-2" />
            <div
              className={cn(
                'flex justify-between text-xs text-muted-foreground',
                isRTL && 'flex-row-reverse',
              )}
            >
              <span className="tabular-nums">{formatDuration(currentTime)}</span>
              <span className="tabular-nums">{formatDuration(voiceMemo.durationSeconds)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={cn('flex gap-1', isRTL && 'flex-row-reverse')}>
            {voiceMemo.transcription && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowTranscription(!showTranscription)}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => onDownload(voiceMemo)}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('delete.description')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(voiceMemo.id)}>
                      {t('buttons.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Transcription */}
        {voiceMemo.transcription && (
          <Collapsible open={showTranscription} onOpenChange={setShowTranscription}>
            <CollapsibleContent>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {voiceMemo.transcriptionSegments && voiceMemo.transcriptionSegments.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {voiceMemo.transcriptionSegments.map((segment, index) => (
                      <button
                        key={segment.id}
                        onClick={() => seekToSegment(segment)}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-start transition-colors',
                          index === activeSegmentIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted',
                        )}
                      >
                        {segment.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">{voiceMemo.transcription}</p>
                )}

                {voiceMemo.transcriptionConfidence !== undefined && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('transcription.confidence', {
                      value: Math.round(voiceMemo.transcriptionConfidence * 100),
                    })}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Processing indicator */}
        {(voiceMemo.status === 'processing' || voiceMemo.status === 'transcribing') && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
            {t(`status.${voiceMemo.status}Description`)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VoiceMemoList
