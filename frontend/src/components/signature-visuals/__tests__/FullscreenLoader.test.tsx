/**
 * VALIDATION row 37-03-01 — open/close semantics (prop + signal OR).
 * Stubs GlobeLoader to avoid d3 chunk resolution inside jsdom.
 */
import { render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../GlobeLoader', (): { GlobeLoader: () => JSX.Element } => ({
  GlobeLoader: (): JSX.Element => <div data-testid="globe-loader-stub" />,
}))

vi.mock('@/design-system/hooks', (): { useReducedMotion: () => boolean } => ({
  useReducedMotion: (): boolean => true,
}))

import { FullscreenLoader } from '../FullscreenLoader'
import {
  __resetGlobeLoaderSignalForTests,
  showGlobeLoader,
} from '../globeLoaderSignal'

describe('FullscreenLoader — open/close (37-03-01)', (): void => {
  beforeEach((): void => {
    __resetGlobeLoaderSignalForTests()
  })

  afterEach((): void => {
    vi.useRealTimers()
    __resetGlobeLoaderSignalForTests()
  })

  it('renders backdrop + GlobeLoader when open prop is true', (): void => {
    render(<FullscreenLoader open />)
    expect(screen.queryByTestId('fullscreen-loader')).not.toBeNull()
    expect(screen.queryByTestId('globe-loader-stub')).not.toBeNull()
  })

  it('renders nothing when open prop is false (default)', (): void => {
    const { container } = render(<FullscreenLoader />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId('fullscreen-loader')).toBeNull()
  })

  it('stays visible just before ms elapses and hides after', (): void => {
    vi.useFakeTimers()
    render(<FullscreenLoader />)
    act((): void => {
      showGlobeLoader(1600)
    })
    expect(screen.queryByTestId('fullscreen-loader')).not.toBeNull()
    act((): void => {
      vi.advanceTimersByTime(1599)
    })
    expect(screen.queryByTestId('fullscreen-loader')).not.toBeNull()
    act((): void => {
      vi.advanceTimersByTime(2)
    })
    expect(screen.queryByTestId('fullscreen-loader')).toBeNull()
  })

  it('auto-closes after ms when open={true} + ms are passed', (): void => {
    vi.useFakeTimers()
    render(<FullscreenLoader open ms={500} />)
    expect(screen.queryByTestId('fullscreen-loader')).not.toBeNull()
    act((): void => {
      vi.advanceTimersByTime(501)
    })
    expect(screen.queryByTestId('fullscreen-loader')).toBeNull()
  })

  it('shows overlay when signal is open even if prop open is false (OR semantics)', (): void => {
    vi.useFakeTimers()
    render(<FullscreenLoader open={false} />)
    expect(screen.queryByTestId('fullscreen-loader')).toBeNull()
    act((): void => {
      showGlobeLoader(800)
    })
    expect(screen.queryByTestId('fullscreen-loader')).not.toBeNull()
  })
})
