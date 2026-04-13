import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase env vars ontbreken:", { supabaseUrl, supabaseKey })
}

export const supabase = createClient(
  supabaseUrl ?? "https://zdqrrprjkddlxszmtcmx.supabase.co",
  supabaseKey ?? "sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH"
)