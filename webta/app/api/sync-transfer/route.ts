import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { koiId, newWallet, newSize, newPhotoUrl, newCondition } = await request.json();
        
        if (!koiId) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

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
