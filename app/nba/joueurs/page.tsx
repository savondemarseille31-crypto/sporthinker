import Link from 'next/link'
import Header from '@/components/Header'
import NBATabSwitcher from '@/components/NBATabSwitcher'
import { getNBAPlayoffEventIds, getTeamPlayoffPlayerAverages, type ESPNPlayerAverage } from '@/lib/espn-api'

export const revalidate = 1800 // 30 min — moyennes playoffs joueurs

export default async function NBAJoueursPage() {
  // 1. Get all playoff event IDs to discover active teams
  const eventIds = await getNBAPlayoffEventIds()

  // 2. Extract unique team abbreviations
  const teamSet = new Set<string>()
  for (const ev of eventIds) {
    if (ev.home) teamSet.add(ev.home)
    if (ev.away) teamSet.add(ev.away)
  }
  const teams = Array.from(teamSet)

  // 3. Fetch averages for each team in parallel
  const allTeamAverages = await Promise.all(
    teams.map(abbr => getTeamPlayoffPlayerAverages(abbr))
  )

  // 4. Flatten and deduplicate (keep best stats per player if same player on multiple entries)
  const playerMap = new Map<string, ESPNPlayerAverage>()
  for (const teamPlayers of allTeamAverages) {
    for (const p of teamPlayers) {
      const key = p.displayName
      const existing = playerMap.get(key)
      // Keep the entry with more games played
      if (!existing || p.gamesPlayed > existing.gamesPlayed) {
        playerMap.set(key, p)
      }
    }
  }
  const allPlayers = Array.from(playerMap.values())

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/nba" className="hover:text-emerald-400 transition-colors">
            ← NBA Playoffs
          </Link>
          <span>/</span>
          <span className="text-white">Stats Joueurs</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">📊 Stats Joueurs — Playoffs 2026</h1>
          <p className="text-gray-400 text-sm">
            Moyennes playoffs · Données ESPN en temps réel ·{' '}
            <span className="text-emerald-400">{allPlayers.length} joueurs</span>{' '}
            de{' '}
            <span className="text-white font-semibold">{teams.length} équipes</span>
          </p>
        </div>

        {/* Tab switcher (client component) */}
        <NBATabSwitcher players={allPlayers} />

        {/* Betting tip card */}
        <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-yellow-400 mb-1">Paris sur les props joueurs</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Les <strong className="text-white">props joueurs</strong> (points, rebonds, passes, etc.)
                sont parmi les paris les plus populaires en NBA. Comparez les moyennes playoffs de chaque
                joueur avec les lignes proposées par ton bookmaker.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-400">
                <li>• Si un joueur est en forme et que la ligne est inférieure à sa moyenne récente → <span className="text-emerald-400 font-semibold">value OVER</span></li>
                <li>• Préfère les joueurs avec ≥ 5 matchs pour une moyenne fiable</li>
                <li>• En playoffs, le rythme ralentit souvent → totaux par équipe plus bas qu&apos;en saison régulière</li>
                <li>• Surveille les matchups défensifs : un bon défenseur en face peut faire baisser la performance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/paris/calculateur"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-center py-3 rounded-xl transition-colors"
          >
            💰 Calculateur de value
          </Link>
          <Link
            href="/signaux"
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center py-3 rounded-xl transition-colors"
          >
            ⚡ Tous les signaux
          </Link>
        </div>
      </div>
    </main>
  )
}
