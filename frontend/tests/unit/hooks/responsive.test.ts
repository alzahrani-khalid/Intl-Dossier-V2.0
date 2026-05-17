import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsive } from '../../../src/hooks/useResponsive'

describe('useResponsive', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number
  let requestAnimationFrameSpy: ReturnType<typeof vi.spyOn>
  let cancelAnimationFrameSpy: ReturnType<typeof vi.spyOn>
  let rafId: number

  const setWindowSize = (width: number, height = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    })
    window.dispatchEvent(new Event('resize'))
  }

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    rafId = 0
    requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0)
        rafId += 1
        return rafId
      })
    cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
  })

  it('detects mobile viewport correctly', () => {
    setWindowSize(320)
    const { result } = renderHook(() => useResponsive())

    expect(result.current.viewport).toBe('mobile')
    expect(result.current.deviceType).toBe('mobile')
    expect(result.current.alias).toBe('xs')
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isWide).toBe(false)
  })

  it('detects tablet viewport correctly', () => {
    setWindowSize(768)
    const { result } = renderHook(() => useResponsive())

    expect(result.current.viewport).toBe('tablet')
    expect(result.current.deviceType).toBe('tablet')
    expect(result.current.alias).toBe('sm')
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isWide).toBe(false)
  })

  it('detects desktop viewport correctly', () => {
    setWindowSize(1024)
    const { result } = renderHook(() => useResponsive())

    expect(result.current.viewport).toBe('desktop')
    expect(result.current.deviceType).toBe('desktop')
    expect(result.current.alias).toBe('md')
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isWide).toBe(false)
  })

  it('detects wide viewport correctly', () => {
    setWindowSize(1440)
    const { result } = renderHook(() => useResponsive())

    expect(result.current.viewport).toBe('wide')
    expect(result.current.deviceType).toBe('wide')
    expect(result.current.alias).toBe('lg')
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isWide).toBe(true)
  })

  it('updates on window resize', () => {
    setWindowSize(320)
    const { result } = renderHook(() => useResponsive())
    expect(result.current.viewport).toBe('mobile')

    act(() => {
      setWindowSize(1024)
    })

    expect(result.current.viewport).toBe('desktop')
    expect(result.current.alias).toBe('md')
  })

  it('exposes breakpoint helpers from the current viewport width', () => {
    setWindowSize(1024)
    const { result } = renderHook(() => useResponsive())

    expect(result.current.up('sm')).toBe(true)
    expect(result.current.up('lg')).toBe(false)
    expect(result.current.down('lg')).toBe(true)
    expect(result.current.down('sm')).toBe(false)
    expect(result.current.between('sm', 'lg')).toBe(true)
    expect(result.current.between('xs', 'md')).toBe(false)
  })

  it('tracks width, height, and orientation changes', () => {
    setWindowSize(768, 1024)
    const { result } = renderHook(() => useResponsive())

    expect(result.current.width).toBe(768)
    expect(result.current.height).toBe(1024)
    expect(result.current.orientation).toBe('portrait')

    act(() => {
      setWindowSize(1024, 768)
      window.dispatchEvent(new Event('orientationchange'))
    })

    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
    expect(result.current.orientation).toBe('landscape')
  })
})

describe('useResponsive edge cases', () => {
  const setWindowSize = (width: number, height = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    })
    window.dispatchEvent(new Event('resize'))
  }

  let requestAnimationFrameSpy: ReturnType<typeof vi.spyOn>
  let cancelAnimationFrameSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0)
        return 1
      })
    cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
  })

  it('handles boundary viewport widths', () => {
    setWindowSize(767)
    const { result } = renderHook(() => useResponsive())
    expect(result.current.viewport).toBe('mobile')
    expect(result.current.alias).toBe('xs')

    act(() => {
      setWindowSize(768)
    })
    expect(result.current.viewport).toBe('tablet')
    expect(result.current.alias).toBe('sm')

    act(() => {
      setWindowSize(1023)
    })
    expect(result.current.viewport).toBe('tablet')
    expect(result.current.alias).toBe('sm')

    act(() => {
      setWindowSize(1024)
    })
    expect(result.current.viewport).toBe('desktop')
    expect(result.current.alias).toBe('md')
  })

  it('enables container queries for desktop and wide aliases only', () => {
    setWindowSize(768)
    const { result } = renderHook(() => useResponsive())
    expect(result.current.containerQueries).toBe(false)

    act(() => {
      setWindowSize(1024)
    })
    expect(result.current.containerQueries).toBe(true)
  })
})
