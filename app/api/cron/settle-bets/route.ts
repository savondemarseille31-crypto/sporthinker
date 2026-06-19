import { NextRequest, NextResponse } from 'next/server'
import { settleUserBets } from '@/lib/settlement'

// Cron Vercel : solde automatiquement les paris perso terminés (MLB + Tennis).
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { settled } = await settleUserBets()
  return NextResponse.json({ ok: true, settled })
}
