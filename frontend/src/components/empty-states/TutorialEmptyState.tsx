import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { ListEmptyState, type EntityType } from './ListEmptyState'
import { VideoTutorial, type TranscriptSegment } from './VideoTutorial'
import type { EmptyStateVariant, EmptyStateSize } from './EmptyState'

export interface TutorialVideo {
  /** Unique identifier for the tutorial */
  id: string
  /** Video source URL */
  src: string
  /** Poster/thumbnail image URL */
  poster?: string
  /** Video title (can be i18n key) */
  title: string
  /** Video description (can be i18n key) */
  description?: string
  /** Duration in seconds */
  duration: number
  /** Transcript segments */
  transcript?: TranscriptSegment[]
  /** Target entity type this tutorial is for */
  entityType: EntityType
  /** Tags for categorization */
  tags?: string[]
}

export interface TutorialEmptyStateProps {
  /** Type of entity the list is for */
  entityType: EntityType
  /** Callback to create new item */
  onCreate?: () => void
  /** Callback to import items */
  onImport?: () => void
  /** Whether this is the first item */
  isFirstItem?: boolean
  /** Custom title override */
  title?: string
  /** Custom description override */
  description?: string
  /** Visual variant */
  variant?: EmptyStateVariant
  /** Size variant */
  size?: EmptyStateSize
  /** Additional CSS classes */
  className?: string
  /** Available tutorial videos for this entity type */
  tutorials?: TutorialVideo[]
  /** Whether to show tutorials by default */
  showTutorialsDefault?: boolean
  /** Callback when a tutorial is watched */
  onTutorialWatched?: (tutorialId: string) => void
  /** Callback when a tutorial starts playing */
  onTutorialStarted?: (tutorialId: string) => void
  /** Test ID for automated testing */
  testId?: string
}

/**
 * Default tutorial videos configuration.
 * In production, these would come from a CMS or configuration service.
 */
const DEFAULT_TUTORIALS: TutorialVideo[] = [
  {
    id: 'dossier-create',
    src: '/tutorials/create-country-dossier.mp4',
    poster: '/tutorials/thumbnails/create-country-dossier.jpg',
    title: 'video.tutorials.dossier.create.title',
    description: 'video.tutorials.dossier.create.description',
    duration: 45,
    entityType: 'dossier',
    tags: ['getting-started', 'diplomat'],
    transcript: [
      { startTime: 0, endTime: 5, text: 'video.tutorials.dossier.create.transcript.0' },
      { startTime: 5, endTime: 15, text: 'video.tutorials.dossier.create.transcript.1' },
      { startTime: 15, endTime: 30, text: 'video.tutorials.dossier.create.transcript.2' },
      { startTime: 30, endTime: 45, text: 'video.tutorials.dossier.create.transcript.3' },
    ],
  },
  {
    id: 'engagement-link-brief',
    src: '/tutorials/link-brief-engagement.mp4',
    poster: '/tutorials/thumbnails/link-brief-engagement.jpg',
    title: 'video.tutorials.engagement.linkBrief.title',
    description: 'video.tutorials.engagement.linkBrief.description',
    duration: 60,
    entityType: 'engagement',
    tags: ['intermediate', 'policy-analyst'],
    transcript: [
      { startTime: 0, endTime: 10, text: 'video.tutorials.engagement.linkBrief.transcript.0' },
      { startTime: 10, endTime: 25, text: 'video.tutorials.engagement.linkBrief.transcript.1' },
      { startTime: 25, endTime: 45, text: 'video.tutorials.engagement.linkBrief.transcript.2' },
      { startTime: 45, endTime: 60, text: 'video.tutorials.engagement.linkBrief.transcript.3' },
    ],
  },
  {
    id: 'commitment-track',
    src: '/tutorials/track-commitments.mp4',
    poster: '/tutorials/thumbnails/track-commitments.jpg',
    title: 'video.tutorials.commitment.track.title',
    description: 'video.tutorials.commitment.track.description',
    duration: 55,
    entityType: 'commitment',
    tags: ['getting-started', 'workflow'],
  },
  {
    id: 'document-upload',
    src: '/tutorials/upload-documents.mp4',
    poster: '/tutorials/thumbnails/upload-documents.jpg',
    title: 'video.tutorials.document.upload.title',
    description: 'video.tutorials.document.upload.description',
    duration: 35,
    entityType: 'document',
    tags: ['getting-started'],
  },
  {
    id: 'organization-manage',
    src: '/tutorials/manage-organizations.mp4',
    poster: '/tutorials/thumbnails/manage-organizations.jpg',
    title: 'video.tutorials.organization.manage.title',
    description: 'video.tutorials.organization.manage.description',
    duration: 50,
    entityType: 'organization',
    tags: ['intermediate'],
  },
  {
    id: 'country-portfolio',
    src: '/tutorials/country-portfolio.mp4',
    poster: '/tutorials/thumbnails/country-portfolio.jpg',
    title: 'video.tutorials.country.portfolio.title',
    description: 'video.tutorials.country.portfolio.description',
    duration: 75,
    entityType: 'country',
    tags: ['getting-started', 'diplomat'],
  },
  {
    id: 'mou-track-renewals',
    src: '/tutorials/track-mou-renewals.mp4',
    poster: '/tutorials/thumbnails/track-mou-renewals.jpg',
    title: 'video.tutorials.mou.trackRenewals.title',
    description: 'video.tutorials.mou.trackRenewals.description',
    duration: 40,
    entityType: 'mou',
    tags: ['intermediate', 'legal'],
  },
  {
    id: 'relationship-network',
    src: '/tutorials/relationship-network.mp4',
    poster: '/tutorials/thumbnails/relationship-network.jpg',
    title: 'video.tutorials.relationship.network.title',
    description: 'video.tutorials.relationship.network.description',
    duration: 65,
    entityType: 'generic',
    tags: ['advanced', 'visualization'],
  },
]

