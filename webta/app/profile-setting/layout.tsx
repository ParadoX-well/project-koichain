import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function UserLayout({
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
    .select('is_banned')
    .eq('id', user.id)
    .single()

  // 3. Validasi Banned
  if (profile?.is_banned) {
    redirect('/banned')
  }

  return <>{children}</>
}
