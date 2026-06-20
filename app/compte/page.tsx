'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ComptePage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setReady(true)
    })
  }, [])

  async function deleteAccount() {
    if (!confirm('Supprimer définitivement ton compte et toutes tes données (paris, bankroll, suivi) ? Cette action est irréversible.')) return
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) throw new Error()
      await createSupabaseBrowserClient().auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      setErr('Échec de la suppression. Réessaie plus tard.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="px-6 py-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Mon compte</h1>

        {ready && !email && (
          <p className="text-gray-400">
            Tu n&apos;es pas connecté. <Link href="/login" className="text-emerald-400 hover:underline">Se connecter</Link>
          </p>
        )}

        {email && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
              <p className="text-xs text-gray-500 mb-1">Connecté en tant que</p>
              <p className="font-medium">{email}</p>
            </div>

            <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-5">
              <h2 className="font-bold text-red-400 mb-1">Supprimer mon compte</h2>
              <p className="text-sm text-gray-400 mb-4">
                Conformément au RGPD (droit à l&apos;effacement), tu peux supprimer définitivement ton compte et
                toutes tes données (paris, bankroll, suivi). Cette action est <span className="text-gray-200">irréversible</span>.
              </p>
              {err && <p className="text-sm text-red-400 mb-3">{err}</p>}
              <button
                onClick={deleteAccount}
                disabled={loading}
                className="bg-red-500/90 hover:bg-red-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {loading ? 'Suppression…' : 'Supprimer définitivement mon compte'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
