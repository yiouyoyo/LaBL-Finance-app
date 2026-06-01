import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Invoice = {
  id: string
  date_purchased: string | null
  who_purchased: string | null
  account: string | null
  item_purchased: string | null
  amount: number | null
  purpose: string | null
  travel_type: string | null
  proof_file_path: string | null
  proof_file_name: string | null
  created_at: string
}

export const ACCOUNT_OPTIONS = [
  'ProNET',
  'ProCAN',
  'Research',
]

export const TRAVEL_OPTIONS = [
  'Travel related',
  'Non-travel related',
]
