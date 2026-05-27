import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth'

const PICKS_COOKIE = 'st_picks'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const secret = process.env.SESSION_SECRET

  // ── Admin (/admin, /api/stake) ────────────────────────────────────────────
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/stake')
  if (isAdmin) {
    if (pathname === '/admin/login') return NextResponse.next()
    if (!secret) return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token || !(await verifySessionToken(token, secret))) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Sélections (/selections) ──────────────────────────────────────────────
  if (pathname.startsWith('/selections')) {
    if (pathname === '/selections/login') return NextResponse.next()
    if (!secret) return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
    const token = request.cookies.get(PICKS_COOKIE)?.value
    if (!token || !(await verifySessionToken(token, secret))) {
      const url = new URL('/selections/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/stake/:path*', '/selections/:path*'],
}
