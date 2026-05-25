// Matchstat Tennis API via RapidAPI
// tennis-api-atp-wta-itf.p.rapidapi.com
//
// Endpoints confirmés :
//   Fixtures du jour  : GET /tennis/v2/{tour}/fixtures/{YYYY-MM-DD}
//   Rankings singles  : GET /tennis/v2/{tour}/ranking/singles/
//   Stats surface     : GET /tennis/v2/{tour}/player/surface-summary/{playerId}
//   H2H matchs        : GET /tennis/v2/{tour}/h2h/matches/{p1Id}/{p2Id}

const BASE_URL = 'https://tennis-api-atp-wta-itf.p.rapidapi.com'
const API_KEY  = process.env.RAPIDAPI_TENNIS_KEY!

// ── Types publics ─────────────────────────────────────────────────────────────

export type Tour = 'atp' | 'wta'
export type TennisSurface = 'Clay' | 'Hard' | 'Grass' | 'Indoor Hard'

export type TennisPlayer = {
  id: number
  name: string
  nationality: string
  ranking: number
  age: number
  hand: 'Right' | 'Left' | null
}

export type TennisLeague = {
  id: number
  name: string
  level: TournamentLevel
  location: string
  type: string
  surface: TennisSurface
  season: number
}

export type TennisFixture = {
  id: number
  date: string       // 'YYYY-MM-DD'
  time: string       // 'HH:MM'
  timestamp: number
  tour: Tour
  status: { long: string; short: 'NS' | 'LIVE' | 'FT' | 'AWD' | 'WO'; elapsed?: number }
  league: TennisLeague
  players: { home: TennisPlayer; away: TennisPlayer }
  scores: {
    home: { games: number | null; sets: number | null }
    away: { games: number | null; sets: number | null }
  }
}

export type TennisPlayerStats = {
  playerId: number
  season: number
  // Serve — non dispo dans cette API, valeurs neutres (les signaux Over/Under ne se déclenchent pas)
  acesPer100: number
  doubleFaultsPer100: number
  firstServeIn: number
  ptsWonOn1stServe: number
  ptsWonOn2ndServe: number
  returnPtsWon: number
  breakPtsConverted: number
  breakPtsSaved: number
  // Bilan général
  matchesPlayed: number
  matchesWon: number
  overallWinRate: number
  // Win rate par surface (depuis surface-summary, 2 dernières saisons)
  clayMatches: number;  clayWins: number;  clayWinRate: number
  hardMatches: number;  hardWins: number;  hardWinRate: number
  grassMatches: number; grassWins: number; grassWinRate: number
}

export type TennisH2H = {
  player1: TennisPlayer
  player2: TennisPlayer
  player1Wins: number
  player2Wins: number
  clayP1Wins: number
  clayP2Wins: number
  lastMatches: { date: string; surface: string; winner: 1 | 2; score: string }[]
}

// ── Constantes ────────────────────────────────────────────────────────────────

export const CURRENT_SEASON = 2026

// ── Table des tournois connus (saison 2026) ───────────────────────────────────
// Les IDs sont stables par saison. À mettre à jour en début de saison suivante.
// Source : fixtures de l'API groupées par tournamentId.

export type TournamentLevel =
  | 'Grand Slam'
  | 'Masters 1000'
  | 'ATP 500'
  | 'ATP 250'
  | 'WTA 1000'
  | 'WTA 500'
  | 'WTA 250'
  | 'Challenger'
  | 'ITF'

export type TournamentInfo = {
  name: string
  level: TournamentLevel
  location: string
}

export const TOURNAMENT_MAP: Record<number, TournamentInfo> = {
  // ── ATP 2026 — semaine pré-Roland Garros (19–25 mai) ──
  21327: { name: 'Lyon Open',     level: 'ATP 250', location: 'Lyon, France' },
  21328: { name: 'Geneva Open',   level: 'ATP 250', location: 'Genève, Suisse' },
  21329: { name: 'ATP 250 Clay',  level: 'ATP 250', location: 'Clay' },     // 3e tournoi pré-RG — ID à vérifier
  21668: { name: 'ATP Challenger Clay', level: 'Challenger', location: '' },
  21711: { name: 'ATP Challenger', level: 'Challenger', location: 'Amérique du Sud' },
  21712: { name: 'ATP Challenger', level: 'Challenger', location: '' },

  // ── WTA 2026 — semaine pré-Roland Garros ──
  16723: { name: 'WTA Strasbourg', level: 'WTA 250', location: 'Strasbourg, France' },
  16724: { name: 'WTA Rabat',      level: 'WTA 250', location: 'Rabat, Maroc' },
  16725: { name: 'WTA Rabat',      level: 'WTA 250', location: 'Rabat, Maroc' },

  // ── Grand Chelems 2026 (IDs à confirmer quand l'API les publie) ──
  // Roland Garros, Wimbledon, US Open — on utilise inferTournamentType() en fallback
}

