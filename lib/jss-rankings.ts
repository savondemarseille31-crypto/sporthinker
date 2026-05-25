// Rankings ATP + WTA depuis les CSV Jeff Sackmann (GitHub, gratuit, ~hebdomadaire)
// Couvre 2200+ ATP et 1500+ WTA — bien au-delà des ~50 du curatedRank ESPN

const BASE = 'https://raw.githubusercontent.com/JeffSackmann'

async function fetchCSV(url: string): Promise<string> {
  const res = await fetch(url, {
    next: { revalidate: 86400 }, // 24h — mis à jour ~1x/semaine
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) throw new Error(`CSV fetch failed: ${url}`)
  return res.text()
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]))
  })
}

// Charge la table nom joueur : player_id → "Prénom Nom"
async function loadPlayerNames(tour: 'atp' | 'wta'): Promise<Map<string, string>> {
  const url = `${BASE}/tennis_${tour}/master/${tour}_players.csv`
  const rows = parseCSV(await fetchCSV(url))
  const map = new Map<string, string>()
  for (const r of rows) {
    const id   = r['player_id']
    const name = `${r['name_first']} ${r['name_last']}`.trim()
    if (id && name) map.set(id, name)
  }
  return map
}

// Charge le ranking le plus récent : nom → classement
async function loadCurrentRankings(
  tour: 'atp' | 'wta',
  nameMap: Map<string, string>,
): Promise<Map<string, number>> {
  const url = `${BASE}/tennis_${tour}/master/${tour}_rankings_current.csv`
  const rows = parseCSV(await fetchCSV(url))

  // Dernière date disponible
  const latestDate = rows.reduce((max, r) => r['ranking_date'] > max ? r['ranking_date'] : max, '')
  const latest     = rows.filter(r => r['ranking_date'] === latestDate)

  const map = new Map<string, number>()
  for (const r of latest) {
    const name = nameMap.get(r['player']) ?? ''
    const rank = parseInt(r['rank'])
    if (name && !isNaN(rank)) map.set(name, rank)
  }
  return map
}

// ── Lookup normalisation ────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

// Cherche le classement pour un nom ESPN (ordre prénom/nom différent parfois)
// Cas particulier : joueurs chinois — ESPN met le nom de famille en premier
// ex: "Zheng Qinwen" chez ESPN → "Qinwen Zheng" dans JSS
function lookupRank(espnName: string, rankMap: Map<string, number>): number | null {
  // Correspondance exacte
  const exact = rankMap.get(espnName)
  if (exact) return exact

  const normTarget = norm(espnName)
  const lastTarget = espnName.split(' ').pop()?.toLowerCase() ?? ''

  // Correspondance par nom normalisé complet
  for (const [name, rank] of rankMap) {
    if (norm(name) === normTarget) return rank
  }

  // Nom inversé (joueurs dont ESPN inverse prénom/nom — ex. joueurs chinois)
  const parts = espnName.trim().split(' ')
  if (parts.length >= 2) {
    const reversed = [...parts.slice(1), parts[0]].join(' ')
    const reversedExact = rankMap.get(reversed)
    if (reversedExact) return reversedExact
    const normReversed = norm(reversed)
    for (const [name, rank] of rankMap) {
      if (norm(name) === normReversed) return rank
    }
  }

  // Fallback : même nom de famille (> 3 chars)
  if (lastTarget.length > 3) {
    for (const [name, rank] of rankMap) {
      if (name.split(' ').pop()?.toLowerCase() === lastTarget) return rank
    }
  }

  return null
}

// ── Export public ─────────────────────────────────────────────────────────────

export type JSSRankings = {
  getAtpRank: (name: string) => number | null
  getWtaRank: (name: string) => number | null
}

let _cache: JSSRankings | null = null

export async function getJSSRankings(): Promise<JSSRankings> {
  if (_cache) return _cache

  const [atpNames, wtaNames] = await Promise.all([
    loadPlayerNames('atp'),
    loadPlayerNames('wta'),
  ])
  const [atpRanks, wtaRanks] = await Promise.all([
    loadCurrentRankings('atp', atpNames),
    loadCurrentRankings('wta', wtaNames),
  ])

  _cache = {
    getAtpRank: (name) => lookupRank(name, atpRanks),
    getWtaRank: (name) => lookupRank(name, wtaRanks),
  }
  return _cache
}
