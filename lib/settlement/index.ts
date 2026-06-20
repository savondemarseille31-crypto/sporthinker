// Auto-soldage des paris perso (user_bets) — server-only (service role).
// Principe : 1 récup de résultats par sport/jour, puis soldage de tous les paris.
// Conservateur : on ne solde QUE si le match est identifié avec certitude et le type
// de pari reconnu ; sinon on laisse « en_cours » (jamais de faux résultat).

import { createClient } from '@supabase/supabase-js'
import { getSchedule, type MLBGame } from '@/lib/mlb-api'
import { getESPNTennisResults, type ESPNTennisResult } from '@/lib/espn-api'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

type BetRow = {
  id: string
  sport: string | null
  match_date: string | null
  match: string
  selection: string
  cote_stake: number
  mise: number
}

function norm(s: string): string {
  return (s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Vrai si égalité, inclusion, ou partage d'un token significatif (> 3 caractères)
function nameMatch(a: string, b: string): boolean {
  const na = norm(a), nb = norm(b)
  if (!na || !nb) return false
  if (na === nb || na.includes(nb) || nb.includes(na)) return true
  const ta = na.split(' ').filter(t => t.length > 3)
  const tb = nb.split(' ').filter(t => t.length > 3)
  return ta.some(t => tb.includes(t))
}

type Verdict = { statut: 'gagné' | 'perdu' } | null

// Détecte un pari de total (Over/Under) et sa ligne
function parseLine(sel: string): { kind: 'under' | 'over'; line: number } | null {
  const m = norm(sel)
  let r = /(moins de|under)\s*([0-9]+(?:[.,][0-9]+)?)/.exec(m)
  if (r) return { kind: 'under', line: parseFloat(r[2].replace(',', '.')) }
  r = /(plus de|over)\s*([0-9]+(?:[.,][0-9]+)?)/.exec(m)
  if (r) return { kind: 'over', line: parseFloat(r[2].replace(',', '.')) }
  return null
}

function evalMlb(bet: { match: string; selection: string }, games: MLBGame[]): Verdict {
  const parts = bet.match.split(' vs ').map(s => s.trim())
  if (parts.length < 2) return null
  const game = games.find(g => {
    const h = g.teams.home.team.name, a = g.teams.away.team.name
    return (nameMatch(parts[0], h) && nameMatch(parts[1], a)) ||
           (nameMatch(parts[0], a) && nameMatch(parts[1], h))
  })
  if (!game || game.status.abstractGameState !== 'Final') return null
  const hs = game.teams.home.score, as = game.teams.away.score
  if (hs == null || as == null) return null

  const line = parseLine(bet.selection)
  if (line) {
    const total = hs + as
    if (total === line.line) return null // push (improbable avec .5)
    const isOver = total > line.line
    const won = line.kind === 'over' ? isOver : !isOver
    return { statut: won ? 'gagné' : 'perdu' }
  }

  // Moneyline : la sélection nomme une équipe
  const homeWon = hs > as
  const winner = homeWon ? game.teams.home.team : game.teams.away.team
  const loser  = homeWon ? game.teams.away.team : game.teams.home.team
  const selWinner = nameMatch(bet.selection, winner.name) || nameMatch(bet.selection, winner.teamName)
  const selLoser  = nameMatch(bet.selection, loser.name)  || nameMatch(bet.selection, loser.teamName)
  if (selWinner && !selLoser) return { statut: 'gagné' }
  if (selLoser && !selWinner) return { statut: 'perdu' }
  return null // ambigu → on ne solde pas
}

function evalTennis(bet: { match: string; selection: string }, results: ESPNTennisResult[]): Verdict {
  const res = results.find(r =>
    (nameMatch(bet.selection, r.player1) || nameMatch(bet.selection, r.player2)) &&
    (nameMatch(bet.match, r.player1) && nameMatch(bet.match, r.player2)),
  )
  if (!res) return null
  // la sélection doit clairement désigner l'un des deux joueurs
  const sel1 = nameMatch(bet.selection, res.player1), sel2 = nameMatch(bet.selection, res.player2)
  if (sel1 === sel2) return null // ambigu
  const won = nameMatch(bet.selection, res.winnerName)
  return { statut: won ? 'gagné' : 'perdu' }
}

export async function settleUserBets(): Promise<{ settled: number }> {
  const supa = db()
  const { data, error } = await supa
    .from('user_bets')
    .select('id,sport,match_date,match,selection,cote_stake,mise')
    .eq('statut', 'en_cours')
  if (error || !data) return { settled: 0 }
  const bets = data as BetRow[]
  let settled = 0

  async function apply(bet: BetRow, v: Verdict) {
    if (!v) return
    const gain = v.statut === 'gagné'
      ? parseFloat(((bet.cote_stake - 1) * bet.mise).toFixed(2))
      : -bet.mise
    await supa.from('user_bets').update({ statut: v.statut, gain }).eq('id', bet.id)
    settled++
  }

  // MLB — 1 appel par date (récupération groupée des scores du jour)
  const mlb = bets.filter(b => b.sport === 'MLB' && b.match_date)
  for (const date of [...new Set(mlb.map(b => b.match_date!))]) {
    let games: MLBGame[] = []
    try { games = await getSchedule(date) } catch { continue }
    for (const bet of mlb.filter(b => b.match_date === date)) await apply(bet, evalMlb(bet, games))
  }

  // Tennis — 1 appel ESPN pour tous
  const tennis = bets.filter(b => b.sport === 'Tennis')
  if (tennis.length) {
    let results: ESPNTennisResult[] = []
    try { results = await getESPNTennisResults() } catch { results = [] }
    for (const bet of tennis) await apply(bet, evalTennis(bet, results))
  }

  return { settled }
}

// Soldage du track record des signaux du modèle (signal_history). Gain en UNITÉS (mise à plat 1u).
type HistRow = { id: string; sport: string | null; match_date: string | null; match: string; selection: string; cote: number | null }

export async function settleSignalHistory(): Promise<{ settled: number }> {
  const supa = db()
  const { data, error } = await supa
    .from('signal_history')
    .select('id,sport,match_date,match,selection,cote')
    .eq('statut', 'en_cours')
  if (error || !data) return { settled: 0 }
  const rows = data as HistRow[]
  let settled = 0

  async function apply(row: HistRow, v: Verdict) {
    if (!v) return
    const gain = v.statut === 'gagné' ? parseFloat(((row.cote ?? 1) - 1).toFixed(2)) : -1
    await supa.from('signal_history')
      .update({ statut: v.statut, gain, settled_at: new Date().toISOString() })
      .eq('id', row.id)
    settled++
  }

  const mlb = rows.filter(r => r.sport === 'MLB' && r.match_date)
  for (const date of [...new Set(mlb.map(r => r.match_date!))]) {
    let games: MLBGame[] = []
    try { games = await getSchedule(date) } catch { continue }
    for (const r of mlb.filter(x => x.match_date === date)) await apply(r, evalMlb(r, games))
  }

  const tennis = rows.filter(r => r.sport === 'Tennis')
  if (tennis.length) {
    let results: ESPNTennisResult[] = []
    try { results = await getESPNTennisResults() } catch { results = [] }
    for (const r of tennis) await apply(r, evalTennis(r, results))
  }

  return { settled }
}
