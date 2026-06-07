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

        // Cari user di listUsers (Membutuhkan SERVICE ROLE)
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

        if (authError || !authData || !authData.users) {
             return NextResponse.json({ error: "Gagal mengakses data pengguna." }, { status: 500 });
        }

        const targetEmail = email.toLowerCase().trim();
        const foundUser = authData.users.find(u => u.email === targetEmail);

        if (!foundUser) {
             return NextResponse.json({ error: "Pengguna dengan email tersebut tidak ditemukan." }, { status: 404 });
        }

        const userId = foundUser.id;

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

        // Ambil nama dari profil
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, store_name')
            .eq('id', userId)
            .single();

        const userName = profile?.store_name || profile?.full_name || 'Tanpa Nama';

        return NextResponse.json({ wallet_address: wallets.wallet_address, user_name: userName });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
