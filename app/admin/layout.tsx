import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/supabase/user'

// Garde de rôle : /admin réservé aux comptes role = 'admin'.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole()
  if (role === null) redirect('/login?next=/admin')
  if (role !== 'admin') redirect('/')
  return <>{children}</>
}
