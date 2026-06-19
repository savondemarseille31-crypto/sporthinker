// =============================================
// TYPES
// =============================================
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export type StatutPari = 'en_cours' | 'gagné' | 'perdu' | 'annulé'
export type TypePari = '1X2' | 'buteur' | 'over_under' | 'double_chance' | 'autre'

export type Pari = {
  id: string
  createdAt: string
  match: string          // ex: "France vs Maroc"
  competition: string    // ex: "CdM 2026 - Groupe D"
  typePari: TypePari
  selection: string      // ex: "France gagne", "Mbappé buteur"
  coteStake: number      // cote sur le book
  probEstimee: number    // probabilité en % (0-100)
  mise: number           // en €/$ ou unités
  statut: StatutPari
  gain?: number          // gain net (positif ou négatif)
  notes?: string
  sport?: string         // sport (pour l'auto-soldage) : MLB, Tennis, NBA, MLS, CdM
  dateMatch?: string     // date du match YYYY-MM-DD (pour récupérer le résultat)
}

export type Bankroll = {
  montantInitial: number
  montantActuel: number
  devise: string
}

// =============================================
// CALCULS VALUE BET  (purs — inchangés)
// =============================================
export function calcEV(cote: number, prob: number): number {
  return parseFloat(((cote * (prob / 100)) - 1).toFixed(4))
}

// Kelly exact avec push/nul — f = (pWin×b − pLose) / (b×(1−pPush))
export function calcKelly(cote: number, prob: number, pPush = 0): number {
  const pWin  = prob / 100
  const pLose = 1 - pWin - pPush
  const b     = cote - 1
  if (b <= 0 || pLose < 0 || pWin <= 0) return 0
  const f = (pWin * b - pLose) / (b * (1 - pPush))
  return f > 0 ? parseFloat(f.toFixed(4)) : 0
}

export function calcMiseKelly(bankroll: number, cote: number, prob: number, fraction = 0.25, conf = 1.0, pPush = 0): number {
  const kelly = calcKelly(cote, prob, pPush)
  return parseFloat((bankroll * kelly * fraction * conf).toFixed(2))
}

export function devig(cotes: number[]): number[] {
  const q = cotes.map(c => 1 / c)
  const total = q.reduce((s, p) => s + p, 0)
  return q.map(p => parseFloat(((p / total) * 100).toFixed(2)))
}

export function devigPower(cotes: number[]): number[] {
  const q = cotes.map(c => 1 / c)
  let lo = 1, hi = 5
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    q.reduce((s, qi) => s + Math.pow(qi, mid), 0) > 1 ? lo = mid : hi = mid
  }
  const k = (lo + hi) / 2
  const p = q.map(qi => Math.pow(qi, k))
  const total = p.reduce((s, pi) => s + pi, 0)
  return p.map(pi => parseFloat(((pi / total) * 100).toFixed(2)))
}

const W_PAR_MARCHE: Record<TypePari, number> = {
  '1X2':           0.20,
  'over_under':    0.30,
  'double_chance': 0.30,
  'buteur':        0.55,
  'autre':         0.40,
}

export function blendProb(pModele: number, pMarchéDevig: number, typeMarché: TypePari): number {
  const w = W_PAR_MARCHE[typeMarché] ?? 0.35
  return parseFloat((w * pModele + (1 - w) * pMarchéDevig).toFixed(2))
}

export function wBlend(typeMarché: TypePari): number {
  return W_PAR_MARCHE[typeMarché] ?? 0.35
}

export function isValueBet(cote: number, prob: number): boolean {
  return calcEV(cote, prob) > 0
}

// =============================================
// STATS BANKROLL  (pur — inchangé)
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
// STOCKAGE — Supabase si connecté, localStorage sinon
// =============================================
const KEY_PARIS = 'sporthinker_paris'
const KEY_BANKROLL = 'sporthinker_bankroll'
const DEFAULT_BANKROLL: Bankroll = { montantInitial: 1000, montantActuel: 1000, devise: '€' }

