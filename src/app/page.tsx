'use client'

import React, { useState } from 'react'
import { MOCK_SOLICITATIONS } from '@/lib/mock-data'
import { Solicitation } from '@/lib/types'
import { SolicitationCard } from '@/components/SolicitationCard'
import { SolicitationModal } from '@/components/SolicitationModal'
import { FilterPanel } from '@/components/FilterPanel'

export default function Home(): React.JSX.Element {
  const [selected, setSelected] = useState<Solicitation | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-zinc-900">DIBBS Solicitations</h1>
        <button
          className="md:hidden text-sm text-zinc-600 border border-zinc-300 rounded px-3 py-1.5 hover:bg-zinc-50 transition"
          onClick={() => setFiltersOpen(true)}
        >
          Filters
        </button>
      </header>

      <div className="flex">
        <aside className="hidden md:block w-72 shrink-0 border-r border-zinc-200 bg-white min-h-screen p-5">
          <FilterPanel />
        </aside>

        {filtersOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-white p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <FilterPanel />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          <p className="text-sm text-zinc-500 mb-4">{MOCK_SOLICITATIONS.length} solicitations</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_SOLICITATIONS.map((sol) => (
              <SolicitationCard key={sol.sol_number} solicitation={sol} onSelect={setSelected} />
            ))}
          </div>
        </main>
      </div>

      <SolicitationModal solicitation={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
