// Track record public — performance des picks du modèle, exprimée en UNITÉS (mise à plat 1u/pari)
// et en yield (%). Jamais en euros bruts (cf. plan : les mises réelles ont varié).
// Source de vérité à terme : table Supabase `selections_tracked` (auto-soldée via ESPN).
// Pour le MVP, on lit l'historique nettoyé importé (lib/track-record/mlb-history.json).

import mlbHistory from './mlb-history.json'

export type TrackResult = 'won' | 'lost' | 'push'

export type TrackEntry = {
  id: string
  date: string            // YYYY-MM-DD (date du match)
  sport: string           // 'MLB' | 'Tennis' | ...
  equipe_dom: string
  equipe_ext: string
  match: string
  selection: string
  cote: number
  resultat: TrackResult
  tier: 'signal' | 'value'
  confiance: 'fort' | 'modéré' | 'à surveiller' | null
}

export type TrackStats = {
  n: number               // paris soldés (won + lost)
  wins: number
  losses: number
  winRate: number         // %
  avgOdds: number
  profitUnits: number     // profit en unités (mise à plat 1u)
  yield: number           // % = profitUnits / n
  periodStart: string | null
  periodEnd: string | null
}

export function getTrackRecord(): TrackEntry[] {
  return (mlbHistory as unknown as TrackEntry[])
}

// Stats en unités : 1 unité misée par pari. Gain d'un gagnant = cote - 1 ; perte = -1.
export function computeStats(entries: TrackEntry[]): TrackStats {
  const settled = entries.filter(e => e.resultat === 'won' || e.resultat === 'lost')
  const wins = settled.filter(e => e.resultat === 'won')
  const losses = settled.filter(e => e.resultat === 'lost')
  const n = settled.length
  const profitUnits = wins.reduce((s, e) => s + (e.cote - 1), 0) - losses.length
  const dates = entries.map(e => e.date).sort()
  return {
    n,
    wins: wins.length,
    losses: losses.length,
    winRate: n ? parseFloat(((wins.length / n) * 100).toFixed(1)) : 0,
    avgOdds: n ? parseFloat((settled.reduce((s, e) => s + e.cote, 0) / n).toFixed(2)) : 0,
    profitUnits: parseFloat(profitUnits.toFixed(2)),
    yield: n ? parseFloat(((profitUnits / n) * 100).toFixed(1)) : 0,
    periodStart: dates[0] ?? null,
    periodEnd: dates[dates.length - 1] ?? null,
  }
}

export function bySport(entries: TrackEntry[]): Record<string, TrackEntry[]> {
  return entries.reduce<Record<string, TrackEntry[]>>((acc, e) => {
    ;(acc[e.sport] ??= []).push(e)
    return acc
  }, {})
}

// Ordre d'affichage des niveaux de confiance (force)
export const CONF_ORDER = ['fort', 'modéré', 'à surveiller'] as const

export function byConfidence(entries: TrackEntry[]): Record<string, TrackEntry[]> {
  return entries.reduce<Record<string, TrackEntry[]>>((acc, e) => {
    const k = e.confiance ?? 'non catégorisé'
    ;(acc[k] ??= []).push(e)
    return acc
  }, {})
}

// Courbe de capital cumulée (en unités), triée par date.
export function equityCurve(entries: TrackEntry[]): { date: string; cumUnits: number }[] {
  const settled = entries
    .filter(e => e.resultat === 'won' || e.resultat === 'lost')
    .sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  return settled.map(e => {
    cum += e.resultat === 'won' ? e.cote - 1 : -1
    return { date: e.date, cumUnits: parseFloat(cum.toFixed(2)) }
  })
}
