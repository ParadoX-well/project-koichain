import { createClient } from '@supabase/supabase-js';

// Fungsi bantuan untuk membaca/menulis cookie di sisi klien dengan dukungan Chunking (jika > 4KB)
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  let value = '';
  // @supabase/ssr terkadang menyimpan cookie tanpa chunk (nama asli) 
  // atau langsung di-chunk mulai dari .0, .1, dst.
  
  // Cek format nama asli dulu
  const matchAsli = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (matchAsli) {
    value = decodeURIComponent(matchAsli[2]);
  } else {
    // Jika tidak ada nama asli, cek format chunk (.0, .1, dst)
    let i = 0;
    while (true) {
      const chunkName = `${name}.${i}`;
      const matchChunk = document.cookie.match(new RegExp('(^| )' + chunkName + '=([^;]+)'));
      if (!matchChunk) break;
      value += decodeURIComponent(matchChunk[2]);
      i++;
    }
  }
  return value;
};

const setCookie = (name: string, value: string, days: number) => {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
  const expires = `expires=${d.toUTCString()}`;
  
  // Pisahkan string menjadi potongan maksimal 3000 karakter agar aman dari limit 4KB browser
  const chunkSize = 3000;
  let i = 0;
  for (let offset = 0; offset < value.length; offset += chunkSize) {
    const chunkName = i === 0 ? name : `${name}.${i}`;
    const chunkValue = encodeURIComponent(value.substring(offset, offset + chunkSize));
    document.cookie = `${chunkName}=${chunkValue};path=/;${expires};SameSite=Lax;Secure`;
    i++;
  }
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  // Hapus nama asli
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=Lax;Secure`;
  
  // Hapus kemungkinan chunk (.0 sampai .5 cukup aman)
  for (let i = 0; i < 5; i++) {
    document.cookie = `${name}.${i}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=Lax;Secure`;
  }
};

// Membuat client Supabase standar (Bebas dari bug singleton SSR)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: {
        getItem: (key) => getCookie(key),
        setItem: (key, value) => setCookie(key, value, 365),
        removeItem: (key) => deleteCookie(key),
      },
    },
  }
);