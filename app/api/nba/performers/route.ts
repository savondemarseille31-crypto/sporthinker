import { NextRequest, NextResponse } from 'next/server'
import { getTopPlayoffPerformers } from '@/lib/nba-api'

export const revalidate = 1800 // 30 min — top performers playoffs

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stat = searchParams.get('stat') as 'pts' | 'reb' | 'ast' | 'blk' | 'stl' | null
  const validStats = ['pts', 'reb', 'ast', 'blk', 'stl']
  if (!stat || !validStats.includes(stat)) {
    return NextResponse.json({ error: 'Invalid stat' }, { status: 400 })
  }
  const players = await getTopPlayoffPerformers(stat, 15)
  return NextResponse.json(players)
}
