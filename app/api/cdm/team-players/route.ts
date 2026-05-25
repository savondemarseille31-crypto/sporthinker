import { NextRequest, NextResponse } from 'next/server'
import { getTeamSeasonPlayerStats } from '@/lib/api-football'

export const revalidate = 300 // 5 min — stats joueurs par équipe

// GET /api/cdm/team-players?teamId=2&season=2026
// Retourne les stats des joueurs d'une équipe nationale depuis API-Football
// Disponible uniquement une fois la compétition commencée (matchs joués en league=1)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamIdStr = searchParams.get('teamId')
  const season = parseInt(searchParams.get('season') ?? '2026')

  if (!teamIdStr) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 })
  }

  const teamId = parseInt(teamIdStr)
  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'teamId must be a number' }, { status: 400 })
  }

  // league=1 = FIFA World Cup dans API-Football
  const data = await getTeamSeasonPlayerStats(teamId, 1, season)

  return NextResponse.json({ teamId, season, players: data }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
