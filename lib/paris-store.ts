// =============================================
// TYPES
// =============================================
export type StatutPari = 'en_cours' | 'gagné' | 'perdu' | 'annulé'
export type TypePari = '1X2' | 'buteur' | 'over_under' | 'double_chance' | 'autre'

export type Pari = {
  id: string
  createdAt: string
  match: string          // ex: "France vs Maroc"
  competition: string    // ex: "CdM 2026 - Groupe D"
  typePari: TypePari
  selection: string      // ex: "France gagne", "Mbappé buteur"
  coteStake: number      // cote sur Stake.bet
  probEstimee: number    // probabilité en % (0-100)
  mise: number           // en €/$ ou unités
  statut: StatutPari
  gain?: number          // gain net (positif ou négatif)
  notes?: string
}

export type Bankroll = {
  montantInitial: number
  montantActuel: number
  devise: string
}

// =============================================
// CALCULS VALUE BET
// =============================================
export function calcEV(cote: number, prob: number): number {
  // EV = (cote × prob/100) - 1
  return parseFloat(((cote * (prob / 100)) - 1).toFixed(4))
}

export function calcKelly(cote: number, prob: number): number {
  // Kelly fraction = (EV) / (cote - 1)
  const ev = calcEV(cote, prob)
  if (ev <= 0) return 0
  return parseFloat((ev / (cote - 1)).toFixed(4))
}

export function calcMiseKelly(bankroll: number, cote: number, prob: number, fraction = 0.25): number {
  // On utilise le quart de Kelly pour limiter le risque
  const kelly = calcKelly(cote, prob)
  return parseFloat((bankroll * kelly * fraction).toFixed(2))
}

export function devig(cotes: number[]): number[] {
  // Retire la marge bookmaker — normalise les probabilités à 100%
  const probsBrutes = cotes.map(c => 1 / c)
  const total = probsBrutes.reduce((s, p) => s + p, 0)
  return probsBrutes.map(p => parseFloat(((p / total) * 100).toFixed(2)))
}

export function isValueBet(cote: number, prob: number): boolean {
  return calcEV(cote, prob) > 0
}

// =============================================
// STATS BANKROLL
// =============================================
export function calcStats(paris: Pari[]) {
  const termines = paris.filter(p => p.statut === 'gagné' || p.statut === 'perdu')
  const gagnes = paris.filter(p => p.statut === 'gagné')
  const perdus = paris.filter(p => p.statut === 'perdu')
  const enCours = paris.filter(p => p.statut === 'en_cours')

  const totalMise = termines.reduce((s, p) => s + p.mise, 0)
  const totalGain = termines.reduce((s, p) => s + (p.gain ?? 0), 0)
  const roi = totalMise > 0 ? parseFloat(((totalGain / totalMise) * 100).toFixed(2)) : 0
  const txReussite = termines.length > 0
    ? parseFloat(((gagnes.length / termines.length) * 100).toFixed(1))
    : 0
  const coteMoyenne = termines.length > 0
    ? parseFloat((termines.reduce((s, p) => s + p.coteStake, 0) / termines.length).toFixed(2))
    : 0

  return {
    total: paris.length,
    termines: termines.length,
    gagnes: gagnes.length,
    perdus: perdus.length,
    enCours: enCours.length,
    totalMise,
    totalGain,
    roi,
    txReussite,
    coteMoyenne,
  }
}

// =============================================
// LOCALSTORAGE HELPERS
// =============================================
const KEY_PARIS = 'sporthinker_paris'
const KEY_BANKROLL = 'sporthinker_bankroll'

export function getParis(): Pari[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY_PARIS) ?? '[]')
  } catch { return [] }
}

export function savePari(pari: Omit<Pari, 'id' | 'createdAt'>): Pari {
  const paris = getParis()
  const nouveau: Pari = {
    ...pari,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY_PARIS, JSON.stringify([nouveau, ...paris]))
  return nouveau
}

export function updatePari(id: string, updates: Partial<Pari>): void {
  const paris = getParis()
  const idx = paris.findIndex(p => p.id === id)
  if (idx === -1) return
  paris[idx] = { ...paris[idx], ...updates }
  // Calcule le gain net si statut mis à jour
  if (updates.statut === 'gagné' && paris[idx].gain === undefined) {
    paris[idx].gain = parseFloat(((paris[idx].coteStake - 1) * paris[idx].mise).toFixed(2))
  }
  if (updates.statut === 'perdu') {
    paris[idx].gain = -paris[idx].mise
  }
  if (updates.statut === 'annulé') {
    paris[idx].gain = 0
  }
  localStorage.setItem(KEY_PARIS, JSON.stringify(paris))
}

export function deletePari(id: string): void {
  const paris = getParis().filter(p => p.id !== id)
  localStorage.setItem(KEY_PARIS, JSON.stringify(paris))
}

export function getBankroll(): Bankroll {
  if (typeof window === 'undefined') return { montantInitial: 1000, montantActuel: 1000, devise: '€' }
  try {
    return JSON.parse(localStorage.getItem(KEY_BANKROLL) ?? JSON.stringify({ montantInitial: 1000, montantActuel: 1000, devise: '€' }))
  } catch { return { montantInitial: 1000, montantActuel: 1000, devise: '€' } }
}

export function saveBankroll(b: Bankroll): void {
  localStorage.setItem(KEY_BANKROLL, JSON.stringify(b))
}
