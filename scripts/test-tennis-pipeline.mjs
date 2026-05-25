// Test pipeline tennis : ESPN fetch + JSS rankings + signal generation
// Usage : node scripts/test-tennis-pipeline.mjs [YYYY-MM-DD]
// Default : today

const date = process.argv[2] ?? new Date().toISOString().slice(0, 10)

console.log(`\n=== Test pipeline tennis — ${date} ===\n`)

// ── ESPN fetch (sans revalidate Next.js) ─────────────────────────────────────

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/tennis'

async function fetchTour(tour, date) {
  const dateKey = date.replace(/-/g, '')
  const slug    = tour === 'atp' ? 'mens-singles' : 'womens-singles'
  const res     = await fetch(`${ESPN}/${tour}/scoreboard?dates=${dateKey}`)
  if (!res.ok) { console.warn(`ESPN ${tour} → ${res.status}`); return [] }
  const data = await res.json()

  const out = []
  for (const event of data.events ?? []) {
    for (const grp of event.groupings ?? []) {
      if (grp.grouping.slug !== slug) continue
      for (const comp of grp.competitions ?? []) {
        const compDay = (comp.startDate ?? '').slice(0, 10)
        if (compDay !== date) continue
        const st = comp.status?.type?.name
        const status = st === 'STATUS_SCHEDULED' ? 'scheduled'
                     : st === 'STATUS_IN_PROGRESS' ? 'live'
                     : st === 'STATUS_FINAL' ? 'final' : null
        if (!status) continue
        const cs  = comp.competitors ?? []
        const p1c = cs.find(c => c.homeAway === 'home') ?? cs[0]
        const p2c = cs.find(c => c.homeAway === 'away') ?? cs[1]
        if (!p1c || !p2c) continue
        out.push({
          id: String(comp.id),
          status,
          isMajor: Boolean(event.major),
          tournament: event.name,
          p1: { name: p1c.athlete?.displayName ?? '?', rank: p1c.curatedRank?.current ?? null },
          p2: { name: p2c.athlete?.displayName ?? '?', rank: p2c.curatedRank?.current ?? null },
        })
      }
    }
  }
  return out
}

// ── JSS rankings ─────────────────────────────────────────────────────────────

const JSS_BASE = 'https://raw.githubusercontent.com/JeffSackmann'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]))
  })
}

async function loadJSSRankings(tour) {
  const [playersCSV, rankingsCSV] = await Promise.all([
    fetch(`${JSS_BASE}/tennis_${tour}/master/${tour}_players.csv`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text()),
    fetch(`${JSS_BASE}/tennis_${tour}/master/${tour}_rankings_current.csv`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text()),
  ])
  const nameMap = new Map()
  for (const r of parseCSV(playersCSV)) {
    if (r.player_id && r.name_first) nameMap.set(r.player_id, `${r.name_first} ${r.name_last}`.trim())
  }
  const rows = parseCSV(rankingsCSV)
  const latestDate = rows.reduce((mx, r) => r.ranking_date > mx ? r.ranking_date : mx, '')
  const rankMap = new Map()
  for (const r of rows.filter(r => r.ranking_date === latestDate)) {
    const name = nameMap.get(r.player) ?? ''
    const rank = parseInt(r.rank)
    if (name && !isNaN(rank)) rankMap.set(name, rank)
  }
  return rankMap
}

function norm(s) { return s.toLowerCase().replace(/[^a-z]/g, '') }

function lookupRank(espnName, rankMap) {
  if (rankMap.has(espnName)) return rankMap.get(espnName)
  const normTarget = norm(espnName)
  const lastTarget = espnName.split(' ').pop()?.toLowerCase() ?? ''
  for (const [name, rank] of rankMap) if (norm(name) === normTarget) return rank
  // Nom inversé (joueurs chinois : ESPN met le nom de famille en premier)
  const parts = espnName.trim().split(' ')
  if (parts.length >= 2) {
    const reversed = [...parts.slice(1), parts[0]].join(' ')
    if (rankMap.has(reversed)) return rankMap.get(reversed)
    const normRev = norm(reversed)
    for (const [name, rank] of rankMap) if (norm(name) === normRev) return rank
  }
  if (lastTarget.length > 3) for (const [name, rank] of rankMap) if (name.split(' ').pop()?.toLowerCase() === lastTarget) return rank
  return null
}

// ── Signal simulation ─────────────────────────────────────────────────────────

