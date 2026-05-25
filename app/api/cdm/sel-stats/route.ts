import { NextRequest, NextResponse } from 'next/server'
import { type AFRawPlayerStats } from '@/lib/cdm-player-signals'

// GET /api/cdm/sel-stats?teamId=2&season=2024
// Retourne les stats de sélection nationale (qualifs + amicaux) depuis API-Football.
// Cachées 24h — les qualifs ne changent pas après la fin de la campagne.

export const revalidate = 86400 // 24h — stats qualifs, ne changent pas

const API_KEY  = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamIdStr = searchParams.get('teamId')
  const season    = searchParams.get('season') ?? '2024'

  if (!teamIdStr) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 })
  }

  const teamId = parseInt(teamIdStr)
  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'teamId must be a number' }, { status: 400 })
  }

  try {
    // On fetch toutes les compétitions de la saison pour cette sélection
    // (qualifs WC, Nations League, amicaux — tout confondu)
    const res = await fetch(
      `${BASE_URL}/players?team=${teamId}&season=${season}&page=1`,
      {
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 86400 }, // 24h
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `API-Football error: ${res.status}` },
        { status: 502 }
      )
    }

    const json = await res.json()
    const players: AFRawPlayerStats[] = json.response ?? []
    const paging = json.paging ?? { current: 1, total: 1 }

    // Si plusieurs pages, fetch le reste
    const allPlayers = [...players]
    if (paging.total > 1) {
      const pages = Array.from({ length: paging.total - 1 }, (_, i) => i + 2)
      await Promise.all(
        pages.map(async (page) => {
          const r = await fetch(
            `${BASE_URL}/players?team=${teamId}&season=${season}&page=${page}`,
            { headers: { 'x-apisports-key': API_KEY }, next: { revalidate: 86400 } }
          )
          const j = await r.json()
          allPlayers.push(...(j.response ?? []))
        })
      )
    }

    return NextResponse.json(
      { teamId, season, players: allPlayers },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
