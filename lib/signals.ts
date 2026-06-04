import type { MLBGame } from './mlb-api'
import { CDM_FIXTURES } from './cdm-fixtures'
import { CDM_TEAM_PROFILES } from './cdm-teams'
import { ALL_CDM_PLAYERS } from './cdm-players'

// =============================================
// TYPES
// =============================================
export type SignalForce = 'fort' | 'modéré' | 'à surveiller'

export type Signal = {
  id: string
  sport: 'MLB' | 'CdM' | 'NBA' | 'Tennis' | 'MLS'
  match: string
  flagDom: string
  flagExt: string
  date: string
  heure: string
  force: SignalForce
  typePari: string         // "Moneyline", "Under", "Over", "1X2", "Buteur", "F5"
  pari: string             // La mise concrète : "NYY Moneyline", "UNDER total", "Victoire France"
  raisonnement: string     // Pourquoi ce pari
  stats: { label: string; val: string; highlight?: boolean }[]
  lienCalculateur: string
  tournament?: string      // Nom du tournoi (Tennis uniquement)
  tournamentLevel?: string // Niveau : "Grand Slam", "ATP 250", "Challenger"…
  odds?: {
    homeMoneyLine?: number
    awayMoneyLine?: number
    overUnder?: number
    spread?: string
    provider?: string
  }
  coteRef?: number
}

// =============================================
// HELPERS
// =============================================
function eraLabel(era: number): string {
  if (era < 2.50) return '🟢 Élite'
  if (era < 3.50) return '🟡 Bon'
  if (era < 4.50) return '🟠 Moyen'
  return '🔴 Fragile'
}

function whipLabel(whip: number): string {
  if (whip < 1.00) return '🟢 Exceptionnel'
  if (whip < 1.15) return '🟡 Bon'
  if (whip < 1.30) return '🟠 Correct'
  return '🔴 Trop de coureurs'
}

// =============================================
// HELPERS ERA FIABLE (petit échantillon)
// =============================================
type PitcherStats = Record<string, string | number> | null

export const LEAGUE_AVG_ERA = 4.20
export const LEAGUE_AVG_WHIP = 1.30
const MIN_IP = 15   // seuil minimal d'innings pour ERA fiable

export function reliableERA(stats: PitcherStats): number {
  if (!stats) return LEAGUE_AVG_ERA
  const ip = parseFloat(String(stats.inningsPitched ?? '0'))
  const era = parseFloat(String(stats.era ?? String(LEAGUE_AVG_ERA)))
  if (ip < MIN_IP || isNaN(era)) return LEAGUE_AVG_ERA
  if (ip < 30) return (era * ip + LEAGUE_AVG_ERA * (30 - ip)) / 30
  return era
}

export function reliableWHIP(stats: PitcherStats): number {
  if (!stats) return LEAGUE_AVG_WHIP
  const ip = parseFloat(String(stats.inningsPitched ?? '0'))
  const whip = parseFloat(String(stats.whip ?? String(LEAGUE_AVG_WHIP)))
  if (ip < MIN_IP || isNaN(whip)) return LEAGUE_AVG_WHIP
  return whip
}

export function isSmallSample(stats: PitcherStats): boolean {
  if (!stats) return true
  const ip = parseFloat(String(stats.inningsPitched ?? '0'))
  return ip < MIN_IP
}

// =============================================
// GÉNÉRATION SIGNAUX MLB
// =============================================

