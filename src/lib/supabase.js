import { createClient } from '@supabase/supabase-js'

// Read Supabase credentials from .env.local
// These are injected at build time by Vite — never hardcode these values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If the env vars are missing or still set to the placeholder string,
// flip on mock mode so the app renders with fake data instead of crashing
export const useMock = !supabaseUrl || supabaseUrl === 'your_supabase_project_url'

// Export a single shared Supabase client used by every page.
// Set to null in mock mode so pages know not to call it.
export const supabase = useMock ? null : createClient(supabaseUrl, supabaseAnonKey)
