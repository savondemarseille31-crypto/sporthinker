import Link from 'next/link'
import Header from '@/components/Header'
import SignauxFilter from '@/components/SignauxFilter'
import { getSchedule, getStandings, getPitcherSeasonStats } from '@/lib/mlb-api'
import { generateMLBSignal, generateCdMSignals, type Signal, type SignalForce } from '@/lib/signals'
import { getCdMUpcomingWithOdds, type ESPNCdMOdds } from '@/lib/espn-api'
import { generateNBASignalsForToday } from '@/lib/nba-signals'
import { generateFootballSignalsForToday } from '@/lib/football-signals'
import { LEAGUES } from '@/lib/api-football'
import { generateTennisSignalsForToday } from '@/lib/tennis-signals'
import { generateMLSSignalsForToday } from '@/lib/mls-signals'
import { getMLBOdds, getCdMOdds, getNBAOdds, getTennisOdds, getMLSOdds, findEvent, extractRealOdds, type OddsEvent } from '@/lib/odds-api'

export const revalidate = 300 // 5 min — signaux MLB + CdM + Tennis

// ---- Helpers visuels ----
function forceConfig(force: SignalForce) {
  switch (force) {
    case 'fort':        return { dot: 'bg-emerald-400',  badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré':      return { dot: 'bg-yellow-400',   badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',   badge: 'bg-gray-700       text-gray-400    border border-gray-600',        label: '👁 À surveiller' }
  }
}

function typeColor(type: string) {
  if (type.includes('Under'))   return 'text-blue-400'
  if (type.includes('Over'))    return 'text-orange-400'
  if (type.includes('Money'))   return 'text-emerald-400'
  if (type.includes('First 5')) return 'text-purple-400'
  if (type.includes('Double'))  return 'text-yellow-400'
  if (type.includes('BTTS'))    return 'text-pink-400'
  if (type.includes('Buteur'))  return 'text-teal-400'
  return 'text-white'
}

function sportBadge(sport: Signal['sport']) {
  switch (sport) {
    case 'MLB':    return { label: '⚾ MLB',       className: 'text-blue-300' }
    case 'NBA':    return { label: '🏀 NBA Playoffs', className: 'text-orange-300' }
    case 'CdM':    return { label: '🌍 CdM 2026',  className: 'text-emerald-300' }
    case 'Tennis':  return { label: '🎾 Tennis',    className: 'text-orange-300'  }
    case 'MLS':     return { label: '⚽ MLS',       className: 'text-green-300'   }
  }
}

function ctaLabel(sport: Signal['sport']): string {
  if (sport === 'NBA') return '🏀 Voir l\'analyse →'
  return '💰 Calculer la value →'
}

function ctaHref(signal: Signal): string {
  if (signal.sport === 'NBA') return signal.lienCalculateur
  return '/paris/calculateur'
}

function formatMoneyLine(ml: number): string {
  if (!ml || ml === 0) return '—'
  return ml > 0 ? `+${ml}` : `${ml}`
}

