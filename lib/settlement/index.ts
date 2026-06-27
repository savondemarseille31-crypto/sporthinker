// Auto-soldage des paris perso (user_bets) — server-only (service role).
// Principe : 1 récup de résultats par sport/jour, puis soldage de tous les paris.
// Conservateur : on ne solde QUE si le match est identifié avec certitude et le type
// de pari reconnu ; sinon on laisse « en_cours » (jamais de faux résultat).

import { createClient } from '@supabase/supabase-js'
import { getSchedule, type MLBGame } from '@/lib/mlb-api'
import { getESPNTennisResults, type ESPNTennisResult } from '@/lib/espn-api'
import { getTodayPlayoffGames, type NBAGame } from '@/lib/nba-api'
import { getCdMScores, getMLSScores, type OddsScore } from '@/lib/odds-api'
import { getFixturesByDate, getAllFixturePlayers, type AFFixture, type AFFixturePlayers } from '@/lib/api-football'

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

function evalNba(bet: { match: string; selection: string }, games: NBAGame[]): Verdict {
  const parts = bet.match.split(' vs ').map(s => s.trim())
  if (parts.length < 2) return null
  const g = games.find(x => {
    const h = x.home_team.full_name, a = x.visitor_team.full_name
    return (nameMatch(parts[0], h) && nameMatch(parts[1], a)) ||
           (nameMatch(parts[0], a) && nameMatch(parts[1], h))
  })
  if (!g || g.status !== 'Final') return null
  const hs = g.home_team_score, as = g.visitor_team_score
  const line = parseLine(bet.selection)
  if (line) {
    const total = hs + as
    if (total === line.line) return null
    const isOver = total > line.line
    return { statut: (line.kind === 'over' ? isOver : !isOver) ? 'gagné' : 'perdu' }
  }
  const homeWon = hs > as
  const winner = homeWon ? g.home_team.full_name : g.visitor_team.full_name
  const loser  = homeWon ? g.visitor_team.full_name : g.home_team.full_name
  const selW = nameMatch(bet.selection, winner)
  const selL = nameMatch(bet.selection, loser)
  if (selW && !selL) return { statut: 'gagné' }
  if (selL && !selW) return { statut: 'perdu' }
  return null
}

// Football (CdM + MLS). Résultats via The Odds API (le plan API-Football gratuit n'a pas 2026).
// Conservateur : on ne solde que les matchs marqués completed avec des scores.
function evalFootball(bet: { match: string; selection: string }, events: OddsScore[]): Verdict {
  const parts = bet.match.split(' vs ').map(s => s.trim())
  if (parts.length < 2) return null
  const ev = events.find(x =>
    (nameMatch(parts[0], x.home_team) && nameMatch(parts[1], x.away_team)) ||
    (nameMatch(parts[0], x.away_team) && nameMatch(parts[1], x.home_team)),
  )
  if (!ev || !ev.completed || !ev.scores) return null
  const hs = ev.scores.find(s => nameMatch(s.name, ev.home_team))?.score
  const as = ev.scores.find(s => nameMatch(s.name, ev.away_team))?.score
  const hg = hs != null ? parseInt(hs, 10) : NaN
  const ag = as != null ? parseInt(as, 10) : NaN
  if (Number.isNaN(hg) || Number.isNaN(ag)) return null

  const line = parseLine(bet.selection)
  if (line) {
    const total = hg + ag
    if (total === line.line) return null
    const isOver = total > line.line
    return { statut: (line.kind === 'over' ? isOver : !isOver) ? 'gagné' : 'perdu' }
  }
  // BTTS (les deux équipes marquent)
  if (/\bbtts\b|deux equipes marquent/.test(norm(bet.selection))) {
    return { statut: hg > 0 && ag > 0 ? 'gagné' : 'perdu' }
  }
  const isDrawBet = /\bnul\b|match nul|draw/.test(norm(bet.selection))
  if (hg === ag) return { statut: isDrawBet ? 'gagné' : 'perdu' }
  if (isDrawBet) return { statut: 'perdu' }
  const homeWon = hg > ag
  const winner = homeWon ? ev.home_team : ev.away_team
  const loser  = homeWon ? ev.away_team : ev.home_team
  const selW = nameMatch(bet.selection, winner)
  const selL = nameMatch(bet.selection, loser)
  if (selW && !selL) return { statut: 'gagné' }
  if (selL && !selW) return { statut: 'perdu' }
  return null
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

  // NBA — 1 appel par date
  const nba = bets.filter(b => b.sport === 'NBA' && b.match_date)
  for (const date of [...new Set(nba.map(b => b.match_date!))]) {
    let games: NBAGame[] = []
    try { games = await getTodayPlayoffGames(date) } catch { continue }
    for (const bet of nba.filter(b => b.match_date === date)) await apply(bet, evalNba(bet, games))
  }

  // Football : CdM + MLS — résultats via The Odds API (1 appel scores par sport)
  const cdmBets = bets.filter(b => b.sport === 'CdM')
  if (cdmBets.length) {
    const scores = await getCdMScores().catch(() => [] as OddsScore[])
    for (const bet of cdmBets) await apply(bet, evalFootball(bet, scores))
  }
  const mlsBets = bets.filter(b => b.sport === 'MLS')
  if (mlsBets.length) {
    const scores = await getMLSScores().catch(() => [] as OddsScore[])
    for (const bet of mlsBets) await apply(bet, evalFootball(bet, scores))
  }

  return { settled }
}

