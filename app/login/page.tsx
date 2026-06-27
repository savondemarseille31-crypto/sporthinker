'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    router.push('/signaux')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />
      <div className="px-6 py-12 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Connexion</h1>
        <p className="text-gray-400 text-sm mb-8">Accède à tes signaux, tes values et ton suivi.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" autoComplete="email"
            className="w-full bg-[#14171f] border border-[#262b36] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe" autoComplete="current-password"
            className="w-full bg-[#14171f] border border-[#262b36] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
          />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors">
            {loading ? '…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Pas encore de compte ? <Link href="/signup" className="text-violet-400 hover:underline">Créer un compte</Link>
        </p>
      </div>
    </main>
  )
}
