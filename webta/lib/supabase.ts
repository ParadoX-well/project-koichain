import { createBrowserClient } from '@supabase/ssr'

// Membuat client Supabase untuk di sisi Browser (Client Components)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)