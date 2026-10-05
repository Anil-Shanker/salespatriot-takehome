import { NextRequest, NextResponse } from 'next/server'
import { getDb, querySolicitations } from '@/lib/db'
import { SolicitationFilters } from '@/lib/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl

  const filters: SolicitationFilters = {
    fsc: searchParams.get('fsc') ?? undefined,
    set_aside: searchParams.get('set_aside') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    closing_within: (searchParams.get('closing_within') as SolicitationFilters['closing_within']) ?? undefined,
  }

  const db = getDb()
  const solicitations = querySolicitations(db, filters)
  return NextResponse.json(solicitations)
}
