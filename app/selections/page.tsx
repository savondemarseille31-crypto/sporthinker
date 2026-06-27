import Header from '@/components/Header'
import SelectionsFilter from '@/components/SelectionsFilter'
import { getValueBets, type ValueBet, type NiveauEdge } from '@/lib/value-bets'
import { upsertBets, getTrackedBets, validateCompletedBets, computeStats } from '@/lib/selections-db'

export const dynamic = 'force-dynamic'  // jamais prérendu — Supabase indispo au build time

// ── Config visuelle ───────────────────────────────────────────────────────────

function niveauConfig(n: NiveauEdge) {
  switch (n) {
    case 'excellent': return {
      dot:   'bg-violet-400',
      badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
      bar:   'bg-violet-400',
      label: '⚡ Excellent',
    }
    case 'bon': return {
      dot:   'bg-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      bar:   'bg-blue-400',
      label: '✅ Bon',
    }
    case 'interessant': return {
      dot:   'bg-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      bar:   'bg-yellow-400',
      label: '🔍 Intéressant',
    }
  }
}

// ── ValueBetCard ──────────────────────────────────────────────────────────────

function ValueBetCard({ bet }: { bet: ValueBet }) {
  const cfg      = niveauConfig(bet.niveau)
  const edgePct  = (bet.edge    * 100).toFixed(1)
  const pModPct  = (bet.pModel  * 100).toFixed(1)
  const pMktPct  = (bet.pMarche * 100).toFixed(1)
  const barWidth = Math.min(100, (bet.edge / 0.15) * 100).toFixed(0)

  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {cfg.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 font-semibold ${
            bet.sport === 'WTA' ? 'text-pink-400' : 'text-blue-400'
          }`}>
            🎾 {bet.sport} · {bet.surface}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">{bet.date}</p>
          <p className="text-xs text-gray-600">{bet.heure}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-white mb-1">{bet.match}</p>
        <div className="mt-2 bg-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Sélection</p>
          <p className="text-base font-bold text-violet-300">{bet.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">Cote de marché : {bet.coteRef.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
          <p className="text-lg font-bold text-violet-400">{pModPct}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Notre modèle</p>
        </div>
        <div className="text-center bg-gray-800 rounded-xl p-3">
          <p className="text-lg font-bold text-gray-300">{pMktPct}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Marché</p>
        </div>
        <div className="text-center bg-gray-800 rounded-xl p-3">
          <p className="text-lg font-bold text-white">+{edgePct}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Avantage</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Avantage estimé</span>
          <span>+{edgePct} pts</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
        </div>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{bet.raisonnement}</p>
    </div>
  )
}

// ── Section par niveau ────────────────────────────────────────────────────────

function BetsByLevel({ bets }: { bets: ValueBet[] }) {
  if (!bets.length) return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 text-center">
      <p className="text-gray-500 text-sm">Aucune sélection détectée pour ce sport actuellement.</p>
    </div>
  )

  const excellent   = bets.filter(b => b.niveau === 'excellent')
  const bon         = bets.filter(b => b.niveau === 'bon')
  const interessant = bets.filter(b => b.niveau === 'interessant')

  function Section({ title, badge, color, items }: {
    title: string; badge: string; color: string; items: ValueBet[]
  }) {
    if (!items.length) return null
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className={`text-lg font-bold ${color}`}>{title}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge}`}>
            {items.length} sélection{items.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(b => <ValueBetCard key={b.id} bet={b} />)}
        </div>
      </section>
    )
  }

  return (
    <>
      <Section title="⚡ Avantage excellent" color="text-violet-300"
        badge="bg-violet-500/20 text-violet-300 border border-violet-500/30" items={excellent} />
      <Section title="✅ Bon avantage" color="text-blue-300"
        badge="bg-blue-500/20 text-blue-300 border border-blue-500/30" items={bon} />
      <Section title="🔍 Intéressant" color="text-yellow-300"
        badge="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" items={interessant} />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SelectionsPage() {
  // Fetch value bets (indépendant de Supabase)
  const allBets = await getValueBets().catch(() => [] as import('@/lib/value-bets').ValueBet[])

  // Supabase — dégradation gracieuse si indisponible
  let trackedBets: import('@/lib/selections-db').TrackedBet[] = []
  try {
    const [, tracked] = await Promise.all([
      validateCompletedBets(),
      getTrackedBets(),
    ])
    trackedBets = tracked
    await upsertBets(allBets)
  } catch (err) {
    console.error('[selections] Supabase unavailable:', err)
  }

  const trackedStats = computeStats(trackedBets)

  const tennisBets = allBets.filter(b => b.sport === 'ATP' || b.sport === 'WTA')
  const mlbBets    = allBets.filter(b => b.sport === 'MLB')
  const nbaBets    = allBets.filter(b => b.sport === 'NBA')

  const counts = { tennis: tennisBets.length, mlb: mlbBets.length, nba: nbaBets.length }

  const excellent   = allBets.filter(b => b.niveau === 'excellent').length
  const bon         = allBets.filter(b => b.niveau === 'bon').length
  const interessant = allBets.filter(b => b.niveau === 'interessant').length

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">🎯 Sélections</h1>
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full font-semibold border border-gray-700">
              🔒 Privé
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Paris à valeur détectés automatiquement · suivi et validation automatiques
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{excellent}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Excellent (&gt;8%)</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{bon}</p>
            <p className="text-xs text-gray-500 mt-1">✅ Bon (5-8%)</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{interessant}</p>
            <p className="text-xs text-gray-500 mt-1">🔍 Intéressant (3-5%)</p>
          </div>
        </div>

        <SelectionsFilter
          counts={counts}
          trackedBets={trackedBets}
          trackedStats={trackedStats}
          tennis={<BetsByLevel bets={tennisBets} />}
          mlb={<BetsByLevel bets={mlbBets} />}
          nba={<BetsByLevel bets={nbaBets} />}
        />

      </div>
    </main>
  )
}
