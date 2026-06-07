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
    // Listener untuk perubahan atau initial event dari Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace(redirectTo);
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, redirectTo]);

  return { user, loading };
}
