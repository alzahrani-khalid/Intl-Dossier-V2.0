import { useState, useEffect, useRef } from 'react'

/**
 * Detects scroll direction for auto-hide UI patterns (iOS Safari-style).
 * Returns 'up', 'down', or null (initial / no significant scroll).
 */
export function useScrollDirection(threshold = 10): 'up' | 'down' | null {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = (): void => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current

      if (Math.abs(diff) < threshold) return

      setDirection(diff > 0 ? 'down' : 'up')
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return (): void => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return direction
}
