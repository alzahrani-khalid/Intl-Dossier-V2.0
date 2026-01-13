import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
} from 'lucide-react'

export interface TranscriptSegment {
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Text content for this segment */
  text: string
}

export interface VideoTutorialProps {
  /** Video source URL (MP4 or WebM recommended) */
  src: string
  /** Poster image URL for video thumbnail */
  poster?: string
  /** Video title */
  title: string
  /** Short description of what the video demonstrates */
  description?: string
  /** Duration in seconds (for display before video loads) */
  duration?: number
  /** Transcript segments for accessibility */
  transcript?: TranscriptSegment[]
  /** Callback when video ends */
  onComplete?: () => void
  /** Callback when video starts playing */
  onPlay?: () => void
  /** Whether to show compact mode (smaller player) */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
  /** Test ID for automated testing */
  testId?: string
}

/**
 * Formats seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * VideoTutorial component for embedding short tutorial videos in empty states.
 * Supports transcripts for accessibility, RTL layouts, and mobile-first design.
 *
 * @example
 * <VideoTutorial
 *   src="/tutorials/create-dossier.mp4"
 *   poster="/tutorials/create-dossier-thumb.jpg"
 *   title="Creating Your First Dossier"
 *   duration={45}
 *   transcript={[
 *     { startTime: 0, endTime: 5, text: "Welcome to the dossier creation tutorial." },
 *     { startTime: 5, endTime: 15, text: "Click the Create Dossier button to begin." },
 *   ]}
 * />
 */
