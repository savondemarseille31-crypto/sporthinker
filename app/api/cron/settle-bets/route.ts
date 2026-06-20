import { NextRequest, NextResponse } from 'next/server'
import { settleUserBets, settleSignalHistory } from '@/lib/settlement'
import { captureTodaySignals } from '@/lib/signals/capture'

// Cron Vercel quotidien :
//  1. capture les signaux du jour dans le track record (signal_history)
//  2. solde les paris perso terminés (user_bets)
//  3. solde le track record des signaux (signal_history)
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const captured = await captureTodaySignals()
  const userBets = await settleUserBets()
  const signals  = await settleSignalHistory()
  return NextResponse.json({
    ok: true,
    captured: captured.captured,
    settledUserBets: userBets.settled,
    settledSignals: signals.settled,
  })
}
