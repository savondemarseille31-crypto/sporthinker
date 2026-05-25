import type { TennisFixture, TennisPlayer, TennisPlayerStats, TennisH2H, TennisSurface } from './tennis-api'
import type { Signal, SignalForce } from './signals'

// =============================================
// CONSTANTES & CALIBRATIONS
// =============================================

// Probabilité minimale pour générer un signal
const PROB_FORT   = 0.72   // > 72% → fort
const PROB_MODÉRÉ = 0.62   // > 62% → modéré
const PROB_MIN    = 0.55   // < 55% → pas de signal (trop incertain)

// Seuils total jeux (Best-of-3 WTA / ATP hors GS)
const BO3_UNDER_THRESHOLD = 19.5   // < 20 jeux attendus → UNDER
const BO3_OVER_THRESHOLD  = 23.5   // > 23 jeux attendus → OVER

// Seuils total jeux (Best-of-5 ATP GS)
const BO5_UNDER_THRESHOLD = 32.5
const BO5_OVER_THRESHOLD  = 38.5

// Elo de référence (joueur classé 1 mondial)
const ELO_BASE = 2400
const ELO_K    = 400    // facteur standard

// =============================================
// HELPERS ELO
// =============================================

// Elo approximatif depuis le classement ATP/WTA
// #1 → ~2400, #10 → ~2250, #50 → ~2080, #100 → ~1960, #200 → ~1830
function rankToElo(ranking: number): number {
  if (ranking <= 0) return 1800
  return Math.max(1600, ELO_BASE - Math.log(ranking) * 120)
}

// P(A bat B) selon Elo
function eloProbability(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / ELO_K))
}

// =============================================
// PROBABILITÉ DE VICTOIRE BLENDÉE
// Formule : 60% Elo ranking + 40% win rate surface (si ≥ 8 matchs sur cette surface)
// =============================================

type WinProbInput = {
  player: TennisPlayer
  stats: TennisPlayerStats | null
  surface: TennisSurface
}

function winProbability(a: WinProbInput, b: WinProbInput): number {
  // Couche 1 : Elo depuis le ranking
  const eloA = rankToElo(a.player.ranking)
  const eloB = rankToElo(b.player.ranking)
  const eloProb = eloProbability(eloA, eloB)

  // Couche 2 : win rate sur la surface (si données suffisantes)
  const MIN_SURFACE_MATCHES = 8
  const getSurfaceWinRate = (p: WinProbInput): number | null => {
    if (!p.stats) return null
    switch (p.surface) {
      case 'Clay':  return p.stats.clayMatches  >= MIN_SURFACE_MATCHES ? p.stats.clayWinRate  : null
      case 'Hard':
      case 'Indoor Hard': return p.stats.hardMatches  >= MIN_SURFACE_MATCHES ? p.stats.hardWinRate  : null
      case 'Grass': return p.stats.grassMatches >= MIN_SURFACE_MATCHES ? p.stats.grassWinRate : null
    }
  }

  const wrA = getSurfaceWinRate(a)
  const wrB = getSurfaceWinRate(b)

  let surfaceProb = 0.5
  if (wrA !== null && wrB !== null && wrA + wrB > 0) {
    surfaceProb = wrA / (wrA + wrB)
  }

  const hasSurfaceData = wrA !== null && wrB !== null
  const surfaceWeight  = hasSurfaceData ? 0.40 : 0.0

  return eloProb * (1 - surfaceWeight) + surfaceProb * surfaceWeight
}

// =============================================
// AJUSTEMENT H2H
// Applique ±0.03 max selon l'historique H2H sur cette surface
// =============================================

