// Génération des signaux du jour (tous sports) — source unique partagée par la page
// /signaux ET le cron de capture du track record. Extrait de app/signaux/page.tsx.

import { getSchedule, getStandings, getPitcherSeasonStats } from '@/lib/mlb-api'
import { generateMLBSignal, type Signal, type SignalForce } from '@/lib/signals'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { getCdMUpcomingWithOdds, type ESPNCdMOdds } from '@/lib/espn-api'
import { generateNBASignalsForToday } from '@/lib/nba-signals'
import { generateFootballSignalsForToday, generateCdMSignalsForMatch } from '@/lib/football-signals'
import { LEAGUES } from '@/lib/api-football'
import { generateTennisSignalsForToday } from '@/lib/tennis-signals'
import { generateMLSSignalsForToday } from '@/lib/mls-signals'
import { getKnockoutCdMSignals } from '@/lib/signals/cdm-knockout'
import {
  getMLBOdds, getCdMOdds, getNBAOdds, getTennisOdds, getMLSOdds,
  findEvent, extractRealOdds, devigFromEvent, type OddsEvent,
} from '@/lib/odds-api'

// ---- Enrichissement coteRef + cotes décimales (Pinnacle via The Odds API) ----
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
    if (!realOdds) return signal
    return {
      ...signal,
      coteRef: realOdds.cote,
      odds: {
        home: realOdds.home, draw: realOdds.draw, away: realOdds.away,
        ou: realOdds.ligne, bookmaker: realOdds.bookmaker,
      },
    }
  })
}

// ---- Match ESPN odds to CdM signal by team name ----
function enrichSignalWithOdds(signal: Signal, espnOdds: ESPNCdMOdds[]): Signal {
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

export type TodaySignals = {
  signaux: Signal[]          // tier probabiliste (un match avec value part dans les values)
  values: Signal[]           // tier value (EV > 3%)
  mlbPreviewCount: number    // nb de matchs MLB analysés (pour l'état vide)
}

export async function getTodaySignals(): Promise<TodaySignals> {
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
    MLB: mlbOdds, CdM: cdmOdds, NBA: nbaOdds, Tennis: tennisOdds, MLS: mlsOdds,
  }

  const previewGames = games.filter(g => g.status.abstractGameState === 'Preview')

  const teamRPG: Record<number, number> = {}
  for (const div of standings) {
    for (const rec of div.teamRecords) {
      const gp = rec.wins + rec.losses
      if (gp > 0 && rec.runsScored) teamRPG[rec.team.id] = rec.runsScored / gp
    }
  }

  // MLB
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
      }),
    )
  ).filter(Boolean) as Signal[]
  const mlbSignals = addCoteRef(rawMlbSignals, oddsMap)

  // CdM — Dixon-Coles ELO sur 14 jours. On filtre sur l'heure RÉELLE du coup d'envoi
  // (et non une heure fixe à midi) pour ne pas exclure les matchs du jour qui se jouent
  // le soir : un match à 21:00 reste "à venir" même si on est l'après-midi.
  const cdmNow = new Date()
  const cdmLimit = new Date(cdmNow)
  cdmLimit.setDate(cdmNow.getDate() + 14)
  const upcomingFixtures = CDM_FIXTURES
    .filter(f => {
      const kickoff = new Date(`${f.date}T${f.heure}:00+02:00`) // heure Europe/Paris
      return kickoff >= cdmNow && kickoff <= cdmLimit
    })
    .slice(0, 30)
  const rawCdMSignals = upcomingFixtures.flatMap(f => {
    const ev = cdmOdds.length ? findEvent(cdmOdds, f.domicile, f.exterieur) : null
    return generateCdMSignalsForMatch({
      id: f.id, date: f.date, heure: f.heure, domicile: f.domicile, exterieur: f.exterieur,
      devigged: ev ? devigFromEvent(ev, f.domicile, f.exterieur) : undefined,
    })
  })
  const staticCdmSignals = rawCdMSignals.map(s => enrichSignalWithOdds(s, espnCdMOdds))
  // Phase finale (16es, quarts…) : matchups dynamiques API-Football → signaux Dixon-Coles.
  const knockoutSignals = await getKnockoutCdMSignals(cdmOdds)
  const cdmSignals = addCoteRef([...liveFootballSignals, ...staticCdmSignals, ...knockoutSignals], oddsMap)

  // Tri par force
  const forceOrder: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  const sortByForce = (arr: Signal[]) => [...arr].sort((a, b) => forceOrder[a.force] - forceOrder[b.force])

  const enrichedTennis = addCoteRef(tennisSignals, oddsMap)
  const enrichedNBA    = addCoteRef(nbaSignals,    oddsMap)
  const enrichedMLS    = addCoteRef(mlsSignals,    oddsMap)

  const allSignals = sortByForce([...mlbSignals, ...enrichedMLS, ...enrichedNBA, ...cdmSignals, ...enrichedTennis])

  const isValue = (s: Signal) =>
    s.tier === 'value' ||
    (s.pImpl != null && s.coteRef != null && s.pImpl * s.coteRef - 1 > 0.03)

  const matchKey = (s: Signal) => `${s.sport}|${s.match}|${s.date}`

  const values = sortByForce(
    allSignals.filter(isValue).map(s =>
      s.tier === 'value'
        ? s
        : { ...s, tier: 'value' as const, ev: parseFloat(((s.pImpl! * s.coteRef! - 1) * 100).toFixed(1)) },
    ),
  )
  const valueMatchKeys = new Set(values.map(matchKey))
  const signaux = sortByForce(
    allSignals.filter(s => !isValue(s) && !valueMatchKeys.has(matchKey(s))),
  )

  return { signaux, values, mlbPreviewCount: previewGames.length }
}
