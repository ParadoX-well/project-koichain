import { createBrowserClient } from '@supabase/ssr'

// Membuat client Supabase untuk di sisi Browser (Client Components)
//
// PENTING: Opsi `lock` di-override menjadi no-op (langsung jalankan fungsi tanpa antrian).
// Alasannya: Supabase Auth secara default menggunakan `navigator.locks` API untuk
// mencegah race condition antar-tab. Namun, saat tab kembali visible setelah pindah
// aplikasi, Supabase internal menjalankan `_recoverAndRefresh()` yang mengambil lock.
// Jika user lalu navigasi ke halaman lain, `getSession()` di halaman baru juga butuh
// lock yang sama → DEADLOCK → halaman stuck loading sampai di-refresh.
//
// Dengan no-op lock, setiap operasi auth langsung dijalankan tanpa menunggu antrian.
// Ini aman karena aplikasi ini dipakai single-tab (bukan multi-tab editing).
// Cookie storage TETAP aktif (bawaan createBrowserClient) sehingga middleware
// server tetap bisa membaca session untuk proteksi route.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        // Langsung jalankan tanpa navigator.locks — mencegah deadlock
        return await fn()
      },
    },
  }
)