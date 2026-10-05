import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)?.value ?? null

  if (session !== null) {
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)'],
}
