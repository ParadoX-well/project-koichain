import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        
        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const targetEmail = email.toLowerCase().trim();
        
        // PENCARIAN O(1) TINGKAT ENTERPRISE: Langsung tembak ke tabel profiles berdasarkan email.
        // Tabel profiles harus memiliki index UNIQUE untuk kolom 'email' (sudah diatur via SQL)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, store_name')
            .eq('email', targetEmail)
            .single();

        if (profileError || !profile) {
             return NextResponse.json({ error: "Pengguna dengan email tersebut tidak ditemukan." }, { status: 404 });
        }

        const userId = profile.id;

        // Cari dompet utamanya
        const { data: wallets, error: walletError } = await supabase
            .from('user_wallets')
            .select('wallet_address')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false })
            .limit(1)
            .single();

        if (walletError || !wallets) {
             return NextResponse.json({ error: "Pengguna ditemukan, tapi belum menautkan dompet Web3 MetaMask. Harap minta mereka login ke KoiChainID terlebih dahulu." }, { status: 404 });
        }

        const userName = profile.store_name || profile.full_name || 'Tanpa Nama';

        return NextResponse.json({ wallet_address: wallets.wallet_address, user_name: userName });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
