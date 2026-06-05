import { ALL_CDM_PLAYERS, type Player } from './cdm-players'

// =============================================
// PERTINENCES (calibrées sur analyses prédictives football)
// Club = contexte différent, adversaires différents → 0.6
// Sélection = même coach/système/coéquipiers      → 0.8
// WC live = contexte exact de la compétition      → 1.0
// =============================================
const PERTINENCE = { club: 0.6, sel: 0.8, wc: 1.0 } as const

// =============================================
// SEUILS (calibrés sur données Ligue 1/PL/Liga 2024-25)
// =============================================
const SEUILS = {
  xGParMatch:           { fort: 0.40, modéré: 0.22 },
  tirsParMatch:         { fort: 3.80, modéré: 2.20 },
  tirsCadrésParMatch:   { fort: 1.40, modéré: 0.90 },
  xAParMatch:           { fort: 0.33, modéré: 0.18 },
  passesClésParMatch:   { fort: 2.00, modéré: 1.20 },
  cartonsJaunesParMatch:{ élevé: 0.22, modéré: 0.13 },
}

// =============================================
// TYPES
// =============================================

export type SourceStats = {
  matchsJoues: number
  xGParMatch: number
  tirsParMatch: number
  tirsCadrésParMatch: number
  xAParMatch: number
  passesClésParMatch: number
  cartonsJaunesParMatch: number
}

export type BlendedStats = SourceStats & {
  poids: { club: number; sel: number; wc: number }
  confiance: 'haute' | 'moyenne' | 'faible'
  sourceLabel: string   // ex: "club 72% · sél. 28%"
  wcMatches: number
}

export type PlayerSignalForce = 'fort' | 'modéré' | 'faible'

export type PlayerMarket =
  | 'buteur'
  | 'tirs-cadrés'
  | 'tirs-tentés'
  | 'carton-jaune'
  | 'passeur'

export type PlayerSignal = {
  playerId: number
  playerName: string
  pays: string
  flag: string
  groupe: string
  poste: string
  club: string
  marché: PlayerMarket
  marchéLabel: string
  force: PlayerSignalForce
  valeurClé: string
  seuil: string
  raisonnement: string
  confiance: BlendedStats['confiance']
  sourceLabel: string
  stats: { label: string; val: string; highlight?: boolean }[]
  cote?: number
  probEstimee?: number  // probabilité Poisson (0-1) pour le marché
}

// =============================================
// BLEND — formule n_effectif
// Chaque couche a un n effectif = pertinence × matchs joués.
// Le poids de chaque couche = son n_effectif / total n_effectif.
// Le club garde un poids élevé grâce à son grand nombre de matchs,
// même si sa pertinence contextuelle est plus faible.
// =============================================

export function blendStats(
  club: SourceStats,
  sel: SourceStats | null,
  wc: SourceStats | null,
): BlendedStats {
  const nEff = {
    club: PERTINENCE.club * club.matchsJoues,
    sel:  sel ? PERTINENCE.sel * sel.matchsJoues : 0,
    wc:   wc  ? PERTINENCE.wc  * wc.matchsJoues  : 0,
  }
  const total = nEff.club + nEff.sel + nEff.wc || 1

  const w = {
    club: nEff.club / total,
    sel:  nEff.sel  / total,
    wc:   nEff.wc   / total,
  }

  const mix = (
    clubVal: number,
    selVal: number | undefined,
    wcVal: number | undefined,
  ) =>
    w.club * clubVal +
    w.sel  * (selVal  ?? 0) +
    w.wc   * (wcVal   ?? 0)

  const wcMatches = wc?.matchsJoues ?? 0
  const totalMatchs = club.matchsJoues + (sel?.matchsJoues ?? 0) + wcMatches
  const confiance: BlendedStats['confiance'] =
    totalMatchs >= 30 ? 'haute' : totalMatchs >= 15 ? 'moyenne' : 'faible'

  const parts = [
    `club ${Math.round(w.club * 100)}%`,
    sel  ? `sél. ${Math.round(w.sel * 100)}%` : null,
    wc   ? `WC ${Math.round(w.wc * 100)}%`   : null,
  ].filter(Boolean).join(' · ')

  return {
    matchsJoues:          totalMatchs,
    xGParMatch:           mix(club.xGParMatch,           sel?.xGParMatch,           wc?.xGParMatch),
    tirsParMatch:         mix(club.tirsParMatch,         sel?.tirsParMatch,         wc?.tirsParMatch),
    tirsCadrésParMatch:   mix(club.tirsCadrésParMatch,   sel?.tirsCadrésParMatch,   wc?.tirsCadrésParMatch),
    xAParMatch:           mix(club.xAParMatch,           sel?.xAParMatch,           wc?.xAParMatch),
    passesClésParMatch:   mix(club.passesClésParMatch,   sel?.passesClésParMatch,   wc?.passesClésParMatch),
    cartonsJaunesParMatch:mix(club.cartonsJaunesParMatch,sel?.cartonsJaunesParMatch,wc?.cartonsJaunesParMatch),
    poids:       w,
    confiance,
    sourceLabel: parts,
    wcMatches,
  }
}

