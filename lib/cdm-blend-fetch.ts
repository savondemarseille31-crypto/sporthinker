/**
 * Utilitaires serveur pour fetcher les stats de sélection nationale
 * et blender avec les stats club d'un joueur.
 *
 * À utiliser uniquement dans des Server Components ou des Route Handlers
 * (nécessite process.env.API_FOOTBALL_KEY).
 */

import {
  blendStats,
  playerToSourceStats,
  afRawToSourceStats,
  type AFRawPlayerStats,
  type SourceStats,
  type BlendedStats,
} from './cdm-player-signals'
import { CDM_TEAM_PROFILES } from './cdm-teams'
import type { Player } from './cdm-players'

const API_KEY  = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// =============================================
// CACHE en mémoire (durée de vie du processus Node)
// Évite de refetcher les stats de toute l'équipe pour chaque joueur
// quand plusieurs joueurs de la même équipe sont affichés.
// =============================================

const cache = new Map<string, { data: AFRawPlayerStats[]; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1h en ms

async function fetchTeamSelStats(
  teamId: number,
  season: number,
): Promise<AFRawPlayerStats[]> {
  const key = `${teamId}-${season}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data

  if (!API_KEY) return []

  try {
    const res = await fetch(
      `${BASE_URL}/players?team=${teamId}&season=${season}&page=1`,
      { headers: { 'x-apisports-key': API_KEY }, next: { revalidate: 86400 } }
    )
    if (!res.ok) return []

    const json = await res.json()
    const players: AFRawPlayerStats[] = json.response ?? []
    const paging = json.paging ?? { current: 1, total: 1 }

    if (paging.total > 1) {
      const pages = Array.from({ length: paging.total - 1 }, (_, i) => i + 2)
      await Promise.all(pages.map(async (page) => {
        const r = await fetch(
          `${BASE_URL}/players?team=${teamId}&season=${season}&page=${page}`,
          { headers: { 'x-apisports-key': API_KEY! }, next: { revalidate: 86400 } }
        )
        const j = await r.json()
        players.push(...(j.response ?? []))
      }))
    }

    cache.set(key, { data: players, ts: Date.now() })
    return players
  } catch {
    return []
  }
}

// =============================================
// NAME MATCHING (robuste aux accents et variations mineures)
// ex: "Kylian Mbappé" ↔ "Kylian Mbappe", "N'Golo Kanté" ↔ "N. Kante"
// =============================================

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // supprime les diacritiques
    .replace(/[^a-z0-9 ]/g, '')      // supprime ponctuation
    .trim()
}

function nameSimilarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1.0

  // Match sur le nom de famille (dernier mot)
  const la = na.split(' ').pop() ?? na
  const lb = nb.split(' ').pop() ?? nb
  if (la === lb && la.length >= 4) return 0.85

  // Match partiel : au moins 2 tokens en commun
  const tokensA = new Set(na.split(' ').filter(t => t.length >= 3))
  const tokensB = new Set(nb.split(' ').filter(t => t.length >= 3))
  const common = [...tokensA].filter(t => tokensB.has(t)).length
  if (common >= 2) return 0.75
  if (common === 1 && la === lb) return 0.70

  return 0
}

function findPlayerInApiResponse(
  playerName: string,
  apiPlayers: AFRawPlayerStats[],
): AFRawPlayerStats | null {
  let best: { score: number; player: AFRawPlayerStats } | null = null

  for (const ap of apiPlayers) {
    const score = nameSimilarity(playerName, ap.player.name)
    if (score > (best?.score ?? 0)) {
      best = { score, player: ap }
    }
  }

  // Seuil minimal : 0.70 pour éviter les faux positifs
  return best && best.score >= 0.70 ? best.player : null
}

// =============================================
// POINT D'ENTRÉE PRINCIPAL
// =============================================

export type BlendResult = {
  blended: BlendedStats
  selStats: SourceStats | null    // null si pas trouvé ou pas d'ID équipe
  wcStats: SourceStats | null     // null avant le début du WC
}

/**
 * Calcule les stats blendées pour un joueur.
 * Fetche les stats de sélection nationale (saison `selSeason`) si l'équipe
 * a un `apiFootballTeamId` dans CDM_TEAM_PROFILES.
 * Fetche les stats WC (league=1, season=2026) si disponibles.
 */
export async function getBlendedStats(
  player: Player,
  selSeason = 2024,
): Promise<BlendResult> {
  const clubStats = playerToSourceStats(player)

  // Chercher l'ID API-Football de l'équipe nationale
  const teamProfile = CDM_TEAM_PROFILES.find(t => t.pays === player.pays)
  const teamId = teamProfile?.apiFootballTeamId

  let selStats: SourceStats | null = null
  let wcStats: SourceStats | null = null

  if (teamId) {
    // Fetch sélection et WC en parallèle
    const [selPlayers, wcPlayers] = await Promise.all([
      fetchTeamSelStats(teamId, selSeason),
      fetchTeamSelStats(teamId, 2026),   // league=1 WC — vide avant le 11 juin
    ])

    const selMatch = findPlayerInApiResponse(player.nom, selPlayers)
    if (selMatch) selStats = afRawToSourceStats(selMatch)

    const wcMatch = findPlayerInApiResponse(player.nom, wcPlayers)
    if (wcMatch) wcStats = afRawToSourceStats(wcMatch)
  }

  const blended = blendStats(clubStats, selStats, wcStats)

  return { blended, selStats, wcStats }
}
