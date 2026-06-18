'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null); setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) { setErr(error.message); return }
    if (data.session) { router.push('/signaux'); router.refresh() }
    else setMsg('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="px-6 py-12 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
        <p className="text-gray-400 text-sm mb-8">Gratuit — accède au track record, 1 signal/jour et au calculateur.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" autoComplete="email"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
          />
          <input
            type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe (6 caractères min.)" autoComplete="new-password"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
          />
          {err && <p className="text-sm text-red-400">{err}</p>}
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors">
            {loading ? '…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Déjà un compte ? <Link href="/login" className="text-emerald-400 hover:underline">Se connecter</Link>
        </p>
        <p className="text-xs text-gray-600 mt-4">
          En créant un compte, tu acceptes nos <Link href="/legal/cgu" className="underline">CGU</Link> et notre{' '}
          <Link href="/legal/confidentialite" className="underline">politique de confidentialité</Link>. 18+.
        </p>
      </div>
    </main>
  )
}
