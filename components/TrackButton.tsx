'use client'
import { useState, useEffect } from 'react'
import { isTracked, addTrackedBet, type TrackedBet } from '@/lib/selections-store'

type Props = Omit<TrackedBet, 'statut' | 'trackedAt'>

export default function TrackButton(props: Props) {
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    setTracked(isTracked(props.id))
  }, [props.id])

  function handleClick() {
    addTrackedBet(props)
    setTracked(true)
  }

  if (tracked) {
    return (
      <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold py-2.5 rounded-xl">
        ✓ Suivi
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
    >
      📌 Suivre ce pari
    </button>
  )
}
