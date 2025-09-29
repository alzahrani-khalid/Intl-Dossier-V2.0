import { useEffect, useMemo, useRef, useState } from 'react'
import type { BreakpointDeviceType } from '../types/breakpoint'

type BreakpointAlias = 'xs' | 'sm' | 'md' | 'lg'

export interface ViewportInfo {
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
}

export interface ResponsiveState extends ViewportInfo {
  alias: BreakpointAlias
  deviceType: BreakpointDeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  up: (alias: BreakpointAlias) => boolean
  down: (alias: BreakpointAlias) => boolean
  between: (min: BreakpointAlias, max: BreakpointAlias) => boolean
  /** True if container queries are recommended at current size */
  containerQueries: boolean
}

function readPxVar(variableName: string): number | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
  if (!raw) return undefined
  const match = raw.match(/(\d+(?:\.\d+)?)px/)
  return match ? Number(match[1]) : Number(raw)
}

function getBreakpoints(): Record<BreakpointAlias, number> {
  const xs = readPxVar('--breakpoint-xs') ?? 320
  const sm = readPxVar('--breakpoint-sm') ?? 768
  const md = readPxVar('--breakpoint-md') ?? 1024
  const lg = readPxVar('--breakpoint-lg') ?? 1440
  return { xs, sm, md, lg }
}

function aliasForWidth(width: number, bp: Record<BreakpointAlias, number>): BreakpointAlias {
  if (width >= bp.lg) return 'lg'
  if (width >= bp.md) return 'md'
  if (width >= bp.sm) return 'sm'
  return 'xs'
}

function deviceForAlias(alias: BreakpointAlias): BreakpointDeviceType {
  switch (alias) {
    case 'xs':
      return 'mobile'
    case 'sm':
      return 'tablet'
    case 'md':
      return 'desktop'
    case 'lg':
      return 'wide'
  }
}

export function useResponsive(): ResponsiveState {
  const breakpoints = useMemo(getBreakpoints, [])
  const [viewport, setViewport] = useState<ViewportInfo>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    orientation:
      typeof window !== 'undefined' && window.innerWidth < window.innerHeight
        ? 'portrait'
        : 'landscape',
  }))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
          orientation: window.innerWidth < window.innerHeight ? 'portrait' : 'landscape',
        })
      })
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize, { passive: true } as any)
    // Initial in case of late mount
    handleResize()
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize as any)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const alias = useMemo(() => aliasForWidth(viewport.width, breakpoints), [viewport.width, breakpoints])
  const deviceType = useMemo(() => deviceForAlias(alias), [alias])

  const up = (a: BreakpointAlias) => viewport.width >= breakpoints[a]
  const down = (a: BreakpointAlias) => viewport.width < breakpoints[a]
  const between = (min: BreakpointAlias, max: BreakpointAlias) =>
    viewport.width >= breakpoints[min] && viewport.width < breakpoints[max]

  return {
    ...viewport,
    alias,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isWide: deviceType === 'wide',
    up,
    down,
    between,
    containerQueries: alias !== 'xs' && alias !== 'sm',
  }
}

export type { BreakpointAlias }

