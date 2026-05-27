// Suivi des sélections value-bet — localStorage
// Mise fixe : 1 unité par pari

export type TrackedStatut = 'en_cours' | 'gagné' | 'perdu'
export type NiveauEdge    = 'excellent' | 'bon' | 'interessant'

export type TrackedBet = {
  id: string
  match: string
  pari: string
  sport: string         // 'ATP' | 'WTA' | 'MLB' | 'NBA'
  surface: string
  date: string
  heure: string
  coteRef: number
  pModel: number        // 0-1
  pMarche: number       // 0-1
  edge: number          // 0-1
  niveau: NiveauEdge
  statut: TrackedStatut
  trackedAt: string     // ISO date
}

const KEY = 'st_selections_bets'

function load(): TrackedBet[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function save(bets: TrackedBet[]) {
  localStorage.setItem(KEY, JSON.stringify(bets))
}

export function getTrackedBets(): TrackedBet[] {
  return load()
}

export function isTracked(id: string): boolean {
  return load().some(b => b.id === id)
}

export function addTrackedBet(bet: Omit<TrackedBet, 'statut' | 'trackedAt'>): void {
  const all = load()
  if (all.some(b => b.id === bet.id)) return
  save([{ ...bet, statut: 'en_cours', trackedAt: new Date().toISOString() }, ...all])
}

export function updateStatut(id: string, statut: TrackedStatut): void {
  save(load().map(b => b.id === id ? { ...b, statut } : b))
}

export function removeTrackedBet(id: string): void {
  save(load().filter(b => b.id !== id))
}

// ── Stats par niveau ──────────────────────────────────────────────────────────

export type LevelStats = {
  total: number
  gagnes: number
  perdus: number
  enCours: number
  unitesGagnees: number  // gain net en unités (cote - 1 si gagné, -1 si perdu)
  roi: number | null     // % sur mises terminées
  coteMoyenne: number | null
}

export function statsByLevel(bets: TrackedBet[]): Record<NiveauEdge, LevelStats> {
  const levels: NiveauEdge[] = ['excellent', 'bon', 'interessant']
  const result = {} as Record<NiveauEdge, LevelStats>

  for (const niveau of levels) {
    const sub = bets.filter(b => b.niveau === niveau)
    const termines = sub.filter(b => b.statut !== 'en_cours')
    const gagnes   = sub.filter(b => b.statut === 'gagné')
    const perdus   = sub.filter(b => b.statut === 'perdu')

    const unitesGagnees = gagnes.reduce((s, b) => s + (b.coteRef - 1), 0)
                        + perdus.reduce((s, _) => s - 1, 0)

    const totalMises = termines.length  // 1 unité par pari
    const roi = totalMises > 0 ? (unitesGagnees / totalMises) * 100 : null

    const coteMoyenne = termines.length > 0
      ? termines.reduce((s, b) => s + b.coteRef, 0) / termines.length
      : null

    result[niveau] = {
      total: sub.length,
      gagnes: gagnes.length,
      perdus: perdus.length,
      enCours: sub.filter(b => b.statut === 'en_cours').length,
      unitesGagnees: parseFloat(unitesGagnees.toFixed(2)),
      roi: roi !== null ? parseFloat(roi.toFixed(1)) : null,
      coteMoyenne: coteMoyenne !== null ? parseFloat(coteMoyenne.toFixed(2)) : null,
    }
  }

  return result
}
