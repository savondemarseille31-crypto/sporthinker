'use client'
import { useEffect } from 'react'
import Header from '@/components/Header'

export default function SelectionsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[selections] page error:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="px-6 py-16 max-w-xl mx-auto text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold mb-2">Erreur de chargement</h1>
        <p className="text-gray-400 text-sm mb-2">
          {error.message || 'Une erreur serveur est survenue.'}
        </p>
        {error.digest && (
          <p className="text-gray-600 text-xs mb-6 font-mono">{error.digest}</p>
        )}
        <button
          onClick={unstable_retry}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-2 rounded-xl transition-colors"
        >
          Réessayer
        </button>
      </div>
    </main>
  )
}
