import { NextRequest, NextResponse } from 'next/server'
import { validateCompletedBets } from '@/lib/selections-db'

// Test direct ESPN tennis API for a given date
async function probeESPN(tour: 'atp' | 'wta', dateStr: string) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard?dates=${dateStr}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { url, status: res.status, events: null }
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (data.events ?? []) as any[]
    return {
      url,
      status: res.status,
      eventCount: events.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sample: events.slice(0, 2).map((ev: any) => ({
        id: ev.id,
        name: ev.name,
        completed: ev.competitions?.[0]?.status?.type?.completed,
        statusName: ev.competitions?.[0]?.status?.type?.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        competitors: (ev.competitions?.[0]?.competitors ?? []).map((c: any) => ({
          name: c.athlete?.displayName ?? c.team?.displayName,
          winner: c.winner,
          score: c.score,
        })),
      })),
    }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('x-debug-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const probe = request.nextUrl.searchParams.get('probe')
  if (probe) {
    // Probe mode: test ESPN API directly
    const today = new Date()
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const [atpToday, wtaToday, atpYest, wtaYest] = await Promise.all([
      probeESPN('atp', fmt(today)),
      probeESPN('wta', fmt(today)),
      probeESPN('atp', fmt(yesterday)),
      probeESPN('wta', fmt(yesterday)),
    ])
    return NextResponse.json({ atpToday, wtaToday, atpYest, wtaYest })
  }

  const validated = await validateCompletedBets()
  return NextResponse.json({ ok: true, validated })
}
