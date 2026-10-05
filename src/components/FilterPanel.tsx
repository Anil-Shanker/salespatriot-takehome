import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Input } from '@/catalyst/input'

const selectClassName =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

type FilterPanelProps = {
  onClose?: () => void
}

export function FilterPanel({ onClose }: FilterPanelProps): React.JSX.Element {
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
      />

      <select className={selectClassName}>
        <option value="">All FSCs</option>
        <option value="5310">5310 — Nuts &amp; Bolts</option>
        <option value="2530">2530 — Vehicular Brake Components</option>
        <option value="6625">6625 — Electrical &amp; Electronic Measuring Instruments</option>
        <option value="4710">4710 — Pipe, Tube &amp; Fittings</option>
        <option value="1560">1560 — Airframe Structural Components</option>
      </select>

      <select className={selectClassName}>
        <option value="">All Set-asides</option>
        <option value="SB">SB</option>
        <option value="WOSB">WOSB</option>
        <option value="8A">8(a)</option>
        <option value="HUBZONE">HUBZone</option>
        <option value="UNRESTRICTED">Unrestricted</option>
      </select>

      <select className={selectClassName}>
        <option value="">Any</option>
        <option value="today">Today</option>
        <option value="3days">3 days</option>
        <option value="7days">7 days</option>
        <option value="14days">14 days</option>
      </select>

      <select className={selectClassName}>
        <option value="closing">Closing Date</option>
        <option value="posted">Posted Date</option>
        <option value="sol">Sol #</option>
      </select>

      <button className="border rounded px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition self-start">
        ↑ Asc
      </button>
    </div>
  )
}