// =============================================
// CONVERTISSEURS
// =============================================

// Convertit un Player (stats totales saison club) en SourceStats (taux/match)
export function playerToSourceStats(p: Player): SourceStats {
  const m = Math.max(1, p.matchsJoues)
  return {
    matchsJoues:          p.matchsJoues,
    xGParMatch:           p.xG / m,
    tirsParMatch:         p.tirs / m,
    tirsCadrésParMatch:   p.tirsCadres   != null ? p.tirsCadres   / m : 0,
    xAParMatch:           p.xA / m,
    passesClésParMatch:   p.passesClés   != null ? p.passesClés   / m : 0,
    cartonsJaunesParMatch:p.cartonsJaunes != null ? p.cartonsJaunes / m : 0,
  }
}

// Structure brute retournée par GET /players?team=X&league=Y&season=Z (API-Football v3)
export type AFRawPlayerStats = {
  player: { id: number; name: string }
  statistics: {
    games:   { appearences: number | null; minutes: number | null }
    shots:   { total: number | null; on: number | null }
    goals:   { total: number | null; assists: number | null }
    passes:  { key: number | null }
    cards:   { yellow: number | null }
  }[]
}

// Convertit la réponse API-Football en SourceStats.
// xG estimé quand non fourni par l'API : tirs_cadrés × 0.28 + tirs_non_cadrés × 0.04
// xA estimé via passes clés × 0.20 (taux moyen de conversion PK → assist)
export function afRawToSourceStats(raw: AFRawPlayerStats): SourceStats | null {
  const s = raw.statistics[0]
  if (!s) return null
  const appearances = s.games.appearences ?? 0
  if (appearances === 0) return null

  const shotsTotal = s.shots.total    ?? 0
  const shotsOn    = s.shots.on       ?? 0
  const goals      = s.goals.total    ?? 0
  const keyPasses  = s.passes.key     ?? 0
  const yellows    = s.cards.yellow   ?? 0

  // xG estimé (API-Football ne retourne pas le xG sur toutes les compétitions)
  const xGEst = shotsOn * 0.28 + Math.max(0, shotsTotal - shotsOn) * 0.04
  // xA estimé
  const xAEst = keyPasses * 0.20

  const m = Math.max(1, appearances)
  return {
    matchsJoues:          appearances,
    xGParMatch:           xGEst    / m,
    tirsParMatch:         shotsTotal / m,
    tirsCadrésParMatch:   shotsOn    / m,
    xAParMatch:           xAEst    / m,
    passesClésParMatch:   keyPasses  / m,
    cartonsJaunesParMatch:yellows    / m,
  }
}

// =============================================
// GÉNÉRATEURS DE SIGNAUX (travaillent sur BlendedStats)
// =============================================

