import { createBrowserClient } from '@supabase/ssr'

// Membuat client Supabase untuk di sisi Browser (Client Components)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GLOBAL FIX: Mencegah bug Supabase JS (SSR) yang hang (queue freeze) 
// saat initial session gagal terpanggil. Ini akan memaksa pengecekan
// dan mencairkan antrian .from() di SELURUH halaman aplikasi.
if (typeof window !== 'undefined') {
  supabase.auth.getSession().catch(() => {});
}