// Retourne les infos tournoi depuis la map ou un fallback lisible
export function getTournamentInfo(id: number, surface: TennisSurface, date: string): TournamentInfo {
  if (TOURNAMENT_MAP[id]) return TOURNAMENT_MAP[id]

  // Fallback : on infère le nom depuis la surface + la date
  const type = inferTournamentType(date)
  if (type === 'Grand Slam') {
    const d = new Date(date)
    const mo = d.getUTCMonth() + 1
    if (mo <= 2)  return { name: 'Australian Open', level: 'Grand Slam', location: 'Melbourne, Australie' }
    if (mo <= 6)  return { name: 'Roland Garros',   level: 'Grand Slam', location: 'Paris, France' }
    if (mo <= 7)  return { name: 'Wimbledon',        level: 'Grand Slam', location: 'Londres, Royaume-Uni' }
    return { name: 'US Open', level: 'Grand Slam', location: 'New York, États-Unis' }
  }

  const surfaceLabel: Record<TennisSurface, string> = {
    'Clay': 'Clay', 'Hard': 'Hard', 'Grass': 'Grass', 'Indoor Hard': 'Indoor',
  }
  return { name: `ATP ${surfaceLabel[surface]}`, level: 'ATP 250', location: '' }
}

// courtId API → TennisSurface
const COURT_SURFACE: Record<number, TennisSurface> = {
  1: 'Hard',
  2: 'Clay',
  3: 'Indoor Hard',
  4: 'Hard',    // carpet
  5: 'Grass',
}

// Compatibilité avec app/tennis/page.tsx (anciens IDs ignorés — on filtre par surface)
export const ATP = { ROLAND_GARROS: 0, WIMBLEDON: 0, US_OPEN: 0, AUSTRALIAN_OPEN: 0 } as const
export const WTA = { ROLAND_GARROS: 0, WIMBLEDON: 0, US_OPEN: 0, AUSTRALIAN_OPEN: 0 } as const

// Inférence surface par date (calendrier saison clay / grass / hard)
function inferSurface(date: string): TennisSurface {
  const d  = new Date(date)
  const mo = d.getUTCMonth() + 1  // 1-12
  const dy = d.getUTCDate()
  // Saison terre battue : mi-avril → mi-juin
  if ((mo === 4 && dy >= 15) || mo === 5 || (mo === 6 && dy <= 15)) return 'Clay'
  // Saison gazon : mi-juin → mi-juillet
  if ((mo === 6 && dy >= 16) || (mo === 7 && dy <= 15)) return 'Grass'
  return 'Hard'
}

// Grand Chelem uniquement sur les fenêtres calendaires connues
function inferTournamentType(date: string): 'Grand Slam' | 'ATP' {
  const d  = new Date(date)
  const mo = d.getUTCMonth() + 1
  const dy = d.getUTCDate()
  // Australian Open : ~13 jan – 2 fév
  if ((mo === 1 && dy >= 13) || (mo === 2 && dy <= 2)) return 'Grand Slam'
  // Roland Garros : ~25 mai – 8 jun
  if ((mo === 5 && dy >= 25) || (mo === 6 && dy <= 8)) return 'Grand Slam'
  // Wimbledon : ~30 jun – 13 jul
  if ((mo === 6 && dy >= 30) || (mo === 7 && dy <= 13)) return 'Grand Slam'
  // US Open : ~25 aoû – 7 sep
  if ((mo === 8 && dy >= 25) || (mo === 9 && dy <= 7)) return 'Grand Slam'
  return 'ATP'
}

// ── Rankings cache (serveur, TTL 24h) ────────────────────────────────────────

type RankMap = Map<number, number>
const _rankCache: Partial<Record<Tour, { map: RankMap; expires: number }>> = {}

async function getRankingMap(tour: Tour): Promise<RankMap> {
  const cached = _rankCache[tour]
  if (cached && Date.now() < cached.expires) return cached.map

  type RawRanking = { position: number; player: { id: number } }
  const raw = await apiFetch<RawRanking[]>(`/tennis/v2/${tour}/ranking/singles/`, 86400)

  const map: RankMap = new Map()
  for (const r of raw) map.set(r.player.id, r.position)
  _rankCache[tour] = { map, expires: Date.now() + 86_400_000 }
  return map
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function apiFetch<T = unknown>(path: string, revalidate = 3600): Promise<T> {
  if (!API_KEY) return [] as unknown as T
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'tennis-api-atp-wta-itf.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
      },
      next: { revalidate },
    })
    if (!res.ok) return [] as unknown as T
    const json = await res.json()
    // message = erreur API (endpoint inexistant)
    if (json.message) return [] as unknown as T
    return (json.data ?? json) as T
  } catch {
    return [] as unknown as T
  }
}

