import { useCallback, useEffect, useRef, useState } from 'react'

export type UseKeyboardNavigationOptions = {
  itemCount: number
  loop?: boolean
}

export function useKeyboardNavigation({ itemCount, loop = true }: UseKeyboardNavigationOptions) {
  const [index, setIndex] = useState(0)
  const containerRef = useRef<HTMLElement | null>(null)

  const clamp = useCallback((i: number) => {
    if (loop) return (i + itemCount) % itemCount
    return Math.max(0, Math.min(itemCount - 1, i))
  }, [itemCount, loop])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setIndex(i => clamp(i + 1))
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setIndex(i => clamp(i - 1))
    if (e.key === 'Home') setIndex(0)
    if (e.key === 'End') setIndex(itemCount - 1)
  }, [clamp, itemCount])

  useEffect(() => {
    const cur = containerRef.current
    if (!cur) return
    const handler = (e: KeyboardEvent) => onKeyDown(e)
    cur.addEventListener('keydown', handler)
    return () => cur.removeEventListener('keydown', handler)
  }, [onKeyDown])

  useEffect(() => {
    const cur = containerRef.current
    if (!cur) return
    const el = cur.querySelector<HTMLElement>(`[data-kbindex="${index}"]`)
    el?.focus()
  }, [index])

  return { index, setIndex, containerRef }
}

