'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTrackedSignals, saveMultipleSignals, isAlreadyTracked } from '@/lib/signal-tracker'
import type { Signal } from '@/lib/signals'

export default function SignalSaveBar({ signals }: { signals: Signal[] }) {
  const [trackedCount, setTrackedCount] = useState(0)
  const [justSaved, setJustSaved] = useState(false)

  const trackable = signals.filter(s => s.force === 'fort' || s.force === 'modéré')
  const forts = trackable.filter(s => s.force === 'fort').length
  const moderés = trackable.filter(s => s.force === 'modéré').length

  useEffect(() => {
    setTrackedCount(getTrackedSignals().length)
    // Si tous les signaux du jour sont déjà enregistrés
    const allTracked = trackable.every(s => isAlreadyTracked(s.id, s.date))
    if (allTracked && trackable.length > 0) setJustSaved(true)
  }, [])

  function handleSave() {
    const saved = saveMultipleSignals(trackable)
    setTrackedCount(prev => prev + saved)
    setJustSaved(true)
  }

  if (trackable.length === 0) return null

  return (
    <div className="bg-[#14171f] border border-violet-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="text-3xl">📊</span>
        <div>
          <h3 className="font-bold text-white">Suivi de l&apos;algorithme</h3>
          <p className="text-sm text-gray-400">
            {forts} fort{forts > 1 ? 's' : ''} · {moderés} modéré{moderés > 1 ? 's' : ''} détectés aujourd&apos;hui
            {trackedCount > 0 && (
              <span className="ml-2 text-violet-400">· {trackedCount} signal{trackedCount > 1 ? 's' : ''} en suivi total</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-3 shrink-0">
        {justSaved ? (
          <span className="text-violet-400 font-semibold text-sm py-2.5 px-1">✓ Enregistrés</span>
        ) : (
          <button
            onClick={handleSave}
            className="bg-violet-500 hover:bg-violet-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Enregistrer ({trackable.length})
          </button>
        )}
        <Link
          href="/signaux/suivi"
          className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          Voir le suivi →
        </Link>
      </div>
    </div>
  )
}
