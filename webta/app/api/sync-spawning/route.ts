import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    // CREATE NEW SPAWNING SESSION
    try {
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { action, payload } = await request.json();

        if (action === 'create') {
            const { breeder_id, session_code, mother_koi_id, spawn_date, location, notes, fathers } = payload;
            
            // Insert Session
            const { data: newSession, error: sessionError } = await supabaseAdmin
                .from('spawning_sessions')
                .insert({
                    breeder_id, session_code, mother_koi_id, spawn_date, location, notes
                })
                .select()
                .single();

            if (sessionError) throw sessionError;

            // Insert Fathers
            if (fathers && fathers.length > 0) {
                const { error: fatherError } = await supabaseAdmin
                    .from('spawning_fathers')
                    .insert(fathers.map((f: string) => ({ session_id: newSession.id, father_koi_id: f })));
                if (fatherError) throw fatherError;
            }

            return NextResponse.json({ success: true, session: newSession });
        } 
        else if (action === 'update_count') {
            const { session_id, successCount } = payload;
            
            // Get current count
            const { data: curr } = await supabaseAdmin.from('spawning_sessions').select('offspring_count').eq('id', session_id).single();
            const currentCount = curr?.offspring_count || 0;

            const { error } = await supabaseAdmin
                .from('spawning_sessions')
                .update({ offspring_count: currentCount + successCount })
                .eq('id', session_id);
                
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
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

        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);
        
        const { error } = await supabaseAdmin.from('spawning_sessions').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
