'use client'

import { useEffect, useState } from 'react'

type SupabaseStatusResponse = {
  connected: boolean
  environment: 'local' | 'remote' | 'unknown'
  url: string
  projectRef?: string
  region?: string
  error?: string
}

type StatusState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; data: SupabaseStatusResponse }

export function SupabaseStatus() {
  const [state, setState] = useState<StatusState>({ phase: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch('/api/supabase-status')
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        return res.json() as Promise<SupabaseStatusResponse>
      })
      .then((data) => {
        if (!cancelled) setState({ phase: 'done', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Fetch failed'
          setState({ phase: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const dotClass =
    state.phase === 'loading'
      ? 'status status-lg status-warning animate-pulse'
      : state.phase === 'error'
        ? 'status status-lg status-error'
        : state.data.connected
          ? 'status status-lg status-success animate-pulse'
          : 'status status-lg status-error'

  const badgeClass =
    state.phase === 'loading'
      ? 'badge badge-soft badge-xs badge-warning'
      : state.phase === 'error'
        ? 'badge badge-soft badge-xs badge-error'
        : state.data.connected
          ? 'badge badge-soft badge-xs badge-success'
          : 'badge badge-soft badge-xs badge-error'

  const badgeLabel =
    state.phase === 'loading'
      ? 'Checking...'
      : state.phase === 'error'
        ? 'Error'
        : state.data.connected
          ? 'Connected'
          : 'Disconnected'

  const envLabel =
    state.phase === 'done'
      ? state.data.environment === 'local'
        ? 'Local'
        : state.data.environment === 'remote'
          ? 'Remote'
          : 'Unknown'
      : '...'

  const displayUrl = state.phase === 'done' ? state.data.url : null
  const projectRef = state.phase === 'done' ? state.data.projectRef : undefined
  const region = state.phase === 'done' ? state.data.region : undefined

  const errorMsg =
    state.phase === 'error'
      ? state.message
      : state.phase === 'done' && !state.data.connected
        ? state.data.error
        : undefined

  return (
    <div className="card card-border card-sm bg-base-200 w-72 mt-6 text-left">
      <div className="card-body gap-2">
        <div className="flex items-center gap-2">
          <span className={dotClass} aria-hidden="true" />
          <h2 className="card-title text-sm">
            Supabase — {envLabel}
          </h2>
          <span className={`${badgeClass} ml-auto`}>{badgeLabel}</span>
        </div>

        {displayUrl && (
          <p className="text-xs font-mono opacity-70 break-all">{displayUrl}</p>
        )}

        {projectRef && (
          <p className="text-xs opacity-60">
            ref: <span className="font-mono">{projectRef}</span>
          </p>
        )}

        {region && (
          <p className="text-xs opacity-60">
            region: <span className="font-mono">{region}</span>
          </p>
        )}

        {state.phase === 'loading' && (
          <p className="text-xs opacity-50">Checking connection...</p>
        )}

        {errorMsg && (
          <p className="text-xs text-error mt-1 break-words">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}
