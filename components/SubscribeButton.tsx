'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Bouton d'abonnement : si connecté → Stripe Checkout ; sinon → inscription d'abord.
export default function SubscribeButton({
  plan = 'monthly',
  className,
  children,
}: {
  plan?: 'monthly' | 'annual'
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function go() {
    setLoading(true)
    const { data: { user } } = await createSupabaseBrowserClient().auth.getUser()
    if (!user) { router.push('/signup?plan=premium'); return }
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      throw new Error(data.error ?? 'Erreur')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur. Réessaie plus tard.')
      setLoading(false)
    }
  }

  return (
    <button onClick={go} disabled={loading} className={className}>
      {loading ? '…' : children}
    </button>
  )
}
