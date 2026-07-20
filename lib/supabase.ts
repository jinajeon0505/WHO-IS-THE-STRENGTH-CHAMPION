import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Voter = {
  id: string
  company: string
  department: string
  name: string
  created_at: string
}

export type Candidate = {
  id: string
  name: string
  title: string | null
  photo_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export type Vote = {
  id: string
  voter_id: string
  candidate_id: string
  created_at: string
  updated_at: string
}
