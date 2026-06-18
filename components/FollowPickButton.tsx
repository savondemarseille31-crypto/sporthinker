'use client'

import { useState } from 'react'
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

function alreadyAdded(signal: Signal): boolean {
  return getParis().some(p => p.match === signal.match && p.selection === signal.pari)
}

// Bouton « Je suis ce pick » — ajoute le pari à « Mes Paris » (mise + bankroll + Kelly).
// La mise est pré-remplie par Kelly quand une probabilité modèle est disponible (signal.pImpl) ;
// sinon mise = 0, à renseigner par l'utilisateur sur /paris. localStorage aujourd'hui → Supabase en W3.
export default function FollowPickButton({ signal }: { signal: Signal }) {
  const [state, setState] = useState<'idle' | 'saved' | 'error'>(
    () => (alreadyAdded(signal) ? 'saved' : 'idle'),
  )

  function handle(e: React.MouseEvent) {
    e.preventDefault()
    try {
      if (!alreadyAdded(signal)) {
        const cote = signal.coteRef ?? 2.0
        // proba estimée : modèle si dispo (pImpl), sinon proba implicite de la cote
        const prob = signal.pImpl != null
          ? Math.round(signal.pImpl * 100)
          : parseFloat((100 / cote).toFixed(1))
        savePari({
          match: signal.match,
          competition: signal.tournament ?? signal.sport,
          typePari: mapType(signal.typePari),
          selection: signal.pari,
          coteStake: cote,
          probEstimee: prob,
          mise: 0, // l'utilisateur saisit lui-même le montant sur /paris
          statut: 'en_cours',
        })
      }
      setState(alreadyAdded(signal) ? 'saved' : 'error')
    } catch (err) {
      console.error('[FollowPick] échec ajout à Mes Paris', err)
      setState('error')
    }
  }

  if (state === 'saved') {
    return (
      <Link
        href="/paris"
        className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
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
          : 'bg-emerald-500 hover:bg-emerald-400 text-black'
      }`}
    >
      {state === 'error' ? '⚠️ Échec — réessayer' : '+ Je suis ce pick'}
    </button>
  )
}
