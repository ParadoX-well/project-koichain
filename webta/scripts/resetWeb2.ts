import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Muat variabel dari .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetWeb2() {
  console.log("Memulai proses reset Web2 (Supabase)...");

  // 1. Reset Total Transfers di tabel profiles menjadi 0
  console.log("Mereset total_transfers di tabel profiles...");
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ total_transfers: 0 })
    .gte('total_transfers', 0); // Update semua baris

  if (profileError) {
    console.error("❌ Gagal mereset profiles:", profileError);
  } else {
    console.log("✅ Berhasil mereset total_transfers ke 0");
  }

  // 2. Hapus semua sertifikat katalog di web2 (karena Blockchain direset)
  console.log("Menghapus katalog koi_certificates di Web2...");
  const { error: koiError } = await supabase
    .from('koi_certificates')
    .delete()
    .not('koi_id', 'is', null); // Hapus semua baris yang koi_id-nya tidak null (semua data)

  if (koiError) {
    console.error("❌ Gagal menghapus koi_certificates:", koiError);
  } else {
    console.log("✅ Berhasil membersihkan katalog koi_certificates");
  }

  console.log("🎉 Reset Web2 Selesai!");
}

resetWeb2();
