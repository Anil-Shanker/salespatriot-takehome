'use client'

import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Input } from '@/catalyst/input'
import { SolicitationFilters } from '@/lib/types'

const selectClassName =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

type FilterPanelProps = {
  filters: SolicitationFilters
  onChange: (next: SolicitationFilters) => void
  fscs: string[]
  onClose?: () => void
}

export function FilterPanel({ filters, onChange, fscs, onClose }: FilterPanelProps): React.JSX.Element {
  const [localQ, setLocalQ] = useState(filters.q ?? '')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  // Sync search input when filters.q is reset externally (e.g. clearing all filters)
  useEffect(() => {
    setLocalQ(filters.q ?? '')
  }, [filters.q])

  // Debounce: only push q to URL after 350ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const f = filtersRef.current
      const qVal = localQ === '' ? undefined : localQ
      if (qVal !== f.q) {
        onChangeRef.current({ ...f, q: qVal })
      }
    }, 350)
    return (): void => clearTimeout(timer)
  }, [localQ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Filters</h2>
        {onClose !== undefined && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded"
            aria-label="Close filters"
          >
            <XMarkIcon className="size-5" />
          </button>
        )}
      </div>

      <Input
        type="text"
        placeholder="Search sol #, NSN, description…"
        value={localQ}
        onChange={(e) => setLocalQ(e.target.value)}
      />

      <select
        className={selectClassName}
        value={filters.fsc ?? ''}
        onChange={(e) => onChange({ ...filters, fsc: e.target.value })}
      >
        <option value="">All FSCs</option>
        {fscs.map((fsc) => (
          <option key={fsc} value={fsc}>{fsc}</option>
        ))}
      </select>

      <select
        className={selectClassName}
        value={filters.set_aside ?? ''}
        onChange={(e) => onChange({ ...filters, set_aside: e.target.value })}
      >
        <option value="">All Set-asides</option>
        <option value="SB">SB</option>
        <option value="WOSB">WOSB</option>
        <option value="8A">8(a)</option>
        <option value="HUBZONE">HUBZone</option>
        <option value="UNRESTRICTED">Unrestricted</option>
      </select>

      <select
        className={selectClassName}
        value={filters.closing_within ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange({
            ...filters,
            closing_within: v === '' ? undefined : (v as SolicitationFilters['closing_within']),
          })
        }}
      >
        <option value="">Any closing date</option>
        <option value="1">Today</option>
        <option value="3">3 days</option>
        <option value="7">7 days</option>
        <option value="14">14 days</option>
      </select>

      <select
        className={selectClassName}
        value={filters.sort ?? 'closing'}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value as SolicitationFilters['sort'] })
        }
      >
        <option value="closing">Closing Date</option>
        <option value="posted">Posted Date</option>
        <option value="sol">Sol #</option>
      </select>

      <button
        className="border rounded px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition self-start"
        onClick={() => onChange({ ...filters, order: filters.order === 'desc' ? 'asc' : 'desc' })}
      >
        {filters.order === 'desc' ? '↓ Desc' : '↑ Asc'}
      </button>
    </div>
  )
}