function h2hAdjustment(
  probA: number,
  h2h: TennisH2H | null,
  surface: TennisSurface,
  isPlayerA_P1: boolean,
): number {
  if (!h2h) return probA
  const totalH2H = h2h.player1Wins + h2h.player2Wins
  if (totalH2H < 3) return probA // trop peu de matchs pour ajuster

  // H2H sur cette surface
  const surfaceH2H = surface === 'Clay'
    ? { p1: h2h.clayP1Wins, p2: h2h.clayP2Wins }
    : { p1: h2h.player1Wins, p2: h2h.player2Wins }

  const surfaceTotal = surfaceH2H.p1 + surfaceH2H.p2
  if (surfaceTotal < 3) return probA

  const p1DomRate = surfaceH2H.p1 / surfaceTotal
  // Ajustement max ±0.03 (ne doit pas renverser le résultat Elo/surface)
  const h2hAdj = (p1DomRate - 0.5) * 0.06  // [-0.03, +0.03]

  return isPlayerA_P1 ? probA + h2hAdj : probA - h2hAdj
}

// =============================================
// ESTIMATION DU NOMBRE DE JEUX PAR MATCH
// Basé sur les stats de service/retour
// Clay : moyen ~22 jeux (BO3) ou ~35 jeux (BO5)
// Grands serveurs → UNDER ; baseliners équilibrés → OVER
// =============================================

function estimatedGames(
  statsA: TennisPlayerStats | null,
  statsB: TennisPlayerStats | null,
  bestOf: 3 | 5,
  surface: TennisSurface,
): number {
  // Durée moyenne d'un set en jeux selon la surface
  const baseGamesPerSet: Record<TennisSurface, number> = {
    'Clay':       10.4,
    'Hard':        9.8,
    'Grass':       9.2,
    'Indoor Hard': 9.6,
  }

  const avgGamesPerSet = baseGamesPerSet[surface]

  // Ajustement selon la domination service vs retour
  if (statsA && statsB) {
    // Score de service : pts gagnés sur 1ère + 2ème balle, normalisé
    const serviceScore = (
      (statsA.ptsWonOn1stServe + statsA.ptsWonOn2ndServe) / 2 +
      (statsB.ptsWonOn1stServe + statsB.ptsWonOn2ndServe) / 2
    ) / 2

    // serviceScore > 65 → grands serveurs → moins de breaks → moins de jeux
    // serviceScore < 55 → bons returneurs → plus de breaks → plus de jeux
    const serviceAdj = (serviceScore - 62) * 0.08  // [-0.5, +0.5] environ
    const adjustedGamesPerSet = avgGamesPerSet - serviceAdj

    const avgSets = bestOf === 5 ? 3.6 : 2.3  // moyenne sets par match
    return adjustedGamesPerSet * avgSets
  }

  // Fallback sans stats
  const avgSets = bestOf === 5 ? 3.6 : 2.3
  return avgGamesPerSet * avgSets
}

// =============================================
// GÉNÉRATION DES SIGNAUX
// =============================================

function buildSignal(
  fixture: TennisFixture,
  force: SignalForce,
  typePari: string,
  pari: string,
  raisonnement: string,
  stats: Signal['stats'],
): Signal {
  const date = new Date(fixture.timestamp * 1000)
  const heure = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })

  return {
    id: `tennis-${fixture.id}-${typePari.toLowerCase().replace(/\s+/g, '-')}`,
    sport: 'Tennis',
    match: `${fixture.players.home.name} vs ${fixture.players.away.name}`,
    flagDom: '🎾',
    flagExt: '🎾',
    date: fixture.date,
    heure,
    force,
    typePari,
    pari,
    raisonnement,
    stats,
    lienCalculateur: '/paris/calculateur',
    tournament: fixture.league.name,
    tournamentLevel: fixture.league.level,
  }
}

export type TennisSignalInput = {
  fixture: TennisFixture
  homeStats: TennisPlayerStats | null
  awayStats: TennisPlayerStats | null
  h2h: TennisH2H | null
}