export function generateMLBSignal(
  game: MLBGame,
  homeStats: PitcherStats,
  awayStats: PitcherStats,
  teamRPG?: Record<number, number>   // teamId → runs per game from standings
): Signal | null {

  const homeTeam = game.teams.home.team
  const awayTeam = game.teams.away.team
  const homePitcher = game.teams.home.probablePitcher
  const awayPitcher = game.teams.away.probablePitcher

  // Pas assez de données pour un signal fiable
  if (!homePitcher && !awayPitcher) return null

  const homeERA = reliableERA(homeStats)
  const awayERA = reliableERA(awayStats)
  const homeWHIP = reliableWHIP(homeStats)
  const awayWHIP = reliableWHIP(awayStats)
  const homeWins = homeStats ? Number(homeStats.wins ?? 0) : 0
  const awayWins = awayStats ? Number(awayStats.wins ?? 0) : 0

  const avgERA = (homeERA + awayERA) / 2
  const eraDiff = Math.abs(homeERA - awayERA)
  const betterTeam = homeERA <= awayERA ? homeTeam : awayTeam
  const worseTeam = homeERA > awayERA ? homeTeam : awayTeam
  const betterPitcher = homeERA <= awayERA ? homePitcher : awayPitcher
  const betterERA = Math.min(homeERA, awayERA)
  const betterWHIP = homeERA <= awayERA ? homeWHIP : awayWHIP

  // Total estimé :
  // Formule principale (si RPG disponibles) :
  //   awayExpected = awayRPG × (homeERA / leagueAvg)  — away team score contre le lanceur dom.
  //   homeExpected = homeRPG × (awayERA / leagueAvg)  — home team score contre le lanceur ext.
  // Si homeERA < 4.20 → multiplicateur < 1 → l'équipe adverse marque moins que sa moyenne ✓
  // Fallback ERA seul : (homeERA + awayERA) × 0.667 + 3.0
  const homeRPG = teamRPG?.[homeTeam.id]
  const awayRPG = teamRPG?.[awayTeam.id]
  const estimatedTotal = (homeRPG && awayRPG)
    ? ((awayRPG * (homeERA / LEAGUE_AVG_ERA)) + (homeRPG * (awayERA / LEAGUE_AVG_ERA))).toFixed(1)
    : ((homeERA + awayERA) * 0.667 + 3.0).toFixed(1)

  const matchStr = `${homeTeam.name} vs ${awayTeam.name}`

  // ---- CAS 1 : DUEL DE LANCEURS D'ÉLITE → UNDER ----
  // Les deux ERA < 3.00 et les deux WHIP < 1.15 : duel de partants dominants, peu de runs attendus
  if (avgERA < 3.00 && homeWHIP < 1.15 && awayWHIP < 1.15) {
    return {
      id: `mlb-${game.gamePk}`,
      sport: 'MLB',
      match: matchStr,
      flagDom: '🏟️',
      flagExt: '⚾',
      date: game.officialDate,
      heure: new Date(game.gameDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
      force: 'fort',
      typePari: 'Under (Total)',
      pari: `UNDER ~${estimatedTotal} points`,
      raisonnement: `Duel de lanceurs d'élite. ERA combinée de ${avgERA.toFixed(2)} — total estimé à ~${estimatedTotal} points. Cherche une ligne ≥ ${estimatedTotal} chez ton bookmaker pour maximiser la value.`,
      stats: [
        { label: `${homePitcher?.fullName?.split(' ').pop() ?? homeTeam.abbreviation} ERA`, val: homeERA.toFixed(2), highlight: true },
        { label: `${awayPitcher?.fullName?.split(' ').pop() ?? awayTeam.abbreviation} ERA`, val: awayERA.toFixed(2), highlight: true },
        { label: `${homeTeam.abbreviation} RPG`, val: homeRPG ? homeRPG.toFixed(1) : '—' },
        { label: `Total estimé`, val: `~${estimatedTotal}`, highlight: true },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ---- CAS 2 : LANCEUR DOMINANT CONTRE LANCEUR FRAGILE → MONEYLINE ----
  // Écart ERA > 1.80 et le meilleur ERA < 3.50 : avantage structurel au monticule
  if (eraDiff > 1.80 && betterERA < 3.50) {
    const force: SignalForce = eraDiff > 2.50 ? 'fort' : 'modéré'
    return {
      id: `mlb-${game.gamePk}`,
      sport: 'MLB',
      match: matchStr,
      flagDom: '🏟️',
      flagExt: '⚾',
      date: game.officialDate,
      heure: new Date(game.gameDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
      force,
      typePari: 'Moneyline',
      pari: `Victoire ${betterTeam.name} — Moneyline`,
      raisonnement: `Gros écart entre les lanceurs (${eraDiff.toFixed(2)} ERA de différence). ${betterTeam.name} s'appuie sur ${betterPitcher?.fullName ?? 'son lanceur'} (ERA ${betterERA.toFixed(2)}) face à ${worseTeam.name} dont le lanceur est vulnérable (ERA ${Math.max(homeERA, awayERA).toFixed(2)}).`,
      stats: [
        { label: `${betterTeam.abbreviation} ERA`, val: betterERA.toFixed(2), highlight: true },
        { label: 'WHIP', val: betterWHIP.toFixed(2), highlight: true },
        { label: `${worseTeam.abbreviation} ERA`, val: Math.max(homeERA, awayERA).toFixed(2) },
        { label: 'Écart ERA', val: eraDiff.toFixed(2) },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ---- CAS 3 : DEUX LANCEURS FRAGILES → OVER ----
  // Les deux ERA > 4.80 et les deux WHIP > 1.30 : beaucoup de coureurs attendus des deux côtés
  if (avgERA > 4.80 && homeWHIP > 1.30 && awayWHIP > 1.30) {
    return {
      id: `mlb-${game.gamePk}`,
      sport: 'MLB',
      match: matchStr,
      flagDom: '🏟️',
      flagExt: '⚾',
      date: game.officialDate,
      heure: new Date(game.gameDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
      force: 'modéré',
      typePari: 'Over (Total)',
      pari: `OVER ~${estimatedTotal} points`,
      raisonnement: `Deux lanceurs fragiles (ERA combinée ${avgERA.toFixed(2)}) — total estimé à ~${estimatedTotal} points. Cherche une ligne ≤ ${estimatedTotal} chez ton bookmaker pour maximiser la value.`,
      stats: [
        { label: `${homeTeam.abbreviation} ERA`, val: homeERA.toFixed(2) },
        { label: `${awayTeam.abbreviation} ERA`, val: awayERA.toFixed(2) },
        { label: `${homeTeam.abbreviation} RPG`, val: homeRPG ? homeRPG.toFixed(1) : '—' },
        { label: `Total estimé`, val: `~${estimatedTotal}`, highlight: true },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ---- CAS 4 : F5 — Lanceur dominant + adversaire clairement fragile ----
  // Meilleur ERA < 2.80 et adversaire > 4.20 : le partant dominant mène les 5 premières manches
  if (betterERA < 2.80 && Math.max(homeERA, awayERA) > 4.20) {
    return {
      id: `mlb-${game.gamePk}`,
      sport: 'MLB',
      match: matchStr,
      flagDom: '🏟️',
      flagExt: '⚾',
      date: game.officialDate,
      heure: new Date(game.gameDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
      force: 'modéré',
      typePari: 'First 5 Innings',
      pari: `${betterTeam.name} F5 -0.5 (mène après 5 manches)`,
      raisonnement: `${betterTeam.name} s'appuie sur ${betterPitcher?.fullName ?? 'leur lanceur'} (ERA ${betterERA.toFixed(2)}) — dominant sur les 5 premières manches. Évite le risque lié aux bullpens en pariant uniquement sur le lanceur partant.`,
      stats: [
        { label: `${betterTeam.abbreviation} ERA`, val: betterERA.toFixed(2), highlight: true },
        { label: 'WHIP', val: betterWHIP.toFixed(2), highlight: true },
        { label: `${worseTeam.abbreviation} ERA`, val: Math.max(homeERA, awayERA).toFixed(2) },
        { label: 'Victoires', val: String(homeERA <= awayERA ? homeWins : awayWins) },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  return null
}

// =============================================
// GÉNÉRATION SIGNAUX CdM
// =============================================
function getTeamScore(pays: string): number {
  const profile = CDM_TEAM_PROFILES.find(t => t.pays === pays)
  const players = ALL_CDM_PLAYERS.filter(p => p.pays === pays)
  const avgNote = players.length > 0
    ? players.reduce((s, p) => s + p.note, 0) / players.length
    : 7.0
  const fifaBonus = profile ? (50 - profile.classementFIFA) / 50 : 0
  return avgNote + fifaBonus
}

function getTeamForm(pays: string): number {
  const players = ALL_CDM_PLAYERS.filter(p => p.pays === pays).slice(0, 5)
  if (players.length === 0) return 0.5
  let totalPts = 0; let maxPts = 0
  players.forEach(p => {
    p.forme.forEach(f => {
      maxPts += 3
      if (f === 'V') totalPts += 3
      else if (f === 'N') totalPts += 1
    })
  })
  return maxPts > 0 ? totalPts / maxPts : 0.5
}

function getBestPlayer(pays: string) {
  return ALL_CDM_PLAYERS.filter(p => p.pays === pays).sort((a, b) => b.note - a.note)[0]
}

function getTopScorer(pays: string) {
  return ALL_CDM_PLAYERS.filter(p => p.pays === pays).sort((a, b) => b.buts - a.buts)[0]
}

export function generateCdMSignals(limitDays = 14): Signal[] {
  const today = new Date()
  const limit = new Date(today)
  limit.setDate(today.getDate() + limitDays)

  const upcomingMatches = CDM_FIXTURES.filter(m => {
    const matchDate = new Date(m.date)
    return matchDate >= today && matchDate <= limit
  }).slice(0, 12)

  const signals: Signal[] = []

  for (const match of upcomingMatches) {
    const domProfile = CDM_TEAM_PROFILES.find(t => t.pays === match.domicile)
    const extProfile = CDM_TEAM_PROFILES.find(t => t.pays === match.exterieur)
    if (!domProfile || !extProfile) continue

    const domScore = getTeamScore(match.domicile)
    const extScore = getTeamScore(match.exterieur)
    const domForm = getTeamForm(match.domicile)
    const extForm = getTeamForm(match.exterieur)
    const scoreDiff = domScore - extScore
    const rankDiff = extProfile.classementFIFA - domProfile.classementFIFA

    const domBestPlayer = getBestPlayer(match.domicile)
    const extBestPlayer = getBestPlayer(match.exterieur)
    const domScorer = getTopScorer(match.domicile)
    const extScorer = getTopScorer(match.exterieur)

    // ---- CAS 1 : Favori très clair ----
    if (rankDiff > 20 && scoreDiff > 0.6) {
      const topScorer = domScorer
      signals.push({
        id: `cdm-${match.id}-win`,
        sport: 'CdM',
        match: `${match.domicile} vs ${match.exterieur}`,
        flagDom: match.flagD,
        flagExt: match.flagE,
        date: match.date,
        heure: match.heure,
        force: rankDiff > 30 ? 'fort' : 'modéré',
        typePari: '1X2',
        pari: `Victoire ${match.domicile}`,
        raisonnement: `${match.domicile} (FIFA #${domProfile.classementFIFA}) domine largement ${match.exterieur} (FIFA #${extProfile.classementFIFA}) sur tous les indicateurs. Avantage domicile + effectif supérieur.`,
        stats: [
          { label: `${match.domicile} FIFA`, val: `#${domProfile.classementFIFA}`, highlight: true },
          { label: `${match.exterieur} FIFA`, val: `#${extProfile.classementFIFA}` },
          { label: 'Note moy. dom.', val: domScore.toFixed(1), highlight: true },
          { label: 'Note moy. ext.', val: extScore.toFixed(1) },
        ],
        lienCalculateur: '/paris/calculateur',
      })
      // Ajouter signal buteur si le top scorer est clairement dominant
      if (topScorer && topScorer.buts > topScorer.xG && topScorer.forme.filter(f => f === 'V').length >= 3) {
        signals.push({
          id: `cdm-${match.id}-scorer`,
          sport: 'CdM',
          match: `${match.domicile} vs ${match.exterieur}`,
          flagDom: match.flagD,
          flagExt: match.flagE,
          date: match.date,
          heure: match.heure,
          force: 'modéré',
          typePari: 'Buteur',
          pari: `${topScorer.nom} buteur dans ce match`,
          raisonnement: `${topScorer.nom} surperforme son xG (+${(topScorer.buts - topScorer.xG).toFixed(1)}) et est en grande forme. Face à un adversaire plus faible, il devrait être impliqué offensivement.`,
          stats: [
            { label: 'Buts', val: String(topScorer.buts), highlight: true },
            { label: 'xG', val: String(topScorer.xG) },
            { label: 'Note', val: String(topScorer.note) },
            { label: 'Forme', val: topScorer.forme.join('') },
          ],
          lienCalculateur: '/paris/calculateur',
        })
      }
      continue
    }

    // ---- CAS 2 : Match équilibré — Double chance favori ----
    if (rankDiff > 8 && rankDiff <= 20 && scoreDiff > 0.3) {
      signals.push({
        id: `cdm-${match.id}-dc`,
        sport: 'CdM',
        match: `${match.domicile} vs ${match.exterieur}`,
        flagDom: match.flagD,
        flagExt: match.flagE,
        date: match.date,
        heure: match.heure,
        force: 'modéré',
        typePari: 'Double Chance',
        pari: `Double chance ${match.domicile} (1X — victoire ou nul)`,
        raisonnement: `${match.domicile} est favori mais le match reste incertain. La double chance couvre la victoire et le nul pour sécuriser le pari à une cote plus raisonnable.`,
        stats: [
          { label: `${match.domicile} FIFA`, val: `#${domProfile.classementFIFA}`, highlight: true },
          { label: `${match.exterieur} FIFA`, val: `#${extProfile.classementFIFA}` },
          { label: 'Forme dom.', val: `${(domForm * 100).toFixed(0)}%`, highlight: true },
          { label: 'Forme ext.', val: `${(extForm * 100).toFixed(0)}%` },
        ],
        lienCalculateur: '/paris/calculateur',
      })
      continue
    }

    // ---- CAS 3 : Choc de favoris — Both Teams Score ----
    if (domProfile.classementFIFA <= 10 && extProfile.classementFIFA <= 10) {
      const bothHighScoring =
        (domScorer?.buts ?? 0) > 15 && (extScorer?.buts ?? 0) > 15
      if (bothHighScoring) {
        signals.push({
          id: `cdm-${match.id}-btts`,
          sport: 'CdM',
          match: `${match.domicile} vs ${match.exterieur}`,
          flagDom: match.flagD,
          flagExt: match.flagE,
          date: match.date,
          heure: match.heure,
          force: 'modéré',
          typePari: 'BTTS',
          pari: `Les deux équipes marquent (Both Teams Score)`,
          raisonnement: `Choc entre deux top 10 mondiaux avec des attaques prolifiques. ${domScorer?.nom} (${domScorer?.buts} buts) et ${extScorer?.nom} (${extScorer?.buts} buts) sont tous les deux en forme — les deux équipes devraient trouver le filet.`,
          stats: [
            { label: `${match.domicile} buts`, val: String(domScorer?.buts ?? '—'), highlight: true },
            { label: `xG dom.`, val: String(domScorer?.xG ?? '—') },
            { label: `${match.exterieur} buts`, val: String(extScorer?.buts ?? '—'), highlight: true },
            { label: `xG ext.`, val: String(extScorer?.xG ?? '—') },
          ],
          lienCalculateur: '/paris/calculateur',
        })
      }
      continue
    }

    // ---- CAS 4 : Outsider en grande forme ----
    if (rankDiff < 0 && extForm > domForm + 0.25 && extScore > domScore) {
      signals.push({
        id: `cdm-${match.id}-upset`,
        sport: 'CdM',
        match: `${match.domicile} vs ${match.exterieur}`,
        flagDom: match.flagD,
        flagExt: match.flagE,
        date: match.date,
        heure: match.heure,
        force: 'à surveiller',
        typePari: 'Surprise',
        pari: `Double chance ${match.exterieur} (X2 — nul ou victoire extérieur)`,
        raisonnement: `${match.exterieur} arrive en meilleure forme malgré un classement FIFA inférieur. Cote potentiellement intéressante si les bookmakers surévaluent ${match.domicile}.`,
        stats: [
          { label: `${match.exterieur} forme`, val: `${(extForm * 100).toFixed(0)}%`, highlight: true },
          { label: `${match.domicile} forme`, val: `${(domForm * 100).toFixed(0)}%` },
          { label: `${match.exterieur} note`, val: extScore.toFixed(1), highlight: true },
          { label: `${match.domicile} note`, val: domScore.toFixed(1) },
        ],
        lienCalculateur: '/paris/calculateur',
      })
    }
  }

  return signals.slice(0, 10) // max 10 signaux CdM
}
