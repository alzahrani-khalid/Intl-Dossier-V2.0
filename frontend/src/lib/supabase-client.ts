/**
 * Re-export supabase client with createClient function
 * This maintains compatibility with different import patterns across the codebase
 */

import { supabase as client } from './supabase'
import { createClient as originalCreateClient } from '@supabase/supabase-js'

/**
 * Get the shared supabase client instance
 */
export const createClient = () => client

/**
 * Direct export of the client instance
 */
export const supabase = client

export default client
