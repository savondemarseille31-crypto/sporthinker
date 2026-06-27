import { createClient } from '@supabase/supabase-js'
import { getTopByMarketWithBlend } from '@/lib/cdm-signals-blend'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import type { PlayerMarket } from '@/lib/cdm-player-signals'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Marchés props soldables via les stats joueurs API-Football.
const MARKETS: PlayerMarket[] = ['buteur', 'tirs-cadrés', 'carton-jaune', 'passeur']

function normTeam(s: string) { return (s ?? '').toLowerCase().replace(/[^a-z]/g, '') }
function teamMatch(a: string, b: string) {
  const na = normTeam(a), nb = normTeam(b)
  return !!na && !!nb && (na === nb || na.includes(nb) || nb.includes(na))
}

// Prochain match à venir (coup d'envoi futur) de l'équipe du joueur.
function nextFixtureFor(pays: string, now: Date) {
  return CDM_FIXTURES
    .filter(f => teamMatch(f.domicile, pays) || teamMatch(f.exterieur, pays))
    .map(f => ({ f, kickoff: new Date(`${f.date}T${f.heure}:00+02:00`) }))
    .filter(x => x.kickoff >= now)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())[0]?.f
}

// Snapshot ex-ante des props joueurs forts/modérés du jour → prop_history.
// Dédup par id (1re capture fait foi). Couvre 4 marchés × top joueurs.
export async function captureTodayProps(): Promise<{ captured: number }> {
  const now = new Date()
  const rowsById = new Map<string, Record<string, unknown>>()

  for (const market of MARKETS) {
    const signals = await getTopByMarketWithBlend(market, 12).catch(() => [])
    for (const s of signals) {
      if (s.force === 'faible') continue
      const fx = nextFixtureFor(s.pays, now)
      if (!fx) continue
      const id = `prop-${s.playerId}-${market}-${fx.id}`
      if (rowsById.has(id)) continue
      rowsById.set(id, {
        id,
        fixture_date: fx.date,
        pays:         s.pays,
        player_name:  s.playerName,
        market,
        force:        s.force,
        cote:         s.cote ?? null,
        statut:       'en_cours',
      })
    }
  }

  const rows = [...rowsById.values()]
  if (!rows.length) return { captured: 0 }
  const { error } = await db().from('prop_history').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) {
    console.error('[capture-props] prop_history upsert error:', error.message)
    return { captured: 0 }
  }
  return { captured: rows.length }
}
