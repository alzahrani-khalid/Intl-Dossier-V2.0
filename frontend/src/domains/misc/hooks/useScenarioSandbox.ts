/**
 * Scenario Sandbox Hook
 * @module domains/misc/hooks/useScenarioSandbox
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getScenarios as getScenariosApi,
  createScenario as createScenarioApi,
  runScenario as runScenarioApi,
  getScenarioResults,
} from '../repositories/misc.repository'

export const scenarioKeys = {
  all: ['scenario-sandbox'] as const,
  list: (params?: Record<string, unknown>) => [...scenarioKeys.all, 'list', params] as const,
  results: (id: string) => [...scenarioKeys.all, 'results', id] as const,
}

export function useScenarios(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value))
    })
  }

  return useQuery({
    queryKey: scenarioKeys.list(params),
    queryFn: () => getScenariosApi(searchParams),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateScenario(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createScenarioApi(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: scenarioKeys.all }) },
  })
}

export function useRunScenario(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (params: { scenarioId: string; data: Record<string, unknown> }) =>
      runScenarioApi(params.scenarioId, params.data),
  })
}

export function useScenarioResults(scenarioId: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: scenarioId ? scenarioKeys.results(scenarioId) : ['scenario', 'disabled'],
    queryFn: () => (scenarioId ? getScenarioResults(scenarioId) : Promise.resolve(null)),
    enabled: Boolean(scenarioId),
  })
}
