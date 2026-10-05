'use client'

import React, { useState, useEffect, useRef } from 'react'
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Input } from '@/catalyst/input'
import { SolicitationFilters } from '@/lib/types'
import { fscLabel } from '@/lib/fscGroups'

const selectClassName =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

type TooltipProps = {
  children: React.ReactNode
}

function Tooltip({ children }: TooltipProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent): void {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleOutside)
    return (): void => document.removeEventListener('click', handleOutside)
  }, [open])

  return (
    <span ref={ref} className="relative group/tip inline-flex items-center">
      <InformationCircleIcon
        className="size-3.5 text-zinc-400"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      />
      <span className={`absolute left-4 top-0 z-20 w-60 rounded-lg bg-zinc-900 text-white text-xs leading-relaxed p-2.5 shadow-lg ${open ? 'block' : 'hidden group-hover/tip:block'}`}>
        {children}
      </span>
    </span>
  )
}

function FieldLabel({ label, tooltip }: { label: string; tooltip?: React.ReactNode }): React.JSX.Element {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
      {label}
      {tooltip !== undefined && <Tooltip>{tooltip}</Tooltip>}
    </span>
  )
}

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

  useEffect(() => {
    setLocalQ(filters.q ?? '')
  }, [filters.q])

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

      <label className="flex flex-col gap-1">
        <FieldLabel label="Search" />
        <Input
          type="text"
          placeholder="Sol #, NSN, description…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <FieldLabel
          label="FSC"
          tooltip="Federal Supply Class — the first 4 digits of the NSN. Groups parts by category (e.g. 6515 = Medical Instruments)."
        />
        <select
          className={selectClassName}
          value={filters.fsc ?? ''}
          onChange={(e) => onChange({ ...filters, fsc: e.target.value })}
        >
          <option value="">All</option>
          {fscs.map((fsc) => (
            <option key={fsc} value={fsc}>{fscLabel(fsc)}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <FieldLabel
          label="Set-aside"
          tooltip={
            <span className="flex flex-col gap-1">
              <span>Restricts bidding to a specific business type:</span>
              <span><strong className="text-zinc-300">SB</strong> — Small Business</span>
              <span><strong className="text-zinc-300">WOSB</strong> — Women-Owned Small Business</span>
              <span><strong className="text-zinc-300">8(a)</strong> — SBA 8(a) Development Program</span>
              <span><strong className="text-zinc-300">HUBZone</strong> — Historically Underutilized Business Zone</span>
              <span><strong className="text-zinc-300">Unrestricted</strong> — Open to all vendors</span>
            </span>
          }
        />
        <select
          className={selectClassName}
          value={filters.set_aside ?? ''}
          onChange={(e) => onChange({ ...filters, set_aside: e.target.value })}
        >
          <option value="">All</option>
          <option value="SB">SB</option>
          <option value="WOSB">WOSB</option>
          <option value="8A">8(a)</option>
          <option value="HUBZONE">HUBZone</option>
          <option value="UNRESTRICTED">Unrestricted</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <FieldLabel
          label="Closing within"
          tooltip="Filters by bid response deadline. '7 days' shows only solicitations closing between today and 7 days from now."
        />
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
          <option value="">Any date</option>
          <option value="1">Today</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
        </select>
      </label>

    </div>
  )
}
