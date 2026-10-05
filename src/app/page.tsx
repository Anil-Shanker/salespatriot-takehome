import React from 'react'
import { cookies } from 'next/headers'
import { getDb, querySolicitations, getDistinctFscs } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/auth'
import { SolicitationFilters } from '@/lib/types'
import { SolicitationBrowser } from '@/components/SolicitationBrowser'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}): Promise<React.JSX.Element> {
  const cookieStore = await cookies()
  const role = cookieStore.get(SESSION_COOKIE)?.value ?? null
  const isAdmin = role === 'admin'

  const params = await searchParams
  const filters: SolicitationFilters = {
    q: params.q,
    fsc: params.fsc,
    set_aside: params.set_aside,
    closing_within: params.closing_within as SolicitationFilters['closing_within'],
  }

  const db = getDb()
  const solicitations = querySolicitations(db, filters)
  const fscs = getDistinctFscs(db)

  return <SolicitationBrowser solicitations={solicitations} isAdmin={isAdmin} filters={filters} fscs={fscs} />
}
