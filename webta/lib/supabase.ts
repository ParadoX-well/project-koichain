import { createClient } from '@supabase/supabase-js';

// Fungsi bantuan untuk membaca/menulis cookie di sisi klien dengan dukungan Chunking (jika > 4KB)
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  let value = '';
  let i = 0;
  while (true) {
    const chunkName = i === 0 ? name : `${name}.${i}`;
    const match = document.cookie.match(new RegExp('(^| )' + chunkName + '=([^;]+)'));
    if (!match) break;
    value += decodeURIComponent(match[2]);
    i++;
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
  let i = 0;
  while (true) {
    const chunkName = i === 0 ? name : `${name}.${i}`;
    const match = document.cookie.match(new RegExp('(^| )' + chunkName + '=([^;]+)'));
    if (!match && i > 0) break; // Berhenti jika tidak ada chunk lagi
    document.cookie = `${chunkName}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=Lax;Secure`;
    if (!match && i === 0) break; 
    i++;
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