// Soldage du track record des signaux du modèle (signal_history). Gain en UNITÉS (mise à plat 1u).
type HistRow = { id: string; sport: string | null; match_date: string | null; match: string; selection: string; cote: number | null }

export async function settleSignalHistory(): Promise<{ settled: number }> {
  const supa = db()
  const { data, error } = await supa
    .from('signal_history')
    // alias date_match -> match_date (colonne réelle = date_match) ; on solde les non-encore-soldés
    // (statut 'en_cours' OU null, car les captures historiques n'avaient pas de statut).
    .select('id,sport,match_date:date_match,match,selection,cote')
    .or('statut.eq.en_cours,statut.is.null')
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

  // NBA
  const nba = rows.filter(r => r.sport === 'NBA' && r.match_date)
  for (const date of [...new Set(nba.map(r => r.match_date!))]) {
    let games: NBAGame[] = []
    try { games = await getTodayPlayoffGames(date) } catch { continue }
    for (const r of nba.filter(x => x.match_date === date)) await apply(r, evalNba(r, games))
  }

  // Football : CdM + MLS — résultats via The Odds API (1 appel scores par sport)
  const cdmRows = rows.filter(r => r.sport === 'CdM')
  if (cdmRows.length) {
    const scores = await getCdMScores().catch(() => [] as OddsScore[])
    for (const r of cdmRows) await apply(r, evalFootball(r, scores))
  }
  const mlsRows = rows.filter(r => r.sport === 'MLS')
  if (mlsRows.length) {
    const scores = await getMLSScores().catch(() => [] as OddsScore[])
    for (const r of mlsRows) await apply(r, evalFootball(r, scores))
  }

  return { settled }
}

// ── Soldage des props joueurs (prop_history) via stats joueurs API-Football ──
function evalProp(market: string, playerName: string, teams: AFFixturePlayers[]): 'gagné' | 'perdu' | null {
  let stat: AFFixturePlayers['players'][number]['statistics'][number] | undefined
  for (const t of teams) {
    const pl = t.players?.find(pp => nameMatch(pp.player.name, playerName))
    if (pl) { stat = pl.statistics?.[0]; break }
  }
  if (!stat) return null // joueur introuvable (n'a pas joué / nom différent) → void, on ne solde pas
  switch (market) {
    case 'buteur':       return (stat.goals?.total ?? 0)   >= 1 ? 'gagné' : 'perdu'
    case 'passeur':      return (stat.goals?.assists ?? 0) >= 1 ? 'gagné' : 'perdu'
    case 'tirs-cadrés':  return (stat.shots?.on ?? 0)      >= 1 ? 'gagné' : 'perdu'
    case 'carton-jaune': return (stat.cards?.yellow ?? 0)  >= 1 ? 'gagné' : 'perdu'
    default: return null
  }
}

type PropRow = { id: string; fixture_date: string; pays: string; player_name: string; market: string; cote: number | null }

export async function settleProps(): Promise<{ settled: number }> {
  const supa = db()
  const { data, error } = await supa
    .from('prop_history')
    .select('id,fixture_date,pays,player_name,market,cote')
    .or('statut.eq.en_cours,statut.is.null')
  if (error || !data) return { settled: 0 }
  const rows = data as PropRow[]
  let settled = 0

  for (const date of [...new Set(rows.map(r => r.fixture_date))]) {
    let fixtures: AFFixture[] = []
    try { fixtures = await getFixturesByDate(date, 1, 2026) } catch { continue }
    const playersCache = new Map<number, AFFixturePlayers[] | null>()
    for (const r of rows.filter(x => x.fixture_date === date)) {
      const fx = fixtures.find(f => nameMatch(f.teams.home.name, r.pays) || nameMatch(f.teams.away.name, r.pays))
      if (!fx || fx.fixture.status.short !== 'FT') continue
      if (!playersCache.has(fx.fixture.id)) {
        try { playersCache.set(fx.fixture.id, await getAllFixturePlayers(fx.fixture.id)) } catch { playersCache.set(fx.fixture.id, null) }
      }
      const teams = playersCache.get(fx.fixture.id)
      if (!teams) continue
      const verdict = evalProp(r.market, r.player_name, teams)
      if (!verdict) continue
      const gain = verdict === 'gagné' ? parseFloat(((r.cote ?? 1) - 1).toFixed(2)) : -1
      await supa.from('prop_history').update({ statut: verdict, gain, settled_at: new Date().toISOString() }).eq('id', r.id)
      settled++
    }
  }
  return { settled }
}

