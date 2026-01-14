// Watchlist Components Index
// Feature: personal-watchlist

export { WatchButton } from './WatchButton'
export { WatchlistPanel } from './WatchlistPanel'

// Re-export types for convenience
export type {
  WatchableEntityType,
  WatchlistItem,
  WatchlistTemplate,
  WatchPriority,
  AddToWatchlistRequest,
} from '@/types/watchlist.types'

// Re-export hook
export { useWatchlist, useIsEntityWatched, WATCHLIST_KEYS } from '@/hooks/useWatchlist'
