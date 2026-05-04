'use client'

import { useActionState, useState } from 'react'
import { CircleAlert, Plus } from 'lucide-react'
import {
  addCreditsAction,
  type CreditActionState,
} from '@/app/settings/credits/actions'
import {
  CREDIT_PACK_AMOUNTS,
  type CreditsOverview,
  formatCreditActivityKind,
  formatCredits,
  formatCreditTimestamp,
  MIN_CREDIT_TOP_UP,
  MAX_CUSTOM_CREDIT_AMOUNT,
} from '@/util/credits'

type CreditsDashboardProps = {
  overview: CreditsOverview
}

const initialCreditActionState: CreditActionState = {
  tone: null,
  message: '',
}

export function CreditsDashboard({ overview }: CreditsDashboardProps) {
  const [customAmount, setCustomAmount] = useState('')
  const [state, formAction, isPending] = useActionState(
    addCreditsAction,
    initialCreditActionState,
  )

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">Credits</h2>
        <p className="max-w-2xl text-sm text-base-content/60">
          Manage your credit balance and payment-ready top-up amounts.
        </p>
      </div>

      {state.tone ? (
        <div
          role="status"
          className={`px-4 py-3 text-sm ${
            state.tone === 'success'
              ? 'bg-primary/8 text-base-content'
              : 'bg-error/8 text-base-content'
          }`}
        >
          <div className="flex items-center gap-3">
            <CircleAlert
              className={state.tone === 'success' ? 'h-4 w-4 shrink-0 text-primary' : 'h-4 w-4 shrink-0 text-error'}
            />
            <span>{state.message}</span>
          </div>
        </div>
      ) : null}

      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 border-b border-base-300 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-base-content/45">
              Available balance
            </p>
            <div className="text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
              {formatCredits(overview.balance)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CREDIT_PACK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setCustomAmount(amount.toFixed(2))}
                className={`btn btn-sm min-w-20 font-medium ${
                  customAmount === amount.toFixed(2)
                    ? 'btn-primary'
                    : 'border-base-300 bg-base-100 text-base-content hover:border-primary/35 hover:bg-base-100'
                }`}
              >
                +{formatCredits(amount)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Add a custom amount</h2>
              <p className="text-sm text-base-content/60">
                Enter any amount from {formatCredits(MIN_CREDIT_TOP_UP)} to {formatCredits(MAX_CUSTOM_CREDIT_AMOUNT)}.
              </p>
            </div>

            <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="number"
                name="customAmount"
                min={MIN_CREDIT_TOP_UP}
                max={MAX_CUSTOM_CREDIT_AMOUNT}
                step="0.01"
                inputMode="decimal"
                placeholder="25.00"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                className="input input-bordered h-11 flex-1 bg-base-100"
              />
              <button type="submit" disabled={isPending} className="btn btn-primary h-11 gap-2 px-5">
                <Plus className="h-4 w-4" />
                {isPending ? 'Adding...' : 'Add credits'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Recent activity</h2>
                <p className="text-sm text-base-content/60">
                  {overview.activity.length
                    ? `Showing ${overview.activity.length} recent credit updates.`
                    : 'Your credit updates will appear here.'}
                </p>
              </div>
            </div>

            {overview.activity.length ? (
              <ul className="divide-y divide-base-300">
                {overview.activity.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{formatCreditActivityKind(item.kind)}</p>
                      <p className="text-xs text-base-content/55">{formatCreditTimestamp(item.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">+{formatCredits(item.amount)}</p>
                      <p className="text-xs text-base-content/55">
                        Balance {formatCredits(item.balanceAfter)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border-t border-dashed border-base-300 pt-4 text-sm text-base-content/55">
                No credit activity yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
