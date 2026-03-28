/**
 * MilestonesCelebration Component
 *
 * Displays celebratory animations when users reach onboarding milestones.
 * Supports confetti, sparkles, fireworks, and checkmark animations.
 * Mobile-first, RTL-compatible design.
 */

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'framer-motion'
import { Award, Zap, Star, Trophy, PartyPopper, Sparkles, Check, X, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MilestonesCelebrationProps } from '@/types/onboarding.types'

// Icon mapping for badges
const badgeIcons: Record<string, LucideIcon> = {
  Award,
  Zap,
  Star,
  Trophy,
  PartyPopper,
  Sparkles,
}

// Confetti particle component
function ConfettiParticle({
  delay,
  duration,
  color,
  size,
  startX,
}: {
  delay: number
  duration: number
  color: string
  size: number
  startX: number
}) {
  return (
    <m.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${startX}%`,
        top: '-5%',
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: '120vh',
        opacity: [1, 1, 0],
        rotate: [0, 360, 720],
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration,
        delay,
        ease: 'linear',
      }}
    />
  )
}

// Sparkle particle component
function SparkleParticle({
  x,
  y,
  delay,
  scale,
}: {
  x: number
  y: number
  delay: number
  scale: number
}) {
  return (
    <m.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, scale, 0],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: 2,
        ease: 'easeInOut',
      }}
    >
      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
    </m.div>
  )
}

// Firework burst component
function FireworkBurst({ x, y, delay }: { x: number; y: number; delay: number }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

  return (
    <m.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.1 }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => {
        const angle = (n / 12) * Math.PI * 2
        const distance = 40 + Math.random() * 30
        return (
          <m.div
            key={n}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: colors[n % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
            }}
            transition={{
              duration: 0.8,
              delay: delay + 0.1,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </m.div>
  )
}

// Checkmark animation component
function CheckmarkAnimation() {
  return (
    <m.div
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-500 flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ duration: 0.5, times: [0, 0.6, 1] }}
    >
      <m.div
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={3} />
      </m.div>
    </m.div>
  )
}

/**
 * Generate confetti particles
 */
function ConfettiAnimation() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3']
  const particles = Array.from({ length: 50 }, (_, n) => ({
    id: n,
    delay: Math.random() * 1,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    size: 6 + Math.random() * 8,
    startX: Math.random() * 100,
  }))

  return (
    <>
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} {...particle} />
      ))}
    </>
  )
}

/**
 * Generate sparkle particles
 */
function SparkleAnimation() {
  const sparkles = Array.from({ length: 15 }, (_, n) => ({
    id: n,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    delay: Math.random() * 1,
    scale: 0.5 + Math.random() * 1,
  }))

  return (
    <>
      {sparkles.map((sparkle) => (
        <SparkleParticle key={sparkle.id} {...sparkle} />
      ))}
    </>
  )
}

/**
 * Generate firework bursts
 */
function FireworksAnimation() {
  const fireworks = Array.from({ length: 5 }, (_, n) => ({
    id: n,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 40,
    delay: n * 0.4,
  }))

  return (
    <>
      {fireworks.map((firework) => (
        <FireworkBurst key={firework.id} {...firework} />
      ))}
    </>
  )
}

/**
 * Main MilestonesCelebration component
 */
export function MilestonesCelebration({
  celebration,
  onComplete,
  autoDismiss = true,
}: MilestonesCelebrationProps) {
  const { t } = useTranslation('onboarding')
  const [isVisible, setIsVisible] = useState(true)

  const BadgeIcon = badgeIcons[celebration.badgeIcon ?? 'Award'] || Award

  // Auto dismiss after duration
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, celebration.duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [autoDismiss, celebration.duration, onComplete])

  // Handle manual dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    onComplete?.()
  }, [onComplete])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <m.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        />

        {/* Animation layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {celebration.animationType === 'confetti' && <ConfettiAnimation />}
          {celebration.animationType === 'sparkle' && <SparkleAnimation />}
          {celebration.animationType === 'fireworks' && <FireworksAnimation />}
        </div>

        {/* Content card */}
        <m.div
          className="relative z-10 bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 mx-4 max-w-sm w-full text-center shadow-2xl"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 end-3 sm:top-4 sm:end-4 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Icon/Animation */}
          <div className="mb-4 sm:mb-6 flex justify-center">
            {celebration.animationType === 'checkmark' ? (
              <CheckmarkAnimation />
            ) : (
              <m.div
                className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center',
                  celebration.percentage === 100
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : celebration.percentage >= 75
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : celebration.percentage >= 50
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-br from-green-400 to-emerald-500',
                )}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              >
                <BadgeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </m.div>
            )}
          </div>

          {/* Badge text */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3">
              {t(`milestones.badge.${celebration.percentage}`)}
            </span>
          </m.div>

          {/* Title */}
          <m.h2
            className="text-xl sm:text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t(celebration.titleKey)}
          </m.h2>

          {/* Message */}
          <m.p
            className="text-sm sm:text-base text-muted-foreground mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {t(celebration.messageKey)}
          </m.p>

          {/* Progress indicator */}
          <m.div
            className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[25, 50, 75, 100].map((milestone) => (
              <div
                key={milestone}
                className={cn(
                  'w-8 h-1.5 sm:w-10 sm:h-2 rounded-full transition-colors',
                  milestone <= celebration.percentage ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </m.div>

          {/* Action button */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={handleDismiss} className="min-h-11 px-8">
              {celebration.percentage === 100 ? t('checklist.getStarted') : t('checklist.continue')}
            </Button>
          </m.div>
        </m.div>
      </m.div>
    </AnimatePresence>
  )
}
