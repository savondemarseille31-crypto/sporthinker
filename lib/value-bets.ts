// Calcul des paris à valeur : modèle interne vs marché débiaisé
// Les cotes de référence sont récupérées automatiquement via The Odds API.
// Le bookmaker de référence n'est jamais affiché dans l'interface.

import { getTennisOdds, type OddsEvent, type OddsBookmaker } from './odds-api'
import { findProfile, blendedWinProb, type Surface } from './player-profiles'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NiveauEdge = 'excellent' | 'bon' | 'interessant'

export type ValueBet = {
  id: string
  sport: string           // 'ATP' | 'WTA'
  surface: string         // 'terre battue' | 'gazon' | 'dur'
  match: string           // "Joueur A vs Joueur B"
  date: string
  heure: string
  pari: string            // "Joueur A — Victoire"
  typePari: string
  coteRef: number         // cote décimale du marché de référence
  pModel: number          // probabilité modèle (0-1)
  pMarche: number         // probabilité marché débiaisée (0-1)
  edge: number            // pModel - pMarche (0-1)
  niveau: NiveauEdge
  raisonnement: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const EDGE_THRESHOLD = 0.03  // 3% minimum
const BK_PRIORITY = ['pinnacle', 'pinnacle_us', 'betfair_ex_eu', 'bet365', 'unibet', 'williamhill']

// ── Helpers ───────────────────────────────────────────────────────────────────

function sharpBookmaker(ev: OddsEvent): OddsBookmaker | null {
  for (const key of BK_PRIORITY) {
    const bk = ev.bookmakers.find(b => b.key === key)
    if (bk?.markets.length) return bk
  }
  return ev.bookmakers[0] ?? null
}

// Méthode multiplicative — la plus utilisée par les sharps
function devig(o1: number, o2: number): [number, number] {
  const p1 = 1 / o1
  const p2 = 1 / o2
  const s = p1 + p2
  return [p1 / s, p2 / s]
}

function surfaceFromKey(sportKey: string): Surface {
  if (sportKey.includes('french') || sportKey.includes('clay'))  return 'clay'
  if (sportKey.includes('wimbledon') || sportKey.includes('grass')) return 'grass'
  return 'hard'
}

function surfaceLabel(s: Surface): string {
  if (s === 'clay')  return 'terre battue'
  if (s === 'grass') return 'gazon'
  return 'dur'
}

function classifyEdge(edge: number): NiveauEdge {
  if (edge >= 0.08) return 'excellent'
  if (edge >= 0.05) return 'bon'
  return 'interessant'
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const date  = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  return { date, heure }
}

// ── Tennis ────────────────────────────────────────────────────────────────────

function analyzeTennisEvent(ev: OddsEvent, tour: 'atp' | 'wta'): ValueBet[] {
  const bk = sharpBookmaker(ev)
  if (!bk) return []

  const h2h = bk.markets.find(m => m.key === 'h2h')
  if (!h2h || h2h.outcomes.length < 2) return []

  // Les noms dans The Odds API peuvent être "Last, First" ou "First Last"
  const o1 = h2h.outcomes[0]
  const o2 = h2h.outcomes[1]
  if (!o1 || !o2) return []

  const [pMkt1, pMkt2] = devig(o1.price, o2.price)

  const prof1 = findProfile(o1.name, tour)
  const prof2 = findProfile(o2.name, tour)
  if (!prof1 || !prof2) return []

  const surface   = surfaceFromKey(ev.sport_key)
  const surfLbl   = surfaceLabel(surface)
  const pMod1     = blendedWinProb(prof1, prof2, surface)
  const pMod2     = 1 - pMod1
  const { date, heure } = formatTime(ev.commence_time)

  const bets: ValueBet[] = []

  const addBet = (
    player: string, oppo: string, pMod: number, pMkt: number, cote: number, suffix: string
  ) => {
    const edge = pMod - pMkt
    if (edge <= EDGE_THRESHOLD) return
    bets.push({
      id: `${ev.id}-${suffix}`,
      sport: tour.toUpperCase(),
      surface: surfLbl,
      match: `${o1.name} vs ${o2.name}`,
      date, heure,
      pari: `${player} — Victoire`,
      typePari: 'Moneyline',
      coteRef: parseFloat(cote.toFixed(2)),
      pModel:  parseFloat(pMod.toFixed(4)),
      pMarche: parseFloat(pMkt.toFixed(4)),
      edge:    parseFloat(edge.toFixed(4)),
      niveau:  classifyEdge(edge),
      raisonnement:
        `Notre modèle attribue ${(pMod * 100).toFixed(1)}% à ${player} sur ${surfLbl}, ` +
        `contre ${(pMkt * 100).toFixed(1)}% selon le marché corrigé de la marge. ` +
        `Avantage estimé : +${(edge * 100).toFixed(1)} points de probabilité.`,
    })
  }

  addBet(o1.name, o2.name, pMod1, pMkt1, o1.price, 'p1')
  addBet(o2.name, o1.name, pMod2, pMkt2, o2.price, 'p2')

  return bets
}

// ── Export principal ──────────────────────────────────────────────────────────

export async function getValueBets(): Promise<ValueBet[]> {
  const events = await getTennisOdds()

  const bets: ValueBet[] = []
  for (const ev of events) {
    const tour: 'atp' | 'wta' = ev.sport_key.includes('wta') ? 'wta' : 'atp'
    bets.push(...analyzeTennisEvent(ev, tour))
  }

  // Tri par avantage décroissant
  return bets.sort((a, b) => b.edge - a.edge)
}
