/**
 * Lance avec : npx tsx scripts/fetch-wc-team-ids.ts
 *
 * Récupère les 48 équipes qualifiées pour le WC 2026 depuis API-Football
 * et affiche le mapping nom → apiFootballTeamId prêt à coller dans cdm-teams.ts.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Lire .env.local manuellement sans dotenv
function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* .env.local absent — on continue avec les variables d'env existantes */ }
}

loadEnvLocal()

const API_KEY = process.env.API_FOOTBALL_KEY
if (!API_KEY) {
  console.error('❌  API_FOOTBALL_KEY manquant dans .env.local')
  process.exit(1)
}

type AFTeam = {
  team: { id: number; name: string; code: string | null }
  venue: { country: string }
}

async function main() {
  const res = await fetch('https://v3.football.api-sports.io/teams?league=1&season=2026', {
    headers: { 'x-apisports-key': API_KEY! },
  })

  if (!res.ok) {
    console.error(`❌  API error: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const json = await res.json()
  const teams: AFTeam[] = json.response ?? []

  if (!teams.length) {
    console.error('❌  Aucune équipe retournée — vérifier que league=1 & season=2026 existe dans l\'API.')
    process.exit(1)
  }

  console.log(`\n✅  ${teams.length} équipes trouvées pour WC 2026 (league=1)\n`)
  console.log('── Mapping à intégrer dans cdm-teams.ts ──────────────────\n')

  // Trier par nom pour faciliter la lecture
  teams.sort((a, b) => a.team.name.localeCompare(b.team.name))

  for (const t of teams) {
    const id = t.team.id
    const name = t.team.name
    console.log(`  // ${name}`)
    console.log(`  apiFootballTeamId: ${id},`)
    console.log()
  }

  console.log('── Objet JSON complet ────────────────────────────────────\n')
  const mapping: Record<string, number> = {}
  for (const t of teams) mapping[t.team.name] = t.team.id
  console.log(JSON.stringify(mapping, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
