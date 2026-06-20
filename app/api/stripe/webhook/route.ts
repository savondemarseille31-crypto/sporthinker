import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { handleWebhookEvent } from '@/lib/billing'

// Webhook Stripe → met à jour la table subscriptions (source de vérité des droits).
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'Webhook non configuré' }, { status: 400 })

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  try {
    await handleWebhookEvent(event)
  } catch (e) {
    console.error('[stripe webhook] handler error:', e)
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
