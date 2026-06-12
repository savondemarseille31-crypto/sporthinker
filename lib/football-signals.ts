import type { Signal, SignalForce } from './signals'
import type { AFFixture, AFFixtureWithStats } from './api-football'
import { getFixturesByDate, getTeamFormWithStats } from './api-football'
import { CDM_TEAM_PROFILES } from './cdm-teams'
import { getElo, isHost } from './cdm-elo'
import { computeMatch, computeMatchFromLambda, type MatchResult } from './dixon-coles'
import { CDM_FIXTURES, getMatchday } from './cdm-fixtures'

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

// ---- Génération de signaux pour un match CdM via Dixon-Coles ----
// Probabilités issues du moteur ELO + matrice de scores (pas d'appel API)

function generateSignalsFromDixonColes(
  fixture: AFFixture,
  result: MatchResult,
  leagueId: number,
): Signal[] {
  const { markets, lh, la, blowoutRisk, conf } = result
  const h = fixture.teams.home.name
  const a = fixture.teams.away.name

  // Force effective = probabilité × confiance données
  function resolveForce(p: number): SignalForce | null {
    const ep = p * conf
    if (ep >= 0.65) return 'fort'
    if (ep >= 0.55) return 'modéré'
    if (ep >= 0.48) return 'à surveiller'
    return null
  }

  const totalGoals = lh + la
  const sourceNote = ` (Dixon-Coles ELO · λ=${lh.toFixed(2)}+${la.toFixed(2)})`

  // Priority order — first eligible signal wins (one per match)

  // 1. Victoire nette domicile
  if (markets.homeWin >= 0.52) {
    const f = resolveForce(markets.homeWin)
    if (f) return [buildSignal(fixture, leagueId, f,
      '1x2', `Victoire ${h}`,
      `P(${h} gagne) = ${Math.round(markets.homeWin * 100)}% selon le modèle Dixon-Coles.` +
      ` Rapport de force ELO : λ domicile ${lh.toFixed(2)} buts/match vs λ extérieur ${la.toFixed(2)}.${sourceNote}`,
      [
        { label: `P(${h})`, val: `${Math.round(markets.homeWin * 100)}%`, highlight: true },
        { label: `P(Nul)`,   val: `${Math.round(markets.draw * 100)}%` },
        { label: `P(${a})`,  val: `${Math.round(markets.awayWin * 100)}%` },
        { label: 'λ dom./ext.', val: `${lh.toFixed(2)} / ${la.toFixed(2)}` },
      ],
      'home-ml',
    )]
  }

  // 2. Victoire nette extérieur
  if (markets.awayWin >= 0.52) {
    const f = resolveForce(markets.awayWin)
    if (f) return [buildSignal(fixture, leagueId, f,
      '1x2', `Victoire ${a}`,
      `P(${a} gagne) = ${Math.round(markets.awayWin * 100)}% selon le modèle Dixon-Coles.` +
      ` Rapport de force ELO : λ domicile ${lh.toFixed(2)} vs λ extérieur ${la.toFixed(2)}.${sourceNote}`,
      [
        { label: `P(${a})`,   val: `${Math.round(markets.awayWin * 100)}%`, highlight: true },
        { label: `P(Nul)`,    val: `${Math.round(markets.draw * 100)}%` },
        { label: `P(${h})`,   val: `${Math.round(markets.homeWin * 100)}%` },
        { label: 'λ dom./ext.', val: `${lh.toFixed(2)} / ${la.toFixed(2)}` },
      ],
      'away-ml',
    )]
  }

  // 3. Over 2.5 — attaques déséquilibrées ou deux forts xG
  // Reduce force if blowoutRisk high (dominant team may see opponents park the bus)
  if (markets.over25 >= 0.55) {
    const adjustedP = markets.over25 * (1 - blowoutRisk * 0.15)
    const f = resolveForce(adjustedP)
    if (f) return [buildSignal(fixture, leagueId, f,
      'Over (Total buts)', 'OVER 2.5 buts',
      `P(+2.5 buts) = ${Math.round(markets.over25 * 100)}% — total attendu ${totalGoals.toFixed(2)} buts.` +
      `${blowoutRisk > 0.5 ? ' Risque de match fermé atténué (déséquilibre fort).' : ''}${sourceNote}`,
      [
        { label: 'P(Over 2.5)', val: `${Math.round(markets.over25 * 100)}%`, highlight: true },
        { label: 'λ total',     val: totalGoals.toFixed(2), highlight: true },
        { label: `λ ${h}`,      val: lh.toFixed(2) },
        { label: `λ ${a}`,      val: la.toFixed(2) },
      ],
      'over',
    )]
  }

  // 4. Under 2.5 — deux défenses solides, match fermé attendu
  if (markets.under25 >= 0.58) {
    const f = resolveForce(markets.under25)
    if (f) return [buildSignal(fixture, leagueId, f,
      'Under (Total buts)', 'UNDER 2.5 buts',
      `P(-2.5 buts) = ${Math.round(markets.under25 * 100)}% — total attendu seulement ${totalGoals.toFixed(2)} buts.${sourceNote}`,
      [
        { label: 'P(Under 2.5)', val: `${Math.round(markets.under25 * 100)}%`, highlight: true },
        { label: 'λ total',      val: totalGoals.toFixed(2), highlight: true },
        { label: `λ ${h}`,       val: lh.toFixed(2) },
        { label: `λ ${a}`,       val: la.toFixed(2) },
      ],
      'under',
    )]
  }

  // 5. BTTS — les deux équipes sont capables de marquer
  if (markets.btts >= 0.60) {
    const f = resolveForce(markets.btts)
    if (f) return [buildSignal(fixture, leagueId, f,
      'BTTS', 'Les deux équipes marquent (BTTS Oui)',
      `P(BTTS) = ${Math.round(markets.btts * 100)}% — les deux équipes sont offensivement dangereuses` +
      ` (λ ${h}: ${lh.toFixed(2)}, λ ${a}: ${la.toFixed(2)}).${sourceNote}`,
      [
        { label: 'P(BTTS)',  val: `${Math.round(markets.btts * 100)}%`, highlight: true },
        { label: `λ ${h}`,  val: lh.toFixed(2), highlight: true },
        { label: `λ ${a}`,  val: la.toFixed(2) },
        { label: 'P(Over 1.5)', val: `${Math.round(markets.over15 * 100)}%` },
      ],
      'btts',
    )]
  }

  return []
}

