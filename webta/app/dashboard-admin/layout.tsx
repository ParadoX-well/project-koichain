import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Dapatkan user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Ambil profil user dari database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', user.id)
    .single()

  // 3. Validasi Role & Banned
  if (!profile || profile.is_banned || profile.role !== 'admin') {
    // Jika bukan admin, tendang ke dashboard user
    redirect('/profile-setting')
  }

  return <>{children}</>
}
