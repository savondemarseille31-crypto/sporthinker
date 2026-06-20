import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/billing'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connecte-toi pour t\'abonner' }, { status: 401 })

  let plan: 'monthly' | 'annual' = 'monthly'
  try { const b = await req.json(); if (b?.plan === 'annual') plan = 'annual' } catch { /* défaut monthly */ }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  try {
    const url = await createCheckoutSession({ userId: user.id, email: user.email, plan, origin })
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur Stripe' }, { status: 500 })
  }
}
