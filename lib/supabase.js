import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdqrrprjkddlxszmtcmx.supabase.co'
const supabaseKey = 'sb_publishable__cdXODEiCbsHvycy6uuB_g_SIIgI6YH'

export const supabase = createClient(supabaseUrl, supabaseKey)