export function VideoTutorial({
  src,
  poster,
  title,
  description,
  duration,
  transcript = [],
  onComplete,
  onPlay,
  compact = false,
  className,
  testId = 'video-tutorial',
}: VideoTutorialProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 0)
  const [showControls, setShowControls] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const [activeTranscriptIndex, setActiveTranscriptIndex] = useState(-1)
  const [hasStarted, setHasStarted] = useState(false)
  const [isEnded, setIsEnded] = useState(false)

  // Update active transcript segment based on current time
  useEffect(() => {
    if (transcript.length === 0) return

    const index = transcript.findIndex(
      (segment) => currentTime >= segment.startTime && currentTime < segment.endTime,
    )
    setActiveTranscriptIndex(index)
  }, [currentTime, transcript])

  // Auto-hide controls after 3 seconds of inactivity when playing
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      return
    }

    const timer = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, currentTime])

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
      if (!hasStarted) {
        setHasStarted(true)
        onPlay?.()
      }
    }
    setIsPlaying(!isPlaying)
    setIsEnded(false)
  }, [isPlaying, hasStarted, onPlay])

  const handleReplay = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
    setIsPlaying(true)
    setIsEnded(false)
  }, [])

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return
    setVideoDuration(videoRef.current.duration)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setIsEnded(true)
    onComplete?.()
  }, [onComplete])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return

      const rect = e.currentTarget.getBoundingClientRect()
      const clickPosition = isRTL ? rect.right - e.clientX : e.clientX - rect.left
      const percentage = clickPosition / rect.width
      const newTime = percentage * videoDuration

      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    },
    [videoDuration, isRTL],
  )

  const handleTranscriptClick = useCallback(
    (startTime: number) => {
      if (!videoRef.current) return
      videoRef.current.currentTime = startTime
      setCurrentTime(startTime)
      if (!isPlaying) {
        videoRef.current.play()
        setIsPlaying(true)
      }
    },
    [isPlaying],
  )

  const handleDismiss = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsPlaying(false)
    setHasStarted(false)
    setCurrentTime(0)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }, [])

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0

  const sizeClasses = compact
    ? {
        container: 'max-w-sm',
        video: 'aspect-video rounded-lg',
        controls: 'p-2',
        button: 'h-8 w-8 min-h-8 min-w-8',
        icon: 'h-3.5 w-3.5',
        text: 'text-xs',
      }
    : {
        container: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
        video: 'aspect-video rounded-lg sm:rounded-xl',
        controls: 'p-2 sm:p-3',
        button: 'h-9 w-9 min-h-9 min-w-9 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10',
        icon: 'h-4 w-4 sm:h-5 sm:w-5',
        text: 'text-xs sm:text-sm',
      }

  return (
    <div
      ref={containerRef}
      className={cn('w-full mx-auto', sizeClasses.container, className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid={testId}
    >
      {/* Video Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Video Element */}
          <div
            className={cn('relative bg-black cursor-pointer group', sizeClasses.video)}
            onClick={() => !isEnded && handlePlayPause()}
            onMouseMove={() => setShowControls(true)}
          >
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              muted={isMuted}
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              className="w-full h-full object-cover"
              data-testid={`${testId}-video`}
            >
              {/* Add WebVTT track for accessibility if transcript exists */}
              {transcript.length > 0 && (
                <track kind="captions" label={isRTL ? 'العربية' : 'English'} default />
              )}
            </video>

            {/* Play Button Overlay (shown when not playing) */}
            {!isPlaying && !isEnded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-14 sm:h-16 sm:w-16 min-h-11 min-w-11 rounded-full bg-white/90 hover:bg-white shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayPause()
                  }}
                  data-testid={`${testId}-play-button`}
                >
                  <Play className="h-6 w-6 sm:h-7 sm:w-7 text-foreground fill-current" />
                </Button>
              </div>
            )}

            {/* Replay Overlay (shown when ended) */}
            {isEnded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-14 sm:h-16 sm:w-16 min-h-11 min-w-11 rounded-full bg-white/90 hover:bg-white shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReplay()
                  }}
                  data-testid={`${testId}-replay-button`}
                >
                  <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
                </Button>
                <span className="text-white text-sm font-medium">
                  {t('video.replayLabel', 'Watch Again')}
                </span>
              </div>
            )}

            {/* Controls Bar */}
            <div
              className={cn(
                'absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200',
                sizeClasses.controls,
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0',
              )}
            >
              {/* Progress Bar */}
              <div
                className="w-full h-1.5 sm:h-2 bg-white/30 rounded-full cursor-pointer mb-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeek(e)
                }}
                data-testid={`${testId}-progress`}
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('text-white hover:bg-white/20', sizeClasses.button)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayPause()
                    }}
                  >
                    {isPlaying ? (
                      <Pause className={sizeClasses.icon} />
                    ) : (
                      <Play className={sizeClasses.icon} />
                    )}
                  </Button>

                  {/* Mute Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('text-white hover:bg-white/20', sizeClasses.button)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMuteToggle()
                    }}
                  >
                    {isMuted ? (
                      <VolumeX className={sizeClasses.icon} />
                    ) : (
                      <Volume2 className={sizeClasses.icon} />
                    )}
                  </Button>

                  {/* Time Display */}
                  <span className={cn('text-white/90 tabular-nums', sizeClasses.text)}>
                    {formatTime(currentTime)} / {formatTime(videoDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Transcript Toggle */}
                  {transcript.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-white hover:bg-white/20',
                        sizeClasses.button,
                        showTranscript && 'bg-white/20',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTranscript(!showTranscript)
                      }}
                      title={t('video.transcriptToggle', 'Toggle Transcript')}
                    >
                      <FileText className={sizeClasses.icon} />
                    </Button>
                  )}

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('text-white hover:bg-white/20', sizeClasses.button)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFullscreen()
                    }}
                  >
                    <Maximize className={sizeClasses.icon} />
                  </Button>

                  {/* Dismiss */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('text-white hover:bg-white/20', sizeClasses.button)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss()
                    }}
                    title={t('video.dismiss', 'Dismiss')}
                  >
                    <X className={sizeClasses.icon} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-medium text-foreground mb-1">{title}</h4>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            )}
            {videoDuration > 0 && !hasStarted && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {t('video.durationLabel', '{{duration}} video', {
                  duration: formatTime(videoDuration),
                })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Panel */}
      {transcript.length > 0 && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
            onClick={() => setShowTranscript(!showTranscript)}
            data-testid={`${testId}-transcript-toggle`}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('video.transcriptTitle', 'Transcript')}
            </span>
            {showTranscript ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showTranscript && (
            <Card className="mt-2">
              <CardContent className="p-3 sm:p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {transcript.map((segment, index) => (
                    <button
                      key={index}
                      className={cn(
                        'w-full text-start p-2 rounded-md text-xs sm:text-sm transition-colors',
                        'hover:bg-muted cursor-pointer',
                        activeTranscriptIndex === index
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground',
                      )}
                      onClick={() => handleTranscriptClick(segment.startTime)}
                      data-testid={`${testId}-transcript-segment-${index}`}
                    >
                      <span className="text-xs text-muted-foreground/60 tabular-nums">
                        {formatTime(segment.startTime)}
                      </span>
                      <span className={cn('block mt-0.5', isRTL ? 'me-4' : 'ms-4')}>
                        {segment.text}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export type { TranscriptSegment as VideoTranscriptSegment }
