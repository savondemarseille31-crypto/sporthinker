import Stripe from 'stripe'

// Client Stripe (serveur uniquement). Nullable : l'app fonctionne même sans clé
// configurée (le checkout/webhook renverra une erreur claire si non configuré).
const key = process.env.STRIPE_SECRET_KEY
export const stripe = key ? new Stripe(key) : null

export function getStripe(): Stripe {
  if (!stripe) throw new Error('STRIPE_SECRET_KEY non configuré')
  return stripe
}
