'use client'

import React from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/catalyst/badge'
import { Button } from '@/catalyst/button'
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

function closingDateClass(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'today':
      return 'text-red-600 font-medium'
    case 'soon':
      return 'text-amber-600 font-medium'
    case 'none':
      return 'text-zinc-500'
  }
}

type SolicitationModalProps = {
  solicitation: Solicitation | null
  onClose: () => void
}

export function SolicitationModal({
  solicitation,
  onClose,
}: SolicitationModalProps): React.JSX.Element {
  const urgency = solicitation !== null ? getUrgency(solicitation.response_date) : 'none'

  return (
    <Dialog open={solicitation !== null} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
        <DialogPanel className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 bg-white shadow-xl">
          {solicitation !== null && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-900">
                    {solicitation.sol_number}
                  </span>
                  <a
                    href={solicitation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-600"
                    aria-label="Open on DIBBS"
                    title="Opens on DIBBS — accept the DoD banner if prompted"
                  >
                    <ArrowTopRightOnSquareIcon className="size-4" />
                  </a>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded"
                  aria-label="Close"
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <p className="text-lg font-semibold text-zinc-900 mb-4">
                {solicitation.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">NSN</p>
                  <p className="font-mono text-sm text-zinc-900">{solicitation.nsn}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">FSC</p>
                  <p className="text-sm text-zinc-900">{solicitation.fsc}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">
                    Quantity
                  </p>
                  <p className="text-sm text-zinc-900">
                    {solicitation.quantity} {solicitation.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">
                    Set-aside
                  </p>
                  <Badge color={setAsideBadgeColor(solicitation.set_aside)}>
                    {solicitation.set_aside}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm mb-6">
                <span className="text-zinc-500">
                  Posted {formatDate(solicitation.posted_date)}
                </span>
                <span className="text-zinc-300">·</span>
                <span className={closingDateClass(urgency)}>
                  Closes {formatDate(solicitation.response_date)}
                </span>
              </div>

              <div>
                <Button
                  color="blue"
                  href={solicitation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Opens on DIBBS — accept the DoD banner if prompted"
                >
                  View on DIBBS →
                </Button>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
