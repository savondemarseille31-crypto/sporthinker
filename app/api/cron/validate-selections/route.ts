import { NextRequest, NextResponse } from 'next/server'
import { validateCompletedBets } from '@/lib/selections-db'

export async function GET(request: NextRequest) {
  // Vercel injecte CRON_SECRET automatiquement dans l'en-tête Authorization
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const validated = await validateCompletedBets()
  return NextResponse.json({ ok: true, validated })
}
