'use client'
import { useRouter } from 'next/navigation'
import { type TrackedBet, type LevelStats } from '@/lib/selections-db'

// ── Config ────────────────────────────────────────────────────────────────────

const NIVEAU_CFG = {
  excellent:   { label: '⚡ Excellent',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  bon:         { label: '✅ Bon',         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  interessant: { label: '🔍 Intéressant', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30'  },
} as const

const STATUT_CFG = {
  en_cours: { label: '⏳ En cours',   color: 'text-yellow-400'  },
  'gagné':  { label: '✅ Gagné',      color: 'text-emerald-400' },
  perdu:    { label: '❌ Perdu',      color: 'text-red-400'     },
} as const

// ── NiveauCard ────────────────────────────────────────────────────────────────

function NiveauCard({ niveau, stats }: { niveau: keyof typeof NIVEAU_CFG; stats: LevelStats }) {
  const cfg = NIVEAU_CFG[niveau]
  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
      <p className={`text-sm font-bold ${cfg.color} mb-3`}>{cfg.label}</p>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className="text-lg font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Suivis</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className={`text-lg font-bold ${stats.roi === null ? 'text-gray-500' : stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.roi === null ? '—' : `${stats.roi >= 0 ? '+' : ''}${stats.roi}%`}
          </p>
          <p className="text-xs text-gray-500">ROI</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className="text-sm font-bold text-white">{stats.gagnes}W / {stats.perdus}L</p>
          <p className="text-xs text-gray-500">Résultats</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className={`text-sm font-bold ${stats.unitesNettes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.unitesNettes >= 0 ? '+' : ''}{stats.unitesNettes}u
          </p>
          <p className="text-xs text-gray-500">Unités</p>
        </div>
      </div>
    </div>
  )
}

// ── BetRow ────────────────────────────────────────────────────────────────────

function BetRow({ bet, onUpdate }: { bet: TrackedBet; onUpdate: () => void }) {
  const niveau = (NIVEAU_CFG as Record<string, typeof NIVEAU_CFG[keyof typeof NIVEAU_CFG]>)[bet.niveau]
  const statut = (STATUT_CFG as Record<string, typeof STATUT_CFG[keyof typeof STATUT_CFG]>)[bet.statut]
  const gain   = bet.statut === 'gagné' ? `+${(bet.cote_ref - 1).toFixed(2)}u` : bet.statut === 'perdu' ? '-1.00u' : null
  const auto   = bet.validated_at !== null && bet.statut !== 'en_cours'

  async function mark(s: string) {
    await fetch('/api/selections/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bet.id, statut: s }),
    })
    onUpdate()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {niveau && <span className={`text-xs font-semibold ${niveau.color}`}>{niveau.label}</span>}
            <span className={`text-xs ${bet.sport === 'WTA' ? 'text-pink-400' : 'text-blue-400'}`}>
              🎾 {bet.sport} · {bet.surface}
            </span>
            {auto && <span className="text-xs text-gray-600">· validé auto</span>}
          </div>
          <p className="text-sm font-semibold text-white truncate">{bet.match_str}</p>
          <p className="text-sm text-emerald-300">{bet.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">{bet.date_match} · {bet.heure} · Cote {bet.cote_ref.toFixed(2)}</p>
        </div>
        <div className="text-right shrink-0">
          {statut && <p className={`text-sm font-bold ${statut.color}`}>{statut.label}</p>}
          {gain && <p className={`text-sm font-bold ${bet.statut === 'gagné' ? 'text-emerald-400' : 'text-red-400'}`}>{gain}</p>}
        </div>
      </div>

      {bet.statut === 'en_cours' && (
        <div className="flex gap-2">
          <button onClick={() => mark('gagné')}
            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold py-2 rounded-lg transition-colors">
            ✅ Gagné
          </button>
          <button onClick={() => mark('perdu')}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold py-2 rounded-lg transition-colors">
            ❌ Perdu
          </button>
        </div>
      )}
      {bet.statut !== 'en_cours' && (
        <button onClick={() => mark('en_cours')} className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-left">
          Remettre en cours ↩
        </button>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SelectionsTracker({
  bets,
  stats,
}: {
  bets: TrackedBet[]
  stats: Record<string, LevelStats>
}) {
  const router = useRouter()
  const refresh = () => router.refresh()

  const enCours  = bets.filter(b => b.statut === 'en_cours')
  const termines = bets.filter(b => b.statut !== 'en_cours')

  const totalTermines  = Object.values(stats).reduce((s, st) => s + st.gagnes + st.perdus, 0)
  const totalUnites    = parseFloat(Object.values(stats).reduce((s, st) => s + st.unitesNettes, 0).toFixed(2))
  const roiGlobal      = totalTermines > 0 ? parseFloat(((totalUnites / totalTermines) * 100).toFixed(1)) : null

  if (!bets.length) return (
    <div className="text-center py-16 text-gray-600">
      <p className="text-4xl mb-3">📌</p>
      <p className="text-gray-400 font-semibold mb-1">Aucun pari suivi</p>
      <p className="text-sm">Les sélections détectées sont automatiquement ajoutées ici.</p>
    </div>
  )

  return (
    <div className="space-y-8">

      {/* Stats par niveau */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">📊 Performance par niveau d&apos;avantage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['excellent', 'bon', 'interessant'] as const).map(n => (
            <NiveauCard key={n} niveau={n} stats={stats[n] ?? { total:0,gagnes:0,perdus:0,enCours:0,unitesNettes:0,roi:null,coteMoyenne:null }} />
          ))}
        </div>
      </div>

      {/* Bilan global */}
      {totalTermines > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-400">Bilan global</p>
            <p className="text-lg font-bold text-white">{totalTermines} pari{totalTermines > 1 ? 's' : ''} terminés</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${totalUnites >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalUnites >= 0 ? '+' : ''}{totalUnites}u
            </p>
            {roiGlobal !== null && (
              <p className={`text-sm ${roiGlobal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ROI {roiGlobal >= 0 ? '+' : ''}{roiGlobal}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* En cours */}
      {enCours.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3">⏳ En cours ({enCours.length})</h3>
          <div className="space-y-3">
            {enCours.map(b => <BetRow key={b.id} bet={b} onUpdate={refresh} />)}
          </div>
        </div>
      )}

      {/* Terminés */}
      {termines.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3">Terminés ({termines.length})</h3>
          <div className="space-y-3">
            {termines.map(b => <BetRow key={b.id} bet={b} onUpdate={refresh} />)}
          </div>
        </div>
      )}
    </div>
  )
}
