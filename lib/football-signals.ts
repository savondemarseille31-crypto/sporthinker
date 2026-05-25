import type { Signal, SignalForce } from './signals'
import type { AFFixture, AFFixtureWithStats } from './api-football'
import { getFixturesByDate, getTeamFormWithStats } from './api-football'
import { CDM_TEAM_PROFILES } from './cdm-teams'

// ---- Types internes ----

type TeamFormMetrics = {
  avgXGCreated: number
  avgXGConceded: number
  avgCorners: number
  avgYellows: number
  avgGoalsScored: number
  avgGoalsConceded: number
  winRate: number
  cleanSheetRate: number
  scoringRate: number  // % des matchs où l'équipe a marqué
  matchesAnalyzed: number
  source: 'api' | 'estimate'
}

// ---- Estimation basée sur le classement FIFA (fallback pré-tournoi) ----
// Calibrage : top 5 xGCréé~2.1, top 20~1.5, top 40~1.2, 40+~0.9

function estimateFromFIFA(fifaRanking: number): TeamFormMetrics {
  const rank = Math.max(1, Math.min(50, fifaRanking))
  const xGCreated = Math.max(0.8, 2.4 - rank * 0.028)
  const xGConceded = Math.min(2.1, 0.6 + rank * 0.028)
  const winRate = Math.max(0.1, Math.min(0.88, 0.92 - rank * 0.016))
  const cleanSheetRate = Math.max(0.08, Math.min(0.65, 0.68 - rank * 0.013))
  const scoringRate = Math.min(0.97, Math.max(0.42, 0.98 - rank * 0.009))

  return {
    avgXGCreated: xGCreated,
    avgXGConceded: xGConceded,
    avgCorners: Math.max(3.0, 7.5 - rank * 0.07),
    avgYellows: 1.5,
    avgGoalsScored: xGCreated * 0.83,
    avgGoalsConceded: xGConceded * 0.83,
    winRate,
    cleanSheetRate,
    scoringRate,
    matchesAnalyzed: 0,
    source: 'estimate',
  }
}

// ---- Calcul des métriques depuis les matchs réels API ----

function computeMetrics(teamId: number, fixtures: AFFixtureWithStats[]): TeamFormMetrics {
  if (!fixtures.length) {
    return {
      avgXGCreated: 1.2, avgXGConceded: 1.2, avgCorners: 5, avgYellows: 1.5,
      avgGoalsScored: 1.2, avgGoalsConceded: 1.2, winRate: 0.5,
      cleanSheetRate: 0.3, scoringRate: 0.7, matchesAnalyzed: 0, source: 'estimate',
    }
  }

  let xGCreated = 0, xGConceded = 0, corners = 0, yellows = 0
  let goalsFor = 0, goalsAgainst = 0, wins = 0, cleanSheets = 0, scored = 0

  for (const f of fixtures) {
    const isHome = f.homeTeam.id === teamId
    const myStats = isHome ? f.homeStats : f.awayStats
    const oppStats = isHome ? f.awayStats : f.homeStats
    const myGoals = isHome ? f.homeGoals : f.awayGoals
    const oppGoals = isHome ? f.awayGoals : f.homeGoals

    // Si xG absent de l'API, on estime depuis les tirs (0.1 xG/tir en moyenne)
    xGCreated += myStats.xG || myStats.shots * 0.10
    xGConceded += oppStats.xG || oppStats.shots * 0.10
    corners += myStats.corners
    yellows += myStats.yellowCards
    goalsFor += myGoals
    goalsAgainst += oppGoals
    if (myGoals > oppGoals) wins++
    if (oppGoals === 0) cleanSheets++
    if (myGoals > 0) scored++
  }

  const n = fixtures.length
  return {
    avgXGCreated: xGCreated / n,
    avgXGConceded: xGConceded / n,
    avgCorners: corners / n,
    avgYellows: yellows / n,
    avgGoalsScored: goalsFor / n,
    avgGoalsConceded: goalsAgainst / n,
    winRate: wins / n,
    cleanSheetRate: cleanSheets / n,
    scoringRate: scored / n,
    matchesAnalyzed: n,
    source: 'api',
  }
}

// ---- Lookup FIFA ranking par nom d'équipe ----

