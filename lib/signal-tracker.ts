import type { Signal, SignalForce } from './signals'

export type SignalStatut = 'en_cours' | 'gagné' | 'perdu' | 'annulé'

export type TrackedSignal = {
  id: string
  signalId: string
  savedAt: string
  date: string
  sport: Signal['sport']
  match: string
  pari: string
  typePari: string
  force: SignalForce
  cote: number           // cote d'ouverture (au moment du save)
  statut: SignalStatut
  gain?: number
  marché?: string        // pour les signaux joueurs CdM
  coteCloture?: number   // cote de clôture — à renseigner après le match pour valider l'edge
  clv?: number           // Closing Line Value = cote/coteCloture - 1 (>0 = battu la clôture)
}

export type TrackerStats = {
  total: number
  termines: number
  gagnes: number
  perdus: number
  enCours: number
  totalGain: number
  roi: number
  txReussite: number
  coteMoyenne: number
}

const KEY = 'sporthinker_signal_tracker'

export function getTrackedSignals(): TrackedSignal[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}

export function isAlreadyTracked(signalId: string, date: string): boolean {
  return getTrackedSignals().some(s => s.signalId === signalId && s.date === date)
}

export function saveTrackedSignal(signal: Signal, cote: number): TrackedSignal | null {
  if (isAlreadyTracked(signal.id, signal.date)) return null
  const signals = getTrackedSignals()
  const tracked: TrackedSignal = {
    id: crypto.randomUUID(),
    signalId: signal.id,
    savedAt: new Date().toISOString(),
    date: signal.date,
    sport: signal.sport,
    match: signal.match,
    pari: signal.pari,
    typePari: signal.typePari,
    force: signal.force,
    cote,
    statut: 'en_cours',
  }
  localStorage.setItem(KEY, JSON.stringify([tracked, ...signals]))
  return tracked
}

// Sauvegarde flexible (signaux joueurs CdM ou tout autre source)
export function saveTrackedSignalRaw(
  data: Omit<TrackedSignal, 'id' | 'savedAt'>,
): TrackedSignal | null {
  if (isAlreadyTracked(data.signalId, data.date)) return null
  const signals = getTrackedSignals()
  const tracked: TrackedSignal = {
    ...data,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY, JSON.stringify([tracked, ...signals]))
  return tracked
}

export function saveMultipleSignals(signals: Signal[], defaultCote = 2.0): number {
  let saved = 0
  for (const s of signals) {
    if (saveTrackedSignal(s, defaultCote)) saved++
  }
  return saved
}

export function updateTrackedSignal(id: string, updates: Partial<TrackedSignal>): void {
  const signals = getTrackedSignals()
  const idx = signals.findIndex(s => s.id === id)
  if (idx === -1) return
  signals[idx] = { ...signals[idx], ...updates }
  if (updates.statut === 'gagné' && updates.gain === undefined) {
    signals[idx].gain = parseFloat((signals[idx].cote - 1).toFixed(2))
  }
  if (updates.statut === 'perdu') signals[idx].gain = -1
  if (updates.statut === 'annulé') signals[idx].gain = 0
  localStorage.setItem(KEY, JSON.stringify(signals))
}

export function deleteTrackedSignal(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getTrackedSignals().filter(s => s.id !== id)))
}

// CLV — enregistre la cote de clôture et calcule l'edge modèle vs marché
export function updateCoteCloture(id: string, coteCloture: number): void {
  const signals = getTrackedSignals()
  const idx = signals.findIndex(s => s.id === id)
  if (idx === -1) return
  const clv = parseFloat((signals[idx].cote / coteCloture - 1).toFixed(4))
  signals[idx] = { ...signals[idx], coteCloture, clv }
  localStorage.setItem(KEY, JSON.stringify(signals))
}

export function calcTrackerStats(signals: TrackedSignal[]): TrackerStats {
  const termines = signals.filter(s => s.statut === 'gagné' || s.statut === 'perdu')
  const gagnes = signals.filter(s => s.statut === 'gagné')
  const perdus = signals.filter(s => s.statut === 'perdu')
  const enCours = signals.filter(s => s.statut === 'en_cours')
  const totalMise = termines.length
  const totalGain = termines.reduce((sum, s) => sum + (s.gain ?? 0), 0)
  const roi = totalMise > 0 ? parseFloat(((totalGain / totalMise) * 100).toFixed(1)) : 0
  const txReussite = termines.length > 0
    ? parseFloat(((gagnes.length / termines.length) * 100).toFixed(1))
    : 0
  const coteMoyenne = termines.length > 0
    ? parseFloat((termines.reduce((s, t) => s + t.cote, 0) / termines.length).toFixed(2))
    : 0
  return {
    total: signals.length,
    termines: termines.length,
    gagnes: gagnes.length,
    perdus: perdus.length,
    enCours: enCours.length,
    totalGain: parseFloat(totalGain.toFixed(2)),
    roi,
    txReussite,
    coteMoyenne,
  }
}
