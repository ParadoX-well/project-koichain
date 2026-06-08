'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Hook untuk cek sesi auth dengan reliable.
 * Pakai onAuthStateChange (bukan getUser/getSession) agar tidak
 * stuck loading saat client-side navigation di Next.js.
 * 
 * @param redirectTo - Halaman tujuan jika tidak login (default: '/login')
 * @returns { user, loading } - User object dan status loading
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Ambil sesi awal secara eksplisit agar tidak nyangkut
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (!session?.user) {
          router.replace(redirectTo);
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    });

    // Listener untuk perubahan Auth (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace(redirectTo);
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  return { user, loading };
}
