import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    // Délai intentionnel pour ralentir les tentatives brute-force
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const secret = process.env.SESSION_SECRET!
  const token = await createSessionToken(secret)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
    path: '/',
  })

  return response
}
