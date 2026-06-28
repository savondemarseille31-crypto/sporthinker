import { NextRequest, NextResponse } from 'next/server'
import { settleUserBets, settleSignalHistory, settleProps } from '@/lib/settlement'
import { captureTodaySignals } from '@/lib/signals/capture'
import { captureTodayProps } from '@/lib/signals/capture-props'
import { captureTodayMlbV2 } from '@/lib/signals/capture-mlb-v2'

// Cron Vercel quotidien :
//  1. capture signaux match + props joueurs (signal_history / prop_history)
//  2. solde les paris perso terminés (user_bets)
//  3. solde le track record (signaux match + props joueurs)
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const captured      = await captureTodaySignals()
  const capturedProps = await captureTodayProps()
  const capturedV2    = await captureTodayMlbV2()
  const userBets      = await settleUserBets()
  const signals       = await settleSignalHistory()
  const props         = await settleProps()
  return NextResponse.json({
    ok: true,
    captured: captured.captured,
    capturedProps: capturedProps.captured,
    capturedV2: capturedV2.captured,
    settledUserBets: userBets.settled,
    settledSignals: signals.settled,
    settledProps: props.settled,
  })
}
