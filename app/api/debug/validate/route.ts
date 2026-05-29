import { NextRequest, NextResponse } from 'next/server'
import { validateCompletedBets } from '@/lib/selections-db'

async function probeESPNRaw(tour: 'atp' | 'wta', dateStr: string) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard?dates=${dateStr}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { url, status: res.status }
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (data.events ?? []) as any[]
    const ev = events[0]
    if (!ev) return { url, eventCount: 0 }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitions: any[] = ev.competitions ?? []
    return {
      url,
      eventCount: events.length,
      eventId: ev.id,
      eventName: ev.name,
      competitionsCount: competitions.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sample: competitions.slice(0, 3).map((comp: any) => ({
        id: comp.id,
        completed: comp.status?.type?.completed,
        statusName: comp.status?.type?.name,
        date: comp.date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        competitors: (comp.competitors ?? []).map((c: any) => ({
          displayName: c.athlete?.displayName ?? c.team?.displayName,
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
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const [atp, wta] = await Promise.all([
      probeESPNRaw('atp', fmt(yesterday)),
      probeESPNRaw('wta', fmt(yesterday)),
    ])
    return NextResponse.json({ atp, wta })
  }

  const validated = await validateCompletedBets()
  return NextResponse.json({ ok: true, validated })
}
