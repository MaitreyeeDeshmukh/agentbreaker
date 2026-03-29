import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — used in Client Components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          mode: 'prompt' | 'code' | 'browser' | 'website'
          security_score: number
          passed: number
          failed: number
          total_tests: number
          label: string
          report_json: Record<string, unknown>
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'created_at'>
      }
    }
  }
}
