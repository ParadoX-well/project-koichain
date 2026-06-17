import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const supabaseAuth = createServerClient(supabaseUrl!, supabaseAnonKey!, {
            cookies: { getAll() { return cookieStore.getAll() }, setAll() {} }
        });

        const { data: { session } } = await supabaseAuth.auth.getSession();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);
        const { action, payload } = await request.json();

        if (action === 'create') {
            const { error } = await supabaseAdmin.from('news').insert(payload);
            if (error) throw error;
            return NextResponse.json({ success: true });
        } 
        else if (action === 'update') {
            const { id, ...updates } = payload;
            const { error } = await supabaseAdmin.from('news').update(updates).eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else if (action === 'delete') {
            const { id } = payload;
            const { error } = await supabaseAdmin.from('news').delete().eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
