import { createSupabaseServerClient } from './server'

// Utilisateur courant (côté serveur) — null si non connecté.
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Rôle de l'utilisateur courant. null si non connecté, sinon 'admin' | 'user'.
// Lit la table profiles (RLS : chacun lit sa propre ligne).
export async function getCurrentRole(): Promise<'admin' | 'user' | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return (data?.role as 'admin' | 'user') ?? 'user'
}
