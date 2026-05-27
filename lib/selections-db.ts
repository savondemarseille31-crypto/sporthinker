// Suivi des sélections — Supabase (server-side)
// Service role key utilisée pour bypasser RLS.

import { createClient } from '@supabase/supabase-js'
import type { ValueBet } from './value-bets'

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

// ── Validation automatique via The Odds API scores ────────────────────────────

type ScoreEntry = { name: string; score: string }
type ScoreEvent = {
  id: string
  completed: boolean
  scores: ScoreEntry[] | null
}

async function fetchScores(sportKey: string): Promise<ScoreEvent[]> {
  const key = process.env.ODDS_API_KEY
  if (!key) return []
  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores?apiKey=${key}&daysFrom=3`
    const res = await fetch(url, { next: { revalidate: 28800 } }) // cache 8h
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function winner(scores: ScoreEntry[], player: string): boolean | null {
  const mine = scores.find(s => s.name === player)
  const oppo = scores.find(s => s.name !== player)
  if (!mine || !oppo) return null
  const ms = parseInt(mine.score)
  const os = parseInt(oppo.score)
  if (isNaN(ms) || isNaN(os)) return null
  return ms > os
}

export async function validateCompletedBets(): Promise<number> {
  const { data: pending } = await db()
    .from('selections_tracked')
    .select('*')
    .eq('statut', 'en_cours')

  if (!pending?.length) return 0

  const sportKeys = [
    'tennis_atp_french_open', 'tennis_wta_french_open',
    'tennis_atp_wimbledon',   'tennis_wta_wimbledon',
    'tennis_atp_us_open',     'tennis_wta_us_open',
    'tennis_atp_australian_open', 'tennis_wta_australian_open',
  ]

  const scores: ScoreEvent[] = []
  for (const key of sportKeys) {
    scores.push(...await fetchScores(key))
  }

  let validated = 0
  for (const bet of pending as TrackedBet[]) {
    const ev = scores.find(s => s.id === bet.event_id)
    if (!ev?.completed || !ev.scores) continue

    const won = winner(ev.scores, bet.bet_on_player)
    if (won === null) continue

    await db()
      .from('selections_tracked')
      .update({ statut: won ? 'gagné' : 'perdu', validated_at: new Date().toISOString() })
      .eq('id', bet.id)
    validated++
  }

  return validated
}
