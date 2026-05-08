import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://zdqrrprjkddlxszmtcmx.supabase.co"
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"

// Client-side (browser) — RLS enforced
export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Server-side (API routes, crons) — bypasses RLS
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY
)
