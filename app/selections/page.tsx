import Header from '@/components/Header'
import { getValueBets, type ValueBet, type NiveauEdge } from '@/lib/value-bets'

export const revalidate = 3600  // 1h — The Odds API quota mensuel limité

// ── Config visuelle ───────────────────────────────────────────────────────────

function niveauConfig(n: NiveauEdge) {
  switch (n) {
    case 'excellent':  return {
      dot:   'bg-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      bar:   'bg-emerald-400',
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

function sportBadge(sport: string) {
  if (sport === 'ATP') return 'text-blue-400'
  if (sport === 'WTA') return 'text-pink-400'
  return 'text-gray-400'
}

// ── ValueBetCard ──────────────────────────────────────────────────────────────

function ValueBetCard({ bet }: { bet: ValueBet }) {
  const cfg     = niveauConfig(bet.niveau)
  const edgePct = (bet.edge * 100).toFixed(1)
  const pModPct = (bet.pModel * 100).toFixed(1)
  const pMktPct = (bet.pMarche * 100).toFixed(1)
  // Barre d'avantage : la largeur max représente 15% d'edge → 100%
  const barWidth = Math.min(100, (bet.edge / 0.15) * 100).toFixed(0)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {cfg.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 font-semibold ${sportBadge(bet.sport)}`}>
            🎾 {bet.sport} · {bet.surface}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">{bet.date}</p>
          <p className="text-xs text-gray-600">{bet.heure}</p>
        </div>
      </div>

      {/* Match + pari */}
      <div>
        <p className="text-sm text-gray-400 mb-1 font-semibold text-white">{bet.match}</p>
        <div className="mt-2 bg-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Sélection</p>
          <p className="text-base font-bold text-emerald-300">{bet.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">Cote de marché : {bet.coteRef.toFixed(2)}</p>
        </div>
      </div>

      {/* Comparaison probabilités */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-lg font-bold text-emerald-400">{pModPct}%</p>
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

      {/* Barre d'avantage */}
      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Avantage estimé</span>
          <span>+{edgePct} pts</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${cfg.bar} transition-all`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Raisonnement */}
      <p className="text-sm text-gray-400 leading-relaxed">{bet.raisonnement}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SelectionsPage() {
  const bets = await getValueBets()

  const excellent   = bets.filter(b => b.niveau === 'excellent')
  const bon         = bets.filter(b => b.niveau === 'bon')
  const interessant = bets.filter(b => b.niveau === 'interessant')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Titre */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">🎯 Sélections</h1>
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full font-semibold border border-gray-700">
              🔒 Privé
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Paris où notre modèle identifie un avantage statistique par rapport au marché.
            Les cotes sont collectées automatiquement sur les meilleurs bookmakers de référence.
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{excellent.length}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Excellent (&gt;8%)</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{bon.length}</p>
            <p className="text-xs text-gray-500 mt-1">✅ Bon (5-8%)</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{interessant.length}</p>
            <p className="text-xs text-gray-500 mt-1">🔍 Intéressant (3-5%)</p>
          </div>
        </div>

        {bets.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-5xl mb-4">🎯</p>
            <p className="text-xl font-semibold mb-2 text-gray-400">Aucune sélection détectée</p>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Le modèle n&apos;identifie pas d&apos;avantage suffisant sur les matchs disponibles actuellement.
              Les données sont mises à jour toutes les heures.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">

            {excellent.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-emerald-300">⚡ Avantage excellent</h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    &gt;8% d&apos;avantage
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {excellent.map(b => <ValueBetCard key={b.id} bet={b} />)}
                </div>
              </section>
            )}

            {bon.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-blue-300">✅ Bon avantage</h2>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    5-8% d&apos;avantage
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bon.map(b => <ValueBetCard key={b.id} bet={b} />)}
                </div>
              </section>
            )}

            {interessant.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-yellow-300">🔍 Intéressant</h2>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                    3-5% d&apos;avantage
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interessant.map(b => <ValueBetCard key={b.id} bet={b} />)}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </main>
  )
}
