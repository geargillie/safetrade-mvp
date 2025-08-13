// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type UserProfile = {
  id: string
  phone?: string
  first_name?: string
  last_name?: string
  phone_verified: boolean
  city?: string
  zip_code?: string
  trust_score: number
  created_at: string
}
