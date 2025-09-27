import React, { useEffect, useState } from 'react'

type ExportStatus = {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  download_url?: string
  file_size_bytes?: number
  error_message?: string
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-auth-token' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Failed ${res.status}`)
  return res.json() as Promise<T>
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: 'Bearer test-auth-token' } })
  if (!res.ok) throw new Error(`Failed ${res.status}`)
  return res.json() as Promise<T>
}

export default function ExportDialog() {
  const [reqId, setReqId] = useState<string | null>(null)
  const [status, setStatus] = useState<ExportStatus | null>(null)
  const [format, setFormat] = useState<'csv' | 'json' | 'excel'>('csv')

  const startExport = async () => {
    const resp = await postJSON<{ id: string; status: string }>(`/export`, { resource_type: 'users', format })
    setReqId(resp.id)
  }

  useEffect(() => {
    if (!reqId) return
    let stop = false
    const tick = async () => {
      try {
        const s = await getJSON<ExportStatus>(`/export/${reqId}`)
        if (!stop) setStatus(s)
        if (s.status === 'completed' || s.status === 'failed') return
        setTimeout(tick, 1000)
      } catch {
        setTimeout(tick, 1500)
      }
    }
    tick()
    return () => {
      stop = true
    }
  }, [reqId])

  return (
    <div style={{ padding: 8 }}>
      <h3>Export Data</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={format} onChange={e => setFormat(e.target.value as any)}>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="excel">Excel</option>
        </select>
        <button onClick={startExport}>Start Export</button>
      </div>
      {status && (
        <div style={{ marginTop: 8 }}>
          <div>Status: {status.status}</div>
          {typeof status.progress === 'number' && <div>Progress: {status.progress}%</div>}
          {status.status === 'completed' && status.download_url && (
            <a href={`/export/${status.id}/download`} target="_blank" rel="noreferrer">Download</a>
          )}
          {status.status === 'failed' && <div>Error: {status.error_message}</div>}
        </div>
      )}
    </div>
  )
}