function getFIFARanking(teamName: string): number | null {
  const name = teamName.toLowerCase()
  const profile = CDM_TEAM_PROFILES.find(t =>
    t.pays.toLowerCase() === name ||
    name.includes(t.pays.toLowerCase()) ||
    t.pays.toLowerCase().includes(name)
  )
  return profile?.classementFIFA ?? null
}

// ---- Construction d'un signal ----

function buildSignal(
  fixture: AFFixture,
  leagueId: number,
  force: SignalForce,
  typePari: string,
  pari: string,
  raisonnement: string,
  stats: { label: string; val: string; highlight?: boolean }[],
  suffix: string,
): Signal {
  const date = fixture.fixture.date.split('T')[0]
  const heure = new Date(fixture.fixture.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })

  // Emoji de ligue pour les flags
  const leagueEmoji: Record<number, string> = {
    1: '🌍', 2: '⭐', 39: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 140: '🇪🇸', 61: '🇫🇷', 135: '🇮🇹', 78: '🇩🇪',
  }
  const flag = leagueEmoji[leagueId] ?? '⚽'

  const leagueSport: Record<number, Signal['sport']> = {
    1: 'CdM',
  }
  const sport = leagueSport[leagueId] ?? 'CdM'

  return {
    id: `football-${fixture.fixture.id}-${suffix}`,
    sport,
    match: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
    flagDom: flag,
    flagExt: flag,
    date,
    heure,
    force,
    typePari,
    pari,
    raisonnement,
    stats,
    lienCalculateur: '/paris/calculateur',
  }
}

// ---- Génération des signaux pour un match ----
// Marchés couverts : 1x2, Over/Under buts, BTTS, Total cartons, Total corners

