import { getCurrentRole } from '@/lib/supabase/user'

export type Entitlement = { premium: boolean }

// Détermine si l'utilisateur courant a accès au contenu premium.
// Pour l'instant : premium = admin. W4 ajoutera « OU abonnement Stripe actif ».
export async function getEntitlement(): Promise<Entitlement> {
  const role = await getCurrentRole()
  return { premium: role === 'admin' }
}