export function generateTennisSignals(input: TennisSignalInput): Signal[] {
  const { fixture, homeStats, awayStats, h2h } = input
  const { players, league } = fixture

  // Ne générer des signaux que pour les matchs pas encore commencés
  if (fixture.status.short !== 'NS' && fixture.status.short !== 'LIVE') return []

  const surface = league.surface
  const isGrandSlam = league.type === 'Grand Slam'
  const bestOf: 3 | 5 = isGrandSlam ? 5 : 3

  const signals: Signal[] = []

  // ---- PROBABILITÉ DE VICTOIRE ----
  const rawProb = winProbability(
    { player: players.home, stats: homeStats, surface },
    { player: players.away, stats: awayStats, surface },
  )
  const prob = h2hAdjustment(rawProb, h2h, surface, true)

  const favored  = prob >= 0.5 ? players.home : players.away
  const underdog = prob >= 0.5 ? players.away : players.home
  const favProb  = Math.max(prob, 1 - prob)  // toujours > 0.5

  const rankDiff = Math.abs(players.home.ranking - players.away.ranking)

  // Contexte H2H pour le raisonnement
  const h2hNote = (() => {
    if (!h2h || h2h.player1Wins + h2h.player2Wins < 2) return ''
    const f = favored.id === h2h.player1.id
    const wins = f ? h2h.player1Wins : h2h.player2Wins
    const losses = f ? h2h.player2Wins : h2h.player1Wins
    if (wins + losses < 2) return ''
    return ` H2H : ${wins}-${losses} en faveur de ${favored.name}.`
  })()

  const surfaceNote = (() => {
    const st = favored.id === players.home.id ? homeStats : awayStats
    if (!st) return ''
    const rate = surface === 'Clay' ? st.clayWinRate : surface === 'Grass' ? st.grassWinRate : st.hardWinRate
    const count = surface === 'Clay' ? st.clayMatches : surface === 'Grass' ? st.grassMatches : st.hardMatches
    if (count < 8) return ''
    return ` Win rate ${surface} : ${(rate * 100).toFixed(0)}% sur ${count} matchs.`
  })()

  // ── CAS 1 : Vainqueur du match ──
  if (favProb >= PROB_MIN) {
    const force: SignalForce = favProb >= PROB_FORT ? 'fort' : favProb >= PROB_MODÉRÉ ? 'modéré' : 'à surveiller'
    signals.push(buildSignal(
      fixture, force,
      'Vainqueur',
      `Victoire ${favored.name}`,
      `${favored.name} (#${favored.ranking} ATP/WTA) est favori avec ${(favProb * 100).toFixed(0)}% de probabilité estimée face à ${underdog.name} (#${underdog.ranking}).${surfaceNote}${h2hNote} Surface ${surface}.`,
      [
        { label: 'Prob. victoire',    val: `${(favProb * 100).toFixed(0)}%`, highlight: true },
        { label: `${favored.name.split(' ').pop()} ranking`, val: `#${favored.ranking}`, highlight: true },
        { label: `${underdog.name.split(' ').pop()} ranking`, val: `#${underdog.ranking}` },
        { label: 'Écart ranking',     val: String(rankDiff) },
      ],
    ))
  }

  // ── CAS 2 : Set handicap -1.5 (favori gagne 2-0 en BO3 ou 3-0 en BO5) ──
  if (favProb >= 0.74 && rankDiff >= 25) {
    const handicapStr = bestOf === 5 ? '-2.5 sets' : '-1.5 sets'
    const force: SignalForce = favProb >= 0.80 ? 'fort' : 'modéré'
    signals.push(buildSignal(
      fixture, force,
      'Handicap Sets',
      `${favored.name} ${handicapStr}`,
      `Avantage structurel très net (#${favored.ranking} vs #${underdog.ranking}). ${favProb >= 0.80 ? 'Forte probabilité de victoire en sets directs.' : 'Probabilité élevée de victoire nette.'}${surfaceNote}`,
      [
        { label: 'Prob. victoire',  val: `${(favProb * 100).toFixed(0)}%`, highlight: true },
        { label: 'Format',          val: `Best-of-${bestOf}` },
        { label: 'Handicap',        val: handicapStr,                       highlight: true },
        { label: 'Écart ranking',   val: String(rankDiff) },
      ],
    ))
  }

  // ── CAS 3 : Total jeux UNDER (grands serveurs) ──
  const expectedGames = estimatedGames(homeStats, awayStats, bestOf, surface)
  const underThreshold = bestOf === 5 ? BO5_UNDER_THRESHOLD : BO3_UNDER_THRESHOLD
  const overThreshold  = bestOf === 5 ? BO5_OVER_THRESHOLD  : BO3_OVER_THRESHOLD

  if (homeStats && awayStats) {
    const avgFirstServe = (homeStats.ptsWonOn1stServe + awayStats.ptsWonOn1stServe) / 2
    const avgService    = (homeStats.ptsWonOn2ndServe + awayStats.ptsWonOn2ndServe) / 2

    if (expectedGames <= underThreshold && avgFirstServe >= 68) {
      const force: SignalForce = expectedGames <= underThreshold - 2 ? 'fort' : 'modéré'
      signals.push(buildSignal(
        fixture, force,
        'Under (Total jeux)',
        `UNDER ${underThreshold} jeux`,
        `Deux bons serveurs (${avgFirstServe.toFixed(0)}% pts gagnés sur 1ère balle en moyenne). Total estimé : ~${expectedGames.toFixed(0)} jeux. Peu de breaks attendus sur ${surface}.`,
        [
          { label: 'Jeux estimés',    val: expectedGames.toFixed(0), highlight: true },
          { label: 'Ligne',           val: String(underThreshold),   highlight: true },
          { label: '% pts 1ère balle',val: `${avgFirstServe.toFixed(0)}%` },
          { label: 'Surface',         val: surface },
        ],
      ))
    }

    // ── CAS 4 : Total jeux OVER (bons returneurs / clay) ──
    if (expectedGames >= overThreshold && avgService <= 55) {
      signals.push(buildSignal(
        fixture, 'modéré',
        'Over (Total jeux)',
        `OVER ${overThreshold} jeux`,
        `Deux bons returneurs sur ${surface} (service peu dominant : ${avgService.toFixed(0)}% pts gagnés sur 2ème balle). Nombreux breaks attendus. Total estimé : ~${expectedGames.toFixed(0)} jeux.`,
        [
          { label: 'Jeux estimés',    val: expectedGames.toFixed(0), highlight: true },
          { label: 'Ligne',           val: String(overThreshold),    highlight: true },
          { label: '% pts 2ème balle',val: `${avgService.toFixed(0)}%` },
          { label: 'Surface',         val: surface },
        ],
      ))
    }
  }

  // ── CAS 5 : Valeur outsider (joueur sous-coté sur sa surface) ──
  // Outsider classé 30-150 avec meilleur win rate sur cette surface que le favori
  if (favProb < 0.70 && favProb >= 0.55) {
    const homeWR = surface === 'Clay' ? homeStats?.clayWinRate : surface === 'Grass' ? homeStats?.grassWinRate : homeStats?.hardWinRate
    const awayWR = surface === 'Clay' ? awayStats?.clayWinRate : surface === 'Grass' ? awayStats?.grassWinRate : awayStats?.hardWinRate

    if (homeWR !== undefined && awayWR !== undefined) {
      const underdog2 = homeWR < awayWR ? players.home : players.away
      const underdogWR = Math.max(homeWR ?? 0, awayWR ?? 0)
      const underdogIsActualUnderdog = (underdog2.id === players.home.id && prob < 0.5) ||
                                       (underdog2.id === players.away.id && prob >= 0.5)

      if (underdogIsActualUnderdog && underdogWR >= 0.60 && underdogWR > favProb) {
        signals.push(buildSignal(
          fixture, 'à surveiller',
          'Value outsider',
          `Surveiller ${underdog2.name}`,
          `${underdog2.name} (#${underdog2.ranking}) a un win rate ${surface} de ${(underdogWR * 100).toFixed(0)}% — supérieur à la probabilité implicite. Potentielle value si la cote est intéressante.`,
          [
            { label: 'Win rate surface', val: `${(underdogWR * 100).toFixed(0)}%`, highlight: true },
            { label: 'Ranking',          val: `#${underdog2.ranking}` },
            { label: 'Surface',          val: surface },
            { label: 'Prob. estimée',    val: `${((1 - favProb) * 100).toFixed(0)}%` },
          ],
        ))
      }
    }
  }

  return signals
}

