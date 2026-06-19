import { getTrackedBets } from '@/lib/selections-db'
import type { TrackEntry } from './index'

// Convertit les value bets soldés de `selections_tracked` (tennis Roland Garros, etc.)
// en entrées de track record pour la page /performance. Server-only (service role).
export async function getSelectionsTrackEntries(): Promise<TrackEntry[]> {
  const bets = await getTrackedBets()
  return bets
    .filter(b => b.statut === 'gagné' || b.statut === 'perdu')
    .map((b): TrackEntry => {
      const [dom, ext] = (b.match_str ?? '').split(' vs ').map(s => s.trim())
      // ATP / WTA → « Tennis » (échantillon unifié + icône 🎾)
      const sport = /atp|wta|tennis/i.test(b.sport ?? '') ? 'Tennis' : (b.sport || 'Tennis')
      return {
        id: `sel-${b.id}`,
        date: b.date_match,
        sport,
        equipe_dom: dom ?? '',
        equipe_ext: ext ?? '',
        match: b.match_str,
        selection: b.pari || b.bet_on_player,
        cote: Number(b.cote_ref),
        resultat: b.statut === 'gagné' ? 'won' : 'lost',
        tier: 'value',
        confiance: b.niveau ?? null, // excellent | bon | interessant
      }
    })
}
