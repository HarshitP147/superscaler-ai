'use client'

import { useSyncExternalStore } from 'react'

const THEMES = ['nightgrass', 'pastelfish'] as const
type Theme = (typeof THEMES)[number]

const ICONS: Record<Theme, string> = {
  nightgrass: '🌾',
  pastelfish: '🐟',
}

const LABEL: Record<Theme, string> = {
  nightgrass: 'Nightgrass',
  pastelfish: 'Pastelfish',
}

const THEME_EVENT = 'superscaler:theme-change'

function readTheme(): Theme {
  const raw = localStorage.getItem('theme')
  return raw && (THEMES as readonly string[]).includes(raw) ? (raw as Theme) : 'nightgrass'
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(THEME_EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(THEME_EVENT, cb)
  }
}

function applyTheme(next: Theme) {
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
  window.dispatchEvent(new Event(THEME_EVENT))
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    readTheme,
    () => 'nightgrass',
  )

  const isPastel = theme === 'pastelfish'
  const flip = () => applyTheme(isPastel ? 'nightgrass' : 'pastelfish')

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={`Switch to ${isPastel ? 'Nightgrass' : 'Pastelfish'} theme`}
      className="flex items-center justify-between w-full px-3 py-2 rounded-field hover:bg-base-300 transition-colors"
    >
      <span className="flex items-center gap-2 text-sm">
        <span aria-hidden="true">{ICONS[theme]}</span>
        <span>{LABEL[theme]}</span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          isPastel ? 'bg-primary' : 'bg-base-300'
        }`}
        aria-hidden="true"
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-base-100 shadow transition-transform ${
            isPastel ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