// ---- Carte signal ----
function SignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force)
  const hasOdds = signal.odds && (signal.odds.homeMoneyLine || signal.odds.awayMoneyLine || signal.odds.overUnder)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {cfg.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${sportBadge(signal.sport).className}`}>
            {sportBadge(signal.sport).label}
          </span>
          {signal.tournament && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              signal.tournamentLevel === 'Grand Slam'                                          ? 'bg-yellow-500/20 text-yellow-300' :
              signal.tournamentLevel === 'Masters 1000' || signal.tournamentLevel === 'WTA 1000' ? 'bg-purple-500/20 text-purple-300' :
              signal.tournamentLevel?.includes('500')                                         ? 'bg-blue-500/20 text-blue-300' :
              'bg-gray-800 text-gray-400'
            }`}>
              {signal.tournament}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">{signal.date}</p>
          <p className="text-xs text-gray-600">{signal.heure}</p>
        </div>
      </div>

      {/* Match + pari principal */}
      <div>
        <p className="text-sm text-gray-400 mb-1">
          {signal.flagDom} {signal.flagExt} <span className="font-semibold text-white ml-1">{signal.match}</span>
        </p>
        <div className="mt-2 bg-gray-800 rounded-xl px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-500 mb-0.5">Pari recommandé</p>
            {signal.coteRef && (
              <span className="text-sm font-bold text-white bg-gray-700 border border-gray-600 px-2 py-0.5 rounded-lg shrink-0">
                {signal.coteRef.toFixed(2)}
              </span>
            )}
          </div>
          <p className={`text-base font-bold ${typeColor(signal.typePari)}`}>{signal.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">{signal.typePari}</p>
        </div>
      </div>

      {/* Raisonnement */}
      <p className="text-sm text-gray-400 leading-relaxed">{signal.raisonnement}</p>

      {/* Cotes ESPN DraftKings */}
      {hasOdds && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-400 font-semibold mb-1.5">
            📊 Cotes {signal.odds?.provider ? `— ${signal.odds.provider}` : '— DraftKings'}
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {signal.odds?.homeMoneyLine != null && signal.odds.homeMoneyLine !== 0 && (
              <span className="text-white font-mono">
                Dom: <span className={signal.odds.homeMoneyLine < 0 ? 'text-emerald-400' : 'text-yellow-400'}>
                  {formatMoneyLine(signal.odds.homeMoneyLine)}
                </span>
              </span>
            )}
            {signal.odds?.awayMoneyLine != null && signal.odds.awayMoneyLine !== 0 && (
              <span className="text-white font-mono">
                Ext: <span className={signal.odds.awayMoneyLine < 0 ? 'text-emerald-400' : 'text-yellow-400'}>
                  {formatMoneyLine(signal.odds.awayMoneyLine)}
                </span>
              </span>
            )}
            {signal.odds?.overUnder != null && signal.odds.overUnder > 0 && (
              <span className="text-gray-400 font-mono">
                OU: <span className="text-white">{signal.odds.overUnder}</span>
              </span>
            )}
            {signal.odds?.spread && (
              <span className="text-gray-400 font-mono">
                Spread: <span className="text-white">{signal.odds.spread}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {signal.stats.map((s, i) => (
          <div key={i} className={`text-center rounded-lg p-2 ${s.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={signal.lienCalculateur}
        className="mt-auto flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
      >
        {ctaLabel(signal.sport)}
      </Link>
    </div>
  )
}

// ---- Enrichissement coteRef (Pinnacle via The Odds API) ----
function addCoteRef(signals: Signal[], oddsMap: Partial<Record<Signal['sport'], OddsEvent[]>>): Signal[] {
  return signals.map(signal => {
    const events = oddsMap[signal.sport] ?? []
    if (!events.length) return signal
    const parts = signal.match.split(' vs ')
    if (parts.length < 2) return signal
    const [t1, t2] = parts.map(p => p.trim())
    const event = findEvent(events, t1, t2)
    if (!event) return signal
    const realOdds = extractRealOdds(event, signal.typePari, signal.pari)
    return realOdds ? { ...signal, coteRef: realOdds.cote } : signal
  })
}

// ---- Match ESPN odds to CdM signal by team name ----
function enrichSignalWithOdds(signal: Signal, espnOdds: ESPNCdMOdds[]): Signal {
  // Try to match by team abbreviation or display name
  const matchingOdds = espnOdds.find(odds => {
    const homeMatch =
      signal.match.toLowerCase().includes(odds.homeDisplayName.toLowerCase()) ||
      signal.match.toLowerCase().includes(odds.homeTeam.toLowerCase())
    const awayMatch =
      signal.match.toLowerCase().includes(odds.awayDisplayName.toLowerCase()) ||
      signal.match.toLowerCase().includes(odds.awayTeam.toLowerCase())
    return homeMatch && awayMatch
  })

  if (!matchingOdds || !matchingOdds.hasOdds) return signal

  return {
    ...signal,
    odds: {
      homeMoneyLine: matchingOdds.homeMoneyLine,
      awayMoneyLine: matchingOdds.awayMoneyLine,
      overUnder: matchingOdds.overUnder,
      spread: matchingOdds.spread || undefined,
      provider: 'DraftKings',
    },
  }
}

// ---- Page ----
export default async function SignauxPage() {
  // 1. Fetch everything in parallel
  const [games, standings, espnCdMOdds, nbaSignals, liveFootballSignals, tennisSignals, mlsSignals, mlbOdds, cdmOdds, nbaOdds, tennisOdds, mlsOdds] = await Promise.all([
    getSchedule(),
    getStandings(),
    getCdMUpcomingWithOdds(14),
    generateNBASignalsForToday().catch(() => [] as Signal[]),
    generateFootballSignalsForToday(LEAGUES.WORLD_CUP, 2026).catch(() => [] as Signal[]),
    generateTennisSignalsForToday().catch(() => [] as Signal[]),
    generateMLSSignalsForToday().catch(() => [] as Signal[]),
    getMLBOdds().catch(() => [] as OddsEvent[]),
    getCdMOdds().catch(() => [] as OddsEvent[]),
    getNBAOdds().catch(() => [] as OddsEvent[]),
    getTennisOdds().catch(() => [] as OddsEvent[]),
    getMLSOdds().catch(() => [] as OddsEvent[]),
  ])

  const oddsMap: Partial<Record<Signal['sport'], OddsEvent[]>> = {
    MLB:    mlbOdds,
    CdM:    cdmOdds,
    NBA:    nbaOdds,
    Tennis: tennisOdds,
    MLS:    mlsOdds,
  }

  const previewGames = games.filter(g => g.status.abstractGameState === 'Preview')

  // Construire la map teamId → RPG depuis les standings
  const teamRPG: Record<number, number> = {}
  for (const div of standings) {
    for (const rec of div.teamRecords) {
      const gp = rec.wins + rec.losses
      if (gp > 0 && rec.runsScored) {
        teamRPG[rec.team.id] = rec.runsScored / gp
      }
    }
  }

  // 2. Générer les signaux MLB
  const rawMlbSignals = (
    await Promise.all(
      previewGames.map(async (game) => {
        const homePitcherId = game.teams.home.probablePitcher?.id
        const awayPitcherId = game.teams.away.probablePitcher?.id
        const [homeStats, awayStats] = await Promise.all([
          homePitcherId ? getPitcherSeasonStats(homePitcherId) : Promise.resolve(null),
          awayPitcherId ? getPitcherSeasonStats(awayPitcherId) : Promise.resolve(null),
        ])
        return generateMLBSignal(game, homeStats, awayStats, teamRPG)
      })
    )
  ).filter(Boolean) as Signal[]
  const mlbSignals = addCoteRef(rawMlbSignals, oddsMap)

  // 3. Signaux CdM — live (API-Football) ou statiques selon disponibilité
  const rawCdMSignals = generateCdMSignals(14)
  const staticCdmSignals = rawCdMSignals.map(s => enrichSignalWithOdds(s, espnCdMOdds))
  const cdmSignals = addCoteRef([...liveFootballSignals, ...staticCdmSignals], oddsMap)

  // 4. Trier chaque groupe par force
  const forceOrder: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  const sortByForce = (arr: Signal[]) => [...arr].sort((a, b) => forceOrder[a.force] - forceOrder[b.force])

  const enrichedTennis = addCoteRef(tennisSignals, oddsMap)
  const enrichedNBA    = addCoteRef(nbaSignals,    oddsMap)
  const enrichedMLS    = addCoteRef(mlsSignals,    oddsMap)

  const allSignals = sortByForce([...mlbSignals, ...enrichedMLS, ...enrichedNBA, ...cdmSignals, ...enrichedTennis])

  const fortsCount      = allSignals.filter(s => s.force === 'fort').length
  const moderésCount    = allSignals.filter(s => s.force === 'modéré').length
  const surveillerCount = allSignals.filter(s => s.force === 'à surveiller').length
  const withOddsCount   = staticCdmSignals.filter(s => s.odds?.homeMoneyLine || s.odds?.awayMoneyLine).length

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1">⚡ Signaux du jour</h1>
            <p className="text-gray-400">
              Paris recommandés analysés automatiquement — MLB temps réel · CdM 2026 · Cotes ESPN/DraftKings
            </p>
          </div>
        </div>

        {/* Résumé stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{allSignals.length}</p>
            <p className="text-xs text-gray-500 mt-1">Signaux totaux</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{fortsCount}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Forts</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{moderésCount}</p>
            <p className="text-xs text-gray-500 mt-1">🔶 Modérés</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{withOddsCount}</p>
            <p className="text-xs text-gray-500 mt-1">📊 Avec cotes ESPN</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300 flex gap-3 items-start">
          <span className="text-lg mt-0.5">ℹ️</span>
          <div>
            <p className="font-semibold mb-1">Comment lire ces signaux ?</p>
            <p className="text-blue-400/80">
              Les signaux <span className="text-emerald-400 font-semibold">forts</span> sont basés sur des écarts statistiques significatifs (ERA, WHIP, classements Elo).
              Les signaux <span className="text-yellow-400 font-semibold">modérés</span> indiquent un avantage réel mais le match reste incertain.
              Les <span className="text-blue-400 font-semibold">cotes ESPN</span> (DraftKings) apparaissent sur les matchs CdM disponibles.
            </p>
          </div>
        </div>

        {/* ---- Top 3 signaux forts du jour ---- */}
        {allSignals.filter(s => s.force === 'fort').length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">À ne pas rater aujourd&apos;hui</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                ⚡ Top signaux
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allSignals.filter(s => s.force === 'fort').slice(0, 3).map(s => (
                <SignalCard key={`top-${s.id}`} signal={s} />
              ))}
            </div>
            {allSignals.filter(s => s.force === 'fort').length > 3 && (
              <p className="text-xs text-gray-600 text-center mt-3">
                + {allSignals.filter(s => s.force === 'fort').length - 3} autres signaux forts ci-dessous
              </p>
            )}
          </section>
        )}

        <SignauxFilter
          counts={{
            mlb:    mlbSignals.length,
            cdm:    cdmSignals.length,
            nba:    nbaSignals.length,
            tennis: tennisSignals.length,
            mls:    mlsSignals.length,
          }}
          tennis={(
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-orange-300">🎾 Tennis — Roland Garros</h2>
                {tennisSignals.length > 0
                  ? <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">{tennisSignals.length} signal{tennisSignals.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
                <Link href="/tennis" className="ml-auto text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                  Voir les matchs →
                </Link>
              </div>
              {tennisSignals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortByForce(enrichedTennis).map(s => <SignalCard key={s.id} signal={s} />)}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-gray-500 text-sm mb-1">Pas de signal tennis aujourd&apos;hui</p>
                  <p className="text-gray-600 text-xs">Les signaux apparaissent quand un écart de classement ou de stats de service est significatif.</p>
                  <Link href="/tennis" className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors">
                    Analyser les matchs tennis →
                  </Link>
                </div>
              )}
            </section>
          )}
          mlb={(
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-blue-300">⚾ MLB — Matchups du jour</h2>
                {mlbSignals.length > 0
                  ? <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{mlbSignals.length} signal{mlbSignals.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
                <Link href="/mlb" className="ml-auto text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                  Voir les matchs →
                </Link>
              </div>
              {mlbSignals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortByForce(mlbSignals).map(s => <SignalCard key={s.id} signal={s} />)}

                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-gray-500 text-sm mb-1">
                    {previewGames.length > 0
                      ? `${previewGames.length} match${previewGames.length > 1 ? 's' : ''} analysé${previewGames.length > 1 ? 's' : ''} — aucun écart statistique significatif`
                      : 'Aucun match MLB prévu aujourd\'hui'}
                  </p>
                  <p className="text-gray-600 text-xs">Les signaux apparaissent quand un écart d&apos;ERA significatif est détecté entre les lanceurs.</p>
                  <Link href="/mlb" className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Analyser les matchs manuellement →
                  </Link>
                </div>
              )}
            </section>
          )}
          cdm={(
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-emerald-300">🌍 CdM 2026 — À venir</h2>
                {cdmSignals.length > 0
                  ? <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{cdmSignals.length} signal{cdmSignals.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
                {withOddsCount > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                    {withOddsCount} avec cotes ESPN
                  </span>
                )}
                <Link href="/cdm" className="ml-auto text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                  Voir le calendrier →
                </Link>
              </div>
              {cdmSignals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cdmSignals.map(s => <SignalCard key={s.id} signal={s} />)}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-gray-500 text-sm">Aucun signal CdM détecté sur les 14 prochains jours.</p>
                </div>
              )}
            </section>
          )}
          mls={(
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-green-300">⚽ MLS — Signaux du jour</h2>
                {mlsSignals.length > 0
                  ? <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{mlsSignals.length} signal{mlsSignals.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
                <Link href="/mls" className="ml-auto text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                  Voir les matchs →
                </Link>
              </div>
              {mlsSignals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortByForce(enrichedMLS).map(s => <SignalCard key={s.id} signal={s} />)}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-gray-500 text-sm mb-1">Pas de signal MLS aujourd&apos;hui</p>
                  <p className="text-gray-600 text-xs">Les signaux apparaissent quand un écart de win rate contextuel (domicile/extérieur) ou un total de buts hors norme est détecté.</p>
                  <Link href="/mls" className="inline-block mt-3 text-sm text-green-400 hover:text-green-300 transition-colors">
                    Analyser les matchs MLS →
                  </Link>
                </div>
              )}
            </section>
          )}
          nba={(
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-orange-300">🏀 NBA Playoffs</h2>
                {nbaSignals.length > 0
                  ? <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">{nbaSignals.length} signal{nbaSignals.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
                <Link href="/nba" className="ml-auto text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                  Voir les matchs →
                </Link>
              </div>
              {nbaSignals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortByForce(enrichedNBA).map(s => <SignalCard key={s.id} signal={s} />)}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                  <p className="text-gray-500 text-sm mb-1">Pas de signal NBA aujourd&apos;hui</p>
                  <p className="text-gray-600 text-xs">Les signaux apparaissent quand la série présente un écart de total ou une domination claire (≥ 3-1 dans la série).</p>
                  <Link href="/nba" className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors">
                    Analyser les matchups playoffs →
                  </Link>
                </div>
              )}
            </section>
          )}
        />

        {allSignals.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-xl font-semibold mb-2">Aucun signal détecté aujourd&apos;hui</p>
            <p className="text-sm">Les signaux apparaissent quand des avantages statistiques significatifs sont identifiés sur les matchups du jour.</p>
          </div>
        )}

        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">💰 Calculateur de Value Bet</p>
            <p className="text-sm text-gray-400">Entre ta cote, notre probabilité estimée et calcule ton edge avec le critère de Kelly.</p>
          </div>
          <Link href="/paris/calculateur"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm">
            Calculer →
          </Link>
        </div>
      </div>
    </main>
  )
}