function uid(): string {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID() } catch { /* noop */ }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function currentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { data } = await createSupabaseBrowserClient().auth.getUser()
    return data.user?.id ?? null
  } catch { return null }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToPari(r: any): Pari {
  return {
    id: r.id,
    createdAt: r.created_at,
    match: r.match ?? '',
    competition: r.competition ?? '',
    typePari: (r.type_pari ?? 'autre') as TypePari,
    selection: r.selection ?? '',
    coteStake: Number(r.cote_stake),
    probEstimee: Number(r.prob_estimee),
    mise: Number(r.mise),
    statut: (r.statut ?? 'en_cours') as StatutPari,
    gain: r.gain != null ? Number(r.gain) : undefined,
    notes: r.notes ?? undefined,
    sport: r.sport ?? undefined,
    dateMatch: r.match_date ?? undefined,
  }
}
function pariToRow(p: Partial<Pari>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (p.match !== undefined)        row.match = p.match
  if (p.competition !== undefined)  row.competition = p.competition
  if (p.typePari !== undefined)     row.type_pari = p.typePari
  if (p.selection !== undefined)    row.selection = p.selection
  if (p.coteStake !== undefined)    row.cote_stake = p.coteStake
  if (p.probEstimee !== undefined)  row.prob_estimee = p.probEstimee
  if (p.mise !== undefined)         row.mise = p.mise
  if (p.statut !== undefined)       row.statut = p.statut
  if (p.gain !== undefined)         row.gain = p.gain
  if (p.notes !== undefined)        row.notes = p.notes
  if (p.sport !== undefined)        row.sport = p.sport
  if (p.dateMatch !== undefined)    row.match_date = p.dateMatch
  return row
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── localStorage (invités / fallback) ───────────────────────────────────────
function getParisLocal(): Pari[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY_PARIS) ?? '[]') } catch { return [] }
}
function savePariLocal(pari: Omit<Pari, 'id' | 'createdAt'>): Pari {
  const nouveau: Pari = { ...pari, id: uid(), createdAt: new Date().toISOString() }
  localStorage.setItem(KEY_PARIS, JSON.stringify([nouveau, ...getParisLocal()]))
  return nouveau
}
function updatePariLocal(id: string, updates: Partial<Pari>): void {
  const paris = getParisLocal()
  const idx = paris.findIndex(p => p.id === id)
  if (idx === -1) return
  paris[idx] = { ...paris[idx], ...updates }
  if (updates.statut === 'gagné' && paris[idx].gain === undefined) {
    paris[idx].gain = parseFloat(((paris[idx].coteStake - 1) * paris[idx].mise).toFixed(2))
  }
  if (updates.statut === 'perdu')  paris[idx].gain = -paris[idx].mise
  if (updates.statut === 'annulé') paris[idx].gain = 0
  localStorage.setItem(KEY_PARIS, JSON.stringify(paris))
}
function deletePariLocal(id: string): void {
  localStorage.setItem(KEY_PARIS, JSON.stringify(getParisLocal().filter(p => p.id !== id)))
}
function getBankrollLocal(): Bankroll {
  if (typeof window === 'undefined') return DEFAULT_BANKROLL
  try { return JSON.parse(localStorage.getItem(KEY_BANKROLL) ?? JSON.stringify(DEFAULT_BANKROLL)) }
  catch { return DEFAULT_BANKROLL }
}
function saveBankrollLocal(b: Bankroll): void {
  localStorage.setItem(KEY_BANKROLL, JSON.stringify(b))
}

// ── API publique (async, auth-aware) ─────────────────────────────────────────
export async function getParis(): Promise<Pari[]> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_bets').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(rowToPari)
    } catch (e) { console.warn('[paris] lecture Supabase échouée, fallback localStorage', e) }
  }
  return getParisLocal()
}

export async function savePari(pari: Omit<Pari, 'id' | 'createdAt'>): Promise<Pari> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_bets').insert({ ...pariToRow(pari), user_id: userId }).select().single()
      if (error) throw error
      return rowToPari(data)
    } catch (e) { console.warn('[paris] insert Supabase échoué, fallback localStorage', e) }
  }
  return savePariLocal(pari)
}

export async function updatePari(id: string, updates: Partial<Pari>): Promise<void> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const supabase = createSupabaseBrowserClient()
      const patch = pariToRow(updates)
      // calcul auto du gain sur changement de statut
      if (updates.statut && updates.gain === undefined) {
        const { data: cur } = await supabase.from('user_bets').select('cote_stake, mise').eq('id', id).single()
        if (cur) {
          if (updates.statut === 'gagné')  patch.gain = parseFloat(((Number(cur.cote_stake) - 1) * Number(cur.mise)).toFixed(2))
          if (updates.statut === 'perdu')  patch.gain = -Number(cur.mise)
          if (updates.statut === 'annulé') patch.gain = 0
        }
      }
      const { error } = await supabase.from('user_bets').update(patch).eq('id', id)
      if (error) throw error
      return
    } catch (e) { console.warn('[paris] update Supabase échoué, fallback localStorage', e) }
  }
  updatePariLocal(id, updates)
}

export async function deletePari(id: string): Promise<void> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('user_bets').delete().eq('id', id)
      if (error) throw error
      return
    } catch (e) { console.warn('[paris] delete Supabase échoué, fallback localStorage', e) }
  }
  deletePariLocal(id)
}

export async function getBankroll(): Promise<Bankroll> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_bankroll').select('*').eq('user_id', userId).maybeSingle()
      if (error) throw error
      if (data) return { montantInitial: Number(data.montant_initial), montantActuel: Number(data.montant_actuel), devise: data.devise }
      return DEFAULT_BANKROLL
    } catch (e) { console.warn('[bankroll] lecture Supabase échouée, fallback localStorage', e) }
  }
  return getBankrollLocal()
}

export async function saveBankroll(b: Bankroll): Promise<void> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('user_bankroll').upsert({
        user_id: userId,
        montant_initial: b.montantInitial,
        montant_actuel: b.montantActuel,
        devise: b.devise,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return
    } catch (e) { console.warn('[bankroll] upsert Supabase échoué, fallback localStorage', e) }
  }
  saveBankrollLocal(b)
}