function forceFromValue(val: number, seuils: { fort: number; modéré: number }): PlayerSignalForce {
  if (val >= seuils.fort) return 'fort'
  if (val >= seuils.modéré) return 'modéré'
  return 'faible'
}

function signalButeur(p: Player, b: BlendedStats): PlayerSignal | null {
  if (p.poste === 'Gardien') return null
  const force = forceFromValue(b.xGParMatch, SEUILS.xGParMatch)
  if (force === 'faible') return null

  const convRate = b.tirsParMatch > 0
    ? Math.round((b.xGParMatch / b.tirsParMatch) * 100) : 0

  const butsRef = p.buts
  const xGRef   = p.xG
  const overperf = butsRef - xGRef
  const perfNote = overperf > 1.5
    ? ` Finisseur au-dessus de son xG (+${overperf.toFixed(1)} buts sur la saison club).`
    : overperf < -1.5
    ? ` Sous-performe son xG de ${Math.abs(overperf).toFixed(1)} buts — peut être "dû".`
    : ''

  // P(≥1 but) = 1 - e^(-xG) par modèle Poisson
  const probEstimee = parseFloat((1 - Math.exp(-b.xGParMatch)).toFixed(4))

  return {
    playerId: p.id, playerName: p.nom, pays: p.pays, flag: p.flag,
    groupe: p.groupe, poste: p.poste, club: p.club,
    marché: 'buteur', marchéLabel: '⚽ Buteur du match', force,
    valeurClé: `${b.xGParMatch.toFixed(2)} xG/match`,
    seuil: `fort ≥ ${SEUILS.xGParMatch.fort}`,
    raisonnement: `${p.nom} génère ${b.xGParMatch.toFixed(2)} xG/match (${b.sourceLabel}).${perfNote}`,
    confiance: b.confiance,
    sourceLabel: b.sourceLabel,
    probEstimee,
    stats: [
      { label: 'xG/match',       val: b.xGParMatch.toFixed(2),   highlight: true },
      { label: 'Tirs/match',     val: b.tirsParMatch.toFixed(1) },
      { label: 'Cadrés/match',   val: b.tirsCadrésParMatch.toFixed(2) },
      { label: 'xG→but (est.)', val: `${convRate}%` },
    ],
  }
}

function signalTirsCadrés(p: Player, b: BlendedStats): PlayerSignal | null {
  if (p.poste === 'Gardien') return null
  const force = forceFromValue(b.tirsCadrésParMatch, SEUILS.tirsCadrésParMatch)
  if (force === 'faible') return null

  const precision = b.tirsParMatch > 0
    ? Math.round((b.tirsCadrésParMatch / b.tirsParMatch) * 100) : 0

  // P(≥1 tir cadré) = 1 - e^(-SOT) par modèle Poisson
  const probEstimee = parseFloat((1 - Math.exp(-b.tirsCadrésParMatch)).toFixed(4))

  return {
    playerId: p.id, playerName: p.nom, pays: p.pays, flag: p.flag,
    groupe: p.groupe, poste: p.poste, club: p.club,
    marché: 'tirs-cadrés', marchéLabel: '🎯 Tir cadré (≥ 1)', force,
    valeurClé: `${b.tirsCadrésParMatch.toFixed(2)} cadrés/match`,
    seuil: `fort ≥ ${SEUILS.tirsCadrésParMatch.fort}`,
    raisonnement: `${p.nom} place ${b.tirsCadrésParMatch.toFixed(2)} tirs cadrés par match (${precision}% de précision sur ${b.tirsParMatch.toFixed(1)} tirs tentés). Source : ${b.sourceLabel}.`,
    confiance: b.confiance,
    sourceLabel: b.sourceLabel,
    probEstimee,
    stats: [
      { label: 'Cadrés/match',  val: b.tirsCadrésParMatch.toFixed(2), highlight: true },
      { label: 'Tirs/match',    val: b.tirsParMatch.toFixed(1) },
      { label: '% précision',   val: `${precision}%`, highlight: precision >= 35 },
      { label: 'xG/match',      val: b.xGParMatch.toFixed(2) },
    ],
  }
}

