import { NextRequest, NextResponse } from 'next/server'
import { USERS, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const user = USERS[username]
  if (user === undefined || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const response = NextResponse.json({ role: user.role })
  response.cookies.set(SESSION_COOKIE, user.role, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  })
  return response
}
