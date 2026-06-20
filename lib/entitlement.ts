import { createSupabaseServerClient } from '@/lib/supabase/server'

export type Entitlement = { premium: boolean }

// Premium = compte admin OU abonnement Stripe actif.
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { premium: false }

  // Admin → premium
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role === 'admin') return { premium: true }

  // Abonnement actif → premium
  const { data: sub } = await supabase
    .from('subscriptions').select('status, current_period_end').eq('user_id', user.id).maybeSingle()
  const active = !!sub
    && (sub.status === 'active' || sub.status === 'trialing')
    && (!sub.current_period_end || new Date(sub.current_period_end) > new Date())

  return { premium: active }
}
