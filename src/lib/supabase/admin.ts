import { createClient } from '@supabase/supabase-js'

// NUR in /api/-Routes verwenden, nie im Client!
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