// ── Types bruts API ───────────────────────────────────────────────────────────

type RawFixture = {
  id: number
  date: string          // ISO "2026-05-21T22:00:00.000Z"
  roundId: number
  player1Id: number
  player2Id: number
  tournamentId: number
  timeGame: string | null
  seed1: string | null
  seed2: string | null
  live: unknown | null
  player1: { id: number; name: string; countryAcr: string }
  player2: { id: number; name: string; countryAcr: string }
}

function parseFixture(raw: RawFixture, rankMap: RankMap, tour: Tour): TennisFixture {
  const dt      = new Date(raw.date)
  const dateStr = dt.toISOString().split('T')[0]
  const timeStr = '~' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const surface = inferSurface(raw.date)

  const ranking1 = rankMap.get(raw.player1.id) ?? seedToRank(raw.seed1)
  const ranking2 = rankMap.get(raw.player2.id) ?? seedToRank(raw.seed2)

  return {
    id: raw.id,
    date: dateStr,
    time: timeStr,
    timestamp: Math.floor(dt.getTime() / 1000),
    tour,
    status: { long: raw.live ? 'In Play' : 'Not Started', short: raw.live ? 'LIVE' : 'NS' },
    league: {
      id: raw.tournamentId,
      ...getTournamentInfo(raw.tournamentId, surface, raw.date),
      type: inferTournamentType(raw.date),
      surface,
      season: CURRENT_SEASON,
    },
    players: {
      home: { id: raw.player1.id, name: raw.player1.name, nationality: raw.player1.countryAcr, ranking: ranking1, age: 0, hand: null },
      away: { id: raw.player2.id, name: raw.player2.name, nationality: raw.player2.countryAcr, ranking: ranking2, age: 0, hand: null },
    },
    scores: { home: { games: null, sets: null }, away: { games: null, sets: null } },
  }
}

// seed "3" → ~rank 25 (estimation conservative)
function seedToRank(seed: string | null): number {
  if (!seed) return 150
  const n = parseInt(seed)
  if (isNaN(n)) return 150
  return Math.min(150, n * 8)
}

// ── Endpoints publics ─────────────────────────────────────────────────────────

export async function getFixturesByDate(
  date: string,
  tour: Tour = 'atp',
): Promise<TennisFixture[]> {
  const [raw, rankMap] = await Promise.all([
    apiFetch<RawFixture[]>(`/tennis/v2/${tour}/fixtures/${date}`, 300),
    getRankingMap(tour),
  ])
  return Array.isArray(raw) ? raw.map(f => parseFixture(f, rankMap, tour)) : []
}

// Compatibilité avec l'ancienne API (leagueId ignoré — on retourne [] pour laisser la page
// utiliser getFixturesByDate à la place)
export async function getFixturesByLeague(
  _leagueId: number,
  _season?: number,
): Promise<TennisFixture[]> {
  return []
}

export async function getFixtureById(fixtureId: number): Promise<TennisFixture | null> {
  const today = new Date()
  const dates = [-1, 0, 1, 2].map(offset => {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() + offset)
    return d.toISOString().split('T')[0]
  })

  for (const date of dates) {
    for (const tour of ['atp', 'wta'] as Tour[]) {
      const [raw, rankMap] = await Promise.all([
        apiFetch<RawFixture[]>(`/tennis/v2/${tour}/fixtures/${date}`, 300),
        getRankingMap(tour),
      ])
      if (!Array.isArray(raw)) continue
      const found = raw.find(f => f.id === fixtureId)
      if (found) return parseFixture(found, rankMap, tour)
    }
  }
  return null
}

