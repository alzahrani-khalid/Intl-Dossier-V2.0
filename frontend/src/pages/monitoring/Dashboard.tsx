/**
 * MonitoringDashboard — the SPA page behind /monitoring (DEAD-04, RULING-P95-01).
 *
 * The two calls below are the plan's mechanically-enumerated caller population. They used to be
 * bare relative fetches against the old monitoring prefix with NO Authorization header, answered
 * in dev only by a Vite proxy entry that also swallowed the browser's document request for that
 * same prefix. That entry is gone; the API moved under /api/monitoring, which the generic /api
 * proxy carries in dev and nginx `location /api/` carries in prod — both callers resolve in both.
 *
 * `apiGet(..., { baseUrl: 'express' })` attaches the session JWT that /api/monitoring/alerts
 * requires (requireAuthHeader). Each widget owns its own error state: a rejected query renders
 * QueryErrorState inline while its sibling still renders data. Before this, the page had NO error
 * branch at all — a backend-absent response showed "Loading health..." forever.
 */
import { useQuery } from '@tanstack/react-query'

import { QueryErrorState } from '@/components/error-states/QueryErrorState'
import { apiGet } from '@/lib/api-client'

type HealthService = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency_ms: number
  last_check: string
}
type HealthResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, HealthService>
}

type Alert = {
  id: string
  name: string
  name_ar: string
  condition: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: string[]
  is_active: boolean
  acknowledged?: boolean
}

export default function MonitoringDashboard() {
  const {
    data: health,
    isError: healthIsError,
    isFetching: healthIsFetching,
    refetch: refetchHealth,
  } = useQuery<HealthResponse>({
    queryKey: ['monitoring-health'],
    queryFn: () => apiGet<HealthResponse>('/api/monitoring/health', { baseUrl: 'express' }),
    refetchInterval: 5000,
  })

  const {
    data: alerts,
    isError: alertsIsError,
    isFetching: alertsIsFetching,
    refetch: refetchAlerts,
  } = useQuery<Alert[]>({
    queryKey: ['monitoring-alerts'],
    queryFn: () => apiGet<Alert[]>('/api/monitoring/alerts', { baseUrl: 'express' }),
    refetchInterval: 10000,
  })

  return (
    <div style={{ padding: 16 }}>
      <h1>Monitoring Dashboard</h1>
      <section>
        <h2>Health</h2>
        {healthIsError && (
          <QueryErrorState
            variant="inline"
            testId="monitoring-health-error"
            onRetry={() => void refetchHealth()}
            isRetrying={healthIsFetching}
          />
        )}
        {!healthIsError && !health && <p>Loading health...</p>}
        {!healthIsError && health && (
          <div>
            <p>Overall: {health.status}</p>
            <ul>
              {Object.entries(health.services).map(([name, svc]) => (
                <li key={name}>
                  <strong>{name}</strong>: {svc.status} ({svc.latency_ms} ms)
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section>
        <h2>Alerts</h2>
        {alertsIsError && (
          <QueryErrorState
            variant="inline"
            testId="monitoring-alerts-error"
            onRetry={() => void refetchAlerts()}
            isRetrying={alertsIsFetching}
          />
        )}
        {!alertsIsError && !alerts && <p>Loading alerts...</p>}
        {!alertsIsError && alerts && alerts.length === 0 && <p>No alerts configured</p>}
        {!alertsIsError && alerts && alerts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Severity</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.severity}</td>
                  <td>{a.is_active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