function generateSignalsForFixture(
  fixture: AFFixture,
  home: TeamFormMetrics,
  away: TeamFormMetrics,
  leagueId: number,
): Signal[] {
  const signals: Signal[] = []
  const homeName = fixture.teams.home.name
  const awayName = fixture.teams.away.name
  const isEstimate = home.source === 'estimate' || away.source === 'estimate'
  const sourceNote = isEstimate ? ' (basé sur classements FIFA)' : ` (${home.matchesAnalyzed}+${away.matchesAnalyzed} matchs analysés)`

  const avgXGTotal = home.avgXGCreated + away.avgXGCreated

  // ---- CAS 1 : MONEYLINE domicile ----
  // Attaque dom. forte + défense ext. perméable + défense dom. solide + attaque ext. faible
  if (
    home.avgXGCreated >= 1.75 &&
    away.avgXGConceded >= 1.50 &&
    home.avgXGConceded <= 1.10 &&
    home.winRate >= 0.60 &&
    away.avgXGCreated <= 1.30
  ) {
    const force: SignalForce = home.avgXGCreated >= 2.1 && away.avgXGConceded >= 1.8 ? 'fort' : 'modéré'
    signals.push(buildSignal(fixture, leagueId, force,
      '1x2',
      `Victoire ${homeName}`,
      `${homeName} domine offensivement (xG créé moy. ${home.avgXGCreated.toFixed(2)}/match) face à une défense adverse perméable (xG concédé ${away.avgXGConceded.toFixed(2)}/match). Défense à domicile solide (${home.avgXGConceded.toFixed(2)} xG concédé/match).${sourceNote}`,
      [
        { label: `${homeName} xG créé`, val: home.avgXGCreated.toFixed(2), highlight: true },
        { label: `${homeName} xG concédé`, val: home.avgXGConceded.toFixed(2), highlight: true },
        { label: `${awayName} xG concédé`, val: away.avgXGConceded.toFixed(2) },
        { label: `${homeName} win%`, val: `${Math.round(home.winRate * 100)}%` },
      ],
      'home-ml'
    ))
    return signals // un seul signal par match
  }

  // ---- CAS 2 : MONEYLINE extérieur ----
  if (
    away.avgXGCreated >= 1.75 &&
    home.avgXGConceded >= 1.50 &&
    away.avgXGConceded <= 1.10 &&
    away.winRate >= 0.60 &&
    home.avgXGCreated <= 1.30
  ) {
    const force: SignalForce = away.avgXGCreated >= 2.1 && home.avgXGConceded >= 1.8 ? 'fort' : 'modéré'
    signals.push(buildSignal(fixture, leagueId, force,
      '1x2',
      `Victoire ${awayName}`,
      `${awayName} en grande forme (xG créé ${away.avgXGCreated.toFixed(2)}/match) face à une défense domicile fragilisée (xG concédé ${home.avgXGConceded.toFixed(2)}/match). Défense extérieure solide (${away.avgXGConceded.toFixed(2)} xG concédé/match).${sourceNote}`,
      [
        { label: `${awayName} xG créé`, val: away.avgXGCreated.toFixed(2), highlight: true },
        { label: `${awayName} xG concédé`, val: away.avgXGConceded.toFixed(2), highlight: true },
        { label: `${homeName} xG concédé`, val: home.avgXGConceded.toFixed(2) },
        { label: `${awayName} win%`, val: `${Math.round(away.winRate * 100)}%` },
      ],
      'away-ml'
    ))
    return signals
  }

  // ---- CAS 3 : OVER 2.5 buts ----
  if (avgXGTotal >= 2.90 && home.scoringRate >= 0.72 && away.scoringRate >= 0.72) {
    const force: SignalForce = avgXGTotal >= 3.30 ? 'fort' : 'modéré'
    signals.push(buildSignal(fixture, leagueId, force,
      'Over (Total buts)',
      `OVER 2.5 buts`,
      `Les deux attaques sont en forme : xG total combiné de ${avgXGTotal.toFixed(2)} par match. ${homeName} marque dans ${Math.round(home.scoringRate * 100)}% de ses matchs, ${awayName} dans ${Math.round(away.scoringRate * 100)}%.${sourceNote}`,
      [
        { label: 'xG total moy.', val: avgXGTotal.toFixed(2), highlight: true },
        { label: `${homeName} xG créé`, val: home.avgXGCreated.toFixed(2), highlight: true },
        { label: `${awayName} xG créé`, val: away.avgXGCreated.toFixed(2) },
        { label: 'Score rate moy.', val: `${Math.round((home.scoringRate + away.scoringRate) / 2 * 100)}%` },
      ],
      'over'
    ))
    return signals
  }

  // ---- CAS 4 : UNDER 2.5 buts ----
  if (
    avgXGTotal <= 1.80 &&
    home.cleanSheetRate >= 0.35 &&
    away.cleanSheetRate >= 0.35
  ) {
    const force: SignalForce = avgXGTotal <= 1.40 ? 'fort' : 'modéré'
    signals.push(buildSignal(fixture, leagueId, force,
      'Under (Total buts)',
      `UNDER 2.5 buts`,
      `Deux défenses solides : xG total combiné de ${avgXGTotal.toFixed(2)}/match seulement. ${homeName} garde sa cage vierge dans ${Math.round(home.cleanSheetRate * 100)}% de ses matchs, ${awayName} dans ${Math.round(away.cleanSheetRate * 100)}%.${sourceNote}`,
      [
        { label: 'xG total moy.', val: avgXGTotal.toFixed(2), highlight: true },
        { label: `${homeName} CS%`, val: `${Math.round(home.cleanSheetRate * 100)}%`, highlight: true },
        { label: `${awayName} CS%`, val: `${Math.round(away.cleanSheetRate * 100)}%` },
        { label: 'xG concédé moy.', val: ((home.avgXGConceded + away.avgXGConceded) / 2).toFixed(2) },
      ],
      'under'
    ))
    return signals
  }

  // ---- CAS 5 : BTTS — Les deux équipes marquent ----
  if (
    home.scoringRate >= 0.80 &&
    away.scoringRate >= 0.80 &&
    home.cleanSheetRate <= 0.25 &&
    away.cleanSheetRate <= 0.25
  ) {
    signals.push(buildSignal(fixture, leagueId, 'modéré',
      'BTTS',
      `Les deux équipes marquent (BTTS Oui)`,
      `Les deux équipes marquent régulièrement (${homeName} ${Math.round(home.scoringRate * 100)}%, ${awayName} ${Math.round(away.scoringRate * 100)}%) et les deux défenses sont perméables (clean sheets rares : ${Math.round(home.cleanSheetRate * 100)}% et ${Math.round(away.cleanSheetRate * 100)}%).${sourceNote}`,
      [
        { label: `${homeName} score%`, val: `${Math.round(home.scoringRate * 100)}%`, highlight: true },
        { label: `${awayName} score%`, val: `${Math.round(away.scoringRate * 100)}%`, highlight: true },
        { label: `${homeName} CS%`, val: `${Math.round(home.cleanSheetRate * 100)}%` },
        { label: `${awayName} CS%`, val: `${Math.round(away.cleanSheetRate * 100)}%` },
      ],
      'btts'
    ))
    return signals
  }

  // ---- CAS 6 : Total cartons OVER 2.5 ----
  // Seulement avec données réelles (pas sur estimations FIFA — pas de données cartons arbitre)
  const avgCartons = home.avgYellows + away.avgYellows
  if (
    avgCartons >= 3.60 &&
    home.matchesAnalyzed >= 3 &&
    away.matchesAnalyzed >= 3
  ) {
    signals.push(buildSignal(fixture, leagueId, 'modéré',
      'Total cartons',
      `OVER 2.5 cartons jaunes`,
      `Les deux équipes accumulent en moyenne ${avgCartons.toFixed(1)} cartons jaunes par match. ${homeName} reçoit ${home.avgYellows.toFixed(1)}/match, ${awayName} ${away.avgYellows.toFixed(1)}/match.${sourceNote}`,
      [
        { label: 'Cartons/match combiné', val: avgCartons.toFixed(1), highlight: true },
        { label: `${homeName} jaunes/match`, val: home.avgYellows.toFixed(1) },
        { label: `${awayName} jaunes/match`, val: away.avgYellows.toFixed(1) },
        { label: 'Matchs analysés', val: `${home.matchesAnalyzed}+${away.matchesAnalyzed}` },
      ],
      'cards'
    ))
    return signals
  }

  // ---- CAS 7 : Total corners OVER 10.5 ----
  const avgCorners = home.avgCorners + away.avgCorners
  if (
    avgCorners >= 11.5 &&
    home.matchesAnalyzed >= 3 &&
    away.matchesAnalyzed >= 3
  ) {
    signals.push(buildSignal(fixture, leagueId, 'modéré',
      'Total corners',
      `OVER 10.5 corners`,
      `Les deux équipes génèrent beaucoup de corners : ${homeName} ${home.avgCorners.toFixed(1)}/match + ${awayName} ${away.avgCorners.toFixed(1)}/match = ${avgCorners.toFixed(1)} en moyenne.${sourceNote}`,
      [
        { label: 'Corners/match total', val: avgCorners.toFixed(1), highlight: true },
        { label: `${homeName} corners/match`, val: home.avgCorners.toFixed(1) },
        { label: `${awayName} corners/match`, val: away.avgCorners.toFixed(1) },
        { label: 'Matchs analysés', val: `${home.matchesAnalyzed}+${away.matchesAnalyzed}` },
      ],
      'corners'
    ))
  }

  return signals
}