export function generateCdMSignalsForMatch(opts: {
  id: number
  date: string
  heure: string
  domicile: string
  exterieur: string
}): Signal[] {
  const fixture: AFFixture = {
    fixture: {
      id: opts.id,
      date: `${opts.date}T${opts.heure}:00+02:00`,
      referee: null,
      status: { long: 'Not Started', short: 'NS', elapsed: null },
    },
    league: { id: 1, name: 'FIFA World Cup', season: 2026, round: 'Group Stage' },
    teams: {
      home: { id: 0, name: opts.domicile, logo: '', winner: null },
      away: { id: 0, name: opts.exterieur, logo: '', winner: null },
    },
    goals: { home: null, away: null },
  }

  const eloH = getElo(opts.domicile)
  const eloA = getElo(opts.exterieur)

  // J3 stake flag — dernière journée : certaines équipes peuvent gérer leur qualification
  // conf réduit à 0.70 (vs 0.85) → les signaux "fort" deviennent quasi impossibles
  const matchday = getMatchday(opts.id)
  const conf = matchday === 3 ? 0.70 : 0.85

  const result = computeMatch(eloH, eloA, isHost(opts.domicile), isHost(opts.exterieur), conf)

  const signals = generateSignalsFromDixonColes(fixture, result, 1)

  // Annoter le raisonnement si J3
  if (matchday === 3 && signals.length > 0) {
    signals[0] = {
      ...signals[0],
      raisonnement:
        '⚠️ Dernière journée de groupes — gestion possible de la qualification à prendre en compte. ' +
        signals[0].raisonnement,
    }
  }

  // Patcher les vrais flags d'équipe (buildSignal met l'emoji de ligue par défaut)
  const fixtureData = CDM_FIXTURES.find(f => f.id === opts.id)
  if (fixtureData) {
    return signals.map(s => ({ ...s, flagDom: fixtureData.flagD, flagExt: fixtureData.flagE }))
  }

  return signals
}

// ---- Point d'entrée principal ----
// Pendant le tournoi : blend ELO prior + xG réel → Dixon-Coles
// w = min(1, matchsJoués/5) → conf monte de 0.85 à 1.0 au fur et à mesure

