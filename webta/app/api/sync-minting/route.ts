import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        // --- 1. OTENTIKASI ---
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) { 
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (error) {}
                }
            }
        });

        const { data: { session } } = await supabaseAuth.auth.getSession();
        
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized. Anda harus login." }, { status: 401 });
        }

        // --- 2. LOGIKA UTAMA ---
        const { koiId, walletAddress, variety, size, photoUrl, spawningSessionId, breederIdOverride } = await request.json();
        
        if (!koiId) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        // Bypassing RLS menggunakan Service Role Key agar data pasti masuk
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const breederId = breederIdOverride || session.user.id;

        const payload = {
            koi_id: koiId,
            breeder_id: breederId,
            wallet_address: walletAddress.toLowerCase(),
            variety: variety,
            size: size ? parseInt(size) : null,
            photo_url: photoUrl || '',
            spawning_session_id: spawningSessionId || null,
            updated_at: new Date().toISOString()
        };

        const { error: sbError } = await supabaseAdmin
            .from('koi_certificates')
            .upsert(payload);

        if (sbError) {
            return NextResponse.json({ error: sbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
