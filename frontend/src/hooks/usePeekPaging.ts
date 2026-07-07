/**
 * usePeekPaging — cross-page prev/next paging for the peek DossierDrawer (F23 / AFF-01).
 *
 * Reads the peekStore registry (registered by a list page) and derives the drawer's
 * counter + chevron affordances. Param-agnostic BY DESIGN: `navigateToId` is injected so
 * plan 87-09 can reuse this hook for the CommitmentDrawer's `?commitment=` param without a
 * second copy — the hook never touches the router.
 *
 * Cross-page resolution (RESEARCH Open Q1): the counter total is the FULL filtered count,
 * and stepping past the loaded window edge fetches the neighbor page via the registered
 * `fetchPage` callback, extends the window, then navigates. A best-effort background
 * prefetch fires when the user is within 2 rows of the loaded edge. All page fetches are
 * deduped through a per-page promise map so a prefetch and a click never double-fetch.
 */
import { useCallback, useEffect, useRef } from 'react'
import { usePeekStore } from '@/store/peekStore'

/** Default rows-per-page when a registration omits pageSize (matches the store default). */
const DEFAULT_PAGE_SIZE = 20
/** Prefetch the neighbor page once the current row is within this many rows of the loaded edge. */
const PREFETCH_EDGE = 2

export interface UsePeekPagingResult {
  /** 1-based display position within the full filtered list, or null when not pageable. */
  position: number | null
  /** Full filtered count (the counter's denominator). */
  total: number
  canPrev: boolean
  canNext: boolean
  goPrev: () => void
  goNext: () => void
}

export function usePeekPaging(
  currentId: string | undefined,
  navigateToId: (id: string) => void,
): UsePeekPagingResult {
  // Reactive slices — re-render when the window/total/position change.
  const total = usePeekStore((st) => st.total)
  const globalPos = usePeekStore((st) =>
    currentId !== undefined ? st.positionOf(currentId) : null,
  )
  const canPrev = usePeekStore((st) => (currentId !== undefined ? st.canPrev(currentId) : false))
  const canNext = usePeekStore((st) => (currentId !== undefined ? st.canNext(currentId) : false))

  // Dedup guard: one in-flight (or resolved) promise per page number. Kept on success so
  // the same page never fetches twice; cleared on failure so a later attempt can retry.
  const pagePromisesRef = useRef<Map<number, Promise<string[] | null>>>(new Map())

  const loadPage = useCallback(
    (page: number, direction: 'next' | 'prev'): Promise<string[] | null> => {
      const existing = pagePromisesRef.current.get(page)
      if (existing !== undefined) return existing
      const { fetchPage } = usePeekStore.getState()
      if (fetchPage === undefined) return Promise.resolve(null)
      const promise = fetchPage(page)
        .then((newIds): string[] => {
          usePeekStore.getState().extendWindow(newIds, direction)
          return newIds
        })
        .catch((): null => {
          pagePromisesRef.current.delete(page)
          return null
        })
      pagePromisesRef.current.set(page, promise)
      return promise
    },
    [],
  )

  const goNext = useCallback((): void => {
    void (async (): Promise<void> => {
      if (currentId === undefined) return
      const store = usePeekStore.getState()
      const pos = store.positionOf(currentId)
      if (pos === null || pos >= store.total - 1) return // last row → no-op
      const targetGlobal = pos + 1
      if (targetGlobal < store.pageOffset + store.ids.length) {
        const inWindowId = store.ids[targetGlobal - store.pageOffset] // in loaded window
        if (inWindowId !== undefined) navigateToId(inWindowId)
        return
      }
      const size = store.pageSize ?? DEFAULT_PAGE_SIZE
      const page = Math.floor(targetGlobal / size) + 1
      const newIds = await loadPage(page, 'next')
      if (newIds === null) return // fetch failed → window unchanged, no navigate
      const targetId = newIds[targetGlobal - (page - 1) * size]
      if (targetId !== undefined) navigateToId(targetId)
    })()
  }, [currentId, navigateToId, loadPage])

  const goPrev = useCallback((): void => {
    void (async (): Promise<void> => {
      if (currentId === undefined) return
      const store = usePeekStore.getState()
      const pos = store.positionOf(currentId)
      if (pos === null || pos <= 0) return // first row → no-op
      const targetGlobal = pos - 1
      if (targetGlobal >= store.pageOffset) {
        const inWindowId = store.ids[targetGlobal - store.pageOffset] // in loaded window
        if (inWindowId !== undefined) navigateToId(inWindowId)
        return
      }
      const size = store.pageSize ?? DEFAULT_PAGE_SIZE
      const page = Math.floor(targetGlobal / size) + 1
      const newIds = await loadPage(page, 'prev')
      if (newIds === null) return
      const targetId = newIds[targetGlobal - (page - 1) * size]
      if (targetId !== undefined) navigateToId(targetId)
    })()
  }, [currentId, navigateToId, loadPage])

  // Prefetch-at-edge: when within PREFETCH_EDGE rows of the loaded window's trailing edge and
  // more rows exist beyond it, pull the next page in the background (deduped by loadPage).
  useEffect(() => {
    if (currentId === undefined || globalPos === null) return
    const store = usePeekStore.getState()
    const windowEnd = store.pageOffset + store.ids.length
    if (windowEnd >= store.total) return // nothing more to load
    if (globalPos < windowEnd - PREFETCH_EDGE) return // not near the edge yet
    if (store.fetchPage === undefined) return
    const size = store.pageSize ?? DEFAULT_PAGE_SIZE
    const nextPage = Math.floor(windowEnd / size) + 1
    void loadPage(nextPage, 'next')
  }, [currentId, globalPos, total, loadPage])

  return {
    position: globalPos === null ? null : globalPos + 1,
    total,
    canPrev,
    canNext,
    goPrev,
    goNext,
  }
}
