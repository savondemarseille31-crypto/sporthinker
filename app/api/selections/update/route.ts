import { NextRequest, NextResponse } from 'next/server'
import { updateStatut, type TrackedStatut } from '@/lib/selections-db'

export async function POST(request: NextRequest) {
  const { id, statut } = await request.json()
  if (!id || !statut) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  await updateStatut(id, statut as TrackedStatut)
  return NextResponse.json({ ok: true })
}
