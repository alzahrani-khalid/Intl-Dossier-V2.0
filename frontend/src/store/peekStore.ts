/**
 * peekStore — cross-tree peek registry for the layout-mounted DossierDrawer (F23 / AFF-01).
 *
 * The DossierDrawer mounts at the _protected layout (routes/_protected.tsx:83) — OUTSIDE
 * any list route's component tree (per 87-RESEARCH F23 seams). A list page and the drawer
 * therefore cannot share React context, so this Zustand store is the channel between them:
 * a list page registers its loaded id window + FULL filtered total + page offset, and the
 * drawer's usePeekPaging hook reads it to compute the counter and prev/next affordances.
 *
 * Ephemeral by design — NO persist middleware (contrast store/uiStore.ts). Peek context
 * dies with the list navigation; a fresh open from a non-list surface (e.g. a dashboard
 * widget) must find an empty registry so the drawer shows no counter.
 *
 * Analog: components/copilot/useCopilotDrawer.ts (the same _protected-mount coordination
 * problem solved with a tiny Zustand store).
 */
import { create } from 'zustand'

/** A list page's registration of its loaded window into the full filtered result set. */
export interface PeekRegistration {
  /** Ordered ids of the currently loaded window (one server page, or several after paging). */
  ids: string[]
  /** Drawer type of the surface ('country' | ... | 'commitment'). */
  type: string
  /** FULL filtered count — NOT ids.length. Drives the counter total + cross-page canNext. */
  total: number
  /** Index of ids[0] within the full filtered list (0 on the first page). */
  pageOffset: number
  /** Neighbor-page loader; page is 1-based. Absent when the surface is single-page. */
  fetchPage?: (page: number) => Promise<string[]>
  /** Rows per server page — maps a global index to a 1-based page for fetchPage. Default 20. */
  pageSize?: number
}

export interface PeekState extends PeekRegistration {
  /** Replace the whole registration (no merge with the prior window). */
  register: (reg: PeekRegistration) => void
  /** Append (direction 'next') or prepend (direction 'prev') a neighbor page's ids contiguously. */
  extendWindow: (ids: string[], direction: 'next' | 'prev') => void
  /** Reset to the empty registry — no window, total 0. */
  clear: () => void
  /** Global 0-based position of id (pageOffset + indexOf), or null when absent from the window. */
  positionOf: (id: string) => number | null
  /** True when a previous row exists globally (position > 0). */
  canPrev: (id: string) => boolean
  /** True when a next row exists globally (position < total - 1) — TRUE across page edges. */
  canNext: (id: string) => boolean
}

const EMPTY: PeekRegistration = {
  ids: [],
  type: '',
  total: 0,
  pageOffset: 0,
  fetchPage: undefined,
  pageSize: undefined,
}

export const usePeekStore = create<PeekState>((set, get) => ({
  ...EMPTY,

  register: (reg): void => set({ ...EMPTY, ...reg }),

  extendWindow: (ids, direction): void =>
    set((state) => {
      if (ids.length === 0) return state
      if (direction === 'next') {
        return { ids: [...state.ids, ...ids] }
      }
      // Prepend: the window now starts `ids.length` rows earlier — shift pageOffset back
      // so positionOf stays anchored to the full filtered list.
      return {
        ids: [...ids, ...state.ids],
        pageOffset: Math.max(0, state.pageOffset - ids.length),
      }
    }),

  clear: (): void => set({ ...EMPTY }),

  positionOf: (id): number | null => {
    const { ids, pageOffset } = get()
    const idx = ids.indexOf(id)
    return idx === -1 ? null : pageOffset + idx
  },

  canPrev: (id): boolean => {
    const pos = get().positionOf(id)
    return pos !== null && pos > 0
  },

  canNext: (id): boolean => {
    const pos = get().positionOf(id)
    return pos !== null && pos < get().total - 1
  },
}))