// ---- Point d'entrée principal ----

export async function generateFootballSignalsForToday(leagueId: number, season: number): Promise<Signal[]> {
  const today = new Date().toISOString().split('T')[0]
  const fixtures = await getFixturesByDate(today, leagueId, season)

  // Uniquement les matchs pas encore commencés
  const upcoming = fixtures.filter(f =>
    f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD'
  )

  if (!upcoming.length) return []

  const signals: Signal[] = []

  for (const fixture of upcoming) {
    const homeId = fixture.teams.home.id
    const awayId = fixture.teams.away.id
    const homeName = fixture.teams.home.name
    const awayName = fixture.teams.away.name

    // Récupérer la forme réelle des deux équipes en parallèle
    const [homeFixtures, awayFixtures] = await Promise.all([
      getTeamFormWithStats(homeId, leagueId, season, 5),
      getTeamFormWithStats(awayId, leagueId, season, 5),
    ])

    // Métriques domicile — données réelles si ≥ 2 matchs, sinon estimations FIFA
    let homeMetrics: TeamFormMetrics
    if (homeFixtures.length >= 2) {
      homeMetrics = computeMetrics(homeId, homeFixtures)
    } else {
      const rank = getFIFARanking(homeName)
      homeMetrics = estimateFromFIFA(rank ?? 30)
    }

    // Métriques extérieur
    let awayMetrics: TeamFormMetrics
    if (awayFixtures.length >= 2) {
      awayMetrics = computeMetrics(awayId, awayFixtures)
    } else {
      const rank = getFIFARanking(awayName)
      awayMetrics = estimateFromFIFA(rank ?? 30)
    }

    const fixtureSignals = generateSignalsForFixture(fixture, homeMetrics, awayMetrics, leagueId)
    signals.push(...fixtureSignals)
  }

  return signals
}
