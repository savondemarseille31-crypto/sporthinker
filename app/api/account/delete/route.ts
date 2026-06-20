import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// RGPD — droit à l'effacement. Supprime le compte de l'utilisateur courant.
// Les données liées (profiles, user_bets, user_bankroll) sont effacées par ON DELETE CASCADE.
export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // La suppression d'un utilisateur nécessite l'API admin (clé service role, serveur uniquement).
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account/delete] error:', error.message)
    return NextResponse.json({ error: 'Échec de la suppression' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
