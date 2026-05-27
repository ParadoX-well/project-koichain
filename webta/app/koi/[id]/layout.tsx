import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabase';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Decode ID dari URL
  const unwrappedParams = await params;
  const id = decodeURIComponent(unwrappedParams.id);
  
  // Ambil data dari Supabase (Supabase bisa diakses Server-Side dengan sangat cepat)
  const { data: koi } = await supabase
    .from('koi_certificates')
    .select('*')
    .eq('koi_id', id)
    .single();

  if (!koi) {
    return {
      title: 'Sertifikat Tidak Ditemukan - KoiChain ID',
      description: 'Sertifikat Koi tidak ditemukan di database kami.',
    }
  }

  // Jika data ada, buat meta tags dinamis!
  return {
    title: `Sertifikat Resmi: ${koi.variety} (${id})`,
    description: `Sertifikat Digital Web3 untuk Koi jenis ${koi.variety} berukuran ${koi.size || '-'} cm. Diverifikasi permanen dan aman di jaringan Blockchain.`,
    openGraph: {
      title: `Sertifikat Web3: ${koi.variety} - ${id}`,
      description: `Bukti kepemilikan dan silsilah asli Koi jenis ${koi.variety}. Cek keaslian dan lacak riwayat kepemilikannya di sini.`,
      images: [
        {
          url: koi.photo_url || '/logo-koichain.jpeg',
          width: 800,
          height: 800,
          alt: `Foto Ikan Koi ${koi.variety}`,
        },
      ],
      type: 'website',
      siteName: 'KoiChain ID Blockchain',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Sertifikat Web3: ${koi.variety}`,
      description: `Sertifikat asli tercatat di Blockchain untuk ${koi.variety}.`,
      images: [koi.photo_url || '/logo-koichain.jpeg'],
    },
  }
}

// Layout ini hanya bertugas menyuntikkan Meta Tags ke dalam halaman page.tsx (Client Component)
export default function KoiDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
