import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        // --- 1. OTENTIKASI (SECURITY FIX) ---
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
        const { koiId, newWallet, newSize, newPhotoUrl, newCondition } = await request.json();
        
        if (!koiId) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        // Bypassing RLS menggunakan Service Role Key agar bisa update data ownership walaupun akun pentransfer bukan Breeder aslinya

        // Bypassing RLS menggunakan Service Role Key agar bisa update data ownership walaupun akun pentransfer bukan Breeder aslinya
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const updatePayload: any = {};

        if (newWallet) {
            updatePayload.wallet_address = newWallet.toLowerCase();
        }

        if (newSize) {
            updatePayload.size = parseInt(newSize);
        }

        if (newPhotoUrl) {
            updatePayload.photo_url = newPhotoUrl;
        }

        if (newCondition) {
            updatePayload.condition = newCondition;
        }

        // Simpan waktu pembaruan terakhir agar bisa naik ke atas list Semua Koi
        updatePayload.updated_at = new Date().toISOString();

        const { error: sbError } = await supabaseAdmin
            .from('koi_certificates')
            .update(updatePayload)
            .eq('koi_id', koiId);

        if (sbError) {
            return NextResponse.json({ error: sbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