export async function generateFootballSignalsForToday(leagueId: number, season: number): Promise<Signal[]> {
  const today = new Date().toISOString().split('T')[0]
  const fixtures = await getFixturesByDate(today, leagueId, season)

  const upcoming = fixtures.filter(f =>
    f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD'
  )
  if (!upcoming.length) return []

  const signals: Signal[] = []

  for (const fixture of upcoming) {
    const homeId   = fixture.teams.home.id
    const awayId   = fixture.teams.away.id
    const homeName = fixture.teams.home.name
    const awayName = fixture.teams.away.name

    const [homeFixtures, awayFixtures] = await Promise.all([
      getTeamFormWithStats(homeId, leagueId, season, 5),
      getTeamFormWithStats(awayId, leagueId, season, 5),
    ])

    const homeMetrics = homeFixtures.length >= 2
      ? computeMetrics(homeId, homeFixtures)
      : estimateFromFIFA(getFIFARanking(homeName) ?? 30)

    const awayMetrics = awayFixtures.length >= 2
      ? computeMetrics(awayId, awayFixtures)
      : estimateFromFIFA(getFIFARanking(awayName) ?? 30)

    // Blend ELO prior avec xG réel — poids croissant selon le nombre de matchs joués
    const wHome = Math.min(1.0, homeMetrics.matchesAnalyzed / 5)
    const wAway = Math.min(1.0, awayMetrics.matchesAnalyzed / 5)
    const w     = (wHome + wAway) / 2

    const eloH   = getElo(homeName)
    const eloA   = getElo(awayName)
    const eloResult = computeMatch(eloH, eloA, isHost(homeName), isHost(awayName), 1.0)

    // λ blendé : xG réel quand disponible, ELO sinon
    const lhBlend = homeMetrics.avgXGCreated * wHome + eloResult.lh * (1 - wHome)
    const laBlend = awayMetrics.avgXGCreated * wAway + eloResult.la * (1 - wAway)
    const conf    = 0.85 + 0.15 * w   // 0.85 pré-tournoi → 1.0 après 5 matchs

    const result  = computeMatchFromLambda(lhBlend, laBlend, conf)

    // Signaux principaux via Dixon-Coles
    let fixtureSignals = generateSignalsFromDixonColes(fixture, result, leagueId)

    // Marchés secondaires (cartons, corners) si pas de signal principal — garde la logique règle
    if (fixtureSignals.length === 0) {
      const avgCartons = homeMetrics.avgYellows + awayMetrics.avgYellows
      if (avgCartons >= 3.60 && homeMetrics.matchesAnalyzed >= 3 && awayMetrics.matchesAnalyzed >= 3) {
        fixtureSignals = [buildSignal(fixture, leagueId, 'modéré',
          'Total cartons', 'OVER 2.5 cartons jaunes',
          `Moyenne combinée de ${avgCartons.toFixed(1)} cartons/match sur ${homeMetrics.matchesAnalyzed}+${awayMetrics.matchesAnalyzed} matchs.`,
          [
            { label: 'Cartons/match', val: avgCartons.toFixed(1), highlight: true },
            { label: `${homeName} jaunes`, val: homeMetrics.avgYellows.toFixed(1) },
            { label: `${awayName} jaunes`, val: awayMetrics.avgYellows.toFixed(1) },
          ],
          'cards',
        )]
      } else {
        const avgCorners = homeMetrics.avgCorners + awayMetrics.avgCorners
        if (avgCorners >= 11.5 && homeMetrics.matchesAnalyzed >= 3 && awayMetrics.matchesAnalyzed >= 3) {
          fixtureSignals = [buildSignal(fixture, leagueId, 'modéré',
            'Total corners', 'OVER 10.5 corners',
            `Moyenne combinée de ${avgCorners.toFixed(1)} corners/match.`,
            [
              { label: 'Corners/match', val: avgCorners.toFixed(1), highlight: true },
              { label: `${homeName} corners`, val: homeMetrics.avgCorners.toFixed(1) },
              { label: `${awayName} corners`, val: awayMetrics.avgCorners.toFixed(1) },
            ],
            'corners',
          )]
        }
      }
    }

    signals.push(...fixtureSignals)
  }

  return signals
}
