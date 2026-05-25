// RAPIDAPI_TENNIS_KEY=xxx npx tsx scripts/debug-tennis-fixtures.ts
const BASE_URL = 'https://tennis-api-atp-wta-itf.p.rapidapi.com'
const API_KEY  = process.env.RAPIDAPI_TENNIS_KEY!

async function fetchRaw(tour: 'atp' | 'wta', date: string) {
  const res = await fetch(`${BASE_URL}/tennis/v2/${tour}/fixtures/${date}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': 'tennis-api-atp-wta-itf.p.rapidapi.com',
      'x-rapidapi-key': API_KEY,
    },
  })
  const json = await res.json()
  return json.data ?? json
}

async function main() {
  const today = new Date().toISOString().split('T')[0]
  console.log(`\n=== Tennis fixtures brutes — ${today} ===\n`)

  for (const tour of ['atp', 'wta'] as const) {
    const fixtures = await fetchRaw(tour, today)
    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      console.log(`[${tour.toUpperCase()}] Aucun match`)
      continue
    }
    console.log(`\n[${tour.toUpperCase()}] ${fixtures.length} matchs`)
    for (const f of fixtures.slice(0, 5)) {
      console.log({
        id:           f.id,
        date:         f.date,
        timeGame:     f.timeGame,
        tournamentId: f.tournamentId,
        player1:      f.player1?.name,
        player2:      f.player2?.name,
        live:         f.live,
      })
    }
    if (fixtures.length > 5) console.log(`  ... et ${fixtures.length - 5} autres`)
  }
}

main()