// ── Drapeaux ──────────────────────────────────────────────────────────────────

const NATION_FLAGS: Record<string, string> = {
  'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Russia': '🇷🇺', 'Serbia': '🇷🇸',
  'Germany': '🇩🇪', 'Norway': '🇳🇴', 'Greece': '🇬🇷', 'Poland': '🇵🇱',
  'France': '🇫🇷', 'Australia': '🇦🇺', 'United States': '🇺🇸',
  'Great Britain': '🇬🇧', 'Canada': '🇨🇦', 'Argentina': '🇦🇷',
  'Czech Republic': '🇨🇿', 'Belarus': '🇧🇾', 'Kazakhstan': '🇰🇿',
  'Denmark': '🇩🇰', 'Netherlands': '🇳🇱', 'Switzerland': '🇨🇭',
  'Croatia': '🇭🇷', 'Bulgaria': '🇧🇬', 'Chile': '🇨🇱',
  'Brazil': '🇧🇷', 'Latvia': '🇱🇻', 'Lithuania': '🇱🇹',
  'Belgium': '🇧🇪', 'Ukraine': '🇺🇦', 'Tunisia': '🇹🇳',
  'Hungary': '🇭🇺', 'Slovakia': '🇸🇰', 'Romania': '🇷🇴',
  'Sweden': '🇸🇪', 'Finland': '🇫🇮', 'Austria': '🇦🇹',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'China': '🇨🇳',
  'Georgia': '🇬🇪', 'India': '🇮🇳', 'Portugal': '🇵🇹',
}
function flag(nationality: string): string {
  return NATION_FLAGS[nationality] ?? '🎾'
}

