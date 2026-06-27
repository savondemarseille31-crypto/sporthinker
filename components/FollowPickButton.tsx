'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { savePari, getParis, type TypePari } from '@/lib/paris-store'
import type { Signal } from '@/lib/signals'

// Mappe le type de pari d'un signal vers le type Pari de Mes Paris
function mapType(typePari: string): TypePari {
  const t = (typePari ?? '').toLowerCase()
  if (t.includes('under') || t.includes('over') || t.includes('total')) return 'over_under'
  if (t.includes('money') || t.includes('1x2') || t.includes('vainqueur')) return '1X2'
  if (t.includes('buteur')) return 'buteur'
  if (t.includes('double')) return 'double_chance'
  return 'autre'
}

async function isAdded(signal: Signal): Promise<boolean> {
  return (await getParis()).some(p => p.match === signal.match && p.selection === signal.pari)
}

// Bouton « Je suis ce pick » — ajoute le pari à « Mes Paris » (Supabase si connecté, localStorage sinon).
// La mise est vide (saisie par l'utilisateur sur /paris). Une fois ajouté, devient un lien vers /paris.
export default function FollowPickButton({ signal }: { signal: Signal }) {
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    let active = true
    isAdded(signal).then(added => { if (active && added) setState('saved') })
    return () => { active = false }
  }, [signal])

  async function handle(e: React.MouseEvent) {
    e.preventDefault()
    try {
      if (!(await isAdded(signal))) {
        const cote = signal.coteRef ?? 2.0
        const prob = signal.pImpl != null
          ? Math.round(signal.pImpl * 100)
          : parseFloat((100 / cote).toFixed(1))
        await savePari({
          match: signal.match,
          competition: signal.tournament ?? signal.sport,
          typePari: mapType(signal.typePari),
          selection: signal.pari,
          coteStake: cote,
          probEstimee: prob,
          mise: 0, // l'utilisateur saisit lui-même le montant sur /paris
          statut: 'en_cours',
          sport: signal.sport,
          dateMatch: signal.date,
        })
      }
      setState((await isAdded(signal)) ? 'saved' : 'error')
    } catch (err) {
      console.error('[FollowPick] échec ajout à Mes Paris', err)
      setState('error')
    }
  }

  if (state === 'saved') {
    return (
      <Link
        href="/paris"
        className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors"
      >
        ✓ Voir dans Mes Paris →
      </Link>
    )
  }

  return (
    <button
      onClick={handle}
      className={`flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-colors ${
        state === 'error'
          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
          : 'bg-violet-500 hover:bg-violet-400 text-black'
      }`}
    >
      {state === 'error' ? '⚠️ Échec — réessayer' : '+ Je suis ce pick'}
    </button>
  )
}
