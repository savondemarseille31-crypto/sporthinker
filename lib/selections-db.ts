// Suivi des sélections — Supabase (server-side)
// Service role key utilisée pour bypasser RLS.

import { createClient } from '@supabase/supabase-js'
import type { ValueBet } from './value-bets'
import { getESPNTennisResults } from './espn-api'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrackedStatut = 'en_cours' | 'gagné' | 'perdu'

export type TrackedBet = {
  id: string
  event_id: string
  bet_on_player: string
  match_str: string
  pari: string
  sport: string
  surface: string
  date_match: string
  heure: string
  cote_ref: number
  p_model: number
  p_marche: number
  edge: number
  niveau: string
  statut: TrackedStatut
  created_at: string
  validated_at: string | null
}

export type LevelStats = {
  total: number
  gagnes: number
  perdus: number
  enCours: number
  unitesNettes: number
  roi: number | null
  coteMoyenne: number | null
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function upsertBets(bets: ValueBet[]): Promise<void> {
  if (!bets.length) return
  const { error } = await db().from('selections_tracked').upsert(
    bets.map(b => ({
      id:             b.id,
      event_id:       b.eventId,
      bet_on_player:  b.betOnPlayer,
      match_str:      b.match,
      pari:           b.pari,
      sport:          b.sport,
      surface:        b.surface,
      date_match:     b.date,
      heure:          b.heure,
      cote_ref:       b.coteRef,
      p_model:        b.pModel,
      p_marche:       b.pMarche,
      edge:           b.edge,
      niveau:         b.niveau,
    })),
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (error) console.error('[selections-db] upsertBets error:', error.message)
}

export async function getTrackedBets(): Promise<TrackedBet[]> {
  const { data, error } = await db()
    .from('selections_tracked')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) console.error('[selections-db] getTrackedBets error:', error.message)
  return (data ?? []) as TrackedBet[]
}

export async function updateStatut(id: string, statut: TrackedStatut): Promise<void> {
  await db()
    .from('selections_tracked')
    .update({
      statut,
      validated_at: statut !== 'en_cours' ? new Date().toISOString() : null,
    })
    .eq('id', id)
}

// ── Stats par niveau ──────────────────────────────────────────────────────────

export function computeStats(bets: TrackedBet[]): Record<string, LevelStats> {
  const levels = ['excellent', 'bon', 'interessant']
  const result: Record<string, LevelStats> = {}

  for (const niveau of levels) {
    const sub      = bets.filter(b => b.niveau === niveau)
    const gagnes   = sub.filter(b => b.statut === 'gagné')
    const perdus   = sub.filter(b => b.statut === 'perdu')
    const termines = gagnes.length + perdus.length

    const unitesNettes = parseFloat((
      gagnes.reduce((s, b) => s + (b.cote_ref - 1), 0) +
      perdus.reduce((s, _) => s - 1, 0)
    ).toFixed(2))

    result[niveau] = {
      total:       sub.length,
      gagnes:      gagnes.length,
      perdus:      perdus.length,
      enCours:     sub.filter(b => b.statut === 'en_cours').length,
      unitesNettes,
      roi:         termines > 0 ? parseFloat(((unitesNettes / termines) * 100).toFixed(1)) : null,
      coteMoyenne: termines > 0
        ? parseFloat((sub.filter(b => b.statut !== 'en_cours').reduce((s, b) => s + b.cote_ref, 0) / termines).toFixed(2))
        : null,
    }
  }

  return result
}

// ── Validation automatique via ESPN (scores Roland Garros) ───────────────────

function normName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

function namesMatch(a: string, b: string): boolean {
  const na = normName(a), nb = normName(b)
  if (na === nb) return true
  // "Last, First" format (The Odds API) → "First Last"
  if (a.includes(',')) {
    const [last, ...firsts] = a.split(',').map(p => p.trim())
    if (normName(`${firsts.join(' ')} ${last}`) === nb) return true
  }
  // Fallback : correspondance sur les mots de > 3 chars (nom de famille)
  const tokensA = a.split(/[\s,\-]+/).map(normName).filter(t => t.length > 3)
  const tokensB = b.split(/[\s,\-]+/).map(normName).filter(t => t.length > 3)
  return tokensA.some(ta => tokensB.includes(ta))
}

export async function validateCompletedBets(): Promise<number> {
  const { data: pending } = await db()
    .from('selections_tracked')
    .select('*')
    .eq('statut', 'en_cours')

  if (!pending?.length) return 0

  const espnResults = await getESPNTennisResults(7)
  if (!espnResults.length) return 0

  let validated = 0
  for (const bet of pending as TrackedBet[]) {
    // Extraire l'adversaire depuis match_str pour un matching précis
    const opponentName = bet.match_str
      .split(' vs ')
      .map((p: string) => p.trim())
      .find((p: string) => !namesMatch(bet.bet_on_player, p)) ?? ''

    const result = espnResults.find(r => {
      const hasPlayer = namesMatch(bet.bet_on_player, r.player1) || namesMatch(bet.bet_on_player, r.player2)
      if (!hasPlayer) return false
      if (!opponentName) return true
      return namesMatch(opponentName, r.player1) || namesMatch(opponentName, r.player2)
    })
    if (!result) continue

    const won = namesMatch(bet.bet_on_player, result.winnerName)
    await db()
      .from('selections_tracked')
      .update({ statut: won ? 'gagné' : 'perdu', validated_at: new Date().toISOString() })
      .eq('id', bet.id)
    validated++
  }

  return validated
}
