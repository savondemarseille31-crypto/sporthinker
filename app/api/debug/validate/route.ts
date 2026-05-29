import { NextRequest, NextResponse } from 'next/server'
import { validateCompletedBets } from '@/lib/selections-db'
import { getESPNTennisResults } from '@/lib/espn-api'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('x-debug-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const probe = request.nextUrl.searchParams.get('probe')
  if (probe) {
    const results = await getESPNTennisResults()
    return NextResponse.json({
      total: results.length,
      sample: results.slice(0, 5),
    })
  }

  const validated = await validateCompletedBets()
  return NextResponse.json({ ok: true, validated })
}