export async function getPlayerStats(
  playerId: number,
  tour: Tour = 'atp',
): Promise<TennisPlayerStats | null> {
  type RawYear = {
    year: number
    surfaces: { courtId: number; court: string; courtWins: number; courtLosses: number }[]
  }

  const raw = await apiFetch<RawYear[]>(
    `/tennis/v2/${tour}/player/surface-summary/${playerId}`,
    3600,
  )
  if (!Array.isArray(raw) || !raw.length) return null

  // Agréger les 2 dernières saisons pour la stabilité
  const recent = raw.filter(y => y.year >= CURRENT_SEASON - 1)
  if (!recent.length) return null

  type Acc = { wins: number; losses: number }
  const agg: Record<TennisSurface, Acc> = {
    Clay: { wins: 0, losses: 0 }, Hard: { wins: 0, losses: 0 },
    Grass: { wins: 0, losses: 0 }, 'Indoor Hard': { wins: 0, losses: 0 },
  }

  for (const yr of recent) {
    for (const s of yr.surfaces) {
      const surface = COURT_SURFACE[s.courtId]
      if (!surface) continue
      agg[surface].wins   += s.courtWins
      agg[surface].losses += s.courtLosses
    }
  }

  const wr = (w: number, l: number) => (w + l > 0 ? w / (w + l) : 0)
  const clay  = agg['Clay']
  const hard  = { wins: agg['Hard'].wins + agg['Indoor Hard'].wins, losses: agg['Hard'].losses + agg['Indoor Hard'].losses }
  const grass = agg['Grass']

  const totalWins   = clay.wins + hard.wins + grass.wins
  const totalPlayed = totalWins + clay.losses + hard.losses + grass.losses

  if (totalPlayed === 0) return null

  return {
    playerId,
    season: CURRENT_SEASON,
    // Stats service non disponibles → valeurs neutres (signaux Over/Under ne se déclenchent pas)
    acesPer100: 5, doubleFaultsPer100: 3,
    firstServeIn: 62, ptsWonOn1stServe: 65, ptsWonOn2ndServe: 50,
    returnPtsWon: 35, breakPtsConverted: 38, breakPtsSaved: 60,
    // Bilan
    matchesPlayed: totalPlayed,
    matchesWon: totalWins,
    overallWinRate: wr(totalWins, totalPlayed - totalWins),
    // Surface
    clayMatches:  clay.wins + clay.losses,   clayWins:  clay.wins,  clayWinRate:  wr(clay.wins, clay.losses),
    hardMatches:  hard.wins + hard.losses,   hardWins:  hard.wins,  hardWinRate:  wr(hard.wins, hard.losses),
    grassMatches: grass.wins + grass.losses, grassWins: grass.wins, grassWinRate: wr(grass.wins, grass.losses),
  }
}

export async function getH2H(
  player1Id: number,
  player2Id: number,
  tour: Tour = 'atp',
): Promise<TennisH2H | null> {
  type RawMatch = {
    id: string
    date: string
    match_winner: number
    result: string
    tournamentId: number
    player1: { id: number; name: string; countryAcr: string }
    player2: { id: number; name: string; countryAcr: string }
  }

  const raw = await apiFetch<RawMatch[]>(
    `/tennis/v2/${tour}/h2h/matches/${player1Id}/${player2Id}`,
    86400,
  )
  if (!Array.isArray(raw) || !raw.length) return null

  let p1Wins = 0, p2Wins = 0
  const lastMatches: TennisH2H['lastMatches'] = []

  for (const m of raw) {
    const winner: 1 | 2 = m.match_winner === player1Id ? 1 : 2
    if (winner === 1) p1Wins++; else p2Wins++
    const surface = inferSurface(m.date)
    lastMatches.push({
      date: new Date(m.date).toISOString().split('T')[0],
      surface,
      winner,
      score: m.result ?? '—',
    })
  }

  const clayMatches = lastMatches.filter(m => m.surface === 'Clay')
  const clayP1 = clayMatches.filter(m => m.winner === 1).length
  const clayP2 = clayMatches.filter(m => m.winner === 2).length

  // Retrouver les objets player dans la réponse
  const first = raw[0]
  const p1Raw = first.player1.id === player1Id ? first.player1 : first.player2
  const p2Raw = first.player1.id === player2Id ? first.player1 : first.player2

  return {
    player1: { id: player1Id, name: p1Raw.name, nationality: p1Raw.countryAcr, ranking: 999, age: 0, hand: null },
    player2: { id: player2Id, name: p2Raw.name, nationality: p2Raw.countryAcr, ranking: 999, age: 0, hand: null },
    player1Wins: p1Wins,
    player2Wins: p2Wins,
    clayP1Wins: clayP1,
    clayP2Wins: clayP2,
    lastMatches,
  }
}

export async function getLiveFixtures(_tour?: Tour): Promise<TennisFixture[]> {
  return []
}

export type RankingEntry = {
  position: number
  points: number
  progress: number   // delta rang vs semaine précédente (négatif = recul)
  player: {
    id: number
    name: string
    countryAcr: string
    countryName: string
  }
}

export async function getRankings(tour: Tour): Promise<RankingEntry[]> {
  type RawEntry = {
    position: number
    point: number
    player: {
      id: number
      name: string
      countryAcr: string
      progress: number
      country: { name: string; acronym: string }
    }
  }
  const raw = await apiFetch<RawEntry[]>(`/tennis/v2/${tour}/ranking/singles/`, 3600)
  if (!Array.isArray(raw)) return []
  return raw.map(r => ({
    position: r.position,
    points: r.point,
    progress: r.player.progress,
    player: {
      id: r.player.id,
      name: r.player.name,
      countryAcr: r.player.countryAcr,
      countryName: r.player.country?.name ?? r.player.countryAcr,
    },
  }))
}
