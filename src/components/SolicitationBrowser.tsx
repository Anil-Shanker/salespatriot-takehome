'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Solicitation, SolicitationFilters } from '@/lib/types'
import { SolicitationCard } from '@/components/SolicitationCard'
import { SolicitationModal } from '@/components/SolicitationModal'
import { FilterPanel } from '@/components/FilterPanel'
import { Button } from '@/catalyst/button'

const PAGE_SIZE = 20

type SolicitationBrowserProps = {
  solicitations: Solicitation[]
  isAdmin: boolean
  filters: SolicitationFilters
  fscs: string[]
}

export function SolicitationBrowser({
  solicitations,
  isAdmin,
  filters,
  fscs,
}: SolicitationBrowserProps): React.JSX.Element {
  const router = useRouter()
  const [selected, setSelected] = useState<Solicitation | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ count: number } | null>(null)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [solicitations])

  const totalPages = Math.max(1, Math.ceil(solicitations.length / PAGE_SIZE))
  const paged = solicitations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleFilterChange(next: SolicitationFilters): void {
    const params = new URLSearchParams()
    if (next.q !== undefined && next.q !== '') params.set('q', next.q)
    if (next.fsc !== undefined && next.fsc !== '') params.set('fsc', next.fsc)
    if (next.set_aside !== undefined && next.set_aside !== '') params.set('set_aside', next.set_aside)
    if (next.closing_within !== undefined) params.set('closing_within', next.closing_within)
    const qs = params.toString()
    router.replace(qs === '' ? '/' : '/?' + qs)
  }

  async function handleScrape(): Promise<void> {
    setScraping(true)
    setScrapeResult(null)
    setScrapeError(null)
    const res = await fetch('/api/scrape', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setScrapeResult({ count: data.count })
      router.refresh()
    } else {
      setScrapeError(data.error ?? 'Scrape failed')
    }
    setScraping(false)
  }

  async function handleLogout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-zinc-900 shrink-0">DIBBS Solicitations</h1>

        <div className="flex items-center gap-2 ml-auto">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                outline
                onClick={handleScrape}
                disabled={scraping}
              >
                {scraping ? 'Scraping…' : 'Scrape DIBBS'}
              </Button>
              {scrapeResult !== null && (
                <span className="text-xs text-zinc-500">{scrapeResult.count} imported</span>
              )}
              {scrapeError !== null && (
                <span className="text-xs text-red-500" title={scrapeError}>Scrape failed</span>
              )}
            </div>
          )}

          <button
            className="md:hidden text-sm text-zinc-600 border border-zinc-300 rounded px-3 py-1.5 hover:bg-zinc-50 transition"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>

          <button
            onClick={handleLogout}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:block w-72 shrink-0 border-r border-zinc-200 bg-white min-h-screen p-5">
          <FilterPanel filters={filters} onChange={handleFilterChange} fscs={fscs} />
        </aside>

        {filtersOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onClose={() => setFiltersOpen(false)}
                fscs={fscs}
              />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          <p className="text-sm text-zinc-500 mb-4">
            {solicitations.length} solicitations
            {totalPages > 1 && (
              <span className="ml-1 text-zinc-400">
                — page {currentPage} of {totalPages}
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paged.map((sol) => (
              <SolicitationCard key={sol.sol_number} solicitation={sol} onSelect={setSelected} />
            ))}
          </div>
          {solicitations.length === 0 && (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-sm">No solicitations yet.</p>
              {isAdmin && (
                <p className="text-sm mt-1">Click "Scrape DIBBS" to load data.</p>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              <span className="text-sm text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>

      <SolicitationModal solicitation={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
