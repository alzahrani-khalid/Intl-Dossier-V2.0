import React from 'react'
import { useQuery } from '@tanstack/react-query'

type HealthService = { status: 'healthy' | 'degraded' | 'unhealthy'; latency_ms: number; last_check: string }
type HealthResponse = { status: 'healthy' | 'degraded' | 'unhealthy'; services: Record<string, HealthService> }

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

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Failed ${res.status}`)
  return res.json() as Promise<T>
}

export default function MonitoringDashboard() {
  const { data: health } = useQuery<HealthResponse>({
    queryKey: ['monitoring-health'],
    queryFn: () => fetchJSON<HealthResponse>('/monitoring/health'),
    refetchInterval: 5000
  })

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ['monitoring-alerts'],
    queryFn: () => fetchJSON<Alert[]>('/monitoring/alerts'),
    refetchInterval: 10000
  })

  return (
    <div style={{ padding: 16 }}>
      <h1>Monitoring Dashboard</h1>
      <section>
        <h2>Health</h2>
        {!health && <p>Loading health...</p>}
        {health && (
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
        {!alerts && <p>Loading alerts...</p>}
        {alerts && alerts.length === 0 && <p>No alerts configured</p>}
        {alerts && alerts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Severity</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
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

