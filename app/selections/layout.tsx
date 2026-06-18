import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/supabase/user'

// Garde de rôle : /selections réservé aux comptes role = 'admin'.
export default async function SelectionsLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole()
  if (role === null) redirect('/login?next=/selections')
  if (role !== 'admin') redirect('/')
  return <>{children}</>
}
