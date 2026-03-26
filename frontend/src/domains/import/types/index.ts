/**
 * Import Domain Types
 * @module domains/import/types
 */

export interface ImportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number
  processed_rows: number
  error_count: number
  created_at: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
  created_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event: string
  status: 'success' | 'failed'
  response_code: number
  delivered_at: string
}