// ── Génération depuis ESPN + profils dynamiques ───────────────────────────────

import type { ESPNMatch } from './espn-tennis'
import { findProfile, blendedWinProb } from './player-profiles'

export function generateSignalFromESPNMatch(match: ESPNMatch): Signal[] {
  const surface = match.surface
  const tour    = match.tour

  const p1Prof = findProfile(match.p1.name, tour)
  const p2Prof = findProfile(match.p2.name, tour)

  // Ranking fallback : profil > ESPN rank > absent
  const rank1 = p1Prof?.rank ?? match.p1.rank ?? null
  const rank2 = p2Prof?.rank ?? match.p2.rank ?? null
  if (!rank1 || !rank2) return []

  // Probabilité blendée : Elo surface + WR 18m + forme 6 matchs
  let prob: number
  if (p1Prof && p2Prof) {
    prob = blendedWinProb(p1Prof, p2Prof, surface)
  } else {
    // Fallback Elo depuis le ranking si profil manquant
    prob = eloProbability(rankToElo(rank1), rankToElo(rank2))
  }

  const favIsP1  = prob >= 0.5
  const favored  = favIsP1 ? match.p1 : match.p2
  const underdog = favIsP1 ? match.p2 : match.p1
  const favProf  = favIsP1 ? p1Prof   : p2Prof
  const favRank  = favIsP1 ? rank1    : rank2
  const undRank  = favIsP1 ? rank2    : rank1
  const favProb  = Math.max(prob, 1 - prob)

  if (favProb < PROB_MIN) return []

  const force: SignalForce = favProb >= PROB_FORT ? 'fort' : favProb >= PROB_MODÉRÉ ? 'modéré' : 'à surveiller'
  const rankDiff           = Math.abs(rank1 - rank2)
  const level              = match.isMajor ? 'Grand Slam' : undefined

  // Détail des composantes pour le raisonnement
  const surfStats = favProf?.[surface]
  const wrNote    = surfStats?.wr18m != null
    ? ` WR ${surface} (18m) : ${(surfStats.wr18m * 100).toFixed(0)}%.`
    : ''
  const formNote  = surfStats?.form6 != null
    ? ` Forme : ${surfStats.form6}/6.`
    : ''

  let raison = `${favored.name} (#${favRank}) estimé à ${(favProb * 100).toFixed(0)}% de probabilité face à ${underdog.name} (#${undRank}).`
  raison += wrNote + formNote

  const base = {
    sport:           'Tennis' as const,
    match:           `${match.p1.name} vs ${match.p2.name}`,
    flagDom:         flag(match.p1.nationality),
    flagExt:         flag(match.p2.nationality),
    date:            match.date,
    heure:           match.time,
    lienCalculateur: '/paris/calculateur',
    tournament:      match.tournament,
    tournamentLevel: level,
  }

  const signals: Signal[] = []

  // Signal 1 — Vainqueur
  signals.push({
    ...base,
    id:           `tennis-espn-${match.id}-win`,
    force,
    typePari:     'Vainqueur',
    pari:         `Victoire ${favored.name}`,
    raisonnement: raison,
    stats: [
      { label: 'Prob. victoire',                          val: `${(favProb * 100).toFixed(0)}%`,                                         highlight: true },
      { label: `Elo ${surface}`,                          val: surfStats ? String(Math.round(surfStats.elo)) : '—',                       highlight: true },
      { label: `WR ${surface} 18m`,                       val: surfStats?.wr18m != null ? `${(surfStats.wr18m * 100).toFixed(0)}%` : '—' },
      { label: 'Forme (6 matchs)',                        val: surfStats?.form6 != null ? `${surfStats.form6}/6` : '—'                    },
    ],
  })

  // Signal 2 — Handicap sets
  if (favProb >= 0.74 && rankDiff >= 20) {
    const handicap = match.bestOf === 5 ? '-2.5 sets' : '-1.5 sets'
    const forceH: SignalForce = favProb >= 0.80 ? 'fort' : 'modéré'
    signals.push({
      ...base,
      id:           `tennis-espn-${match.id}-handicap`,
      force:        forceH,
      typePari:     'Handicap Sets',
      pari:         `${favored.name} ${handicap}`,
      raisonnement: `Avantage structurel très net (#${favRank} vs #${undRank}, écart ${rankDiff} places). Victoire nette attendue sur ${surface}.`,
      stats: [
        { label: 'Prob. victoire', val: `${(favProb * 100).toFixed(0)}%`, highlight: true },
        { label: 'Format',         val: `Best-of-${match.bestOf}` },
        { label: 'Handicap',       val: handicap,                          highlight: true },
        { label: 'Écart ranking',  val: String(rankDiff) },
      ],
    })
  }

  return signals
}

// ── Point d'entrée — utilise ESPN + profils statiques ─────────────────────────

export async function generateTennisSignalsForToday(): Promise<Signal[]> {
  const { getESPNTennisSchedule } = await import('./espn-tennis')

  const today   = new Date().toISOString().split('T')[0]
  const matches = await getESPNTennisSchedule(today).catch(() => [] as ESPNMatch[])

  const scheduled = matches.filter(m => m.status === 'scheduled')
  if (!scheduled.length) return []

  const signals = scheduled.flatMap(m => generateSignalFromESPNMatch(m))

  const order: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  return signals.sort((a, b) => order[a.force] - order[b.force])
}