const PROB_MIN  = 0.55
const PROB_MOD  = 0.62
const PROB_FORT = 0.72

function rankToElo(r) { return Math.max(1600, 2400 - Math.log(r) * 120) }
function eloProb(eA, eB) { return 1 / (1 + Math.pow(10, (eB - eA) / 400)) }

function countSignals(match, jssAtp, jssWta) {
  const isAtp  = match.isMajor  // rough proxy (ESPN marks major = true for Roland Garros)
  const jss    = isAtp ? jssAtp : jssWta
  const r1     = match.p1.rank ?? lookupRank(match.p1.name, jss) ?? null
  const r2     = match.p2.rank ?? lookupRank(match.p2.name, jss) ?? null
  if (!r1 || !r2) return { count: 0, reason: 'no rank' }

  const prob   = eloProb(rankToElo(r1), rankToElo(r2))
  const favP   = Math.max(prob, 1 - prob)
  if (favP < PROB_MIN) return { count: 0, reason: `favP=${favP.toFixed(2)} < ${PROB_MIN}` }

  const force  = favP >= PROB_FORT ? 'fort' : favP >= PROB_MOD ? 'modéré' : 'surveiller'
  let n = 1  // Vainqueur always

  if (favP >= 0.74 && Math.abs(r1 - r2) >= 20) n++  // Handicap

  return { count: n, force, r1, r2, favP: favP.toFixed(2) }
}

// ── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('Fetching ESPN + JSS…')
  const [atpMatches, wtaMatches, jssAtp, jssWta] = await Promise.all([
    fetchTour('atp', date),
    fetchTour('wta', date),
    loadJSSRankings('atp'),
    loadJSSRankings('wta'),
  ])

  console.log(`ESPN ATP: ${atpMatches.length} matches  |  WTA: ${wtaMatches.length} matches`)
  console.log(`JSS ATP: ${jssAtp.size} players  |  WTA: ${jssWta.size} players`)

  // Tag chaque match avec son tour pour utiliser le bon JSS
  const atpTagged = atpMatches.map(m => ({ ...m, tour: 'atp' }))
  const wtaTagged = wtaMatches.map(m => ({ ...m, tour: 'wta' }))
  const scheduled  = [...atpTagged, ...wtaTagged].filter(m => m.status === 'scheduled')
  console.log(`Scheduled: ${scheduled.length} (ATP: ${atpTagged.filter(m=>m.status==='scheduled').length}, WTA: ${wtaTagged.filter(m=>m.status==='scheduled').length})\n`)

  let totalSignals = 0
  let fort = 0, mod = 0, surv = 0, noRank = 0

  const noRankList = []
  const signalSamples = []

  for (const m of scheduled) {
    const jss   = m.tour === 'atp' ? jssAtp : jssWta
    const r1    = m.p1.rank ?? lookupRank(m.p1.name, jss) ?? null
    const r2    = m.p2.rank ?? lookupRank(m.p2.name, jss) ?? null
    const result = countSignals(m, jssAtp, jssWta)

    if (!r1 || !r2) {
      noRank++
      noRankList.push(`  ❌ [${m.tour.toUpperCase()}] ${m.p1.name} (r=${r1}) vs ${m.p2.name} (r=${r2})`)
    } else {
      totalSignals += result.count
      if (result.force === 'fort')       fort++
      else if (result.force === 'modéré') mod++
      else                                surv++

      if (result.force === 'fort' && signalSamples.length < 8) {
        signalSamples.push(`  ⚡ [${m.tour.toUpperCase()}] ${m.p1.name}(#${r1}) vs ${m.p2.name}(#${r2}) → fav ${result.favP}`)
      }
    }
  }

  console.log('── Résultats ─────────────────────────────────────────────')
  console.log(`Signaux générés : ${totalSignals}`)
  console.log(`  ⚡ Fort       : ${fort}`)
  console.log(`  🔶 Modéré     : ${mod}`)
  console.log(`  👁 À surveiller: ${surv}`)
  console.log(`  ❌ Sans rang   : ${noRank}`)

  if (signalSamples.length) {
    console.log('\n── Exemples signaux forts ────────────────────────────────')
    signalSamples.forEach(s => console.log(s))
  }

  if (noRankList.length) {
    console.log(`\n── Matchs sans rang (${noRankList.length}) ───────────────────────────────`)
    noRankList.slice(0, 10).forEach(s => console.log(s))
    if (noRankList.length > 10) console.log(`  … et ${noRankList.length - 10} autres`)
  }
})()
