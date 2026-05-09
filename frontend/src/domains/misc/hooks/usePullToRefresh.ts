/**
 * Pull to Refresh Hook
 * @module domains/misc/hooks/usePullToRefresh
 */

import { useMutation } from '@tanstack/react-query'
import { refreshData } from '../repositories/misc.repository'

export function usePullToRefresh() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => refreshData(data),
  })
}
