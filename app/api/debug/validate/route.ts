import { NextRequest, NextResponse } from 'next/server'
import { validateCompletedBets } from '@/lib/selections-db'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('x-debug-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const validated = await validateCompletedBets()
  return NextResponse.json({ ok: true, validated })
}
