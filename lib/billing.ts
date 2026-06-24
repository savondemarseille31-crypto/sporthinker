import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from './stripe'

function adminDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

type Plan = 'monthly' | 'annual'

function priceFor(plan: Plan): string | undefined {
  return plan === 'annual' ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY
}

// Crée une session de paiement Stripe Checkout et renvoie son URL.
export async function createCheckoutSession(params: {
  userId: string
  email?: string | null
  plan: Plan
  origin: string
}): Promise<string> {
  const priceId = priceFor(params.plan)
  if (!priceId) throw new Error(`Prix Stripe non configuré (${params.plan})`)
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: params.email ?? undefined,
    client_reference_id: params.userId,
    metadata: { user_id: params.userId, plan: params.plan },
    subscription_data: { metadata: { user_id: params.userId, plan: params.plan } },
    allow_promotion_codes: true, // codes promo « membres fondateurs »
    success_url: `${params.origin}/signaux?abonnement=ok`,
    cancel_url: `${params.origin}/abonnement?annule=1`,
  })
  if (!session.url) throw new Error('Session Stripe sans URL')
  return session.url
}

// Lien vers le portail client Stripe (gestion / annulation).
export async function createPortalSession(customerId: string, origin: string): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/compte`,
  })
  return session.url
}

// Traite un événement webhook Stripe → met à jour la table subscriptions (source de vérité).
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      const userId = (s.metadata?.user_id ?? s.client_reference_id) || null
      if (userId && s.subscription) {
        const sub = await getStripe().subscriptions.retrieve(s.subscription as string)
        await upsertSub(userId, sub)
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (userId) await upsertSub(userId, sub)
      break
    }
  }
}

async function upsertSub(userId: string, sub: Stripe.Subscription): Promise<void> {
  const item = sub.items.data[0]
  const plan = item?.price.id === process.env.STRIPE_PRICE_ANNUAL ? 'annual' : 'monthly'
  // current_period_end : au niveau abonnement (anciennes API) ou au niveau item (API récentes).
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
    ?? (item as unknown as { current_period_end?: number })?.current_period_end
  const { error } = await adminDb().from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    plan,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  })
  // On lève l'erreur pour qu'elle remonte (webhook 500 → Stripe réessaie, et c'est visible dans les logs).
  if (error) throw new Error(`upsert subscriptions a échoué: ${error.message}`)
}
