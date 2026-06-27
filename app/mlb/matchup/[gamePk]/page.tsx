import Link from 'next/link'
import Header from '@/components/Header'
import {
  getGameByPk,
  getStandings,
  getPitcherSeasonStats,
  getTeamRecentGames,
  getTeamHittingStats,
  formatGameTime,
  MLB_TEAMS,
  type MLBRecentGame,
} from '@/lib/mlb-api'
import { generateMLBSignal, reliableERA, reliableWHIP, isSmallSample } from '@/lib/signals'
import { getEntitlement } from '@/lib/entitlement'
import { PaywallPage } from '@/components/PremiumLock'
import { notFound } from 'next/navigation'

export const revalidate = 60 // 1 min — données matchup live

// ---- Helpers ----
function eraColor(era: number) {
  if (era < 2.50) return 'text-violet-400'
  if (era < 3.50) return 'text-yellow-400'
  if (era < 4.50) return 'text-orange-400'
  return 'text-red-400'
}

function eraLabel(era: number) {
  if (era < 2.50) return 'Élite'
  if (era < 3.50) return 'Bon'
  if (era < 4.50) return 'Moyen'
  return 'Fragile'
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-gray-800'}`}>
      <p className={`text-lg font-bold ${highlight ? 'text-violet-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  )
}

function RecentGamesRow({ games, abbr }: { games: MLBRecentGame[]; abbr: string }) {
  if (games.length === 0) return <p className="text-gray-600 text-sm">Aucune donnée</p>

  return (
    <div className="space-y-1">
      {games.map((g, i) => {
        const opponent = g.isHome ? g.awayTeam : g.homeTeam
        const myScore = g.isHome ? g.homeScore : g.awayScore
        const oppScore = g.isHome ? g.awayScore : g.homeScore
        return (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${g.won ? 'bg-violet-500/20 text-violet-400' : 'bg-red-500/20 text-red-400'}`}>
                {g.won ? 'V' : 'D'}
              </span>
              <span className="text-gray-400 text-xs">{g.isHome ? 'vs' : '@'} {opponent}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">{myScore}–{oppScore}</span>
              <span className="text-gray-600 text-xs">Total: {g.total}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Page ----
export default async function MatchupPage({ params }: { params: Promise<{ gamePk: string }> }) {
  const { premium } = await getEntitlement()
  if (!premium) return <PaywallPage title="Analyse du match réservée aux abonnés" />
  const { gamePk: gamePkStr } = await params
  const gamePk = parseInt(gamePkStr)
  if (isNaN(gamePk)) notFound()

  // Fetch tout en parallèle
  const game = await getGameByPk(gamePk)
  if (!game) notFound()

  const { home, away } = game.teams
  const homeTeamId = home.team.id
  const awayTeamId = away.team.id
  const homePitcherId = home.probablePitcher?.id
  const awayPitcherId = away.probablePitcher?.id

  const [
    homeStats,
    awayStats,
    homeHitting,
    awayHitting,
    homeRecent,
    awayRecent,
    standings,
  ] = await Promise.all([
    homePitcherId ? getPitcherSeasonStats(homePitcherId) : Promise.resolve(null),
    awayPitcherId ? getPitcherSeasonStats(awayPitcherId) : Promise.resolve(null),
    getTeamHittingStats(homeTeamId),
    getTeamHittingStats(awayTeamId),
    getTeamRecentGames(homeTeamId, 8),
    getTeamRecentGames(awayTeamId, 8),
    getStandings(),
  ])

  // RPG map pour le signal
  const teamRPG: Record<number, number> = {}
  for (const div of standings) {
    for (const rec of div.teamRecords) {
      const gp = rec.wins + rec.losses
      if (gp > 0 && rec.runsScored) teamRPG[rec.team.id] = rec.runsScored / gp
    }
  }

  const signal = generateMLBSignal(game, homeStats, awayStats, teamRPG)

  const homeInfo = MLB_TEAMS[homeTeamId]
  const awayInfo = MLB_TEAMS[awayTeamId]
  const isPre = game.status.abstractGameState === 'Preview'
  const isLive = game.status.abstractGameState === 'Live'
  const isFinal = game.status.abstractGameState === 'Final'

  // ERA/WHIP fiables (corrigées si petit échantillon)
  const homeERA = reliableERA(homeStats)
  const awayERA = reliableERA(awayStats)
  const homeWHIP = reliableWHIP(homeStats)
  const awayWHIP = reliableWHIP(awayStats)
  const homeSmallSample = isSmallSample(homeStats)
  const awaySmallSample = isSmallSample(awayStats)
  // ERA brute pour affichage (info)
  const homeRawERA = homeStats ? parseFloat(String(homeStats.era ?? homeERA)) : homeERA
  const awayRawERA = awayStats ? parseFloat(String(awayStats.era ?? awayERA)) : awayERA

  // Stats récentes
  const homeWins10 = homeRecent.filter(g => g.won).length
  const awayWins10 = awayRecent.filter(g => g.won).length
  const homeAvgTotal = homeRecent.length > 0 ? (homeRecent.reduce((s, g) => s + g.total, 0) / homeRecent.length) : null
  const awayAvgTotal = awayRecent.length > 0 ? (awayRecent.reduce((s, g) => s + g.total, 0) / awayRecent.length) : null
  const homeRPGrecent = homeRecent.length > 0
    ? homeRecent.reduce((s, g) => s + (g.isHome ? g.homeScore : g.awayScore), 0) / homeRecent.length
    : null
  const awayRPGrecent = awayRecent.length > 0
    ? awayRecent.reduce((s, g) => s + (g.isHome ? g.homeScore : g.awayScore), 0) / awayRecent.length
    : null

  // H2H : matchs des 2 équipes où l'adversaire correspond
  const h2h = homeRecent.filter(g => {
    const opp = g.isHome ? g.awayTeam : g.homeTeam
    return opp === away.team.abbreviation
  })

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/mlb" className="hover:text-violet-400 transition-colors">⚾ MLB</Link>
          <span>/</span>
          <Link href="/mlb/calendrier" className="hover:text-violet-400 transition-colors">Calendrier</Link>
          <span>/</span>
          <span className="text-white">{home.team.abbreviation} vs {away.team.abbreviation}</span>
        </div>

        {/* Header match */}
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {isLive && (
              <span className="flex items-center gap-1.5 text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {game.linescore?.currentInningOrdinal} {game.linescore?.inningHalf}
              </span>
            )}
            {isFinal && <span className="text-sm bg-gray-700 text-gray-400 px-3 py-1 rounded-full">Final</span>}
            {isPre && (
              <span className="text-sm text-gray-500">
                🕐 {formatGameTime(game.gameDate, game.status.startTimeTBD)}
              </span>
            )}
            <span className="text-sm text-gray-600">📍 {game.venue.name}</span>
          </div>

          {/* Équipes — Domicile à gauche, Extérieur à droite */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Home */}
            <div className="text-center">
              <p className="text-4xl mb-2">{homeInfo?.emoji ?? '⚾'}</p>
              <p className={`text-xl font-bold ${homeInfo?.color ?? 'text-white'}`}>
                {homeInfo?.shortName ?? home.team.abbreviation}
              </p>
              <p className="text-xs text-gray-500">{home.team.name}</p>
              <p className="text-xs text-gray-600 mt-1">{home.leagueRecord.wins}-{home.leagueRecord.losses}</p>
              {(isLive || isFinal) && (
                <p className={`text-3xl font-bold mt-2 ${home.isWinner ? 'text-violet-400' : 'text-white'}`}>
                  {home.score ?? 0}
                </p>
              )}
            </div>

            {/* VS */}
            <div className="text-center">
              <p className="text-gray-600 text-2xl font-light">vs</p>
              {isPre && <p className="text-xs text-gray-600 mt-1">Domicile · Extérieur</p>}
            </div>

            {/* Away */}
            <div className="text-center">
              <p className="text-4xl mb-2">{awayInfo?.emoji ?? '⚾'}</p>
              <p className={`text-xl font-bold ${awayInfo?.color ?? 'text-white'}`}>
                {awayInfo?.shortName ?? away.team.abbreviation}
              </p>
              <p className="text-xs text-gray-500">{away.team.name}</p>
              <p className="text-xs text-gray-600 mt-1">{away.leagueRecord.wins}-{away.leagueRecord.losses}</p>
              {(isLive || isFinal) && (
                <p className={`text-3xl font-bold mt-2 ${away.isWinner ? 'text-violet-400' : 'text-white'}`}>
                  {away.score ?? 0}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Signal du match */}
        {signal ? (
          <div className={`rounded-2xl p-5 mb-6 border ${
            signal.force === 'fort' ? 'bg-violet-500/10 border-violet-500/30' :
            signal.force === 'modéré' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-[#14171f] border-gray-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-sm">
                {signal.force === 'fort' ? '⚡ Signal fort' : signal.force === 'modéré' ? '🔶 Signal modéré' : '👁 À surveiller'}
              </span>
              <span className="text-xs text-gray-500">— {signal.typePari}</span>
            </div>
            <p className={`text-xl font-bold mb-2 ${
              signal.force === 'fort' ? 'text-violet-400' : signal.force === 'modéré' ? 'text-yellow-400' : 'text-gray-300'
            }`}>{signal.pari}</p>
            <p className="text-sm text-gray-400 mb-4">{signal.raisonnement}</p>
            <Link href="/paris/calculateur"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              💰 Calculer la value →
            </Link>
          </div>
        ) : (
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 mb-6 text-center text-sm text-gray-500">
            Aucun signal détecté — les lanceurs sont trop proches statistiquement pour identifier un avantage clair.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ---- LANCEURS ---- */}
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
            <h2 className="text-base font-bold text-violet-400 mb-4">🥎 Lanceurs probables</h2>

            {/* Home pitcher — Domicile en premier */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span>{homeInfo?.emoji ?? '⚾'}</span>
                <div>
                  <p className="font-semibold text-sm">{home.probablePitcher?.fullName ?? 'TBD'}</p>
                  <p className="text-xs text-gray-500">{homeInfo?.shortName} — Domicile</p>
                </div>
              </div>
              {homeStats ? (
                <>
                  {homeSmallSample && (
                    <p className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1 mb-2">
                      ⚠️ Petit échantillon ({homeStats.inningsPitched ?? '0'} IP) — ERA brute {homeRawERA.toFixed(2)} non représentative, ajustée à {homeERA.toFixed(2)}
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    <StatBox label="ERA ajustée" value={homeERA.toFixed(2)} sub={eraLabel(homeERA)} highlight={homeERA < 3.50} />
                    <StatBox label="WHIP" value={homeWHIP.toFixed(2)} />
                    <StatBox label="V-D" value={`${homeStats.wins ?? '—'}-${homeStats.losses ?? '—'}`} />
                    <StatBox label="K" value={String(homeStats.strikeOuts ?? '—')} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-600">Stats indisponibles</p>
              )}
            </div>

            <div className="border-t border-[#262b36] my-4" />

            {/* Away pitcher */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span>{awayInfo?.emoji ?? '⚾'}</span>
                <div>
                  <p className="font-semibold text-sm">{away.probablePitcher?.fullName ?? 'TBD'}</p>
                  <p className="text-xs text-gray-500">{awayInfo?.shortName} — Extérieur</p>
                </div>
              </div>
              {awayStats ? (
                <>
                  {awaySmallSample && (
                    <p className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1 mb-2">
                      ⚠️ Petit échantillon ({awayStats.inningsPitched ?? '0'} IP) — ERA brute {awayRawERA.toFixed(2)} non représentative, ajustée à {awayERA.toFixed(2)}
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    <StatBox label="ERA ajustée" value={awayERA.toFixed(2)} sub={eraLabel(awayERA)} highlight={awayERA < 3.50} />
                    <StatBox label="WHIP" value={awayWHIP.toFixed(2)} />
                    <StatBox label="V-D" value={`${awayStats.wins ?? '—'}-${awayStats.losses ?? '—'}`} />
                    <StatBox label="K" value={String(awayStats.strikeOuts ?? '—')} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-600">Stats indisponibles</p>
              )}
            </div>
          </section>

          {/* ---- OFFENSES ---- */}
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
            <h2 className="text-base font-bold text-violet-400 mb-4">🏏 Offenses (saison)</h2>

            <div className="space-y-5">
              {/* Home offense — Domicile en premier */}
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">
                  {homeInfo?.emoji} {homeInfo?.shortName ?? home.team.abbreviation} <span className="text-xs text-gray-600">(dom.)</span>
                </p>
                {homeHitting ? (
                  <div className="grid grid-cols-4 gap-2">
                    <StatBox label="R/match" value={homeHitting.runsPerGame.toFixed(1)} highlight={homeHitting.runsPerGame > 5} />
                    <StatBox label="AVG" value={homeHitting.avg} />
                    <StatBox label="OPS" value={homeHitting.ops} highlight={parseFloat(homeHitting.ops) > 0.750} />
                    <StatBox label="HR" value={String(homeHitting.homeRuns)} />
                  </div>
                ) : <p className="text-xs text-gray-600">Stats indisponibles</p>}
              </div>

              <div className="border-t border-[#262b36]" />

              {/* Away offense */}
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">
                  {awayInfo?.emoji} {awayInfo?.shortName ?? away.team.abbreviation} <span className="text-xs text-gray-600">(ext.)</span>
                </p>
                {awayHitting ? (
                  <div className="grid grid-cols-4 gap-2">
                    <StatBox label="R/match" value={awayHitting.runsPerGame.toFixed(1)} highlight={awayHitting.runsPerGame > 5} />
                    <StatBox label="AVG" value={awayHitting.avg} />
                    <StatBox label="OPS" value={awayHitting.ops} highlight={parseFloat(awayHitting.ops) > 0.750} />
                    <StatBox label="HR" value={String(awayHitting.homeRuns)} />
                  </div>
                ) : <p className="text-xs text-gray-600">Stats indisponibles</p>}
              </div>

              {/* Total estimé recap */}
              {(homeHitting || awayHitting) && signal && (
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total estimé ce match</p>
                  <p className="text-2xl font-bold text-white">{signal.pari.match(/[\d.]+/)?.[0] ?? '—'}</p>
                  <p className="text-xs text-gray-600">basé sur RPG × ajustement ERA</p>
                </div>
              )}
            </div>
          </section>

          {/* ---- FORME RÉCENTE Home — Domicile en premier ---- */}
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-violet-400">
                {homeInfo?.emoji} {homeInfo?.shortName} — Forme récente <span className="text-xs text-gray-600">(dom.)</span>
              </h2>
              {homeRecent.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{homeWins10}/{homeRecent.length} victoires</span>
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    homeWins10 >= 7 ? 'bg-violet-500/20 text-violet-400' :
                    homeWins10 >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {homeWins10 >= 7 ? '🔥 Chaud' : homeWins10 >= 4 ? '→ Correct' : '❄️ Froid'}
                  </span>
                </div>
              )}
            </div>
            {homeRPGrecent !== null && (
              <p className="text-xs text-gray-500 mb-3">
                Moy. points marqués : <span className="text-white font-semibold">{homeRPGrecent.toFixed(1)}</span> /match ·
                Total moy. : <span className="text-white font-semibold">{homeAvgTotal?.toFixed(1) ?? '—'}</span>
              </p>
            )}
            <RecentGamesRow games={homeRecent} abbr={home.team.abbreviation} />
          </section>

          {/* ---- FORME RÉCENTE Away ---- */}
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-violet-400">
                {awayInfo?.emoji} {awayInfo?.shortName} — Forme récente <span className="text-xs text-gray-600">(ext.)</span>
              </h2>
              {awayRecent.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{awayWins10}/{awayRecent.length} victoires</span>
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    awayWins10 >= 7 ? 'bg-violet-500/20 text-violet-400' :
                    awayWins10 >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {awayWins10 >= 7 ? '🔥 Chaud' : awayWins10 >= 4 ? '→ Correct' : '❄️ Froid'}
                  </span>
                </div>
              )}
            </div>
            {awayRPGrecent !== null && (
              <p className="text-xs text-gray-500 mb-3">
                Moy. points marqués : <span className="text-white font-semibold">{awayRPGrecent.toFixed(1)}</span> /match ·
                Total moy. : <span className="text-white font-semibold">{awayAvgTotal?.toFixed(1) ?? '—'}</span>
              </p>
            )}
            <RecentGamesRow games={awayRecent} abbr={away.team.abbreviation} />
          </section>

          {/* ---- H2H ---- */}
          {h2h.length > 0 && (
            <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 lg:col-span-2">
              <h2 className="text-base font-bold text-violet-400 mb-4">
                ⚔️ H2H cette saison — {homeInfo?.shortName} vs {awayInfo?.shortName}
              </h2>
              <div className="space-y-2">
                {h2h.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-gray-800 rounded-xl px-4 py-2.5">
                    <span className="text-gray-500 text-xs w-24">{g.date}</span>
                    <span className="text-gray-400">
                      {g.homeTeam} vs {g.awayTeam}
                    </span>
                    <span className={`font-bold ${g.won ? 'text-emerald-400' : 'text-red-400'}`}>
                      {g.homeScore}–{g.awayScore}
                    </span>
                    <span className="text-gray-600 text-xs">Total: {g.total}</span>
                  </div>
                ))}
              </div>
              {h2h.length > 0 && (
                <p className="mt-3 text-xs text-gray-600">
                  Total moyen H2H : <span className="text-white">{(h2h.reduce((s, g) => s + g.total, 0) / h2h.length).toFixed(1)}</span> points
                </p>
              )}
            </section>
          )}

        </div>

        {/* CTA */}
        <div className="mt-6 flex gap-3">
          <Link href="/paris/calculateur"
            className="flex-1 bg-violet-500 hover:bg-violet-400 text-black font-bold text-center py-3 rounded-xl transition-colors">
            💰 Calculateur de value
          </Link>
          <Link href="/signaux"
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center py-3 rounded-xl transition-colors">
            ⚡ Tous les signaux
          </Link>
        </div>
      </div>
    </main>
  )
}