function signalTirsTentés(p: Player, b: BlendedStats): PlayerSignal | null {
  if (p.poste === 'Gardien') return null
  const force = forceFromValue(b.tirsParMatch, SEUILS.tirsParMatch)
  if (force === 'faible') return null
  // Ne pas dupliquer si le signal tirs cadrés est déjà fort
  if (b.tirsCadrésParMatch >= SEUILS.tirsCadrésParMatch.fort) return null

  // P(≥2 tirs) = 1 - e^(-λ)(1+λ) par modèle Poisson
  const λ = b.tirsParMatch
  const probEstimee = parseFloat((1 - Math.exp(-λ) * (1 + λ)).toFixed(4))

  return {
    playerId: p.id, playerName: p.nom, pays: p.pays, flag: p.flag,
    groupe: p.groupe, poste: p.poste, club: p.club,
    marché: 'tirs-tentés', marchéLabel: '🔫 Tirs tentés (≥ 2)', force,
    valeurClé: `${b.tirsParMatch.toFixed(1)} tirs/match`,
    seuil: `fort ≥ ${SEUILS.tirsParMatch.fort}`,
    raisonnement: `${p.nom} tente ${b.tirsParMatch.toFixed(1)} tirs par match (source : ${b.sourceLabel}). Candidat régulier au marché "tirs tentés".`,
    confiance: b.confiance,
    sourceLabel: b.sourceLabel,
    probEstimee,
    stats: [
      { label: 'Tirs/match',  val: b.tirsParMatch.toFixed(1),   highlight: true },
      { label: 'xG/match',    val: b.xGParMatch.toFixed(2) },
      { label: 'Cadrés/match',val: b.tirsCadrésParMatch.toFixed(2) },
      { label: 'Matchs',      val: String(b.matchsJoues) },
    ],
  }
}

function signalCarton(p: Player, b: BlendedStats): PlayerSignal | null {
  if (p.poste === 'Gardien') return null
  const freq = b.cartonsJaunesParMatch
  if (freq < SEUILS.cartonsJaunesParMatch.modéré) return null

  const force: PlayerSignalForce = freq >= SEUILS.cartonsJaunesParMatch.élevé ? 'fort' : 'modéré'
  const everyN = freq > 0 ? Math.round(1 / freq) : 99
  const postalSuffix = ['Milieu', 'Défenseur'].some(pos => p.poste.includes(pos)) ? ' (poste à risque)' : ''

  // Pour carton jaune, la fréquence est directement la probabilité par match
  const probEstimee = parseFloat(Math.min(freq, 1).toFixed(4))

  return {
    playerId: p.id, playerName: p.nom, pays: p.pays, flag: p.flag,
    groupe: p.groupe, poste: p.poste, club: p.club,
    marché: 'carton-jaune', marchéLabel: '🟨 Carton jaune', force,
    valeurClé: `${(freq * 100).toFixed(0)}% des matchs`,
    seuil: `risque élevé ≥ ${(SEUILS.cartonsJaunesParMatch.élevé * 100).toFixed(0)}%`,
    raisonnement: `${p.nom} prend un carton toutes les ~${everyN} rencontres${postalSuffix}. Source : ${b.sourceLabel}.`,
    confiance: b.confiance,
    sourceLabel: b.sourceLabel,
    probEstimee,
    stats: [
      { label: 'Fréquence',    val: `${(freq * 100).toFixed(0)}%`, highlight: true },
      { label: '1 tous les…',  val: `${everyN} matchs`,           highlight: force === 'fort' },
      { label: 'Matchs',       val: String(b.matchsJoues) },
      { label: 'Source',       val: b.sourceLabel },
    ],
  }
}

