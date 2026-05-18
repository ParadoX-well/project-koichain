import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const cookieStore = await cookies();
    
    // Membuat klien Supabase khusus untuk Server (Route Handler)
    // yang bisa membaca/menulis cookie secara otomatis
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );
    
    // Tukar kode auth dengan session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Login sukses -> arahkan ke dashboard
      return NextResponse.redirect(`${origin}/dashboard-user`);
    }
  }

  // Jika gagal, kembalikan ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}