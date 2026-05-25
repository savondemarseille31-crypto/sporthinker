// Exploration de The Odds API
// Usage : ODDS_API_KEY=ta_clé npx tsx scripts/debug-odds-api.ts

const API_KEY = process.env.ODDS_API_KEY
const BASE    = 'https://api.the-odds-api.com/v4'

if (!API_KEY) {
  console.error('❌  ODDS_API_KEY manquant.')
  process.exit(1)
}

async function get(path: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}apiKey=${API_KEY}`)
  const remaining = res.headers.get('x-requests-remaining')
  const used      = res.headers.get('x-requests-used')
  if (remaining) console.log(`   [quota] utilisées: ${used} | restantes: ${remaining}`)
  if (!res.ok) { console.log('   ❌ HTTP', res.status); return null }
  return res.json()
}

async function main() {
  console.log('\n=== Exploration The Odds API ===\n')

  // ── 1. Sports disponibles
  console.log('── 1. Sports disponibles ──')
  const sports = await get('/sports?all=true') as { key: string; title: string; active: boolean }[]
  if (sports) {
    const relevant = sports.filter(s =>
      ['baseball_mlb','basketball_nba','soccer_fifa','tennis'].some(k => s.key.includes(k.replace('soccer_fifa','soccer')))
    )
    console.log('Sports pertinents :')
    for (const s of relevant) {
      console.log(`  ${s.active ? '✅' : '⏸ '} ${s.key.padEnd(45)} ${s.title}`)
    }
    console.log(`\n  Total sports disponibles : ${sports.length}`)
    const soccerWC = sports.filter(s => s.key.includes('soccer') && (s.key.includes('world') || s.key.includes('fifa')))
    if (soccerWC.length) {
      console.log('\n  ⚽ Compétitions soccer WC/FIFA :')
      soccerWC.forEach(s => console.log(`    ${s.key} — ${s.title}`))
    }
  }

  // ── 2. Cotes MLB aujourd'hui
  console.log('\n── 2. Cotes MLB (h2h + totals) ──')
  const mlb = await get('/sports/baseball_mlb/odds?regions=us,eu&markets=h2h,totals&oddsFormat=decimal') as {
    id: string; home_team: string; away_team: string; commence_time: string;
    bookmakers: { key: string; markets: { key: string; outcomes: { name: string; price: number }[] }[] }[]
  }[]
  if (mlb?.length) {
    console.log(`  ${mlb.length} matchs trouvés`)
    for (const game of mlb.slice(0, 3)) {
      const dt = new Date(game.commence_time).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
      console.log(`\n  📋 ${game.away_team} @ ${game.home_team} — ${dt}`)
      const bk = game.bookmakers[0]
      if (bk) {
        console.log(`     Bookmaker: ${bk.key}`)
        for (const mkt of bk.markets) {
          console.log(`     Marché ${mkt.key}:`, mkt.outcomes.map(o => `${o.name} @${o.price}`).join(' | '))
        }
      }
    }
  } else {
    console.log('  Aucun match MLB ou clé invalide')
  }

  // ── 3. Cotes NBA
  console.log('\n── 3. Cotes NBA (h2h) ──')
  const nba = await get('/sports/basketball_nba/odds?regions=us,eu&markets=h2h&oddsFormat=decimal') as { id: string; home_team: string; away_team: string }[]
  if (nba?.length) {
    console.log(`  ${nba.length} matchs NBA`)
    nba.slice(0, 3).forEach(g => console.log(`  - ${g.away_team} @ ${g.home_team}`))
  } else {
    console.log('  Aucun match NBA')
  }

  // ── 4. Tennis
  console.log('\n── 4. Tennis (sports dispo) ──')
  const allSports = await get('/sports?all=false') as { key: string; title: string }[]
  if (allSports) {
    const tennis = allSports.filter(s => s.key.includes('tennis'))
    if (tennis.length) {
      tennis.forEach(s => console.log(`  ✅ ${s.key} — ${s.title}`))
      // Cotes sur le premier tournoi tennis actif
      const firstTennis = tennis[0]
      const tOdds = await get(`/sports/${firstTennis.key}/odds?regions=eu&markets=h2h&oddsFormat=decimal`) as { id: string; home_team: string; away_team: string }[]
      if (tOdds?.length) {
        console.log(`\n  Exemple cotes ${firstTennis.title} (${tOdds.length} matchs) :`)
        tOdds.slice(0, 3).forEach(g => console.log(`    - ${g.away_team} vs ${g.home_team}`))
      }
    } else {
      console.log('  Aucun tournoi tennis actif')
    }
  }

  // ── 5. CdM 2026 / Soccer
  console.log('\n── 5. Soccer / CdM 2026 ──')
  const soccer = allSports?.filter(s => s.key.startsWith('soccer')) ?? []
  console.log(`  ${soccer.length} compétitions soccer actives :`)
  soccer.slice(0, 10).forEach(s => console.log(`    ${s.key} — ${s.title}`))

  console.log('\n=== Fin ===\n')
}

main().catch(console.error)
