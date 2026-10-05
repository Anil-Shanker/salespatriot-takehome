import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/auth'
import { getDb, upsertSolicitations } from '@/lib/db'
import { scrapeDibbsRfqs } from '@/lib/scraper'

export async function POST(_request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const role = cookieStore.get(SESSION_COOKIE)?.value ?? null

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let solicitations
  try {
    solicitations = await scrapeDibbsRfqs()
  } catch (err) {
    console.error('[scrape] scraper threw:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }

  const db = getDb()
  upsertSolicitations(db, solicitations)

  return NextResponse.json({
    count: solicitations.length,
    scraped_at: new Date().toISOString(),
  })
}