function signalPasseur(p: Player, b: BlendedStats): PlayerSignal | null {
  if (p.poste === 'Gardien') return null
  const force = forceFromValue(b.xAParMatch, SEUILS.xAParMatch)
  if (force === 'faible') return null

  const pkNote = b.passesClésParMatch >= SEUILS.passesClésParMatch.fort
    ? ` ${b.passesClésParMatch.toFixed(1)} passes clés/match — créateur de premier rang.`
    : ''

  // P(≥1 passe déc.) = 1 - e^(-xA) par modèle Poisson
  const probEstimee = parseFloat((1 - Math.exp(-b.xAParMatch)).toFixed(4))

  return {
    playerId: p.id, playerName: p.nom, pays: p.pays, flag: p.flag,
    groupe: p.groupe, poste: p.poste, club: p.club,
    marché: 'passeur', marchéLabel: '🎯 Passeur décisif', force,
    valeurClé: `${b.xAParMatch.toFixed(2)} xA/match`,
    seuil: `fort ≥ ${SEUILS.xAParMatch.fort}`,
    raisonnement: `${p.nom} génère ${b.xAParMatch.toFixed(2)} xA/match (source : ${b.sourceLabel}).${pkNote}`,
    confiance: b.confiance,
    sourceLabel: b.sourceLabel,
    probEstimee,
    stats: [
      { label: 'xA/match',        val: b.xAParMatch.toFixed(2),        highlight: true },
      { label: 'Passes clés/match',val: b.passesClésParMatch.toFixed(1), highlight: force === 'fort' },
      { label: 'Passes déc. club', val: String(p.passes) },
      { label: 'Matchs',          val: String(b.matchsJoues) },
    ],
  }
}

// =============================================
// API PUBLIQUE
// =============================================

// Génère les signaux pour un joueur depuis des SourceStats déjà blendées
export function generateSignalsFromBlended(
  player: Player,
  blended: BlendedStats,
): PlayerSignal[] {
  const sigs: PlayerSignal[] = []
  const buteur    = signalButeur(player, blended)
  const cadrés    = signalTirsCadrés(player, blended)
  const tentés    = signalTirsTentés(player, blended)
  const carton    = signalCarton(player, blended)
  const passeur   = signalPasseur(player, blended)
  if (buteur)  sigs.push(buteur)
  if (cadrés)  sigs.push(cadrés)
  if (tentés)  sigs.push(tentés)
  if (carton)  sigs.push(carton)
  if (passeur) sigs.push(passeur)
  return sigs
}

// Génère les signaux pour un joueur avec seulement les stats club statiques
// (compatibilité backward — utilisé par /cdm/signaux pré-tournoi)
export function generatePlayerSignals(
  player: Player,
  selStats?: SourceStats | null,
  wcStats?: SourceStats | null,
): PlayerSignal[] {
  const club    = playerToSourceStats(player)
  const blended = blendStats(club, selStats ?? null, wcStats ?? null)
  return generateSignalsFromBlended(player, blended)
}

export const FORCE_ORDER: Record<PlayerSignalForce, number> = { fort: 0, modéré: 1, faible: 2 }

export function getTopPlayerSignals(opts: {
  marché?: PlayerMarket
  pays?: string
  groupe?: string
  forceMin?: PlayerSignalForce
  n?: number
}): PlayerSignal[] {
  const { marché, pays, groupe, forceMin = 'modéré', n = 20 } = opts
  const maxForce = FORCE_ORDER[forceMin]

  const all: PlayerSignal[] = []
  for (const player of ALL_CDM_PLAYERS) {
    if (pays   && player.pays   !== pays)   continue
    if (groupe && player.groupe !== groupe) continue
    for (const s of generatePlayerSignals(player)) {
      if (marché && s.marché !== marché) continue
      if (FORCE_ORDER[s.force] > maxForce) continue
      all.push(s)
    }
  }

  return all
    .sort((a, b) => {
      const fd = FORCE_ORDER[a.force] - FORCE_ORDER[b.force]
      if (fd !== 0) return fd
      return parseFloat(b.valeurClé) - parseFloat(a.valeurClé)
    })
    .slice(0, n)
}

export function getTopByMarket(marché: PlayerMarket, n = 8): PlayerSignal[] {
  return getTopPlayerSignals({ marché, n })
}
