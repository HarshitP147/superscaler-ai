'use client'

import { useTheme } from '@/context/ThemeContext'

export function AppSettingsPanel() {
  const { theme, setTheme } = useTheme()

  const themes = ['nightgrass', 'forest', 'dark']

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">App</h2>
        <p className="text-muted-foreground">
          Manage your app settings and preferences.
        </p>
      </div>

      <div className="max-w-sm">
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Website Theme</span>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="select select-bordered w-full"
          >
            {themes.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
