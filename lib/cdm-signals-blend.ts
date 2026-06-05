/**
 * Génère les signaux joueurs enrichis avec les stats de sélection nationale
 * via un blend club + sél. + WC (API-Football).
 *
 * Server-only — utilise process.env.API_FOOTBALL_KEY.
 */

import { ALL_CDM_PLAYERS } from './cdm-players'
import {
  generatePlayerSignals,
  generateSignalsFromBlended,
  FORCE_ORDER,
  type PlayerMarket,
  type PlayerSignal,
} from './cdm-player-signals'
import { getBlendedStats } from './cdm-blend-fetch'

export async function getTopByMarketWithBlend(
  marché: PlayerMarket,
  n = 30,
): Promise<PlayerSignal[]> {
  // Étape 1 — candidats via stats club (synchrone, pas d'API)
  // On garde les joueurs qui ont au moins un signal sur ce marché
  const candidateIds = new Set<number>()
  for (const player of ALL_CDM_PLAYERS) {
    for (const s of generatePlayerSignals(player)) {
      if (s.marché === marché) { candidateIds.add(player.id); break }
    }
  }

  const candidates = ALL_CDM_PLAYERS.filter(p => candidateIds.has(p.id))

  // Étape 2 — blend asynchrone (cache par équipe, 1 appel API max par équipe)
  const results: PlayerSignal[] = []
  await Promise.all(candidates.map(async (player) => {
    const { blended } = await getBlendedStats(player)
    for (const s of generateSignalsFromBlended(player, blended)) {
      if (s.marché === marché) results.push(s)
    }
  }))

  return results
    .sort((a, b) => {
      const fd = FORCE_ORDER[a.force] - FORCE_ORDER[b.force]
      if (fd !== 0) return fd
      return parseFloat(b.valeurClé) - parseFloat(a.valeurClé)
    })
    .slice(0, n)
}
