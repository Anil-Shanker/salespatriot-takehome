import React from 'react'
import { Badge } from '@/catalyst/badge'
import { Solicitation, SetAside } from '@/lib/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

type UrgencyLevel = 'today' | 'soon' | 'none'

function getUrgency(responseDate: string): UrgencyLevel {
  const today = new Date(new Date().toLocaleDateString('en-CA') + 'T00:00:00')
  const closing = new Date(responseDate + 'T00:00:00')
  const diffMs = closing.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'today'
  }
  if (diffDays <= 3) {
    return 'soon'
  }
  return 'none'
}

function setAsideBadgeColor(
  setAside: SetAside
): 'green' | 'purple' | 'blue' | 'amber' | 'zinc' {
  switch (setAside) {
    case 'SB':
      return 'green'
    case 'WOSB':
      return 'purple'
    case '8A':
      return 'blue'
    case 'HUBZONE':
      return 'amber'
    case 'UNRESTRICTED':
      return 'zinc'
  }
}

type SolicitationCardProps = {
  solicitation: Solicitation
  onSelect: (sol: Solicitation) => void
}

export function SolicitationCard({
  solicitation,
  onSelect,
}: SolicitationCardProps): React.JSX.Element {
  const urgency = getUrgency(solicitation.response_date)

  return (
    <button
      onClick={() => onSelect(solicitation)}
      className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 hover:shadow-md hover:border-zinc-300 transition cursor-pointer w-full text-left flex flex-col gap-3"
    >
      {/* Description — primary headline */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-900 leading-snug">
          {solicitation.description}
        </span>
        {urgency === 'today' && (
          <span className="shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-red-500/15 text-red-700">
            TODAY
          </span>
        )}
        {urgency === 'soon' && (
          <span className="shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-amber-400/20 text-amber-700">
            SOON
          </span>
        )}
      </div>

      {/* Identifiers */}
      <div className="flex gap-5">
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Sol #</p>
          <p className="font-mono text-xs text-zinc-700">{solicitation.sol_number}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">NSN</p>
          <p className="font-mono text-xs text-zinc-700">{solicitation.nsn}</p>
        </div>
      </div>

      {/* Footer — set-aside, qty, closing */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge color={setAsideBadgeColor(solicitation.set_aside)}>
            {solicitation.set_aside}
          </Badge>
          <span className="text-xs text-zinc-500">{solicitation.quantity} {solicitation.unit}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 mb-0.5">Closes</p>
          <p className={`text-xs font-medium ${urgency === 'today' ? 'text-red-600' : urgency === 'soon' ? 'text-amber-600' : 'text-zinc-600'}`}>
            {formatDate(solicitation.response_date)}
          </p>
        </div>
      </div>
    </button>
  )
}
