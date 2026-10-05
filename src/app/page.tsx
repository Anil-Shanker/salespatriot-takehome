import React from 'react'
import { cookies } from 'next/headers'
import { getDb, querySolicitations } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/auth'
import { SolicitationBrowser } from '@/components/SolicitationBrowser'

export default async function Home(): Promise<React.JSX.Element> {
  const cookieStore = await cookies()
  const role = cookieStore.get(SESSION_COOKIE)?.value ?? null
  const isAdmin = role === 'admin'

  const solicitations = querySolicitations(getDb(), {})

  return <SolicitationBrowser solicitations={solicitations} isAdmin={isAdmin} />
}
