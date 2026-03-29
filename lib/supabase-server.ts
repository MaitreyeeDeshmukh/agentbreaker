import { createClient } from '@supabase/supabase-js'

// Server-side client — safe to use in API routes and Server Components
// Uses the service role key for full access (bypasses RLS when needed)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}