/**
 * TutorialEmptyState extends ListEmptyState with embedded video tutorials.
 * Shows relevant 30-90 second videos demonstrating real-world use cases.
 *
 * @example
 * <TutorialEmptyState
 *   entityType="dossier"
 *   isFirstItem={true}
 *   onCreate={() => openCreateDialog()}
 *   onTutorialWatched={(id) => trackEvent('tutorial_completed', { id })}
 * />
 */
export function TutorialEmptyState({
  entityType,
  onCreate,
  onImport,
  isFirstItem = false,
  title,
  description,
  variant = 'default',
  size = 'md',
  className,
  tutorials = DEFAULT_TUTORIALS,
  showTutorialsDefault = true,
  onTutorialWatched,
  onTutorialStarted,
  testId = 'tutorial-empty-state',
}: TutorialEmptyStateProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  const [showTutorials, setShowTutorials] = useState(showTutorialsDefault)
  const [activeTutorialIndex, setActiveTutorialIndex] = useState(0)
  const [expandedVideo, setExpandedVideo] = useState(false)

  // Filter tutorials for this entity type
  const relevantTutorials = tutorials.filter(
    (tutorial) => tutorial.entityType === entityType || tutorial.entityType === 'generic',
  )

  const activeTutorial = relevantTutorials[activeTutorialIndex]
  const hasMultipleTutorials = relevantTutorials.length > 1

  const handlePrevious = useCallback(() => {
    setActiveTutorialIndex((prev) => (prev > 0 ? prev - 1 : relevantTutorials.length - 1))
  }, [relevantTutorials.length])

  const handleNext = useCallback(() => {
    setActiveTutorialIndex((prev) => (prev < relevantTutorials.length - 1 ? prev + 1 : 0))
  }, [relevantTutorials.length])

  const handleTutorialComplete = useCallback(() => {
    if (activeTutorial) {
      onTutorialWatched?.(activeTutorial.id)
    }
    // Auto-advance to next tutorial if available
    if (hasMultipleTutorials) {
      handleNext()
    }
  }, [activeTutorial, onTutorialWatched, hasMultipleTutorials, handleNext])

  const handleTutorialPlay = useCallback(() => {
    if (activeTutorial) {
      onTutorialStarted?.(activeTutorial.id)
    }
  }, [activeTutorial, onTutorialStarted])

  // Translate tutorial content
  const getTranslatedTutorial = useCallback(
    (tutorial: TutorialVideo) => {
      const translatedTitle = tutorial.title.startsWith('video.')
        ? t(tutorial.title, tutorial.title)
        : tutorial.title
      const translatedDescription = tutorial.description?.startsWith('video.')
        ? t(tutorial.description, tutorial.description)
        : tutorial.description
      const translatedTranscript = tutorial.transcript?.map((segment) => ({
        ...segment,
        text: segment.text.startsWith('video.') ? t(segment.text, segment.text) : segment.text,
      }))

      return {
        ...tutorial,
        title: translatedTitle,
        description: translatedDescription,
        transcript: translatedTranscript,
      }
    },
    [t],
  )

  // No tutorials available for this entity type
  if (relevantTutorials.length === 0) {
    return (
      <ListEmptyState
        entityType={entityType}
        onCreate={onCreate}
        onImport={onImport}
        isFirstItem={isFirstItem}
        title={title}
        description={description}
        variant={variant}
        size={size}
        className={className}
      />
    )
  }

  const translatedTutorial = activeTutorial ? getTranslatedTutorial(activeTutorial) : null

  const containerClasses = cn('flex flex-col gap-4 sm:gap-6', className)

  // Compact tutorial preview card
  const TutorialPreviewCard = () => (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpandedVideo(true)}
      data-testid={`${testId}-preview`}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-20 h-14 sm:w-28 sm:h-20 rounded-md overflow-hidden bg-muted">
            {translatedTutorial?.poster ? (
              <img src={translatedTutorial.poster} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground fill-current" />
              </div>
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-1 end-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-black/70 text-white">
              {Math.floor((translatedTutorial?.duration || 0) / 60)}:
              {String((translatedTutorial?.duration || 0) % 60).padStart(2, '0')}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-medium text-foreground line-clamp-1">
                  {translatedTutorial?.title}
                </h4>
                {translatedTutorial?.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {translatedTutorial.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 min-h-8 min-w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTutorials(false)
                }}
                title={t('video.hideTutorial', 'Hide tutorial')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation dots for multiple tutorials */}
            {hasMultipleTutorials && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 min-h-6 min-w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevious()
                  }}
                >
                  {isRTL ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  )}
                </Button>
                <div className="flex gap-1">
                  {relevantTutorials.map((_, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        idx === activeTutorialIndex
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveTutorialIndex(idx)
                      }}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 min-h-6 min-w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                >
                  {isRTL ? (
                    <ChevronLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground ms-1">
                  {activeTutorialIndex + 1} / {relevantTutorials.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Expanded video player
  const ExpandedVideoPlayer = () => (
    <div className="space-y-4" data-testid={`${testId}-expanded`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('video.watchTutorial', 'Watch Tutorial')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setExpandedVideo(false)}
        >
          <X className="h-3.5 w-3.5 me-1" />
          {t('video.close', 'Close')}
        </Button>
      </div>

      {translatedTutorial && (
        <VideoTutorial
          src={translatedTutorial.src}
          poster={translatedTutorial.poster}
          title={translatedTutorial.title}
          description={translatedTutorial.description}
          duration={translatedTutorial.duration}
          transcript={translatedTutorial.transcript}
          onComplete={handleTutorialComplete}
          onPlay={handleTutorialPlay}
          testId={`${testId}-video`}
        />
      )}

      {/* Navigation for multiple tutorials */}
      {hasMultipleTutorials && (
        <div className="flex items-center justify-center gap-4 py-2">
          <Button variant="outline" size="sm" onClick={handlePrevious} className="h-9 min-h-9">
            {isRTL ? (
              <ChevronRight className="h-4 w-4 me-1" />
            ) : (
              <ChevronLeft className="h-4 w-4 me-1" />
            )}
            {t('video.previous', 'Previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {activeTutorialIndex + 1} / {relevantTutorials.length}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext} className="h-9 min-h-9">
            {t('video.next', 'Next')}
            {isRTL ? (
              <ChevronLeft className="h-4 w-4 ms-1" />
            ) : (
              <ChevronRight className="h-4 w-4 ms-1" />
            )}
          </Button>
        </div>
      )}
    </div>
  )

  // Show tutorial button when tutorials are hidden
  const ShowTutorialButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground hover:text-foreground"
      onClick={() => setShowTutorials(true)}
      data-testid={`${testId}-show-button`}
    >
      <Play className="h-3.5 w-3.5 me-1" />
      {t('video.showTutorials', 'Show video tutorial')}
    </Button>
  )

  return (
    <div className={containerClasses} dir={isRTL ? 'rtl' : 'ltr'} data-testid={testId}>
      {/* Tutorial Section */}
      {showTutorials && (
        <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto">
          {expandedVideo ? <ExpandedVideoPlayer /> : <TutorialPreviewCard />}
        </div>
      )}

      {/* Empty State */}
      <ListEmptyState
        entityType={entityType}
        onCreate={onCreate}
        onImport={onImport}
        isFirstItem={isFirstItem}
        title={title}
        description={description}
        variant={variant}
        size={size}
      />

      {/* Show tutorials button when hidden */}
      {!showTutorials && (
        <div className="flex justify-center">
          <ShowTutorialButton />
        </div>
      )}
    </div>
  )
}

// Export tutorial configuration type for external use
export type { TutorialVideo }
