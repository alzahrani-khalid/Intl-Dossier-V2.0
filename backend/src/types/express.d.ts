import { User } from '../models/user.model'
import { SupabaseClient } from '@supabase/supabase-js'

declare global {
  namespace Express {
    interface Request {
      user?: User
      supabase?: SupabaseClient
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime: Date
      }
    }
  }
}

export {}
