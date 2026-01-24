/**
 * Responsive Hooks
 * @module hooks/use-responsive
 * @feature 034-dossier-ui-polish
 *
 * React hooks for responsive design and breakpoint detection.
 *
 * @description
 * This module provides utilities for building responsive interfaces:
 * - Real-time viewport size and orientation tracking
 * - Breakpoint detection (xs, sm, md, lg) from CSS variables
 * - Device type classification (mobile, tablet, desktop, wide)
 * - Utility functions for responsive logic (up, down, between)
 * - Container query recommendations
 * - Optimized with requestAnimationFrame for performance
 *
 * Breakpoints:
 * - xs: 320px+ (mobile)
 * - sm: 768px+ (tablet)
 * - md: 1024px+ (desktop)
 * - lg: 1440px+ (wide)
 *
 * @example
 * // Basic responsive detection
 * const { isMobile, isTablet, isDesktop } = useResponsive();
 *
 * @example
 * // Breakpoint utilities
 * const { up, down, between } = useResponsive();
 * if (up('md')) {
 *   // Desktop and above
 * }
 *
 * @example
 * // Viewport dimensions
 * const { width, height, orientation } = useResponsive();
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BreakpointDeviceType } from '../types/breakpoint'

/**
 * Breakpoint alias type
 *
 * @typedef {'xs' | 'sm' | 'md' | 'lg'} BreakpointAlias
 */
type BreakpointAlias = 'xs' | 'sm' | 'md' | 'lg'

/**
 * Viewport information
 *
 * @interface ViewportInfo
 * @property {number} width - Current viewport width in pixels
 * @property {number} height - Current viewport height in pixels
 * @property {'portrait' | 'landscape'} orientation - Current screen orientation
 */
export interface ViewportInfo {
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
}

/**
 * Complete responsive state with breakpoint utilities
 *
 * @interface ResponsiveState
 * @extends ViewportInfo
 */
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

/**
 * Read breakpoint value from CSS custom property
 *
 * @description
 * Internal utility to parse breakpoint values from CSS variables.
 * Extracts numeric value from px strings (e.g., "768px" → 768).
 *
 * @param variableName - CSS variable name (e.g., '--breakpoint-sm')
 * @returns Numeric pixel value or undefined if not found
 */
function readPxVar(variableName: string): number | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
  if (!raw) return undefined
  const match = raw.match(/(\d+(?:\.\d+)?)px/)
  return match ? Number(match[1]) : Number(raw)
}

/**
 * Get breakpoint values from CSS custom properties
 *
 * @description
 * Reads breakpoint values from CSS variables with fallback defaults.
 * Allows centralized breakpoint configuration in CSS.
 *
 * @returns Record of breakpoint aliases to pixel values
 */
function getBreakpoints(): Record<BreakpointAlias, number> {
  const xs = readPxVar('--breakpoint-xs') ?? 320
  const sm = readPxVar('--breakpoint-sm') ?? 768
  const md = readPxVar('--breakpoint-md') ?? 1024
  const lg = readPxVar('--breakpoint-lg') ?? 1440
  return { xs, sm, md, lg }
}

/**
 * Determine breakpoint alias for a given width
 *
 * @description
 * Maps viewport width to the appropriate breakpoint alias.
 * Uses mobile-first logic (largest matching breakpoint).
 *
 * @param width - Viewport width in pixels
 * @param bp - Breakpoint values record
 * @returns Matching breakpoint alias
 */
function aliasForWidth(width: number, bp: Record<BreakpointAlias, number>): BreakpointAlias {
  if (width >= bp.lg) return 'lg'
  if (width >= bp.md) return 'md'
  if (width >= bp.sm) return 'sm'
  return 'xs'
}

/**
 * Map breakpoint alias to device type
 *
 * @description
 * Converts breakpoint alias to semantic device type for clearer component logic.
 *
 * @param alias - Breakpoint alias
 * @returns Device type classification
 */
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

/**
 * Hook for responsive design and breakpoint detection
 *
 * @description
 * Provides real-time viewport information and breakpoint utilities.
 * Uses requestAnimationFrame for optimized resize handling.
 * Listens to both resize and orientationchange events.
 *
 * @returns ResponsiveState object with viewport info, device flags, and breakpoint utilities
 *
 * @example
 * // Device type detection
 * const { isMobile, isTablet, isDesktop } = useResponsive();
 *
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 *
 * @example
 * // Breakpoint utilities
 * const { up, down, between } = useResponsive();
 *
 * if (up('md')) {
 *   // Desktop and above (≥1024px)
 * }
 * if (down('sm')) {
 *   // Below tablet (<768px)
 * }
 * if (between('sm', 'lg')) {
 *   // Tablet to desktop (768px - 1440px)
 * }
 */
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

