import React from 'react'
import { Badge } from '@/catalyst/badge'
import { Solicitation, SetAside } from '@/lib/types'

const TODAY = '2026-10-05'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

type UrgencyLevel = 'today' | 'soon' | 'none'

function getUrgency(responseDate: string): UrgencyLevel {
  const today = new Date(TODAY + 'T00:00:00')
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
      className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 hover:shadow-md hover:border-zinc-300 transition cursor-pointer w-full text-left"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-medium text-zinc-900 text-sm">
          {solicitation.sol_number}
        </span>
        {urgency === 'today' && (
          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-red-500/15 text-red-700">
            TODAY
          </span>
        )}
        {urgency === 'soon' && (
          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-amber-400/20 text-amber-700">
            SOON
          </span>
        )}
      </div>

      <div className="mb-2">
        <span className="font-mono text-sm text-zinc-500">{solicitation.nsn}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-700">
          {solicitation.quantity} {solicitation.unit}
        </span>
        <Badge color={setAsideBadgeColor(solicitation.set_aside)}>
          {solicitation.set_aside}
        </Badge>
      </div>

      <div>
        <span className="text-sm text-zinc-500">
          Closes {formatDate(solicitation.response_date)}
        </span>
      </div>
    </button>
  )
}
